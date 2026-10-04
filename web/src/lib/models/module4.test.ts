import { describe, expect, it } from 'vitest';
import { cabs } from '../core/linalg';
import {
  LINE_MODELS, compInfo, factsInfo, imInfo, imTorque, inductionMotor, lineInfo, loadInfo, loadModel,
  smInfo, syncMachine, trafoInfo, transformer, zipWeights,
} from './module4';

describe('transmission line (4.1)', () => {
  const base = { kV: 400, km: 600, P: 0, pf: 1, model: LINE_MODELS.exact };
  it('SIL of a 400 kV line is about 530 MW', () => {
    expect(lineInfo(base).SIL / 1e6).toBeGreaterThan(500);
    expect(lineInfo(base).SIL / 1e6).toBeLessThan(560);
  });
  it('Ferranti: at no load the receiving end rises to about 1/cos(βL)', () => {
    const k = lineInfo(base);
    const rise = cabs(k.exact.Vr) / cabs(k.exact.Vs);
    expect(rise).toBeCloseTo(k.ferranti, 9);
    expect(rise).toBeGreaterThan(1.2);
  });
  it('loaded at SIL, the voltage profile is nearly flat', () => {
    const k = lineInfo({ ...base, P: lineInfo(base).SIL / 1e6 });
    const v = k.profile.map(([, u]) => u);
    expect(Math.max(...v) - Math.min(...v)).toBeLessThan(0.05);
  });
  it('the nominal π matches the exact model on a short line, not on a very long one', () => {
    const err = (km: number) => {
      const k = lineInfo({ ...base, km, P: 400 });
      return Math.abs(cabs(k.all[1].Vr) - cabs(k.all[2].Vr)) / cabs(k.all[2].Vr);
    };
    expect(err(100)).toBeLessThan(0.002);
    expect(err(1000)).toBeGreaterThan(err(100) * 10);
  });
});

describe('transformer (4.2)', () => {
  const base = { theta0: 0, psiR: 0.6, psiSat: 1.2, r: 0.01, load: 1, pf: 0.8 };
  it('switching at the voltage peak with no residual flux gives no inrush', () => {
    expect(trafoInfo({ ...base, theta0: 90, psiR: 0 }).iPeak).toBeLessThan(0.02);
  });
  it('switching at voltage zero with residual flux gives a large inrush', () => {
    const k = trafoInfo(base);
    expect(k.psiPeak).toBeGreaterThan(2.3);
    expect(k.iPeak).toBeGreaterThan(3);
  });
  it('the inrush decays', () => {
    const run = transformer.simulate(base, 0.4, 4000);
    const first = Math.max(...run.s.i.slice(0, 400));
    const last = Math.max(...run.s.i.slice(3600));
    expect(last).toBeLessThan(0.8 * first);
  });
  it('efficiency peaks where copper losses equal iron losses', () => {
    expect(trafoInfo(base).bestLoad).toBeCloseTo(Math.sqrt(0.002 / 0.01), 9);
  });
});

describe('synchronous machine (4.3)', () => {
  const base = { mode: 0, P: 0.8, E: 1.8, Xd: 1.8, Xd2: 0.2, Xd1: 0.3, theta: 0 };
  it('Q = 0 when E = √(1 + (P·Xd)²)', () => {
    const E = Math.sqrt(1 + (0.8 * 1.8) ** 2);
    expect(smInfo({ ...base, E }).Q).toBeCloseTo(0, 9);
  });
  it('over-excited exports Q, under-excited absorbs it', () => {
    expect(smInfo({ ...base, E: 2.4 }).Q).toBeGreaterThan(0);
    expect(smInfo({ ...base, E: 1.6 }).Q).toBeLessThan(0);
  });
  it('no equilibrium when P·Xd > E·V', () => {
    expect(smInfo({ ...base, E: 1.2, P: 0.8 }).stable).toBe(false);
  });
  it('short-circuit current starts at zero and decays to √2/Xd', () => {
    const p = { ...base, mode: 1 };
    const run = syncMachine.simulate(p, 3, 6000);
    expect(run.s.i[0]).toBeCloseTo(0, 9);
    expect(Math.max(...run.s.i.slice(0, 200).map(Math.abs))).toBeGreaterThan(1.8 * Math.SQRT2 / 0.2);
    // Td′ = 0.8 s: after 3 s the envelope is within 15 % of its steady value √2/Xd.
    expect(run.s.env[run.t.length - 1] / (Math.SQRT2 / 1.8)).toBeLessThan(1.15);
  });
});

