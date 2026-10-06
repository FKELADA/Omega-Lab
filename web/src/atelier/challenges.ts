// Atelier challenges: a starting bench with locked elements, an objective
// measured live on the simulation, a hint, and the explanation shown once the
// objective is met. Each challenge is checked by a test: not met at the start,
// met by a known solution.

import type { Params, Run } from '../lib/models/types';
import type { L } from '../lib/ui/ui.svelte';
import type { Netlist } from './compile';
import type { BenchDoc } from './doc';
import { lastPeriods, spectrum, stats } from './engine/harmonics';
import { benchPowerFlow } from './powerflow';
import { TEMPLATES } from './templates';

export interface GoalCtx {
  run: Run;
  p: Params;
  net: Netlist;
}

export interface Challenge {
  id: string;
  name: L;
  statement: L;
  hint: L;
  answer: L;
  /** The starting bench (the challenge id is stored in it). */
  doc: () => BenchDoc;
  /** Elements that cannot be moved, deleted or edited… */
  locked: string[];
  /** …except these parameters. */
  editable: Record<string, string[]>;
  goal: (c: GoalCtx) => { ok: boolean; status: L };
}

const from = (template: string, name: string, over: Record<string, number> = {}): (() => BenchDoc) => () => {
  const doc = TEMPLATES.find((t) => t.id === template)!.doc();
  doc.name = name;
  for (const [k, v] of Object.entries(over)) {
    const [id, q] = k.split('.');
    doc.elements.find((e) => e.id === id)!.params[q] = v;
  }
  return doc;
};
const fmt = (v: number, d = 3) => (Number.isFinite(v) ? (+v.toPrecision(d)).toString() : '—');
const both = (fr: string, en: string): L => ({ fr, en });

