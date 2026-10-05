// From a drawing to something the lab can run: ports joined by wires become
// nodes (union–find), the elements become solver elements, and the whole bench
// becomes an Experiment, so the lessons' oscilloscope, sweeps and equation
// cards work on it unchanged.

import { runEmt } from './engine/emt';
import { DEFS, type ElementDef } from './library';
import type { BenchDoc, BenchEl } from './doc';
import type { EquationSpec, Experiment, ParamSpec, SignalSpec } from '../lib/lab/types';
import type { Model, Params, Run } from '../lib/models/types';
import type { L } from '../lib/ui/ui.svelte';

export interface Diagnostic {
  level: 'error' | 'warn';
  text: L;
  el?: string;
}

export interface Netlist {
  /** Node id of each port, keyed "el:port". 0 is ground. */
  node: Record<string, number>;
  nNodes: number;
  /** Elements the solver sees (ground and unknown types excluded). */
  active: { el: BenchEl; def: ElementDef; nodes: number[] }[];
  diagnostics: Diagnostic[];
}

const key = (el: string, port: string) => `${el}:${port}`;

export function buildNetlist(doc: BenchDoc): Netlist {
  const parent = new Map<string, string>();
  const find = (k: string): string => {
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r)!;
    parent.set(k, r);
    return r;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));
  const degree = new Map<string, number>();
  for (const el of doc.elements) for (const p of DEFS[el.type]?.ports ?? []) parent.set(key(el.id, p.id), key(el.id, p.id));
  for (const w of doc.wires) {
    const a = key(w.a.el, w.a.port), b = key(w.b.el, w.b.port);
    if (!parent.has(a) || !parent.has(b)) continue;
    union(a, b);
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  }
  const diagnostics: Diagnostic[] = [];
  // Ground: every ground port's set is node 0.
  const grounds = doc.elements.filter((e) => DEFS[e.type]?.ground);
  const roots = new Map<string, number>();
  for (const g of grounds) roots.set(find(key(g.id, DEFS[g.type].ports[0].id)), 0);
  const active = doc.elements.filter((e) => DEFS[e.type] && !DEFS[e.type].ground && DEFS[e.type].build);
  if (!grounds.length && active.length) {
    // No ground: take the second port of the first element as reference, and say so.
    const first = active[0];
    roots.set(find(key(first.id, DEFS[first.type].ports[1]?.id ?? DEFS[first.type].ports[0].id)), 0);
    diagnostics.push({ level: 'warn', text: { fr: `Pas de masse : la borne − de ${first.id} sert de référence. Ajoutez une masse.`, en: `No ground: ${first.id}’s − terminal is used as reference. Add a ground.` } });
  }
  let next = 1;
  const node: Record<string, number> = {};
  for (const el of doc.elements)
    for (const p of DEFS[el.type]?.ports ?? []) {
      const r = find(key(el.id, p.id));
      if (!roots.has(r)) roots.set(r, next++);
      node[key(el.id, p.id)] = roots.get(r)!;
    }
  for (const el of active)
    for (const p of DEFS[el.type].ports)
      if (!degree.get(key(el.id, p.id)))
        diagnostics.push({ level: 'warn', el: el.id, text: { fr: `La borne ${p.id === 'a' ? '+' : '−'} de ${el.id} n’est reliée à rien.`, en: `${el.id}’s ${p.id === 'a' ? '+' : '−'} terminal is not connected.` } });
  return {
    node,
    nNodes: next,
    active: active.map((el) => ({ el, def: DEFS[el.type], nodes: DEFS[el.type].ports.map((p) => node[key(el.id, p.id)]) })),
    diagnostics,
  };
}

const PALETTE = ['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i', '--c-a', '--c-b', '--c-c', '--c-n'];
const SIG: Record<string, { unit: string; name: L }> = {
  v: { unit: 'V', name: { fr: 'tension', en: 'voltage' } },
  i: { unit: 'A', name: { fr: 'courant', en: 'current' } },
  p: { unit: 'W', name: { fr: 'puissance', en: 'power' } },
};

/** Output samples per run, and bounds on solver steps per sample. */
const N_OUT = 1200;

