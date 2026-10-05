import { describe, expect, it } from 'vitest';
import { lastPeriods, spectrum } from './engine/harmonics';
import { benchPowerFlow } from './powerflow';
import { runTemplate } from './templates-a3.test';

describe('A4 templates against the lessons', () => {
  it('generator and fault (8.1): a 100 ms fault is ridden through, a 400 ms one loses synchronism', () => {
    const ok = runTemplate('smib');
    const d = ok.r.s['SM1.delta'], Pe = ok.r.s['SM1.Pe'];
    const k = (t: number) => Math.round((t / 3) * (d.length - 1));
    expect(Pe[k(0.95)]).toBeCloseTo(0.8, 1);
    expect(Math.max(...d)).toBeLessThan(180);
    const lost = runTemplate('smib', { 'F1.toff': 1.4 });
    expect(Math.max(...lost.r.s['SM1.delta'])).toBeGreaterThan(360);
  });

  it('motor start (4.5): inrush, then near synchronous speed', () => {
    const { r } = runTemplate('motor');
    const n = r.s['M1.n'];
    expect(n[n.length - 1]).toBeGreaterThan(1440);
    expect(Math.max(...r.s['M1.ia'].map(Math.abs))).toBeGreaterThan(150);
  });

  it('long line (4.1): the wave reaches the open end τ after closing, and overshoots', () => {
    const { r } = runTemplate('line-wave');
    const v = r.s['LG1.va2'], t = r.t;
    const at = (x: number) => v[t.findIndex((q) => q >= x)];
    expect(Math.abs(at(0.0055))).toBeLessThan(1e3); // 0.5 ms after closing: not arrived (τ ≈ 1 ms)
    const Vph = (Math.SQRT2 * 400e3) / Math.sqrt(3);
    expect(Math.max(...v.map(Math.abs))).toBeGreaterThan(1.2 * Vph); // reflection overshoot
  });

  it('power flow (5.1): converges, the load bus sags, and agrees with the steady state within a few per cent', () => {
    const { net, p } = runTemplate('pf-grid');
    const pf = benchPowerFlow(net, p);
    expect(pf.ok).toBe(true);
    const load = pf.buses.find((b) => b.name === 'CH1')!;
    expect(load.V).toBeLessThan(1);
    expect(load.V).toBeGreaterThan(0.85);
    expect(Math.abs(load.V - load.Vss!)).toBeLessThan(0.04);
    expect(pf.losses).toBeGreaterThan(0);
  });

  it('LCL filter (6.4): the grid current is far cleaner than the inverter voltage', () => {
    const { r } = runTemplate('lcl3');
    const w = lastPeriods(r.t, 50)!;
    const vInv = spectrum(r.t, r.s['OND1.va'].map((x) => x - 400), 50, w, 120);
    const iGrid = spectrum(r.t, r.s['Z2.ia'], 50, w, 120);
    expect(vInv.thd).toBeGreaterThan(0.5);
    expect(iGrid.thd).toBeLessThan(0.08);
  });
});
