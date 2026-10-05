// Positive-sequence power flow (RMS) on the bench's three-phase drawing, with
// the lessons' Newton–Raphson solver: buses are the three-phase nodes (merged
// through closed breakers), branches the lines, impedances and transformers.
// Loads are constant power here, constant impedance in the EMT run: comparing
// the two is part of the lesson.

import { newtonRaphson, type Branch, type Bus } from '../lib/core/powerflow';
import type { Params } from '../lib/models/types';
import { paramsOf, steadyState } from './analyses';
import { breakerOpenAt } from './lib-grid';
import type { Netlist } from './compile';
import { cabs } from '../lib/core/linalg';

export const SBASE = 100e6;

export interface PfBus {
  name: string;
  node: number;
  Vbase: number;
  type: 'slack' | 'pv' | 'pq';
  V: number;
  th: number; // degrees
  Pg: number; // MW
  Qg: number; // Mvar
  Pd: number;
  Qd: number;
  /** |V| (pu) of the sinusoidal steady state (constant-impedance loads), for comparison. */
  Vss: number | null;
}

export interface PfLine {
  name: string;
  from: string;
  to: string;
  P: number; // MW at the from end
  Q: number;
  loss: number; // MW
}

export interface BenchPf {
  ok: boolean;
  message: string | null;
  buses: PfBus[];
  lines: PfLine[];
  iterations: number;
  losses: number; // MW
}

const W = (f: number) => 2 * Math.PI * f;

