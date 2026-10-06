// Module 8.3 — Long-term voltage stability: a line trip, the on-load tap
// changer restoring the load, thermostatic recovery, and the countermeasures.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { LTVS, ltvsInfo, ltvsModel, ltvsNose, OLTC_MODES, type LtvsInfo } from '../../lib/models/module8';
import StabilityTree from '../eac/StabilityTree.svelte';
import LtvsCanvas from './LtvsCanvas.svelte';

export const ltvsLesson: Experiment = {
  id: 'ltvs',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.3 Stabilité de tension', en: '8.3 Voltage stability' },
  ],
  title: { fr: 'Stabilité de tension à long terme : régleurs en charge et reprise des charges', en: 'Long-term voltage stability: tap changers and load restoration' },
  model: ltvsModel,
  info: ltvsInfo,
  canvas: LtvsCanvas,
  instruments: [Chart0, StabilityTree],

  params: [
    { id: 'P0', symbol: 'P_0', name: { fr: 'Charge nominale', en: 'Nominal load' }, unit: 'pu', min: 0.6, max: 1.2, default: 1, scale: 'lin', term: 'R' },
    {
      id: 'oltc',
      symbol: '\\text{OLTC}',
      name: { fr: 'Régleur en charge', en: 'On-load tap changer' },
      unit: '',
      min: 0,
      max: 2,
      default: OLTC_MODES.on,
      scale: 'lin',
      choices: [
        { value: OLTC_MODES.on, label: { fr: 'Normal', en: 'Normal' } },
        { value: OLTC_MODES.off, label: { fr: 'Hors service', en: 'Out of service' } },
        { value: OLTC_MODES.block, label: { fr: 'Bloqué si V_HT < 0,9', en: 'Blocked if V_HV < 0.9' } },
      ],
    },
    { id: 'B', symbol: 'B', name: { fr: 'Condensateurs au poste HT', en: 'Capacitors at the HV substation' }, unit: 'pu', min: 0, max: 0.5, default: 0, scale: 'lin', term: 'C' },
    { id: 'rec', symbol: 'a_D', name: { fr: 'Part de charge qui se rétablit (thermostats)', en: 'Recovering share of load (thermostats)' }, unit: '', min: 0, max: 1, default: 0, scale: 'lin', term: 'L' },
  ],

  signals: [
    { id: 'V1', symbol: 'V_{HT}', name: { fr: 'Tension au poste HT', en: 'Voltage at the HV substation' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'V2', symbol: 'V_{BT}', name: { fr: 'Tension chez les clients (BT)', en: 'Voltage at customers (LV)' }, unit: 'pu', color: '--c-R', on: true, term: 'R' },
    { id: 'tap', symbol: 'n', name: { fr: 'Rapport du régleur', en: 'Tap ratio' }, unit: '', color: '--c-L', on: false, term: 'L' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance consommée', en: 'Power consumed' }, unit: 'pu ', color: '--c-p', on: false, term: 'p' },
  ],

  charts: [
    {
      title: { fr: 'Courbes P–V et trajectoire', en: 'P–V curves and trajectory' },
      x: { label: 'P', unit: 'pu', range: [0, 1.8] },
      y: { label: 'V BT', unit: 'pu', range: [0.4, 1.2] },
      bands: () => [{ y0: 0.95, y1: 1.05 }],
      series: (lab) => {
        const k = lab.info as LtvsInfo;
        const P = lab.run.s.P, V = lab.run.s.V2;
        const traj: [number, number][] = [];
        for (let j = 0; j < P.length; j += 4) if (isFinite(P[j])) traj.push([P[j], V[j]]);
        return [
          { label: { fr: 'avant le déclenchement (n = 1)', en: 'before the trip (n = 1)' }, color: '--c-C', pts: ltvsNose(false, 1, lab.params.B), dash: true, width: 1.3 },
          { label: { fr: 'après, avec le rapport final', en: 'after, with the final ratio' }, color: '--warn', pts: ltvsNose(true, isFinite(k.tapEnd) ? k.tapEnd : 1, lab.params.B) },
          { label: { fr: 'trajectoire', en: 'trajectory' }, color: '--c-p', pts: traj, width: 1.6 },
        ];
      },
      points: (lab) => (isFinite(lab.at('P')) ? [{ x: lab.at('P'), y: lab.at('V2'), color: '--accent' }] : []),
      vlines: (lab) => [{ x: lab.params.P0, label: 'P₀' }],
      note: () => ({
        fr: 'Si la charge veut revenir à P₀ alors que P₀ dépasse le nez de la courbe après incident, aucun équilibre acceptable n’existe.',
        en: 'If the load wants to return to P₀ while P₀ exceeds the nose of the post-incident curve, no acceptable equilibrium exists.',
      }),
    },
  ],

  predict: {
    signal: 'V1',
    yRange: () => [0.6, 1.1],
    diagnose(pred, run) {
      const after = (t0: number, a: [number, number][]) => a.filter(([t]) => t > t0 && t < t0 + 20).map(([, y]) => y);
      const truth: [number, number][] = Array.from(run.t, (t, j) => [t, run.s.V1[j]]);
      const tEnd = LTVS.window - 25;
      const truthEnd = after(tEnd, truth), truthTrip = after(15, truth);
      const mineEnd = after(tEnd, pred), mineTrip = after(15, pred);
      if (!truthEnd.length || !mineEnd.length || !mineTrip.length) return null;
      const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
      if (avg(truthEnd.filter(isFinite)) < avg(truthTrip.filter(isFinite)) - 0.04 && avg(mineEnd) >= avg(mineTrip) - 0.01)
        return {
          fr: 'Le régleur en charge **remonte la tension des clients**… en tirant davantage de puissance du réseau, ce qui **enfonce la tension HT**, cran après cran. Ce qui protège le client côté BT dégrade le réseau : c’est le mécanisme de nombreux effondrements lents (Suède 1983, France 1987).',
          en: 'The tap changer **raises the customers’ voltage**… by drawing more power from the grid, which **pushes the HV voltage down**, step by step. What protects the LV customer degrades the grid: this is the mechanism of many slow collapses (Sweden 1983, France 1987).',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'load',
      title: { fr: 'Une charge qui dépend de la tension', en: 'A voltage-dependent load' },
      tex: () => `P = P_0\\,V_{BT}^2\\ (\\text{impédance}) \\;+\\; a_D\\,x, \\qquad T_p\\,\\dot x = -x + P_0(1 - V_{BT}^2)`,
      note: (c) =>
        c.tr({
          fr: 'Juste après l’incident, la charge baisse avec la tension (leçon 4.6) : cela soulage le réseau. Mais deux mécanismes lents la ramènent vers $P_0$ : le régleur, qui remonte la tension BT, et les thermostats, qui allongent les cycles de chauffage.',
          en: 'Right after the incident, load falls with voltage (lesson 4.6): this relieves the grid. But two slow mechanisms bring it back towards $P_0$: the tap changer, which raises the LV voltage, and thermostats, which lengthen heating cycles.',
        }),
    },
    {
      id: 'oltc',
      title: { fr: 'Le régleur en charge', en: 'The on-load tap changer' },
      tex: (c) => {
        const k = c.k as LtvsInfo;
        return `V_{BT} = n\\,V_{HT}, \\quad n \\in [${LTVS.aMin}; ${LTVS.aMax}],\\ \\Delta n = ${LTVS.tap}, \\qquad n_{fin} = ${c.q(k.tapEnd, '', 3)}\\ (${k.taps}\\ \\text{changements})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un changement de prise toutes les quelques secondes, après une première temporisation (20 s) : la dynamique se joue en minutes, pas en secondes.',
          en: 'One tap step every few seconds, after an initial delay (20 s): the dynamics play out over minutes, not seconds.',
        }),
    },
    {
      id: 'limit',
      title: { fr: 'La limite de transport après incident', en: 'Post-incident transfer limit' },
      tex: (c) => {
        const k = c.k as LtvsInfo;
        return `P_{max}^{après} = ${c.q(k.PmaxPost, 'pu', 3)} \\quad \\text{vs} \\quad P_0 = ${c.q(c.p.P0, 'pu', 3)}, \\qquad V_{HT,fin} = ${isFinite(k.V1end) ? c.q(k.V1end, 'pu', 3) : '\\text{—}'}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La perte d’une ligne fait reculer le nez (leçon 5.2). Si la consommation « voulue » dépasse ce nouveau maximum, les mécanismes de reprise poussent le système vers l’effondrement.',
          en: 'Losing a line pulls the nose in (lesson 5.2). If the “desired” consumption exceeds this new maximum, the restoration mechanisms push the system towards collapse.',
        }),
    },
    {
      id: 'counter',
      title: { fr: 'Les parades', en: 'Countermeasures' },
      personas: ['utility', 'research'],
      tex: () => `\\text{blocage des régleurs} \\cdot \\text{condensateurs / SVC} \\cdot \\text{délestage sur tension} \\cdot \\text{baisse des consignes}`,
      note: (c) =>
        c.tr({
          fr: 'RTE et d’autres gestionnaires bloquent automatiquement les régleurs quand la tension HT baisse, et peuvent abaisser les consignes de tension en distribution. En dernier recours, on déleste.',
          en: 'RTE and other operators automatically block tap changers when HV voltage falls, and can lower distribution voltage setpoints. As a last resort, load is shed.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension HT', en: 'Predict the HV voltage' },
      body: {
        fr: `Une région est alimentée par deux lignes ; l’une déclenche à $t = 10$ s. Le régleur en charge du poste veille sur la tension des clients. **Dessinez la tension du poste HT** sur 5 minutes, puis révélez.`,
        en: `A region is supplied by two lines; one trips at $t = 10$ s. The substation tap changer looks after the customers’ voltage. **Sketch the HV substation voltage** over 5 minutes, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'watch',
      title: { fr: 'Cran après cran', en: 'Step after step' },
      body: {
        fr: `Parcourez les 5 minutes : à chaque changement de prise, la tension BT remonte et la tension HT baisse. À la fin, le poste HT est sous **0,83 pu**.`,
        en: `Scrub through the 5 minutes: at each tap step, LV voltage rises and HV voltage falls. At the end, the HV substation is below **0.83 pu**.`,
      },
      check: (lab) => lab.maxFrac > 0.9 && (lab.info as LtvsInfo).unstable,
    },
    {
      id: 'off',
      title: { fr: 'Sans régleur', en: 'Without the tap changer' },
      body: {
        fr: `Mettez le régleur **hors service** : la tension des clients reste basse (≈ 0,86 pu), mais le réseau HT tient. La baisse de tension réduit la charge et sauve le système.`,
        en: `Take the tap changer **out of service**: the customers’ voltage stays low (≈ 0.86 pu), but the HV grid holds. The lower voltage reduces load and saves the system.`,
      },
      check: (lab) => lab.params.oltc === OLTC_MODES.off && !(lab.info as LtvsInfo).unstable,
    },
    {
      id: 'block',
      title: { fr: 'Bloquer automatiquement', en: 'Automatic blocking' },
      body: {
        fr: `Choisissez le **blocage si V_HT < 0,9** : le régleur fonctionne normalement, mais s’arrête dès que le réseau souffre.`,
        en: `Choose **blocked if V_HV < 0.9**: the tap changer works normally, but stops as soon as the grid suffers.`,
      },
      check: (lab) => lab.params.oltc === OLTC_MODES.block && !(lab.info as LtvsInfo).unstable,
    },
    {
      id: 'cap',
      title: { fr: 'Des condensateurs', en: 'Capacitors' },
      body: {
        fr: `Avec le régleur normal, ajoutez au moins **0,3 pu** de condensateurs au poste HT : le nez s’éloigne, et le régleur peut faire son travail sans enfoncer le réseau.`,
        en: `With the normal tap changer, add at least **0.3 pu** of capacitors at the HV substation: the nose moves out, and the tap changer can do its job without dragging the grid down.`,
      },
      check: (lab) => lab.params.oltc === OLTC_MODES.on && lab.params.B >= 0.3 && !(lab.info as LtvsInfo).unstable,
    },
    {
      id: 'thermo',
      title: { fr: 'Les thermostats', en: 'Thermostats' },
      body: {
        fr: `Retirez les condensateurs, bloquez le régleur et rendez **toute** la charge « thermostatée » (100 %) : même sans régleur, la charge revient et le système **s’effondre**.`,
        en: `Remove the capacitors, block the tap changer and make **all** of the load thermostatic (100 %): even without the tap changer, load comes back and the system **collapses**.`,
      },
      check: (lab) => lab.params.oltc !== OLTC_MODES.on && lab.params.rec >= 0.95 && lab.params.B < 0.05 && (lab.info as LtvsInfo).collapsed,
    },
  ],
};
