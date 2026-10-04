// Module 5.1 — The Y-bus and Newton–Raphson power flow on a four-bus network.
// The time cursor walks through the iterations.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import type { Experiment } from '../../lib/lab/types';
import { network, pflow, pflowInfo, type PflowInfo } from '../../lib/models/module5';
import { num } from '../../lib/ui/format';
import PflowCanvas from './PflowCanvas.svelte';
import YbusPanel from './YbusPanel.svelte';

const log = (k: PflowInfo, j: number) => Math.log10(Math.max(1e-16, k.nr.history[Math.min(j, k.nr.history.length - 1)].mismatch));

export const pflowLesson: Experiment = {
  id: 'pflow',
  path: [
    { fr: 'Module 5 · Le réseau en régime permanent', en: 'Module 5 · The network in steady state' },
    { fr: '5.1 Répartition de charge', en: '5.1 Power flow' },
  ],
  title: { fr: 'La matrice Y et la répartition de charge par Newton–Raphson', en: 'The Y-bus and Newton–Raphson power flow' },
  model: pflow,
  info: pflowInfo,
  canvas: PflowCanvas,
  instruments: [YbusPanel, Chart0],
  axis: { label: { fr: 'Itération', en: 'Iteration' }, symbol: 'k', fmt: (v, d = 3) => num(v, d) },

  params: [
    { id: 'lambda', symbol: '\\lambda', name: { fr: 'Niveau de charge (× base)', en: 'Load level (× base)' }, unit: '', min: 0.2, max: 4, default: 1, scale: 'lin', term: 'R' },
    { id: 'P2', symbol: 'P_2', name: { fr: 'Production du générateur 2', en: 'Generator 2 output' }, unit: 'pu', min: 0, max: 2, default: 0.8, scale: 'lin', term: 'S' },
    { id: 'V2', symbol: 'V_2', name: { fr: 'Consigne de tension du générateur 2', en: 'Generator 2 voltage setpoint' }, unit: 'pu', min: 0.95, max: 1.08, default: 1.01, scale: 'lin', term: 'S' },
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
    { id: 'err', symbol: '\\log_{10}|\\Delta|', name: { fr: 'Écart de puissance (log)', en: 'Power mismatch (log)' }, unit: '', color: '--c-R', on: true, term: 'R' },
    { id: 'v3', symbol: 'V_3', name: { fr: 'Tension au nœud 3', en: 'Bus 3 voltage' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'v4', symbol: 'V_4', name: { fr: 'Tension au nœud 4', en: 'Bus 4 voltage' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'th3', symbol: '\\theta_3', name: { fr: 'Angle au nœud 3', en: 'Bus 3 angle' }, unit: '°', color: '--c-C', on: false, dash: true },
    { id: 'th4', symbol: '\\theta_4', name: { fr: 'Angle au nœud 4', en: 'Bus 4 angle' }, unit: '°', color: '--c-p', on: false, dash: true },
  ],

  charts: [
    {
      title: { fr: 'Convergence : Newton–Raphson contre Gauss–Seidel', en: 'Convergence: Newton–Raphson versus Gauss–Seidel' },
      x: { label: 'k', unit: '', range: [0, 40] },
      y: { label: '|Δ|', unit: 'pu', range: [1e-12, 10], log: true },
      bands: () => [{ y0: 1e-12, y1: 1e-8 }],
      series: (lab) => {
        const k = lab.info as PflowInfo;
        return [
          { label: { fr: 'Gauss–Seidel', en: 'Gauss–Seidel' }, color: '--c-C', pts: k.gs.map((h, j) => [j, Math.max(1e-13, h.mismatch)] as [number, number]), width: 1.5 },
          { label: { fr: 'Newton–Raphson', en: 'Newton–Raphson' }, color: '--c-R', pts: k.nr.history.map((h, j) => [j, Math.max(1e-13, h.mismatch)] as [number, number]), width: 2.5 },
        ];
      },
      points: (lab) => {
        const k = lab.info as PflowInfo;
        const j = Math.min(k.nr.history.length - 1, Math.floor(lab.t + 1e-9));
        return [{ x: j, y: Math.max(1e-13, k.nr.history[j].mismatch), color: '--c-R' }];
      },
      note: (lab) => {
        const k = lab.info as PflowInfo;
        return {
          fr: `Zone verte : tolérance 10⁻⁸ pu. Newton–Raphson : ${isNaN(k.nrIts) ? 'diverge' : `${k.nrIts} itérations`} ; Gauss–Seidel : ${isNaN(k.gsIts) ? 'ne converge pas' : `${k.gsIts} itérations`}.`,
          en: `Green band: 10⁻⁸ pu tolerance. Newton–Raphson: ${isNaN(k.nrIts) ? 'diverges' : `${k.nrIts} iterations`}; Gauss–Seidel: ${isNaN(k.gsIts) ? 'does not converge' : `${k.gsIts} iterations`}.`,
        };
      },
    },
  ],

  predict: {
    signal: 'err',
    yRange: () => [-16, 1],
    diagnose(pred) {
      // The truth falls by more and more decades each iteration (quadratic convergence).
      const late = pred.filter(([t]) => t >= 2.5 && t <= 3.5).map(([, y]) => y);
      if (late.length && Math.min(...late) > -5)
        return {
          fr: 'Newton–Raphson converge **quadratiquement** : près de la solution, le nombre de chiffres justes **double** à chaque itération (10⁻², 10⁻⁴, 10⁻⁸…). Quatre ou cinq itérations suffisent, quelle que soit la taille du réseau.',
          en: 'Newton–Raphson converges **quadratically**: near the solution, the number of correct digits **doubles** at each iteration (10⁻², 10⁻⁴, 10⁻⁸…). Four or five iterations are enough, whatever the size of the grid.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'ybus',
      title: { fr: 'La matrice d’admittance', en: 'The admittance matrix' },
      tex: (c) => {
        const k = c.k as PflowInfo;
        const y = k.Y[2][2];
        return `Y_{ii} = \\sum_k \\Big(y_{ik} + \\tfrac{j b_{ik}}{2}\\Big) + jB_{sh,i}, \\qquad Y_{ik} = -y_{ik}, \\qquad Y_{33} = ${c.q(y.re, '', 3)} ${y.im < 0 ? '-' : '+'} j\\,${c.q(Math.abs(y.im), '', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Elle résume tout le réseau : $\\underline I = Y\\,\\underline V$. Elle est creuse : une case est nulle quand deux nœuds ne sont pas reliés (un réseau réel de 10 000 nœuds a moins de 0,1 % de cases non nulles).',
          en: 'It sums up the whole network: $\\underline I = Y\\,\\underline V$. It is sparse: an entry is zero when two buses are not connected (a real 10,000-bus grid has under 0.1 % non-zero entries).',
        }),
    },
    {
      id: 'pf',
      title: { fr: 'Les équations de répartition', en: 'The power-flow equations' },
      tex: () =>
        `\\begin{aligned} P_i &= V_i \\sum_k V_k\\,(G_{ik}\\cos\\theta_{ik} + B_{ik}\\sin\\theta_{ik}) \\\\ Q_i &= V_i \\sum_k V_k\\,(G_{ik}\\sin\\theta_{ik} - B_{ik}\\cos\\theta_{ik}) \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Non linéaires (produits de tensions, sinus, cosinus) : pas de formule directe, il faut itérer. Chaque nœud a quatre grandeurs ($P, Q, V, \\theta$) ; on en impose deux.',
          en: 'Nonlinear (products of voltages, sines, cosines): no direct formula, so we iterate. Each bus has four quantities ($P, Q, V, \\theta$); two are specified.',
        }),
    },
    {
      id: 'types',
      title: { fr: 'Types de nœuds', en: 'Bus types' },
      tex: () => `\\text{bilan: } V, \\theta \\qquad \\text{PV: } P, V \\qquad \\text{PQ: } P, Q`,
      note: (c) =>
        c.tr({
          fr: 'Le nœud bilan (1) fixe la référence d’angle et fournit les pertes, inconnues d’avance. Un générateur régule sa tension (PV) ; une charge impose sa consommation (PQ). Ici : 3 angles et 2 tensions inconnus, donc 5 équations.',
          en: 'The slack bus (1) sets the angle reference and supplies the losses, unknown in advance. A generator regulates its voltage (PV); a load sets its consumption (PQ). Here: 3 angles and 2 voltages unknown, so 5 equations.',
        }),
    },
    {
      id: 'nr',
      title: { fr: 'Newton–Raphson', en: 'Newton–Raphson' },
      tex: (c) => {
        const k = c.k as PflowInfo;
        const j = Math.min(k.nr.history.length - 1, Math.floor(c.t + 1e-9));
        return `\\begin{bmatrix} \\Delta\\theta \\\\ \\Delta V \\end{bmatrix} = J^{-1} \\begin{bmatrix} \\Delta P \\\\ \\Delta Q \\end{bmatrix}, \\qquad |\\Delta|_{k=${j}} = 10^{${num(log(k, j), 3).replace(',', '{,}').replace('−', '-')}}\\ \\text{pu}`;
      },
      note: (c) =>
        c.tr({
          fr: 'À chaque itération, on remplace les équations par leur tangente (le jacobien $J$, leçon 3.3) et on résout ce système linéaire. Départ « à plat » : toutes les tensions à 1 pu, tous les angles à 0.',
          en: 'At each iteration the equations are replaced by their tangent (the Jacobian $J$, lesson 3.3) and that linear system is solved. “Flat start”: every voltage at 1 pu, every angle at 0.',
        }),
    },
    {
      id: 'losses',
      title: { fr: 'Pertes et nœud bilan', en: 'Losses and the slack bus' },
      tex: (c) => {
        const k = c.k as PflowInfo;
        const net = network(c.p);
        const load = net.buses.reduce((s, b) => s + b.Pd, 0);
        return `P_1 = \\sum P_d - P_2 + P_{pertes} = ${c.q(load * 100, 'MW', 3)} - ${c.q(c.p.P2 * 100, 'MW', 3)} + ${c.q(k.nr.losses * 100, 'MW', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les pertes ne sont connues qu’une fois la solution trouvée : c’est le nœud bilan qui les compense.',
          en: 'Losses are known only once the solution is found: the slack bus makes them up.',
        }),
    },
    {
      id: 'dc',
      title: { fr: 'Répartition « continue » (DC)', en: 'DC power flow' },
      personas: ['research', 'utility'],
      tex: (c) => {
        const k = c.k as PflowInfo;
        return `P_{ik} \\approx \\frac{\\theta_i - \\theta_k}{x_{ik}}, \\qquad P_{1\\text{–}3}: ${c.q(k.nr.flows[1].Pij * 100, 'MW', 3)}\\ (\\text{AC}),\\ ${c.q(k.dc[1] * 100, 'MW', 3)}\\ (\\text{DC})`;
      },
      note: (c) =>
        c.tr({
          fr: 'Tensions à 1 pu, angles petits, pas de pertes : le problème devient linéaire, $P = B\\,\\theta$. Rapide et robuste, à quelques pour cent près : c’est la base des marchés et des études de sécurité N–1 (leçon 5.4).',
          en: 'Voltages at 1 pu, small angles, no losses: the problem becomes linear, $P = B\\,\\theta$. Fast and robust, within a few per cent: the basis of markets and N–1 security studies (lesson 5.4).',
        }),
    },
    {
      id: 'gs',
      title: { fr: 'Gauss–Seidel', en: 'Gauss–Seidel' },
      personas: ['research'],
      tex: () => `\\underline V_i \\leftarrow \\frac{1}{Y_{ii}}\\Big(\\frac{P_i - jQ_i}{\\underline V_i^*} - \\sum_{k \\ne i} Y_{ik}\\underline V_k\\Big)`,
      note: (c) =>
        c.tr({
          fr: 'Simple et sans jacobien, mais convergence linéaire : on gagne à peu près le même facteur à chaque itération, et il en faut de plus en plus quand le réseau grandit ou se charge.',
          en: 'Simple and Jacobian-free, but linear convergence: roughly the same factor is gained at each iteration, and more are needed as the grid grows or loads up.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la convergence', en: 'Predict the convergence' },
      body: {
        fr: `Newton–Raphson part d’un départ « à plat » (1 pu, 0°). La courbe rouge est le logarithme du plus grand écart de puissance. **Dessinez comment il décroît** au fil des itérations, puis révélez.`,
        en: `Newton–Raphson starts from a “flat start” (1 pu, 0°). The red trace is the logarithm of the largest power mismatch. **Sketch how it falls** over the iterations, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'build',
      title: { fr: 'Construire la matrice Y', en: 'Building the Y matrix' },
      body: {
        fr: `Cliquez sur **Construire pas à pas** et ajoutez les lignes une à une. Chaque ligne ne touche que **quatre cases** : deux sur la diagonale, deux en dehors.`,
        en: `Click **Build step by step** and add the lines one at a time. Each line touches only **four entries**: two on the diagonal, two off it.`,
      },
      check: (lab) => !!lab.flags.ybuilt,
    },
    {
      id: 'outage',
      title: { fr: 'Une ligne déclenche', en: 'A line trips' },
      body: {
        fr: `Mettez une ligne **hors service**. Ses cases de $Y$ s’annulent, et la puissance **se répartit sur les autres chemins** selon leurs impédances : personne ne la « dirige ».`,
        en: `Take a line **out of service**. Its entries in $Y$ drop to zero, and the power **redistributes over the other paths** according to their impedances: nobody “routes” it.`,
      },
      check: (lab) => lab.params.out !== 0 && (lab.info as PflowInfo).nr.converged,
    },
    {
      id: 'pv',
      title: { fr: 'Un nœud PV', en: 'A PV bus' },
      body: {
        fr: `Montez la consigne de tension du générateur 2 à **1,05 pu** ou plus. Sa puissance active ne change pas, mais il fournit **plus de réactif** pour tenir la tension, et les tensions voisines montent.`,
        en: `Raise generator 2’s voltage setpoint to **1.05 pu** or more. Its active power does not change, but it supplies **more reactive power** to hold the voltage, and neighbouring voltages rise.`,
      },
      check: (lab) => lab.params.V2 >= 1.05 && (lab.info as PflowInfo).nr.converged,
    },
    {
      id: 'heavy',
      title: { fr: 'Un réseau chargé', en: 'A heavily loaded grid' },
      body: {
        fr: `Augmentez le niveau de charge jusqu’à ce que Newton–Raphson ait besoin d’au moins **6 itérations**. Plus le point de fonctionnement est loin du départ à plat, plus le chemin est long.`,
        en: `Raise the load level until Newton–Raphson needs at least **6 iterations**. The further the operating point from the flat start, the longer the path.`,
      },
      check: (lab) => (lab.info as PflowInfo).nrIts >= 6,
    },
    {
      id: 'diverge',
      title: { fr: 'Plus de solution', en: 'No solution' },
      body: {
        fr: `Continuez jusqu’à ce que le calcul **ne converge plus**. Ce n’est pas un problème numérique : au-delà du « nez », il n’existe aucun état d’équilibre (leçons 4.6 et 5.2).`,
        en: `Keep going until the calculation **no longer converges**. This is not a numerical issue: beyond the “nose”, no equilibrium exists (lessons 4.6 and 5.2).`,
      },
      check: (lab) => !(lab.info as PflowInfo).nr.converged,
    },
  ],
};

