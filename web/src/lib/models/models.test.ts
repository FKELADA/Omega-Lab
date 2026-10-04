import { describe, expect, it } from 'vitest';
import { cabs } from '../core/linalg';
import { inst, rlcAc, rlcAcInfo } from './rlcAc';
import { twoPhasorInfo, twoPhasors } from './twoPhasors';
import { SHAPES, waveform, waveformInfo } from './waveform';

describe('AC-driven series RLC', () => {
  const base = { R: 5, L: 10e-3, C: 100e-6, V: 10 };

  it('settles onto the phasor steady state', () => {
    const p = { ...base, f: 120 };
    const run = rlcAc.simulate(p, rlcAc.window(p));
    const k = rlcAcInfo(p);
    const n = run.t.length;
    // Compare over the last period only, once the transient has died out.
    const T = 1 / p.f;
    let err = 0;
    for (let j = n - 1; run.t[j] > run.t[n - 1] - T; j--)
      err = Math.max(err, Math.abs(run.s.i[j] - inst(k.I, k.omega, run.t[j])));
    expect(err / cabs(k.I)).toBeLessThan(2e-3);
  });

  it('is exact at the drive: v_S follows V cos(ωt) at every sample', () => {
    const p = { ...base, f: 50 };
    const run = rlcAc.simulate(p, 0.1);
    let err = 0;
    run.t.forEach((t, j) => (err = Math.max(err, Math.abs(run.s.vS[j] - p.V * Math.cos(2 * Math.PI * p.f * t)))));
    expect(err).toBeLessThan(1e-9);
  });

  it('peaks at ω0 with current V/R and capacitor voltage Q·V', () => {
    const k0 = rlcAcInfo({ ...base, f: 1 });
    const k = rlcAcInfo({ ...base, f: k0.f0 });
    expect(cabs(k.I)).toBeCloseTo(base.V / base.R, 9);
    expect(cabs(k.VC) / base.V).toBeCloseTo(k.Q, 9);
  });

  it('has |I| = I_max/√2 at the half-power frequencies', () => {
    const k = rlcAcInfo({ ...base, f: 1 });
    const Imax = base.V / base.R;
    for (const f of [k.f1, k.f2]) expect(cabs(rlcAcInfo({ ...base, f }).I) / Imax).toBeCloseTo(Math.SQRT1_2, 9);
    expect(k.f2 - k.f1).toBeCloseTo(k.bandwidth, 9);
  });
});

describe('waveforms and RMS', () => {
  const rmsOf = (v: Float64Array) => Math.sqrt(v.slice(0, -1).reduce((a, x) => a + x * x, 0) / (v.length - 1));
  for (const [name, shape] of Object.entries(SHAPES)) {
    it(`numerical RMS matches the closed form for ${name}`, () => {
      const p = { shape, V: 10, R: 4, f: 50 };
      const run = waveform.simulate(p, 1 / p.f, 20001);
      expect(rmsOf(run.s.v) / waveformInfo(p).rms).toBeCloseTo(1, 3);
    });
  }

  it('an average-responding meter reads a square wave 11 % high', () => {
    const k = waveformInfo({ shape: SHAPES.square, V: 1, R: 1 });
    expect(k.avgMeter / k.rms).toBeCloseTo(1.1107, 4);
  });
});

describe('phasor addition', () => {
  it('the sum of two sinusoids is the sinusoid of the summed phasors', () => {
    const p = { A1: 3, phi1: 20, A2: 2, phi2: 140, f: 50 };
    const k = twoPhasorInfo(p);
    const run = twoPhasors.simulate(p, twoPhasors.window(p));
    let err = 0;
    run.t.forEach((t, j) => (err = Math.max(err, Math.abs(run.s.vs[j] - inst(k.S, k.omega, t)))));
    expect(err).toBeLessThan(1e-12);
  });

  it('two unit phasors at 120° and 240° sum to the opposite of the one at 0°', () => {
    // So all three phases of a balanced set sum to zero.
    const k = twoPhasorInfo({ A1: 1, phi1: 120, A2: 1, phi2: 240, f: 50 });
    expect(k.amp).toBeCloseTo(1, 12);
    expect(Math.abs(k.phase)).toBeCloseTo(180, 9);
  });
});

import { KINDS, impedance, impedanceInfo, powerInfo, powerLoad, threePhase, threePhaseInfo } from './acCircuits';
import { fitPhase } from './phasorRun';

