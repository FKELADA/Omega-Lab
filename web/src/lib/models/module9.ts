// Module 9 — The transmission system operator's view (applied to RTE, the French TSO).
// Every figure is an order of magnitude for teaching, not an operator's data.

import { linspace } from '../core/lti';
import { solve, type Mat } from '../core/linalg';
import type { Model, Params, Run } from './types';

// ── 9.1 Voltage levels: why transmit at 400 kV ───────────────────────────────

export interface Level {
  name: string;
  U: number; // kV
  r: number; // Ω/km per circuit
  x: number; // Ω/km per circuit
  /** Thermal rating of one circuit (MVA), an order of magnitude. */
  Smax: number;
  /** Typical lengths (km). */
  len: [number, number];
  who: 'GRT' | 'GRD';
  role: { fr: string; en: string };
}

export const LEVELS: Level[] = [
  { name: '400 kV', U: 400, r: 0.03, x: 0.32, Smax: 2000, len: [50, 300], who: 'GRT', role: { fr: 'grand transport, interconnexions', en: 'bulk transmission, interconnections' } },
  { name: '225 kV', U: 225, r: 0.06, x: 0.4, Smax: 600, len: [20, 150], who: 'GRT', role: { fr: 'répartition régionale', en: 'regional transmission' } },
  { name: '90 kV', U: 90, r: 0.12, x: 0.4, Smax: 150, len: [10, 60], who: 'GRT', role: { fr: 'alimente les postes sources', en: 'feeds primary substations' } },
  { name: '63 kV', U: 63, r: 0.15, x: 0.4, Smax: 100, len: [10, 50], who: 'GRT', role: { fr: 'alimente les postes sources', en: 'feeds primary substations' } },
  { name: '20 kV', U: 20, r: 0.2, x: 0.35, Smax: 10, len: [5, 30], who: 'GRD', role: { fr: 'départs HTA', en: 'MV feeders' } },
  { name: '400 V', U: 0.4, r: 0.21, x: 0.08, Smax: 0.2, len: [0.1, 1], who: 'GRD', role: { fr: 'BT, jusqu’au compteur', en: 'LV, to the meter' } },
];

export const COSPHI = 0.95;
const TANPHI = Math.tan(Math.acos(COSPHI));

export interface LevelInfo {
  lv: Level;
  R: number; // Ω, all circuits in parallel
  X: number;
  I: number; // kA per circuit
  loading: number; // % of one circuit's rating
  dv: number; // % voltage drop
  dvP: number; // part due to P
  dvQ: number; // part due to Q
  losses: number; // % of P
  rx: number;
  ok: boolean; // within rating, losses < 3 %, drop < 10 %
}

export function levelInfo(p: Params): LevelInfo {
  const lv = LEVELS[Math.round(p.level)] ?? LEVELS[0];
  const n = Math.max(1, Math.round(p.n));
  const R = (lv.r * p.L) / n, X = (lv.x * p.L) / n;
  const S = p.P / COSPHI;
  const I = S / n / (Math.sqrt(3) * lv.U);
  const dvP = (100 * R * p.P) / lv.U ** 2, dvQ = (100 * X * p.P * TANPHI) / lv.U ** 2;
  const losses = (100 * R * p.P) / (lv.U ** 2 * COSPHI ** 2);
  const loading = (100 * S) / n / lv.Smax;
  return { lv, R, X, I, loading, dv: dvP + dvQ, dvP, dvQ, losses, rx: lv.r / lv.x, ok: loading <= 100 && losses < 3 && dvP + dvQ < 10 };
}

export const levelModel: Model = {
  id: 'levels',
  poles: () => [],
  window: (p) => p.L,
  simulate(p, tEnd, n = 401): Run {
    // Along the line: the drop and the losses accumulate with distance.
    const x = linspace(0, tEnd, n);
    const k = levelInfo(p);
    return {
      t: x,
      s: {
        dv: x.map((d) => (k.dv * d) / tEnd),
        loss: x.map((d) => (k.losses * d) / tEnd),
        load: x.map(() => k.loading),
      },
    };
  },
};

// ── 9.2 Balancing: FCR, aFRR, mFRR in an interconnected system ────────────────

