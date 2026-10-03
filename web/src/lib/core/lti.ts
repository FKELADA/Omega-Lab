// Linear time-invariant simulation: dx/dt = A x + B u.
// The input is held constant over each step (zero-order hold), and the step is
// integrated exactly through the matrix exponential — so the plotted points are
// exact samples of the true solution whatever the step size, and stiff circuits
// (tiny L, tiny C) cannot make the solver ring.

import { expm, matVec, zeros, type Mat } from './linalg';

export interface Lti {
  A: Mat;
  B: Mat; // n × m
}

export interface Discrete {
  Phi: Mat;
  Gamma: Mat;
}

/** Exact ZOH discretisation, via exp([[A, B], [0, 0]] h). */
export function discretize({ A, B }: Lti, h: number): Discrete {
  const n = A.length, m = B[0].length;
  const M = zeros(n + m);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) M[i][j] = A[i][j] * h;
    for (let j = 0; j < m; j++) M[i][n + j] = B[i][j] * h;
  }
  const E = expm(M);
  return {
    Phi: E.slice(0, n).map((r) => r.slice(0, n)),
    Gamma: E.slice(0, n).map((r) => r.slice(n)),
  };
}

export const linspace = (a: number, b: number, n: number): Float64Array => {
  const t = new Float64Array(n);
  for (let k = 0; k < n; k++) t[k] = a + ((b - a) * k) / (n - 1);
  return t;
};

/**
 * Simulates from x0 over [0, tEnd] on n uniform samples.
 * `u(t)` is sampled at the start of each step. Returns one array per state.
 */
export function simulate(
  sys: Lti,
  x0: number[],
  u: (t: number) => number[],
  tEnd: number,
  n: number,
): { t: Float64Array; x: Float64Array[] } {
  const t = linspace(0, tEnd, n);
  const { Phi, Gamma } = discretize(sys, tEnd / (n - 1));
  const x = x0.map(() => new Float64Array(n));
  let xk = [...x0];
  for (let k = 0; k < n; k++) {
    xk.forEach((v, i) => (x[i][k] = v));
    if (k === n - 1) break;
    const a = matVec(Phi, xk);
    const b = matVec(Gamma, u(t[k]));
    xk = a.map((v, i) => v + b[i]);
  }
  return { t, x };
}

/** Running trapezoidal integral of y over t. */
export function cumtrapz(t: Float64Array, y: Float64Array): Float64Array {
  const out = new Float64Array(t.length);
  for (let k = 1; k < t.length; k++) out[k] = out[k - 1] + 0.5 * (y[k] + y[k - 1]) * (t[k] - t[k - 1]);
  return out;
}
