import { describe, expect, it } from 'vitest';
import { circuitEquations } from './circuitEqs';
import { compile } from './compile';
import { lastPeriods, spectrum, stats } from './engine/harmonics';
import { TEMPLATES } from './templates';

const ui = () => ({ selected: () => null, bodeIn: () => null, zAt: () => null });
export const runTemplate = (id: string, over: Record<string, number> = {}) => {
  const { exp, net } = compile(TEMPLATES.find((t) => t.id === id)!.doc(), ui(), circuitEquations);
  const p = { ...Object.fromEntries(exp.params.map((q) => [q.id, q.default])), ...over };
  return { r: exp.model.simulate(p, p.T), net, p, exp };
};
const tail = (y: Float64Array, from = 0.8) => {
  const s = y.slice(Math.round(y.length * from));
  return s.reduce((a, b) => a + b, 0) / s.length;
};

describe('A3 templates against the lessons', () => {
  it('buck chopper (6.1): V_out ≈ D·V_in', () => {
    const { r, net } = runTemplate('buck');
    expect(net.diagnostics).toEqual([]);
    expect(tail(r.s['R1.v'])).toBeGreaterThan(23);
    expect(tail(r.s['R1.v'])).toBeLessThan(24.5);
  });

  it('thyristor bridge (6.2): V_d ≈ 1.35 U cos α − overlap drop', () => {
    const { r } = runTemplate('rectifier');
    const w = lastPeriods(r.t, 50)!;
    const vd = stats(r.t, r.s['PD1.vd'], w).mean;
    const Id = stats(r.t, r.s['L1.i'], w).mean;
    const ideal = ((3 * Math.SQRT2) / Math.PI) * 400 * Math.cos(Math.PI / 6) - (3 / Math.PI) * 2 * Math.PI * 50 * 2e-4 * Id;
    expect(Math.abs(vd - ideal) / ideal).toBeLessThan(0.03);
  });

  it('thyristor bridge: the mean DC voltage follows cos α (α = 75°)', () => {
    const { r } = runTemplate('rectifier', { 'PD1.alpha': 75 });
    const w = lastPeriods(r.t, 50)!;
    const vd = stats(r.t, r.s['PD1.vd'], w).mean;
    const Id = stats(r.t, r.s['L1.i'], w).mean;
    const ideal = ((3 * Math.SQRT2) / Math.PI) * 400 * Math.cos((75 * Math.PI) / 180) - (3 / Math.PI) * 2 * Math.PI * 50 * 2e-4 * Id;
    expect(Math.abs(vd - ideal)).toBeLessThan(0.04 * 540);
  });

  it('PWM inverter (6.3): fundamental of each phase = m·Vdc/2, balanced currents', () => {
    const { r } = runTemplate('inverter');
    const w = lastPeriods(r.t, 50)!;
    const s = spectrum(r.t, r.s['OND1.va'].map((v) => v - 300), 50, w);
    expect(s.amp[1]).toBeGreaterThan(0.95 * 240);
    expect(s.amp[1]).toBeLessThan(1.05 * 240);
    const k = r.t.length - 1;
    expect(Math.abs(r.s['OND1.ia'][k] + r.s['OND1.ib'][k] + r.s['OND1.ic'][k])).toBeLessThan(0.05 * Math.max(...r.s['OND1.ia']));
  });

  it('transformer inrush (4.2): zero-crossing switching with residual flux saturates the core', () => {
    const rated = (Math.SQRT2 * 1000) / 230;
    const bad = Math.max(...runTemplate('inrush').r.s['TR1.i1'].map(Math.abs));
    expect(bad).toBeGreaterThan(4 * rated);
    // Switching at the voltage peak with no residual flux: no inrush.
    const good = Math.max(...runTemplate('inrush', { 'TR1.psiR': 0, 'V1.ph': 0 }).r.s['TR1.i1'].map(Math.abs));
    expect(good).toBeLessThan(0.1 * rated);
  });
});
