// Models for Module 4: conventional power-system elements.

import { cabs, cadd, carg, cdiv, cmul, cx, polar, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import { rk4 } from '../core/ode';
import { phasorRun } from './phasorRun';
import type { Model, Params, Run } from './types';

const W50 = 2 * Math.PI * 50;
const deg = Math.PI / 180;
const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const cscale = (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s });
export const csqrt = (z: Complex): Complex => {
  const r = cabs(z);
  return { re: Math.sqrt(Math.max(0, (r + z.re) / 2)), im: (z.im < 0 ? -1 : 1) * Math.sqrt(Math.max(0, (r - z.re) / 2)) };
};
const cexp = (z: Complex): Complex => polar(Math.exp(z.re), z.im);
export const ccosh = (z: Complex) => cscale(cadd(cexp(z), cexp(cscale(z, -1))), 0.5);
export const csinh = (z: Complex) => cscale(csub(cexp(z), cexp(cscale(z, -1))), 0.5);

// ── 4.1 Transmission line: short, nominal π, exact distributed ───────────────

/** Per-km constants per phase (typical overhead lines). */
export const LINE_DATA: Record<number, { r: number; l: number; c: number }> = {
  225: { r: 0.06, l: 1.3e-3, c: 9e-9 },
  400: { r: 0.03, l: 1.05e-3, c: 11.5e-9 },
};
export const LINE_MODELS = { short: 0, pi: 1, exact: 2 } as const;

interface Abcd {
  A: Complex;
  B: Complex;
  C: Complex;
}

export function lineAbcd(kV: number, km: number, model: number): Abcd & { gamma: Complex; Zc: Complex } {
  const d = LINE_DATA[kV];
  const z = cx(d.r, W50 * d.l), y = cx(0, W50 * d.c);
  const gamma = csqrt(cmul(z, y));
  const Zc = csqrt(cdiv(z, y));
  const Z = cscale(z, km), Y = cscale(y, km);
  if (model === LINE_MODELS.short) return { A: cx(1), B: Z, C: cx(0), gamma, Zc };
  if (model === LINE_MODELS.pi) {
    const half = cscale(cmul(Z, Y), 0.5);
    return { A: cadd(cx(1), half), B: Z, C: cmul(Y, cadd(cx(1), cscale(half, 0.5))), gamma, Zc };
  }
  const gl = cscale(gamma, km);
  return { A: ccosh(gl), B: cmul(Zc, csinh(gl)), C: cdiv(csinh(gl), Zc), gamma, Zc };
}

export interface LineSolution {
  Vr: Complex; // phase voltage, V
  Ir: Complex;
  Vs: Complex;
  Is: Complex;
  Ps: number; // three-phase sending power, W
  Pr: number;
}

/** Sending end held at rated voltage; the load is a constant impedance sized for P at rated voltage. */
export function solveLine(p: Params, model: number): LineSolution {
  const { kV, km, P, pf } = p;
  const { A, B, C } = lineAbcd(kV, km, model);
  const Vs = cx((kV * 1e3) / Math.sqrt(3));
  let Vr: Complex, Ir: Complex;
  if (P <= 0) {
    Vr = cdiv(Vs, A);
    Ir = cx(0);
  } else {
    const S = cx(P * 1e6, P * 1e6 * Math.tan(Math.acos(pf)));
    const ZL = cdiv(cx((kV * 1e3) ** 2), { re: S.re, im: -S.im }); // U²/S*
    Vr = cdiv(Vs, cadd(A, cdiv(B, ZL)));
    Ir = cdiv(Vr, ZL);
  }
  const Is = cadd(cmul(C, Vr), cmul(A, Ir)); // D = A for a symmetric line
  const pw = (V: Complex, I: Complex) => 3 * (V.re * I.re + V.im * I.im);
  return { Vr, Ir, Vs, Is, Ps: pw(Vs, Is), Pr: pw(Vr, Ir) };
}

