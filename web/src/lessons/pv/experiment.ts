// Module 5.2 — P–V and Q–V curves on the four-bus network. The cursor raises
// the load (λ) towards the nose.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { ChartSeries, Experiment } from '../../lib/lab/types';
import { NET, pvAt, pvInfo, pvLessonInfo, pvModel, PV_LMAX, qvAt, type PvLessonInfo } from '../../lib/models/module5';
import { num } from '../../lib/ui/format';
import PvCanvas from './PvCanvas.svelte';

/** Base load (λ = 1) in MW. */
const P0 = (NET.load3 + NET.load4) * 100;

export const pvLesson: Experiment = {
  id: 'pv',
  path: [
    { fr: 'Module 5 · Le réseau en régime permanent', en: 'Module 5 · The network in steady state' },
    { fr: '5.2 Courbes P–V et Q–V', en: '5.2 P–V and Q–V curves' },
  ],
  title: { fr: 'Jusqu’où charger le réseau ? Courbes P–V et Q–V', en: 'How far can the grid be loaded? P–V and Q–V curves' },
  model: pvModel,
  info: pvLessonInfo,
  canvas: PvCanvas,
  instruments: [Chart0, Chart1],
  axis: { label: { fr: 'Charge λ', en: 'Load λ' }, symbol: 'λ', fmt: (v, d = 3) => `${num(v, d)}×` },

  params: [
    { id: 'pf', symbol: '\\cos\\varphi', name: { fr: 'Facteur de puissance des charges', en: 'Load power factor' }, unit: '', min: 0.85, max: 1, default: 0.9, scale: 'lin', term: 'R' },
    { id: 'Q2max', symbol: 'Q_{2,max}', name: { fr: 'Limite de réactif du générateur 2', en: 'Generator 2 reactive limit' }, unit: 'pu', min: 0.3, max: 5, default: 5, scale: 'lin', term: 'S' },
    { id: 'B4', symbol: 'B_4', name: { fr: 'Condensateur au nœud 4', en: 'Capacitor at bus 4' }, unit: 'pu', min: 0, max: 0.8, default: 0, scale: 'lin', term: 'C' },
    {
      id: 'out',
      symbol: '\\text{✕}',
      name: { fr: 'Ligne hors service', en: 'Line out of service' },
      unit: '',
      min: 0,
      max: 3,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Aucune', en: 'None' } },
        { value: 1, label: { fr: 'Ligne 1–3', en: 'Line 1–3' } },
        { value: 2, label: { fr: 'Ligne 2–4', en: 'Line 2–4' } },
        { value: 3, label: { fr: 'Ligne 3–4', en: 'Line 3–4' } },
      ],
    },
  ],

  signals: [
    { id: 'v4', symbol: 'V_4', name: { fr: 'Tension au nœud 4', en: 'Bus 4 voltage' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'v3', symbol: 'V_3', name: { fr: 'Tension au nœud 3', en: 'Bus 3 voltage' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'v2', symbol: 'V_2', name: { fr: 'Tension au nœud 2', en: 'Bus 2 voltage' }, unit: 'pu', color: '--c-S', on: false, term: 'S' },
    { id: 'q2', symbol: 'Q_2', name: { fr: 'Réactif du générateur 2', en: 'Generator 2 reactive power' }, unit: 'pu', color: '--c-L', on: true, term: 'L' },
    { id: 'q2max', symbol: 'Q_{2,max}', name: { fr: 'Sa limite', en: 'Its limit' }, unit: 'pu', color: '--c-L', on: true, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Courbe P–V (charge totale)', en: 'P–V curve (total load)' },
      x: { label: 'P', unit: 'MW', range: [0, PV_LMAX * P0] },
      y: { label: 'V', unit: 'pu', range: [0.4, 1.15] },
      bands: () => [{ y0: 0.95, y1: 1.05 }],
      series: (lab) => {
        const k = lab.info as PvLessonInfo;
        const ok = k.pts.filter((q) => q.ok);
        const s: ChartSeries[] = [
          { label: { fr: 'V₃', en: 'V₃' }, color: '--c-C', pts: ok.map((q) => [q.lambda * P0, q.V[2]] as [number, number]), width: 1.5 },
          { label: { fr: 'V₄', en: 'V₄' }, color: '--c-p', pts: ok.map((q) => [q.lambda * P0, q.V[3]] as [number, number]) },
        ];
        if (k.lambdaMaxNoLim - k.lambdaMax > 0.02) {
          const ref = pvInfo({ ...lab.params, Q2max: 99 }).pts.filter((q) => q.ok);
          s.push({ label: { fr: 'V₄ sans limite de Q₂', en: 'V₄ without Q₂ limit' }, color: '--c-p', pts: ref.map((q) => [q.lambda * P0, q.V[3]] as [number, number]), dash: true, width: 1.2 });
        }
        return s;
      },
      points: (lab) => {
        const pt = pvAt(lab.info as PvLessonInfo, lab.t);
        return pt.ok ? [{ x: pt.lambda * P0, y: pt.V[3], color: '--c-p' }] : [];
      },
      vlines: (lab) => {
        const k = lab.info as PvLessonInfo;
        const v = [{ x: k.lambdaMax * P0, label: 'P max' }];
        if (k.lambdaQlim !== null && k.lambdaMaxNoLim - k.lambdaMax > 0.02) v.push({ x: k.lambdaQlim * P0, label: 'Q₂ max' });
        return v;
      },
      note: (lab) => {
        const k = lab.info as PvLessonInfo;
        return {
          fr: `Nez à ${num(k.lambdaMax * P0, 3)} MW (λ = ${num(k.lambdaMax, 3)}). Au-delà, aucune solution.`,
          en: `Nose at ${num(k.lambdaMax * P0, 3)} MW (λ = ${num(k.lambdaMax, 3)}). Beyond it, no solution.`,
        };
      },
    },
    {
      title: { fr: 'Courbe Q–V au nœud 4', en: 'Q–V curve at bus 4' },
      x: { label: 'V₄', unit: 'pu', range: [0.4, 1.15] },
      y: { label: 'Q', unit: 'pu', range: [-3, 3] },
      series: (lab) => {
        const qv = qvAt(lab.params, lab.t);
        return [
          { label: { fr: `réactif à injecter (λ = ${num(qv.lambda, 3)})`, en: `reactive power needed (λ = ${num(qv.lambda, 3)})` }, color: '--c-L', pts: qv.pts },
          { color: '--muted', pts: [[0.4, 0], [1.15, 0]], width: 1 },
        ];
      },
      points: (lab) => {
        const pt = pvAt(lab.info as PvLessonInfo, lab.t);
        return pt.ok ? [{ x: pt.V[3], y: 0, color: '--c-p' }] : [];
      },
      note: (lab) => {
        const qv = qvAt(lab.params, lab.t);
        return qv.margin === null || qv.margin <= 0
          ? { fr: 'La courbe ne descend plus sous zéro : il manque du réactif, le point est au-delà du nez.', en: 'The curve no longer dips below zero: reactive power is missing, the point is beyond the nose.' }
          : {
              fr: `Marge réactive : ${num(qv.margin * 100, 3)} Mvar (profondeur du creux sous zéro).`,
              en: `Reactive margin: ${num(qv.margin * 100, 3)} Mvar (depth of the dip below zero).`,
            };
      },
    },
  ],

  predict: {
    signal: 'v4',
    yRange: () => [0.3, 1.2],
    diagnose(pred, _run, p) {
      const lmax = pvInfo(p).lambdaMax;
      const beyond = pred.filter(([t, y]) => t > lmax + 0.15 && y > 0.6);
      if (beyond.length > 3)
        return {
          fr: 'La tension ne baisse pas indéfiniment en douceur : elle **plonge** près du nez, puis il n’y a **plus de solution du tout**. Au-delà, le réseau ne peut pas livrer la puissance demandée : c’est l’effondrement de tension.',
          en: 'Voltage does not keep falling gently: it **dives** near the nose, and then there is **no solution at all**. Beyond it, the grid cannot deliver the power asked for: this is voltage collapse.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'nose',
      title: { fr: 'Le point de charge maximale', en: 'The maximum loading point' },
      tex: (c) => {
        const k = c.k as PvLessonInfo;
        return `\\lambda_{max} = ${c.q(k.lambdaMax, '', 3)}, \\qquad P_{max} = \\lambda_{max} P_0 = ${c.q(k.lambdaMax * P0, 'MW', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'On multiplie toutes les charges par $\\lambda$ et on suit la solution (méthode de continuation). Au nez, le jacobien devient singulier : deux solutions se rejoignent puis disparaissent.',
          en: 'Every load is multiplied by $\\lambda$ and the solution is followed (continuation). At the nose the Jacobian becomes singular: two solutions merge, then vanish.',
        }),
    },
    {
      id: 'qlim',
      title: { fr: 'Les limites de réactif', en: 'Reactive limits' },
      tex: (c) => {
        const k = c.k as PvLessonInfo;
        const pt = pvAt(k, c.t);
        return `Q_2 = ${pt.ok ? c.q(pt.Qg2, 'pu', 3) : '\\text{—}'} \\le Q_{2,max} = ${c.q(c.p.Q2max, 'pu', 3)}${k.lambdaQlim !== null ? `\\qquad \\text{butée à } \\lambda = ${c.q(k.lambdaQlim, '', 3)}` : ''}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un alternateur tient sa tension tant que son excitation le permet (diagramme de capacité, leçon 4.4). En butée, son nœud devient PQ : la tension n’est plus tenue et le nez recule. C’est souvent l’étape qui précède un effondrement.',
          en: 'A generator holds its voltage as long as its excitation allows (capability chart, lesson 4.4). At the limit its bus becomes PQ: the voltage is no longer held and the nose moves in. This often comes just before a collapse.',
        }),
    },
    {
      id: 'shunt',
      title: { fr: 'Condensateurs : utiles mais fragiles', en: 'Capacitors: useful but fragile' },
      tex: (c) => {
        const pt = pvAt(c.k as PvLessonInfo, c.t);
        return `Q_C = B_4 V_4^2 = ${pt.ok ? c.q(c.p.B4 * pt.V[3] ** 2, 'pu', 3) : '\\text{—}'}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un condensateur relève toute la courbe, mais son réactif chute comme $V^2$ : près du nez, il aide de moins en moins. Une tension « normale » ne prouve donc pas qu’on est loin du nez.',
          en: 'A capacitor lifts the whole curve, but its output falls as $V^2$: near the nose it helps less and less. So a “normal” voltage does not prove the nose is far away.',
        }),
    },
    {
      id: 'qv',
      title: { fr: 'La courbe Q–V et la marge réactive', en: 'The Q–V curve and reactive margin' },
      tex: (c) => {
        const qv = qvAt(c.p, c.t);
        return `\\Delta Q_{marge} = -\\min_{V_4} Q_{inj}(V_4) = ${qv.margin === null ? '\\text{—}' : c.q(qv.margin * 100, 'Mvar', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un compensateur fictif impose $V_4$ et l’on note le réactif qu’il doit fournir. Le point de fonctionnement est là où il ne fournit rien ; tant que la courbe descend sous zéro, il reste de la marge.',
          en: 'A fictitious compensator holds $V_4$ and we record the reactive power it must supply. The operating point is where it supplies nothing; as long as the curve dips below zero, margin remains.',
        }),
    },
    {
      id: 'criteria',
      title: { fr: 'Marges d’exploitation', en: 'Operating margins' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as PvLessonInfo;
        const pt = pvAt(k, c.t);
        return `\\text{marge} = \\frac{P_{max} - P}{P} = ${pt.ok && pt.lambda > 0 ? c.q((100 * (k.lambdaMax - pt.lambda)) / pt.lambda, '%', 3) : '\\text{—}'}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les critères usuels (par exemple WECC) demandent une marge en puissance d’au moins 5 % après la perte d’un ouvrage (N–1). Essayez une ligne hors service : la marge fond.',
          en: 'Usual criteria (WECC, for example) require at least 5 % real-power margin after losing one element (N–1). Try a line outage: the margin melts away.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension', en: 'Predict the voltage' },
      body: {
        fr: `Le curseur augmente toutes les charges ensemble, de 0 à 3,5 fois la charge de base. **Dessinez la tension du nœud 4**, puis révélez.`,
        en: `The cursor raises every load together, from 0 to 3.5 times the base load. **Sketch the bus 4 voltage**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'nose',
      title: { fr: 'Trouver le nez', en: 'Find the nose' },
      body: {
        fr: `Faites glisser le curseur de charge jusqu’au **bout de la courbe**. Au nez, le point P–V s’arrête et la courbe Q–V ne passe plus sous zéro.`,
        en: `Drag the load cursor to the **end of the curve**. At the nose the P–V point stops and the Q–V curve no longer dips below zero.`,
      },
      check: (lab) => lab.maxFrac * PV_LMAX >= (lab.info as PvLessonInfo).lambdaMax - 0.02,
    },
    {
      id: 'qlim',
      title: { fr: 'L’alternateur en butée', en: 'The generator at its limit' },
      body: {
        fr: `Réduisez la limite de réactif du générateur 2 à **1 pu** ou moins. Il atteint sa butée avant le nez : sa tension n’est plus tenue, et le nez **recule** (pointillés : sans limite).`,
        en: `Lower generator 2’s reactive limit to **1 pu** or less. It reaches its limit before the nose: its voltage is no longer held, and the nose **moves in** (dashed: without the limit).`,
      },
      check: (lab) => {
        const k = lab.info as PvLessonInfo;
        return lab.params.Q2max <= 1 && k.lambdaQlim !== null && k.lambdaMax < k.lambdaMaxNoLim - 0.05;
      },
    },
    {
      id: 'cap',
      title: { fr: 'Un condensateur au nœud 4', en: 'A capacitor at bus 4' },
      body: {
        fr: `Ajoutez au moins **0,4 pu** de condensateur au nœud 4. La tension remonte partout et le nez s’éloigne un peu.`,
        en: `Add at least **0.4 pu** of capacitor at bus 4. Voltages rise everywhere and the nose moves out a little.`,
      },
      check: (lab) => {
        const k = lab.info as PvLessonInfo;
        return lab.params.B4 >= 0.4 && k.lambdaMax > k.lambdaMaxNoCap;
      },
    },
    {
      id: 'outage',
      title: { fr: 'Perte d’une ligne', en: 'Losing a line' },
      body: {
        fr: `Mettez la ligne **1–3** hors service. Le nez recule fortement : la marge qui semblait confortable ne l’est plus après un incident (N–1).`,
        en: `Take line **1–3** out of service. The nose moves in sharply: a margin that looked comfortable no longer is after an incident (N–1).`,
      },
      check: (lab) => lab.params.out === 1,
    },
    {
      id: 'margin',
      title: { fr: 'Lire la marge réactive', en: 'Reading the reactive margin' },
      body: {
        fr: `Placez le curseur de charge là où la **marge réactive** du nœud 4 est **positive mais inférieure à 20 Mvar**. Le creux de la courbe Q–V frôle zéro : on est tout près du nez.`,
        en: `Put the load cursor where the bus 4 **reactive margin** is **positive but below 20 Mvar**. The dip of the Q–V curve barely reaches below zero: the nose is very close.`,
      },
      check: (lab) => {
        const m = qvAt(lab.params, lab.t).margin;
        return m !== null && m > 0 && m < 0.2;
      },
    },
  ],
};