/**
 * Two control areas sharing one frequency: France (A) and the rest of continental Europe (B).
 * FCR (primary): proportional, fully deployed at 200 mHz, in about 30 s.
 * aFRR (secondary, "réglage secondaire fréquence-puissance"): integral on the area control error.
 * mFRR (tertiary, balancing mechanism): ordered by the dispatcher, frees the aFRR.
 */
export const BAL = {
  f0: 50,
  load: [60000, 300000],
  H: 5,
  D: 0.01, // self-regulation: 1 % of load per Hz
  fcr: [600, 2400], // MW, fully deployed at 200 mHz
  Tfcr: 8,
  afrr: [1000, 4000], // MW available
  tInc: 10,
  window: 1200,
  Tm: 180, // mFRR ramp time constant (s)
};
export const AREA = { fr: 0, ce: 1 } as const;

export function balRun(p: Params, tEnd = BAL.window, n = 1201) {
  const M = (2 * BAL.H * (BAL.load[0] + BAL.load[1])) / BAL.f0; // MW·s/Hz
  const Dk = BAL.load.map((L) => BAL.D * L); // MW/Hz
  const lam = BAL.fcr.map((R, i) => R / 0.2 + Dk[i]); // area frequency characteristics (MW/Hz)
  const incA = p.area === AREA.fr ? p.inc : 0, incB = p.area === AREA.fr ? 0 : p.inc;
  const on = p.afrr > 0;
  const Tr = p.Tr;
  const h = tEnd / (n - 1) / 10;
  const t = linspace(0, tEnd, n);
  const out = { f: new Float64Array(n), tie: new Float64Array(n), fcr: new Float64Array(n), afrr: new Float64Array(n), mfrr: new Float64Array(n), inc: new Float64Array(n) };
  // States: Δf, FCR_A, FCR_B, aFRR_A, aFRR_B, mFRR_A, mFRR_B.
  let df = 0, fA = 0, fB = 0, aA = 0, aB = 0, mA = 0, mB = 0, tt = 0;
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  for (let k = 0; k < n; k++) {
    const stepOnce = (record: boolean) => {
      const lost = tt >= BAL.tInc ? 1 : 0;
      const dPA = fA + aA + mA - incA * lost - Dk[0] * df;
      const dPB = fB + aB + mB - incB * lost - Dk[1] * df;
      const ddf = (dPA + dPB) / M;
      // Area A's export deviation: what it produces beyond its own needs, minus its share of acceleration.
      const tie = dPA - (M * BAL.load[0]) / (BAL.load[0] + BAL.load[1]) * ddf;
      if (record) {
        out.f[k] = BAL.f0 + df;
        out.tie[k] = tie;
        out.fcr[k] = fA;
        out.afrr[k] = aA;
        out.mfrr[k] = mA;
        out.inc[k] = incA * lost;
        return;
      }
      const aceA = tie + lam[0] * df, aceB = -tie + lam[1] * df;
      df += h * ddf;
      fA += (h * (clamp((-BAL.fcr[0] * df) / 0.2, BAL.fcr[0]) - fA)) / BAL.Tfcr;
      fB += (h * (clamp((-BAL.fcr[1] * df) / 0.2, BAL.fcr[1]) - fB)) / BAL.Tfcr;
      if (on) {
        aA = clamp(aA - (h * aceA) / Tr, BAL.afrr[0]);
        aB = clamp(aB - (h * aceB) / Tr, BAL.afrr[1]);
      }
      // The dispatcher orders mFRR in the area that lost generation, sized to its aFRR in use.
      if (tt >= BAL.tInc + p.tm) {
        mA += (h * ((incA > 0 ? incA : 0) - mA)) / BAL.Tm;
        mB += (h * ((incB > 0 ? incB : 0) - mB)) / BAL.Tm;
      }
      tt += h;
    };
    stepOnce(true);
    if (k < n - 1) for (let j = 0; j < 10; j++) stepOnce(false);
  }
  return { t, s: out };
}

export interface BalInfo {
  nadir: number;
  fQuasi: number; // frequency 30 s after the incident
  fEnd: number;
  tieMax: number; // largest |export deviation| of France
  afrrMax: number; // largest |aFRR| of France
  afrrEnd: number;
  lambda: number; // network power frequency characteristic, MW/Hz
}

