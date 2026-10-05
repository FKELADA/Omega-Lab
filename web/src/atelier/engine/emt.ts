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
  /** Internal nodes it needs (e.g. between a winding's leakage and magnetising branch). */
  internal?: number;
  /** Receives the id of its first internal node, before any stamp. */
  bind?(firstInternal: number): void;
  /** True when the element's conductance changes before the step ending at t (timed switches). */
  changed?(t: number): boolean;
  /**
   * After a solve: true when the solution changes the element's state (a diode
   * that must conduct or block, a saturating core): the step is then re-solved.
   * Must not touch the element's memory; that happens in `update`.
   */
  check?(x: number[], t: number, sys: System, base: number): boolean;
  /** Changes the step and the integration rule (backward Euler for CDA, trapezoidal otherwise). */
  setStep?(h: number, be: boolean): void;
  /** Named outputs recorded with the run (multi-conductor elements, machines). */
  out?(): Record<string, number>;
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

/** Integration rule of reactive companion models: trapezoidal, or backward Euler (CDA half steps). */
export interface Rule {
  h: number;
  be: boolean;
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

export interface Layout {
  n: number;
  sys: System;
  /** First extra unknown of each element. */
  bases: number[];
  /** Total node count, including internal nodes. */
  nAll: number;
}

/** Numbers internal nodes after the netlist's, then extra unknowns after all nodes. */
export function layout(nNodes: number, elements: EmtElement[]): Layout {
  let nextNode = nNodes;
  for (const e of elements) {
    if (e.internal) {
      e.bind?.(nextNode);
      nextNode += e.internal;
    }
  }
  const bases: number[] = [];
  let next = nextNode - 1;
  for (const e of elements) {
    bases.push(next);
    next += e.extra ?? 0;
  }
  return { n: next, sys: { n: next, row: (node) => node - 1 }, bases, nAll: nextNode };
}

export interface EmtResult {
  t: Float64Array;
  /** Node voltages, by node id (index 0 = ground, always 0). */
  nodes: Float64Array[];
  /** Per element: voltage and current. */
  v: Record<string, Float64Array>;
  i: Record<string, Float64Array>;
  /** Named outputs, keyed "id.name". */
  out: Record<string, Float64Array>;
  singular: boolean;
  /** Switching events (for diagnostics). */
  events: number;
}

/**
 * Runs the circuit from rest over [0, tEnd], recording nOut + 1 samples, with
 * `sub` solver steps between samples. After every switching event, two half
 * steps of backward Euler damp the trapezoidal rule's numerical chatter (CDA).
 */
export function runEmt(nNodes: number, elements: EmtElement[], tEnd: number, nOut: number, sub: number): EmtResult {
  const { n, sys, bases } = layout(nNodes, elements);
  const t = new Float64Array(nOut + 1);
  const nodes = Array.from({ length: nNodes }, () => new Float64Array(nOut + 1));
  const v: Record<string, Float64Array> = {}, i: Record<string, Float64Array> = {}, out: Record<string, Float64Array> = {};
  for (const e of elements) {
    v[e.id] = new Float64Array(nOut + 1);
    i[e.id] = new Float64Array(nOut + 1);
    for (const name of Object.keys(e.out?.() ?? {})) out[`${e.id}.${name}`] = new Float64Array(nOut + 1);
  }
  const res: EmtResult = { t, nodes, v, i, out, singular: false, events: 0 };
  if (n === 0) return res;

  const factor = () => {
    const A = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    elements.forEach((e, k) => e.stamp(A, sys, bases[k]));
    const f = luFactor(A);
    res.singular ||= f.singular;
    return f;
  };
  const h = tEnd / (nOut * sub);
  const setRule = (hh: number, be: boolean) => elements.forEach((e) => e.setStep?.(hh, be));
  let lu = factor();
  const record = (k: number, x: number[] | null) => {
    t[k] = k * sub * h;
    if (x) for (let nd = 1; nd < nNodes; nd++) nodes[nd][k] = x[sys.row(nd)];
    for (const e of elements) {
      v[e.id][k] = e.v;
      i[e.id][k] = e.i;
      if (e.out) for (const [name, val] of Object.entries(e.out())) out[`${e.id}.${name}`][k] = val;
    }
  };
  /** One solver step ending at tn; returns the solution and whether anything switched. */
  const step = (tn: number): { x: number[]; switched: boolean } => {
    let switched = false;
    for (const e of elements) if (e.changed?.(tn)) switched = true;
    if (switched) lu = factor();
    let x: number[] = [];
    for (let iter = 0; iter < 12; iter++) {
      const b = new Array<number>(n).fill(0);
      elements.forEach((e, j) => e.rhs(b, tn, sys, bases[j]));
      x = lu.singular ? b.map(() => 0) : luSolve(lu, b);
      let again = false;
      elements.forEach((e, j) => {
        if (e.check?.(x, tn, sys, bases[j])) again = true;
      });
      if (!again) break;
      switched = true;
      lu = factor();
    }
    elements.forEach((e, j) => e.update(x, tn, sys, bases[j]));
    if (switched) res.events++;
    return { x, switched };
  };

  for (const e of elements) (e.v = 0), (e.i = 0);
  record(0, null);
  let cda = false;
  for (let k = 1; k <= nOut; k++) {
    for (let s = 0; s < sub; s++) {
      const tn = ((k - 1) * sub + s + 1) * h;
      let r: { x: number[]; switched: boolean };
      if (cda) {
        // Two half steps of backward Euler, then back to the trapezoidal rule.
        setRule(h / 2, true);
        lu = factor();
        step(tn - h / 2);
        r = step(tn);
        setRule(h, false);
        lu = factor();
        cda = r.switched;
      } else {
        r = step(tn);
        cda = r.switched && elements.some((e) => e.setStep);
      }
      if (s === sub - 1) record(k, r.x);
    }
  }
  return res;
}
