// Module 7.1 — Controlling a VSC: the cascaded current and power loops, the
// PLL, bandwidth separation, decoupling and current limiting.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { VSC, vscInfo, vscModel, type VscInfo } from '../../lib/models/module7';
import VscCanvas from './VscCanvas.svelte';

export const vscLesson: Experiment = {
  id: 'vsc',
  path: [
    { fr: 'Module 7 · Ressources à onduleurs et CCHT', en: 'Module 7 · Inverter-based resources and HVDC' },
    { fr: '7.1 Commande des VSC', en: '7.1 VSC control' },
  ],
  title: { fr: 'Commander un onduleur : boucles en cascade et PLL', en: 'Controlling an inverter: cascaded loops and PLL' },
  model: vscModel,
  info: vscInfo,
  canvas: VscCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'fc', symbol: 'f_c', name: { fr: 'Bande passante de la boucle de courant', en: 'Current-loop bandwidth' }, unit: 'Hz', min: 50, max: 2000, default: 500, scale: 'log', term: 'i' },
    { id: 'fouter', symbol: 'f_o', name: { fr: 'Bande passante des boucles P, Q', en: 'P, Q loop bandwidth' }, unit: 'Hz', min: 1, max: 100, default: 5, scale: 'log', term: 'p' },
    { id: 'fpll', symbol: 'f_{PLL}', name: { fr: 'Bande passante de la PLL', en: 'PLL bandwidth' }, unit: 'Hz', min: 2, max: 150, default: 20, scale: 'log', term: 'S' },
    { id: 'SCR', symbol: '\\mathrm{SCR}', name: { fr: 'Rapport de court-circuit du réseau', en: 'Grid short-circuit ratio' }, unit: '', min: 1.2, max: 20, default: 10, scale: 'log', term: 'L' },
    { id: 'Pset', symbol: 'P^*', name: { fr: 'Consigne de puissance active (t = 50 ms)', en: 'Active-power setpoint (t = 50 ms)' }, unit: 'pu', min: 0, max: 1.1, default: 0.8, scale: 'lin', term: 'p' },
    { id: 'Qset', symbol: 'Q^*', name: { fr: 'Consigne de réactif (t = 250 ms)', en: 'Reactive setpoint (t = 250 ms)' }, unit: 'pu', min: -0.8, max: 0.8, default: 0.3, scale: 'lin', term: 'C' },
  ],

  signals: [
    { id: 'P', symbol: 'P', name: { fr: 'Puissance active', en: 'Active power' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'Pset', symbol: 'P^*', name: { fr: 'Consigne', en: 'Setpoint' }, unit: 'pu', color: '--c-p', on: true, dash: true },
    { id: 'Q', symbol: 'Q', name: { fr: 'Puissance réactive', en: 'Reactive power' }, unit: 'pu', color: '--c-C', on: true, term: 'C' },
    { id: 'id', symbol: 'i_d', name: { fr: 'Courant d’axe d', en: 'd-axis current' }, unit: 'pu', color: '--c-i', on: false, term: 'i' },
    { id: 'idr', symbol: 'i_d^*', name: { fr: 'Référence de courant d', en: 'd-current reference' }, unit: 'pu', color: '--c-i', on: false, dash: true },
    { id: 'fpll', symbol: 'f_{PLL}', name: { fr: 'Fréquence estimée par la PLL', en: 'PLL frequency estimate' }, unit: 'Hz', color: '--c-S', on: false, term: 'S' },
    { id: 'v', symbol: '|v|', name: { fr: 'Tension au point de raccordement', en: 'Voltage at the PCC' }, unit: 'pu', color: '--c-L', on: false, term: 'L' },
  ],

  charts: [
    {
      title: { fr: 'Séparation des bandes passantes', en: 'Bandwidth separation' },
      x: { label: 'f', unit: 'Hz', range: [0.5, 30000], log: true },
      y: { label: '', range: [0, 6] },
      series: (lab) => {
        const items: [number, number][] = [
          [lab.params.fouter, 1],
          [lab.params.fpll, 2],
          [lab.params.fc, 3],
          [10000, 4],
        ];
        return [
          ...items.map(([f, y]) => ({ color: ['--c-p', '--c-S', '--c-i', '--c-L'][y - 1], pts: [[0.5, y], [f, y]] as [number, number][], width: 6 })),
          { label: { fr: '50 Hz (réseau)', en: '50 Hz (grid)' }, color: '--muted', pts: [[50, 0], [50, 5]] as [number, number][], dash: true, width: 1 },
        ];
      },
      points: (lab) => [
        { x: lab.params.fouter, y: 1, color: '--c-p', label: 'P, Q' },
        { x: lab.params.fpll, y: 2, color: '--c-S', label: 'PLL' },
        { x: lab.params.fc, y: 3, color: '--c-i', label: 'i' },
        { x: 10000, y: 4, color: '--c-L', label: 'f_s' },
      ],
      note: (lab) => {
        const ok = lab.params.fc >= 5 * lab.params.fouter && 10000 >= 5 * lab.params.fc;
        return ok
          ? { fr: 'Chaque boucle est au moins 5 fois plus lente que celle qu’elle commande : elles ne se gênent pas.', en: 'Each loop is at least 5 times slower than the one it drives: they do not interfere.' }
          : { fr: 'Les boucles se rapprochent : la boucle externe voit la boucle interne comme un retard, et la réponse se dégrade.', en: 'The loops are getting close: the outer loop sees the inner one as a delay, and the response degrades.' };
      },
    },
    {
      title: { fr: 'Trajectoire dans le plan P–Q', en: 'Trajectory in the P–Q plane' },
      x: { label: 'Q', unit: 'pu', range: [-1.2, 1.2] },
      y: { label: 'P', unit: 'pu', range: [-0.1, 1.2] },
      series: (lab) => {
        const circle: [number, number][] = Array.from({ length: 91 }, (_, j) => [VSC.Imax * Math.cos((j * Math.PI) / 90), VSC.Imax * Math.sin((j * Math.PI) / 90)]);
        const P = lab.run.s.P, Q = lab.run.s.Q;
        const traj: [number, number][] = [];
        for (let k = 0; k < P.length; k += 5) if (isFinite(P[k])) traj.push([Q[k], P[k]]);
        return [
          { label: { fr: 'limite de courant', en: 'current limit' }, color: '--warn', pts: circle, dash: true, width: 1.2 },
          { label: { fr: 'trajectoire', en: 'trajectory' }, color: '--c-p', pts: traj, width: 1.6 },
        ];
      },
      points: (lab) => (isFinite(lab.at('P')) ? [{ x: lab.at('Q'), y: lab.at('P'), color: '--accent' }] : []),
      note: () => ({
        fr: 'Découplage réussi : l’échelon de P monte à la verticale, celui de Q glisse à l’horizontale.',
        en: 'Decoupling works: the P step moves straight up, the Q step slides sideways.',
      }),
    },
  ],

  predict: {
    signal: 'P',
    yRange: () => [-0.2, 1.2],
    diagnose(pred, run) {
      const t1 = VSC.tP + 0.015;
      const truth = run.s.P[run.t.findIndex((t) => t >= t1)];
      const mine = pred.filter(([t]) => t >= t1 - 0.005 && t <= t1 + 0.005).map(([, y]) => y);
      if (mine.length && Math.max(...mine) > 0.7 * 0.8 && truth < 0.4 * 0.8)
        return {
          fr: 'L’onduleur ne suit pas la consigne instantanément : la puissance passe par la **boucle externe**, réglée volontairement lente (quelques hertz), puis par la **boucle de courant**, rapide. La montée prend quelques dizaines de millisecondes.',
          en: 'The inverter does not follow the setpoint instantly: power goes through the **outer loop**, deliberately slow (a few hertz), then the fast **current loop**. The rise takes a few tens of milliseconds.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'plant',
      title: { fr: 'Ce que commande le régulateur', en: 'What the controller controls' },
      tex: () => `L_f\\frac{d\\underline i}{dt} = \\underline e - \\underline v - (R_f + j\\omega L_f)\\,\\underline i \\quad (\\text{repère } dq)`,
      note: (c) =>
        c.tr({
          fr: 'Dans le repère tournant de la PLL (leçon 2.5), les grandeurs alternatives deviennent continues : un simple PI suffit pour chaque axe. Le terme $j\\omega L_f\\underline i$ couple les axes ; on le compense (découplage) et on ajoute la tension du réseau (anticipation).',
          en: 'In the PLL’s rotating frame (lesson 2.5), AC quantities become DC: a plain PI per axis is enough. The term $j\\omega L_f\\underline i$ couples the axes; it is compensated (decoupling), and the grid voltage is fed forward.',
        }),
    },
    {
      id: 'inner',
      title: { fr: 'Boucle de courant', en: 'Current loop' },
      tex: (c) => `K_p = \\omega_c L_f = ${c.q((2 * Math.PI * c.p.fc * VSC.Xf) / (2 * Math.PI * 50), '', 3)}\\ \\text{pu}, \\qquad \\frac{i_d}{i_d^*} \\approx \\frac{1}{1 + s/\\omega_c}`,
      note: (c) =>
        c.tr({
          fr: 'Avec ce gain, la boucle fermée est un premier ordre de bande passante $f_c$. Elle doit rester bien en dessous de la fréquence de découpage (MLI, leçon 6.3).',
          en: 'With this gain, the closed loop is first order with bandwidth $f_c$. It must stay well below the switching frequency (PWM, lesson 6.3).',
        }),
    },
    {
      id: 'outer',
      title: { fr: 'Boucles de puissance', en: 'Power loops' },
      tex: (c) => {
        const k = c.k as VscInfo;
        return `i_d^* = \\frac{P^*}{v_d}, \\quad i_q^* = -\\frac{Q^*}{v_d}, \\qquad t_{10\\text{–}90} = ${isNaN(k.riseP) ? '\\text{—}' : c.q(k.riseP * 1000, 'ms', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Dans le repère aligné sur la tension, $P = v_d i_d$ et $Q = -v_d i_q$ : la puissance active et la puissance réactive se règlent séparément.',
          en: 'In the voltage-aligned frame, $P = v_d i_d$ and $Q = -v_d i_q$: active and reactive power are set independently.',
        }),
    },
    {
      id: 'pll',
      title: { fr: 'La PLL', en: 'The PLL' },
      tex: () => `\\omega_{PLL} = \\omega_0 + K_p v_q + K_i\\!\\int v_q\\,dt, \\qquad K_p = 2\\zeta\\omega_n,\\ K_i = \\omega_n^2`,
      note: (c) =>
        c.tr({
          fr: 'La PLL de la leçon 3.4 fournit l’angle du repère. Mais elle mesure la tension au point de raccordement, que l’onduleur lui-même modifie : sur un réseau faible, la boucle se referme sur elle-même (leçon 8.5).',
          en: 'The PLL of lesson 3.4 provides the frame angle. But it measures the voltage at the PCC, which the inverter itself changes: on a weak grid the loop closes on itself (lesson 8.5).',
        }),
    },
    {
      id: 'limit',
      title: { fr: 'Limitation de courant', en: 'Current limiting' },
      tex: (c) => `\\sqrt{i_d^{*2} + i_q^{*2}} \\le I_{max} = ${c.q(VSC.Imax, 'pu', 3)} \\quad (\\text{priorité à } P)`,
      note: (c) =>
        c.tr({
          fr: 'Les semi-conducteurs ne supportent pas de surintensité : l’onduleur limite son courant à 1,1–1,2 pu, contre 5 à 7 pu pour un alternateur en court-circuit. D’où les défis des réseaux à forte part d’onduleurs (module 8).',
          en: 'Semiconductors cannot take overcurrent: the inverter limits its current to 1.1–1.2 pu, against 5–7 pu for a generator in a short circuit. Hence the challenges of grids with many inverters (Module 8).',
        }),
    },
    {
      id: 'scr',
      title: { fr: 'La force du réseau', en: 'Grid strength' },
      personas: ['research', 'utility'],
      tex: (c) => `X_g = 1/\\mathrm{SCR} = ${c.q(1 / c.p.SCR, 'pu', 3)}, \\qquad Q\\text{ pendant l’échelon de }P: ${c.q((c.k as VscInfo).couplingQ, 'pu', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Sur un réseau faible, la tension au point de raccordement varie avec le courant injecté : les boucles se couplent à travers le réseau, et la PLL rapide devient dangereuse.',
          en: 'On a weak grid, the PCC voltage varies with the injected current: the loops couple through the grid, and a fast PLL becomes dangerous.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance', en: 'Predict the power' },
      body: {
        fr: `À $t = 50$ ms, on demande à l’onduleur 0,8 pu de puissance active, puis 0,3 pu de réactif à 250 ms. **Dessinez la puissance active**, puis révélez.`,
        en: `At $t = 50$ ms the inverter is asked for 0.8 pu of active power, then 0.3 pu of reactive power at 250 ms. **Sketch the active power**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'outer',
      title: { fr: 'Accélérer la boucle externe', en: 'Speeding up the outer loop' },
      body: {
        fr: `Montez la bande passante des boucles de puissance pour que $P$ monte en moins de **20 ms**.`,
        en: `Raise the power-loop bandwidth so that $P$ rises in under **20 ms**.`,
      },
      check: (lab) => (lab.info as VscInfo).riseP < 0.02 && !(lab.info as VscInfo).unstable,
    },
    {
      id: 'inner',
      title: { fr: 'Une boucle de courant trop lente', en: 'A current loop that is too slow' },
      body: {
        fr: `Baissez la bande passante de courant sous **5 fois** celle des boucles externes. La séparation des échelles de temps n’est plus respectée : affichez $i_d$ et $i_d^*$, le courant traîne derrière sa référence.`,
        en: `Lower the current bandwidth below **5 times** the outer-loop bandwidth. Time-scale separation is lost: show $i_d$ and $i_d^*$, the current lags behind its reference.`,
      },
      check: (lab) => lab.params.fc < 5 * lab.params.fouter,
    },
    {
      id: 'decouple',
      title: { fr: 'Découplage', en: 'Decoupling' },
      body: {
        fr: `Revenez à une bonne séparation (courant ≥ 5 fois plus rapide). Dans le plan P–Q, l’échelon de P monte à la verticale sans toucher Q : moins de **0,05 pu** de réactif parasite.`,
        en: `Go back to good separation (current ≥ 5 times faster). In the P–Q plane the P step goes straight up without touching Q: less than **0.05 pu** of stray reactive power.`,
      },
      check: (lab) => !!lab.completed.inner && lab.params.fc >= 5 * lab.params.fouter && (lab.info as VscInfo).couplingQ < 0.05 && !(lab.info as VscInfo).unstable,
    },
    {
      id: 'limit',
      title: { fr: 'La limite de courant', en: 'The current limit' },
      body: {
        fr: `Demandez 1 pu de $P$ et au moins 0,7 pu de $Q$. L’onduleur atteint sa limite de courant : $P$ est servie en priorité, $Q$ reste sous sa consigne.`,
        en: `Ask for 1 pu of $P$ and at least 0.7 pu of $Q$. The inverter reaches its current limit: $P$ is served first, $Q$ stays below its setpoint.`,
      },
      check: (lab) => {
        const k = lab.info as VscInfo;
        return lab.params.Pset >= 0.99 && lab.params.Qset >= 0.7 && k.limited && k.Qend < lab.params.Qset - 0.05;
      },
    },
    {
      id: 'weak',
      title: { fr: 'Réseau faible, PLL rapide', en: 'Weak grid, fast PLL' },
      body: {
        fr: `Baissez le SCR sous **2** et accélérez la PLL au-delà de **80 Hz** : le système devient instable. C’est l’une des formes de stabilité « liée aux convertisseurs » du module 8.`,
        en: `Lower the SCR below **2** and speed the PLL beyond **80 Hz**: the system becomes unstable. This is one of the “converter-driven” stability forms of Module 8.`,
      },
      check: (lab) => lab.params.SCR < 2 && (lab.info as VscInfo).unstable,
    },
  ],
};
