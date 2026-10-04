// Module 5 — the network in steady state. A shared four-bus meshed network
// (5.1 power flow, 5.2 P–V/Q–V), a radial system for faults (5.3), economic
// dispatch on a three-bus DC network (5.4), and a distribution feeder with PV
// over a day (5.5).

import { cabs, cadd, cdiv, cmul, cx, polar, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import { dcFlow, gaussSeidel, newtonRaphson, ybus, type Branch, type BranchFlow, type Bus, type CMat, type FlowIter, type PfResult } from '../core/powerflow';
import type { Model, Params, Run } from './types';

const deg = Math.PI / 180;
const W50 = 2 * Math.PI * 50;

// ── The four-bus network (100 MVA base) ──────────────────────────────────────
// 1 slack generator, 2 PV generator, 3 and 4 loads; five lines, meshed.

export const NET = {
  names: ['1', '2', '3', '4'],
  V1: 1.02,
  load3: 1.2,
  load4: 1.0,
  lines: [
    { from: 0, to: 1, r: 0.01, x: 0.08, b: 0.04 },
    { from: 0, to: 2, r: 0.02, x: 0.12, b: 0.03 },
    { from: 1, to: 2, r: 0.015, x: 0.1, b: 0.03 },
    { from: 1, to: 3, r: 0.02, x: 0.14, b: 0.03 },
    { from: 2, to: 3, r: 0.02, x: 0.12, b: 0.02 },
  ] as Branch[],
};

/** Line labels "1–3" etc., in the order of NET.lines. */
export const lineName = (k: number) => `${NET.lines[k].from + 1}–${NET.lines[k].to + 1}`;

/** Outage choice → index into NET.lines (0 = none). */
export const OUTAGES = [-1, 1, 3, 4];

export function network(p: Params, lambda = p.lambda ?? 1): { buses: Bus[]; branches: Branch[] } {
  const tanphi = Math.tan(Math.acos(p.pf ?? 0.95));
  const buses: Bus[] = [
    { name: '1', type: 'slack', V: NET.V1, Pg: 0, Pd: 0, Qd: 0 },
    { name: '2', type: 'pv', V: p.V2 ?? 1.01, Pg: p.P2 ?? 0.8, Pd: 0, Qd: 0, Qmin: -0.5, Qmax: p.Q2max ?? 9 },
    { name: '3', type: 'pq', V: 1, Pg: 0, Pd: NET.load3 * lambda, Qd: NET.load3 * lambda * tanphi },
    { name: '4', type: 'pq', V: 1, Pg: 0, Pd: NET.load4 * lambda, Qd: NET.load4 * lambda * tanphi, Bsh: p.B4 ?? 0 },
  ];
  const out = OUTAGES[p.out ?? 0];
  const branches = NET.lines.map((l, k) => ({ ...l, on: k !== out }));
  return { buses, branches };
}

// ── 5.1 Y-bus and Newton–Raphson ─────────────────────────────────────────────

export interface PflowInfo {
  nr: PfResult;
  gs: FlowIter[];
  Y: CMat;
  /** DC power flow for comparison: line flows (pu). */
  dc: number[];
  /** Iterations to converge (NaN when diverged). */
  nrIts: number;
  gsIts: number;
}

export function pflowInfo(p: Params): PflowInfo {
  const { buses, branches } = network(p);
  const nr = newtonRaphson(buses, branches, { maxIt: 12 });
  const gs = gaussSeidel(buses, branches, 150);
  const dc = dcFlow(4, 0, branches, buses.map((b, i) => (i === 0 ? 0 : b.Pg - b.Pd))).flows;
  const gsLast = gs[gs.length - 1];
  return {
    nr,
    gs,
    Y: ybus(buses, branches),
    dc,
    nrIts: nr.converged ? nr.iterations : NaN,
    gsIts: gsLast.mismatch < 1e-8 ? gs.length - 1 : NaN,
  };
}

export const NR_WINDOW = 8;

/** One sample per 1/50 of an iteration: the values hold between iterates. */
export const pflow: Model = {
  id: 'pflow',
  poles: () => [],
  window: () => NR_WINDOW,
  simulate(p, tEnd, n = 401): Run {
    const { nr } = pflowInfo(p);
    const t = linspace(0, tEnd, n);
    const at = (tt: number) => nr.history[Math.min(nr.history.length - 1, Math.floor(tt + 1e-9))];
    const s = (f: (h: FlowIter) => number) => t.map((tt) => f(at(tt)));
    return {
      t,
      s: {
        v3: s((h) => h.V[2]),
        v4: s((h) => h.V[3]),
        th3: s((h) => h.th[2] / deg),
        th4: s((h) => h.th[3] / deg),
        err: s((h) => Math.log10(Math.max(1e-16, h.mismatch))),
      },
    };
  },
};

/** The NR iterate shown at the cursor. */
export const iterateAt = (info: PflowInfo, t: number) => info.nr.history[Math.min(info.nr.history.length - 1, Math.floor(t + 1e-9))];

// ── 5.2 P–V and Q–V curves ───────────────────────────────────────────────────

export const PV_LMAX = 3.5;

export interface PvPoint {
  lambda: number;
  ok: boolean;
  V: number[];
  th: number[];
  flows: BranchFlow[];
  Qg: number[];
  Qg2: number;
  limited: boolean;
  losses: number;
}

export interface PvInfo {
  pts: PvPoint[];
  /** Last loading with a solution (λ multiplies both loads). */
  lambdaMax: number;
  /** Loading at which generator 2 reaches its reactive limit (null if never). */
  lambdaQlim: number | null;
}

/** Continuation: raise λ in small steps, warm-starting each power flow from the last. */
export function pvInfo(p: Params, dl = 0.01): PvInfo {
  const pts: PvPoint[] = [];
  let start: { V: number[]; th: number[] } | undefined;
  let lambdaMax = 0, lambdaQlim: number | null = null, failed = false;
  for (let lam = 0; lam <= PV_LMAX + 1e-9; lam += dl) {
    if (!failed) {
      const { buses, branches } = network(p, lam);
      const r = newtonRaphson(buses, branches, { start, maxIt: 20 });
      // A solution far from the last one is the lower branch: treat it as the nose.
      const jump = start && r.converged ? Math.abs(r.V[3] - start.V[3]) > 0.12 : false;
      if (r.converged && !jump && r.V[3] > 0.3) {
        start = { V: r.V, th: r.th };
        lambdaMax = lam;
        if (r.qLimited[1] && lambdaQlim === null) lambdaQlim = lam;
        pts.push({ lambda: lam, ok: true, V: r.V, th: r.th, flows: r.flows, Qg: r.Qg, Qg2: r.Qg[1], limited: r.qLimited[1], losses: r.losses });
        continue;
      }
      failed = true;
    }
    pts.push({ lambda: lam, ok: false, V: [NaN, NaN, NaN, NaN], th: [NaN, NaN, NaN, NaN], flows: [], Qg: [NaN, NaN, NaN, NaN], Qg2: NaN, limited: false, losses: NaN });
  }
  return { pts, lambdaMax, lambdaQlim };
}

/** Operating point at loading λ (the nearest continuation point). */
export const pvAt = (info: PvInfo, lam: number) => info.pts[Math.max(0, Math.min(info.pts.length - 1, Math.round(lam / PV_LMAX * (info.pts.length - 1))))];

/**
 * Q–V curve at bus 4: a fictitious synchronous condenser holds V4, and we record the
 * reactive power it must inject. The operating point is where it injects nothing;
 * the depth of the minimum below zero is the reactive margin.
 */
export function qvCurve(p: Params, lambda: number): { pts: [number, number][]; margin: number | null } {
  const pts: [number, number][] = [];
  let start: { V: number[]; th: number[] } | undefined;
  for (let V4 = 1.15; V4 >= 0.4; V4 -= 0.01) {
    const { buses, branches } = network(p, lambda);
    buses[3] = { ...buses[3], type: 'pv', V: V4 };
    const r = newtonRaphson(buses, branches, { start, maxIt: 20 });
    if (!r.converged) continue;
    start = { V: r.V, th: r.th };
    pts.push([V4, r.Qg[3]]);
  }
  if (!pts.length) return { pts, margin: null };
  const qmin = Math.min(...pts.map(([, q]) => q));
  return { pts, margin: -qmin };
}

const qvCache = new Map<string, ReturnType<typeof qvCurve>>();

/** Q–V curve at the loading under the cursor, quantised to 0.05 and cached (it runs ~75 power flows). */
export function qvAt(p: Params, lambda: number) {
  const lam = Math.round(lambda * 20) / 20;
  const key = JSON.stringify([p.pf, p.Q2max, p.B4, p.out, lam]);
  let r = qvCache.get(key);
  if (!r) {
    if (qvCache.size > 400) qvCache.clear();
    r = qvCurve(p, lam);
    qvCache.set(key, r);
  }
  return { ...r, lambda: lam };
}

export interface PvLessonInfo extends PvInfo {
  /** Nose without the shunt capacitor, for comparison. */
  lambdaMaxNoCap: number;
  /** Nose without generator reactive limits. */
  lambdaMaxNoLim: number;
}

export function pvLessonInfo(p: Params): PvLessonInfo {
  const k = pvInfo(p);
  return {
    ...k,
    lambdaMaxNoCap: p.B4 > 0 ? pvInfo({ ...p, B4: 0 }).lambdaMax : k.lambdaMax,
    lambdaMaxNoLim: k.lambdaQlim !== null ? pvInfo({ ...p, Q2max: 99 }).lambdaMax : k.lambdaMax,
  };
}

export const pvModel: Model = {
  id: 'pv-curve',
  poles: () => [],
  window: () => PV_LMAX,
  simulate(p, tEnd, n = 301): Run {
    const info = pvInfo(p, tEnd / (n - 1));
    const t = Float64Array.from(info.pts.map((q) => q.lambda));
    const s = (f: (q: PvPoint) => number) => Float64Array.from(info.pts.map(f));
    return {
      t,
      s: {
        v2: s((q) => q.V[1]),
        v3: s((q) => q.V[2]),
        v4: s((q) => q.V[3]),
        q2: s((q) => q.Qg2),
        q2max: s(() => p.Q2max),
      },
    };
  },
};

// ── 5.3 Faults ───────────────────────────────────────────────────────────────
// Generator (X″d) → Δ/Yg step-up transformer → line → fault at a fraction m of
// the line (100 km, 225 kV). Pre-fault: E = 1 pu, a load current of 0.5 pu at cos φ = 0.9.

export const FAULT = {
  Xg1: 0.2,
  Xg2: 0.2,
  Xt: 0.1,
  Z1L: cx(0.03, 0.3),
  Z0L: cx(0.09, 0.9),
  Rn: 0.5, // neutral resistance (pu) for resistance grounding
  tFault: 0.04,
  Sbase: 100, // MVA
  Ipre: 0.5,
  lineKm: 100,
  kV: 225,
};

export const FAULT_TYPES = { tph: 0, slg: 1, ll: 2, llg: 3 } as const;
export const GROUNDING = { solid: 0, resistance: 1, isolated: 2 } as const;

const A = polar(1, 120 * deg), A2 = polar(1, -120 * deg);

export interface FaultInfo {
  Z1: Complex;
  Z2: Complex;
  Z0: Complex | null;
  I012: [Complex, Complex, Complex];
  Iabc: [Complex, Complex, Complex];
  Vabc: [Complex, Complex, Complex];
  /** Three-phase fault current and level at this point. */
  I3ph: number;
  Ssc: number; // MVA
  /** Magnitude of the largest phase current. */
  Imax: number;
  XR: number;
}

export function seqImpedances(p: Params) {
  const m = p.km / FAULT.lineKm;
  const Z1 = cadd(cx(0, FAULT.Xg1 + FAULT.Xt), cmul(cx(m), FAULT.Z1L));
  const Z2 = cadd(cx(0, FAULT.Xg2 + FAULT.Xt), cmul(cx(m), FAULT.Z1L));
  // Zero sequence: the generator side of the Δ is isolated; the Yg neutral is the only path.
  const Z0 =
    p.ground === GROUNDING.isolated ? null : cadd(cx(p.ground === GROUNDING.resistance ? 3 * FAULT.Rn : 0, FAULT.Xt), cmul(cx(m), FAULT.Z0L));
  return { Z1, Z2, Z0 };
}

export function faultInfo(p: Params): FaultInfo {
  const { Z1, Z2, Z0 } = seqImpedances(p);
  const Zf = cx(p.Rf);
  const E = cx(1);
  const zero = cx(0);
  let I1 = zero, I2 = zero, I0 = zero;
  const big = (z: Complex | null) => z ?? cx(0, 1e9);
  const Z0e = big(Z0);
  switch (p.type) {
    case FAULT_TYPES.tph:
      I1 = cdiv(E, cadd(Z1, Zf));
      break;
    case FAULT_TYPES.slg:
      I1 = cdiv(E, cadd(cadd(Z1, Z2), cadd(Z0e, cmul(cx(3), Zf))));
      I2 = I1;
      I0 = I1;
      break;
    case FAULT_TYPES.ll:
      I1 = cdiv(E, cadd(cadd(Z1, Z2), Zf));
      I2 = cmul(cx(-1), I1);
      break;
    default: {
      const Z0f = cadd(Z0e, cmul(cx(3), Zf));
      const par = cdiv(cmul(Z2, Z0f), cadd(Z2, Z0f));
      I1 = cdiv(E, cadd(Z1, par));
      I2 = cmul(cx(-1), cdiv(cmul(I1, Z0f), cadd(Z2, Z0f)));
      I0 = cmul(cx(-1), cdiv(cmul(I1, Z2), cadd(Z2, Z0f)));
    }
  }
  const abc = (x0: Complex, x1: Complex, x2: Complex): [Complex, Complex, Complex] => [
    cadd(cadd(x0, x1), x2),
    cadd(cadd(x0, cmul(A2, x1)), cmul(A, x2)),
    cadd(cadd(x0, cmul(A, x1)), cmul(A2, x2)),
  ];
  const V1 = cadd(E, cmul(cx(-1), cmul(Z1, I1)));
  const V2 = cmul(cx(-1), cmul(Z2, I2));
  const V0 = cmul(cx(-1), cmul(Z0e, I0));
  const Iabc = abc(I0, I1, I2);
  return {
    Z1,
    Z2,
    Z0,
    I012: [I0, I1, I2],
    Iabc,
    Vabc: abc(V0, V1, V2),
    I3ph: 1 / cabs(Z1),
    Ssc: FAULT.Sbase / cabs(Z1),
    Imax: Math.max(...Iabc.map(cabs)),
    XR: Z1.im / Math.max(1e-6, Z1.re),
  };
}

export const faultModel: Model = {
  id: 'fault',
  poles: () => [],
  window: () => 0.12,
  simulate(p, tEnd, n = 2400): Run {
    const k = faultInfo(p);
    const t = linspace(0, tEnd, n);
    const tf = FAULT.tFault;
    const tau = k.XR / W50;
    const pre = [0, -120, 120].map((a) => polar(FAULT.Ipre, (a - 25.8) * deg)); // cos φ = 0.9 lagging
    const inst = (I: Complex, tt: number) => Math.SQRT2 * (I.re * Math.cos(W50 * tt) - I.im * Math.sin(W50 * tt));
    const cur = (j: number) => {
      const jump = inst(pre[j], tf) - inst(k.Iabc[j], tf); // DC offset keeps the current continuous
      return t.map((tt) => (tt < tf ? inst(pre[j], tt) : inst(k.Iabc[j], tt) + jump * Math.exp(-(tt - tf) / tau)));
    };
    const vol = (j: number) => {
      const Vpre = polar(1, [0, -120, 120][j] * deg);
      return t.map((tt) => inst(tt < tf ? Vpre : k.Vabc[j], tt));
    };
    return { t, s: { ia: cur(0), ib: cur(1), ic: cur(2), va: vol(0), vb: vol(1), vc: vol(2) } };
  },
};

/** Largest phase current against fault location, for one fault type. */
export const faultSweep = (p: Params, type: number): [number, number][] =>
  Array.from({ length: 41 }, (_, j) => {
    const km = (j / 40) * FAULT.lineKm;
    return [km, faultInfo({ ...p, type, km }).Imax] as [number, number];
  });

// ── 5.4 Economic dispatch on a three-bus DC network ──────────────────────────
// Incremental cost MC = b + 2cP (€/MWh). G1 and solar at bus 1, G2 at bus 2,
// G3 and the load at bus 3. Equal line reactances; line 1–3 has a limit.

export interface Unit {
  name: string;
  bus: number;
  b: number;
  c: number;
  Pmax: number;
}

export const UNITS: Unit[] = [
  { name: 'G1', bus: 0, b: 20, c: 0.02, Pmax: 600 },
  { name: 'G2', bus: 1, b: 40, c: 0.05, Pmax: 400 },
  { name: 'G3', bus: 2, b: 70, c: 0.06, Pmax: 250 },
];

/** Line 1–3 flow per MW injected at each bus and withdrawn at bus 3 (equal reactances). */
export const PTDF13 = [2 / 3, 1 / 3, 0];

export const loadProfile = (h: number, peak: number) => {
  // Night trough, morning rise, evening peak at 19 h.
  const x = 0.62 + 0.18 * Math.exp(-(((h - 11) / 3.5) ** 2)) + 0.38 * Math.exp(-(((h - 19) / 2.2) ** 2));
  return peak * Math.min(1, x);
};
export const solarProfile = (h: number, cap: number) => (h > 6 && h < 20 ? cap * Math.sin((Math.PI * (h - 6)) / 14) ** 2 : 0);

export interface DispatchUnit {
  name: string;
  P: number;
  mc: number;
  bus: number;
  Pmax: number;
}

export interface DispatchResult {
  units: DispatchUnit[]; // G1, G2, G3, solar
  lambda: number; // price at bus 3 (€/MWh)
  mu: number; // shadow price of line 1–3
  lmp: number[];
  flows: number[]; // 1–2, 2–3, 1–3 (MW)
  congested: boolean;
  curtailed: number;
  cost: number; // €/h
  shed: number; // MW not served
}

const gasScale = (p: Params) => p.gas ?? 1;

/** Units with their incremental-cost parameters, gas price applied to G2 and G3. */
export function dispatchUnits(p: Params, solar: number): (Unit & { Pmin: number })[] {
  return [
    { ...UNITS[0], Pmin: 0 },
    { ...UNITS[1], b: UNITS[1].b * gasScale(p), c: UNITS[1].c * gasScale(p), Pmin: 0 },
    { ...UNITS[2], b: UNITS[2].b * gasScale(p), c: UNITS[2].c * gasScale(p), Pmin: 0 },
    { name: 'PV', bus: 0, b: 0, c: 0.0005, Pmax: solar, Pmin: 0 },
  ];
}

/**
 * Minimum-cost dispatch: each unit runs where its incremental cost equals its nodal
 * price λ − μ·PTDF (clipped to its limits). λ balances the load; μ ≥ 0 is raised
 * until line 1–3 is within its limit.
 */
export function dispatch(p: Params, D: number, solar: number): DispatchResult {
  const us = dispatchUnits(p, solar);
  const Pat = (lam: number, mu: number) => us.map((u) => Math.max(u.Pmin, Math.min(u.Pmax, (lam - mu * PTDF13[u.bus] - u.b) / (2 * u.c))));
  const total = (P: number[]) => P.reduce((a, b) => a + b, 0);
  const capacity = total(us.map((u) => u.Pmax));
  const balance = (mu: number) => {
    let lo = -500, hi = 3000;
    for (let k = 0; k < 80; k++) {
      const mid = (lo + hi) / 2;
      if (total(Pat(mid, mu)) < Math.min(D, capacity)) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const flow13 = (P: number[]) => us.reduce((s, u, j) => s + PTDF13[u.bus] * P[j], 0) - 0; // load at bus 3
  let mu = 0, lam = balance(0), P = Pat(lam, 0);
  if (flow13(P) > p.Fmax) {
    let lo = 0, hi = 5000;
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2;
      const l = balance(mid);
      if (flow13(Pat(l, mid)) > p.Fmax) lo = mid;
      else hi = mid;
    }
    mu = hi;
    lam = balance(mu);
    P = Pat(lam, mu);
  }
  const inj = [0, 0, 0];
  us.forEach((u, j) => (inj[u.bus] += P[j]));
  inj[2] -= Math.min(D, total(P));
  const lines: Branch[] = [
    { from: 0, to: 1, r: 0, x: 0.1 },
    { from: 1, to: 2, r: 0, x: 0.1 },
    { from: 0, to: 2, r: 0, x: 0.1 },
  ];
  const flows = dcFlow(3, 2, lines, inj).flows;
  const lmp = PTDF13.map((f) => lam - mu * f);
  return {
    units: us.map((u, j) => ({ name: u.name, P: P[j], mc: u.b + 2 * u.c * P[j], bus: u.bus, Pmax: u.Pmax })),
    lambda: lam,
    mu,
    lmp,
    flows,
    congested: mu > 1e-6,
    curtailed: solar - P[3],
    cost: us.reduce((s, u, j) => s + u.b * P[j] + u.c * P[j] * P[j], 0),
    shed: Math.max(0, D - total(P)),
  };
}

export interface DayInfo {
  hours: DispatchResult[]; // hourly, 0…24
  congestedHours: number;
  peakPrice: number;
  minPrice: number;
  dailyCost: number;
}

export function dispatchInfo(p: Params): DayInfo {
  const hours = Array.from({ length: 25 }, (_, h) => dispatch(p, loadProfile(h, p.peak), solarProfile(h, p.solar)));
  return {
    hours,
    congestedHours: hours.slice(0, 24).filter((r) => r.congested).length,
    peakPrice: Math.max(...hours.map((r) => r.lambda)),
    minPrice: Math.min(...hours.map((r) => r.lambda)),
    dailyCost: hours.slice(0, 24).reduce((s, r) => s + r.cost, 0),
  };
}

export const dispatchModel: Model = {
  id: 'dispatch',
  poles: () => [],
  window: () => 24,
  simulate(p, tEnd, n = 241): Run {
    const t = linspace(0, tEnd, n);
    const r = Array.from(t, (h) => dispatch(p, loadProfile(h, p.peak), solarProfile(h, p.solar)));
    const s = (f: (x: DispatchResult) => number) => Float64Array.from(r.map(f));
    return {
      t,
      s: {
        price: s((x) => x.lambda),
        lmp1: s((x) => x.lmp[0]),
        load: Float64Array.from(t, (h) => loadProfile(h, p.peak)),
        g1: s((x) => x.units[0].P),
        g2: s((x) => x.units[1].P),
        g3: s((x) => x.units[2].P),
        pv: s((x) => x.units[3].P),
        f13: s((x) => x.flows[2]),
      },
    };
  },
};

// ── 5.5 A day on a distribution feeder with PV ───────────────────────────────
// 20 kV, 10 MVA base. Substation (on-load tap changer) then five sections of
// overhead line; at each node a 1 MW load and a PV plant.

export const FEEDER = {
  nodes: 5,
  Zsec: { overhead: cx(0.015, 0.0175), cable: cx(0.012, 0.006) },
  load: 0.2, // pu per node
  pfLoad: 0.95,
  Vmax: 1.05, // planning limit used here (EN 50160 allows ±10 %)
  qvSlope: 0.44 / 0.05, // Q(V): full 0.44 pu/MW absorption 5 % above 1.0
};

export const CONTROLS = { none: 0, cosphi: 1, qv: 2, curtail: 3 } as const;

export interface FeederState {
  V: number[]; // substation + nodes
  Psub: number; // MW into the feeder (negative = reverse flow)
  Ppv: number; // MW produced
  Qpv: number; // Mvar absorbed by PV (positive = absorbing)
  curtailed: number; // MW
  losses: number; // MW
  /** Active power along each section, MW (negative = towards the substation). */
  flows: number[];
}

const feederLoad = (h: number) => 0.55 + 0.25 * Math.exp(-(((h - 12) / 4) ** 2)) + 0.45 * Math.exp(-(((h - 19.5) / 2) ** 2));

/** Feeder power flow at one instant: PV per node (pu), load scale, controller. */
export function feederFlow(p: Params, pvPu: number, loadScale: number): FeederState {
  const n = FEEDER.nodes;
  const Z = p.cable === 1 ? FEEDER.Zsec.cable : FEEDER.Zsec.overhead;
  const tl = Math.tan(Math.acos(FEEDER.pfLoad));
  const Pl = FEEDER.load * loadScale;
  let Ppv = new Array(n).fill(pvPu);
  let Qpv = new Array(n).fill(0);
  const branches: Branch[] = Array.from({ length: n }, (_, j) => ({ from: j, to: j + 1, r: Z.re, x: Z.im }));
  let r: PfResult | null = null;
  // Fixed-point on the local controllers (a few passes are enough on a feeder).
  for (let pass = 0; pass < 12; pass++) {
    const buses: Bus[] = [
      { name: 'S', type: 'slack', V: p.Vsub, Pg: 0, Pd: 0, Qd: 0 },
      ...Array.from({ length: n }, (_, j): Bus => ({ name: `${j + 1}`, type: 'pq', V: 1, Pg: Ppv[j], Pd: Pl, Qd: Pl * tl + Qpv[j] })),
    ];
    r = newtonRaphson(buses, branches, { start: r ? { V: r.V, th: r.th } : undefined, maxIt: 20 });
    if (p.control === CONTROLS.cosphi) Qpv = Ppv.map((P) => P * 0.484); // cos φ = 0.9 absorbing
    else if (p.control === CONTROLS.qv)
      Qpv = r.V.slice(1).map((V, j) => {
        const q = Math.min(0.484, Math.max(0, (V - 1.0) * (0.484 / 0.05))) * pvPu;
        return 0.5 * Qpv[j] + 0.5 * q; // damped update
      });
    else if (p.control === CONTROLS.curtail)
      Ppv = r.V.slice(1).map((V, j) => {
        const lim = pvPu * Math.max(0, Math.min(1, 1 - (V - (FEEDER.Vmax - 0.01)) / 0.02));
        return 0.5 * Ppv[j] + 0.5 * lim;
      });
    else break;
  }
  const res = r!;
  const tot = (a: number[]) => a.reduce((s, v) => s + v, 0);
  return {
    V: res.V,
    Psub: res.Pg[0] * 10,
    Ppv: tot(Ppv) * 10,
    Qpv: tot(Qpv) * 10,
    curtailed: (n * pvPu - tot(Ppv)) * 10,
    losses: res.losses * 10,
    flows: res.flows.map((f) => f.Pij * 10),
  };
}

const hostCache = new Map<string, [number, number][][]>();

/** Peak-hour maximum voltage against PV per node, for each control (cached per grid setting). */
export function hostingCurves(p: Params): [number, number][][] {
  const key = `${p.Vsub}|${p.cable}`;
  let r = hostCache.get(key);
  if (!r) {
    if (hostCache.size > 50) hostCache.clear();
    r = [0, 1, 2, 3].map((control) =>
      Array.from({ length: 25 }, (_, j) => {
        const mw = j * 0.25;
        return [mw, Math.max(...feederPeak({ ...p, control }, mw).V)] as [number, number];
      }),
    );
    hostCache.set(key, r);
  }
  return r;
}

export const pvShape = (h: number) => (h > 6 && h < 20 ? Math.sin((Math.PI * (h - 6)) / 14) ** 2 : 0);

export interface FeederInfo {
  hours: FeederState[]; // every half hour, 0…24
  vMax: number;
  vMin: number;
  reverseHours: number;
  curtailedMWh: number;
  /** Largest PV per node (MW) keeping every voltage under the limit with this control. */
  hosting: number;
}

/** Peak-solar snapshot (13 h, light load) used for the hosting-capacity sweep. */
export const feederPeak = (p: Params, pvMW: number) => feederFlow(p, (pvMW / 10) * pvShape(13), feederLoad(13));

export function feederInfo(p: Params): FeederInfo {
  const hours = Array.from({ length: 49 }, (_, j) => {
    const h = j / 2;
    return feederFlow(p, (p.pv / 10) * pvShape(h), feederLoad(h));
  });
  const vs = hours.flatMap((s) => s.V.slice(1));
  let hosting = 0;
  for (let mw = 0; mw <= 8; mw += 0.05) {
    if (Math.max(...feederPeak(p, mw).V) <= FEEDER.Vmax + 1e-4) hosting = mw;
    else break;
  }
  return {
    hours,
    vMax: Math.max(...vs),
    vMin: Math.min(...vs),
    reverseHours: hours.slice(0, 48).filter((s) => s.Psub < 0).length / 2,
    curtailedMWh: hours.slice(0, 48).reduce((s, x) => s + x.curtailed / 2, 0),
    hosting,
  };
}

export const feederModel: Model = {
  id: 'feeder',
  poles: () => [],
  window: () => 24,
  simulate(p, tEnd, n = 97): Run {
    const t = linspace(0, tEnd, n);
    const r = Array.from(t, (h) => feederFlow(p, (p.pv / 10) * pvShape(h), feederLoad(h)));
    const s = (f: (x: FeederState) => number) => Float64Array.from(r.map(f));
    return {
      t,
      s: {
        vEnd: s((x) => x.V[FEEDER.nodes]),
        vMid: s((x) => x.V[3]),
        vSub: s((x) => x.V[0]),
        psub: s((x) => x.Psub),
        ppv: s((x) => x.Ppv),
        qpv: s((x) => x.Qpv),
      },
    };
  },
};

export { feederLoad };
