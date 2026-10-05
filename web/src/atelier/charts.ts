// The frequency-domain views of a bench, as specifications for the lessons'
// chart and phasor instruments: Bode gain and phase from a source to every
// signal shown on the oscilloscope, the impedance scan, and the steady-state
// phasors.

import { cabs, carg, type Complex } from '../lib/core/linalg';
import type { Lab } from '../lib/lab/lab.svelte';
import type { ChartSpec, PhasorItem, PhasorSpec, SignalSpec } from '../lib/lab/types';
import { driven, fundamental, impedanceAt, logspace, modalOf, sources, sweepRange, type Steady } from './analyses';
import type { BenchUi, Netlist } from './compile';

const N = 240;

export interface BodeData {
  input: string | null;
  range: [number, number];
  f: number[];
  curves: { id: string; color: string; db: number[]; deg: number[] }[];
}

export interface ZData {
  at: string | null;
  range: [number, number];
  f: number[];
  mag: number[];
  deg: number[];
  /** Local extrema of |Z|: parallel (peak) and series (dip) resonances. */
  marks: { f: number; kind: 'par' | 'ser' }[];
}

const db = (h: Complex) => 20 * Math.log10(Math.max(cabs(h), 1e-12));
const deg = (h: Complex) => (carg(h) * 180) / Math.PI;

export function benchCharts(net: Netlist, ui: BenchUi, signals: () => SignalSpec[]): ChartSpec[] {
  let bodeMemo: { key: string; d: BodeData } | null = null;
  let zMemo: { key: string; d: ZData } | null = null;

  const bode = (lab: Lab): BodeData => {
    const list = sources(net);
    const input = ui.bodeIn() && list.includes(ui.bodeIn()!) ? ui.bodeIn()! : (list[0] ?? null);
    const outs = signals().filter((s) => lab.visible[s.id] && /\.(v|i)$/.test(s.id) && !s.id.startsWith(`${input}.`));
    const key = JSON.stringify([lab.params, input, outs.map((s) => s.id)]);
    if (bodeMemo?.key === key) return bodeMemo.d;
    const range = sweepRange(modalOf(net, lab.params), fundamental(net, lab.params));
    const f = logspace(range[0], range[1], N);
    const curves = outs.map((s) => ({ id: s.id, color: s.color, db: [] as number[], deg: [] as number[] }));
    if (input)
      for (const fk of f) {
        const r = driven(net, lab.params, input, fk);
        curves.forEach((c) => {
          const [id, kind] = c.id.split('.');
          const h = kind === 'v' ? r.v[id] : r.i[id];
          c.db.push(db(h));
          c.deg.push(deg(h));
        });
      }
    const d = { input, range, f, curves };
    bodeMemo = { key, d };
    return d;
  };

  const imp = (lab: Lab): ZData => {
    const probes = net.active.filter(({ def }) => def.type === 'zprobe').map(({ el }) => el.id);
    const at = ui.zAt() && [...probes, ...sources(net)].includes(ui.zAt()!) ? ui.zAt()! : (probes[0] ?? bode(lab).input);
    const key = JSON.stringify([lab.params, at]);
    if (zMemo?.key === key) return zMemo.d;
    const range = sweepRange(modalOf(net, lab.params), fundamental(net, lab.params));
    const f = logspace(range[0], range[1], N * 2);
    const z = at ? f.map((fk) => impedanceAt(net, lab.params, at, fk)) : [];
    const mag = z.map(cabs), ph = z.map(deg);
    const marks: ZData['marks'] = [];
    for (let k = 1; k < mag.length - 1; k++) {
      if (mag[k] > mag[k - 1] && mag[k] > mag[k + 1] && mag[k] > 1.5 * Math.min(mag[0], mag[mag.length - 1])) marks.push({ f: f[k], kind: 'par' });
      if (mag[k] < mag[k - 1] && mag[k] < mag[k + 1]) marks.push({ f: f[k], kind: 'ser' });
    }
    const d = { at, range, f, mag, deg: ph, marks };
    zMemo = { key, d };
    return d;
  };

  const dbRange = (lab: Lab): [number, number] => {
    const all = bode(lab).curves.flatMap((c) => c.db).filter(Number.isFinite);
    if (!all.length) return [-60, 20];
    const hi = Math.ceil(Math.max(...all) / 10) * 10 + 10, lo = Math.max(hi - 160, Math.floor(Math.min(...all) / 10) * 10 - 10);
    return [lo, hi];
  };
  const f1Line = (lab: Lab) => {
    const f1 = fundamental(net, lab.params);
    return f1 ? [{ x: f1, label: `f₁` }] : [];
  };

  return [
    {
      title: { fr: 'Bode — gain', en: 'Bode — gain' },
      x: { label: 'f', unit: 'Hz', range: (lab) => bode(lab).range, log: true },
      y: { label: '|H|', unit: 'dB', range: dbRange },
      series: (lab) => {
        const d = bode(lab);
        return d.curves.map((c) => ({ label: { fr: `${c.id} / ${d.input}`, en: `${c.id} / ${d.input}` }, color: c.color, pts: d.f.map((f, k) => [f, c.db[k]] as [number, number]) }));
      },
      vlines: f1Line,
      note: (lab) => {
        const d = bode(lab);
        return d.input
          ? {
              fr: `Réponse de chaque signal affiché sur l’oscilloscope à ${d.input} = 1∠0, les autres sources éteintes. Choisissez l’entrée au-dessus ; ajoutez des sorties en les affichant sur l’oscilloscope.`,
              en: `Response of each signal shown on the oscilloscope to ${d.input} = 1∠0, other sources off. Choose the input above; add outputs by showing them on the oscilloscope.`,
            }
          : { fr: 'Ajoutez une source : elle servira d’entrée.', en: 'Add a source: it will be the input.' };
      },
    },
    {
      title: { fr: 'Bode — phase', en: 'Bode — phase' },
      x: { label: 'f', unit: 'Hz', range: (lab) => bode(lab).range, log: true },
      y: { label: 'φ', unit: '°', range: [-180, 180] },
      series: (lab) => {
        const d = bode(lab);
        return [
          { color: '--muted', pts: [[d.range[0], 0], [d.range[1], 0]], width: 1, dash: true },
          ...d.curves.map((c) => ({ label: { fr: c.id, en: c.id }, color: c.color, pts: d.f.map((f, k) => [f, c.deg[k]] as [number, number]) })),
        ];
      },
      vlines: f1Line,
    },
    {
      title: { fr: 'Impédance vue du nœud', en: 'Impedance seen from the node' },
      x: { label: 'f', unit: 'Hz', range: (lab) => imp(lab).range, log: true },
      y: {
        label: '|Z|',
        unit: 'Ω',
        log: true,
        range: (lab) => {
          const m = imp(lab).mag.filter((x) => x > 0 && Number.isFinite(x));
          if (!m.length) return [0.1, 1e3];
          const lo = Math.min(...m), hi = Math.max(...m);
          return [10 ** Math.floor(Math.log10(lo) - 0.2), 10 ** Math.ceil(Math.log10(hi) + 0.2)];
        },
      },
      series: (lab) => {
        const d = imp(lab);
        return [{ label: { fr: `|Z| en ${d.at}`, en: `|Z| at ${d.at}` }, color: '--c-L', pts: d.f.map((f, k) => [f, d.mag[k]] as [number, number]) }];
      },
      vlines: (lab) => imp(lab).marks.map((m) => ({ x: m.f, label: `${m.kind === 'par' ? '∥' : 'série'} ${m.f < 1e3 ? m.f.toPrecision(3) : (m.f / 1e3).toPrecision(3) + 'k'}` })),
      note: (lab) => {
        const d = imp(lab);
        return d.at
          ? {
              fr: `Impédance vue depuis ${d.at}, sources éteintes. Un pic (∥) est une résonance parallèle : un courant injecté à cette fréquence y produit une grande tension. Un creux (série) laisse passer le courant.`,
              en: `Impedance seen from ${d.at}, sources off. A peak (∥) is a parallel resonance: a current injected at that frequency produces a large voltage. A dip (series) lets current through.`,
            }
          : { fr: 'Posez une sonde d’impédance (Instruments) sur un nœud.', en: 'Place an impedance probe (Instruments) on a node.' };
      },
    },
  ];
}

