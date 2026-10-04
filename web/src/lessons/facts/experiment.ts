// Module 4.7 — FACTS: SVC versus STATCOM during a voltage dip.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { FACTS, facts, factsInfo, type FactsInfo } from '../../lib/models/module4';
import FactsCanvas from './FactsCanvas.svelte';

export const factsLesson: Experiment = {
  id: 'facts',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.7 FACTS', en: '4.7 FACTS' },
  ],
  title: { fr: 'SVC contre STATCOM : tenir la tension pendant un creux', en: 'SVC versus STATCOM: holding voltage through a dip' },
  model: facts,
  info: factsInfo,
  canvas: FactsCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'Edip', symbol: 'E_{dip}', name: { fr: 'Tension réseau pendant le creux', en: 'Grid voltage during the dip' }, unit: 'pu', min: 0.4, max: 0.95, default: 0.7, scale: 'lin', term: 'S' },
    { id: 'SCR', symbol: 'SCR', name: { fr: 'Puissance de court-circuit relative', en: 'Short-circuit ratio' }, unit: '', min: 1.5, max: 10, default: 3, scale: 'lin', term: 'L' },
    { id: 'rating', symbol: 'S_n', name: { fr: 'Dimensionnement des équipements', en: 'Device rating' }, unit: 'pu', min: 0.2, max: 1, default: 0.5, scale: 'lin', term: 'p' },
    { id: 'slope', symbol: 'k', name: { fr: 'Statisme de la régulation', en: 'Control droop' }, unit: '', min: 0.01, max: 0.08, default: 0.03, scale: 'lin' },
    { id: 'Tr', symbol: 'T_r', name: { fr: 'Temps de réponse', en: 'Response time' }, unit: 's', min: 0.005, max: 0.2, default: 0.03, scale: 'log' },
  ],

  signals: [
    { id: 'vNone', symbol: 'V_0', name: { fr: 'Tension sans compensateur', en: 'Voltage without device' }, unit: 'pu', color: '--c-S', on: true, term: 'S', dash: true },
    { id: 'vSvc', symbol: 'V_{SVC}', name: { fr: 'Tension avec SVC', en: 'Voltage with SVC' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'vStat', symbol: 'V_{STAT}', name: { fr: 'Tension avec STATCOM', en: 'Voltage with STATCOM' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'qSvc', symbol: 'Q_{SVC}', name: { fr: 'Réactif du SVC', en: 'SVC reactive power' }, unit: 'pu', color: '--c-C', on: false, dash: true },
    { id: 'qStat', symbol: 'Q_{STAT}', name: { fr: 'Réactif du STATCOM', en: 'STATCOM reactive power' }, unit: 'pu', color: '--c-p', on: false, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Caractéristiques V–I', en: 'V–I characteristics' },
      x: { label: 'I', unit: 'pu', range: (lab) => [-0.2, Math.max(0.6, lab.params.rating * 1.3)] },
      y: { label: 'V', unit: 'pu', range: [0.3, 1.15] },
      series: (lab) => {
        const { rating, slope, Edip, SCR } = lab.params;
        const X = 1 / SCR;
        // Each device regulates V = Vref − slope·I until it hits its limit:
        // a fixed current for the STATCOM, a susceptance (I = Bmax·V) for the SVC.
        const stat: [number, number][] = [], svc: [number, number][] = [];
        for (let V = 1.1; V >= 0.3; V -= 0.005) {
          const Ictrl = (FACTS.Vref - V) / slope;
          stat.push([Math.min(Ictrl, rating), V]);
          svc.push([Math.min(Ictrl, rating * V), V]);
        }
        const sys = (E: number): [number, number][] => [[-0.2, E - 0.2 * X], [1.2, E + 1.2 * X]];
        return [
          { label: { fr: 'STATCOM', en: 'STATCOM' }, color: '--c-p', pts: stat },
          { label: { fr: 'SVC', en: 'SVC' }, color: '--c-C', pts: svc },
          { label: { fr: 'réseau normal', en: 'normal grid' }, color: '--c-S', pts: sys(1), dash: true, width: 1.5 },
          { label: { fr: 'réseau en creux', en: 'grid in the dip' }, color: '--warn', pts: sys(Edip), dash: true, width: 1.5 },
        ];
      },
      points: (lab) => [
        { x: lab.at('qStat') / Math.max(1e-6, lab.at('vStat')), y: lab.at('vStat'), color: '--c-p' },
        { x: lab.at('qSvc') / Math.max(1e-6, lab.at('vSvc')), y: lab.at('vSvc'), color: '--c-C', hollow: true },
      ],
      note: () => ({ fr: 'Le point de fonctionnement est l’intersection de la caractéristique de l’équipement et de la droite du réseau.', en: 'The operating point is where the device characteristic meets the grid line.' }),
    },
    {
      title: { fr: 'Réactif maximal selon la tension', en: 'Maximum reactive power versus voltage' },
      x: { label: 'V', unit: 'pu', range: [0, 1.15] },
      y: { label: 'Q_max', unit: 'pu', range: (lab) => [0, lab.params.rating * 1.2] },
      series: (lab) => {
        const st: [number, number][] = [], sv: [number, number][] = [];
        for (let V = 0; V <= 1.15; V += 0.01) {
          st.push([V, lab.params.rating * V]);
          sv.push([V, lab.params.rating * V * V]);
        }
        return [
          { label: { fr: 'STATCOM : I·V', en: 'STATCOM: I·V' }, color: '--c-p', pts: st },
          { label: { fr: 'SVC : B·V²', en: 'SVC: B·V²' }, color: '--c-C', pts: sv },
        ];
      },
      vlines: (lab) => [{ x: lab.params.Edip, label: 'E_dip' }],
    },
  ],

  equations: [
    {
      id: 'system',
      title: { fr: 'Le réseau vu du poste', en: 'The grid seen from the substation' },
      tex: (c) => `V = E + X\\,I_c, \\qquad X = \\frac{1}{\\mathrm{SCR}} = ${c.q(1 / c.p.SCR, '', 3)}\\ \\text{pu}`,
      note: (c) =>
        c.tr({
          fr: 'Un courant capacitif $I_c$ injecté au poste remonte la tension de $X I_c$. Plus le réseau est faible (SCR bas), plus l’effet est fort.',
          en: 'A capacitive current $I_c$ injected at the substation raises the voltage by $X I_c$. The weaker the grid (low SCR), the stronger the effect.',
        }),
    },
    {
      id: 'devices',
      title: { fr: 'Deux technologies', en: 'Two technologies' },
      tex: () => `\\begin{aligned}
        \\text{SVC:} &\\quad I = B\\,V,\\quad Q = B\\,V^2,\\quad B \\le B_{max} \\\\
        \\text{STATCOM:} &\\quad I \\le I_{max},\\quad Q = V\\,I
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Le SVC est une susceptance variable (thyristors, condensateurs, inductances) : à tension réduite, son réactif chute comme $V^2$. Le STATCOM est un onduleur (module 7) : il garde son courant maximal même en tension basse.',
          en: 'The SVC is a variable susceptance (thyristors, capacitors, reactors): at reduced voltage its reactive power falls as $V^2$. The STATCOM is an inverter (Module 7): it keeps its full current even at low voltage.',
        }),
    },
    {
      id: 'droop',
      title: { fr: 'Régulation', en: 'Control' },
      tex: (c) => `V = V_{ref} - k\\,I, \\qquad k = ${c.q(100 * c.p.slope, '%', 2)}`,
      note: (c) =>
        c.tr({
          fr: 'Un léger statisme partage la régulation entre plusieurs équipements et évite qu’ils se battent.',
          en: 'A small droop shares regulation between several devices and stops them fighting each other.',
        }),
    },
    {
      id: 'results',
      title: { fr: 'Pendant le creux', en: 'During the dip' },
      tex: (c) => {
        const k = c.k as FactsInfo;
        return `\\begin{aligned}
          V: &\\quad ${c.q(k.vDipNone, '', 3)}\\ (\\text{${c.tr({ fr: 'aucun', en: 'none' })}}),\\ ${c.q(k.vDipSvc, '', 3)}\\ (\\text{SVC}),\\ ${c.q(k.vDipStat, '', 3)}\\ (\\text{STATCOM}) \\\\
          Q: &\\quad ${c.q(k.qSvcDip, '', 3)}\\ (\\text{SVC}),\\ ${c.q(k.qStatDip, '', 3)}\\ (\\text{STATCOM})
        \\end{aligned}`;
      },
    },
    {
      id: 'tcsc',
      title: { fr: 'Les autres FACTS', en: 'Other FACTS' },
      personas: ['research', 'utility'],
      tex: () => `\\text{TCSC: } X_{eff} = X_L - X_{TCSC}(\\alpha), \\qquad \\text{UPFC: } \\underline V_{ser} \\text{ + } I_{sh}`,
      note: (c) =>
        c.tr({
          fr: 'Le TCSC fait varier la compensation série (leçon 4.6) en temps réel ; l’UPFC combine un STATCOM shunt et un convertisseur série pour contrôler séparément P et Q sur une ligne.',
          en: 'The TCSC varies series compensation (lesson 4.6) in real time; the UPFC combines a shunt STATCOM and a series converter to control P and Q on a line independently.',
        }),
    },
  ],

  steps: [
    {
      id: 'compare',
      title: { fr: 'Comparer pendant un creux', en: 'Comparing during a dip' },
      body: {
        fr: `Entre 0,5 et 1,5 s, la tension du réseau tombe à 0,7 pu. Lancez la lecture ▶ : les deux équipements soutiennent la tension du poste, en injectant du réactif.`,
        en: `Between 0.5 and 1.5 s, the grid voltage falls to 0.7 pu. Press play ▶: both devices support the substation voltage by injecting reactive power.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'deep',
      title: { fr: 'Un creux profond', en: 'A deep dip' },
      body: {
        fr: `Creusez le creux jusqu’à **0,5 pu** ou moins. Le STATCOM fournit maintenant nettement plus de réactif que le SVC : à tension réduite, le SVC perd en $V^2$, le STATCOM seulement en $V$.`,
        en: `Deepen the dip to **0.5 pu** or less. The STATCOM now delivers clearly more reactive power than the SVC: at reduced voltage the SVC loses as $V^2$, the STATCOM only as $V$.`,
      },
      check: (lab) => lab.params.Edip <= 0.5,
    },
    {
      id: 'strong',
      title: { fr: 'Un réseau fort', en: 'A strong grid' },
      body: {
        fr: `Montez le SCR à **8** ou plus. Les mêmes équipements ne remontent presque plus la tension : un réseau fort se tient tout seul, et c’est sur les réseaux faibles que les FACTS sont précieux.`,
        en: `Raise the SCR to **8** or more. The same devices barely lift the voltage now: a strong grid holds itself, and FACTS are most valuable on weak grids.`,
      },
      check: (lab) => lab.params.SCR >= 8,
    },
    {
      id: 'fast',
      title: { fr: 'La rapidité', en: 'Speed' },
      body: {
        fr: `Réduisez le temps de réponse à **10 ms** ou moins. L’électronique de puissance réagit en un cycle, bien plus vite qu’un alternateur et son régulateur de tension.`,
        en: `Shorten the response time to **10 ms** or less. Power electronics react within one cycle, far faster than a generator and its voltage regulator.`,
      },
      check: (lab) => lab.params.Tr <= 0.0105,
    },
    {
      id: 'size',
      title: { fr: 'Dimensionner', en: 'Sizing' },
      body: {
        fr: `Sur un réseau faible (SCR ≤ 4) avec un creux à 0,7 pu ou plus profond, choisissez la taille du STATCOM qui maintient la tension au-dessus de **0,9 pu** pendant le creux (une fois la réponse établie).`,
        en: `On a weak grid (SCR ≤ 4) with a dip to 0.7 pu or deeper, choose the STATCOM rating that holds the voltage above **0.9 pu** during the dip (once it has responded).`,
      },
      check: (lab) => lab.params.SCR <= 4 && lab.params.Edip <= 0.7 && (lab.info as FactsInfo).vDipStat >= 0.9,
    },
  ],
};
