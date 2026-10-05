// Ready-made benches: lesson circuits and classic set-ups, as starting points.

import type { BenchDoc, BenchEl, Wire } from './doc';
import type { L } from '../lib/ui/ui.svelte';

const el = (id: string, type: string, x: number, y: number, rot: BenchEl['rot'], params: Record<string, number>, scope: string[] = []): BenchEl => ({ id, type, x, y, rot, params, scope });
const w = (id: string, a: string, b: string): Wire => {
  const [ae, ap] = a.split('.'), [be, bp] = b.split('.');
  return { id, a: { el: ae, port: ap }, b: { el: be, port: bp } };
};

/** Series loop: source on the left (vertical), R and L on top, C on the right, ground under the source. */
function seriesRLC(name: string, src: BenchEl, R: number, L: number, C: number, T: number): BenchDoc {
  return {
    version: 1,
    name,
    T,
    elements: [
      src,
      el('R1', 'R', 8, 4, 0, { R }),
      el('L1', 'L', 14, 4, 0, { L }, ['i']),
      el('C1', 'C', 18, 8, 90, { C }, ['v']),
      el('GND1', 'gnd', 4, 12, 0, {}),
    ],
    wires: [w('w1', 'V1.a', 'R1.a'), w('w2', 'R1.b', 'L1.a'), w('w3', 'L1.b', 'C1.a'), w('w4', 'C1.b', 'V1.b'), w('w5', 'V1.b', 'GND1.g')],
  };
}

export interface Template {
  id: string;
  name: L;
  note: L;
  doc: () => BenchDoc;
}

export const TEMPLATES: Template[] = [
  {
    id: 'rlc-step',
    name: { fr: 'RLC série sous échelon (leçon 1.2)', en: 'Series RLC step (lesson 1.2)' },
    note: { fr: 'Oscillation amortie à 159 Hz ; essayez R = 20 Ω pour l’amortissement critique.', en: 'Damped oscillation at 159 Hz; try R = 20 Ω for critical damping.' },
    doc: () => seriesRLC('RLC série', el('V1', 'vstep', 4, 8, 90, { V: 10, t0: 0 }), 2, 0.01, 1e-4, 0.07),
  },
  {
    id: 'rlc-ac',
    name: { fr: 'RLC série en alternatif (leçon 1.4)', en: 'Series RLC on AC (lesson 1.4)' },
    note: { fr: 'Source à la résonance (159 Hz) : transitoire puis régime établi ; la tension du condensateur dépasse celle de la source.', en: 'Source at resonance (159 Hz): transient then steady state; the capacitor voltage exceeds the source’s.' },
    doc: () => seriesRLC('RLC en alternatif', el('V1', 'vac', 4, 8, 90, { Vpk: 10, f: 159.15, ph: 0 }), 5, 0.01, 1e-4, 0.1),
  },
  {
    id: 'rc-switch',
    name: { fr: 'Charge d’un condensateur', en: 'Charging a capacitor' },
    note: { fr: 'L’interrupteur se ferme à 1 ms ; l’ampèremètre et le voltmètre tracent la charge en $e^{-t/RC}$.', en: 'The switch closes at 1 ms; the ammeter and voltmeter trace the $e^{-t/RC}$ charge.' },
    doc: () => ({
      version: 1,
      name: 'Charge RC',
      T: 0.006,
      elements: [
        el('V1', 'vdc', 4, 8, 90, { V: 5 }),
        el('S1', 'switch', 8, 4, 0, { tc: 0.001, to: 0 }),
        el('AM1', 'ammeter', 14, 4, 0, {}, ['i']),
        el('R1', 'R', 20, 4, 0, { R: 1000 }),
        el('C1', 'C', 24, 8, 90, { C: 1e-6 }),
        el('VM1', 'voltmeter', 28, 8, 90, {}, ['v']),
        el('GND1', 'gnd', 4, 12, 0, {}),
      ],
      wires: [
        w('w1', 'V1.a', 'S1.a'),
        w('w2', 'S1.b', 'AM1.a'),
        w('w3', 'AM1.b', 'R1.a'),
        w('w4', 'R1.b', 'C1.a'),
        w('w5', 'C1.a', 'VM1.a'),
        w('w6', 'C1.b', 'V1.b'),
        w('w7', 'VM1.b', 'C1.b'),
        w('w8', 'V1.b', 'GND1.g'),
      ],
    }),
  },
];
