// From a drawing to something the lab can run: ports joined by wires become
// nodes (union–find), the elements become solver elements, and the whole bench
// becomes an Experiment, so the lessons' oscilloscope, sweeps and equation
// cards work on it unchanged.

import { runEmt } from './engine/emt';
import { N_OUT, buildElements, initMachines, substeps, modalOf, steadyState } from './analyses';
import { benchCharts, benchPhasors } from './charts';

export { substeps };
import { DEFS, sigSpec, type ElementDef } from './library';
import type { BenchDoc, BenchEl } from './doc';
import type { EquationSpec, Experiment, ParamSpec, SignalSpec } from '../lib/lab/types';

/** Live choices of the Atelier's interface that the compiled experiment reads. */
export interface BenchUi {
  /** Element whose formulas are shown. */
  selected(): string | null;
  /** Source driving the Bode plot (null: the first source). */
  bodeIn(): string | null;
  /** Where the impedance is scanned (null: the first probe, else the Bode input). */
  zAt(): string | null;
}
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
/** Conductor keys of a port: one, or three for a three-phase port ("…#0", "#1", "#2"). */
const keysOf = (el: string, port: { id: string; phases?: number }) =>
  port.phases === 3 ? [0, 1, 2].map((k) => `${key(el, port.id)}#${k}`) : [key(el, port.id)];

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
  const diagnostics: Diagnostic[] = [];
  const portOf = (el: string, port: string) => {
    const e = doc.elements.find((x) => x.id === el);
    return e && DEFS[e.type]?.ports.find((p) => p.id === port);
  };
  for (const el of doc.elements) for (const p of DEFS[el.type]?.ports ?? []) for (const k of keysOf(el.id, p)) parent.set(k, k);
  for (const w of doc.wires) {
    const pa = portOf(w.a.el, w.a.port), pb = portOf(w.b.el, w.b.port);
    if (!pa || !pb) continue;
    const ka = keysOf(w.a.el, pa), kb = keysOf(w.b.el, pb);
    if (ka.length !== kb.length) {
      diagnostics.push({
        level: 'error',
        text: {
          fr: `Le fil ${w.id} relie une borne triphasée à une borne monophasée : il est ignoré.`,
          en: `Wire ${w.id} joins a three-phase terminal to a single-phase one: it is ignored.`,
        },
      });
      continue;
    }
    ka.forEach((k, j) => union(k, kb[j]));
    for (const k of [key(w.a.el, w.a.port), key(w.b.el, w.b.port)]) degree.set(k, (degree.get(k) ?? 0) + 1);
  }
  // Ground: every ground port's set is node 0.
  const grounds = doc.elements.filter((e) => DEFS[e.type]?.ground);
  const roots = new Map<string, number>();
  for (const g of grounds) roots.set(find(key(g.id, DEFS[g.type].ports[0].id)), 0);
  const active = doc.elements.filter((e) => DEFS[e.type] && !DEFS[e.type].ground && DEFS[e.type].build);
  const groundedInside = active.some((e) => DEFS[e.type].groundsItself);
  if (!grounds.length && active.length && !groundedInside) {
    // No ground: take the second port of the first element as reference, and say so.
    const first = active[0];
    const p = DEFS[first.type].ports[1] ?? DEFS[first.type].ports[0];
    roots.set(find(keysOf(first.id, p)[0]), 0);
    diagnostics.push({ level: 'warn', text: { fr: `Pas de masse : la borne − de ${first.id} sert de référence. Ajoutez une masse.`, en: `No ground: ${first.id}’s − terminal is used as reference. Add a ground.` } });
  }
  let next = 1;
  const node: Record<string, number> = {};
  for (const el of doc.elements)
    for (const p of DEFS[el.type]?.ports ?? [])
      for (const k of keysOf(el.id, p)) {
        const r = find(k);
        if (!roots.has(r)) roots.set(r, next++);
        node[k] = roots.get(r)!;
      }
  const label = (p: { id: string }) => (p.id === 'a' ? '+' : p.id === 'b' ? '−' : p.id);
  for (const el of active)
    for (const p of DEFS[el.type].ports)
      if (!degree.get(key(el.id, p.id)))
        diagnostics.push({ level: 'warn', el: el.id, text: { fr: `La borne ${label(p)} de ${el.id} n’est reliée à rien.`, en: `${el.id}’s ${label(p)} terminal is not connected.` } });
  return {
    node,
    nNodes: next,
    active: active.map((el) => ({ el, def: DEFS[el.type], nodes: DEFS[el.type].ports.flatMap((p) => keysOf(el.id, p).map((k) => node[k])) })),
    diagnostics,
  };
}

