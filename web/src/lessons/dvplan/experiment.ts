// Module 10.2 — The distribution voltage plan: the MV and LV budget, line-drop compensation, PV.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { DVP, QMODE, dvpAt, dvpInfo, dvpModel, type DvpInfo } from '../../lib/models/module10';
import DvplanCanvas from './DvplanCanvas.svelte';

export const dvplanLesson: Experiment = {
  id: 'dvplan',
  path: [
    { fr: 'Module 10 · Le gestionnaire du réseau de distribution', en: 'Module 10 · The distribution system operator' },
    { fr: '10.2 Le plan de tension', en: '10.2 The voltage plan' },
  ],
  title: { fr: 'Du poste source au dernier client : le budget de tension', en: 'From the primary substation to the last customer: the voltage budget' },
  model: dvpModel,
  info: dvpInfo,
  canvas: DvplanCanvas,
  instruments: [Chart0],
  timeUnit: 'h',

  params: [
    { id: 'Vc', symbol: 'V_c', name: { fr: 'Consigne du régleur du poste source', en: 'Primary substation tap-changer setpoint' }, unit: '%', min: 99, max: 104, default: 102, scale: 'lin', term: 'S' },
    { id: 'ldc', symbol: 'k_c', name: { fr: 'Compoundage (relève de tension à pleine charge)', en: 'Line-drop compensation (rise at full load)' }, unit: '%', min: 0, max: 4, default: 0, scale: 'lin', term: 'L' },
    { id: 'tap', symbol: 'n_{BT}', name: { fr: 'Prise à vide du transformateur HTA/BT', en: 'MV/LV transformer off-load tap' }, unit: '%', min: -2.5, max: 5, default: 0, step: 2.5, scale: 'lin', term: 'C' },
    { id: 'pv', symbol: 'P_{PV}', name: { fr: 'Photovoltaïque sur le départ (crête)', en: 'PV on the feeder (peak)' }, unit: 'MW', min: 0, max: 12, default: 0, scale: 'lin', term: 'p' },
    {
      id: 'qmode',
      sweep: false,
      symbol: 'Q',
      name: { fr: 'Réactif des producteurs', en: 'Producers’ reactive power' },
      unit: '',
      min: 0,
      max: 2,
      default: QMODE.none,
      scale: 'lin',
      choices: [
        { value: QMODE.none, label: { fr: 'cos φ = 1', en: 'cos φ = 1' } },
        { value: QMODE.tan, label: { fr: 'tan φ = −0,35', en: 'tan φ = −0.35' } },
        { value: QMODE.qu, label: { fr: 'Q(U)', en: 'Q(U)' } },
      ],
    },
  ],

  signals: [
    { id: 'bus', symbol: 'V_{PS}', name: { fr: 'Jeu de barres HTA du poste source', en: 'Primary substation MV busbar' }, unit: '%', color: '--c-S', on: true, term: 'S' },
    { id: 'mv', symbol: 'V_{HTA}', name: { fr: 'Bout du départ HTA', en: 'End of the MV feeder' }, unit: '%', color: '--c-L', on: true, term: 'L' },
    { id: 'lv', symbol: 'V_{BT}', name: { fr: 'Dernier client BT', en: 'Last LV customer' }, unit: '%', color: '--c-C', on: true, term: 'C' },
    { id: 'pnet', symbol: 'P_{net}', name: { fr: 'Transit net dans le départ', en: 'Net flow in the feeder' }, unit: 'MW', color: '--c-p', on: false, term: 'p' },
  ],

  charts: [
    {
      title: { fr: 'Le budget de tension à l’heure du curseur', en: 'The voltage budget at the cursor hour' },
      x: { label: 'point', unit: '', range: [0.5, 4.5] },
      y: { label: 'V', unit: '%', range: [86, 116] },
      bands: () => [{ y0: DVP.limitsLV[0], y1: DVP.limitsLV[1] }],
      series: (lab) => {
        const s = dvpAt(lab.params, lab.t);
        return [
          { label: { fr: 'profil de tension', en: 'voltage profile' }, color: '--c-S', pts: [[1, 100], [2, s.Vbus], [3, s.farMV], [4, s.lvEnd]] },
          { label: { fr: 'nominal', en: 'nominal' }, color: '--c-L', pts: [[0.5, 100], [4.5, 100]], dash: true, width: 1 },
        ];
      },
      points: (lab) => {
        const s = dvpAt(lab.params, lab.t);
        return [
          { x: 2, y: s.Vbus, color: '--c-S', label: 'PS' },
          { x: 3, y: s.farMV, color: '--c-L', label: 'HTA' },
          { x: 4, y: s.lvEnd, color: '--c-C', label: 'BT' },
        ];
      },
      note: () => ({
        fr: '1 : réseau amont · 2 : poste source · 3 : bout du départ HTA · 4 : dernier client BT. Bande verte : 230 V ± 10 % (EN 50160).',
        en: '1: upstream grid · 2: primary substation · 3: end of the MV feeder · 4: last LV customer. Green band: 230 V ± 10 % (EN 50160).',
      }),
    },
  ],

  equations: [
    {
      id: 'budget',
      title: { fr: 'Le budget de tension', en: 'The voltage budget' },
      tex: (c) => {
        const k = c.k as DvpInfo;
        return `V_{BT} = V_{PS} - \\Delta V_{HTA} + n_{BT} - \\Delta V_{transfo} - \\Delta V_{BT} \\in [${k.lvMin.toFixed(1)},\\ ${k.lvMax.toFixed(1)}]\\,\\%`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le client BT doit rester dans 230 V ± 10 %. Le GRD répartit ce budget : chute HTA, prise fixe du transformateur HTA/BT (choisie une fois pour toutes, à vide), chute BT. Ce partage se décide en planification, pas en temps réel.',
          en: 'The LV customer must stay within 230 V ± 10 %. The DSO shares this budget: MV drop, the MV/LV transformer’s fixed tap (set once, off load), LV drop. The split is decided in planning, not in real time.',
        }),
    },
    {
      id: 'ldc',
      title: { fr: 'Le compoundage', en: 'Line-drop compensation' },
      tex: () => `V_{PS} = V_c + k_c\\,\\frac{P_{net}}{P_{max}}`,
      note: (c) =>
        c.tr({
          fr: 'Le régleur du poste source relève sa consigne avec le courant : la tension est plus haute quand les chutes sont fortes, plus basse à faible charge ou quand le PV injecte. Avec un flux inversé, son comportement doit être vérifié.',
          en: 'The primary substation’s tap changer raises its setpoint with the current: the voltage is higher when drops are large, lower at light load or when PV injects. With reverse flow, its behaviour must be checked.',
        }),
    },
    {
      id: 'pv',
      title: { fr: 'La hausse de tension due au PV', en: 'Voltage rise from PV' },
      tex: () => `\\Delta V \\approx \\frac{R\\,(P_L - P_{PV}) + X\\,(Q_L - Q_{PV})}{U^2}, \\qquad Q_{PV} = \\tan\\varphi\\,P_{PV}`,
      note: (c) =>
        c.tr({
          fr: 'En distribution, $R \\approx X$ : injecter du $P$ fait monter la tension presque autant qu’absorber du $Q$ la fait baisser. Absorber du réactif aide, mais coûte des pertes et ne compense qu’en partie.',
          en: 'In distribution, $R \\approx X$: injecting $P$ raises the voltage almost as much as absorbing $Q$ lowers it. Absorbing reactive power helps, but costs losses and only partly compensates.',
        }),
    },
  ],

  steps: [
    {
      id: 'winter',
      title: { fr: 'La pointe du soir en hiver', en: 'The winter evening peak' },
      body: {
        fr: `Sans PV, le dernier client BT descend sous **90 %** à la pointe du soir. Remontez la **prise à vide** du transformateur HTA/BT pour le ramener dans la plage.`,
        en: `Without PV, the last LV customer falls below **90 %** at the evening peak. Raise the MV/LV transformer’s **off-load tap** to bring them back into range.`,
      },
      check: (lab) => lab.params.pv < 0.5 && lab.params.tap >= 2.5 && (lab.info as DvpInfo).ok,
    },
    {
      id: 'pv',
      title: { fr: 'Le PV arrive', en: 'PV arrives' },
      body: {
        fr: `Ajoutez **10 MW** de photovoltaïque sur le départ. À midi, le transit s’inverse et la tension du dernier client dépasse **110 %**.`,
        en: `Add **10 MW** of PV on the feeder. At noon the flow reverses and the last customer’s voltage exceeds **110 %**.`,
      },
      check: (lab) => lab.params.pv >= 9.5 && (lab.info as DvpInfo).lvMax > 110,
    },
    {
      id: 'tan',
      title: { fr: 'Les producteurs absorbent du réactif', en: 'Producers absorb reactive power' },
      body: {
        fr: `Demandez aux producteurs **tan φ = −0,35**. La hausse diminue, mais ne suffit pas : en distribution, $R$ pèse autant que $X$.`,
        en: `Ask the producers for **tan φ = −0.35**. The rise shrinks, but not enough: in distribution, $R$ weighs as much as $X$.`,
      },
      check: (lab) => lab.params.pv >= 9.5 && lab.params.qmode === QMODE.tan,
    },
    {
      id: 'ldc',
      title: { fr: 'Le compoundage au poste source', en: 'Line-drop compensation at the substation' },
      body: {
        fr: `Activez le **compoundage** (3 % environ). La tension du poste source baisse quand le départ injecte et monte à la pointe : tout le monde reste dans la plage.`,
        en: `Turn on **line-drop compensation** (about 3 %). The substation voltage falls when the feeder injects and rises at the peak: everyone stays in range.`,
      },
      check: (lab) => lab.params.pv >= 9.5 && lab.params.ldc >= 2 && (lab.info as DvpInfo).ok,
    },
    {
      id: 'qu',
      title: { fr: 'Q(U) plutôt que tan φ fixe', en: 'Q(U) rather than a fixed tan φ' },
      body: {
        fr: `Passez en **Q(U)** : les producteurs n’absorbent que si la tension est haute. La plage est tenue avec bien moins d’énergie réactive absorbée.`,
        en: `Switch to **Q(U)**: producers absorb only when the voltage is high. The range is held with far less reactive energy absorbed.`,
      },
      check: (lab) => lab.params.pv >= 9.5 && lab.params.qmode === QMODE.qu && (lab.info as DvpInfo).ok,
    },
  ],
};
