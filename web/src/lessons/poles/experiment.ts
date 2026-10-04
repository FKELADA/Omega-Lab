// Module 3.1 — Laplace, poles and zeros: shaping a response by placing poles.

import type { Experiment } from '../../lib/lab/types';
import { pzInfo, secondOrder, type PzInfo } from '../../lib/models/module3';
import { si } from '../../lib/ui/format';
import Metrics from './Metrics.svelte';
import PoleZero from './PoleZero.svelte';
import { SPEC } from './spec';

export const polesLesson: Experiment = {
  id: 'poles',
  path: [
    { fr: 'Module 3 · Signaux et commande', en: 'Module 3 · Signals and control' },
    { fr: '3.1 Laplace, pôles et zéros', en: '3.1 Laplace, poles and zeros' },
  ],
  title: { fr: 'Placer les pôles pour façonner une réponse', en: 'Placing poles to shape a response' },
  model: secondOrder,
  info: pzInfo,
  canvas: PoleZero,
  instruments: [Metrics],

  params: [
    { id: 'sigma', symbol: '\\sigma', name: { fr: 'Partie réelle des pôles', en: 'Real part of the poles' }, unit: '1/s', min: -40, max: 5, default: -2, scale: 'lin', term: 'R' },
    { id: 'wd', symbol: '\\omega_d', name: { fr: 'Partie imaginaire des pôles', en: 'Imaginary part of the poles' }, unit: 'rad/s', min: 0, max: 40, default: 10, scale: 'lin', term: 'L' },
    {
      id: 'hasZero',
      symbol: 'z',
      name: { fr: 'Zéro', en: 'Zero' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Sans zéro', en: 'No zero' } },
        { value: 1, label: { fr: 'Avec zéro', en: 'With zero' } },
      ],
    },
    { id: 'z', symbol: 'z', name: { fr: 'Position du zéro', en: 'Zero position' }, unit: '1/s', min: -40, max: 40, default: 5, scale: 'lin', term: 'C' },
  ],

  signals: [
    { id: 'y', symbol: 'y', name: { fr: 'Réponse indicielle', en: 'Step response' }, unit: '', color: '--c-p', on: true, term: 'p' },
    { id: 'u', symbol: 'u', name: { fr: 'Échelon', en: 'Step' }, unit: '', color: '--c-S', on: true, term: 'S', dash: true },
  ],

  predict: {
    signal: 'y',
    yRange: () => [-0.3, 2],
    diagnose(pred, run) {
      const peak = Math.max(...run.s.y);
      const predPeak = Math.max(...pred.map(([, y]) => y));
      if (peak > 1.3 && predPeak < 1.12)
        return {
          fr: 'Des pôles proches de l’axe imaginaire ($\\zeta \\approx 0{,}2$) donnent une réponse **peu amortie** : environ 50 % de dépassement, et une oscillation à $\\omega_d = 10$ rad/s.',
          en: 'Poles close to the imaginary axis ($\\zeta \\approx 0.2$) give a **lightly damped** response: about 50 % overshoot, and an oscillation at $\\omega_d = 10$ rad/s.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'tf',
      title: { fr: 'Fonction de transfert', en: 'Transfer function' },
      tex: (c) => {
        const k = c.k as PzInfo;
        const num = k.z === null ? '\\omega_n^2' : `\\omega_n^2\\left(1 - \\frac{s}{${c.term('C', 'z')}}\\right)`;
        return `\\begin{aligned}
          H(s) &= \\frac{${num}}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}, \\qquad H(0) = 1 \\\\
          p_{1,2} &= ${c.term('R', '\\sigma')} \\pm j\\,${c.term('L', '\\omega_d')} = ${c.term('R', c.q(c.p.sigma, ''))} \\pm j\\,${c.term('L', c.q(c.p.wd, ''))} \\\\
          \\omega_n &= |p| = ${c.q(k.wn, 'rad/s')}, \\qquad \\zeta = -\\frac{\\sigma}{\\omega_n} = ${c.q(k.zeta, '', 3)}${k.z === null ? '' : `, \\qquad ${c.term('C', 'z')} = ${c.q(k.z, '')}`}
        \\end{aligned}`;
      },
      derive: () => [
        '\\mathcal L\\{e^{pt}\\} = \\frac{1}{s - p}',
        'Y(s) = H(s)\\,\\frac1s = \\frac{1}{s} + \\frac{r_1}{s - p_1} + \\frac{r_2}{s - p_2}',
        'y(t) = 1 + r_1 e^{p_1 t} + r_2 e^{p_2 t}\\quad\\Rightarrow\\quad \\text{each pole is a mode } e^{pt} = e^{\\sigma t}e^{\\pm j\\omega_d t}',
      ],
      note: (c) =>
        c.tr({
          fr: 'La partie réelle $\\sigma$ fixe la **décroissance** ($e^{\\sigma t}$) ; la partie imaginaire $\\omega_d$ fixe la **fréquence d’oscillation**. Un pôle à droite ($\\sigma > 0$) croît sans limite.',
          en: 'The real part $\\sigma$ sets the **decay** ($e^{\\sigma t}$); the imaginary part $\\omega_d$ sets the **oscillation frequency**. A pole on the right ($\\sigma > 0$) grows without bound.',
        }),
    },
    {
      id: 'specs',
      title: { fr: 'Du plan s aux performances', en: 'From the s-plane to performance' },
      tex: (c) => {
        const k = c.k as PzInfo;
        return `\\begin{aligned}
          D\\% &= e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} = ${c.q(100 * k.osTheory, '%', 3)} \\\\
          t_{r,2\\%} &\\approx \\frac{4}{|\\sigma|} = ${k.stable ? c.q(k.tsTheory, 's') : '\\infty'}, \\qquad t_p = \\frac{\\pi}{\\omega_d} = ${isFinite(k.tpTheory) ? c.q(k.tpTheory, 's') : '\\infty'}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: `Dépassement ≤ ${SPEC.os * 100} % ⇔ $\\zeta \\geq ${SPEC.zetaMin.toFixed(2).replace('.', '{,}')}$ (un cône) ; réponse en ${si(SPEC.ts, 's')} ⇔ $\\sigma \\leq -${(4 / SPEC.ts).toFixed(1).replace('.', '{,}')}$ (une demi-droite). Leur intersection est la zone verte.`,
          en: `Overshoot ≤ ${SPEC.os * 100} % ⇔ $\\zeta \\geq ${SPEC.zetaMin.toFixed(2)}$ (a cone); settling in ${si(SPEC.ts, 's')} ⇔ $\\sigma \\leq -${(4 / SPEC.ts).toFixed(1)}$ (a half-plane). Their intersection is the green region.`,
        }),
    },
    {
      id: 'response',
      title: { fr: 'Réponse indicielle', en: 'Step response' },
      tex: (c) => `y(t) = 1 - e^{-\\zeta\\omega_n t}\\left(\\cos\\omega_d t + \\frac{\\zeta}{\\sqrt{1-\\zeta^2}}\\sin\\omega_d t\\right) \\quad (0 < \\zeta < 1,\\ \\text{${c.tr({ fr: 'sans zéro', en: 'no zero' })}})`,
      note: (c) =>
        c.tr({
          fr: 'Le solveur ne se sert pas de cette formule : il intègre exactement la représentation d’état. Les tests vérifient que les deux coïncident à $10^{-9}$ près.',
          en: 'The solver does not use this formula: it integrates the state-space form exactly. The tests check that both agree to $10^{-9}$.',
        }),
    },
    {
      id: 'nmp',
      title: { fr: 'Zéro à partie réelle positive', en: 'Right-half-plane zero' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as PzInfo;
        return `\\text{${c.tr({ fr: 'Contre-réaction initiale', en: 'Initial undershoot' })}} = ${c.q(100 * k.us, '%', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Un zéro dans le demi-plan droit fait partir la réponse **dans le mauvais sens** (système à non-minimum de phase). Exemples réels : la turbine hydraulique, dont la puissance baisse d’abord à l’ouverture de la vanne (module 4), et le hacheur élévateur (module 6).',
          en: 'A right-half-plane zero makes the response start **the wrong way** (a non-minimum-phase system). Real examples: the hydro turbine, whose power first dips when the gate opens (Module 4), and the boost converter (Module 6).',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la réponse', en: 'Predict the response' },
      body: {
        fr: `Les pôles sont en $-2 \\pm 10j$, tout près de l’axe imaginaire. **Dessinez la réponse indicielle $y(t)$** (elle doit finir à 1), puis révélez.`,
        en: `The poles sit at $-2 \\pm 10j$, close to the imaginary axis. **Sketch the step response $y(t)$** (it must end at 1), then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'drag',
      title: { fr: 'Déplacer les pôles', en: 'Moving the poles' },
      body: {
        fr: `**Faites glisser** un pôle sur le plan $s$ (ou cliquez n’importe où). Vers la gauche, la réponse s’amortit plus vite ; vers le haut, elle oscille plus vite. Passez-le à **droite** de l’axe : la réponse explose.`,
        en: `**Drag** a pole on the s-plane (or click anywhere). Further left, the response dies out faster; further up, it oscillates faster. Push it to the **right** of the axis: the response blows up.`,
      },
      check: (lab) => lab.params.sigma > 0,
    },
    {
      id: 'design',
      title: { fr: 'Concevoir', en: 'Design' },
      body: {
        fr: `Amenez les pôles dans la **zone verte** : dépassement ≤ 5 % **et** réponse en moins de 0,6 s. Le panneau Performances confirme sur la réponse simulée.

C’est la démarche inverse de l’analyse : on part du cahier des charges et on en déduit où doivent être les pôles.`,
        en: `Bring the poles into the **green region**: overshoot ≤ 5 % **and** settled within 0.6 s. The Performance panel confirms it on the simulated response.

This is analysis run backwards: start from the specification and work out where the poles must be.`,
      },
      check: (lab) => {
        const k = lab.info as PzInfo;
        return k.stable && k.os <= SPEC.os && k.ts <= SPEC.ts;
      },
    },
    {
      id: 'zero',
      title: { fr: 'Un zéro à droite', en: 'A zero on the right' },
      body: {
        fr: `Activez le **zéro** et placez-le à droite de l’axe ($z > 0$). La réponse commence par partir **à l’envers** avant de rejoindre 1. Obtenez au moins 10 % de contre-réaction initiale.`,
        en: `Turn on the **zero** and put it on the right of the axis ($z > 0$). The response first goes **the wrong way** before reaching 1. Get at least 10 % of initial undershoot.`,
      },
      check: (lab) => (lab.info as PzInfo).us >= 0.1,
    },
  ],
};
