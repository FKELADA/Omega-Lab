// Sinusoidal steady state, sampled in time: every signal is Re{X e^{jωt}} for a
// phasor X (peak convention). Lessons 2.2–2.4 are built on this — the circuit is
// solved once with complex numbers, then drawn as waveforms.

import { cabs, carg, type Complex } from '../core/linalg';
import { linspace } from '../core/lti';
import type { Run } from './types';

export function phasorRun(
  tEnd: number,
  omega: number,
  phasors: Record<string, Complex>,
  derived: Record<string, (s: Record<string, number>, t: number) => number> = {},
  n = 1200,
): Run {
  const t = linspace(0, tEnd, n);
  const s: Record<string, Float64Array> = {};
  for (const [id, X] of Object.entries(phasors)) {
    const A = cabs(X), ph = carg(X);
    s[id] = t.map((tt) => A * Math.cos(omega * tt + ph));
  }
  const ids = Object.keys(phasors);
  for (const [id, f] of Object.entries(derived)) {
    s[id] = t.map((tt, k) => f(Object.fromEntries(ids.map((i) => [i, s[i][k]])), tt));
  }
  return { t, s };
}

/** Phase of a sampled sinusoid, by least squares on a·cos ωt − b·sin ωt (radians). */
export function fitPhase(points: [number, number][], omega: number): { amp: number; phase: number } {
  let cc = 0, ss = 0, cs = 0, yc = 0, ys = 0;
  for (const [t, y] of points) {
    const c = Math.cos(omega * t), s = -Math.sin(omega * t);
    cc += c * c;
    ss += s * s;
    cs += c * s;
    yc += y * c;
    ys += y * s;
  }
  const det = cc * ss - cs * cs || 1e-30;
  const a = (yc * ss - ys * cs) / det, b = (ys * cc - yc * cs) / det;
  return { amp: Math.hypot(a, b), phase: Math.atan2(b, a) };
}
