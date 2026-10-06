// Module 10.5 — Planning: N-1 at the primary substation, MV back-up, flexibility against reinforcement.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { num } from '../../lib/ui/format';
import { PLAN, planInfo, planModel, violationYear, type PlanInfo } from '../../lib/models/module10';
import PlanningCanvas from './PlanningCanvas.svelte';

export const planningLesson: Experiment = {
  id: 'planning',
  path: [
    { fr: 'Module 10 · Le gestionnaire du réseau de distribution', en: 'Module 10 · The distribution system operator' },
    { fr: '10.5 Flexibilité et planification', en: '10.5 Flexibility and planning' },
  ],
  title: { fr: 'Renforcer ou flexibiliser ? Le N-1 d’un poste source', en: 'Reinforce or use flexibility? N-1 at a primary substation' },
  model: planModel,
  info: planInfo,
  canvas: PlanningCanvas,
  instruments: [Chart0],
  axis: { label: { fr: 'Années', en: 'Years' }, symbol: 'a', fmt: (v, d = 3) => `${num(v, d)} a` },

  params: [
    { id: 'growth', symbol: 'g', name: { fr: 'Croissance de la pointe', en: 'Peak growth' }, unit: '%/an', min: 0, max: 5, default: 2, scale: 'lin', term: 'p' },
    { id: 'backup', symbol: 'P_{sec}', name: { fr: 'Secours par le réseau HTA (vers les postes voisins)', en: 'MV back-up (to neighbouring substations)' }, unit: 'MW', min: 0, max: 10, default: 0, scale: 'lin', term: 'C' },
    { id: 'flex', symbol: 'P_{flex}', name: { fr: 'Flexibilité contractée (effacement à la pointe)', en: 'Contracted flexibility (peak demand response)' }, unit: 'MW', min: 0, max: 10, default: 0, scale: 'lin', term: 'L' },
    { id: 'price', symbol: 'c_{flex}', name: { fr: 'Prix de la flexibilité', en: 'Flexibility price' }, unit: 'k€/MW/an', min: 5, max: 100, default: 50, scale: 'lin', term: 'R' },
  ],

  signals: [
    { id: 'peak', symbol: 'P_{pointe}', name: { fr: 'Pointe du poste', en: 'Substation peak' }, unit: 'MW', color: '--c-p', on: true, term: 'p' },
    { id: 'net', symbol: 'P_{pointe} - P_{flex}', name: { fr: 'Pointe après flexibilité', en: 'Peak after flexibility' }, unit: 'MW', color: '--c-L', on: true, dash: true, term: 'L' },
    { id: 'firm', symbol: 'P_{N-1}', name: { fr: 'Capacité garantie en N-1', en: 'N-1 firm capacity' }, unit: 'MW', color: '--c-R', on: true, term: 'R' },
  ],

  charts: [
    {
      title: { fr: 'Valeur du report contre coût de la flexibilité', en: 'Value of deferral against the cost of flexibility' },
      x: { label: 'P_flex', unit: 'MW', range: [0, 10] },
      y: { label: 'k€', unit: '', range: [0, 2500] },
      series: (lab) => {
        const v: [number, number][] = [], c: [number, number][] = [];
        for (let f = 0; f <= 10.001; f += 0.25) {
          const k = planInfo({ ...lab.params, flex: f });
          v.push([f, k.value]);
          c.push([f, k.flexCost]);
        }
        return [
          { label: { fr: 'valeur du report (actualisée)', en: 'value of deferral (discounted)' }, color: '--c-C', pts: v },
          { label: { fr: 'coût de la flexibilité (actualisé)', en: 'cost of flexibility (discounted)' }, color: '--c-R', pts: c },
        ];
      },
      points: (lab) => {
        const k = lab.info as PlanInfo;
        return [
          { x: lab.params.flex, y: k.value, color: '--c-C' },
          { x: lab.params.flex, y: k.flexCost, color: '--c-R' },
        ];
      },
      note: () => ({
        fr: `Reporter de quelques années un investissement de ${PLAN.cost / 1000} M€ (troisième transformateur, ordre de grandeur) a une valeur, à ${PLAN.rate * 100} % d’actualisation. La flexibilité vaut le coup tant qu’elle coûte moins que cette valeur.`,
        en: `Deferring a ${PLAN.cost / 1000} M€ investment (a third transformer, order of magnitude) by a few years is worth something, at ${PLAN.rate * 100} % discount. Flexibility pays as long as it costs less than that value.`,
      }),
    },
  ],

  equations: [
    {
      id: 'firm',
      title: { fr: 'La capacité garantie en N-1', en: 'N-1 firm capacity' },
      tex: (c) => {
        const k = c.k as PlanInfo;
        return `\\begin{aligned} P_{N-1} &= S_{transfo}\\,k_{surcharge}\\cos\\varphi + P_{sec} \\\\ &= ${PLAN.trafo} \\times ${PLAN.overload.toString().replace('.', '{,}')} \\times ${PLAN.pf.toString().replace('.', '{,}')} + ${num(c.p.backup, 3)} = ${c.q(k.firm, 'MW', 3)} \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Si l’un des deux transformateurs tombe en panne à la pointe d’hiver, l’autre doit tenir la charge (avec une surcharge temporaire admise), aidé par les reports de charge vers les postes voisins par le réseau HTA.',
          en: 'If one of the two transformers fails at the winter peak, the other must carry the load (with an allowed temporary overload), helped by load transfers to neighbouring substations over the MV grid.',
        }),
    },
    {
      id: 'year',
      title: { fr: 'L’année de la contrainte', en: 'The year of the constraint' },
      tex: (c) => {
        const k = c.k as PlanInfo;
        const y = (v: number) => (isFinite(v) ? v.toFixed(1).replace('.', c.tr({ fr: '{,}', en: '.' })) : '\\infty');
        return `P_0 (1+g)^{a} = P_{N-1} + P_{flex} \\;\\Rightarrow\\; a = ${y(k.yNoFlex)} \\to ${y(k.yFlex)}\\ \\text{${c.tr({ fr: 'ans', en: 'years' })}}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le planificateur projette la pointe année par année (croissance démographique, électrification des usages, nouveaux raccordements) et cherche le moment où la sûreté N-1 n’est plus assurée.',
          en: 'The planner projects the peak year by year (population growth, electrification, new connections) and looks for when N-1 security is no longer met.',
        }),
    },
    {
      id: 'econ',
      title: { fr: 'Le bilan économique', en: 'The economics' },
      tex: (c) => {
        const k = c.k as PlanInfo;
        return `V_{report} = C\\left[(1+r)^{-a_0} - (1+r)^{-(a_0 + \\Delta a)}\\right] = ${c.q(k.value, 'k€', 3)}, \\qquad C_{flex} = ${c.q(k.flexCost, 'k€', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La flexibilité locale (effacements, stockage, pilotage de la recharge) ne remplace pas toujours le renforcement : elle achète du temps. Elle est la plus intéressante quand la contrainte ne dure que quelques heures par an.',
          en: 'Local flexibility (demand response, storage, managed charging) does not always replace reinforcement: it buys time. It is most attractive when the constraint lasts only a few hours a year.',
        }),
    },
  ],

  steps: [
    {
      id: 'year',
      title: { fr: 'Quand le poste ne tient plus le N-1', en: 'When the substation no longer holds N-1' },
      body: {
        fr: `La pointe croît de 2 % par an. Placez le curseur sur l’année où elle **dépasse la capacité garantie en N-1**.`,
        en: `The peak grows by 2 % a year. Put the cursor on the year in which it **exceeds the N-1 firm capacity**.`,
      },
      check: (lab) => lab.params.flex < 0.1 && lab.params.backup < 0.1 && Math.abs(lab.t - violationYear(lab.params, 0)) < 0.6,
    },
    {
      id: 'backup',
      title: { fr: 'Le secours HTA', en: 'MV back-up' },
      body: {
        fr: `Des départs HTA bouclés vers les postes voisins peuvent reprendre de la charge. Ajoutez **5 MW** de secours : la contrainte recule de plusieurs années.`,
        en: `MV feeders looped to neighbouring substations can take over load. Add **5 MW** of back-up: the constraint moves several years later.`,
      },
      check: (lab) => lab.params.backup >= 4.9 && (lab.info as PlanInfo).yNoFlex >= 14,
    },
    {
      id: 'flex',
      title: { fr: 'Acheter de la flexibilité', en: 'Buying flexibility' },
      body: {
        fr: `Sans secours, contractez assez de flexibilité pour **reporter le renforcement d’au moins 3 ans**.`,
        en: `Without back-up, contract enough flexibility to **defer the reinforcement by at least 3 years**.`,
      },
      check: (lab) => lab.params.backup < 0.1 && (lab.info as PlanInfo).deferral >= 3,
    },
    {
      id: 'econ',
      title: { fr: 'Est-ce rentable ?', en: 'Does it pay?' },
      body: {
        fr: `À 50 k€/MW/an, le report coûte plus qu’il ne rapporte. Trouvez le prix en dessous duquel la flexibilité devient **rentable**.`,
        en: `At 50 k€/MW/year, deferral costs more than it is worth. Find the price below which flexibility becomes **profitable**.`,
      },
      check: (lab) => lab.params.flex > 0 && (lab.info as PlanInfo).deferral >= 1 && (lab.info as PlanInfo).net > 0,
    },
    {
      id: 'electrification',
      title: { fr: 'L’électrification accélère', en: 'Electrification speeds up' },
      body: {
        fr: `Pompes à chaleur et véhicules électriques : portez la croissance à **4 %/an**. La même flexibilité ne reporte plus que de quelques mois à deux ans : le renforcement devient inévitable.`,
        en: `Heat pumps and electric vehicles: raise growth to **4 %/year**. The same flexibility now defers by only months to two years: reinforcement becomes unavoidable.`,
      },
      check: (lab) => lab.params.growth >= 4 && lab.params.flex > 0 && (lab.info as PlanInfo).deferral < 2,
    },
  ],
};
