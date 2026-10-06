// Module 4.7 — Loads, continued: exponential model, reactive sensitivity, frequency dependence.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { EXPL, expLoadInfo, expLoadModel, expP, expQ, type ExpLoadInfo } from '../../lib/models/module4b';
import { zipP, zipWeights } from '../../lib/models/module4';
import LoadExpCanvas from './LoadExpCanvas.svelte';

const curve = (f: (V: number) => number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let V = 0.7; V <= 1.101; V += 0.01) pts.push([V, f(V)]);
  return pts;
};

export const loadExpLesson: Experiment = {
  id: 'loadexp',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.7 Charges : modèle exponentiel et fréquence', en: '4.7 Loads: exponential model and frequency' },
  ],
  title: { fr: 'Un exposant pour la tension, un coefficient pour la fréquence', en: 'An exponent for voltage, a coefficient for frequency' },
  model: expLoadModel,
  info: expLoadInfo,
  canvas: LoadExpCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'alpha', symbol: '\\alpha', name: { fr: 'Exposant de la puissance active', en: 'Active-power exponent' }, unit: '', min: 0, max: 2.5, default: 1, scale: 'lin', term: 'p' },
    { id: 'beta', symbol: '\\beta', name: { fr: 'Exposant de la puissance réactive', en: 'Reactive-power exponent' }, unit: '', min: 0, max: 5, default: 2, scale: 'lin', term: 'C' },
    { id: 'Kpf', symbol: 'K_{pf}', name: { fr: 'Sensibilité de P à la fréquence', en: 'Frequency sensitivity of P' }, unit: '', min: 0, max: 3, default: 1, scale: 'lin', term: 'i' },
    { id: 'V2', symbol: 'V_2', name: { fr: 'Tension après l’échelon (t = 2 s)', en: 'Voltage after the step (t = 2 s)' }, unit: 'pu', min: 0.85, max: 1.05, default: 0.95, scale: 'lin', term: 'S' },
    { id: 'df', symbol: '\\Delta f', name: { fr: 'Écart de fréquence (t = 7 s)', en: 'Frequency deviation (t = 7 s)' }, unit: 'Hz', min: -1, max: 0.5, default: -0.2, scale: 'lin', term: 'L' },
  ],

  signals: [
    { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'Q', symbol: 'Q', name: { fr: 'Puissance réactive', en: 'Reactive power' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'V', symbol: 'V', name: { fr: 'Tension', en: 'Voltage' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', color: '--c-L', on: true, term: 'L' },
  ],

  charts: [
    {
      title: { fr: 'P selon la tension : exposant et équivalent ZIP', en: 'P versus voltage: exponent and ZIP equivalent' },
      x: { label: 'V', unit: 'pu', range: [0.7, 1.1] },
      y: { label: 'P', unit: 'pu', range: [0.4, 1.25] },
      series: (lab) => {
        const w = zipWeights({ z: 0.4, i: 0.3 });
        return [
          { label: { fr: 'α = 0 (P cte)', en: 'α = 0 (constant P)' }, color: '--c-C', pts: curve(() => 1), dash: true, width: 1.2 },
          { label: { fr: 'α = 1 (I cte)', en: 'α = 1 (constant I)' }, color: '--c-i', pts: curve((V) => V), dash: true, width: 1.2 },
          { label: { fr: 'α = 2 (Z cte)', en: 'α = 2 (constant Z)' }, color: '--c-R', pts: curve((V) => V * V), dash: true, width: 1.2 },
          { label: { fr: 'ZIP de la leçon 4.6', en: 'ZIP of lesson 4.6' }, color: '--c-L', pts: curve((V) => zipP(w, V)), width: 1.5 },
          { label: { fr: `α = ${lab.params.alpha.toFixed(2)}`, en: `α = ${lab.params.alpha.toFixed(2)}` }, color: '--c-p', pts: curve((V) => expP(V, 0, lab.params.alpha, 0)) },
        ];
      },
      points: (lab) => [{ x: lab.at('V'), y: expP(lab.at('V'), 0, lab.params.alpha, 0), color: '--accent' }],
    },
    {
      title: { fr: 'Autoréglage : écart de fréquence après la perte de 3 % de production', en: 'Self-regulation: frequency deviation after losing 3 % of generation' },
      x: { label: 'K_pf', unit: '', range: [0, 3] },
      y: { label: 'Δf', unit: 'Hz', range: [-3, 0] },
      series: () => {
        const no: [number, number][] = [], gov: [number, number][] = [];
        for (let K = 0.3; K <= 3.001; K += 0.05) {
          const k = expLoadInfo({ alpha: 1, beta: 2, Kpf: K, V2: 1, df: 0 });
          no.push([K, k.dfNoGov]);
          gov.push([K, k.dfGov]);
        }
        return [
          { label: { fr: 'charge seule (sans réglage primaire)', en: 'load alone (no primary control)' }, color: '--c-i', pts: no },
          { label: { fr: `avec réglage primaire (statisme ${EXPL.R * 100} %)`, en: `with primary control (${EXPL.R * 100} % droop)` }, color: '--c-L', pts: gov },
        ];
      },
      points: (lab) => {
        const k = lab.info as ExpLoadInfo;
        return lab.params.Kpf > 0.05 ? [{ x: lab.params.Kpf, y: Math.max(-3, k.dfNoGov), color: '--c-i' }, { x: lab.params.Kpf, y: k.dfGov, color: '--c-L' }] : [];
      },
      note: () => ({
        fr: 'Sans régulateurs, seule la charge freine la chute de fréquence : il faudrait des hertz d’écart. Les régulateurs font l’essentiel, la charge aide un peu.',
        en: 'Without governors, only the load stops the frequency drop: it would take hertz of deviation. The governors do most of the work; the load helps a little.',
      }),
    },
  ],

  equations: [
    {
      id: 'exp',
      title: { fr: 'Le modèle exponentiel', en: 'The exponential model' },
      tex: (c) => {
        const k = c.k as ExpLoadInfo;
        return `\\begin{aligned}
          P &= P_0\\,V^{\\alpha}\\,\\Bigl(1 + K_{pf}\\,\\tfrac{\\Delta f}{f_0}\\Bigr) = ${c.q(k.pF, 'pu', 4)} \\\\
          Q &= Q_0\\,V^{\\beta}\\,\\Bigl(1 + K_{qf}\\,\\tfrac{\\Delta f}{f_0}\\Bigr) = ${c.q(k.qV, 'pu', 3)} \\ (\\text{à } V_2)
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un seul exposant remplace les trois parts du ZIP : $\\alpha = 0$, 1, 2 redonnent P, I et Z constants. Ici $Q_0 = 0{,}4\\,P_0$ et $K_{qf} = -2$.',
          en: 'A single exponent replaces the three ZIP shares: $\\alpha = 0$, 1, 2 give back constant P, I and Z. Here $Q_0 = 0.4\\,P_0$ and $K_{qf} = -2$.',
        }),
    },
    {
      id: 'zip',
      title: { fr: 'Du ZIP à l’exposant', en: 'From ZIP to the exponent' },
      tex: (c) => `\\alpha \\approx \\left.\\frac{V}{P}\\frac{dP}{dV}\\right|_{V=1} = 2a_Z + a_I = ${c.q((c.k as ExpLoadInfo).alphaZip, '', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Les deux modèles coïncident pour de petites variations autour de 1 pu ; ils s’écartent pour de grands creux de tension. C’est aussi le facteur CVR de la leçon 4.6.',
          en: 'The two models agree for small changes around 1 pu; they part ways for deep voltage dips. This is also the CVR factor of lesson 4.6.',
        }),
    },
    {
      id: 'freq',
      title: { fr: 'L’autoréglage de la charge', en: 'Load self-regulation' },
      tex: (c) => {
        const k = c.k as ExpLoadInfo;
        return `\\Delta f_\\infty = -\\frac{\\Delta P\\,f_0}{K_{pf} + 1/s} = ${c.q(k.dfGov, 'Hz', 3)} \\quad (\\text{sans régulateurs : } ${c.q(k.dfNoGov, 'Hz', 3)})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les moteurs tournent moins vite quand la fréquence baisse : la charge diminue d’environ 1 à 2 % par pour cent de fréquence. En Europe continentale, on retient de l’ordre de 1 % de la charge par hertz.',
          en: 'Motors turn slower when frequency falls: the load drops by about 1–2 % per per cent of frequency. In continental Europe, a figure of about 1 % of load per hertz is used.',
        }),
    },
  ],

  steps: [
    {
      id: 'z',
      title: { fr: 'Retrouver l’impédance constante', en: 'Recovering constant impedance' },
      body: {
        fr: `Réglez l’exposant $\\alpha$ sur **2**. Après l’échelon à 0,95 pu, la puissance tombe à $0{,}95^2 \\approx 0{,}90$ : c’est une impédance constante.`,
        en: `Set the exponent $\\alpha$ to **2**. After the step to 0.95 pu, power falls to $0.95^2 \\approx 0.90$: a constant impedance.`,
      },
      check: (lab) => Math.abs(lab.params.alpha - 2) < 0.05,
    },
    {
      id: 'p',
      title: { fr: 'La puissance constante', en: 'Constant power' },
      body: {
        fr: `Mettez $\\alpha = 0$ : la puissance ne bouge plus avec la tension. C’est le comportement des alimentations électroniques régulées et, à long terme, des charges thermostatées.`,
        en: `Set $\\alpha = 0$: power no longer moves with voltage. This is how regulated electronic supplies behave and, in the long run, thermostat-controlled loads.`,
      },
      check: (lab) => lab.params.alpha <= 0.05,
    },
    {
      id: 'zip',
      title: { fr: 'L’équivalent du mélange ZIP', en: 'The ZIP mix equivalent' },
      body: {
        fr: `Le mélange de la leçon 4.6 (40 % Z, 30 % I, 30 % P) est tracé en vert. Trouvez l’exposant $\\alpha$ dont la courbe le colle autour de 1 pu.`,
        en: `The mix of lesson 4.6 (40 % Z, 30 % I, 30 % P) is drawn in green. Find the exponent $\\alpha$ whose curve hugs it around 1 pu.`,
      },
      check: (lab) => Math.abs(lab.params.alpha - (lab.info as ExpLoadInfo).alphaZip) < 0.05,
    },
    {
      id: 'q',
      title: { fr: 'Le réactif est plus sensible', en: 'Reactive power is more sensitive' },
      body: {
        fr: `Montez $\\beta$ à **3** ou plus. Le réactif chute bien plus vite que l’actif : moteurs (magnétisation) et éclairage à décharge ont des $\\beta$ de 2 à 5.`,
        en: `Raise $\\beta$ to **3** or more. Reactive power falls much faster than active power: motors (magnetising) and discharge lighting have $\\beta$ of 2 to 5.`,
      },
      check: (lab) => lab.params.beta >= 3,
    },
    {
      id: 'freq',
      title: { fr: 'La charge suit la fréquence', en: 'The load follows frequency' },
      body: {
        fr: `Réglez $K_{pf}$ = **2** et une baisse de fréquence de **0,5 Hz**. La puissance consommée baisse de 2 % : c’est l’autoréglage, un amortisseur naturel des écarts de fréquence.`,
        en: `Set $K_{pf}$ = **2** and a frequency drop of **0.5 Hz**. The power drawn falls by 2 %: this is self-regulation, a natural damper of frequency deviations.`,
      },
      check: (lab) => lab.params.Kpf >= 1.95 && lab.params.df <= -0.49,
    },
  ],
};
