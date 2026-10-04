import { describe, expect, it } from 'vitest';
import { cabs } from '../core/linalg';
import { gaussSeidel, newtonRaphson, ybus } from '../core/powerflow';
import {
  CONTROLS,
  dispatch,
  dispatchInfo,
  FAULT,
  FAULT_TYPES,
  faultInfo,
  faultModel,
  feederInfo,
  GROUNDING,
  network,
  NET,
  pflowInfo,
  pvInfo,
  pvLessonInfo,
  qvCurve,
  UNITS,
} from './module5';

describe('power-flow core (5.1)', () => {
  const base = { lambda: 1, P2: 0.8, V2: 1.01, out: 0 };
  it('Y is symmetric and each row sums to the bus’s shunt admittance', () => {
    const { buses, branches } = network(base);
    const Y = ybus(buses, branches);
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < 4; k++) expect(Y[i][k].im).toBeCloseTo(Y[k][i].im, 12);
      const row = Y[i].reduce((s, y) => ({ re: s.re + y.re, im: s.im + y.im }), { re: 0, im: 0 });
      const charging = NET.lines.filter((l) => l.from === i || l.to === i).reduce((s, l) => s + (l.b ?? 0) / 2, 0);
      expect(row.re).toBeCloseTo(0, 12);
      expect(row.im).toBeCloseTo(charging, 12);
    }
  });
  it('Newton–Raphson converges quadratically in a few iterations', () => {
    const k = pflowInfo(base);
    expect(k.nr.converged).toBe(true);
    expect(k.nrIts).toBeLessThanOrEqual(5);
    const m = k.nr.history.map((h) => h.mismatch);
    // Near the solution the error is roughly squared at each step.
    expect(m[3]).toBeLessThan(10 * m[2] ** 2);
    expect(k.gsIts).toBeGreaterThan(5 * k.nrIts);
  });
  it('Newton–Raphson and Gauss–Seidel reach the same solution', () => {
    const k = pflowInfo(base);
    const gs = k.gs[k.gs.length - 1];
    for (let i = 0; i < 4; i++) {
      expect(gs.V[i]).toBeCloseTo(k.nr.V[i], 6);
      expect(gs.th[i]).toBeCloseTo(k.nr.th[i], 6);
    }
  });
  it('the slack bus supplies the load, minus generator 2, plus positive losses', () => {
    const k = pflowInfo(base);
    expect(k.nr.losses).toBeGreaterThan(0);
    expect(k.nr.Pg[0]).toBeCloseTo(NET.load3 + NET.load4 - 0.8 + k.nr.losses, 8);
  });
  it('the DC power flow is within 10 % of the AC flows on loaded lines', () => {
    const k = pflowInfo(base);
    k.nr.flows.forEach((f, j) => {
      if (Math.abs(f.Pij) > 0.2) expect(Math.abs(k.dc[j] / f.Pij - 1)).toBeLessThan(0.1);
    });
  });
  it('a line outage zeroes its Y entries and the power reroutes', () => {
    const k = pflowInfo({ ...base, out: 1 }); // line 1–3
    expect(cabs(k.Y[0][2])).toBe(0);
    expect(k.nr.converged).toBe(true);
    expect(k.nr.flows[1].Pij).toBe(0);
  });
  it('a PV bus at its reactive limit becomes PQ and lets its voltage go', () => {
    const { buses, branches } = network({ ...base, Q2max: 0.1, lambda: 1.5 });
    const r = newtonRaphson(buses, branches);
    expect(r.qLimited[1]).toBe(true);
    expect(r.Qg[1]).toBeCloseTo(0.1, 6);
    expect(r.V[1]).toBeLessThan(1.01);
  });
  it('beyond the nose there is no solution', () => {
    expect(pflowInfo({ ...base, lambda: 3.5 }).nr.converged).toBe(false);
  });
});

