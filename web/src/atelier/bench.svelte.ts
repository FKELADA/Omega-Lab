// The Atelier's live state: the project being edited, the selection, undo/redo,
// local saving and sharing, and the Lab compiled from the drawing.

import { untrack } from 'svelte';
import { Lab } from '../lib/lab/lab.svelte';
import { circuitEquations } from './circuitEqs';
import { compile, type Compiled } from './compile';
import { emptyDoc, type BenchDoc, type BenchEl, type PortRef, type Rot } from './doc';
import { DEFS } from './library';
import { challengeOf } from './challenges';

import { STORE } from './store';

export type Selection = { kind: 'el' | 'wire'; id: string } | null;

/** Topology only: changing a parameter value does not recompile, it re-runs. */
const topoKey = (d: BenchDoc) => JSON.stringify([d.elements.map((e) => [e.id, e.type]), d.wires.map((w) => [w.a, w.b]), d.name]);

export interface Picked {
  els: string[];
  wires: string[];
}
const none = (): Picked => ({ els: [], wires: [] });

export class Bench {
  doc = $state<BenchDoc>(emptyDoc());
  /** Everything selected (rectangle, Shift+click, Ctrl+A). */
  picked = $state<Picked>(none());
  /** Source driving the Bode plot, and node where the impedance is scanned (null: automatic). */
  bodeIn = $state<string | null>(null);
  zAt = $state<string | null>(null);
  /** Participation of each element in the pole clicked in the Poles tab (canvas highlight). */
  highlight = $state<Record<string, number> | null>(null);
  /** A wire being drawn from this port. */
  pending = $state<PortRef | null>(null);
  private past: string[] = [];
  private future: string[] = [];
  canUndo = $state(false);
  canRedo = $state(false);
  /** Bumped when the whole document is replaced (undo, redo, load): forces a recompile. */
  private rev = $state(0);

  compiled: Compiled;
  lab: Lab;

  /** The single selected item, for the inspector and the formulas (null when 0 or several). */
  get selection(): Selection {
    const { els, wires } = this.picked;
    if (els.length + wires.length !== 1) return null;
    return els.length ? { kind: 'el', id: els[0] } : { kind: 'wire', id: wires[0] };
  }
  set selection(sel: Selection) {
    this.picked = sel ? (sel.kind === 'el' ? { els: [sel.id], wires: [] } : { els: [], wires: [sel.id] }) : none();
  }
  // ── Challenges: locked elements and editable parameters ──
  get challenge() {
    return challengeOf(this.doc.challenge);
  }
  isLocked(id: string) {
    return !!this.challenge?.locked.includes(id);
  }
  canEdit(id: string, param: string) {
    return !this.isLocked(id) || !!this.challenge?.editable[id]?.includes(param);
  }
  /** Wires between two locked elements belong to the challenge. */
  private wireLocked(w: { a: PortRef; b: PortRef }) {
    return this.isLocked(w.a.el) && this.isLocked(w.b.el);
  }
  startChallenge(id: string) {
    const c = challengeOf(id);
    if (!c) return;
    const doc = c.doc();
    doc.challenge = id;
    this.load(doc);
  }
  leaveChallenge() {
    this.edit((d) => delete d.challenge);
    this.rev++;
  }

