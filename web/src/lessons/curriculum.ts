// The course map, from plan.md §5. Lessons without an experiment are listed as coming soon.

import type { Experiment } from '../lib/lab/types';
import type { L } from '../lib/ui/ui.svelte';
import { acRms } from './ac-rms/experiment';
import { compLesson } from './comp/experiment';
import { factsLesson } from './facts/experiment';
import { lineLesson } from './line/experiment';
import { loadsLesson } from './loads/experiment';
import { loadExpLesson } from './loadexp/experiment';
import { oltcLesson } from './oltc/experiment';
import { smDynLesson } from './smdyn/experiment';
import { motorLesson } from './motor/experiment';
import { smLesson } from './sm/experiment';
import { trafoLesson } from './trafo/experiment';
import { pflowLesson } from './pflow/experiment';
import { pvLesson } from './pv/experiment';
import { faultsLesson } from './faults/experiment';
import { dispatchLesson } from './dispatch/experiment';
import { feederLesson } from './feeder/experiment';
import { chopperLesson } from './chopper/experiment';
import { rectifierLesson } from './rectifier/experiment';
import { pwmLesson } from './pwm/experiment';
import { lclLesson } from './lcl/experiment';
import { vscLesson } from './vsc/experiment';
import { gfmLesson } from './gfm/experiment';
import { pvmpptLesson } from './pvmppt/experiment';
import { windLesson } from './wind/experiment';
import { bessLesson } from './bess/experiment';
import { mmcLesson } from './mmc/experiment';
import { frtLesson } from './frt/experiment';
import { eacLesson } from './eac/experiment';
import { pssLesson } from './pss/experiment';
import { ltvsLesson } from './ltvs/experiment';
import { fsysLesson } from './fsys/experiment';
import { cdsLesson } from './cds/experiment';
import { ssrLesson } from './ssr/experiment';
import { g2Lesson } from './g2/experiment';
import { modesLesson } from './modes/experiment';
import { reductionLesson } from './reduction/experiment';
import { blackoutLesson } from './blackout/experiment';
import { dayLesson } from './day/experiment';
import { dcAcLesson } from './dc-ac/experiment';
import { energyLesson } from './energy/experiment';
import { loopLesson } from './loop/experiment';
import { pllLesson } from './pll/experiment';
import { polesLesson } from './poles/experiment';
import { swingLesson } from './swing/experiment';
import { euler } from './euler/experiment';
import { fourierLesson } from './fourier/experiment';
import { impedanceLesson } from './impedance/experiment';
import { parkLesson } from './park/experiment';
import { perUnitLesson } from './per-unit/experiment';
import { sequencesLesson } from './sequences/experiment';
import { powerLesson } from './power/experiment';
import { threePhaseLesson } from './three-phase/experiment';
import { resonance } from './resonance/experiment';
import { rlcStep } from './rlc-step/experiment';
import { levelsLesson } from './levels/experiment';
import { balancingLesson } from './balancing/experiment';
import { n1Lesson } from './n1/experiment';
import { vplanLesson } from './vplan/experiment';
import { defenceLesson } from './defence/experiment';
import { connectLesson } from './connect/experiment';
import { pssG2Lesson } from './pssg2/experiment';
import { ibrRedLesson } from './ibrred/experiment';
import { htaLesson } from './hta/experiment';
import { dvplanLesson } from './dvplan/experiment';
import { neutralLesson } from './neutral/experiment';
import { protectionLesson } from './protection/experiment';
import { planningLesson } from './planning/experiment';

export interface LessonEntry {
  id: string;
  title: L;
  experiment?: Experiment;
}

export interface ModuleEntry {
  n: number;
  title: L;
  lessons: LessonEntry[];
}

const soon = (id: string, fr: string, en: string): LessonEntry => ({ id, title: { fr, en } });

