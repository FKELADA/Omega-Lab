// Module 4, second part: transformer regulation (4.3), synchronous-machine models
// and controls (4.5), exponential and frequency-dependent loads (4.7).

import { cdiv, cmul, cx, polar, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import { rk4 } from '../core/ode';
import type { Model, Params, Run } from './types';

const deg = Math.PI / 180;

// ── 4.3 Transformer: on-load tap changer, phase shifter, vector groups ──────

/**
 * On-load tap changer: ±12 steps of 1.25 %, a 3 % drop in the transformer under load. The first
 * change waits Td; the next ones, while the voltage stays out of the band, wait T2.
 */
export const OLTC = { step: 0.0125, nMax: 12, drop: 0.03, tStep: 10, window: 180, Vset: 1, T2: 10 };

export const oltcLv = (Vhv: number, n: number) => Vhv * (1 + OLTC.step * n) - OLTC.drop;

/** The starting tap: the one that puts the LV voltage closest to its setpoint. */
export const OLTC_N0 = Math.round((OLTC.Vset + OLTC.drop - 1) / OLTC.step);

/** Two parallel paths between two buses; the phase shifter sits on path 1 (reactances in pu). */
export const PST = { X1: 0.25, X2: 0.35, P: 1, rating: 0.45 };

/** DC flow: the phase shift α (degrees) pushes power into path 1. */
export function pstFlows(alphaDeg: number) {
  const a = alphaDeg * deg;
  const P1 = (PST.P * PST.X2 + a) / (PST.X1 + PST.X2);
  return { P1, P2: PST.P - P1 };
}

export interface VectorGroup {
  name: string;
  /** Clock number: the LV voltage lags the HV voltage by h × 30°. */
  h: number;
  /** A zero-sequence path to earth through this side's winding. */
  earthHV: boolean;
  earthLV: boolean;
  /** A delta winding, where zero-sequence currents circulate. */
  delta: boolean;
}

export const GROUPS: VectorGroup[] = [
  { name: 'Yy0', h: 0, earthHV: false, earthLV: false, delta: false },
  { name: 'Dyn11', h: 11, earthHV: false, earthLV: true, delta: true },
  { name: 'YNd11', h: 11, earthHV: true, earthLV: false, delta: true },
  { name: 'Dyn5', h: 5, earthHV: false, earthLV: true, delta: true },
  { name: 'Yd1', h: 1, earthHV: false, earthLV: false, delta: true },
];

/** LV phase-a voltage for a HV phase-a voltage of 1∠0. */
export const lvPhasor = (g: VectorGroup, m = 1): Complex => polar(m, -g.h * 30 * deg);

export interface OltcInfo {
  tapEnd: number;
  ops: number;
  hunting: boolean;
  atLimit: boolean;
  vEnd: number;
  inBand: boolean;
  P1: number;
  P2: number;
  group: VectorGroup;
  shift: number; // degrees, LV relative to HV (negative = lag)
}

export function oltcRun(p: Params, n = 1801) {
  const t = linspace(0, OLTC.window, n);
  const dt = t[1] - t[0];
  const vhv = new Float64Array(n), vlv = new Float64Array(n), tap = new Float64Array(n), vset = new Float64Array(n);
  let N = OLTC_N0, timer = 0, ops = 0, flips = 0, lastDir = 0, run = false;
  const half = p.DB / 200;
  for (let k = 0; k < n; k++) {
    const V1 = t[k] < OLTC.tStep ? 1 : p.V1;
    let v = oltcLv(V1, N);
    const err = v - OLTC.Vset;
    if (Math.abs(err) > half + 1e-9) {
      timer += dt;
      const dir = err < 0 ? 1 : -1;
      if (timer >= (run ? OLTC.T2 : p.Td) - 1e-9 && Math.abs(N + dir) <= OLTC.nMax) {
        N += dir;
        ops++;
        if (lastDir && dir !== lastDir) flips++;
        lastDir = dir;
        timer = 0;
        run = true;
        v = oltcLv(V1, N);
      }
    } else {
      timer = 0;
      run = false;
    }
    vhv[k] = V1;
    vlv[k] = v;
    tap[k] = N;
    vset[k] = OLTC.Vset;
  }
  return { t, s: { vhv, vlv, tap, vset }, ops, flips, N };
}

export function oltcInfo(p: Params): OltcInfo {
  const r = oltcRun(p, 1801);
  const vEnd = r.s.vlv[r.s.vlv.length - 1];
  const inBand = Math.abs(vEnd - OLTC.Vset) <= p.DB / 200 + 1e-9;
  const g = GROUPS[Math.round(p.group)] ?? GROUPS[0];
  return {
    tapEnd: r.N,
    ops: r.ops,
    hunting: r.flips >= 3,
    atLimit: Math.abs(r.N) === OLTC.nMax && !inBand,
    vEnd,
    inBand,
    ...pstFlows(p.alpha),
    group: g,
    shift: -g.h * 30 <= -180 ? 360 - g.h * 30 : -g.h * 30,
  };
}

export const oltcModel: Model = {
  id: 'oltc',
  poles: () => [],
  window: () => OLTC.window,
  simulate(p, _tEnd, n = 1801): Run {
    const r = oltcRun(p, n);
    return { t: r.t, s: r.s };
  },
};

// ── 4.5 Synchronous machine: model hierarchy, AVR and governor ──────────────

/** Machine data (Kundur’s single-machine example; D stands in for the damper windings) and the two scenarios. */
export const SMD = { Xd: 1.81, Xq: 1.76, Xdp: 0.3, Td0: 8, H: 3.5, D: 2, P0: 0.8, Vt0: 1, Vinf: 1, TA: 0.05, Efd: [-4, 5], tF: 1, dF: 0.1, Vdip: 0.2, dXe: 0.15, Tg: 0.5, Dload: 1, tLoad: 1 };
export const SCEN = { load: 0, fault: 1 } as const;
export const ORDER = { classical: 2, oneAxis: 3 } as const;

const wb = 2 * Math.PI * 50;

/** Steady state on the infinite bus: rotor angle, E'q, field voltage, currents. */
export function smInit(Xe: number, order: number) {
  const { P0, Vt0, Vinf, Xdp } = SMD;
  const Xq = order === ORDER.classical ? Xdp : SMD.Xq;
  // Terminal angle against the infinite bus, then the current.
  const th = Math.asin((P0 * Xe) / (Vt0 * Vinf));
  const Vt = polar(Vt0, th);
  const I = cdiv({ re: Vt.re - Vinf, im: Vt.im }, cx(0, Xe));
  const EQ = { re: Vt.re - Xq * I.im, im: Vt.im + Xq * I.re };
  const delta = Math.atan2(EQ.im, EQ.re);
  // dq components (q axis along E_Q).
  const rot = polar(1, Math.PI / 2 - delta);
  const Idq = cmul(I, rot), Vdq = cmul(Vt, rot);
  const id = Idq.re, vq = Vdq.im;
  const Eqp = vq + Xdp * id;
  const Efd0 = Eqp + (SMD.Xd - Xdp) * id;
  return { delta, Eqp, Efd0, Xq };
}

/** Electrical output and terminal voltage for a rotor angle and E'q. */
export function smNetwork(delta: number, Eqp: number, V: number, Xe: number, Xq: number) {
  const { Xdp } = SMD;
  const id = (Eqp - V * Math.cos(delta)) / (Xdp + Xe);
  const iq = (V * Math.sin(delta)) / (Xq + Xe);
  const vd = Xq * iq, vq = Eqp - Xdp * id;
  return { id, iq, Pe: Eqp * iq + (Xq - Xdp) * id * iq, Vt: Math.hypot(vd, vq) };
}

export function smDynRun(p: Params, tEnd: number, n: number) {
  if (p.scen === SCEN.load) {
    // Islanded machine feeding its load: frequency, governor with droop R (%).
    const R = p.R / 100, { H, Tg, Dload, P0, tLoad } = SMD;
    const PL = (t: number) => P0 + (t >= tLoad ? p.dP : 0);
    const sol = rk4(
      (t, [dw, Pm]) => [(Pm - PL(t) * (1 + Dload * dw)) / (2 * H), (P0 - dw / R - Pm) / Tg],
      [0, P0],
      tEnd,
      n,
      2,
    );
    const N = sol.t.length;
    return {
      t: sol.t,
      s: {
        f: sol.x[0].map((w) => 50 * (1 + w)),
        Pm: sol.x[1],
        Pe: sol.x[0].map((w, k) => PL(sol.t[k]) * (1 + Dload * w)),
        Vt: new Float64Array(N).fill(1),
        delta: new Float64Array(N),
        Efd: new Float64Array(N),
      },
    };
  }
  // On the grid: a nearby three-phase fault (infinite-bus voltage dips) for 100 ms, cleared by
  // tripping a line: the reactance to the grid then grows by dXe.
  const order = p.order, Xe = p.Xe, KA = p.KA;
  const ini = smInit(Xe, order);
  const Vref = SMD.Vt0 + (KA > 0 ? ini.Efd0 / KA : 0);
  const V = (t: number) => (t >= SMD.tF && t < SMD.tF + SMD.dF ? SMD.Vdip : SMD.Vinf);
  const X = (t: number) => (t >= SMD.tF + SMD.dF ? Xe + SMD.dXe : Xe);
  const [lo, hi] = SMD.Efd;
  const rhs = (t: number, [d, w, Eqp, Efd]: number[]) => {
    const net = smNetwork(d, Eqp, V(t), X(t), ini.Xq);
    const dd = wb * w;
    const dw = (SMD.P0 - net.Pe - SMD.D * w) / (2 * SMD.H);
    if (order === ORDER.classical) return [dd, dw, 0, 0];
    const dE = (Efd - Eqp - (SMD.Xd - SMD.Xdp) * net.id) / SMD.Td0;
    let dF = 0;
    if (KA > 0) {
      dF = (KA * (Vref - net.Vt) - Efd) / SMD.TA;
      if ((Efd >= hi && dF > 0) || (Efd <= lo && dF < 0)) dF = 0;
    }
    return [dd, dw, dE, dF];
  };
  const sol = rk4(rhs, [ini.delta, 0, ini.Eqp, ini.Efd0], tEnd, n, 4);
  const N = sol.t.length;
  const Vt = new Float64Array(N), Pe = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const net = smNetwork(sol.x[0][k], sol.x[2][k], V(sol.t[k]), X(sol.t[k]), ini.Xq);
    Vt[k] = net.Vt;
    Pe[k] = net.Pe;
  }
  return {
    t: sol.t,
    s: {
      f: sol.x[1].map((w) => 50 * (1 + w)),
      Pm: new Float64Array(N).fill(SMD.P0),
      Pe,
      Vt,
      delta: sol.x[0].map((d) => d / deg),
      Efd: sol.x[3].map((e) => Math.min(hi, Math.max(lo, e))),
    },
  };
}

