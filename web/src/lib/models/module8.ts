// Module 8 — Power-system stability, in the IEEE/CIGRE 2020 classification:
// rotor angle (transient 8.1, small-signal 8.2), voltage (8.3), frequency (8.4),
// converter-driven (8.5) and resonance (8.6). The G2ELin lab (8.7) lives in
// g2elin.svelte.ts.

import { eigenvaluesQR, solve, type Complex } from '../core/linalg';
import { linspace, simulate } from '../core/lti';
import { rk4 } from '../core/ode';
import { gflDeriv, gflSimulate } from './module7';
import type { Model, Params, Run } from './types';

const W0 = 2 * Math.PI * 50;
const deg = Math.PI / 180;

// ── 8.1 Transient stability: SMIB, equal-area criterion, critical clearing time ──

export const SMIB = { E: 1.1, V: 1, Xpre: 0.65, Xpost: 0.95, Xmid: 2.6, tFault: 0.1, window: 3 };
export const FAULT_AT = { bus: 0, mid: 1 } as const;

export const pmaxPre = SMIB.E * SMIB.V / SMIB.Xpre;
export const pmaxPost = SMIB.E * SMIB.V / SMIB.Xpost;
export const pmaxFault = (loc: number) => (loc === FAULT_AT.bus ? 0 : (SMIB.E * SMIB.V) / SMIB.Xmid);

/** Electrical power at angle δ and time t (fault from tFault to tFault + tc). */
function smibPe(p: Params, t: number, d: number, tc: number) {
  const t0 = SMIB.tFault;
  const Pmax = t < t0 ? pmaxPre : t < t0 + tc ? pmaxFault(p.loc) : pmaxPost;
  return Pmax * Math.sin(d);
}

export function smibRun(p: Params, tcMs = p.tc, n = 1500) {
  const tc = tcMs / 1000;
  const d0 = Math.asin(p.Pm / pmaxPre);
  const sol = rk4((t, [d, w]) => [W0 * w, (p.Pm - smibPe(p, t, d, tc) - 0.0 * w) / (2 * p.H)], [d0, 0], SMIB.window, n, 4);
  const delta = sol.x[0], w = sol.x[1];
  const Pe = sol.t.map((t, k) => smibPe(p, t, delta[k], tc));
  const stable = delta.every((d) => d < Math.PI);
  return { t: sol.t, delta, w, Pe, stable };
}

/** Critical clearing time (ms) by bisection; null when unstable even with instant clearing. */
export function cct(p: Params): number | null {
  if (!smibRun(p, 1, 700).stable) return null;
  let lo = 1, hi = 800;
  if (smibRun(p, hi, 700).stable) return hi;
  for (let k = 0; k < 18; k++) {
    const m = (lo + hi) / 2;
    if (smibRun(p, m, 700).stable) lo = m;
    else hi = m;
  }
  return lo;
}

export interface SmibInfo {
  d0: number;
  dc: number; // angle at clearing (rad)
  dmax: number; // unstable equilibrium of the post-fault curve
  Aacc: number;
  AdecMax: number;
  cct: number | null;
  stable: boolean;
  margin: number; // (AdecMax − Aacc)/Aacc
}

const smibCache = new Map<string, { run: ReturnType<typeof smibRun>; info: SmibInfo }>();
function smibAll(p: Params) {
  const key = JSON.stringify([p.Pm, p.H, p.tc, p.loc]);
  let r = smibCache.get(key);
  if (r) return r;
  const run = smibRun(p);
  const d0 = Math.asin(p.Pm / pmaxPre);
  const kc = run.t.findIndex((t) => t >= SMIB.tFault + p.tc / 1000);
  const dc = run.delta[Math.max(0, kc)];
  const dmax = Math.PI - Math.asin(Math.min(1, p.Pm / pmaxPost));
  const Pf = pmaxFault(p.loc);
  // ∫(Pm − Pf sin δ) dδ from δ0 to δc, and ∫(Pmax sin δ − Pm) dδ from δc to δmax.
  const Aacc = p.Pm * (dc - d0) + Pf * (Math.cos(dc) - Math.cos(d0));
  const AdecMax = pmaxPost * (Math.cos(dc) - Math.cos(dmax)) - p.Pm * (dmax - dc);
  const info: SmibInfo = { d0, dc, dmax, Aacc, AdecMax, cct: cct(p), stable: run.stable, margin: (AdecMax - Aacc) / Math.max(1e-9, Aacc) };
  r = { run, info };
  if (smibCache.size > 80) smibCache.clear();
  smibCache.set(key, r);
  return r;
}

