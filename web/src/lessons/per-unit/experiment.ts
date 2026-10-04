// Module 2.6 — The per-unit system: one diagram across several voltage levels.

import { cabs } from '../../lib/core/linalg';
import type { Experiment } from '../../lib/lab/types';
import { PU_SYSTEM, perUnit, perUnitInfo, type PerUnitInfo } from '../../lib/models/module2b';
import OneLine from './OneLine.svelte';
import VoltageProfile from './VoltageProfile.svelte';
import ZoneTable from './ZoneTable.svelte';

const vLoad = (k: PerUnitInfo) => cabs(k.Vload);

export const perUnitLesson: Experiment = {
  id: 'per-unit',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.6 Système per-unit', en: '2.6 Per-unit system' },
  ],
  title: { fr: 'Trois niveaux de tension, un seul calcul', en: 'Three voltage levels, one calculation' },
  model: perUnit,
  info: perUnitInfo,
  canvas: OneLine,
  instruments: [ZoneTable, VoltageProfile],

  params: [
    {
      id: 'Sbase',
      symbol: 'S_{base}',
      name: { fr: 'Puissance de base', en: 'Power base' },
      unit: 'VA',
      min: 10e6,
      max: 100e6,
      default: 100e6,
      scale: 'lin',
      choices: [10e6, 50e6, 100e6].map((v) => ({ value: v, label: { fr: `${v / 1e6} MVA`, en: `${v / 1e6} MVA` } })),
    },
    { id: 'Pload', symbol: 'P', name: { fr: 'Puissance de la charge', en: 'Load power' }, unit: 'W', min: 1e6, max: 40e6, default: 10e6, scale: 'lin', term: 'R' },
    { id: 'pf', symbol: '\\cos\\varphi', name: { fr: 'Facteur de puissance', en: 'Power factor' }, unit: '', min: 0.7, max: 1, default: 0.9, scale: 'lin', term: 'L' },
    { id: 'tap', symbol: 't', name: { fr: 'Prise de T2', en: 'T2 tap' }, unit: 'pu', min: 0.9, max: 1.1, default: 1, scale: 'lin', term: 'n' },
  ],

  signals: [
    { id: 'vs', symbol: 'v_G', name: { fr: 'Tension générateur', en: 'Generator voltage' }, unit: 'pu', color: '--c-S', on: true, term: 'S' },
    { id: 'vl', symbol: 'v_{ch}', name: { fr: 'Tension charge', en: 'Load voltage' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'i', symbol: 'i', name: { fr: 'Courant', en: 'Current' }, unit: 'pu', color: '--c-i', on: false, term: 'i' },
  ],

  equations: [
    {
      id: 'bases',
      title: { fr: 'Grandeurs de base', en: 'Base quantities' },
      tex: (c) => {
        const k = c.k as PerUnitInfo;
        const z = k.zones[1];
        return `\\begin{aligned}
          S_b &= ${c.q(c.p.Sbase, 'VA')}, \\qquad V_b = ${c.q(z.Vb, 'V')} \\ (\\text{zone 2}) \\\\
          I_b &= \\frac{S_b}{\\sqrt3\\,V_b} = ${c.q(z.Ib, 'A')}, \\qquad Z_b = \\frac{V_b^2}{S_b} = ${c.q(z.Zb, 'Ω')} \\\\
          x_{pu} &= \\frac{x}{x_b}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'On choisit deux bases ($S_b$ partout, $V_b$ dans une zone). Les autres en découlent, et les tensions de base suivent les rapports des transformateurs.',
          en: 'You choose two bases ($S_b$ everywhere, $V_b$ in one zone). Everything else follows, and the voltage bases track the transformer ratios.',
        }),
    },
    {
      id: 'change',
      title: { fr: 'Changement de base', en: 'Change of base' },
      tex: (c) => {
        const k = c.k as PerUnitInfo;
        return `\\begin{aligned}
          z_{new} &= z_{old}\\,\\frac{S_{new}}{S_{old}}\\left(\\frac{V_{old}}{V_{new}}\\right)^2 \\\\
          x_{T1} &= ${c.q(PU_SYSTEM.T1.x, '')}\\ \\text{pu}\\ (${c.q(PU_SYSTEM.T1.S, 'VA')}) \\;\\to\\; ${c.q(k.zT1.im, '', 3)}\\ \\text{pu}\\ (${c.q(c.p.Sbase, 'VA')})
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les constructeurs donnent les impédances en % de **leur** puissance nominale : il faut les ramener à la base commune avant de les additionner.',
          en: 'Manufacturers quote impedances in % of **their own** rating: bring them to the common base before adding them up.',
        }),
    },
    {
      id: 'solve',
      title: { fr: 'Le calcul, en pu', en: 'The calculation, in pu' },
      tex: (c) => {
        const k = c.k as PerUnitInfo;
        const zs = cabs({ re: k.zT1.re + k.zLine.re + k.zT2.re, im: k.zT1.im + k.zLine.im + k.zT2.im });
        return `\\begin{aligned}
          \\underline I &= \\frac{1}{z_{T1} + z_{L} + z_{T2} + z_{ch}} = ${c.q(cabs(k.I), '', 3)}\\ \\text{pu} \\quad (|z_{s}| = ${c.q(zs, '', 3)}) \\\\
          |\\underline V_{ch}| &= ${c.term('C', c.q(vLoad(k), '', 3))}\\ \\text{pu} = ${c.term('C', c.q(vLoad(k) * k.zones[2].Vb, 'V'))}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un seul circuit, sans transformateur idéal, et des nombres proches de 1 : une erreur saute aux yeux. Changez $S_{base}$ : les impédances en pu changent, la tension de la charge en kV ne bouge pas.',
          en: 'One circuit, no ideal transformers, and numbers close to 1: a mistake stands out at once. Change $S_{base}$: pu impedances change, the load voltage in kV does not.',
        }),
    },
    {
      id: 'typical',
      title: { fr: 'Ordres de grandeur', en: 'Typical values' },
      personas: ['utility', 'research'],
      tex: () => `\\begin{array}{ll}
        \\text{Transformateur / transformer} & x \\approx 0{,}05 - 0{,}15\\ \\text{pu} \\\\
        \\text{Alternateur / generator}\\ x''_d & 0{,}12 - 0{,}25\\ \\text{pu} \\\\
        \\text{Alternateur / generator}\\ x_d & 1{,}0 - 2{,}0\\ \\text{pu} \\\\
        \\text{Tension / voltage} & 0{,}95 - 1{,}05\\ \\text{pu}
      \\end{array}`,
      note: (c) =>
        c.tr({
          fr: 'Sur leur propre base, les machines d’une même technologie ont des valeurs très proches, quelle que soit leur taille. C’est un excellent garde-fou.',
          en: 'On their own base, machines of the same technology have very similar values whatever their size. That is an excellent sanity check.',
        }),
    },
  ],

  steps: [
    {
      id: 'base',
      title: { fr: 'Changer de base', en: 'Changing the base' },
      body: {
        fr: `Le réseau a trois niveaux de tension : 11, 132 et 33 kV. En per-unit, on le calcule comme un seul circuit.

Passez $S_{base}$ à **10 MVA**. Les impédances en pu changent, mais la **tension de la charge**, en pu comme en kV, ne bouge pas : le choix de la base est libre.`,
        en: `The network has three voltage levels: 11, 132 and 33 kV. In per-unit it is solved as one circuit.

Switch $S_{base}$ to **10 MVA**. The pu impedances change, but the **load voltage**, in pu or in kV, does not move: the choice of base is free.`,
      },
      check: (lab) => lab.params.Sbase !== 100e6,
    },
    {
      id: 'heavy',
      title: { fr: 'Charge lourde', en: 'Heavy load' },
      body: {
        fr: `Augmentez la charge jusqu’à ce que sa tension sorte de la bande verte ($< 0{,}95$ pu). La chute de tension se lit directement sur le profil, d’un bout à l’autre des trois niveaux de tension.`,
        en: `Increase the load until its voltage leaves the green band ($< 0.95$ pu). The voltage drop reads straight off the profile, across all three voltage levels.`,
      },
      check: (lab) => vLoad(lab.info as PerUnitInfo) < 0.95,
    },
    {
      id: 'tap',
      title: { fr: 'Le régleur en charge', en: 'The tap changer' },
      body: {
        fr: `Sans réduire la charge, montez la **prise de T2** pour ramener la tension de la charge au-dessus de **0,97 pu**.

C’est le rôle du régleur en charge des transformateurs HTB/HTA : il compense la chute de tension du réseau amont.`,
        en: `Without reducing the load, raise the **T2 tap** to bring the load voltage back above **0.97 pu**.

That is the job of the on-load tap changer on transmission/distribution transformers: it compensates the upstream voltage drop.`,
      },
      check: (lab) => lab.completed.heavy === true && vLoad(lab.info as PerUnitInfo) >= 0.97 && lab.params.tap > 1,
    },
    {
      id: 'pf',
      title: { fr: 'Le facteur de puissance compte', en: 'Power factor matters' },
      body: {
        fr: `Remettez la prise à 1, puis passez le $\\cos\\varphi$ de la charge à **1**. La tension remonte nettement : sur un réseau surtout inductif, la chute de tension dépend surtout de $Q$, d’où $\\Delta V \\approx \\dfrac{RP + XQ}{V}$.`,
        en: `Set the tap back to 1, then raise the load’s $\\cos\\varphi$ to **1**. The voltage rises noticeably: on a mostly inductive network the drop depends mainly on $Q$, hence $\\Delta V \\approx \\dfrac{RP + XQ}{V}$.`,
      },
      check: (lab) => Math.abs(lab.params.tap - 1) < 0.005 && lab.params.pf > 0.995,
    },
  ],
};
