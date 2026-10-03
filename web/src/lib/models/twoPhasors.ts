// Two sinusoids at the same frequency, and their sum: the setting for Euler's
// formula and phasor addition. v_k(t) = A_k cos(ωt + φ_k), φ in degrees.

import { cabs, carg, cadd, polar, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import type { Model, Params, Run } from './types';

export const deg = Math.PI / 180;

export interface TwoPhasorInfo {
  V1: Complex;
  V2: Complex;
  S: Complex;
  amp: number; // |V1 + V2|
  phase: number; // arg(V1 + V2), degrees
  omega: number;
}

export function twoPhasorInfo({ A1, phi1, A2, phi2, f }: Params): TwoPhasorInfo {
  const V1 = polar(A1, phi1 * deg);
  const V2 = polar(A2, phi2 * deg);
  const S = cadd(V1, V2);
  return { V1, V2, S, amp: cabs(S), phase: carg(S) / deg, omega: 2 * Math.PI * f };
}

export const twoPhasors: Model = {
  id: 'two-phasors',
  poles: () => [],
  window: (p) => 2 / p.f,
  simulate(p, tEnd, n = 1200): Run {
    const { A1, phi1, A2, phi2, f } = p;
    const w = 2 * Math.PI * f;
    const t = linspace(0, tEnd, n);
    const v1 = t.map((tt) => A1 * Math.cos(w * tt + phi1 * deg));
    const v2 = t.map((tt) => A2 * Math.cos(w * tt + phi2 * deg));
    return { t, s: { v1, v2, vs: v1.map((v, k) => v + v2[k]) } };
  },
};
