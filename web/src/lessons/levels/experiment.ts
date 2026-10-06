// Module 9.1 — Transmission and distribution: voltage levels and orders of magnitude.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { num } from '../../lib/ui/format';
import { COSPHI, LEVELS, levelInfo, levelModel, type LevelInfo } from '../../lib/models/module9';
import LevelsCanvas from './LevelsCanvas.svelte';

const lvl = (name: string) => LEVELS.findIndex((l) => l.name === name);
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol * b;

export const levelsLesson: Experiment = {
  id: 'levels',
  path: [
    { fr: 'Module 9 · Le gestionnaire du réseau de transport', en: 'Module 9 · The transmission system operator' },
    { fr: '9.1 Niveaux de tension et ordres de grandeur', en: '9.1 Voltage levels and orders of magnitude' },
  ],
  title: { fr: 'Pourquoi 400 kV ? Transport et distribution', en: 'Why 400 kV? Transmission and distribution' },
  model: levelModel,
  info: levelInfo,
  canvas: LevelsCanvas,
  instruments: [Chart0, Chart1],
  axis: { label: { fr: 'Distance', en: 'Distance' }, symbol: 'x', fmt: (v, d = 3) => `${num(v, d)} km` },

  params: [
    {
      id: 'level',
      sweep: false,
      symbol: 'U',
      name: { fr: 'Niveau de tension', en: 'Voltage level' },
      unit: '',
      min: 0,
      max: LEVELS.length - 1,
      default: lvl('225 kV'),
      scale: 'lin',
      choices: LEVELS.map((l, i) => ({ value: i, label: { fr: l.name, en: l.name } })),
    },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance transportée', en: 'Power transmitted' }, unit: 'MW', min: 0.05, max: 3000, default: 1000, scale: 'log', term: 'p' },
    { id: 'L', symbol: 'L', name: { fr: 'Distance', en: 'Distance' }, unit: 'km', min: 0.1, max: 400, default: 200, scale: 'log', term: 'L' },
    { id: 'n', symbol: 'n', name: { fr: 'Nombre de circuits en parallèle', en: 'Circuits in parallel' }, unit: '', min: 1, max: 4, default: 1, step: 1, scale: 'lin', term: 'R' },
  ],

  signals: [
    { id: 'dv', symbol: '\\Delta V', name: { fr: 'Chute de tension cumulée', en: 'Cumulative voltage drop' }, unit: '%', color: '--c-S', on: true, term: 'S' },
    { id: 'loss', symbol: 'p_J', name: { fr: 'Pertes Joule cumulées', en: 'Cumulative Joule losses' }, unit: '%', color: '--c-R', on: true, term: 'R' },
    { id: 'load', symbol: 'S/S_{max}', name: { fr: 'Charge de chaque circuit', en: 'Loading of each circuit' }, unit: '%', color: '--c-p', on: true, term: 'p' },
  ],

  charts: [
    {
      title: { fr: 'Pertes selon le niveau de tension (même transit, même distance)', en: 'Losses versus voltage level (same power, same distance)' },
      x: { label: 'U', unit: 'kV', range: [0.3, 500], log: true },
      y: { label: 'p_J', unit: '%', range: [0.01, 1000], log: true },
      series: (lab) => [
        {
          label: { fr: 'pertes (%)', en: 'losses (%)' },
          color: '--c-R',
          pts: LEVELS.map((l, i) => [l.U, Math.max(0.01, levelInfo({ ...lab.params, level: i }).losses)] as [number, number]).reverse(),
        },
        { label: { fr: 'limite de l’exercice (3 %)', en: 'exercise limit (3 %)' }, color: '--c-C', pts: [[0.3, 3], [500, 3]], dash: true, width: 1.2 },
      ],
      points: (lab) => {
        const k = lab.info as LevelInfo;
        return [{ x: k.lv.U, y: Math.max(0.01, k.losses), color: '--accent', label: k.lv.name }];
      },
      note: () => ({ fr: 'À puissance égale, le courant varie en 1/U et les pertes en 1/U² : chaque marche de tension divise les pertes.', en: 'For the same power, current scales as 1/U and losses as 1/U²: every step up in voltage divides the losses.' }),
    },
    {
      title: { fr: 'D’où vient la chute de tension : P ou Q ?', en: 'Where the voltage drop comes from: P or Q?' },
      x: { label: 'R/X', unit: '', range: [0.05, 5], log: true },
      y: { label: 'part', unit: '%', range: [0, 100] },
      series: () => {
        const tan = Math.tan(Math.acos(COSPHI));
        const pts: [number, number][] = [];
        for (let rx = 0.05; rx <= 5.001; rx *= 1.1) pts.push([rx, (100 * rx) / (rx + tan)]);
        return [{ label: { fr: 'part due à P', en: 'share due to P' }, color: '--c-p', pts }];
      },
      points: (lab) => {
        const tan = Math.tan(Math.acos(COSPHI));
        const here = Math.round(lab.params.level);
        return LEVELS.map((l, i) => {
          const rx = l.r / l.x;
          return { x: rx, y: (100 * rx) / (rx + tan), color: i === here ? '--accent' : '--c-L', label: l.name, hollow: i !== here };
        });
      },
      note: () => ({ fr: 'En transport, X ≫ R : la tension se règle avec le réactif. En distribution, R ≈ X ou plus : la puissance active fait aussi varier la tension.', en: 'In transmission X ≫ R: voltage is controlled with reactive power. In distribution R ≈ X or more: active power also moves the voltage.' }),
    },
  ],

  equations: [
    {
      id: 'current',
      title: { fr: 'Le courant et les pertes', en: 'Current and losses' },
      tex: (c) => {
        const k = c.k as LevelInfo;
        return `\\begin{aligned}
          I &= \\frac{P}{n\\sqrt3\\,U\\cos\\varphi} = ${c.q(k.I * 1000, 'A', 3)} \\text{ ${c.tr({ fr: 'par circuit', en: 'per circuit' })}} \\\\
          \\frac{p_J}{P} &= \\frac{R\\,P}{U^2\\cos^2\\varphi} = ${c.q(k.losses, '\\%', 3)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Doubler la tension divise le courant par deux et les pertes par quatre. C’est toute la raison d’être des hautes tensions.',
          en: 'Doubling the voltage halves the current and quarters the losses. That is the whole point of high voltage.',
        }),
    },
    {
      id: 'drop',
      title: { fr: 'La chute de tension', en: 'The voltage drop' },
      tex: (c) => {
        const k = c.k as LevelInfo;
        return `\\frac{\\Delta V}{V} \\approx \\frac{R\\,P + X\\,Q}{U^2} = ${c.q(k.dvP, '\\%', 3)}_{(P)} + ${c.q(k.dvQ, '\\%', 3)}_{(Q)}, \\qquad \\frac{R}{X} = ${c.q(k.rx, '', 2)}`;
      },
      note: (c) =>
        c.tr({
          fr: `Facteur de puissance de ${COSPHI.toString().replace('.', ',')} : le terme en $Q$ domine en transport, le terme en $P$ en distribution basse tension.`,
          en: `Power factor ${COSPHI}: the $Q$ term dominates in transmission, the $P$ term in low-voltage distribution.`,
        }),
    },
    {
      id: 'orders',
      title: { fr: 'Ordres de grandeur (France)', en: 'Orders of magnitude (France)' },
      tex: (c) => {
        const k = c.k as LevelInfo;
        return `\\text{${k.lv.name}} : \\ S_{max} \\approx ${num(k.lv.Smax, 3)}\\ \\text{MVA/circuit}, \\quad L \\sim ${k.lv.len[0]}\\text{–}${k.lv.len[1]}\\ \\text{km}, \\quad \\text{${k.lv.who}}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Ordres de grandeur à vérifier dans les publications des gestionnaires. Le GRT (RTE) exploite environ 100 000 km de lignes de 63 à 400 kV et près de 3 000 postes ; le GRD principal (Enedis) environ 1,4 million de km en HTA et BT, plus de 2 000 postes sources et quelque 800 000 postes HTA/BT.',
          en: 'Orders of magnitude, to be checked against the operators’ publications. The French TSO (RTE) runs about 100,000 km of 63–400 kV lines and nearly 3,000 substations; the main DSO (Enedis) about 1.4 million km of MV and LV lines, over 2,000 primary substations and some 800,000 MV/LV substations.',
        }),
    },
  ],

  steps: [
    {
      id: 'bulk',
      title: { fr: 'Transporter 1 000 MW sur 200 km', en: 'Carrying 1,000 MW over 200 km' },
      body: {
        fr: `On veut transporter **1 000 MW sur 200 km** avec moins de **3 %** de pertes, moins de **10 %** de chute et sans dépasser la limite thermique. Trouvez le niveau de tension et le **plus petit nombre de circuits** qui y parviennent.`,
        en: `We want to carry **1,000 MW over 200 km** with under **3 %** losses, under **10 %** drop and within the thermal rating. Find the voltage level and the **smallest number of circuits** that do it.`,
      },
      check: (lab) => {
        const k = lab.info as LevelInfo;
        return k.ok && k.lv.U === 400 && Math.round(lab.params.n) === 2 && near(lab.params.P, 1000, 0.05) && near(lab.params.L, 200, 0.05);
      },
    },
    {
      id: 'square',
      title: { fr: 'Les pertes en 1/U²', en: 'Losses as 1/U²' },
      body: {
        fr: `Gardez 2 circuits, 1 000 MW et 200 km, et descendez en **225 kV**. Comparez les pertes : le rapport vaut à peu près $(400/225)^2$, aux résistances près.`,
        en: `Keep 2 circuits, 1,000 MW and 200 km, and go down to **225 kV**. Compare the losses: the ratio is about $(400/225)^2$, give or take the resistances.`,
      },
      check: (lab) => (lab.info as LevelInfo).lv.U === 225 && Math.round(lab.params.n) === 2 && near(lab.params.P, 1000, 0.05) && near(lab.params.L, 200, 0.05),
    },
    {
      id: 'mv',
      title: { fr: 'Un départ HTA', en: 'An MV feeder' },
      body: {
        fr: `Passez en **20 kV** : un départ typique porte **quelques MW sur 10 à 30 km**. Réglez 5 MW sur 20 km. Ici la chute vient **surtout de P** : la résistance n’est plus négligeable.`,
        en: `Switch to **20 kV**: a typical feeder carries **a few MW over 10 to 30 km**. Set 5 MW over 20 km. Here the drop comes **mostly from P**: resistance is no longer negligible.`,
      },
      check: (lab) => {
        const k = lab.info as LevelInfo;
        return k.lv.U === 20 && lab.params.P <= 6 && lab.params.P >= 4 && lab.params.L >= 15 && lab.params.L <= 25 && k.dvP > k.dvQ;
      },
    },
    {
      id: 'lv',
      title: { fr: 'La basse tension ne va pas loin', en: 'Low voltage does not go far' },
      body: {
        fr: `En **400 V**, avec **100 kW**, allongez le départ jusqu’à ce que la chute atteigne **environ 8 %**. Quelques centaines de mètres suffisent : c’est pourquoi il y a un poste HTA/BT au coin de chaque rue.`,
        en: `At **400 V**, with **100 kW**, lengthen the feeder until the drop reaches **about 8 %**. A few hundred metres are enough: that is why there is an MV/LV substation on every street corner.`,
      },
      check: (lab) => {
        const k = lab.info as LevelInfo;
        return k.lv.U === 0.4 && near(lab.params.P, 0.1, 0.1) && k.dv >= 7 && k.dv <= 9;
      },
    },
  ],
};
