// Teaching notes for Module 8 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module8Note: ModuleNote = {
  summary: {
    fr: 'Un réseau est stable s’il retrouve un état acceptable après une perturbation. Selon ce qui décroche — l’angle des rotors, la tension, la fréquence, les commandes des onduleurs ou une résonance — on parle de différentes stabilités : c’est la classification IEEE/CIGRE de 2020.',
    en: 'A grid is stable if it returns to an acceptable state after a disturbance. Depending on what gives way — rotor angles, voltage, frequency, inverter controls or a resonance — we speak of different stabilities: this is the 2020 IEEE/CIGRE classification.',
  },
  objective: {
    fr: 'Reconnaître chaque type d’instabilité, son échelle de temps et son mécanisme, savoir le mesurer (temps critique, amortissement, nadir, SCR minimal…) et connaître les parades.',
    en: 'Recognise each type of instability, its time scale and mechanism, know how to measure it (critical time, damping, nadir, minimum SCR…) and know the countermeasures.',
  },
  path: {
    fr: '8.1 transitoire → 8.2 petits signaux → 8.3 tension → 8.4 fréquence → 8.5 convertisseurs → 8.6 résonance → 8.7 réseaux réels avec G2ELin.',
    en: '8.1 transient → 8.2 small-signal → 8.3 voltage → 8.4 frequency → 8.5 converter-driven → 8.6 resonance → 8.7 real networks with G2ELin.',
  },
};

