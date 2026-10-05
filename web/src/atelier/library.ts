// The Atelier's component library. Each element declares its symbol, ports,
// parameters, how it is built for the EMT solver, and its formulas. Adding a
// component means adding an entry here.

import type { EmtElement } from './engine/emt';
import type { AcModel } from './engine/ac';
import { cx, polar } from '../lib/core/linalg';
import { ammeter, capacitor, inductor, isource, resistor, timedSwitch, voltmeter, vsource, waves } from './engine/elements';
import type { EqContext } from '../lib/lab/types';
import type { L } from '../lib/ui/ui.svelte';

/** Grid pitch, in canvas pixels. */
export const GRID = 20;

export interface PortDef {
  id: string;
  /** Position relative to the element centre, in grid units, before rotation. */
  dx: number;
  dy: number;
}

export interface ElParam {
  id: string;
  symbol: string; // KaTeX
  name: L;
  unit: string;
  default: number;
  min: number;
  max: number;
  scale: 'lin' | 'log';
}

export interface ElFormula {
  title: L;
  tex: (c: EqContext, id: string) => string;
  note?: (c: EqContext, id: string) => string | null;
  personas?: ('learner' | 'research' | 'utility')[];
}

export type Family = 'sources' | 'passives' | 'switches' | 'instruments';

export interface ElementDef {
  type: string;
  family: Family;
  name: L;
  /** Prefix of automatic names: R1, L2… */
  prefix: string;
  ports: PortDef[];
  params: ElParam[];
  /** SVG path(s) in local pixels, drawn horizontally, ports at x = ±40. */
  symbol: string;
  /** Short text drawn inside the symbol (meters). */
  glyph?: string;
  /** Drawn with a round body (sources, meters). */
  circle?: boolean;
  /** How it enters the frequency-domain (AC) equations. */
  ac: AcModel;
  /** Value shown next to the symbol. */
  label?: (p: Record<string, number>) => string;
  /** Signals offered to the oscilloscope. */
  signals: ('v' | 'i' | 'p')[];
  /** Shown on the oscilloscope by default. */
  scopeDefault?: ('v' | 'i' | 'p')[];
  /** Ground: its port is the reference node. */
  ground?: boolean;
  /** The element for the solver; nodes are in port order. */
  build?: (id: string, nodes: number[], p: Record<string, number>, h: number) => EmtElement;
  /** Shortest time scale it imposes (for the automatic step), if any. */
  timeScale?: (p: Record<string, number>) => number | null;
  formulas: ElFormula[];
}

const two: PortDef[] = [
  { id: 'a', dx: -2, dy: 0 },
  { id: 'b', dx: 2, dy: 0 },
];

/** Engineering notation with SI prefix, for labels. */
export function si(v: number, unit: string, digits = 3): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return `0 ${unit}`;
  const pre = ['p', 'n', 'µ', 'm', '', 'k', 'M', 'G'];
  let e = Math.floor(Math.log10(Math.abs(v)) / 3);
  e = Math.max(-4, Math.min(3, e));
  const m = v / 10 ** (3 * e);
  return `${+m.toPrecision(digits)} ${pre[e + 4]}${unit}`.replace('.', ',');
}

const lead = 'M-40,0 H-24 M24,0 H40';