  isPicked(kind: 'el' | 'wire', id: string) {
    return (kind === 'el' ? this.picked.els : this.picked.wires).includes(id);
  }
  /** Shift+click: add to or remove from the selection. */
  togglePick(kind: 'el' | 'wire', id: string) {
    const key = kind === 'el' ? 'els' : 'wires';
    const list = this.picked[key];
    this.picked = { ...this.picked, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
  }
  selectAll() {
    this.picked = { els: this.doc.elements.map((e) => e.id), wires: this.doc.wires.map((w) => w.id) };
  }
  /** Rectangle selection, in grid units: elements whose centre is inside, and the wires between them. */
  selectBox(x0: number, y0: number, x1: number, y1: number, add = false) {
    const [xa, xb] = [Math.min(x0, x1), Math.max(x0, x1)], [ya, yb] = [Math.min(y0, y1), Math.max(y0, y1)];
    const els = this.doc.elements.filter((e) => e.x >= xa && e.x <= xb && e.y >= ya && e.y <= yb).map((e) => e.id);
    const inside = new Set(add ? [...this.picked.els, ...els] : els);
    const wires = this.doc.wires.filter((w) => inside.has(w.a.el) && inside.has(w.b.el)).map((w) => w.id);
    this.picked = add ? { els: [...inside], wires: [...new Set([...this.picked.wires, ...wires])] } : { els, wires };
  }
  /** Moves every selected element by (dx, dy) grid cells from the given start positions. */
  moveGroup(start: Record<string, [number, number]>, dx: number, dy: number) {
    for (const [id, [x, y]] of Object.entries(start)) {
      if (this.isLocked(id)) continue;
      const el = this.el(id);
      if (el) (el.x = x + dx), (el.y = y + dy);
    }
    this.save();
  }
  /** Deletes the selected elements (with their wires) and the selected wires. */
  removePicked() {
    const els = new Set(this.picked.els.filter((id) => !this.isLocked(id)));
    const wires = new Set(this.picked.wires.filter((id) => !this.wireLocked(this.doc.wires.find((w) => w.id === id)!)));
    if (!els.size && !wires.size) return;
    this.edit((d) => {
      d.elements = d.elements.filter((e) => !els.has(e.id));
      d.wires = d.wires.filter((w) => !wires.has(w.id) && !els.has(w.a.el) && !els.has(w.b.el));
    });
    this.picked = none();
  }
  /** Empties the bench (undoable). */
  clearAll() {
    if (!this.doc.elements.length && !this.doc.wires.length) return;
    // In a challenge, only what the learner added goes.
    this.edit((d) => {
      d.elements = d.elements.filter((e) => this.isLocked(e.id));
      d.wires = d.wires.filter((w) => this.wireLocked(w));
    });
    this.picked = none();
    this.pending = null;
  }

  constructor() {
    this.doc = this.restore() ?? emptyDoc();
    const key = $derived(topoKey(this.doc) + this.rev);
    this.compiled = $derived.by(() => {
      void key;
      const doc = untrack(() => $state.snapshot(this.doc) as BenchDoc);
      return compile(
        doc,
        {
          selected: () => (this.selection?.kind === 'el' ? this.selection.id : null),
          bodeIn: () => this.bodeIn,
          zAt: () => this.zAt,
        },
        circuitEquations,
      );
    });
    this.lab = $derived(new Lab(this.compiled.exp));
  }

  // ── History and storage ──
  private commit() {
    this.past.push(JSON.stringify($state.snapshot(this.doc)));
    if (this.past.length > 200) this.past.shift();
    this.future = [];
    this.sync();
  }
  private sync() {
    this.canUndo = this.past.length > 0;
    this.canRedo = this.future.length > 0;
  }
  /** Record the state before a change. */
  edit(fn: (d: BenchDoc) => void) {
    this.commit();
    fn(this.doc);
    this.save();
  }
  undo() {
    const prev = this.past.pop();
    if (!prev) return;
    this.future.push(JSON.stringify($state.snapshot(this.doc)));
    this.doc = JSON.parse(prev);
    this.rev++;
    this.selection = null;
    this.sync();
    this.save();
  }
  redo() {
    const next = this.future.pop();
    if (!next) return;
    this.past.push(JSON.stringify($state.snapshot(this.doc)));
    this.doc = JSON.parse(next);
    this.rev++;
    this.selection = null;
    this.sync();
    this.save();
  }
  save() {
    try {
      localStorage.setItem(STORE, JSON.stringify($state.snapshot(this.doc)));
    } catch {
      /* storage unavailable: the project lives in memory only */
    }
  }
  private restore(): BenchDoc | null {
    try {
      const fromUrl = location.hash.match(/^#atelier=(.+)$/);
      if (fromUrl) return JSON.parse(decodeURIComponent(escape(atob(fromUrl[1]))));
      const s = localStorage.getItem(STORE);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }
  load(doc: BenchDoc) {
    this.commit();
    this.doc = structuredClone(doc);
    this.rev++;
    this.selection = null;
    this.save();
  }
  /** A link that reopens this project. */
  shareUrl(): string {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify($state.snapshot(this.doc)))));
    return `${location.origin}${location.pathname}#atelier=${data}`;
  }

