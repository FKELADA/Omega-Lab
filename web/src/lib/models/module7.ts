// Module 7 — Inverter-based resources and HVDC. Averaged (dq) converter models
// on a Thevenin grid: grid-following control (current loop, PLL, outer loops),
// grid-forming (virtual synchronous machine with droop), PV with MPPT, a wind
// turbine with pitch and synthetic inertia, a battery for fast frequency
// response, an MMC phase leg, and a fault-ride-through test bench.
// Per unit on the converter rating unless stated; time in seconds.

import { cabs, cadd, cmul, cx, polar, type Complex } from '../core/linalg';
import { rk4 } from '../core/ode';
import type { Model, Params, Run } from './types';

const W0 = 2 * Math.PI * 50;
const deg = Math.PI / 180;
const conj = (z: Complex): Complex => ({ re: z.re, im: -z.im });
const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const scale = (z: Complex, k: number): Complex => ({ re: z.re * k, im: z.im * k });
const rot = (z: Complex, th: number): Complex => cmul(z, polar(1, th));

// ── Grid-following VSC (7.1, 7.2, and later 8.5) ─────────────────────────────

export const VSC = { Xf: 0.15, Rf: 0.005, tauV: 0.5e-3, Imax: 1.1, tP: 0.05, tQ: 0.25 };

export interface GflOptions {
  /** Grid voltage phasor angle (rad) at time t, relative to a 50 Hz frame. */
  thetaG?: (t: number) => number;
  /** Active and reactive setpoints at time t. */
  P?: (t: number) => number;
  Q?: (t: number) => number;
}

/**
 * States: i (grid frame, re/im), current-PI integrators (d, q), filtered PCC voltage
 * (re/im), PLL angle and integrator, filtered P and Q references.
 */
export function gflDeriv(p: Params, o: GflOptions) {
  const Xg = 1 / p.SCR, Rg = Xg / 10;
  const X = VSC.Xf + Xg, R = VSC.Rf + Rg;
  const wc = 2 * Math.PI * p.fc;
  const Kp = (wc * VSC.Xf) / W0, Ki = (Kp * wc) / 5; // integral corner a fifth of the bandwidth
  const wn = 2 * Math.PI * p.fpll, kpP = 2 * 0.7 * wn, kiP = wn * wn;
  const wo = 2 * Math.PI * p.fouter;
  const thG = o.thetaG ?? (() => 0);
  const Pset = o.P ?? ((t: number) => (t >= VSC.tP ? p.Pset : 0));
  const Qset = o.Q ?? ((t: number) => (t >= VSC.tQ ? p.Qset : 0));
  const out = (t: number, x: number[]) => {
    const [ir, ii, xd, xq, vr, vi, thp, xp, Pf, Qf] = x;
    const i = cx(ir, ii);
    const vg = polar(1, thG(t));
    const vf = cx(vr, vi);
    const vfp = rot(vf, -thp), ip = rot(i, -thp);
    const vd = Math.max(0.2, vfp.re);
    // Current references with a P-priority limiter.
    let idr = Pf / vd, iqr = -Qf / vd;
    if (Math.abs(idr) > VSC.Imax) idr = Math.sign(idr) * VSC.Imax;
    const qmax = Math.sqrt(Math.max(0, VSC.Imax ** 2 - idr * idr));
    if (Math.abs(iqr) > qmax) iqr = Math.sign(iqr) * qmax;
    const ed = idr - ip.re, eq = iqr - ip.im;
    const ep = cx(vfp.re - (VSC.Xf * ip.im) + Kp * ed + xd, vfp.im + VSC.Xf * ip.re + Kp * eq + xq);
    const e = rot(ep, thp);
    // (X/ω0) di/dt = e − vg − (R + jX) i, in a frame rotating at ω0.
    const didt = scale(sub(sub(e, vg), cmul(cx(R, X), i)), W0 / X);
    const v = cadd(cadd(vg, cmul(cx(Rg, Xg), i)), scale(didt, Xg / W0));
    const wp = kpP * vfp.im + xp;
    const S = cmul(v, conj(i));
    return { didt, v, ed, eq, vfp, wp, S, ip, idr, iqr };
  };
  const f = (t: number, x: number[]) => {
    const r = out(t, x);
    const [, , , , vr, vi, , , Pf, Qf] = x;
    return [
      r.didt.re,
      r.didt.im,
      Ki * r.ed,
      Ki * r.eq,
      (r.v.re - vr) / VSC.tauV,
      (r.v.im - vi) / VSC.tauV,
      r.wp,
      kiP * r.vfp.im,
      wo * (Pset(t) - Pf),
      wo * (Qset(t) - Qf),
    ];
  };
  return { f, out };
}