describe('impedance (2.2)', () => {
  const base = { V: 230, f: 50, R: 10, L: 0.05, C: 200e-6 };
  it('inductor current lags by 90°, capacitor current leads by 90°', () => {
    expect(impedanceInfo({ ...base, kind: KINDS.L }).phi).toBeCloseTo(90, 9);
    expect(impedanceInfo({ ...base, kind: KINDS.C }).phi).toBeCloseTo(-90, 9);
    expect(impedanceInfo({ ...base, kind: KINDS.R }).phi).toBeCloseTo(0, 9);
  });
  it('RL is at 45° at its corner frequency', () => {
    const p = { ...base, kind: KINDS.RL };
    const fc = impedanceInfo(p).fc!;
    expect(impedanceInfo({ ...p, f: fc }).phi).toBeCloseTo(45, 9);
  });
  it('the sampled current has the phasor phase (fitPhase recovers it)', () => {
    const p = { ...base, kind: KINDS.RL };
    const run = impedance.simulate(p, impedance.window(p));
    const k = impedanceInfo(p);
    const fit = fitPhase([...run.t].map((t, j) => [t, run.s.i[j]]), k.omega);
    expect(fit.phase).toBeCloseTo(-k.phi * (Math.PI / 180), 6);
    expect(fit.amp).toBeCloseTo(Math.SQRT2 * Math.hypot(k.I.re, k.I.im), 6);
  });
});

describe('power and PF correction (2.3)', () => {
  const base = { V: 230, f: 50, P: 10e3, pf: 0.7, C: 0 };
  it('p(t) = P(1 + cos 2ωt) + Q sin 2ωt, and averages to P', () => {
    const run = powerLoad.simulate(base, powerLoad.window(base));
    let err = 0;
    run.t.forEach((_, j) => (err = Math.max(err, Math.abs(run.s.p[j] - run.s.pP[j] - run.s.pQ[j]))));
    expect(err / base.P).toBeLessThan(1e-9);
    const mean = run.s.p.slice(0, -1).reduce((a, b) => a + b, 0) / (run.t.length - 1);
    expect(mean / base.P).toBeCloseTo(1, 3);
  });
  it('the C95 capacitor raises the power factor to exactly 0.95', () => {
    const C = powerInfo(base).C95;
    expect(powerInfo({ ...base, C }).pf).toBeCloseTo(0.95, 9);
  });
  it('correction lowers the line current and the losses, not the active power', () => {
    const a = powerInfo(base), b = powerInfo({ ...base, C: a.C95 });
    expect(b.P).toBeCloseTo(a.P, 6);
    expect(b.loss / a.loss).toBeCloseTo((0.7 / 0.95) ** 2, 6);
  });
});

describe('three-phase (2.4)', () => {
  const base = { V: 230, f: 50, phases: 3, Ra: 50, Rb: 50, Rc: 50, neutral: 1 };
  it('balanced: no neutral current and constant total power', () => {
    const k = threePhaseInfo(base);
    expect(Math.hypot(k.IN.re, k.IN.im)).toBeLessThan(1e-9);
    const run = threePhase.simulate(base, threePhase.window(base));
    const spread = Math.max(...run.s.p) - Math.min(...run.s.p);
    expect(spread / k.P).toBeLessThan(1e-9);
    expect(k.P).toBeCloseTo((3 * 230 * 230) / 50, 6);
  });
  it('single phase: power pulses between 0 and 2P', () => {
    const p = { ...base, phases: 1 };
    const run = threePhase.simulate(p, threePhase.window(p));
    expect(Math.min(...run.s.p) / threePhaseInfo(p).P).toBeLessThan(1e-5); // samples straddle the zero
    expect(Math.max(...run.s.p) / threePhaseInfo(p).P).toBeCloseTo(2, 3);
  });
  it('open neutral with unbalanced loads shifts the star point (Millman)', () => {
    const k = threePhaseInfo({ ...base, Ra: 10, Rb: 200, Rc: 200, neutral: 0 });
    const sumI = k.I.reduce((a, i) => ({ re: a.re + i.re, im: a.im + i.im }), { re: 0, im: 0 });
    expect(Math.hypot(sumI.re, sumI.im)).toBeLessThan(1e-9);
    // The lightly loaded phases see far more than 230 V.
    expect(Math.hypot(k.Vload[1].re, k.Vload[1].im)).toBeGreaterThan(300);
  });
});

import { TARGETS, clarkePark, fourier, fourierB, fourierInfo, parkInfo, perUnitInfo, sequenceInfo } from './module2b';

