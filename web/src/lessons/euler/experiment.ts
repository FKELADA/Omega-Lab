// Module 2.1 — Euler's formula, the rotating vector, and adding sinusoids with phasors.

import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import type { Experiment } from '../../lib/lab/types';
import { deg, twoPhasorInfo, twoPhasors, type TwoPhasorInfo } from '../../lib/models/twoPhasors';
import { tex } from '../../lib/ui/format';
import Helix from './Helix.svelte';

/** Angle difference folded into [0°, 180°]. */
const gap = (a: number, b: number) => {
  return Math.abs(((((a - b) % 360) + 540) % 360) - 180);
};

export const euler: Experiment = {
  id: 'euler',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.1 Euler', en: '2.1 Euler' },
  ],
  title: { fr: 'Le vecteur tournant et l’addition de sinusoïdes', en: 'The rotating vector and adding sinusoids' },
  model: twoPhasors,
  info: twoPhasorInfo,
  canvas: Helix,
  instruments: [PhasorDiagram],

  params: [
    { id: 'A1', symbol: 'A_1', name: { fr: 'Amplitude 1', en: 'Amplitude 1' }, unit: 'V', min: 0, max: 10, default: 5, scale: 'lin', term: 'v1' },
    { id: 'phi1', symbol: '\\varphi_1', name: { fr: 'Phase 1', en: 'Phase 1' }, unit: '°', min: -180, max: 180, default: 0, scale: 'lin', term: 'v1' },
    { id: 'A2', symbol: 'A_2', name: { fr: 'Amplitude 2', en: 'Amplitude 2' }, unit: 'V', min: 0, max: 10, default: 5, scale: 'lin', term: 'v2' },
    { id: 'phi2', symbol: '\\varphi_2', name: { fr: 'Phase 2', en: 'Phase 2' }, unit: '°', min: -180, max: 180, default: 120, scale: 'lin', term: 'v2' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', min: 1, max: 100, default: 50, scale: 'lin' },
  ],

  signals: [
    { id: 'v1', symbol: 'v_1', name: { fr: 'Sinusoïde 1', en: 'Sinusoid 1' }, unit: 'V', color: '--c-v1', on: true, term: 'v1' },
    { id: 'v2', symbol: 'v_2', name: { fr: 'Sinusoïde 2', en: 'Sinusoid 2' }, unit: 'V', color: '--c-v2', on: true, term: 'v2' },
    { id: 'vs', symbol: 'v_1+v_2', name: { fr: 'Somme', en: 'Sum' }, unit: 'V', color: '--c-vs', on: true, term: 'vs' },
  ],

  phasors: {
    omega: (p) => 2 * Math.PI * p.f,
    unit: 'V',
    items: (_p, k: TwoPhasorInfo) => [
      { id: 'V1', label: 'V_1', term: 'v1', color: '--c-v1', value: k.V1 },
      { id: 'V2', label: 'V_2', term: 'v2', color: '--c-v2', value: k.V2, after: 'V1' },
      { id: 'S', label: 'V_1+V_2', term: 'vs', color: '--c-vs', value: k.S, thin: true },
    ],
  },

  predict: {
    signal: 'vs',
    yRange: (p) => {
      const b = 1.1 * (p.A1 + p.A2);
      return [-b, b];
    },
    diagnose(pred, _run, p) {
      const k = twoPhasorInfo(p);
      const peak = Math.max(...pred.map(([, y]) => Math.abs(y)));
      if (peak > 1.35 * k.amp && peak > 0.8 * (p.A1 + p.A2))
        return {
          fr: `Les amplitudes ne s’additionnent que si les sinusoïdes sont **en phase**. Ici elles sont décalées de ${Math.round(gap(p.phi1, p.phi2))}° : $|V_1+V_2| = ${tex(k.amp, 'V')}$, et non $${tex(p.A1 + p.A2, 'V')}$.`,
          en: `Amplitudes only add when the sinusoids are **in phase**. Here they are ${Math.round(gap(p.phi1, p.phi2))}° apart: $|V_1+V_2| = ${tex(k.amp, 'V')}$, not $${tex(p.A1 + p.A2, 'V')}$.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'euler',
      title: { fr: 'Formule d’Euler', en: 'Euler’s formula' },
      tex: (c) => {
        const th = (c.k as TwoPhasorInfo).omega * c.t + c.p.phi1 * deg;
        const wrapped = ((((th / deg) % 360) + 540) % 360) - 180;
        return `\\begin{aligned}
          e^{j\\theta} &= \\cos\\theta + j\\sin\\theta \\\\
          \\theta = \\omega t + \\varphi_1 &= ${c.q(wrapped, '°', 3)} \\;\\Rightarrow\\; e^{j\\theta} = ${c.q(Math.cos(th), '', 3)} ${Math.sin(th) < 0 ? '-' : '+'} j\\,${c.q(Math.abs(Math.sin(th)), '', 3)}
        \\end{aligned}`;
      },
      bars: (c) => {
        const th = (c.k as TwoPhasorInfo).omega * c.t + c.p.phi1 * deg;
        return {
          scale: 1,
          items: [
            { term: 'v1', label: '\\cos', value: Math.cos(th) },
            { term: 'v1', label: '\\sin', value: Math.sin(th) },
          ],
        };
      },
      note: (c) =>
        c.tr({
          fr: 'Le cosinus est l’ombre du vecteur tournant sur l’axe réel ; le sinus, son ombre sur l’axe imaginaire. Tournez l’hélice pour les voir.',
          en: 'The cosine is the rotating vector’s shadow on the real axis; the sine, its shadow on the imaginary axis. Turn the helix to see them.',
        }),
      derive: () => [
        'e^{x} = \\sum_n \\frac{x^n}{n!},\\quad x = j\\theta,\\quad j^2 = -1',
        'e^{j\\theta} = \\Big(1 - \\frac{\\theta^2}{2!} + \\frac{\\theta^4}{4!} - \\dots\\Big) + j\\Big(\\theta - \\frac{\\theta^3}{3!} + \\dots\\Big)',
        'e^{j\\theta} = \\cos\\theta + j\\sin\\theta',
      ],
    },
    {
      id: 'phasor',
      title: { fr: 'Du signal au phaseur', en: 'From signal to phasor' },
      tex: (c) => {
        const k = c.k as TwoPhasorInfo;
        return `\\begin{aligned}
          v(t) = A\\cos(\\omega t + \\varphi) &= \\operatorname{Re}\\big\\{\\underbrace{A\\,e^{j\\varphi}}_{\\underline V}\\,e^{j\\omega t}\\big\\} \\\\
          ${c.term('v1', '\\underline V_1')} = ${c.q(c.p.A1, 'V')}\\angle ${c.q(c.p.phi1, '°', 3)} &= ${c.q(k.V1.re, 'V')} ${k.V1.im < 0 ? '-' : '+'} j\\,${c.q(Math.abs(k.V1.im), 'V')} \\\\
          ${c.term('v2', '\\underline V_2')} = ${c.q(c.p.A2, 'V')}\\angle ${c.q(c.p.phi2, '°', 3)} &= ${c.q(k.V2.re, 'V')} ${k.V2.im < 0 ? '-' : '+'} j\\,${c.q(Math.abs(k.V2.im), 'V')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le phaseur garde l’amplitude et la phase et oublie la rotation $e^{j\\omega t}$, commune à tous les signaux de même fréquence.',
          en: 'The phasor keeps amplitude and phase and drops the rotation $e^{j\\omega t}$, which every signal at that frequency shares.',
        }),
    },
    {
      id: 'sum',
      title: { fr: 'Additionner des sinusoïdes', en: 'Adding sinusoids' },
      tex: (c) => {
        const k = c.k as TwoPhasorInfo;
        return `\\begin{aligned}
          ${c.term('vs', '\\underline V_1 + \\underline V_2')} &= ${c.q(k.S.re, 'V')} ${k.S.im < 0 ? '-' : '+'} j\\,${c.q(Math.abs(k.S.im), 'V')} = ${c.term('vs', `${c.q(k.amp, 'V')}\\angle ${c.q(k.phase, '°', 3)}`)} \\\\
          ${c.term('v1', 'v_1')} + ${c.term('v2', 'v_2')} &= ${c.term('vs', `${c.q(k.amp, 'V')}\\,\\cos(\\omega t ${k.phase < 0 ? '-' : '+'} ${c.q(Math.abs(k.phase), '°', 3)})`)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Ajouter deux sinusoïdes de même fréquence revient à ajouter deux vecteurs. Aucune trigonométrie n’est nécessaire.',
          en: 'Adding two sinusoids at the same frequency is just adding two vectors. No trigonometry needed.',
        }),
    },
    {
      id: 'derivative',
      title: { fr: 'Pourquoi c’est si puissant', en: 'Why this is so powerful' },
      personas: ['research', 'utility'],
      tex: () => `\\begin{aligned}
        \\frac{d}{dt}\\,e^{j\\omega t} = j\\omega\\,e^{j\\omega t} \\;&\\Rightarrow\\; \\frac{d}{dt} \\;\\longrightarrow\\; j\\omega \\\\
        v_L = L\\frac{di}{dt} \\;&\\longrightarrow\\; \\underline V_L = j\\omega L\\,\\underline I
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Les équations différentielles deviennent algébriques : c’est l’origine de l’impédance (leçon 2.2) et de tout le calcul de répartition de charge (module 5).',
          en: 'Differential equations become algebraic: that is where impedance comes from (lesson 2.2), and all of power-flow analysis (Module 5).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la somme', en: 'Predict the sum' },
      body: {
        fr: `Deux sinusoïdes de **même amplitude** (5 V) et de même fréquence sont décalées de **120°**.

**Dessinez leur somme $v_1 + v_2$**, puis révélez.`,
        en: `Two sinusoids with the **same amplitude** (5 V) and the same frequency are **120°** apart.

**Sketch their sum $v_1 + v_2$**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'helix',
      title: { fr: 'Tourner l’hélice', en: 'Turn the helix' },
      body: {
        fr: `L’hélice représente $e^{j(\\omega t + \\varphi_1)}$ : le temps défile le long de l’axe, et le plan complexe en est la coupe.

Faites-la tourner (glisser ou boutons). Vue **de côté**, c’est un sinus ; **de dessus**, un cosinus ; **en bout**, le vecteur tournant sur son cercle. Choisissez la vue **en bout** puis lancez la lecture ▶.`,
        en: `The helix is $e^{j(\\omega t + \\varphi_1)}$: time runs along the axis and the complex plane is its cross-section.

Turn it (drag or buttons). From the **side** it is a sine; from **above**, a cosine; **end-on**, the rotating vector on its circle. Choose the **end** view and press play ▶.`,
      },
      check: (lab) => !!lab.flags.endView,
    },
    {
      id: 'in-phase',
      title: { fr: 'Additionner en phase', en: 'Adding in phase' },
      body: {
        fr: `Réglez $\\varphi_2$ pour que la somme soit **la plus grande possible**. Dans le diagramme de phaseurs, les flèches s’alignent bout à bout.`,
        en: `Set $\\varphi_2$ so the sum is **as large as possible**. In the phasor diagram the arrows line up head to tail.`,
      },
      check: (lab) => lab.params.A1 > 0.5 && lab.params.A2 > 0.5 && gap(lab.params.phi1, lab.params.phi2) < 3,
    },
    {
      id: 'cancel',
      title: { fr: 'Annuler', en: 'Cancelling out' },
      body: {
        fr: `Avec deux amplitudes égales, trouvez la phase qui donne une somme **nulle**. Le bruit actif des casques anti-bruit repose sur ce principe.`,
        en: `With two equal amplitudes, find the phase that gives a **zero** sum. Noise-cancelling headphones work on this principle.`,
      },
      check: (lab) => {
        const k = lab.info as TwoPhasorInfo;
        return lab.params.A1 > 0.5 && k.amp < 0.05 * lab.params.A1;
      },
    },
    {
      id: 'three-phase',
      title: { fr: 'Aperçu du triphasé', en: 'A glimpse of three-phase' },
      body: {
        fr: `Mettez $A_1 = A_2$, $\\varphi_1 = 120°$ et $\\varphi_2 = -120°$. La somme est exactement l’**opposé** d’une troisième sinusoïde à 0°.

Les trois phases d’un réseau **équilibré** s’additionnent donc à zéro : c’est pourquoi le neutre ne transporte (presque) aucun courant (leçon 2.4).`,
        en: `Set $A_1 = A_2$, $\\varphi_1 = 120°$ and $\\varphi_2 = -120°$. The sum is exactly the **opposite** of a third sinusoid at 0°.

So the three phases of a **balanced** grid add up to zero: that is why the neutral carries (almost) no current (lesson 2.4).`,
      },
      check: (lab) => {
        const { A1, A2, phi1, phi2 } = lab.params;
        return A1 > 0.5 && Math.abs(A1 - A2) < 0.05 * A1 && Math.abs(phi1 - 120) < 3 && Math.abs(phi2 + 120) < 3;
      },
    },
  ],
};
