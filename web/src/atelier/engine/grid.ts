// Grid elements for the EMT solver: a voltage source driven by a controller,
// the Bergeron travelling-wave line, and a breaker that interrupts at current zero.

import { addG, addI, nodeV, type EmtElement } from './emt';

/** Ideal voltage source (+ at a) whose value is read from `value()` at every step (set by a controller). */
export function vsrcVar(id: string, a: number, b: number, value: () => number): EmtElement {
  return {
    id, v: 0, i: 0, extra: 1,
    stamp(A, sys, k) {
      const ra = sys.row(a), rb = sys.row(b);
      if (ra >= 0) (A[ra][k] += 1), (A[k][ra] += 1);
      if (rb >= 0) (A[rb][k] -= 1), (A[k][rb] -= 1);
    },
    rhs(bb, _t, _sys, k) {
      bb[k] = value();
    },
    update(x, _t, _sys, k) {
      this.v = value();
      this.i = -x[k];
    },
  };
}

/**
 * Lossless Bergeron line between node k (end 1) and node m (end 2), both
 * against ground. Each end is a conductance 1/Zc and a current source carrying
 * what left the other end τ seconds earlier:
 *   i_k(t) = v_k(t)/Zc − [v_m(t−τ)/Zc + i_m(t−τ)].
 */
export function bergeron(id: string, k: number, m: number, Zc: number, tau: number): EmtElement & { ik: number; im: number } {
  const g = 1 / Zc;
  // History of (t, v_k, i_k, v_m, i_m), interpolated at t − τ.
  const T: number[] = [], VK: number[] = [], IK: number[] = [], VM: number[] = [], IM: number[] = [];
  let lo = 0;
  let hk = 0, hm = 0;
  const past = (arr: number[], t: number) => {
    if (!T.length || t <= T[0]) return 0;
    while (lo < T.length - 2 && T[lo + 1] <= t) lo++;
    const j = Math.min(lo, T.length - 2);
    if (j < 0) return arr[0];
    const f = (t - T[j]) / (T[j + 1] - T[j] || 1);
    return arr[j] + Math.max(0, Math.min(1, f)) * (arr[j + 1] - arr[j]);
  };
  const e = {
    id, v: 0, i: 0, ik: 0, im: 0,
    stamp(A: number[][], sys: { n: number; row(n: number): number }) {
      addG(A, sys, k, 0, g);
      addG(A, sys, m, 0, g);
    },
    rhs(b: number[], t: number, sys: { n: number; row(n: number): number }) {
      const tp = t - tau;
      hk = -(g * past(VM, tp) + past(IM, tp));
      hm = -(g * past(VK, tp) + past(IK, tp));
      addI(b, sys, k, 0, hk);
      addI(b, sys, m, 0, hm);
    },
    update(x: number[], t: number, sys: { n: number; row(n: number): number }) {
      const vk = nodeV(x, sys, k), vm = nodeV(x, sys, m);
      e.ik = g * vk + hk;
      e.im = g * vm + hm;
      T.push(t);
      VK.push(vk);
      IK.push(e.ik);
      VM.push(vm);
      IM.push(e.im);
      e.v = vk;
      e.i = e.ik;
    },
  };
  return e;
}

/**
 * Circuit breaker. Starting closed: ordered open at tOpen, it interrupts at the
 * next zero crossing of its current, as a real breaker does, and recloses at
 * tClose if tClose > tOpen. Starting open: it closes at tClose, then opens (at
 * a current zero) at tOpen if tOpen > tClose.
 */
export function breaker(id: string, a: number, b: number, tOpen: number, tClose: number, closed0 = true, Ron = 1e-4, Roff = 1e8): EmtElement {
  let closed = closed0, armed = false, prev = 0, didClose = false, didOpen = false;
  const closeAt = closed0 ? (tOpen > 0 && tClose > tOpen ? tClose : Infinity) : tClose > 0 ? tClose : Infinity;
  const openAt = closed0 ? (tOpen > 0 ? tOpen : Infinity) : tClose > 0 && tOpen > tClose ? tOpen : Infinity;
  const g = () => 1 / (closed ? Ron : Roff);
  const e: EmtElement = {
    id, v: 0, i: 0,
    stamp: (A, sys) => addG(A, sys, a, b, g()),
    rhs: () => {},
    changed(t) {
      if (!closed && !didClose && t >= closeAt && (closed0 ? didOpen : true)) {
        closed = true;
        didClose = true;
        armed = false;
        return true;
      }
      if (closed && !armed && !didOpen && t >= openAt) armed = true;
      return false;
    },
    check(x, _t, sys) {
      if (!closed || !armed) return false;
      const i = g() * (nodeV(x, sys, a) - nodeV(x, sys, b));
      // Interrupt when the current crosses zero (or is already negligible).
      if (i * prev < 0 || Math.abs(i) < 1e-6) {
        closed = false;
        armed = false;
        didOpen = true;
        return true;
      }
      return false;
    },
    update(x, _t, sys) {
      e.v = nodeV(x, sys, a) - nodeV(x, sys, b);
      e.i = g() * e.v;
      if (closed) prev = e.i;
    },
  };
  return e;
}
