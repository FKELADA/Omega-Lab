// Module 1.3 — AC sources, RMS value and average power in a resistor.

import type { Experiment } from '../../lib/lab/types';
import { SHAPES, SINE_FORM_FACTOR, waveform, waveformInfo, type WaveformInfo } from '../../lib/models/waveform';
import { tex } from '../../lib/ui/format';
import type { L } from '../../lib/ui/ui.svelte';
import HeaterSchematic from './HeaterSchematic.svelte';
import Meters from './Meters.svelte';

/** 325 V peak: the European 230 V RMS mains. */
const V_MAINS = 325;
const R_HEATER = 52.9; // ≈ 1 kW on 230 V

const SHAPE_NAME: Record<number, L> = {
  [SHAPES.sine]: { fr: 'Sinus', en: 'Sine' },
  [SHAPES.square]: { fr: 'Carré', en: 'Square' },
  [SHAPES.triangle]: { fr: 'Triangle', en: 'Triangle' },
  [SHAPES.dc]: { fr: 'Continu', en: 'DC' },
};

const RMS_TEX: Record<number, string> = {
  [SHAPES.sine]: '\\frac{\\hat V}{\\sqrt 2}',
  [SHAPES.square]: '\\hat V',
  [SHAPES.triangle]: '\\frac{\\hat V}{\\sqrt 3}',
  [SHAPES.dc]: 'V',
};

