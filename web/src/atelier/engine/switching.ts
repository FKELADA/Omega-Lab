// Power semiconductors as two-state resistances (on: R_on with a threshold
// voltage V_f; off: R_off). The state follows the solution itself: a diode that
// would carry a negative current blocks, one that sees more than V_f conducts,
// and the step is re-solved (EmtElement.check). Gate signals are functions of time.

import { addG, addI, nodeV, type EmtElement } from './emt';

export type Gate = (t: number) => boolean;

const ROFF = 1e7;

/** Fractional part, in [0, 1). */
const frac = (x: number) => x - Math.floor(x);

export const gates = {
  /** On during the first D of every period 1/fs (phase in degrees shifts it). */
  duty: (fs: number, D: number, phDeg = 0): Gate => (t) => frac(t * fs - phDeg / 360) < D,
  /** Sine-triangle PWM: on while m·cos(2πft + φ) exceeds a ±1 triangle carrier at fs. */
  sine: (fs: number, m: number, f: number, phDeg: number, top = true): Gate => {
    const w = 2 * Math.PI * f, ph = (phDeg * Math.PI) / 180;
    return (t) => {
      const c = 4 * Math.abs(frac(t * fs) - 0.5) - 1; // triangle in [−1, 1]
      const on = m * Math.cos(w * t + ph) > c;
      return top ? on : !on;
    };
  },
  /** A firing window of `width` degrees, starting `startDeg` into every period of f (thyristors). */
  window: (f: number, startDeg: number, width = 120): Gate => (t) => {
    const deg = frac(t * f - startDeg / 360) * 360;
    return deg < width;
  },
};

interface Semi {
  Ron: number;
  Vf: number;
}

/** A state-switched resistance between a and b, with threshold Vf when on. */
function twoState(id: string, a: number, b: number, s: Semi, next: (on: boolean, v: number, i: number, t: number) => boolean): EmtElement & { on: boolean } {
  const gOn = 1 / Math.max(s.Ron, 1e-6), gOff = 1 / ROFF;
  const e = {
    id, v: 0, i: 0, on: false,
    stamp(A: number[][], sys: { row(n: number): number; n: number }) {
      addG(A, sys, a, b, e.on ? gOn : gOff);
    },
    rhs(bb: number[], _t: number, sys: { row(n: number): number; n: number }) {
      // On: i = g (v − Vf), i.e. a conductance plus a current −g·Vf from a to b.
      if (e.on && s.Vf) addI(bb, sys, a, b, -gOn * s.Vf);
    },
    check(x: number[], t: number, sys: { row(n: number): number; n: number }) {
      const v = nodeV(x, sys, a) - nodeV(x, sys, b);
      const i = e.on ? gOn * (v - s.Vf) : gOff * v;
      const want = next(e.on, v, i, t);
      if (want === e.on) return false;
      e.on = want;
      return true;
    },
    update(x: number[], _t: number, sys: { row(n: number): number; n: number }) {
      e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      e.i = e.on ? gOn * (e.v - s.Vf) : gOff * e.v;
    },
  };
  return e;
}

/** Diode, anode a, cathode k. */
export function diode(id: string, a: number, k: number, Ron = 1e-3, Vf = 0): EmtElement {
  return twoState(id, a, k, { Ron, Vf }, (on, v, i) => (on ? i > -1e-9 : v > Vf + 1e-9));
}

/** Thyristor: turns on when forward-biased during its gate window, off when its current reverses. */
export function thyristor(id: string, a: number, k: number, gate: Gate, Ron = 1e-3, Vf = 0): EmtElement {
  return twoState(id, a, k, { Ron, Vf }, (on, v, i, t) => (on ? i > -1e-9 : gate(t) && v > Vf + 1e-9));
}

/**
 * IGBT (collector c, emitter e) with its antiparallel diode: conducts both ways
 * while the gate is on; otherwise only the diode can conduct, from e to c.
 */
export function igbt(id: string, c: number, em: number, gate: Gate, Ron = 1e-3): EmtElement {
  const gOn = 1 / Math.max(Ron, 1e-6), gOff = 1 / ROFF;
  let gated = false, diodeOn = false;
  const g = () => (gated || diodeOn ? gOn : gOff);
  const e: EmtElement = {
    id, v: 0, i: 0,
    stamp: (A, sys) => addG(A, sys, c, em, g()),
    rhs: () => {},
    changed(t) {
      const want = gate(t);
      if (want === gated) return false;
      gated = want;
      if (gated) diodeOn = false;
      return true;
    },
    check(x, _t, sys) {
      if (gated) return false;
      const v = nodeV(x, sys, c) - nodeV(x, sys, em);
      const i = g() * v;
      const want = diodeOn ? i < 1e-9 : v < -1e-9;
      if (want === diodeOn) return false;
      diodeOn = want;
      return true;
    },
    update(x, _t, sys) {
      e.v = nodeV(x, sys, c) - nodeV(x, sys, em);
      e.i = g() * e.v;
    },
  };
  return e;
}
