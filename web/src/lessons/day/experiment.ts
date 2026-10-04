// Module 0.1 — A day on the grid: production must match consumption, every instant.

import type { Experiment } from '../../lib/lab/types';
import { FLEX_MAX, LINE, dayGrid, dayInfo, type DayInfo } from '../../lib/models/module0';
import GridChain from './GridChain.svelte';
import LossPanel from './LossPanel.svelte';
import StackChart from './StackChart.svelte';

export const dayLesson: Experiment = {
  id: 'day',
  path: [
    { fr: 'Module 0 · Le réseau en 10 minutes', en: 'Module 0 · The grid in 10 minutes' },
    { fr: '0.1 De la turbine à la prise', en: '0.1 From turbine to socket' },
  ],
  title: { fr: 'Une journée sur le réseau', en: 'A day on the grid' },
  model: dayGrid,
  info: dayInfo,
  canvas: GridChain,
  instruments: [StackChart, LossPanel],
  timeUnit: 'h',

  params: [
    { id: 'base', symbol: 'P_{nuc}', name: { fr: 'Nucléaire (constant)', en: 'Nuclear (constant)' }, unit: 'GW', min: 0, max: 60, default: 40, scale: 'lin', term: 'L' },
    { id: 'wind', symbol: 'P_{wind}', name: { fr: 'Éolien (moyenne)', en: 'Wind (average)' }, unit: 'GW', min: 0, max: 20, default: 5, scale: 'lin', term: 'C' },
    { id: 'pv', symbol: 'P_{PV}', name: { fr: 'Photovoltaïque (crête)', en: 'Solar PV (peak)' }, unit: 'GW', min: 0, max: 40, default: 10, scale: 'lin', term: 'i' },
    {
      id: 'kV',
      symbol: 'U',
      name: { fr: 'Tension de transport', en: 'Transmission voltage' },
      unit: '',
      min: 20,
      max: 400,
      default: 63,
      scale: 'lin',
      choices: [20, 63, 225, 400].map((v) => ({ value: v, label: { fr: `${v} kV`, en: `${v} kV` } })),
    },
  ],

  signals: [
    { id: 'demand', symbol: 'P_{load}', name: { fr: 'Consommation', en: 'Demand' }, unit: 'GW', color: '--c-S', on: true, term: 'S' },
    { id: 'flex', symbol: 'P_{flex}', name: { fr: 'Production flexible', en: 'Flexible generation' }, unit: 'GW', color: '--c-p', on: true, term: 'p' },
    { id: 'pv', symbol: 'P_{PV}', name: { fr: 'Photovoltaïque', en: 'Solar PV' }, unit: 'GW', color: '--c-i', on: false, term: 'i' },
    { id: 'wind', symbol: 'P_{wind}', name: { fr: 'Éolien', en: 'Wind' }, unit: 'GW', color: '--c-C', on: false, term: 'C' },
    { id: 'base', symbol: 'P_{nuc}', name: { fr: 'Nucléaire', en: 'Nuclear' }, unit: 'GW', color: '--c-L', on: false, term: 'L' },
  ],

  predict: {
    signal: 'demand',
    yRange: () => [30, 90],
    diagnose(pred, run) {
      const truth = Math.max(...run.s.demand) - Math.min(...run.s.demand);
      const ys = pred.map(([, y]) => y);
      if (Math.max(...ys) - Math.min(...ys) < 0.5 * truth)
        return {
          fr: 'La consommation varie de plus de 20 % dans la journée : creux la nuit vers 4 h, montée le matin, et **pointe vers 19 h** (éclairage, cuisson, chauffage). Les producteurs doivent suivre en permanence.',
          en: 'Demand swings by more than 20 % over the day: a trough around 4 am, a morning ramp, and an **evening peak around 7 pm** (lighting, cooking, heating). Generators must follow it all the time.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'balance',
      title: { fr: 'L’équilibre, à chaque instant', en: 'Balance, at every instant' },
      tex: (c) => `\\begin{aligned}
        ${c.term('L', 'P_{nuc}')} + ${c.term('C', 'P_{wind}')} + ${c.term('i', 'P_{PV}')} + ${c.term('p', 'P_{flex}')} &= ${c.term('S', 'P_{load}')} \\\\
        ${c.term('L', c.q(c.at('base'), 'GW', 3))} + ${c.term('C', c.q(c.at('wind'), 'GW', 3))} + ${c.term('i', c.q(c.at('pv'), 'GW', 3))} + ${c.term('p', c.q(c.at('flex'), 'GW', 3))} &= ${c.term('S', c.q(c.at('demand'), 'GW', 3))}
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'L’électricité ne se stocke presque pas dans le réseau : la production doit égaler la consommation **à chaque seconde**. Le moindre écart fait varier la fréquence (leçon 0.2).',
          en: 'The grid itself stores almost no electricity: generation must equal demand **every second**. Any mismatch moves the frequency (lesson 0.2).',
        }),
    },
    {
      id: 'transmission',
      title: { fr: 'Pourquoi transporter en haute tension', en: 'Why transmit at high voltage' },
      tex: (c) => {
        const k = c.k as DayInfo;
        return `\\begin{aligned}
          I &= \\frac{P}{\\sqrt3\\,U} = \\frac{1\\ \\mathrm{GW}}{\\sqrt3 \\times ${c.p.kV}\\ \\mathrm{kV}} = ${c.q(k.line.I, 'A')} \\\\
          P_{loss} &= 3 R I^2 = ${c.q(k.line.loss, 'W')} \\quad (${c.q(100 * k.line.share, '%', 3)}), \\qquad R = ${c.q(LINE.rPerKm * LINE.km, 'Ω')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les pertes varient comme $1/U^2$. C’est pourquoi on élève la tension avec des transformateurs (leçon 1.5) : 400 kV pour le transport, 20 kV en distribution, 230 V chez vous.',
          en: 'Losses scale as $1/U^2$. That is why voltage is stepped up with transformers (lesson 1.5): 400 kV for transmission, 20 kV for distribution, 230 V at home.',
        }),
    },
    {
      id: 'flex',
      title: { fr: 'La production flexible', en: 'Flexible generation' },
      tex: (c) => {
        const k = c.k as DayInfo;
        return `P_{flex} \\in [${c.q(k.flexMin, 'GW', 3)},\\ ${c.q(k.flexMax, 'GW', 3)}] \\quad \\text{${c.tr({ fr: 'capacité', en: 'capacity' })}}: [0,\\ ${FLEX_MAX}\\ \\mathrm{GW}]`;
      },
      note: (c) =>
        c.tr({
          fr: 'Barrages, centrales à gaz, stockage et échanges avec les voisins comblent l’écart. Une valeur négative signifie un excédent à exporter, stocker ou écrêter.',
          en: 'Hydro, gas plants, storage and exchanges with neighbours fill the gap. A negative value means a surplus to export, store or curtail.',
        }),
    },
    {
      id: 'frequency',
      title: { fr: 'Et si l’équilibre se rompt ?', en: 'What if the balance breaks?' },
      personas: ['utility', 'research'],
      tex: () => `\\frac{2HS}{f_0}\\,\\frac{df}{dt} = P_{gen} - P_{load}`,
      note: (c) =>
        c.tr({
          fr: 'Tout déséquilibre est d’abord absorbé par l’énergie cinétique des machines tournantes, et la fréquence dérive. C’est le sujet de la leçon 0.2, puis du module 8.',
          en: 'Any imbalance is first absorbed by the kinetic energy of rotating machines, and the frequency drifts. That is lesson 0.2, then Module 8.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la consommation', en: 'Predict the demand' },
      body: {
        fr: `Un jour de semaine en hiver, sur un grand réseau européen. **Dessinez la consommation sur 24 heures** (en GW), puis révélez.`,
        en: `A winter weekday on a large European grid. **Sketch the demand over 24 hours** (in GW), then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'day',
      title: { fr: 'Suivre la journée', en: 'Following the day' },
      body: {
        fr: `Lancez la lecture ▶ : le nucléaire reste constant, le photovoltaïque suit le soleil, et la production **flexible** comble l’écart à chaque instant. Les points du schéma transportent l’énergie vers les maisons.`,
        en: `Press play ▶: nuclear stays constant, solar follows the sun, and **flexible** generation fills the gap at every instant. The dots on the diagram carry energy to the houses.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'voltage',
      title: { fr: 'Choisir la tension de transport', en: 'Choosing the transmission voltage' },
      body: {
        fr: `À 63 kV, transporter 1 GW sur 300 km fait perdre une grande partie de l’énergie en chaleur. Essayez **20 kV** (impossible), puis passez à **400 kV**.`,
        en: `At 63 kV, sending 1 GW over 300 km loses a large part of the energy as heat. Try **20 kV** (impossible), then switch to **400 kV**.`,
      },
      check: (lab) => lab.params.kV === 400,
    },
    {
      id: 'duck',
      title: { fr: 'Beaucoup de soleil', en: 'Lots of sunshine' },
      body: {
        fr: `Montez le photovoltaïque à **30 GW** ou plus. À midi, il produit tellement que la production flexible devrait devenir **négative** : il y a un excédent. Le soir, quand le soleil se couche juste avant la pointe, il faut au contraire démarrer très vite. C’est la « courbe du canard ».`,
        en: `Raise solar PV to **30 GW** or more. At noon it produces so much that flexible generation would have to go **negative**: there is a surplus. In the evening, as the sun sets just before the peak, everything must ramp up fast. That is the “duck curve”.`,
      },
      check: (lab) => lab.params.pv >= 30,
    },
    {
      id: 'balance',
      title: { fr: 'Équilibrer la journée', en: 'Balancing the day' },
      body: {
        fr: `Réglez le nucléaire, l’éolien et le photovoltaïque pour que la production flexible reste **entre 0 et ${FLEX_MAX} GW toute la journée**.

Avec 30 GW de photovoltaïque, c’est impossible sans stockage : il faudrait déplacer l’énergie de midi vers le soir. C’est le rôle des batteries et des stations de pompage (module 7).`,
        en: `Set nuclear, wind and solar so that flexible generation stays **between 0 and ${FLEX_MAX} GW all day**.

With 30 GW of solar it is impossible without storage: midday energy would have to move to the evening. That is the job of batteries and pumped hydro (Module 7).`,
      },
      hint: { fr: 'Gardez environ 10 GW de photovoltaïque et réglez le nucléaire entre 42 et 47 GW.', en: 'Keep about 10 GW of solar and set nuclear between 42 and 47 GW.' },
      check: (lab) => (lab.info as DayInfo).balanced,
    },
  ],
};
