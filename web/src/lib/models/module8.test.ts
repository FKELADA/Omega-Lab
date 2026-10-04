import { describe, expect, it } from 'vitest';
import {
  cct,
  cdsBoundary,
  cdsInfo,
  cdsModel,
  FAULT_AT,
  fsysInfo,
  fsysModel,
  hpConstants,
  hpInfo,
  LTVS,
  ltvsInfo,
  OLTC_MODES,
  smibInfo,
  ssrInfo,
  ssrModel,
  SSR_MITIGATION,
} from './module8';
import { MODE_KIND, modeOf, twoAreaInfo, twoAreaK, twoAreaModel } from './module8b';

describe('transient stability, equal-area criterion (8.1)', () => {
  const base = { tc: 150, Pm: 0.8, H: 4, loc: FAULT_AT.bus };
  it('has a critical clearing time inside the slider range, and the areas agree with the simulation', () => {
    const t = cct(base)!;
    expect(t).toBeGreaterThan(30);
    expect(t).toBeLessThan(380);
    expect(smibInfo({ ...base, tc: t - 5 }).stable).toBe(true);
    expect(smibInfo({ ...base, tc: t + 10 }).stable).toBe(false);
    expect(smibInfo({ ...base, tc: t - 5 }).margin).toBeGreaterThan(-0.05);
    expect(smibInfo({ ...base, tc: t + 30 }).margin).toBeLessThan(0.05);
  });
  it('doubling H raises the critical time by about √2 (bolted fault at the bus)', () => {
    const r = cct({ ...base, H: 8 })! / cct(base)!;
    expect(r).toBeGreaterThan(1.3);
    expect(r).toBeLessThan(1.5);
  });
  it('a lighter load and a remote fault both give more margin', () => {
    expect(cct({ ...base, Pm: 0.6 })!).toBeGreaterThan(cct(base)!);
    expect(cct({ ...base, loc: FAULT_AT.mid })!).toBeGreaterThan(cct(base)!);
  });
});

describe('small-signal stability, AVR and PSS (8.2)', () => {
  const base = { P: 0.9, Xe: 0.65, KA: 200, Kpss: 0 };
  it('Heffron–Phillips constants have the textbook signs at high load', () => {
    const k = hpConstants(0.9, 0.65);
    expect(k.K1).toBeGreaterThan(0);
    expect(k.K2).toBeGreaterThan(0);
    expect(k.K5).toBeLessThan(0);
  });
  it('a fast high-gain AVR destabilises the electromechanical mode near 1 Hz', () => {
    const k = hpInfo(base);
    expect(k.stable).toBe(false);
    expect(k.freq).toBeGreaterThan(0.6);
    expect(k.freq).toBeLessThan(2);
  });
  it('a low AVR gain restores stability without a PSS', () => {
    expect(hpInfo({ ...base, KA: 10 }).stable).toBe(true);
  });
  it('the PSS gives over 15 % damping, and still over 5 % on a weak link', () => {
    expect(hpInfo({ ...base, Kpss: 10 }).zeta).toBeGreaterThan(0.15);
    expect(hpInfo({ ...base, Kpss: 10, Xe: 0.95 }).zeta).toBeGreaterThan(0.05);
  });
  it('less load means less negative damping', () => {
    expect(hpInfo({ ...base, P: 0.6 }).zeta).toBeGreaterThan(hpInfo(base).zeta);
  });
});

describe('long-term voltage stability (8.3)', () => {
  const base = { P0: 1, oltc: OLTC_MODES.on, B: 0, rec: 0 };
  it('with the tap changer, the HV voltage degrades step by step after the trip', () => {
    const k = ltvsInfo(base);
    expect(k.unstable).toBe(true);
    expect(k.taps).toBeGreaterThan(3);
    expect(k.PmaxPost).toBeLessThan(1.6);
  });
  it('without it, or blocked, the grid holds (with a low customer voltage)', () => {
    const off = ltvsInfo({ ...base, oltc: OLTC_MODES.off });
    expect(off.unstable).toBe(false);
    expect(off.V2end).toBeLessThan(0.95);
    expect(ltvsInfo({ ...base, oltc: OLTC_MODES.block }).unstable).toBe(false);
  });
  it('capacitors at the HV substation let the tap changer work', () => {
    expect(ltvsInfo({ ...base, B: 0.3 }).unstable).toBe(false);
  });
  it('thermostatic recovery collapses the system even with the tap changer blocked', () => {
    expect(ltvsInfo({ ...base, oltc: OLTC_MODES.block, rec: 1 }).collapsed).toBe(true);
  });
  it('the tap ratio stays within its range', () => {
    const k = ltvsInfo(base);
    expect(k.tapEnd).toBeLessThanOrEqual(LTVS.aMax + 1e-9);
  });
});

