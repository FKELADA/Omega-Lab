// Module 3.4 — PI control and the phase-locked loop.

import SPlane from '../../lib/instruments/SPlane.svelte';
import type { Experiment } from '../../lib/lab/types';
import { pll, pllInfo, type PllInfo } from '../../lib/models/module3';
import PhaseTracker from './PhaseTracker.svelte';
import PllDiagram from './PllDiagram.svelte';

const onOff = (on: string, off: string, onEn: string, offEn: string) => [
  { value: 1, label: { fr: on, en: onEn } },
  { value: 0, label: { fr: off, en: offEn } },
];

export const pllLesson: Experiment = {
  id: 'pll',
  path: [
    { fr: 'Module 3 · Signaux et commande', en: 'Module 3 · Signals and control' },
    { fr: '3.4 Régulateur PI et PLL', en: '3.4 PI control and the PLL' },
  ],
  title: { fr: 'La PLL : un régulateur PI qui suit la phase du réseau', en: 'The PLL: a PI controller that tracks the grid phase' },
  model: pll,
  info: pllInfo,
  canvas: PllDiagram,
  instruments: [PhaseTracker, SPlane],
  locusParam: 'zeta',
  poleLabel: (p, k: PllInfo) => ({
    fr: `bande passante ${p.fn} Hz, ${p.type === 1 ? 'PI' : 'P'} · ωn = ${k.wn.toFixed(0)} rad/s`,
    en: `bandwidth ${p.fn} Hz, ${p.type === 1 ? 'PI' : 'P'} · ωn = ${k.wn.toFixed(0)} rad/s`,
  }),

  params: [
    { id: 'dphi', symbol: '\\Delta\\varphi', name: { fr: 'Saut de phase (t = 50 ms)', en: 'Phase jump (t = 50 ms)' }, unit: '°', min: -90, max: 90, default: 30, scale: 'lin', term: 'S' },
    { id: 'df', symbol: '\\Delta f', name: { fr: 'Échelon de fréquence (t = 250 ms)', en: 'Frequency step (t = 250 ms)' }, unit: 'Hz', min: -2, max: 2, default: 0, scale: 'lin', term: 'S' },
    { id: 'fn', symbol: 'f_n', name: { fr: 'Bande passante', en: 'Bandwidth' }, unit: 'Hz', min: 2, max: 100, default: 20, scale: 'log', term: 'p' },
    { id: 'zeta', symbol: '\\zeta', name: { fr: 'Amortissement', en: 'Damping' }, unit: '', min: 0.2, max: 2, default: 0.7, scale: 'lin', term: 'R' },
    { id: 'type', symbol: 'C', name: { fr: 'Correcteur', en: 'Controller' }, unit: '', min: 0, max: 1, default: 1, scale: 'lin', choices: onOff('PI', 'P seul', 'PI', 'P only') },
    { id: 'lim', symbol: '\\Delta f_{max}', name: { fr: 'Limite de fréquence', en: 'Frequency limit' }, unit: 'Hz', min: 1, max: 50, default: 50, scale: 'log', term: 'C' },
    { id: 'antiwindup', symbol: 'AW', name: { fr: 'Anti-emballement', en: 'Anti-windup' }, unit: '', min: 0, max: 1, default: 1, scale: 'lin', choices: onOff('Anti-emballement', 'Sans', 'Anti-windup', 'None') },
  ],

  signals: [
    { id: 'fhat', symbol: '\\hat f - f_0', name: { fr: 'Fréquence estimée', en: 'Estimated frequency' }, unit: 'Hz', color: '--c-p', on: true, term: 'p' },
    { id: 'fg', symbol: 'f_g - f_0', name: { fr: 'Fréquence du réseau', en: 'Grid frequency' }, unit: 'Hz', color: '--c-S', on: true, term: 'S', dash: true },
    { id: 'err', symbol: '\\varepsilon', name: { fr: 'Erreur de phase', en: 'Phase error' }, unit: '°', color: '--c-R', on: true, term: 'R' },
    { id: 'vq', symbol: 'v_q', name: { fr: 'Tension en quadrature', en: 'Quadrature voltage' }, unit: 'pu', color: '--c-C', on: false, term: 'C' },
  ],

  predict: {
    signal: 'fhat',
    yRange: (p) => {
      const run = pll.simulate(p, 0.5, 600);
      const m = Math.max(1, ...run.s.fhat.map(Math.abs));
      return [-1.3 * m, 1.3 * m];
    },
    diagnose(pred, run) {
      const truth = Math.max(...run.s.fhat) - Math.min(...run.s.fhat);
      const ys = pred.map(([, y]) => y);
      if (Math.max(...ys) - Math.min(...ys) < 0.2 * truth)
        return {
          fr: 'Le réseau n’a pas changé de fréquence… mais la PLL ne voit qu’une phase qui bouge. Pour rattraper un saut de phase, elle doit **accélérer** un instant : sa fréquence estimée fait un pic de plusieurs hertz.',
          en: 'The grid frequency has not changed… but the PLL only sees a phase that moves. To catch up with a phase jump it must **speed up** for a moment: its frequency estimate spikes by several hertz.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'detector',
      title: { fr: 'Le détecteur de phase', en: 'The phase detector' },
      tex: (c) => `\\begin{aligned}
        ${c.term('C', 'v_q')} &= V\\sin(\\theta_g - \\hat\\theta) \\approx V\\,\\varepsilon \\qquad (\\varepsilon \\text{ ${c.tr({ fr: 'petit', en: 'small' })}}) \\\\
        ${c.term('C', c.q(c.at('vq'), '', 3))} &= \\sin(${c.term('R', c.q(c.at('err'), '°', 3))})
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'La transformation de Park (leçon 2.5), calculée avec l’angle **estimé**, donne $v_q$ : il est nul seulement quand l’axe $d$ pointe exactement sur la tension. C’est le capteur d’erreur de la boucle. La linéarisation $\\sin\\varepsilon \\approx \\varepsilon$ vient de la leçon 3.3.',
          en: 'The Park transform (lesson 2.5), computed with the **estimated** angle, gives $v_q$: it is zero only when the $d$ axis points exactly at the voltage. That is the loop’s error sensor. The linearisation $\\sin\\varepsilon \\approx \\varepsilon$ is from lesson 3.3.',
        }),
    },
    {
      id: 'pi',
      title: { fr: 'Le régulateur PI', en: 'The PI controller' },
      tex: (c) => {
        const k = c.k as PllInfo;
        return `\\begin{aligned}
          \\Delta\\hat\\omega &= K_p\\,v_q + K_i\\int v_q\\,dt, \\qquad \\hat\\theta = \\int(\\omega_0 + \\Delta\\hat\\omega)\\,dt \\\\
          \\omega_n &= 2\\pi f_n = ${c.q(k.wn, 'rad/s')} \\\\
          K_p &= \\frac{2\\zeta\\omega_n}{V} = ${c.q(k.Kp, '', 3)}, \\qquad K_i = \\frac{\\omega_n^2}{V} = ${c.q(k.Ki, '', 4)}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le terme proportionnel réagit vite ; le terme intégral garde en mémoire l’écart de fréquence, pour que l’erreur finisse par s’annuler.',
          en: 'The proportional term reacts fast; the integral term remembers the frequency offset, so the error ends up at zero.',
        }),
    },
    {
      id: 'closed',
      title: { fr: 'Boucle fermée', en: 'Closed loop' },
      tex: () => `\\frac{\\hat\\Theta(s)}{\\Theta_g(s)} = \\frac{2\\zeta\\omega_n s + \\omega_n^2}{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}`,
      note: (c) =>
        c.tr({
          fr: 'Le même deuxième ordre que la leçon 3.1, avec un zéro dans le demi-plan gauche : $\\omega_n$ règle la rapidité, $\\zeta$ l’amortissement. Une PLL plus rapide suit mieux, mais transmet davantage le bruit et les harmoniques.',
          en: 'The same second-order system as lesson 3.1, with a left-half-plane zero: $\\omega_n$ sets the speed, $\\zeta$ the damping. A faster PLL tracks better, but lets more noise and harmonics through.',
        }),
    },
    {
      id: 'ss',
      title: { fr: 'Erreurs en régime permanent', en: 'Steady-state errors' },
      tex: (c) => {
        const k = c.k as PllInfo;
        return `\\begin{aligned}
          \\text{${c.tr({ fr: 'saut de phase', en: 'phase jump' })}} &\\to \\varepsilon_\\infty = 0 \\\\
          \\text{${c.tr({ fr: 'échelon de fréquence', en: 'frequency step' })}} &\\to \\varepsilon_\\infty = ${c.p.type === 1 ? '0\\ \\text{(PI)}' : `\\frac{\\Delta\\omega}{K_p V} = ${c.q(k.essFreq, '°', 3)}\\ \\text{(P)}`}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Avec le seul terme P, la boucle compte **un** intégrateur (celui qui donne $\\hat\\theta$) : il reste une erreur de phase après un changement de fréquence. Le PI en ajoute un **second** et l’annule.',
          en: 'With P only, the loop has **one** integrator (the one giving $\\hat\\theta$): a phase error remains after a frequency change. The PI adds a **second** one and removes it.',
        }),
    },
    {
      id: 'windup',
      title: { fr: 'Emballement de l’intégrateur', en: 'Integrator windup' },
      personas: ['research', 'utility'],
      tex: (c) => `\\frac{dx_I}{dt} = \\begin{cases} 0 & \\text{${c.tr({ fr: 'en butée, erreur de même signe', en: 'saturated, error of the same sign' })}} \\\\ K_i\\,v_q & \\text{${c.tr({ fr: 'sinon', en: 'otherwise' })}} \\end{cases}`,
      note: (c) =>
        c.tr({
          fr: 'Quand la sortie bute sur sa limite, l’intégrateur continue d’accumuler une erreur qu’il ne peut plus corriger. Au retour, il dépasse largement. L’intégration conditionnelle l’en empêche.',
          en: 'When the output hits its limit, the integrator keeps accumulating an error it can no longer act on. On the way back it overshoots badly. Conditional integration prevents this.',
        }),
    },
    {
      id: 'bluecut',
      title: { fr: 'Retour d’expérience', en: 'Lessons from the field' },
      personas: ['utility', 'research'],
      tex: () => `\\Delta\\varphi \\text{ (fault)} \\;\\Rightarrow\\; \\hat f \\text{ spike} \\;\\Rightarrow\\; \\text{trip on } f > f_{max}`,
      note: (c) =>
        c.tr({
          fr: 'Incendie de Blue Cut (Californie, 2016) : environ 1,2 GW de production photovoltaïque s’est déconnectée, en grande partie parce que des onduleurs ont mal mesuré la fréquence pendant les sauts de phase provoqués par les défauts (rapport NERC). Le réglage des PLL est aujourd’hui encadré par les codes de réseau.',
          en: 'Blue Cut fire (California, 2016): about 1.2 GW of solar generation disconnected, much of it because inverters mis-measured frequency during fault-induced phase jumps (NERC report). PLL tuning is now covered by grid codes.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la fréquence estimée', en: 'Predict the estimated frequency' },
      body: {
        fr: `À $t = 50$ ms, un défaut lointain fait **sauter la phase** du réseau de 30°. La fréquence du réseau, elle, ne change pas. **Dessinez la fréquence estimée par la PLL**, $\\hat f - f_0$, puis révélez.`,
        en: `At $t = 50$ ms a distant fault makes the grid **phase jump** by 30°. The grid frequency itself does not change. **Sketch the PLL’s frequency estimate** $\\hat f - f_0$, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'fast',
      title: { fr: 'Une PLL plus rapide', en: 'A faster PLL' },
      body: {
        fr: `Montez la bande passante à **50 Hz** ou plus. L’erreur se résorbe plus vite… mais le pic de fréquence est bien plus haut. Rapidité et robustesse s’opposent, comme en 3.2.`,
        en: `Raise the bandwidth to **50 Hz** or more. The error disappears faster… but the frequency spike is much higher. Speed and robustness pull in opposite directions, as in 3.2.`,
      },
      check: (lab) => lab.params.fn >= 49,
    },
    {
      id: 'freq',
      title: { fr: 'Suivre une variation de fréquence', en: 'Tracking a frequency change' },
      body: {
        fr: `Remettez $f_n$ vers 20 Hz et appliquez un **échelon de fréquence de +1 Hz** ou plus. Avec le PI, l’erreur de phase revient à **zéro** : l’intégrateur a « appris » le nouvel écart.`,
        en: `Bring $f_n$ back towards 20 Hz and apply a **frequency step of +1 Hz** or more. With the PI, the phase error returns to **zero**: the integrator has “learnt” the new offset.`,
      },
      check: (lab) => lab.params.df >= 0.95 && lab.params.type === 1 && lab.params.fn < 49,
    },
    {
      id: 'ponly',
      title: { fr: 'Sans terme intégral', en: 'Without the integral term' },
      body: {
        fr: `Passez en **P seul**. Après l’échelon de fréquence, une **erreur de phase permanente** subsiste, égale à $\\Delta\\omega/K_p$. Elle est indiquée dans les équations.`,
        en: `Switch to **P only**. After the frequency step, a **permanent phase error** remains, equal to $\\Delta\\omega/K_p$. It is shown in the equations.`,
      },
      check: (lab) => lab.params.type === 0 && Math.abs(lab.params.df) >= 0.95,
    },
    {
      id: 'windup',
      title: { fr: 'Emballement', en: 'Windup' },
      body: {
        fr: `Repassez en PI, mettez un saut de phase d’au moins **60°**, limitez la fréquence à **3 Hz** au plus, et **désactivez l’anti-emballement**. L’intégrateur se charge pendant que la sortie est bloquée : l’erreur met longtemps à revenir et dépasse fortement.`,
        en: `Switch back to PI, set a phase jump of at least **60°**, limit the frequency to **3 Hz** or less, and **turn anti-windup off**. The integrator charges up while the output is pinned: the error takes a long time to recover and overshoots badly.`,
      },
      check: (lab) => lab.params.type === 1 && Math.abs(lab.params.dphi) >= 60 && lab.params.lim <= 3 && lab.params.antiwindup === 0,
    },
    {
      id: 'antiwindup',
      title: { fr: 'Anti-emballement', en: 'Anti-windup' },
      body: {
        fr: `Réactivez l’**anti-emballement** avec les mêmes réglages : l’intégrateur s’arrête tant que la sortie est en butée, et la PLL se recale bien plus proprement. Comparez avec **Figer et comparer**.`,
        en: `Turn **anti-windup** back on with the same settings: the integrator pauses while the output is pinned, and the PLL relocks much more cleanly. Compare with **Freeze & compare**.`,
      },
      check: (lab) =>
        !!lab.completed.windup && lab.params.antiwindup === 1 && Math.abs(lab.params.dphi) >= 60 && lab.params.lim <= 3,
    },
  ],
};
