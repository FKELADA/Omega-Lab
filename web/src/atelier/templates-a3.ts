// Templates of phase A3: power electronics benches mirroring lessons 6.1–6.3 and 4.2.

import type { BenchDoc, BenchEl, Wire } from './doc';
import type { L } from '../lib/ui/ui.svelte';

const el = (id: string, type: string, x: number, y: number, rot: BenchEl['rot'], params: Record<string, number>, scope: string[] = []): BenchEl => ({ id, type, x, y, rot, params, scope });
const w = (id: string, a: string, b: string): Wire => {
  const [ae, ap] = a.split('.'), [be, bp] = b.split('.');
  return { id, a: { el: ae, port: ap }, b: { el: be, port: bp } };
};

export interface TemplateA {
  id: string;
  name: L;
  note: L;
  doc: () => BenchDoc;
}

export const TEMPLATES_A3: TemplateA[] = [
  {
    id: 'buck',
    name: { fr: 'Hacheur abaisseur (leçon 6.1)', en: 'Buck chopper (lesson 6.1)' },
    note: { fr: '48 V découpés à 20 kHz avec D = 0,5 : la sortie se stabilise vers 24 V. Zoomez sur le courant de la bobine : un triangle.', en: '48 V chopped at 20 kHz with D = 0.5: the output settles near 24 V. Zoom into the inductor current: a triangle.' },
    doc: () => ({
      version: 1,
      name: 'Hacheur abaisseur',
      T: 0.02,
      elements: [
        el('V1', 'vdc', 4, 8, 90, { V: 48 }),
        el('Q1', 'igbt', 8, 4, 0, { fs: 20e3, D: 0.5 }),
        el('D1', 'diode', 12, 8, 270, { Ron: 1e-3, Vf: 0 }),
        el('L1', 'L', 16, 4, 0, { L: 200e-6 }, ['i']),
        el('C1', 'C', 20, 8, 90, { C: 220e-6 }),
        el('R1', 'R', 24, 8, 90, { R: 10 }, ['v']),
        el('GND1', 'gnd', 4, 12, 0, {}),
      ],
      wires: [
        w('w1', 'V1.a', 'Q1.a'),
        w('w2', 'Q1.b', 'D1.b'),
        w('w3', 'D1.b', 'L1.a'),
        w('w4', 'L1.b', 'C1.a'),
        w('w5', 'C1.a', 'R1.a'),
        w('w6', 'D1.a', 'V1.b'),
        w('w7', 'C1.b', 'V1.b'),
        w('w8', 'R1.b', 'C1.b'),
        w('w9', 'V1.b', 'GND1.g'),
      ],
    }),
  },
  {
    id: 'rectifier',
    name: { fr: 'Pont à thyristors (leçon 6.2)', en: 'Thyristor bridge (lesson 6.2)' },
    note: {
      fr: 'Réseau 400 V, α = 30°, charge R–L : $V_d \\approx 1{,}35\\,U\\cos\\alpha$ moins la chute d’empiètement. Passez α au-delà de 90°.',
      en: '400 V grid, α = 30°, R–L load: $V_d \\approx 1.35\\,U\\cos\\alpha$ minus the overlap drop. Push α beyond 90°.',
    },
    doc: () => ({
      version: 1,
      name: 'Pont à thyristors',
      T: 0.06,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 400, f: 50, ph: 0, R: 0.001, L: 2e-4 }, ['ia']),
        el('PD1', 'rect6', 10, 8, 0, { alpha: 30, f: 50, ph: 0 }, ['vd']),
        el('L1', 'L', 16, 6, 0, { L: 0.01 }, ['i']),
        el('R1', 'R', 20, 8, 90, { R: 1.1 }),
      ],
      wires: [w('w1', 'G1.abc', 'PD1.abc'), w('w2', 'PD1.p', 'L1.a'), w('w3', 'L1.b', 'R1.a'), w('w4', 'R1.b', 'PD1.n')],
    }),
  },
  {
    id: 'inverter',
    name: { fr: 'Onduleur MLI triphasé (leçon 6.3)', en: 'Three-phase PWM inverter (lesson 6.3)' },
    note: {
      fr: 'Bus continu ±300 V, MLI à 2,5 kHz, m = 0,8 : chaque phase porte un fondamental de $m V_{dc}/2$ = 240 V crête. Ouvrez l’onglet Harmoniques sur OND1.va.',
      en: '±300 V DC bus, 2.5 kHz PWM, m = 0.8: each phase carries a fundamental of $m V_{dc}/2$ = 240 V peak. Open the Harmonics tab on OND1.va.',
    },
    doc: () => ({
      version: 1,
      name: 'Onduleur MLI',
      T: 0.06,
      elements: [
        el('V1', 'vdc', 4, 6, 90, { V: 300 }),
        el('V2', 'vdc', 4, 10, 90, { V: 300 }),
        el('GND1', 'gnd', 1, 9, 0, {}),
        el('OND1', 'inv3', 10, 8, 0, { m: 0.8, f: 50, fs: 2500, ph: 0 }, ['ia', 'ib', 'ic']),
        el('CH1', 'load3', 16, 8, 0, { P: 10e3, Q: 5e3, Vn: 400, f: 50 }),
      ],
      wires: [w('w1', 'V1.a', 'OND1.p'), w('w2', 'V2.b', 'OND1.n'), w('w3', 'V1.b', 'V2.a'), w('w4', 'V1.b', 'GND1.g'), w('w5', 'OND1.abc', 'CH1.abc')],
    }),
  },
  {
    id: 'inrush',
    name: { fr: 'Enclenchement d’un transformateur (leçon 4.2)', en: 'Transformer inrush (lesson 4.2)' },
    note: {
      fr: 'Fermeture au passage par zéro de la tension, flux rémanent 0,6 pu : le fer sature et le courant d’appel dépasse largement le courant nominal. Essayez $\\psi_r = 0$ et une source en cosinus.',
      en: 'Closing at a voltage zero crossing, residual flux 0.6 pu: the iron saturates and the inrush far exceeds rated current. Try $\\psi_r = 0$ and a cosine source.',
    },
    doc: () => ({
      version: 1,
      name: 'Courant d’appel',
      T: 0.2,
      elements: [
        el('V1', 'vac', 4, 8, 90, { Vpk: 325, f: 50, ph: -90 }),
        el('S1', 'switch', 8, 4, 0, { tc: 0, to: 0 }),
        el('TR1', 'trafo', 14, 8, 0, { V1: 230, V2: 230, S: 1000, f: 50, x: 0.06, r: 0.01, i0: 0.01, psiK: 1.2, psiR: 0.6 }, ['i1', 'psi']),
        el('R1', 'R', 20, 8, 90, { R: 1e6 }),
        el('GND1', 'gnd', 4, 12, 0, {}),
      ],
      wires: [
        w('w1', 'V1.a', 'S1.a'),
        w('w2', 'S1.b', 'TR1.a'),
        w('w3', 'TR1.b', 'V1.b'),
        w('w4', 'V1.b', 'GND1.g'),
        w('w5', 'TR1.c', 'R1.a'),
        w('w6', 'TR1.d', 'R1.b'),
        w('w7', 'TR1.d', 'GND1.g'),
      ],
    }),
  },
];