export const smDynWindow = (p: Params) => (p.scen === SCEN.load ? 20 : 10);

export interface SmDynInfo {
  /** Steady frequency after the load step (Hz). */
  fss: number;
  nadir: number;
  /** Rotor-angle swing amplitude in the last two seconds against the first second after the fault (ratio). */
  growth: number;
  growing: boolean;
  /** Mean terminal voltage over the last two seconds. */
  vEnd: number;
  /** Loss of synchronism (the rotor angle runs away). */
  lost: boolean;
  delta0: number;
  efd0: number;
}

export function smDynInfo(p: Params): SmDynInfo {
  const R = p.R / 100;
  const fss = 50 * (1 - p.dP / (SMD.Dload * (SMD.P0 + p.dP) + 1 / R));
  const ini = smInit(p.Xe, p.order);
  const base = { fss, delta0: ini.delta / deg, efd0: ini.Efd0 };
  if (p.scen === SCEN.load) {
    const r = smDynRun(p, smDynWindow(p), 801);
    return { ...base, nadir: Math.min(...r.s.f), growth: 0, growing: false, vEnd: 1, lost: false };
  }
  const T = smDynWindow(p);
  const r = smDynRun(p, T, 2001);
  const amp = (a: number, b: number) => {
    let mn = Infinity, mx = -Infinity;
    r.t.forEach((t, k) => {
      if (t >= a && t <= b) {
        mn = Math.min(mn, r.s.delta[k]);
        mx = Math.max(mx, r.s.delta[k]);
      }
    });
    return mx - mn;
  };
  const growth = amp(T - 2, T) / Math.max(1e-6, amp(SMD.tF + SMD.dF, SMD.tF + SMD.dF + 2));
  const last = [...r.s.Vt].filter((_, k) => r.t[k] >= T - 2);
  const vEnd = last.reduce((a, b) => a + b, 0) / last.length;
  const lost = r.s.delta.some((d) => !isFinite(d) || Math.abs(d) > 180);
  return { ...base, nadir: 50, growth: lost ? Infinity : growth, growing: lost || growth > 1.05, vEnd, lost };
}