/** Steady state with no injection: zero current, PCC voltage = grid voltage, PLL locked. */
const gflX0 = (th0 = 0) => [0, 0, 0, 0, Math.cos(th0), Math.sin(th0), th0, 0, 0, 0];

export interface GflRun extends Run {
  diverged: boolean;
}

export function gflSimulate(p: Params, tEnd: number, n: number, o: GflOptions = {}, sub = 10): GflRun {
  const { f, out } = gflDeriv(p, o);
  const sol = rk4(f, gflX0((o.thetaG ?? (() => 0))(0)), tEnd, n, sub);
  const N = sol.t.length;
  const s = { P: new Float64Array(N), Q: new Float64Array(N), id: new Float64Array(N), idr: new Float64Array(N), iq: new Float64Array(N), fpll: new Float64Array(N), v: new Float64Array(N), Pset: new Float64Array(N) };
  let diverged = false;
  const Pset = o.P ?? ((t: number) => (t >= VSC.tP ? p.Pset : 0));
  for (let k = 0; k < N; k++) {
    const x = sol.x.map((a) => a[k]);
    if (!x.every(isFinite) || Math.abs(x[0]) > 20) {
      diverged = true;
      for (const a of Object.values(s)) a[k] = NaN;
      continue;
    }
    const r = out(sol.t[k], x);
    s.P[k] = r.S.re;
    s.Q[k] = r.S.im;
    s.id[k] = r.ip.re;
    s.idr[k] = r.idr;
    s.iq[k] = r.ip.im;
    s.fpll[k] = 50 + r.wp / (2 * Math.PI);
    s.v[k] = cabs(r.v);
    s.Pset[k] = Pset(sol.t[k]);
  }
  // Sustained oscillation counts as instability too.
  const tail = Array.from(s.P).slice(Math.floor(N * 0.8)).filter(isFinite);
  if (tail.length && Math.max(...tail) - Math.min(...tail) > 0.3) diverged = true;
  return { t: sol.t, s, diverged };
}

export interface VscInfo {
  riseP: number; // 10–90 % rise time of P after its step (s)
  overshootP: number; // %
  couplingQ: number; // largest |Q| excursion during the P step, before the Q step
  Pend: number;
  Qend: number;
  limited: boolean;
  unstable: boolean;
}

export function vscInfo(p: Params): VscInfo {
  const r = gflSimulate(p, 0.5, 2500);
  const t = r.t, P = r.s.P, Q = r.s.Q;
  const target = Math.min(p.Pset, VSC.Imax);
  let t10 = NaN, t90 = NaN, peak = 0, coupling = 0;
  for (let k = 0; k < t.length; k++) {
    if (t[k] < VSC.tP) continue;
    if (t[k] < VSC.tQ) {
      coupling = Math.max(coupling, Math.abs(Q[k]));
      peak = Math.max(peak, P[k]);
    }
    if (isNaN(t10) && P[k] >= 0.1 * target) t10 = t[k];
    if (isNaN(t90) && P[k] >= 0.9 * target) t90 = t[k];
  }
  const last = t.length - 1;
  const Iend = Math.hypot(r.s.id[last], r.s.iq[last]);
  return {
    riseP: t90 - t10,
    overshootP: target > 0 ? Math.max(0, (100 * (peak - target)) / target) : 0,
    couplingQ: coupling,
    Pend: P[last],
    Qend: Q[last],
    limited: Iend > VSC.Imax - 0.02,
    unstable: r.diverged,
  };
}

export const vscModel: Model = {
  id: 'vsc',
  poles: () => [],
  window: () => 0.5,
  simulate(p, tEnd, n = 2500): Run {
    return gflSimulate(p, tEnd, n);
  },
};

// ── Grid-forming: a virtual synchronous machine with droop (7.2) ─────────────

export const GFM = { E: 1.02, Xv: 0.15, P0: 0.5, droop: 0.05, Dd: 40 };

export const GRID_EVENTS = { phase: 0, rocof: 1 } as const;

