import { describe, expect, it } from 'vitest';
import { gflGfmInfo, GRID_EVENTS, vscInfo } from './module7';
import { CP_MAX, cp, LAMBDA_OPT, powerCurve, pvCurve, pvInfo, V_RATED, windInfo, PV_SCAN } from './module7b';
import { bessInfo, BESS_MODES, dcFaultCurrent, frtInfo, mmcInfo, MMC_SM, nlmThd, PROTECTION } from './module7c';

describe('VSC control (7.1)', () => {
  const base = { fc: 500, fpll: 20, fouter: 5, SCR: 10, Pset: 0.8, Qset: 0.3 };
  it('tracks P and Q setpoints, decoupled', () => {
    const k = vscInfo(base);
    expect(k.unstable).toBe(false);
    expect(k.Pend).toBeCloseTo(0.8, 2);
    expect(k.Qend).toBeCloseTo(0.3, 2);
    expect(k.couplingQ).toBeLessThan(0.02);
  });
  it('the outer-loop bandwidth sets the rise time (≈ 0.35/f)', () => {
    expect(vscInfo(base).riseP).toBeCloseTo(0.35 / 5, 2);
    expect(vscInfo({ ...base, fouter: 30 }).riseP).toBeLessThan(0.02);
  });
  it('the current limit gives priority to P', () => {
    const k = vscInfo({ ...base, Pset: 1, Qset: 0.8 });
    expect(k.limited).toBe(true);
    expect(k.Pend).toBeCloseTo(1, 1);
    expect(k.Qend).toBeLessThan(0.75);
  });
  it('a fast PLL on a weak grid is unstable; the same PLL on a stronger grid is not', () => {
    expect(vscInfo({ ...base, SCR: 1.5, fpll: 100 }).unstable).toBe(true);
    expect(vscInfo({ ...base, SCR: 3, fpll: 100 }).unstable).toBe(false);
    expect(vscInfo({ ...base, SCR: 1.5, fpll: 20 }).unstable).toBe(false);
  });
});

describe('grid-following vs grid-forming (7.2)', () => {
  const base = { event: GRID_EVENTS.phase, SCR: 5, H: 2, fpll: 20 };
  it('a phase jump moves the grid-forming power at once, not the grid-following one', () => {
    const k = gflGfmInfo(base);
    expect(k.dPgfm).toBeGreaterThan(0.5);
    expect(k.dPgfm).toBeGreaterThan(10 * k.dPgfl);
  });
  it('in a frequency drop the grid-forming unit supplies inertia and droop, more with more H', () => {
    const r = (H: number) => gflGfmInfo({ ...base, event: GRID_EVENTS.rocof, H });
    expect(r(2).dPgfmEnd).toBeCloseTo(0.5 / (50 * 0.05), 1); // droop share at 49.5 Hz
    expect(r(8).dPgfm).toBeGreaterThan(r(2).dPgfm + 0.15);
    expect(Math.abs(r(2).dPgflEnd)).toBeLessThan(0.01);
  });
  it('on a very weak grid the fast-PLL follower fails while the former holds', () => {
    expect(gflGfmInfo({ ...base, SCR: 1.3, fpll: 100 }).gflUnstable).toBe(true);
  });
});

describe('PV (7.3)', () => {
  it('the curve has one maximum near 30 V at standard conditions, lower when hot', () => {
    const c = pvCurve(1000, 25, 0);
    expect(c.Isc).toBeCloseTo(9.5, 1);
    expect(c.Voc).toBeCloseTo(37.8, 0);
    expect(c.peaks).toHaveLength(1);
    expect(pvCurve(1000, 65, 0).peaks[0].P).toBeLessThan(0.88 * c.peaks[0].P);
  });
  it('power scales with irradiance', () => {
    expect(pvCurve(500, 25, 0).peaks[0].P / pvCurve(1000, 25, 0).peaks[0].P).toBeCloseTo(0.5, 1);
  });
  it('P&O tracks above 99 % with a small step and oscillates with a large one', () => {
    const b = { G: 1000, T: 25, cloud: 0.5, dV: 0.5, shade: 0, scan: PV_SCAN.off };
    expect(pvInfo(b).efficiency).toBeGreaterThan(0.99);
    expect(pvInfo({ ...b, dV: 3 }).ripple).toBeGreaterThan(5 * pvInfo(b).ripple);
  });
  it('shading makes two peaks; P&O sticks to the local one, a scan finds the global one', () => {
    const b = { G: 1000, T: 25, cloud: 0.5, dV: 0.5, shade: 0.6, scan: PV_SCAN.off };
    expect(pvCurve(1000, 25, 0.6).peaks.length).toBe(2);
    expect(pvInfo(b).stuckLocal).toBe(true);
    expect(pvInfo({ ...b, scan: PV_SCAN.on }).stuckLocal).toBe(false);
  });
});