export const CHALLENGES: Challenge[] = [
  {
    id: 'ch-critical',
    name: both('Amortir sans dépasser', 'Damping without overshoot'),
    statement: both(
      'Le condensateur doit atteindre 95 % de sa tension finale **en moins de 6 ms**, avec **moins de 1 % de dépassement**. Seule la résistance peut changer.',
      'The capacitor must reach 95 % of its final voltage **within 6 ms**, with **less than 1 % overshoot**. Only the resistor may change.',
    ),
    hint: both('Trop peu de résistance : ça oscille. Trop : c’est lent. Cherchez l’amortissement critique, $R_c = 2\\sqrt{L/C}$.', 'Too little resistance: it rings. Too much: it is slow. Look for critical damping, $R_c = 2\\sqrt{L/C}$.'),
    answer: both(
      'L’amortissement critique $R_c = 2\\sqrt{L/C} = 20\\ \\Omega$ donne la réponse la plus rapide sans dépassement (leçon 1.2). Un peu en dessous, on gagne en rapidité au prix d’un léger dépassement ; au-dessus, la réponse ralentit.',
      'Critical damping $R_c = 2\\sqrt{L/C} = 20\\ \\Omega$ gives the fastest response without overshoot (lesson 1.2). Slightly below, you gain speed at the cost of a little overshoot; above, the response slows down.',
    ),
    doc: from('rlc-step', 'Défi : amortir'),
    locked: ['V1', 'R1', 'L1', 'C1', 'GND1'],
    editable: { R1: ['R'] },
    goal: ({ run }) => {
      const v = run.s['C1.v'], Vf = 10;
      const os = (Math.max(...v) - Vf) / Vf;
      const k95 = v.findIndex((x) => x >= 0.95 * Vf);
      const t95 = k95 >= 0 ? run.t[k95] : Infinity;
      return {
        ok: os < 0.01 && t95 < 0.006,
        status: both(`dépassement ${fmt(100 * Math.max(0, os))} % · 95 % atteint à ${fmt(t95 * 1e3)} ms`, `overshoot ${fmt(100 * Math.max(0, os))} % · 95 % reached at ${fmt(t95 * 1e3)} ms`),
      };
    },
  },
  {
    id: 'ch-thd',
    name: both('Une tension propre', 'A clean voltage'),
    statement: both(
      'La source carrée doit alimenter la charge avec une **THD inférieure à 7 %** et au moins **5 V efficaces**. Vous pouvez changer la bobine et le condensateur du filtre.',
      'The square-wave source must feed the load with a **THD below 7 %** and at least **5 V RMS**. You may change the filter’s inductor and capacitor.',
    ),
    hint: both('Placez la résonance $1/(2\\pi\\sqrt{LC})$ bien en dessous de l’harmonique 3 (150 Hz), sans écraser le fondamental à 50 Hz.', 'Put the resonance $1/(2\\pi\\sqrt{LC})$ well below the 3rd harmonic (150 Hz), without crushing the 50 Hz fundamental.'),
    answer: both(
      'Un filtre LC du second ordre atténue en $(f_0/f)^2$ au-delà de sa résonance : l’harmonique 3 est réduit de $(150/f_0)^2$. Mais près de $f_0$ le filtre amplifie : la résonance doit rester entre le fondamental et l’harmonique 3, et la charge l’amortit (leçons 2.7 et 6.4).',
      'A second-order LC filter attenuates as $(f_0/f)^2$ beyond its resonance: the 3rd harmonic is reduced by $(150/f_0)^2$. But near $f_0$ the filter amplifies: the resonance must stay between the fundamental and the 3rd harmonic, and the load damps it (lessons 2.7 and 6.4).',
    ),
    doc: from('lc-filter', 'Défi : filtrer'),
    locked: ['V1', 'L1', 'C1', 'R1', 'VM1', 'GND1'],
    editable: { L1: ['L'], C1: ['C'] },
    goal: ({ run }) => {
      const w = lastPeriods(run.t, 50);
      if (!w) return { ok: false, status: both('simulez au moins une période', 'simulate at least one period') };
      const y = run.s['VM1.v'];
      const thd = spectrum(run.t, y, 50, w).thd, rms = stats(run.t, y, w).rms;
      return { ok: thd < 0.07 && rms >= 5, status: both(`THD ${fmt(100 * thd)} % · ${fmt(rms)} V efficaces`, `THD ${fmt(100 * thd)} % · ${fmt(rms)} V RMS`) };
    },
  },
  {
    id: 'ch-buck',
    name: both('Douze volts bien lisses', 'Twelve smooth volts'),
    statement: both(
      'À partir de 48 V, obtenez **12 V ± 0,2 V** sur la charge, avec une **ondulation crête à crête inférieure à 1 %**.',
      'From 48 V, get **12 V ± 0.2 V** on the load, with a **peak-to-peak ripple below 1 %**.',
    ),
    hint: both('$V_s = D\\,V_e$ fixe la valeur moyenne ; l’ondulation baisse avec $L$, $C$ et la fréquence de découpage.', '$V_o = D\\,V_i$ sets the mean; ripple falls with $L$, $C$ and the switching frequency.'),
    answer: both(
      '$D = 12/48 = 0{,}25$ donne la moyenne. L’ondulation de tension vaut environ $\\Delta V \\approx \\frac{(1-D)V_s}{8LCf_s^2}$ : doubler $f_s$ la divise par quatre (leçon 6.1).',
      '$D = 12/48 = 0.25$ gives the mean. Voltage ripple is about $\\Delta V \\approx \\frac{(1-D)V_o}{8LCf_s^2}$: doubling $f_s$ divides it by four (lesson 6.1).',
    ),
    doc: from('buck', 'Défi : 12 V'),
    locked: ['V1', 'Q1', 'D1', 'L1', 'C1', 'R1', 'GND1'],
    editable: { Q1: ['D', 'fs'], L1: ['L'], C1: ['C'] },
    goal: ({ run }) => {
      const y = run.s['R1.v'].slice(Math.round(run.s['R1.v'].length * 0.8));
      const mean = y.reduce((a, b) => a + b, 0) / y.length, pp = Math.max(...y) - Math.min(...y);
      return { ok: Math.abs(mean - 12) <= 0.2 && pp < 0.01 * mean, status: both(`${fmt(mean)} V · ondulation ${fmt((100 * pp) / mean)} %`, `${fmt(mean)} V · ripple ${fmt((100 * pp) / mean)} %`) };
    },
  },
  {
    id: 'ch-var',
    name: both('Relever la tension du départ', 'Lifting the feeder voltage'),
    statement: both(
      'Selon la répartition de charge, la tension de la charge CH1 doit être **entre 0,98 et 1,02 pu**. Seule la batterie de condensateurs peut changer.',
      'According to the power flow, the voltage of load CH1 must be **between 0.98 and 1.02 pu**. Only the capacitor bank may change.',
    ),
    hint: both('Sur un réseau inductif, $\\Delta V \\approx (RP + XQ)/V$ : fournir du réactif sur place réduit la chute.', 'On an inductive grid, $\\Delta V \\approx (RP + XQ)/V$: supplying reactive power locally reduces the drop.'),
    answer: both(
      'Les condensateurs compensent une partie du réactif de la charge, qui n’a plus à traverser le transformateur et la ligne. Trop de condensateurs feraient dépasser la tension, surtout à faible charge (leçons 2.3 et 4.9).',
      'The capacitors offset part of the load’s reactive power, which no longer has to cross the transformer and the line. Too many would raise the voltage too high, especially at light load (lessons 2.3 and 4.9).',
    ),
    doc: from('pf-grid', 'Défi : tension'),
    locked: ['G1', 'TR1', 'LG1', 'CH1', 'BC1'],
    editable: { BC1: ['Q'] },
    goal: ({ net, p }) => {
      const pf = benchPowerFlow(net, p);
      const V = pf.buses.find((b) => b.name === 'CH1')?.V ?? NaN;
      return { ok: pf.ok && V >= 0.98 && V <= 1.02, status: both(`V(CH1) = ${fmt(V, 4)} pu`, `V(CH1) = ${fmt(V, 4)} pu`) };
    },
  },
  {
    id: 'ch-fault',
    name: both('Tenir un défaut de 300 ms', 'Riding through a 300 ms fault'),
    statement: both(
      'Le défaut dure **300 ms**. Gardez l’alternateur **synchrone** en produisant **au moins 0,7 pu**. Vous pouvez régler sa f.é.m., son régulateur de tension et son amortissement.',
      'The fault lasts **300 ms**. Keep the generator **in synchronism** while producing **at least 0.7 pu**. You may set its EMF, its voltage regulator and its damping.',
    ),
    hint: both('Le critère des aires : une f.é.m. plus élevée augmente $P_{max}$, donc l’aire de décélération disponible ; un régulateur rapide relève la tension après le défaut.', 'The equal-area criterion: a higher EMF raises $P_{max}$, hence the available decelerating area; a fast regulator lifts the voltage after the fault.'),
    answer: both(
      'L’alternateur accélère pendant le défaut ; après, il doit pouvoir rendre cette énergie. Une f.é.m. plus grande (surexcitation) agrandit l’aire de décélération et réduit l’angle de fonctionnement : le temps critique augmente (leçon 8.1).',
      'The generator accelerates during the fault; afterwards it must be able to give that energy back. A larger EMF (over-excitation) enlarges the decelerating area and lowers the operating angle: the critical clearing time increases (lesson 8.1).',
    ),
    doc: from('smib', 'Défi : défaut', { 'F1.toff': 1.3 }),
    locked: ['SM1', 'TR1', 'LG1', 'G1', 'F1'],
    editable: { SM1: ['P0', 'E0', 'KA', 'D'] },
    goal: ({ run, p }) => {
      const dmax = Math.max(...run.s['SM1.delta']), P0 = p['SM1.P0'];
      return { ok: dmax < 180 && P0 >= 0.7, status: both(`angle maximal ${fmt(dmax)}° · P = ${fmt(P0)} pu`, `maximum angle ${fmt(dmax)}° · P = ${fmt(P0)} pu`) };
    },
  },
  {
    id: 'ch-bess',
    name: both('Tenir 49,8 Hz avec la plus petite batterie', 'Holding 49.8 Hz with the smallest battery'),
    statement: both(
      'Après l’enclenchement de la charge, la fréquence ne doit pas descendre **sous 49,8 Hz**, avec une batterie **d’au plus 1,5 MVA**. Réglez sa taille, son statisme ou passez-la en FFR.',
      'After the load is switched in, the frequency must not fall **below 49.8 Hz**, with a battery **of at most 1.5 MVA**. Set its size, its droop, or switch it to FFR.',
    ),
    hint: both('Le creux se joue dans les premières secondes : une réponse forte et rapide compte plus qu’une grande batterie.', 'The nadir is decided in the first seconds: a strong, fast response matters more than a large battery.'),
    answer: both(
      'La chute initiale dépend de l’inertie, le creux de la vitesse de la réserve. Une batterie qui répond dès les premiers dixièmes de hertz (statisme serré ou FFR) compense la charge avant que le régulateur de l’alternateur n’agisse (leçons 7.5 et 8.4).',
      'The initial fall depends on inertia, the nadir on how fast reserve arrives. A battery responding from the first tenths of a hertz (tight droop or FFR) covers the load before the generator’s governor acts (lessons 7.5 and 8.4).',
    ),
    doc: from('bess-ffr', 'Défi : fréquence', { 'BAT1.Sn': 1.5e6, 'BAT1.R': 0.05 }),
    locked: ['SM1', 'CH1', 'DJ1', 'CH2', 'BAT1'],
    editable: { BAT1: ['Sn', 'R', 'ffr', 'fthr'] },
    goal: ({ run, p }) => {
      const k = run.t.findIndex((t) => t > 1);
      const fmin = Math.min(...run.s['SM1.f'].slice(k)), Sn = p['BAT1.Sn'];
      return { ok: fmin >= 49.8 && Sn <= 1.5e6 + 1, status: both(`f min = ${fmt(fmin, 5)} Hz · batterie ${fmt(Sn / 1e6)} MVA`, `f min = ${fmt(fmin, 5)} Hz · battery ${fmt(Sn / 1e6)} MVA`) };
    },
  },
  {
    id: 'ch-petersen',
    name: both('Accorder la bobine de Petersen', 'Tuning the Petersen coil'),
    statement: both(
      'Le neutre HTA est mis à la terre par une **bobine** (neutre compensé). Réglez son inductance pour que le courant d’un défaut a–terre franc tombe **sous 40 A** : l’arc s’éteindra seul.',
      'The MV neutral is earthed through a **coil** (compensated neutral). Set its inductance so that the current of a solid a–earth fault falls **below 40 A**: the arc will go out on its own.',
    ),
    hint: both(
      'La bobine doit compenser le courant capacitif des câbles : $\\frac{1}{\\omega L} = 3\\omega C$, avec $C$ la capacité d’une phase de tout le réseau (60 km × 250 nF/km).',
      'The coil must cancel the cables’ capacitive current: $\\frac{1}{\\omega L} = 3\\omega C$, with $C$ one phase’s capacitance for the whole network (60 km × 250 nF/km).',
    ),
    answer: both(
      'Avec $C = 15\\ \\mu$F par phase, l’accord est $L = 1/(3\\omega^2 C) \\approx 0{,}23$ H : le courant inductif de la bobine annule les 163 A capacitifs, et il ne reste que la composante active (pertes). Un désaccord de quelques pour cent suffit à faire remonter le courant : la bobine doit suivre l’évolution du réseau (leçon 10.3).',
      'With $C = 15\\ \\mu$F per phase, tuning is $L = 1/(3\\omega^2 C) \\approx 0.23$ H: the coil’s inductive current cancels the 163 A of capacitive current, leaving only the active component (losses). A few per cent of detuning is enough to raise the current again: the coil must follow changes in the network (lesson 10.3).',
    ),
    doc: () => {
      const doc = TEMPLATES.find((t) => t.id === 'mv-neutral')!.doc();
      doc.name = 'Défi : neutre compensé';
      const rn = doc.elements.find((e) => e.id === 'RN')!;
      rn.id = 'LN';
      rn.type = 'L';
      rn.params = { L: 0.5 };
      for (const wr of doc.wires) for (const end of [wr.a, wr.b]) if (end.el === 'RN') end.el = 'LN';
      return doc;
    },
    locked: ['G1', 'TS1', 'LN', 'GND1', 'P1', 'LG1', 'CH1', 'F1', 'P2', 'LG2', 'CH2'],
    editable: { LN: ['L'] },
    goal: ({ run }) => {
      const t = run.t, y = run.s['F1.ia'], T = t[t.length - 1];
      let s = 0, n = 0;
      t.forEach((x, k) => {
        if (x > T - 0.04) (s += y[k] * y[k]), n++;
      });
      const I = Math.sqrt(s / Math.max(1, n));
      return { ok: I < 40, status: both(`courant de défaut ${fmt(I)} A (efficace)`, `fault current ${fmt(I)} A (RMS)`) };
    },
  },
  {
    id: 'ch-grading',
    name: both('Couper le bon départ', 'Tripping the right feeder'),
    statement: both(
      'Un défaut biphasé fugitif en bout de départ : c’est l’**arrivée** (P0, 0,7 s) qui coupe tout le poste. Réglez la protection du **départ** (P1) pour qu’elle élimine le défaut seule, sans que l’arrivée ne s’ouvre, et que les clients soient **réalimentés** à la fin.',
      'A transient phase-to-phase fault at the end of the feeder: the **incomer** (P0, 0.7 s) trips the whole substation. Set the **feeder** relay (P1) so it clears the fault alone, without the incomer opening, and customers are **restored** by the end.',
    ),
    hint: both(
      'Le départ doit être plus rapide que l’arrivée d’au moins 0,3 s, et un réenclenchement rapide referme après la disparition d’un défaut fugitif.',
      'The feeder must be faster than the incomer by at least 0.3 s, and rapid reclosing closes again once a transient fault has gone.',
    ),
    answer: both(
      'Avec $t_d \\le 0{,}4$ s, le départ s’ouvre avant que la temporisation de l’arrivée (0,7 s) n’expire : la sélectivité chronométrique est respectée. Le réenclenchement rapide (0,3 s) referme une fois le défaut disparu, et les clients ne subissent qu’une coupure brève (leçon 10.4).',
      'With $t_d \\le 0.4$ s, the feeder opens before the incomer’s delay (0.7 s) runs out: time grading holds. Rapid reclosing (0.3 s) closes again once the fault has gone, and customers see only a short interruption (lesson 10.4).',
    ),
    doc: from('mv-protection', 'Défi : sélectivité', { 'P1.td': 0.8, 'P1.reclose': 0, 'F1.toff': 1.2 }),
    locked: ['G1', 'TS1', 'RN', 'GND1', 'P0', 'P1', 'LG1', 'CH1', 'F1'],
    editable: { P1: ['Is', 'td', 'reclose'] },
    goal: ({ run }) => {
      const p0 = run.s['P0.etat'], p1 = run.s['P1.etat'];
      const incomer = Math.min(...p0) > 0.5, tripped = Math.min(...p1) < 0.5, restored = p1[p1.length - 1] > 0.5 && p0[p0.length - 1] > 0.5;
      return {
        ok: incomer && tripped && restored,
        status: both(
          `arrivée ${incomer ? 'restée fermée' : 'ouverte'} · départ ${tripped ? 'déclenché' : 'pas déclenché'} · ${restored ? 'clients réalimentés' : 'clients coupés'}`,
          `incomer ${incomer ? 'stayed closed' : 'opened'} · feeder ${tripped ? 'tripped' : 'did not trip'} · ${restored ? 'customers restored' : 'customers off'}`,
        ),
      };
    },
  },
];

export const challengeOf = (id: string | undefined) => CHALLENGES.find((c) => c.id === id);
