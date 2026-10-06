// G2ELin results baked for lessons 8.10 (PSS on Kundur's two-area system) and 8.11
// (converter model reduction). See scripts/bake-g2elin-b.mjs.

import pssJson from '../../data/g2elin/pss.json';
import ibrJson from '../../data/g2elin/ibr.json';
import type { L } from '../ui/ui.svelte';
import type { Model, Params, Run } from './types';

// ── 8.10 PSS ─────────────────────────────────────────────────────────────────

export interface PssMode {
  re: number;
  im: number;
  f: number;
  /** Damping ratio (%). */
  z: number;
  cat: 'synchronisation' | 'control';
  top: string;
  part: number;
}
interface PssData {
  places: { id: string; name: L }[];
  gains: number[];
  modes: Record<string, Record<string, PssMode[]>>;
  free: Record<string, Record<string, { t: number[]; w: number[][] }>>;
}
export const PSS = pssJson as unknown as PssData;

/** The baked gain nearest to K (a placement without PSS has only K = 0). */
export function pssGain(place: string, K: number): number {
  const keys = Object.keys(PSS.modes[place]).map(Number);
  return keys.reduce((a, b) => (Math.abs(b - K) < Math.abs(a - K) ? b : a), keys[0]);
}

/**
 * The inter-area mode: the least damped electromechanical mode between 0.15 and 0.95 Hz. With
 * strong PSSs it slows down and new, heavily damped slow modes appear, so the slowest mode alone
 * would not do.
 */
export const interOf = (modes: PssMode[]) =>
  modes.filter((m) => m.cat === 'synchronisation' && m.f >= 0.15 && m.f <= 0.95).sort((a, b) => a.z - b.z)[0];

export interface PssInfo {
  place: string;
  name: L;
  K: number;
  modes: PssMode[];
  /** The inter-area mode (the slowest electromechanical mode) and the two local ones. */
  inter: PssMode;
  locals: PssMode[];
  /** The least damped mode of all (electromechanical or control). */
  worst: PssMode;
  localMin: number;
}

export function pssInfo(p: Params): PssInfo {
  const pl = PSS.places[Math.max(0, Math.min(PSS.places.length - 1, Math.round(p.place)))];
  const K = pssGain(pl.id, p.K);
  const modes = PSS.modes[pl.id][K];
  const inter = interOf(modes);
  const locals = modes.filter((m) => m.f > 0.95).sort((a, b) => a.z - b.z).slice(0, 2).sort((a, b) => a.f - b.f);
  const worst = [...modes].sort((a, b) => a.z - b.z)[0];
  return { place: pl.id, name: pl.name, K, modes, inter, locals, worst, localMin: Math.min(...locals.map((m) => m.z)) };
}

export const pssModel: Model = {
  id: 'g2-pss',
  poles: () => [],
  window: () => 15,
  simulate(p): Run {
    const k = pssInfo(p);
    const f = PSS.free[k.place][k.K];
    const t = Float64Array.from(f.t);
    const w = f.w.map((x) => Float64Array.from(x));
    return { t, s: { w1: w[0], w2: w[1], w3: w[2], w4: w[3], d13: t.map((_, i) => w[0][i] - w[2][i]) } };
  },
};

// ── 8.11 Converter model reduction ───────────────────────────────────────────

export interface IbrLevel {
  id: string;
  name: L;
  n: number;
  eig: { re: number; im: number; z: number; top: string }[];
  emt: { seconds: number; t: number[]; y: number[]; linT: number[] | null; lin: number[] | null } | { error: string } | null;
}
interface IbrData {
  [conv: string]: { plot: string; jump: number; levels: IbrLevel[] };
}
export const IBR = ibrJson as unknown as IbrData;
export const CONVS = ['gfm', 'gfl'] as const;

const hasRun = (e: IbrLevel['emt']): e is { seconds: number; t: number[]; y: number[]; linT: number[] | null; lin: number[] | null } => !!e && 'y' in e;

export interface IbrInfo {
  conv: 'gfm' | 'gfl';
  level: IbrLevel;
  full: IbrLevel;
  /** EMT run failed at this level (the reduced model cannot follow this event). */
  failed: boolean;
  seconds: number | null;
  /** Largest gap from the full model's response (same units as the response), or null. */
  gap: number | null;
  /** Fastest eigenvalue kept (|λ|, 1/s). */
  fastest: number;
}

export function ibrInfo(p: Params): IbrInfo {
  const conv = CONVS[Math.round(p.conv)] ?? 'gfm';
  const levels = IBR[conv].levels;
  const level = levels[Math.max(0, Math.min(levels.length - 1, Math.round(p.level)))];
  const full = levels[0];
  let gap: number | null = null;
  if (hasRun(level.emt) && hasRun(full.emt)) {
    gap = 0;
    for (let k = 0; k < full.emt.t.length; k++) gap = Math.max(gap, Math.abs(interp(level.emt.t, level.emt.y, full.emt.t[k]) - full.emt.y[k]));
  }
  return {
    conv,
    level,
    full,
    failed: !hasRun(level.emt),
    seconds: hasRun(level.emt) ? level.emt.seconds : null,
    gap,
    fastest: Math.max(...level.eig.map((e) => Math.hypot(e.re, e.im))),
  };
}

function interp(t: number[], y: number[], tq: number): number {
  if (tq <= t[0]) return y[0];
  if (tq >= t[t.length - 1]) return y[y.length - 1];
  let lo = 0, hi = t.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (t[m] <= tq) lo = m;
    else hi = m;
  }
  return y[lo] + ((y[hi] - y[lo]) * (tq - t[lo])) / (t[hi] - t[lo]);
}

export const ibrModel: Model = {
  id: 'g2-ibr',
  poles: () => [],
  window: () => 0.5,
  simulate(p): Run {
    const k = ibrInfo(p);
    const ref = k.full.emt;
    const t = hasRun(ref) ? Float64Array.from(ref.t) : Float64Array.from({ length: 201 }, (_, i) => (i * 0.5) / 200);
    const run = k.level.emt;
    return {
      t,
      s: {
        y: hasRun(run) ? t.map((tq) => interp(run.t, run.y, tq)) : t.map(() => NaN),
        yFull: hasRun(ref) ? Float64Array.from(ref.y) : t.map(() => NaN),
        lin: hasRun(run) && run.lin && run.linT ? t.map((tq) => interp(run.linT!, run.lin!, tq)) : t.map(() => NaN),
      },
    };
  },
};
