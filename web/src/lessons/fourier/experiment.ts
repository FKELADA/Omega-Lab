// Module 2.7 — Harmonics and Fourier series.

import type { Experiment } from '../../lib/lab/types';
import { TARGETS, fourier, fourierInfo, type FourierInfo } from '../../lib/models/module2b';
import type { L } from '../../lib/ui/ui.svelte';
import Epicycles from './Epicycles.svelte';
import Spectrum from './Spectrum.svelte';

const NAME: Record<number, L> = {
  [TARGETS.square]: { fr: 'Carré', en: 'Square' },
  [TARGETS.triangle]: { fr: 'Triangle', en: 'Triangle' },
  [TARGETS.sawtooth]: { fr: 'Dent de scie', en: 'Sawtooth' },
  [TARGETS.rectifier]: { fr: 'Redresseur 6 pulses', en: '6-pulse rectifier' },
};

const SERIES: Record<number, string> = {
  [TARGETS.square]: '\\frac{4}{\\pi}\\left(\\sin\\theta + \\tfrac13\\sin3\\theta + \\tfrac15\\sin5\\theta + \\dots\\right)',
  [TARGETS.triangle]: '\\frac{8}{\\pi^2}\\left(\\sin\\theta - \\tfrac19\\sin3\\theta + \\tfrac1{25}\\sin5\\theta - \\dots\\right)',
  [TARGETS.sawtooth]: '\\frac{2}{\\pi}\\left(\\sin\\theta - \\tfrac12\\sin2\\theta + \\tfrac13\\sin3\\theta - \\dots\\right)',
  [TARGETS.rectifier]: '\\frac{2\\sqrt3}{\\pi}\\left(\\sin\\theta - \\tfrac15\\sin5\\theta - \\tfrac17\\sin7\\theta + \\tfrac1{11}\\sin11\\theta + \\dots\\right)',
};

