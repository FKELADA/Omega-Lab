// Templates of phase A5: control blocks and inverter-based resources,
// mirroring lessons 3.4, 7.1–7.6, 8.4 and 8.5.

import type { BenchEl, Wire } from './doc';
import type { TemplateA } from './templates-a3';

const el = (id: string, type: string, x: number, y: number, rot: BenchEl['rot'], params: Record<string, number>, scope: string[] = []): BenchEl => ({ id, type, x, y, rot, params, scope });
const w = (id: string, a: string, b: string): Wire => {
  const [ae, ap] = a.split('.'), [be, bp] = b.split('.');
  return { id, a: { el: ae, port: ap }, b: { el: be, port: bp } };
};
const weakGrid = (SCR: number, Sn: number, Vn: number) => {
  const Z = (Vn * Vn) / (SCR * Sn);
  return { R: Z / 20, L: Z / (2 * Math.PI * 50) };
};

export const TEMPLATES_A5: TemplateA[] = [
  {
    id: 'control-pi',
    name: { fr: 'Boucle de régulation PI (blocs)', en: 'PI control loop (blocks)' },
    note: {
      fr: 'Consigne, comparateur, régulateur PI, source commandée, circuit RC et capteur : la tension du condensateur rejoint la consigne sans erreur statique. Changez $K_p$ et $K_i$.',
      en: 'Setpoint, summing junction, PI controller, controlled source, RC circuit and sensor: the capacitor voltage reaches the setpoint with no steady-state error. Change $K_p$ and $K_i$.',
    },
    doc: () => ({
      version: 1,
      name: 'Régulation PI',
      T: 0.1,
      elements: [
        el('ECH1', 'kstep', 4, 4, 0, { y0: 0, y1: 5, t0: 0.01 }, ['y']),
        el('SUM1', 'ksum', 10, 4, 0, { sb: -1 }),
        el('PI1', 'kpi', 16, 4, 0, { Kp: 0.5, Ki: 200, ymin: 0, ymax: 20 }, ['y']),
        el('SV1', 'vctrl', 22, 4, 0, { K: 1 }),
        el('R1', 'R', 28, 3, 0, { R: 10 }),
        el('C1', 'C', 32, 5, 90, { C: 1e-4 }),
        el('CV1', 'vsens', 36, 5, 0, { K: 1 }, ['y']),
        el('GND1', 'gnd', 24, 9, 0, {}),
      ],
      wires: [
        w('w1', 'ECH1.y', 'SUM1.a'),
        w('w2', 'SUM1.y', 'PI1.u'),
        w('w3', 'PI1.y', 'SV1.u'),
        w('w4', 'SV1.a', 'R1.a'),
        w('w5', 'R1.b', 'C1.a'),
        w('w6', 'C1.b', 'GND1.g'),
        w('w7', 'SV1.b', 'GND1.g'),
        w('w8', 'C1.a', 'CV1.a'),
        w('w9', 'C1.b', 'CV1.b'),
        w('w10', 'CV1.y', 'SUM1.b'),
      ],
    }),
  },
  {
    id: 'gfl-weak',
    name: { fr: 'Onduleur suiveur sur réseau faible (leçons 7.1, 8.5)', en: 'Grid-following inverter on a weak grid (lessons 7.1, 8.5)' },
    note: {
      fr: 'Réseau de puissance de court-circuit 1,5 fois la puissance de l’onduleur. Avec une PLL à 20 Hz, l’onduleur injecte 0,8 pu ; montez la PLL au-delà de 100 Hz : il devient instable.',
      en: 'Grid short-circuit power 1.5 times the inverter rating. With a 20 Hz PLL the inverter injects 0.8 pu; raise the PLL beyond 100 Hz: it becomes unstable.',
    },
    doc: () => ({
      version: 1,
      name: 'GFL sur réseau faible',
      T: 1.5,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 400, f: 50, ph: 0, ...weakGrid(1.5, 100e3, 400) }),
        el('GFL1', 'gfl', 12, 8, 180, { Sn: 100e3, Vn: 400, f: 50, Pset: 0.8, Qset: 0, Tr: 0.1, fpll: 20, fc: 300, lf: 0.15, Imax: 1.1 }, ['P', 'Q']),
      ],
      wires: [w('w1', 'G1.abc', 'GFL1.abc')],
    }),
  },
  {
    id: 'gfm-gfl',
    name: { fr: 'Formeur contre suiveur (leçon 7.2)', en: 'Grid-forming versus grid-following (lesson 7.2)' },
    note: {
      fr: 'À 0,5 s, la phase du réseau saute de −20° : l’onduleur formeur réagit aussitôt (il se comporte comme une machine), le suiveur à peine.',
      en: 'At 0.5 s the grid phase jumps by −20°: the grid-forming inverter reacts at once (it behaves like a machine), the grid-following one hardly at all.',
    },
    doc: () => ({
      version: 1,
      name: 'GFM et GFL',
      T: 1.2,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 400, f: 50, ph: 0, ...weakGrid(5, 200e3, 400), tJ: 0.5, dJ: -20 }),
        el('GFL1', 'gfl', 12, 6, 180, { Sn: 100e3, Vn: 400, f: 50, Pset: 0.5, Qset: 0, Tr: 0.1, fpll: 20, fc: 300, lf: 0.15, Imax: 1.5 }, ['P']),
        el('GFM1', 'gfm', 12, 10, 180, { Sn: 100e3, Vn: 400, f: 50, Pset: 0.5, Qset: 0, H: 2, R: 0.05, kq: 0.05, lf: 0.15 }, ['P']),
      ],
      wires: [w('w1', 'G1.abc', 'GFL1.abc'), w('w2', 'G1.abc', 'GFM1.abc')],
    }),
  },
  {
    id: 'bess-ffr',
    name: { fr: 'Batterie et chute de fréquence (leçons 7.5, 8.4)', en: 'Battery and frequency dip (lessons 7.5, 8.4)' },
    note: {
      fr: 'Réseau isolé d’un alternateur de 10 MVA ; à 2 s, une charge de 1,5 MW s’ajoute. La batterie limite la chute de fréquence ; passez-la en FFR, ou réduisez son statisme.',
      en: 'Island fed by a 10 MVA generator; at 2 s, a 1.5 MW load is added. The battery limits the frequency dip; switch it to FFR, or reduce its droop.',
    },
    doc: () => ({
      version: 1,
      name: 'Batterie et fréquence',
      T: 8,
      elements: [
        el('SM1', 'sm3', 4, 8, 0, { Sn: 10e6, Vn: 20e3, f: 50, P0: 0.6, E0: 1.05, H: 3, D: 0, xd: 0.3, ra: 0.003, KA: 50, Vref: 1, R: 0.05, tRel: 0.5 }, ['f']),
        el('CH1', 'load3', 12, 8, 0, { P: 6e6, Q: 1e6, Vn: 20e3, f: 50 }),
        el('DJ1', 'brk3', 12, 12, 0, { s0: 1, to: 0, tc: 2 }),
        el('CH2', 'load3', 18, 12, 0, { P: 1.5e6, Q: 0, Vn: 20e3, f: 50 }),
        el('BAT1', 'bess', 12, 4, 180, { Sn: 2e6, Vn: 20e3, f: 50, E: 1e6, soc0: 0.6, R: 0.01, ffr: 0, fthr: 49.8, fpll: 10, fc: 300, lf: 0.15, Imax: 1.1 }, ['P']),
      ],
      wires: [w('w1', 'SM1.a', 'CH1.abc'), w('w2', 'SM1.a', 'DJ1.a'), w('w3', 'DJ1.b', 'CH2.abc'), w('w4', 'SM1.a', 'BAT1.abc')],
    }),
  },
  {
    id: 'pv-mppt',
    name: { fr: 'Centrale photovoltaïque et nuage (leçon 7.3)', en: 'PV plant and cloud (lesson 7.3)' },
    note: { fr: 'À 1 s, l’ensoleillement passe de 1000 à 400 W/m² : la MPPT retrouve le nouveau maximum. Comparez $P$ et $P_{mpp}$, et changez le pas de la MPPT.', en: 'At 1 s irradiance falls from 1000 to 400 W/m²: the MPPT finds the new maximum. Compare $P$ and $P_{mpp}$, and change the MPPT step.' },
    doc: () => ({
      version: 1,
      name: 'PV et MPPT',
      T: 2.5,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 400, f: 50, ph: 0, ...weakGrid(10, 100e3, 400) }),
        el('PV1', 'pv', 12, 8, 180, { Sn: 100e3, Vn: 400, f: 50, G1: 1000, G2: 400, tG: 1, T: 25, dv: 0.01, tm: 0.02, fpll: 20, fc: 300, lf: 0.15, Imax: 1.1 }, ['P', 'Pmpp']),
      ],
      wires: [w('w1', 'G1.abc', 'PV1.abc')],
    }),
  },
  {
    id: 'wind',
    name: { fr: 'Éolienne et rafale (leçon 7.4)', en: 'Wind turbine and gust (lesson 7.4)' },
    note: { fr: 'Vent de 9 m/s et rafale de +3 m/s pendant 4 s : la puissance suit le cube du vent, lissée par l’inertie du rotor. Montez le vent au-dessus de 12 m/s : le calage limite la puissance.', en: '9 m/s wind and a +3 m/s gust for 4 s: power follows the cube of the wind, smoothed by rotor inertia. Raise the wind above 12 m/s: pitch limits the power.' },
    doc: () => ({
      version: 1,
      name: 'Éolienne',
      T: 8,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 20e3, f: 50, ph: 0, ...weakGrid(10, 2e6, 20e3) }),
        el('EOL1', 'wind', 12, 8, 180, { Sn: 2e6, Vn: 20e3, f: 50, v: 9, dv: 3, tg: 1, Tg: 4, H: 4, fpll: 20, fc: 300, lf: 0.15, Imax: 1.1 }, ['P', 'w']),
      ],
      wires: [w('w1', 'G1.abc', 'EOL1.abc')],
    }),
  },
  {
    id: 'hvdc',
    name: { fr: 'Liaison CCHT à MMC (leçon 7.6)', en: 'MMC HVDC link (lesson 7.6)' },
    note: {
      fr: 'Deux réseaux reliés par un câble continu ±200 kV : MMC1 tient la tension continue, MMC2 transporte 0,8 pu. Changez la consigne de MMC2 et observez la tension continue.',
      en: 'Two grids linked by a ±200 kV DC cable: MMC1 holds the DC voltage, MMC2 carries 0.8 pu. Change MMC2’s setpoint and watch the DC voltage.',
    },
    doc: () => ({
      version: 1,
      name: 'Liaison CCHT',
      T: 1.5,
      elements: [
        el('G1', 'src3', 4, 8, 0, { Vll: 220e3, f: 50, ph: 0, ...weakGrid(10, 500e6, 220e3) }),
        el('MMC1', 'mmc', 10, 8, 180, { Sn: 500e6, Vn: 220e3, f: 50, Vdc: 400e3, mode: 1, Pset: 0, Qset: 0, Wc: 30, fv: 10, fpll: 20, fc: 200, lf: 0.15, Imax: 1.1 }, ['P', 'Vdc']),
        el('R1', 'R', 16, 7, 0, { R: 2 }),
        el('L1', 'L', 22, 7, 0, { L: 0.02 }),
        el('R2', 'R', 16, 9, 0, { R: 2 }),
        el('L2', 'L', 22, 9, 0, { L: 0.02 }),
        el('MMC2', 'mmc', 28, 8, 0, { Sn: 500e6, Vn: 220e3, f: 50, Vdc: 400e3, mode: 0, Pset: 0.8, Qset: 0, Wc: 30, fv: 10, fpll: 20, fc: 200, lf: 0.15, Imax: 1.1 }, ['P']),
        el('G2', 'src3', 34, 8, 180, { Vll: 220e3, f: 50, ph: 0, ...weakGrid(10, 500e6, 220e3) }),
        el('GND1', 'gnd', 14, 11, 0, {}),
      ],
      wires: [
        w('w1', 'G1.abc', 'MMC1.abc'),
        w('w2', 'MMC1.p', 'R1.a'),
        w('w3', 'R1.b', 'L1.a'),
        w('w4', 'L1.b', 'MMC2.p'),
        w('w5', 'MMC1.n', 'R2.a'),
        w('w6', 'R2.b', 'L2.a'),
        w('w7', 'L2.b', 'MMC2.n'),
        w('w8', 'MMC2.abc', 'G2.abc'),
        w('w9', 'MMC1.n', 'GND1.g'),
      ],
    }),
  },
];
