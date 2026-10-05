import { describe, expect, it } from 'vitest';
import { cabs, carg, cx, type Complex } from '../../lib/core/linalg';
import { solveAc, type AcItem } from './ac';
import { capacitor, inductor, resistor, vsource, waves } from './elements';
import { modal } from './modal';

const Y = (y: (p: Record<string, number>, w: number) => Complex) => ({ kind: 'Y' as const, y });
const R = (id: string, a: number, b: number, r: number): AcItem => ({ id, nodes: [a, b], p: {}, model: Y(() => cx(1 / r)) });
const Lx = (id: string, a: number, b: number, l: number): AcItem => ({ id, nodes: [a, b], p: {}, model: Y((_, w) => ({ re: 0, im: -1 / (w * l) })) });
const Cx = (id: string, a: number, b: number, c: number): AcItem => ({ id, nodes: [a, b], p: {}, model: Y((_, w) => ({ re: 0, im: w * c })) });
const V = (id: string, a: number, b: number): AcItem => ({ id, nodes: [a, b], p: {}, model: { kind: 'V', phasor: () => cx(1) } });

describe('AC nodal analysis', () => {
  // Series RLC: 1 —V— 0 ; 1 —R— 2 —L— 3 —C— 0
  const Rv = 5, Lv = 0.01, Cv = 1e-4, f0 = 1 / (2 * Math.PI * Math.sqrt(Lv * Cv));
  const items = [V('V', 1, 0), R('R', 1, 2, Rv), Lx('L', 2, 3, Lv), Cx('C', 3, 0, Cv)];
  const at = (f: number) => solveAc(4, items, 2 * Math.PI * f, () => 'unit');

  it('at resonance the current is V/R, in phase, and V_C = Q·V', () => {
    const r = at(f0);
    expect(cabs(r.i.V)).toBeCloseTo(1 / Rv, 9);
    expect(carg(r.i.V)).toBeCloseTo(0, 9);
    expect(cabs(r.v.C)).toBeCloseTo(Math.sqrt(Lv / Cv) / Rv, 6);
  });

  it('the transfer V_C/V matches the closed form at any frequency', () => {
    for (const f of [10, 100, 500, 3000]) {
      const w = 2 * Math.PI * f;
      const H = 1 / Math.hypot(1 - w * w * Lv * Cv, w * Rv * Cv);
      expect(cabs(at(f).v.C)).toBeCloseTo(H, 9);
    }
  });
});

describe('Modal analysis from the EMT step (inverse Tustin)', () => {
  it('finds the series RLC poles exactly, shared equally by L and C', () => {
    const Rv = 2, Lv = 0.01, Cv = 1e-4, h = 1e-5;
    const els = [vsource('V', 1, 0, waves.dc(10)), resistor('R', 1, 2, Rv), inductor('L', 2, 3, Lv, h), capacitor('C', 3, 0, Cv, h)];
    const { poles, states } = modal(4, els, h, 0);
    expect(states).toEqual(['L', 'C']);
    expect(poles.length).toBe(2);
    const a = Rv / (2 * Lv), wd = Math.sqrt(1 / (Lv * Cv) - a * a);
    for (const p of poles) {
      expect(p.s.re).toBeCloseTo(-a, 6);
      expect(Math.abs(p.s.im)).toBeCloseTo(wd, 4);
      expect(p.part[0]).toBeCloseTo(0.5, 6);
    }
  });

  it('an RC and an RL in parallel branches give two real poles, each owned by its element', () => {
    const h = 1e-6;
    // 1 —V— 0 ; 1 —R1(1k)— 2 —C(1µ)— 0 ; 1 —R2(10)— 3 —L(1m)— 0
    const els = [vsource('V', 1, 0, waves.dc(1)), resistor('R1', 1, 2, 1000), capacitor('C', 2, 0, 1e-6, h), resistor('R2', 1, 3, 10), inductor('L', 3, 0, 1e-3, h)];
    const { poles, states } = modal(4, els, h, 0);
    const byRe = [...poles].sort((x, y) => x.s.re - y.s.re);
    expect(byRe[0].s.re).toBeCloseTo(-1e4, 3); // R/L
    expect(byRe[1].s.re).toBeCloseTo(-1e3, 3); // 1/RC
    expect(byRe[0].part[states.indexOf('L')]).toBeCloseTo(1, 6);
    expect(byRe[1].part[states.indexOf('C')]).toBeCloseTo(1, 6);
  });
});