const PALETTE = ['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i', '--c-a', '--c-b'];

/** Steady-state phasors: every element's voltage, and the sources' currents (thin). */
export function benchPhasors(net: Netlist): PhasorSpec {
  return {
    omega: (p) => 2 * Math.PI * (fundamental(net, p) ?? 0),
    unit: 'V',
    items: (_p, k: { ss: Steady | null }) => {
      if (!k.ss) return [];
      const { res } = k.ss;
      const shown = net.active.filter(({ def }) => def.type !== 'voltmeter' && def.type !== 'ammeter' && def.type !== 'zprobe');
      const vmax = Math.max(1e-12, ...shown.map(({ el }) => cabs(res.v[el.id])));
      const srcs = shown.filter(({ def }) => def.family === 'sources');
      const imax = Math.max(1e-12, ...srcs.map(({ el }) => cabs(res.i[el.id])));
      const items: PhasorItem[] = shown.map(({ el }, j) => ({ id: `${el.id}.v`, label: el.id, term: '', color: PALETTE[j % PALETTE.length], value: res.v[el.id] }));
      for (const { el } of srcs)
        items.push({ id: `${el.id}.i`, label: `i ${el.id}`, term: '', color: '--muted', value: res.i[el.id], thin: true, unit: 'A', drawScale: (0.7 * vmax) / imax });
      return items;
    },
  };
}
