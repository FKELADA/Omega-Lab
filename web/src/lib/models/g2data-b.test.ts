import { describe, expect, it } from 'vitest';
import { IBR, PSS, interOf, ibrInfo, ibrModel, pssInfo, pssModel } from './g2data-b';

const place = (id: string) => PSS.places.findIndex((p) => p.id === id);

describe('baked PSS results on Kundur’s two-area system (8.10)', () => {
  it('every placement and gain has modes and a free response', () => {
    for (const p of PSS.places)
      for (const K of p.id === 'none' ? [0] : PSS.gains) {
        expect(PSS.modes[p.id][K]?.length, `${p.id} ${K}`).toBeGreaterThan(1);
        expect(PSS.free[p.id][K]?.w.length, `${p.id} ${K}`).toBe(4);
        expect(interOf(PSS.modes[p.id][K]), `${p.id} ${K}`).toBeDefined();
      }
  });
  it('without PSS the inter-area mode near 0.6 Hz is unstable', () => {
    const k = pssInfo({ place: place('none'), K: 20 });
    expect(k.inter.f).toBeGreaterThan(0.5);
    expect(k.inter.f).toBeLessThan(0.7);
    expect(k.inter.z).toBeLessThan(0);
    const r = pssModel.simulate({ place: place('none'), K: 0 }, 15);
    const amp = (a: number, b: number) => Math.max(...Array.from(r.s.d13).filter((_, i) => r.t[i] >= a && r.t[i] < b).map(Math.abs));
    expect(amp(11, 15)).toBeGreaterThan(amp(1, 5));
  });
  it('each step of the lesson has a solution in the data', () => {
    const g1 = pssInfo({ place: place('G1'), K: 20 }), g3 = pssInfo({ place: place('G3'), K: 20 });
    expect(g1.inter.z).toBeGreaterThan(0);
    expect(g1.inter.z).toBeLessThan(5);
    expect(g3.inter.z).toBeGreaterThan(g1.inter.z);
    expect(pssInfo({ place: place('G1G3'), K: 20 }).inter.z).toBeGreaterThanOrEqual(5);
    const all = pssInfo({ place: place('all'), K: 20 });
    expect(all.inter.z).toBeGreaterThanOrEqual(15);
    expect(all.localMin).toBeGreaterThanOrEqual(20);
  });
  it('snaps K to the nearest baked gain', () => {
    expect(pssInfo({ place: place('all'), K: 21 }).K).toBe(20);
    expect(pssInfo({ place: place('none'), K: 60 }).K).toBe(0);
  });
});

describe('baked converter reduction (8.11)', () => {
  for (const conv of ['gfm', 'gfl'] as const)
    it(`${conv}: each level keeps fewer states; only the full model has lightly damped modes above 100 Hz`, () => {
      const lv = IBR[conv].levels;
      expect(lv.length).toBe(6);
      for (let j = 1; j < lv.length; j++) expect(lv[j].n, `${conv} ${lv[j].id}`).toBeLessThan(lv[j - 1].n);
      const resonances = (e: { im: number; z: number }[]) => e.filter((x) => x.im / (2 * Math.PI) > 100 && x.z < 5).length;
      expect(resonances(lv[0].eig)).toBeGreaterThan(0);
      for (const L of lv.slice(1)) expect(resonances(L.eig), `${conv} ${L.id}`).toBe(0);
    });
  it('the full models ran, and the grid-former reduced to its droop stays close to the full model', () => {
    for (const conv of ['gfm', 'gfl'] as const) expect(ibrInfo({ conv: conv === 'gfm' ? 0 : 1, level: 0 }).failed).toBe(false);
    const k = ibrInfo({ conv: 0, level: 5 });
    expect(k.level.id).toBe('droop');
    expect(k.failed).toBe(false);
    const full = ibrModel.simulate({ conv: 0, level: 0 }, 0.5);
    const span = Math.max(...full.s.yFull) - Math.min(...full.s.yFull);
    expect(k.gap!).toBeLessThan(0.25 * span);
  });
});