export interface LineInfo {
  Zc: Complex;
  SIL: number; // W
  beta: number; // rad/km
  ferranti: number; // |Vr/Vs| at no load
  exact: LineSolution;
  chosen: LineSolution;
  all: LineSolution[]; // short, π, exact
  profile: [number, number][]; // [km from sending end, |V| pu]
}

export function lineInfo(p: Params): LineInfo {
  const { gamma, Zc } = lineAbcd(p.kV, p.km, LINE_MODELS.exact);
  const all = [0, 1, 2].map((m) => solveLine(p, m));
  const exact = all[2];
  const Vph = (p.kV * 1e3) / Math.sqrt(3);
  const profile: [number, number][] = [];
  for (let j = 0; j <= 60; j++) {
    const x = (p.km * j) / 60; // distance from the receiving end
    const gx = cscale(gamma, x);
    const V = cadd(cmul(exact.Vr, ccosh(gx)), cmul(cmul(Zc, exact.Ir), csinh(gx)));
    profile.push([p.km - x, cabs(V) / Vph]);
  }
  profile.reverse();
  return {
    Zc,
    SIL: (p.kV * 1e3) ** 2 / Zc.re,
    beta: gamma.im,
    ferranti: 1 / cabs(ccosh(cscale(gamma, p.km))),
    exact,
    chosen: all[p.model],
    all,
    profile,
  };
}

export const line: Model = {
  id: 'line',
  poles: () => [],
  window: () => 0.04,
  simulate(p, tEnd) {
    const s = solveLine(p, p.model);
    const r2 = (z: Complex) => cscale(z, Math.SQRT2);
    return phasorRun(tEnd, W50, { vs: r2(s.Vs), vr: r2(s.Vr), is: r2(s.Is), ir: r2(s.Ir) });
  },
};

// ── 4.2 Transformer: energisation inrush, regulation, efficiency ─────────────
// Inrush in pu of rated peak flux: dψ/dt = ω (sin(ωt + θ0) − r·i(ψ)), with a
// two-slope magnetising curve (1 % magnetising current, air-core slope beyond ψs).

export const TRAFO = { im: 0.01, Lair: 0.25, uk: 0.1, uR: 0.01, p0: 0.002 };

export function magnetising(psi: number, psiSat: number): number {
  const a = Math.abs(psi);
  const i = a <= psiSat ? a * TRAFO.im : psiSat * TRAFO.im + (a - psiSat) / TRAFO.Lair;
  return Math.sign(psi) * i;
}

export interface TrafoInfo {
  iPeak: number;
  psiPeak: number;
  regulation: number; // pu voltage drop at the chosen load
  efficiency: number;
  bestLoad: number; // load of maximum efficiency
}

export const transformer: Model = {
  id: 'transformer',
  poles: () => [],
  window: () => 0.4,
  simulate(p, tEnd, n = 4000): Run {
    const { theta0, psiR, psiSat, r } = p;
    const th = theta0 * deg;
    const sol = rk4((t, [psi]) => [W50 * (Math.sin(W50 * t + th) - r * magnetising(psi, psiSat))], [psiR], tEnd, n, 4);
    const psi = sol.x[0];
    return {
      t: sol.t,
      s: {
        v: sol.t.map((t) => Math.sin(W50 * t + th)),
        psi,
        i: psi.map((v) => magnetising(v, psiSat)),
        psiSteady: sol.t.map((t) => -Math.cos(W50 * t + th)),
      },
    };
  },
};

export function trafoInfo(p: Params): TrafoInfo {
  const run = transformer.simulate(p, 0.4, 4000);
  const uX = Math.sqrt(TRAFO.uk ** 2 - TRAFO.uR ** 2);
  const phi = Math.acos(p.pf);
  const S = p.load;
  const P = S * p.pf;
  return {
    iPeak: Math.max(...run.s.i.map(Math.abs)),
    psiPeak: Math.max(...run.s.psi.map(Math.abs)),
    regulation: S * (TRAFO.uR * Math.cos(phi) + uX * Math.sin(phi)),
    efficiency: P > 0 ? P / (P + TRAFO.p0 + S * S * TRAFO.uR) : 0,
    bestLoad: Math.sqrt(TRAFO.p0 / TRAFO.uR),
  };
}

