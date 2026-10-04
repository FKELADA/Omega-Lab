// Module 6.1 — DC–DC choppers at switching level: buck, boost, buck-boost,
// ripple, CCM and DCM.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { CHOPPER, chopper, chopperInfo, CONVERTERS, idealRatio, Lcrit, type ChopperInfo } from '../../lib/models/module6';
import ChopperCanvas from './ChopperCanvas.svelte';

const curve = (f: (D: number) => number, a = 0.02, b = 0.95): [number, number][] => {
  const pts: [number, number][] = [];
  for (let D = a; D <= b + 1e-9; D += 0.01) pts.push([D, f(D)]);
  return pts;
};

export const chopperLesson: Experiment = {
  id: 'chopper',
  path: [
    { fr: 'Module 6 · Électronique de puissance', en: 'Module 6 · Power electronics' },
    { fr: '6.1 Hacheurs', en: '6.1 Choppers' },
  ],
  title: { fr: 'Les hacheurs : changer une tension continue en découpant', en: 'Choppers: changing a DC voltage by switching' },
  model: chopper,
  info: chopperInfo,
  canvas: ChopperCanvas,
  instruments: [Chart0, Chart1],

  params: [
    {
      id: 'type',
      symbol: '\\text{type}',
      name: { fr: 'Montage', en: 'Topology' },
      unit: '',
      min: 0,
      max: 2,
      default: CONVERTERS.buck,
      scale: 'lin',
      choices: [
        { value: CONVERTERS.buck, label: { fr: 'Abaisseur', en: 'Buck' } },
        { value: CONVERTERS.boost, label: { fr: 'Élévateur', en: 'Boost' } },
        { value: CONVERTERS.buckboost, label: { fr: 'Inverseur', en: 'Buck-boost' } },
      ],
    },
    { id: 'D', symbol: 'D', name: { fr: 'Rapport cyclique', en: 'Duty cycle' }, unit: '', min: 0.05, max: 0.9, default: 0.5, scale: 'lin', term: 'S' },
    { id: 'fs', symbol: 'f_s', name: { fr: 'Fréquence de découpage', en: 'Switching frequency' }, unit: 'kHz', min: 5, max: 100, default: 20, scale: 'log', term: 'p' },
    { id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'µH', min: 10, max: 2000, default: 200, scale: 'log', term: 'L' },
    { id: 'C', symbol: 'C', name: { fr: 'Condensateur de sortie', en: 'Output capacitor' }, unit: 'µF', min: 10, max: 1000, default: 220, scale: 'log', term: 'C' },
    { id: 'R', symbol: 'R', name: { fr: 'Charge', en: 'Load' }, unit: 'Ω', min: 2, max: 100, default: 10, scale: 'log', term: 'R' },
  ],

  signals: [
    { id: 'iL', symbol: 'i_L', name: { fr: 'Courant dans l’inductance', en: 'Inductor current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'vout', symbol: 'v_s', name: { fr: 'Tension de sortie', en: 'Output voltage' }, unit: 'V', color: '--c-C', on: true, term: 'C' },
    { id: 'vL', symbol: 'v_L', name: { fr: 'Tension aux bornes de L', en: 'Inductor voltage' }, unit: 'V', color: '--c-L', on: false, term: 'L' },
    { id: 'q', symbol: 'q', name: { fr: 'Commande de l’interrupteur', en: 'Switch command' }, unit: '', color: '--c-S', on: true, dash: true, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Rapport de conversion selon D', en: 'Conversion ratio versus D' },
      x: { label: 'D', range: [0, 1] },
      y: { label: 'Vs/Ve', range: [0, 6] },
      series: () => [
        { label: { fr: 'abaisseur : D', en: 'buck: D' }, color: '--c-C', pts: curve((D) => idealRatio(0, D)) },
        { label: { fr: 'élévateur : 1/(1−D)', en: 'boost: 1/(1−D)' }, color: '--c-R', pts: curve((D) => idealRatio(1, D)) },
        { label: { fr: 'inverseur : D/(1−D)', en: 'buck-boost: D/(1−D)' }, color: '--c-p', pts: curve((D) => idealRatio(2, D)) },
      ],
      points: (lab) => [{ x: lab.params.D, y: (lab.info as ChopperInfo).ratio, color: '--accent' }],
      note: (lab) =>
        (lab.info as ChopperInfo).dcm
          ? { fr: 'En conduction discontinue, le point quitte la courbe idéale : le rapport dépend alors de la charge.', en: 'In discontinuous conduction the point leaves the ideal curve: the ratio then depends on the load.' }
          : { fr: 'En conduction continue, le rapport ne dépend que de D.', en: 'In continuous conduction the ratio depends only on D.' },
    },
    {
      title: { fr: 'Frontière CCM / DCM', en: 'CCM / DCM boundary' },
      x: { label: 'D', range: [0, 1] },
      y: { label: 'L', unit: 'µH', range: [1, 10000], log: true },
      series: (lab) => [
        {
          label: { fr: 'inductance critique', en: 'critical inductance' },
          color: '--warn',
          pts: curve((D) => Math.max(1, Lcrit(lab.params.type, D, lab.params.R, lab.params.fs * 1e3) * 1e6)),
        },
        { label: { fr: 'L choisie', en: 'chosen L' }, color: '--c-L', pts: [[0, lab.params.L], [1, lab.params.L]], dash: true },
      ],
      points: (lab) => [{ x: lab.params.D, y: lab.params.L, color: (lab.info as ChopperInfo).dcm ? '--warn' : '--c-L' }],
      note: () => ({ fr: 'Sous la courbe orange, le courant s’annule à chaque période : conduction discontinue.', en: 'Below the orange curve, the current reaches zero every period: discontinuous conduction.' }),
    },
  ],

  predict: {
    signal: 'iL',
    yRange: () => [0, 6],
    diagnose(pred, run) {
      const ys = pred.map(([, y]) => y);
      const truth = Array.from(run.s.iL);
      const spread = Math.max(...truth) - Math.min(...truth);
      if (ys.length > 5 && Math.max(...ys) - Math.min(...ys) < 0.3 * spread)
        return {
          fr: 'Le courant n’est pas constant : il **monte** quand l’interrupteur est fermé ($v_L = V_e - V_s > 0$) et **descend** quand il est ouvert ($v_L = -V_s$). C’est un triangle autour de la valeur moyenne : l’**ondulation** $\\Delta i_L = V_s(1-D)/(L f_s)$.',
          en: 'The current is not constant: it **rises** while the switch is on ($v_L = V_{in} - V_{out} > 0$) and **falls** while it is off ($v_L = -V_{out}$). It is a triangle around its mean: the **ripple** $\\Delta i_L = V_{out}(1-D)/(L f_s)$.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'volt-second',
      title: { fr: 'Équilibre des volts-secondes', en: 'Volt-second balance' },
      tex: (c) => {
        const k = c.k as ChopperInfo;
        return `\\langle v_L \\rangle = 0 \\;\\Rightarrow\\; \\frac{V_s}{V_e} = ${['D', '\\frac{1}{1-D}', '\\frac{D}{1-D}'][c.p.type]} = ${c.q(k.ideal, '', 3)}, \\qquad \\text{mesuré : } ${c.q(k.ratio, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'En régime établi, le courant de l’inductance revient à la même valeur à chaque période : la tension moyenne à ses bornes est nulle. Cette seule idée donne le rapport de conversion.',
          en: 'In steady state the inductor current returns to the same value every period: the average voltage across it is zero. That single idea gives the conversion ratio.',
        }),
    },
    {
      id: 'ripple',
      title: { fr: 'Ondulations', en: 'Ripple' },
      tex: (c) => {
        const k = c.k as ChopperInfo;
        return `\\Delta i_L = ${c.q(k.dIL, 'A', 3)}, \\qquad \\Delta v_s = ${c.q(k.dV, 'V', 3)}, \\qquad \\Delta i_L^{buck} = \\frac{V_s(1-D)}{L f_s}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Augmenter $f_s$ ou $L$ réduit l’ondulation. Mais plus de découpage, ce sont plus de pertes de commutation ; plus de $L$, c’est plus de cuivre et de volume.',
          en: 'Raising $f_s$ or $L$ reduces ripple. But more switching means more switching losses; more $L$ means more copper and volume.',
        }),
    },
    {
      id: 'dcm',
      title: { fr: 'Conduction discontinue', en: 'Discontinuous conduction' },
      tex: (c) => {
        const k = c.k as ChopperInfo;
        return `L_{crit} = ${['\\frac{(1-D)R}{2f_s}', '\\frac{D(1-D)^2R}{2f_s}', '\\frac{(1-D)^2R}{2f_s}'][c.p.type]} = ${c.q(k.Lcrit * 1e6, 'µH', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'À faible charge, le courant moyen devient plus petit que la moitié de l’ondulation : il s’annule avant la fin de la période, la diode se bloque, et la tension de sortie monte au-delà du rapport idéal.',
          en: 'At light load the mean current becomes smaller than half the ripple: it reaches zero before the period ends, the diode blocks, and the output voltage rises above the ideal ratio.',
        }),
    },
    {
      id: 'switches',
      title: { fr: 'Les interrupteurs', en: 'The switches' },
      personas: ['research', 'utility'],
      tex: () => `\\text{diode : spontanée}, \\quad \\text{thyristor : amorçage commandé}, \\quad \\text{IGBT / MOSFET : amorçage et blocage commandés}`,
      note: (c) =>
        c.tr({
          fr: 'Ici, un interrupteur commandé (MOSFET ou IGBT) et une diode. En remplaçant la diode par un second transistor (redressement synchrone), le courant peut s’inverser : le hacheur devient réversible, base des chargeurs de batterie et des bus continus.',
          en: 'Here, a controlled switch (MOSFET or IGBT) and a diode. Replacing the diode with a second transistor (synchronous rectification) lets the current reverse: the chopper becomes bidirectional, the basis of battery chargers and DC buses.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le courant de l’inductance', en: 'Predict the inductor current' },
      body: {
        fr: `Un abaisseur convertit ${CHOPPER.Vin} V en 24 V ($D = 0{,}5$) pour une charge de 10 Ω. **Dessinez le courant dans l’inductance** sur quelques périodes de découpage, puis révélez.`,
        en: `A buck converter turns ${CHOPPER.Vin} V into 24 V ($D = 0.5$) for a 10 Ω load. **Sketch the inductor current** over a few switching periods, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'ratio',
      title: { fr: 'Régler la tension', en: 'Setting the voltage' },
      body: {
        fr: `Avec l’abaisseur, obtenez **12 V** en sortie (à 1 V près). Il suffit de régler $D$ : $V_s = D\\,V_e$.`,
        en: `With the buck, get **12 V** at the output (within 1 V). Just set $D$: $V_{out} = D\\,V_{in}$.`,
      },
      check: (lab) => lab.params.type === CONVERTERS.buck && Math.abs((lab.info as ChopperInfo).Vout - 12) < 1 && !(lab.info as ChopperInfo).dcm,
    },
    {
      id: 'boost',
      title: { fr: 'Élever la tension', en: 'Stepping up' },
      body: {
        fr: `Passez à l’**élévateur** et obtenez au moins **96 V**. L’inductance stocke de l’énergie quand l’interrupteur est fermé et la restitue, en plus de la source, quand il s’ouvre.`,
        en: `Switch to the **boost** and get at least **96 V**. The inductor stores energy while the switch is on and releases it, on top of the source, when it opens.`,
      },
      check: (lab) => lab.params.type === CONVERTERS.boost && (lab.info as ChopperInfo).Vout >= 95,
    },
    {
      id: 'dcm',
      title: { fr: 'Conduction discontinue', en: 'Discontinuous conduction' },
      body: {
        fr: `Réduisez l’inductance ou allégez la charge (R plus grande) jusqu’à ce que le courant **s’annule** à chaque période. La tension de sortie s’écarte alors de la formule idéale.`,
        en: `Reduce the inductance or lighten the load (larger R) until the current **drops to zero** every period. The output voltage then departs from the ideal formula.`,
      },
      check: (lab) => (lab.info as ChopperInfo).dcm,
    },
    {
      id: 'ripple',
      title: { fr: 'Lisser le courant', en: 'Smoothing the current' },
      body: {
        fr: `Revenez en conduction continue avec une ondulation de courant inférieure à **10 %** du courant moyen, en jouant sur $f_s$ et $L$.`,
        en: `Return to continuous conduction with a current ripple below **10 %** of the mean current, using $f_s$ and $L$.`,
      },
      check: (lab) => {
        const k = lab.info as ChopperInfo;
        return !k.dcm && k.dIL < 0.1 * k.IL;
      },
    },
    {
      id: 'buckboost',
      title: { fr: 'L’inverseur', en: 'The buck-boost' },
      body: {
        fr: `Choisissez l’**inverseur** avec $D > 0{,}5$ : il élève la tension (en l’inversant). Avec $D < 0{,}5$, il l’abaisse. Un seul montage pour les deux, au prix de courants plus forts.`,
        en: `Choose the **buck-boost** with $D > 0.5$: it steps the voltage up (and inverts it). With $D < 0.5$, it steps down. One circuit for both, at the cost of larger currents.`,
      },
      check: (lab) => lab.params.type === CONVERTERS.buckboost && lab.params.D > 0.5 && (lab.info as ChopperInfo).Vout > CHOPPER.Vin,
    },
  ],
};
