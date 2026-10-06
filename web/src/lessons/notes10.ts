// Teaching notes for Module 10 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module10Note: ModuleNote = {
  summary: {
    fr: 'Le métier du gestionnaire du réseau de distribution (GRD), vu à travers Enedis : des postes sources HTB/HTA, des départs HTA bouclés mais exploités en radial, des postes HTA/BT et la basse tension jusqu’au compteur. Plan de tension, régimes de neutre et 3I0, plan de protection, secours et flexibilités. Les chiffres sont des ordres de grandeur pédagogiques, relus en octobre 2026 face aux publications d’Enedis (sources dans la documentation).',
    en: 'The job of the distribution system operator (DSO), seen through Enedis: HV/MV primary substations, MV feeders built in loops but run radially, MV/LV substations and low voltage down to the meter. Voltage plan, neutral earthing and 3I0, protection plan, back-up and flexibility. Figures are teaching orders of magnitude, reviewed in October 2026 against Enedis publications (sources in the documentation).',
  },
  objective: {
    fr: 'Comprendre les contraintes propres à la distribution et les choix d’exploitation et de planification d’un GRD.',
    en: 'Understand the constraints specific to distribution and the operating and planning choices of a DSO.',
  },
  path: {
    fr: '10.1 architecture et boucle HTA → 10.2 plan de tension → 10.3 régimes de neutre et 3I0 → 10.4 plan de protection → 10.5 flexibilité et planification.',
    en: '10.1 architecture and MV loop → 10.2 voltage plan → 10.3 neutral earthing and 3I0 → 10.4 protection plan → 10.5 flexibility and planning.',
  },
};

