import { describe, expect, it } from 'vitest';
import { FAULT, FTYPE, NEUTRAL, PLAN, QMODE, RELAY, dvpAt, dvpInfo, iccAt, loopInfo, neutralInfo, planInfo, protInfo, protRun, violationYear } from './module10';

describe('MV loop (10.1)', () => {
  const L = { open: 4, load: 100, cable: 0, fault: FAULT.none, rescue: 0 };
  it('the balanced open point minimises the drop, and the default is not balanced', () => {
    const k = loopInfo(L);
    expect(k.worstDv).toBeGreaterThan(k.bestDv + 0.5);
    expect(loopInfo({ ...L, open: k.bestOpen }).worstDv).toBeCloseTo(k.bestDv, 9);
    expect(k.bestOpen).toBeGreaterThanOrEqual(8);
    expect(k.bestOpen).toBeLessThanOrEqual(11);
  });
  it('overhead nearly doubles the drop', () => {
    const a = loopInfo({ ...L, open: 10 }), b = loopInfo({ ...L, open: 10, cable: 1 });
    expect(b.worstDv / a.worstDv).toBeGreaterThan(1.8);
  });
  it('a fault cuts the substations beyond it; closing the open point restores them', () => {
    const f = loopInfo({ ...L, open: 10, fault: 2 });
    expect(f.lost).toBe(8);
    const r = loopInfo({ ...L, open: 10, fault: 2, rescue: 1 });
    expect(r.lost).toBe(0);
    expect(r.ok).toBe(true);
  });
  it('back-feeding holds up to about 130 % load, not 140 %', () => {
    expect(loopInfo({ ...L, open: 10, fault: 2, rescue: 1, load: 130 }).ok).toBe(true);
    expect(loopInfo({ ...L, open: 10, fault: 2, rescue: 1, load: 140 }).ok).toBe(false);
  });
});

describe('distribution voltage plan (10.2)', () => {
  const D = { Vc: 102, ldc: 0, pv: 0, qmode: QMODE.none, tap: 0 };
  it('without PV the last customer falls below 90 %; a +2.5 % tap fixes it', () => {
    expect(dvpInfo(D).lvMin).toBeLessThan(90);
    expect(dvpInfo({ ...D, tap: 2.5 }).ok).toBe(true);
  });
  it('10 MW of PV pushes the last customer above 110 %; tan φ alone is not enough', () => {
    const p = { ...D, tap: 2.5, pv: 10 };
    expect(dvpInfo(p).lvMax).toBeGreaterThan(110);
    expect(dvpInfo({ ...p, qmode: QMODE.tan }).lvMax).toBeLessThan(dvpInfo(p).lvMax);
    expect(dvpInfo({ ...p, qmode: QMODE.tan }).ok).toBe(false);
  });
  it('line-drop compensation with tan φ holds the range; Q(U) does it with less reactive energy', () => {
    const p = { ...D, tap: 2.5, pv: 10, ldc: 3 };
    expect(dvpInfo({ ...p, qmode: QMODE.tan }).ok).toBe(true);
    const qu = dvpInfo({ ...p, qmode: QMODE.qu });
    expect(qu.ok).toBe(true);
    expect(qu.qAbs).toBeLessThan(dvpInfo({ ...p, qmode: QMODE.tan }).qAbs / 2);
  });
  it('the flow reverses at noon with PV', () => {
    expect(dvpAt({ ...D, pv: 10 }, 13).Pnet).toBeLessThan(0);
    expect(dvpAt(D, 13).Pnet).toBeGreaterThan(0);
  });
});

