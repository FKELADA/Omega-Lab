// Poles of any circuit drawn on the bench, without writing its state equations.
// With the sources held constant, one EMT step is a linear map on the memories
// of the inductors and capacitors: s_{n+1} = M s_n (+ a constant). The
// trapezoidal rule maps each pole s to z = (1 + sh/2)/(1 − sh/2), so the
// eigenvalues z of M give the poles exactly by the inverse Tustin transform
//   s = (2/h)(z − 1)/(z + 1).
// Right and left eigenvectors of M give participation factors: which inductor
// or capacitor makes each mode.

import { cx, eigenvaluesQR, type Complex } from '../../lib/core/linalg';
import { csolve } from './ac';
import { layout, luFactor, luSolve, type EmtElement } from './emt';

export interface Pole {
  s: Complex;
  /** Participation of each state (sums to 1), in the order of `states`. */
  part: number[];
}

export interface Modal {
  poles: Pole[];
  /** Element id of each state. */
  states: string[];
}

export function modal(nNodes: number, els: EmtElement[], h: number, t: number): Modal {
  const reactive = els.filter((e) => e.state);
  const states = reactive.map((e) => e.id);
  const m = reactive.length;
  if (!m) return { poles: [], states };
  const { n, sys, bases } = layout(nNodes, els);
  for (const e of els) e.changed?.(t); // switches in their state at time t
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  els.forEach((e, k) => e.stamp(A, sys, bases[k]));
  const lu = luFactor(A);
  if (lu.singular) return { poles: [], states };

  /** One step from the given memories; returns the next memories. */
  const step = (s: number[]): number[] => {
    for (const e of els) (e.v = 0), (e.i = 0);
    reactive.forEach((e, k) => e.state!.set(s[k]));
    const b = new Array<number>(n).fill(0);
    els.forEach((e, j) => e.rhs(b, t, sys, bases[j]));
    const x = luSolve(lu, b);
    els.forEach((e, j) => e.update(x, t, sys, bases[j]));
    return reactive.map((e) => e.state!.get());
  };
  const s0 = step(new Array(m).fill(0));
  const M = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  for (let k = 0; k < m; k++) {
    const e = new Array(m).fill(0);
    e[k] = 1;
    const sk = step(e);
    for (let r = 0; r < m; r++) M[r][k] = sk[r] - s0[r];
  }

  const zs = eigenvaluesQR(M);
  const poles: Pole[] = [];
  for (const z of zs) {
    // z = −1 is a state tied to a voltage source (no dynamics); z = 0 likewise.
    if (Math.hypot(z.re + 1, z.im) < 1e-7 || Math.hypot(z.re, z.im) < 1e-12) continue;
    const den = (z.re + 1) ** 2 + z.im ** 2;
    const s = { re: ((2 / h) * (z.re * z.re + z.im * z.im - 1)) / den, im: ((2 / h) * 2 * z.im) / den };
    poles.push({ s, part: participation(M, z) });
  }
  poles.sort((a, b) => b.s.re - a.s.re || b.s.im - a.s.im);
  return { poles, states };
}

/** Inverse iteration for the right and left eigenvectors at z, then p_k = |v_k w_k| / Σ. */
function participation(M: number[][], z: Complex): number[] {
  const m = M.length;
  const zz = { re: z.re + 1e-9 * (1 + Math.abs(z.re)), im: z.im + 1e-9 * (1 + Math.abs(z.im)) };
  const vec = (T: boolean) => {
    let v = Array.from({ length: m }, (_, k) => cx(1 + 0.1 * k));
    for (let it = 0; it < 3; it++) {
      const A = Array.from({ length: m }, (_, r) => Array.from({ length: m }, (_, c) => cx((T ? M[c][r] : M[r][c]) - (r === c ? zz.re : 0), r === c ? -zz.im : 0)));
      const x = csolve(A, v.map((q) => ({ ...q })));
      if (!x) break;
      const norm = Math.sqrt(x.reduce((s, q) => s + q.re * q.re + q.im * q.im, 0)) || 1;
      v = x.map((q) => ({ re: q.re / norm, im: q.im / norm }));
    }
    return v;
  };
  const v = vec(false), w = vec(true);
  const p = v.map((vk, k) => Math.hypot(vk.re * w[k].re - vk.im * w[k].im, vk.re * w[k].im + vk.im * w[k].re));
  const sum = p.reduce((a, b) => a + b, 0) || 1;
  return p.map((x) => x / sum);
}
