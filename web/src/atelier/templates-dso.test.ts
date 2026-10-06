import { describe, expect, it } from 'vitest';
import { runTemplate } from './templates-a3.test';

const at = (t: Float64Array, y: Float64Array, tq: number) => y[t.findIndex((x) => x >= tq)];
/** RMS over the cycle ending at tq. */
const rmsAt = (t: Float64Array, y: Float64Array, tq: number) => {
  let s = 0, n = 0;
  t.forEach((x, k) => {
    if (x > tq - 0.02 && x <= tq) (s += y[k] * y[k]), n++;
  });
  return Math.sqrt(s / Math.max(1, n));
};
const E = 20e3 / Math.sqrt(3);
const w = 2 * Math.PI * 50;
/** Phase-to-earth capacitance of the two cable feeders (60 km at 250 nF/km). */
const C = 60 * 250e-9;

describe('distribution templates (Module 10)', () => {
  it('MV loop (10.1): voltage lost after DJ1 opens, restored by closing the open point', () => {
    const { r, net } = runTemplate('mv-loop');
    expect(net.diagnostics.filter((d) => d.level === 'error')).toEqual([]);
    const v = r.s['CH2.va'];
    expect(rmsAt(r.t, v, 0.19)).toBeGreaterThan(0.9 * E);
    expect(rmsAt(r.t, v, 0.35)).toBeLessThan(0.1 * E);
    expect(rmsAt(r.t, v, 0.58)).toBeGreaterThan(0.9 * E);
  });

  it('isolated neutral (10.3): the fault current is the cables’ capacitive current 3ωCE', () => {
    const { r } = runTemplate('mv-neutral', { 'RN.R': 1e6 });
    const If = rmsAt(r.t, r.s['F1.ia'], 0.38);
    expect(Math.abs(If / (3 * w * C * E) - 1)).toBeLessThan(0.05);
    // Two feeders: the faulty one sees the other's capacitive current, the healthy one its own.
    expect(Math.abs(at(r.t, r.s['P1.I0rms'], 0.38) / (3 * w * 40 * 250e-9 * E) - 1)).toBeLessThan(0.1);
  });

  it('resistance-earthed neutral (10.3): about 300 A resistive plus the capacitive current', () => {
    const { r } = runTemplate('mv-neutral');
    const If = rmsAt(r.t, r.s['F1.ia'], 0.38);
    expect(If).toBeGreaterThan(280);
    expect(If).toBeLessThan(Math.hypot(300, 3 * w * C * E) * 1.05);
    // The faulty feeder sees more residual current than the healthy one.
    expect(at(r.t, r.s['P1.I0rms'], 0.38)).toBeGreaterThan(2 * at(r.t, r.s['P2.I0rms'], 0.38));
  });

  it('protection (10.4): the feeder trips, recloses and restores a transient fault; the incomer stays closed', () => {
    const { r } = runTemplate('mv-protection');
    expect(at(r.t, r.s['P1.etat'], 0.75)).toBe(0);
    expect(at(r.t, r.s['P1.etat'], 1.9)).toBe(1);
    expect(Math.min(...r.s['P0.etat'])).toBe(1);
    // The end-of-feeder phase-to-phase fault: about 1,050 A, as in lesson 10.4.
    expect(Math.max(...r.s['P1.Irms'])).toBeGreaterThan(950);
    expect(Math.max(...r.s['P1.Irms'])).toBeLessThan(1150);
  });

  it('protection (10.4): a permanent fault locks the feeder out; a slow feeder relay lets the incomer trip', () => {
    const p = runTemplate('mv-protection', { 'F1.toff': 10, 'P1.reclose': 2 });
    expect(p.r.s['P1.etat'][p.r.t.length - 1]).toBe(0);
    const slow = runTemplate('mv-protection', { 'P1.td': 0.8, 'F1.toff': 10 });
    expect(Math.min(...slow.r.s['P0.etat'])).toBe(0);
  });
});
