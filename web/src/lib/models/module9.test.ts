import { describe, expect, it } from 'vitest';
import {
  AREA,
  BAL,
  LEVELS,
  N1,
  RST,
  SITES,
  TECH,
  TOPO,
  balInfo,
  balRun,
  dcFlows,
  defInfo,
  levelInfo,
  n1Info,
  n1Injections,
  studyInfo,
  vplanInfo,
  vplanRun,
} from './module9';

const lvl = (name: string) => LEVELS.findIndex((l) => l.name === name);

describe('voltage levels (9.1)', () => {
  it('1,000 MW over 200 km needs two 400 kV circuits', () => {
    expect(levelInfo({ level: lvl('400 kV'), P: 1000, L: 200, n: 2 }).ok).toBe(true);
    expect(levelInfo({ level: lvl('400 kV'), P: 1000, L: 200, n: 1 }).ok).toBe(false);
    for (const n of [1, 2, 3, 4]) expect(levelInfo({ level: lvl('225 kV'), P: 1000, L: 200, n }).ok).toBe(false);
  });
  it('losses scale as R/U²', () => {
    const a = levelInfo({ level: lvl('400 kV'), P: 1000, L: 200, n: 2 }), b = levelInfo({ level: lvl('225 kV'), P: 1000, L: 200, n: 2 });
    expect(b.losses / a.losses).toBeCloseTo((400 / 225) ** 2 * (0.06 / 0.03), 9);
    // Losses = 3 R I² against P.
    expect((3 * a.R * (a.I * 2) ** 2) / 1000).toBeCloseTo(a.losses / 100, 9);
  });
  it('in MV the drop comes mostly from P; 100 kW at 400 V reaches 8 % in about 540 m', () => {
    const mv = levelInfo({ level: lvl('20 kV'), P: 5, L: 20, n: 1 });
    expect(mv.dvP).toBeGreaterThan(mv.dvQ);
    const tx = levelInfo({ level: lvl('400 kV'), P: 1000, L: 200, n: 2 });
    expect(tx.dvQ).toBeGreaterThan(3 * tx.dvP);
    expect(levelInfo({ level: lvl('400 V'), P: 0.1, L: 0.54, n: 1 }).dv).toBeGreaterThan(7.5);
    expect(levelInfo({ level: lvl('400 V'), P: 0.1, L: 0.54, n: 1 }).dv).toBeLessThan(8.5);
  });
});

describe('balancing (9.2)', () => {
  const b = { inc: 1000, area: AREA.fr, afrr: 1, Tr: 150, tm: 300 };
  it('primary control alone leaves −ΔP/λ', () => {
    const k = balInfo({ ...b, afrr: 0, tm: 900 });
    const r = balRun({ ...b, afrr: 0, tm: 900 });
    const at200 = r.s.f[200];
    expect(at200 - 50).toBeCloseTo(-1000 / k.lambda, 2);
    expect(k.lambda).toBeCloseTo(3000 / 0.2 + 0.01 * 360000, 9);
  });
  it('France imports from its neighbours, then its aFRR brings 50 Hz back', () => {
    const k = balInfo(b);
    expect(k.tieMax).toBeGreaterThan(700);
    expect(Math.abs(k.fEnd - 50)).toBeLessThan(0.005);
    expect(k.nadir).toBeLessThan(49.95);
  });
  it('non-intervention: an incident abroad leaves France’s aFRR at rest', () => {
    expect(balInfo({ ...b, area: AREA.ce }).afrrMax).toBeLessThan(20);
  });
  it('the 3,000 MW reference incident keeps the quasi-steady frequency above 49.8 Hz', () => {
    const k = balInfo({ ...b, inc: 3000 });
    expect(k.fQuasi).toBeGreaterThan(49.8);
    expect(k.nadir).toBeGreaterThan(49.2);
  });
  it('calling mFRR early frees the aFRR', () => {
    expect(Math.abs(balInfo({ ...b, tm: 120 }).afrrEnd)).toBeLessThan(15);
    expect(Math.abs(balInfo(b).afrrEnd)).toBeGreaterThan(15);
    expect(Math.abs(balInfo({ ...b, tm: 900 }).afrrEnd)).toBeGreaterThan(100);
    expect(BAL.window).toBe(1200);
  });
});

