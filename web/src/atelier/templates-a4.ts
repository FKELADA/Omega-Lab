// Templates of phase A4: three-phase grids and machines, mirroring lessons 8.1, 4.8, 4.1, 5.1 and 6.4.

import type { BenchEl, Wire } from './doc';
import type { TemplateA } from './templates-a3';

const el = (id: string, type: string, x: number, y: number, rot: BenchEl['rot'], params: Record<string, number>, scope: string[] = []): BenchEl => ({ id, type, x, y, rot, params, scope });
const w = (id: string, a: string, b: string): Wire => {
  const [ae, ap] = a.split('.'), [be, bp] = b.split('.');
  return { id, a: { el: ae, port: ap }, b: { el: be, port: bp } };
};

export const TEMPLATES_A4: TemplateA[] = [
  {
    id: 'smib',
    name: { fr: 'Alternateur et défaut (leçon 8.1)', en: 'Generator and fault (lesson 8.1)' },
    note: {
      fr: 'Alternateur 500 MVA – transformateur – ligne 225 kV – réseau. Un défaut triphasé de 100 ms est franchi ; allongez-le (F1, élimination) jusqu’à la perte de synchronisme.',
      en: '500 MVA generator – transformer – 225 kV line – grid. A 100 ms three-phase fault is ridden through; lengthen it (F1, clearing) until synchronism is lost.',
    },
    doc: () => ({
      version: 1,
      name: 'Stabilité transitoire',
      T: 3,
      elements: [
        el('SM1', 'sm3', 4, 8, 0, { Sn: 500e6, Vn: 20e3, f: 50, P0: 0.8, E0: 1.1, H: 4, D: 1, xd: 0.3, ra: 0.003, KA: 0, Vref: 0, R: 0, tRel: 0.5 }, ['delta', 'Pe']),
        el('TR1', 'trafo3', 10, 8, 0, { V1: 20e3, V2: 225e3, S: 500e6, x: 0.12, r: 0.003, f: 50 }),
        el('LG1', 'line3', 16, 8, 0, { len: 100, r: 0.03, l: 1, c: 11.5, model: 0 }),
        el('G1', 'src3', 22, 8, 180, { Vll: 225e3, f: 50, ph: 0, R: 0.01, L: 1e-3 }),
        el('F1', 'fault3', 13, 11, 0, { type: 0, Rf: 0.01, ton: 1, toff: 1.1 }),
      ],
      wires: [w('w1', 'SM1.a', 'TR1.a'), w('w2', 'TR1.b', 'LG1.a'), w('w3', 'LG1.b', 'G1.abc'), w('w4', 'F1.a', 'TR1.b')],
    }),
  },
  {
    id: 'motor',
    name: { fr: 'Démarrage d’un moteur (leçon 4.8)', en: 'Motor start (lesson 4.8)' },
    note: { fr: 'Moteur de 15 kW démarré à l’arrêt sur un réseau 400 V : courant d’appel, puis glissement de quelques pour cent. Passez la charge en couple constant.', en: '15 kW motor started from standstill on a 400 V grid: inrush, then a few per cent slip. Switch the load to constant torque.' },
    doc: () => ({
      version: 1,
      name: 'Démarrage moteur',
      T: 1.5,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 400, f: 50, ph: 0, R: 0.005, L: 5e-5 }),
        el('Z1', 'z3', 10, 8, 0, { R: 0.05, L: 1e-4 }),
        el('M1', 'im3', 16, 8, 0, { Pn: 15e3, Vn: 400, f: 50, pp: 2, H: 0.3, T0: 0.5, fan: 1, rr: 0.02 }, ['n', 'ia']),
      ],
      wires: [w('w1', 'G1.abc', 'Z1.a'), w('w2', 'Z1.b', 'M1.a')],
    }),
  },
  {
    id: 'line-wave',
    name: { fr: 'Mise sous tension d’une longue ligne (leçon 4.1)', en: 'Energising a long line (lesson 4.1)' },
    note: {
      fr: 'Ligne de 300 km à vide, modèle à ondes : la tension arrive au bout après τ ≈ 1 ms et s’y double par réflexion, puis l’effet Ferranti s’installe. Comparez avec le modèle π.',
      en: '300 km open line, travelling-wave model: the voltage reaches the end after τ ≈ 1 ms and doubles by reflection, then the Ferranti effect sets in. Compare with the π model.',
    },
    doc: () => ({
      version: 1,
      name: 'Ondes sur une ligne',
      T: 0.04,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 400e3, f: 50, ph: 0, R: 0.1, L: 0.02 }),
        el('DJ1', 'brk3', 10, 8, 0, { s0: 1, to: 0, tc: 0.005 }),
        el('LG1', 'line3', 16, 8, 0, { len: 300, r: 0.03, l: 1, c: 11.5, model: 1 }, ['va2']),
      ],
      wires: [w('w1', 'G1.abc', 'DJ1.a'), w('w2', 'DJ1.b', 'LG1.a')],
    }),
  },
  {
    id: 'pf-grid',
    name: { fr: 'Répartition de charge (leçon 5.1)', en: 'Power flow (lesson 5.1)' },
    note: {
      fr: 'Poste 225/20 kV, départ de 10 km, charge et condensateurs : ouvrez l’onglet Répartition et comparez la répartition de charge (charges à puissance constante) au régime établi (impédance constante).',
      en: '225/20 kV substation, 10 km feeder, load and capacitors: open the Power flow tab and compare the power flow (constant-power loads) with the steady state (constant impedance).',
    },
    doc: () => ({
      version: 1,
      name: 'Répartition de charge',
      T: 0.1,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 225e3, f: 50, ph: 0, R: 0.5, L: 0.05 }),
        el('TR1', 'trafo3', 10, 8, 0, { V1: 225e3, V2: 20e3, S: 40e6, x: 0.12, r: 0.004, f: 50 }),
        el('LG1', 'line3', 16, 8, 0, { len: 10, r: 0.2, l: 1.1, c: 10, model: 0 }),
        el('CH1', 'load3', 22, 8, 0, { P: 12e6, Q: 5e6, Vn: 20e3, f: 50 }),
        el('BC1', 'cap3', 22, 12, 0, { Q: 4e6, Vn: 20e3, f: 50 }),
      ],
      wires: [w('w1', 'G1.abc', 'TR1.a'), w('w2', 'TR1.b', 'LG1.a'), w('w3', 'LG1.b', 'CH1.abc'), w('w4', 'BC1.a', 'CH1.abc')],
    }),
  },
  {
    id: 'lcl3',
    name: { fr: 'Onduleur raccordé avec filtre LCL (leçon 6.4)', en: 'Grid-tied inverter with LCL filter (lesson 6.4)' },
    note: {
      fr: 'Onduleur MLI à 5 kHz, filtre LCL, réseau 400 V : le courant injecté est presque sinusoïdal. Comparez la THD de la tension de l’onduleur et du courant réseau (onglet Harmoniques).',
      en: '5 kHz PWM inverter, LCL filter, 400 V grid: the injected current is almost sinusoidal. Compare the THD of the inverter voltage and of the grid current (Harmonics tab).',
    },
    doc: () => ({
      version: 1,
      name: 'Filtre LCL',
      T: 0.1,
      elements: [
        el('V1', 'vdc', 4, 6, 90, { V: 400 }),
        el('V2', 'vdc', 4, 10, 90, { V: 400 }),
        el('GND1', 'gnd', 1, 9, 0, {}),
        el('OND1', 'inv3', 10, 8, 0, { m: 0.85, f: 50, fs: 5000, ph: 8 }, ['va']),
        el('Z1', 'z3', 15, 8, 0, { R: 0.05, L: 2e-3 }),
        el('BC1', 'cap3', 18, 11, 0, { Q: 3000, Vn: 400, f: 50 }),
        el('Z2', 'z3', 21, 8, 0, { R: 0.05, L: 1e-3 }, ['ia']),
        el('G1', 'src3', 27, 8, 180, { Vll: 400, f: 50, ph: 0, R: 0.01, L: 1e-4 }),
      ],
      wires: [
        w('w1', 'V1.a', 'OND1.p'),
        w('w2', 'V2.b', 'OND1.n'),
        w('w3', 'V1.b', 'V2.a'),
        w('w4', 'V1.b', 'GND1.g'),
        w('w5', 'OND1.abc', 'Z1.a'),
        w('w6', 'Z1.b', 'Z2.a'),
        w('w7', 'BC1.a', 'Z1.b'),
        w('w8', 'Z2.b', 'G1.abc'),
      ],
    }),
  },
];
