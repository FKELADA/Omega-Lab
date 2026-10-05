import { describe, expect, it } from 'vitest';
import { runEmt } from './emt';
import { ammeter, capacitor, inductor, resistor, timedSwitch, voltmeter, vsource, waves } from './elements';

const maxErr = (a: Float64Array, f: (k: number) => number) => {
  let e = 0, m = 0;
  for (let k = 0; k < a.length; k++) (e = Math.max(e, Math.abs(a[k] - f(k)))), (m = Math.max(m, Math.abs(f(k))));
  return e / m;
};

describe('EMT engine', () => {
  it('DC source and resistor divider: Ohm’s law, source delivers current', () => {
    // 1 — 10 V — 0 ; 1 — R1=2 — 2 — R2=3 — 0
    const els = [vsource('V', 1, 0, waves.dc(10)), resistor('R1', 1, 2, 2), resistor('R2', 2, 0, 3)];
    const r = runEmt(3, els, 1e-2, 10, 10);
    expect(r.nodes[2][10]).toBeCloseTo(6, 9);
    expect(r.i.V[10]).toBeCloseTo(2, 9);
    expect(r.i.R1[10]).toBeCloseTo(2, 9);
  });

  it('series RLC step response matches the closed form (lesson 1.2) within 0.1 %', () => {
    const V = 10, R = 2, L = 0.01, C = 1e-4, T = 0.07, nOut = 1400, sub = 40;
    const h = T / (nOut * sub);
    // 1 —V— 0 ; 1 —R— 2 —L— 3 —C— 0
    const els = [vsource('V', 1, 0, waves.dc(V)), resistor('R', 1, 2, R), inductor('L', 2, 3, L, h), capacitor('C', 3, 0, C, h)];
    const r = runEmt(4, els, T, nOut, sub);
    const a = R / (2 * L), w0 = 1 / Math.sqrt(L * C), wd = Math.sqrt(w0 * w0 - a * a);
    const iExact = (k: number) => (V / (L * wd)) * Math.exp(-a * r.t[k]) * Math.sin(wd * r.t[k]);
    expect(maxErr(r.i.L, iExact)).toBeLessThan(1e-3);
    // Kirchhoff’s voltage law at every sample
    for (let k = 1; k <= nOut; k += 97) expect(r.v.R[k] + r.v.L[k] + r.v.C[k]).toBeCloseTo(V, 6);
  });

  it('AC source on series RLC at resonance: steady current V/R in phase (lesson 1.4)', () => {
    const Vpk = 10, R = 5, L = 0.01, C = 1e-4, f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const T = 0.3, nOut = 6000, sub = 10, h = T / (nOut * sub);
    const els = [vsource('V', 1, 0, waves.ac(Vpk, f0, 0)), resistor('R', 1, 2, R), inductor('L', 2, 3, L, h), capacitor('C', 3, 0, C, h)];
    const r = runEmt(4, els, T, nOut, sub);
    // last period: compare with the phasor steady state Vpk/R cos(ωt)
    const k0 = Math.round(nOut * 0.9);
    let e = 0;
    for (let k = k0; k <= nOut; k++) e = Math.max(e, Math.abs(r.i.R[k] - (Vpk / R) * Math.cos(2 * Math.PI * f0 * r.t[k])));
    expect(e / (Vpk / R)).toBeLessThan(5e-3);
  });

  it('switch, ammeter and voltmeter: RC charging after the switch closes', () => {
    const V = 5, R = 1e3, C = 1e-6, tau = R * C, T = 6e-3, nOut = 600, sub = 20, h = T / (nOut * sub);
    // 1 —V— 0 ; 1 —S— 2 —A— 3 —R— 4 —C— 0 ; voltmeter across C
    const els = [
      vsource('V', 1, 0, waves.dc(V)),
      timedSwitch('S', 1, 2, 1e-3, 0),
      ammeter('A', 2, 3),
      resistor('R', 3, 4, R),
      capacitor('C', 4, 0, C, h),
      voltmeter('VM', 4, 0),
    ];
    const r = runEmt(5, els, T, nOut, sub);
    const k = Math.round(nOut * (1e-3 + 2 * tau) / T);
    expect(r.v.VM[Math.round(nOut * 0.9e-3 / T)]).toBeCloseTo(0, 3);
    expect(r.v.VM[k] / V).toBeCloseTo(1 - Math.exp(-2), 2);
    expect(r.i.A[k]).toBeCloseTo((V / R) * Math.exp(-2), 4);
  });
});
