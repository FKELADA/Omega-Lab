// Frequency-domain nodal analysis: the same circuit with impedances jωL and
// 1/jωC, solved for complex phasors. It gives the sinusoidal steady state, any
// transfer function (Bode) and the impedance seen from a node.

import { cx, type Complex } from '../../lib/core/linalg';

/** How an element enters the AC equations. */
export type AcModel =
  | { kind: 'Y'; y: (p: Record<string, number>, w: number) => Complex }
  /** A voltage source (or an ammeter, with a zero phasor). `phasor` gives its own value at f, or null if it has none there. */
  | { kind: 'V'; phasor: (p: Record<string, number>, f: number) => Complex | null; meter?: boolean }
  | { kind: 'I'; phasor: (p: Record<string, number>, f: number) => Complex | null }
  /** Several terminals (three-phase elements): stamps its own admittances and sources. */
  | { kind: 'multi'; nV: number; nInt?: number; stamp: (ctx: AcCtx, nodes: number[], p: Record<string, number>) => void }
  | { kind: 'none' };

/** How a source is driven in one solve: its own phasor, a unit phasor (transfer functions), or off. */
export type Drive = 'own' | 'unit' | 'off';

export interface AcCtx {
  w: number;
  f: number;
  drive: Drive;
  /** Admittance between two nodes (0 = ground). */
  y(a: number, b: number, Y: Complex): void;
  /** Ideal voltage source of phasor V from b to a (uses the element's next extra unknown). */
  v(a: number, b: number, V: Complex): void;
  /** Current I delivered out of a, back into b. */
  i(a: number, b: number, I: Complex): void;
  /** A new internal node (counted in the model's nInt). */
  node(): number;
  /** Ideal transformer v(a,b) = n·v(c,d) (uses one of the model's nV unknowns). */
  xfmr(a: number, b: number, c: number, d: number, n: number): void;
}

export interface AcItem {
  id: string;
  nodes: number[];
  p: Record<string, number>;
  model: AcModel;
}

export interface AcResult {
  /** Node voltages (index 0 = ground). */
  nodes: Complex[];
  v: Record<string, Complex>;
  i: Record<string, Complex>;
  singular: boolean;
}

const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
const mul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const div = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const abs2 = (a: Complex) => a.re * a.re + a.im * a.im;

/** Gaussian elimination with partial pivoting on a complex system (A is overwritten). */
export function csolve(A: Complex[][], b: Complex[]): Complex[] | null {
  const n = A.length;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let r = k + 1; r < n; r++) if (abs2(A[r][k]) > abs2(A[p][k])) p = r;
    if (abs2(A[p][k]) < 1e-280) return null;
    [A[k], A[p]] = [A[p], A[k]];
    [b[k], b[p]] = [b[p], b[k]];
    for (let r = k + 1; r < n; r++) {
      const f = div(A[r][k], A[k][k]);
      if (!f.re && !f.im) continue;
      for (let c = k; c < n; c++) A[r][c] = sub(A[r][c], mul(f, A[k][c]));
      b[r] = sub(b[r], mul(f, b[k]));
    }
  }
  const x = new Array<Complex>(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s = sub(s, mul(A[r][c], x[c]));
    x[r] = div(s, A[r][r]);
  }
  return x;
}

/**
 * Solves the circuit at angular frequency w. `drive(item)` gives each source's
 * phasor (zero turns a voltage source into a short and a current source into
 * an open circuit).
 */
