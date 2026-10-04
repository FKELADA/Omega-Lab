// The lesson format. A lesson is data: an experiment (model, knobs, probes,
// equations) plus a sequence of guided steps. Adding a lesson means writing one
// of these, not touching the interface.

import type { Component } from 'svelte';
import type { Complex } from '../core/linalg';
import type { Model, Params, Run } from '../models/types';
import type { L, Persona } from '../ui/ui.svelte';
import type { Lab } from './lab.svelte';

export interface ParamSpec {
  id: string;
  /** KaTeX symbol. */
  symbol: string;
  name: L;
  unit: string;
  min: number;
  max: number;
  default: number;
  scale: 'log' | 'lin';
  /** The equation term this knob belongs to, for cross-highlighting. */
  term?: string;
  /** Slider resolution, e.g. 1 for an integer count. */
  step?: number;
  /** Discrete choices, shown as a segmented control instead of a slider. */
  choices?: { value: number; label: L }[];
}

export interface SignalSpec {
  id: string;
  symbol: string; // KaTeX
  name: L;
  /** Signals sharing a unit share an axis on the oscilloscope. */
  unit: string;
  /** CSS custom property holding its colour. */
  color: string;
  on: boolean;
  term?: string;
  /** Drawn dashed: reference traces such as a steady-state or average value. */
  dash?: boolean;
}

/** What an equation template can read. */
export interface EqContext {
  p: Params;
  /** Model-specific derived quantities (damping ratio, poles, …). */
  k: any;
  /** Value of a signal at the time cursor. */
  at: (signal: string) => number;
  t: number;
  /** Wraps KaTeX in a hoverable, colour-coded term. */
  term: (id: string, tex: string) => string;
  /** A number with unit, as KaTeX. */
  q: (v: number, unit: string, digits?: number) => string;
  tr: (l: L) => string;
}

export interface Bar {
  term: string;
  label: string; // KaTeX
  value: number;
}

export interface EquationSpec {
  id: string;
  title: L;
  /** Which profiles see it. Omitted: everyone. */
  personas?: Persona[];
  tex: (c: EqContext) => string;
  /** Signed bars showing which term dominates at the cursor. */
  bars?: (c: EqContext) => { scale: number; items: Bar[] };
  /** Step-by-step derivation, shown on demand. */
  derive?: (c: EqContext) => string[];
  note?: (c: EqContext) => string | null;
}

export interface StepSpec {
  id: string;
  title: L;
  body: L; // markdown + $math$
  check?: (lab: Lab) => boolean;
  hint?: L;
  /** Turns on predict-then-reveal for this step. */
  predict?: boolean;
}

export interface PredictSpec {
  signal: string;
  /** Fixed y-range while sketching, chosen so it does not give the answer away. */
  yRange: (p: Params) => [number, number];
  /** Misconception diagnosis: returns feedback or null. */
  diagnose?: (pred: [number, number][], run: Run, p: Params) => L | null;
}

export interface Experiment {
  id: string;
  path: L[]; // breadcrumb
  title: L;
  model: Model;
  params: ParamSpec[];
  signals: SignalSpec[];
  info: (p: Params) => any;
  equations: EquationSpec[];
  steps: StepSpec[];
  predict?: PredictSpec;
  /** Parameter traced as a root locus on the s-plane. */
  locusParam?: string;
  poleLabel?: (p: Params, k: any) => L;
  /** Left-column drawing (schematic, helix, …). */
  canvas: LabComponent;
  /** Panels laid out under the oscilloscope. */
  instruments: LabComponent[];
  bode?: BodeSpec;
  phasors?: PhasorSpec;
  /** Source symbol for circuit canvases. */
  source?: 'dc' | 'ac';
  /** Unit of the model's time axis. Default: seconds. */
  timeUnit?: 's' | 'h';
  /**
   * A different independent variable for the cursor and the oscilloscope's x-axis
   * (Newton–Raphson iterations, a load multiplier…), replacing time.
   */
  axis?: { label: L; symbol: string; fmt: (v: number, digits?: number) => string };
  /** Characteristic charts, shown by the Chart0/1/2 instruments in this order. */
  charts?: ChartSpec[];
}

export interface ChartSeries {
  label?: L;
  color: string; // CSS custom property, e.g. '--c-p'
  pts: [number, number][];
  dash?: boolean;
  width?: number;
  /** Draw as a filled, closed area (e.g. the equal-area criterion) instead of a line. */
  fill?: boolean;
}

export interface ChartPoint {
  x: number;
  y: number;
  color: string;
  label?: string;
  hollow?: boolean;
}

export interface ChartAxis {
  label: string;
  unit?: string;
  range: [number, number] | ((lab: Lab) => [number, number]);
  log?: boolean;
}

/** A characteristic curve (torque–slip, nose curve, V–I, capability…) with live operating points. */
export interface ChartSpec {
  title: L;
  x: ChartAxis;
  y: ChartAxis;
  series: (lab: Lab) => ChartSeries[];
  points?: (lab: Lab) => ChartPoint[];
  /** Horizontal shaded bands, e.g. an acceptable voltage range. */
  bands?: (lab: Lab) => { y0: number; y1: number }[];
  /** Vertical marker lines. */
  vlines?: (lab: Lab) => { x: number; label?: string }[];
  note?: (lab: Lab) => L | null;
}

export type LabComponent = Component<{ lab: Lab }>;

export interface BodeCurve {
  id: string;
  label: string; // KaTeX
  term: string;
  color: string;
  unit: string;
  H: (p: Params, f: number) => Complex;
}

/** Frequency response, swept against the parameter `param` (a frequency in Hz). */
export interface BodeSpec {
  param: string;
  range: [number, number];
  curves: BodeCurve[];
  /** Frequencies to mark (resonance, band edges). */
  marks?: (p: Params) => { f: number; label: string }[];
  /** Shaded band, e.g. the half-power bandwidth. */
  band?: (p: Params) => [number, number] | null;
}

export interface PhasorItem {
  id: string;
  label: string; // KaTeX-free plain label, drawn in SVG
  term: string;
  color: string;
  value: Complex;
  /** Draw the tail at this phasor's head (head-to-tail sums). */
  after?: string;
  /** A thin reference arrow (e.g. the resultant). */
  thin?: boolean;
  /** Absolute tail position, in the same units as the value (e.g. a shifted neutral). */
  tail?: Complex;
  /** Unit for the readout, when it differs from the diagram's (e.g. a current among voltages). */
  unit?: string;
  /** Drawing scale relative to the others, so currents can share a voltage plane. */
  drawScale?: number;
}

export interface PhasorSpec {
  omega: (p: Params) => number;
  unit: string;
  /** The values are RMS phasors (power-engineering convention) rather than peaks. */
  rms?: boolean;
  items: (p: Params, k: any) => PhasorItem[];
}

export type { Complex };
