// Fixed-step fourth-order Runge–Kutta, for the nonlinear models of Module 3
// (swing equation, PLL). Linear models keep using the exact matrix-exponential step.

import { linspace } from './lti';

export type Rhs = (t: number, x: number[]) => number[];

/**
 * Integrates dx/dt = f(t, x) from x0 over [0, tEnd], returning n samples per state.
 * Each output interval is split into `sub` RK4 steps.
 */
export function rk4(f: Rhs, x0: number[], tEnd: number, n: number, sub = 4): { t: Float64Array; x: Float64Array[] } {
  const t = linspace(0, tEnd, n);
  const x = x0.map(() => new Float64Array(n));
  let xk = [...x0];
  const h = tEnd / (n - 1) / sub;
  const add = (a: number[], b: number[], s: number) => a.map((v, i) => v + s * b[i]);
  for (let k = 0; k < n; k++) {
    xk.forEach((v, i) => (x[i][k] = v));
    if (k === n - 1) break;
    let tt = t[k];
    for (let j = 0; j < sub; j++) {
      const k1 = f(tt, xk);
      const k2 = f(tt + h / 2, add(xk, k1, h / 2));
      const k3 = f(tt + h / 2, add(xk, k2, h / 2));
      const k4 = f(tt + h, add(xk, k3, h));
      xk = xk.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      tt += h;
    }
  }
  return { t, x };
}