export const smDynModel: Model = {
  id: 'sm-dyn',
  poles: () => [],
  window: smDynWindow,
  simulate: (p, tEnd, n = 2001) => smDynRun(p, tEnd, n),
};

// ── 4.7 Loads: exponential model and frequency dependence ────────────────────

export const EXPL = { tV: 2, tF: 7, window: 12, f0: 50, loss: 0.03, R: 0.05 };

/** P = P0 V^α (1 + Kpf Δf/f0), Q = Q0 V^β (1 + Kqf Δf/f0), Q0 = 0.4 P0. */
export const expP = (V: number, df: number, a: number, Kpf: number) => V ** a * (1 + (Kpf * df) / EXPL.f0);
export const expQ = (V: number, df: number, b: number) => 0.4 * V ** b * (1 - (2 * df) / EXPL.f0);

export interface ExpLoadInfo {
  pV: number; // P right after the voltage step
  qV: number;
  pF: number; // P after both steps
  /** α of the ZIP mix of lesson 4.6 (a_Z = 0.4, a_I = 0.3), by linearisation. */
  alphaZip: number;
  /** Steady frequency drop after losing 3 % of generation, without and with primary control (Hz). */
  dfNoGov: number;
  dfGov: number;
}

export function expLoadInfo(p: Params): ExpLoadInfo {
  const D = Math.max(1e-9, p.Kpf);
  return {
    pV: expP(p.V2, 0, p.alpha, p.Kpf),
    qV: expQ(p.V2, 0, p.beta),
    pF: expP(p.V2, p.df, p.alpha, p.Kpf),
    alphaZip: 2 * 0.4 + 0.3,
    dfNoGov: (-EXPL.f0 * EXPL.loss) / D,
    dfGov: (-EXPL.f0 * EXPL.loss) / (D + 1 / EXPL.R),
  };
}

export const expLoadModel: Model = {
  id: 'exp-load',
  poles: () => [],
  window: () => EXPL.window,
  simulate(p, tEnd, n = 1201): Run {
    const t = linspace(0, tEnd, n);
    const V = t.map((x) => (x < EXPL.tV ? 1 : p.V2));
    const f = t.map((x) => EXPL.f0 + (x < EXPL.tF ? 0 : p.df));
    return {
      t,
      s: {
        P: V.map((v, k) => expP(v, f[k] - EXPL.f0, p.alpha, p.Kpf)),
        Q: V.map((v, k) => expQ(v, f[k] - EXPL.f0, p.beta)),
        V,
        f,
      },
    };
  },
};