describe('frequency stability (8.4)', () => {
  const base = { share: 0.3, gfm: 0, ffr: 0 };
  it('RoCoF follows ΔP f0 / (2 H S), and inertia falls with the inverter share', () => {
    const k = fsysInfo(base);
    expect(k.H).toBeCloseTo(3.5, 6);
    expect(k.rocof).toBeCloseTo((-1320 * 50) / (2 * 3.5 * 30000), 6);
    expect(fsysInfo({ ...base, share: 0.8 }).H).toBeLessThan(k.H);
  });
  it('primary control leaves a steady-state offset (no return to 50 Hz)', () => {
    const r = fsysModel.simulate(base, 40);
    const fEnd = r.s.f[r.t.length - 1];
    expect(fEnd).toBeLessThan(49.8);
    expect(fEnd).toBeGreaterThan(49.2);
  });
  it('more inverters: load shedding, then RoCoF relays', () => {
    expect(fsysInfo(base).ufls).toBe(false);
    expect(fsysInfo({ ...base, share: 0.6 }).ufls).toBe(true);
    expect(fsysInfo({ ...base, share: 0.6 }).rocofTrip).toBe(false);
    expect(fsysInfo({ ...base, share: 0.8 }).rocofTrip).toBe(true);
  });
  it('fast reserve lifts the nadir but not the initial RoCoF', () => {
    const a = fsysInfo({ ...base, share: 0.8 }), b = fsysInfo({ ...base, share: 0.8, ffr: 600 });
    expect(b.ufls).toBe(false);
    expect(b.rocof).toBeCloseTo(a.rocof, 9);
  });
  it('grid-forming inverters restore both limits', () => {
    const k = fsysInfo({ ...base, share: 0.8, gfm: 0.2 });
    expect(k.ufls).toBe(false);
    expect(k.rocofTrip).toBe(false);
  });
});

describe('converter-driven stability (8.5)', () => {
  const base = { SCR: 2, fpll: 60, P: 1 };
  it('a fast PLL on a weak grid is unstable, in the eigenvalues and in the simulation', () => {
    expect(cdsInfo(base).stable).toBe(false);
    const P = Array.from(cdsModel.simulate(base, 0.5).s.P);
    const tail = P.slice(Math.floor(P.length * 0.8));
    expect(P.some((v) => !isFinite(v)) || Math.max(...tail) - Math.min(...tail) > 0.1).toBe(true);
  });
  it('a slower PLL, a stronger grid or less power each stabilise it', () => {
    expect(cdsInfo({ ...base, fpll: 20 }).stable).toBe(true);
    expect(cdsInfo({ ...base, SCR: 3 }).stable).toBe(true);
    expect(cdsInfo({ ...base, P: 0.5 }).stable).toBe(true);
  });
  it('the stable case settles to the setpoint', () => {
    const P = cdsModel.simulate({ ...base, fpll: 20 }, 0.5).s.P;
    expect(P[P.length - 1]).toBeCloseTo(1, 1);
  });
  it('the minimum SCR rises with the PLL bandwidth, and a 20 Hz PLL holds below SCR 1.4', () => {
    const b = cdsBoundary(1).filter(([, s]) => isFinite(s));
    expect(b[b.length - 1][1]).toBeGreaterThan(b[0][1]);
    expect(cdsInfo({ SCR: 1.35, fpll: 20, P: 1 }).stable).toBe(true);
  });
});

