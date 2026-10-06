// Templates for Module 10 (distribution): the MV loop and its back-feed, neutral earthing and
// residual currents, and feeder protection with grading and reclosing.

import type { BenchEl, Wire } from './doc';
import type { TemplateA } from './templates-a3';

const el = (id: string, type: string, x: number, y: number, rot: BenchEl['rot'], params: Record<string, number>, scope: string[] = []): BenchEl => ({ id, type, x, y, rot, params, scope });
const w = (id: string, a: string, b: string): Wire => {
  const [ae, ap] = a.split('.'), [be, bp] = b.split('.');
  return { id, a: { el: ae, port: ap }, b: { el: be, port: bp } };
};

/** A 63 kV upstream grid of about 1,000 MVA short-circuit power. */
const grid63 = { Vll: 63e3, f: 50, ph: 0, R: 0.4, L: 0.0126 };
/** The primary-substation transformer, 63/20 kV, 36 MVA. */
const ts = { V1: 63e3, V2: 20e3, S: 36e6, x: 0.17, r: 0.005, f: 50 };
/** 20 kV underground cable (240 mm² Al) and overhead line (148 mm² AAAC), per km. */
const cable = { r: 0.125, l: 0.35, c: 250, model: 0 };
const overhead = { r: 0.22, l: 1.1, c: 10, model: 0 };