export function balInfo(p: Params): BalInfo {
  const r = balRun(p);
  const at = (tq: number) => r.s.f[Math.min(r.t.length - 1, Math.round((tq / BAL.window) * (r.t.length - 1)))];
  const lambda = BAL.fcr.reduce((a, b) => a + b, 0) / 0.2 + BAL.D * (BAL.load[0] + BAL.load[1]);
  return {
    nadir: Math.min(...r.s.f),
    fQuasi: at(BAL.tInc + 30),
    fEnd: r.s.f[r.s.f.length - 1],
    tieMax: Math.max(...r.s.tie.map(Math.abs)),
    afrrMax: Math.max(...r.s.afrr.map(Math.abs)),
    afrrEnd: r.s.afrr[r.s.afrr.length - 1],
    lambda,
  };
}

export const balModel: Model = {
  id: 'balancing',
  poles: () => [],
  window: () => BAL.window,
  simulate(p, tEnd, n = 1201): Run {
    const r = balRun(p, tEnd, n);
    return { t: r.t, s: r.s };
  },
};

// ── 9.3 N-1 security over a day, and remedial actions ────────────────────────

/**
 * A five-node meshed 400 kV system (DC power flow). Node 0, the interconnection with the rest of
 * the grid, is the slack. A combined-cycle plant at node 4 can be called (redispatch): the
 * interconnection then imports less.
 */
export const N1 = {
  nodes: ['Interco', 'Nucléaire', 'Ville A', 'Ville B', 'Industrie'],
  lines: [
    { a: 1, b: 2, x: 1.0, rating: 3300, name: 'L1' },
    { a: 1, b: 3, x: 1.2, rating: 3300, name: 'L2' },
    { a: 0, b: 2, x: 1.6, rating: 1800, name: 'L3' },
    { a: 0, b: 4, x: 1.0, rating: 1550, name: 'L4' },
    { a: 2, b: 3, x: 0.8, rating: 1500, name: 'L5' },
    { a: 3, b: 4, x: 1.1, rating: 1200, name: 'L6' },
    { a: 0, b: 3, x: 2.0, rating: 2000, name: 'L7' },
    { a: 0, b: 3, x: 2.0, rating: 2000, name: 'L8' },
  ],
  nuclear: 3000,
  /** Peak loads (MW) at Ville A, Ville B, Industrie. */
  peak: [2600, 2200, 1100],
  pst: 3, // the phase shifter sits on L4
  /** MW shifted per degree of phase shift (order of magnitude for 400 kV). */
  mwPerDeg: 60,
  window: 24,
};
/** Topologies: L8, a second Interco–Ville B circuit, is normally open (it would raise the short-circuit current); the operator may close it, or open L5. */
export const TOPO = { normal: 0, closeL8: 1, openL5: 2 } as const;
export const TOPO_LINES = [[7], [], [4, 7]];

/** Daily load shape: night trough, midday shoulder, evening peak (fraction of peak). */
export const loadShape = (h: number) => 0.62 + 0.16 * Math.exp(-(((h - 12.5) / 2.5) ** 2)) + 0.38 * Math.exp(-(((h - 19) / 2.2) ** 2)) - 0.08 * Math.exp(-(((h - 4) / 2.5) ** 2));

/** DC flows (MW) for injections P (node 0 balances), with some lines out and a PST shift (MW). */
export function dcFlows(P: number[], out: number[], pstShift: number): number[] {
  const n = N1.nodes.length;
  const live = N1.lines.map((_, i) => !out.includes(i));
  const B: Mat = Array.from({ length: n }, () => new Array(n).fill(0));
  N1.lines.forEach((l, i) => {
    if (!live[i]) return;
    const b = 1 / l.x;
    B[l.a][l.a] += b;
    B[l.b][l.b] += b;
    B[l.a][l.b] -= b;
    B[l.b][l.a] -= b;
  });
  // The phase shifter acts as a pair of opposite injections at its line's ends.
  const inj = [...P];
  if (live[N1.pst]) {
    const l = N1.lines[N1.pst];
    inj[l.a] -= pstShift;
    inj[l.b] += pstShift;
  }
  // Remove the slack (node 0); a node cut off from it makes the reduced matrix singular.
  const Br = B.slice(1).map((r) => r.slice(1));
  if (Br.some((r, i) => r[i] === 0)) return N1.lines.map(() => NaN);
  const th = [0, ...solve(Br, inj.slice(1).map((v) => [v])).map((r) => r[0])];
  if (th.some((v) => !isFinite(v) || Math.abs(v) > 1e7)) return N1.lines.map(() => NaN);
  return N1.lines.map((l, i) => {
    if (!live[i]) return 0;
    const f = (th[l.a] - th[l.b]) / l.x;
    return i === N1.pst ? f + pstShift : f;
  });
}