export const trafoEfficiency = (S: number, pf: number) => {
  const P = S * pf;
  return P > 0 ? P / (P + TRAFO.p0 + S * S * TRAFO.uR) : 0;
};

// ── 4.3 Synchronous machine: steady state and three-phase short circuit ──────

export const SM = { V: 1, Emax: 2.6, Pturb: 0.9, Td2: 0.03, Td1: 0.8, Ta: 0.15, deltaMax: 70 };

export interface SmInfo {
  stable: boolean;
  delta: number; // degrees
  I: Complex;
  E: Complex;
  P: number;
  Q: number;
  pf: number;
  iPeakSc: number;
}

export function smSteady(P: number, E: number, Xd: number) {
  const s = (P * Xd) / (E * SM.V);
  if (s > 1) return null;
  const delta = Math.asin(s);
  const Ec = polar(E, delta);
  const I = cdiv(csub(Ec, cx(SM.V)), cx(0, Xd));
  return { delta, Ec, I, Q: (E * SM.V * Math.cos(delta) - SM.V ** 2) / Xd };
}

export function smInfo(p: Params): SmInfo {
  const s = smSteady(p.P, p.E, p.Xd);
  const iPeakSc = Math.SQRT2 * (1 / p.Xd2) * 2; // with full DC offset, ≈ 2√2/Xd''
  if (!s) return { stable: false, delta: 90, I: cx(0), E: polar(p.E, Math.PI / 2), P: p.P, Q: 0, pf: 0, iPeakSc };
  return {
    stable: true,
    delta: s.delta / deg,
    I: s.I,
    E: s.Ec,
    P: p.P,
    Q: s.Q,
    pf: p.P / Math.hypot(p.P, s.Q),
    iPeakSc,
  };
}

export const syncMachine: Model = {
  id: 'sync-machine',
  poles: () => [],
  window: (p) => (p.mode === 1 ? 3 : 0.04),
  simulate(p, tEnd, n = 5000): Run {
    const t = linspace(0, tEnd, n);
    if (p.mode === 1) {
      // Three-phase fault at the terminals of a machine at no load (E0 = 1 pu).
      const { Xd2, Xd1, Xd, theta } = p;
      const th = theta * deg;
      const env = t.map(
        (tt) =>
          Math.SQRT2 *
          ((1 / Xd2 - 1 / Xd1) * Math.exp(-tt / SM.Td2) + (1 / Xd1 - 1 / Xd) * Math.exp(-tt / SM.Td1) + 1 / Xd),
      );
      const dc = t.map((tt) => -(Math.SQRT2 / Xd2) * Math.cos(th) * Math.exp(-tt / SM.Ta));
      const i = t.map((tt, k) => env[k] * Math.cos(W50 * tt + th) + dc[k]);
      return { t, s: { i, env, envN: env.map((v) => -v), dc, v: new Float64Array(n), e: new Float64Array(n) } };
    }
    const k = smInfo(p);
    const r2 = (z: Complex) => cscale(z, Math.SQRT2);
    const run = phasorRun(tEnd, W50, { v: r2(cx(SM.V)), e: r2(k.E), i: r2(k.I) }, {}, n);
    const z = new Float64Array(n);
    return { t: run.t, s: { ...run.s, env: z, envN: z, dc: z } };
  },
};

/** Stator current magnitude for a given excitation at constant P (the V-curve). */
export const vCurve = (P: number, Xd: number) => {
  const pts: [number, number][] = [];
  for (let E = 0.3; E <= 3; E += 0.02) {
    const s = smSteady(P, E, Xd);
    if (s) pts.push([E, cabs(s.I)]);
  }
  return pts;
};

// ── 4.4 Loads: ZIP, exponential and recovering (Karlsson–Hill) ──────────────

export const LOAD_T_STEP = 5;

