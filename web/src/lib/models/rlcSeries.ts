// Series RLC circuit switched onto a DC source V at t = 0, starting de-energised.
// States x = [i, v_C]:   L di/dt = V − R i − v_C,   C dv_C/dt = i.

import type { Complex, Mat } from '../core/linalg';
import { cumtrapz, simulate } from '../core/lti';
import type { Model, Params, Run } from './types';

export type Regime = 'under' | 'critical' | 'over' | 'lossless';

export interface RlcInfo {
  alpha: number; // R / 2L        [1/s]
  omega0: number; // 1 / √(LC)    [rad/s]
  zeta: number; // α / ω0
  omegaD: number; // √(ω0² − α²) when underdamped, else 0
  s1: Complex;
  s2: Complex;
  regime: Regime;
  Rcrit: number; // 2 √(L/C)
  Z0: number; // √(L/C), characteristic impedance
}

/** |ζ − 1| below this counts as critically damped. */
export const CRITICAL_BAND = 0.01;

export function rlcInfo({ R, L, C }: Params): RlcInfo {
  const alpha = R / (2 * L);
  const omega0 = 1 / Math.sqrt(L * C);
  const zeta = alpha / omega0;
  const disc = alpha * alpha - omega0 * omega0;
  let s1: Complex, s2: Complex, omegaD = 0;
  if (disc >= 0) {
    const r = Math.sqrt(disc);
    s1 = { re: -alpha + r, im: 0 };
    s2 = { re: -alpha - r, im: 0 };
  } else {
    omegaD = Math.sqrt(-disc);
    s1 = { re: -alpha, im: omegaD };
    s2 = { re: -alpha, im: -omegaD };
  }
  const regime: Regime =
    R === 0 ? 'lossless' : Math.abs(zeta - 1) < CRITICAL_BAND ? 'critical' : zeta < 1 ? 'under' : 'over';
  return { alpha, omega0, zeta, omegaD, s1, s2, regime, Rcrit: 2 * Math.sqrt(L / C), Z0: Math.sqrt(L / C) };
}

export function rlcStateSpace({ R, L, C }: Params): { A: Mat; B: Mat } {
  return {
    A: [
      [-R / L, -1 / L],
      [1 / C, 0],
    ],
    B: [[1 / L], [0]],
  };
}

/** Closed-form current — used by the tests to check the numerical path. */
export function rlcCurrentExact(p: Params, t: number): number {
  const { V, L } = p;
  const k = rlcInfo(p);
  const disc = k.alpha ** 2 - k.omega0 ** 2;
  if (Math.abs(disc) < 1e-12 * k.omega0 ** 2) return (V / L) * t * Math.exp(-k.alpha * t);
  if (disc < 0) return (V / (L * k.omegaD)) * Math.exp(-k.alpha * t) * Math.sin(k.omegaD * t);
  const a = k.s1.re, b = k.s2.re;
  return (V / (L * (a - b))) * (Math.exp(a * t) - Math.exp(b * t));
}

export const rlcSeries: Model = {
  id: 'rlc-series',

  poles(p) {
    const k = rlcInfo(p);
    return [k.s1, k.s2];
  },

  window(p) {
    const k = rlcInfo(p);
    const period = (2 * Math.PI) / (k.omegaD || k.omega0);
    const slowest = Math.min(...[k.s1, k.s2].map((s) => -s.re));
    if (!(slowest > 1e-9)) return 6 * period;
    // 7 time constants: enough for the t·e^(−αt) tail of a (near-)critical response to settle.
    let tEnd = 7 / slowest;
    if (k.omegaD > 0) tEnd = Math.min(Math.max(tEnd, 2 * period), 25 * period);
    return tEnd;
  },

  simulate(p, tEnd, n = 1600): Run {
    const { R, L, C, V } = p;
    const { t, x } = simulate(rlcStateSpace(p), [0, 0], () => [V], tEnd, n);
    const [i, vC] = x;
    const vR = i.map((v) => R * v);
    const vL = i.map((_, k) => V - vR[k] - vC[k]);
    const vS = new Float64Array(n).fill(V);
    const pR = i.map((v) => R * v * v);
    const pS = i.map((v) => V * v);
    return {
      t,
      s: {
        i,
        vC,
        vR,
        vL,
        vS,
        wL: i.map((v) => 0.5 * L * v * v),
        wC: vC.map((v) => 0.5 * C * v * v),
        wR: cumtrapz(t, pR),
        wS: cumtrapz(t, pS),
      },
    };
  },
};