describe('Clarke and Park (2.5)', () => {
  const base = { V: 230, f: 50, kc: 1, h5: 0, ratio: 1, phi: 0 };
  it('a balanced set is DC in the synchronous frame', () => {
    const run = clarkePark.simulate(base, clarkePark.window(base));
    const pk = Math.SQRT2 * 230;
    run.t.forEach((_, j) => {
      expect(run.s.vd[j] / pk).toBeCloseTo(1, 9);
      expect(run.s.vq[j] / pk).toBeCloseTo(0, 9);
    });
  });
  it('the phase φ of the set appears as the dq angle', () => {
    const run = clarkePark.simulate({ ...base, phi: 30 }, 0.01);
    expect(Math.atan2(run.s.vq[0], run.s.vd[0]) * (180 / Math.PI)).toBeCloseTo(30, 9);
  });
  it('unbalance shows up as negative sequence: a 2ω ripple in dq', () => {
    const k = parkInfo({ ...base, kc: 0.5 });
    expect(k.V2 / k.V1).toBeGreaterThan(0.15);
    const run = clarkePark.simulate({ ...base, kc: 0.5 }, clarkePark.window(base));
    const amp = (Math.max(...run.s.vd) - Math.min(...run.s.vd)) / 2;
    expect(amp / k.V2).toBeCloseTo(1, 2);
  });
});

describe('per-unit (2.6)', () => {
  const base = { Sbase: 100e6, Pload: 10e6, pf: 0.9, tap: 1 };
  it('the result in pu does not depend on the chosen base', () => {
    const a = perUnitInfo(base), b = perUnitInfo({ ...base, Sbase: 10e6 });
    expect(Math.hypot(a.Vload.re, a.Vload.im)).toBeCloseTo(Math.hypot(b.Vload.re, b.Vload.im), 12);
  });
  it('carries the base voltage through the transformer ratios', () => {
    const k = perUnitInfo(base);
    expect(k.zones.map((z) => z.Vb)).toEqual([11e3, 132e3, 33e3]);
    expect(k.zT1.im).toBeCloseTo(0.1 * (100 / 50), 12); // 10 % on 50 MVA → 20 % on 100 MVA
  });
  it('raising the tap raises the load voltage', () => {
    const v = (tap: number) => Math.hypot(perUnitInfo({ ...base, tap }).Vload.re, perUnitInfo({ ...base, tap }).Vload.im);
    expect(v(1.05)).toBeGreaterThan(v(1));
  });
});

describe('Fourier (2.7)', () => {
  it('the partial sums converge on each target (away from jumps)', () => {
    for (const target of Object.values(TARGETS)) {
      const p = { target, N: 49, V: 1, f: 50 };
      const run = fourier.simulate(p, 1 / 50, 721);
      let err = 0;
      // Compare at 15°, 45°, 90°, 165°…: inside smooth stretches of every target.
      for (const d of [15, 45, 90, 100, 165, 260]) err = Math.max(err, Math.abs(run.s.err[d * 2]));
      expect(err).toBeLessThan(0.06);
    }
  });
  it('THD: square 48.3 %, triangle 12.1 %, six-pulse rectifier 31.1 %', () => {
    expect(fourierInfo({ target: TARGETS.square, N: 1 }).thd).toBeCloseTo(0.4834, 3);
    expect(fourierInfo({ target: TARGETS.triangle, N: 1 }).thd).toBeCloseTo(0.1212, 3);
    expect(fourierInfo({ target: TARGETS.rectifier, N: 1 }).thd).toBeCloseTo(0.3108, 3);
  });
  it('the rectifier has only 6k ± 1 harmonics', () => {
    for (let n = 2; n < 30; n++) {
      const nonzero = Math.abs(fourierB(TARGETS.rectifier, n)) > 1e-12;
      expect(nonzero).toBe(n % 2 === 1 && n % 3 !== 0);
    }
  });
});

describe('symmetrical components (2.8)', () => {
  it('balanced: positive sequence only', () => {
    const k = sequenceInfo({ Ma: 1, Mb: 1, Ab: -120, Mc: 1, Ac: 120, f: 50 });
    expect(Math.hypot(k.V1.re, k.V1.im)).toBeCloseTo(1, 12);
    expect(k.vuf).toBeLessThan(1e-12);
  });
  it('b and c swapped: negative sequence only', () => {
    const k = sequenceInfo({ Ma: 1, Mb: 1, Ab: 120, Mc: 1, Ac: -120, f: 50 });
    expect(Math.hypot(k.V2.re, k.V2.im)).toBeCloseTo(1, 12);
    expect(Math.hypot(k.V1.re, k.V1.im)).toBeLessThan(1e-12);
  });
  it('the three sequences rebuild the original phasors', () => {
    const k = sequenceInfo({ Ma: 1, Mb: 0.7, Ab: -100, Mc: 1.2, Ac: 130, f: 50 });
    const sum = { re: k.V0.re + k.V1.re + k.V2.re, im: k.V0.im + k.V1.im + k.V2.im };
    expect(sum.re).toBeCloseTo(k.Va.re, 12);
    expect(sum.im).toBeCloseTo(k.Va.im, 12);
  });
});
