import { describe, expect, it } from 'vitest';
import { charPoly, eigenvalues, expm, polyRoots } from './linalg';
import { rlcCurrentExact, rlcInfo, rlcSeries, rlcStateSpace } from '../models/rlcSeries';

describe('expm', () => {
  it('matches the rotation matrix for a skew-symmetric generator', () => {
    const w = 3.7;
    const E = expm([
      [0, -w],
      [w, 0],
    ]);
    expect(E[0][0]).toBeCloseTo(Math.cos(w), 12);
    expect(E[1][0]).toBeCloseTo(Math.sin(w), 12);
  });

  it('handles large norms through scaling and squaring', () => {
    const E = expm([[-50]]);
    expect(E[0][0] / Math.exp(-50)).toBeCloseTo(1, 9);
  });
});

describe('eigenvalues', () => {
  it('finds the roots of a 3×3 companion matrix', () => {
    // (s+1)(s+2)(s+3)
    const A = [
      [0, 1, 0],
      [0, 0, 1],
      [-6, -11, -6],
    ];
    expect(charPoly(A).map((c) => Math.round(c))).toEqual([1, 6, 11, 6]);
    const re = eigenvalues(A).map((z) => z.re).sort((a, b) => a - b);
    re.forEach((v, k) => expect(v).toBeCloseTo([-3, -2, -1][k], 8));
  });

  it('finds complex pairs', () => {
    const r = polyRoots([1, 2, 5]); // −1 ± 2j
    expect(r.map((z) => Math.abs(z.im)).sort()).toEqual([2, 2].map((v) => expect.closeTo(v, 10)));
  });

  it('agrees with the RLC pole formula', () => {
    const p = { R: 3, L: 0.01, C: 1e-4, V: 10 };
    const ev = eigenvalues(rlcStateSpace(p).A);
    const k = rlcInfo(p);
    expect(ev[0].re).toBeCloseTo(k.s1.re, 8);
    expect(Math.abs(ev[0].im)).toBeCloseTo(Math.abs(k.s1.im), 8);
  });
});

describe('series RLC step response', () => {
  const L = 0.01, C = 1e-4, V = 10;
  const Rcrit = 2 * Math.sqrt(L / C);
  const cases = { under: 0.2 * Rcrit, critical: Rcrit, over: 4 * Rcrit };

  for (const [name, R] of Object.entries(cases)) {
    it(`matches the closed form when ${name}damped`, () => {
      const p = { R, L, C, V };
      const tEnd = rlcSeries.window(p);
      const run = rlcSeries.simulate(p, tEnd, 800);
      const peak = Math.max(...run.s.i.map(Math.abs));
      let err = 0;
      run.t.forEach((t, k) => (err = Math.max(err, Math.abs(run.s.i[k] - rlcCurrentExact(p, t)))));
      expect(err / peak).toBeLessThan(1e-9);
    });

    it(`conserves energy when ${name}damped`, () => {
      const p = { R, L, C, V };
      const run = rlcSeries.simulate(p, rlcSeries.window(p), 4000);
      const k = run.t.length - 1;
      const { wS, wR, wL, wC } = run.s;
      expect((wR[k] + wL[k] + wC[k]) / wS[k]).toBeCloseTo(1, 3);
    });
  }

  it('ends with the capacitor charged to V and no current', () => {
    const p = { R: 20, L, C, V };
    const run = rlcSeries.simulate(p, rlcSeries.window(p));
    const k = run.t.length - 1;
    expect(Math.abs(run.s.vC[k] / V - 1)).toBeLessThan(0.01);
    expect(Math.abs(run.s.i[k])).toBeLessThan(0.01 * (V / Math.sqrt(L / C)));
  });

  it('classifies regimes', () => {
    expect(rlcInfo({ R: Rcrit, L, C }).regime).toBe('critical');
    expect(rlcInfo({ R: 0.5 * Rcrit, L, C }).regime).toBe('under');
    expect(rlcInfo({ R: 2 * Rcrit, L, C }).regime).toBe('over');
    expect(rlcInfo({ R: 0, L, C }).regime).toBe('lossless');
  });
});