export const smibInfo = (p: Params) => smibAll(p).info;

export const smibModel: Model = {
  id: 'smib',
  poles: () => [],
  window: () => SMIB.window,
  simulate(p): Run {
    const { run } = smibAll(p);
    return {
      t: run.t,
      s: {
        delta: run.delta.map((d) => d / deg),
        f: run.w.map((w) => 50 * (1 + w)),
        Pe: Float64Array.from(run.Pe),
        Pm: run.t.map(() => p.Pm),
      },
    };
  },
};

// ── 8.2 Small-signal stability: Heffron–Phillips model, AVR and PSS ──────────
// Kundur's single-machine example: Xd = 1.81, Xq = 1.76, X'd = 0.3, T'd0 = 8 s,
// H = 3.5 s, terminal voltage 1 pu, Q = 0.3 pu.

export const HP = { Xd: 1.81, Xq: 1.76, Xdp: 0.3, Td0: 8, H: 3.5, Et: 1, Q: 0.3, TA: 0.05, Tw: 1.4, T1: 0.154, T2: 0.033, dTm: 0.05 };

export function hpConstants(P: number, Xe: number) {
  const { Xd, Xq, Xdp, Et, Q } = HP;
  // Terminal voltage on the real axis; current from the power flow.
  const I = { re: P / Et, im: -Q / Et };
  const EB = { re: Et + Xe * I.im, im: -Xe * I.re }; // Et − jXe·I
  const EBm = Math.hypot(EB.re, EB.im), thB = Math.atan2(EB.im, EB.re);
  const EQ = { re: Et - Xq * I.im, im: Xq * I.re }; // Et + jXq·I : the q axis
  const thQ = Math.atan2(EQ.im, EQ.re);
  const d0 = thQ - thB; // rotor angle relative to the infinite bus
  // dq components (q axis along EQ).
  const rotq = (z: { re: number; im: number }) => ({ q: z.re * Math.cos(thQ) + z.im * Math.sin(thQ), d: z.re * Math.sin(thQ) - z.im * Math.cos(thQ) });
  const e = rotq({ re: Et, im: 0 }), i = rotq(I);
  const ed0 = e.d, eq0 = e.q, id0 = i.d, iq0 = i.q;
  const Eqp0 = eq0 + Xdp * id0;
  const EQ0 = Math.hypot(EQ.re, EQ.im);
  const K1 = (EQ0 * EBm * Math.cos(d0)) / (Xe + Xq) + (iq0 * EBm * Math.sin(d0) * (Xq - Xdp)) / (Xe + Xdp);
  const K2 = (EBm * Math.sin(d0)) / (Xe + Xdp);
  const K3 = (Xdp + Xe) / (Xd + Xe);
  const K4 = (EBm * Math.sin(d0) * (Xd - Xdp)) / (Xe + Xdp);
  const K5 = (Xq * ed0 * EBm * Math.cos(d0)) / ((Xe + Xq) * Et) - (Xdp * eq0 * EBm * Math.sin(d0)) / ((Xe + Xdp) * Et);
  const K6 = (Xe * eq0) / ((Xe + Xdp) * Et);
  return { K1, K2, K3, K4, K5, K6, d0, EB: EBm, Eqp0 };
}

