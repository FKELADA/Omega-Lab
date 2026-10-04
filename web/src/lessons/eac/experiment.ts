// Module 8.1 — Transient stability: the swing after a fault, the equal-area
// criterion and the critical clearing time.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { FAULT_AT, pmaxFault, pmaxPost, pmaxPre, smibInfo, smibModel, type SmibInfo } from '../../lib/models/module8';
import SmibCanvas from './SmibCanvas.svelte';
import StabilityTree from './StabilityTree.svelte';

const deg = 180 / Math.PI;
const sinCurve = (Pmax: number): [number, number][] => Array.from({ length: 91 }, (_, j) => [2 * j, Pmax * Math.sin((2 * j) / deg)]);

export const eacLesson: Experiment = {
  id: 'eac',
  path: [
    { fr: 'Module 8 · Stabilité des réseaux', en: 'Module 8 · Power-system stability' },
    { fr: '8.1 Stabilité transitoire', en: '8.1 Transient stability' },
  ],
  title: { fr: 'Stabilité transitoire : critère des aires et temps critique d’élimination', en: 'Transient stability: equal-area criterion and critical clearing time' },
  model: smibModel,
  info: smibInfo,
  canvas: SmibCanvas,
  instruments: [Chart0, StabilityTree],

  params: [
    { id: 'tc', symbol: 't_c', name: { fr: 'Durée du défaut (élimination)', en: 'Fault duration (clearing)' }, unit: 'ms', min: 20, max: 400, default: 150, scale: 'lin', term: 'R' },
    { id: 'Pm', symbol: 'P_m', name: { fr: 'Puissance mécanique', en: 'Mechanical power' }, unit: 'pu', min: 0.3, max: 1, default: 0.8, scale: 'lin', term: 'p' },
    { id: 'H', symbol: 'H', name: { fr: 'Inertie', en: 'Inertia' }, unit: 's', min: 2, max: 8, default: 4, scale: 'lin', term: 'L' },
    {
      id: 'loc',
      symbol: '\\text{lieu}',
      name: { fr: 'Lieu du défaut', en: 'Fault location' },
      unit: '',
      min: 0,
      max: 1,
      default: FAULT_AT.bus,
      scale: 'lin',
      choices: [
        { value: FAULT_AT.bus, label: { fr: 'Au poste (P = 0)', en: 'At the bus (P = 0)' } },
        { value: FAULT_AT.mid, label: { fr: 'En milieu de ligne', en: 'Mid-line' } },
      ],
    },
  ],

  signals: [
    { id: 'delta', symbol: '\\delta', name: { fr: 'Angle rotorique', en: 'Rotor angle' }, unit: '°', color: '--c-p', on: true, term: 'p' },
    { id: 'Pe', symbol: 'P_e', name: { fr: 'Puissance électrique', en: 'Electrical power' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'Pm', symbol: 'P_m', name: { fr: 'Puissance mécanique', en: 'Mechanical power' }, unit: 'pu', color: '--c-R', on: true, dash: true, term: 'R' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence du rotor', en: 'Rotor frequency' }, unit: 'Hz', color: '--c-S', on: false, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Critère des aires égales', en: 'Equal-area criterion' },
      x: { label: 'δ', unit: '°', range: [0, 180] },
      y: { label: 'P', unit: 'pu', range: [0, 1.8] },
      series: (lab) => {
        const k = lab.info as SmibInfo;
        const Pm = lab.params.Pm;
        const Pf = pmaxFault(lab.params.loc);
        const acc: [number, number][] = [];
        for (let d = k.d0; d <= k.dc; d += (k.dc - k.d0) / 30 || 1) acc.push([d * deg, Pm]);
        for (let d = k.dc; d >= k.d0; d -= (k.dc - k.d0) / 30 || 1) acc.push([d * deg, Pf * Math.sin(d)]);
        const dec: [number, number][] = [];
        for (let d = k.dc; d <= k.dmax; d += (k.dmax - k.dc) / 30 || 1) dec.push([d * deg, Math.max(Pm, pmaxPost * Math.sin(d))]);
        for (let d = k.dmax; d >= k.dc; d -= (k.dmax - k.dc) / 30 || 1) dec.push([d * deg, Pm]);
        return [
          { label: { fr: 'aire d’accélération', en: 'accelerating area' }, color: '--warn', pts: acc, fill: true },
          { label: { fr: 'aire de décélération disponible', en: 'available decelerating area' }, color: '--good', pts: dec, fill: true },
          { label: { fr: 'avant défaut', en: 'pre-fault' }, color: '--c-C', pts: sinCurve(pmaxPre), dash: true, width: 1.3 },
          { label: { fr: 'pendant le défaut', en: 'during the fault' }, color: '--warn', pts: sinCurve(Pf), dash: true, width: 1.3 },
          { label: { fr: 'après élimination', en: 'after clearing' }, color: '--c-C', pts: sinCurve(pmaxPost) },
          { label: { fr: 'Pm', en: 'Pm' }, color: '--c-R', pts: [[0, Pm], [180, Pm]], width: 1.5 },
        ];
      },
      points: (lab) => {
        const d = lab.at('delta'), P = lab.at('Pe');
        return isFinite(d) && d <= 180 ? [{ x: d, y: P, color: '--accent' }] : [];
      },
      vlines: (lab) => {
        const k = lab.info as SmibInfo;
        return [{ x: k.dc * deg, label: 'δc' }, { x: k.dmax * deg, label: 'δmax' }];
      },
      note: (lab) => {
        const k = lab.info as SmibInfo;
        return k.stable
          ? { fr: `Stable : l’aire de décélération disponible dépasse l’aire d’accélération (marge ${(100 * k.margin).toFixed(0)} %).`, en: `Stable: the available decelerating area exceeds the accelerating area (margin ${(100 * k.margin).toFixed(0)} %).` }
          : { fr: 'Instable : il n’y a pas assez d’aire de décélération pour absorber l’énergie gagnée pendant le défaut.', en: 'Unstable: there is not enough decelerating area to absorb the energy gained during the fault.' };
      },
    },
  ],

  predict: {
    signal: 'delta',
    yRange: () => [0, 200],
    diagnose(pred, run) {
      const truthMax = Math.max(...Array.from(run.s.delta).filter((v) => v < 400));
      const kPeak = Array.from(run.s.delta).indexOf(truthMax);
      const tPeak = run.t[kPeak];
      const mineAfter = pred.filter(([t]) => t > 0.1 && t < 0.25).map(([, y]) => y);
      const d0 = run.s.delta[0];
      if (mineAfter.length && Math.max(...mineAfter) <= d0 + 2 && truthMax > d0 + 10)
        return {
          fr: `Pendant le défaut, l’alternateur ne peut plus évacuer sa puissance : le rotor **accélère** et l’angle **monte** (ici jusqu’à ${truthMax.toFixed(0)}° vers ${(tPeak * 1000).toFixed(0)} ms). Après l’élimination, il oscille autour de son nouveau point d’équilibre — ou décroche si le défaut a duré trop longtemps.`,
          en: `During the fault the generator can no longer export its power: the rotor **accelerates** and the angle **rises** (here up to ${truthMax.toFixed(0)}° around ${(tPeak * 1000).toFixed(0)} ms). After clearing it swings around its new equilibrium — or slips if the fault lasted too long.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'swing',
      title: { fr: 'L’équation du mouvement', en: 'The swing equation' },
      tex: () => `\\frac{2H}{\\omega_0}\\frac{d^2\\delta}{dt^2} = P_m - P_{max}\\sin\\delta`,
      note: (c) =>
        c.tr({
          fr: 'C’est l’équation non linéaire de la leçon 3.3. Pendant le défaut, $P_{max}$ s’effondre ; après élimination, il est plus faible qu’avant car une ligne a été perdue.',
          en: 'This is the nonlinear equation of lesson 3.3. During the fault $P_{max}$ collapses; after clearing it is lower than before because a line has been lost.',
        }),
    },
    {
      id: 'areas',
      title: { fr: 'Le critère des aires égales', en: 'The equal-area criterion' },
      tex: (c) => {
        const k = c.k as SmibInfo;
        return `A_{acc} = \\int_{\\delta_0}^{\\delta_c}(P_m - P_e)\\,d\\delta = ${c.q(k.Aacc, '', 3)}, \\qquad A_{déc}^{max} = \\int_{\\delta_c}^{\\delta_{max}}(P_e - P_m)\\,d\\delta = ${c.q(k.AdecMax, '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'L’énergie cinétique gagnée pendant le défaut doit être rendue avant que l’angle n’atteigne $\\delta_{max}$, au-delà duquel la puissance électrique repasse sous la puissance mécanique. Stable si $A_{acc} \\le A_{déc}^{max}$.',
          en: 'The kinetic energy gained during the fault must be returned before the angle reaches $\\delta_{max}$, beyond which electrical power drops below mechanical power again. Stable if $A_{acc} \\le A_{dec}^{max}$.',
        }),
    },
    {
      id: 'cct',
      title: { fr: 'Temps critique d’élimination', en: 'Critical clearing time' },
      tex: (c) => {
        const k = c.k as SmibInfo;
        return `t_{cr} = ${k.cct === null ? '\\text{—}' : c.q(k.cct, 'ms', 3)}, \\qquad t_c = ${c.q(c.p.tc, 'ms', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les protections doivent éliminer le défaut avant $t_{cr}$ : en transport, les disjoncteurs s’ouvrent en 80 à 120 ms. Pour un défaut franc au poste, $t_{cr} = \\sqrt{4H(\\delta_{cr} - \\delta_0)/(\\omega_0 P_m)}$.',
          en: 'Protection must clear the fault before $t_{cr}$: in transmission, breakers open within 80–120 ms. For a bolted fault at the bus, $t_{cr} = \\sqrt{4H(\\delta_{cr} - \\delta_0)/(\\omega_0 P_m)}$.',
        }),
    },
    {
      id: 'ibr',
      title: { fr: 'Et avec des onduleurs ?', en: 'And with inverters?' },
      personas: ['research', 'utility'],
      tex: () => `\\text{onduleurs: } I \\le 1{,}1\\text{–}1{,}2\\ \\text{pu},\\quad \\text{pas d’énergie cinétique « naturelle »}`,
      note: (c) =>
        c.tr({
          fr: 'Un onduleur suiveur n’a pas d’angle rotorique, mais sa PLL peut décrocher pendant un défaut ; un formeur a un angle virtuel et peut perdre le synchronisme lui aussi, surtout quand sa limitation de courant agit. La stabilité transitoire se généralise ainsi aux convertisseurs (leçon 8.5).',
          en: 'A grid-following inverter has no rotor angle, but its PLL can lose lock during a fault; a grid-forming one has a virtual angle and can lose synchronism too, especially while its current limit acts. Transient stability thus extends to converters (lesson 8.5).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire l’angle du rotor', en: 'Predict the rotor angle' },
      body: {
        fr: `À $t = 0{,}1$ s, un défaut triphasé au poste dure 150 ms ; une ligne est ensuite perdue. **Dessinez l’angle du rotor**, puis révélez.`,
        en: `At $t = 0.1$ s a three-phase fault at the bus lasts 150 ms; one line is then lost. **Sketch the rotor angle**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'loss',
      title: { fr: 'Trop tard', en: 'Too late' },
      body: {
        fr: `Allongez la durée du défaut au-delà du **temps critique** : l’angle s’emballe, l’alternateur perd le synchronisme. Sur le graphique, l’aire d’accélération dépasse l’aire disponible.`,
        en: `Lengthen the fault beyond the **critical clearing time**: the angle runs away, the generator loses synchronism. On the chart, the accelerating area exceeds the available one.`,
      },
      check: (lab) => !(lab.info as SmibInfo).stable,
    },
    {
      id: 'edge',
      title: { fr: 'Sur le fil', en: 'On the edge' },
      body: {
        fr: `Réglez la durée du défaut juste sous le temps critique (moins de **10 ms** d’écart) : l’angle frôle $\\delta_{max}$ avant de revenir, et les deux aires sont presque égales.`,
        en: `Set the fault duration just under the critical time (less than **10 ms** below): the angle grazes $\\delta_{max}$ before coming back, and the two areas are almost equal.`,
      },
      check: (lab) => {
        const k = lab.info as SmibInfo;
        return k.stable && k.cct !== null && k.cct - lab.params.tc < 10;
      },
    },
    {
      id: 'inertia',
      title: { fr: 'Plus d’inertie', en: 'More inertia' },
      body: {
        fr: `Doublez l’inertie (**8 s**) : l’angle monte moins vite pendant le défaut, et le temps critique augmente d’environ $\\sqrt2$.`,
        en: `Double the inertia (**8 s**): the angle rises more slowly during the fault, and the critical time grows by about $\\sqrt2$.`,
      },
      check: (lab) => lab.params.H >= 7.9,
    },
    {
      id: 'load',
      title: { fr: 'Moins chargé', en: 'Less loaded' },
      body: {
        fr: `Réduisez la puissance mécanique à **0,6 pu** ou moins : moins d’accélération et plus de marge. Un alternateur peu chargé est plus robuste.`,
        en: `Reduce the mechanical power to **0.6 pu** or less: less acceleration and more margin. A lightly loaded generator is more robust.`,
      },
      check: (lab) => lab.params.Pm <= 0.6,
    },
    {
      id: 'remote',
      title: { fr: 'Un défaut plus lointain', en: 'A more distant fault' },
      body: {
        fr: `Placez le défaut **en milieu de ligne** : un peu de puissance passe encore pendant le défaut, l’aire d’accélération rétrécit et le temps critique augmente.`,
        en: `Place the fault **mid-line**: some power still flows during the fault, the accelerating area shrinks and the critical time grows.`,
      },
      check: (lab) => lab.params.loc === FAULT_AT.mid,
    },
  ],
};
