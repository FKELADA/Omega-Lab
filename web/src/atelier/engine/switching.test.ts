import { describe, expect, it } from 'vitest';
import { runEmt } from './emt';
import { capacitor, inductor, resistor, vsource, waves } from './elements';
import { diode, gates, igbt, thyristor } from './switching';
import { lastPeriods, stats } from './harmonics';

describe('switching elements', () => {
  it('half-wave rectifier: the diode passes the positive half only', () => {
    // 1 —V(10 V, 50 Hz)— 0 ; 1 —D→ 2 —R— 0
    const els = [vsource('V', 1, 0, waves.ac(10, 50, 0)), diode('D', 1, 2), resistor('R', 2, 0, 100)];
    const r = runEmt(3, els, 0.04, 800, 20);
    const vr = r.v.R;
    expect(Math.max(...vr)).toBeCloseTo(10, 1);
    expect(Math.min(...vr)).toBeGreaterThan(-1e-3);
    // mean of a half-wave: V/π
    const st = stats(r.t, vr, lastPeriods(r.t, 50)!);
    expect(st.mean).toBeCloseTo(10 / Math.PI, 1);
  });

  it('buck converter: V_out ≈ D·V_in (lesson 6.1)', () => {
    // 1 —48 V— 0 ; IGBT 1→2 (D = 0.5, 20 kHz) ; diode 0→2 ; L 2→3 ; C, R 3→0
    const h = 1 / (20e3 * 200);
    const els = [
      vsource('V', 1, 0, waves.dc(48)),
      igbt('S', 1, 2, gates.duty(20e3, 0.5)),
      diode('D', 0, 2),
      inductor('L', 2, 3, 200e-6, h),
      capacitor('C', 3, 0, 220e-6, h),
      resistor('R', 3, 0, 10),
    ];
    const T = 0.02, nOut = 2000;
    const r = runEmt(4, els, T, nOut, Math.round(T / h / nOut));
    const end = r.v.R.slice(Math.round(nOut * 0.8));
    const mean = end.reduce((a, b) => a + b, 0) / end.length;
    expect(mean).toBeGreaterThan(23);
    expect(mean).toBeLessThan(24.5);
    expect(r.events).toBeGreaterThan(100);
  });

  it('thyristor fired at 90° cuts the first quarter of each positive half-wave', () => {
    const f = 50;
    const els = [vsource('V', 1, 0, waves.ac(10, f, -90)), thyristor('T', 1, 2, gates.window(f, 90, 60)), resistor('R', 2, 0, 10)];
    // v = 10 sin ωt; fired at 90°: conducts from 90° to 180°.
    const r = runEmt(3, els, 0.02, 400, 40);
    const at = (deg: number) => r.v.R[Math.round((deg / 360) * 400)];
    expect(at(45)).toBeCloseTo(0, 2);
    expect(at(120)).toBeCloseTo(10 * Math.sin((120 * Math.PI) / 180), 1);
    expect(at(270)).toBeCloseTo(0, 2);
  });

  it('CDA: no numerical chatter on an inductor when its diode turns off', () => {
    // RL load through a diode from an AC source: after turn-off, v_L must not oscillate ±.
    const h = 1e-5;
    const els = [vsource('V', 1, 0, waves.ac(10, 50, 0)), diode('D', 1, 2), resistor('R', 2, 3, 1), inductor('L', 3, 0, 0.01, h)];
    const r = runEmt(4, els, 0.04, 4000, 1);
    // While the diode is off, the inductor current must be ~0 (no sign flipping residue).
    let flips = 0;
    for (let k = 2; k < 4000; k++) if (Math.abs(r.i.L[k]) < 1e-6 && Math.sign(r.v.L[k]) !== Math.sign(r.v.L[k - 1]) && Math.abs(r.v.L[k]) > 0.5) flips++;
    expect(flips).toBeLessThan(3);
  });
});