/** Linear model: states [Δδ, Δω, ΔE′q, ΔEfd, v1 (washout), vs (lead-lag)], input ΔTm. */
export function hpMatrices(p: Params) {
  const k = hpConstants(p.P, p.Xe);
  const { H, Td0, TA, Tw, T1, T2 } = HP;
  const KA = p.KA, Ks = p.Kpss;
  const f = (x: number[], u: number): number[] => {
    const [dd, dw, de, efd, v1, vs] = x;
    const ddw = (u - k.K1 * dd - k.K2 * de) / (2 * H);
    const dEt = k.K5 * dd + k.K6 * de;
    const dv1 = Ks * ddw - v1 / Tw; // washout of Ks·Δω
    const dvs = (v1 + T1 * dv1 - vs) / T2; // lead-lag
    return [W0 * dw, ddw, (efd - de / k.K3 - k.K4 * dd) / Td0, (-efd + KA * (-dEt + vs)) / TA, dv1, dvs];
  };
  const n = 6;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    const e = new Array(n).fill(0);
    e[j] = 1;
    const c = f(e, 0);
    for (let i = 0; i < n; i++) A[i][j] = c[i];
  }
  const B = f(new Array(n).fill(0), 1).map((v) => [v]);
  return { A, B, k };
}

export interface HpInfo {
  K: ReturnType<typeof hpConstants>;
  poles: Complex[];
  /** The electromechanical mode (largest imaginary part below 3 Hz). */
  mode: Complex;
  zeta: number;
  freq: number;
  stable: boolean;
}

export function hpInfo(p: Params): HpInfo {
  const { A, k } = hpMatrices(p);
  const poles = eigenvaluesQR(A);
  const em = poles.filter((z) => z.im > 2 && z.im < 2 * Math.PI * 3).sort((a, b) => b.re - a.re)[0] ?? poles[0];
  const wn = Math.hypot(em.re, em.im);
  return { K: k, poles, mode: em, zeta: -em.re / wn, freq: Math.abs(em.im) / (2 * Math.PI), stable: poles.every((z) => z.re < 0) };
}

export const hpModel: Model = {
  id: 'heffron-phillips',
  poles: (p) => hpInfo(p).poles,
  window: () => 10,
  simulate(p, tEnd, n = 2000): Run {
    const { A, B, k } = hpMatrices(p);
    // A step of ΔTm at t = 0.5 s.
    const r = simulate({ A, B }, [0, 0, 0, 0, 0, 0], (t) => [t >= 0.5 ? HP.dTm : 0], tEnd, n);
    const dEt = r.x[0].map((dd, j) => k.K5 * dd + k.K6 * r.x[2][j]);
    return {
      t: r.t,
      s: {
        dw: r.x[1].map((v) => v * 50 * 1000), // mHz
        dd: r.x[0].map((v) => v / deg),
        dEt: dEt.map((v) => v * 100), // %
        efd: r.x[3],
      },
    };
  },
};

/** Damping ratio of the electromechanical mode as the AVR gain varies. */
export const hpZetaCurve = (p: Params, Kpss: number): [number, number][] =>
  Array.from({ length: 25 }, (_, j) => {
    const KA = 10 * 40 ** (j / 24);
    return [KA, 100 * hpInfo({ ...p, KA, Kpss }).zeta] as [number, number];
  });

// ── 8.3 Long-term voltage stability: line trip, tap changer, load recovery ───

export const LTVS = { E: 1.05, Xline: 0.38, Xt: 0.07, Tp: 30, tTrip: 10, window: 300, dt: 0.5, tap: 0.0125, aMin: 0.8, aMax: 1.25, db: 0.015, delay1: 20, delay2: 5, tanphi: 0.3 };
export const OLTC_MODES = { off: 0, on: 1, block: 2 } as const;

