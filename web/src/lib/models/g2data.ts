// G2ELin results baked into the app (scripts/bake-g2elin.mjs and
// scripts/bake-shapes.py), for lessons 8.8 (modes and participation on real
// networks) and 8.9 (model reduction, EMT against RMS). Using baked data keeps
// these lessons instant and available without a running G2ELin server.

import modesJson from '../../data/g2elin/modes.json';
import reductionJson from '../../data/g2elin/reduction.json';
import type { L } from '../ui/ui.svelte';
import type { Model, Params, Run } from './types';

export interface BakedMode {
  mode: number;
  re: number;
  im: number;
  f: number; // Hz
  zeta: number; // %
  category: string;
  shares: Record<string, number>;
  top: [string, number][]; // most participating states
  units: Record<string, number>; // participation summed per unit
}

export interface BakedNetwork {
  name: L;
  nStates: number;
  stable: boolean;
  modes: BakedMode[];
  all: [number, number][];
  categories: { id: string; label: string; note: string }[];
  topology: { nodes: { id: number; name: string; x: number; y: number; unit: string | null }[]; edges: { from: number; to: number; kind: string }[] };
  /** Per mode: unit → [relative amplitude, phase in degrees] of its angle state. */
  shapes: Record<string, Record<string, [number, number]>>;
  /** Kicked machine → time and every machine's speed deviation (mHz). */
  free: Record<string, { t: number[]; series: Record<string, number[]> }>;
  machines: string[];
  /** Unit label (SM_1, GFM_1, GFL_2…) → bus id. */
  unit_bus: Record<string, number>;
}

export const NETWORKS = modesJson as unknown as Record<string, BakedNetwork>;
export const NETWORK_IDS = ['kundur_two_area', 'kundur_two_area_classic', 'wscc9_3sm', 'wscc9_2sm_1gfm', 'wscc9_1sm_2gfl', 'ieee39'];

export const CATEGORY: Record<string, L> = {
  synchronisation: { fr: 'synchronisme', en: 'synchronisation' },
  control: { fr: 'régulation', en: 'control' },
  unit_electrical: { fr: 'électrique (machine)', en: 'unit electrical' },
  network: { fr: 'réseau', en: 'network' },
  mixed: { fr: 'mixte', en: 'mixed' },
  reference: { fr: 'référence', en: 'reference' },
};
export const CATEGORY_COLOR: Record<string, string> = {
  synchronisation: '--c-p',
  control: '--c-R',
  unit_electrical: '--c-L',
  network: '--c-C',
  mixed: '--muted',
  reference: '--muted',
};

/** Pretty unit name: "SM_3" → "G3", "GFM_1" → "GFM 1", "GFL_2" → "GFL 2". */
export const unitLabel = (u: string) => (u.startsWith('SM_') ? `G${u.slice(3)}` : u.replace('_', ' '));

export interface ModesInfo {
  id: string;
  net: BakedNetwork;
  /** Oscillatory modes above 0.05 Hz, by increasing frequency. */
  modes: BakedMode[];
  sel: BakedMode;
  index: number; // 0-based index of the selected mode in `modes`
  shape: Record<string, [number, number]> | null;
  kicked: string;
}

export function modesInfo(p: Params): ModesInfo {
  const id = NETWORK_IDS[p.net] ?? NETWORK_IDS[0];
  const net = NETWORKS[id];
  const modes = net.modes.filter((m) => m.f >= 0.05);
  const index = Math.max(0, Math.min(modes.length - 1, Math.round(p.mode) - 1));
  const sel = modes[index];
  const kicked = net.machines[Math.max(0, Math.min(net.machines.length - 1, Math.round(p.kick) - 1))];
  return { id, net, modes, sel, index, shape: net.shapes[String(sel.mode)] ?? null, kicked };
}

export const MAX_MACHINES = 10;

export const modesModel: Model = {
  id: 'g2-modes',
  poles: () => [],
  window: () => 12,
  simulate(p): Run {
    const k = modesInfo(p);
    const fr = k.net.free[k.kicked];
    const t = Float64Array.from(fr.t);
    const s: Record<string, Float64Array> = {};
    for (let j = 1; j <= MAX_MACHINES; j++) {
      const series = fr.series[`SM_${j}`];
      s[`w${j}`] = series ? Float64Array.from(series) : t.map(() => NaN);
    }
    return { t, s };
  },
};

// ── Model reduction (8.9) ────────────────────────────────────────────────────

export interface BakedModal {
  nStates: number;
  stable: boolean;
  modes: BakedMode[];
  all: [number, number][];
}
export interface Reduction {
  levels: { id: string; name: L }[];
  smib: Record<string, { modal: BakedModal; emt: { seconds: number; t: number[]; dw: number[]; linT: number[] | null; lin: number[] | null; note: string | null } | null }>;
  kundur: Record<string, BakedModal>;
}

export const REDUCTION = reductionJson as unknown as Reduction;

export interface ReductionInfo {
  level: string;
  name: L;
  smibStates: number;
  kundurStates: number;
  seconds: number | null;
  /** Kundur electromechanical modes at this level, by frequency. */
  em: BakedMode[];
  /** Largest gap (mHz) between this level's response and full EMT. */
  gap: number;
}

export const emModes = (m: BakedModal) => m.modes.filter((x) => x.category === 'synchronisation' && x.f >= 0.1 && x.f <= 3).sort((a, b) => a.f - b.f);

export function reductionInfo(p: Params): ReductionInfo {
  const L = REDUCTION.levels[Math.max(0, Math.min(REDUCTION.levels.length - 1, Math.round(p.level)))];
  const s = REDUCTION.smib[L.id], ref = REDUCTION.smib.emt;
  let gap = 0;
  if (s.emt && ref.emt) for (let k = 0; k < Math.min(s.emt.dw.length, ref.emt.dw.length); k++) gap = Math.max(gap, Math.abs(s.emt.dw[k] - ref.emt.dw[k]));
  return {
    level: L.id,
    name: L.name,
    smibStates: s.modal.nStates,
    kundurStates: REDUCTION.kundur[L.id].nStates,
    seconds: s.emt?.seconds ?? null,
    em: emModes(REDUCTION.kundur[L.id]),
    gap,
  };
}

/** Sample y(tq) by linear interpolation in (t, y). */
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

export const reductionModel: Model = {
  id: 'g2-reduction',
  poles: () => [],
  window: () => 3,
  simulate(p): Run {
    const k = reductionInfo(p);
    const run = REDUCTION.smib[k.level].emt!, ref = REDUCTION.smib.emt.emt!;
    const t = Float64Array.from(ref.t);
    return {
      t,
      s: {
        dw: t.map((tq) => interp(run.t, run.dw, tq)),
        dwEmt: Float64Array.from(ref.dw),
        lin: run.lin && run.linT ? t.map((tq) => interp(run.linT!, run.lin!, tq)) : t.map(() => NaN),
      },
    };
  },
};
