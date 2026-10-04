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

/**
 * Eigenvalues of a general real matrix by balancing, reduction to Hessenberg
 * form and the Francis double-shift QR algorithm (after Numerical Recipes,
 * balanc/elmhes/hqr). Robust when eigenvalues span many orders of magnitude.
 */
export function eigenvaluesQR(M: Mat): Complex[] {
  const n = M.length;
  const a = M.map((r) => [...r]);
  // Balance: scale rows and columns by powers of 2 to equalise their norms.
  const RADIX = 2;
  let done = false;
  while (!done) {
    done = true;
    for (let i = 0; i < n; i++) {
      let r = 0, c = 0;
      for (let j = 0; j < n; j++)
        if (j !== i) {
          c += Math.abs(a[j][i]);
          r += Math.abs(a[i][j]);
        }
      if (c !== 0 && r !== 0) {
        let g = r / RADIX, f = 1;
        const s = c + r;
        while (c < g) {
          f *= RADIX;
          c *= RADIX * RADIX;
        }
        g = r * RADIX;
        while (c > g) {
          f /= RADIX;
          c /= RADIX * RADIX;
        }
        if ((c + r) / f < 0.95 * s) {
          done = false;
          g = 1 / f;
          for (let j = 0; j < n; j++) a[i][j] *= g;
          for (let j = 0; j < n; j++) a[j][i] *= f;
        }
      }
    }
  }
  // Reduce to upper Hessenberg form by stabilised elimination.
  for (let m = 1; m < n - 1; m++) {
    let x = 0, i = m;
    for (let j = m; j < n; j++)
      if (Math.abs(a[j][m - 1]) > Math.abs(x)) {
        x = a[j][m - 1];
        i = j;
      }
    if (i !== m) {
      for (let j = m - 1; j < n; j++) [a[i][j], a[m][j]] = [a[m][j], a[i][j]];
      for (let j = 0; j < n; j++) [a[j][i], a[j][m]] = [a[j][m], a[j][i]];
    }
    if (x !== 0)
      for (i = m + 1; i < n; i++) {
        let y = a[i][m - 1];
        if (y !== 0) {
          y /= x;
          a[i][m - 1] = y;
          for (let j = m; j < n; j++) a[i][j] -= y * a[m][j];
          for (let j = 0; j < n; j++) a[j][m] += y * a[j][i];
        }
      }
  }
  for (let i = 2; i < n; i++) for (let j = 0; j < i - 1; j++) a[i][j] = 0;
  // Shifted QR iterations on the Hessenberg matrix.
  const wr = new Array(n).fill(0), wi = new Array(n).fill(0);
  let anorm = 0;
  for (let i = 0; i < n; i++) for (let j = Math.max(i - 1, 0); j < n; j++) anorm += Math.abs(a[i][j]);
  let nn = n - 1, t = 0;
  let p = 0, q = 0, r = 0, s = 0, w = 0, x = 0, y = 0, z = 0;
  while (nn >= 0) {
    let its = 0, l: number;
    do {
      for (l = nn; l >= 1; l--) {
        s = Math.abs(a[l - 1][l - 1]) + Math.abs(a[l][l]);
        if (s === 0) s = anorm;
        if (Math.abs(a[l][l - 1]) + s === s) {
          a[l][l - 1] = 0;
          break;
        }
      }
      x = a[nn][nn];
      if (l === nn) {
        wr[nn] = x + t;
        wi[nn--] = 0;
      } else {
        y = a[nn - 1][nn - 1];
        w = a[nn][nn - 1] * a[nn - 1][nn];
        if (l === nn - 1) {
          p = 0.5 * (y - x);
          q = p * p + w;
          z = Math.sqrt(Math.abs(q));
          x += t;
          if (q >= 0) {
            z = p + (p >= 0 ? Math.abs(z) : -Math.abs(z));
            wr[nn - 1] = wr[nn] = x + z;
            if (z) wr[nn] = x - w / z;
            wi[nn - 1] = wi[nn] = 0;
          } else {
            wr[nn - 1] = wr[nn] = x + p;
            wi[nn - 1] = -(wi[nn] = z);
          }
          nn -= 2;
        } else {
          if (its === 60) throw new Error('eigenvaluesQR: no convergence');
          if (its === 10 || its === 20) {
            t += x;
            for (let i = 0; i <= nn; i++) a[i][i] -= x;
            s = Math.abs(a[nn][nn - 1]) + Math.abs(a[nn - 1][nn - 2]);
            y = x = 0.75 * s;
            w = -0.4375 * s * s;
          }
          ++its;
          let m: number;
          for (m = nn - 2; m >= l; m--) {
            z = a[m][m];
            r = x - z;
            s = y - z;
            p = (r * s - w) / a[m + 1][m] + a[m][m + 1];
            q = a[m + 1][m + 1] - z - r - s;
            r = a[m + 2][m + 1];
            s = Math.abs(p) + Math.abs(q) + Math.abs(r);
            p /= s;
            q /= s;
            r /= s;
            if (m === l) break;
            const u = Math.abs(a[m][m - 1]) * (Math.abs(q) + Math.abs(r));
            const v = Math.abs(p) * (Math.abs(a[m - 1][m - 1]) + Math.abs(z) + Math.abs(a[m + 1][m + 1]));
            if (u + v === v) break;
          }
          for (let i = m + 2; i <= nn; i++) {
            a[i][i - 2] = 0;
            if (i !== m + 2) a[i][i - 3] = 0;
          }
          for (let k = m; k <= nn - 1; k++) {
            if (k !== m) {
              p = a[k][k - 1];
              q = a[k + 1][k - 1];
              r = 0;
              if (k !== nn - 1) r = a[k + 2][k - 1];
              if ((x = Math.abs(p) + Math.abs(q) + Math.abs(r)) !== 0) {
                p /= x;
                q /= x;
                r /= x;
              }
            }
            const sq = Math.sqrt(p * p + q * q + r * r);
            if ((s = p >= 0 ? sq : -sq) !== 0) {
              if (k === m) {
                if (l !== m) a[k][k - 1] = -a[k][k - 1];
              } else a[k][k - 1] = -s * x;
              p += s;
              x = p / s;
              y = q / s;
              z = r / s;
              q /= p;
              r /= p;
              for (let j = k; j <= nn; j++) {
                p = a[k][j] + q * a[k + 1][j];
                if (k !== nn - 1) {
                  p += r * a[k + 2][j];
                  a[k + 2][j] -= p * z;
                }
                a[k + 1][j] -= p * y;
                a[k][j] -= p * x;
              }
              const mmin = nn < k + 3 ? nn : k + 3;
              for (let i = l; i <= mmin; i++) {
                p = x * a[i][k] + y * a[i][k + 1];
                if (k !== nn - 1) {
                  p += z * a[i][k + 2];
                  a[i][k + 2] -= p * r;
                }
                a[i][k + 1] -= p * q;
                a[i][k] -= p;
              }
            }
          }
        }
      }
    } while (l < nn - 1);
  }
  return wr.map((re, i) => ({ re, im: wi[i] }));
}

/** Eigenvalues; closed form for 2×2, polynomial roots up to 4×4, QR beyond. */
export function eigenvalues(A: Mat): Complex[] {
  if (A.length >= 5) return eigenvaluesQR(A);
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
