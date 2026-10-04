import { describe, expect, it } from 'vitest';
import { cabs } from '../core/linalg';
import {
  bridge,
  bridgeInfo,
  BRIDGE,
  chopper,
  chopperInfo,
  CONVERTERS,
  fRes,
  harmonic,
  lclGain,
  lclInfo,
  lclModel,
  overlap,
  pwmInfo,
  PWM,
  PWM_METHODS,
  RdOpt,
  svDwell,
} from './module6';

describe('choppers (6.1)', () => {
  const base = { type: CONVERTERS.buck, D: 0.5, fs: 20, L: 200, C: 220, R: 10 };
  it('in CCM the output follows the ideal ratio for all three topologies', () => {
    expect(chopperInfo(base).Vout).toBeCloseTo(24, 0);
    expect(chopperInfo({ ...base, D: 0.25 }).Vout).toBeCloseTo(12, 0);
    expect(chopperInfo({ ...base, type: CONVERTERS.boost }).Vout).toBeCloseTo(96, 0);
    expect(chopperInfo({ ...base, type: CONVERTERS.buckboost, D: 0.6 }).ratio).toBeCloseTo(1.5, 1);
  });
  it('the buck ripple matches Vout(1 − D)/(L fs)', () => {
    const k = chopperInfo(base);
    expect(k.dIL).toBeCloseTo((24 * 0.5) / (200e-6 * 20e3), 1);
  });
  it('below the critical inductance the current reaches zero and the gain rises', () => {
    const k = chopperInfo({ ...base, L: 20, R: 50 });
    expect(20e-6).toBeLessThan(k.Lcrit);
    expect(k.dcm).toBe(true);
    expect(k.ratio).toBeGreaterThan(0.6);
  });
  it('the inductor voltage averages to zero (volt-second balance)', () => {
    const run = chopper.simulate(base, chopper.window(base));
    const mean = run.s.vL.reduce((s, v) => s + v, 0) / run.s.vL.length;
    expect(Math.abs(mean)).toBeLessThan(0.5);
  });
});

describe('thyristor bridge (6.2)', () => {
  it('a diode bridge gives 1.35 VLL', () => {
    expect(bridgeInfo({ alpha: 0, Ls: 0, Id: 400 }).Vd).toBeCloseTo((3 * Math.SQRT2 * BRIDGE.VLL) / Math.PI, 0);
  });
  it('Vd = Vd0 cos α − 3ωLsId/π, negative beyond 90°', () => {
    const Vd0 = (3 * Math.SQRT2 * BRIDGE.VLL) / Math.PI;
    const k = bridgeInfo({ alpha: 30, Ls: 0.2, Id: 400 });
    expect(k.Vd).toBeCloseTo(Vd0 * Math.cos(Math.PI / 6) - (3 * 100 * Math.PI * 0.2e-3 * 400) / Math.PI, 0);
    expect(bridgeInfo({ alpha: 120, Ls: 0.2, Id: 400 }).Vd).toBeLessThan(0);
  });
  it('the overlap angle satisfies its commutation equation', () => {
    const mu = overlap(30, 0.5, 600)!;
    const lhs = Math.cos(Math.PI / 6) - Math.cos(Math.PI / 6 + mu);
    expect(lhs).toBeCloseTo((2 * 100 * Math.PI * 0.5e-3 * 600) / (Math.SQRT2 * BRIDGE.VLL), 9);
    expect(overlap(150, 2, 1000)).toBeNull();
  });
  it('line-current harmonics are 6k ± 1 at about 1/h without overlap', () => {
    const k = bridgeInfo({ alpha: 0, Ls: 0, Id: 400 });
    expect(k.h[0].pct).toBeCloseTo(20, 0);
    expect(k.h[1].pct).toBeCloseTo(100 / 7, 0);
    const run = bridge.simulate({ alpha: 0, Ls: 0, Id: 400 }, 0.04);
    const t = run.t.slice(0, 1200), i = run.s.ia.slice(0, 1200);
    expect(harmonic(i, t, BRIDGE.f, 3).amp).toBeLessThan(0.01 * harmonic(i, t, BRIDGE.f, 1).amp);
  });
  it('the displacement factor is about cos(α + μ/2)', () => {
    const k = bridgeInfo({ alpha: 30, Ls: 0.2, Id: 400 });
    expect(k.dpf).toBeCloseTo(Math.cos(((30 + k.mu / 2) * Math.PI) / 180), 1);
  });
});