describe('P–V and Q–V (5.2)', () => {
  const base = { P2: 0.8, V2: 1.01, out: 0, pf: 0.9, Q2max: 5, B4: 0 };
  const lmax = pvInfo(base).lambdaMax;
  it('the nose is between 2 and 3.5 times the base load', () => {
    expect(lmax).toBeGreaterThan(2);
    expect(lmax).toBeLessThan(3.5);
  });
  it('a reactive limit, a line outage and a poor power factor move the nose in; a capacitor moves it out', () => {
    const k = pvLessonInfo({ ...base, Q2max: 1 });
    expect(k.lambdaQlim).not.toBeNull();
    expect(k.lambdaMax).toBeLessThan(k.lambdaMaxNoLim - 0.05);
    expect(pvInfo({ ...base, out: 1 }).lambdaMax).toBeLessThan(0.7 * lmax);
    expect(pvInfo({ ...base, pf: 0.85 }).lambdaMax).toBeLessThan(lmax);
    expect(pvInfo({ ...base, B4: 0.4 }).lambdaMax).toBeGreaterThan(lmax);
  });
  it('voltage falls faster and faster towards the nose', () => {
    const ok = pvInfo(base).pts.filter((q) => q.ok);
    const slope = (j: number) => (ok[j].V[3] - ok[j - 10].V[3]) / (ok[j].lambda - ok[j - 10].lambda);
    expect(Math.abs(slope(ok.length - 1))).toBeGreaterThan(4 * Math.abs(slope(20)));
  });
  it('the Q–V margin is positive at base load and shrinks towards the nose', () => {
    const m1 = qvCurve(base, 1).margin!;
    const m2 = qvCurve(base, lmax - 0.1).margin!;
    expect(m1).toBeGreaterThan(1);
    expect(m2).toBeLessThan(m1 / 3);
    expect(qvCurve(base, lmax + 0.2).margin ?? -1).toBeLessThan(0.05);
  });
});

describe('faults (5.3)', () => {
  const base = { type: FAULT_TYPES.slg, ground: GROUNDING.solid, km: 50, Rf: 0 };
  const I = (p: object) => faultInfo({ ...base, ...p }).Imax;
  it('a phase-to-phase fault draws √3/2 of the three-phase current', () => {
    expect(I({ type: FAULT_TYPES.ll }) / I({ type: FAULT_TYPES.tph })).toBeCloseTo(Math.sqrt(3) / 2, 6);
  });
  it('with an isolated neutral, a ground fault draws almost nothing and healthy phases rise to √3', () => {
    const k = faultInfo({ ...base, ground: GROUNDING.isolated });
    expect(k.Imax).toBeLessThan(1e-6);
    expect(cabs(k.Vabc[1])).toBeCloseTo(Math.sqrt(3), 2);
  });
  it('near a grounded-star transformer, a ground fault exceeds the three-phase fault', () => {
    expect(I({ km: 0 })).toBeGreaterThan(I({ km: 0, type: FAULT_TYPES.tph }));
    expect(I({ km: 0, ground: GROUNDING.resistance })).toBeLessThan(I({ km: 0 }));
  });
  it('fault current falls with distance and with fault resistance', () => {
    expect(I({ km: 100 })).toBeLessThan(I({ km: 10 }));
    expect(I({ Rf: 0.5 })).toBeLessThan(0.75 * I({}));
  });
  it('the three-phase fault level is S_base/|Z1|', () => {
    const k = faultInfo({ ...base, km: 0, type: FAULT_TYPES.tph });
    expect(k.Ssc).toBeCloseTo(FAULT.Sbase / (FAULT.Xg1 + FAULT.Xt), 6);
  });
  it('the phase currents stay continuous at the fault instant', () => {
    const run = faultModel.simulate(base, 0.12, 2400);
    const j = run.t.findIndex((t) => t >= FAULT.tFault);
    for (const s of ['ia', 'ib', 'ic']) expect(Math.abs(run.s[s][j] - run.s[s][j - 1])).toBeLessThan(0.05);
  });
});