export const TEMPLATES_DSO: TemplateA[] = [
  {
    id: 'mv-loop',
    name: { fr: 'Boucle HTA et reprise (leçon 10.1)', en: 'MV loop and back-feed (lesson 10.1)' },
    note: {
      fr: 'Deux postes sources 20 kV et une boucle exploitée ouverte (DJ2 ouvert). À 0,2 s, DJ1 isole le tronçon en tête du côté A : les deux postes HTA/BT perdent la tension. À 0,4 s, le point d’ouverture DJ2 se ferme : le poste B les reprend.',
      en: 'Two 20 kV primary substations and a loop run open (DJ2 open). At 0.2 s, DJ1 isolates the first section on side A: both MV/LV substations lose voltage. At 0.4 s the open point DJ2 closes: substation B picks them up.',
    },
    doc: () => ({
      version: 1,
      name: 'Boucle HTA',
      T: 0.6,
      elements: [
        el('GA', 'src3', 2, 6, 0, { Vll: 20e3, f: 50, ph: 0, R: 0.1, L: 4.2e-3 }),
        el('DJ1', 'brk3', 7, 6, 0, { s0: 0, to: 0.2, tc: 0 }),
        el('LG1', 'line3', 12, 6, 0, { len: 5, ...cable }),
        el('CH1', 'load3', 16, 10, 0, { P: 3e6, Q: 1e6, Vn: 20e3, f: 50 }, ['va']),
        el('LG2', 'line3', 20, 6, 0, { len: 5, ...cable }),
        el('CH2', 'load3', 24, 10, 0, { P: 3e6, Q: 1e6, Vn: 20e3, f: 50 }, ['va']),
        el('DJ2', 'brk3', 28, 6, 0, { s0: 1, to: 0, tc: 0.4 }),
        el('LG3', 'line3', 33, 6, 0, { len: 5, ...cable }),
        el('GB', 'src3', 38, 6, 180, { Vll: 20e3, f: 50, ph: 0, R: 0.1, L: 4.2e-3 }),
      ],
      wires: [
        w('w1', 'GA.abc', 'DJ1.a'),
        w('w2', 'DJ1.b', 'LG1.a'),
        w('w3', 'LG1.b', 'LG2.a'),
        w('w4', 'CH1.abc', 'LG1.b'),
        w('w5', 'LG2.b', 'DJ2.a'),
        w('w6', 'CH2.abc', 'LG2.b'),
        w('w7', 'DJ2.b', 'LG3.a'),
        w('w8', 'LG3.b', 'GB.abc'),
      ],
    }),
  },
  {
    id: 'mv-neutral',
    name: { fr: 'Neutre HTA et 3I0 (leçon 10.3)', en: 'MV neutral and 3I0 (lesson 10.3)' },
    note: {
      fr: 'Poste source 63/20 kV, neutre HTA relié à la terre par une résistance de 38,5 Ω (300 A). Deux départs en câble : un défaut a–terre sur le premier à 0,1 s. Comparez le 3I0 efficace mesuré par les deux protections, puis remplacez la résistance par une bobine (neutre compensé) ou supprimez-la (neutre isolé).',
      en: '63/20 kV primary substation, MV neutral earthed through a 38.5 Ω resistor (300 A). Two cable feeders: an a–earth fault on the first at 0.1 s. Compare the RMS 3I0 measured by both relays, then replace the resistor with a coil (compensated neutral) or remove it (isolated neutral).',
    },
    doc: () => ({
      version: 1,
      name: 'Neutre HTA',
      T: 0.4,
      elements: [
        el('G1', 'src3', 2, 8, 0, grid63),
        el('TS1', 'trafo3n', 8, 8, 0, ts, ['vN']),
        el('RN', 'R', 14, 14, 90, { R: 38.5 }),
        el('GND1', 'gnd', 14, 18, 0, {}),
        el('P1', 'relay3', 16, 6, 0, { Is: 600, td: 0.4, Is0: 0, td0: 0.3, reclose: 0, tslow: 1, f: 50 }, ['I0rms']),
        el('LG1', 'line3', 22, 6, 0, { len: 20, ...cable }),
        el('CH1', 'load3', 28, 6, 0, { P: 4e6, Q: 1.5e6, Vn: 20e3, f: 50, earth: 0 }),
        el('F1', 'fault3', 25, 3, 0, { type: 1, Rf: 1, ton: 0.1, toff: 10 }, ['ia']),
        el('P2', 'relay3', 16, 11, 0, { Is: 600, td: 0.4, Is0: 0, td0: 0.3, reclose: 0, tslow: 1, f: 50 }, ['I0rms']),
        el('LG2', 'line3', 22, 11, 0, { len: 40, ...cable }),
        el('CH2', 'load3', 28, 11, 0, { P: 4e6, Q: 1.5e6, Vn: 20e3, f: 50, earth: 0 }),
      ],
      wires: [
        w('w1', 'G1.abc', 'TS1.a'),
        w('w2', 'TS1.n', 'RN.a'),
        w('w3', 'RN.b', 'GND1.g'),
        w('w4', 'TS1.b', 'P1.a'),
        w('w5', 'P1.b', 'LG1.a'),
        w('w6', 'LG1.b', 'CH1.abc'),
        w('w7', 'F1.a', 'LG1.b'),
        w('w8', 'TS1.b', 'P2.a'),
        w('w9', 'P2.b', 'LG2.a'),
        w('w10', 'LG2.b', 'CH2.abc'),
      ],
    }),
  },
  {
    id: 'mv-protection',
    name: { fr: 'Protection d’un départ HTA (leçon 10.4)', en: 'Protecting an MV feeder (lesson 10.4)' },
    note: {
      fr: 'Arrivée du transformateur (P0, 0,7 s) et départ aérien de 20 km (P1). Un défaut biphasé en bout de départ à 0,2 s, fugitif : il disparaît à 0,8 s. Le départ déclenche, le réenclenchement rapide le referme après 0,3 s, et les clients sont réalimentés. Rendez le défaut permanent pour voir le verrouillage.',
      en: 'Transformer incomer (P0, 0.7 s) and a 20 km overhead feeder (P1). A phase-to-phase fault at the end of the feeder at 0.2 s, transient: it goes away at 0.8 s. The feeder trips, rapid reclosing closes it after 0.3 s, and customers are restored. Make the fault permanent to see the lockout.',
    },
    doc: () => ({
      version: 1,
      name: 'Protection HTA',
      T: 2,
      elements: [
        el('G1', 'src3', 2, 8, 0, grid63),
        el('TS1', 'trafo3n', 8, 8, 0, ts),
        el('RN', 'R', 14, 14, 90, { R: 38.5 }),
        el('GND1', 'gnd', 14, 18, 0, {}),
        el('P0', 'relay3', 14, 8, 0, { Is: 800, td: 0.7, Is0: 0, td0: 0.7, reclose: 0, tslow: 1, f: 50 }, ['etat']),
        el('P1', 'relay3', 20, 8, 0, { Is: 400, td: 0.4, Is0: 0, td0: 0.4, reclose: 1, tslow: 1, f: 50 }, ['Irms', 'etat']),
        el('LG1', 'line3', 26, 8, 0, { len: 20, ...overhead }),
        el('CH1', 'load3', 32, 8, 0, { P: 5e6, Q: 2e6, Vn: 20e3, f: 50, earth: 0 }),
        el('F1', 'fault3', 29, 5, 0, { type: 2, Rf: 0.5, ton: 0.2, toff: 0.8 }),
      ],
      wires: [
        w('w1', 'G1.abc', 'TS1.a'),
        w('w2', 'TS1.n', 'RN.a'),
        w('w3', 'RN.b', 'GND1.g'),
        w('w4', 'TS1.b', 'P0.a'),
        w('w5', 'P0.b', 'P1.a'),
        w('w6', 'P1.b', 'LG1.a'),
        w('w7', 'LG1.b', 'CH1.abc'),
        w('w8', 'F1.a', 'LG1.b'),
      ],
    }),
  },
];