export function n1Injections(p: Params, h: number): number[] {
  const s = loadShape(h) * (1 + p.growth / 100);
  const loads = N1.peak.map((L) => L * s);
  const P = [0, N1.nuclear, -loads[0], -loads[1], -loads[2] + p.redisp];
  P[0] = -P.slice(1).reduce((a, b) => a + b, 0);
  return P;
}

export interface N1Hour {
  n: number[]; // N-state loadings (%)
  worst: number[]; // worst N-1 loading of each line (%)
  worstBy: number[]; // the contingency causing it
}

export function n1At(p: Params, h: number): N1Hour {
  const base = TOPO_LINES[Math.round(p.topo)] ?? [];
  const P = n1Injections(p, h);
  const shift = p.alpha * N1.mwPerDeg;
  const pct = (f: number[]) => f.map((v, i) => (isNaN(v) ? Infinity : (100 * Math.abs(v)) / N1.lines[i].rating));
  const n = pct(dcFlows(P, base, shift));
  const worst = N1.lines.map(() => 0), worstBy = N1.lines.map(() => -1);
  N1.lines.forEach((_, c) => {
    if (base.includes(c)) return;
    const f = pct(dcFlows(P, [...base, c], shift));
    f.forEach((v, i) => {
      if (i !== c && !base.includes(i) && v > worst[i]) {
        worst[i] = v;
        worstBy[i] = c;
      }
    });
  });
  return { n, worst, worstBy };
}

export interface N1Info {
  peakHour: number;
  maxN: number;
  maxN1: number;
  critical: number; // line index
  by: number; // contingency
  hoursOver: number;
  /** Redispatch cost at the constrained hours (k€ per day), an order of magnitude. */
  cost: number;
}

export function n1Info(p: Params): N1Info {
  let maxN = 0, maxN1 = 0, critical = 0, by = -1, peakHour = 0, hoursOver = 0;
  for (let h = 0; h < 24; h += 0.25) {
    const r = n1At(p, h);
    const m = Math.max(...r.worst);
    if (m > 100.001) hoursOver += 0.25;
    maxN = Math.max(maxN, ...r.n);
    if (m > maxN1) {
      maxN1 = m;
      critical = r.worst.indexOf(m);
      by = r.worstBy[critical];
      peakHour = h;
    }
  }
  // Called for the six evening hours, about 60 €/MWh above the market price (k€ per day).
  return { peakHour, maxN, maxN1, critical, by, hoursOver, cost: (Math.max(0, p.redisp) * 6 * 60) / 1000 };
}

export const n1Model: Model = {
  id: 'n-1',
  poles: () => [],
  window: () => N1.window,
  simulate(p, tEnd, n = 97): Run {
    const t = linspace(0, tEnd, n);
    const load = new Float64Array(n), nmax = new Float64Array(n), n1 = new Float64Array(n);
    t.forEach((h, k) => {
      const r = n1At(p, h);
      load[k] = loadShape(h) * (1 + p.growth / 100) * N1.peak.reduce((a, b) => a + b, 0) / 1000;
      nmax[k] = Math.max(...r.n);
      n1[k] = Math.min(250, Math.max(...r.worst));
    });
    return { t, s: { n1, nmax, load } };
  },
};

// ── 9.4 Transmission voltage control: primary, secondary (pilot node), tertiary ──

/**
 * A 400 kV zone around a pilot node, linearised: voltage deviations (kV) respond to reactive
 * injections (Mvar) through a sensitivity matrix (about V/Scc). Two generators: G1 close, G2
 * further. The zone's net reactive demand follows the load, minus the lines' charging.
 */
