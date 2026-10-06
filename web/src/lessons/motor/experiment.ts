// Module 4.8 — The induction motor: torque–slip, start-up, stall.

import Chart0 from '../../lib/instruments/charts/Chart0.svelte';
import Chart1 from '../../lib/instruments/charts/Chart1.svelte';
import type { Experiment } from '../../lib/lab/types';
import { IM, imCurrent, imInfo, imTorque, inductionMotor, loadTorque, type ImInfo } from '../../lib/models/module4';
import MotorCanvas from './MotorCanvas.svelte';

const bySpeed = (f: (s: number) => number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let w = 0; w <= 0.999; w += 0.005) pts.push([w, f(1 - w)]);
  return pts;
};

export const motorLesson: Experiment = {
  id: 'motor',
  path: [
    { fr: 'Module 4 · Éléments du réseau', en: 'Module 4 · Grid elements' },
    { fr: '4.8 Machine asynchrone', en: '4.8 Induction motor' },
  ],
  title: { fr: 'Le moteur asynchrone : démarrer, tourner, caler', en: 'The induction motor: starting, running, stalling' },
  model: inductionMotor,
  info: imInfo,
  canvas: MotorCanvas,
  instruments: [Chart0, Chart1],

  params: [
    { id: 'T0', symbol: 'T_0', name: { fr: 'Couple de charge', en: 'Load torque' }, unit: 'pu', min: 0, max: 1.5, default: 0.8, scale: 'lin', term: 'R' },
    {
      id: 'type',
      symbol: 'T_L',
      name: { fr: 'Type de charge', en: 'Load type' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'Ventilateur', en: 'Fan' } },
        { value: 1, label: { fr: 'Couple constant', en: 'Constant torque' } },
      ],
    },
    {
      id: 'start',
      symbol: 't_0',
      name: { fr: 'État initial', en: 'Initial state' },
      unit: '',
      min: 0,
      max: 1,
      default: 0,
      scale: 'lin',
      choices: [
        { value: 0, label: { fr: 'À l’arrêt', en: 'At rest' } },
        { value: 1, label: { fr: 'En marche', en: 'Running' } },
      ],
    },
    { id: 'V', symbol: 'V', name: { fr: 'Tension', en: 'Voltage' }, unit: 'pu', min: 0.7, max: 1.1, default: 1, scale: 'lin', term: 'S' },
    { id: 'dip', symbol: 'V_{dip}', name: { fr: 'Creux de tension (t = 2,5 s)', en: 'Voltage dip (t = 2.5 s)' }, unit: 'pu', min: 0.3, max: 1, default: 1, scale: 'lin', term: 'S' },
    { id: 'dipDur', symbol: 't_{dip}', name: { fr: 'Durée du creux', en: 'Dip duration' }, unit: 's', min: 0.05, max: 1, default: 0.2, scale: 'log' },
    { id: 'Rr', symbol: 'R_r', name: { fr: 'Résistance rotorique', en: 'Rotor resistance' }, unit: 'pu', min: 0.005, max: 0.1, default: 0.02, scale: 'log', term: 'L' },
    { id: 'H', symbol: 'H', name: { fr: 'Inertie', en: 'Inertia' }, unit: 's', min: 0.2, max: 3, default: 0.8, scale: 'lin' },
  ],

  signals: [
    { id: 'speed', symbol: '\\omega', name: { fr: 'Vitesse', en: 'Speed' }, unit: 'pu', color: '--c-p', on: true, term: 'p' },
    { id: 'i', symbol: 'I', name: { fr: 'Courant', en: 'Current' }, unit: 'pu', color: '--c-i', on: true, term: 'i' },
    { id: 'te', symbol: 'T_e', name: { fr: 'Couple moteur', en: 'Motor torque' }, unit: 'pu', color: '--c-L', on: false, term: 'L' },
    { id: 'tl', symbol: 'T_L', name: { fr: 'Couple de charge', en: 'Load torque' }, unit: 'pu', color: '--c-R', on: false, term: 'R', dash: true },
    { id: 'v', symbol: 'V', name: { fr: 'Tension', en: 'Voltage' }, unit: 'pu', color: '--c-S', on: false, term: 'S' },
  ],

  charts: [
    {
      title: { fr: 'Couple selon la vitesse', en: 'Torque versus speed' },
      x: { label: 'ω', unit: 'pu', range: [0, 1] },
      y: { label: 'T', unit: 'pu', range: [0, 3.2] },
      series: (lab) => {
        const p = lab.params;
        const s = [
          { label: { fr: 'moteur, tension nominale', en: 'motor, rated voltage' }, color: '--c-L', pts: bySpeed((s) => imTorque(s, p.V, p.Rr)) },
          { label: { fr: 'charge', en: 'load' }, color: '--c-R', pts: bySpeed((s) => loadTorque(p.T0, p.type, 1 - s)), dash: true },
        ];
        if (p.dip < 1) s.push({ label: { fr: 'moteur pendant le creux', en: 'motor during the dip' }, color: '--warn', pts: bySpeed((x) => imTorque(x, p.V * p.dip, p.Rr)), dash: true });
        return s;
      },
      points: (lab) => [
        { x: lab.at('speed'), y: lab.at('te'), color: '--c-L' },
        { x: lab.at('speed'), y: lab.at('tl'), color: '--c-R', hollow: true },
      ],
      note: () => ({ fr: 'Le moteur accélère tant que sa courbe est au-dessus de celle de la charge.', en: 'The motor accelerates as long as its curve is above the load’s.' }),
    },
    {
      title: { fr: 'Courant selon la vitesse', en: 'Current versus speed' },
      x: { label: 'ω', unit: 'pu', range: [0, 1] },
      y: { label: 'I', unit: 'pu', range: [0, 9] },
      series: (lab) => [{ color: '--c-i', pts: bySpeed((s) => imCurrent(s, lab.params.V, lab.params.Rr)) }],
      points: (lab) => [{ x: lab.at('speed'), y: lab.at('i'), color: '--c-i' }],
    },
  ],

  predict: {
    signal: 'i',
    yRange: () => [0, 9],
    diagnose(pred, run) {
      const truth = Math.max(...run.s.i);
      const mine = Math.max(...pred.map(([, y]) => y));
      if (mine < 0.5 * truth)
        return {
          fr: `Au démarrage, le rotor est immobile : le glissement vaut 1 et le moteur se comporte presque comme un court-circuit. Il appelle **${(truth).toFixed(1).replace('.', ',')} fois** son courant nominal, d’où les creux de tension au démarrage des gros moteurs.`,
          en: `At start-up the rotor is still: slip is 1 and the motor looks almost like a short circuit. It draws **${truth.toFixed(1)} times** its rated current, hence the voltage dips when large motors start.`,
        };
      return null;
    },
  },

  equations: [
    {
      id: 'slip',
      title: { fr: 'Le glissement', en: 'Slip' },
      tex: (c) => `g = \\frac{\\omega_s - \\omega}{\\omega_s} = ${c.q(1 - c.at('speed'), '', 3)}`,
      note: (c) =>
        c.tr({
          fr: 'Le rotor tourne un peu moins vite que le champ : c’est ce glissement qui induit les courants rotoriques et donc le couple.',
          en: 'The rotor turns slightly slower than the field: this slip induces the rotor currents, and so the torque.',
        }),
    },
    {
      id: 'torque',
      title: { fr: 'Couple électromagnétique', en: 'Electromagnetic torque' },
      tex: (c) => {
        const k = c.k as ImInfo;
        return `\\begin{aligned}
          T_e &= \\frac{V_{th}^2\\,R_r/g}{(R_{th} + R_r/g)^2 + (X_{th} + X_r)^2} \\\\
          T_{max} &= ${c.q(k.tMax, '', 3)}\\ \\text{pu}\\ (g = ${c.q(k.sMax, '', 2)}), \\qquad T_{start} = ${c.q(k.tStart, '', 3)}\\ \\text{pu}
        \\end{aligned}`;
      },
      note: (c) =>
        c.tr({
          fr: 'Le couple varie comme le **carré de la tension** : un creux à 70 % divise le couple par deux.',
          en: 'Torque scales with the **square of the voltage**: a dip to 70 % halves the torque.',
        }),
    },
    {
      id: 'mech',
      title: { fr: 'Équation mécanique', en: 'Mechanical equation' },
      tex: () => `2H\\,\\frac{d\\omega}{dt} = T_e - T_L`,
      note: (c) =>
        c.tr({
          fr: 'Même forme que l’équation du mouvement de l’alternateur (leçon 3.3).',
          en: 'Same form as the generator swing equation (lesson 3.3).',
        }),
    },
    {
      id: 'circuit',
      title: { fr: 'Schéma équivalent', en: 'Equivalent circuit' },
      personas: ['research', 'utility'],
      tex: () => `R_s = ${IM.Rs},\\ X_s = ${IM.Xs},\\ X_m = ${IM.Xm},\\ X_r = ${IM.Xr}\\ \\text{pu};\\quad \\text{rotor: } R_r/g + jX_r`,
      note: (c) =>
        c.tr({
          fr: 'Le rotor est vu comme une résistance $R_r/g$ qui varie avec la vitesse. Les moteurs qui calent pendant un creux tirent un fort courant réactif et retardent le retour de la tension : c’est le FIDVR, observé dans les zones très climatisées.',
          en: 'The rotor appears as a resistance $R_r/g$ that varies with speed. Motors stalled by a dip draw large reactive current and delay voltage recovery: this is FIDVR, observed in areas with heavy air-conditioning.',
        }),
    },
  ],

  steps: [
    {
      id: 'predict',
      predict: true,
      title: { fr: 'Prédire le courant de démarrage', en: 'Predict the starting current' },
      body: {
        fr: `Un moteur entraînant un ventilateur est mis sous tension à l’arrêt. **Dessinez son courant** pendant le démarrage (en pu du courant nominal), puis révélez.`,
        en: `A motor driving a fan is switched on from standstill. **Sketch its current** during start-up (in pu of rated current), then reveal.`,
      },
      check: (lab) => lab.prediction.revealed,
    },
    {
      id: 'heavy',
      title: { fr: 'Trop lourd pour démarrer', en: 'Too heavy to start' },
      body: {
        fr: `Passez en **couple constant** et augmentez le couple de charge au-dessus du **couple de démarrage**. Le moteur reste **calé** en tirant son courant de démarrage : il chauffe sans tourner.`,
        en: `Switch to **constant torque** and raise the load torque above the **starting torque**. The motor stays **stalled** while drawing starting current: it heats up without turning.`,
      },
      check: (lab) => lab.params.start === 0 && lab.params.type === 1 && lab.params.dip >= 1 && (lab.info as ImInfo).stalled,
    },
    {
      id: 'dip',
      title: { fr: 'Un creux de tension', en: 'A voltage dip' },
      body: {
        fr: `Partez d’un moteur **en marche**, en **couple constant** à 0,9 pu, avec une **faible inertie** ($H = 0{,}2$ s, comme le compresseur d’un climatiseur). Appliquez un creux à **0,5 pu** pendant **0,5 s**. Le moteur ralentit, passe le sommet de sa courbe et **cale** : c’est le FIDVR. Essayez aussi 0,3 s : un défaut éliminé plus vite est franchi.`,
        en: `Start from a **running** motor, with **constant torque** at 0.9 pu and **low inertia** ($H = 0.2$ s, like an air-conditioner compressor). Apply a dip to **0.5 pu** for **0.5 s**. The motor slows, falls past the peak of its curve and **stalls**: this is FIDVR. Try 0.3 s too: a fault cleared faster is ridden through.`,
      },
      check: (lab) => lab.params.start === 1 && lab.params.type === 1 && lab.params.dip < 1 && (lab.info as ImInfo).stalled,
    },
    {
      id: 'fan',
      title: { fr: 'Le ventilateur passe', en: 'The fan rides through' },
      body: {
        fr: `Gardez le même creux mais repassez en **ventilateur**. En ralentissant, le ventilateur demande beaucoup moins de couple : le moteur repart.`,
        en: `Keep the same dip but switch back to the **fan**. As it slows, the fan needs far less torque: the motor recovers.`,
      },
      check: (lab) => lab.params.start === 1 && lab.params.type === 0 && lab.params.dip <= 0.5 && lab.params.dipDur >= 0.5 && !(lab.info as ImInfo).stalled,
    },
    {
      id: 'rotor',
      title: { fr: 'La résistance rotorique', en: 'Rotor resistance' },
      body: {
        fr: `Augmentez la résistance rotorique à **0,06 pu** ou plus. Le couple maximal se déplace vers les basses vitesses : meilleur démarrage, mais plus de glissement (et de pertes) en marche normale. Les moteurs à double cage profitent des deux.`,
        en: `Raise the rotor resistance to **0.06 pu** or more. Breakdown torque moves to lower speeds: better starting, but more slip (and losses) in normal running. Double-cage motors get the best of both.`,
      },
      check: (lab) => lab.params.Rr >= 0.06,
    },
  ],
};
