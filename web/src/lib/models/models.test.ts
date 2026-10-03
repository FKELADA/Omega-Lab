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