describe('subsynchronous resonance (8.6)', () => {
  const base = { k: 0.5, fm: 14.6, zetaM: 0.1, mitig: SSR_MITIGATION.none };
  it('resonance when 50 − 50√k meets the torsional frequency', () => {
    const k = ssrInfo(base);
    expect(k.fer).toBeCloseTo(50 * Math.sqrt(0.5), 9);
    expect(k.fsub).toBeCloseTo(14.6, 1);
    expect(k.growing).toBe(true);
  });
  it('detuning damps the mode', () => {
    expect(ssrInfo({ ...base, k: 0.4 }).growing).toBe(false);
    expect(ssrInfo({ ...base, k: 0.6 }).growing).toBe(false);
  });
  it('a 20 Hz mode resonates near k = 0.36', () => {
    expect(ssrInfo({ ...base, fm: 20, k: 0.36 }).growing).toBe(true);
  });
  it('0.5 % mechanical damping is not enough; a TCSC is', () => {
    expect(ssrInfo({ ...base, zetaM: 0.5 }).growing).toBe(true);
    expect(ssrInfo({ ...base, fm: 20, k: 0.36, zetaM: 0.5 }).growing).toBe(true);
    for (const k of [0.45, 0.5, 0.7]) expect(ssrInfo({ ...base, k, mitig: SSR_MITIGATION.tcsc }).growing).toBe(false);
  });
  it('the simulated envelope grows at σ', () => {
    const r = ssrModel.simulate(base, 2, 2000);
    expect(r.s.env[r.t.length - 1] / r.s.env[0]).toBeCloseTo(Math.exp(2 * ssrInfo(base).sigma), 6);
  });
});

describe('two-area inter-area oscillations (8.7)', () => {
  const base = { Xt: 1, Ptie: 0.4, H2: 6.175, D: 1, kick: 0, mode: 0 };
  it('K is a Laplacian: rows sum to zero, symmetric', () => {
    const K = twoAreaK(base);
    for (let i = 0; i < 4; i++) {
      expect(K[i].reduce((a, b) => a + b, 0)).toBeCloseTo(0, 9);
      for (let j = 0; j < 4; j++) expect(K[i][j]).toBeCloseTo(K[j][i], 9);
    }
  });
  it('one inter-area mode (0.5–0.8 Hz, areas in opposition) and two local modes above 1 Hz', () => {
    const k = twoAreaInfo(base);
    const ia = modeOf(k, MODE_KIND.inter);
    expect(ia.freq).toBeGreaterThan(0.5);
    expect(ia.freq).toBeLessThan(0.8);
    expect(Math.sign(ia.shape[0])).toBe(Math.sign(ia.shape[1]));
    expect(Math.sign(ia.shape[2])).toBe(Math.sign(ia.shape[3]));
    expect(Math.sign(ia.shape[0])).not.toBe(Math.sign(ia.shape[2]));
    const l1 = modeOf(k, MODE_KIND.local1), l2 = modeOf(k, MODE_KIND.local2);
    expect(l1.freq).toBeGreaterThan(1);
    expect(l2.freq).toBeGreaterThan(1);
    expect(Math.abs(l1.shape[2]) + Math.abs(l1.shape[3])).toBeLessThan(0.5);
  });
  it('a weaker tie or a heavier transfer slows the inter-area mode', () => {
    const f0 = modeOf(twoAreaInfo(base), MODE_KIND.inter).freq;
    expect(modeOf(twoAreaInfo({ ...base, Xt: 1.8 }), MODE_KIND.inter).freq).toBeLessThan(0.5);
    expect(modeOf(twoAreaInfo({ ...base, Ptie: 0.85 }), MODE_KIND.inter).freq).toBeLessThan(f0);
  });
  it('damping D reaches 5 % on the inter-area mode within the slider range', () => {
    expect(modeOf(twoAreaInfo(base), MODE_KIND.inter).zeta).toBeLessThan(0.05);
    expect(modeOf(twoAreaInfo({ ...base, D: 10 }), MODE_KIND.inter).zeta).toBeGreaterThan(0.05);
  });
  it('a kick on G1 reaches G3 through the inter-area mode', () => {
    const r = twoAreaModel.simulate(base, 12);
    expect(Math.max(...Array.from(r.s.dw3).map(Math.abs))).toBeGreaterThan(5);
  });
});
