// Module 9.5 — The defence plan: under-frequency load shedding after a large generation deficit.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { DEF, defInfo, defModel, type DefInfo } from '../../lib/models/module9';
import DefenceCanvas from './DefenceCanvas.svelte';

export const defenceLesson: Experiment = {
  id: 'defence',
  path: [
    { fr: 'Module 9 · Le gestionnaire du réseau de transport', en: 'Module 9 · The transmission system operator' },
    { fr: '9.5 Stabilité et plan de défense', en: '9.5 Stability and the defence plan' },
  ],
  title: { fr: 'Quand la réserve ne suffit plus : le délestage fréquencemétrique', en: 'When reserves are not enough: under-frequency load shedding' },
  model: defModel,
  info: defInfo,
  canvas: DefenceCanvas,
  instruments: [Chart0],

  params: [
    { id: 'deficit', symbol: '\\Delta P', name: { fr: 'Déficit de production (séparation de réseau)', en: 'Generation deficit (system split)' }, unit: '%', min: 2, max: 40, default: 15, scale: 'lin', term: 'p' },
    { id: 'H', symbol: 'H', name: { fr: 'Inertie du système', en: 'System inertia' }, unit: 's', min: 1, max: 6, default: 4, scale: 'lin', term: 'L' },
    { id: 'f1', symbol: 'f_1', name: { fr: 'Seuil du premier échelon', en: 'First-stage threshold' }, unit: 'Hz', min: 48.6, max: 49.6, default: 49, scale: 'lin', term: 'S' },
    { id: 'step', symbol: '\\delta', name: { fr: 'Charge délestée par échelon (6 échelons)', en: 'Load shed per stage (6 stages)' }, unit: '%', min: 0, max: 15, default: 7.5, scale: 'lin', term: 'R' },
  ],

  signals: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', color: '--c-i', on: true, term: 'i' },
    { id: 'shed', symbol: 'P_{del}', name: { fr: 'Charge délestée', en: 'Load shed' }, unit: '%', color: '--c-R', on: true, term: 'R' },
    { id: 'pm', symbol: '\\Delta P_m', name: { fr: 'Réserve primaire mobilisée', en: 'Primary reserve deployed' }, unit: '%', color: '--c-p', on: true, term: 'p' },
  ],

  charts: [
    {
      title: { fr: 'Le plan de délestage', en: 'The shedding plan' },
      x: { label: 'f', unit: 'Hz', range: [47.4, 50.1] },
      y: { label: 'P_del', unit: '%', range: [0, 95] },
      series: (lab) => {
        const pts: [number, number][] = [[50.1, 0]];
        for (let s = 0; s < DEF.stages; s++) {
          const thr = lab.params.f1 - s * DEF.gap;
          pts.push([thr, s * lab.params.step], [thr, (s + 1) * lab.params.step]);
        }
        pts.push([47.4, DEF.stages * lab.params.step]);
        return [
          { label: { fr: 'délestage cumulé', en: 'cumulative shedding' }, color: '--c-R', pts },
          { label: { fr: 'découplage des groupes (47,5 Hz)', en: 'generators disconnect (47.5 Hz)' }, color: '--c-i', pts: [[47.5, 0], [47.5, 95]], dash: true, width: 1.2 },
        ];
      },
      points: (lab) => [{ x: Math.max(47.4, Math.min(50.1, lab.at('f') || 47.4)), y: lab.at('shed'), color: '--accent' }],
      note: () => ({
        fr: 'Le code européen (NC ER) demande, pour l’Europe continentale, de délester 45 % ± 7 % de la charge entre 49 Hz et 48 Hz, en au moins 6 échelons de 10 % au plus, avec 150 ms au plus de délai (disjoncteur compris).',
        en: 'The European code (NC ER) asks continental Europe to shed 45 % ± 7 % of load between 49 Hz and 48 Hz, in at least 6 stages of at most 10 %, with at most 150 ms delay (breaker included).',
      }),
    },
  ],

  predict: {
    signal: 'f',
    yRange: () => [47.5, 50.5],
    diagnose(pred) {
      const end = pred.filter(([t]) => t > 20).map(([, y]) => y);
      const low = Math.min(...pred.map(([, y]) => y));
      if (end.length && end.reduce((a, b) => a + b, 0) / end.length < 49.5 && low > 48)
        return {
          fr: 'La fréquence ne reste pas basse : chaque échelon de délestage retire d’un coup une part de la charge. Une fois l’équilibre rétabli, la réserve primaire ramène la fréquence près de 50 Hz.',
          en: 'The frequency does not stay low: each shedding stage removes a slice of load at once. Once balance is restored, primary reserve brings the frequency back near 50 Hz.',
        };
      if (low > 49.3)
        return {
          fr: 'Un déficit de 15 % dépasse de loin la réserve primaire (environ 5 % ici) : la fréquence plonge à plus d’un hertz par seconde au début. Seul le délestage l’arrête.',
          en: 'A 15 % deficit far exceeds the primary reserve (about 5 % here): the frequency dives at over a hertz per second at first. Only load shedding stops it.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'rocof',
      title: { fr: 'La vitesse de chute (RoCoF)', en: 'Rate of change of frequency (RoCoF)' },
      tex: (c) => {
        const k = c.k as DefInfo;
        return `\\frac{df}{dt}\\Big|_{0^+} = -\\frac{\\Delta P}{2H}\\,f_0 = ${c.q(-k.rocof, '\\text{Hz/s}', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Moins d’inertie (plus d’électronique de puissance, moins de machines tournantes) : la fréquence tombe plus vite, et les relais de délestage ont moins de temps (leçon 8.4).',
          en: 'Less inertia (more power electronics, fewer spinning machines): the frequency falls faster and shedding relays have less time (lesson 8.4).',
        }),
    },
    {
      id: 'plan',
      title: { fr: 'Le plan de défense', en: 'The defence plan' },
      tex: (c) => {
        const k = c.k as DefInfo;
        return `f_{min} = ${k.nadir.toFixed(2)}\\ \\text{Hz}, \\quad P_{del} = ${c.q(k.shed, '\\%', 3)}, \\quad f_{max} = ${k.fmax.toFixed(2)}\\ \\text{Hz}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le plan de défense est l’ensemble des automatismes qui sauvent le système quand les marges sont dépassées : délestage sur seuil de fréquence, îlotage des centrales sur leurs auxiliaires, et plan de reconstitution si tout s’éteint.',
          en: 'The defence plan is the set of automatic schemes that save the system once the margins are exceeded: under-frequency shedding, plants islanding onto their auxiliaries, and the restoration plan if everything goes dark.',
        }),
    },
    {
      id: 'limits',
      title: { fr: 'Les limites des groupes', en: 'The generators’ limits' },
      tex: () => `47{,}5\\ \\text{Hz} \\le f \\le 51{,}5\\ \\text{Hz}`,
      note: (c) =>
        c.tr({
          fr: 'En dehors de cette plage, les groupes peuvent se découpler pour se protéger : c’est la panne généralisée. Trop délester est donc aussi dangereux que pas assez.',
          en: 'Outside this range, generators may disconnect to protect themselves: a blackout. Shedding too much is as dangerous as shedding too little.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence', en: 'Predict the frequency' },
      body: {
        fr: `Après une séparation de réseau, une zone se retrouve avec **15 % de production en moins**. Sa réserve primaire ne vaut que 5 %. Le délestage commence à 49 Hz par échelons de 7,5 %. **Dessinez la fréquence**, puis révélez.`,
        en: `After a system split, an area is left with **15 % less generation**. Its primary reserve is only 5 %. Shedding starts at 49 Hz in 7.5 % stages. **Sketch the frequency**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'none',
      title: { fr: 'Sans délestage', en: 'No shedding' },
      body: {
        fr: `Mettez le délestage à **0 %**. La fréquence passe sous 47,5 Hz : les groupes se découplent, c’est la **panne généralisée**.`,
        en: `Set shedding to **0 %**. The frequency drops below 47.5 Hz: the generators disconnect, a **blackout**.`,
      },
      check: (lab) => lab.params.step === 0 && (lab.info as DefInfo).blackout,
    },
    {
      id: 'over',
      title: { fr: 'Trop délester', en: 'Shedding too much' },
      body: {
        fr: `Avec un déficit de **10 %**, prenez des échelons de **15 %**. Le premier échelon retire plus que le déficit : la fréquence **dépasse 51 Hz**.`,
        en: `With a **10 %** deficit, use **15 %** stages. The first stage removes more than the deficit: the frequency **goes above 51 Hz**.`,
      },
      check: (lab) => lab.params.deficit <= 12 && (lab.info as DefInfo).over,
    },
    {
      id: 'big',
      title: { fr: 'Un très gros déficit', en: 'A very large deficit' },
      body: {
        fr: `Montez le déficit à **30 %** et choisissez une taille d’échelon (entre 5 et 10 %) qui sauve le système sans le faire dépasser 51 Hz.`,
        en: `Raise the deficit to **30 %** and choose a stage size (between 5 and 10 %) that saves the system without taking it above 51 Hz.`,
      },
      check: (lab) => {
        const k = lab.info as DefInfo;
        return lab.params.deficit >= 30 && lab.params.step >= 5 && lab.params.step <= 10 && !k.blackout && !k.over;
      },
    },
    {
      id: 'inertia',
      title: { fr: 'Peu d’inertie', en: 'Low inertia' },
      body: {
        fr: `Déficit de **25 %**, inertie de **1,5 s**. Avec des échelons de 7,5 %, la chute est si rapide que trop d’échelons partent avant le creux : sur-délestage. Trouvez des échelons plus fins qui sauvent le système.`,
        en: `A **25 %** deficit, **1.5 s** of inertia. With 7.5 % stages the fall is so fast that too many stages trip before the nadir: over-shedding. Find finer stages that save the system.`,
      },
      check: (lab) => {
        const k = lab.info as DefInfo;
        return lab.params.deficit >= 25 && lab.params.H <= 1.6 && lab.params.step > 0 && !k.blackout && !k.over;
      },
    },
  ],
};
