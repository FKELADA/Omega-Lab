// Shared types and helpers of the Atelier's component library.

import type { EmtElement } from './engine/emt';
import type { AcModel } from './engine/ac';
import type { EqContext } from '../lib/lab/types';
import type { L } from '../lib/ui/ui.svelte';

/** Grid pitch, in canvas pixels. */
export const GRID = 20;

export interface PortDef {
  id: string;
  /** Three-phase port: one wire carries the three conductors a, b, c. */
  phases?: 3;
  /** Label drawn next to the port on elements with more than two. */
  label?: string;
  /** A control-signal port (not electrical): an input or an output. */
  signal?: 'in' | 'out';
  /** Position relative to the element centre, in grid units, before rotation. */
  dx: number;
  dy: number;
}

export interface ElParam {
  id: string;
  symbol: string; // KaTeX
  name: L;
  unit: string;
  default: number;
  min: number;
  max: number;
  scale: 'lin' | 'log';
  /** Discrete choices, shown as buttons. */
  choices?: { value: number; label: L }[];
}

export interface ElFormula {
  title: L;
  tex: (c: EqContext, id: string) => string;
  note?: (c: EqContext, id: string) => string | null;
  personas?: ('learner' | 'research' | 'utility')[];
}

export type Family = 'sources' | 'passives' | 'switches' | 'power' | 'grid' | 'machines' | 'ibr' | 'control' | 'instruments';

/** A signal: the element's voltage, current or power, or one of its named outputs. */
export type Sig = 'v' | 'i' | 'p' | { id: string; unit: string; name: L; sym?: string };

const SIG: Record<string, { unit: string; name: L }> = {
  v: { unit: 'V', name: { fr: 'tension', en: 'voltage' } },
  i: { unit: 'A', name: { fr: 'courant', en: 'current' } },
  p: { unit: 'W', name: { fr: 'puissance', en: 'power' } },
};
export function sigSpec(s: Sig): { id: string; unit: string; name: L; sym: string } {
  return typeof s === 'string' ? { id: s, unit: SIG[s].unit, name: SIG[s].name, sym: s } : { ...s, sym: s.sym ?? s.id };
}

/** Access to the control signals of an element's signal ports. */
export interface SigCtx {
  /** Reader of an input port's signal (0 when unconnected). */
  in(port: string): () => number;
  /** Writer of an output port's signal. */
  out(port: string): (v: number) => void;
}

export interface ElementDef {
  type: string;
  family: Family;
  name: L;
  /** Prefix of automatic names: R1, L2… */
  prefix: string;
  ports: PortDef[];
  params: ElParam[];
  /** SVG path(s) in local pixels, drawn horizontally, ports at x = ±40. */
  symbol: string;
  /** Short text drawn inside the symbol (meters). */
  glyph?: string;
  /** Drawn with a round body (sources, meters). */
  circle?: boolean;
  /** Half-width and half-height of the selectable box, in pixels (default 30 × 16). */
  box?: [number, number];
  /** How it enters the frequency-domain (AC) equations. */
  ac: AcModel;
  /** Value shown next to the symbol. */
  label?: (p: Record<string, number>) => string;
  /** Signals offered to the oscilloscope: v, i, p, or named outputs of the element. */
  signals: Sig[];
  /** Shown on the oscilloscope by default. */
  scopeDefault?: string[];
  /** Has an internal connection to ground (three-phase sources with a grounded neutral). */
  groundsItself?: boolean;
  /** Ground: its port is the reference node. */
  ground?: boolean;
  /**
   * The element for the solver; nodes are in port order (three per three-phase
   * port). Composite elements return several, the first one carrying the
   * element's id and outputs; `node()` allocates internal nodes.
   */
  build?: (id: string, nodes: number[], p: Record<string, number>, h: number, node: () => number, sig: SigCtx) => EmtElement | EmtElement[];
  /** Shortest time scale it imposes (for the automatic step), if any. */
  timeScale?: (p: Record<string, number>) => number | null;
  formulas: ElFormula[];
}

export const two: PortDef[] = [
  { id: 'a', dx: -2, dy: 0 },
  { id: 'b', dx: 2, dy: 0 },
];

/** Engineering notation with SI prefix, for labels. */
export function si(v: number, unit: string, digits = 3): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return `0 ${unit}`;
  const pre = ['p', 'n', 'µ', 'm', '', 'k', 'M', 'G'];
  let e = Math.floor(Math.log10(Math.abs(v)) / 3);
  e = Math.max(-4, Math.min(3, e));
  const m = v / 10 ** (3 * e);
  return `${+m.toPrecision(digits)} ${pre[e + 4]}${unit}`.replace('.', ',');
}

export const lead = 'M-40,0 H-24 M24,0 H40';

