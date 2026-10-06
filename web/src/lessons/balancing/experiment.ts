// Module 9.2 — Balancing: FCR, aFRR and mFRR after a plant trips, in an interconnected system.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { AREA, BAL, balInfo, balModel, type BalInfo } from '../../lib/models/module9';
import BalancingCanvas from './BalancingCanvas.svelte';

export const balancingLesson: Experiment = {
  id: 'balancing',
  path: [
    { fr: 'Module 9 · Le gestionnaire du réseau de transport', en: 'Module 9 · The transmission system operator' },
    { fr: '9.2 Équilibre et réglages de fréquence', en: '9.2 Balancing and frequency control' },
  ],
  title: { fr: 'Une centrale déclenche : qui compense, et dans quel ordre ?', en: 'A plant trips: who makes up for it, and in what order?' },
  model: balModel,
  info: balInfo,
  canvas: BalancingCanvas,
  instruments: [Chart0],

  params: [
    { id: 'inc', symbol: '\\Delta P', name: { fr: 'Production perdue', en: 'Generation lost' }, unit: 'MW', min: 200, max: 3000, default: 1000, scale: 'lin', term: 'p' },
    {
      id: 'area',
      sweep: false,
      symbol: 'Z',
      name: { fr: 'Où a lieu l’incident', en: 'Where the incident happens' },
      unit: '',
      min: 0,
      max: 1,
      default: AREA.fr,
      scale: 'lin',
      choices: [
        { value: AREA.fr, label: { fr: 'En France', en: 'In France' } },
        { value: AREA.ce, label: { fr: 'Chez un voisin', en: 'In a neighbouring country' } },
      ],
    },
    {
      id: 'afrr',
      sweep: false,
      symbol: 'aFRR',
      name: { fr: 'Réglage secondaire (aFRR)', en: 'Secondary control (aFRR)' },
      unit: '',
      min: 0,
      max: 1,
      default: 1,
      scale: 'lin',
      choices: [
        { value: 1, label: { fr: 'En service', en: 'On' } },
        { value: 0, label: { fr: 'Hors service', en: 'Off' } },
      ],
    },
    { id: 'Tr', symbol: 'T_r', name: { fr: 'Temps d’intégration du réglage secondaire', en: 'Secondary-control integral time' }, unit: 's', min: 50, max: 400, default: 150, scale: 'log', term: 'L' },
    { id: 'tm', symbol: 't_m', name: { fr: 'Délai avant l’appel de l’mFRR (ajustement)', en: 'Delay before mFRR is called (balancing mechanism)' }, unit: 's', min: 60, max: 900, default: 300, scale: 'lin', term: 'C' },
  ],

  signals: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', color: '--c-i', on: true, term: 'i' },
    { id: 'tie', symbol: '\\Delta P_{ech}', name: { fr: 'Écart d’échanges de la France (export +)', en: 'France’s interchange deviation (export +)' }, unit: 'MW', color: '--c-S', on: true, term: 'S' },
    { id: 'fcr', symbol: 'FCR', name: { fr: 'Réglage primaire en France', en: 'Primary control in France' }, unit: 'MW', color: '--c-p', on: true, term: 'p' },
    { id: 'afrr', symbol: 'aFRR', name: { fr: 'Réglage secondaire en France', en: 'Secondary control in France' }, unit: 'MW', color: '--c-L', on: true, term: 'L' },
    { id: 'mfrr', symbol: 'mFRR', name: { fr: 'Ajustement (mFRR) en France', en: 'Balancing energy (mFRR) in France' }, unit: 'MW', color: '--c-C', on: true, term: 'C' },
  ],

  charts: [
    {
      title: { fr: 'Les trois réglages : ordres de grandeur', en: 'The three controls: orders of magnitude' },
      x: { label: 't', unit: 's', range: [1, 3600], log: true },
      y: { label: 'part', unit: '%', range: [0, 105] },
      series: () => {
        const ramp = (t0: number, t1: number): [number, number][] => {
          const pts: [number, number][] = [];
          for (let t = 1; t <= 3600; t *= 1.15) pts.push([t, t < t0 ? 0 : t > t1 ? 100 : (100 * Math.log(t / t0)) / Math.log(t1 / t0)]);
          return pts;
        };
        return [
          { label: { fr: 'FCR : quelques secondes à 30 s', en: 'FCR: seconds to 30 s' }, color: '--c-p', pts: ramp(2, 30) },
          { label: { fr: 'aFRR : 30 s à quelques minutes', en: 'aFRR: 30 s to a few minutes' }, color: '--c-L', pts: ramp(30, 300) },
          { label: { fr: 'mFRR : quelques minutes à 15 min', en: 'mFRR: minutes to 15 min' }, color: '--c-C', pts: ramp(300, 900) },
        ];
      },
      vlines: (lab) => [{ x: Math.max(1, lab.t - BAL.tInc), label: 't' }],
      note: () => ({
        fr: 'Les produits européens fixent des délais de mobilisation complète : FCR en 30 s, aFRR en 5 min (plateforme PICASSO), mFRR en 12,5 min (plateforme MARI).',
        en: 'European products set full-activation times: FCR in 30 s, aFRR in 5 min (PICASSO platform), mFRR in 12.5 min (MARI platform).',
      }),
    },
  ],

  predict: {
    signal: 'f',
    yRange: () => [49.85, 50.05],
    diagnose(pred, run) {
      const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
      const mid = avg(pred.filter(([t]) => t > 60 && t < 120).map(([, y]) => y));
      const end = avg(pred.filter(([t]) => t > 900).map(([, y]) => y));
      const truthEnd = run.s.f[run.s.f.length - 1];
      if (mid >= 49.995 && pred.some(([t]) => t > 60 && t < 120))
        return {
          fr: 'Le réglage primaire **arrête** la chute mais ne ramène pas 50 Hz : il est proportionnel. Pendant une minute ou deux, la fréquence reste un peu basse, le temps que le réglage secondaire agisse.',
          en: 'Primary control **stops** the drop but does not bring back 50 Hz: it is proportional. For a minute or two the frequency stays a little low, until secondary control acts.',
        };
      if (end < truthEnd - 0.02)
        return {
          fr: 'La fréquence revient bien à **50 Hz** : le réglage secondaire de la zone en déficit intègre l’écart jusqu’à l’annuler, puis l’ajustement (mFRR) prend le relais.',
          en: 'The frequency does come back to **50 Hz**: the secondary control of the area in deficit integrates the error until it is gone, then the mFRR takes over.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'lambda',
      title: { fr: 'Énergie réglante et réglage primaire', en: 'Network power frequency characteristic and primary control' },
      tex: (c) => {
        const k = c.k as BalInfo;
        return `\\lambda = \\frac{\\text{FCR}}{200\\ \\text{mHz}} + D\\,P_L \\approx ${c.q(k.lambda, '\\text{MW/Hz}', 3)}, \\qquad \\Delta f_{\\infty} \\approx -\\frac{\\Delta P}{\\lambda} = ${c.q(-c.p.inc / k.lambda * 1000, '\\text{mHz}', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Toute l’Europe continentale répond ensemble, chaque pays au prorata de sa part de FCR (environ 3 000 MW au total, dont environ 540 MW en France). L’incident de dimensionnement est la perte de 3 000 MW.',
          en: 'All of continental Europe responds together, each country in proportion to its FCR share (about 3,000 MW in total, about 540 MW of them in France). The design incident is a 3,000 MW loss.',
        }),
    },
    {
      id: 'ace',
      title: { fr: 'L’écart de réglage de zone (ACE)', en: 'The area control error (ACE)' },
      tex: () => `\\text{ACE} = \\Delta P_{ech} + \\lambda_{zone}\\,\\Delta f, \\qquad \\text{aFRR} = -\\frac{1}{T_r}\\int \\text{ACE}\\,dt`,
      note: (c) =>
        c.tr({
          fr: 'Chaque zone corrige **son propre** déséquilibre : si l’incident est chez un voisin, l’écart d’échanges et le terme de fréquence se compensent et l’ACE français reste nul. C’est le principe de non-intervention.',
          en: 'Each area corrects **its own** imbalance: if the incident is abroad, the interchange deviation and the frequency term cancel and France’s ACE stays at zero. This is the non-intervention principle.',
        }),
    },
    {
      id: 'mfrr',
      title: { fr: 'L’ajustement libère le secondaire', en: 'Balancing energy frees the secondary reserve' },
      tex: (c) => {
        const k = c.k as BalInfo;
        return `\\text{aFRR}_{max} = ${c.q(k.afrrMax, 'MW', 3)}, \\qquad \\text{aFRR}(t_{fin}) = ${c.q(k.afrrEnd, 'MW', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le dispatcher active des offres d’ajustement (mFRR, mécanisme d’ajustement) pour reconstituer la réserve secondaire, prête pour l’incident suivant.',
          en: 'The dispatcher activates balancing offers (mFRR, the balancing mechanism) to rebuild the secondary reserve, ready for the next incident.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence', en: 'Predict the frequency' },
      body: {
        fr: `À $t = 10$ s, une tranche de **1 000 MW** déclenche en France. L’Europe continentale tourne à 50 Hz avec environ 3 000 MW de réserve primaire. **Dessinez la fréquence** sur 20 minutes, puis révélez.`,
        en: `At $t = 10$ s, a **1,000 MW** unit trips in France. Continental Europe runs at 50 Hz with about 3,000 MW of primary reserve. **Sketch the frequency** over 20 minutes, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'nosec',
      title: { fr: 'Sans réglage secondaire', en: 'Without secondary control' },
      body: {
        fr: `Mettez le réglage secondaire **hors service**. La fréquence reste basse et la France **importe** 800 MW de ses voisins tant que l’ajustement n’est pas appelé.`,
        en: `Turn secondary control **off**. The frequency stays low and France **imports** 800 MW from its neighbours until balancing energy is called.`,
      },
      check: (lab) => lab.params.afrr === 0 && lab.params.area === AREA.fr,
    },
    {
      id: 'abroad',
      title: { fr: 'L’incident est chez un voisin', en: 'The incident is abroad' },
      body: {
        fr: `Remettez le secondaire en service et placez l’incident **chez un voisin**. La France aide avec sa réserve primaire, mais son réglage secondaire **ne bouge pas**.`,
        en: `Turn secondary control back on and put the incident **abroad**. France helps with its primary reserve, but its secondary control **does not move**.`,
      },
      check: (lab) => lab.params.afrr === 1 && lab.params.area === AREA.ce && (lab.info as BalInfo).afrrMax < 20,
    },
    {
      id: 'reference',
      title: { fr: 'L’incident de référence', en: 'The reference incident' },
      body: {
        fr: `Revenez en France et perdez **3 000 MW**, l’incident de dimensionnement de l’Europe continentale. La fréquence quasi stationnaire doit rester au-dessus de **49,8 Hz**.`,
        en: `Go back to France and lose **3,000 MW**, continental Europe’s design incident. The quasi-steady frequency must stay above **49.8 Hz**.`,
      },
      check: (lab) => lab.params.area === AREA.fr && lab.params.inc >= 2950 && (lab.info as BalInfo).fQuasi > 49.8,
    },
    {
      id: 'release',
      title: { fr: 'Libérer la réserve secondaire', en: 'Freeing the secondary reserve' },
      body: {
        fr: `Avec 1 000 MW perdus en France, appelez l’ajustement (mFRR) **dès 2 minutes** après l’incident. Le réglage secondaire redescend vers zéro avant la fin des 20 minutes.`,
        en: `With 1,000 MW lost in France, call balancing energy (mFRR) **within 2 minutes** of the incident. Secondary control comes back down towards zero before the 20 minutes are up.`,
      },
      check: (lab) => lab.params.area === AREA.fr && lab.params.afrr === 1 && lab.params.inc <= 1100 && lab.params.tm <= 125 && Math.abs((lab.info as BalInfo).afrrEnd) < 15,
    },
  ],
};
