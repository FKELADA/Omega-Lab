// Module 3.2 — Bode and Nyquist: stability margins of a feedback loop.

import SPlane from '../../lib/instruments/SPlane.svelte';
import type { Experiment } from '../../lib/lab/types';
import { feedbackLoop, loopInfo, type LoopInfo } from '../../lib/models/module3';
import BlockDiagram from './BlockDiagram.svelte';
import LoopBode from './LoopBode.svelte';
import Nyquist from './Nyquist.svelte';

const pole = (id: string, def: number) => ({
  id,
  symbol: `p_${id === 'a' ? 1 : id === 'b' ? 2 : 3}`,
  name: { fr: `Pôle ${id === 'a' ? 1 : id === 'b' ? 2 : 3} du procédé`, en: `Plant pole ${id === 'a' ? 1 : id === 'b' ? 2 : 3}` },
  unit: 'rad/s',
  min: 0.1,
  max: 1000,
  default: def,
  scale: 'log' as const,
});

export const loopLesson: Experiment = {
  id: 'loop',
  path: [
    { fr: 'Module 3 · Signaux et commande', en: 'Module 3 · Signals and control' },
    { fr: '3.2 Bode et Nyquist', en: '3.2 Bode and Nyquist' },
  ],
  title: { fr: 'Marges de stabilité d’une boucle fermée', en: 'Stability margins of a feedback loop' },
  model: feedbackLoop,
  info: loopInfo,
  canvas: BlockDiagram,
  instruments: [LoopBode, Nyquist, SPlane],
  locusParam: 'K',
  poleLabel: (_p, k: LoopInfo) =>
    k.stable ? { fr: 'boucle fermée stable', en: 'closed loop stable' } : { fr: 'boucle fermée instable', en: 'closed loop unstable' },

  params: [
    { id: 'K', symbol: 'K', name: { fr: 'Gain', en: 'Gain' }, unit: '', min: 0.1, max: 300, default: 10, scale: 'log', term: 'p' },
    pole('a', 1),
    pole('b', 10),
    pole('c', 100),
  ],

  signals: [
    { id: 'y', symbol: 'y', name: { fr: 'Sortie', en: 'Output' }, unit: '', color: '--c-p', on: true, term: 'p' },
    { id: 'r', symbol: 'r', name: { fr: 'Consigne', en: 'Reference' }, unit: '', color: '--c-S', on: true, term: 'S', dash: true },
    { id: 'e', symbol: 'e', name: { fr: 'Erreur', en: 'Error' }, unit: '', color: '--c-R', on: false, term: 'R' },
  ],

  predict: {
    signal: 'y',
    yRange: () => [-0.2, 1.8],
    diagnose(pred, run, p) {
      const end = pred.filter(([t]) => t > 0.8 * run.t[run.t.length - 1]).map(([, y]) => y);
      if (!end.length) return null;
      const mean = end.reduce((a, b) => a + b, 0) / end.length;
      const truth = p.K / (1 + p.K);
      if (Math.abs(mean - 1) < 0.03 && Math.abs(truth - 1) > 0.05)
        return {
          fr: `Sans intégrateur dans la boucle, la sortie ne rejoint **pas** la consigne : elle s’arrête à $K/(1+K) = ${truth.toFixed(3).replace('.', '{,}')}$. L’erreur statique vaut $1/(1+K)$.`,
          en: `With no integrator in the loop, the output does **not** reach the reference: it stops at $K/(1+K) = ${truth.toFixed(3)}$. The steady-state error is $1/(1+K)$.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'loop',
      title: { fr: 'Boucle ouverte et boucle fermée', en: 'Open and closed loop' },
      tex: (c) => `\\begin{aligned}
        L(s) &= \\frac{${c.term('p', 'K')}}{(1 + s/p_1)(1 + s/p_2)(1 + s/p_3)}, \\qquad T(s) = \\frac{L(s)}{1 + L(s)} \\\\
        e_\\infty &= \\frac{1}{1 + K} = ${c.q(100 * (c.k as LoopInfo).ess, '%', 3)}
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Augmenter $K$ réduit l’erreur statique… mais rapproche la boucle de l’instabilité. Tout le réglage d’un asservissement est ce compromis.',
          en: 'Raising $K$ shrinks the steady-state error… but pushes the loop towards instability. Every control design is this trade-off.',
        }),
    },
    {
      id: 'margins',
      title: { fr: 'Marges de stabilité', en: 'Stability margins' },
      tex: (c) => {
        const k = c.k as LoopInfo;
        return `\\begin{aligned}
          |L(j\\omega_c)| &= 1 \\;\\Rightarrow\\; \\omega_c = ${k.wc === null ? '-' : c.q(k.wc, 'rad/s')} \\\\
          \\mathrm{PM} &= 180^\\circ + \\angle L(j\\omega_c) = ${k.pm === null ? '\\infty' : c.q(k.pm, '°', 3)} \\\\[4pt]
          \\angle L(j\\omega_{180}) &= -180^\\circ \\;\\Rightarrow\\; \\omega_{180} = ${c.q(k.w180, 'rad/s')} \\\\
          \\mathrm{GM} &= \\frac{1}{|L(j\\omega_{180})|} = ${c.q(20 * Math.log10(k.gm), 'dB', 3)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La marge de gain dit de combien on peut multiplier $K$ avant l’instabilité ; la marge de phase, quel retard supplémentaire la boucle supporte.',
          en: 'The gain margin says how much $K$ can grow before instability; the phase margin, how much extra lag the loop can take.',
        }),
    },
    {
      id: 'nyquist',
      title: { fr: 'Critère de Nyquist', en: 'Nyquist criterion' },
      tex: () => `Z = N + P, \\qquad P = 0 \\;\\Rightarrow\\; \\text{stable} \\iff N = 0`,
      note: (c) =>
        c.tr({
          fr: '$N$ : nombre de tours de $L(j\\omega)$ autour de $-1$ ; $P$ : pôles instables de la boucle ouverte ; $Z$ : pôles instables de la boucle fermée. Les marges mesurent la distance entre la courbe et le point $-1$.',
          en: '$N$: encirclements of $-1$ by $L(j\\omega)$; $P$: unstable open-loop poles; $Z$: unstable closed-loop poles. The margins measure how far the curve stays from $-1$.',
        }),
    },
    {
      id: 'routh',
      title: { fr: 'Gain critique (Routh)', en: 'Critical gain (Routh)' },
      personas: ['research'],
      tex: (c) => {
        const k = c.k as LoopInfo;
        return `\\begin{aligned}
          &(s+p_1)(s+p_2)(s+p_3) + K p_1p_2p_3 = 0 \\\\
          &K_{c} = \\frac{(p_1+p_2+p_3)(p_1p_2+p_2p_3+p_3p_1)}{p_1p_2p_3} - 1 = ${c.q(k.kCrit, '', 4)}, \\qquad \\mathrm{GM} = \\frac{K_c}{K}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le même nombre, trouvé par l’algèbre (Routh), par la fréquence (Bode) et par la géométrie (lieu des racines). Les tests vérifient l’accord à $10^{-6}$ près.',
          en: 'The same number, found by algebra (Routh), by frequency (Bode) and by geometry (root locus). The tests check they agree to $10^{-6}$.',
        }),
    },
    {
      id: 'practice',
      title: { fr: 'En pratique', en: 'In practice' },
      personas: ['utility', 'research'],
      tex: () => `\\mathrm{PM} \\approx 30^\\circ - 60^\\circ, \\qquad \\mathrm{GM} \\geq 6\\ \\mathrm{dB}`,
      note: (c) =>
        c.tr({
          fr: 'Cibles usuelles pour les régulateurs de tension (AVR), les régulateurs de vitesse et les boucles de courant des onduleurs. Une marge de phase faible se voit sur le réseau comme une oscillation mal amortie.',
          en: 'Usual targets for voltage regulators (AVR), speed governors and inverter current loops. A small phase margin shows up on the grid as a poorly damped oscillation.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la réponse', en: 'Predict the response' },
      body: {
        fr: `Une consigne $r = 1$ est appliquée à $t = 0$ à la boucle fermée (gain $K = 10$). **Dessinez la sortie $y(t)$**, puis révélez.`,
        en: `A reference $r = 1$ is applied at $t = 0$ to the closed loop (gain $K = 10$). **Sketch the output $y(t)$**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'shrink',
      title: { fr: 'Les marges fondent', en: 'Margins shrink' },
      body: {
        fr: `Montez $K$ à **30** ou plus. Sur le Bode, la courbe de gain monte : la pulsation de coupure $\\omega_c$ se rapproche de $\\omega_{180}$, et les deux marges diminuent. La réponse oscille davantage.`,
        en: `Raise $K$ to **30** or more. On the Bode plot the gain curve rises: the crossover $\\omega_c$ moves towards $\\omega_{180}$, and both margins shrink. The response rings more.`,
      },
      check: (lab) => lab.params.K >= 30,
    },
    {
      id: 'edge',
      title: { fr: 'Passer le bord', en: 'Over the edge' },
      body: {
        fr: `Continuez jusqu’à l’**instabilité**. Les trois instruments le disent en même temps : marge de gain négative en dB, courbe de Nyquist qui entoure $-1$, pôles qui passent à droite de l’axe.`,
        en: `Keep going until the loop goes **unstable**. All three instruments say so at once: negative gain margin in dB, a Nyquist curve encircling $-1$, poles crossing to the right of the axis.`,
      },
      check: (lab) => !(lab.info as LoopInfo).stable,
    },
    {
      id: 'pm45',
      title: { fr: 'Régler à 45°', en: 'Tune for 45°' },
      body: {
        fr: `Réglez $K$ pour obtenir une marge de phase de **45°** : c’est un réglage classique, avec un dépassement d’environ 20 %.`,
        en: `Set $K$ for a **45°** phase margin: a classic tuning, with about 20 % overshoot.`,
      },
      check: (lab) => {
        const k = lab.info as LoopInfo;
        return k.stable && k.pm !== null && Math.abs(k.pm - 45) < 3;
      },
    },
    {
      id: 'tradeoff',
      title: { fr: 'Précision contre stabilité', en: 'Accuracy versus stability' },
      body: {
        fr: `Obtenez une erreur statique inférieure à **5 %** tout en restant stable. Il faut $K \\geq 19$, et la marge de phase en souffre.

Pour annuler l’erreur sans augmenter $K$, on ajoute un **intégrateur** : c’est le régulateur PI de la leçon 3.4.`,
        en: `Get a steady-state error below **5 %** while staying stable. It takes $K \\geq 19$, and the phase margin pays for it.

To remove the error without raising $K$, add an **integrator**: that is the PI controller of lesson 3.4.`,
      },
      check: (lab) => {
        const k = lab.info as LoopInfo;
        return k.stable && k.ess < 0.05;
      },
    },
  ],
};
