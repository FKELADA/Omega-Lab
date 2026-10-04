// Steady-state network analysis: bus admittance matrix, Newton–Raphson and
// Gauss–Seidel power flow (with generator reactive limits), DC power flow.
// All quantities in per unit on a common base; angles in radians.

import { cabs, cadd, cdiv, cmul, cx, polar, solve, type Complex } from './linalg';

export type BusType = 'slack' | 'pv' | 'pq';

export interface Bus {
  name: string;
  type: BusType;
  /** Voltage setpoint (slack, PV) or flat-start value (PQ). */
  V: number;
  Pg: number;
  Pd: number;
  Qd: number;
  /** Shunt susceptance (capacitor > 0). */
  Bsh?: number;
  Qmin?: number;
  Qmax?: number;
}

export interface Branch {
  from: number;
  to: number;
  r: number;
  x: number;
  /** Total line charging susceptance. */
  b?: number;
  /** Off-nominal tap on the `from` side. */
  tap?: number;
  on?: boolean;
}

export type CMat = Complex[][];

/** Bus admittance matrix: each branch adds its series admittance and half its charging. */
export function ybus(buses: Bus[], branches: Branch[]): CMat {
  const n = buses.length;
  const Y: CMat = Array.from({ length: n }, () => Array.from({ length: n }, () => cx(0)));
  for (const br of branches) {
    if (br.on === false) continue;
    const y = cdiv(cx(1), cx(br.r, br.x));
    const bc = cx(0, (br.b ?? 0) / 2);
    const a = br.tap ?? 1;
    const { from: i, to: k } = br;
    Y[i][i] = cadd(Y[i][i], cadd(cdiv(y, cx(a * a)), bc));
    Y[k][k] = cadd(Y[k][k], cadd(y, bc));
    Y[i][k] = cadd(Y[i][k], cdiv(y, cx(-a)));
    Y[k][i] = cadd(Y[k][i], cdiv(y, cx(-a)));
  }
  buses.forEach((b, i) => {
    if (b.Bsh) Y[i][i] = cadd(Y[i][i], cx(0, b.Bsh));
  });
  return Y;
}

/** Complex power injections S = V (Y V)*. */
export function injections(Y: CMat, V: number[], th: number[]): { P: number[]; Q: number[] } {
  const n = V.length;
  const P = new Array(n).fill(0), Q = new Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++) {
      const { re: G, im: B } = Y[i][k];
      if (G === 0 && B === 0) continue;
      const d = th[i] - th[k];
      P[i] += V[i] * V[k] * (G * Math.cos(d) + B * Math.sin(d));
      Q[i] += V[i] * V[k] * (G * Math.sin(d) - B * Math.cos(d));
    }
  return { P, Q };
}

export interface FlowIter {
  V: number[];
  th: number[];
  /** Largest power mismatch at this iterate (pu). */
  mismatch: number;
}

export interface BranchFlow {
  from: number;
  to: number;
  Pij: number;
  Qij: number;
  Pji: number;
  Qji: number;
  loss: number;
  /** Current magnitude (pu), the larger of the two ends. */
  I: number;
}

export interface PfResult {
  converged: boolean;
  iterations: number;
  V: number[];
  th: number[];
  /** Net injections and generator outputs at the solution. */
  P: number[];
  Q: number[];
  Pg: number[];
  Qg: number[];
  /** Final bus types, after PV buses that hit a reactive limit became PQ. */
  types: BusType[];
  qLimited: boolean[];
  history: FlowIter[];
  flows: BranchFlow[];
  losses: number;
}

export interface PfOptions {
  tol?: number;
  maxIt?: number;
  qLimits?: boolean;
  /** Warm start (continuation), instead of a flat start. */
  start?: { V: number[]; th: number[] };
}

export function branchFlows(branches: Branch[], V: number[], th: number[]): BranchFlow[] {
  return branches.map((br) => {
    if (br.on === false) return { from: br.from, to: br.to, Pij: 0, Qij: 0, Pji: 0, Qji: 0, loss: 0, I: 0 };
    const a = br.tap ?? 1;
    const y = cdiv(cx(1), cx(br.r, br.x));
    const bc = cx(0, (br.b ?? 0) / 2);
    const Vi = polar(V[br.from], th[br.from]), Vk = polar(V[br.to], th[br.to]);
    // Currents leaving each end (tap on the from side).
    const Iij = cadd(cmul(cadd(cdiv(y, cx(a * a)), bc), Vi), cmul(cdiv(y, cx(-a)), Vk));
    const Iji = cadd(cmul(cadd(y, bc), Vk), cmul(cdiv(y, cx(-a)), Vi));
    const Sij = cmul(Vi, { re: Iij.re, im: -Iij.im });
    const Sji = cmul(Vk, { re: Iji.re, im: -Iji.im });
    return { from: br.from, to: br.to, Pij: Sij.re, Qij: Sij.im, Pji: Sji.re, Qji: Sji.im, loss: Sij.re + Sji.re, I: Math.max(cabs(Iij), cabs(Iji)) };
  });
}

