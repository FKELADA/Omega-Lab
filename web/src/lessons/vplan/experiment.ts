// Module 9.4 — The transmission voltage plan: primary, secondary (pilot node) and tertiary control.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { RST, VPLAN, vplanInfo, vplanModel, type VplanInfo } from '../../lib/models/module9';
import VplanCanvas from './VplanCanvas.svelte';

export const vplanLesson: Experiment = {
  id: 'vplan',
  path: [
    { fr: 'Module 9 · Le gestionnaire du réseau de transport', en: 'Module 9 · The transmission system operator' },
    { fr: '9.4 Le plan de tension du transport', en: '9.4 The transmission voltage plan' },
  ],
  title: { fr: 'Tenir 400 kV toute la journée : réglages primaire, secondaire et tertiaire', en: 'Holding 400 kV all day: primary, secondary and tertiary voltage control' },
  model: vplanModel,
  info: vplanInfo,
  canvas: VplanCanvas,
  instruments: [Chart0],
  timeUnit: 'h',

  params: [
    {
      id: 'rst',
      sweep: false,
      symbol: 'RST',
      name: { fr: 'Réglage secondaire de tension', en: 'Secondary voltage control' },
      unit: '',
      min: 0,
      max: 1,
      default: RST.off,
      scale: 'lin',
      choices: [
        { value: RST.off, label: { fr: 'Hors service', en: 'Off' } },
        { value: RST.on, label: { fr: 'En service', en: 'On' } },
      ],
    },
    { id: 'Vc', symbol: 'V_c', name: { fr: 'Consigne du nœud pilote (tertiaire)', en: 'Pilot-node setpoint (tertiary)' }, unit: 'kV', min: 395, max: 415, default: 405, scale: 'lin', term: 'S' },
    { id: 'Qc', symbol: 'Q_C', name: { fr: 'Condensateurs pour la pointe (17 h – 22 h)', en: 'Capacitors for the peak (5–10 pm)' }, unit: 'Mvar', min: 0, max: 600, default: 0, scale: 'lin', term: 'C' },
    { id: 'QL', symbol: 'Q_L', name: { fr: 'Inductances de nuit (23 h – 7 h)', en: 'Night reactors (11 pm–7 am)' }, unit: 'Mvar', min: 0, max: 600, default: 0, scale: 'lin', term: 'L' },
  ],

  signals: [
    { id: 'vp', symbol: 'V_p', name: { fr: 'Tension du nœud pilote', en: 'Pilot-node voltage' }, unit: 'kV', color: '--c-S', on: true, term: 'S' },
    { id: 'q1', symbol: 'Q_1', name: { fr: 'Réactif du groupe G1', en: 'Reactive output of G1' }, unit: 'Mvar', color: '--c-a', on: true },
    { id: 'q2', symbol: 'Q_2', name: { fr: 'Réactif du groupe G2', en: 'Reactive output of G2' }, unit: 'Mvar', color: '--c-b', on: true },
    { id: 'qd', symbol: 'Q_d', name: { fr: 'Besoin net de réactif de la zone', en: 'Zone’s net reactive demand' }, unit: 'Mvar', color: '--c-R', on: false, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Niveau de réactif des groupes (alignement)', en: 'Generators’ reactive level (alignment)' },
      x: { label: 'Q₁/Q_r1', unit: '', range: [-1.1, 1.1] },
      y: { label: 'Q₂/Q_r2', unit: '', range: [-1.1, 1.1] },
      series: () => [
        { label: { fr: 'alignés : même niveau', en: 'aligned: same level' }, color: '--c-L', pts: [[-1, -1], [1, 1]], dash: true, width: 1.2 },
        { label: { fr: 'capacité', en: 'capability' }, color: '--c-R', pts: [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]], width: 1 },
      ],
      points: (lab) => [{ x: lab.at('q1') / VPLAN.Qr[0], y: lab.at('q2') / VPLAN.Qr[1], color: '--accent' }],
      note: (lab) =>
        lab.params.rst === RST.on
          ? { fr: 'Le réglage secondaire envoie le même niveau N à tous les groupes de la zone : ils fournissent chacun la même fraction de leur capacité.', en: 'Secondary control sends the same level N to every generator in the zone: each supplies the same fraction of its capability.' }
          : { fr: 'Sans réglage secondaire, le groupe le plus proche de la charge travaille plus que l’autre : ses réserves s’épuisent les premières.', en: 'Without secondary control, the generator nearest the load works harder than the other: its reserve runs out first.' },
    },
  ],

  equations: [
    {
      id: 'sens',
      title: { fr: 'Tension et réactif', en: 'Voltage and reactive power' },
      tex: () => `\\Delta V \\approx \\frac{V}{S_{cc}}\\,\\Delta Q \\quad (\\approx ${VPLAN.S[2][2]}\\ \\text{kV/Mvar})`,
      note: (c) =>
        c.tr({
          fr: 'En transport ($X \\gg R$), la tension se pilote avec le réactif. La journée, les lignes chargées en consomment et la tension baisse ; la nuit, peu chargées, elles en produisent et la tension monte.',
          en: 'In transmission ($X \\gg R$), voltage is steered with reactive power. By day, loaded lines absorb it and the voltage falls; at night, lightly loaded, they produce it and the voltage rises.',
        }),
    },
    {
      id: 'levels',
      title: { fr: 'Trois étages', en: 'Three levels' },
      tex: (c) => {
        const k = c.k as VplanInfo;
        return `\\begin{aligned}
          &\\text{${c.tr({ fr: 'primaire', en: 'primary' })}} : \\ \\text{AVR, } \\sim 1\\ \\text{s} \\\\
          &\\text{${c.tr({ fr: 'secondaire', en: 'secondary' })}} : \\ \\dot N \\propto V_c - V_p,\\ Q_i = N\\,Q_{r,i},\\ \\sim 3\\ \\text{min} \\\\
          &\\qquad N \\in [${k.Nmin.toFixed(2)},\\ ${k.Nmax.toFixed(2)}] \\\\
          &\\text{${c.tr({ fr: 'tertiaire', en: 'tertiary' })}} : \\ V_c \\text{ ${c.tr({ fr: 'fixée par le dispatcher', en: 'set by the dispatcher' })}}, \\sim 15\\ \\text{min}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le réseau français est découpé en zones de réglage, chacune avec un **nœud pilote** représentatif. Le réglage secondaire (RST) y aligne les groupes ; le dispatcher règle les consignes.',
          en: 'The French grid is split into control zones, each with a representative **pilot node**. Secondary control aligns the generators there; the dispatcher sets the setpoints.',
        }),
    },
    {
      id: 'band',
      title: { fr: 'La plage de tension', en: 'The voltage range' },
      tex: (c) => {
        const k = c.k as VplanInfo;
        return `V_p \\in [${k.vmin.toFixed(1)},\\ ${k.vmax.toFixed(1)}]\\ \\text{kV}, \\qquad 380 \\le V \\le 420\\ \\text{kV}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Plus haut, c’est moins de pertes et plus de marge de stabilité, mais le matériel est dimensionné jusqu’à 420 kV environ. Le dispatcher choisit la consigne entre ces deux contraintes.',
          en: 'Higher means fewer losses and more stability margin, but equipment is rated up to about 420 kV. The dispatcher picks the setpoint between those two constraints.',
        }),
    },
  ],

  steps: [
    {
      id: 'primary',
      title: { fr: 'Le réglage primaire seul', en: 'Primary control alone' },
      body: {
        fr: `Sans réglage secondaire, chaque groupe tient sa propre tension. Placez le curseur sur la **pointe du soir** (vers 19 h) : la tension du nœud pilote descend sous **397 kV**.`,
        en: `Without secondary control, each generator holds its own voltage. Put the cursor on the **evening peak** (around 7 pm): the pilot-node voltage falls below **397 kV**.`,
      },
      check: (lab) => lab.params.rst === RST.off && lab.t > 17 && lab.t < 21 && lab.at('vp') < 397,
    },
    {
      id: 'secondary',
      title: { fr: 'Le réglage secondaire', en: 'Secondary control' },
      body: {
        fr: `Mettez le réglage secondaire **en service**. Le nœud pilote reste à sa consigne… jusqu’à la pointe, où les groupes arrivent **en butée** ($N = 1$) : plus de réserve.`,
        en: `Turn secondary control **on**. The pilot node stays at its setpoint… until the peak, where the generators hit their **limit** ($N = 1$): no reserve left.`,
      },
      check: (lab) => lab.params.rst === RST.on && lab.params.Qc < 50 && (lab.info as VplanInfo).saturated,
    },
    {
      id: 'caps',
      title: { fr: 'Des condensateurs pour la pointe', en: 'Capacitors for the peak' },
      body: {
        fr: `Enclenchez des condensateurs à la pointe pour que les groupes gardent au moins **40 % de réserve** ($N \\le 0{,}6$).`,
        en: `Switch in capacitors for the peak so that the generators keep at least **40 % reserve** ($N \\le 0.6$).`,
      },
      check: (lab) => lab.params.rst === RST.on && !(lab.info as VplanInfo).saturated && (lab.info as VplanInfo).Nmax <= 0.6,
    },
    {
      id: 'over',
      title: { fr: 'Trop de condensateurs', en: 'Too many capacitors' },
      body: {
        fr: `Poussez les condensateurs à **550 Mvar** ou plus. En fin de pointe, quand la charge baisse, les groupes doivent **absorber** à fond ($N = -1$) : la compensation fixe n’est pas un réglage.`,
        en: `Push the capacitors to **550 Mvar** or more. At the end of the peak, as load falls, the generators have to **absorb** flat out ($N = -1$): fixed compensation is not a control.`,
      },
      check: (lab) => lab.params.rst === RST.on && lab.params.Qc >= 550 && (lab.info as VplanInfo).Nmin <= -0.95,
    },
    {
      id: 'tertiary',
      title: { fr: 'Le tertiaire relève la consigne', en: 'Tertiary control raises the setpoint' },
      body: {
        fr: `Avec 300 Mvar de condensateurs environ, relevez la consigne du nœud pilote à **410 kV** (moins de pertes). La marge réactive se réduit, mais les groupes ne doivent pas arriver en butée.`,
        en: `With about 300 Mvar of capacitors, raise the pilot-node setpoint to **410 kV** (fewer losses). The reactive margin shrinks, but the generators must not reach their limit.`,
      },
      check: (lab) => lab.params.rst === RST.on && lab.params.Vc >= 409.5 && lab.params.Qc <= 450 && !(lab.info as VplanInfo).saturated && (lab.info as VplanInfo).vmax <= 420,
    },
  ],
};
