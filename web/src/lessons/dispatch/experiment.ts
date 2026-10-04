// Module 5.4 — Economic dispatch over a day: equal incremental cost, unit
// limits, line congestion and nodal prices, the merit-order effect of solar.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import type { Lab } from '../../lib/lab/lab.svelte';
import { dispatch, dispatchInfo, dispatchModel, dispatchUnits, loadProfile, solarProfile, type DayInfo } from '../../lib/models/module5';
import DispatchCanvas from './DispatchCanvas.svelte';

const now = (lab: Lab) => dispatch(lab.params, loadProfile(lab.t, lab.params.peak), solarProfile(lab.t, lab.params.solar));
const COLORS = ['--c-C', '--c-p', '--c-L', '--c-i'];

export const dispatchLesson: Experiment = {
  id: 'dispatch',
  path: [
    { fr: 'Module 5 · Le réseau en régime permanent', en: 'Module 5 · The network in steady state' },
    { fr: '5.4 Dispatching économique', en: '5.4 Economic dispatch' },
  ],
  title: { fr: 'Produire au moindre coût : coût marginal, congestion et prix nodaux', en: 'Producing at least cost: marginal cost, congestion and nodal prices' },
  model: dispatchModel,
  info: dispatchInfo,
  canvas: DispatchCanvas,
  instruments: [Chart0, Chart1],
  timeUnit: 'h',

  params: [
    { id: 'peak', symbol: 'P_{pointe}', name: { fr: 'Pointe de consommation', en: 'Peak demand' }, unit: 'MW', min: 600, max: 1300, default: 850, scale: 'lin', term: 'R' },
    { id: 'solar', symbol: 'P_{PV}', name: { fr: 'Solaire installé (nœud 1)', en: 'Installed solar (bus 1)' }, unit: 'MW', min: 0, max: 600, default: 0, scale: 'lin', term: 'i' },
    { id: 'Fmax', symbol: 'F_{13}^{max}', name: { fr: 'Capacité de la ligne 1–3', en: 'Line 1–3 rating' }, unit: 'MW', min: 200, max: 1000, default: 1000, scale: 'lin', term: 'C' },
    { id: 'gas', symbol: 'k_{gaz}', name: { fr: 'Prix du gaz (× référence)', en: 'Gas price (× reference)' }, unit: '', min: 0.5, max: 3, default: 1, scale: 'lin', term: 'p' },
  ],

  signals: [
    { id: 'price', symbol: '\\lambda', name: { fr: 'Prix au nœud 3 (charge)', en: 'Price at bus 3 (load)' }, unit: '€/MWh', color: '--c-R', on: true, term: 'R' },
    { id: 'lmp1', symbol: '\\lambda_1', name: { fr: 'Prix au nœud 1', en: 'Price at bus 1' }, unit: '€/MWh', color: '--c-S', on: false, dash: true },
    { id: 'load', symbol: 'D', name: { fr: 'Consommation', en: 'Demand' }, unit: 'MW', color: '--c-b', on: true, dash: true },
    { id: 'g1', symbol: 'P_1', name: { fr: 'G1 (charbon/nucléaire)', en: 'G1 (coal/nuclear)' }, unit: 'MW', color: '--c-C', on: true, term: 'C' },
    { id: 'g2', symbol: 'P_2', name: { fr: 'G2 (gaz, cycle combiné)', en: 'G2 (gas, combined cycle)' }, unit: 'MW', color: '--c-p', on: true, term: 'p' },
    { id: 'g3', symbol: 'P_3', name: { fr: 'G3 (turbine de pointe)', en: 'G3 (peaker)' }, unit: 'MW', color: '--c-L', on: true, term: 'L' },
    { id: 'pv', symbol: 'P_{PV}', name: { fr: 'Solaire', en: 'Solar' }, unit: 'MW', color: '--c-i', on: false, term: 'i' },
    { id: 'f13', symbol: 'F_{13}', name: { fr: 'Transit ligne 1–3', en: 'Line 1–3 flow' }, unit: 'MW', color: '--c-a', on: false, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Ordre de mérite (offre) et demande', en: 'Merit order (supply) and demand' },
      x: { label: 'P', unit: 'MW', range: [0, 1900] },
      y: { label: 'λ', unit: '€/MWh', range: [0, 160] },
      series: (lab) => {
        const us = dispatchUnits(lab.params, solarProfile(lab.t, lab.params.solar));
        const pts: [number, number][] = [];
        for (let lam = 0; lam <= 160; lam += 0.5) pts.push([us.reduce((s, u) => s + Math.max(0, Math.min(u.Pmax, (lam - u.b) / (2 * u.c))), 0), lam]);
        return [{ label: { fr: 'offre (coûts marginaux)', en: 'supply (marginal costs)' }, color: '--c-R', pts }];
      },
      vlines: (lab) => [{ x: loadProfile(lab.t, lab.params.peak), label: 'D' }],
      points: (lab) => {
        const r = now(lab);
        return [{ x: loadProfile(lab.t, lab.params.peak), y: r.lambda, color: '--c-R' }];
      },
      note: () => ({
        fr: 'Les unités sont appelées de la moins chère à la plus chère. Le prix est le coût marginal de la dernière unité appelée.',
        en: 'Units are called from cheapest to most expensive. The price is the marginal cost of the last unit called.',
      }),
    },
    {
      title: { fr: 'Coût marginal de chaque unité', en: 'Each unit’s marginal cost' },
      x: { label: 'P', unit: 'MW', range: [0, 650] },
      y: { label: 'dC/dP', unit: '€/MWh', range: [0, 160] },
      series: (lab) => {
        const us = dispatchUnits(lab.params, solarProfile(lab.t, lab.params.solar));
        const r = now(lab);
        const s = us
          .filter((u) => u.Pmax > 0)
          .map((u) => ({
            label: { fr: u.name === 'PV' ? 'solaire' : u.name, en: u.name === 'PV' ? 'solar' : u.name },
            color: COLORS[us.indexOf(u)],
            pts: [
              [0, u.b],
              [u.Pmax, u.b + 2 * u.c * u.Pmax],
            ] as [number, number][],
          }));
        return [
          ...s,
          { label: { fr: 'λ (nœud 3)', en: 'λ (bus 3)' }, color: '--c-R', pts: [[0, r.lambda], [650, r.lambda]], dash: true, width: 1.2 },
          ...(r.congested ? [{ label: { fr: 'λ₁ (nœud 1)', en: 'λ₁ (bus 1)' }, color: '--c-S', pts: [[0, r.lmp[0]], [650, r.lmp[0]]] as [number, number][], dash: true, width: 1.2 }] : []),
        ];
      },
      points: (lab) => now(lab).units.filter((u) => u.Pmax > 0).map((u, j) => ({ x: u.P, y: u.mc, color: COLORS[j] })),
      note: (lab) =>
        now(lab).congested
          ? { fr: 'Avec la congestion, les unités du nœud 1 s’alignent sur un prix plus bas que celles du nœud 3.', en: 'With congestion, units at bus 1 line up on a lower price than those at bus 3.' }
          : { fr: 'Toutes les unités qui ne sont pas en butée tournent au même coût marginal λ.', en: 'Every unit not at a limit runs at the same marginal cost λ.' },
    },
  ],

  predict: {
    signal: 'price',
    yRange: () => [0, 120],
    diagnose(pred, run) {
      const ys = pred.map(([, y]) => y);
      const truth = Array.from(run.s.price);
      const spread = Math.max(...truth) - Math.min(...truth);
      if (ys.length > 5 && Math.max(...ys) - Math.min(...ys) < 0.3 * spread)
        return {
          fr: 'Le prix de l’électricité **n’est pas fixe** : à chaque instant, il vaut le coût marginal de la **dernière unité appelée**. La nuit, une centrale bon marché suffit ; à la pointe du soir, il faut démarrer des unités au gaz plus chères.',
          en: 'The electricity price **is not fixed**: at every moment it equals the marginal cost of the **last unit called**. At night a cheap plant is enough; at the evening peak, more expensive gas units must run.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'cost',
      title: { fr: 'Coût de production', en: 'Production cost' },
      tex: (c) => {
        const r = dispatch(c.p, loadProfile(c.t, c.p.peak), solarProfile(c.t, c.p.solar));
        return `C_i(P_i) = b_i P_i + c_i P_i^2, \\qquad \\sum_i C_i = ${c.q(r.cost, '€/h', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le coût croît plus vite que la production (rendement qui baisse, unités de moins en moins efficaces). Objectif : satisfaire la demande au moindre coût total.',
          en: 'Cost grows faster than output (falling efficiency, less and less efficient units). Goal: meet demand at the least total cost.',
        }),
    },
    {
      id: 'eic',
      title: { fr: 'Égalité des coûts marginaux', en: 'Equal incremental cost' },
      tex: (c) => {
        const r = dispatch(c.p, loadProfile(c.t, c.p.peak), solarProfile(c.t, c.p.solar));
        return `\\frac{dC_i}{dP_i} = b_i + 2c_i P_i = \\lambda, \\qquad \\sum_i P_i = D \\quad\\Rightarrow\\quad \\lambda = ${c.q(r.lambda, '€/MWh', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Si deux unités avaient des coûts marginaux différents, déplacer un MW de la plus chère vers la moins chère ferait baisser le coût total. À l’optimum, ils sont tous égaux : c’est $\\lambda$, le multiplicateur de Lagrange de l’équilibre offre–demande.',
          en: 'If two units had different marginal costs, shifting one MW from the dearer to the cheaper would lower total cost. At the optimum they are all equal: that is $\\lambda$, the Lagrange multiplier of the supply–demand balance.',
        }),
    },
    {
      id: 'limits',
      title: { fr: 'Les limites des unités', en: 'Unit limits' },
      tex: () => `P_i = P_{i,max} \\;\\Rightarrow\\; \\frac{dC_i}{dP_i} \\le \\lambda, \\qquad P_i = 0 \\;\\Rightarrow\\; \\frac{dC_i}{dP_i} \\ge \\lambda`,
      note: (c) =>
        c.tr({
          fr: 'Une unité à pleine puissance voudrait produire plus, mais ne peut pas ; une unité arrêtée coûte trop cher. Les conditions de Karush–Kuhn–Tucker généralisent l’égalité des coûts marginaux.',
          en: 'A unit at full output would like to produce more, but cannot; a unit that is off is too expensive. The Karush–Kuhn–Tucker conditions generalise equal incremental cost.',
        }),
    },
    {
      id: 'lmp',
      title: { fr: 'Congestion et prix nodaux', en: 'Congestion and nodal prices' },
      tex: (c) => {
        const r = dispatch(c.p, loadProfile(c.t, c.p.peak), solarProfile(c.t, c.p.solar));
        return `\\lambda_k = \\lambda - \\mu\\,\\mathrm{PTDF}_{k}, \\qquad (\\lambda_1, \\lambda_2, \\lambda_3) = (${c.q(r.lmp[0], '', 3)};\\ ${c.q(r.lmp[1], '', 3)};\\ ${c.q(r.lmp[2], '', 3)})\\ \\text{€/MWh}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La puissance suit les lois de Kirchhoff, pas les contrats : injecter 1 MW au nœud 1 en fait passer 2/3 par la ligne 1–3 (PTDF). Quand cette ligne sature, il faut produire plus cher près de la charge ; le prix de congestion $\\mu$ sépare les prix des nœuds.',
          en: 'Power follows Kirchhoff’s laws, not contracts: injecting 1 MW at bus 1 sends 2/3 of it through line 1–3 (PTDF). When that line is full, dearer production near the load is needed; the congestion price $\\mu$ separates the nodal prices.',
        }),
    },
    {
      id: 'opf',
      title: { fr: 'Répartition optimale (OPF)', en: 'Optimal power flow (OPF)' },
      personas: ['research', 'utility'],
      tex: () =>
        `\\min_{P} \\sum_i C_i(P_i) \\quad \\text{t.q.} \\quad \\sum_i P_i = D,\\quad |F_\\ell| = |\\mathrm{PTDF}_\\ell\\,P_{inj}| \\le F_\\ell^{max},\\quad P_i^{min} \\le P_i \\le P_i^{max}`,
      note: (c) =>
        c.tr({
          fr: 'Ici en version DC (leçon 5.1), comme les marchés nodaux (PJM, ERCOT…). L’OPF AC complet ajoute tensions et réactif ; il est non convexe et bien plus difficile.',
          en: 'Here in DC form (lesson 5.1), as in nodal markets (PJM, ERCOT…). The full AC OPF adds voltages and reactive power; it is non-convex and much harder.',
        }),
    },
    {
      id: 'merit',
      title: { fr: 'Effet d’ordre de mérite', en: 'Merit-order effect' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as DayInfo;
        return `\\lambda_{min} = ${c.q(k.minPrice, '€/MWh', 3)}, \\quad \\lambda_{max} = ${c.q(k.peakPrice, '€/MWh', 3)}, \\quad \\text{coût du jour} = ${c.q(k.dailyCost / 1000, '', 4)}\\ \\text{k€}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le solaire et l’éolien ont un coût marginal quasi nul : ils passent en tête de l’ordre de mérite et font baisser le prix aux heures où ils produisent. Avec assez de solaire, les prix de midi s’effondrent, voire deviennent négatifs.',
          en: 'Solar and wind have almost zero marginal cost: they go to the front of the merit order and push the price down when they produce. With enough solar, midday prices collapse, even turning negative.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le prix', en: 'Predict the price' },
      body: {
        fr: `Trois centrales alimentent une ville : G1 (charbon ou nucléaire, bon marché), G2 (gaz) et G3 (turbine de pointe, chère). **Dessinez le prix de l’électricité sur la journée**, puis révélez.`,
        en: `Three plants supply a city: G1 (coal or nuclear, cheap), G2 (gas) and G3 (peaker, expensive). **Sketch the electricity price over the day**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'peaker',
      title: { fr: 'Appeler la pointe', en: 'Calling the peaker' },
      body: {
        fr: `Montez la pointe de consommation à **1 000 MW** ou plus. G1 et G2 ne suffisent plus le soir : G3 démarre et le **prix bondit** à son coût marginal.`,
        en: `Raise peak demand to **1,000 MW** or more. G1 and G2 are no longer enough in the evening: G3 starts and the **price jumps** to its marginal cost.`,
      },
      check: (lab) => lab.params.peak >= 1000 && (lab.info as DayInfo).hours.some((h) => h.units[2].P > 1),
    },
    {
      id: 'equal',
      title: { fr: 'Des coûts marginaux égaux', en: 'Equal marginal costs' },
      body: {
        fr: `Placez le curseur sur une heure où **G2 et G3 produisent tous les deux** sans être en butée. Sur le second graphique, leurs points sont à la **même hauteur** : celle de $\\lambda$.`,
        en: `Put the cursor on an hour when **G2 and G3 both produce** without being at a limit. On the second chart their points are at the **same height**: that of $\\lambda$.`,
      },
      check: (lab) => {
        const r = now(lab);
        return r.units[1].P > 1 && r.units[1].P < r.units[1].Pmax - 1 && r.units[2].P > 1 && r.units[2].P < r.units[2].Pmax - 1;
      },
    },
    {
      id: 'congestion',
      title: { fr: 'Une ligne saturée', en: 'A congested line' },
      body: {
        fr: `Réduisez la capacité de la ligne 1–3 à **450 MW** ou moins. Aux heures chargées, G1 ne peut plus tout envoyer : on fait tourner G2 et G3 plus cher, et les **prix se séparent** entre les nœuds.`,
        en: `Lower line 1–3’s rating to **450 MW** or less. At busy hours G1 can no longer send everything: G2 and G3 run instead, at higher cost, and the **prices split** between buses.`,
      },
      check: (lab) => lab.params.Fmax <= 450 && (lab.info as DayInfo).congestedHours > 0,
    },
    {
      id: 'solar',
      title: { fr: 'Le solaire de midi', en: 'Midday solar' },
      body: {
        fr: `Ajoutez au moins **300 MW** de solaire. À midi, il passe en tête de l’ordre de mérite et **le prix baisse**. La pointe du soir, elle, reste à couvrir par les centrales.`,
        en: `Add at least **300 MW** of solar. At midday it goes to the front of the merit order and **the price falls**. The evening peak still has to be covered by the plants.`,
      },
      check: (lab) => lab.params.solar >= 300,
    },
    {
      id: 'curtail',
      title: { fr: 'Du solaire perdu', en: 'Wasted solar' },
      body: {
        fr: `Avec beaucoup de solaire et une ligne 1–3 limitée, la production de midi ne peut plus sortir du nœud 1 : il faut en **écrêter** une partie, et le prix au nœud 1 tombe presque à zéro. Essayez **500 MW** de solaire ou plus avec une ligne 1–3 à **300 MW** ou moins.`,
        en: `With a lot of solar and a limited line 1–3, midday output can no longer leave bus 1: some must be **curtailed**, and the price at bus 1 falls almost to zero. Try **500 MW** of solar or more with line 1–3 at **300 MW** or less.`,
      },
      check: (lab) => (lab.info as DayInfo).hours.some((h) => h.curtailed > 1),
    },
  ],
};