/** Grid angle (relative to 50 Hz) and frequency for the 7.2 events. */
export function gridEvent(event: number, t: number): { th: number; f: number } {
  const t0 = 0.1;
  if (event === GRID_EVENTS.phase) return { th: t >= t0 ? -20 * deg : 0, f: 50 }; // the angle falls back, as after losing generation
  if (event === GRID_EVENTS.rocof) {
    // −1 Hz/s for 0.5 s, then steady at 49.5 Hz.
    const dt = Math.min(Math.max(t - t0, 0), 0.5);
    const th = 2 * Math.PI * (-(dt * dt) / 2 - Math.max(0, t - t0 - 0.5) * 0.5);
    return { th, f: 50 - dt };
  }
  return { th: 0, f: 50 };
}

export function gfmSimulate(p: Params, tEnd: number, n: number) {
  const ev = p.event;
  const Xg = 1 / p.SCR;
  const X = GFM.Xv + Xg;
  const Dp = 1 / GFM.droop;
  // States: δ (rad, relative to 50 Hz), ω (pu), filtered power (measurement, 5 ms).
  const Pof = (t: number, d: number) => (GFM.E * Math.sin(d - gridEvent(ev, t).th)) / X;
  const P0 = GFM.P0;
  const d0 = Math.asin((P0 * X) / GFM.E);
  const H = Math.max(0.05, p.H);
  const sol = rk4(
    // Droop on the frequency deviation, plus VSM damping against the grid frequency.
    (t, [d, w, Pm]) => [W0 * (w - 1), (P0 - Pm - Dp * (w - 1) - GFM.Dd * (w - gridEvent(ev, t).f / 50)) / (2 * H), (Pof(t, d) - Pm) / 0.005],
    [d0, 1, P0],
    tEnd,
    n,
    10,
  );
  const P = sol.t.map((t, k) => Pof(t, sol.x[0][k]));
  return { t: sol.t, P, f: sol.x[1].map((w) => 50 * w) };
}

export interface GflGfmInfo {
  /** Peak power change after the event (50 ms for a phase jump, over the ramp for RoCoF). */
  dPgfl: number;
  dPgfm: number;
  gflUnstable: boolean;
  /** Steady power change at the end (frequency support). */
  dPgfmEnd: number;
  dPgflEnd: number;
}

function gflGfmRuns(p: Params, tEnd = 1, n = 2000) {
  const gfl = gflSimulate({ ...p, fc: 400, fouter: 10, Pset: GFM.P0, Qset: 0 }, tEnd, n, {
    thetaG: (t) => gridEvent(p.event, t).th,
    P: () => GFM.P0,
    Q: () => 0,
  }, 8);
  const gfm = gfmSimulate(p, tEnd, n);
  return { gfl, gfm };
}

const ggCache = new Map<string, ReturnType<typeof gflGfmRuns>>();
function gg(p: Params) {
  const key = JSON.stringify([p.event, p.SCR, p.H, p.fpll]);
  let r = ggCache.get(key);
  if (!r) {
    if (ggCache.size > 40) ggCache.clear();
    // The GFL starts from zero current; give it 0.2 s to reach its setpoint first.
    r = gflGfmRuns(p);
    ggCache.set(key, r);
  }
  return r;
}

export function gflGfmInfo(p: Params): GflGfmInfo {
  const { gfl, gfm } = gg(p);
  const t = gfl.t;
  const k0 = t.findIndex((x) => x >= 0.1);
  // A phase jump acts at once; a frequency ramp builds up over the whole ramp.
  const k1 = t.findIndex((x) => x >= (p.event === GRID_EVENTS.phase ? 0.15 : 0.6));
  const ref = (a: ArrayLike<number>) => a[k0 - 1];
  let dl = 0, dm = 0;
  for (let k = k0; k <= k1; k++) {
    dl = Math.max(dl, Math.abs(gfl.s.P[k] - ref(gfl.s.P)) || 0);
    dm = Math.max(dm, Math.abs(gfm.P[k] - ref(gfm.P)));
  }
  const last = t.length - 1;
  return {
    dPgfl: dl,
    dPgfm: dm,
    gflUnstable: gfl.diverged,
    dPgfmEnd: gfm.P[last] - ref(gfm.P),
    dPgflEnd: (gfl.s.P[last] || 0) - ref(gfl.s.P),
  };
}

export const gflGfmModel: Model = {
  id: 'gfl-gfm',
  poles: () => [],
  window: () => 1,
  simulate(p): Run {
    const { gfl, gfm } = gg(p);
    return {
      t: gfl.t,
      s: {
        pGfl: gfl.s.P,
        pGfm: Float64Array.from(gfm.P),
        fGfl: gfl.s.fpll,
        fGfm: Float64Array.from(gfm.f),
        fGrid: gfl.t.map((t) => gridEvent(p.event, t).f),
      },
    };
  },
};

