// Module 4.3 — Transformers that regulate: on-load tap changer, phase shifter, vector groups.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import type { Experiment } from '../../lib/lab/types';
import { polar } from '../../lib/core/linalg';
import { GROUPS, OLTC, PST, lvPhasor, oltcInfo, oltcModel, pstFlows, type OltcInfo } from '../../lib/models/module4b';
import OltcCanvas from './OltcCanvas.svelte';

const g = (name: string) => GROUPS.findIndex((x) => x.name === name);

export const oltcLesson: Experiment = {
  id: 'oltc',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.3 Régleur, déphaseur, couplages', en: '4.3 Tap changer, phase shifter, vector groups' },
  ],
  title: { fr: 'Le transformateur qui règle : prises en charge, déphaseur et couplages', en: 'The transformer that regulates: on-load taps, phase shifter and vector groups' },
  model: oltcModel,
  info: oltcInfo,
  canvas: OltcCanvas,
  instruments: [Chart0, PhasorDiagram],

  params: [
    { id: 'V1', symbol: 'V_{HT}', name: { fr: 'Tension amont après le creux (t = 10 s)', en: 'Upstream voltage after the dip (t = 10 s)' }, unit: 'pu', min: 0.85, max: 1.08, default: 0.92, scale: 'lin', term: 'S' },
    { id: 'DB', symbol: 'DB', name: { fr: 'Bande morte du régulateur (largeur totale)', en: 'Regulator dead band (full width)' }, unit: '%', min: 0.5, max: 4, default: 2, scale: 'lin', term: 'C' },
    { id: 'Td', symbol: 'T_1', name: { fr: 'Temporisation du premier changement de prise', en: 'Delay before the first tap change' }, unit: 's', min: 5, max: 60, default: 30, scale: 'lin', term: 'L' },
    { id: 'alpha', sweep: false, symbol: '\\alpha', name: { fr: 'Angle du transformateur déphaseur', en: 'Phase-shifter angle' }, unit: '°', min: -15, max: 15, default: 0, scale: 'lin', term: 'p' },
    {
      id: 'group',
      sweep: false,
      symbol: 'G',
      name: { fr: 'Couplage', en: 'Vector group' },
      unit: '',
      min: 0,
      max: GROUPS.length - 1,
      default: 0,
      scale: 'lin',
      choices: GROUPS.map((x, i) => ({ value: i, label: { fr: x.name, en: x.name } })),
    },
  ],

  signals: [
    { id: 'vlv', symbol: 'V_{BT}', name: { fr: 'Tension réglée (aval)', en: 'Regulated voltage (downstream)' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'vhv', symbol: 'V_{HT}', name: { fr: 'Tension amont', en: 'Upstream voltage' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'vset', symbol: 'V_{c}', name: { fr: 'Consigne', en: 'Setpoint' }, unit: 'pu', color: '--c-C', on: true, dash: true },
    { id: 'tap', symbol: 'n', name: { fr: 'Prise', en: 'Tap position' }, unit: '', color: '--c-L', on: true, term: 'L' },
  ],

  phasors: {
    omega: () => 2 * Math.PI * 50,
    unit: 'pu',
    rms: true,
    items: (_p, k: OltcInfo) => [
      { id: 'A', label: 'V_A (HT)', term: 'S', color: '--c-a', value: polar(1, 0) },
      { id: 'B', label: 'V_B', term: 'S', color: '--c-b', value: polar(1, (-2 * Math.PI) / 3), thin: true },
      { id: 'C', label: 'V_C', term: 'S', color: '--c-c', value: polar(1, (2 * Math.PI) / 3), thin: true },
      { id: 'a', label: 'V_a (BT)', term: 'C', color: '--c-C', value: lvPhasor(k.group, 0.7) },
    ],
  },

  charts: [
    {
      title: { fr: 'Transformateur déphaseur : partage entre deux lignes parallèles', en: 'Phase shifter: sharing between two parallel lines' },
      x: { label: 'α', unit: '°', range: [-15, 15] },
      y: { label: 'P', unit: 'pu', range: [0, 1] },
      series: () => {
        const p1: [number, number][] = [], p2: [number, number][] = [];
        for (let a = -15; a <= 15.001; a += 0.5) {
          const f = pstFlows(a);
          p1.push([a, f.P1]);
          p2.push([a, f.P2]);
        }
        return [
          { label: { fr: 'ligne 1 (avec déphaseur)', en: 'line 1 (with phase shifter)' }, color: '--c-p', pts: p1 },
          { label: { fr: 'ligne 2', en: 'line 2' }, color: '--c-i', pts: p2 },
          { label: { fr: 'limite de la ligne 1', en: 'line 1 rating' }, color: '--c-R', pts: [[-15, PST.rating], [15, PST.rating]], dash: true, width: 1.5 },
        ];
      },
      points: (lab) => {
        const k = lab.info as OltcInfo;
        return [
          { x: lab.params.alpha, y: k.P1, color: '--c-p' },
          { x: lab.params.alpha, y: k.P2, color: '--c-i' },
        ];
      },
      note: (lab) =>
        (lab.info as OltcInfo).P1 > PST.rating
          ? { fr: 'La ligne 1 est surchargée : elle prend plus que sa part parce qu’elle est la moins impédante.', en: 'Line 1 is overloaded: it takes more than its share because it has the lower impedance.' }
          : { fr: 'Le déphaseur repousse une partie du transit vers la ligne 2 : il pilote le partage sans toucher aux productions.', en: 'The phase shifter pushes part of the flow onto line 2: it steers the sharing without touching generation.' },
    },
  ],

  predict: {
    signal: 'vlv',
    yRange: () => [0.85, 1.08],
    diagnose(pred, run) {
      const end = pred.filter(([t]) => t > 150).map(([, y]) => y);
      const early = pred.filter(([t]) => t > 12 && t < 30).map(([, y]) => y);
      const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
      const truth = run.s.vlv[run.s.vlv.length - 1];
      if (end.length && avg(end) < truth - 0.03)
        return {
          fr: 'La tension ne reste pas basse : le régleur en charge change de prise, **une à une**, jusqu’à ramener la tension dans sa bande. C’est son unique rôle.',
          en: 'The voltage does not stay low: the on-load tap changer moves **one tap at a time** until the voltage is back in its band. That is its whole job.',
        };
      if (early.length && avg(early) > 0.98)
        return {
          fr: 'Le régleur n’est pas instantané : il attend d’abord sa **temporisation** (30 s ici) pour ne pas réagir aux creux brefs, puis avance d’environ 1,25 % par prise toutes les 10 s.',
          en: 'The tap changer is not instantaneous: it first waits for its **time delay** (30 s here) so as not to react to short dips, then moves about 1.25 % per tap every 10 s.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'tap',
      title: { fr: 'Le rapport variable', en: 'The variable ratio' },
      tex: (c) => {
        const k = c.k as OltcInfo;
        return `\\begin{aligned}
          V_{BT} &= V_{HT}\\,(1 + n\\,\\Delta) - \\varepsilon, \\quad \\Delta = ${(OLTC.step * 100).toString().replace('.', '{,}')}\\,\\%, \\ |n| \\le ${OLTC.nMax} \\\\
          n_{fin} &= ${k.tapEnd}, \\qquad V_{BT} = ${c.q(k.vEnd, 'pu', 4)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le régleur ajoute ou retire des spires côté haute tension, sous charge, sans couper le courant (commutateur à résistances ou à vide). La chute $\\varepsilon$ du transformateur est ici de 3 %.',
          en: 'The tap changer adds or removes turns on the high-voltage side, on load, without interrupting the current (resistor or vacuum diverter). The transformer drop $\\varepsilon$ is 3 % here.',
        }),
    },
    {
      id: 'band',
      title: { fr: 'Bande morte et temporisation', en: 'Dead band and delay' },
      tex: (c) => `|V_{BT} - V_c| > \\tfrac{DB}{2} \\text{ ${c.tr({ fr: 'pendant', en: 'for' })} } T_1 \\ (\\text{${c.tr({ fr: 'puis', en: 'then' })} } T_2 = ${OLTC.T2}\\ \\text{s}) \\;\\Rightarrow\\; n \\leftarrow n \\pm 1, \\qquad DB > \\Delta = ${c.q(OLTC.step * 100, '\\%', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Si la bande morte est plus étroite qu’un pas de prise, aucune prise ne tombe dans la bande : le régulateur oscille (« pompage »). La temporisation évite d’user le commutateur sur des creux brefs.',
          en: 'If the dead band is narrower than one tap step, no tap lands inside it: the regulator hunts. The time delay avoids wearing the diverter on short dips.',
        }),
    },
    {
      id: 'pst',
      title: { fr: 'Le déphaseur', en: 'The phase shifter' },
      tex: (c) => {
        const k = c.k as OltcInfo;
        return `P_1 = \\frac{P\\,X_2 + \\alpha}{X_1 + X_2} = ${c.q(k.P1, 'pu', 3)}, \\qquad P_2 = ${c.q(k.P2, 'pu', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'En courant continu équivalent, le transit suit l’écart d’angle. Le déphaseur ajoute un angle $\\alpha$ en série : il pousse ou retient la puissance dans sa ligne. RTE en exploite plusieurs aux frontières.',
          en: 'In the DC approximation, flow follows the angle difference. The phase shifter adds an angle $\\alpha$ in series: it pushes power into its line or holds it back. TSOs use them at borders.',
        }),
    },
    {
      id: 'group',
      title: { fr: 'Couplage et indice horaire', en: 'Vector group and clock number' },
      tex: (c) => {
        const k = c.k as OltcInfo;
        return `\\text{${k.group.name}}: \\quad \\underline V_a = \\underline V_A\\,e^{-j\\,${k.group.h}\\times 30^\\circ} \\quad (${k.shift}^\\circ)`;
      },
      note: (c) => {
        const k = c.k as OltcInfo;
        const hv = k.group.earthHV ? c.tr({ fr: 'passe côté HT (neutre à la terre)', en: 'flows on the HV side (earthed neutral)' }) : c.tr({ fr: 'ne passe pas côté HT', en: 'cannot flow on the HV side' });
        const lv = k.group.earthLV ? c.tr({ fr: 'passe côté BT (neutre sorti)', en: 'flows on the LV side (neutral brought out)' }) : c.tr({ fr: 'ne passe pas côté BT', en: 'cannot flow on the LV side' });
        return c.tr({
          fr: `L’indice $h$ donne le retard de la BT sur la HT, en heures de 30°. Courant homopolaire : il ${hv}, il ${lv}${k.group.delta ? ' ; il circule dans le triangle sans le traverser.' : '.'}`,
          en: `The clock number $h$ gives how far LV lags HV, in 30° hours. Zero-sequence current ${hv} and ${lv}${k.group.delta ? '; it circulates inside the delta without crossing it.' : '.'}`,
        });
      },
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension réglée', en: 'Predict the regulated voltage' },
      body: {
        fr: `À $t = 10$ s, la tension du réseau amont tombe à **0,92 pu** et y reste. Le transformateur a un régleur en charge (bande ±1 %, temporisation 30 s). **Dessinez la tension aval** sur 3 minutes, puis révélez.`,
        en: `At $t = 10$ s the upstream grid voltage falls to **0.92 pu** and stays there. The transformer has an on-load tap changer (band ±1 %, delay 30 s). **Sketch the downstream voltage** over 3 minutes, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'limit',
      title: { fr: 'La butée du régleur', en: 'The tap changer’s end stop' },
      body: {
        fr: `Baissez la tension amont jusqu’à ce que le régleur arrive **en butée** (prise +12) sans retrouver la bande. Sa plage, environ ±15 %, ne suffit plus.`,
        en: `Lower the upstream voltage until the tap changer reaches its **end stop** (tap +12) without getting back into the band. Its range, about ±15 %, is no longer enough.`,
      },
      check: (lab) => (lab.info as OltcInfo).atLimit,
    },
    {
      id: 'hunting',
      title: { fr: 'Le pompage', en: 'Hunting' },
      body: {
        fr: `Remettez $V_{HT} = 0{,}92$ pu et réduisez la bande morte à **0,8 %**, moins qu’un pas de prise. Regardez la prise sur l’oscilloscope.`,
        en: `Set $V_{HT} = 0.92$ pu again and narrow the dead band to **0.8 %**, less than one tap step. Watch the tap position on the oscilloscope.`,
      },
      check: (lab) => (lab.info as OltcInfo).hunting,
    },
    {
      id: 'delay',
      title: { fr: 'Régler sans pomper, plus vite', en: 'Regulating faster, without hunting' },
      body: {
        fr: `Revenez à une bande de **2 %** et ramenez la temporisation à **10 s** ou moins. La tension revient plus tôt, au prix de manœuvres sur des creux plus brefs.`,
        en: `Go back to a **2 %** band and bring the delay down to **10 s** or less. The voltage comes back sooner, at the cost of operating on shorter dips.`,
      },
      check: (lab) => lab.params.Td <= 10 && lab.params.DB >= 1.5 && (lab.info as OltcInfo).inBand && !(lab.info as OltcInfo).hunting,
    },
    {
      id: 'pst',
      title: { fr: 'Soulager une ligne avec le déphaseur', en: 'Relieving a line with the phase shifter' },
      body: {
        fr: `Deux lignes parallèles transportent 1 pu. La ligne 1, moins impédante, porte 0,58 pu pour une limite de **0,45 pu**. Réglez l’angle du déphaseur pour la ramener sous sa limite.`,
        en: `Two parallel lines carry 1 pu. Line 1, with the lower impedance, carries 0.58 pu against a **0.45 pu** rating. Set the phase-shifter angle to bring it under its rating.`,
      },
      check: (lab) => (lab.info as OltcInfo).P1 <= PST.rating,
    },
    {
      id: 'group',
      title: { fr: 'Le couplage d’un poste HTA/BT', en: 'The vector group of an MV/LV substation' },
      body: {
        fr: `Choisissez le couplage d’un transformateur de distribution : il doit **sortir un neutre côté BT** (pour les clients monophasés) et **bloquer l’homopolaire** vers le réseau HTA.`,
        en: `Choose the vector group of a distribution transformer: it must **bring out a neutral on the LV side** (for single-phase customers) and **block zero sequence** towards the MV grid.`,
      },
      check: (lab) => [g('Dyn11'), g('Dyn5')].includes(Math.round(lab.params.group)),
    },
  ],
};
