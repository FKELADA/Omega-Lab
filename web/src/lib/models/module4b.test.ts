import { describe, expect, it } from 'vitest';
import { carg } from '../core/linalg';
import { zipP, zipWeights } from './module4';
import { EXPL, GROUPS, ORDER, PST, SCEN, SMD, expLoadInfo, expLoadModel, expP, lvPhasor, oltcInfo, oltcModel, pstFlows, smDynInfo, smDynModel, smInit, smNetwork } from './module4b';

const deg = Math.PI / 180;
const oltcRun = (p: Record<string, number>) => oltcModel.simulate(p, 180, 1801);

describe('tap changer, phase shifter, vector groups (4.3)', () => {
  const base = { V1: 0.92, DB: 2, Td: 30, alpha: 0, group: 0 };
  it('recovers a 0.92 pu dip in 7 taps, back in the band', () => {
    const k = oltcInfo(base);
    expect(k.ops).toBe(7);
    expect(k.inBand).toBe(true);
    expect(k.hunting).toBe(false);
  });
  it('waits for the first delay, then one tap every 10 s', () => {
    const r = oltcRun(base);
    const firstChange = r.t.find((_, k) => k > 0 && r.s.tap[k] !== r.s.tap[k - 1])!;
    expect(firstChange).toBeCloseTo(10 + 30, 0);
  });
  it('stays at its limit below about 0.887 pu, and hunts with a band narrower than a step', () => {
    expect(oltcInfo({ ...base, V1: 0.88 }).atLimit).toBe(true);
    expect(oltcInfo({ ...base, V1: 0.89 }).atLimit).toBe(false);
    expect(oltcInfo({ ...base, DB: 0.8 }).hunting).toBe(true);
    expect(oltcInfo({ ...base, DB: 1.5 }).hunting).toBe(false);
  });
  it('the phase shifter moves flow between the two lines', () => {
    expect(pstFlows(0).P1).toBeCloseTo(PST.P * PST.X2 / (PST.X1 + PST.X2), 9);
    const f = pstFlows(-4.6);
    expect(f.P1).toBeLessThan(PST.rating);
    expect(f.P1 + f.P2).toBeCloseTo(PST.P, 12);
    expect(pstFlows(-4.4).P1).toBeGreaterThan(PST.rating);
  });
  it('clock numbers: Dyn11 leads by 30°, Dyn5 lags by 150°', () => {
    const g = (n: string) => GROUPS.find((x) => x.name === n)!;
    expect(carg(lvPhasor(g('Dyn11'))) / deg).toBeCloseTo(30, 9);
    expect(carg(lvPhasor(g('Dyn5'))) / deg).toBeCloseTo(-150, 9);
    expect(g('YNd11').earthHV && !g('YNd11').earthLV).toBe(true);
  });
});

describe('synchronous machine models and controls (4.5)', () => {
  const sm = { scen: SCEN.fault, order: ORDER.oneAxis, KA: 0, R: 5, dP: 0.1, Xe: 0.3 };
  it('initialises at P0 and 1 pu for both models', () => {
    for (const order of [ORDER.classical, ORDER.oneAxis]) {
      const i = smInit(0.3, order);
      const n = smNetwork(i.delta, i.Eqp, 1, 0.3, i.Xq);
      expect(n.Pe).toBeCloseTo(SMD.P0, 9);
      expect(n.Vt).toBeCloseTo(1, 9);
    }
  });
  it('the islanded governor leaves the droop error', () => {
    const p = { ...sm, scen: SCEN.load };
    const r = smDynModel.simulate(p, 20, 801);
    const k = smDynInfo(p);
    expect(r.s.f[r.s.f.length - 1]).toBeCloseTo(k.fss, 3);
    expect(50 - k.fss).toBeCloseTo((0.1 * 50) / (20 + 0.9), 9);
    expect(k.nadir).toBeLessThan(k.fss);
    expect(smDynInfo({ ...p, R: 4 }).fss).toBeGreaterThan(49.8);
    expect(k.fss).toBeLessThan(49.8);
  });
  it('without fault nothing moves', () => {
    // Before the fault (t < 1 s) the state is at rest.
    const r = smDynModel.simulate({ ...sm, KA: 50 }, 10, 2001);
    const k = r.t.findIndex((t) => t > 0.9);
    expect(Math.abs(r.s.f[k] - 50)).toBeLessThan(1e-9);
    expect(r.s.Vt[k]).toBeCloseTo(1, 9);
  });
  it('without AVR the voltage stays low; with KA = 20–50 it comes back and the swing dies out', () => {
    expect(smDynInfo(sm).vEnd).toBeLessThan(0.98);
    for (const KA of [20, 50]) {
      const k = smDynInfo({ ...sm, KA });
      expect(k.vEnd).toBeGreaterThan(0.99);
      expect(k.growing).toBe(false);
    }
  });
  it('a fast AVR on a weak grid makes the swing grow', () => {
    expect(smDynInfo({ ...sm, KA: 100, Xe: 0.5 }).growing).toBe(true);
    expect(smDynInfo({ ...sm, KA: 0, Xe: 0.5 }).growing).toBe(false);
  });
  it('the classical model swings and settles lower than 1 pu after the trip', () => {
    const k = smDynInfo({ ...sm, order: ORDER.classical });
    expect(k.lost).toBe(false);
    expect(k.vEnd).toBeLessThan(0.99);
  });
});

describe('exponential and frequency-dependent loads (4.7)', () => {
  it('α = 0, 1, 2 are constant P, I, Z', () => {
    for (const V of [0.8, 0.95, 1.05]) {
      expect(expP(V, 0, 0, 0)).toBeCloseTo(1, 12);
      expect(expP(V, 0, 1, 0)).toBeCloseTo(V, 12);
      expect(expP(V, 0, 2, 0)).toBeCloseTo(V * V, 12);
    }
  });
  it('α = 1.1 matches the ZIP of lesson 4.6 within 0.1 % around 1 pu', () => {
    const w = zipWeights({ z: 0.4, i: 0.3 });
    expect(expLoadInfo({ alpha: 1, beta: 2, Kpf: 1, V2: 1, df: 0 }).alphaZip).toBeCloseTo(1.1, 12);
    for (const V of [0.95, 1, 1.05]) expect(Math.abs(expP(V, 0, 1.1, 0) / zipP(w, V) - 1)).toBeLessThan(1e-3);
  });
  it('Kpf = 2 and −0.5 Hz give −2 %', () => {
    const r = expLoadModel.simulate({ alpha: 1, beta: 2, Kpf: 2, V2: 1, df: -0.5 }, EXPL.window, 1201);
    expect(r.s.P[r.s.P.length - 1]).toBeCloseTo(0.98, 12);
    const k = expLoadInfo({ alpha: 1, beta: 2, Kpf: 2, V2: 1, df: -0.5 });
    expect(k.dfNoGov).toBeCloseTo(-0.75, 12);
    expect(k.dfGov).toBeCloseTo(-1.5 / 22, 12);
  });
});
