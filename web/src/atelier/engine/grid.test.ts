import { describe, expect, it } from 'vitest';
import { runEmt } from './emt';
import { resistor, rlSeries, vsource, waves } from './elements';
import { bergeron, breaker } from './grid';

describe('grid elements', () => {
  it('Bergeron line: an open line doubles the incoming step after the travel time τ', () => {
    // 1 —V step (10 V) behind Zc— 2 ═ line (Zc = 300 Ω, τ = 1 ms) ═ 3 (open, 1 GΩ)
    const Zc = 300, tau = 1e-3;
    const els = [vsource('V', 1, 0, waves.step(10, 0)), resistor('Rs', 1, 2, Zc), bergeron('L', 2, 3, Zc, tau), resistor('Ro', 3, 0, 1e9)];
    const r = runEmt(4, els, 4e-3, 400, 10);
    const at = (t: number) => r.nodes[3][Math.round((t / 4e-3) * 400)];
    expect(at(0.5e-3)).toBeCloseTo(0, 6); // the wave has not arrived
    expect(at(1.5e-3)).toBeCloseTo(10, 3); // 5 V incident wave doubled at the open end
    expect(r.nodes[2][Math.round((0.5e-3 / 4e-3) * 400)]).toBeCloseTo(5, 3); // matched source: half the step enters
  });

  it('breaker: opens only at the next current zero after its order', () => {
    // 1 —V (100 V, 50 Hz)— 0 ; 1 —breaker— 2 —R+L— 0. Ordered open at 5 ms (current peak region).
    const els = [vsource('V', 1, 0, waves.ac(100, 50, 0)), breaker('B', 1, 2, 0.005, 0), rlSeries('Z', 2, 0, 1, 0.01, 1e-5)];
    const r = runEmt(3, els, 0.04, 4000, 1);
    const k5 = 500;
    expect(Math.abs(r.i.B[k5 + 5])).toBeGreaterThan(1); // still conducting just after the order
    const last = r.i.B.slice(3000);
    expect(Math.max(...last.map(Math.abs))).toBeLessThan(1e-3); // interrupted
    // The interruption happened at a zero crossing: no large di/dt step at the opening instant.
    let kOpen = k5;
    while (kOpen < 4000 && Math.abs(r.i.B[kOpen]) > 1e-3) kOpen++;
    expect(Math.abs(r.i.B[kOpen - 1])).toBeLessThan(0.3);
  });
});
