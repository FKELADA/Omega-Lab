// Companion models of the elementary components (trapezoidal rule, step h).
// Sign convention: v = v(first port) − v(second port); i flows through the
// element from the first port to the second (receptor convention), except for
// sources, whose current is the one they deliver out of their first (+) port.

import { addG, addI, nodeV, type EmtElement } from './emt';

export type Wave = (t: number) => number;

export const waves = {
  dc: (V: number): Wave => () => V,
  ac: (Vpk: number, f: number, phaseDeg: number): Wave => {
    const w = 2 * Math.PI * f, ph = (phaseDeg * Math.PI) / 180;
    return (t) => Vpk * Math.cos(w * t + ph);
  },
  step: (V: number, t0: number): Wave => (t) => (t >= t0 ? V : 0),
  square: (V: number, f: number): Wave => (t) => (((t * f) % 1) < 0.5 ? V : -V),
};

export function resistor(id: string, a: number, b: number, R: number): EmtElement {
  const g = 1 / Math.max(R, 1e-9);
  return {
    id, v: 0, i: 0,
    stamp: (A, sys) => addG(A, sys, a, b, g),
    rhs: () => {},
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = g * this.v;
    },
  };
}

export function inductor(id: string, a: number, b: number, L: number, h: number): EmtElement {
  const g = h / (2 * Math.max(L, 1e-12));
  let hist = 0;
  return {
    id, v: 0, i: 0,
    stamp: (A, sys) => addG(A, sys, a, b, g),
    rhs(bb, _t, sys) {
      hist = this.i + g * this.v;
      addI(bb, sys, a, b, hist);
    },
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = g * this.v + hist;
    },
  };
}

export function capacitor(id: string, a: number, b: number, C: number, h: number): EmtElement {
  const g = (2 * Math.max(C, 1e-15)) / h;
  let hist = 0;
  return {
    id, v: 0, i: 0,
    stamp: (A, sys) => addG(A, sys, a, b, g),
    rhs(bb, _t, sys) {
      hist = -(g * this.v + this.i);
      addI(bb, sys, a, b, hist);
    },
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = g * this.v + hist;
    },
  };
}

/** Ideal voltage source (+ at a). Its current is the one delivered out of a. */
export function vsource(id: string, a: number, b: number, wave: Wave): EmtElement {
  return {
    id, v: 0, i: 0, extra: 1,
    stamp(A, sys, k) {
      const ra = sys.row(a), rb = sys.row(b);
      if (ra >= 0) (A[ra][k] += 1), (A[k][ra] += 1);
      if (rb >= 0) (A[rb][k] -= 1), (A[k][rb] -= 1);
    },
    rhs(bb, t, _sys, k) {
      bb[k] = wave(t);
    },
    update(x, t, _sys, k) {
      this.v = wave(t);
      this.i = -x[k];
    },
  };
}

/** Ideal current source, delivering i(t) out of a (through the external circuit back into b). */
export function isource(id: string, a: number, b: number, wave: Wave): EmtElement {
  return {
    id, v: 0, i: 0,
    stamp: () => {},
    rhs(bb, t, sys) {
      addI(bb, sys, b, a, wave(t));
    },
    update(x, t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = wave(t);
    },
  };
}

/** Time-controlled switch: closed between tClose and tOpen (tOpen ≤ tClose: stays closed). */
export function timedSwitch(id: string, a: number, b: number, tClose: number, tOpen: number, Ron = 1e-3, Roff = 1e9): EmtElement {
  const closedAt = (t: number) => t >= tClose && (tOpen <= tClose || t < tOpen);
  let closed = closedAt(0);
  const g = () => 1 / (closed ? Ron : Roff);
  return {
    id, v: 0, i: 0,
    stamp: (A, sys) => addG(A, sys, a, b, g()),
    rhs: () => {},
    changed(t) {
      const c = closedAt(t);
      if (c === closed) return false;
      closed = c;
      return true;
    },
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = g() * this.v;
    },
  };
}

/** Ammeter: a zero-volt source; i is the current from its + port to its − port. */
export function ammeter(id: string, a: number, b: number): EmtElement {
  return {
    id, v: 0, i: 0, extra: 1,
    stamp(A, sys, k) {
      const ra = sys.row(a), rb = sys.row(b);
      if (ra >= 0) (A[ra][k] += 1), (A[k][ra] += 1);
      if (rb >= 0) (A[rb][k] -= 1), (A[k][rb] -= 1);
    },
    rhs: () => {},
    update(x, _t, _sys, k) {
      this.v = 0;
      this.i = x[k];
    },
  };
}

/** Voltmeter: draws no current. */
export function voltmeter(id: string, a: number, b: number): EmtElement {
  return {
    id, v: 0, i: 0,
    stamp: () => {},
    rhs: () => {},
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
    },
  };
}
