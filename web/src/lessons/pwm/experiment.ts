// Module 6.3 — Pulse-width modulation: carrier against reference, the
// harmonic spectrum, overmodulation, third-harmonic injection and SVPWM.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { pwm, PWM, pwmGainCurve, pwmInfo, PWM_METHODS, type PwmInfo } from '../../lib/models/module6';
import PwmCanvas from './PwmCanvas.svelte';
import SvHexagon from './SvHexagon.svelte';

const gainCache = new Map<string, [number, number][]>();
const gain = (method: number, mf: number) => {
  const key = `${method}|${mf}`;
  if (!gainCache.has(key)) gainCache.set(key, pwmGainCurve(method, mf));
  return gainCache.get(key)!;
};

export const pwmLesson: Experiment = {
  id: 'pwm',
  path: [
    { fr: 'Module 6 · Électronique de puissance', en: 'Module 6 · Power electronics' },
    { fr: '6.3 MLI', en: '6.3 PWM' },
  ],
  title: { fr: 'La modulation de largeur d’impulsion : une sinusoïde faite de créneaux', en: 'Pulse-width modulation: a sine wave made of pulses' },
  model: pwm,
  info: pwmInfo,
  canvas: PwmCanvas,
  instruments: [SvHexagon, Chart0, Chart1],

  params: [
    { id: 'm', symbol: 'm', name: { fr: 'Indice de modulation', en: 'Modulation index' }, unit: '', min: 0, max: 1.4, default: 0.8, scale: 'lin', term: 'S' },
    { id: 'mf', symbol: 'm_f', name: { fr: 'Rapport porteuse / fondamental', en: 'Carrier / fundamental ratio' }, unit: '', min: 3, max: 45, default: 15, scale: 'lin', step: 1, term: 'p' },
    {
      id: 'method',
      symbol: '\\text{MLI}',
      name: { fr: 'Méthode', en: 'Method' },
      unit: '',
      min: 0,
      max: 2,
      default: PWM_METHODS.sine,
      scale: 'lin',
      choices: [
        { value: PWM_METHODS.sine, label: { fr: 'Sinus', en: 'Sine' } },
        { value: PWM_METHODS.third, label: { fr: 'Sinus + 3ᵉ harmonique', en: 'Sine + 3rd harmonic' } },
        { value: PWM_METHODS.sv, label: { fr: 'Vectorielle (SVPWM)', en: 'Space vector (SVPWM)' } },
      ],
    },
  ],

  signals: [
    { id: 'ref', symbol: 'v_{ref}', name: { fr: 'Référence (phase a)', en: 'Reference (phase a)' }, unit: '', color: '--c-a', on: true, term: 'a' },
    { id: 'car', symbol: 'c', name: { fr: 'Porteuse triangulaire', en: 'Triangular carrier' }, unit: '', color: '--muted', on: true, dash: true },
    { id: 'vaN', symbol: 'v_{aN}', name: { fr: 'Tension du bras a', en: 'Leg a voltage' }, unit: 'V', color: '--c-i', on: true, term: 'i' },
    { id: 'vab', symbol: 'v_{ab}', name: { fr: 'Tension composée', en: 'Line-to-line voltage' }, unit: 'V', color: '--c-C', on: false, term: 'C' },
    { id: 'v1', symbol: 'v_{ab,1}', name: { fr: 'Son fondamental', en: 'Its fundamental' }, unit: 'V', color: '--c-p', on: false, term: 'p' },
  ],

  charts: [
    {
      title: { fr: 'Spectre de la tension composée', en: 'Line-voltage spectrum' },
      x: { label: 'h', range: [0, 100] },
      y: { label: 'Vh/V1', unit: '%', range: [0, 80] },
      series: (lab) => {
        const k = lab.info as PwmInfo;
        const bars: [number, number][] = [[0, 0], [1, 0], [1, 100], [1, 0]];
        for (const [h, pct] of k.spectrum) if (h <= 100 && pct > 0.3) bars.push([h, 0], [h, pct], [h, 0]);
        bars.push([100, 0]);
        return [{ color: '--c-C', pts: bars, width: 2 }];
      },
      vlines: (lab) => [{ x: lab.params.mf, label: 'mf' }, { x: 2 * lab.params.mf, label: '2mf' }],
      note: (lab) => {
        const k = lab.info as PwmInfo;
        const low = k.spectrum.filter(([h]) => h < lab.params.mf - 4).reduce((s, [, p]) => Math.max(s, p), 0);
        return {
          fr: `Les harmoniques sont regroupés autour de mf et 2mf, loin du fondamental : un filtre les arrête facilement. ${low > 1 ? `Basses fréquences présentes (jusqu’à ${low.toFixed(1)} %) : surmodulation.` : 'Aucun harmonique basse fréquence.'}`,
          en: `Harmonics cluster around mf and 2mf, far from the fundamental: a filter stops them easily. ${low > 1 ? `Low-order harmonics present (up to ${low.toFixed(1)} %): overmodulation.` : 'No low-order harmonics.'}`,
        };
      },
    },
    {
      title: { fr: 'Fondamental obtenu selon m', en: 'Fundamental obtained versus m' },
      x: { label: 'm', range: [0, 2] },
      y: { label: 'V1ab/Vdc', range: [0, 1.15] },
      series: (lab) => [
        { label: { fr: 'sinus', en: 'sine' }, color: '--c-a', pts: gain(PWM_METHODS.sine, lab.params.mf) },
        { label: { fr: 'avec 3ᵉ harmonique / SVPWM', en: 'with 3rd harmonic / SVPWM' }, color: '--c-p', pts: gain(PWM_METHODS.sv, lab.params.mf) },
        { label: { fr: 'pleine onde : 2√3/π', en: 'six-step: 2√3/π' }, color: '--muted', pts: [[0, 1.1027], [2, 1.1027]], dash: true, width: 1 },
      ],
      points: (lab) => [{ x: lab.params.m, y: (lab.info as PwmInfo).V1ab / PWM.Vdc, color: '--accent' }],
      vlines: () => [{ x: 1, label: '1' }, { x: 2 / Math.sqrt(3), label: '1,15' }],
      note: () => ({
        fr: 'Zone linéaire : jusqu’à m = 1 en sinus, m = 1,15 avec injection d’homopolaire. Au-delà, le gain s’infléchit et la tension se déforme.',
        en: 'Linear range: up to m = 1 with sine, m = 1.15 with zero-sequence injection. Beyond that the gain bends and the voltage distorts.',
      }),
    },
  ],

  predict: {
    signal: 'vaN',
    yRange: () => [-450, 450],
    diagnose(pred) {
      const mid = pred.filter(([, y]) => Math.abs(y) < 0.6 * (PWM.Vdc / 2)).length;
      if (pred.length > 10 && mid > 0.4 * pred.length)
        return {
          fr: 'Un bras d’onduleur n’a que **deux états** : $+V_{dc}/2$ ou $-V_{dc}/2$. Il ne sait pas fabriquer une tension intermédiaire. La sinusoïde n’existe qu’**en moyenne** : la largeur des impulsions suit la référence.',
          en: 'An inverter leg has only **two states**: $+V_{dc}/2$ or $-V_{dc}/2$. It cannot produce an intermediate voltage. The sine wave exists only **on average**: the pulse width follows the reference.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'compare',
      title: { fr: 'Comparer pour commander', en: 'Comparing to switch' },
      tex: () => `s_a = \\begin{cases} 1 & v_{ref} \\ge c \\\\ 0 & v_{ref} < c \\end{cases}, \\qquad v_{aN} = (2s_a - 1)\\frac{V_{dc}}{2}`,
      note: (c) =>
        c.tr({
          fr: 'À chaque période de porteuse, la valeur moyenne de $v_{aN}$ égale $v_{ref}\\,V_{dc}/2$ : la modulation reproduit la référence en moyenne glissante.',
          en: 'Over each carrier period, the average of $v_{aN}$ equals $v_{ref}\\,V_{dc}/2$: the modulation reproduces the reference as a moving average.',
        }),
    },
    {
      id: 'gain',
      title: { fr: 'Le fondamental', en: 'The fundamental' },
      tex: (c) => {
        const k = c.k as PwmInfo;
        return `\\hat V_{ab,1} = m\\,\\frac{\\sqrt3}{2}V_{dc} = ${c.q(k.V1ideal, 'V', 3)}, \\qquad \\text{obtenu : } ${c.q(k.V1ab, 'V', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Égalité tant que la référence reste dans la porteuse ($m \\le 1$). Au-delà, des créneaux disparaissent : le fondamental croît moins vite et des harmoniques 5, 7… apparaissent.',
          en: 'Equal as long as the reference stays inside the carrier ($m \\le 1$). Beyond that, pulses vanish: the fundamental grows more slowly and harmonics 5, 7… appear.',
        }),
    },
    {
      id: 'third',
      title: { fr: 'Injecter une composante homopolaire', en: 'Injecting a zero-sequence component' },
      tex: () => `v_{ref,x} = m\\sin(\\theta_x) + v_0, \\qquad v_0 = \\tfrac{m}{6}\\sin 3\\theta \\ \\text{ou}\\ -\\tfrac{\\max + \\min}{2}`,
      note: (c) =>
        c.tr({
          fr: 'Ajouter la même tension aux trois phases ne change pas les tensions composées, mais aplatit le sommet des références : on gagne 15 % de tension ($2/\\sqrt3$) avec le même bus continu. L’injection min–max est équivalente à la MLI vectorielle.',
          en: 'Adding the same voltage to all three phases leaves the line voltages unchanged but flattens the top of the references: 15 % more voltage ($2/\\sqrt3$) from the same DC link. Min–max injection is equivalent to space-vector PWM.',
        }),
    },
    {
      id: 'sv',
      title: { fr: 'La MLI vectorielle', en: 'Space-vector PWM' },
      tex: () => `\\vec v_{ref}\\,T_s = d_1 \\vec V_k T_s + d_2 \\vec V_{k+1} T_s + d_0 \\vec V_0 T_s, \\qquad |\\vec v_{ref}| \\le \\frac{V_{dc}}{\\sqrt3}`,
      note: (c) =>
        c.tr({
          fr: 'Les huit combinaisons des trois bras donnent six vecteurs actifs et deux vecteurs nuls. On synthétise la référence en moyenne avec les deux vecteurs voisins et un vecteur nul. Le cercle inscrit dans l’hexagone est la limite linéaire.',
          en: 'The eight combinations of the three legs give six active vectors and two zero vectors. The reference is synthesised on average from the two neighbouring vectors and a zero vector. The circle inscribed in the hexagon is the linear limit.',
        }),
    },
    {
      id: 'thd',
      title: { fr: 'Distorsion et filtrage', en: 'Distortion and filtering' },
      personas: ['research', 'utility'],
      tex: (c) => `\\mathrm{DHT}(v_{ab}) = ${c.q(100 * (c.k as PwmInfo).thd, '%', 3)}, \\qquad f_s = m_f f_1 = ${c.q(c.p.mf * PWM.f1, 'Hz', 4)}`,
      note: (c) =>
        c.tr({
          fr: 'La tension reste très déformée (DHT de 50 % ou plus) : c’est le filtre (leçon 6.4) et l’inductance du réseau qui rendent le courant sinusoïdal. Plus $m_f$ est grand, plus le filtre est petit, mais plus les pertes de commutation augmentent.',
          en: 'The voltage stays heavily distorted (THD of 50 % or more): it is the filter (lesson 6.4) and the grid inductance that make the current sinusoidal. A larger $m_f$ means a smaller filter, but more switching losses.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la tension d’un bras', en: 'Predict a leg voltage' },
      body: {
        fr: `La référence sinusoïdale (phase a) est comparée à une porteuse triangulaire. **Dessinez la tension du bras a** sur une période, puis révélez.`,
        en: `The sinusoidal reference (phase a) is compared with a triangular carrier. **Sketch the leg a voltage** over one period, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'linear',
      title: { fr: 'La zone linéaire', en: 'The linear range' },
      body: {
        fr: `Montez $m$ à **1** en MLI sinus. Le fondamental vaut exactement $m\\,\\frac{\\sqrt3}{2}V_{dc}$, et le spectre n’a rien sous $m_f$.`,
        en: `Raise $m$ to **1** with sine PWM. The fundamental is exactly $m\\,\\frac{\\sqrt3}{2}V_{dc}$, and the spectrum has nothing below $m_f$.`,
      },
      check: (lab) => lab.params.method === PWM_METHODS.sine && Math.abs(lab.params.m - 1) < 0.02,
    },
    {
      id: 'overmod',
      title: { fr: 'La surmodulation', en: 'Overmodulation' },
      body: {
        fr: `Dépassez **m = 1,15** en MLI sinus. La référence sort de la porteuse : des créneaux sautent, et des harmoniques **5 et 7** apparaissent.`,
        en: `Go beyond **m = 1.15** with sine PWM. The reference leaves the carrier: pulses are dropped, and harmonics **5 and 7** appear.`,
      },
      check: (lab) => lab.params.method === PWM_METHODS.sine && lab.params.m >= 1.15,
    },
    {
      id: 'third',
      title: { fr: '15 % gratuits', en: '15 % for free' },
      body: {
        fr: `Gardez m ≈ 1,15 et passez en **injection de 3ᵉ harmonique** ou en **MLI vectorielle** : la déformation disparaît. La référence de phase n’est plus sinusoïdale, mais la tension composée l’est.`,
        en: `Keep m ≈ 1.15 and switch to **3rd-harmonic injection** or **space-vector PWM**: the distortion disappears. The phase reference is no longer sinusoidal, but the line voltage is.`,
      },
      check: (lab) => lab.params.method !== PWM_METHODS.sine && lab.params.m >= 1.1 && lab.params.m <= 1.16,
    },
    {
      id: 'hexagon',
      title: { fr: 'L’hexagone', en: 'The hexagon' },
      body: {
        fr: `Faites tourner le curseur de temps : le vecteur de référence parcourt un cercle, et l’onduleur alterne entre les deux vecteurs voisins et un vecteur nul. Poussez $m$ au-delà de 1,15 : le cercle sort de l’hexagone inscrit.`,
        en: `Move the time cursor: the reference vector travels round a circle, and the inverter alternates between the two neighbouring vectors and a zero vector. Push $m$ beyond 1.15: the circle leaves the inscribed hexagon.`,
      },
      check: (lab) => lab.maxFrac > 0.9 && lab.params.m > 2 / Math.sqrt(3),
    },
    {
      id: 'mf',
      title: { fr: 'Découper plus vite', en: 'Switching faster' },
      body: {
        fr: `Montez $m_f$ à **27** ou plus : les harmoniques s’éloignent vers les hautes fréquences, plus faciles à filtrer. En contrepartie, chaque interrupteur commute plus souvent.`,
        en: `Raise $m_f$ to **27** or more: harmonics move to higher frequencies, easier to filter. In return, each switch commutates more often.`,
      },
      check: (lab) => lab.params.mf >= 27,
    },
  ],
};
