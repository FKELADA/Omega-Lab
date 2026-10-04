// The state of one running experiment, shared by every panel. Each instrument
// reads from here and writes back through these methods, which is what keeps the
// canvas, plots, equations and time cursor in sync.

import type { Complex } from '../core/linalg';
import type { Params, Run } from '../models/types';
import type { L } from '../ui/ui.svelte';
import { time } from '../ui/format';
import type { Experiment } from './types';

export interface Ghost {
  params: Params;
  label: string;
}

export interface Prediction {
  active: boolean;
  points: [number, number][];
  revealed: boolean;
  score: number | null;
  feedback: L | null;
}

const freshPrediction = (): Prediction => ({ active: false, points: [], revealed: false, score: null, feedback: null });

export class Lab {
  exp: Experiment;

  params = $state<Params>({});
  /** Time cursor as a fraction of the window, so it survives window changes. */
  frac = $state(0.15);
  playing = $state(false);
  lockedTEnd = $state<number | null>(null);
  /** Hovered equation term; every panel highlights it. */
  hover = $state<string | null>(null);
  visible = $state<Record<string, boolean>>({});
  ghosts = $state<Ghost[]>([]);
  fan = $state<{ param: string; values: number[] } | null>(null);
  prediction = $state<Prediction>(freshPrediction());
  stepIndex = $state(0);
  completed = $state<Record<string, boolean>>({});
  /** Furthest the learner has scrubbed, for steps that ask them to explore in time. */
  maxFrac = $state(0);
  /** Lesson-specific events that step checks can test (e.g. a view was opened). */
  flags = $state<Record<string, boolean>>({});

  tEnd: number;
  run: Run;
  info: any;
  poles: Complex[];
  ghostRuns: Run[];
  fanRuns: Run[];
  t: number;
  idx: number;
  /** True while a prediction is being sketched: panels hide what would give it away. */
  concealed: boolean;

  constructor(exp: Experiment) {
    this.exp = exp;
    const model = exp.model;
    this.tEnd = $derived(this.lockedTEnd ?? model.window(this.params));
    this.run = $derived(model.simulate(this.params, this.tEnd));
    this.info = $derived(exp.info(this.params));
    this.poles = $derived(model.poles(this.params));
    this.ghostRuns = $derived(this.ghosts.map((g) => model.simulate(g.params, this.tEnd)));
    this.fanRuns = $derived(
      this.fan ? this.fan.values.map((v) => model.simulate({ ...this.params, [this.fan!.param]: v }, this.tEnd)) : [],
    );
    this.t = $derived(this.frac * this.tEnd);
    this.idx = $derived(Math.round(this.frac * (this.run.t.length - 1)));
    this.concealed = $derived(this.prediction.active && !this.prediction.revealed);
    this.reset();
  }

  reset() {
    this.params = Object.fromEntries(this.exp.params.map((p) => [p.id, p.default]));
    this.visible = Object.fromEntries(this.exp.signals.map((s) => [s.id, s.on]));
    this.ghosts = [];
    this.fan = null;
    this.lockedTEnd = null;
    this.prediction = freshPrediction();
  }

  /** The cursor's value as text: a time, or the lesson's own variable (see Experiment.axis). */
  fmtT(v: number, digits = 3): string {
    return this.exp.axis ? this.exp.axis.fmt(v, digits) : time(v, this.exp.timeUnit, digits);
  }

  at(signal: string): number {
    return this.run.s[signal]?.[this.idx] ?? NaN;
  }

  setFrac(f: number) {
    this.frac = Math.min(1, Math.max(0, f));
    this.maxFrac = Math.max(this.maxFrac, this.frac);
  }

  setParam(id: string, v: number) {
    this.params[id] = v;
  }

  toggleSignal(id: string) {
    this.visible[id] = !this.visible[id];
  }

  freeze() {
    this.lockedTEnd = this.tEnd;
    const label = this.exp.params
      .filter((p) => p.id !== 'V')
      .map((p) => `${p.id}=${+this.params[p.id].toPrecision(3)}`)
      .join(' ');
    this.ghosts = [...this.ghosts.slice(-3), { params: { ...this.params }, label }];
  }

  clearGhosts() {
    this.ghosts = [];
    this.fan = null;
    this.lockedTEnd = null;
  }

  sweep(paramId: string) {
    if (this.fan?.param === paramId) {
      this.fan = null;
      return;
    }
    const spec = this.exp.params.find((p) => p.id === paramId)!;
    const n = 7;
    const values = Array.from({ length: n }, (_, k) => {
      const f = k / (n - 1);
      return spec.scale === 'log'
        ? spec.min * (spec.max / spec.min) ** f
        : spec.min + (spec.max - spec.min) * f;
    });
    this.lockedTEnd = this.tEnd;
    this.fan = { param: paramId, values };
  }

  startPrediction() {
    this.prediction = { ...freshPrediction(), active: true };
    this.lockedTEnd = this.tEnd;
    this.visible[this.exp.predict!.signal] = true;
  }

  reveal() {
    const spec = this.exp.predict!;
    const pts = [...this.prediction.points].sort((a, b) => a[0] - b[0]);
    const truth = this.run.s[spec.signal];
    const peak = Math.max(...Array.from(truth).filter(isFinite).map(Math.abs)) || 1;
    let err = 0, n = 0;
    this.run.t.forEach((t, k) => {
      // Samples without a solution (e.g. beyond a nose point) are not scored.
      if (!isFinite(truth[k]) || pts.length < 2 || t < pts[0][0] || t > pts[pts.length - 1][0]) return;
      const j = pts.findIndex((p) => p[0] >= t);
      const [t0, y0] = pts[Math.max(0, j - 1)], [t1, y1] = pts[j];
      const y = t1 === t0 ? y1 : y0 + ((y1 - y0) * (t - t0)) / (t1 - t0);
      err += ((y - truth[k]) / peak) ** 2;
      n++;
    });
    const coverage = n / (Array.from(truth).filter(isFinite).length || 1);
    const rms = n ? Math.sqrt(err / n) : 1;
    this.prediction.score = Math.round(100 * Math.max(0, 1 - rms) * Math.min(1, coverage / 0.6));
    this.prediction.feedback = spec.diagnose?.(pts, this.run, this.params) ?? null;
    this.prediction.revealed = true;
  }

  endPrediction() {
    this.prediction = freshPrediction();
    this.lockedTEnd = null;
  }
}