/** Upper-branch HV voltage for load P(V2), Q(V2) at LV with tap a, or null (no solution). */
function solveV1(X: number, a: number, PQ: (V2: number) => [number, number], B: number): number | null {
  const Ereq = (V1: number) => {
    const [P, Q0] = PQ(a * V1);
    const Q = Q0 - B * V1 * V1;
    return Math.hypot(V1 + (X * Q) / V1, (X * P) / V1);
  };
  let prev = LTVS.E + 0.2;
  for (let V1 = LTVS.E + 0.2; V1 > 0.3; V1 -= 0.002) {
    if (Ereq(V1) <= LTVS.E) {
      // refine between V1 and prev
      let lo = V1, hi = prev;
      for (let k = 0; k < 30; k++) {
        const m = (lo + hi) / 2;
        if (Ereq(m) <= LTVS.E) lo = m;
        else hi = m;
      }
      return lo;
    }
    prev = V1;
  }
  return null;
}

export function ltvsRun(p: Params) {
  const n = Math.round(LTVS.window / LTVS.dt) + 1;
  const t = linspace(0, LTVS.window, n);
  const V1 = new Float64Array(n), V2 = new Float64Array(n), tap = new Float64Array(n), P = new Float64Array(n);
  let x = 0, a = 1, timer = 0, firstMove = true, collapsed = -1;
  for (let k = 0; k < n; k++) {
    const tt = t[k];
    const X = (tt < LTVS.tTrip ? LTVS.Xline / 2 : LTVS.Xline) + LTVS.Xt;
    // Constant-impedance load, part of it recovering towards constant power (thermostats).
    const PQ = (v2: number): [number, number] => {
      const Pl = p.P0 * v2 * v2 + p.rec * x;
      return [Pl, Pl * LTVS.tanphi];
    };
    const v1 = collapsed >= 0 ? null : solveV1(X, a, PQ, p.B);
    if (v1 === null) {
      if (collapsed < 0) collapsed = tt;
      V1[k] = V2[k] = P[k] = NaN;
      tap[k] = a;
      continue;
    }
    const v2 = a * v1;
    V1[k] = v1;
    V2[k] = v2;
    tap[k] = a;
    P[k] = p.P0 * v2 * v2 + p.rec * x;
    // Load recovery towards constant power (Karlsson–Hill, αs = 0, αt = 2).
    x += (LTVS.dt * (-x + p.P0 * (1 - v2 * v2))) / LTVS.Tp;
    // Tap changer: raise the LV voltage after a delay while it is below the dead band.
    const blocked = p.oltc === OLTC_MODES.off || (p.oltc === OLTC_MODES.block && v1 < 0.9);
    if (!blocked && v2 < 1 - LTVS.db && a < LTVS.aMax) {
      timer += LTVS.dt;
      if (timer >= (firstMove ? LTVS.delay1 : LTVS.delay2)) {
        a = Math.min(LTVS.aMax, a + LTVS.tap);
        timer = 0;
        firstMove = false;
      }
    } else if (!blocked && v2 > 1 + LTVS.db && a > LTVS.aMin) {
      timer += LTVS.dt;
      if (timer >= (firstMove ? LTVS.delay1 : LTVS.delay2)) {
        a = Math.max(LTVS.aMin, a - LTVS.tap);
        timer = 0;
        firstMove = false;
      }
    } else timer = 0;
  }
  return { t, V1, V2, tap, P, collapsed };
}

export interface LtvsInfo {
  collapsed: boolean;
  tCollapse: number | null;
  V2end: number;
  V1end: number;
  tapEnd: number;
  taps: number; // tap moves
  /** Tap moves after which the LV voltage fell instead of rising (past the nose). */
  reverse: number;
  /** Long-term instability: collapse, or the HV voltage degraded below 0.85 pu. */
  unstable: boolean;
  /** Maximum power deliverable at LV after the trip, with the final tap (pu). */
  PmaxPost: number;
}

const ltvsCache = new Map<string, ReturnType<typeof ltvsRun>>();
function ltvsRuns(p: Params) {
  const key = JSON.stringify([p.P0, p.oltc, p.rec, p.B]);
  let r = ltvsCache.get(key);
  if (!r) {
    if (ltvsCache.size > 60) ltvsCache.clear();
    r = ltvsRun(p);
    ltvsCache.set(key, r);
  }
  return r;
}