export const module8Notes: Record<string, LessonNote> = {
  '8.1': {
    summary: {
      fr: 'Un défaut empêche l’alternateur d’évacuer sa puissance : le rotor accélère. S’il est éliminé à temps, le rotor revient ; sinon il perd le synchronisme.',
      en: 'A fault stops the generator from exporting its power: the rotor accelerates. If the fault is cleared in time, the rotor comes back; otherwise it loses synchronism.',
    },
    objective: {
      fr: 'Lire le critère des aires égales et relier le temps critique d’élimination à l’inertie, à la charge et au lieu du défaut.',
      en: 'Read the equal-area criterion and relate the critical clearing time to inertia, loading and fault location.',
    },
    formulas: [
      { tex: r`\frac{2H}{\omega_0}\ddot\delta = P_m - P_{max}\sin\delta`, meaning: { fr: 'L’équation du mouvement : l’écart entre puissance mécanique et électrique accélère le rotor.', en: 'The swing equation: the gap between mechanical and electrical power accelerates the rotor.' } },
      { tex: r`A_{acc} \le A_{dec}^{max}`, meaning: { fr: 'Stable si l’énergie gagnée pendant le défaut peut être rendue avant δmax.', en: 'Stable if the energy gained during the fault can be returned before δmax.' } },
      { tex: r`t_{cr} \propto \sqrt{H}`, meaning: { fr: 'Pour un défaut franc, le temps critique croît comme la racine de l’inertie.', en: 'For a bolted fault, the critical time grows as the square root of inertia.' } },
    ],
    exercises: [
      { fr: 'Prédire que l’angle monte pendant le défaut.', en: 'Predict that the angle rises during the fault.' },
      { fr: 'Dépasser le temps critique et voir la perte de synchronisme.', en: 'Exceed the critical time and see loss of synchronism.' },
      { fr: 'Se placer juste sous le temps critique : deux aires presque égales.', en: 'Sit just below the critical time: two almost equal areas.' },
      { fr: 'Voir l’effet de l’inertie.', en: 'See the effect of inertia.' },
      { fr: 'Voir l’effet de la charge.', en: 'See the effect of loading.' },
      { fr: 'Voir l’effet du lieu du défaut.', en: 'See the effect of the fault location.' },
    ],
    tests: [
      { what: { fr: 'Le temps critique est dans la plage du curseur ; 5 ms avant il est stable, 10 ms après instable ; la marge des aires change de signe au même endroit.', en: 'The critical time lies within the slider range; 5 ms before it is stable, 10 ms after unstable; the area margin changes sign at the same point.' }, why: { fr: 'Garantit que le critère et la simulation disent la même chose (étapes 2 et 3).', en: 'Guarantees the criterion and the simulation agree (steps 2 and 3).' } },
      { what: { fr: 'Doubler H multiplie le temps critique par 1,3 à 1,5 ; moins de charge ou un défaut lointain l’allongent.', en: 'Doubling H multiplies the critical time by 1.3–1.5; less load or a distant fault lengthen it.' }, why: { fr: 'Garantit les étapes 4 à 6.', en: 'Guarantees steps 4 to 6.' } },
    ],
  },
  '8.2': {
    summary: {
      fr: 'Autour de son point de fonctionnement, un alternateur oscille contre le réseau vers 1 Hz. Un régulateur de tension rapide peut rendre cette oscillation instable ; le PSS la ramortit.',
      en: 'Around its operating point, a generator swings against the grid at about 1 Hz. A fast voltage regulator can make this oscillation unstable; the PSS damps it again.',
    },
    objective: {
      fr: 'Comprendre le mode électromécanique, l’effet déstabilisant du régulateur de tension et le principe du PSS.',
      en: 'Understand the electromechanical mode, the destabilising effect of the voltage regulator and the principle of the PSS.',
    },
    formulas: [
      { tex: r`\Delta T_e = K_1\Delta\delta + K_2\Delta E'_q`, meaning: { fr: 'Le modèle de Heffron–Phillips : couple électrique linéarisé.', en: 'The Heffron–Phillips model: linearised electrical torque.' } },
      { tex: r`\Delta T_e = K_S\Delta\delta + K_D\Delta\omega`, meaning: { fr: 'Couple synchronisant (en phase avec l’angle) et amortisseur (en phase avec la vitesse).', en: 'Synchronising torque (in phase with angle) and damping torque (in phase with speed).' } },
      { tex: r`K_{PSS}\frac{sT_w}{1+sT_w}\frac{1+sT_1}{1+sT_2}`, meaning: { fr: 'Le PSS : passe-haut puis avance de phase, appliqués à la vitesse.', en: 'The PSS: high-pass then phase lead, applied to speed.' } },
    ],
    exercises: [
      { fr: 'Prédire si l’oscillation s’amortit ou grandit.', en: 'Predict whether the oscillation decays or grows.' },
      { fr: 'Stabiliser en baissant le gain du régulateur, et voir pourquoi ce n’est pas la bonne solution.', en: 'Stabilise by lowering the regulator gain, and see why this is not the right fix.' },
      { fr: 'Régler un PSS pour plus de 15 % d’amortissement.', en: 'Tune a PSS for over 15 % damping.' },
      { fr: 'Vérifier le PSS sur une liaison plus faible.', en: 'Check the PSS on a weaker link.' },
      { fr: 'Voir que le problème apparaît surtout à forte charge.', en: 'See that the problem appears mainly at high load.' },
    ],
    tests: [
      { what: { fr: 'K1, K2 > 0 et K5 < 0 à forte charge ; mode instable vers 1 Hz avec KA = 200.', en: 'K1, K2 > 0 and K5 < 0 at high load; unstable mode near 1 Hz with KA = 200.' }, why: { fr: 'Reproduit le résultat classique de Kundur.', en: 'Reproduces Kundur’s classic result.' } },
      { what: { fr: 'KA = 10 est stable ; KPSS = 10 donne plus de 15 % (plus de 5 % avec Xe = 0,95) ; moins de charge améliore l’amortissement.', en: 'KA = 10 is stable; KPSS = 10 gives over 15 % (over 5 % with Xe = 0.95); less load improves damping.' }, why: { fr: 'Garantit les étapes 2 à 5.', en: 'Guarantees steps 2 to 5.' } },
    ],
  },
  '8.3': {
    summary: {
      fr: 'Après la perte d’une ligne, les régleurs en charge et les thermostats ramènent lentement la consommation : en quelques minutes, ils peuvent pousser la tension vers l’effondrement.',
      en: 'After a line is lost, tap changers and thermostats slowly restore consumption: within minutes, they can push voltage towards collapse.',
    },
    objective: {
      fr: 'Comprendre la stabilité de tension à long terme, le rôle des mécanismes de reprise de charge et les parades.',
      en: 'Understand long-term voltage stability, the role of load-restoration mechanisms and the countermeasures.',
    },
    formulas: [
      { tex: r`P = P_0 V^2 + a_D x,\ T_p\dot x = -x + P_0(1 - V^2)`, meaning: { fr: 'Une charge qui baisse avec la tension puis se rétablit (thermostats).', en: 'A load that drops with voltage then recovers (thermostats).' } },
      { tex: r`V_{BT} = n\,V_{HT}`, meaning: { fr: 'Le régleur change le rapport pour remonter la tension des clients.', en: 'The tap changer adjusts the ratio to raise the customers’ voltage.' } },
      { tex: r`P_0 > P_{max}^{après}`, meaning: { fr: 'Si la consommation voulue dépasse le nez après incident, pas d’équilibre acceptable.', en: 'If the desired consumption exceeds the post-incident nose, there is no acceptable equilibrium.' } },
    ],
    exercises: [
      { fr: 'Prédire l’évolution de la tension HT sur 5 minutes.', en: 'Predict the HV voltage over 5 minutes.' },
      { fr: 'Suivre la dégradation cran après cran.', en: 'Follow the degradation step by step.' },
      { fr: 'Mettre le régleur hors service.', en: 'Take the tap changer out of service.' },
      { fr: 'Bloquer le régleur automatiquement.', en: 'Block the tap changer automatically.' },
      { fr: 'Ajouter des condensateurs.', en: 'Add capacitors.' },
      { fr: 'Voir l’effondrement causé par les thermostats.', en: 'See the collapse caused by thermostats.' },
    ],
    tests: [
      { what: { fr: 'Avec le régleur, plusieurs changements de prise et tension HT dégradée ; sans lui ou bloqué, le réseau tient ; avec 0,3 pu de condensateurs aussi.', en: 'With the tap changer, several tap moves and a degraded HV voltage; without it or blocked, the grid holds; with 0.3 pu of capacitors too.' }, why: { fr: 'Garantit les étapes 2 à 5.', en: 'Guarantees steps 2 to 5.' } },
      { what: { fr: 'Régleur bloqué et charge entièrement thermostatée : effondrement.', en: 'Tap changer blocked and fully thermostatic load: collapse.' }, why: { fr: 'Garantit l’étape 6.', en: 'Guarantees step 6.' } },
    ],
  },
  '8.4': {
    summary: {
      fr: 'Quand une centrale déclenche, la fréquence chute. L’inertie des machines tournantes freine la chute, les régulateurs l’arrêtent. Les onduleurs suiveurs n’apportent pas d’inertie.',
      en: 'When a power station trips, frequency falls. The inertia of spinning machines slows the fall, governors stop it. Grid-following inverters add no inertia.',
    },
    objective: {
      fr: 'Relier inertie, RoCoF et nadir, et comparer les parades : réserve rapide et onduleurs formeurs.',
      en: 'Relate inertia, RoCoF and nadir, and compare the remedies: fast reserve and grid-forming inverters.',
    },
    formulas: [
      { tex: r`\frac{2H_{sys}S}{f_0}\frac{df}{dt} = P_m - P_e`, meaning: { fr: 'L’équation du mouvement à l’échelle du réseau.', en: 'The swing equation at grid scale.' } },
      { tex: r`\text{RoCoF} = -\frac{\Delta P f_0}{2H_{sys}S}`, meaning: { fr: 'La pente initiale ne dépend que de l’inertie.', en: 'The initial slope depends only on inertia.' } },
      { tex: r`\Delta f_\infty \approx -\frac{\Delta P}{K_{gov} + D}`, meaning: { fr: 'Le réglage primaire laisse un écart permanent.', en: 'Primary control leaves a permanent offset.' } },
    ],
    exercises: [
      { fr: 'Prédire la fréquence après la perte d’une centrale.', en: 'Predict frequency after a power-station trip.' },
      { fr: 'Trouver la part d’onduleurs qui déclenche le délestage.', en: 'Find the inverter share that triggers load shedding.' },
      { fr: 'Trouver celle qui déclenche les relais RoCoF.', en: 'Find the one that trips RoCoF relays.' },
      { fr: 'Éviter le délestage avec des batteries, et voir que le RoCoF ne change pas.', en: 'Avoid load shedding with batteries, and see the RoCoF does not change.' },
      { fr: 'Respecter les deux limites avec des onduleurs formeurs.', en: 'Meet both limits with grid-forming inverters.' },
    ],
    tests: [
      { what: { fr: 'H et RoCoF suivent les formules ; la fréquence finale reste entre 49,2 et 49,8 Hz.', en: 'H and RoCoF follow the formulas; final frequency stays between 49.2 and 49.8 Hz.' }, why: { fr: 'Vérifie le modèle et le message de la prédiction (pas de retour à 50 Hz).', en: 'Checks the model and the prediction’s message (no return to 50 Hz).' } },
      { what: { fr: 'Délestage à 60 %, relais RoCoF à 80 % ; 600 MW de réserve rapide évitent le délestage sans changer le RoCoF ; 20 % de formeurs respectent les deux limites.', en: 'Shedding at 60 %, RoCoF relays at 80 %; 600 MW of fast reserve avoid shedding without changing RoCoF; 20 % grid-forming meet both limits.' }, why: { fr: 'Garantit les étapes 2 à 5.', en: 'Guarantees steps 2 to 5.' } },
    ],
  },
  '8.5': {
    summary: {
      fr: 'Sur un réseau faible, la PLL d’un onduleur suiveur voit l’effet de son propre courant sur la tension : trop rapide, elle rend l’ensemble instable.',
      en: 'On a weak grid, a grid-following inverter’s PLL sees the effect of its own current on the voltage: too fast, it makes the whole system unstable.',
    },
    objective: {
      fr: 'Comprendre le SCR, l’interaction PLL–réseau et trouver le SCR minimal d’une centrale.',
      en: 'Understand the SCR, the PLL–grid interaction, and find a plant’s minimum SCR.',
    },
    formulas: [
      { tex: r`\mathrm{SCR} = S_{cc}/P_n = 1/X_g`, meaning: { fr: 'La force du réseau vue par la centrale.', en: 'Grid strength as seen by the plant.' } },
      { tex: r`v_{PCC} = v_g + Z_g i`, meaning: { fr: 'La tension que lit la PLL dépend du courant injecté.', en: 'The voltage the PLL reads depends on the injected current.' } },
      { tex: r`P_{max} \approx \mathrm{SCR}`, meaning: { fr: 'La limite statique, atteinte bien après la limite de commande.', en: 'The static limit, reached well after the control limit.' } },
    ],
    exercises: [
      { fr: 'Prédire la réponse en puissance sur réseau faible.', en: 'Predict the power response on a weak grid.' },
      { fr: 'Stabiliser en ralentissant la PLL.', en: 'Stabilise by slowing the PLL.' },
      { fr: 'Stabiliser en renforçant le réseau.', en: 'Stabilise by strengthening the grid.' },
      { fr: 'Stabiliser en limitant la puissance.', en: 'Stabilise by curtailing power.' },
      { fr: 'Trouver le SCR minimal avec une PLL lente.', en: 'Find the minimum SCR with a slow PLL.' },
    ],
    tests: [
      { what: { fr: 'SCR 2, PLL 60 Hz, P = 1 : instable dans les valeurs propres et dans la simulation.', en: 'SCR 2, 60 Hz PLL, P = 1: unstable in the eigenvalues and in the simulation.' }, why: { fr: 'Le modèle linéaire et la simulation non linéaire concordent.', en: 'The linear model and the nonlinear simulation agree.' } },
      { what: { fr: 'PLL 20 Hz, SCR 3 ou P = 0,5 stabilisent ; le SCR minimal croît avec la bande de la PLL ; stable à SCR 1,35 avec 20 Hz.', en: '20 Hz PLL, SCR 3 or P = 0.5 stabilise; the minimum SCR rises with PLL bandwidth; stable at SCR 1.35 with 20 Hz.' }, why: { fr: 'Garantit les étapes 2 à 5.', en: 'Guarantees steps 2 to 5.' } },
    ],
  },
  '8.6': {
    summary: {
      fr: 'Une ligne compensée par condensateur série résonne sous 50 Hz. Si cette résonance tombe sur un mode de torsion de l’arbre d’une turbine, l’oscillation grandit jusqu’à la rupture.',
      en: 'A line compensated by a series capacitor resonates below 50 Hz. If this resonance hits a torsional mode of a turbine shaft, the oscillation grows until the shaft breaks.',
    },
    objective: {
      fr: 'Comprendre la résonance hyposynchrone, prédire quand elle survient et connaître les parades.',
      en: 'Understand subsynchronous resonance, predict when it occurs and know the countermeasures.',
    },
    formulas: [
      { tex: r`f_{er} = 50\sqrt{k}`, meaning: { fr: 'La fréquence propre de la ligne compensée.', en: 'The natural frequency of the compensated line.' } },
      { tex: r`f_{rotor} = 50 - f_{er}`, meaning: { fr: 'La fréquence du couple vu par le rotor.', en: 'The frequency of the torque seen by the rotor.' } },
      { tex: r`\sigma = -\zeta_m 2\pi f_m + K_E[\mathrm{Re}\,Y(50-f_m) - \mathrm{Re}\,Y(50+f_m)]`, meaning: { fr: 'Le bilan entre amortissement mécanique et effet du réseau.', en: 'The balance between mechanical damping and the network’s effect.' } },
    ],
    exercises: [
      { fr: 'Prédire si la torsion s’amortit ou grandit.', en: 'Predict whether the torsion decays or grows.' },
      { fr: 'Désaccorder la compensation.', en: 'Detune the compensation.' },
      { fr: 'Calculer et trouver la résonance d’un autre arbre.', en: 'Compute and find the resonance of another shaft.' },
      { fr: 'Voir que l’amortissement mécanique ne suffit pas.', en: 'See that mechanical damping is not enough.' },
      { fr: 'Supprimer la résonance avec un TCSC.', en: 'Remove the resonance with a TCSC.' },
    ],
    tests: [
      { what: { fr: 'À k = 0,5, 50 − fer ≈ 14,6 Hz et le mode grandit ; à 0,4 ou 0,6 il s’amortit ; un mode à 20 Hz résonne vers k = 0,36.', en: 'At k = 0.5, 50 − fer ≈ 14.6 Hz and the mode grows; at 0.4 or 0.6 it decays; a 20 Hz mode resonates near k = 0.36.' }, why: { fr: 'Garantit les étapes 1 à 3.', en: 'Guarantees steps 1 to 3.' } },
      { what: { fr: '0,5 % d’amortissement mécanique ne suffit pas ; le TCSC amortit pour k de 0,45 à 0,7 ; l’enveloppe simulée croît exactement en e^{σt}.', en: '0.5 % mechanical damping is not enough; the TCSC damps for k from 0.45 to 0.7; the simulated envelope grows exactly as e^{σt}.' }, why: { fr: 'Garantit les étapes 4 et 5.', en: 'Guarantees steps 4 and 5.' } },
    ],
  },
  '8.7': {
    summary: {
      fr: 'Sur un grand réseau, des régions entières oscillent les unes contre les autres, lentement (0,1–0,8 Hz). Les valeurs propres disent à quelle fréquence, les vecteurs propres qui oscille contre qui. G2ELin fait la même analyse sur des modèles complets.',
      en: 'On a large grid, whole regions swing against each other, slowly (0.1–0.8 Hz). Eigenvalues say at what frequency, eigenvectors who swings against whom. G2ELin does the same analysis on full models.',
    },
    objective: {
      fr: 'Distinguer modes locaux et inter-zones, lire une forme modale, et relier la fréquence du mode à la force de la liaison et au transit.',
      en: 'Tell local from inter-area modes, read a mode shape, and relate the mode frequency to tie strength and transfer.',
    },
    formulas: [
      { tex: r`\frac{2H_i}{\omega_0}\Delta\ddot\delta_i = -\sum_j K_{ij}\Delta\delta_j - D\Delta\omega_i`, meaning: { fr: 'Des masses reliées par des ressorts : le modèle classique linéarisé.', en: 'Masses joined by springs: the linearised classical model.' } },
      { tex: r`K_{ij} = \partial P_{e,i}/\partial\delta_j`, meaning: { fr: 'Les coefficients synchronisants, obtenus par réduction de Kron du réseau.', en: 'The synchronising coefficients, from Kron reduction of the network.' } },
      { tex: r`M^{-1}K\,v = \omega^2 v`, meaning: { fr: 'Fréquences propres et formes modales.', en: 'Natural frequencies and mode shapes.' } },
    ],
    exercises: [
      { fr: 'Prédire que la machine lointaine oscille aussi.', en: 'Predict that the distant machine oscillates too.' },
      { fr: 'Lire les formes modales inter-zones et locales.', en: 'Read the inter-area and local mode shapes.' },
      { fr: 'Affaiblir la liaison.', en: 'Weaken the tie line.' },
      { fr: 'Charger la liaison.', en: 'Load the tie line.' },
      { fr: 'Exciter un mode local.', en: 'Excite a local mode.' },
      { fr: 'Amortir le mode inter-zones à 5 %.', en: 'Damp the inter-area mode to 5 %.' },
      { fr: 'Retrouver ces modes sur un réseau réel avec G2ELin.', en: 'Find these modes on a real network with G2ELin.' },
    ],
    tests: [
      { what: { fr: 'K est symétrique et ses lignes somment à zéro ; un mode inter-zones entre 0,5 et 0,8 Hz avec les zones en opposition, deux modes locaux au-dessus de 1 Hz.', en: 'K is symmetric and its rows sum to zero; one inter-area mode between 0.5 and 0.8 Hz with areas in opposition, two local modes above 1 Hz.' }, why: { fr: 'Vérifie la réduction du réseau et la classification des modes.', en: 'Checks the network reduction and the mode classification.' } },
      { what: { fr: 'Liaison plus faible ou plus chargée : mode plus lent ; D = 10 dépasse 5 % ; un choc sur G1 atteint G3.', en: 'Weaker or more loaded tie: slower mode; D = 10 exceeds 5 %; a kick on G1 reaches G3.' }, why: { fr: 'Garantit les étapes 1 à 6.', en: 'Guarantees steps 1 to 6.' } },
    ],
  },
};