export const module10Notes: Record<string, LessonNote> = {
  '10.1': {
    summary: {
      fr: 'Un réseau HTA est construit en boucles entre postes sources mais exploité ouvert : le point d’ouverture partage la charge, et en cas de défaut on isole le tronçon et on referme ce point pour réalimenter.',
      en: 'An MV network is built in loops between primary substations but run open: the open point shares the load, and after a fault the section is isolated and the open point closed to restore supply.',
    },
    objective: {
      fr: 'Placer un point d’ouverture, comprendre le secours par la boucle et ses limites.',
      en: 'Place an open point, understand back-feeding through the loop and its limits.',
    },
    formulas: [
      { tex: r`\Delta V_k = \sum_{j \le k} \frac{R_j P_j + X_j Q_j}{U^2}`, meaning: { fr: 'La chute cumulée le long d’un départ radial.', en: 'The drop accumulated along a radial feeder.' } },
      { tex: r`I = \frac{P}{\sqrt3\,U\cos\varphi} \le I_{adm}`, meaning: { fr: 'La limite thermique d’un tronçon.', en: 'A section’s thermal limit.' } },
    ],
    exercises: [
      { fr: 'Équilibrer la boucle par le point d’ouverture.', en: 'Balance the loop with the open point.' },
      { fr: 'Comparer aérien et souterrain.', en: 'Compare overhead and underground.' },
      { fr: 'Voir les clients coupés par un défaut.', en: 'See the customers cut off by a fault.' },
      { fr: 'Réalimenter par l’autre poste.', en: 'Restore supply from the other substation.' },
      { fr: 'Trouver la charge maximale secourable.', en: 'Find the largest load that can be back-fed.' },
    ],
    tests: [
      { what: { fr: 'Le point d’ouverture optimal est au milieu et bat nettement le réglage initial.', en: 'The optimal open point is in the middle and clearly beats the initial setting.' }, why: { fr: 'Vérifie l’étape 1.', en: 'Checks step 1.' } },
      { what: { fr: 'L’aérien fait presque doubler la chute ; un défaut au tronçon 2 coupe 8 postes que le secours réalimente.', en: 'Overhead nearly doubles the drop; a fault on section 2 cuts 8 substations that back-feeding restores.' }, why: { fr: 'Vérifie les étapes 2 à 4.', en: 'Checks steps 2 to 4.' } },
      { what: { fr: 'Le secours tient à 130 % de charge, pas à 140 %.', en: 'Back-feeding holds at 130 % load, not 140 %.' }, why: { fr: 'Vérifie l’étape 5.', en: 'Checks step 5.' } },
    ],
  },
  '10.2': {
    summary: {
      fr: 'Le plan de tension partage la plage ±10 % du client BT entre chute HTA, prise fixe du transformateur HTA/BT et chute BT. Le PV inverse les transits et fait monter la tension ; compoundage et réactif des producteurs aident à la tenir.',
      en: 'The voltage plan shares the LV customer’s ±10 % range between MV drop, the MV/LV transformer’s fixed tap and LV drop. PV reverses flows and raises the voltage; line-drop compensation and producers’ reactive power help hold it.',
    },
    objective: {
      fr: 'Construire un budget de tension et tenir la plage avec du PV.',
      en: 'Build a voltage budget and hold the range with PV.',
    },
    formulas: [
      { tex: r`V_{BT} = V_{PS} - \Delta V_{HTA} + n_{BT} - \Delta V_{tr} - \Delta V_{BT}`, meaning: { fr: 'Le budget de tension du poste source au client.', en: 'The voltage budget from the substation to the customer.' } },
      { tex: r`V_{PS} = V_c + k_c\,P_{net}/P_{max}`, meaning: { fr: 'Le compoundage du régleur du poste source.', en: 'Line-drop compensation at the primary substation.' } },
    ],
    exercises: [
      { fr: 'Tenir la pointe d’hiver avec la prise du transformateur HTA/BT.', en: 'Hold the winter peak with the MV/LV transformer tap.' },
      { fr: 'Voir la surtension due au PV.', en: 'See the overvoltage caused by PV.' },
      { fr: 'Mesurer l’effet limité de tan φ.', en: 'Measure the limited effect of tan φ.' },
      { fr: 'Tenir la plage avec le compoundage.', en: 'Hold the range with line-drop compensation.' },
      { fr: 'Remplacer tan φ par Q(U).', en: 'Replace tan φ with Q(U).' },
    ],
    tests: [
      { what: { fr: 'Sans PV, le dernier client passe sous 90 % ; +2,5 % de prise corrige.', en: 'Without PV the last customer falls below 90 %; a +2.5 % tap fixes it.' }, why: { fr: 'Vérifie l’étape 1.', en: 'Checks step 1.' } },
      { what: { fr: '10 MW de PV dépassent 110 % ; tan φ seul ne suffit pas ; le transit s’inverse à midi.', en: '10 MW of PV exceeds 110 %; tan φ alone is not enough; the flow reverses at noon.' }, why: { fr: 'Vérifie les étapes 2 et 3.', en: 'Checks steps 2 and 3.' } },
      { what: { fr: 'Le compoundage tient la plage ; Q(U) le fait avec moins de la moitié du réactif.', en: 'Line-drop compensation holds the range; Q(U) does it with less than half the reactive energy.' }, why: { fr: 'Vérifie les étapes 4 et 5.', en: 'Checks steps 4 and 5.' } },
    ],
  },
  '10.3': {
    summary: {
      fr: 'Lors d’un défaut à la terre en HTA, le régime de neutre fixe le courant de défaut et ce que voient les protections. Les câbles souterrains, très capacitifs, compliquent tout : déclenchements intempestifs, arcs entretenus, d’où le neutre compensé et les protections wattmétriques.',
      en: 'In an MV earth fault, neutral earthing sets the fault current and what protection sees. Underground cables, highly capacitive, complicate everything: wrong trips, sustained arcs, hence compensated neutrals and wattmetric relays.',
    },
    objective: {
      fr: 'Calculer un courant de défaut à la terre et régler une protection de terre sélective.',
      en: 'Compute an earth-fault current and set a selective earth-fault relay.',
    },
    formulas: [
      { tex: r`\underline V_N = -\frac{\underline E/R_d}{Y_N + 3j\omega C + 1/R_d}`, meaning: { fr: 'Le déplacement du point neutre pendant le défaut.', en: 'The neutral displacement during the fault.' } },
      { tex: r`3I_0^{sain} = 3\omega C_s V_N`, meaning: { fr: 'Le courant résiduel vu par un départ sain : son propre courant capacitif.', en: 'The residual current seen by a healthy feeder: its own capacitive current.' } },
      { tex: r`P_0 = \Re\{3\underline V_0\underline I_0^*\}`, meaning: { fr: 'La puissance résiduelle mesurée par la protection wattmétrique.', en: 'The residual power measured by the wattmetric relay.' } },
    ],
    exercises: [
      { fr: 'Voir le courant capacitif d’un réseau câblé à neutre isolé.', en: 'See the capacitive current of a cabled network with an isolated neutral.' },
      { fr: 'Régler un seuil sélectif en neutre impédant.', en: 'Set a selective threshold with a resistance-earthed neutral.' },
      { fr: 'Voir un défaut résistant échapper à la protection.', en: 'See a high-resistance fault escape protection.' },
      { fr: 'Accorder la bobine de Petersen.', en: 'Tune the Petersen coil.' },
      { fr: 'Rendre la protection sélective en neutre compensé.', en: 'Make protection selective with a compensated neutral.' },
    ],
    tests: [
      { what: { fr: 'En neutre isolé, le courant de défaut égale le courant capacitif (environ 3 A/km de câble) et les phases saines montent à √3.', en: 'With an isolated neutral, the fault current equals the capacitive current (about 3 A/km of cable) and healthy phases rise to √3.' }, why: { fr: 'Vérifie la physique de base.', en: 'Checks the basic physics.' } },
      { what: { fr: 'En neutre impédant, 40 A déclenche le départ sain, 150 A est sélectif ; 500 Ω échappe.', en: 'Resistance-earthed: 40 A trips the healthy feeder, 150 A is selective; 500 Ω escapes.' }, why: { fr: 'Vérifie les étapes 2 et 3.', en: 'Checks steps 2 and 3.' } },
      { what: { fr: 'Bobine accordée : moins de 50 A ; désaccord de 20 % : plus de 100 A ; seule la wattmétrique est sélective.', en: 'Tuned coil: under 50 A; 20 % detuning: over 100 A; only the wattmetric relay is selective.' }, why: { fr: 'Vérifie les étapes 4 et 5.', en: 'Checks steps 4 and 5.' } },
    ],
  },
  '10.4': {
    summary: {
      fr: 'Une protection de départ HTA doit voir le plus petit défaut sans déclencher sur la charge, agir avant l’arrivée du transformateur, et réenclencher pour éliminer les défauts fugitifs.',
      en: 'An MV feeder relay must see the smallest fault without tripping on load, act before the transformer incomer, and reclose to clear transient faults.',
    },
    objective: {
      fr: 'Régler un seuil, une temporisation et un cycle de réenclenchement.',
      en: 'Set a threshold, a time delay and a reclosing cycle.',
    },
    formulas: [
      { tex: r`1{,}3\,I_{ch} \le I_s \le 0{,}8\,I_{cc,bi}^{fin}`, meaning: { fr: 'La fenêtre de réglage du seuil de phase.', en: 'The phase threshold’s setting window.' } },
      { tex: r`t_d + \Delta t \le t_{arrivée}`, meaning: { fr: 'La sélectivité chronométrique.', en: 'Time grading.' } },
    ],
    exercises: [
      { fr: 'Placer le seuil dans la fenêtre.', en: 'Put the threshold in the window.' },
      { fr: 'Éliminer un défaut en bout de départ.', en: 'Clear a fault at the end of the feeder.' },
      { fr: 'Régler la sélectivité avec l’arrivée.', en: 'Grade with the incomer.' },
      { fr: 'Éliminer un défaut fugitif par réenclenchement.', en: 'Clear a transient fault by reclosing.' },
      { fr: 'Voir le verrouillage sur défaut permanent.', en: 'See lockout on a permanent fault.' },
    ],
    tests: [
      { what: { fr: 'Le biphasé vaut √3/2 du triphasé et décroît le long du départ.', en: 'The phase-to-phase fault is √3/2 of the three-phase one and falls along the feeder.' }, why: { fr: 'Vérifie le calcul de court-circuit.', en: 'Checks the short-circuit computation.' } },
      { what: { fr: '1 200 A : défaut de bout vu par l’arrivée ; 400 A et 0,4 s : réglé, sélectif, vu par le départ.', en: '1,200 A: end fault seen by the incomer; 400 A and 0.4 s: set, graded, seen by the feeder.' }, why: { fr: 'Vérifie les étapes 1 à 3.', en: 'Checks steps 1 to 3.' } },
      { what: { fr: 'Fugitif : un seul déclenchement puis réalimentation ; permanent : trois déclenchements et verrouillage.', en: 'Transient: one trip, then restored; permanent: three trips and lockout.' }, why: { fr: 'Vérifie les étapes 4 et 5.', en: 'Checks steps 4 and 5.' } },
    ],
  },
  '10.5': {
    summary: {
      fr: 'Un poste source doit tenir sa pointe avec un transformateur en panne. Quand la croissance menace ce N-1, le GRD peut reporter le renforcement grâce au secours HTA ou à la flexibilité locale, si c’est rentable.',
      en: 'A primary substation must carry its peak with one transformer out. When growth threatens this N-1, the DSO can defer reinforcement with MV back-up or local flexibility, if it pays.',
    },
    objective: {
      fr: 'Dater une contrainte N-1 et comparer renforcement et flexibilité.',
      en: 'Date an N-1 constraint and compare reinforcement with flexibility.',
    },
    formulas: [
      { tex: r`P_{N-1} = S_{tr}\,k\cos\varphi + P_{sec}`, meaning: { fr: 'La capacité garantie du poste.', en: 'The substation’s firm capacity.' } },
      { tex: r`V = C\left[(1+r)^{-a_0} - (1+r)^{-(a_0+\Delta a)}\right]`, meaning: { fr: 'La valeur actualisée d’un report d’investissement.', en: 'The discounted value of deferring an investment.' } },
    ],
    exercises: [
      { fr: 'Trouver l’année de la contrainte N-1.', en: 'Find the year of the N-1 constraint.' },
      { fr: 'Reporter par le secours HTA.', en: 'Defer with MV back-up.' },
      { fr: 'Reporter par la flexibilité.', en: 'Defer with flexibility.' },
      { fr: 'Trouver le prix de rentabilité de la flexibilité.', en: 'Find the price at which flexibility pays.' },
      { fr: 'Voir l’effet de l’électrification.', en: 'See the effect of electrification.' },
    ],
    tests: [
      { what: { fr: 'La contrainte arrive vers 9,5 ans à 2 %/an ; 5 MW de secours la repoussent au-delà de 14 ans.', en: 'The constraint arrives at about 9.5 years at 2 %/yr; 5 MW of back-up pushes it beyond 14 years.' }, why: { fr: 'Vérifie les étapes 1 et 2.', en: 'Checks steps 1 and 2.' } },
      { what: { fr: '3 MW de flexibilité reportent de plus de 3 ans ; rentable à 20 k€/MW/an, pas à 50 ; moins de 2 ans à 4 %/an.', en: '3 MW of flexibility defers by over 3 years; it pays at 20 k€/MW/yr, not 50; under 2 years at 4 %/yr.' }, why: { fr: 'Vérifie les étapes 3 à 5.', en: 'Checks steps 3 to 5.' } },
    ],
  },
};