export const VPLAN = {
  V0: 405,
  /** Sensitivities dV/dQ (kV/Mvar) for [G1 bus, G2 bus, pilot node] against [Q1, Q2, Qnet]. */
  S: [
    [0.02, 0.008, 0.012],
    [0.008, 0.025, 0.012],
    [0.012, 0.012, 0.03],
  ],
  Qr: [600, 400], // reactive capability (Mvar), symmetric here
  Vref: [405, 405], // generator voltage setpoints without secondary control
  qPeak: 1400, // reactive demand at the peak (Mvar)
  charging: 900, // lines' reactive production (Mvar)
  caps: [17, 22], // capacitor banks in for the evening peak
  reactors: [23, 7], // shunt reactors in at night (across midnight)
  Ti: 0.05, // secondary-control integral time (h ≈ 3 min)
  Vmax: 420,
  Vmin: 380,
  window: 24,
};
export const RST = { off: 0, on: 1 } as const;

const within = (h: number, [a, b]: number[]) => (a < b ? h >= a && h < b : h >= a || h < b);

export function vplanRun(p: Params, tEnd = VPLAN.window, n = 289) {
  const t = linspace(0, tEnd, n);
  const S = VPLAN.S;
  const out = { vp: new Float64Array(n), q1: new Float64Array(n), q2: new Float64Array(n), qd: new Float64Array(n), lvl: new Float64Array(n) };
  let N = 0;
  const dt = (tEnd / (n - 1)) / 20;
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  let tt = 0;
  let warm = p.rst === RST.on ? 400 : 0; // start the level at its equilibrium
  for (let k = 0; k < n; k++) {
    const net = () => {
      const qd = VPLAN.qPeak * loadShape(tt) - VPLAN.charging;
      const comp = (within(tt, VPLAN.caps) ? p.Qc : 0) - (within(tt, VPLAN.reactors) ? p.QL : 0);
      return { qd, Qnet: comp - qd };
    };
    const solveQ = (Qnet: number): [number, number] => {
      if (p.rst === RST.on) return [N * VPLAN.Qr[0], N * VPLAN.Qr[1]];
      // Primary control only: each generator holds its own bus voltage, within its limits.
      const b0 = VPLAN.Vref[0] - VPLAN.V0 - S[0][2] * Qnet, b1 = VPLAN.Vref[1] - VPLAN.V0 - S[1][2] * Qnet;
      const det = S[0][0] * S[1][1] - S[0][1] * S[1][0];
      let q1 = (b0 * S[1][1] - S[0][1] * b1) / det, q2 = (S[0][0] * b1 - S[1][0] * b0) / det;
      q1 = clamp(q1, -VPLAN.Qr[0], VPLAN.Qr[0]);
      q2 = clamp(q2, -VPLAN.Qr[1], VPLAN.Qr[1]);
      return [q1, q2];
    };
    const pilot = (q: [number, number], Qnet: number) => VPLAN.V0 + S[2][0] * q[0] + S[2][1] * q[1] + S[2][2] * Qnet;
    const { qd, Qnet } = net();
    const q = solveQ(Qnet);
    const vp = pilot(q, Qnet);
    out.vp[k] = vp;
    out.q1[k] = q[0];
    out.q2[k] = q[1];
    out.qd[k] = qd;
    out.lvl[k] = p.rst === RST.on ? N : q[0] / VPLAN.Qr[0];
    if (warm > 0) {
      for (; warm > 0; warm--) {
        const v = pilot([N * VPLAN.Qr[0], N * VPLAN.Qr[1]], Qnet);
        N = clamp(N + (dt * (p.Vc - v)) / (VPLAN.Ti * 40), -1, 1);
      }
      k--;
      continue;
    }
    if (k === n - 1) break;
    for (let j = 0; j < 20; j++) {
      if (p.rst === RST.on) {
        const { Qnet: qn } = net();
        const v = pilot([N * VPLAN.Qr[0], N * VPLAN.Qr[1]], qn);
        // The level N moves until the pilot node sits at its setpoint (gain in 1/kV).
        N = clamp(N + (dt * (p.Vc - v)) / (VPLAN.Ti * 40), -1, 1);
      }
      tt += dt;
    }
  }
  return { t, s: out };
}

