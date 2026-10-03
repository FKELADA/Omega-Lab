// Steady-state AC circuits for Module 2 (lessons 2.2–2.4). Phasors are RMS, the
// power-engineering convention: v(t) = √2·|V|·cos(ωt + ∠V).

import { cabs, cadd, carg, cdiv, cmul, cx, polar, type Complex } from '../core/linalg';
import { phasorRun } from './phasorRun';
import type { Model, Params } from './types';

const R2 = Math.SQRT2;
const peak = (X: Complex): Complex => ({ re: X.re * R2, im: X.im * R2 });
const conj = (X: Complex): Complex => ({ re: X.re, im: -X.im });
const deg = Math.PI / 180;

// ── 2.2 Impedance of one element or a series pair ─────────────────────────────

export const KINDS = { R: 0, L: 1, C: 2, RL: 3, RC: 4 } as const;

export interface ImpedanceInfo {
  omega: number;
  Z: Complex;
  I: Complex; // RMS
  phi: number; // arg Z, degrees (current lags V by phi)
  /** Corner frequency where |X| = R (RL and RC only). */
  fc: number | null;
}

export function impedanceOf({ kind, R, L, C }: Params, f: number): Complex {
  const w = 2 * Math.PI * f;
  const XL = w * L, XC = -1 / (w * C);
  switch (kind) {
    case KINDS.L:
      return cx(0, XL);
    case KINDS.C:
      return cx(0, XC);
    case KINDS.RL:
      return cx(R, XL);
    case KINDS.RC:
      return cx(R, XC);
    default:
      return cx(R);
  }
}

export function impedanceInfo(p: Params): ImpedanceInfo {
  const Z = impedanceOf(p, p.f);
  const I = cdiv(cx(p.V), Z);
  const fc = p.kind === KINDS.RL ? p.R / (2 * Math.PI * p.L) : p.kind === KINDS.RC ? 1 / (2 * Math.PI * p.R * p.C) : null;
  return { omega: 2 * Math.PI * p.f, Z, I, phi: carg(Z) / deg, fc };
}

export const impedance: Model = {
  id: 'impedance',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd) {
    const k = impedanceInfo(p);
    return phasorRun(tEnd, k.omega, { v: peak(cx(p.V)), i: peak(k.I) }, { p: (s) => s.v * s.i });
  },
};

// ── 2.3 A lagging load, with a shunt capacitor for power-factor correction ──

/** Feeder resistance between the source and the load, for the loss meter. */
export const R_LINE = 0.25;

export interface PowerInfo {
  omega: number;
  Iload: Complex;
  IC: Complex;
  I: Complex; // source current
  S: Complex; // V·I*, source side
  P: number;
  Q: number; // net, source side
  Qload: number;
  QC: number; // reactive power the capacitor supplies (positive)
  pf: number;
  phi: number; // degrees, positive = lagging
  loss: number; // I² R_line
  /** Capacitance that would raise the power factor to 0.95 lagging. */
  C95: number;
}

export function powerInfo({ V, f, P, pf, C }: Params): PowerInfo {
  const omega = 2 * Math.PI * f;
  const Qload = P * Math.tan(Math.acos(pf));
  const Vp = cx(V);
  const Iload = conj(cdiv(cx(P, Qload), conj(Vp))); // S = V I*  →  I = (S/V)*
  const IC = cmul(Vp, cx(0, omega * C));
  const I = cadd(Iload, IC);
  const S = cmul(Vp, conj(I));
  const QC = omega * C * V * V;
  const C95 = Math.max(0, (P * (Math.tan(Math.acos(pf)) - Math.tan(Math.acos(0.95)))) / (omega * V * V));
  return {
    omega,
    Iload,
    IC,
    I,
    S,
    P: S.re,
    Q: S.im,
    Qload,
    QC,
    pf: S.re / cabs(S),
    phi: Math.atan2(S.im, S.re) / deg,
    loss: cabs(I) ** 2 * R_LINE,
    C95,
  };
}

export const powerLoad: Model = {
  id: 'power-load',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd) {
    const k = powerInfo(p);
    const w = k.omega;
    return phasorRun(
      tEnd,
      w,
      { v: peak(cx(p.V)), i: peak(k.I), iload: peak(k.Iload) },
      {
        p: (s) => s.v * s.i,
        P: () => k.P,
        // p(t) = P(1 + cos 2ωt) + Q sin 2ωt, with v at 0°.
        pP: (_s, t) => k.P * (1 + Math.cos(2 * w * t)),
        pQ: (_s, t) => k.Q * Math.sin(2 * w * t),
      },
    );
  },
};

// ── 2.4 Three-phase star load, neutral connected or open ─────────────────────

export interface ThreePhaseInfo {
  omega: number;
  Vs: Complex[]; // source phase voltages a, b, c
  VN: Complex; // load neutral point, relative to source neutral
  Vload: Complex[]; // voltage across each load
  I: Complex[]; // line currents
  IN: Complex; // neutral current
  P: number;
  VLL: number; // line-to-line RMS
}

export function threePhaseInfo({ V, f, phases, Ra, Rb, Rc, neutral }: Params): ThreePhaseInfo {
  const Vs = [polar(V, 0), polar(V, -120 * deg), polar(V, 120 * deg)];
  // Single-phase mode: only phase a is connected.
  const Y = [1 / Ra, phases === 3 ? 1 / Rb : 0, phases === 3 ? 1 / Rc : 0];
  const sumY = Y.reduce((a, b) => a + b, 0);
  // Open neutral: the load star point floats to Σ Yk·Vk / Σ Yk (Millman's theorem).
  const weighted = Vs.reduce((acc, v, k) => cadd(acc, { re: v.re * Y[k], im: v.im * Y[k] }), cx(0));
  const VN = neutral || !sumY ? cx(0) : { re: weighted.re / sumY, im: weighted.im / sumY };
  const Vload = Vs.map((v) => ({ re: v.re - VN.re, im: v.im - VN.im }));
  const I = Vload.map((v, k) => ({ re: v.re * Y[k], im: v.im * Y[k] }));
  const IN = neutral ? I.reduce(cadd, cx(0)) : cx(0);
  const P = I.reduce((acc, i, k) => acc + cabs(Vload[k]) * cabs(i), 0); // resistive: in phase
  return { omega: 2 * Math.PI * f, Vs, VN, Vload, I, IN, P, VLL: Math.sqrt(3) * V };
}

export const threePhase: Model = {
  id: 'three-phase',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd) {
    const k = threePhaseInfo(p);
    const [Va, Vb, Vc] = k.Vload.map(peak);
    const [Ia, Ib, Ic] = k.I.map(peak);
    const [Sa, Sb, Sc] = k.Vs.map(peak);
    return phasorRun(
      tEnd,
      k.omega,
      { va: Sa, vb: Sb, vc: Sc, ua: Va, ub: Vb, uc: Vc, ia: Ia, ib: Ib, ic: Ic, iN: peak(k.IN) },
      {
        pa: (s) => s.ua * s.ia,
        p: (s) => s.ua * s.ia + s.ub * s.ib + s.uc * s.ic,
        P: () => k.P,
      },
    );
  },
};