describe('wind (7.4)', () => {
  it('Heier’s Cp peaks near 0.48 at λ ≈ 8.1, below Betz', () => {
    expect(CP_MAX).toBeCloseTo(0.48, 2);
    expect(LAMBDA_OPT).toBeCloseTo(8.1, 0);
    expect(CP_MAX).toBeLessThan(16 / 27);
    expect(cp(LAMBDA_OPT, 10)).toBeLessThan(0.6 * CP_MAX);
  });
  it('the power curve follows v³ below rated, caps above, stops beyond cut-out', () => {
    expect(powerCurve(8) / powerCurve(4)).toBeCloseTo(8, 1);
    expect(powerCurve(15)).toBeCloseTo(2, 6);
    expect(powerCurve(26)).toBe(0);
    expect(V_RATED).toBeGreaterThan(10);
  });
  it('below rated the turbine runs at λopt without pitch; above, pitch holds rated power through a gust', () => {
    expect(windInfo({ v: 8, gust: 0, Hsyn: 0 }).maxBeta).toBe(0);
    const k = windInfo({ v: 15, gust: 6, Hsyn: 0 });
    expect(k.maxBeta).toBeGreaterThan(10);
    expect(k.Ppeak).toBeLessThan(2.1);
  });
  it('synthetic inertia adds power during the event, then a recovery dip', () => {
    const k = windInfo({ v: 8, gust: 0, Hsyn: 6 });
    expect(k.extraP).toBeGreaterThan(0.15);
    expect(k.recoveryDip).toBeGreaterThan(0.01);
    expect(windInfo({ v: 8, gust: 0, Hsyn: 0 }).extraP).toBeLessThan(0.001);
  });
});

describe('battery FFR (7.5)', () => {
  const b = { H: 4, Pb: 0, Eb: 20, tau: 0.2, mode: BESS_MODES.droop };
  it('the initial RoCoF is ΔP·f0/(2HS)', () => {
    expect(bessInfo(b).rocof).toBeCloseTo((-1000 * 50) / (2 * 4 * 30000), 6);
  });
  it('a fast battery raises the nadir; a slow one much less', () => {
    const none = bessInfo(b).nadir;
    const fast = bessInfo({ ...b, Pb: 600 }).nadir, slow = bessInfo({ ...b, Pb: 600, tau: 3 }).nadir;
    expect(fast).toBeGreaterThan(none + 0.15);
    expect(fast - slow).toBeGreaterThan(0.05);
  });
  it('a small battery empties and the frequency dips again', () => {
    const k = bessInfo({ ...b, Pb: 600, Eb: 2 });
    expect(k.empty).toBe(true);
    expect(k.tEmpty!).toBeLessThan(30);
  });
  it('less inertia deepens the nadir; a battery can restore it', () => {
    expect(bessInfo({ ...b, H: 2 }).nadir).toBeLessThan(bessInfo(b).nadir);
    expect(bessInfo({ ...b, H: 2, Pb: 400 }).nadir).toBeGreaterThanOrEqual(49.4);
  });
});

describe('MMC (7.6)', () => {
  const m = { N: 20, C: 0.4, P: 600, balance: 1, sm: MMC_SM.half };
  it('more sub-modules, less distortion', () => {
    expect(nlmThd(4)).toBeGreaterThan(nlmThd(20));
    expect(nlmThd(20)).toBeLessThan(0.05);
  });
  it('sorting keeps the capacitors together; a fixed order lets them drift', () => {
    expect(mmcInfo(m).spread).toBeLessThan(2);
    expect(mmcInfo({ ...m, balance: 0 }).spread).toBeGreaterThan(10);
  });
  it('capacitor ripple scales as 1/C', () => {
    expect(mmcInfo({ ...m, C: 0.2 }).ripple / mmcInfo({ ...m, C: 0.4 }).ripple).toBeCloseTo(2, 0);
  });
  it('a full-bridge extinguishes a DC fault; a half-bridge cannot', () => {
    expect(dcFaultCurrent(MMC_SM.full, 10)).toBe(0);
    expect(dcFaultCurrent(MMC_SM.half, 15)).toBeGreaterThan(10);
  });
});

describe('fault ride-through (7.7)', () => {
  const f = { Vres: 0.5, dur: 0.15, K: 2, prot: PROTECTION.legacy, ramp: 5 };
  it('a legacy relay trips on a dip the code says to ride through', () => {
    const k = frtInfo(f);
    expect(k.below).toBe(false);
    expect(k.tripped).toBe(true);
    expect(k.compliant).toBe(false);
  });
  it('the compliant setting rides through and injects K·(ΔV − 0.1) within 60 ms', () => {
    const k = frtInfo({ ...f, prot: PROTECTION.frt });
    expect(k.tripped).toBe(false);
    expect(k.iqDip).toBeCloseTo(0.8, 1);
    expect(k.tRise).toBeLessThan(60);
    expect(k.compliant).toBe(true);
  });
  it('a deep dip saturates the reactive current; one below the envelope may trip', () => {
    expect(frtInfo({ ...f, prot: PROTECTION.frt, Vres: 0.05 }).iqDip).toBeGreaterThan(1.05);
    const k = frtInfo({ ...f, prot: PROTECTION.frt, Vres: 0.1, dur: 0.6 });
    expect(k.below).toBe(true);
    expect(k.tripped).toBe(true);
  });
  it('a slow ramp delays the recovery of active power', () => {
    const fast = frtInfo({ ...f, prot: PROTECTION.frt }).tRecover!, slow = frtInfo({ ...f, prot: PROTECTION.frt, ramp: 0.5 }).tRecover!;
    expect(slow).toBeGreaterThan(5 * fast);
  });
});
