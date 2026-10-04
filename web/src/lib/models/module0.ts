// Models for Module 0 (the hook): a day of supply and demand, and a blackout replay.

import { linspace } from '../core/lti';
import type { Model, Params, Run } from './types';

// ── 0.1 A day on the grid ─────────────────────────────────────────────────────
// Time in hours. Illustrative winter-weekday shape for a large European system
// (night trough, morning ramp, 19 h peak), not a measured curve.

export const demandAt = (t: number) =>
  60 + 7 * Math.exp(-(((t - 9) / 2.5) ** 2)) + 11 * Math.exp(-(((t - 19) / 2) ** 2)) - 8 * Math.exp(-(((t - 4) / 2.5) ** 2));
export const pvShape = (t: number) => (t > 7 && t < 19 ? Math.sin((Math.PI * (t - 7)) / 12) ** 1.5 : 0);
export const windShape = (t: number) => 1 + 0.3 * Math.sin((2 * Math.PI * t) / 24 + 1);

/** Flexible capacity (hydro, gas, storage, imports) available to follow demand, GW. */
export const FLEX_MAX = 25;

/** The transmission example: 1 GW over a 300 km three-phase line, 0.01 Ω/km per phase. */
export const LINE = { P: 1e9, km: 300, rPerKm: 0.01 };

export function lineLoss(kV: number) {
  const I = LINE.P / (Math.sqrt(3) * kV * 1e3);
  const loss = 3 * I * I * LINE.rPerKm * LINE.km;
  return { I, loss, share: loss / LINE.P };
}

export interface DayInfo {
  flexMin: number;
  flexMax: number;
  balanced: boolean; // 0 ≤ flexible ≤ FLEX_MAX all day
  peak: number;
  trough: number;
  energyPV: number; // GWh over the day
  line: ReturnType<typeof lineLoss>;
}

export const dayGrid: Model = {
  id: 'day-grid',
  poles: () => [],
  window: () => 24,
  simulate(p, tEnd, n = 481): Run {
    const t = linspace(0, tEnd, n);
    const demand = t.map(demandAt);
    const pv = t.map((tt) => p.pv * pvShape(tt));
    const wind = t.map((tt) => p.wind * windShape(tt));
    const base = new Float64Array(n).fill(p.base);
    const flex = demand.map((d, k) => d - pv[k] - wind[k] - p.base);
    return { t, s: { demand, pv, wind, base, flex } };
  },
};

export function dayInfo(p: Params): DayInfo {
  const run = dayGrid.simulate(p, 24);
  const flexMin = Math.min(...run.s.flex), flexMax = Math.max(...run.s.flex);
  const pvSum = run.s.pv.reduce((a, b) => a + b, 0) * (24 / (run.t.length - 1));
  return {
    flexMin,
    flexMax,
    balanced: flexMin >= 0 && flexMax <= FLEX_MAX,
    peak: Math.max(...run.s.demand),
    trough: Math.min(...run.s.demand),
    energyPV: pvSum,
    line: lineLoss(p.kV),
  };
}

// ── 0.2 A blackout replay: system frequency after losing generation ──────────
// One aggregated machine for the whole system (all generators swing together):
//   (2 H S / f0) dΔf/dt = P_reserve − P_lost + P_shed − k·L·Δf
// Primary reserve follows a first-order lag towards a droop target that is fully
// delivered at −0.5 Hz. Protection events fire once, when their condition is met.
// Inspired by GB, 9 August 2019, with rounded figures: it is a teaching model,
// not a reconstruction.

export const SYS = { f0: 50, S: 30_000, L: 30_000, kLoad: 0.02, rocofTrip: 0.125, embedded: 500, lfdd: 48.8, shedMW: 1000, tLoss: 1 };

export interface BlackoutEvent {
  t: number;
  kind: 'loss' | 'embedded' | 'lfdd';
  mw: number;
}

export interface BlackoutInfo {
  rocof0: number; // Hz/s, just after the loss
  nadir: number; // Hz
  tNadir: number;
  events: BlackoutEvent[];
  shed: boolean;
  energy: number; // stored kinetic energy H·S, MW·s
}

function runBlackout(p: Params, tEnd: number, n: number) {
  const { H, loss, reserve, Tg, rocofOn, lfddOn } = p;
  const dt = 0.002;
  const steps = Math.round(tEnd / dt);
  const every = steps / (n - 1);
  const t = linspace(0, tEnd, n);
  const f = new Float64Array(n), rocof = new Float64Array(n), pg = new Float64Array(n), lost = new Float64Array(n), shed = new Float64Array(n);
  let df = 0, Pg = 0, Plost = 0, Pshed = 0, slope = 0;
  const events: BlackoutEvent[] = [];
  let embeddedDone = false, lfddDone = false, lossDone = false;
  let next = 0;
  for (let s = 0; s <= steps; s++) {
    const tt = s * dt;
    if (!lossDone && tt >= SYS.tLoss) {
      Plost += loss;
      lossDone = true;
      events.push({ t: tt, kind: 'loss', mw: loss });
    }
    const target = Math.min(reserve, Math.max(0, (-df / 0.5) * reserve));
    const dPg = (target - Pg) / Tg;
    slope = (SYS.f0 / (2 * H * SYS.S)) * (Pg - Plost + Pshed - SYS.kLoad * SYS.L * df);
    if (rocofOn && !embeddedDone && lossDone && Math.abs(slope) > SYS.rocofTrip) {
      Plost += SYS.embedded;
      embeddedDone = true;
      events.push({ t: tt, kind: 'embedded', mw: SYS.embedded });
    }
    if (lfddOn && !lfddDone && SYS.f0 + df < SYS.lfdd) {
      Pshed += SYS.shedMW;
      lfddDone = true;
      events.push({ t: tt, kind: 'lfdd', mw: SYS.shedMW });
    }
    if (s >= next * every - 1e-9 && next < n) {
      f[next] = SYS.f0 + df;
      rocof[next] = slope;
      pg[next] = Pg;
      lost[next] = Plost;
      shed[next] = Pshed;
      next++;
    }
    df += slope * dt;
    Pg += dPg * dt;
  }
  return { t, s: { f, rocof, pg, lost, shed }, events };
}

export const blackout: Model = {
  id: 'blackout',
  poles: () => [],
  window: () => 60,
  simulate(p, tEnd, n = 1500): Run {
    const r = runBlackout(p, tEnd, n);
    return { t: r.t, s: r.s };
  },
};

export function blackoutInfo(p: Params): BlackoutInfo {
  const r = runBlackout(p, 60, 1500);
  let nadir = Infinity, tNadir = 0;
  r.s.f.forEach((v, k) => {
    if (v < nadir) {
      nadir = v;
      tNadir = r.t[k];
    }
  });
  return {
    rocof0: (SYS.f0 * p.loss) / (2 * p.H * SYS.S),
    nadir,
    tNadir,
    events: r.events,
    shed: r.events.some((e) => e.kind === 'lfdd'),
    energy: p.H * SYS.S,
  };
}
