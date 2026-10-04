// Module 4.4 — Loads: how consumption reacts to voltage.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { LOAD_T_STEP, loadInfo, loadModel, zipP, zipWeights, type LoadInfo } from '../../lib/models/module4';
import LoadCanvas from './LoadCanvas.svelte';

const curve = (f: (V: number) => number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let V = 0.6; V <= 1.15; V += 0.01) pts.push([V, f(V)]);
  return pts;
};

export const loadsLesson: Experiment = {
  id: 'loads',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.4 Charges', en: '4.4 Loads' },
  ],
  title: { fr: 'Comment la consommation réagit à la tension', en: 'How consumption reacts to voltage' },
  model: loadModel,
  info: loadInfo,
  canvas: LoadCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'Vstep', symbol: 'V_2', name: { fr: 'Tension après l’échelon (t = 5 s)', en: 'Voltage after the step (t = 5 s)' }, unit: 'pu', min: 0.85, max: 1.05, default: 0.9, scale: 'lin', term: 'S' },
    { id: 'z', symbol: 'a_Z', name: { fr: 'Part impédance constante', en: 'Constant-impedance share' }, unit: '', min: 0, max: 1, default: 0.4, scale: 'lin', term: 'R' },
    { id: 'i', symbol: 'a_I', name: { fr: 'Part courant constant', en: 'Constant-current share' }, unit: '', min: 0, max: 1, default: 0.3, scale: 'lin', term: 'i' },
    { id: 'dyn', symbol: 'a_D', name: { fr: 'Part qui se rétablit', en: 'Recovering share' }, unit: '', min: 0, max: 1, default: 0, scale: 'lin', term: 'L' },
    { id: 'Tp', symbol: 'T_p', name: { fr: 'Constante de rétablissement', en: 'Recovery time constant' }, unit: 's', min: 1, max: 60, default: 15, scale: 'log', term: 'L' },
  ],

  signals: [
    { id: 'p', symbol: 'P', name: { fr: 'Puissance consommée', en: 'Power drawn' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'v', symbol: 'V', name: { fr: 'Tension', en: 'Voltage' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'i', symbol: 'I', name: { fr: 'Courant', en: 'Current' }, unit: 'pu', color: '--c-i', on: false, term: 'i' },
    { id: 'pz', symbol: 'V^2', name: { fr: 'Référence impédance constante', en: 'Constant-impedance reference' }, unit: 'pu', color: '--c-R', on: false, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Puissance selon la tension', en: 'Power versus voltage' },
      x: { label: 'V', unit: 'pu', range: [0.6, 1.15] },
      y: { label: 'P', unit: 'pu', range: [0.3, 1.35] },
      series: (lab) => {
        const w = zipWeights(lab.params);
        return [
          { label: { fr: 'Z : V²', en: 'Z: V²' }, color: '--c-R', pts: curve((V) => V * V), dash: true, width: 1.5 },
          { label: { fr: 'I : V', en: 'I: V' }, color: '--c-i', pts: curve((V) => V), dash: true, width: 1.5 },
          { label: { fr: 'P : constante', en: 'P: constant' }, color: '--c-C', pts: curve(() => 1), dash: true, width: 1.5 },
          { label: { fr: 'mélange (statique)', en: 'mix (static)' }, color: '--c-p', pts: curve((V) => zipP(w, V)) },
        ];
      },
      points: (lab) => [{ x: lab.at('v'), y: lab.at('p'), color: '--accent' }],
    },
    {
      title: { fr: 'Courant selon la tension', en: 'Current versus voltage' },
      x: { label: 'V', unit: 'pu', range: [0.6, 1.15] },
      y: { label: 'I', unit: 'pu', range: [0.5, 1.7] },
      series: (lab) => {
        const w = zipWeights(lab.params);
        return [
          { label: { fr: 'puissance constante : 1/V', en: 'constant power: 1/V' }, color: '--c-C', pts: curve((V) => 1 / V), dash: true, width: 1.5 },
          { label: { fr: 'impédance constante : V', en: 'constant impedance: V' }, color: '--c-R', pts: curve((V) => V), dash: true, width: 1.5 },
          { label: { fr: 'mélange', en: 'mix' }, color: '--c-p', pts: curve((V) => zipP(w, V) / V) },
        ];
      },
      points: (lab) => [{ x: lab.at('v'), y: lab.at('i'), color: '--accent' }],
      note: () => ({ fr: 'Une charge à puissance constante tire plus de courant quand la tension baisse : elle aggrave la chute.', en: 'A constant-power load draws more current when voltage falls: it makes the drop worse.' }),
    },
  ],

  predict: {
    signal: 'p',
    yRange: () => [0.7, 1.1],
    diagnose(pred, run) {
      const after = pred.filter(([t]) => t > LOAD_T_STEP + 2).map(([, y]) => y);
      const truth = run.s.p[run.t.length - 1];
      if (after.length && Math.min(...after) > 0.985 && truth < 0.97)
        return {
          fr: 'La plupart des appareils consomment **moins** quand la tension baisse : un radiateur suit $V^2$ (−19 % pour −10 % de tension). Seule l’électronique régulée garde sa puissance.',
          en: 'Most appliances draw **less** when voltage falls: a heater follows $V^2$ (−19 % for −10 % voltage). Only regulated electronics keep their power.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'zip',
      title: { fr: 'Le modèle ZIP', en: 'The ZIP model' },
      tex: (c) => {
        const k = c.k as LoadInfo;
        return `\\begin{aligned}
          \\frac{P}{P_0} &= ${c.term('R', 'a_Z')}V^2 + ${c.term('i', 'a_I')}V + a_P \\\\
          &= ${c.q(k.w.z, '', 2)}\\,V^2 + ${c.q(k.w.i, '', 2)}\\,V + ${c.q(k.w.p, '', 2)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Trois familles : impédance constante (chauffage, éclairage à incandescence), courant constant, puissance constante (électronique, moteurs régulés).',
          en: 'Three families: constant impedance (heating, incandescent lighting), constant current, constant power (electronics, regulated motors).',
        }),
    },
    {
      id: 'exp',
      title: { fr: 'Le modèle exponentiel', en: 'The exponential model' },
      tex: () => `\\frac{P}{P_0} = V^{\\alpha}, \\qquad \\alpha = 2\\ (Z),\\ 1\\ (I),\\ 0\\ (P)`,
      note: (c) =>
        c.tr({
          fr: 'Une seule pente $\\alpha$ autour du point de fonctionnement : souvent utilisée dans les études de stabilité.',
          en: 'A single slope $\\alpha$ around the operating point: often used in stability studies.',
        }),
    },
    {
      id: 'recovery',
      title: { fr: 'Charge qui se rétablit', en: 'Recovering load' },
      tex: () => `T_p\\,\\frac{dx}{dt} = -x + P_0\\left(V^{\\alpha_s} - V^{\\alpha_t}\\right), \\qquad P = x + P_0 V^{\\alpha_t}`,
      note: (c) =>
        c.tr({
          fr: 'Juste après l’échelon, la charge se comporte comme une impédance ($\\alpha_t = 2$). Puis thermostats et régleurs la ramènent à sa puissance d’origine ($\\alpha_s = 0$) en quelques dizaines de secondes. C’est un moteur classique de l’effondrement de tension (module 8).',
          en: 'Right after the step, the load behaves like an impedance ($\\alpha_t = 2$). Then thermostats and tap changers bring it back to its original power ($\\alpha_s = 0$) within tens of seconds. A classic driver of voltage collapse (Module 8).',
        }),
    },
    {
      id: 'cvr',
      title: { fr: 'Réduction de tension (CVR)', en: 'Conservation voltage reduction (CVR)' },
      personas: ['utility', 'research'],
      tex: (c) => `\\mathrm{CVR} = \\frac{\\Delta P/P}{\\Delta V/V} \\approx 2a_Z + a_I = ${c.q((c.k as LoadInfo).cvr, '', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Baisser un peu la tension de distribution économise de l’énergie si la charge est surtout résistive. L’effet diminue à mesure que l’électronique à puissance constante se généralise.',
          en: 'Lowering distribution voltage slightly saves energy if the load is mostly resistive. The effect shrinks as constant-power electronics spread.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la consommation', en: 'Predict the consumption' },
      body: {
        fr: `À $t = 5$ s, la tension d’un quartier baisse de **10 %**. **Dessinez la puissance consommée**, puis révélez.`,
        en: `At $t = 5$ s, a neighbourhood’s voltage drops by **10 %**. **Sketch the power drawn**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'resistive',
      title: { fr: 'Que du chauffage', en: 'Heating only' },
      body: {
        fr: `Mettez $a_Z = 1$ et $a_I = 0$ : une charge purement résistive. La puissance chute à $0{,}9^2 = 0{,}81$, soit **−19 %**.`,
        en: `Set $a_Z = 1$ and $a_I = 0$: a purely resistive load. Power drops to $0.9^2 = 0.81$, that is **−19 %**.`,
      },
      check: (lab) => (lab.info as LoadInfo).w.z > 0.99 && lab.params.dyn < 0.01,
    },
    {
      id: 'constant',
      title: { fr: 'Que de l’électronique', en: 'Electronics only' },
      body: {
        fr: `Mettez $a_Z = a_I = 0$ : une charge à **puissance constante**. La puissance ne bouge pas… mais le **courant augmente** de 11 %. Affichez $I$ sur l’oscilloscope.`,
        en: `Set $a_Z = a_I = 0$: a **constant-power** load. Power does not move… but the **current rises** by 11 %. Show $I$ on the oscilloscope.`,
      },
      check: (lab) => (lab.info as LoadInfo).w.p > 0.99 && !!lab.visible.i,
    },
    {
      id: 'recover',
      title: { fr: 'La charge revient', en: 'The load comes back' },
      body: {
        fr: `Mettez au moins **80 %** de charge qui se rétablit et lancez la lecture ▶. La puissance chute, puis **remonte** vers 1 pu en quelques $T_p$ : les thermostats rallongent les cycles de chauffe.`,
        en: `Set at least **80 %** recovering load and press play ▶. Power drops, then **climbs back** to 1 pu over a few $T_p$: thermostats lengthen the heating cycles.`,
      },
      check: (lab) => lab.params.dyn >= 0.8 && lab.maxFrac > 0.9,
    },
    {
      id: 'cvr',
      title: { fr: 'Économiser en baissant la tension', en: 'Saving by lowering the voltage' },
      body: {
        fr: `Mettez la part qui se rétablit à 0, une charge surtout **résistive** ($a_Z \\geq 0{,}7$), et une baisse de tension de seulement **3 à 5 %**. Lisez le facteur CVR : chaque % de tension en moins économise près de 2 % d’énergie.`,
        en: `Set the recovering share to 0, a mostly **resistive** load ($a_Z \\geq 0.7$), and a voltage drop of just **3–5 %**. Read the CVR factor: every % of voltage less saves nearly 2 % of energy.`,
      },
      check: (lab) => lab.params.dyn < 0.01 && lab.params.Vstep >= 0.95 && lab.params.Vstep <= 0.97 && (lab.info as LoadInfo).w.z >= 0.7,
    },
  ],
};
