// Module 2.2 — Phasors and impedance: how R, L and C relate voltage and current.

import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import { cabs, cdiv, cx } from '../../lib/core/linalg';
import type { Experiment } from '../../lib/lab/types';
import { KINDS, impedance, impedanceInfo, type ImpedanceInfo } from '../../lib/models/acCircuits';
import { fitPhase } from '../../lib/models/phasorRun';
import type { L } from '../../lib/ui/ui.svelte';
import ElementSchematic from './ElementSchematic.svelte';
import ImpedancePlane from './ImpedancePlane.svelte';

const KIND_NAME: Record<number, L> = {
  [KINDS.R]: { fr: 'R', en: 'R' },
  [KINDS.L]: { fr: 'L', en: 'L' },
  [KINDS.C]: { fr: 'C', en: 'C' },
  [KINDS.RL]: { fr: 'R + L', en: 'R + L' },
  [KINDS.RC]: { fr: 'R + C', en: 'R + C' },
};

export const impedanceLesson: Experiment = {
  id: 'impedance',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.2 Phaseurs et impédance', en: '2.2 Phasors and impedance' },
  ],
  title: { fr: 'R, L, C en régime sinusoïdal', en: 'R, L and C under AC' },
  model: impedance,
  info: impedanceInfo,
  canvas: ElementSchematic,
  instruments: [PhasorDiagram, ImpedancePlane],

  params: [
    {
      id: 'kind',
      symbol: 'Z',
      name: { fr: 'Circuit', en: 'Circuit' },
      unit: '',
      min: 0,
      max: 4,
      default: KINDS.L,
      scale: 'lin',
      choices: Object.values(KINDS).map((v) => ({ value: v, label: KIND_NAME[v] })),
    },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', min: 5, max: 5000, default: 50, scale: 'log', term: 'S' },
    { id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', min: 1, max: 1000, default: 10, scale: 'log', term: 'R' },
    { id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'H', min: 1e-3, max: 1, default: 50e-3, scale: 'log', term: 'L' },
    { id: 'C', symbol: 'C', name: { fr: 'Capacité', en: 'Capacitance' }, unit: 'F', min: 1e-6, max: 2e-3, default: 200e-6, scale: 'log', term: 'C' },
    { id: 'V', symbol: 'V', name: { fr: 'Tension efficace', en: 'RMS voltage' }, unit: 'V', min: 1, max: 400, default: 230, scale: 'lin', term: 'S' },
  ],

  signals: [
    { id: 'v', symbol: 'v', name: { fr: 'Tension', en: 'Voltage' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'i', symbol: 'i', name: { fr: 'Courant', en: 'Current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'p', symbol: 'p', name: { fr: 'Puissance instantanée', en: 'Instantaneous power' }, unit: 'W', color: '--c-p', on: false, term: 'p' },
  ],

  phasors: {
    omega: (p) => 2 * Math.PI * p.f,
    unit: 'V',
    rms: true,
    items: (p, k: ImpedanceInfo) => [
      { id: 'V', label: 'V', term: 'S', color: '--c-S', value: cx(p.V) },
      // Drawn scaled by |Z| so it is as long as V: what matters is the angle between them.
      { id: 'I', label: 'I', term: 'i', color: '--c-i', value: k.I, unit: 'A', drawScale: cabs(k.Z) },
    ],
  },

  predict: {
    signal: 'i',
    yRange: (p) => {
      const b = (1.25 * Math.SQRT2 * p.V) / cabs(impedanceInfo(p).Z);
      return [-b, b];
    },
    diagnose(pred, _run, p) {
      if (pred.length < 10) return null;
      const k = impedanceInfo(p);
      const fit = fitPhase(pred, k.omega);
      const lag = (-fit.phase * 180) / Math.PI; // how far the sketch lags v
      const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
      const err = wrap(lag - k.phi);
      if (Math.abs(err) < 30) return null;
      if (Math.abs(wrap(lag)) < 30)
        return {
          fr: 'Dans une bobine, le courant **ne suit pas** la tension : $v_L = L\\,di/dt$, donc la tension est maximale quand le courant **varie** le plus vite, c’est-à-dire quand il passe par zéro. Le courant est en **retard de 90°**.',
          en: 'In an inductor the current does **not** follow the voltage: $v_L = L\\,di/dt$, so the voltage peaks when the current **changes** fastest, which is when it crosses zero. The current **lags by 90°**.',
        };
      if (Math.abs(wrap(lag + 90)) < 30)
        return {
          fr: 'Courant en **avance** de 90° : c’est le comportement d’un **condensateur**. Une bobine fait l’inverse : courant en retard.',
          en: 'Current **leading** by 90° is what a **capacitor** does. An inductor does the opposite: the current lags.',
        };
      return {
        fr: `Le décalage dessiné est d’environ ${Math.round(lag)}°, alors que le courant est en retard de ${Math.round(k.phi)}°.`,
        en: `Your sketch lags by about ${Math.round(lag)}°, but the current lags by ${Math.round(k.phi)}°.`,
      };
    },
  },

  equations: [
    {
      id: 'laws',
      title: { fr: 'Du temps aux phaseurs', en: 'From time to phasors' },
      tex: (c) => `\\begin{array}{lcl}
          ${c.term('R', 'v_R = R\\,i')} & \\longrightarrow & ${c.term('R', '\\underline V = R\\,\\underline I')} \\\\[3pt]
          ${c.term('L', 'v_L = L\\,\\dfrac{di}{dt}')} & \\longrightarrow & ${c.term('L', '\\underline V = j\\omega L\\,\\underline I')} \\\\[3pt]
          ${c.term('C', 'i_C = C\\,\\dfrac{dv}{dt}')} & \\longrightarrow & ${c.term('C', '\\underline V = \\dfrac{1}{j\\omega C}\\,\\underline I')}
        \\end{array}`,
      note: (c) =>
        c.tr({
          fr: 'La dérivée $d/dt$ devient une multiplication par $j\\omega$ (leçon 2.1). Dans une bobine, $j$ fait tourner le courant de 90° en retard ; dans un condensateur, de 90° en avance.',
          en: 'The derivative $d/dt$ becomes multiplication by $j\\omega$ (lesson 2.1). In an inductor, $j$ turns the current 90° behind; in a capacitor, 90° ahead.',
        }),
    },
    {
      id: 'z',
      title: { fr: 'Impédance du circuit', en: 'Circuit impedance' },
      tex: (c) => {
        const k = c.k as ImpedanceInfo;
        const w = k.omega;
        const R = c.term('R', 'R'), XL = c.term('L', 'j\\omega L'), XC = c.term('C', '\\frac{1}{j\\omega C}');
        const form: Record<number, string> = {
          [KINDS.R]: R,
          [KINDS.L]: XL,
          [KINDS.C]: XC,
          [KINDS.RL]: `${R} + ${XL}`,
          [KINDS.RC]: `${R} + ${XC}`,
        };
        const sign = k.Z.im < 0 ? '-' : '+';
        return `\\begin{aligned}
          \\underline Z &= ${form[c.p.kind]} = ${c.q(k.Z.re, 'Ω')} ${sign} j\\,${c.q(Math.abs(k.Z.im), 'Ω')} \\\\
          &= ${c.q(cabs(k.Z), 'Ω')}\\angle ${c.q(k.phi, '°', 3)} \\qquad (\\omega = ${c.q(w, 'rad/s')}) \\\\
          ${c.term('i', '\\underline I')} &= \\frac{${c.term('S', '\\underline V')}}{\\underline Z} = ${c.term('i', `${c.q(cabs(k.I), 'A')}\\angle ${c.q(-k.phi, '°', 3)}`)}
        \\end{aligned}`;
      },
      note: (c) => {
        const k = c.k as ImpedanceInfo;
        return c.tr(
          Math.abs(k.phi) < 1
            ? { fr: 'Courant **en phase** avec la tension.', en: 'Current **in phase** with the voltage.' }
            : k.phi > 0
              ? { fr: `Courant **en retard** de ${Math.round(k.phi)}° sur la tension.`, en: `Current **lags** the voltage by ${Math.round(k.phi)}°.` }
              : { fr: `Courant **en avance** de ${Math.round(-k.phi)}° sur la tension.`, en: `Current **leads** the voltage by ${Math.round(-k.phi)}°.` },
        );
      },
    },
    {
      id: 'rms',
      title: { fr: 'Convention efficace', en: 'RMS convention' },
      tex: (c) => {
        const k = c.k as ImpedanceInfo;
        return `\\begin{aligned}
          v(t) &= \\sqrt2\\,|${c.term('S', '\\underline V')}|\\cos\\omega t = ${c.q(Math.SQRT2 * c.p.V, 'V')}\\,\\cos\\omega t \\\\
          i(t) &= \\sqrt2\\,|${c.term('i', '\\underline I')}|\\cos(\\omega t - \\varphi) = ${c.q(Math.SQRT2 * cabs(k.I), 'A')}\\,\\cos(\\omega t ${k.phi > 0 ? '-' : '+'} ${c.q(Math.abs(k.phi), '°', 3)})
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'À partir d’ici, les phaseurs sont en **valeur efficace**, comme dans tous les calculs de réseau : « 230 V » signifie une crête de 325 V.',
          en: 'From here on, phasors are **RMS**, as in all power-system work: “230 V” means a 325 V peak.',
        }),
    },
    {
      id: 'corner',
      title: { fr: 'Fréquence de coupure', en: 'Corner frequency' },
      personas: ['research', 'utility'],
      tex: (c) => {
        const k = c.k as ImpedanceInfo;
        if (k.fc === null) return `\\text{${c.tr({ fr: 'Choisissez R + L ou R + C.', en: 'Choose R + L or R + C.' })}}`;
        return c.p.kind === KINDS.RL
          ? `f_c = \\frac{R}{2\\pi L} = ${c.q(k.fc, 'Hz')} \\qquad (|X_L| = R,\\ \\varphi = 45^\\circ)`
          : `f_c = \\frac{1}{2\\pi R C} = ${c.q(k.fc, 'Hz')} \\qquad (|X_C| = R,\\ \\varphi = -45^\\circ)`;
      },
      note: (c) =>
        c.tr({
          fr: 'Côté réseau, on parle du rapport $X/R$ : environ 10 pour un transformateur de puissance, de 0,3 à 1 pour un câble basse tension. Il fixe l’angle des courants de court-circuit.',
          en: 'On the grid this is the $X/R$ ratio: about 10 for a power transformer, 0.3–1 for a low-voltage cable. It sets the angle of short-circuit currents.',
        }),
    },
    {
      id: 'admittance',
      title: { fr: 'Admittance', en: 'Admittance' },
      personas: ['research'],
      tex: (c) => {
        const k = c.k as ImpedanceInfo;
        const Y = cdiv(cx(1), k.Z);
        return `\\underline Y = \\frac{1}{\\underline Z} = G + jB = ${c.q(Y.re, 'S')} ${Y.im < 0 ? '-' : '+'} j\\,${c.q(Math.abs(Y.im), 'S')}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les admittances s’additionnent en parallèle. C’est la base de la matrice $Y_{bus}$ du module 5.',
          en: 'Admittances add in parallel. This is the basis of the $Y_{bus}$ matrix in Module 5.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Le courant dans une bobine', en: 'Current in an inductor' },
      body: {
        fr: `Une bobine de $50$ mH est branchée sur $230$ V, $50$ Hz.

**Dessinez le courant $i(t)$** par rapport à la tension (en vert), puis révélez.`,
        en: `A $50$ mH inductor is connected to $230$ V, $50$ Hz.

**Sketch the current $i(t)$** relative to the voltage (green), then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'capacitor',
      title: { fr: 'Et le condensateur ?', en: 'And the capacitor?' },
      body: {
        fr: `Passez au circuit **C**. Le courant passe maintenant **en avance** de 90°.

Dans le diagramme de phaseurs, $\\underline I$ tourne d’un quart de tour **avant** $\\underline V$, alors qu’avec la bobine il était un quart de tour **après**.`,
        en: `Switch to the **C** circuit. The current now **leads** by 90°.

In the phasor diagram, $\\underline I$ is a quarter turn **ahead** of $\\underline V$; with the inductor it was a quarter turn **behind**.`,
      },
      check: (lab) => lab.params.kind === KINDS.C,
    },
    {
      id: 'frequency',
      title: { fr: 'La fréquence compte', en: 'Frequency matters' },
      body: {
        fr: `Revenez à **L** et montez la fréquence à **500 Hz** ou plus.

$X_L = \\omega L$ grandit avec $f$ : à 10 fois la fréquence, le courant est 10 fois plus faible. Une bobine laisse passer les basses fréquences et bloque les hautes. C’est le principe des filtres (module 6).`,
        en: `Go back to **L** and raise the frequency to **500 Hz** or more.

$X_L = \\omega L$ grows with $f$: at 10 times the frequency the current is 10 times smaller. An inductor passes low frequencies and blocks high ones. That is how filters work (Module 6).`,
      },
      check: (lab) => lab.params.kind === KINDS.L && lab.params.f >= 495,
    },
    {
      id: 'corner',
      title: { fr: 'À 45°', en: 'At 45°' },
      body: {
        fr: `Choisissez **R + L** et réglez $f$ (ou $R$, ou $L$) pour que le courant soit en retard d’exactement **45°**.

Dans le plan des impédances, le triangle devient **isocèle** : $X_L = R$.`,
        en: `Choose **R + L** and set $f$ (or $R$, or $L$) so the current lags by exactly **45°**.

In the impedance plane the triangle becomes **isosceles**: $X_L = R$.`,
      },
      hint: { fr: '$f_c = R/(2\\pi L) \\approx 32$ Hz avec $R = 10\\,\\Omega$ et $L = 50$ mH.', en: '$f_c = R/(2\\pi L) \\approx 32$ Hz with $R = 10\\,\\Omega$ and $L = 50$ mH.' },
      check: (lab) => lab.params.kind === KINDS.RL && Math.abs((lab.info as ImpedanceInfo).phi - 45) < 2,
    },
    {
      id: 'locus',
      title: { fr: 'Le lieu de Z', en: 'The locus of Z' },
      body: {
        fr: `Choisissez **R + C** et faites varier $f$ en regardant le plan des impédances : le point $Z$ glisse sur une **droite verticale** (la partie réelle $R$ ne change pas).

Montez $f$ jusqu’à ce que le circuit se comporte presque comme une résistance pure ($|\\varphi| < 6°$).`,
        en: `Choose **R + C** and vary $f$ while watching the impedance plane: the point $Z$ slides along a **vertical line** (its real part $R$ does not change).

Raise $f$ until the circuit behaves almost like a pure resistor ($|\\varphi| < 6°$).`,
      },
      check: (lab) => lab.params.kind === KINDS.RC && Math.abs((lab.info as ImpedanceInfo).phi) < 6,
    },
  ],
};