export function zipWeights({ z, i }: Params) {
  const pz = Math.max(0, z), pi = Math.max(0, i), pp = Math.max(0, 1 - pz - pi);
  const s = pz + pi + pp || 1;
  return { z: pz / s, i: pi / s, p: pp / s };
}

export const zipP = (w: { z: number; i: number; p: number }, V: number) => w.z * V * V + w.i * V + w.p;

export interface LoadInfo {
  w: { z: number; i: number; p: number };
  pAfter: number; // static, right after the step
  pFinal: number; // after recovery
  cvr: number; // (ΔP/P)/(ΔV/V) for small changes, static part
}

export function loadInfo(p: Params): LoadInfo {
  const w = zipWeights(p);
  const V = p.Vstep;
  const stat = zipP(w, V);
  return {
    w,
    pAfter: (1 - p.dyn) * stat + p.dyn * V * V,
    pFinal: (1 - p.dyn) * stat + p.dyn * 1,
    cvr: 2 * w.z + w.i,
  };
}

export const loadModel: Model = {
  id: 'load',
  poles: () => [],
  window: () => 60,
  simulate(p, tEnd, n = 1200): Run {
    const w = zipWeights(p);
    const Vat = (t: number) => (t < LOAD_T_STEP ? 1 : p.Vstep);
    // Recovering part: Tp dx/dt = −x + (V^αs − V^αt), αs = 0 (constant power), αt = 2.
    const sol = rk4((t, [x]) => [(-x + (1 - Vat(t) ** 2)) / p.Tp], [0], tEnd, n, 2);
    const v = sol.t.map(Vat);
    const pd = sol.x[0].map((x, k) => x + v[k] ** 2);
    const pw = v.map((V, k) => (1 - p.dyn) * zipP(w, V) + p.dyn * pd[k]);
    return { t: sol.t, s: { v, p: pw, i: pw.map((P, k) => P / v[k]), pz: v.map((V) => V * V) } };
  },
};

// ── 4.5 Induction motor: torque–slip, start-up, stall ────────────────────────

export const IM = { Rs: 0.01, Xs: 0.1, Xm: 3, Xr: 0.1, tDip: 2.5 };

function thevenin(V: number) {
  const Zm = cx(0, IM.Xm), Zs = cx(IM.Rs, IM.Xs);
  const den = cadd(Zs, Zm);
  return { Vth: cabs(cdiv(cmul(cx(V), Zm), den)), Zth: cdiv(cmul(Zm, Zs), den) };
}

/** Electromagnetic torque (pu) at slip s and terminal voltage V. */
export function imTorque(s: number, V: number, Rr: number): number {
  const ss = Math.max(1e-6, s);
  const { Vth, Zth } = thevenin(V);
  const Z = cadd(Zth, cx(Rr / ss, IM.Xr));
  return (Vth * Vth * (Rr / ss)) / (Z.re * Z.re + Z.im * Z.im);
}

/** Stator current magnitude (pu). */
export function imCurrent(s: number, V: number, Rr: number): number {
  const ss = Math.max(1e-6, s);
  const Zr = cx(Rr / ss, IM.Xr), Zm = cx(0, IM.Xm);
  const Zpar = cdiv(cmul(Zr, Zm), cadd(Zr, Zm));
  return V / cabs(cadd(cx(IM.Rs, IM.Xs), Zpar));
}

export const loadTorque = (T0: number, type: number, speed: number) => (type === 0 ? T0 * speed * speed : T0);

/** Stable operating slip (motor torque = load torque below breakdown), or 1 if none. */
export function runningSlip(T0: number, type: number, V: number, Rr: number): number {
  let sMax = 1, tMax = 0;
  for (let s = 0.001; s <= 1; s += 0.001) {
    const t = imTorque(s, V, Rr);
    if (t > tMax) [tMax, sMax] = [t, s];
  }
  const f = (s: number) => imTorque(s, V, Rr) - loadTorque(T0, type, 1 - s);
  if (f(sMax) < 0) return 1;
  let lo = 1e-6, hi = sMax;
  for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2;
    if (f(m) < 0) lo = m;
    else hi = m;
  }
  return hi;
}