export const curriculum: ModuleEntry[] = [
  {
    n: 0,
    title: { fr: 'Le réseau en 10 minutes', en: 'The grid in 10 minutes' },
    lessons: [
      { id: '0.1', title: { fr: 'De la turbine à la prise', en: 'From turbine to socket' }, experiment: dayLesson },
      { id: '0.2', title: { fr: 'Rejouer un blackout', en: 'Replay a blackout' }, experiment: blackoutLesson },
    ],
  },
  {
    n: 1,
    title: { fr: 'Circuits, continu et alternatif', en: 'Circuits, DC vs AC' },
    lessons: [
      { id: '1.1', title: { fr: 'R, L, C : éléments d’énergie', en: 'R, L, C as energy elements' }, experiment: energyLesson },
      { id: '1.2', title: { fr: 'Régimes transitoires RLC', en: 'RLC transients' }, experiment: rlcStep },
      { id: '1.3', title: { fr: 'Sources alternatives, valeur efficace', en: 'AC sources and RMS' }, experiment: acRms },
      { id: '1.4', title: { fr: 'Résonance', en: 'Resonance' }, experiment: resonance },
      { id: '1.5', title: { fr: 'Continu contre alternatif', en: 'DC versus AC' }, experiment: dcAcLesson },
    ],
  },
  {
    n: 2,
    title: { fr: 'La boîte à outils de l’alternatif', en: 'The AC toolbox' },
    lessons: [
      { id: '2.1', title: { fr: 'Euler et le vecteur tournant', en: 'Euler and the rotating vector' }, experiment: euler },
      { id: '2.2', title: { fr: 'Phaseurs et impédance', en: 'Phasors and impedance' }, experiment: impedanceLesson },
      { id: '2.3', title: { fr: 'Puissances P, Q, S', en: 'AC power: P, Q, S' }, experiment: powerLesson },
      { id: '2.4', title: { fr: 'Systèmes triphasés', en: 'Three-phase systems' }, experiment: threePhaseLesson },
      { id: '2.5', title: { fr: 'Clarke et Park', en: 'Clarke and Park' }, experiment: parkLesson },
      { id: '2.6', title: { fr: 'Système per-unit', en: 'Per-unit system' }, experiment: perUnitLesson },
      { id: '2.7', title: { fr: 'Harmoniques et Fourier', en: 'Harmonics and Fourier' }, experiment: fourierLesson },
      { id: '2.8', title: { fr: 'Composantes symétriques', en: 'Symmetrical components' }, experiment: sequencesLesson },
    ],
  },
  {
    n: 3,
    title: { fr: 'Signaux et commande', en: 'Signals & control' },
    lessons: [
      { id: '3.1', title: { fr: 'Laplace, pôles et zéros', en: 'Laplace, poles and zeros' }, experiment: polesLesson },
      { id: '3.2', title: { fr: 'Bode et Nyquist', en: 'Bode and Nyquist' }, experiment: loopLesson },
      { id: '3.3', title: { fr: 'Espace d’état et linéarisation', en: 'State space and linearisation' }, experiment: swingLesson },
      { id: '3.4', title: { fr: 'Régulateur PI, PLL', en: 'PI control, PLL' }, experiment: pllLesson },
    ],
  },
  {
    n: 4,
    title: { fr: 'Éléments conventionnels', en: 'Conventional elements' },
    lessons: [
      { id: '4.1', title: { fr: 'Lignes', en: 'Lines' }, experiment: lineLesson },
      { id: '4.2', title: { fr: 'Transformateur : appel et rendement', en: 'Transformer: inrush and efficiency' }, experiment: trafoLesson },
      { id: '4.3', title: { fr: 'Transformateur : régleur, déphaseur, couplages', en: 'Transformer: taps, phase shifter, vector groups' }, experiment: oltcLesson },
      { id: '4.4', title: { fr: 'Machine synchrone : court-circuit et capabilité', en: 'Synchronous machine: short circuit and capability' }, experiment: smLesson },
      { id: '4.5', title: { fr: 'Machine synchrone : modèles et régulations', en: 'Synchronous machine: models and controls' }, experiment: smDynLesson },
      { id: '4.6', title: { fr: 'Charges : ZIP et rétablissement', en: 'Loads: ZIP and recovery' }, experiment: loadsLesson },
      { id: '4.7', title: { fr: 'Charges : exponentiel et fréquence', en: 'Loads: exponential and frequency' }, experiment: loadExpLesson },
      { id: '4.8', title: { fr: 'Machine asynchrone', en: 'Induction motor' }, experiment: motorLesson },
      { id: '4.9', title: { fr: 'Compensation', en: 'Compensation' }, experiment: compLesson },
      { id: '4.10', title: { fr: 'FACTS', en: 'FACTS' }, experiment: factsLesson },
    ],
  },
  {
    n: 5,
    title: { fr: 'Le réseau en régime permanent', en: 'The network in steady state' },
    lessons: [
      { id: '5.1', title: { fr: 'Matrice Y et répartition de charge', en: 'Y-bus and power flow' }, experiment: pflowLesson },
      { id: '5.2', title: { fr: 'Courbes P–V, Q–V', en: 'P–V and Q–V curves' }, experiment: pvLesson },
      { id: '5.3', title: { fr: 'Défauts et courts-circuits', en: 'Faults and short circuits' }, experiment: faultsLesson },
      { id: '5.4', title: { fr: 'Dispatching économique', en: 'Economic dispatch' }, experiment: dispatchLesson },
      { id: '5.5', title: { fr: 'Une journée sur un départ', en: 'A day on a feeder' }, experiment: feederLesson },
    ],
  },
  {
    n: 6,
    title: { fr: 'Électronique de puissance', en: 'Power electronics' },
    lessons: [
      { id: '6.1', title: { fr: 'Hacheurs', en: 'Choppers' }, experiment: chopperLesson },
      { id: '6.2', title: { fr: 'Redresseurs', en: 'Rectifiers' }, experiment: rectifierLesson },
      { id: '6.3', title: { fr: 'MLI', en: 'PWM' }, experiment: pwmLesson },
      { id: '6.4', title: { fr: 'Modèles moyens, filtres LCL', en: 'Averaging, LCL filters' }, experiment: lclLesson },
    ],
  },
  {
    n: 7,
    title: { fr: 'Ressources à onduleurs et CCHT', en: 'Inverter-based resources and HVDC' },
    lessons: [
      { id: '7.1', title: { fr: 'Commande des VSC', en: 'VSC control' }, experiment: vscLesson },
      { id: '7.2', title: { fr: 'Suiveur ou formeur de réseau', en: 'Grid-following vs grid-forming' }, experiment: gfmLesson },
      { id: '7.3', title: { fr: 'Photovoltaïque', en: 'PV' }, experiment: pvmpptLesson },
      { id: '7.4', title: { fr: 'Éolien', en: 'Wind' }, experiment: windLesson },
      { id: '7.5', title: { fr: 'Stockage', en: 'Storage' }, experiment: bessLesson },
      { id: '7.6', title: { fr: 'CCHT et MMC', en: 'HVDC and MMC' }, experiment: mmcLesson },
      { id: '7.7', title: { fr: 'Codes de réseau', en: 'Grid codes' }, experiment: frtLesson },
    ],
  },
  {
    n: 8,
    title: { fr: 'Stabilité des réseaux', en: 'Power system stability' },
    lessons: [
      { id: '8.1', title: { fr: 'Stabilité transitoire', en: 'Transient stability' }, experiment: eacLesson },
      { id: '8.2', title: { fr: 'Stabilité aux petits signaux', en: 'Small-signal stability' }, experiment: pssLesson },
      { id: '8.3', title: { fr: 'Stabilité de tension', en: 'Voltage stability' }, experiment: ltvsLesson },
      { id: '8.4', title: { fr: 'Stabilité de fréquence', en: 'Frequency stability' }, experiment: fsysLesson },
      { id: '8.5', title: { fr: 'Stabilité liée aux convertisseurs', en: 'Converter-driven stability' }, experiment: cdsLesson },
      { id: '8.6', title: { fr: 'Résonances', en: 'Resonance stability' }, experiment: ssrLesson },
      { id: '8.7', title: { fr: 'Oscillations inter-zones', en: 'Inter-area oscillations' }, experiment: g2Lesson },
      { id: '8.8', title: { fr: 'Modes et participations', en: 'Modes and participation' }, experiment: modesLesson },
      { id: '8.9', title: { fr: 'Réduction de modèles', en: 'Model reduction' }, experiment: reductionLesson },
      { id: '8.10', title: { fr: 'Régler des PSS (G2ELin)', en: 'Tuning PSSs (G2ELin)' }, experiment: pssG2Lesson },
      { id: '8.11', title: { fr: 'Réduire un convertisseur (G2ELin)', en: 'Reducing a converter (G2ELin)' }, experiment: ibrRedLesson },
    ],
  },
  {
    n: 9,
    title: { fr: 'Le gestionnaire du réseau de transport (GRT)', en: 'The transmission system operator (TSO)' },
    lessons: [
      { id: '9.1', title: { fr: 'Niveaux de tension et ordres de grandeur', en: 'Voltage levels and orders of magnitude' }, experiment: levelsLesson },
      { id: '9.2', title: { fr: 'Équilibre et réglages de fréquence', en: 'Balancing and frequency control' }, experiment: balancingLesson },
      { id: '9.3', title: { fr: 'Sécurité N-1 et parades', en: 'N-1 security and remedial actions' }, experiment: n1Lesson },
      { id: '9.4', title: { fr: 'Le plan de tension du transport', en: 'The transmission voltage plan' }, experiment: vplanLesson },
      { id: '9.5', title: { fr: 'Stabilité et plan de défense', en: 'Stability and the defence plan' }, experiment: defenceLesson },
      { id: '9.6', title: { fr: 'Études de raccordement', en: 'Connection studies' }, experiment: connectLesson },
    ],
  },
  {
    n: 10,
    title: { fr: 'Le gestionnaire du réseau de distribution (GRD)', en: 'The distribution system operator (DSO)' },
    lessons: [
      { id: '10.1', title: { fr: 'Architecture : la boucle HTA', en: 'Architecture: the MV loop' }, experiment: htaLesson },
      { id: '10.2', title: { fr: 'Le plan de tension', en: 'The voltage plan' }, experiment: dvplanLesson },
      { id: '10.3', title: { fr: 'Régimes de neutre et 3I0', en: 'Neutral earthing and 3I0' }, experiment: neutralLesson },
      { id: '10.4', title: { fr: 'Le plan de protection HTA', en: 'The MV protection plan' }, experiment: protectionLesson },
      { id: '10.5', title: { fr: 'Flexibilité et planification', en: 'Flexibility and planning' }, experiment: planningLesson },
    ],
  },
];

/** Lessons that can be opened, in course order. */
export const lessons = curriculum.flatMap((m) => m.lessons.filter((l) => l.experiment));
