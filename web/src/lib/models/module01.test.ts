import { describe, expect, it } from 'vitest';
import { SYS, blackout, blackoutInfo, dayGrid, dayInfo, demandAt, lineLoss } from './module0';
import { CAP_PER_KM, DRIVES, ELEMENTS, MEDIA, dcAcInfo, element } from './module1b';

describe('a day on the grid (0.1)', () => {
  const base = { pv: 10, wind: 5, base: 40, kV: 63 };
  it('flexible generation closes the balance at every instant', () => {
    const run = dayGrid.simulate(base, 24);
    run.t.forEach((_, k) => {
      const s = run.s;
      expect(s.demand[k] - s.pv[k] - s.wind[k] - s.base[k] - s.flex[k]).toBeCloseTo(0, 9);
    });
  });
  it('demand peaks around 19 h', () => {
    let best = 0;
    for (let t = 0; t <= 24; t += 0.05) if (demandAt(t) > demandAt(best)) best = t;
    expect(best).toBeGreaterThan(18);
    expect(best).toBeLessThan(20);
  });
  it('line losses fall as 1/V²: about 2 % at 400 kV, impossible at 20 kV', () => {
    expect(lineLoss(400).share).toBeCloseTo(0.0187, 3);
    expect(lineLoss(20).share).toBeGreaterThan(1);
    expect(lineLoss(225).share / lineLoss(400).share).toBeCloseTo((400 / 225) ** 2, 9);
  });
  it('the default day is balanced; 30 GW of PV breaks the midday floor', () => {
    expect(dayInfo({ ...base, base: 45 }).balanced).toBe(true);
    expect(dayInfo({ ...base, base: 45, pv: 30 }).flexMin).toBeLessThan(0);
  });
});

describe('blackout replay (0.2)', () => {
  const base = { H: 4, loss: 1000, reserve: 1000, Tg: 8, rocofOn: 1, lfddOn: 1 };
  it('initial RoCoF is f0·ΔP / (2 H S)', () => {
    const run = blackout.simulate(base, 60);
    const k = run.t.findIndex((t) => t > SYS.tLoss + 0.01);
    const rocofOff = blackoutInfo({ ...base, rocofOn: 0 }).rocof0;
    expect(rocofOff).toBeCloseTo((50 * 1000) / (2 * 4 * 30000), 9);
    expect(run.s.rocof[k]).toBeLessThan(0);
  });
  it('defaults replay the cascade: loss, RoCoF trip of embedded generation, load shedding', () => {
    const k = blackoutInfo(base);
    expect(k.events.map((e) => e.kind)).toEqual(['loss', 'embedded', 'lfdd']);
    expect(k.nadir).toBeLessThan(48.8 + 0.05);
  });
  it('without RoCoF tripping, the same loss is contained above 48.8 Hz', () => {
    const k = blackoutInfo({ ...base, rocofOn: 0 });
    expect(k.shed).toBe(false);
    expect(k.nadir).toBeGreaterThan(48.8);
  });
  it('lower inertia means a deeper nadir', () => {
    const lo = blackoutInfo({ ...base, rocofOn: 0, lfddOn: 0, H: 2 }).nadir;
    const hi = blackoutInfo({ ...base, rocofOn: 0, lfddOn: 0, H: 8 }).nadir;
    expect(lo).toBeLessThan(hi);
  });
  it('settles where reserve and load damping cover the loss', () => {
    const p = { ...base, rocofOn: 0, lfddOn: 0, reserve: 2000 };
    const run = blackout.simulate(p, 60);
    const fEnd = run.s.f[run.t.length - 1];
    const df = fEnd - 50; // reserve at −df/0.5·R (< R), damping kL·df
    const covered = Math.min(2000, (-df / 0.5) * 2000) + 0.02 * 30000 * -df;
    expect(covered / 1000).toBeCloseTo(1, 2);
  });
});

describe('R, L, C as energy elements (1.1)', () => {
  const base = { el: ELEMENTS.L, wave: DRIVES.triangle, A: 2, f: 50, R: 10, L: 0.1, C: 100e-6, rise: 1e-3 };
  it('a triangle current through L gives a square voltage ±4·L·A·f', () => {
    const run = element.simulate(base, element.window(base));
    const vmax = Math.max(...run.s.v), vmin = Math.min(...run.s.v);
    expect(vmax).toBeCloseTo(4 * 0.1 * 2 * 50, 9);
    expect(vmin).toBeCloseTo(-4 * 0.1 * 2 * 50, 9);
  });
  it('L and C return all their energy each period; R never does', () => {
    for (const el of [ELEMENTS.L, ELEMENTS.C]) {
      const p = { ...base, el, wave: DRIVES.sine };
      const run = element.simulate(p, 1 / 50, 4001);
      let e = 0;
      for (let k = 1; k < run.t.length; k++) e += 0.5 * (run.s.p[k] + run.s.p[k - 1]) * (run.t[k] - run.t[k - 1]);
      expect(Math.abs(e) / Math.max(...run.s.w)).toBeLessThan(1e-3);
    }
    const run = element.simulate({ ...base, el: ELEMENTS.R }, 0.04);
    expect(Math.min(...run.s.p)).toBeGreaterThanOrEqual(0);
  });
  it('a fast current edge makes a large inductor voltage L·A/t_rise', () => {
    const p = { ...base, wave: DRIVES.trapezoid, rise: 1e-4 };
    const run = element.simulate(p, element.window(p), 4000);
    expect(Math.max(...run.s.v)).toBeCloseTo((0.1 * 2) / 1e-4, 6);
  });
});

describe('DC versus AC (1.5)', () => {
  it('break-even near 500 km overhead and 100 km in cable', () => {
    expect(dcAcInfo({ km: 100, medium: MEDIA.overhead, kV: 400 }).breakEven).toBeCloseTo(500, 9);
    expect(dcAcInfo({ km: 100, medium: MEDIA.cable, kV: 400 }).breakEven).toBeCloseTo(100, 9);
  });
  it('a 400 kV AC cable is used up by its own charging current after ~100 km', () => {
    const k = dcAcInfo({ km: 50, medium: MEDIA.cable, kV: 400 });
    expect(k.chargingPerKm).toBeCloseTo(2 * Math.PI * 50 * CAP_PER_KM[MEDIA.cable] * (400e3 / Math.sqrt(3)), 9);
    expect(k.criticalKm).toBeGreaterThan(90);
    expect(k.criticalKm).toBeLessThan(120);
    expect(dcAcInfo({ km: 150, medium: MEDIA.cable, kV: 400 }).usableAC).toBe(0);
  });
});