export interface ImInfo {
  tStart: number;
  tMax: number;
  sMax: number;
  iStart: number;
  stalled: boolean;
  speedEnd: number;
}

export const inductionMotor: Model = {
  id: 'induction-motor',
  poles: () => [],
  window: () => 6,
  simulate(p, tEnd, n = 2400): Run {
    const { V, T0, type, Rr, H, dip, dipDur } = p;
    const s0 = p.start === 1 ? runningSlip(T0, type, V, Rr) : 1; // from rest, or already running
    const Vat = (t: number) => (t >= IM.tDip && t < IM.tDip + dipDur ? V * dip : V);
    const sol = rk4(
      (t, [s]) => {
        const te = imTorque(s, Vat(t), Rr);
        const tl = loadTorque(T0, type, 1 - s);
        let ds = (tl - te) / (2 * H);
        if (s >= 1 && ds > 0) ds = 0; // a stalled rotor does not run backwards
        return [ds];
      },
      [s0],
      tEnd,
      n,
      4,
    );
    const s = sol.x[0].map((v) => Math.min(1, Math.max(1e-6, v)));
    const v = sol.t.map(Vat);
    return {
      t: sol.t,
      s: {
        speed: s.map((x) => 1 - x),
        te: s.map((x, k) => imTorque(x, v[k], Rr)),
        tl: s.map((x) => loadTorque(T0, type, 1 - x)),
        i: s.map((x, k) => imCurrent(x, v[k], Rr)),
        v,
      },
    };
  },
};

export function imInfo(p: Params): ImInfo {
  let tMax = 0, sMax = 1;
  for (let s = 0.001; s <= 1; s += 0.001) {
    const t = imTorque(s, p.V, p.Rr);
    if (t > tMax) {
      tMax = t;
      sMax = s;
    }
  }
  const run = inductionMotor.simulate(p, 6, 1200);
  const speedEnd = run.s.speed[run.t.length - 1];
  return { tStart: imTorque(1, p.V, p.Rr), tMax, sMax, iStart: imCurrent(1, p.V, p.Rr), stalled: speedEnd < 0.5, speedEnd };
}

// ── 4.6 Compensation: shunt and series, on a radial line ─────────────────────
// Sending end 1∠δ pu, line R + jX(1 − k), load P (1 + j tan φ) at the receiving
// end, shunt susceptance B there (B > 0 capacitor, B < 0 reactor).

export const COMP_LINE = { R: 0.03, X: 0.3 };

/** Active power that puts the receiving voltage at V (upper/lower root of |Vs| = 1). */
function powerAtV(V: number, p: Params): number | null {
  const Z = cx(COMP_LINE.R, COMP_LINE.X * (1 - p.k));
  const t = Math.tan(Math.acos(p.pf));
  // Vs = V + Z·(P − j(P t − B V²))/V
  const u = cadd(cx(V), cmul(Z, cx(0, p.B * V))); // V + j Z B V
  const w = cdiv(cmul(Z, cx(1, -t)), cx(V));
  const a = w.re * w.re + w.im * w.im;
  const b = 2 * (u.re * w.re + u.im * w.im);
  const c = u.re * u.re + u.im * u.im - 1;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const P = (-b + Math.sqrt(disc)) / (2 * a);
  return P >= 0 ? P : null;
}

export function noseCurve(p: Params): [number, number][] {
  const pts: [number, number][] = [];
  for (let V = 1.5; V >= 0.1; V -= 0.005) {
    const P = powerAtV(V, p);
    if (P !== null) pts.push([P, V]);
  }
  return pts;
}

export interface CompInfo {
  V: number | null; // receiving voltage on the upper branch, null = collapse
  Pmax: number;
  Vcrit: number;
  Qc: number; // reactive power from the shunt device at the operating voltage
  Vs: Complex;
}

