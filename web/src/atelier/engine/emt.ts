// Nodal EMT solver for the Atelier, in the manner of EMTP (Dommel): every element
// becomes a conductance plus a history current source (trapezoidal companion
// models), and every step solves the modified nodal equations A·x = b. Unknowns
// are the node voltages (ground excluded) followed by the branch currents of
// ideal voltage sources. The LU factorisation is reused until a switch changes.

export interface System {
  /** Number of unknowns (non-ground nodes + extra currents). */
  n: number;
  /** Matrix row of a node (−1 for ground). */
  row(node: number): number;
}

/** One element seen by the solver. Nodes are netlist ids; 0 is ground. */
export interface EmtElement {
  id: string;
  /** Extra unknowns (branch currents) this element needs, numbered by the solver. */
  extra?: number;
  /** Conductance stamps. Called again after `changed` returns true. */
  stamp(A: number[][], sys: System, base: number): void;
  /** Right-hand side at time t: sources and history terms. */
  rhs(b: number[], t: number, sys: System, base: number): void;
  /** After the solve: update history and the element's own voltage and current. */
  update(x: number[], t: number, sys: System, base: number): void;
  /** True when the element's conductance changes before the step ending at t (switches). */
  changed?(t: number): boolean;
  /**
   * The element's memory for the modal analysis: the history term its next step
   * will use (reactive elements only). Setting it makes the next step use that value.
   */
  state?: { get(): number; set(s: number): void };
  /** Voltage across (first port minus second) and current through (from the first port), after `update`. */
  v: number;
  i: number;
}

export const nodeV = (x: number[], sys: System, node: number) => (node === 0 ? 0 : x[sys.row(node)]);

/** Adds a conductance g between nodes a and b. */
export function addG(A: number[][], sys: System, a: number, b: number, g: number) {
  const ra = sys.row(a), rb = sys.row(b);
  if (ra >= 0) A[ra][ra] += g;
  if (rb >= 0) A[rb][rb] += g;
  if (ra >= 0 && rb >= 0) {
    A[ra][rb] -= g;
    A[rb][ra] -= g;
  }
}

/** A current i flowing through the element from a to b (it leaves node a, enters node b). */
export function addI(b: number[], sys: System, a: number, bb: number, i: number) {
  const ra = sys.row(a), rb = sys.row(bb);
  if (ra >= 0) b[ra] -= i;
  if (rb >= 0) b[rb] += i;
}

// ── LU with partial pivoting ─────────────────────────────────────────────────

export interface LU {
  lu: Float64Array[];
  piv: Int32Array;
  singular: boolean;
}

export function luFactor(A: number[][]): LU {
  const n = A.length;
  const lu = A.map((r) => Float64Array.from(r));
  const piv = new Int32Array(n).map((_, k) => k);
  let singular = false;
  for (let k = 0; k < n; k++) {
    let p = k, max = Math.abs(lu[k][k]);
    for (let r = k + 1; r < n; r++) if (Math.abs(lu[r][k]) > max) (max = Math.abs(lu[r][k])), (p = r);
    if (max < 1e-300) {
      singular = true;
      continue;
    }
    if (p !== k) {
      [lu[k], lu[p]] = [lu[p], lu[k]];
      [piv[k], piv[p]] = [piv[p], piv[k]];
    }
    const d = lu[k][k];
    for (let r = k + 1; r < n; r++) {
      const f = (lu[r][k] /= d);
      if (f !== 0) for (let c = k + 1; c < n; c++) lu[r][c] -= f * lu[k][c];
    }
  }
  return { lu, piv, singular };
}

export function luSolve({ lu, piv }: LU, b: number[]): number[] {
  const n = lu.length;
  const x = new Array<number>(n);
  for (let r = 0; r < n; r++) {
    let s = b[piv[r]];
    for (let c = 0; c < r; c++) s -= lu[r][c] * x[c];
    x[r] = s;
  }
  for (let r = n - 1; r >= 0; r--) {
    let s = x[r];
    for (let c = r + 1; c < n; c++) s -= lu[r][c] * x[c];
    x[r] = s / lu[r][r];
  }
  return x;
}

// ── The run ──────────────────────────────────────────────────────────────────

export interface EmtResult {
  t: Float64Array;
  /** Node voltages, by node id (index 0 = ground, always 0). */
  nodes: Float64Array[];
  /** Per element: voltage and current. */
  v: Record<string, Float64Array>;
  i: Record<string, Float64Array>;
  singular: boolean;
}

/**
 * Runs the circuit from rest over [0, tEnd], recording nOut + 1 samples, with
 * `sub` solver steps between samples.
 */
export function runEmt(nNodes: number, elements: EmtElement[], tEnd: number, nOut: number, sub: number): EmtResult {
  const nExtra = elements.reduce((s, e) => s + (e.extra ?? 0), 0);
  const n = nNodes - 1 + nExtra;
  const sys: System = { n, row: (node) => node - 1 };
  const bases: number[] = [];
  let next = nNodes - 1;
  for (const e of elements) {
    bases.push(next);
    next += e.extra ?? 0;
  }
  const t = new Float64Array(nOut + 1);
  const nodes = Array.from({ length: nNodes }, () => new Float64Array(nOut + 1));
  const v: Record<string, Float64Array> = {}, i: Record<string, Float64Array> = {};
  for (const e of elements) (v[e.id] = new Float64Array(nOut + 1)), (i[e.id] = new Float64Array(nOut + 1));
  if (n === 0) return { t, nodes, v, i, singular: false };

  const factor = () => {
    const A = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    elements.forEach((e, k) => e.stamp(A, sys, bases[k]));
    return luFactor(A);
  };
  let lu = factor();
  let singular = lu.singular;
  const h = tEnd / (nOut * sub);
  const record = (k: number, x: number[] | null) => {
    t[k] = k * sub * h;
    if (x) for (let nd = 1; nd < nNodes; nd++) nodes[nd][k] = x[sys.row(nd)];
    for (const e of elements) (v[e.id][k] = e.v), (i[e.id][k] = e.i);
  };
  for (const e of elements) (e.v = 0), (e.i = 0);
  record(0, null);
  for (let k = 1; k <= nOut; k++) {
    for (let s = 0; s < sub; s++) {
      const tn = ((k - 1) * sub + s + 1) * h;
      if (elements.some((e) => e.changed?.(tn))) {
        lu = factor();
        singular ||= lu.singular;
      }
      const b = new Array<number>(n).fill(0);
      elements.forEach((e, j) => e.rhs(b, tn, sys, bases[j]));
      const x = lu.singular ? b.map(() => 0) : luSolve(lu, b);
      elements.forEach((e, j) => e.update(x, tn, sys, bases[j]));
      if (s === sub - 1) record(k, x);
    }
  }
  return { t, nodes, v, i, singular };
}
