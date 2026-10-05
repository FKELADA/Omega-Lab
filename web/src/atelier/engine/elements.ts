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
  const Lv = Math.max(L, 1e-12);
  let g = h / (2 * Lv), be = false;
  let hist = 0;
  const e: EmtElement = {
    id, v: 0, i: 0,
    state: { get: () => e.i + g * e.v, set: (s) => ((e.i = s), (e.v = 0)) },
    setStep: (hh, b2) => ((be = b2), (g = b2 ? hh / Lv : hh / (2 * Lv))),
    stamp: (A, sys) => addG(A, sys, a, b, g),
    rhs(bb, _t, sys) {
      // Trapezoidal: i_n = g v_n + i_{n−1} + g v_{n−1}; backward Euler: i_n = g v_n + i_{n−1}.
      hist = be ? this.i : this.i + g * this.v;
      addI(bb, sys, a, b, hist);
    },
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = g * this.v + hist;
    },
  };
  return e;
}

export function capacitor(id: string, a: number, b: number, C: number, h: number): EmtElement {
  const Cv = Math.max(C, 1e-15);
  let g = (2 * Cv) / h, be = false;
  let hist = 0;
  const e: EmtElement = {
    id, v: 0, i: 0,
    state: { get: () => -(g * e.v + e.i), set: (s) => ((e.v = 0), (e.i = -s)) },
    setStep: (hh, b2) => ((be = b2), (g = b2 ? Cv / hh : (2 * Cv) / hh)),
    stamp: (A, sys) => addG(A, sys, a, b, g),
    rhs(bb, _t, sys) {
      // Trapezoidal: i_n = g v_n − (g v_{n−1} + i_{n−1}); backward Euler: i_n = g v_n − g v_{n−1}.
      hist = be ? -g * this.v : -(g * this.v + this.i);
      addI(bb, sys, a, b, hist);
    },
    update(x, _t, sys) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = g * this.v + hist;
    },
  };
  return e;
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

/**
 * Series R–L branch in one companion model.
 * Trapezoidal: i_n = g v_n + g [v_{n−1} + (2L/h − R) i_{n−1}], g = 1/(R + 2L/h).
 * Backward Euler: i_n = g v_n + g (L/h) i_{n−1}, g = 1/(R + L/h).
 */
export function rlSeries(id: string, a: number, b: number, R: number, L: number, h: number): EmtElement {
  const Lv = Math.max(L, 0), Rv = Math.max(R, 0);
  let hh = h, be = false;
  const gOf = () => 1 / Math.max(Rv + (be ? Lv / hh : (2 * Lv) / hh), 1e-12);
  let g = gOf(), hist = 0;
  const e: EmtElement = {
    id, v: 0, i: 0,
    state: Lv > 0 ? { get: () => g * (e.v + ((2 * Lv) / hh - Rv) * e.i), set: (s) => ((e.v = s / g), (e.i = 0)) } : undefined,
    setStep: (h2, b2) => ((hh = h2), (be = b2), (g = gOf())),
    stamp: (A, sys) => addG(A, sys, a, b, g),
    rhs(bb, _t, sys) {
      hist = be ? g * (Lv / hh) * e.i : g * (e.v + ((2 * Lv) / hh - Rv) * e.i);
      addI(bb, sys, a, b, hist);
    },
    update(x, _t, sys) {
      e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      e.i = g * e.v + hist;
    },
  };
  return e;
}

/** Records node voltages and other elements' currents as named outputs (composite elements). */
export function monitor(id: string, read: (x: number[], node: (n: number) => number) => Record<string, number>, init: Record<string, number>): EmtElement {
  let vals = init;
  return {
    id, v: 0, i: 0,
    stamp: () => {},
    rhs: () => {},
    update(x, _t, sys) {
      vals = read(x, (n) => nodeV(x, sys, n));
      this.v = vals.v ?? 0;
      this.i = vals.i ?? 0;
    },
    out: () => vals,
  };
}

/**
 * Ideal transformer: v(a,b) = n·v(c,d), and the secondary delivers n times the
 * primary current. One extra unknown: the primary current j, entering at a.
 */
export function idealXfmr(id: string, a: number, b: number, c: number, d: number, n: number): EmtElement {
  return {
    id, v: 0, i: 0, extra: 1,
    stamp(A, sys, k) {
      const put = (node: number, s: number) => {
        const r = sys.row(node);
        if (r >= 0) (A[r][k] += s), (A[k][r] += s);
      };
      put(a, 1);
      put(b, -1);
      put(c, -n);
      put(d, n);
    },
    rhs: () => {},
    update(x, _t, sys, k) {
      this.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      this.i = x[k];
    },
  };
}

/**
 * Saturable inductor: flux–current characteristic in two slopes, L below the knee
 * flux ψk and Lsat above it, starting from the residual flux ψ0. Its segment
 * follows the flux reached by each solve (re-solved when it changes).
 */
export function satInductor(id: string, a: number, b: number, L: number, Lsat: number, psiK: number, psi0: number, h: number): EmtElement & { psi: number } {
  let hh = h, be = false;
  let seg = Math.abs(psi0) > psiK ? Math.sign(psi0) : 0; // −1, 0, +1
  const Lof = (s: number) => (s === 0 ? L : Lsat);
  // i = (ψ − ψoff)/Lseg: the saturated slopes start where the linear one ends.
  const off = (s: number) => (s === 0 ? 0 : s * psiK * (1 - Lsat / L));
  const g = () => (be ? hh : hh / 2) / Lof(seg);
  const segOf = (psi: number) => (psi > psiK ? 1 : psi < -psiK ? -1 : 0);
  let psiPred = 0;
  const e = {
    id, v: 0, i: (psi0 - off(seg)) / Lof(seg), psi: psi0,
    setStep: (h2: number, b2: boolean) => ((hh = h2), (be = b2)),
    stamp: (A: number[][], sys: { n: number; row(n: number): number }) => addG(A, sys, a, b, g()),
    rhs(bb: number[], _t: number, sys: { n: number; row(n: number): number }) {
      // ψ_n = ψ_{n−1} + (h/2)(v_n + v_{n−1})  (BE: + h v_n); i_n = (ψ_n − ψoff)/L_seg.
      psiPred = be ? e.psi : e.psi + (hh / 2) * e.v;
      addI(bb, sys, a, b, (psiPred - off(seg)) / Lof(seg));
    },
    check(x: number[], _t: number, sys: { n: number; row(n: number): number }) {
      const v = nodeV(x, sys, a) - nodeV(x, sys, b);
      const psi = psiPred + (be ? hh : hh / 2) * v;
      const s = segOf(psi);
      if (s === seg) return false;
      seg = s;
      return true;
    },
    update(x: number[], _t: number, sys: { n: number; row(n: number): number }) {
      e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      e.psi = psiPred + (be ? hh : hh / 2) * e.v;
      e.i = (e.psi - off(seg)) / Lof(seg);
    },
  };
  return e;
}
