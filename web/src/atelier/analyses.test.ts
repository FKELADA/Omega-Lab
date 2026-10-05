import { describe, expect, it } from 'vitest';
import { cabs } from '../lib/core/linalg';
import { driven, impedanceAt, modalOf, steadyState } from './analyses';
import { circuitEquations } from './circuitEqs';
import { compile } from './compile';
import { lastPeriods, spectrum } from './engine/harmonics';
import { TEMPLATES } from './templates';

const ui = () => ({ selected: () => null, bodeIn: () => null, zAt: () => null });
const build = (id: string) => {
  const { exp, net } = compile(TEMPLATES.find((t) => t.id === id)!.doc(), ui(), circuitEquations);
  const p = Object.fromEntries(exp.params.map((q) => [q.id, q.default]));
  return { exp, net, p };
};

describe('Atelier analyses on the templates', () => {
  it('series RLC: poles from the bench match the closed form; steady state at resonance', () => {
    const { net, p } = build('rlc-ac');
    const a = 5 / (2 * 0.01), wd = Math.sqrt(1 / (0.01 * 1e-4) - a * a);
    const md = modalOf(net, p);
    expect(md.poles.length).toBe(2);
    expect(md.poles[0].s.re).toBeCloseTo(-a, 4);
    expect(Math.abs(md.poles[0].s.im)).toBeCloseTo(wd, 2);
    const ss = steadyState(net, p)!;
    expect(cabs(ss.res.i.V1)).toBeCloseTo(10 / 5, 3);
    expect(cabs(ss.res.v.C1)).toBeCloseTo((10 / 5) * Math.sqrt(0.01 / 1e-4), 2);
  });

  it('Bode: V_C/V of the series RLC peaks at Q = 2 at f0', () => {
    const { net, p } = build('rlc-ac');
    const f0 = 1 / (2 * Math.PI * Math.sqrt(0.01 * 1e-4));
    expect(cabs(driven(net, p, 'V1', f0).v.C1)).toBeCloseTo(2, 3);
  });

  it('tank circuit: |Z| peaks at R = 100 Ω at the LC resonance', () => {
    const { net, p } = build('tank');
    const f0 = 1 / (2 * Math.PI * Math.sqrt(0.01 * 1e-5));
    expect(cabs(impedanceAt(net, p, 'Z1', f0))).toBeCloseTo(100, 2);
    expect(cabs(impedanceAt(net, p, 'Z1', f0 / 10))).toBeLessThan(10);
  });

  it('LC filter: the load voltage has far less THD than the square source', () => {
    const { exp, p } = build('lc-filter');
    const run = exp.model.simulate(p, p.T);
    const w = lastPeriods(run.t, 50)!;
    const src = spectrum(run.t, run.s['V1.v'], 50, w);
    const load = spectrum(run.t, run.s['VM1.v'], 50, w);
    expect(src.thd).toBeGreaterThan(0.4);
    expect(load.thd).toBeLessThan(0.15);
  });
});
