import { describe, expect, it } from 'vitest';
import { runEmt, type EmtElement } from './emt';
import { rlSeries, timedSwitch, vsource, waves } from './elements';
import { inductionMotor, syncMachine } from './machines';

/** SMIB: machine (nodes 1–3) — line X — infinite bus; optional fault at the machine terminals. */
function smib(faultFrom: number, faultFor: number, T: number) {
  const Vn = 20e3, Sn = 100e6, f = 50, Zb = (Vn * Vn) / Sn, w0 = 2 * Math.PI * f, Vph = (Math.SQRT2 * Vn) / Math.sqrt(3);
  const nOut = Math.round(T * 2000), sub = 10, h = T / (nOut * sub);
  let next = 7;
  const node = () => next++;
  const els: EmtElement[] = [
    ...syncMachine('G', [1, 2, 3], { Sn, Vn, f, H: 4, D: 1, xd: 0.3, ra: 0.003, P0: 0.8, E0: 1.15, KA: 0, TA: 0.05, Vref: 1, R: 0, Tg: 0.5, tRel: 0.6, delta0: Math.asin((0.8 * 0.8) / 1.15) }, h, node),
  ];
  for (let k = 0; k < 3; k++) {
    els.push(rlSeries(`L${k}`, 1 + k, 4 + k, 0.01 * Zb, (0.5 * Zb) / w0, h));
    els.push(vsource(`B${k}`, 4 + k, 0, waves.ac(Vph, f, -120 * k)));
    if (faultFor > 0) els.push(timedSwitch(`F${k}`, 1 + k, 0, faultFrom, faultFrom + faultFor, 0.01, 1e9));
  }
  return runEmt(next, els, T, nOut, sub);
}

describe('synchronous machine on an infinite bus', () => {
  it('initialises at P_e = P_m and rides through a short fault', () => {
    const r = smib(1.0, 0.06, 3);
    const Pe = r.out['G.Pe'], d = r.out['G.delta'];
    const k = (t: number) => Math.round((t / 3) * 6000);
    expect(Pe[k(0.95)]).toBeCloseTo(0.8, 1);
    expect(Math.max(...d.slice(k(1.0)))).toBeLessThan(180);
    expect(Math.abs(d[k(2.95)] - d[k(0.95)])).toBeLessThan(15); // back near its pre-fault angle
  });

  it('loses synchronism when the fault lasts too long', () => {
    const r = smib(1.0, 0.5, 3);
    const d = r.out['G.delta'];
    expect(Math.max(...d)).toBeGreaterThan(360);
  });
});

describe('induction motor', () => {
  it('starts from standstill with a large inrush and settles near synchronous speed', () => {
    const Vn = 400, f = 50, Vph = (Math.SQRT2 * Vn) / Math.sqrt(3), T = 2, nOut = 4000, sub = 5;
    let next = 4;
    const node = () => next++;
    const els: EmtElement[] = [
      vsource('Va', 1, 0, waves.ac(Vph, f, 0)),
      vsource('Vb', 2, 0, waves.ac(Vph, f, -120)),
      vsource('Vc', 3, 0, waves.ac(Vph, f, 120)),
      ...inductionMotor('M', [1, 2, 3], { Pn: 15e3, Vn, f, pp: 2, rs: 0.02, rr: 0.02, xls: 0.08, xlr: 0.08, xm: 3, H: 0.3, T0: 0.5, fan: 1 }, T / (nOut * sub), node),
    ];
    const r = runEmt(next, els, T, nOut, sub);
    const n = r.out['M.n'], ia = r.out['M.ia'];
    const Irated = (Math.SQRT2 * 15e3) / (Math.sqrt(3) * 400 * 0.85);
    expect(Math.max(...ia.slice(0, 400).map(Math.abs))).toBeGreaterThan(4 * Irated);
    expect(n[nOut]).toBeGreaterThan(1440);
    expect(n[nOut]).toBeLessThan(1500);
  });
});
