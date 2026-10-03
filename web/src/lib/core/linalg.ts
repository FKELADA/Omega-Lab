// Small dense linear algebra for the client-side solver.
// Systems in the early modules have a handful of states, so clarity beats speed here.

export type Mat = number[][];

export interface Complex {
  re: number;
  im: number;
}

export const zeros = (n: number, m: number = n): Mat =>
  Array.from({ length: n }, () => new Array<number>(m).fill(0));

export const eye = (n: number): Mat => {
  const I = zeros(n);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
};

export const matMul = (A: Mat, B: Mat): Mat => {
  const n = A.length, k = B.length, m = B[0].length;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++)
    for (let p = 0; p < k; p++) {
      const a = A[i][p];
      if (a === 0) continue;
      for (let j = 0; j < m; j++) C[i][j] += a * B[p][j];
    }
  return C;
};

export const matAdd = (A: Mat, B: Mat, sb = 1): Mat => A.map((r, i) => r.map((v, j) => v + sb * B[i][j]));

export const matScale = (A: Mat, s: number): Mat => A.map((r) => r.map((v) => v * s));

export const matVec = (A: Mat, x: ArrayLike<number>): number[] =>
  A.map((r) => r.reduce((acc, v, j) => acc + v * x[j], 0));

/** Max absolute column sum. */
export const norm1 = (A: Mat): number => {
  let best = 0;
  for (let j = 0; j < A[0].length; j++) {
    let s = 0;
    for (let i = 0; i < A.length; i++) s += Math.abs(A[i][j]);
    best = Math.max(best, s);
  }
  return best;
};

/** Solves A X = B by Gaussian elimination with partial pivoting. */
export function solve(A: Mat, B: Mat): Mat {
  const n = A.length, m = B[0].length;
  const M = A.map((r, i) => [...r, ...B[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (M[piv][c] === 0) throw new Error('singular matrix');
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      if (f === 0) continue;
      for (let j = c; j < n + m; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r, i) => r.slice(n).map((v) => v / M[i][i]));
}

/** Matrix exponential: scaling and squaring with a degree-6 Padé approximant. */
export function expm(A: Mat): Mat {
  const n = A.length;
  const nrm = norm1(A);
  const s = nrm > 0.5 ? Math.ceil(Math.log2(nrm / 0.5)) : 0;
  const X = matScale(A, 2 ** -s);
  const q = 6;
  let c = 1;
  let Xk = eye(n);
  let N = eye(n);
  let D = eye(n);
  for (let k = 1; k <= q; k++) {
    c = (c * (q - k + 1)) / (k * (2 * q - k + 1));
    Xk = matMul(X, Xk);
    N = matAdd(N, Xk, c);
    D = matAdd(D, Xk, (k % 2 ? -1 : 1) * c);
  }
  let E = solve(D, N);
  for (let k = 0; k < s; k++) E = matMul(E, E);
  return E;
}

/** Characteristic polynomial coefficients [1, c1, ..., cn] (Faddeev–LeVerrier). */
export function charPoly(A: Mat): number[] {
  const n = A.length;
  const c = [1];
  let M = zeros(n);
  for (let k = 1; k <= n; k++) {
    M = matAdd(matMul(A, M), eye(n), c[k - 1]);
    const AM = matMul(A, M);
    let tr = 0;
    for (let i = 0; i < n; i++) tr += AM[i][i];
    c.push(-tr / k);
  }
  return c;
}

/** Roots of a monic polynomial [1, c1, ..., cn] by Durand–Kerner. */
export function polyRoots(c: number[]): Complex[] {
  const n = c.length - 1;
  const scale = Math.max(1, ...c.slice(1).map((v, k) => Math.abs(v) ** (1 / (k + 1))));
  let z: Complex[] = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n + 0.4;
    return { re: scale * 0.9 * Math.cos(a), im: scale * 0.9 * Math.sin(a) };
  });
  const evalP = (x: Complex): Complex => {
    let re = 1, im = 0;
    for (let k = 1; k <= n; k++) [re, im] = [re * x.re - im * x.im + c[k], re * x.im + im * x.re];
    return { re, im };
  };
  for (let it = 0; it < 500; it++) {
    let delta = 0;
    z = z.map((zi, i) => {
      const p = evalP(zi);
      let dr = 1, di = 0;
      z.forEach((zj, j) => {
        if (j === i) return;
        const ar = zi.re - zj.re, ai = zi.im - zj.im;
        [dr, di] = [dr * ar - di * ai, dr * ai + di * ar];
      });
      const den = dr * dr + di * di || 1e-300;
      const qr = (p.re * dr + p.im * di) / den, qi = (p.im * dr - p.re * di) / den;
      delta = Math.max(delta, Math.hypot(qr, qi) / (Math.hypot(zi.re, zi.im) + 1e-300));
      return { re: zi.re - qr, im: zi.im - qi };
    });
    if (delta < 1e-14) break;
  }
  return z.map((r) => ({ re: r.re, im: Math.abs(r.im) < 1e-9 * (Math.abs(r.re) + 1) ? 0 : r.im }));
}

/** Eigenvalues; closed form for 2×2, polynomial roots otherwise. */
export function eigenvalues(A: Mat): Complex[] {
  if (A.length === 1) return [{ re: A[0][0], im: 0 }];
  if (A.length === 2) {
    const tr = A[0][0] + A[1][1];
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const disc = (tr * tr) / 4 - det;
    if (disc >= 0) {
      const r = Math.sqrt(disc);
      return [{ re: tr / 2 + r, im: 0 }, { re: tr / 2 - r, im: 0 }];
    }
    const w = Math.sqrt(-disc);
    return [{ re: tr / 2, im: w }, { re: tr / 2, im: -w }];
  }
  return polyRoots(charPoly(A));
}

// Complex arithmetic, for phasors.
export const cx = (re: number, im = 0): Complex => ({ re, im });
export const cadd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const cmul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const cabs = (a: Complex): number => Math.hypot(a.re, a.im);
export const carg = (a: Complex): number => Math.atan2(a.im, a.re);
export const polar = (r: number, theta: number): Complex => ({ re: r * Math.cos(theta), im: r * Math.sin(theta) });