describe('PWM (6.3)', () => {
  it('in the linear range the fundamental is m·√3/2·Vdc', () => {
    for (const m of [0.5, 0.9]) {
      const k = pwmInfo({ m, mf: 21, method: PWM_METHODS.sine });
      expect(k.V1ab / k.V1ideal).toBeCloseTo(1, 2);
    }
  });
  it('third-harmonic and space-vector injection extend the linear range to 2/√3', () => {
    const m = 1.15;
    expect(pwmInfo({ m, mf: 21, method: PWM_METHODS.sine }).V1ab).toBeLessThan(0.97 * pwmInfo({ m, mf: 21, method: PWM_METHODS.sine }).V1ideal);
    for (const method of [PWM_METHODS.third, PWM_METHODS.sv]) {
      const k = pwmInfo({ m, mf: 21, method });
      expect(k.V1ab / k.V1ideal).toBeCloseTo(1, 2);
    }
  });
  it('overmodulation brings 5th and 7th harmonics; linear operation does not', () => {
    const low = (m: number) => pwmInfo({ m, mf: 21, method: PWM_METHODS.sine }).spectrum.filter(([h]) => h === 5 || h === 7).reduce((s, [, p]) => s + p, 0);
    expect(low(0.9)).toBeLessThan(0.5);
    expect(low(1.35)).toBeGreaterThan(2);
  });
  it('SVPWM dwell times add up and reach the edge of the inscribed circle', () => {
    const d = svDwell(2 / Math.sqrt(3), Math.PI / 6);
    expect(d.d1 + d.d2 + d.d0).toBeCloseTo(1, 12);
    expect(d.d0).toBeCloseTo(0, 6); // the inscribed circle touches the hexagon side at 30°
    expect(svDwell(0.8, 0).d1 * (2 / 3) * PWM.Vdc).toBeCloseTo((0.8 * PWM.Vdc) / 2, 6);
  });
});

describe('LCL filter (6.4)', () => {
  const base = { L1: 2, L2: 1, Cf: 10, Rd: 0.5, fs: 10 };
  it('resonates at √((L1 + L2)/(L1 L2 Cf))/2π and rolls off as 1/f³ above it', () => {
    expect(fRes(base)).toBeCloseTo(Math.sqrt(3e-3 / (2e-3 * 1e-3 * 10e-6)) / (2 * Math.PI), 6);
    const g = (f: number) => cabs(lclGain(base, f, 'lcl', 0));
    expect(g(20000) / g(10000)).toBeCloseTo(1 / 8, 1);
  });
  it('at fs the LCL attenuates more than 10 × better than an L filter', () => {
    expect(lclInfo(base).attenuation).toBeLessThan(0.1);
  });
  it('damping crushes the resonance peak', () => {
    const peak = (Rd: number) => Math.max(...Array.from({ length: 200 }, (_, j) => cabs(lclGain(base, fRes(base) * 1.002 ** (j - 100), 'lcl', Rd))));
    expect(peak(RdOpt(base))).toBeLessThan(0.05 * peak(0.01));
  });
  it('the averaged model delivers the reference current, and the switched one follows it', () => {
    const run = lclModel.simulate(base, 0.04);
    const k0 = run.t.findIndex((t) => t > 0.02);
    const t = run.t.slice(k0);
    expect(harmonic(run.s.igAvg.slice(k0), t, 50, 1).amp).toBeCloseTo(10 * Math.SQRT2, 0);
    expect(harmonic(run.s.ig.slice(k0), t, 50, 1).amp).toBeCloseTo(10 * Math.SQRT2, 0);
    expect(lclInfo({ ...base, Cf: 0 }).ripple).toBeGreaterThan(2 * lclInfo({ ...base, Rd: 2.7 }).ripple);
  });
});
