import { describe, expect, it } from 'vitest';
import { emModes, modesInfo, modesModel, NETWORK_IDS, NETWORKS, REDUCTION, reductionInfo, reductionModel } from './g2data';

const net = (id: string) => NETWORK_IDS.indexOf(id);
const interArea = (id: string) => modesInfo({ net: net(id), mode: 1, kick: 1 }).modes.find((m) => m.category === 'synchronisation' && m.f < 1)!;

describe('baked G2ELin modes (8.8)', () => {
  it('every network has modes, shapes and free responses', () => {
    for (const id of NETWORK_IDS) {
      const k = modesInfo({ net: net(id), mode: 1, kick: 1 });
      expect(k.modes.length).toBeGreaterThan(3);
      expect(Object.keys(NETWORKS[id].shapes).length).toBeGreaterThan(0);
      expect(Object.keys(NETWORKS[id].unit_bus).length).toBeGreaterThan(0);
      const run = modesModel.simulate({ net: net(id), mode: 1, kick: 1 }, 12);
      expect(run.t.length).toBeGreaterThan(10);
      expect(Number.isFinite(run.s.w1[5])).toBe(true);
    }
  });

  it('participations of a mode sum to one', () => {
    for (const m of NETWORKS.kundur_two_area.modes) expect(Object.values(m.units).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(1.001);
  });

  it('Kundur: inter-area mode below 1 Hz, damped in detail, unstable in the classical model', () => {
    expect(interArea('kundur_two_area').zeta).toBeGreaterThan(5);
    expect(interArea('kundur_two_area_classic').zeta).toBeLessThan(0);
  });

  it('Kundur inter-area mode shape: area 1 against area 2', () => {
    const m = interArea('kundur_two_area');
    const sh = NETWORKS.kundur_two_area.shapes[String(m.mode)];
    const c = (u: string) => Math.cos((sh[u][1] * Math.PI) / 180);
    expect(c('SM_1') * c('SM_3')).toBeLessThan(0);
    expect(c('SM_2') * c('SM_4')).toBeLessThan(0);
    expect(c('SM_1') * c('SM_2')).toBeGreaterThan(0);
  });

  it('IEEE 39 has a poorly damped synchronisation mode', () => {
    const k = modesInfo({ net: net('ieee39'), mode: 1, kick: 1 });
    expect(k.modes.some((m) => m.category === 'synchronisation' && m.zeta < 5)).toBe(true);
  });
});

describe('baked model reduction (8.9)', () => {
  const levels = REDUCTION.levels.map((_, j) => reductionInfo({ level: j }));

  it('states decrease at each level', () => {
    for (let j = 1; j < levels.length; j++) {
      expect(levels[j].kundurStates).toBeLessThan(levels[j - 1].kundurStates);
      expect(levels[j].smibStates).toBeLessThan(levels[j - 1].smibStates);
    }
  });

  it('RMS stays close to EMT; the classical model loses damping', () => {
    expect(levels[1].gap).toBeLessThan(5);
    const ez = emModes(REDUCTION.kundur.emt)[0].zeta;
    expect(Math.abs(levels[3].em[0].zeta - ez)).toBeLessThan(2);
    expect(levels[5].em[0].zeta).toBeLessThan(2);
  });

  it('simulates on the EMT time grid', () => {
    const run = reductionModel.simulate({ level: 2 }, 3);
    expect(run.s.dw.length).toBe(run.t.length);
    expect(Math.max(...Array.from(run.s.dwEmt).map(Math.abs))).toBeGreaterThan(100);
  });
});