  // ── Editing ──
  nextId(prefix: string): string {
    const used = new Set(this.doc.elements.map((e) => e.id));
    for (let k = 1; ; k++) if (!used.has(`${prefix}${k}`)) return `${prefix}${k}`;
  }
  add(type: string, x: number, y: number): string {
    const def = DEFS[type];
    const id = this.nextId(def.prefix);
    this.edit((d) => {
      d.elements.push({ id, type, x, y, rot: 0, params: Object.fromEntries(def.params.map((p) => [p.id, p.default])), scope: [...(def.scopeDefault ?? [])] });
    });
    this.selection = { kind: 'el', id };
    return id;
  }
  el(id: string): BenchEl | undefined {
    return this.doc.elements.find((e) => e.id === id);
  }
  move(id: string, x: number, y: number, record = true) {
    const el = this.el(id);
    if (!el || (el.x === x && el.y === y)) return;
    if (record) this.commit();
    el.x = x;
    el.y = y;
    this.save();
  }
  /** Before a drag: one undo entry for the whole drag. */
  beginMove() {
    this.commit();
  }
  rotate(id: string) {
    if (this.isLocked(id)) return;
    this.edit((d) => {
      const el = d.elements.find((e) => e.id === id);
      if (el) el.rot = ((el.rot + 90) % 360) as Rot;
    });
  }
  remove() {
    this.removePicked();
  }
  /** Click on a port: start a wire, or finish the one being drawn. */
  clickPort(ref: PortRef) {
    const p = this.pending;
    if (!p) {
      this.pending = ref;
      return;
    }
    this.pending = null;
    if (p.el === ref.el && p.port === ref.port) return;
    const dup = this.doc.wires.some(
      (w) => (w.a.el === p.el && w.a.port === p.port && w.b.el === ref.el && w.b.port === ref.port) || (w.b.el === p.el && w.b.port === p.port && w.a.el === ref.el && w.a.port === ref.port),
    );
    if (dup) return;
    const used = new Set(this.doc.wires.map((w) => w.id));
    let k = 1;
    while (used.has(`w${k}`)) k++;
    this.edit((d) => d.wires.push({ id: `w${k}`, a: p, b: ref }));
  }
  /** A history point before a parameter edit (a typed value, or the start of a slider drag). */
  checkpoint() {
    this.commit();
  }
  /** Change a parameter: stored in the project, and re-run without recompiling. */
  setParam(id: string, param: string, v: number) {
    const el = this.el(id);
    if (!el || !this.canEdit(id, param)) return;
    el.params[param] = v;
    this.lab.setParam(`${id}.${param}`, v);
    this.save();
  }
  setT(T: number) {
    this.doc.T = T;
    this.lab.setParam('T', T);
    this.save();
  }
  toggleScope(id: string, s: string) {
    const el = this.el(id);
    if (!el) return;
    const on = !el.scope.includes(s);
    el.scope = on ? [...el.scope, s] : el.scope.filter((x) => x !== s);
    // Visibility lives in the lab too; keep both in step without recompiling.
    this.lab.visible[`${id}.${s}`] = on;
    this.save();
  }
  rename(name: string) {
    this.edit((d) => (d.name = name));
  }
}