export function benchPowerFlow(net: Netlist, p: Params): BenchPf {
  const three = net.active.filter(({ def }) => def.ports.some((q) => q.phases === 3));
  if (!three.length) return { ok: false, message: 'none', buses: [], lines: [], iterations: 0, losses: 0 };
  // Buses: the phase-a node of each three-phase port, merged through closed breakers.
  const parent = new Map<number, number>();
  const find = (n: number): number => {
    while (parent.get(n) !== undefined && parent.get(n) !== n) n = parent.get(n)!;
    return n;
  };
  const touch = (n: number) => !parent.has(n) && parent.set(n, n);
  const P = (el: (typeof three)[number]) => paramsOf(el.el, el.def, p);
  for (const it of three) {
    let k = 0;
    for (const q of it.def.ports) {
      if (q.phases === 3) touch(it.nodes[k]);
      k += q.phases ?? 1;
    }
  }
  for (const it of three)
    if (it.def.type === 'brk3') {
      const q = P(it);
      const open = breakerOpenAt(q, p.T);
      if (!open) parent.set(find(it.nodes[0]), find(it.nodes[3]));
    }
  const roots = [...new Set([...parent.keys()].map(find))];
  // Internal buses for source EMFs (behind their impedance).
  const buses: (Bus & { node: number; Vbase: number; internal?: string })[] = roots.map((n) => ({ name: '', type: 'pq', V: 1, Pg: 0, Pd: 0, Qd: 0, node: n, Vbase: 0 }));
  const idx = (node: number) => roots.indexOf(find(node));
  const branches: (Branch & { name: string })[] = [];
  const nameOf = new Map<number, string>();
  // Base voltages: from sources and machines, carried across lines, impedances and transformers.
  for (const it of three) {
    const q = P(it);
    if (it.def.type === 'src3') buses[idx(it.nodes[0])].Vbase = q.Vll;
    if (it.def.type === 'sm3') buses[idx(it.nodes[0])].Vbase = q.Vn;
  }
  for (let pass = 0; pass < three.length + 1; pass++)
    for (const it of three) {
      if (!['line3', 'z3', 'trafo3'].includes(it.def.type)) continue;
      const a = idx(it.nodes[0]), b = idx(it.nodes[3]);
      const q = P(it);
      const ratio = it.def.type === 'trafo3' ? q.V2 / q.V1 : 1;
      if (buses[a].Vbase && !buses[b].Vbase) buses[b].Vbase = buses[a].Vbase * ratio;
      if (buses[b].Vbase && !buses[a].Vbase) buses[a].Vbase = buses[b].Vbase / ratio;
    }
  for (const b of buses) if (!b.Vbase) b.Vbase = 1000;
  const Zb = (bi: number) => (buses[bi].Vbase * buses[bi].Vbase) / SBASE;
  let slack = -1;
  for (const it of three) {
    const q = P(it);
    const bi = idx(it.nodes[0]);
    const label = it.el.id;
    if (!nameOf.has(bi) && !['line3', 'z3', 'trafo3', 'brk3'].includes(it.def.type)) nameOf.set(bi, label);
    switch (it.def.type) {
      case 'src3':
      case 'sm3': {
        // Internal EMF bus behind the source impedance.
        const isSrc = it.def.type === 'src3';
        const Z = isSrc ? { r: q.R, x: W(q.f) * q.L } : { r: (q.ra * q.Vn * q.Vn) / q.Sn, x: (q.xd * q.Vn * q.Vn) / q.Sn };
        const k = buses.length;
        buses.push({ name: `${label} (f.é.m.)`, type: 'pq', V: isSrc ? 1 : q.E0, Pg: 0, Pd: 0, Qd: 0, node: -1, Vbase: buses[bi].Vbase, internal: label });
        branches.push({ name: label, from: k, to: bi, r: Z.r / Zb(bi), x: Z.x / Zb(bi) });
        if (isSrc && slack < 0) (buses[k].type = 'slack'), (slack = k);
        else if (!isSrc) (buses[k].type = 'pv'), (buses[k].Pg = (q.P0 * q.Sn) / SBASE);
        else buses[k].type = 'pv';
        break;
      }
      case 'load3':
        buses[bi].Pd += q.P / SBASE;
        buses[bi].Qd += q.Q / SBASE;
        break;
      case 'cap3':
        buses[bi].Bsh = (buses[bi].Bsh ?? 0) + (q.Q * (buses[bi].Vbase / q.Vn) ** 2) / SBASE;
        break;
      case 'im3':
        buses[bi].Pd += (q.T0 * q.Pn) / SBASE;
        buses[bi].Qd += (0.5 * q.T0 * q.Pn) / SBASE;
        break;
      case 'line3': {
        const b = idx(it.nodes[3]);
        const R = q.r * q.len, X = W(50) * q.l * 1e-3 * q.len, B = W(50) * q.c * 1e-9 * q.len;
        branches.push({ name: label, from: bi, to: b, r: R / Zb(bi), x: X / Zb(bi), b: B * Zb(bi) });
        break;
      }
      case 'z3':
        branches.push({ name: label, from: bi, to: idx(it.nodes[3]), r: q.R / Zb(bi), x: (W(50) * q.L) / Zb(bi) });
        break;
      case 'trafo3':
        branches.push({ name: label, from: bi, to: idx(it.nodes[3]), r: (q.r * SBASE) / q.S, x: (q.x * SBASE) / q.S });
        break;
      default:
        // Inverter-based units inject P (and Q) as negative load.
        if (q.Pset !== undefined) {
          buses[bi].Pd -= (q.Pset * (q.Sn ?? 1)) / SBASE;
          buses[bi].Qd -= ((q.Qset ?? 0) * (q.Sn ?? 1)) / SBASE;
        }
    }
  }
  if (slack < 0) {
    const pv = buses.findIndex((b) => b.type === 'pv');
    if (pv < 0) return { ok: false, message: 'noslack', buses: [], lines: [], iterations: 0, losses: 0 };
    buses[pv].type = 'slack';
  }
  buses.forEach((b, k) => (b.name = b.name || nameOf.get(k) || `N${b.node}`));
  const res = newtonRaphson(buses, branches, { maxIt: 30 });
  const ss = steadyState(net, p);
  const out: PfBus[] = buses.map((b, k) => ({
    name: b.name,
    node: b.node,
    Vbase: b.Vbase,
    type: res.types[k],
    V: res.V[k],
    th: (res.th[k] * 180) / Math.PI,
    Pg: res.Pg[k] * 100,
    Qg: res.Qg[k] * 100,
    Pd: b.Pd * 100,
    Qd: b.Qd * 100,
    Vss: ss && b.node > 0 ? (cabs(ss.res.nodes[b.node]) * Math.sqrt(3)) / Math.SQRT2 / b.Vbase : null,
  }));
  const lines: PfLine[] = res.flows.map((f, k) => ({ name: branches[k].name, from: out[f.from].name, to: out[f.to].name, P: f.Pij * 100, Q: f.Qij * 100, loss: f.loss * 100 }));
  return { ok: res.converged, message: res.converged ? null : 'diverged', buses: out, lines, iterations: res.iterations, losses: res.losses * 100 };
}