describe('loads (4.4)', () => {
  const base = { z: 1, i: 0, dyn: 0, Tp: 10, Vstep: 0.9 };
  it('a constant-impedance load draws V²', () => {
    expect(loadInfo(base).pAfter).toBeCloseTo(0.81, 9);
  });
  it('weights are normalised and the CVR factor is 2z + i', () => {
    const w = zipWeights({ z: 0.4, i: 0.3 });
    expect(w.z + w.i + w.p).toBeCloseTo(1, 12);
    expect(loadInfo({ ...base, z: 0.4, i: 0.3 }).cvr).toBeCloseTo(1.1, 9);
  });
  it('a recovering load dips to V² then returns to its constant power', () => {
    const p = { ...base, dyn: 1, Tp: 5 };
    const run = loadModel.simulate(p, 60);
    const k = run.t.findIndex((t) => t > 5.01);
    expect(run.s.p[k]).toBeCloseTo(0.81, 1);
    expect(run.s.p[run.t.length - 1]).toBeCloseTo(1, 2);
  });
});

describe('induction motor (4.5)', () => {
  const base = { V: 1, T0: 0.8, type: 0, Rr: 0.02, H: 0.8, dip: 1, dipDur: 0.2 };
  it('breakdown torque is several times the starting torque for a low-resistance rotor', () => {
    const k = imInfo(base);
    expect(k.tMax).toBeGreaterThan(2 * k.tStart);
    expect(k.iStart).toBeGreaterThan(4);
  });
  it('a fan load starts and runs near synchronous speed', () => {
    const k = imInfo(base);
    expect(k.stalled).toBe(false);
    expect(k.speedEnd).toBeGreaterThan(0.95);
  });
  it('a constant-torque load above the starting torque never starts', () => {
    const tStart = imTorque(1, 1, 0.02);
    expect(imInfo({ ...base, type: 1, T0: 1.2 * tStart }).stalled).toBe(true);
  });
  it('a running low-inertia motor stalls in a deep dip under constant torque, but not with a fan', () => {
    const dip = { ...base, start: 1, T0: 0.9, H: 0.2, dip: 0.5, dipDur: 0.5 };
    const run = inductionMotor.simulate({ ...dip, type: 1 }, 6, 2400);
    expect(run.s.speed[0]).toBeGreaterThan(0.95); // starts at its operating point
    expect(run.s.speed[run.t.length - 1]).toBeLessThan(0.5);
    expect(imInfo({ ...dip, type: 0 }).stalled).toBe(false);
  });
  it('the same dip cleared faster is ridden through', () => {
    expect(imInfo({ ...base, start: 1, type: 1, T0: 0.9, H: 0.2, dip: 0.5, dipDur: 0.3 }).stalled).toBe(false);
  });
});

describe('compensation (4.6)', () => {
  const base = { P: 0.6, pf: 0.95, B: 0, k: 0 };
  it('a shunt capacitor raises the receiving voltage', () => {
    expect(compInfo({ ...base, B: 0.4 }).V!).toBeGreaterThan(compInfo(base).V!);
  });
  it('50 % series compensation roughly doubles the transfer limit', () => {
    const r = compInfo({ ...base, k: 0.5 }).Pmax / compInfo(base).Pmax;
    expect(r).toBeGreaterThan(1.7);
    expect(r).toBeLessThan(2.1);
  });
  it('beyond the nose the voltage collapses', () => {
    const Pmax = compInfo(base).Pmax;
    expect(compInfo({ ...base, P: 1.05 * Pmax }).V).toBeNull();
  });
});

describe('FACTS (4.7)', () => {
  const base = { Edip: 0.5, SCR: 3, rating: 0.5, slope: 0.03, Tr: 0.03 };
  it('both devices raise the voltage during the dip', () => {
    const k = factsInfo(base);
    expect(k.vDipSvc).toBeGreaterThan(k.vDipNone);
    expect(k.vDipStat).toBeGreaterThan(k.vDipNone);
  });
  it('in a deep dip the STATCOM delivers more reactive power than the SVC', () => {
    const k = factsInfo(base);
    expect(k.qStatDip).toBeGreaterThan(k.qSvcDip);
  });
  it('on a weak grid, a 0.7 pu dip needs about 0.6 pu of STATCOM to hold 0.9 pu', () => {
    const dip = { ...base, Edip: 0.7 };
    expect(factsInfo({ ...dip, rating: 0.5 }).vDipStat).toBeLessThan(0.9);
    expect(factsInfo({ ...dip, rating: 0.7 }).vDipStat).toBeGreaterThanOrEqual(0.9);
  });
});