describe('economic dispatch (5.4)', () => {
  const base = { peak: 1000, solar: 0, Fmax: 1000, gas: 1 };
  it('units not at a limit share one marginal cost, and supply meets demand', () => {
    const r = dispatch(base, 980, 0);
    const interior = r.units.filter((u) => u.P > 1 && u.P < u.Pmax - 1);
    expect(interior.length).toBeGreaterThanOrEqual(2);
    interior.forEach((u) => expect(u.mc).toBeCloseTo(r.lambda, 3));
    expect(r.units.reduce((s, u) => s + u.P, 0)).toBeCloseTo(980, 3);
  });
  it('the merit order: the peaker runs only at high demand', () => {
    expect(dispatch(base, 700, 0).units[2].P).toBe(0);
    expect(dispatch(base, 1100, 0).units[2].P).toBeGreaterThan(10);
  });
  it('a congested line is held at its limit and splits the nodal prices', () => {
    const r = dispatch({ ...base, Fmax: 350 }, 900, 0);
    expect(r.congested).toBe(true);
    expect(r.flows[2]).toBeCloseTo(350, 1);
    expect(r.lmp[0]).toBeLessThan(r.lmp[1]);
    expect(r.lmp[1]).toBeLessThan(r.lmp[2]);
    expect(r.cost).toBeGreaterThan(dispatch(base, 900, 0).cost);
  });
  it('solar lowers the midday price; behind a tight line some of it is curtailed', () => {
    const d0 = dispatchInfo({ ...base, peak: 850 });
    const d1 = dispatchInfo({ ...base, peak: 850, solar: 300 });
    expect(d1.hours[13].lambda).toBeLessThan(d0.hours[13].lambda - 5);
    expect(Math.max(...dispatchInfo({ ...base, peak: 850, solar: 600, Fmax: 300 }).hours.map((h) => h.curtailed))).toBeGreaterThan(50);
  });
  it('units are ordered by marginal cost', () => {
    expect(UNITS[0].b).toBeLessThan(UNITS[1].b);
    expect(UNITS[1].b).toBeLessThan(UNITS[2].b);
  });
});

describe('feeder with PV (5.5)', () => {
  const base = { pv: 2.5, control: CONTROLS.none, Vsub: 1.03, cable: 0 };
  it('PV raises the voltage at the end of the feeder and reverses the flow at midday', () => {
    const k = feederInfo(base);
    expect(k.hours[26].V[5]).toBeGreaterThan(k.hours[26].V[0]); // 13 h
    expect(k.hours[39].V[5]).toBeLessThan(k.hours[39].V[0]); // 19 h 30
    expect(k.reverseHours).toBeGreaterThan(2);
  });
  it('with no control the hosting capacity is about 3 MW per node', () => {
    const h = feederInfo(base).hosting;
    expect(h).toBeGreaterThan(2.5);
    expect(h).toBeLessThan(3.6);
    expect(feederInfo({ ...base, pv: 4 }).vMax).toBeGreaterThan(1.05);
  });
  it('Q(V) keeps 3.5 MW per node under 1.05 pu without curtailing', () => {
    const k = feederInfo({ ...base, pv: 3.5, control: CONTROLS.qv });
    expect(k.vMax).toBeLessThanOrEqual(1.051);
    expect(k.curtailedMWh).toBe(0);
    expect(k.hosting).toBeGreaterThan(feederInfo(base).hosting);
  });
  it('curtailment holds the voltage but loses energy', () => {
    const k = feederInfo({ ...base, pv: 5, control: CONTROLS.curtail });
    expect(k.vMax).toBeLessThan(1.06);
    expect(k.curtailedMWh).toBeGreaterThan(0.5);
  });
  it('lowering the substation voltage causes undervoltage at the evening peak', () => {
    expect(feederInfo({ ...base, Vsub: 1.0 }).vMin).toBeLessThan(0.95);
  });
});

describe('Gauss–Seidel on a PV bus', () => {
  it('holds the PV bus voltage magnitude', () => {
    const { buses, branches } = network({ lambda: 1, P2: 0.8, V2: 1.04, out: 0 });
    const gs = gaussSeidel(buses, branches);
    expect(gs[gs.length - 1].V[1]).toBeCloseTo(1.04, 9);
  });
});