export const LIBRARY: ElementDef[] = [
  // ── Sources ──
  {
    type: 'vdc', family: 'sources', prefix: 'V',
    name: { fr: 'Source de tension continue', en: 'DC voltage source' },
    ports: two,
    params: [{ id: 'V', symbol: 'V', name: { fr: 'Tension', en: 'Voltage' }, unit: 'V', default: 10, min: -1000, max: 1000, scale: 'lin' }],
    symbol: 'M-40,0 H-14 M14,0 H40 M-10,0 h6 M-7,-3 v6 M4,0 h6',
    label: (p) => si(p.V, 'V'),
    circle: true,
    ac: { kind: 'V', phasor: (p, f) => (f === 0 ? cx(p.V) : null) },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p) => vsource(id, a, b, waves.dc(p.V)),
    formulas: [
      {
        title: { fr: 'Source de tension idéale', en: 'Ideal voltage source' },
        tex: (c, id) => `v = V = ${c.q(c.p[`${id}.V`], 'V')}, \\qquad i_{\\text{débité}} = ${c.q(c.at(`${id}.i`), 'A')}`,
        note: (c) => c.tr({ fr: 'Elle impose sa tension quel que soit le courant. Le courant est celui qu’elle débite par sa borne +.', en: 'It sets its voltage whatever the current. The current is the one it delivers out of its + terminal.' }),
      },
    ],
  },
  {
    type: 'vac', family: 'sources', prefix: 'V',
    name: { fr: 'Source de tension alternative', en: 'AC voltage source' },
    ports: two,
    params: [
      { id: 'Vpk', symbol: '\\hat V', name: { fr: 'Amplitude (crête)', en: 'Amplitude (peak)' }, unit: 'V', default: 325, min: 0, max: 1000, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 0.1, max: 10000, scale: 'log' },
      { id: 'ph', symbol: '\\varphi', name: { fr: 'Phase', en: 'Phase' }, unit: '°', default: 0, min: -180, max: 180, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-14 M14,0 H40 M-8,0 c2,-7 6,-7 8,0 s6,7 8,0',
    label: (p) => `${si(p.Vpk, 'V')} ${si(p.f, 'Hz')}`,
    circle: true,
    ac: { kind: 'V', phasor: (p, f) => (Math.abs(f - p.f) <= 1e-9 * p.f ? polar(p.Vpk, (p.ph * Math.PI) / 180) : null) },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p) => vsource(id, a, b, waves.ac(p.Vpk, p.f, p.ph)),
    timeScale: (p) => 1 / p.f,
    formulas: [
      {
        title: { fr: 'Source sinusoïdale', en: 'Sinusoidal source' },
        tex: (c, id) => `v(t) = \\hat V\\cos(2\\pi f t + \\varphi) = ${c.q(c.p[`${id}.Vpk`], 'V')}\\cos(2\\pi\\cdot${c.q(c.p[`${id}.f`], 'Hz')}\\,t), \\qquad V_{\\text{eff}} = \\frac{\\hat V}{\\sqrt2} = ${c.q(c.p[`${id}.Vpk`] / Math.SQRT2, 'V')}`,
      },
    ],
  },
  {
    type: 'vstep', family: 'sources', prefix: 'V',
    name: { fr: 'Échelon de tension', en: 'Voltage step' },
    ports: two,
    params: [
      { id: 'V', symbol: 'V', name: { fr: 'Hauteur', en: 'Height' }, unit: 'V', default: 10, min: -1000, max: 1000, scale: 'lin' },
      { id: 't0', symbol: 't_0', name: { fr: 'Instant', en: 'Instant' }, unit: 's', default: 0, min: 0, max: 10, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-14 M14,0 H40 M-7,5 H0 V-5 H7',
    label: (p) => si(p.V, 'V'),
    circle: true,
    ac: { kind: 'V', phasor: () => null },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p) => vsource(id, a, b, waves.step(p.V, p.t0)),
    formulas: [
      {
        title: { fr: 'Échelon', en: 'Step' },
        tex: (c, id) => `v(t) = V\\,\\mathbb{1}(t \\ge t_0), \\quad V = ${c.q(c.p[`${id}.V`], 'V')},\\ t_0 = ${c.q(c.p[`${id}.t0`], 's')}`,
      },
    ],
  },
  {
    type: 'vsquare', family: 'sources', prefix: 'V',
    name: { fr: 'Source carrée', en: 'Square-wave source' },
    ports: two,
    params: [
      { id: 'V', symbol: 'V', name: { fr: 'Amplitude', en: 'Amplitude' }, unit: 'V', default: 10, min: 0, max: 1000, scale: 'lin' },
      { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', default: 50, min: 0.1, max: 100000, scale: 'log' },
    ],
    symbol: 'M-40,0 H-14 M14,0 H40 M-8,4 h4 v-8 h8 v8 h4',
    label: (p) => `±${si(p.V, 'V')} ${si(p.f, 'Hz')}`,
    circle: true,
    ac: {
      kind: 'V',
      // Odd harmonics 4V/(nπ), in sine phase.
      phasor: (p, f) => {
        const n = Math.round(f / p.f);
        return n % 2 === 1 && Math.abs(f - n * p.f) <= 1e-9 * f ? polar((4 * p.V) / (n * Math.PI), -Math.PI / 2) : null;
      },
    },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p) => vsource(id, a, b, waves.square(p.V, p.f)),
    timeScale: (p) => 1 / p.f,
    formulas: [
      {
        title: { fr: 'Onde carrée', en: 'Square wave' },
        tex: (c, id) => `v(t) = \\frac{4V}{\\pi}\\sum_{n\\ \\text{impair}}\\frac{\\sin(2\\pi n f t)}{n}, \\quad V = ${c.q(c.p[`${id}.V`], 'V')}`,
        note: (c) => c.tr({ fr: 'Riche en harmoniques impairs (leçon 2.7).', en: 'Rich in odd harmonics (lesson 2.7).' }),
      },
    ],
  },
  {
    type: 'idc', family: 'sources', prefix: 'I',
    name: { fr: 'Source de courant continu', en: 'DC current source' },
    ports: two,
    params: [{ id: 'I', symbol: 'I', name: { fr: 'Courant', en: 'Current' }, unit: 'A', default: 1, min: -1000, max: 1000, scale: 'lin' }],
    symbol: 'M-40,0 H-14 M14,0 H40 M8,0 H-8 M-8,0 l5,-4 M-8,0 l5,4',
    label: (p) => si(p.I, 'A'),
    circle: true,
    ac: { kind: 'I', phasor: (p, f) => (f === 0 ? cx(p.I) : null) },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p) => isource(id, a, b, waves.dc(p.I)),
    formulas: [
      {
        title: { fr: 'Source de courant idéale', en: 'Ideal current source' },
        tex: (c, id) => `i = I = ${c.q(c.p[`${id}.I`], 'A')}, \\qquad v = ${c.q(c.at(`${id}.v`), 'V')}`,
        note: (c) => c.tr({ fr: 'Elle impose son courant quelle que soit la tension : il lui faut toujours un chemin pour le faire circuler.', en: 'It sets its current whatever the voltage: it always needs a path for it to flow.' }),
      },
    ],
  },

  // ── Passives ──
  {
    type: 'R', family: 'passives', prefix: 'R',
    name: { fr: 'Résistance', en: 'Resistor' },
    ports: two,
    params: [{ id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', default: 10, min: 1e-3, max: 1e6, scale: 'log' }],
    symbol: `${lead} M-24,0 L-20,-8 L-12,8 L-4,-8 L4,8 L12,-8 L20,8 L24,0`,
    label: (p) => si(p.R, 'Ω'),
    ac: { kind: 'Y', y: (p) => cx(1 / Math.max(p.R, 1e-9)) },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p) => resistor(id, a, b, p.R),
    formulas: [
      {
        title: { fr: 'Loi d’Ohm', en: 'Ohm’s law' },
        tex: (c, id) => `v = R\\,i \\quad\\Rightarrow\\quad ${c.q(c.at(`${id}.v`), 'V')} = ${c.q(c.p[`${id}.R`], 'Ω')} \\times ${c.q(c.at(`${id}.i`), 'A')}`,
      },
      {
        title: { fr: 'Puissance dissipée', en: 'Power dissipated' },
        tex: (c, id) => `p = R\\,i^2 = ${c.q(c.p[`${id}.R`] * c.at(`${id}.i`) ** 2, 'W')} \\ \\ge 0`,
        note: (c) => c.tr({ fr: 'Toujours positive : la résistance ne rend jamais d’énergie (leçon 1.1).', en: 'Always positive: a resistor never gives energy back (lesson 1.1).' }),
      },
      {
        title: { fr: 'Modèle numérique', en: 'Numerical model' },
        personas: ['research'],
        tex: (c, id) => `i_n = G\\,v_n, \\qquad G = \\frac1R = ${c.q(1 / c.p[`${id}.R`], 'S')}`,
      },
    ],
  },
  {
    type: 'L', family: 'passives', prefix: 'L',
    name: { fr: 'Bobine', en: 'Inductor' },
    ports: two,
    params: [{ id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'H', default: 0.01, min: 1e-6, max: 10, scale: 'log' }],
    symbol: `${lead} M-24,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0 a6,6 0 0 1 12,0`,
    label: (p) => si(p.L, 'H'),
    ac: { kind: 'Y', y: (p, w) => ({ re: 0, im: -1 / (Math.max(w, 1e-9) * p.L) }) },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p, h) => inductor(id, a, b, p.L, h),
    formulas: [
      {
        title: { fr: 'Loi de la bobine', en: 'Inductor law' },
        tex: (c, id) => `v = L\\frac{di}{dt}, \\qquad v = ${c.q(c.at(`${id}.v`), 'V')},\\ i = ${c.q(c.at(`${id}.i`), 'A')}`,
        note: (c) => c.tr({ fr: 'Son courant ne peut pas sauter : il faudrait une tension infinie.', en: 'Its current cannot jump: that would take an infinite voltage.' }),
      },
      {
        title: { fr: 'Énergie stockée', en: 'Stored energy' },
        tex: (c, id) => `W_L = \\tfrac12 L i^2 = ${c.q(0.5 * c.p[`${id}.L`] * c.at(`${id}.i`) ** 2, 'J')}`,
      },
      {
        title: { fr: 'Modèle numérique (trapèzes)', en: 'Numerical model (trapezoidal)' },
        personas: ['research'],
        tex: () => `i_n = \\frac{h}{2L}\\,v_n + \\underbrace{i_{n-1} + \\frac{h}{2L}\\,v_{n-1}}_{I_{\\text{hist}}}`,
        note: (c) => c.tr({ fr: 'Le simulateur remplace la bobine par une conductance $h/2L$ en parallèle avec une source de courant qui garde la mémoire du pas précédent (modèle de Dommel, utilisé par EMTP).', en: 'The simulator replaces the inductor by a conductance $h/2L$ in parallel with a current source holding the memory of the previous step (Dommel’s model, used by EMTP).' }),
      },
    ],
  },
  {
    type: 'C', family: 'passives', prefix: 'C',
    name: { fr: 'Condensateur', en: 'Capacitor' },
    ports: two,
    params: [{ id: 'C', symbol: 'C', name: { fr: 'Capacité', en: 'Capacitance' }, unit: 'F', default: 1e-4, min: 1e-9, max: 1, scale: 'log' }],
    symbol: 'M-40,0 H-5 M-5,-12 V12 M5,-12 V12 M5,0 H40',
    label: (p) => si(p.C, 'F'),
    ac: { kind: 'Y', y: (p, w) => ({ re: 0, im: w * p.C }) },
    signals: ['v', 'i', 'p'],
    build: (id, [a, b], p, h) => capacitor(id, a, b, p.C, h),
    formulas: [
      {
        title: { fr: 'Loi du condensateur', en: 'Capacitor law' },
        tex: (c, id) => `i = C\\frac{dv}{dt}, \\qquad v = ${c.q(c.at(`${id}.v`), 'V')},\\ i = ${c.q(c.at(`${id}.i`), 'A')}`,
        note: (c) => c.tr({ fr: 'Sa tension ne peut pas sauter : il faudrait un courant infini.', en: 'Its voltage cannot jump: that would take an infinite current.' }),
      },
      {
        title: { fr: 'Énergie stockée', en: 'Stored energy' },
        tex: (c, id) => `W_C = \\tfrac12 C v^2 = ${c.q(0.5 * c.p[`${id}.C`] * c.at(`${id}.v`) ** 2, 'J')}`,
      },
      {
        title: { fr: 'Modèle numérique (trapèzes)', en: 'Numerical model (trapezoidal)' },
        personas: ['research'],
        tex: () => `i_n = \\frac{2C}{h}\\,v_n - \\underbrace{\\Big(\\frac{2C}{h}\\,v_{n-1} + i_{n-1}\\Big)}_{-I_{\\text{hist}}}`,
      },
    ],
  },
  {
    type: 'gnd', family: 'passives', prefix: 'GND',
    name: { fr: 'Masse', en: 'Ground' },
    ports: [{ id: 'g', dx: 0, dy: -1 }],
    params: [],
    symbol: 'M0,-20 V0 M-12,0 H12 M-8,5 H8 M-4,10 H4',
    ac: { kind: 'none' },
    signals: [],
    ground: true,
    formulas: [
      {
        title: { fr: 'Référence des tensions', en: 'Voltage reference' },
        tex: () => `v_{\\text{masse}} = 0`,
        note: (c) => c.tr({ fr: 'Toutes les tensions de nœud sont mesurées par rapport à elle. Chaque circuit en a besoin d’une.', en: 'Every node voltage is measured against it. Each circuit needs one.' }),
      },
    ],
  },

  // ── Switches ──
  {
    type: 'switch', family: 'switches', prefix: 'S',
    name: { fr: 'Interrupteur temporisé', en: 'Timed switch' },
    ports: two,
    params: [
      { id: 'tc', symbol: 't_{f}', name: { fr: 'Fermeture à', en: 'Closes at' }, unit: 's', default: 0, min: 0, max: 10, scale: 'lin' },
      { id: 'to', symbol: 't_{o}', name: { fr: 'Ouverture à (0 : jamais)', en: 'Opens at (0: never)' }, unit: 's', default: 0, min: 0, max: 10, scale: 'lin' },
    ],
    symbol: 'M-40,0 H-12 M-12,0 L10,-12 M12,0 H40',
    label: (p) => `↓ ${si(p.tc, 's')}${p.to > p.tc ? ` ↑ ${si(p.to, 's')}` : ''}`,
    // In AC, the switch keeps the state it has at the end of the run.
    ac: { kind: 'Y', y: (p) => cx(p.T >= p.tc && (p.to <= p.tc || p.T < p.to) ? 1e3 : 1e-9) },
    signals: ['v', 'i'],
    build: (id, [a, b], p) => timedSwitch(id, a, b, p.tc, p.to),
    formulas: [
      {
        title: { fr: 'Interrupteur', en: 'Switch' },
        tex: (c, id) => `R = \\begin{cases} R_{on} = 1\\ \\text{m}\\Omega & t_f \\le t < t_o \\\\ R_{off} = 1\\ \\text{G}\\Omega & \\text{sinon} \\end{cases}, \\quad t_f = ${c.q(c.p[`${id}.tc`], 's')}`,
        note: (c) => c.tr({ fr: 'À chaque manœuvre, le simulateur refactorise sa matrice. Ouvrir brutalement le courant d’une bobine crée une surtension (leçon 1.1).', en: 'At each operation, the simulator refactorises its matrix. Abruptly opening an inductor’s current creates an overvoltage (lesson 1.1).' }),
      },
    ],
  },

  // ── Instruments ──
  {
    type: 'voltmeter', family: 'instruments', prefix: 'VM',
    name: { fr: 'Voltmètre', en: 'Voltmeter' },
    ports: two,
    params: [],
    symbol: 'M-40,0 H-14 M14,0 H40',
    glyph: 'V',
    circle: true,
    ac: { kind: 'none' },
    signals: ['v'],
    scopeDefault: ['v'],
    build: (id, [a, b]) => voltmeter(id, a, b),
    formulas: [
      {
        title: { fr: 'Voltmètre idéal', en: 'Ideal voltmeter' },
        tex: (c, id) => `v = v_+ - v_- = ${c.q(c.at(`${id}.v`), 'V')}, \\qquad i = 0`,
        note: (c) => c.tr({ fr: 'Impédance infinie : il mesure sans perturber. Sa trace apparaît sur l’oscilloscope.', en: 'Infinite impedance: it measures without disturbing. Its trace appears on the oscilloscope.' }),
      },
    ],
  },
  {
    type: 'ammeter', family: 'instruments', prefix: 'AM',
    name: { fr: 'Ampèremètre', en: 'Ammeter' },
    ports: two,
    params: [],
    symbol: 'M-40,0 H-14 M14,0 H40',
    glyph: 'A',
    circle: true,
    ac: { kind: 'V', phasor: () => cx(0), meter: true },
    signals: ['i'],
    scopeDefault: ['i'],
    build: (id, [a, b]) => ammeter(id, a, b),
    formulas: [
      {
        title: { fr: 'Ampèremètre idéal', en: 'Ideal ammeter' },
        tex: (c, id) => `i = ${c.q(c.at(`${id}.i`), 'A')}, \\qquad v = 0`,
        note: (c) => c.tr({ fr: 'Impédance nulle : il se branche en série, dans le chemin du courant, de + vers −.', en: 'Zero impedance: it goes in series, in the current’s path, from + to −.' }),
      },
    ],
  },
  {
    type: 'zprobe', family: 'instruments', prefix: 'Z',
    name: { fr: 'Sonde d’impédance', en: 'Impedance probe' },
    ports: [{ id: 'a', dx: 0, dy: -1 }],
    params: [],
    symbol: 'M0,-20 V-14',
    glyph: 'Z',
    circle: true,
    ac: { kind: 'I', phasor: () => null },
    signals: ['v'],
    build: (id, [a]) => voltmeter(id, a, 0),
    formulas: [
      {
        title: { fr: 'Impédance vue d’un nœud', en: 'Impedance seen from a node' },
        tex: () => `Z(j\\omega) = \\frac{\\underline V}{\\underline I}\\Big|_{\\text{sources éteintes}}`,
        note: (c) => c.tr({ fr: 'Posée sur un nœud, elle injecte un courant de 1 A à chaque fréquence (sources éteintes : tensions court-circuitées, courants ouverts) et mesure la tension. Ses pics sont les résonances parallèles, ses creux les résonances série. Voir l’onglet Impédance.', en: 'Placed on a node, it injects 1 A at each frequency (sources off: voltages shorted, currents opened) and measures the voltage. Its peaks are parallel resonances, its dips series resonances. See the Impedance tab.' }),
      },
    ],
  },
];

export const DEFS: Record<string, ElementDef> = Object.fromEntries(LIBRARY.map((d) => [d.type, d]));

export const FAMILIES: { id: Family; name: L }[] = [
  { id: 'sources', name: { fr: 'Sources', en: 'Sources' } },
  { id: 'passives', name: { fr: 'Éléments passifs', en: 'Passive elements' } },
  { id: 'switches', name: { fr: 'Interrupteurs', en: 'Switches' } },
  { id: 'instruments', name: { fr: 'Instruments', en: 'Instruments' } },
];

export const signalIds = (id: string, def: ElementDef) => def.signals.map((s) => `${id}.${s}`);
