import { describe, expect, it } from 'vitest';
import { runTemplate } from './templates-a3.test';

const tail = (y: Float64Array, from = 0.9) => y.slice(Math.round(y.length * from));
const range = (y: Float64Array) => Math.max(...y) - Math.min(...y);
const at = (r: { t: Float64Array }, y: Float64Array, t: number) => y[r.t.findIndex((q) => q >= t)];

describe('A5 templates against the lessons', () => {
  it('PI loop built from blocks: no steady-state error', () => {
    const { r } = runTemplate('control-pi');
    for (const v of tail(r.s['CV1.y'])) expect(v).toBeCloseTo(5, 2);
  });

  it('grid-following inverter on a weak grid (7.1, 8.5): stable with a slow PLL, oscillating with a fast one', () => {
    const slow = runTemplate('gfl-weak').r.s['GFL1.P'];
    expect(range(tail(slow))).toBeLessThan(0.01);
    expect(tail(slow)[0]).toBeGreaterThan(0.75);
    const fast = runTemplate('gfl-weak', { 'GFL1.fpll': 120 }).r.s['GFL1.P'];
    expect(range(tail(fast, 0.6))).toBeGreaterThan(0.1);
    expect(fast.every(Number.isFinite)).toBe(true);
  });

  it('phase jump (7.2): the grid-forming inverter responds, the grid-following one hardly', () => {
    const { r } = runTemplate('gfm-gfl');
    const k = r.t.findIndex((t) => t >= 0.49);
    const dP = (s: Float64Array) => Math.max(...s.slice(k).map((v) => Math.abs(v - s[k])));
    expect(dP(r.s['GFM1.P'])).toBeGreaterThan(20 * dP(r.s['GFL1.P']));
  });

  it('battery (7.5, 8.4): a stiffer droop holds the frequency higher after a load step', () => {
    const fmin = (over = {}) => {
      const { r } = runTemplate('bess-ffr', over);
      return Math.min(...r.s['SM1.f'].slice(r.t.findIndex((t) => t > 1)));
    };
    const strong = fmin(), weak = fmin({ 'BAT1.R': 0.2 });
    expect(strong).toBeGreaterThan(weak + 0.15);
    const { r } = runTemplate('bess-ffr');
    expect(at(r, r.s['SM1.f'], 1.9)).toBeCloseTo(50, 1);
  });

  it('PV plant (7.3): the MPPT tracks the maximum before and after the cloud', () => {
    const { r } = runTemplate('pv-mppt');
    expect(at(r, r.s['PV1.P'], 0.95) / at(r, r.s['PV1.Pmpp'], 0.95)).toBeGreaterThan(0.97);
    const n = r.t.length - 1;
    expect(r.s['PV1.P'][n] / r.s['PV1.Pmpp'][n]).toBeGreaterThan(0.97);
    expect(r.s['PV1.Pmpp'][n]).toBeLessThan(0.5);
  });

  it('wind turbine (7.4): power follows the cube of the wind, the rotor stays under 1 pu', () => {
    const { r } = runTemplate('wind');
    expect(at(r, r.s['EOL1.P'], 0.9)).toBeCloseTo((9 / 12) ** 3, 1);
    expect(Math.max(...r.s['EOL1.P'])).toBeGreaterThan(0.6);
    expect(Math.max(...r.s['EOL1.w'])).toBeLessThan(1.05);
  });

  it('MMC HVDC link (7.6): one station holds V_dc, the other carries 0.8 pu', () => {
    const { r } = runTemplate('hvdc');
    for (const v of tail(r.s['MMC1.Vdc'])) expect(Math.abs(v - 400e3) / 400e3).toBeLessThan(0.02);
    expect(tail(r.s['MMC2.P'])[0]).toBeCloseTo(0.8, 2);
    expect(tail(r.s['MMC1.P'])[0]).toBeLessThan(-0.78);
  });
});