/** Solver sub-steps per output sample: at least 200 steps per shortest period/time scale. */
export function substeps(net: Netlist, p: Params, T: number): number {
  let tmin = Infinity;
  for (const { el, def } of net.active) {
    const ts = def.timeScale?.(paramsOf(el, def, p));
    if (ts) tmin = Math.min(tmin, ts);
  }
  // Natural time scales of R–L and R–C pairs are not known here; 20 sub-steps per
  // sample (24 000 steps per run) resolves them for the window the learner chose.
  const want = Number.isFinite(tmin) ? Math.ceil((T / N_OUT) / (tmin / 400)) : 1;
  return Math.min(400, Math.max(20, want));
}

function paramsOf(el: BenchEl, def: ElementDef, p: Params): Record<string, number> {
  return Object.fromEntries(def.params.map((q) => [q.id, p[`${el.id}.${q.id}`] ?? el.params[q.id] ?? q.default]));
}

export interface Compiled {
  exp: Experiment;
  net: Netlist;
}

/**
 * Compiles a bench. `selected` is read lazily by the equations list, so the
 * formula panel follows the selection without recompiling.
 */
export function compile(doc: BenchDoc, selected: () => string | null, circuitEqs: (net: Netlist) => EquationSpec[]): Compiled {
  const net = buildNetlist(doc);
  const params: ParamSpec[] = [
    { id: 'T', symbol: 'T', name: { fr: 'Durée simulée', en: 'Simulated time' }, unit: 's', min: 1e-5, max: 100, default: doc.T, scale: 'log' },
  ];
  const signals: SignalSpec[] = [];
  let color = 0;
  for (const { el, def } of net.active) {
    for (const q of def.params)
      params.push({ id: `${el.id}.${q.id}`, symbol: `${q.symbol}_{${el.id}}`, name: q.name, unit: q.unit, min: q.min, max: q.max, default: el.params[q.id] ?? q.default, scale: q.scale });
    for (const s of def.signals)
      signals.push({
        id: `${el.id}.${s}`,
        symbol: `${s}_{\\text{${el.id}}}`,
        name: { fr: `${SIG[s].name.fr} de ${el.id}`, en: `${el.id} ${SIG[s].name.en}` },
        unit: SIG[s].unit,
        color: PALETTE[color++ % PALETTE.length],
        on: el.scope.includes(s),
      });
  }
  // Something on the scope from the start: the first source's current, if nothing else.
  if (signals.length && !signals.some((s) => s.on)) signals[0].on = true;

  const simulate = (p: Params, tEnd: number): Run => {
    const sub = substeps(net, p, tEnd);
    const h = tEnd / (N_OUT * sub);
    const els = net.active.map(({ el, def, nodes }) => def.build!(el.id, nodes, paramsOf(el, def, p), h));
    const r = runEmt(net.nNodes, els, tEnd, N_OUT, sub);
    const s: Record<string, Float64Array> = {};
    for (const { el, def } of net.active)
      for (const sg of def.signals) {
        const v = r.v[el.id], i = r.i[el.id];
        s[`${el.id}.${sg}`] = sg === 'v' ? v : sg === 'i' ? i : v.map((x, k) => x * i[k]);
      }
    return { t: r.t, s };
  };
  const model: Model = { id: 'atelier', simulate, poles: () => [], window: (p) => p.T ?? doc.T };

  const elementEqs = (id: string): EquationSpec[] => {
    const el = doc.elements.find((e) => e.id === id);
    const def = el && DEFS[el.type];
    if (!el || !def) return [];
    return def.formulas.map((f, k) => ({
      id: `${id}.${k}`,
      title: { fr: `${id} — ${f.title.fr}`, en: `${id} — ${f.title.en}` },
      personas: f.personas,
      tex: (c) => f.tex(c, id),
      note: f.note ? (c) => f.note!(c, id) : undefined,
    }));
  };

  const exp: Experiment = {
    id: 'atelier',
    path: [{ fr: 'Atelier', en: 'Workbench' }],
    title: { fr: doc.name, en: doc.name },
    model,
    params,
    signals,
    info: () => ({ net }),
    get equations() {
      const id = selected();
      return id ? elementEqs(id) : circuitEqs(net);
    },
    steps: [],
    canvas: undefined as never,
    instruments: [],
  };
  return { exp, net };
}
