import { describe, expect, it } from 'vitest';
import { circuitEquations, nodalMatrix } from './circuitEqs';
import { buildNetlist, compile } from './compile';
import { TEMPLATES } from './templates';

const tpl = (id: string) => TEMPLATES.find((t) => t.id === id)!.doc();
const ui = () => ({ selected: () => null, bodeIn: () => null, zAt: () => null });
const defaults = (exp: ReturnType<typeof compile>['exp']) => Object.fromEntries(exp.params.map((p) => [p.id, p.default]));

describe('Atelier compiler', () => {
  it('joins wired ports into nodes, with the ground at 0', () => {
    const net = buildNetlist(tpl('rlc-step'));
    expect(net.nNodes).toBe(4);
    expect(net.node['GND1:g']).toBe(0);
    expect(net.node['V1:b']).toBe(0);
    expect(net.node['V1:a']).toBe(net.node['R1:a']);
    expect(net.diagnostics).toEqual([]);
  });

  it('the lesson 1.2 template reproduces the closed-form step response', () => {
    const { exp } = compile(tpl('rlc-step'), ui(), circuitEquations);
    const p = defaults(exp);
    const run = exp.model.simulate(p, p.T);
    const V = 10, R = 2, L = 0.01, C = 1e-4, a = R / (2 * L), wd = Math.sqrt(1 / (L * C) - a * a);
    let e = 0;
    run.t.forEach((t, k) => (e = Math.max(e, Math.abs(run.s['L1.i'][k] - (V / (L * wd)) * Math.exp(-a * t) * Math.sin(wd * t)))));
    expect(e / (V / (L * wd))).toBeLessThan(2e-3);
    expect(exp.signals.find((s) => s.id === 'L1.i')!.on).toBe(true);
  });

  it('the AC template settles to the phasor solution at resonance', () => {
    const { exp } = compile(tpl('rlc-ac'), ui(), circuitEquations);
    const p = defaults(exp);
    const run = exp.model.simulate(p, p.T);
    const n = run.t.length - 1;
    const peak = Math.max(...Array.from(run.s['R1.i'].slice(Math.round(n * 0.85))).map(Math.abs));
    expect(peak).toBeCloseTo(10 / 5, 1);
  });

  it('meters read the RC charge after the switch closes', () => {
    const { exp } = compile(tpl('rc-switch'), ui(), circuitEquations);
    const p = defaults(exp);
    const run = exp.model.simulate(p, p.T);
    const k = run.t.findIndex((t) => t >= 0.001 + 1e-3);
    expect(run.s['VM1.v'][k] / 5).toBeCloseTo(1 - Math.exp(-1), 2);
  });

  it('missing ground and loose terminals are reported', () => {
    const d = tpl('rlc-step');
    d.elements = d.elements.filter((e) => e.type !== 'gnd');
    d.wires = d.wires.filter((w) => w.b.el !== 'GND1');
    d.wires = d.wires.filter((w) => w.id !== 'w3');
    const net = buildNetlist(d);
    expect(net.diagnostics.some((x) => /masse/.test(x.text.fr))).toBe(true);
    expect(net.diagnostics.filter((x) => /reliée/.test(x.text.fr)).length).toBe(2);
  });

  it('the nodal matrix of a resistor divider', () => {
    const d = tpl('rlc-step');
    const { exp, net } = compile(d, ui(), circuitEquations);
    const { A, names } = nodalMatrix(net, defaults(exp));
    expect(names).toEqual(['v_{1}', 'v_{2}', 'v_{3}', 'i_{\\text{V1}}']);
    expect(A[0][0]).toBeCloseTo(0.5, 9); // 1/R at the source node
    expect(A[0][3]).toBe(1);
  });

  it('equations follow the selection', () => {
    let sel: string | null = null;
    const { exp } = compile(tpl('rlc-step'), { ...ui(), selected: () => sel }, circuitEquations);
    expect(exp.equations[0].id).toBe('circuit');
    sel = 'C1';
    expect(exp.equations[0].id).toBe('C1.0');
  });
});