export function solveAc(nNodes: number, items: AcItem[], w: number, driveOf: (it: AcItem) => Drive): AcResult {
  const f = w / (2 * Math.PI);
  const phasor = (it: AcItem): Complex => {
    const d = driveOf(it);
    if (d === 'off' || (it.model.kind !== 'V' && it.model.kind !== 'I')) return cx(0);
    return d === 'unit' ? cx(1) : (it.model.phasor(it.p, f) ?? cx(0));
  };
  const drive = phasor;
  const extra = items.filter((it) => it.model.kind === 'V');
  const nMulti = items.reduce((s, it) => s + (it.model.kind === 'multi' ? it.model.nV : 0), 0);
  const nInt = items.reduce((s, it) => s + (it.model.kind === 'multi' ? (it.model.nInt ?? 0) : 0), 0);
  const n = nNodes - 1 + extra.length + nMulti + nInt;
  const INT = 1e6;
  let nextInt = 0;
  const A = Array.from({ length: n }, () => Array.from({ length: n }, () => cx(0)));
  const b = Array.from({ length: n }, () => cx(0));
  // Internal nodes of multi-terminal models get ids from 1e6, mapped after every other unknown.
  const row = (nd: number) => (nd >= INT ? nNodes - 1 + extra.length + nMulti + (nd - INT) : nd - 1);
  const base = new Map<string, number>();
  extra.forEach((it, k) => base.set(it.id, nNodes - 1 + k));
  let nextMulti = nNodes - 1 + extra.length;
  for (const it of items) {
    const [a, bb] = it.nodes;
    const ra = row(a), rb = bb === undefined ? -1 : row(bb);
    if (it.model.kind === 'Y') {
      const y = it.model.y(it.p, w);
      if (ra >= 0) A[ra][ra] = add(A[ra][ra], y);
      if (rb >= 0) A[rb][rb] = add(A[rb][rb], y);
      if (ra >= 0 && rb >= 0) (A[ra][rb] = sub(A[ra][rb], y)), (A[rb][ra] = sub(A[rb][ra], y));
    } else if (it.model.kind === 'V') {
      const k = base.get(it.id)!;
      if (ra >= 0) (A[ra][k] = add(A[ra][k], cx(1))), (A[k][ra] = add(A[k][ra], cx(1)));
      if (rb >= 0) (A[rb][k] = sub(A[rb][k], cx(1))), (A[k][rb] = sub(A[k][rb], cx(1)));
      b[k] = drive(it);
    } else if (it.model.kind === 'multi') {
      const ctx: AcCtx = {
        w,
        f,
        drive: driveOf(it),
        y: (p, q, Y) => {
          const rp = row(p), rq = row(q);
          if (rp >= 0) A[rp][rp] = add(A[rp][rp], Y);
          if (rq >= 0) A[rq][rq] = add(A[rq][rq], Y);
          if (rp >= 0 && rq >= 0) (A[rp][rq] = sub(A[rp][rq], Y)), (A[rq][rp] = sub(A[rq][rp], Y));
        },
        v: (p, q, V) => {
          const k = nextMulti++;
          const rp = row(p), rq = row(q);
          if (rp >= 0) (A[rp][k] = add(A[rp][k], cx(1))), (A[k][rp] = add(A[k][rp], cx(1)));
          if (rq >= 0) (A[rq][k] = sub(A[rq][k], cx(1))), (A[k][rq] = sub(A[k][rq], cx(1)));
          b[k] = V;
        },
        node: () => INT + nextInt++,
        xfmr: (a1, b1, c1, d1, nr) => {
          const k = nextMulti++;
          const put = (nd: number, sgn: number) => {
            const rr = row(nd);
            if (rr >= 0) (A[rr][k] = add(A[rr][k], cx(sgn))), (A[k][rr] = add(A[k][rr], cx(sgn)));
          };
          put(a1, 1);
          put(b1, -1);
          put(c1, -nr);
          put(d1, nr);
        },
        i: (p, q, I) => {
          const rp = row(p), rq = row(q);
          if (rp >= 0) b[rp] = add(b[rp], I);
          if (rq >= 0) b[rq] = sub(b[rq], I);
        },
      };
      it.model.stamp(ctx, it.nodes, it.p);
    } else if (it.model.kind === 'I') {
      // Delivered out of a, back into b (or ground for one-port probes).
      const I = drive(it);
      if (ra >= 0) b[ra] = add(b[ra], I);
      if (rb >= 0) b[rb] = sub(b[rb], I);
    }
  }
  const x = n ? csolve(A, b) : [];
  const nodes = Array.from({ length: nNodes }, (_, k) => (k === 0 || !x ? cx(0) : x[k - 1]));
  const v: Record<string, Complex> = {}, i: Record<string, Complex> = {};
  for (const it of items) {
    const [a, bb] = it.nodes;
    const vv = sub(nodes[a], bb === undefined ? cx(0) : nodes[bb]);
    v[it.id] = vv;
    if (it.model.kind === 'Y') i[it.id] = mul(it.model.y(it.p, w), vv);
    else if (it.model.kind === 'V') {
      const j = x ? x[base.get(it.id)!] : cx(0);
      // Sources: current delivered out of +; ammeters: current from + to −.
      i[it.id] = it.model.meter ? j : { re: -j.re, im: -j.im };
    } else if (it.model.kind === 'I') i[it.id] = drive(it);
    else i[it.id] = cx(0);
  }
  return { nodes, v, i, singular: !x };
}

export const cplx = { add, sub, mul, div };