export const acRms: Experiment = {
  id: 'ac-rms',
  path: [
    { fr: 'Module 1 · Circuits', en: 'Module 1 · Circuits' },
    { fr: '1.3 Sources alternatives', en: '1.3 AC sources' },
  ],
  title: { fr: 'Valeur efficace et puissance moyenne', en: 'RMS value and average power' },
  model: waveform,
  info: waveformInfo,
  canvas: HeaterSchematic,
  instruments: [Meters],

  params: [
    {
      id: 'shape',
      symbol: 'v',
      name: { fr: 'Forme d’onde', en: 'Waveform' },
      unit: '',
      min: 0,
      max: 3,
      default: SHAPES.sine,
      scale: 'lin',
      term: 'S',
      choices: Object.values(SHAPES).map((v) => ({ value: v, label: SHAPE_NAME[v] })),
    },
    { id: 'V', symbol: '\\hat V', name: { fr: 'Amplitude', en: 'Amplitude' }, unit: 'V', min: 1, max: 400, default: V_MAINS, scale: 'lin', term: 'S' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', min: 1, max: 1000, default: 50, scale: 'log' },
    { id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', min: 1, max: 1000, default: R_HEATER, scale: 'log', term: 'R' },
  ],

  signals: [
    { id: 'v', symbol: 'v', name: { fr: 'Tension', en: 'Voltage' }, unit: 'V', color: '--c-S', on: true, term: 'S' },
    { id: 'vrms', symbol: 'V_{rms}', name: { fr: 'Valeur efficace', en: 'RMS value' }, unit: 'V', color: '--c-S', on: true, term: 'S', dash: true },
    { id: 'i', symbol: 'i', name: { fr: 'Courant', en: 'Current' }, unit: 'A', color: '--c-i', on: false, term: 'i' },
    { id: 'p', symbol: 'p', name: { fr: 'Puissance instantanée', en: 'Instantaneous power' }, unit: 'W', color: '--c-p', on: true, term: 'p' },
    { id: 'P', symbol: '\\bar P', name: { fr: 'Puissance moyenne', en: 'Average power' }, unit: 'W', color: '--c-P', on: true, term: 'P', dash: true },
  ],

  predict: {
    signal: 'p',
    // Leaves room below zero, so "power goes negative" stays a possible answer.
    yRange: (p) => {
      const pk = (p.V * p.V) / p.R;
      return [-0.65 * pk, 1.15 * pk];
    },
    diagnose(pred, run, p) {
      const pk = (p.V * p.V) / p.R;
      if (Math.min(...pred.map(([, y]) => y)) < -0.15 * pk)
        return {
          fr: '$p = v^2/R \\geq 0$ à chaque instant : une résistance ne rend **jamais** d’énergie à la source.',
          en: '$p = v^2/R \\geq 0$ at every instant: a resistor **never** gives energy back to the source.',
        };
      if (p.shape !== SHAPES.sine) return null;
      // Count rising crossings of the half-peak level: p(t) has two per supply period.
      const ups = (ys: number[]) => ys.reduce((n, y, k) => n + (k && ys[k - 1] < pk / 2 && y >= pk / 2 ? 1 : 0), 0);
      const truth = ups([...run.s.p]);
      if (ups(pred.map(([, y]) => y)) <= truth / 2)
        return {
          fr: '$\\sin^2(\\omega t) = \\tfrac12(1-\\cos 2\\omega t)$ : la puissance pulse à **deux fois** la fréquence du réseau, soit 100 Hz pour un réseau à 50 Hz.',
          en: '$\\sin^2(\\omega t) = \\tfrac12(1-\\cos 2\\omega t)$: power pulses at **twice** the supply frequency, 100 Hz on a 50 Hz grid.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'pinst',
      title: { fr: 'Puissance instantanée', en: 'Instantaneous power' },
      tex: (c) => `\\begin{aligned}
        ${c.term('p', 'p(t)')} &= v(t)\\,${c.term('i', 'i(t)')} = \\frac{v(t)^2}{${c.term('R', 'R')}} \\\\
        ${c.term('p', c.q(c.at('p'), 'W'))} &= \\frac{(${c.q(c.at('v'), 'V')})^2}{${c.term('R', c.q(c.p.R, 'Ω'))}}
      \\end{aligned}`,
      note: (c) =>
        c.p.shape === SHAPES.sine
          ? c.tr({
              fr: 'Pour un sinus : $p(t) = \\bar P\\,(1 - \\cos 2\\omega t)$, qui oscille entre $0$ et $2\\bar P$ à la fréquence $2f$.',
              en: 'For a sine: $p(t) = \\bar P\\,(1 - \\cos 2\\omega t)$, swinging between $0$ and $2\\bar P$ at frequency $2f$.',
            })
          : null,
    },
    {
      id: 'rms',
      title: { fr: 'Valeur efficace', en: 'RMS value' },
      tex: (c) => {
        const k = c.k as WaveformInfo;
        return `${c.term('S', 'V_{rms}')} = \\sqrt{\\frac{1}{T}\\int_0^T v^2\\,dt} = ${RMS_TEX[c.p.shape]} = ${c.term('S', c.q(k.rms, 'V'))}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La valeur efficace est la tension **continue** qui chaufferait la même résistance autant.',
          en: 'The RMS value is the **DC** voltage that would heat the same resistor just as much.',
        }),
      derive: (c) =>
        c.p.shape === SHAPES.sine
          ? [
              'v = \\hat V \\sin\\omega t \\;\\Rightarrow\\; v^2 = \\hat V^2 \\sin^2\\omega t = \\tfrac{\\hat V^2}{2}(1-\\cos 2\\omega t)',
              '\\frac1T\\int_0^T \\cos 2\\omega t\\,dt = 0 \\;\\Rightarrow\\; \\overline{v^2} = \\tfrac{\\hat V^2}{2}',
              'V_{rms} = \\sqrt{\\overline{v^2}} = \\frac{\\hat V}{\\sqrt 2} \\approx 0{,}707\\,\\hat V',
            ]
          : ['\\text{' + c.tr({ fr: 'Choisissez le sinus pour voir la dérivation.', en: 'Choose the sine to see the derivation.' }) + '}'],
    },
    {
      id: 'power',
      title: { fr: 'Puissance moyenne', en: 'Average power' },
      tex: (c) => {
        const k = c.k as WaveformInfo;
        return `${c.term('P', '\\bar P')} = \\frac{1}{T}\\int_0^T ${c.term('p', 'p')}\\,dt = \\frac{${c.term('S', 'V_{rms}')}^2}{${c.term('R', 'R')}} = ${c.term('P', c.q(k.P, 'W'))}`;
      },
    },
    {
      id: 'meter',
      title: { fr: 'Mesurer la valeur efficace', en: 'Measuring RMS' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as WaveformInfo;
        return `\\begin{aligned}
          V_{\\text{avg-meter}} &= \\underbrace{\\tfrac{\\pi}{2\\sqrt2}}_{${tex(SINE_FORM_FACTOR, '', 4)}}\\;\\overline{|v|} = ${c.q(k.avgMeter, 'V')} \\\\
          F_{\\text{form}} &= \\frac{V_{rms}}{\\overline{|v|}} = ${c.q(k.form, '', 4)}, \\qquad F_{\\text{crest}} = \\frac{\\hat V}{V_{rms}} = ${c.q(k.crest, '', 4)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un multimètre « à valeur moyenne » n’est juste que pour un sinus. Sur des courants déformés (redresseurs, variateurs), il faut un appareil TRMS.',
          en: 'An average-responding meter is only right for a sine. On distorted currents (rectifiers, drives), use a true-RMS instrument.',
        }),
    },
    {
      id: 'parseval',
      title: { fr: 'Valeur efficace et harmoniques', en: 'RMS and harmonics' },
      personas: ['research'],
      tex: () => `\\begin{aligned}
        v_{\\square}(t) &= \\frac{4\\hat V}{\\pi}\\sum_{n\\,\\text{odd}} \\frac{\\sin n\\omega t}{n} \\\\
        V_{rms}^2 &= \\sum_n V_{n,rms}^2 = \\frac{8\\hat V^2}{\\pi^2}\\sum_{n\\,\\text{odd}}\\frac{1}{n^2} = \\frac{8\\hat V^2}{\\pi^2}\\cdot\\frac{\\pi^2}{8} = \\hat V^2
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Parseval : la puissance d’un signal est la somme des puissances de ses harmoniques. C’est la base du calcul du THD (module 2.7).',
          en: 'Parseval: a signal’s power is the sum of the powers of its harmonics. This is the basis of THD (Module 2.7).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance', en: 'Predict the power' },
      body: {
        fr: `Un radiateur de $1\\,\\mathrm{kW}$ ($R = 52{,}9\\,\\Omega$) est branché sur le réseau : $v(t) = 325\\,\\sin(2\\pi\\,50\\,t)$ V.

**Dessinez la puissance instantanée $p(t)$** reçue par la résistance, puis révélez.`,
        en: `A $1\\,\\mathrm{kW}$ heater ($R = 52.9\\,\\Omega$) is plugged into the mains: $v(t) = 325\\,\\sin(2\\pi\\,50\\,t)$ V.

**Sketch the instantaneous power $p(t)$** delivered to the resistor, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'why-root2',
      title: { fr: 'Pourquoi √2 ?', en: 'Why √2?' },
      body: {
        fr: `Lancez la lecture ▶ : la résistance **rougeoie deux fois par période**. La jauge à droite indique la puissance moyenne $\\bar P$.

$\\bar P$ vaut exactement **la moitié** du pic $\\hat V^2/R$. La tension continue qui donnerait ce même $\\bar P$ vaut donc $\\hat V/\\sqrt 2$ : c’est la **valeur efficace**. Pour $\\hat V = 325$ V, on obtient les fameux 230 V.`,
        en: `Press play ▶: the resistor **glows twice per cycle**. The gauge on the right shows the average power $\\bar P$.

$\\bar P$ is exactly **half** the peak $\\hat V^2/R$. So the DC voltage giving the same $\\bar P$ is $\\hat V/\\sqrt 2$: that is the **RMS value**. For $\\hat V = 325$ V you get the familiar 230 V.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'dc-equivalent',
      title: { fr: 'Le même chauffage en continu', en: 'Same heating with DC' },
      body: {
        fr: `Passez la forme d’onde en **Continu** et réglez $V$ pour retrouver $\\bar P = 1\\,\\mathrm{kW}$.

Quelle tension faut-il ? Comparez-la à la valeur efficace du sinus.`,
        en: `Switch the waveform to **DC** and set $V$ to get $\\bar P = 1\\,\\mathrm{kW}$ again.

What voltage do you need? Compare it with the RMS value of the sine.`,
      },
      hint: { fr: '$V = 325/\\sqrt2 \\approx 230$ V.', en: '$V = 325/\\sqrt2 \\approx 230$ V.' },
      check: (lab) => lab.params.shape === SHAPES.dc && Math.abs(lab.params.V / (V_MAINS / Math.SQRT2) - 1) < 0.02,
    },
    {
      id: 'meters',
      title: { fr: 'Tromper le multimètre', en: 'Fooling the multimeter' },
      body: {
        fr: `Choisissez un signal **carré** puis **triangle**, et comparez les deux multimètres.

Le multimètre bon marché mesure la moyenne de $|v|$ et la multiplie par $1{,}111$, ce qui n’est valable que pour un sinus. Sur un carré, il lit **11 % trop haut**.`,
        en: `Pick a **square** wave, then a **triangle**, and compare the two multimeters.

The cheap meter measures the average of $|v|$ and multiplies it by $1.111$, which is only valid for a sine. On a square wave it reads **11 % high**.`,
      },
      check: (lab) => lab.params.shape === SHAPES.square || lab.params.shape === SHAPES.triangle,
    },
  ],
};