const PALETTE = ['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i', '--c-a', '--c-b', '--c-c', '--c-n'];

/** "v_a" of G1 → v_{a,\text{G1}}: a single subscript, as KaTeX requires. */
function symbolOf(sym: string, id: string): string {
  const k = sym.indexOf('_');
  if (k < 0) return `${sym}_{\\text{${id}}}`;
  return `${sym.slice(0, k)}_{${sym.slice(k + 1).replace(/^\{|\}$/g, '')},\\text{${id}}}`;
}

export interface Compiled {
  exp: Experiment;
  net: Netlist;
}

/**
 * Compiles a bench. The interface choices are read lazily, so the formula panel
 * and the frequency plots follow them without recompiling.
 */
export function compile(doc: BenchDoc, ui: BenchUi, circuitEqs: (net: Netlist) => EquationSpec[]): Compiled {
  const net = buildNetlist(doc);
  const params: ParamSpec[] = [
    { id: 'T', symbol: 'T', name: { fr: 'Durée simulée', en: 'Simulated time' }, unit: 's', min: 1e-5, max: 100, default: doc.T, scale: 'log' },
  ];
  const signals: SignalSpec[] = [];
  let color = 0;
  for (const { el, def } of net.active) {
    for (const q of def.params)
      params.push({ id: `${el.id}.${q.id}`, symbol: `${q.symbol}_{${el.id}}`, name: q.name, unit: q.unit, min: q.min, max: q.max, default: el.params[q.id] ?? q.default, scale: q.scale });
    for (const sg of def.signals) {
      const sp = sigSpec(sg);
      signals.push({
        id: `${el.id}.${sp.id}`,
        symbol: symbolOf(sp.sym, el.id),
        name: { fr: `${sp.name.fr} de ${el.id}`, en: `${el.id} ${sp.name.en}` },
        unit: sp.unit,
        color: PALETTE[color++ % PALETTE.length],
        on: el.scope.includes(sp.id),
      });
    }
  }
  // Something on the scope from the start: the first source's current, if nothing else.
  if (signals.length && !signals.some((s) => s.on)) signals[0].on = true;

  const simulate = (p: Params, tEnd: number): Run => {
    const sub = substeps(net, p, tEnd);
    const h = tEnd / (N_OUT * sub);
    const { els, nAll } = buildElements(net, initMachines(net, p), h);
    const r = runEmt(nAll, els, tEnd, N_OUT, sub);
    const s: Record<string, Float64Array> = {};
    for (const { el, def } of net.active)
      for (const sg of def.signals) {
        const id = sigSpec(sg).id;
        const v = r.v[el.id], i = r.i[el.id];
        s[`${el.id}.${id}`] =
          r.out[`${el.id}.${id}`] ?? (id === 'v' ? v : id === 'i' ? i : id === 'p' ? v.map((x, k) => x * i[k]) : new Float64Array(r.t.length));
      }
    return { t: r.t, s };
  };
  const model: Model = { id: 'atelier', simulate, poles: (p) => modalOf(net, p).poles.map((q) => q.s), window: (p) => p.T ?? doc.T };

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
    info: (p) => ({ net, ss: steadyState(net, initMachines(net, p)), modal: modalOf(net, p) }),
    phasors: benchPhasors(net),
    charts: benchCharts(net, ui, () => signals),
    get equations() {
      const id = ui.selected();
      return id ? elementEqs(id) : circuitEqs(net);
    },
    steps: [],
    canvas: undefined as never,
    instruments: [],
  };
  return { exp, net };
}