function finish(buses: Bus[], branches: Branch[], Y: CMat, V: number[], th: number[], types: BusType[], qLimited: boolean[], history: FlowIter[], converged: boolean): PfResult {
  const { P, Q } = injections(Y, V, th);
  const flows = branchFlows(branches, V, th);
  return {
    converged,
    iterations: history.length - 1,
    V,
    th,
    P,
    Q,
    Pg: P.map((p, i) => p + buses[i].Pd),
    Qg: Q.map((q, i) => q + buses[i].Qd),
    types,
    qLimited,
    history,
    flows,
    losses: flows.reduce((s, f) => s + f.loss, 0),
  };
}

/**
 * Newton–Raphson power flow in polar form. Unknowns: θ at every non-slack bus,
 * |V| at every PQ bus. After convergence, a PV bus outside its reactive limits is
 * fixed at the limit, turned into a PQ bus, and the iterations continue.
 */
export function newtonRaphson(buses: Bus[], branches: Branch[], opt: PfOptions = {}): PfResult {
  const tol = opt.tol ?? 1e-8, maxIt = opt.maxIt ?? 15;
  const n = buses.length;
  const Y = ybus(buses, branches);
  const types = buses.map((b) => b.type);
  const qLimited = buses.map(() => false);
  const Qfix = buses.map(() => 0); // generator Q of a limited bus
  const V = opt.start ? [...opt.start.V] : buses.map((b) => (b.type === 'pq' ? 1 : b.V));
  const th = opt.start ? [...opt.start.th] : buses.map(() => 0);
  buses.forEach((b, i) => {
    if (b.type !== 'pq') V[i] = b.V;
  });
  const history: FlowIter[] = [];
  let it = 0;

  for (let pass = 0; pass < 4; pass++) {
    const pvq = types.map((t, i) => (t !== 'slack' ? i : -1)).filter((i) => i >= 0); // θ unknowns
    const pq = types.map((t, i) => (t === 'pq' ? i : -1)).filter((i) => i >= 0); // |V| unknowns
    const Psp = buses.map((b) => b.Pg - b.Pd);
    const Qsp = buses.map((b, i) => (qLimited[i] ? Qfix[i] : 0) - b.Qd);
    let converged = false;
    for (;;) {
      const { P, Q } = injections(Y, V, th);
      const dP = pvq.map((i) => Psp[i] - P[i]);
      const dQ = pq.map((i) => Qsp[i] - Q[i]);
      const mis = Math.max(0, ...dP.map(Math.abs), ...dQ.map(Math.abs));
      history.push({ V: [...V], th: [...th], mismatch: mis });
      if (!isFinite(mis) || mis > 1e4) return finish(buses, branches, Y, V, th, types, qLimited, history, false);
      if (mis < tol) {
        converged = true;
        break;
      }
      if (it >= maxIt) return finish(buses, branches, Y, V, th, types, qLimited, history, false);
      it++;
      // Jacobian [[∂P/∂θ, ∂P/∂V], [∂Q/∂θ, ∂Q/∂V]].
      const m = pvq.length + pq.length;
      const J = Array.from({ length: m }, () => new Array(m).fill(0));
      const row = (i: number, kind: 'P' | 'Q') => (kind === 'P' ? pvq.indexOf(i) : pvq.length + pq.indexOf(i));
      for (const i of [...new Set([...pvq, ...pq])]) {
        for (let k = 0; k < n; k++) {
          const { re: G, im: B } = Y[i][k];
          if (i !== k && G === 0 && B === 0) continue;
          let dPdth: number, dPdV: number, dQdth: number, dQdV: number;
          if (i === k) {
            const Gii = Y[i][i].re, Bii = Y[i][i].im;
            dPdth = -Q[i] - Bii * V[i] * V[i];
            dPdV = P[i] / V[i] + Gii * V[i];
            dQdth = P[i] - Gii * V[i] * V[i];
            dQdV = Q[i] / V[i] - Bii * V[i];
          } else {
            const d = th[i] - th[k];
            dPdth = V[i] * V[k] * (G * Math.sin(d) - B * Math.cos(d));
            dPdV = V[i] * (G * Math.cos(d) + B * Math.sin(d));
            dQdth = -V[i] * V[k] * (G * Math.cos(d) + B * Math.sin(d));
            dQdV = V[i] * (G * Math.sin(d) - B * Math.cos(d));
          }
          const cth = pvq.indexOf(k), cV = pq.indexOf(k);
          if (pvq.includes(i)) {
            const r = row(i, 'P');
            if (cth >= 0) J[r][cth] = dPdth;
            if (cV >= 0) J[r][pvq.length + cV] = dPdV;
          }
          if (pq.includes(i)) {
            const r = row(i, 'Q');
            if (cth >= 0) J[r][cth] = dQdth;
            if (cV >= 0) J[r][pvq.length + cV] = dQdV;
          }
        }
      }
      let dx: number[];
      try {
        dx = solve(J, [...dP, ...dQ].map((v) => [v])).map((r) => r[0]);
      } catch {
        return finish(buses, branches, Y, V, th, types, qLimited, history, false);
      }
      pvq.forEach((i, j) => (th[i] += dx[j]));
      pq.forEach((i, j) => (V[i] += dx[pvq.length + j]));
    }
    if (!converged || opt.qLimits === false) break;
    // Reactive limits.
    const { Q } = injections(Y, V, th);
    let changed = false;
    buses.forEach((b, i) => {
      if (types[i] !== 'pv') return;
      const Qg = Q[i] + b.Qd;
      if (b.Qmax !== undefined && Qg > b.Qmax + 1e-9) [Qfix[i], changed] = [b.Qmax, true];
      else if (b.Qmin !== undefined && Qg < b.Qmin - 1e-9) [Qfix[i], changed] = [b.Qmin, true];
      else return;
      types[i] = 'pq';
      qLimited[i] = true;
    });
    if (!changed) break;
  }
  const last = history[history.length - 1];
  return finish(buses, branches, Y, V, th, types, qLimited, history, last.mismatch < tol);
}