export interface VplanInfo {
  vmin: number;
  vmax: number;
  span: number;
  Nmax: number;
  Nmin: number;
  /** Level 1 or −1 reached: the zone has no reactive reserve left. */
  saturated: boolean;
  /** Generators' reactive outputs in proportion to their capability (alignment), at the peak. */
  aligned: boolean;
}

export function vplanInfo(p: Params): VplanInfo {
  const r = vplanRun(p);
  // Leave out the quarter hour after each switching of the banks: the secondary control needs it.
  const sw = [...VPLAN.caps, ...VPLAN.reactors];
  const keep = [...r.s.vp].filter((_, k) => !sw.some((h) => r.t[k] >= h && r.t[k] < h + 0.25));
  const vmin = Math.min(...keep), vmax = Math.max(...keep);
  const Nmax = Math.max(...r.s.lvl), Nmin = Math.min(...r.s.lvl);
  const k = r.s.vp.indexOf(vmin);
  const aligned = Math.abs(r.s.q1[k] / VPLAN.Qr[0] - r.s.q2[k] / VPLAN.Qr[1]) < 0.02;
  return { vmin, vmax, span: vmax - vmin, Nmax, Nmin, saturated: Nmax > 0.999 || Nmin < -0.999, aligned };
}

export const vplanModel: Model = {
  id: 'voltage-plan',
  poles: () => [],
  window: () => VPLAN.window,
  simulate(p, tEnd, n = 289): Run {
    const r = vplanRun(p, tEnd, n);
    return { t: r.t, s: { vp: r.s.vp, q1: r.s.q1, q2: r.s.q2, qd: r.s.qd } };
  },
};

// ── 9.5 Defence plan: under-frequency load shedding ─────────────────────────────

/**
 * An islanded system (for instance after a split of the synchronous area) loses a share of its
 * generation. Primary reserve is limited and slow; load shedding stages trip at fixed
 * thresholds; below 47.5 Hz the generators disconnect (blackout); above 51.5 Hz they also trip.
 */
export const DEF = { f0: 50, tLoss: 1, reserve: 0.05, Tg: 6, D: 1, stages: 6, gap: 0.2, delay: 0.2, fTrip: 47.5, fOver: 51.5, window: 30 };

export function defRun(p: Params, tEnd = DEF.window, n = 1501) {
  const t = linspace(0, tEnd, n);
  const h = tEnd / (n - 1) / 10;
  const out = { f: new Float64Array(n), shed: new Float64Array(n), pm: new Float64Array(n) };
  let df = 0, pm = 0, shed = 0, tt = 0, black = false;
  const armed = Array.from({ length: DEF.stages }, () => -1); // time each stage's threshold was crossed
  const done = Array.from({ length: DEF.stages }, () => false);
  for (let k = 0; k < n; k++) {
    out.f[k] = black ? NaN : DEF.f0 * (1 + df);
    out.shed[k] = 100 * shed;
    out.pm[k] = 100 * pm;
    if (k === n - 1) break;
    for (let j = 0; j < 10 && !black; j++) {
      const loss = tt >= DEF.tLoss ? p.deficit / 100 : 0;
      const load = (1 - shed) * (1 + DEF.D * df);
      const ddf = (1 - loss + pm - load) / (2 * p.H);
      // Primary reserve: proportional (5 % droop), limited, with a lag.
      const target = Math.max(-DEF.reserve, Math.min(DEF.reserve, -df / 0.05));
      df += h * ddf;
      pm += (h * (target - pm)) / DEF.Tg;
      const f = DEF.f0 * (1 + df);
      if (p.step > 0)
        for (let s = 0; s < DEF.stages; s++) {
          const thr = p.f1 - s * DEF.gap;
          if (done[s]) continue;
          if (f < thr && armed[s] < 0) armed[s] = tt;
          if (armed[s] >= 0 && tt - armed[s] >= DEF.delay) {
            done[s] = true;
            shed += p.step / 100;
          }
        }
      if (f < DEF.fTrip || f > DEF.fOver) black = true;
      tt += h;
    }
  }
  return { t, s: out, black };
}

