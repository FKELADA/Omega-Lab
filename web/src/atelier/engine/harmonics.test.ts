import { describe, expect, it } from 'vitest';
import { lastPeriods, meanProduct, spectrum, stats } from './harmonics';

const sample = (f: (t: number) => number, T: number, n: number) => {
  const t = Float64Array.from({ length: n + 1 }, (_, k) => (k * T) / n);
  return { t, y: t.map(f) };
};

describe('harmonic analyser', () => {
  it('a 325 V sine: RMS 230 V, no distortion', () => {
    const { t, y } = sample((x) => 325 * Math.cos(2 * Math.PI * 50 * x), 0.1, 4800);
    const w = lastPeriods(t, 50)!;
    expect(w.periods).toBe(2);
    expect(stats(t, y, w).rms).toBeCloseTo(325 / Math.SQRT2, 2);
    const s = spectrum(t, y, 50, w);
    expect(s.amp[1]).toBeCloseTo(325, 2);
    expect(s.thd).toBeLessThan(1e-4);
  });

  it('a square wave: 4/π fundamental and THD ≈ 48 % (lesson 2.7)', () => {
    const { t, y } = sample((x) => ((x * 50) % 1 < 0.5 ? 1 : -1), 0.1, 48000);
    const w = lastPeriods(t, 50)!;
    const s = spectrum(t, y, 50, w, 199);
    expect(s.amp[1]).toBeCloseTo(4 / Math.PI, 3);
    expect(s.amp[2]).toBeLessThan(1e-3);
    expect(s.amp[3]).toBeCloseTo(4 / (3 * Math.PI), 3);
    expect(s.thd).toBeGreaterThan(0.47);
    expect(s.thd).toBeLessThan(0.484);
  });

  it('active power of v and i shifted by 60°: P = V I cos φ / 2', () => {
    const { t, y: v } = sample((x) => 10 * Math.cos(2 * Math.PI * 50 * x), 0.04, 4000);
    const i = t.map((x) => 2 * Math.cos(2 * Math.PI * 50 * x - Math.PI / 3));
    expect(meanProduct(t, v, i, lastPeriods(t, 50)!)).toBeCloseTo(5, 4);
  });

  it('no window when less than one period is simulated', () => {
    const { t } = sample(() => 0, 0.01, 100);
    expect(lastPeriods(t, 50)).toBeNull();
  });
});
