// Module 0.2 — Replaying a blackout: frequency, inertia, reserves and protection.

import type { Experiment } from '../../lib/lab/types';
import { SYS, blackout, blackoutInfo, type BlackoutInfo } from '../../lib/models/module0';
import EventLog from './EventLog.svelte';
import FrequencyDial from './FrequencyDial.svelte';
import NadirChart from './NadirChart.svelte';

const onOff = (fr: string, en: string) => [
  { value: 1, label: { fr: `${fr} : oui`, en: `${en}: on` } },
  { value: 0, label: { fr: `${fr} : non`, en: `${en}: off` } },
];

export const blackoutLesson: Experiment = {
  id: 'blackout',
  path: [
    { fr: 'Module 0 · Le réseau en 10 minutes', en: 'Module 0 · The grid in 10 minutes' },
    { fr: '0.2 Rejouer un blackout', en: '0.2 Replay a blackout' },
  ],
  title: { fr: 'Le 9 août 2019, en simplifié', en: '9 August 2019, simplified' },
  model: blackout,
  info: blackoutInfo,
  canvas: FrequencyDial,
  instruments: [EventLog, NadirChart],

  params: [
    { id: 'loss', symbol: '\\Delta P', name: { fr: 'Production perdue', en: 'Generation lost' }, unit: 'MW', min: 200, max: 2000, default: 1000, scale: 'lin', term: 'R' },
    { id: 'H', symbol: 'H', name: { fr: 'Inertie du système', en: 'System inertia' }, unit: 's', min: 1.5, max: 8, default: 4, scale: 'lin', term: 'L' },
    { id: 'reserve', symbol: 'R', name: { fr: 'Réserve primaire', en: 'Primary reserve' }, unit: 'MW', min: 200, max: 2500, default: 1000, scale: 'lin', term: 'p' },
    { id: 'Tg', symbol: 'T_g', name: { fr: 'Temps de réponse de la réserve', en: 'Reserve response time' }, unit: 's', min: 1, max: 20, default: 8, scale: 'log', term: 'p' },
    { id: 'rocofOn', symbol: 'df/dt', name: { fr: 'Protections RoCoF', en: 'RoCoF protection' }, unit: '', min: 0, max: 1, default: 1, scale: 'lin', choices: onOff('Protections RoCoF', 'RoCoF trips') },
    { id: 'lfddOn', symbol: 'LFDD', name: { fr: 'Délestage', en: 'Load shedding' }, unit: '', min: 0, max: 1, default: 1, scale: 'lin', choices: onOff('Délestage', 'Load shedding') },
  ],

  signals: [
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', color: '--c-p', on: true, term: 'p' },
    { id: 'lost', symbol: 'P_{lost}', name: { fr: 'Production perdue', en: 'Generation lost' }, unit: 'MW', color: '--c-R', on: true, term: 'R' },
    { id: 'pg', symbol: 'P_{res}', name: { fr: 'Réserve mobilisée', en: 'Reserve delivered' }, unit: 'MW', color: '--c-vs', on: true, term: 'vs' },
    { id: 'shed', symbol: 'P_{shed}', name: { fr: 'Charge délestée', en: 'Load shed' }, unit: 'MW', color: '--c-C', on: false, term: 'C' },
    { id: 'rocof', symbol: 'df/dt', name: { fr: 'Dérivée de la fréquence', en: 'Rate of change of frequency' }, unit: 'Hz/s', color: '--c-L', on: false, term: 'L' },
  ],

  predict: {
    signal: 'f',
    yRange: () => [48.3, 50.3],
    diagnose(pred, run) {
      const nadir = Math.min(...run.s.f);
      const depth = 50 - nadir;
      const early = pred.filter(([t]) => t > SYS.tLoss && t < SYS.tLoss + 0.5).map(([, y]) => y);
      if (early.length && 50 - Math.min(...early) > 0.6 * depth)
        return {
          fr: 'La fréquence ne peut pas chuter instantanément : l’**énergie cinétique** de toutes les machines tournantes amortit le choc. Elle glisse à une vitesse $df/dt = f_0\\,\\Delta P/(2HS)$ : c’est le RoCoF.',
          en: 'Frequency cannot drop instantly: the **kinetic energy** of every rotating machine cushions the blow. It slides at a rate $df/dt = f_0\\,\\Delta P/(2HS)$: the RoCoF.',
        };
      const late = pred.filter(([t]) => t > 40).map(([, y]) => y);
      const fEnd = run.s.f[run.t.length - 1];
      if (late.length && Math.max(...late) < nadir + 0.25 * (fEnd - nadir))
        return {
          fr: 'Après le creux, la fréquence **remonte** : la réserve primaire (les centrales qui augmentent leur production) arrête la chute, puis la ramène vers 50 Hz.',
          en: 'After the nadir the frequency **recovers**: primary reserve (plants raising their output) arrests the fall, then brings it back towards 50 Hz.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'swing',
      title: { fr: 'Le réseau comme un seul volant d’inertie', en: 'The grid as a single flywheel' },
      tex: (c) => `\\frac{2${c.term('L', 'H')}S}{f_0}\\,\\frac{df}{dt} = ${c.term('vs', 'P_{res}')} - ${c.term('R', 'P_{lost}')} + ${c.term('C', 'P_{shed}')} - k\\,L\\,\\Delta f`,
      note: (c) =>
        c.tr({
          fr: 'Toutes les machines synchrones tournent ensemble : leur énergie cinétique $E = HS$ amortit tout déséquilibre. $k \\approx 2\\ \\%/\\mathrm{Hz}$ : la charge consomme un peu moins quand la fréquence baisse.',
          en: 'All synchronous machines turn together: their kinetic energy $E = HS$ cushions any imbalance. $k \\approx 2\\ \\%/\\mathrm{Hz}$: load draws slightly less when frequency drops.',
        }),
    },
    {
      id: 'rocof',
      title: { fr: 'Les premières secondes', en: 'The first seconds' },
      tex: (c) => {
        const k = c.k as BlackoutInfo;
        return `\\left.\\frac{df}{dt}\\right|_{0^+} = \\frac{f_0\\,\\Delta P}{2\\,${c.term('L', 'H')}\\,S} = \\frac{50 \\times ${c.p.loss}}{2 \\times ${c.q(c.p.H, '', 3)} \\times ${SYS.S}} = ${c.q(k.rocof0, 'Hz/s', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Moins d’inertie, c’est une chute plus rapide. Au-delà de 0,125 Hz/s, les anciennes protections « RoCoF » de la production décentralisée la déconnectaient, ce qui aggravait la perte.',
          en: 'Less inertia means a faster fall. Above 0.125 Hz/s, the old RoCoF protection on embedded generation disconnected it, making the loss worse.',
        }),
    },
    {
      id: 'nadir',
      title: { fr: 'Creux et régime établi', en: 'Nadir and settling' },
      tex: (c) => {
        const k = c.k as BlackoutInfo;
        return `\\begin{aligned}
          f_{min} &= ${c.q(k.nadir, 'Hz', 4)} \\quad (t = ${c.q(k.tNadir, 's')}) \\\\
          \\Delta f_\\infty &: \\; \\min\\!\\left(R,\\ \\tfrac{-\\Delta f}{0{,}5}R\\right) + kL\\,|\\Delta f| = \\Delta P
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La réserve primaire arrête la chute en quelques secondes. Si elle est trop lente ou trop petite, la fréquence passe sous 48,8 Hz et le délestage coupe automatiquement des clients pour sauver le reste du réseau.',
          en: 'Primary reserve arrests the fall within seconds. If it is too slow or too small, frequency drops below 48.8 Hz and load shedding automatically disconnects customers to save the rest of the grid.',
        }),
    },
    {
      id: 'history',
      title: { fr: 'Ce qui s’est passé', en: 'What happened' },
      personas: ['utility', 'research'],
      tex: () => `\\approx 737 + 244\\ \\mathrm{MW} \\;\\to\\; \\approx 500\\ \\mathrm{MW\\ (RoCoF,\\ vector\\ shift)} \\;\\to\\; 48{,}8\\ \\mathrm{Hz} \\;\\to\\; \\approx 1\\ \\mathrm{GW}\\ \\text{shed}`,
      note: (c) =>
        c.tr({
          fr: 'Grande-Bretagne, 9 août 2019 : un coup de foudre provoque le déclenchement quasi simultané du parc éolien en mer de Hornsea et de la centrale de Little Barford, puis de production décentralisée. Environ 1 million de clients délestés. Chiffres arrondis d’après le rapport de l’opérateur ; ce modèle en reproduit l’enchaînement, pas les détails. Depuis, les seuils RoCoF ont été relevés à 1 Hz/s.',
          en: 'Great Britain, 9 August 2019: a lightning strike caused almost simultaneous trips of the Hornsea offshore wind farm and the Little Barford power station, then of embedded generation. About 1 million customers were disconnected. Rounded figures from the system operator’s report; this model reproduces the sequence, not the details. RoCoF settings have since been raised to 1 Hz/s.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence', en: 'Predict the frequency' },
      body: {
        fr: `Un réseau de 30 GW tourne à 50 Hz. À $t = 1$ s, **1000 MW de production** se déclenchent d’un coup. **Dessinez la fréquence** sur la minute qui suit, puis révélez.`,
        en: `A 30 GW grid runs at 50 Hz. At $t = 1$ s, **1000 MW of generation** trips at once. **Sketch the frequency** over the next minute, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'cascade',
      title: { fr: 'L’enchaînement', en: 'The cascade' },
      body: {
        fr: `Lancez la lecture ▶ et suivez la chronologie : la perte initiale fait chuter la fréquence assez vite pour déclencher les **protections RoCoF** de la production décentralisée. La perte s’aggrave, la fréquence passe sous **48,8 Hz**, et le **délestage** coupe 1000 MW de clients.`,
        en: `Press play ▶ and follow the timeline: the initial loss drops the frequency fast enough to trigger the **RoCoF protection** of embedded generation. The loss grows, frequency falls below **48.8 Hz**, and **load shedding** cuts 1000 MW of customers.`,
      },
      check: (lab) => lab.maxFrac > 0.9 && (lab.info as BlackoutInfo).shed,
    },
    {
      id: 'inertia',
      title: { fr: 'Moins d’inertie', en: 'Less inertia' },
      body: {
        fr: `Réduisez l’inertie à **2 s**, comme sur un réseau où l’éolien et le photovoltaïque ont remplacé les grosses machines tournantes. La chute est deux fois plus rapide. Le graphique de droite montre le creux pour chaque inertie.`,
        en: `Lower the inertia to **2 s**, as on a grid where wind and solar have replaced large spinning machines. The fall is twice as fast. The chart on the right shows the nadir for every inertia.`,
      },
      check: (lab) => lab.params.H <= 2.5,
    },
    {
      id: 'settings',
      title: { fr: 'Changer les réglages de protection', en: 'Changing protection settings' },
      body: {
        fr: `Remettez l’inertie à 4 s et **désactivez les protections RoCoF**, comme l’a fait le Royaume-Uni après 2019. La même perte de 1000 MW reste contenue : pas de délestage.`,
        en: `Set inertia back to 4 s and **turn RoCoF protection off**, as Great Britain did after 2019. The same 1000 MW loss is now contained: no load shedding.`,
      },
      check: (lab) => lab.params.rocofOn === 0 && lab.params.loss >= 1000 && !(lab.info as BlackoutInfo).shed,
    },
    {
      id: 'reserve',
      title: { fr: 'Inertie et réserve rapide', en: 'Inertia and fast reserve' },
      body: {
        fr: `Réactivez les protections RoCoF. Trouvez une combinaison d’**inertie**, de **réserve** et de **rapidité de réserve** qui garde la fréquence au-dessus de **49,2 Hz** après la perte de 1000 MW.

C’est le défi des réseaux à forte part d’énergies renouvelables : inertie synthétique, batteries ultra-rapides, onduleurs « grid-forming » (module 7).`,
        en: `Turn RoCoF protection back on. Find a combination of **inertia**, **reserve** and **reserve speed** that keeps the frequency above **49.2 Hz** after the 1000 MW loss.

This is the challenge of high-renewable grids: synthetic inertia, very fast batteries, grid-forming inverters (Module 7).`,
      },
      check: (lab) => lab.params.rocofOn === 1 && lab.params.loss >= 1000 && (lab.info as BlackoutInfo).nadir > 49.2,
    },
  ],
};
