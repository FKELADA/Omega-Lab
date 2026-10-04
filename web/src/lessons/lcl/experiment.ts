// Module 6.4 — Averaged model against switching model, and the LCL filter:
// attenuation, resonance and passive damping.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { cabs } from '../../lib/core/linalg';
import { fRes, lclGain, lclInfo, lclModel, RdOpt, type LclInfo } from '../../lib/models/module6';
import LclCanvas from './LclCanvas.svelte';

const freqs = Array.from({ length: 241 }, (_, j) => 50 * 1000 ** (j / 240)); // 50 Hz – 50 kHz
/** Largest |Ig/Vinv| around the resonance, for a damping resistor Rd. */
const peak = (p: Record<string, number>, Rd: number) => {
  const f0 = fRes(p);
  let m = 0;
  for (let j = -80; j <= 80; j++) m = Math.max(m, cabs(lclGain(p, f0 * 1.005 ** j, 'lcl', Rd)));
  return m;
};

export const lclLesson: Experiment = {
  id: 'lcl',
  path: [
    { fr: 'Module 6 · Électronique de puissance', en: 'Module 6 · Power electronics' },
    { fr: '6.4 Modèle moyen et filtre LCL', en: '6.4 Averaged model and LCL filter' },
  ],
  title: { fr: 'Du découpage au modèle moyen, et le filtre LCL', en: 'From switching to the averaged model, and the LCL filter' },
  model: lclModel,
  info: lclInfo,
  canvas: LclCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'L1', symbol: 'L_1', name: { fr: 'Inductance côté onduleur', en: 'Inverter-side inductance' }, unit: 'mH', min: 0.5, max: 5, default: 2, scale: 'lin', term: 'L' },
    { id: 'L2', symbol: 'L_2', name: { fr: 'Inductance côté réseau', en: 'Grid-side inductance' }, unit: 'mH', min: 0.2, max: 3, default: 1, scale: 'lin', term: 'L' },
    { id: 'Cf', symbol: 'C_f', name: { fr: 'Condensateur du filtre (0 = filtre L)', en: 'Filter capacitor (0 = L filter)' }, unit: 'µF', min: 0, max: 30, default: 10, scale: 'lin', term: 'C' },
    { id: 'Rd', symbol: 'R_d', name: { fr: 'Résistance d’amortissement', en: 'Damping resistor' }, unit: 'Ω', min: 0, max: 10, default: 0.5, scale: 'lin', term: 'R' },
    { id: 'fs', symbol: 'f_s', name: { fr: 'Fréquence de découpage', en: 'Switching frequency' }, unit: 'kHz', min: 1.5, max: 20, default: 3, scale: 'log', term: 'p' },
  ],

  signals: [
    { id: 'ig', symbol: 'i_g', name: { fr: 'Courant réseau (modèle découpé)', en: 'Grid current (switching model)' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'igAvg', symbol: '\\bar i_g', name: { fr: 'Courant réseau (modèle moyen)', en: 'Grid current (averaged model)' }, unit: 'A', color: '--c-p', on: true, term: 'p' },
    { id: 'i1', symbol: 'i_1', name: { fr: 'Courant côté onduleur', en: 'Inverter-side current' }, unit: 'A', color: '--c-L', on: false, term: 'L' },
  ],

  charts: [
    {
      title: { fr: 'Transfert |Ig / Vonduleur|', en: 'Transfer |Ig / Vinverter|' },
      x: { label: 'f', unit: 'Hz', range: [50, 50000], log: true },
      y: { label: '|G|', unit: 'S', range: [1e-6, 10], log: true },
      series: (lab) => {
        const p = lab.params;
        const s = [{ label: { fr: 'filtre L (L₁ + L₂)', en: 'L filter (L₁ + L₂)' }, color: '--c-C', pts: freqs.map((f) => [f, cabs(lclGain(p, f, 'l'))] as [number, number]), dash: true, width: 1.4 }];
        if (p.Cf > 0.05) {
          s.push({ label: { fr: 'LCL sans amortissement', en: 'undamped LCL' }, color: '--muted', pts: freqs.map((f) => [f, cabs(lclGain(p, f, 'lcl', 0))] as [number, number]), dash: true, width: 1.2 });
          s.push({ label: { fr: 'LCL avec Rd', en: 'LCL with Rd' }, color: '--c-p', pts: freqs.map((f) => [f, cabs(lclGain(p, f, 'lcl'))] as [number, number]), dash: false, width: 2.2 });
        }
        return s;
      },
      vlines: (lab) => [{ x: lab.params.fs * 1000, label: 'fs' }, ...(lab.params.Cf > 0.05 ? [{ x: fRes(lab.params), label: 'f_rés' }] : [])],
      note: (lab) => {
        const k = lab.info as LclInfo;
        return {
          fr: `À fs, le LCL laisse passer ${(100 * k.attenuation).toFixed(1)} % de ce que laisserait un filtre L : pente de −60 dB/décade au lieu de −20.`,
          en: `At fs, the LCL lets through ${(100 * k.attenuation).toFixed(1)} % of what an L filter would: a −60 dB/decade slope instead of −20.`,
        };
      },
    },
    {
      title: { fr: 'Pic de résonance selon Rd', en: 'Resonance peak versus Rd' },
      x: { label: 'Rd', unit: 'Ω', range: [0, 10] },
      y: { label: '|G| max', unit: 'S', range: [0.01, 100], log: true },
      series: (lab) =>
        lab.params.Cf > 0.05
          ? [{ color: '--c-R', pts: Array.from({ length: 51 }, (_, j) => [j / 5, peak(lab.params, Math.max(0.01, j / 5))] as [number, number]) }]
          : [],
      points: (lab) => (lab.params.Cf > 0.05 ? [{ x: lab.params.Rd, y: peak(lab.params, Math.max(0.01, lab.params.Rd)), color: '--accent' }] : []),
      vlines: (lab) => (lab.params.Cf > 0.05 ? [{ x: RdOpt(lab.params), label: 'Rd,opt' }] : []),
      note: () => ({
        fr: 'Plus Rd est grand, plus la résonance est amortie, mais plus le courant de découpage qui traverse Cf dissipe de pertes dans Rd.',
        en: 'The larger Rd, the more the resonance is damped, but the more the switching current through Cf dissipates in Rd.',
      }),
    },
  ],

  equations: [
    {
      id: 'average',
      title: { fr: 'Le modèle moyen', en: 'The averaged model' },
      tex: () => `\\bar v_{ond}(t) = \\frac{1}{T_s}\\int_{t-T_s}^{t} v_{ond}\\,d\\tau = m(t)\\,V_{dc}`,
      note: (c) =>
        c.tr({
          fr: 'En remplaçant la tension découpée par sa moyenne sur une période de découpage, on obtient un modèle continu, linéaire et bien plus rapide à simuler. Il reproduit le fondamental et la dynamique lente, mais pas l’ondulation. C’est le modèle de G2ELin et des études de stabilité.',
          en: 'Replacing the switched voltage by its average over a switching period gives a continuous, linear model that is much faster to simulate. It reproduces the fundamental and the slow dynamics, but not the ripple. It is the model used by G2ELin and stability studies.',
        }),
    },
    {
      id: 'lcl',
      title: { fr: 'Le filtre LCL', en: 'The LCL filter' },
      tex: (c) => {
        const k = c.k as LclInfo;
        return `\\begin{aligned} \\frac{I_g}{V_{ond}} &= \\frac{1}{s^3 L_1 L_2 C_f + s(L_1 + L_2)} \\\\ f_{rés} &= \\frac{1}{2\\pi}\\sqrt{\\frac{L_1 + L_2}{L_1 L_2 C_f}} = ${isNaN(k.fres) ? '\\text{—}' : c.q(k.fres, 'Hz', 4)} \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Au-dessus de la résonance, le gain chute en $1/f^3$ au lieu de $1/f$ : on obtient la même atténuation avec bien moins d’inductance. Mais à $f_{rés}$, le gain non amorti est infini.',
          en: 'Above the resonance, the gain falls as $1/f^3$ instead of $1/f$: the same attenuation with far less inductance. But at $f_{rés}$ the undamped gain is infinite.',
        }),
    },
    {
      id: 'damping',
      title: { fr: 'Amortissement passif', en: 'Passive damping' },
      tex: (c) => {
        const k = c.k as LclInfo;
        return `R_d \\approx \\frac{1}{3\\,\\omega_{rés} C_f} = ${isNaN(k.RdOpt) ? '\\text{—}' : c.q(k.RdOpt, 'Ω', 3)}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Une résistance en série avec le condensateur amortit la résonance au prix de pertes. Les onduleurs modernes préfèrent un amortissement actif : la commande imite une résistance, sans pertes.',
          en: 'A resistor in series with the capacitor damps the resonance at the cost of losses. Modern inverters prefer active damping: the control emulates a resistor, without losses.',
        }),
    },
    {
      id: 'ripple',
      title: { fr: 'Ondulation du courant réseau', en: 'Grid-current ripple' },
      tex: (c) => `\\Delta i_g = ${c.q((c.k as LclInfo).ripple, 'A', 3)}\\ \\text{(crête à crête, écart au modèle moyen)}`,
      note: (c) =>
        c.tr({
          fr: 'Les normes de raccordement (IEEE 519, IEC 61000-3-12) limitent les courants harmoniques injectés, y compris autour de la fréquence de découpage.',
          en: 'Connection standards (IEEE 519, IEC 61000-3-12) limit injected harmonic currents, including around the switching frequency.',
        }),
    },
    {
      id: 'thread',
      title: { fr: 'Le fil « résonance »', en: 'The resonance thread' },
      personas: ['research'],
      tex: () => `\\text{1.4: RLC} \\;\\to\\; \\text{6.4: LCL} \\;\\to\\; \\text{8.5–8.6: interactions onduleur–réseau}`,
      note: (c) =>
        c.tr({
          fr: 'C’est la même physique que la résonance RLC de la leçon 1.4. Avec la commande et le retard numérique, la résonance du filtre peut devenir instable : c’est l’un des mécanismes des interactions harmoniques entre onduleurs et réseau.',
          en: 'It is the same physics as the RLC resonance of lesson 1.4. With the control and the digital delay, the filter resonance can become unstable: one of the mechanisms of harmonic interactions between inverters and the grid.',
        }),
    },
  ],

  steps: [
    {
      id: 'average',
      title: { fr: 'Moyen contre découpé', en: 'Averaged against switched' },
      body: {
        fr: `Les deux modèles donnent le même courant, à l’ondulation près. Masquez la trace du **modèle découpé** (pastille de l’oscilloscope) : il reste un courant lisse, celui du modèle moyen.`,
        en: `Both models give the same current, apart from the ripple. Hide the **switching model** trace (oscilloscope chip): a smooth current remains, the averaged model’s.`,
      },
      check: (lab) => lab.visible.ig === false,
    },
    {
      id: 'lfilter',
      title: { fr: 'Un simple filtre L', en: 'A plain L filter' },
      body: {
        fr: `Réaffichez le modèle découpé et mettez $C_f$ à **0** : il ne reste que $L_1 + L_2$. L’ondulation du courant réseau grossit nettement.`,
        en: `Show the switching model again and set $C_f$ to **0**: only $L_1 + L_2$ remain. The grid-current ripple grows markedly.`,
      },
      check: (lab) => lab.params.Cf < 0.05 && lab.visible.ig !== false,
    },
    {
      id: 'lcl',
      title: { fr: 'Le condensateur', en: 'The capacitor' },
      body: {
        fr: `Remettez au moins **5 µF**. À la fréquence de découpage, le LCL atténue **plus de 10 fois** mieux que le filtre L : le courant de découpage se referme par le condensateur. Il faut pour cela que $ soit bien au-dessus de la résonance : montez-la si besoin.`,
        en: `Put back at least **5 µF**. At the switching frequency the LCL attenuates **more than 10 times** better than the L filter: the switching current closes through the capacitor. This needs $ well above the resonance: raise it if needed.`,
      },
      check: (lab) => !!lab.completed.lfilter && lab.params.Cf >= 5 && (lab.info as LclInfo).attenuation < 0.1,
    },
    {
      id: 'resonance',
      title: { fr: 'La résonance', en: 'The resonance' },
      body: {
        fr: `Sans amortissement ($R_d = 0$), baissez $f_s$ vers la **fréquence de résonance** (à 25 % près). Les harmoniques de découpage excitent la résonance : le courant réseau se met à osciller.`,
        en: `With no damping ($R_d = 0$), lower $f_s$ towards the **resonant frequency** (within 25 %). The switching harmonics excite the resonance: the grid current starts to oscillate.`,
      },
      check: (lab) => lab.params.Rd < 0.05 && lab.params.Cf > 0.05 && Math.abs(lab.params.fs * 1000 - fRes(lab.params)) < 0.25 * fRes(lab.params),
    },
    {
      id: 'damp',
      title: { fr: 'Amortir', en: 'Damping' },
      body: {
        fr: `Ajoutez une résistance d’amortissement d’au moins la **moitié** de la valeur conseillée. Le pic de résonance s’écrase, et l’oscillation disparaît.`,
        en: `Add a damping resistor of at least **half** the recommended value. The resonance peak collapses, and the oscillation disappears.`,
      },
      check: (lab) => lab.params.Cf > 0.05 && lab.params.Rd >= 0.5 * RdOpt(lab.params),
    },
    {
      id: 'design',
      title: { fr: 'Un bon dimensionnement', en: 'A sound design' },
      body: {
        fr: `Placez la résonance entre **10 fois la fréquence du réseau** et **la moitié de $f_s$** (règle usuelle), avec un amortissement suffisant.`,
        en: `Place the resonance between **10 times the grid frequency** and **half of $f_s$** (the usual rule), with enough damping.`,
      },
      check: (lab) => {
        const f = fRes(lab.params);
        return f > 500 && f < 0.5 * lab.params.fs * 1000 && lab.params.Rd >= 0.5 * RdOpt(lab.params);
      },
    },
  ],
};