/** Gauss–Seidel power flow (no reactive limits), for comparing convergence. */
export function gaussSeidel(buses: Bus[], branches: Branch[], maxIt = 200, tol = 1e-8): FlowIter[] {
  const n = buses.length;
  const Y = ybus(buses, branches);
  const Vc: Complex[] = buses.map((b) => cx(b.type === 'pq' ? 1 : b.V));
  const out: FlowIter[] = [];
  const record = () => {
    const V = Vc.map(cabs), th = Vc.map((v) => Math.atan2(v.im, v.re));
    const { P, Q } = injections(Y, V, th);
    let mis = 0;
    buses.forEach((b, i) => {
      if (b.type === 'slack') return;
      mis = Math.max(mis, Math.abs(b.Pg - b.Pd - P[i]));
      if (b.type === 'pq') mis = Math.max(mis, Math.abs(-b.Qd - Q[i]));
    });
    out.push({ V, th, mismatch: mis });
    return mis;
  };
  for (let it = 0; it <= maxIt; it++) {
    const mis = record();
    if (mis < tol || !isFinite(mis) || mis > 1e4) break;
    for (let i = 0; i < n; i++) {
      const b = buses[i];
      if (b.type === 'slack') continue;
      let sum = cx(0);
      for (let k = 0; k < n; k++) if (k !== i) sum = cadd(sum, cmul(Y[i][k], Vc[k]));
      let Qi = -b.Qd;
      if (b.type === 'pv') {
        const I = cadd(sum, cmul(Y[i][i], Vc[i]));
        Qi = -cmul({ re: Vc[i].re, im: -Vc[i].im }, I).im; // Q = −Im(V* I)
      }
      const S = cx(b.Pg - b.Pd, -Qi); // conj(S)
      let v = cdiv(cadd(cdiv(S, { re: Vc[i].re, im: -Vc[i].im }), cx(-sum.re, -sum.im)), Y[i][i]);
      if (b.type === 'pv') v = polar(b.V, Math.atan2(v.im, v.re));
      Vc[i] = v;
    }
  }
  return out;
}

/**
 * DC power flow: lossless, flat voltages, small angles. θ = B⁻¹ P with the slack
 * at θ = 0; branch flow (θi − θk)/x.
 */
export function dcFlow(n: number, slack: number, branches: Branch[], Pinj: number[]): { th: number[]; flows: number[] } {
  const B = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const br of branches) {
    if (br.on === false) continue;
    const y = 1 / br.x;
    B[br.from][br.from] += y;
    B[br.to][br.to] += y;
    B[br.from][br.to] -= y;
    B[br.to][br.from] -= y;
  }
  const idx = [...Array(n).keys()].filter((i) => i !== slack);
  const Br = idx.map((i) => idx.map((k) => B[i][k]));
  const thr = solve(Br, idx.map((i) => [Pinj[i]])).map((r) => r[0]);
  const th = new Array(n).fill(0);
  idx.forEach((i, j) => (th[i] = thr[j]));
  return { th, flows: branches.map((br) => (br.on === false ? 0 : (th[br.from] - th[br.to]) / br.x)) };
}

/** Inverse of a complex matrix, via the real 2n × 2n form [[G, −B], [B, G]]. */
export function cinv(A: CMat): CMat {
  const n = A.length;
  const R = Array.from({ length: 2 * n }, () => new Array(2 * n).fill(0));
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++) {
      R[i][k] = A[i][k].re;
      R[i][n + k] = -A[i][k].im;
      R[n + i][k] = A[i][k].im;
      R[n + i][n + k] = A[i][k].re;
    }
  const I = Array.from({ length: 2 * n }, (_, i) => Array.from({ length: 2 * n }, (_, k) => (i === k ? 1 : 0)));
  const X = solve(R, I);
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, k) => cx(X[i][k], X[n + i][k])));
}
