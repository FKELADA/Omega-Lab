// Module 9.3 — N-1 security: a day-ahead analysis and the remedial actions of the TSO.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { N1, TOPO, n1At, n1Info, n1Model, type N1Info } from '../../lib/models/module9';
import N1Canvas from './N1Canvas.svelte';

const clean = (p: Record<string, number>) => p.redisp < 1 && Math.abs(p.alpha) < 0.5 && p.topo === TOPO.normal;

export const n1Lesson: Experiment = {
  id: 'n1',
  path: [
    { fr: 'Module 9 · Le gestionnaire du réseau de transport', en: 'Module 9 · The transmission system operator' },
    { fr: '9.3 Sécurité N-1 et parades', en: '9.3 N-1 security and remedial actions' },
  ],
  title: { fr: 'Et si une ligne déclenchait ? L’analyse N-1 de la veille pour le lendemain', en: 'What if a line tripped? The day-ahead N-1 analysis' },
  model: n1Model,
  info: n1Info,
  canvas: N1Canvas,
  instruments: [Chart0],
  timeUnit: 'h',

  params: [
    { id: 'redisp', symbol: '\\Delta P_{CCG}', name: { fr: 'Redispatching : démarrage de la centrale de l’Industrie', en: 'Redispatch: starting the Industrie plant' }, unit: 'MW', min: 0, max: 600, default: 0, scale: 'lin', term: 'p' },
    { id: 'alpha', symbol: '\\alpha', name: { fr: 'Transformateur déphaseur sur L4', en: 'Phase shifter on L4' }, unit: '°', min: -15, max: 15, default: 0, scale: 'lin', term: 'L' },
    {
      id: 'topo',
      symbol: 'T',
      name: { fr: 'Topologie', en: 'Topology' },
      unit: '',
      min: 0,
      max: 2,
      default: TOPO.normal,
      scale: 'lin',
      choices: [
        { value: TOPO.normal, label: { fr: 'Normale (L8 ouverte)', en: 'Normal (L8 open)' } },
        { value: TOPO.closeL8, label: { fr: 'Fermer L8', en: 'Close L8' } },
        { value: TOPO.openL5, label: { fr: 'Ouvrir L5', en: 'Open L5' } },
      ],
    },
    { id: 'growth', symbol: 'g', name: { fr: 'Hausse de la consommation (vague de froid)', en: 'Higher demand (cold spell)' }, unit: '%', min: 0, max: 15, default: 0, scale: 'lin', term: 'R' },
  ],

  signals: [
    { id: 'n1', symbol: '\\max_{N-1}', name: { fr: 'Pire charge en N-1', en: 'Worst N-1 loading' }, unit: '%', color: '--c-R', on: true, term: 'R' },
    { id: 'nmax', symbol: '\\max_N', name: { fr: 'Charge maximale en N', en: 'Highest N loading' }, unit: '%', color: '--c-p', on: true, term: 'p' },
    { id: 'load', symbol: 'P_L', name: { fr: 'Consommation de la zone', en: 'Zone demand' }, unit: 'GW', color: '--c-S', on: true, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Charge de chaque ligne à l’heure du curseur', en: 'Loading of each line at the cursor hour' },
      x: { label: 'ligne', unit: '', range: [0.5, N1.lines.length + 0.5] },
      y: { label: 'charge', unit: '%', range: [0, 160] },
      series: () => [{ label: { fr: 'limite', en: 'rating' }, color: '--c-R', pts: [[0.5, 100], [N1.lines.length + 0.5, 100]], dash: true, width: 1.5 }],
      points: (lab) => {
        const r = n1At(lab.params, lab.t);
        return [
          ...r.n.map((v, i) => ({ x: i + 1, y: Math.min(158, v), color: '--c-p', label: N1.lines[i].name, hollow: true })),
          ...r.worst.map((v, i) => ({ x: i + 1, y: Math.min(158, v), color: v > 100 ? '--warn' : '--c-R' })),
        ];
      },
      note: () => ({ fr: 'Cercle creux : situation normale (N). Point plein : pire situation après la perte d’une autre ligne (N-1).', en: 'Hollow circle: normal state (N). Solid dot: worst state after losing another line (N-1).' }),
    },
  ],

  equations: [
    {
      id: 'rule',
      title: { fr: 'La règle du N-1', en: 'The N-1 rule' },
      tex: (c) => {
        const k = c.k as N1Info;
        return `\\max_{h,\\;c}\\ \\frac{|F_\\ell^{(c)}(h)|}{F_\\ell^{max}} = ${c.q(k.maxN1, '\\%', 3)} \\quad (${N1.lines[k.critical].name}\\ ${c.tr({ fr: 'si', en: 'if' })}\\ ${k.by >= 0 ? N1.lines[k.by].name : '—'}\\ ${c.tr({ fr: 'déclenche', en: 'trips' })})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Après la perte de n’importe quel ouvrage, le réseau doit rester dans ses limites, le temps que les opérateurs agissent. Les limites temporaires de quelques minutes à 20 minutes (« IST ») laissent ce temps ; on les ignore ici.',
          en: 'After the loss of any single element, the grid must stay within its limits while the operators act. Temporary limits of a few to 20 minutes leave that time; they are ignored here.',
        }),
    },
    {
      id: 'dc',
      title: { fr: 'Le calcul : répartition en courant continu', en: 'The computation: DC power flow' },
      tex: () => `\\mathbf{P} = \\mathbf{B}\\,\\boldsymbol\\theta, \\qquad F_{ij} = \\frac{\\theta_i - \\theta_j}{x_{ij}}`,
      note: (c) =>
        c.tr({
          fr: 'Pour chaque heure et chaque ouvrage perdu, on refait le calcul sans la ligne. Les outils des GRT font la même chose sur des milliers d’ouvrages et des centaines de situations.',
          en: 'For every hour and every lost element, the flow is recomputed without that line. TSO tools do the same over thousands of elements and hundreds of situations.',
        }),
    },
    {
      id: 'actions',
      title: { fr: 'Les parades et leur coût', en: 'Remedial actions and their cost' },
      tex: (c) => {
        const k = c.k as N1Info;
        return `\\text{${c.tr({ fr: 'redispatching', en: 'redispatch' })}} \\approx ${c.q(k.cost, '\\text{k€/j}', 3)}, \\quad \\text{${c.tr({ fr: 'heures en contrainte', en: 'constrained hours' })}} = ${c.q(k.hoursOver, 'h', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Ordre habituel : d’abord les parades gratuites (topologie, déphaseurs), puis celles qui coûtent (redispatching, payé aux producteurs), et en dernier recours la limitation de la consommation.',
          en: 'Usual order: first the free actions (topology, phase shifters), then the costly ones (redispatch, paid to generators), and as a last resort curtailing demand.',
        }),
    },
  ],

  steps: [
    {
      id: 'find',
      title: { fr: 'Trouver la contrainte', en: 'Finding the constraint' },
      body: {
        fr: `Le réseau est sûr en N (toutes les lignes sous 100 %). Déplacez le curseur de temps jusqu’à une heure où la **pire charge en N-1** dépasse 100 %.`,
        en: `The grid is secure in N (all lines below 100 %). Move the time cursor to an hour where the **worst N-1 loading** exceeds 100 %.`,
      },
      check: (lab) => clean(lab.params) && lab.params.growth < 1 && lab.at('n1') > 100,
    },
    {
      id: 'redispatch',
      title: { fr: 'Parade 1 : le redispatching', en: 'Remedy 1: redispatch' },
      body: {
        fr: `Démarrez la centrale de l’Industrie (le reste vient moins de l’interconnexion) jusqu’à lever **toutes** les contraintes N-1 de la journée.`,
        en: `Start the Industrie plant (less then comes over the interconnection) until **all** of the day’s N-1 constraints are gone.`,
      },
      check: (lab) => Math.abs(lab.params.alpha) < 0.5 && lab.params.topo === TOPO.normal && lab.params.growth < 1 && lab.params.redisp > 0 && (lab.info as N1Info).maxN1 <= 100,
    },
    {
      id: 'pst',
      title: { fr: 'Parade 2 : le déphaseur', en: 'Remedy 2: the phase shifter' },
      body: {
        fr: `Remettez le redispatching à **0** et levez la contrainte avec le **déphaseur** de L4 seul.`,
        en: `Set redispatch back to **0** and remove the constraint with the **phase shifter** on L4 alone.`,
      },
      check: (lab) => lab.params.redisp < 1 && lab.params.topo === TOPO.normal && lab.params.growth < 1 && Math.abs(lab.params.alpha) >= 0.5 && (lab.info as N1Info).maxN1 <= 100,
    },
    {
      id: 'topology',
      title: { fr: 'Parade 3 : la topologie', en: 'Remedy 3: topology' },
      body: {
        fr: `Remettez le déphaseur à **0°**. Essayez les deux manœuvres de topologie : l’une lève la contrainte, l’autre l’aggrave.`,
        en: `Set the phase shifter back to **0°**. Try both switching actions: one removes the constraint, the other makes it worse.`,
      },
      check: (lab) => lab.params.redisp < 1 && Math.abs(lab.params.alpha) < 0.5 && lab.params.topo !== TOPO.normal && lab.params.growth < 1 && (lab.info as N1Info).maxN1 <= 100,
    },
    {
      id: 'cold',
      title: { fr: 'Vague de froid : combiner', en: 'Cold spell: combining' },
      body: {
        fr: `La consommation monte de **10 %**. Aucune parade seule ne suffit plus : combinez-les pour retrouver un réseau sûr en N-1, avec le moins de redispatching possible.`,
        en: `Demand rises by **10 %**. No single remedy is enough any more: combine them to get back an N-1-secure grid, with as little redispatch as possible.`,
      },
      check: (lab) => lab.params.growth >= 10 && (lab.info as N1Info).maxN1 <= 100,
    },
  ],
};