export interface DefInfo {
  nadir: number;
  fmax: number;
  shed: number; // % of load shed
  blackout: boolean;
  over: boolean; // frequency above 51 Hz after shedding: over-shedding
  rocof: number; // Hz/s just after the loss
  fEnd: number;
}

export function defInfo(p: Params): DefInfo {
  const r = defRun(p);
  const fs = [...r.s.f].filter((v) => !isNaN(v));
  const k1 = r.t.findIndex((t) => t >= DEF.tLoss + 0.1);
  const after = fs.slice(r.t.findIndex((t) => t >= DEF.tLoss));
  return {
    nadir: Math.min(...fs),
    fmax: Math.max(...after),
    shed: r.s.shed[r.s.shed.length - 1],
    blackout: r.black,
    over: Math.max(...after) > 51,
    rocof: (p.deficit / 100 / (2 * p.H)) * DEF.f0,
    fEnd: r.black ? NaN : r.s.f[r.s.f.length - 1],
  };
}

export const defModel: Model = {
  id: 'defence',
  poles: () => [],
  window: () => DEF.window,
  simulate(p, tEnd, n = 1501): Run {
    const r = defRun(p, tEnd, n);
    return { t: r.t, s: r.s };
  },
};

// ── 9.6 A connection study: where can a new plant go? ─────────────────────────

/** Three candidate substations (orders of magnitude). */
export const SITES = [
  { name: 'Poste A 400 kV', U: 400, Scc: 30000, Icc0: 59.5, Ibreak: 63, cap: 1500 },
  { name: 'Poste B 225 kV', U: 225, Scc: 8000, Icc0: 20.5, Ibreak: 40, cap: 400 },
  { name: 'Poste C 63 kV', U: 63, Scc: 600, Icc0: 5.5, Ibreak: 20, cap: 250 },
];
export const TECH = { ibr: 0, sync: 1 } as const;
/** A synchronous plant with its step-up transformer: X″d + Xt ≈ 0.35 pu on its own rating, cos φ 0.9. */
export const SYNC_X = 0.35;
/** Inverters give about their rated current in a fault (1.1 pu); minimum SCR for a standard inverter. */
export const IBR_K = 1.1;
export const SCR_MIN = 3;

export interface StudyAt {
  load: number; // % of the N-1 capacity
  scr: number;
  icc: number; // kA after connection
  ok: boolean;
  why: string[];
}

export function studyAt(p: Params, P: number): StudyAt {
  const s = SITES[Math.round(p.site)] ?? SITES[0];
  const S = P / 0.9;
  const dI = p.tech === TECH.sync ? S / (Math.sqrt(3) * s.U * SYNC_X) : (IBR_K * S) / (Math.sqrt(3) * s.U);
  const icc = s.Icc0 + dI;
  const scr = s.Scc / Math.max(1e-6, P);
  const load = (100 * P) / s.cap;
  const why: string[] = [];
  if (load > 100) why.push('capacity');
  if (p.tech === TECH.ibr && scr < SCR_MIN) why.push('scr');
  if (icc > s.Ibreak) why.push('icc');
  return { load, scr, icc, ok: why.length === 0, why };
}

export interface StudyInfo extends StudyAt {
  site: (typeof SITES)[number];
  /** Largest acceptable power at this site for this technology (MW). */
  pMax: number;
  limit: string;
}

export function studyInfo(p: Params): StudyInfo {
  const site = SITES[Math.round(p.site)] ?? SITES[0];
  let pMax = 0, limit = '';
  for (let P = 1; P <= 2000; P += 1) {
    const r = studyAt(p, P);
    if (!r.ok) {
      limit = r.why[0];
      break;
    }
    pMax = P;
  }
  return { ...studyAt(p, p.P), site, pMax, limit };
}

export const studyModel: Model = {
  id: 'connection-study',
  poles: () => [],
  window: () => 1500,
  simulate(p, tEnd, n = 301): Run {
    // The axis is the plant's size: every criterion as a function of P.
    const P = linspace(1, tEnd, n);
    const r = Array.from(P, (x) => studyAt(p, x));
    return { t: P, s: { load: Float64Array.from(r, (x) => x.load), scr: Float64Array.from(r, (x) => Math.min(30, x.scr)), icc: Float64Array.from(r, (x) => x.icc) } };
  },
};
