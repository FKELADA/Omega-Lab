// The analyses run on a compiled bench, beyond the time-domain run: sinusoidal
// steady state, transfer functions (Bode), impedance scan and poles.

import { cabs, type Complex } from '../lib/core/linalg';
import type { Params } from '../lib/models/types';
import { solveAc, type AcItem, type AcResult } from './engine/ac';
import { modal, type Modal } from './engine/modal';
import type { EmtElement } from './engine/emt';
import type { BenchEl } from './doc';
import type { ElementDef, SigCtx } from './library';
import type { Netlist } from './compile';

/** Output samples per time-domain run. */
export const N_OUT = 1200;

/** An element's parameters (with the run duration T, which switches need in AC). */
export function paramsOf(el: BenchEl, def: ElementDef, p: Params): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(def.params.map((q) => [q.id, p[`${el.id}.${q.id}`] ?? el.params[q.id] ?? q.default]));
  // The run duration, for elements whose AC state depends on it (switches, breakers).
  out.__tEnd = p.T;
  // Values computed by the initialisation (e.g. a machine's initial rotor angle).
  const init = p[`${el.id}.__delta0`];
  if (init !== undefined) out.__delta0 = init;
  return out;
}

/** Solver sub-steps per output sample: at least 400 steps per period of the fastest source. */
export function substeps(net: Netlist, p: Params, T: number): number {
  let tmin = Infinity;
  for (const { el, def } of net.active) {
    const ts = def.timeScale?.(paramsOf(el, def, p));
    if (ts) tmin = Math.min(tmin, ts);
  }
  // Natural time scales of R–L and R–C pairs are not known here; 20 sub-steps per
  // sample (24 000 steps per run) resolves them for the window the learner chose.
  const want = Number.isFinite(tmin) ? Math.ceil(T / N_OUT / (tmin / 400)) : 1;
  return Math.min(400, Math.max(20, want));
}

export const stepOf = (net: Netlist, p: Params) => p.T / (N_OUT * substeps(net, p, p.T));

/** The solver elements of the bench, with the internal nodes of composite elements numbered after the netlist's. */
export function buildElements(net: Netlist, p: Params, h: number): { els: EmtElement[]; nAll: number } {
  let next = net.nNodes;
  const node = () => next++;
  // Control signals: one value per signal net (index 0: unconnected inputs read 0).
  const vals = new Float64Array(net.nSig + 1);
  const sink = new Float64Array(1);
  const els = net.active.flatMap(({ el, def, nodes, sigs }) => {
    const sig: SigCtx = {
      in: (port) => {
        const k = sigs[port] ?? 0;
        return () => vals[k];
      },
      out: (port) => {
        const k = sigs[port] ?? 0;
        return k ? (v: number) => (vals[k] = v) : (v: number) => (sink[0] = v);
      },
    };
    const b = def.build!(el.id, nodes, paramsOf(el, def, p), h, node, sig);
    return Array.isArray(b) ? b : [b];
  });
  return { els, nAll: next };
}

export function acItems(net: Netlist, p: Params): AcItem[] {
  return net.active.map(({ el, def, nodes }) => ({ id: el.id, nodes, p: paramsOf(el, def, p), model: def.ac }));
}

/** The fundamental frequency of the bench: the first AC (or square-wave) source's. */
export function fundamental(net: Netlist, p: Params): number | null {
  for (const type of ['vac', 'vsquare', 'src3', 'sm3'])
    for (const { el, def } of net.active) if (def.type === type) return paramsOf(el, def, p).f;
  return null;
}

/** Sources that can drive a transfer function. */
export const sources = (net: Netlist) => net.active.filter(({ def }) => def.family === 'sources').map(({ el }) => el.id);

export interface Steady {
  f1: number;
  res: AcResult;
}

/** Sinusoidal steady state at the fundamental (sources at other frequencies switched off). */
export function steadyState(net: Netlist, p: Params): Steady | null {
  const f1 = fundamental(net, p);
  if (!f1) return null;
  const res = solveAc(net.nNodes, acItems(net, p), 2 * Math.PI * f1, () => 'own');
  return { f1, res };
}

/** The circuit driven by 1∠0 at one source or probe, every other source off. */
export function driven(net: Netlist, p: Params, input: string, f: number): AcResult {
  return solveAc(net.nNodes, acItems(net, p), 2 * Math.PI * f, (it) => (it.id === input ? 'unit' : 'off'));
}