describe('N-1 security (9.3)', () => {
  const base = { redisp: 0, alpha: 0, topo: TOPO.normal, growth: 0 };
  it('DC flows balance at every node', () => {
    const P = n1Injections(base, 19);
    expect(P.reduce((a, c) => a + c, 0)).toBeCloseTo(0, 9);
    const f = dcFlows(P, [7], 0);
    const net = N1.nodes.map(() => 0);
    N1.lines.forEach((l, i) => {
      net[l.a] += f[i];
      net[l.b] -= f[i];
    });
    net.forEach((v, i) => expect(v).toBeCloseTo(P[i], 6));
  });
  it('secure in N, not in N-1 at the evening peak', () => {
    const k = n1Info(base);
    expect(k.maxN).toBeLessThan(100);
    expect(k.maxN1).toBeGreaterThan(105);
    expect(k.peakHour).toBeGreaterThan(17);
    expect(k.peakHour).toBeLessThan(21);
    expect(N1.lines[k.critical].name).toBe('L4');
  });
  it('each remedy works alone; opening L5 makes it worse', () => {
    expect(n1Info({ ...base, redisp: 300 }).maxN1).toBeLessThanOrEqual(100);
    expect(n1Info({ ...base, alpha: -12 }).maxN1).toBeLessThanOrEqual(100);
    expect(n1Info({ ...base, topo: TOPO.closeL8 }).maxN1).toBeLessThanOrEqual(100);
    expect(n1Info({ ...base, topo: TOPO.openL5 }).maxN1).toBeGreaterThan(n1Info(base).maxN1);
  });
  it('with +10 % demand only a combination is enough', () => {
    const g = { ...base, growth: 10 };
    expect(n1Info({ ...g, redisp: 600 }).maxN1).toBeGreaterThan(100);
    expect(n1Info({ ...g, alpha: -15 }).maxN1).toBeGreaterThan(100);
    expect(n1Info({ ...g, topo: TOPO.closeL8 }).maxN1).toBeGreaterThan(100);
    expect(n1Info({ ...g, redisp: 300, alpha: -12, topo: TOPO.closeL8 }).maxN1).toBeLessThanOrEqual(100);
  });
});

describe('transmission voltage plan (9.4)', () => {
  const v = { rst: RST.off, Vc: 405, Qc: 0, QL: 0 };
  it('primary control alone: the pilot node sags at the evening peak', () => {
    const r = vplanRun(v);
    const k = r.t.findIndex((h) => h >= 19);
    expect(r.s.vp[k]).toBeLessThan(397);
    expect(vplanInfo(v).span).toBeGreaterThan(10);
  });
  it('secondary control holds the setpoint and aligns the generators, until they saturate', () => {
    const k = vplanInfo({ ...v, rst: RST.on });
    expect(k.aligned).toBe(true);
    expect(k.saturated).toBe(true);
  });
  it('capacitors restore the margin; too many make the generators absorb flat out', () => {
    const k = vplanInfo({ ...v, rst: RST.on, Qc: 300 });
    expect(k.saturated).toBe(false);
    expect(k.Nmax).toBeLessThanOrEqual(0.6);
    expect(k.span).toBeLessThan(3);
    expect(vplanInfo({ ...v, rst: RST.on, Qc: 600, Vc: 405 }).Nmin).toBeLessThanOrEqual(-0.95);
  });
  it('a 410 kV setpoint is held with 300 Mvar of capacitors, within 420 kV', () => {
    const k = vplanInfo({ ...v, rst: RST.on, Qc: 300, Vc: 410 });
    expect(k.saturated).toBe(false);
    expect(k.vmax).toBeLessThanOrEqual(420);
    expect(k.vmin).toBeGreaterThan(407);
  });
});

describe('defence plan (9.5)', () => {
  const d = { deficit: 15, H: 4, f1: 49, step: 7.5 };
  it('the default plan saves the system; no shedding is a blackout', () => {
    const k = defInfo(d);
    expect(k.blackout).toBe(false);
    expect(k.nadir).toBeLessThan(49);
    expect(Math.abs(k.fEnd - 50)).toBeLessThan(0.3);
    expect(defInfo({ ...d, step: 0 }).blackout).toBe(true);
  });
  it('the initial RoCoF is ΔP f0 / 2H', () => {
    expect(defInfo(d).rocof).toBeCloseTo((0.15 * 50) / 8, 12);
  });
  it('15 % stages for a 10 % deficit overshoot 51 Hz', () => {
    const k = defInfo({ ...d, deficit: 10, step: 15 });
    expect(k.over).toBe(true);
    expect(k.blackout).toBe(false);
  });
  it('a 30 % deficit is saved by 7.5 % stages', () => {
    const k = defInfo({ ...d, deficit: 30 });
    expect(k.blackout || k.over).toBe(false);
  });
  it('low inertia: 7.5 % stages over-shed, 5 % stages save the system', () => {
    const q = { ...d, deficit: 20, H: 1.5 };
    const a = defInfo(q);
    expect(a.over || a.blackout).toBe(true);
    const b = defInfo({ ...q, step: 5 });
    expect(b.over || b.blackout).toBe(false);
  });
});

describe('connection study (9.6)', () => {
  it('63 kV: wind limited to 200 MW by the SCR', () => {
    const k = studyInfo({ site: 2, tech: TECH.ibr, P: 100 });
    expect(k.pMax).toBe(SITES[2].Scc / 3);
    expect(k.limit).toBe('scr');
  });
  it('225 kV takes 400 MW of wind, limited by capacity', () => {
    const k = studyInfo({ site: 1, tech: TECH.ibr, P: 400 });
    expect(k.ok).toBe(true);
    expect(studyInfo({ site: 1, tech: TECH.ibr, P: 10 }).limit).toBe('capacity');
  });
  it('400 kV: a 1,000 MW synchronous plant exceeds 63 kA, the same in inverters does not', () => {
    const s = studyInfo({ site: 0, tech: TECH.sync, P: 1000 });
    expect(s.ok).toBe(false);
    expect(s.why).toContain('icc');
    expect(studyInfo({ site: 0, tech: TECH.ibr, P: 1000 }).ok).toBe(true);
  });
});
