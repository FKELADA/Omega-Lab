// Module 1.2 — DC transients: the series RLC circuit switched onto a DC source.

import type { EqContext, Experiment } from '../../lib/lab/types';
import { rlcInfo, rlcSeries, rlcStateSpace, type RlcInfo } from '../../lib/models/rlcSeries';
import { tex } from '../../lib/ui/format';
import type { L } from '../../lib/ui/ui.svelte';

const REGIME: Record<RlcInfo['regime'], L> = {
  under: { fr: 'sous-amorti (ζ < 1) : oscillation amortie', en: 'underdamped (ζ < 1): decaying oscillation' },
  critical: { fr: 'amortissement critique (ζ = 1)', en: 'critically damped (ζ = 1)' },
  over: { fr: 'sur-amorti (ζ > 1) : pas d’oscillation', en: 'overdamped (ζ > 1): no oscillation' },
  lossless: { fr: 'sans pertes (R = 0) : oscillation perpétuelle', en: 'lossless (R = 0): endless oscillation' },
};

/** A signed quantity, parenthesised when negative so "a + (−b)" reads correctly. */
const sq = (c: EqContext, v: number, unit: string) => (v < 0 ? `\\left(${c.q(v, unit)}\\right)` : c.q(v, unit));

export const rlcStep: Experiment = {
  id: 'rlc-step',
  path: [
    { fr: 'Module 1 · Circuits', en: 'Module 1 · Circuits' },
    { fr: '1.2 Régimes transitoires', en: '1.2 DC transients' },
  ],
  title: { fr: 'Le circuit RLC série sous échelon de tension', en: 'The series RLC circuit under a voltage step' },
  model: rlcSeries,
  info: rlcInfo,
  locusParam: 'R',

  params: [
    { id: 'R', symbol: 'R', name: { fr: 'Résistance', en: 'Resistance' }, unit: 'Ω', min: 0.1, max: 200, default: 2, scale: 'log', term: 'R' },
    { id: 'L', symbol: 'L', name: { fr: 'Inductance', en: 'Inductance' }, unit: 'H', min: 1e-3, max: 1, default: 10e-3, scale: 'log', term: 'L' },
    { id: 'C', symbol: 'C', name: { fr: 'Capacité', en: 'Capacitance' }, unit: 'F', min: 1e-6, max: 10e-3, default: 100e-6, scale: 'log', term: 'C' },
    { id: 'V', symbol: 'V', name: { fr: 'Source', en: 'Source' }, unit: 'V', min: 1, max: 50, default: 10, scale: 'lin', term: 'S' },
  ],

  signals: [
    { id: 'i', symbol: 'i', name: { fr: 'Courant', en: 'Current' }, unit: 'A', color: '--c-i', on: true, term: 'i' },
    { id: 'vC', symbol: 'v_C', name: { fr: 'Tension condensateur', en: 'Capacitor voltage' }, unit: 'V', color: '--c-C', on: true, term: 'C' },
    { id: 'vL', symbol: 'v_L', name: { fr: 'Tension bobine', en: 'Inductor voltage' }, unit: 'V', color: '--c-L', on: false, term: 'L' },
    { id: 'vR', symbol: 'v_R', name: { fr: 'Tension résistance', en: 'Resistor voltage' }, unit: 'V', color: '--c-R', on: false, term: 'R' },
    { id: 'vS', symbol: 'V', name: { fr: 'Source', en: 'Source' }, unit: 'V', color: '--c-S', on: false, term: 'S' },
  ],

  poleLabel: (_p, k: RlcInfo) => REGIME[k.regime],

  predict: {
    signal: 'i',
    // ±V/Z0 bounds the current in every regime, so the frame fits any answer without hinting at one.
    yRange: (p) => {
      const b = (1.15 * p.V) / Math.sqrt(p.L / p.C);
      return [-b, b];
    },
    diagnose(pred, run, p) {
      const i = run.s.i;
      const tEnd = run.t[run.t.length - 1];
      const peak = Math.max(...i.map(Math.abs));
      const early = pred.filter(([t]) => t < 0.04 * tEnd);
      if (early.some(([, y]) => Math.abs(y) > 0.3 * peak))
        return {
          fr: 'Le courant dans une bobine ne peut pas sauter instantanément : $v_L = L\\,di/dt$ serait infini. À $t=0^+$, $i$ part de zéro.',
          en: 'Current through an inductor cannot jump: $v_L = L\\,di/dt$ would be infinite. At $t=0^+$, $i$ starts from zero.',
        };
      const late = pred.filter(([t]) => t > 0.85 * tEnd);
      if (late.length && late.every(([, y]) => Math.abs(y) > 0.3 * peak))
        return {
          fr: 'En régime continu établi, le condensateur bloque le courant : il se charge à $V$ et $i \\to 0$.',
          en: 'In DC steady state the capacitor blocks current: it charges to $V$ and $i \\to 0$.',
        };
      const k = rlcInfo(p);
      const minTrue = Math.min(...i);
      const minPred = Math.min(...pred.map(([, y]) => y));
      if (minTrue < -0.1 * peak && minPred > -0.05 * peak)
        return {
          fr: `Ici $\\zeta = ${tex(k.zeta, '', 2)} < 1$ : l’énergie fait des allers-retours entre $L$ et $C$, et le courant **change de signe**.`,
          en: `Here $\\zeta = ${tex(k.zeta, '', 2)} < 1$: energy swings back and forth between $L$ and $C$, and the current **reverses**.`,
        };
      if (minTrue >= -0.01 * peak && minPred < -0.2 * peak)
        return {
          fr: `Ici $\\zeta = ${tex(k.zeta, '', 2)} \\geq 1$ : les pôles sont réels, donc aucune oscillation, le courant ne s’inverse pas.`,
          en: `Here $\\zeta = ${tex(k.zeta, '', 2)} \\geq 1$: the poles are real, so there is no oscillation and the current never reverses.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'kvl',
      title: { fr: 'Loi des mailles', en: 'Kirchhoff’s voltage law' },
      tex: (c) => `\\begin{aligned}
        ${c.term('S', 'V')} &= ${c.term('R', 'R\\,i')} + ${c.term('L', 'L\\,\\frac{di}{dt}')} + ${c.term('C', 'v_C')} \\\\
        ${c.term('S', c.q(c.p.V, 'V'))} &= ${c.term('R', sq(c, c.at('vR'), 'V'))} + ${c.term('L', sq(c, c.at('vL'), 'V'))} + ${c.term('C', sq(c, c.at('vC'), 'V'))}
      \\end{aligned}`,
      bars: (c) => ({
        scale: c.p.V,
        items: [
          { term: 'R', label: 'v_R', value: c.at('vR') },
          { term: 'L', label: 'v_L', value: c.at('vL') },
          { term: 'C', label: 'v_C', value: c.at('vC') },
        ],
      }),
      note: (c) =>
        c.tr({
          fr: 'Où va la tension de la source à cet instant ? Les barres montrent le terme dominant.',
          en: 'Where does the source voltage go right now? The bars show the dominant term.',
        }),
    },
    {
      id: 'char',
      title: { fr: 'Équation caractéristique', en: 'Characteristic equation' },
      tex: (c) => {
        const k: RlcInfo = c.k;
        const R = c.term('R', 'R'), L = c.term('L', 'L'), C = c.term('C', 'C');
        return `\\begin{aligned}
          &${L}${C}\\,s^2 + ${R}${C}\\,s + 1 = 0 \\;\\Rightarrow\\; s_{1,2} = -\\alpha \\pm \\sqrt{\\alpha^2-\\omega_0^2} \\\\[4pt]
          &\\alpha = \\frac{${R}}{2${L}} = ${c.q(k.alpha, '1/s')}, \\qquad \\omega_0 = \\frac{1}{\\sqrt{${L}${C}}} = ${c.q(k.omega0, 'rad/s')} \\\\[4pt]
          &\\zeta = \\frac{\\alpha}{\\omega_0} = \\frac{${R}}{2}\\sqrt{\\frac{${C}}{${L}}} = ${c.q(k.zeta, '')}
        \\end{aligned}`;
      },
      note: (c) => c.tr(REGIME[(c.k as RlcInfo).regime]),
      derive: () => [
        '\\text{KVL:}\\quad L\\frac{di}{dt} + R\\,i + v_C = V',
        'i = C\\frac{dv_C}{dt} \\;\\Rightarrow\\; LC\\,\\ddot v_C + RC\\,\\dot v_C + v_C = V',
        'v_C = V + A e^{st} \\;\\Rightarrow\\; (LC\\,s^2 + RC\\,s + 1)\\,A e^{st} = 0',
        's_{1,2} = -\\frac{R}{2L} \\pm \\sqrt{\\left(\\frac{R}{2L}\\right)^2 - \\frac{1}{LC}}',
      ],
    },
    {
      id: 'solution',
      title: { fr: 'Solution exacte', en: 'Exact solution' },
      tex: (c) => {
        const k: RlcInfo = c.k;
        const { V, L } = c.p;
        if (k.regime === 'critical')
          return `i(t) = \\frac{V}{L}\\,t\\,e^{-\\alpha t} = ${c.q(V / L, 'A/s')}\\;t\\;e^{-${c.q(k.alpha, '1/s')}\\,t}`;
        if (k.regime === 'over') {
          const s1 = c.q(k.s1.re, '1/s'), s2 = c.q(k.s2.re, '1/s');
          return `\\begin{aligned}
            i(t) &= \\frac{V}{L(s_1-s_2)}\\left(e^{s_1 t}-e^{s_2 t}\\right) \\\\
            s_1 &= ${s1}, \\quad s_2 = ${s2}
          \\end{aligned}`;
        }
        return `\\begin{aligned}
          i(t) &= \\frac{V}{L\\,\\omega_d}\\,e^{-\\alpha t}\\sin(\\omega_d t) \\\\
          &= ${c.q(V / (L * k.omegaD), 'A')}\\;e^{-${c.q(k.alpha, '1/s')}\\,t}\\,\\sin\\!\\left(${c.q(k.omegaD, 'rad/s')}\\,t\\right) \\\\
          \\omega_d &= \\sqrt{\\omega_0^2-\\alpha^2},\\quad f_d = \\frac{\\omega_d}{2\\pi} = ${c.q(k.omegaD / (2 * Math.PI), 'Hz')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'La forme de la solution change avec le régime : déplacez $R$ de part et d’autre de $R_c = 2\\sqrt{L/C}$.',
          en: 'The form of the solution changes with the regime: move $R$ either side of $R_c = 2\\sqrt{L/C}$.',
        }),
    },
    {
      id: 'energy',
      title: { fr: 'Conservation de l’énergie', en: 'Energy conservation' },
      tex: (c) => `\\begin{aligned}
        \\underbrace{\\int_0^t V i\\,d\\tau}_{${c.term('S', 'W_S')}} &= \\underbrace{\\int_0^t R\\,i^2 d\\tau}_{${c.term('R', 'W_R')}} + \\underbrace{\\tfrac12 L i^2}_{${c.term('L', 'W_L')}} + \\underbrace{\\tfrac12 C v_C^2}_{${c.term('C', 'W_C')}} \\\\
        ${c.term('S', c.q(c.at('wS'), 'J'))} &= ${c.term('R', c.q(c.at('wR'), 'J'))} + ${c.term('L', c.q(c.at('wL'), 'J'))} + ${c.term('C', c.q(c.at('wC'), 'J'))}
      \\end{aligned}`,
    },
    {
      id: 'overvoltage',
      title: { fr: 'Surtension de manœuvre', en: 'Switching overvoltage' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k: RlcInfo = c.k;
        if (k.zeta >= 1) return `v_{C,\\max} = V = ${c.q(c.p.V, 'V')} \\quad (\\zeta \\ge 1)`;
        const ov = Math.exp((-Math.PI * k.zeta) / Math.sqrt(1 - k.zeta ** 2));
        return `\\begin{aligned}
          v_{C,\\max} &= V\\left(1 + e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}\\right) = ${c.q(c.p.V * (1 + ov), 'V')} \\\\
          i_{\\max} &\\lesssim \\frac{V}{Z_0},\\quad Z_0 = \\sqrt{L/C} = ${c.q(k.Z0, 'Ω')}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'C’est le mécanisme de la surtension à l’enclenchement d’un banc de condensateurs (jusqu’à 2 p.u.).',
          en: 'This is the mechanism behind capacitor-bank energisation overvoltages (up to 2 p.u.).',
        }),
    },
    {
      id: 'statespace',
      title: { fr: 'Représentation d’état', en: 'State-space form' },
      personas: ['research'],
      tex: (c) => {
        const { A } = rlcStateSpace(c.p);
        const k: RlcInfo = c.k;
        const m = (v: number) => c.q(v, '', 4);
        const pole = (s: { re: number; im: number }) =>
          `${m(s.re)}${s.im ? (s.im > 0 ? ' + ' : ' - ') + `j\\,${m(Math.abs(s.im))}` : ''}`;
        return `\\begin{aligned}
          \\frac{d}{dt}\\begin{bmatrix} i \\\\ v_C \\end{bmatrix} &=
          \\underbrace{\\begin{bmatrix} -${c.term('R', 'R')}/${c.term('L', 'L')} & -1/${c.term('L', 'L')} \\\\ 1/${c.term('C', 'C')} & 0 \\end{bmatrix}}_{A}
          \\begin{bmatrix} i \\\\ v_C \\end{bmatrix} + \\begin{bmatrix} 1/L \\\\ 0 \\end{bmatrix} V \\\\[4pt]
          A &= \\begin{bmatrix} ${m(A[0][0])} & ${m(A[0][1])} \\\\ ${m(A[1][0])} & 0 \\end{bmatrix} \\\\[4pt]
          \\lambda(A) &= \\{\\, ${pole(k.s1)},\\; ${pole(k.s2)} \\,\\}\\ \\mathrm{s^{-1}}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Les valeurs propres de $A$ sont les pôles du plan $s$. Au module 8, G2ELin calcule exactement ces objets pour un réseau entier. Solveur : discrétisation exacte $x_{k+1} = e^{Ah} x_k + \\Gamma u_k$.',
          en: 'The eigenvalues of $A$ are the poles on the s-plane. In Module 8, G2ELin computes exactly these objects for a whole grid. Solver: exact discretisation $x_{k+1} = e^{Ah} x_k + \\Gamma u_k$.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire avant de voir', en: 'Predict before you look' },
      body: {
        fr: `L’interrupteur se ferme à $t = 0$ et connecte le circuit, initialement déchargé, à une source continue $V$.

**Avant de toucher à quoi que ce soit :** à quoi ressemble le courant $i(t)$ ?

Cliquez **Prédire**, dessinez votre courbe sur l’oscilloscope, puis **Révéler**.`,
        en: `The switch closes at $t = 0$ and connects the de-energised circuit to a DC source $V$.

**Before touching anything:** what does the current $i(t)$ look like?

Click **Predict**, sketch your curve on the oscilloscope, then **Reveal**.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'kvl',
      title: { fr: 'Où va la tension ?', en: 'Where does the voltage go?' },
      body: {
        fr: `Faites glisser le **curseur de temps** (ou appuyez sur ▶) et regardez les barres de la loi des mailles.

- À $t = 0^+$, toute la tension $V$ est aux bornes de **la bobine** : $i$ est encore nul, donc $v_R = 0$, et $C$ est vide, donc $v_C = 0$.
- À la fin, toute la tension est aux bornes **du condensateur**.

Survolez un terme d’équation : il s’allume aussi sur le schéma et l’oscilloscope.`,
        en: `Drag the **time cursor** (or press ▶) and watch the bars under Kirchhoff’s voltage law.

- At $t = 0^+$ the whole source voltage sits across **the inductor**: $i$ is still zero, so $v_R = 0$, and $C$ is empty, so $v_C = 0$.
- At the end, all of it sits across **the capacitor**.

Hover an equation term: it lights up on the schematic and the oscilloscope too.`,
      },
      check: (lab) => lab.maxFrac > 0.9,
    },
    {
      id: 'critical',
      title: { fr: 'Dompter l’oscillation', en: 'Tame the oscillation' },
      body: {
        fr: `Réglez $R$ pour obtenir l’**amortissement critique** $\\zeta = 1$ : la réponse la plus rapide **sans dépassement**.

Regardez le plan $s$ : les deux pôles complexes glissent sur un cercle de rayon $\\omega_0$ puis **se rejoignent sur l’axe réel**.`,
        en: `Adjust $R$ to reach **critical damping** $\\zeta = 1$: the fastest response **with no overshoot**.

Watch the s-plane: the two complex poles slide along a circle of radius $\\omega_0$ and **meet on the real axis**.`,
      },
      hint: {
        fr: '$R_c = 2\\sqrt{L/C}$. Avec les valeurs par défaut ($L = 10$ mH, $C = 100$ µF), $R_c = 20\\,\\Omega$.',
        en: '$R_c = 2\\sqrt{L/C}$. With the default values ($L = 10$ mH, $C = 100$ µF), $R_c = 20\\,\\Omega$.',
      },
      check: (lab) => lab.info.regime === 'critical',
    },
    {
      id: 'energy',
      title: { fr: 'L’énergie qui oscille', en: 'Energy on a swing' },
      body: {
        fr: `Réduisez $R$ jusqu’à $\\zeta < 0{,}05$ et lancez la lecture ▶.

L’énergie passe de la bobine ($\\tfrac12 Li^2$) au condensateur ($\\tfrac12 Cv_C^2$) et retour : c’est l’ancêtre de la **puissance réactive**.

**Surprise :** quelle que soit la valeur de $R$, la résistance finit par dissiper exactement l’énergie stockée dans $C$, soit $\\tfrac12 CV^2$. Vérifiez-le dans le bilan d’énergie.`,
        en: `Lower $R$ until $\\zeta < 0.05$ and press play ▶.

Energy moves from the inductor ($\\tfrac12 Li^2$) to the capacitor ($\\tfrac12 Cv_C^2$) and back: this is the ancestor of **reactive power**.

**Surprise:** whatever the value of $R$, the resistor ends up dissipating exactly the energy stored in $C$, which is $\\tfrac12 CV^2$. Check it in the energy balance.`,
      },
      check: (lab) => lab.info.zeta < 0.05,
    },
    {
      id: 'compare',
      title: { fr: 'Figer et comparer', en: 'Freeze and compare' },
      body: {
        fr: `Cliquez **Figer et comparer**, puis **multipliez $L$ par 4**.

La fréquence d’oscillation est divisée par deux, puisque $\\omega_0 = 1/\\sqrt{LC}$. Sur le plan $s$, les pôles se rapprochent de l’origine.`,
        en: `Click **Freeze & compare**, then **multiply $L$ by 4**.

The oscillation frequency halves, since $\\omega_0 = 1/\\sqrt{LC}$. On the s-plane, the poles move closer to the origin.`,
      },
      check: (lab) =>
        lab.ghosts.some((g) => {
          const r = lab.params.L / g.params.L;
          return r > 3.3 && r < 4.8;
        }),
    },
    {
      id: 'locus',
      title: { fr: 'Les pôles sont des valeurs propres', en: 'Poles are eigenvalues' },
      body: {
        fr: `Cliquez **Balayer** à côté de $R$ : sept réponses se superposent, et leurs pôles tracent le **lieu des racines**.

Passez au profil **Chercheur** pour voir la matrice $A$ : ses valeurs propres sont ces pôles. C’est exactement ce que l’analyse modale du module 8 calcule pour un réseau de centaines d’états.`,
        en: `Click **Sweep** next to $R$: seven responses are overlaid, and their poles trace the **root locus**.

Switch to the **Researcher** profile to see the matrix $A$: its eigenvalues are those poles. This is exactly what the modal analysis in Module 8 computes for a grid with hundreds of states.`,
      },
      check: (lab) => lab.fan?.param === 'R',
    },
  ],
};