export function compInfo(p: Params): CompInfo {
  const curve = noseCurve(p);
  let Pmax = 0, Vcrit = 0;
  for (const [P, V] of curve) if (P > Pmax) [Pmax, Vcrit] = [P, V];
  // Upper branch: the highest V whose power matches P.
  let V: number | null = null;
  for (let j = 0; j < curve.length - 1; j++) {
    const [P1, V1] = curve[j], [P2, V2] = curve[j + 1];
    if (V1 < Vcrit) break;
    if ((P1 - p.P) * (P2 - p.P) <= 0) {
      V = V1 + ((V2 - V1) * (p.P - P1)) / (P2 - P1 || 1e-12);
      break;
    }
  }
  const Vr = V ?? 0;
  const Z = cx(COMP_LINE.R, COMP_LINE.X * (1 - p.k));
  const t = Math.tan(Math.acos(p.pf));
  const Vs = V ? cadd(cx(Vr), cdiv(cmul(Z, cx(p.P, -(p.P * t - p.B * Vr * Vr))), cx(Vr))) : cx(1);
  return { V, Pmax, Vcrit, Qc: p.B * Vr * Vr, Vs };
}

export const compensation: Model = {
  id: 'compensation',
  poles: () => [],
  window: () => 0.04,
  simulate(p, tEnd) {
    const k = compInfo(p);
    const ang = carg(k.Vs);
    // Re-reference to the sending end at 0°.
    const vr = k.V ? polar(Math.SQRT2 * k.V, -ang) : cx(0);
    return phasorRun(tEnd, W50, { vs: cx(Math.SQRT2), vr });
  },
};

// ── 4.7 FACTS: SVC versus STATCOM behind a Thevenin source ───────────────────

export const FACTS = { tDip: 0.5, tClear: 1.5, Vref: 1 };

export interface FactsInfo {
  vDipNone: number;
  vDipSvc: number;
  vDipStat: number;
  qSvcDip: number;
  qStatDip: number;
}

export const facts: Model = {
  id: 'facts',
  poles: () => [],
  window: () => 2.5,
  simulate(p, tEnd, n = 2500): Run {
    const { Edip, SCR, rating, slope, Tr } = p;
    const X = 1 / SCR;
    const Eat = (t: number) => (t >= FACTS.tDip && t < FACTS.tClear ? Edip : 1);
    // STATCOM: current source. SVC: susceptance. Both regulate V with a droop, lagging by Tr.
    const vStat = (t: number, I: number) => Eat(t) + X * I;
    const vSvc = (t: number, B: number) => Eat(t) / Math.max(0.05, 1 - X * B);
    const sol = rk4(
      (t, [I, B]) => {
        const Vs = vStat(t, I);
        const It = Math.max(-rating, Math.min(rating, (FACTS.Vref - Vs) / slope));
        const Vv = vSvc(t, B);
        const Bt = Math.max(-rating, Math.min(rating, (FACTS.Vref - Vv) / slope));
        return [(It - I) / Tr, (Bt - B) / Tr];
      },
      [0, 0],
      tEnd,
      n,
      4,
    );
    const [I, B] = sol.x;
    const vS = sol.t.map((t, k) => vStat(t, I[k]));
    const vV = sol.t.map((t, k) => vSvc(t, B[k]));
    return {
      t: sol.t,
      s: {
        vNone: sol.t.map(Eat),
        vSvc: vV,
        vStat: vS,
        qSvc: vV.map((v, k) => B[k] * v * v),
        qStat: vS.map((v, k) => I[k] * v),
      },
    };
  },
};

export function factsInfo(p: Params): FactsInfo {
  const run = facts.simulate(p, 2.5, 2500);
  const k = run.t.findIndex((t) => t > FACTS.tClear - 0.05);
  return {
    vDipNone: run.s.vNone[k],
    vDipSvc: run.s.vSvc[k],
    vDipStat: run.s.vStat[k],
    qSvcDip: run.s.qSvc[k],
    qStatDip: run.s.qStat[k],
  };
}