/** P–V curve at the LV bus for a constant-power-factor load (no shunt), line count, tap a. */
export function ltvsNose(post: boolean, a: number, B: number): [number, number][] {
  const X = (post ? LTVS.Xline : LTVS.Xline / 2) + LTVS.Xt;
  const pts: [number, number][] = [];
  for (let V1 = 1.2; V1 > 0.3; V1 -= 0.01) {
    // Find P giving |E| = E at this V1 (quadratic in P for fixed tanφ).
    const c = LTVS.tanphi;
    // (V1 + X(cP − B V1²)/V1)² + (XP/V1)² = E²
    const A2 = (X / V1) ** 2 * (c * c + 1);
    const B2 = 2 * (V1 - X * B * V1) * (X * c) / V1;
    const C2 = (V1 - X * B * V1) ** 2 - LTVS.E ** 2;
    const disc = B2 * B2 - 4 * A2 * C2;
    if (disc < 0) continue;
    const P = (-B2 + Math.sqrt(disc)) / (2 * A2);
    if (P >= 0) pts.push([P, a * V1]);
  }
  return pts;
}

export function ltvsInfo(p: Params): LtvsInfo {
  const r = ltvsRuns(p);
  const last = r.t.length - 1;
  let taps = 0, reverse = 0;
  for (let k = 1; k < r.t.length; k++)
    if (r.tap[k] !== r.tap[k - 1]) {
      taps++;
      // Compare the LV voltage just before and a few seconds after the move.
      const k2 = Math.min(r.t.length - 1, k + 6);
      if (r.tap[k] > r.tap[k - 1] && r.V2[k2] < r.V2[k - 1] - 1e-4) reverse++;
    }
  const nose = ltvsNose(true, r.tap[last], p.B);
  return {
    collapsed: r.collapsed >= 0,
    tCollapse: r.collapsed >= 0 ? r.collapsed : null,
    V2end: r.V2[last],
    V1end: r.V1[last],
    tapEnd: r.tap[last],
    taps,
    reverse,
    unstable: r.collapsed >= 0 || r.V1[last] < 0.85,
    PmaxPost: Math.max(...nose.map(([P]) => P)),
  };
}

export const ltvsModel: Model = {
  id: 'ltvs',
  poles: () => [],
  window: () => LTVS.window,
  simulate(p): Run {
    const r = ltvsRuns(p);
    return { t: r.t, s: { V2: r.V2, V1: r.V1, tap: r.tap, P: r.P } };
  },
};

// ── 8.4 Frequency stability as inverters replace synchronous machines ───────

export const FSYS = { S: 30000, loss: 1320, tLoss: 1, Hsm: 5, Hgfm: 4, gain: 2400, tauG: 6, reserve: 2000, D: 1, window: 40, rocofRelay: 1, ufls: 48.8 };

function fsysRun(p: Params, share = p.share) {
  const sm = 1 - share;
  const gfm = share * p.gfm;
  const H = FSYS.Hsm * sm + FSYS.Hgfm * gfm; // on the system base
  const S = FSYS.S;
  const sol = rk4(
    (t, [df, pg, pf]) => {
      const loss = t >= FSYS.tLoss ? FSYS.loss : 0;
      const ddf = ((pg + pf - loss - (FSYS.D * S * df) / 50) * 50) / (2 * Math.max(0.2, H) * S);
      // Governors scale with the remaining synchronous fleet; grid-forming units add a fast droop.
      const gTarget = Math.min(FSYS.reserve * sm, Math.max(0, -df * FSYS.gain * sm));
      const fTarget = Math.min(p.ffr, Math.max(0, ((-df - 0.015) / 0.5) * p.ffr)) + Math.max(0, -df * 4000 * gfm);
      return [ddf, (gTarget - pg) / FSYS.tauG, (fTarget - pf) / 0.2];
    },
    [0, 0, 0],
    FSYS.window,
    1600,
    6,
  );
  return { t: sol.t, f: sol.x[0].map((d) => 50 + d), H };
}

export interface FsysInfo {
  H: number;
  rocof: number;
  nadir: number;
  ufls: boolean;
  rocofTrip: boolean;
}