export const fourierLesson: Experiment = {
  id: 'fourier',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.7 Harmoniques', en: '2.7 Harmonics' },
  ],
  title: { fr: 'Construire une onde avec des sinusoïdes', en: 'Building a wave from sinusoids' },
  model: fourier,
  info: fourierInfo,
  canvas: Epicycles,
  instruments: [Spectrum],

  params: [
    {
      id: 'target',
      symbol: 'v',
      name: { fr: 'Onde cible', en: 'Target wave' },
      unit: '',
      min: 0,
      max: 3,
      default: TARGETS.square,
      scale: 'lin',
      choices: Object.values(TARGETS).map((v) => ({ value: v, label: NAME[v] })),
    },
    { id: 'N', symbol: 'N', name: { fr: 'Nombre d’harmoniques', en: 'Number of harmonics' }, unit: '', min: 1, max: 49, default: 1, scale: 'lin', step: 1, term: 'p' },
    { id: 'V', symbol: '\\hat V', name: { fr: 'Amplitude', en: 'Amplitude' }, unit: 'V', min: 1, max: 400, default: 100, scale: 'lin', term: 'S' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence fondamentale', en: 'Fundamental frequency' }, unit: 'Hz', min: 1, max: 60, default: 50, scale: 'lin' },
  ],

  signals: [
    { id: 'target', symbol: 'v', name: { fr: 'Onde cible', en: 'Target wave' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'partial', symbol: 'v_N', name: { fr: 'Somme partielle', en: 'Partial sum' }, unit: 'V', color: '--c-p', on: true, term: 'p' },
    { id: 'h1', symbol: 'v_1', name: { fr: 'Fondamental', en: 'Fundamental' }, unit: 'V', color: '--c-v1', on: false, term: 'v1', dash: true },
    { id: 'err', symbol: 'v_N - v', name: { fr: 'Erreur', en: 'Error' }, unit: 'V', color: '--c-R', on: false, term: 'R' },
  ],

  equations: [
    {
      id: 'series',
      title: { fr: 'Série de Fourier', en: 'Fourier series' },
      tex: (c) => `\\begin{aligned}
        \\frac{${c.term('S', 'v(\\theta)')}}{\\hat V} &= ${SERIES[c.p.target]} \\\\
        ${c.term('p', 'v_N')} &= \\hat V\\sum_{n=1}^{${c.p.N}} b_n \\sin n\\theta = ${c.term('p', c.q(c.at('partial'), 'V'))} \\quad (v = ${c.term('S', c.q(c.at('target'), 'V'))})
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Toute onde périodique est une somme de sinusoïdes de fréquences $f, 2f, 3f\\dots$ Une onde symétrique ($v(\\theta+\\pi) = -v(\\theta)$) ne contient que des rangs **impairs**.',
          en: 'Any periodic wave is a sum of sinusoids at $f, 2f, 3f\\dots$ A half-wave symmetric wave ($v(\\theta+\\pi) = -v(\\theta)$) contains **odd** orders only.',
        }),
      derive: () => [
        'b_n = \\frac{1}{\\pi}\\int_0^{2\\pi} v(\\theta)\\sin n\\theta\\,d\\theta',
        '\\text{square: } b_n = \\frac{2}{\\pi}\\int_0^{\\pi}\\sin n\\theta\\,d\\theta = \\frac{2}{n\\pi}(1 - \\cos n\\pi)',
        '= \\frac{4}{n\\pi}\\ (n\\ \\text{odd}), \\quad 0\\ (n\\ \\text{even})',
      ],
    },
    {
      id: 'thd',
      title: { fr: 'Taux de distorsion harmonique', en: 'Total harmonic distortion' },
      tex: (c) => {
        const k = c.k as FourierInfo;
        return `\\mathrm{THD} = \\frac{\\sqrt{\\sum_{n\\ge2} V_n^2}}{V_1} = ${c.q(100 * k.thd, '%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Grâce à Parseval (leçon 1.3), le THD se calcule à partir de la seule valeur efficace : $V_{rms}^2 = V_1^2 + \\sum V_n^2$.',
          en: 'Thanks to Parseval (lesson 1.3), THD follows from the RMS value alone: $V_{rms}^2 = V_1^2 + \\sum V_n^2$.',
        }),
    },
    {
      id: 'gibbs',
      title: { fr: 'Le phénomène de Gibbs', en: 'The Gibbs phenomenon' },
      personas: ['research'],
      tex: (c) => `\\lim_{N\\to\\infty}\\max v_N = 1 + 0{,}0895 \\times 2 \\approx 1{,}179 \\quad (\\text{${c.tr({ fr: 'saut de 2', en: 'jump of 2' })}})`,
      note: (c) =>
        c.tr({
          fr: 'Près d’une discontinuité, le dépassement ne disparaît **jamais** : il se resserre mais reste à 9 % du saut. Les coefficients d’une onde continue (triangle) décroissent en $1/n^2$ au lieu de $1/n$, d’où sa convergence bien plus rapide.',
          en: 'Near a discontinuity the overshoot **never** goes away: it narrows but stays at 9 % of the jump. A continuous wave (triangle) has coefficients falling as $1/n^2$ instead of $1/n$, hence its much faster convergence.',
        }),
    },
    {
      id: 'grid',
      title: { fr: 'Harmoniques sur le réseau', en: 'Harmonics on the grid' },
      personas: ['utility', 'research'],
      tex: () => `h = k\\,p \\pm 1, \\qquad I_h \\approx \\frac{I_1}{h} \\qquad (p = 6:\\ h = 5, 7, 11, 13, \\dots)`,
      note: (c) =>
        c.tr({
          fr: 'Un redresseur à $p$ pulses n’injecte que les rangs $kp \\pm 1$. La norme EN 50160 limite le THD de tension à 8 % en basse et moyenne tension ; l’IEEE 519 fixe des limites de courant selon la puissance de court-circuit.',
          en: 'A $p$-pulse rectifier injects only orders $kp \\pm 1$. EN 50160 limits voltage THD to 8 % at low and medium voltage; IEEE 519 sets current limits according to the short-circuit ratio.',
        }),
    },
  ],

  steps: [
    {
      id: 'square',
      title: { fr: 'Construire un carré', en: 'Building a square' },
      body: {
        fr: `Avec $N = 1$, on n’a que le fondamental. Montez $N$ et regardez les épicycles : chaque harmonique ajoute un petit cercle qui tourne $n$ fois plus vite.

Montez à $N \\geq 15$ : la somme ressemble de plus en plus au carré.`,
        en: `With $N = 1$ there is only the fundamental. Raise $N$ and watch the epicycles: each harmonic adds a small circle turning $n$ times faster.

Go to $N \\geq 15$: the sum looks more and more like the square.`,
      },
      check: (lab) => lab.params.target === TARGETS.square && lab.params.N >= 15,
    },
    {
      id: 'gibbs',
      title: { fr: 'Le dépassement qui résiste', en: 'The overshoot that will not go away' },
      body: {
        fr: `Poussez $N$ jusqu’à **49**. Les oscillations près des fronts se resserrent, mais leur hauteur ne diminue pas : environ **18 %** de l’amplitude. C’est le phénomène de Gibbs.`,
        en: `Push $N$ to **49**. The wiggles near the edges get narrower, but not shorter: about **18 %** of the amplitude. That is the Gibbs phenomenon.`,
      },
      check: (lab) => lab.params.target === TARGETS.square && lab.params.N >= 45,
    },
    {
      id: 'triangle',
      title: { fr: 'Le triangle converge vite', en: 'The triangle converges fast' },
      body: {
        fr: `Passez au **triangle** avec $N = 3$ : la somme est déjà presque parfaite. Ses harmoniques décroissent en $1/n^2$ (voir le spectre) : THD de seulement 12 %, contre 48 % pour le carré.`,
        en: `Switch to the **triangle** with $N = 3$: the sum is already nearly perfect. Its harmonics fall as $1/n^2$ (see the spectrum): THD of only 12 %, against 48 % for the square.`,
      },
      check: (lab) => lab.params.target === TARGETS.triangle && lab.params.N <= 5,
    },
    {
      id: 'rectifier',
      title: { fr: 'Le courant d’un redresseur', en: 'A rectifier’s current' },
      body: {
        fr: `Choisissez le **redresseur 6 pulses** : le courant absorbé est fait de blocs de 120°. Son spectre ne contient que les rangs **5, 7, 11, 13…** ($6k \\pm 1$) : ni pairs, ni multiples de 3.

C’est la signature des variateurs de vitesse et des anciens convertisseurs CCHT.`,
        en: `Choose the **6-pulse rectifier**: its current is made of 120° blocks. The spectrum contains only orders **5, 7, 11, 13…** ($6k \\pm 1$): no even orders, no multiples of 3.

That is the signature of variable-speed drives and older HVDC converters.`,
      },
      check: (lab) => lab.params.target === TARGETS.rectifier,
    },
    {
      id: 'listen',
      title: { fr: 'Écouter la distorsion', en: 'Hearing distortion' },
      body: {
        fr: `Cliquez **♪ Écouter** avec $N = 1$, puis avec $N = 49$. Même hauteur de note, mais un timbre très différent : le **timbre**, c’est le spectre harmonique. Le bourdonnement d’un transformateur, à 100 Hz et ses harmoniques, en est un bon exemple.`,
        en: `Click **♪ Listen** with $N = 1$, then with $N = 49$. Same pitch, very different sound: **timbre** is the harmonic spectrum. A transformer’s hum, at 100 Hz and its harmonics, is a good example.`,
      },
      check: (lab) => !!lab.flags.listened,
    },
  ],
};
