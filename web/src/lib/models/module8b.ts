// Module 8.7 — Inter-area oscillations on a two-area, four-machine system
// (in the spirit of Kundur's two-area test system), with classical machines so
// it runs in the browser. The same lesson shows G2ELin's full-model results
// when its API is running (g2elin.svelte.ts).

import { eigenvaluesQR, solve, type Complex, type Mat } from '../core/linalg';
import { simulateFree } from '../core/lti';
import type { Model, Params, Run } from './types';

const W0 = 2 * Math.PI * 50;

/** G1, G2 in area 1 and G3, G4 in area 2; reactances to the area bus differ so the two local modes separate. */
export const TWO_AREA = { Xg: [0.25, 0.35, 0.25, 0.35], P: 0.7, H1: 6.5, kick: 1e-3, window: 12 };
export const MACHINES = ['G1', 'G2', 'G3', 'G4'];
export const MODE_KIND = { inter: 0, local1: 1, local2: 2 } as const;

/** Synchronising-coefficient matrix K (pu power per rad) between the machines' internal nodes. */
export function twoAreaK(p: Params): Mat {
  // Nodes 0–3: machines; 4, 5: area buses. Linearised line weights cos(Δθ)/X.
  const n = 6;
  const L: Mat = Array.from({ length: n }, () => new Array(n).fill(0));
  const link = (a: number, b: number, X: number, P: number) => {
    const w = Math.cos(Math.asin(Math.min(0.95, P * X))) / X;
    L[a][a] += w;
    L[b][b] += w;
    L[a][b] -= w;
    L[b][a] -= w;
  };
  TWO_AREA.Xg.forEach((X, g) => link(g, g < 2 ? 4 : 5, X, TWO_AREA.P));
  link(4, 5, p.Xt, p.Ptie);
  // Kron reduction onto the machines (loads modelled as constant power).
  const Lgg = L.slice(0, 4).map((r) => r.slice(0, 4));
  const Lgb = L.slice(0, 4).map((r) => r.slice(4));
  const Lbb = L.slice(4).map((r) => r.slice(4));
  const X = solve(Lbb, Lgb[0].map((_, j) => Lgb.map((r) => r[j]))); // Lbb⁻¹ Lbg
  return Lgg.map((r, i) => r.map((v, j) => v - (Lgb[i][0] * X[0][j] + Lgb[i][1] * X[1][j])));
}

const inertias = (p: Params) => [TWO_AREA.H1, TWO_AREA.H1, p.H2, p.H2];

/** States [δ1..δ4, ω1..ω4]. */
export function twoAreaA(p: Params): Mat {
  const K = twoAreaK(p), H = inertias(p);
  const A: Mat = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let i = 0; i < 4; i++) {
    A[i][4 + i] = W0;
    for (let j = 0; j < 4; j++) A[4 + i][j] = -K[i][j] / (2 * H[i]);
    A[4 + i][4 + i] = -p.D / (2 * H[i]);
  }
  return A;
}

/** Cyclic Jacobi eigen-decomposition of a small symmetric matrix. */
function jacobi(S: Mat): { values: number[]; vectors: Mat } {
  const n = S.length;
  const a = S.map((r) => [...r]);
  const V: Mat = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 50; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++)
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq;
          a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk;
          a[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq;
          V[k][q] = s * vkp + c * vkq;
        }
      }
  }
  return { values: a.map((r, i) => r[i]), vectors: V };
}

export interface TwoAreaMode {
  kind: number; // MODE_KIND
  eig: Complex;
  freq: number; // Hz
  zeta: number;
  /** Speed mode shape, normalised to a largest component of +1. */
  shape: number[];
}

export interface TwoAreaInfo {
  modes: TwoAreaMode[]; // inter-area, local 1, local 2
  poles: Complex[];
  K: Mat;
  stable: boolean;
}

export function twoAreaInfo(p: Params): TwoAreaInfo {
  const K = twoAreaK(p), H = inertias(p);
  const poles = eigenvaluesQR(twoAreaA(p));
  // Undamped shapes: M⁻¹K with M = 2H/ω0, made symmetric by M^-1/2.
  const m = H.map((h) => Math.sqrt(W0 / (2 * h)));
  const S = K.map((r, i) => r.map((v, j) => m[i] * v * m[j]));
  const { values, vectors } = jacobi(S);
  const order = values.map((v, i) => i).sort((a, b) => values[a] - values[b]).slice(1); // drop the rigid-body mode
  const osc = poles.filter((z) => z.im > 0.1).sort((a, b) => a.im - b.im);
  const modes = order.map((col, j) => {
    const raw = vectors.map((r, i) => r[col] * m[i]);
    const big = raw.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
    const shape = raw.map((v) => v / big);
    const eig = osc[j] ?? { re: 0, im: Math.sqrt(Math.max(0, values[col])) };
    const wn = Math.hypot(eig.re, eig.im);
    // The slowest mode with areas in opposition is the inter-area one; local modes are within one area.
    const area1 = Math.abs(shape[0]) + Math.abs(shape[1]), area2 = Math.abs(shape[2]) + Math.abs(shape[3]);
    const kind = j === 0 ? MODE_KIND.inter : area1 > area2 ? MODE_KIND.local1 : MODE_KIND.local2;
    return { kind, eig, freq: eig.im / (2 * Math.PI), zeta: -eig.re / wn, shape };
  });
  return { modes, poles, K, stable: poles.every((z) => z.re < 1e-9) };
}

export const modeOf = (k: TwoAreaInfo, kind: number) => k.modes.find((m) => m.kind === kind) ?? k.modes[0];

/** Inter-area frequency (Hz) against the tie reactance. */
export const interCurve = (p: Params): [number, number][] =>
  Array.from({ length: 33 }, (_, j) => {
    const Xt = 0.4 + j * 0.05;
    return [Xt, modeOf(twoAreaInfo({ ...p, Xt }), MODE_KIND.inter).freq] as [number, number];
  });

export const twoAreaModel: Model = {
  id: 'two-area',
  poles: (p) => twoAreaInfo(p).poles,
  window: () => TWO_AREA.window,
  simulate(p, tEnd, n = 2400): Run {
    const x0 = new Array(8).fill(0);
    x0[4 + p.kick] = TWO_AREA.kick;
    const r = simulateFree(twoAreaA(p), x0, tEnd, n);
    const s: Record<string, Float64Array> = {};
    for (let i = 0; i < 4; i++) s[`dw${i + 1}`] = Float64Array.from(r.x[4 + i], (v) => v * 50 * 1000);
    return { t: r.t, s };
  },
};
