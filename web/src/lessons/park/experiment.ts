// Module 2.5 — Clarke and Park: from three AC quantities to two DC ones.

import type { Experiment } from '../../lib/lab/types';
import { clarkePark, parkInfo, type ParkInfo } from '../../lib/models/module2b';
import FixedView from './FixedView.svelte';
import RotatingView from './RotatingView.svelte';

export const parkLesson: Experiment = {
  id: 'park',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.5 Clarke et Park', en: '2.5 Clarke and Park' },
  ],
  title: { fr: 'Le repère tournant : quand l’alternatif devient continu', en: 'The rotating frame: when AC becomes DC' },
  model: clarkePark,
  info: parkInfo,
  canvas: FixedView,
  instruments: [RotatingView],

  params: [
    { id: 'ratio', symbol: '\\omega_{dq}/\\omega', name: { fr: 'Vitesse du repère', en: 'Frame speed' }, unit: '', min: 0, max: 1.5, default: 1, scale: 'lin', term: 'n' },
    { id: 'phi', symbol: '\\varphi', name: { fr: 'Phase du système', en: 'Phase of the set' }, unit: '°', min: -180, max: 180, default: 30, scale: 'lin', term: 'a' },
    { id: 'kc', symbol: 'k_c', name: { fr: 'Amplitude relative phase C', en: 'Relative amplitude of phase C' }, unit: '', min: 0, max: 1.5, default: 1, scale: 'lin', term: 'c' },
    { id: 'h5', symbol: 'h_5', name: { fr: 'Harmonique 5', en: '5th harmonic' }, unit: '%', min: 0, max: 30, default: 0, scale: 'lin' },
    { id: 'V', symbol: 'V', name: { fr: 'Tension efficace', en: 'RMS voltage' }, unit: 'V', min: 100, max: 400, default: 230, scale: 'lin', term: 'S' },
    { id: 'f', symbol: 'f', name: { fr: 'Fréquence', en: 'Frequency' }, unit: 'Hz', min: 1, max: 60, default: 50, scale: 'lin' },
  ],

  signals: [
    { id: 'va', symbol: 'v_a', name: { fr: 'Phase a', en: 'Phase a' }, unit: 'V', color: '--c-a', on: true, term: 'a' },
    { id: 'vb', symbol: 'v_b', name: { fr: 'Phase b', en: 'Phase b' }, unit: 'V', color: '--c-b', on: true, term: 'b' },
    { id: 'vc', symbol: 'v_c', name: { fr: 'Phase c', en: 'Phase c' }, unit: 'V', color: '--c-c', on: true, term: 'c' },
    { id: 'valpha', symbol: 'v_\\alpha', name: { fr: 'Composante α', en: 'α component' }, unit: 'V', color: '--c-v1', on: false, dash: true },
    { id: 'vbeta', symbol: 'v_\\beta', name: { fr: 'Composante β', en: 'β component' }, unit: 'V', color: '--c-v2', on: false, dash: true },
    { id: 'vd', symbol: 'v_d', name: { fr: 'Axe d', en: 'd axis' }, unit: 'V', color: '--c-R', on: true, term: 'R' },
    { id: 'vq', symbol: 'v_q', name: { fr: 'Axe q', en: 'q axis' }, unit: 'V', color: '--c-C', on: true, term: 'C' },
  ],

  predict: {
    signal: 'vd',
    yRange: (p) => {
      const b = 1.4 * Math.SQRT2 * p.V;
      return [-b, b];
    },
    diagnose(pred, _run, p) {
      const ys = pred.map(([, y]) => y);
      if (Math.max(...ys) - Math.min(...ys) > 0.5 * Math.SQRT2 * p.V)
        return {
          fr: 'Le repère $dq$ tourne **exactement** avec le vecteur tension : vu de ce repère, le vecteur est **immobile**. $v_d$ et $v_q$ sont donc **constants**.',
          en: 'The $dq$ frame turns **exactly** with the voltage vector: seen from that frame, the vector **stands still**. So $v_d$ and $v_q$ are **constant**.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'clarke',
      title: { fr: 'Clarke : trois phases → deux axes fixes', en: 'Clarke: three phases → two fixed axes' },
      tex: (c) => `\\begin{aligned}
        \\begin{bmatrix} v_\\alpha \\\\ v_\\beta \\end{bmatrix} &= \\frac23\\begin{bmatrix} 1 & -\\tfrac12 & -\\tfrac12 \\\\ 0 & \\tfrac{\\sqrt3}{2} & -\\tfrac{\\sqrt3}{2} \\end{bmatrix}
        \\begin{bmatrix} ${c.term('a', 'v_a')} \\\\ ${c.term('b', 'v_b')} \\\\ ${c.term('c', 'v_c')} \\end{bmatrix} \\\\[4pt]
        \\underline v &= v_\\alpha + j v_\\beta = ${c.q(c.at('valpha'), 'V')} ${c.at('vbeta') < 0 ? '-' : '+'} j\\,${c.q(Math.abs(c.at('vbeta')), 'V')}
      \\end{aligned}`,
      note: (c) =>
        c.tr({
          fr: 'Les trois tensions sont les ombres d’un **seul** vecteur tournant sur les axes a, b, c (vue de gauche).',
          en: 'The three voltages are the shadows of **one** rotating vector on the a, b, c axes (left view).',
        }),
    },
    {
      id: 'park',
      title: { fr: 'Park : on tourne avec le vecteur', en: 'Park: turning with the vector' },
      tex: (c) => `\\begin{aligned}
        ${c.term('R', 'v_d')} + j\\,${c.term('C', 'v_q')} &= \\underline v\\,e^{-j\\theta_{dq}}, \\qquad \\theta_{dq} = \\omega_{dq}\\,t \\\\
        &= ${c.term('R', c.q(c.at('vd'), 'V'))} ${c.at('vq') < 0 ? '-' : '+'} j\\,${c.term('C', c.q(Math.abs(c.at('vq')), 'V'))}
      \\end{aligned}`,
      bars: (c) => ({
        scale: Math.SQRT2 * c.p.V,
        items: [
          { term: 'R', label: 'v_d', value: c.at('vd') },
          { term: 'C', label: 'v_q', value: c.at('vq') },
        ],
      }),
      note: (c) =>
        c.tr(
          Math.abs(c.p.ratio - 1) < 0.005
            ? {
                fr: 'Repère **synchrone** : un système équilibré devient deux grandeurs **continues**. On peut alors le réguler avec de simples correcteurs PI (module 7).',
                en: '**Synchronous** frame: a balanced set becomes two **DC** quantities, which simple PI controllers can regulate (Module 7).',
              }
            : {
                fr: 'Le repère ne tourne pas à la vitesse du vecteur : $v_d$ et $v_q$ oscillent à la fréquence de **glissement** $\\omega - \\omega_{dq}$.',
                en: 'The frame does not turn at the vector’s speed: $v_d$ and $v_q$ oscillate at the **slip** frequency $\\omega - \\omega_{dq}$.',
              },
        ),
    },
    {
      id: 'sequence',
      title: { fr: 'Ce que trahit une ondulation', en: 'What a ripple gives away' },
      tex: (c) => {
        const k = c.k as ParkInfo;
        return `\\begin{aligned}
          \\hat V_1 &= ${c.q(k.V1, 'V')} \\;\\to\\; \\text{${c.tr({ fr: 'continu', en: 'DC' })}}, \\qquad \\hat V_2 = ${c.q(k.V2, 'V')} \\;\\to\\; 2\\omega \\\\
          h_5 &= ${c.q(c.p.h5, '%')} \\;\\to\\; 6\\omega
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Dans le repère synchrone, la composante **inverse** (déséquilibre) tourne à $-2\\omega$ et l’harmonique 5, qui est inverse, à $-6\\omega$. Une ondulation de $v_d$ révèle donc exactement le défaut.',
          en: 'In the synchronous frame, the **negative** sequence (unbalance) spins at $-2\\omega$ and the 5th harmonic, itself negative-sequence, at $-6\\omega$. A ripple on $v_d$ points straight at the defect.',
        }),
    },
    {
      id: 'power',
      title: { fr: 'Puissance en dq', en: 'Power in dq' },
      personas: ['research', 'utility'],
      tex: () => `p = \\tfrac32\\left(v_d i_d + v_q i_q\\right), \\qquad q = \\tfrac32\\left(v_q i_d - v_d i_q\\right)`,
      note: (c) =>
        c.tr({
          fr: 'Le facteur $\\tfrac32$ vient de la convention « invariante en amplitude ». Avec $\\sqrt{2/3}$ (invariante en puissance), il disparaît. Vérifiez toujours la convention d’un modèle : c’est une source d’erreurs classique.',
          en: 'The $\\tfrac32$ comes from the amplitude-invariant convention; with $\\sqrt{2/3}$ (power-invariant) it disappears. Always check a model’s convention: it is a classic source of mistakes.',
        }),
    },
    {
      id: 'machines',
      title: { fr: 'Pourquoi tout le monde l’utilise', en: 'Why everyone uses it' },
      personas: ['research'],
      tex: () => `\\frac{d}{dt}\\underline\\psi_{dq} = \\underline v_{dq} - R\\,\\underline i_{dq} - j\\,\\omega_{dq}\\,\\underline\\psi_{dq}`,
      note: (c) =>
        c.tr({
          fr: 'Dans le repère tournant, les inductances d’une machine ne dépendent plus de l’angle du rotor. Le terme $j\\omega\\psi$ est le **couplage croisé** entre les axes d et q. Les modèles de G2ELin (machine synchrone, onduleurs GFM et GFL) sont tous écrits ainsi.',
          en: 'In the rotating frame, a machine’s inductances no longer depend on rotor angle. The $j\\omega\\psi$ term is the **cross-coupling** between the d and q axes. G2ELin’s models (synchronous machine, GFM and GFL inverters) are all written this way.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire v_d', en: 'Predict v_d' },
      body: {
        fr: `Trois tensions sinusoïdales équilibrées (à gauche) sont vues depuis un repère $dq$ qui tourne **à la même vitesse** qu’elles.

**Dessinez $v_d(t)$**, puis révélez.`,
        en: `Three balanced sinusoidal voltages (left) are seen from a $dq$ frame turning **at the same speed** as they do.

**Sketch $v_d(t)$**, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'fixed',
      title: { fr: 'Repère fixe', en: 'Fixed frame' },
      body: {
        fr: `Mettez la vitesse du repère à **0** : $d$ et $q$ se confondent avec $\\alpha$ et $\\beta$, et redeviennent sinusoïdales. Lancez ▶ : à gauche, les ombres du vecteur sur a, b et c reproduisent les trois phases.`,
        en: `Set the frame speed to **0**: $d$ and $q$ coincide with $\\alpha$ and $\\beta$ and become sinusoidal again. Press ▶: on the left, the vector’s shadows on a, b and c reproduce the three phases.`,
      },
      check: (lab) => lab.params.ratio < 0.01,
    },
    {
      id: 'align',
      title: { fr: 'Aligner l’axe d', en: 'Aligning the d axis' },
      body: {
        fr: `Revenez à une vitesse de **1** et réglez $\\varphi$ pour que $v_q = 0$ : l’axe $d$ pointe alors exactement sur le vecteur tension.

C’est ce que fait en permanence la **PLL** d’un onduleur : elle cherche l’angle qui annule $v_q$.`,
        en: `Go back to a speed of **1** and set $\\varphi$ so that $v_q = 0$: the $d$ axis then points exactly at the voltage vector.

This is what an inverter’s **PLL** does all the time: it looks for the angle that cancels $v_q$.`,
      },
      check: (lab) => Math.abs(lab.params.ratio - 1) < 0.01 && Math.abs(lab.params.phi) < 2,
    },
    {
      id: 'unbalance',
      title: { fr: 'Un déséquilibre', en: 'An unbalance' },
      body: {
        fr: `Réduisez $k_c$ à **0,6** ou moins (creux de tension sur la phase c). La trajectoire devient une **ellipse**, et $v_d$, $v_q$ ondulent à **$2f$** : c’est la composante inverse (leçon 2.8).`,
        en: `Lower $k_c$ to **0.6** or less (a voltage dip on phase c). The trajectory becomes an **ellipse**, and $v_d$, $v_q$ ripple at **$2f$**: that is the negative sequence (lesson 2.8).`,
      },
      check: (lab) => lab.params.kc <= 0.61,
    },
    {
      id: 'harmonic',
      title: { fr: 'Un harmonique', en: 'A harmonic' },
      body: {
        fr: `Remettez $k_c = 1$ et ajoutez **10 %** d’harmonique 5. La trajectoire prend une forme d’**hexagone arrondi**, et $v_d$ ondule à **$6f$** (300 Hz).`,
        en: `Set $k_c$ back to 1 and add **10 %** of 5th harmonic. The trajectory turns into a **rounded hexagon**, and $v_d$ ripples at **$6f$** (300 Hz).`,
      },
      check: (lab) => lab.params.h5 >= 10 && Math.abs(lab.params.kc - 1) < 0.02,
    },
  ],
};
