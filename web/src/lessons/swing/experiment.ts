// Module 3.3 — State space and linearisation, on the swing equation of a generator.

import SPlane from '../../lib/instruments/SPlane.svelte';
import type { Experiment } from '../../lib/lab/types';
import { smib, smibInfo, type SmibInfo } from '../../lib/models/module3';
import PDelta from './PDelta.svelte';
import PhasePortrait from './PhasePortrait.svelte';
import SmibCanvas from './SmibCanvas.svelte';

const toDeg = (r: number) => (r * 180) / Math.PI;

export const swingLesson: Experiment = {
  id: 'swing',
  path: [
    { fr: 'Module 3 · Signaux et commande', en: 'Module 3 · Signals and control' },
    { fr: '3.3 Espace d’état et linéarisation', en: '3.3 State space and linearisation' },
  ],
  title: { fr: 'Linéariser l’équation du mouvement d’un alternateur', en: 'Linearising a generator’s swing equation' },
  model: smib,
  info: smibInfo,
  canvas: SmibCanvas,
  instruments: [PDelta, PhasePortrait, SPlane],
  locusParam: 'D',
  poleLabel: (_p, k: SmibInfo) => ({
    fr: `mode électromécanique ${k.fn.toFixed(2).replace('.', ',')} Hz`,
    en: `electromechanical mode ${k.fn.toFixed(2)} Hz`,
  }),

  params: [
    { id: 'Pm0', symbol: 'P_{m0}', name: { fr: 'Puissance mécanique initiale', en: 'Initial mechanical power' }, unit: 'pu', min: 0.1, max: 0.95, default: 0.5, scale: 'lin', term: 'S' },
    { id: 'dP', symbol: '\\Delta P_m', name: { fr: 'Échelon de puissance', en: 'Power step' }, unit: 'pu', min: -0.4, max: 0.6, default: 0.05, scale: 'lin', term: 'S' },
    { id: 'Pmax', symbol: 'P_{max}', name: { fr: 'Puissance maximale transmissible', en: 'Maximum transferable power' }, unit: 'pu', min: 0.6, max: 2, default: 1, scale: 'lin', term: 'p' },
    { id: 'H', symbol: 'H', name: { fr: 'Constante d’inertie', en: 'Inertia constant' }, unit: 's', min: 1, max: 10, default: 4, scale: 'lin', term: 'L' },
    { id: 'D', symbol: 'D', name: { fr: 'Amortissement', en: 'Damping' }, unit: 'pu', min: 0, max: 30, default: 2, scale: 'lin', term: 'R' },
  ],

  signals: [
    { id: 'delta', symbol: '\\delta', name: { fr: 'Angle rotorique', en: 'Rotor angle' }, unit: '°', color: '--c-p', on: true, term: 'p' },
    { id: 'deltaLin', symbol: '\\delta_{lin}', name: { fr: 'Angle (modèle linéaire)', en: 'Angle (linear model)' }, unit: '°', color: '--c-R', on: true, term: 'R', dash: true },
    { id: 'df', symbol: '\\Delta f', name: { fr: 'Écart de fréquence', en: 'Frequency deviation' }, unit: 'Hz', color: '--c-C', on: false, term: 'C' },
    { id: 'dfLin', symbol: '\\Delta f_{lin}', name: { fr: 'Écart de fréquence (linéaire)', en: 'Frequency deviation (linear)' }, unit: 'Hz', color: '--c-C', on: false, dash: true },
    { id: 'pe', symbol: 'P_e', name: { fr: 'Puissance électrique', en: 'Electrical power' }, unit: 'pu', color: '--c-v1', on: false },
    { id: 'pm', symbol: 'P_m', name: { fr: 'Puissance mécanique', en: 'Mechanical power' }, unit: 'pu', color: '--c-S', on: false, term: 'S', dash: true },
  ],

  predict: {
    signal: 'delta',
    yRange: (p) => {
      const k = smibInfo({ ...p, dP: 0 });
      const step = toDeg(Math.abs(p.dP) / k.Ks) || 3;
      const d0 = toDeg(k.delta0);
      return [d0 - 2.5 * step, d0 + 3.5 * step];
    },
    diagnose(pred, run, p) {
      const k = smibInfo(p);
      const final = toDeg(Math.asin(Math.min(0.999, (Math.min(p.Pm0, 0.98 * p.Pmax) + p.dP) / p.Pmax)));
      const step = Math.abs(final - toDeg(k.delta0));
      const peak = Math.max(...run.s.delta);
      const predPeak = Math.max(...pred.map(([, y]) => y));
      if (peak > final + 0.3 * step && predPeak < final + 0.15 * step)
        return {
          fr: `Le rotor **dépasse** son nouvel équilibre et oscille autour, à environ ${k.fn.toFixed(2).replace('.', ',')} Hz. C’est un système masse–ressort : l’inertie $H$ est la masse, le couple synchronisant $K_s$ est le ressort, et l’amortissement $D$ est faible.`,
          en: `The rotor **overshoots** its new equilibrium and swings around it, at about ${k.fn.toFixed(2)} Hz. It is a mass–spring system: inertia $H$ is the mass, the synchronising torque $K_s$ is the spring, and damping $D$ is small.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'swing',
      title: { fr: 'Équation du mouvement', en: 'Swing equation' },
      tex: (c) => `\\begin{aligned}
        \\frac{d\\delta}{dt} &= \\omega_b\\,\\Delta\\omega \\\\
        2${c.term('L', 'H')}\\,\\frac{d\\Delta\\omega}{dt} &= ${c.term('S', 'P_m')} - \\underbrace{${c.term('p', 'P_{max}')}\\sin\\delta}_{P_e} - ${c.term('R', 'D')}\\,\\Delta\\omega
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Deux états ($\\delta$, $\\Delta\\omega$) et un terme **non linéaire** : $\\sin\\delta$. $P_{max} = EV/X$ dépend de la force du réseau, via la réactance $X$.',
          en: 'Two states ($\\delta$, $\\Delta\\omega$) and one **nonlinear** term: $\\sin\\delta$. $P_{max} = EV/X$ depends on how strong the grid is, through the reactance $X$.',
        }),
    },
    {
      id: 'equilibrium',
      title: { fr: 'Points d’équilibre', en: 'Equilibrium points' },
      tex: (c) => {
        const k = c.k as SmibInfo;
        return `\\delta_0 = \\arcsin\\frac{P_m}{P_{max}} = ${c.q(toDeg(k.delta0), '°', 3)}, \\qquad \\delta_u = 180^\\circ - \\delta_0 = ${c.q(toDeg(k.deltaU), '°', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Deux équilibres : $\\delta_0$ est stable, $\\delta_u$ est instable. Si le rotor franchit $\\delta_u$, il ne revient plus : c’est la perte de synchronisme.',
          en: 'Two equilibria: $\\delta_0$ is stable, $\\delta_u$ is unstable. If the rotor passes $\\delta_u$ it never comes back: that is loss of synchronism.',
        }),
    },
    {
      id: 'linearise',
      title: { fr: 'Linéarisation', en: 'Linearisation' },
      tex: (c) => {
        const k = c.k as SmibInfo;
        return `\\begin{aligned}
          \\Delta P_e &\\approx \\left.\\frac{\\partial P_e}{\\partial\\delta}\\right|_{\\delta_0}\\Delta\\delta = K_s\\,\\Delta\\delta, \\qquad K_s = P_{max}\\cos\\delta_0 = ${c.q(k.Ks, '', 3)}\\ \\text{pu} \\\\
          \\frac{d}{dt}\\begin{bmatrix}\\Delta\\delta\\\\ \\Delta\\omega\\end{bmatrix} &= \\underbrace{\\begin{bmatrix} 0 & \\omega_b \\\\ -\\frac{K_s}{2H} & -\\frac{D}{2H}\\end{bmatrix}}_{A = \\begin{bmatrix} 0 & ${c.q(k.A[0][1], '', 3)} \\\\ ${c.q(k.A[1][0], '', 3)} & ${c.q(k.A[1][1], '', 3)}\\end{bmatrix}}\\begin{bmatrix}\\Delta\\delta\\\\ \\Delta\\omega\\end{bmatrix} + \\begin{bmatrix}0\\\\ \\frac{1}{2H}\\end{bmatrix}\\Delta P_m
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'On remplace la sinusoïde par sa **tangente** au point d’équilibre (courbe P–δ). Valable tant que $\\Delta\\delta$ reste petit.',
          en: 'The sine is replaced by its **tangent** at the equilibrium point (P–δ curve). Valid as long as $\\Delta\\delta$ stays small.',
        }),
    },
    {
      id: 'mode',
      title: { fr: 'Le mode électromécanique', en: 'The electromechanical mode' },
      tex: (c) => {
        const k = c.k as SmibInfo;
        return `\\begin{aligned}
          s^2 + \\frac{D}{2H}s + \\frac{\\omega_b K_s}{2H} = 0 \\;&\\Rightarrow\\; \\omega_n = \\sqrt{\\frac{\\omega_b K_s}{2H}} = ${c.q(k.wn, 'rad/s')} \\\\
          f_n = ${c.q(k.fn, 'Hz')}, \\qquad \\zeta &= \\frac{D}{4H\\omega_n} = ${c.q(k.zeta, '', 3)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les valeurs propres de $A$ sont exactement les pôles des leçons 1.2 et 3.1. Un réseau réel en a des centaines, et G2ELin les calcule tous (module 8).',
          en: 'The eigenvalues of $A$ are exactly the poles of lessons 1.2 and 3.1. A real grid has hundreds of them, and G2ELin computes them all (Module 8).',
        }),
    },
    {
      id: 'jacobian',
      title: { fr: 'Linéariser n’importe quel modèle', en: 'Linearising any model' },
      personas: ['research'],
      tex: () => `\\dot x = f(x, u) \\;\\Rightarrow\\; \\Delta\\dot x = \\underbrace{\\left.\\frac{\\partial f}{\\partial x}\\right|_{x_0,u_0}}_{A}\\Delta x + \\underbrace{\\left.\\frac{\\partial f}{\\partial u}\\right|_{x_0,u_0}}_{B}\\Delta u`,
      note: (c) =>
        c.tr({
          fr: 'C’est ce que fait G2ELin pour un réseau entier : jacobiennes symboliques (SymPy) évaluées au point de fonctionnement donné par la répartition de charge.',
          en: 'This is what G2ELin does for a whole grid: symbolic Jacobians (SymPy) evaluated at the operating point given by the power flow.',
        }),
    },
    {
      id: 'practice',
      title: { fr: 'Sur le réseau', en: 'On the grid' },
      personas: ['utility', 'research'],
      tex: () => `f_{\\text{local}} \\approx 1 - 2\\ \\text{Hz}, \\qquad f_{\\text{inter-area}} \\approx 0{,}1 - 0{,}8\\ \\text{Hz}`,
      note: (c) =>
        c.tr({
          fr: 'Modes locaux (une machine contre le réseau, comme ici) et inter-zones (des groupes de machines entre eux). Les stabilisateurs (PSS) ajoutent l’amortissement qui manque ; la perte de synchronisme se traite par le critère des aires égales (module 8).',
          en: 'Local modes (one machine against the grid, as here) and inter-area modes (groups of machines against each other). Power system stabilisers (PSS) add the missing damping; loss of synchronism is studied with the equal-area criterion (Module 8).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire l’angle', en: 'Predict the angle' },
      body: {
        fr: `L’alternateur fonctionne à $P_m = 0{,}5$ pu ($\\delta_0 = 30°$). À $t = 0{,}2$ s, sa turbine donne **5 % de plus**. **Dessinez l’angle rotorique $\\delta(t)$**, puis révélez.`,
        en: `The generator runs at $P_m = 0.5$ pu ($\\delta_0 = 30°$). At $t = 0.2$ s its turbine delivers **5 % more**. **Sketch the rotor angle $\\delta(t)$**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'tangent',
      title: { fr: 'La tangente suffit', en: 'The tangent is enough' },
      body: {
        fr: `Pour un petit échelon, le modèle **linéaire** (pointillés) suit presque parfaitement le modèle **non linéaire** : les deux trajectoires se superposent dans le plan de phase. Parcourez le temps jusqu’à la fin.`,
        en: `For a small step, the **linear** model (dashed) tracks the **nonlinear** one almost perfectly: the two trajectories overlap in the phase portrait. Scrub through to the end.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'large',
      title: { fr: 'Un grand échelon', en: 'A large step' },
      body: {
        fr: `Portez l’échelon à **0,3 pu** ou plus. Le modèle linéaire se trompe : il ignore que la courbe P–δ s’aplatit en approchant 90°. Les deux trajectoires se séparent.`,
        en: `Raise the step to **0.3 pu** or more. The linear model gets it wrong: it ignores that the P–δ curve flattens towards 90°. The two trajectories part ways.`,
      },
      check: (lab) => lab.params.dP >= 0.3,
    },
    {
      id: 'sync',
      title: { fr: 'Perdre le synchronisme', en: 'Losing synchronism' },
      body: {
        fr: `Trouvez l’échelon qui fait franchir $\\delta_u$ au rotor : l’angle dépasse 180° et ne revient plus. Le modèle linéaire, lui, reste **stable** quoi qu’il arrive : il ne peut pas prédire cette instabilité.`,
        en: `Find the step that pushes the rotor past $\\delta_u$: the angle goes beyond 180° and never comes back. The linear model stays **stable** whatever happens: it cannot predict this instability.`,
      },
      check: (lab) => (lab.info as SmibInfo).lostSync,
    },
    {
      id: 'weak',
      title: { fr: 'Un réseau plus faible', en: 'A weaker grid' },
      body: {
        fr: `Revenez à un petit échelon, puis réduisez $P_{max}$ à **0,75** ou moins, comme avec une ligne plus longue. $K_s$ diminue : l’oscillation est plus lente, et $\\delta_0$ se rapproche dangereusement de $\\delta_u$.`,
        en: `Go back to a small step, then lower $P_{max}$ to **0.75** or less, as with a longer line. $K_s$ falls: the swing is slower, and $\\delta_0$ creeps towards $\\delta_u$.`,
      },
      check: (lab) => lab.params.Pmax <= 0.75 && !(lab.info as SmibInfo).lostSync,
    },
    {
      id: 'damping',
      title: { fr: 'Ajouter de l’amortissement', en: 'Adding damping' },
      body: {
        fr: `Montez $D$ à **10** ou plus et regardez les pôles partir vers la gauche (le lieu des racines suit $D$). Un PSS fait exactement cela, à travers le régulateur de tension.`,
        en: `Raise $D$ to **10** or more and watch the poles move left (the root locus follows $D$). A PSS does exactly this, through the voltage regulator.`,
      },
      check: (lab) => lab.params.D >= 10,
    },
  ],
};
