// Module 1.4 — Resonance: the series RLC circuit driven by a sinusoidal source.

import RlcSchematic from '../../lib/canvas/RlcSchematic.svelte';
import Bode from '../../lib/instruments/Bode.svelte';
import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import { cabs, carg, cdiv, cmul, cx } from '../../lib/core/linalg';
import type { Experiment } from '../../lib/lab/types';
import { rlcAc, rlcAcInfo, type RlcAcInfo } from '../../lib/models/rlcAc';
import type { Params } from '../../lib/models/types';

const Zof = ({ R, L, C }: Params, f: number) => {
  const w = 2 * Math.PI * f;
  return cx(R, w * L - 1 / (w * C));
};
const deg = (rad: number) => (rad * 180) / Math.PI;

export const resonance: Experiment = {
  id: 'resonance',
  path: [
    { fr: 'Module 1 · Circuits', en: 'Module 1 · Circuits' },
    { fr: '1.4 Résonance', en: '1.4 Resonance' },
  ],
  title: { fr: 'Le circuit RLC série en régime sinusoïdal', en: 'The series RLC circuit under AC' },
  model: rlcAc,
  info: rlcAcInfo,
  source: 'ac',
  canvas: RlcSchematic,
  instruments: [Bode, PhasorDiagram],
  locusParam: 'R',

  params: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence de la source', en: 'Source frequency' }, unit: 'Hz', min: 10, max: 2000, default: 100, scale: 'log', term: 'S' },
    { id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', min: 0.2, max: 200, default: 5, scale: 'log', term: 'R' },
    { id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'H', min: 1e-3, max: 0.1, default: 10e-3, scale: 'log', term: 'L' },
    { id: 'C', symbol: 'C', name: { fr: 'Capacité', en: 'Capacitance' }, unit: 'F', min: 1e-6, max: 1e-3, default: 100e-6, scale: 'log', term: 'C' },
    { id: 'V', symbol: '\\hat V', name: { fr: 'Amplitude', en: 'Amplitude' }, unit: 'V', min: 1, max: 50, default: 10, scale: 'lin', term: 'S' },
  ],

  signals: [
    { id: 'i', symbol: 'i', name: { fr: 'Courant', en: 'Current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'iss', symbol: 'i_{\\infty}', name: { fr: 'Courant établi (phaseur)', en: 'Steady-state current (phasor)' }, unit: 'A', color: '--c-i', on: true, term: 'i', dash: true },
    { id: 'vS', symbol: 'v_S', name: { fr: 'Source', en: 'Source' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'vC', symbol: 'v_C', name: { fr: 'Tension condensateur', en: 'Capacitor voltage' }, unit: 'V', color: '--c-C', on: false, term: 'C' },
    { id: 'vL', symbol: 'v_L', name: { fr: 'Tension bobine', en: 'Inductor voltage' }, unit: 'V', color: '--c-L', on: false, term: 'L' },
    { id: 'vR', symbol: 'v_R', name: { fr: 'Tension résistance', en: 'Resistor voltage' }, unit: 'V', color: '--c-R', on: false, term: 'R' },
  ],

  bode: {
    param: 'f',
    range: [10, 2000],
    curves: [
      { id: 'I', label: '|I|', term: 'i', color: '--c-i', unit: 'A', H: (p, f) => cdiv(cx(p.V), Zof(p, f)) },
      {
        id: 'VC',
        label: '|V_C|',
        term: 'C',
        color: '--c-C',
        unit: 'V',
        H: (p, f) => cmul(cx(0, -1 / (2 * Math.PI * f * p.C)), cdiv(cx(p.V), Zof(p, f))),
      },
    ],
    marks: (p) => [{ f: rlcAcInfo(p).f0, label: 'f₀' }],
    band: (p) => {
      const k = rlcAcInfo(p);
      return k.zeta < 1 ? [k.f1, k.f2] : null;
    },
  },

  phasors: {
    omega: (p) => 2 * Math.PI * p.f,
    unit: 'V',
    items: (p, k: RlcAcInfo) => [
      { id: 'VR', label: 'V_R', term: 'R', color: '--c-R', value: k.VR },
      { id: 'VL', label: 'V_L', term: 'L', color: '--c-L', value: k.VL, after: 'VR' },
      { id: 'VC', label: 'V_C', term: 'C', color: '--c-C', value: k.VC, after: 'VL' },
      { id: 'VS', label: 'V_S', term: 'S', color: '--c-S', value: cx(p.V), thin: true },
    ],
  },

  equations: [
    {
      id: 'impedance',
      title: { fr: 'Impédance', en: 'Impedance' },
      tex: (c) => {
        const k = c.k as RlcAcInfo;
        const X = k.Z.im;
        return `\\begin{aligned}
          \\underline Z &= ${c.term('R', 'R')} + j\\Big(${c.term('L', '\\omega L')} - ${c.term('C', '\\frac{1}{\\omega C}')}\\Big) \\\\
          &= ${c.term('R', c.q(c.p.R, 'Ω'))} + j\\big(${c.term('L', c.q(k.omega * c.p.L, 'Ω'))} - ${c.term('C', c.q(1 / (k.omega * c.p.C), 'Ω'))}\\big) \\\\
          |\\underline Z| &= ${c.q(cabs(k.Z), 'Ω')}, \\quad \\varphi = ${c.q(deg(carg(k.Z)), '°', 3)}
        \\end{aligned}`;
      },
      note: (c) => {
        const k = c.k as RlcAcInfo;
        const r = k.Z.im / c.p.R;
        return c.tr(
          Math.abs(r) < 0.02
            ? { fr: '**Résonance** : les réactances s’annulent, $\\underline Z = R$, et le courant est en phase avec la source.', en: '**Resonance**: the reactances cancel, $\\underline Z = R$, and the current is in phase with the source.' }
            : r < 0
              ? { fr: 'Circuit **capacitif** ($f < f_0$) : le courant est **en avance** sur la tension.', en: '**Capacitive** circuit ($f < f_0$): the current **leads** the voltage.' }
              : { fr: 'Circuit **inductif** ($f > f_0$) : le courant est **en retard** sur la tension.', en: '**Inductive** circuit ($f > f_0$): the current **lags** the voltage.' },
        );
      },
    },
    {
      id: 'phasor-kvl',
      title: { fr: 'Loi des mailles en phaseurs', en: 'KVL with phasors' },
      tex: (c) => {
        const k = c.k as RlcAcInfo;
        return `\\begin{aligned}
          ${c.term('S', '\\underline V_S')} &= ${c.term('R', '\\underline V_R')} + ${c.term('L', '\\underline V_L')} + ${c.term('C', '\\underline V_C')}, \\qquad ${c.term('i', '\\underline I')} = \\frac{\\underline V_S}{\\underline Z} \\\\
          |${c.term('i', '\\underline I')}| &= ${c.term('i', c.q(cabs(k.I), 'A'))}, \\quad |${c.term('L', '\\underline V_L')}| = ${c.term('L', c.q(cabs(k.VL), 'V'))}, \\quad |${c.term('C', '\\underline V_C')}| = ${c.term('C', c.q(cabs(k.VC), 'V'))}
        \\end{aligned}`;
      },
      bars: (c) => {
        const k = c.k as RlcAcInfo;
        return {
          scale: c.p.V,
          items: [
            { term: 'R', label: '|V_R|', value: cabs(k.VR) },
            { term: 'L', label: '|V_L|', value: cabs(k.VL) },
            { term: 'C', label: '|V_C|', value: cabs(k.VC) },
          ],
        };
      },
      note: (c) =>
        c.tr({
          fr: 'Les modules ne s’additionnent pas : $|V_L|$ et $|V_C|$ peuvent dépasser **largement** la tension de la source.',
          en: 'Magnitudes do not add: $|V_L|$ and $|V_C|$ can be **far larger** than the source voltage.',
        }),
    },
    {
      id: 'resonance',
      title: { fr: 'Résonance et facteur de qualité', en: 'Resonance and quality factor' },
      tex: (c) => {
        const k = c.k as RlcAcInfo;
        return `\\begin{aligned}
          f_0 &= \\frac{1}{2\\pi\\sqrt{${c.term('L', 'L')}${c.term('C', 'C')}}} = ${c.q(k.f0, 'Hz')} \\\\
          Q &= \\frac{\\omega_0 ${c.term('L', 'L')}}{${c.term('R', 'R')}} = \\frac{1}{${c.term('R', 'R')}}\\sqrt{\\frac{${c.term('L', 'L')}}{${c.term('C', 'C')}}} = ${c.q(k.Q, '')} \\\\
          \\Delta f &= \\frac{f_0}{Q} = ${c.q(k.bandwidth, 'Hz')}, \\qquad |V_C|_{f_0} = Q\\,\\hat V = ${c.q(k.Q * c.p.V, 'V')}
        \\end{aligned}`;
      },
      derive: () => [
        '\\operatorname{Im}\\underline Z = 0 \\iff \\omega L = \\frac{1}{\\omega C} \\iff \\omega_0 = \\frac{1}{\\sqrt{LC}}',
        '|\\underline I(\\omega_0)| = \\frac{\\hat V}{R} \\;\\Rightarrow\\; |\\underline V_C(\\omega_0)| = \\frac{1}{\\omega_0 C}\\frac{\\hat V}{R} = Q\\,\\hat V',
        '|\\underline I|^2 = \\tfrac12 |\\underline I|^2_{\\max} \\iff |\\operatorname{Im}\\underline Z| = R \\;\\Rightarrow\\; \\omega_2 - \\omega_1 = \\frac{R}{L}',
      ],
    },
    {
      id: 'harmonic',
      title: { fr: 'Résonance harmonique sur le réseau', en: 'Harmonic resonance on the grid' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as RlcAcInfo;
        return `h_{res} = \\frac{f_0}{50\\,\\mathrm{Hz}} = ${c.q(k.f0 / 50, '', 3)} \\qquad \\text{${c.tr({ fr: 'rang harmonique excité', en: 'harmonic order excited' })}}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une batterie de condensateurs et l’inductance du réseau forment ce même circuit. Si $f_0$ tombe près du 5ᵉ ou du 7ᵉ harmonique d’un redresseur, on obtient des surtensions et des destructions de condensateurs. Le remède : une self de désaccord, qui place $f_0$ vers $h \\approx 4{,}3$.',
          en: 'A capacitor bank and the grid inductance form this very circuit. If $f_0$ falls near a rectifier’s 5th or 7th harmonic, you get overvoltages and failed capacitors. The cure: a detuning reactor, which places $f_0$ near $h \\approx 4.3$.',
        }),
    },
    {
      id: 'transfer',
      title: { fr: 'Fonction de transfert', en: 'Transfer function' },
      personas: ['research'],
      tex: () => `Y(s) = \\frac{I(s)}{V(s)} = \\frac{C s}{LC\\,s^2 + RC\\,s + 1}, \\qquad \\underline I = Y(j\\omega)\\,\\underline V`,
      note: (c) =>
        c.tr({
          fr: 'Mêmes pôles qu’à la leçon 1.2 : la réponse transitoire et la résonance sont deux faces des mêmes valeurs propres. Le régime établi correspond à $s = j\\omega$.',
          en: 'Same poles as in lesson 1.2: the transient and the resonance are two faces of the same eigenvalues. Steady state is $s = j\\omega$.',
        }),
    },
  ],

  steps: [
    {
      id: 'settle',
      title: { fr: 'Transitoire, puis régime établi', en: 'Transient, then steady state' },
      body: {
        fr: `L’interrupteur se ferme à $t = 0$ sur une source $v_S = \\hat V\\cos\\omega t$.

Le courant réel (trait plein) commence par un **transitoire**, puis rejoint la courbe en pointillés calculée **avec les phaseurs**. Parcourez le temps jusqu’à la fin.

Le diagramme de phaseurs tourne avec le curseur de temps : la projection de chaque flèche sur l’axe réel donne la valeur instantanée.`,
        en: `The switch closes at $t = 0$ onto a source $v_S = \\hat V\\cos\\omega t$.

The actual current (solid) starts with a **transient**, then locks onto the dashed curve computed **with phasors**. Scrub through to the end.

The phasor diagram turns with the time cursor: each arrow’s shadow on the real axis is its instantaneous value.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'find-f0',
      title: { fr: 'Trouver la résonance', en: 'Find the resonance' },
      body: {
        fr: `Réglez $f$ (cliquez sur la réponse en fréquence) pour que $\\underline V_L$ et $\\underline V_C$ **s’annulent** dans le diagramme de phaseurs.

À la résonance, le courant est **maximal** ($\\hat V/R$) et **en phase** avec la source.`,
        en: `Tune $f$ (click on the frequency response) until $\\underline V_L$ and $\\underline V_C$ **cancel** in the phasor diagram.

At resonance the current is **maximum** ($\\hat V/R$) and **in phase** with the source.`,
      },
      hint: { fr: '$f_0 = 1/(2\\pi\\sqrt{LC}) \\approx 159$ Hz avec les valeurs par défaut.', en: '$f_0 = 1/(2\\pi\\sqrt{LC}) \\approx 159$ Hz with the default values.' },
      check: (lab) => Math.abs(lab.params.f / (lab.info as RlcAcInfo).f0 - 1) < 0.015,
    },
    {
      id: 'overvoltage',
      title: { fr: 'Surtension sur le condensateur', en: 'Capacitor overvoltage' },
      body: {
        fr: `Restez à la résonance et **diminuez $R$** jusqu’à ce que le condensateur voie **plus de 5 fois** la tension de la source.

C’est le facteur de qualité $Q$ : une source de 10 V peut produire 100 V aux bornes de $C$.`,
        en: `Stay at resonance and **lower $R$** until the capacitor sees **more than 5 times** the source voltage.

That is the quality factor $Q$: a 10 V source can put 100 V across $C$.`,
      },
      check: (lab) => {
        const k = lab.info as RlcAcInfo;
        return cabs(k.VC) / lab.params.V >= 5 && Math.abs(lab.params.f / k.f0 - 1) < 0.05;
      },
    },
    {
      id: 'bandwidth',
      title: { fr: 'Sélectivité', en: 'Selectivity' },
      body: {
        fr: `La bande grisée est la **bande passante** à mi-puissance : $\\Delta f = f_0/Q$.

Cliquez **Balayer** à côté de $R$ pour voir la résonance s’aiguiser quand $R$ diminue. C’est le principe du circuit d’accord d’un récepteur radio.`,
        en: `The shaded band is the half-power **bandwidth**: $\\Delta f = f_0/Q$.

Click **Sweep** next to $R$ to watch the resonance sharpen as $R$ drops. This is how a radio tuner picks one station.`,
      },
      check: (lab) => lab.fan?.param === 'R',
    },
    {
      id: 'inductive',
      title: { fr: 'De l’autre côté', en: 'The other side' },
      body: {
        fr: `Passez au-dessus de la résonance ($f > 1{,}5\\,f_0$) et regardez la **phase** dans la réponse en fréquence.

Le circuit devient **inductif** : le courant est en retard sur la tension. Presque tout le réseau électrique fonctionne de ce côté-là.`,
        en: `Go above resonance ($f > 1.5\\,f_0$) and look at the **phase** in the frequency response.

The circuit becomes **inductive**: the current lags the voltage. Almost the entire power grid lives on this side.`,
      },
      check: (lab) => lab.params.f > 1.5 * (lab.info as RlcAcInfo).f0,
    },
  ],
};