const fsysCache = new Map<string, ReturnType<typeof fsysRun>>();
function fsysRuns(p: Params, share = p.share) {
  const key = JSON.stringify([share, p.gfm, p.ffr]);
  let r = fsysCache.get(key);
  if (!r) {
    if (fsysCache.size > 200) fsysCache.clear();
    r = fsysRun(p, share);
    fsysCache.set(key, r);
  }
  return r;
}

export function fsysInfo(p: Params, share = p.share): FsysInfo {
  const r = fsysRuns(p, share);
  const rocof = (-FSYS.loss * 50) / (2 * Math.max(0.2, r.H) * FSYS.S);
  const nadir = Math.min(...r.f);
  return { H: r.H, rocof, nadir, ufls: nadir < FSYS.ufls, rocofTrip: Math.abs(rocof) > FSYS.rocofRelay };
}

export const fsysModel: Model = {
  id: 'fsys',
  poles: () => [],
  window: () => FSYS.window,
  simulate(p): Run {
    const r = fsysRuns(p);
    const r0 = fsysRuns({ ...p, share: 0, gfm: 0, ffr: 0 }, 0);
    return { t: r.t, s: { f: r.f, f0: r0.f } };
  },
};

// ── 8.5 Converter-driven stability: GFL on a weak grid ───────────────────────

export const CDS = { fc: 500, fouter: 10 };

/** Linearised grid-following model at its operating point (numerical Jacobian). */
export function gflPoles(p: Params): Complex[] | null {
  const q = { ...p, fc: CDS.fc, fouter: CDS.fouter, Pset: p.P, Qset: 0 };
  const { f } = gflDeriv(q, { P: () => p.P, Q: () => 0 });
  // A short settle from a reasonable start, then Newton on f(x) = 0 using the same Jacobian.
  const sol = rk4(f, [p.P, 0, 0, 0, 1, 0, 0, 0, p.P, 0], 0.15, 300, 10);
  let x = sol.x.map((a) => a[a.length - 1]);
  if (!x.every(isFinite) || Math.abs(x[0]) > 5) return null;
  const n = x.length;
  const jac = (x: number[]) => {
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let j = 0; j < n; j++) {
      const h = 1e-6 * Math.max(1, Math.abs(x[j]));
      const xp = [...x], xm = [...x];
      xp[j] += h;
      xm[j] -= h;
      const fp = f(10, xp), fm = f(10, xm);
      for (let i = 0; i < n; i++) A[i][j] = (fp[i] - fm[i]) / (2 * h);
    }
    return A;
  };
  let A = jac(x);
  for (let it = 0; it < 6; it++) {
    const r = f(10, x);
    if (Math.max(...r.map(Math.abs)) < 1e-9) break;
    let dx: number[];
    try {
      dx = solve(A, r.map((v) => [v])).map((v) => v[0]);
    } catch {
      return null;
    }
    x = x.map((v, i) => v - dx[i]);
    if (!x.every(isFinite)) return null;
    A = jac(x);
  }
  return eigenvaluesQR(A);
}

export interface CdsInfo {
  poles: Complex[] | null;
  /** The least-damped mode below 300 Hz. */
  critical: Complex | null;
  stable: boolean;
}

const cdsCache = new Map<string, CdsInfo>();
export function cdsInfo(p: Params): CdsInfo {
  const key = JSON.stringify([p.SCR, p.fpll, p.P]);
  const hit = cdsCache.get(key);
  if (hit) return hit;
  const poles = gflPoles(p);
  const slow = poles?.filter((z) => Math.abs(z.im) < 2 * Math.PI * 300 && z.re > -400) ?? [];
  const critical = slow.length ? slow.reduce((a, b) => (b.re > a.re ? b : a)) : null;
  const r = { poles, critical, stable: !!poles && poles.every((z) => z.re < 1e-6) };
  if (cdsCache.size > 400) cdsCache.clear();
  cdsCache.set(key, r);
  return r;
}

