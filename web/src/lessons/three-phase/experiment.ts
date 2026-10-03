// Module 2.4 — Three-phase systems: balance, neutral current, constant power, broken neutral.

import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
import { cabs, carg, type Complex } from '../../lib/core/linalg';
import type { Experiment, PhasorItem } from '../../lib/lab/types';
import { threePhase, threePhaseInfo, type ThreePhaseInfo } from '../../lib/models/acCircuits';
import BalanceMeter from './BalanceMeter.svelte';
import ThreePhaseSchematic from './ThreePhaseSchematic.svelte';

const R_2KW = 26.45; // 2 kW on 230 V
const PH = ['a', 'b', 'c'] as const;
const deg = (z: Complex) => (carg(z) * 180) / Math.PI;

export const threePhaseLesson: Experiment = {
  id: 'three-phase',
  path: [
    { fr: 'Module 2 · Outils de l’alternatif', en: 'Module 2 · AC toolbox' },
    { fr: '2.4 Triphasé', en: '2.4 Three-phase' },
  ],
  title: { fr: 'Le réseau triphasé et son neutre', en: 'The three-phase system and its neutral' },
  model: threePhase,
  info: threePhaseInfo,
  canvas: ThreePhaseSchematic,
  instruments: [PhasorDiagram, BalanceMeter],

  params: [
    {
      id: 'phases',
      symbol: 'n',
      name: { fr: 'Phases', en: 'Phases' },
      unit: '',
      min: 1,
      max: 3,
      default: 3,
      scale: 'lin',
      choices: [
        { value: 1, label: { fr: 'Monophasé', en: 'Single-phase' } },
        { value: 3, label: { fr: 'Triphasé', en: 'Three-phase' } },
      ],
    },
    {
      id: 'neutral',
      symbol: 'N',
      name: { fr: 'Neutre', en: 'Neutral' },
      unit: '',
      min: 0,
      max: 1,
      default: 1,
      scale: 'lin',
      term: 'n',
      choices: [
        { value: 1, label: { fr: 'Neutre relié', en: 'Neutral connected' } },
        { value: 0, label: { fr: 'Neutre coupé', en: 'Neutral broken' } },
      ],
    },
    { id: 'Ra', symbol: 'R_a', name: { fr: 'Charge phase A', en: 'Load on phase A' }, unit: 'Ω', min: 5, max: 500, default: R_2KW, scale: 'log', term: 'a' },
    { id: 'Rb', symbol: 'R_b', name: { fr: 'Charge phase B', en: 'Load on phase B' }, unit: 'Ω', min: 5, max: 500, default: R_2KW, scale: 'log', term: 'b' },
    { id: 'Rc', symbol: 'R_c', name: { fr: 'Charge phase C', en: 'Load on phase C' }, unit: 'Ω', min: 5, max: 500, default: R_2KW, scale: 'log', term: 'c' },
    { id: 'V', symbol: 'V', name: { fr: 'Tension simple', en: 'Phase voltage' }, unit: 'V', min: 100, max: 400, default: 230, scale: 'lin', term: 'S' },
    {
      id: 'f',
      symbol: 'f',
      name: { fr: 'Fréquence', en: 'Frequency' },
      unit: 'Hz',
      min: 50,
      max: 60,
      default: 50,
      scale: 'lin',
      choices: [
        { value: 50, label: { fr: '50 Hz', en: '50 Hz' } },
        { value: 60, label: { fr: '60 Hz', en: '60 Hz' } },
      ],
    },
  ],

  signals: [
    { id: 'p', symbol: 'p', name: { fr: 'Puissance totale', en: 'Total power' }, unit: 'W', color: '--c-p', on: true, term: 'p' },
    { id: 'P', symbol: 'P', name: { fr: 'Puissance moyenne', en: 'Average power' }, unit: 'W', color: '--c-P', on: true, term: 'P', dash: true },
    { id: 'pa', symbol: 'p_a', name: { fr: 'Puissance phase A', en: 'Phase A power' }, unit: 'W', color: '--c-a', on: false, term: 'a', dash: true },
    { id: 'va', symbol: 'v_a', name: { fr: 'Tension A', en: 'Voltage A' }, unit: 'V', color: '--c-a', on: true, term: 'a' },
    { id: 'vb', symbol: 'v_b', name: { fr: 'Tension B', en: 'Voltage B' }, unit: 'V', color: '--c-b', on: true, term: 'b' },
    { id: 'vc', symbol: 'v_c', name: { fr: 'Tension C', en: 'Voltage C' }, unit: 'V', color: '--c-c', on: true, term: 'c' },
    { id: 'ia', symbol: 'i_a', name: { fr: 'Courant A', en: 'Current A' }, unit: 'A', color: '--c-a', on: false, term: 'a' },
    { id: 'ib', symbol: 'i_b', name: { fr: 'Courant B', en: 'Current B' }, unit: 'A', color: '--c-b', on: false, term: 'b' },
    { id: 'ic', symbol: 'i_c', name: { fr: 'Courant C', en: 'Current C' }, unit: 'A', color: '--c-c', on: false, term: 'c' },
    { id: 'iN', symbol: 'i_N', name: { fr: 'Courant de neutre', en: 'Neutral current' }, unit: 'A', color: '--c-n', on: false, term: 'n' },
  ],

  phasors: {
    omega: (p) => 2 * Math.PI * p.f,
    unit: 'V',
    rms: true,
    items: (p, k: ThreePhaseInfo) => {
      const shifted = cabs(k.VN) > 1e-6;
      const items: PhasorItem[] = PH.map((ph, j) => ({
        id: `V${ph}`,
        label: `V_${ph}`,
        term: ph,
        color: `--c-${ph}`,
        value: k.Vs[j],
        thin: shifted,
      }));
      if (shifted) {
        items.push({ id: 'VN', label: "V_N'", term: 'n', color: '--c-n', value: k.VN });
        PH.forEach((ph, j) =>
          (p.phases === 3 || j === 0) &&
          items.push({ id: `U${ph}`, label: `U_${ph}`, term: ph, color: `--c-${ph}`, value: k.Vload[j], tail: k.VN }),
        );
      }
      return items;
    },
  },

  predict: {
    signal: 'p',
    yRange: (p) => {
      const P = threePhaseInfo(p).P;
      return [-0.3 * P, 2.3 * P];
    },
    diagnose(pred, _run, p) {
      const P = threePhaseInfo(p).P;
      const ys = pred.map(([, y]) => y);
      if (Math.max(...ys) - Math.min(...ys) > 0.4 * P)
        return {
          fr: 'Chaque phase pulse bien entre $0$ et $2P_a$, mais les trois pulsations sont décalées de 120° et se compensent exactement : la puissance totale est **constante**.',
          en: 'Each phase does pulse between $0$ and $2P_a$, but the three pulses are 120° apart and cancel exactly: the total power is **constant**.',
        };
      return null;
    },
  },

  equations: [
    {
      id: 'set',
      title: { fr: 'Un système triphasé', en: 'A three-phase set' },
      tex: (c) => `\\begin{aligned}
        ${c.term('a', 'v_a')} &= \\sqrt2\\,V\\cos(\\omega t) \\\\
        ${c.term('b', 'v_b')} &= \\sqrt2\\,V\\cos(\\omega t - 120^\\circ) \\\\
        ${c.term('c', 'v_c')} &= \\sqrt2\\,V\\cos(\\omega t + 120^\\circ) \\\\
        ${c.term('a', 'v_a')} + ${c.term('b', 'v_b')} + ${c.term('c', 'v_c')} &= ${c.q(c.at('va'), 'V')} ${c.at('vb') < 0 ? '' : '+'} ${c.q(c.at('vb'), 'V')} ${c.at('vc') < 0 ? '' : '+'} ${c.q(c.at('vc'), 'V')} = 0
      \\end{aligned}`,
      bars: (c) => ({
        scale: Math.SQRT2 * c.p.V,
        items: PH.map((ph) => ({ term: ph, label: `v_${ph}`, value: c.at(`v${ph}`) })),
      }),
    },
    {
      id: 'neutral',
      title: { fr: 'Courant de neutre', en: 'Neutral current' },
      tex: (c) => {
        const k = c.k as ThreePhaseInfo;
        return `${c.term('n', '\\underline I_N')} = ${c.term('a', '\\underline I_a')} + ${c.term('b', '\\underline I_b')} + ${c.term('c', '\\underline I_c')} \\quad\\Rightarrow\\quad |${c.term('n', '\\underline I_N')}| = ${c.term('n', c.q(cabs(k.IN), 'A'))}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Charges équilibrées : les trois courants s’annulent et le neutre ne transporte rien. Les lignes de transport n’ont d’ailleurs pas de neutre.',
          en: 'Balanced loads: the three currents cancel and the neutral carries nothing. That is why transmission lines have no neutral at all.',
        }),
    },
    {
      id: 'power',
      title: { fr: 'Puissance totale', en: 'Total power' },
      tex: (c) => {
        const k = c.k as ThreePhaseInfo;
        return `\\begin{aligned}
          ${c.term('p', 'p(t)')} &= v_a i_a + v_b i_b + v_c i_c \\\\
          &= 3\\,V I\\cos\\varphi = ${c.term('P', c.q(k.P, 'W'))} \\quad (${c.tr({ fr: 'équilibré', en: 'balanced' })})
        \\end{aligned}`;
      },
      derive: () => [
        'p = \\frac{2V^2}{R}\\left[\\cos^2\\theta + \\cos^2(\\theta - 120^\\circ) + \\cos^2(\\theta + 120^\\circ)\\right]',
        '\\cos^2 x = \\tfrac12(1 + \\cos 2x) \\;\\Rightarrow\\; \\textstyle\\sum = \\tfrac32 + \\tfrac12\\underbrace{\\big[\\cos2\\theta + \\cos(2\\theta-240^\\circ) + \\cos(2\\theta+240^\\circ)\\big]}_{=\\,0}',
        'p = \\frac{2V^2}{R}\\cdot\\frac32 = 3\\,\\frac{V^2}{R} \\quad\\text{(constant)}',
      ],
      note: (c) =>
        c.tr({
          fr: 'Une puissance constante donne un **couple constant** : c’est pourquoi les gros moteurs, et les alternateurs, sont triphasés.',
          en: 'Constant power means **constant torque**: that is why large motors, and generators, are three-phase.',
        }),
    },
    {
      id: 'line',
      title: { fr: 'Tension composée', en: 'Line-to-line voltage' },
      tex: (c) => {
        const k = c.k as ThreePhaseInfo;
        return `\\underline V_{ab} = \\underline V_a - \\underline V_b = \\sqrt3\\,V\\angle 30^\\circ \\;\\Rightarrow\\; V_{ab} = \\sqrt3 \\times ${c.q(c.p.V, 'V')} = ${c.q(k.VLL, 'V')}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le « 230/400 V » des réseaux basse tension européens : 230 V entre phase et neutre, 400 V entre deux phases.',
          en: 'The “230/400 V” of European low-voltage networks: 230 V phase to neutral, 400 V between two phases.',
        }),
    },
    {
      id: 'millman',
      title: { fr: 'Neutre coupé : le point étoile dérive', en: 'Broken neutral: the star point drifts' },
      personas: ['utility', 'research'],
      tex: (c) => {
        const k = c.k as ThreePhaseInfo;
        return `\\begin{aligned}
          ${c.term('n', "\\underline V_{N'}")} &= \\frac{\\sum_k \\underline V_k / R_k}{\\sum_k 1/R_k} = ${c.term('n', `${c.q(cabs(k.VN), 'V')}\\angle ${c.q(deg(k.VN), '°', 3)}`)} \\\\
          U_a,\\,U_b,\\,U_c &= ${c.term('a', c.q(cabs(k.Vload[0]), 'V'))},\\; ${c.term('b', c.q(cabs(k.Vload[1]), 'V'))},\\; ${c.term('c', c.q(cabs(k.Vload[2]), 'V'))}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Théorème de Millman. Avec un neutre coupé, la phase la **moins** chargée voit une surtension qui peut approcher 400 V et détruire les appareils. C’est un défaut classique et dangereux sur les réseaux de distribution.',
          en: 'Millman’s theorem. With a broken neutral, the **least** loaded phase sees an overvoltage that can approach 400 V and destroy appliances. It is a classic and dangerous fault on distribution networks.',
        }),
    },
    {
      id: 'sequence',
      title: { fr: 'Vers les composantes symétriques', en: 'Towards symmetrical components' },
      personas: ['research'],
      tex: () => `a = e^{j120^\\circ},\\qquad \\begin{bmatrix} \\underline V_a \\\\ \\underline V_b \\\\ \\underline V_c \\end{bmatrix} = \\underline V_a\\begin{bmatrix} 1 \\\\ a^2 \\\\ a \\end{bmatrix},\\qquad 1 + a + a^2 = 0`,
      note: (c) =>
        c.tr({
          fr: 'Un système déséquilibré se décompose en trois systèmes équilibrés (direct, inverse, homopolaire) : leçon 2.8, puis calcul des défauts au module 5.',
          en: 'An unbalanced set splits into three balanced ones (positive, negative, zero sequence): lesson 2.8, then fault analysis in Module 5.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire la puissance totale', en: 'Predict the total power' },
      body: {
        fr: `Trois radiateurs de $2$ kW, un par phase, sont branchés sur un réseau 230/400 V.

En 1.3, la puissance d’un radiateur pulsait entre $0$ et $2P$. **Dessinez la puissance totale $p(t)$** des trois radiateurs, puis révélez.`,
        en: `Three $2$ kW heaters, one per phase, are connected to a 230/400 V supply.

In 1.3, one heater’s power pulsed between $0$ and $2P$. **Sketch the total power $p(t)$** of all three, then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'single',
      title: { fr: 'Une seule phase', en: 'Just one phase' },
      body: {
        fr: `Passez en **monophasé** : la puissance se remet à pulser à $2f$. Affichez aussi $p_a$ en triphasé pour voir les trois pulsations qui se compensent.`,
        en: `Switch to **single-phase**: the power pulses at $2f$ again. In three-phase, also show $p_a$ to see the three pulses cancelling.`,
      },
      check: (lab) => lab.params.phases === 1,
    },
    {
      id: 'unbalance',
      title: { fr: 'Déséquilibre', en: 'Unbalance' },
      body: {
        fr: `Revenez en triphasé et changez la charge d’**une** phase. Un courant apparaît dans le **neutre** : c’est lui qui ramène la différence.

Faites passer plus de $3$ A dans le neutre.`,
        en: `Go back to three-phase and change the load on **one** phase. A current appears in the **neutral**: it carries the difference back.

Get more than $3$ A flowing in the neutral.`,
      },
      check: (lab) => lab.params.phases === 3 && lab.params.neutral === 1 && cabs((lab.info as ThreePhaseInfo).IN) > 3,
    },
    {
      id: 'broken',
      title: { fr: 'Neutre coupé', en: 'Broken neutral' },
      body: {
        fr: `Gardez les charges déséquilibrées et **cliquez l’interrupteur du neutre** sur le schéma.

Le point étoile $N'$ dérive (diagramme de phaseurs) et une charge passe au-dessus de $253$ V (+10 %). C’est le défaut qui grille les appareils d’un immeuble entier.`,
        en: `Keep the loads unbalanced and **click the neutral switch** on the schematic.

The star point $N'$ drifts (phasor diagram) and one load goes above $253$ V (+10 %). This is the fault that burns out appliances across a whole building.`,
      },
      check: (lab) =>
        lab.params.neutral === 0 && Math.max(...(lab.info as ThreePhaseInfo).Vload.map(cabs)) > 1.1 * lab.params.V,
    },
    {
      id: 'line',
      title: { fr: '230 ou 400 V ?', en: '230 or 400 V?' },
      body: {
        fr: `Reliez le neutre et rééquilibrez les charges. Dans le diagramme de phaseurs, la flèche qui va de la pointe de $\\underline V_b$ à celle de $\\underline V_a$ est la **tension composée** $\\underline V_{ab}$ : $\\sqrt3$ fois plus longue, soit $400$ V.

Passez au profil **Chercheur** pour un avant-goût des composantes symétriques.`,
        en: `Reconnect the neutral and rebalance the loads. In the phasor diagram, the arrow from the tip of $\\underline V_b$ to the tip of $\\underline V_a$ is the **line voltage** $\\underline V_{ab}$: $\\sqrt3$ times longer, which is $400$ V.

Switch to the **Researcher** profile for a first look at symmetrical components.`,
      },
      check: (lab) => !!lab.completed.broken && lab.params.neutral === 1 && cabs((lab.info as ThreePhaseInfo).IN) < 0.5,
    },
  ],
};