/** Impedance seen from a probe (1 A injected), or at the terminals of a voltage source (1 V applied). */
export function impedanceAt(net: Netlist, p: Params, at: string, f: number): Complex {
  const r = driven(net, p, at, f);
  const item = net.active.find(({ el }) => el.id === at);
  if (item?.def.ac.kind === 'V') {
    const i = r.i[at];
    const d = i.re * i.re + i.im * i.im || 1e-300;
    return { re: i.re / d, im: -i.im / d }; // 1 / I
  }
  return r.v[at];
}

/** Frequencies for the sweeps: from a decade below the slowest pole to a decade above the fastest. */
export function sweepRange(md: Modal, f1: number | null): [number, number] {
  const fs = md.poles.map((q) => cabs(q.s) / (2 * Math.PI)).filter((f) => f > 1e-6);
  let lo = fs.length ? Math.min(...fs) / 20 : 1, hi = fs.length ? Math.max(...fs) * 20 : 1e5;
  if (f1) (lo = Math.min(lo, f1 / 5)), (hi = Math.max(hi, f1 * 50));
  lo = Math.max(0.01, 10 ** Math.floor(Math.log10(lo)));
  hi = Math.min(1e7, 10 ** Math.ceil(Math.log10(hi)));
  return hi / lo < 100 ? [lo / 10, hi * 10] : [lo, hi];
}

export const logspace = (a: number, b: number, n: number) => Array.from({ length: n }, (_, k) => a * (b / a) ** (k / (n - 1)));

/** Poles and participation factors of the bench (memoised on the parameters). */
export function modalOf(net: Netlist, p: Params): Modal {
  const key = JSON.stringify(p);
  const hit = cache.get(net);
  if (hit?.key === key) return hit.md;
  const h = stepOf(net, p);
  const { els, nAll } = buildElements(net, p, h);
  const md = modal(nAll, els, h, p.T);
  cache.set(net, { key, md });
  return md;
}
const cache = new WeakMap<Netlist, { key: string; md: Modal }>();

/**
 * Initial rotor angles of the synchronous machines: for each machine, the angle
 * δ0 for which its steady-state electrical power equals its mechanical power
 * setpoint (bisection; a few Gauss–Seidel sweeps when there are several).
 */
export function initMachines(net: Netlist, p: Params): Params {
  const sms = net.active.filter(({ def }) => def.type === 'sm3');
  if (!sms.length) return p;
  const q: Params = { ...p };
  for (const { el } of sms) q[`${el.id}.__delta0`] = 0;
  const f1 = fundamental(net, q);
  if (!f1) return q;
  const w = 2 * Math.PI * f1;
  const powerOf = (id: string): number => {
    const res = solveAc(net.nNodes, acItems(net, q), w, () => 'own');
    const item = net.active.find(({ el }) => el.id === id)!;
    const pp = paramsOf(item.el, item.def, q);
    const Zb = (pp.Vn * pp.Vn) / pp.Sn;
    const z = { re: pp.ra * Zb, im: (w * pp.xd * Zb) / (2 * Math.PI * pp.f) };
    const Vph = (Math.SQRT2 * pp.Vn) / Math.sqrt(3);
    let P = 0;
    item.nodes.forEach((n, k) => {
      const ang = (pp.__delta0 ?? 0) - (2 * Math.PI * k) / 3;
      const E = { re: Vph * pp.E0 * Math.cos(ang), im: Vph * pp.E0 * Math.sin(ang) };
      const V = res.nodes[n];
      const dv = { re: E.re - V.re, im: E.im - V.im };
      const d = z.re * z.re + z.im * z.im;
      const I = { re: (dv.re * z.re + dv.im * z.im) / d, im: (dv.im * z.re - dv.re * z.im) / d };
      P += 0.5 * (E.re * I.re + E.im * I.im);
    });
    return P / pp.Sn;
  };
  for (let sweep = 0; sweep < (sms.length > 1 ? 4 : 1); sweep++)
    for (const { el, def } of sms) {
      const key = `${el.id}.__delta0`;
      const P0 = paramsOf(el, def, q).P0;
      let lo = -Math.PI / 2 + 0.01, hi = Math.PI / 2 - 0.01;
      for (let it = 0; it < 40; it++) {
        q[key] = (lo + hi) / 2;
        if (powerOf(el.id) < P0) lo = q[key];
        else hi = q[key];
      }
    }
  return q;
}