/** Smallest stable SCR for each PLL bandwidth (the stability boundary). */
export function cdsBoundary(P: number): [number, number][] {
  const out: [number, number][] = [];
  for (let j = 0; j <= 8; j++) {
    const fpll = 5 * 30 ** (j / 8);
    // Below about 1.2 the operating point itself nears the static limit (Xg·P → 1).
    let lo = 1.2, hi = 10;
    if (!cdsInfo({ SCR: hi, fpll, P }).stable) {
      out.push([fpll, NaN]);
      continue;
    }
    if (cdsInfo({ SCR: lo, fpll, P }).stable) {
      out.push([fpll, lo]);
      continue;
    }
    for (let k = 0; k < 7; k++) {
      const m = Math.sqrt(lo * hi);
      if (cdsInfo({ SCR: m, fpll, P }).stable) hi = m;
      else lo = m;
    }
    out.push([fpll, hi]);
  }
  return out;
}

export const cdsModel: Model = {
  id: 'cds',
  poles: (p) => cdsInfo(p).poles ?? [],
  window: () => 0.5,
  simulate(p, tEnd, n = 2500): Run {
    return gflSimulate({ ...p, fc: CDS.fc, fouter: CDS.fouter, Pset: p.P, Qset: 0 }, tEnd, n);
  },
};

// ── 8.6 Resonance stability: subsynchronous resonance ───────────────────────
// A turbine-generator with one torsional mode, radial on a series-compensated line.

export const SSR = { X: 0.6, R: 0.02, zetaM: 0.0015, kE: 0.025, window: 4, A0: 0.02 };
export const SSR_MITIGATION = { none: 0, tcsc: 1 } as const;

/** Network admittance seen by the generator at frequency f (Hz). */
function ssrY(p: Params, f: number): Complex {
  const r = f / 50;
  const Xl = SSR.X * r;
  const Xc = p.mitig === SSR_MITIGATION.tcsc && f < 45 ? -0.15 * SSR.X * r : p.k * SSR.X / r; // a TCSC looks inductive at subsynchronous frequencies
  const Z = { re: SSR.R, im: Xl - Xc };
  const d = Z.re * Z.re + Z.im * Z.im;
  return { re: Z.re / d, im: -Z.im / d };
}

/** Electrical resonance of the compensated line (Hz). */
export const ssrFer = (k: number) => 50 * Math.sqrt(k);

/**
 * Damping of the torsional mode at fm (1/s): mechanical damping minus the
 * electrical (induction-generator / torsional-interaction) contribution of the
 * subsynchronous current, minus the (smaller) supersynchronous one.
 */
export function ssrSigma(p: Params, fm = p.fm): number {
  const sub = ssrY(p, 50 - fm).re, sup = ssrY(p, 50 + fm).re;
  return -SSR.zetaM * 2 * Math.PI * fm - p.zetaM / 100 * 2 * Math.PI * fm + SSR.kE * (sub - sup);
}

export interface SsrInfo {
  fer: number;
  fsub: number; // 50 − fer: frequency of the rotor oscillation that resonates
  sigma: number;
  growing: boolean;
  /** Torsional amplitude at the end, relative to the initial kick. */
  amp: number;
}

export function ssrInfo(p: Params): SsrInfo {
  const fer = ssrFer(p.k);
  const s = ssrSigma(p);
  return { fer, fsub: 50 - fer, sigma: s, growing: s > 0, amp: Math.exp(s * SSR.window) };
}

export const ssrModel: Model = {
  id: 'ssr',
  poles: () => [],
  window: () => SSR.window,
  simulate(p, tEnd, n = 4000): Run {
    const s = ssrSigma(p);
    const t = linspace(0, tEnd, n);
    const T = t.map((tt) => Math.min(5, SSR.A0 * Math.exp(s * tt)) * Math.sin(2 * Math.PI * p.fm * tt));
    const env = t.map((tt) => Math.min(5, SSR.A0 * Math.exp(s * tt)));
    return { t, s: { T, env, envN: env.map((v) => -v) } };
  },
};
