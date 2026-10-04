// Module 7.5 — Batteries and fast frequency response: power against energy,
// response speed, droop against triggered FFR.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { bessInfo, bessModel, BESS_MODES, nadirOf, type BessInfo } from '../../lib/models/module7c';
import BessCanvas from './BessCanvas.svelte';

export const bessLesson: Experiment = {
  id: 'bess',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.5 Stockage', en: '7.5 Storage' },
  ],
  title: { fr: 'Les batteries au secours de la fréquence', en: 'Batteries to the rescue of frequency' },
  model: bessModel,
  info: bessInfo,
  canvas: BessCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'H', symbol: 'H', name: { fr: 'Inertie du réseau', en: 'System inertia' }, unit: 's', min: 1.5, max: 8, default: 4, scale: 'lin', term: 'S' },
    { id: 'Pb', symbol: 'P_b', name: { fr: 'Puissance de la batterie', en: 'Battery power' }, unit: 'MW', min: 0, max: 1000, default: 0, scale: 'lin', term: 'i' },
    { id: 'Eb', symbol: 'E_b', name: { fr: 'Énergie de la batterie', en: 'Battery energy' }, unit: 'MWh', min: 0.5, max: 50, default: 20, scale: 'log', term: 'i' },
    { id: 'tau', symbol: '\\tau_b', name: { fr: 'Temps de réponse', en: 'Response time' }, unit: 's', min: 0.05, max: 3, default: 0.2, scale: 'log', term: 'p' },
    {
      id: 'mode',
      symbol: '\\text{mode}',
      name: { fr: 'Mode de réponse', en: 'Response mode' },
      unit: '',
      min: 0,
      max: 1,
      default: BESS_MODES.droop,
      scale: 'lin',
      choices: [
        { value: BESS_MODES.droop, label: { fr: 'Statisme', en: 'Droop' } },
        { value: BESS_MODES.ffr, label: { fr: 'FFR déclenchée', en: 'Triggered FFR' } },
      ],
    },
  ],

  signals: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence (avec batterie)', en: 'Frequency (with battery)' }, unit: 'Hz', color: '--c-S', on: true, term: 'S' },
    { id: 'f0', symbol: 'f_0', name: { fr: 'Fréquence sans batterie', en: 'Frequency without battery' }, unit: 'Hz', color: '--c-S', on: true, dash: true },
    { id: 'pb', symbol: 'P_b', name: { fr: 'Puissance de la batterie', en: 'Battery power' }, unit: 'MW', color: '--c-i', on: true, term: 'i' },
    { id: 'pg', symbol: 'P_g', name: { fr: 'Réponse des alternateurs', en: 'Generator response' }, unit: 'MW', color: '--c-L', on: false, term: 'L' },
    { id: 'soc', symbol: '\\mathrm{SoC}', name: { fr: 'État de charge', en: 'State of charge' }, unit: '%', color: '--c-p', on: false, term: 'p' },
  ],

  charts: [
    {
      title: { fr: 'Creux de fréquence selon la puissance', en: 'Frequency nadir versus power' },
      x: { label: 'Pb', unit: 'MW', range: [0, 1000] },
      y: { label: 'f min', unit: 'Hz', range: [48.8, 50] },
      bands: () => [{ y0: 49.2, y1: 50 }],
      series: (lab) => [
        { label: { fr: 'statisme', en: 'droop' }, color: '--c-i', pts: Array.from({ length: 11 }, (_, j) => [j * 100, nadirOf({ ...lab.params, Pb: j * 100, mode: BESS_MODES.droop })] as [number, number]) },
        { label: { fr: 'FFR déclenchée', en: 'triggered FFR' }, color: '--c-p', pts: Array.from({ length: 11 }, (_, j) => [j * 100, nadirOf({ ...lab.params, Pb: j * 100, mode: BESS_MODES.ffr })] as [number, number]), dash: true },
      ],
      points: (lab) => [{ x: lab.params.Pb, y: (lab.info as BessInfo).nadir, color: '--accent' }],
      note: () => ({ fr: 'Zone verte : au-dessus de 49,2 Hz, le seuil des premiers délestages dans plusieurs pays.', en: 'Green zone: above 49.2 Hz, the first load-shedding threshold in several countries.' }),
    },
    {
      title: { fr: 'Creux de fréquence selon la rapidité', en: 'Frequency nadir versus speed' },
      x: { label: 'τb', unit: 's', range: [0.05, 3], log: true },
      y: { label: 'f min', unit: 'Hz', range: [48.8, 50] },
      series: (lab) => [
        {
          color: '--c-i',
          pts: Array.from({ length: 9 }, (_, j) => {
            const tau = 0.05 * 60 ** (j / 8);
            return [tau, nadirOf({ ...lab.params, tau })] as [number, number];
          }),
        },
      ],
      points: (lab) => [{ x: lab.params.tau, y: (lab.info as BessInfo).nadir, color: '--accent' }],
      note: () => ({ fr: 'Le creux se joue dans les premières secondes : une réponse lente arrive trop tard, quelle que soit sa puissance.', en: 'The nadir is decided in the first seconds: a slow response arrives too late, whatever its power.' }),
    },
  ],

  predict: {
    signal: 'f',
    yRange: () => [48.8, 50.2],
    diagnose(pred, run) {
      const nadir = Math.min(...Array.from(run.s.f));
      const kN = Array.from(run.s.f).indexOf(nadir);
      const tN = run.t[kN];
      const mine = pred.reduce((m, [t, y]) => (y < m[1] ? [t, y] : m), [0, Infinity]);
      if (mine[0] > tN + 8)
        return {
          fr: 'La fréquence ne descend pas jusqu’à la fin : elle atteint un **creux** en quelques secondes, quand la réponse des alternateurs et des batteries égale la perte, puis remonte vers un nouveau palier (sous 50 Hz : c’est le réglage secondaire qui la ramène, plus tard).',
          en: 'Frequency does not keep falling: it reaches a **nadir** within seconds, when the response of generators and batteries matches the loss, then recovers to a new plateau (below 50 Hz: secondary control brings it back later).',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'swing',
      title: { fr: 'L’équation du réseau', en: 'The system equation' },
      tex: (c) => `\\frac{2H S}{f_0}\\frac{df}{dt} = P_g + P_b - P_{perte} - D\\,\\frac{S}{f_0}\\Delta f, \\qquad \\left.\\frac{df}{dt}\\right|_{0^+} = ${c.q((c.k as BessInfo).rocof, 'Hz/s', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'C’est l’équation du mouvement de la leçon 3.3, appliquée au réseau entier. L’inertie fixe la pente initiale ; tout le reste dépend de la vitesse des réponses.',
          en: 'This is the swing equation of lesson 3.3, applied to the whole system. Inertia sets the initial slope; everything else depends on how fast the responses are.',
        }),
    },
    {
      id: 'nadir',
      title: { fr: 'Le creux', en: 'The nadir' },
      tex: (c) => {
        const k = c.k as BessInfo;
        return `f_{min} = ${c.q(k.nadir, 'Hz', 4)}, \\qquad \\text{sans batterie: } ${c.q(k.nadirNoBess, 'Hz', 4)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les alternateurs répondent en plusieurs secondes (vannes, chaudières). Une batterie répond en moins d’une seconde : peu d’énergie, mais au bon moment.',
          en: 'Generators respond within several seconds (valves, boilers). A battery responds in under a second: little energy, but at the right time.',
        }),
    },
    {
      id: 'energy',
      title: { fr: 'Puissance contre énergie', en: 'Power versus energy' },
      tex: (c) => {
        const k = c.k as BessInfo;
        return `E_{utilisée} = ${c.q(k.energyUsed, 'MWh', 3)}, \\qquad \\mathrm{SoC}_{fin} = ${c.q(k.soc, '%', 3)}${k.empty ? ',\\ \\text{vide à } t = ' + c.q(k.tEmpty ?? 0, 's', 3) : ''}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une batterie se dimensionne en puissance (MW) et en énergie (MWh). Pour le réglage de fréquence, quelques minutes d’autonomie suffisent ; mais une batterie vide en plein événement provoque un second creux.',
          en: 'A battery is sized in power (MW) and energy (MWh). For frequency response a few minutes of autonomy is enough; but a battery that empties mid-event causes a second dip.',
        }),
    },
    {
      id: 'modes',
      title: { fr: 'Statisme ou FFR', en: 'Droop or FFR' },
      tex: () => `\\begin{aligned} &\\text{statisme: } P_b = -\\frac{\\Delta f - \\text{bande morte}}{0{,}5\\ \\text{Hz}} P_n \\\\ &\\text{FFR: } P_b = P_n \\text{ pendant 10 s dès } f < 49{,}8\\ \\text{Hz, puis rampe} \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Le statisme répond proportionnellement, en continu. La FFR (« Fast Frequency Response ») déclenche toute la puissance dès qu’un seuil est franchi, comme les services « Dynamic Containment » au Royaume-Uni ou « FFR » en Australie.',
          en: 'Droop responds proportionally, continuously. FFR (Fast Frequency Response) releases full power once a threshold is crossed, like the “Dynamic Containment” service in the UK or “FFR” in Australia.',
        }),
    },
    {
      id: 'markets',
      title: { fr: 'Services système', en: 'Ancillary services' },
      personas: ['utility', 'research'],
      tex: () => `\\text{FFR (< 1 s)} \\;\\to\\; \\text{FCR (< 30 s)} \\;\\to\\; \\text{aFRR (< 5 min)} \\;\\to\\; \\text{mFRR}`,
      note: (c) =>
        c.tr({
          fr: 'Les réserves s’échelonnent dans le temps. Moins il y a d’inertie, plus les réserves rapides doivent être grandes : c’est l’un des arbitrages au cœur de la transition (module 8.3).',
          en: 'Reserves are staggered in time. The less inertia, the larger the fast reserves must be: one of the trade-offs at the heart of the transition (Module 8.3).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence', en: 'Predict the frequency' },
      body: {
        fr: `Un réseau de 30 GW perd brutalement une centrale de 1 GW à $t = 1$ s. **Dessinez la fréquence** sur une minute, puis révélez.`,
        en: `A 30 GW system suddenly loses a 1 GW plant at $t = 1$ s. **Sketch the frequency** over a minute, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'add',
      title: { fr: 'Ajouter une batterie', en: 'Adding a battery' },
      body: {
        fr: `Ajoutez une batterie de **500 MW** ou plus en statisme. Le creux remonte d’au moins **0,1 Hz**.`,
        en: `Add a battery of **500 MW** or more in droop mode. The nadir rises by at least **0.1 Hz**.`,
      },
      check: (lab) => {
        const k = lab.info as BessInfo;
        return lab.params.Pb >= 500 && k.nadir > k.nadirNoBess + 0.1;
      },
    },
    {
      id: 'slow',
      title: { fr: 'Trop lente', en: 'Too slow' },
      body: {
        fr: `Ralentissez la batterie à **2 s** de temps de réponse ou plus : son effet sur le creux fond, bien qu’elle ait toujours la même puissance.`,
        en: `Slow the battery to a response time of **2 s** or more: its effect on the nadir melts away, although it still has the same power.`,
      },
      check: (lab) => lab.params.tau >= 2 && lab.params.Pb >= 300,
    },
    {
      id: 'empty',
      title: { fr: 'À court d’énergie', en: 'Running out of energy' },
      body: {
        fr: `Revenez à une réponse rapide et réduisez l’énergie à **2 MWh** ou moins : la batterie se vide en quelques secondes, la fréquence replonge.`,
        en: `Go back to a fast response and reduce the energy to **2 MWh** or less: the battery empties within seconds, and the frequency dips again.`,
      },
      check: (lab) => lab.params.tau < 0.5 && (lab.info as BessInfo).empty,
    },
    {
      id: 'ffr',
      title: { fr: 'La FFR', en: 'FFR' },
      body: {
        fr: `Avec assez d’énergie (≥ 10 MWh), passez en **FFR déclenchée** : toute la puissance part dès 49,8 Hz.`,
        en: `With enough energy (≥ 10 MWh), switch to **triggered FFR**: full power is released at 49.8 Hz.`,
      },
      check: (lab) => lab.params.mode === BESS_MODES.ffr && lab.params.Eb >= 10 && lab.params.Pb >= 300,
    },
    {
      id: 'inertia',
      title: { fr: 'Moins d’inertie', en: 'Less inertia' },
      body: {
        fr: `Baissez l’inertie du réseau à **2 s** (beaucoup d’éolien et de solaire) : sans batterie, le creux tombe vers 49,2 Hz. Trouvez la puissance de batterie qui le ramène au-dessus de **49,4 Hz**, comme avec 4 s d’inertie.`,
        en: `Lower the system inertia to **2 s** (lots of wind and solar): without a battery the nadir falls to about 49.2 Hz. Find the battery power that brings it back above **49.4 Hz**, as with 4 s of inertia.`,
      },
      check: (lab) => lab.params.H <= 2 && (lab.info as BessInfo).nadir >= 49.4,
    },
  ],
};
