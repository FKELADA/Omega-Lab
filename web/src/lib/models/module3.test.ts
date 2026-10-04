import { describe, expect, it } from 'vitest';
import { feedbackLoop, loopInfo, pll, pllInfo, pzInfo, secondOrder, smib, smibInfo, T_STEP } from './module3';

describe('second order with a zero (3.1)', () => {
  const base = { sigma: -2, wd: 10, hasZero: 0, z: 5 };
  it('matches the textbook step response', () => {
    const run = secondOrder.simulate(base, secondOrder.window(base), 1500);
    const wn = Math.hypot(-2, 10), zeta = 2 / wn, wd = 10;
    let err = 0;
    run.t.forEach((t, k) => {
      const y = 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
      err = Math.max(err, Math.abs(run.s.y[k] - y));
    });
    expect(err).toBeLessThan(1e-9);
  });
  it('measured overshoot equals e^(−πζ/√(1−ζ²))', () => {
    const k = pzInfo(base);
    expect(k.os).toBeCloseTo(k.osTheory, 3);
  });
  it('a right-half-plane zero makes the response start the wrong way', () => {
    expect(pzInfo({ ...base, hasZero: 1, z: 5 }).us).toBeGreaterThan(0.1);
    expect(pzInfo({ ...base, hasZero: 1, z: -5 }).us).toBeLessThan(1e-9);
  });
});

describe('feedback loop margins (3.2)', () => {
  const base = { K: 10, a: 1, b: 10, c: 100 };
  it('gain margin agrees with the Routh critical gain', () => {
    const k = loopInfo(base);
    expect(k.gm).toBeCloseTo(k.kCrit / base.K, 6);
  });
  it('at the critical gain the closed-loop poles reach the imaginary axis', () => {
    const k = loopInfo(base);
    const maxRe = Math.max(...feedbackLoop.poles({ ...base, K: k.kCrit }).map((p) => p.re));
    expect(Math.abs(maxRe)).toBeLessThan(1e-6);
    expect(loopInfo({ ...base, K: 1.05 * k.kCrit }).stable).toBe(false);
    expect(loopInfo({ ...base, K: 0.95 * k.kCrit }).stable).toBe(true);
  });
  it('type-0 loop: the step settles at K/(1+K)', () => {
    const run = feedbackLoop.simulate(base, feedbackLoop.window(base));
    expect(run.s.y[run.t.length - 1]).toBeCloseTo(10 / 11, 3);
  });
  it('default loop has a phase margin around 55°', () => {
    expect(loopInfo(base).pm!).toBeGreaterThan(50);
    expect(loopInfo(base).pm!).toBeLessThan(60);
  });
});

describe('swing equation (3.3)', () => {
  const base = { Pm0: 0.5, Pmax: 1, H: 4, D: 2, dP: 0.05 };
  it('starts at equilibrium δ0 = asin(Pm/Pmax)', () => {
    const run = smib.simulate(base, 4, 1600);
    const k0 = run.t.findIndex((t) => t >= T_STEP) - 1;
    expect(run.s.delta[k0]).toBeCloseTo(30, 6);
  });
  it('small step: the linear model tracks the nonlinear one over the first swing', () => {
    // Later, a ~2 % frequency difference (Ks at the new operating point) accumulates as phase drift.
    const run = smib.simulate(base, 4, 1600);
    const swing = Math.max(...run.s.delta) - 30;
    let err = 0;
    run.t.forEach((t, k) => t < T_STEP + 1.1 && (err = Math.max(err, Math.abs(run.s.delta[k] - run.s.deltaLin[k]))));
    // ~5 % remains: the curvature of sin δ over a 3° swing, which linearisation drops.
    expect(err / swing).toBeLessThan(0.08);
  });
  it('oscillates near the linear natural frequency (~0.93 Hz)', () => {
    const k = smibInfo(base);
    expect(k.fn).toBeGreaterThan(0.85);
    expect(k.fn).toBeLessThan(1.0);
    const run = smib.simulate(base, 4, 1600);
    // Count upward crossings of the new equilibrium after the step.
    const d1 = Math.asin(0.55) * (180 / Math.PI);
    let ups = 0, first = 0, last = 0;
    run.t.forEach((t, j) => {
      if (j && t > T_STEP && run.s.delta[j - 1] < d1 && run.s.delta[j] >= d1) {
        if (!ups) first = t;
        last = t;
        ups++;
      }
    });
    const f = (ups - 1) / (last - first);
    expect(f / (k.wn * Math.sqrt(1 - k.zeta ** 2) / (2 * Math.PI))).toBeCloseTo(1, 1);
  });
  it('a large step loses synchronism; a small one does not (equal-area criterion)', () => {
    expect(smibInfo({ ...base, dP: 0.45 }).lostSync).toBe(true);
    expect(smibInfo({ ...base, dP: 0.1 }).lostSync).toBe(false);
  });
});

describe('PLL (3.4)', () => {
  const base = { fn: 20, zeta: 0.7, type: 1, dphi: 30, df: 1, lim: 20, antiwindup: 1 };
  it('a PI loop removes both the phase-jump and the frequency-step error', () => {
    const run = pll.simulate(base, 0.5);
    expect(Math.abs(run.s.err[run.t.length - 1])).toBeLessThan(0.5);
    expect(run.s.fhat[run.t.length - 1]).toBeCloseTo(1, 2);
  });
  it('a P-only loop keeps a phase error Δω/Kp after a frequency step', () => {
    const p = { ...base, type: 0 };
    const run = pll.simulate(p, 0.5);
    expect(run.s.err[run.t.length - 1] / pllInfo(p).essFreq).toBeCloseTo(1, 2);
  });
  it('a phase jump produces a frequency transient', () => {
    const run = pll.simulate({ ...base, df: 0 }, 0.5);
    expect(Math.max(...run.s.fhat)).toBeGreaterThan(2);
  });
  it('linear poles are −ζωn ± jωn√(1−ζ²)', () => {
    const k = pllInfo(base);
    expect(k.poles[0].re).toBeCloseTo(-0.7 * k.wn, 6);
  });
});