describe('neutral earthing (10.3)', () => {
  const N = { regime: NEUTRAL.isolated, Lc: 200, In: 300, detune: 0, Rf: 1, Is0: 40, relay: RELAY.amp };
  it('isolated: the fault current is the network capacitive current, healthy phases rise to √3', () => {
    const k = neutralInfo(N);
    expect(k.ifA).toBeCloseTo(k.Ic, -1);
    expect(k.ifA).toBeGreaterThan(500);
    expect(k.vMax).toBeGreaterThan(1.7);
  });
  it('about 3 A of capacitive current per km of cable', () => {
    const a = neutralInfo({ ...N, Lc: 100 }).Ic, b = neutralInfo({ ...N, Lc: 200 }).Ic;
    expect((b - a) / 100).toBeGreaterThan(2.5);
    expect((b - a) / 100).toBeLessThan(4);
  });
  it('resistance-earthed: a 40 A threshold trips the healthy feeder; 150 A is selective', () => {
    const r = { ...N, regime: NEUTRAL.resistance };
    expect(neutralInfo(r).healthyTrips).toBe(true);
    const s = neutralInfo({ ...r, Is0: 150 });
    expect(s.faultyTrips && !s.healthyTrips).toBe(true);
  });
  it('a 500 Ω fault is not seen', () => {
    expect(neutralInfo({ ...N, regime: NEUTRAL.resistance, Is0: 150, Rf: 500 }).faultyTrips).toBe(false);
  });
  it('a tuned coil brings the fault current below 50 A; only the wattmetric relay is selective', () => {
    const c = { ...N, regime: NEUTRAL.compensated };
    expect(neutralInfo(c).ifA).toBeLessThan(50);
    expect(neutralInfo({ ...c, detune: 20 }).ifA).toBeGreaterThan(100);
    expect(neutralInfo(c).healthyTrips).toBe(true);
    const w = neutralInfo({ ...c, relay: RELAY.watt });
    expect(w.faultyTrips && !w.healthyTrips).toBe(true);
  });
  it('the faulty feeder sees the neutral current plus the other feeders’ capacitive currents', () => {
    const k = neutralInfo({ ...N, regime: NEUTRAL.resistance });
    // Kirchhoff: fault current = residual at the faulty feeder + its own capacitive share.
    expect(k.i0f).toBeLessThan(k.ifA);
    expect(k.i0f).toBeGreaterThan(0.8 * k.ifA);
  });
});

describe('MV protection (10.4)', () => {
  const P = { Is: 1200, td: 0.6, d: 10, type: FTYPE.transient, reclose: 0 };
  it('the phase-to-phase fault current is √3/2 of the three-phase one and falls along the feeder', () => {
    expect(iccAt(5).I2 / iccAt(5).I3).toBeCloseTo(Math.sqrt(3) / 2, 12);
    expect(iccAt(20).I3).toBeLessThan(iccAt(0).I3 / 4);
  });
  it('1,200 A is outside the window: an end-of-feeder fault goes to the incomer', () => {
    expect(protInfo(P).setOk).toBe(false);
    const k = protInfo({ ...P, d: 20 });
    expect(k.sees).toBe(false);
    expect(k.incomer).toBe(true);
  });
  it('400 A and 0.4 s are set and graded; the end fault is seen by the feeder', () => {
    const k = protInfo({ ...P, Is: 400, td: 0.4, d: 20 });
    expect(k.setOk && k.graded && k.sees && !k.incomer).toBe(true);
  });
  it('rapid reclosing clears a transient fault; a permanent one locks out', () => {
    const q = { ...P, Is: 400, td: 0.4, reclose: 1 };
    const t = protRun(q);
    expect(protInfo(q).lockout).toBe(false);
    expect(t.s.sup[t.s.sup.length - 1]).toBe(100);
    expect(t.tripTimes.length).toBe(1);
    const p = protRun({ ...q, type: FTYPE.permanent });
    expect(p.lockout).toBe(true);
    expect(p.tripTimes.length).toBe(3);
  });
});

describe('planning (10.5)', () => {
  const G = { growth: 2, backup: 0, flex: 0, price: 50 };
  it('the N-1 limit is reached in about 9.5 years', () => {
    const y = violationYear(G, 0);
    expect(PLAN.P0 * 1.02 ** y).toBeCloseTo(planInfo(G).firm, 9);
    expect(y).toBeGreaterThan(8);
    expect(y).toBeLessThan(11);
  });
  it('5 MW of MV back-up defers it beyond 14 years', () => {
    expect(planInfo({ ...G, backup: 5 }).yNoFlex).toBeGreaterThan(14);
  });
  it('3 MW of flexibility defers by over 3 years; it pays at 20 k€/MW/yr, not at 50', () => {
    expect(planInfo({ ...G, flex: 3 }).deferral).toBeGreaterThan(3);
    expect(planInfo({ ...G, flex: 3 }).net).toBeLessThan(0);
    expect(planInfo({ ...G, flex: 3, price: 20 }).net).toBeGreaterThan(0);
  });
  it('at 4 %/yr the same flexibility defers by under 2 years', () => {
    expect(planInfo({ ...G, growth: 4, flex: 3 }).deferral).toBeLessThan(2);
  });
});
