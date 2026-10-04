// Teaching notes for Module 4 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module4Note: ModuleNote = {
  summary: {
    fr: 'Les briques du réseau réel : lignes, transformateurs, alternateurs, charges, moteurs, et les équipements qui compensent et régulent la tension.',
    en: 'The building blocks of the real grid: lines, transformers, generators, loads, motors, and the equipment that compensates and regulates voltage.',
  },
  objective: {
    fr: 'Savoir modéliser chaque élément avec juste ce qu’il faut de détail, et comprendre ses limites physiques.',
    en: 'Know how to model each element with just enough detail, and understand its physical limits.',
  },
  path: {
    fr: '4.1 lignes → 4.2 transformateurs → 4.3 alternateur → 4.4 charges → 4.5 moteur asynchrone → 4.6 compensation → 4.7 FACTS.',
    en: '4.1 lines → 4.2 transformers → 4.3 generator → 4.4 loads → 4.5 induction motor → 4.6 compensation → 4.7 FACTS.',
  },
};

export const module4Notes: Record<string, LessonNote> = {
  '4.1': {
    summary: {
      fr: 'Une ligne longue n’est pas qu’une résistance : c’est une inductance et une capacité réparties sur des centaines de kilomètres. À vide, sa tension monte (effet Ferranti) ; à la puissance naturelle, son profil est plat.',
      en: 'A long line is not just a resistance: it is an inductance and a capacitance spread over hundreds of kilometres. At no load its voltage rises (Ferranti effect); at natural load its profile is flat.',
    },
    objective: {
      fr: 'Choisir le bon modèle de ligne et prévoir le profil de tension selon la charge.',
      en: 'Choose the right line model and predict the voltage profile with load.',
    },
    formulas: [
      { tex: r`Z_c = \sqrt{z/y},\quad \gamma = \sqrt{zy}`, meaning: { fr: 'L’impédance caractéristique et la constante de propagation de la ligne.', en: 'The line’s characteristic impedance and propagation constant.' } },
      { tex: r`\mathrm{SIL} = U^2/Z_c`, meaning: { fr: 'La puissance naturelle : la ligne s’auto-compense.', en: 'The natural load: the line compensates itself.' } },
      { tex: r`V_r/V_s \approx 1/\cos\beta L`, meaning: { fr: 'L’effet Ferranti à vide : la tension monte au bout de la ligne.', en: 'The Ferranti effect at no load: the voltage rises at the far end.' } },
    ],
    exercises: [
      { fr: 'Découvrir l’effet Ferranti sur une ligne ouverte.', en: 'Discover the Ferranti effect on an open line.' },
      { fr: 'Trouver la puissance naturelle et le profil plat.', en: 'Find the natural load and the flat profile.' },
      { fr: 'Voir la tension chuter au-delà de la puissance naturelle.', en: 'See the voltage fall above the natural load.' },
      { fr: 'Constater les erreurs d’un modèle trop simple.', en: 'See the errors of a model that is too simple.' },
      { fr: 'Savoir quand le π nominal suffit.', en: 'Know when the nominal π is enough.' },
    ],
    tests: [
      { what: { fr: 'La puissance naturelle d’une ligne 400 kV vaut environ 530 MW.', en: 'A 400 kV line’s natural load is about 530 MW.' }, why: { fr: 'Vérifie les constantes de ligne.', en: 'Checks the line constants.' } },
      { what: { fr: 'L’élévation à vide égale $1/|\\cosh\\gamma L|$ et dépasse 20 % sur 600 km.', en: 'The no-load rise equals $1/|\\cosh\\gamma L|$ and exceeds 20 % over 600 km.' }, why: { fr: 'Vérifie l’effet Ferranti.', en: 'Checks the Ferranti effect.' } },
      { what: { fr: 'À la puissance naturelle, le profil varie de moins de 5 %.', en: 'At natural load, the profile varies by less than 5 %.' }, why: { fr: 'Vérifie le profil plat annoncé.', en: 'Checks the flat profile.' } },
      { what: { fr: 'Le π nominal est exact à 0,2 % sur 100 km, mais pas sur 1000 km.', en: 'The nominal π is accurate to 0.2 % at 100 km, but not at 1000 km.' }, why: { fr: 'Justifie le choix du modèle selon la longueur.', en: 'Justifies the choice of model by length.' } },
    ],
  },
  '4.2': {
    summary: {
      fr: 'Le transformateur change la tension presque sans pertes. Mais à la mise sous tension, son noyau peut saturer et appeler un courant énorme.',
      en: 'The transformer changes voltage almost without loss. But at switch-on its core can saturate and draw a huge current.',
    },
    objective: {
      fr: 'Comprendre le courant d’appel, la chute de tension et le rendement d’un transformateur réel.',
      en: 'Understand inrush current, voltage regulation and efficiency of a real transformer.',
    },
    formulas: [
      { tex: r`\frac{V_1}{V_2} = \frac{N_1}{N_2}`, meaning: { fr: 'Le rapport de transformation.', en: 'The turns ratio.' } },
      { tex: r`\psi(t) = \psi_r + \cos\theta_0 - \cos(\omega t + \theta_0)`, meaning: { fr: 'Le flux à l’enclenchement : il peut atteindre 2 pu plus le rémanent.', en: 'Flux at switch-on: it can reach 2 pu plus the residual.' } },
      { tex: r`\varepsilon \approx S(u_R\cos\varphi + u_X\sin\varphi)`, meaning: { fr: 'La chute de tension en charge.', en: 'The voltage drop under load.' } },
      { tex: r`\eta = \frac{P}{P + p_0 + S^2 u_R}`, meaning: { fr: 'Le rendement, maximal quand pertes fer = pertes cuivre.', en: 'Efficiency, highest when iron losses = copper losses.' } },
    ],
    exercises: [
      { fr: 'Découvrir que l’appel de courant dépasse largement le courant nominal.', en: 'Discover that the inrush far exceeds rated current.' },
      { fr: 'Supprimer l’appel en enclenchant au bon instant.', en: 'Eliminate inrush by switching at the right instant.' },
      { fr: 'Voir que le flux rémanent change le bon instant.', en: 'See that residual flux changes the right instant.' },
      { fr: 'Voir l’amortissement par la résistance.', en: 'See the damping by resistance.' },
      { fr: 'Trouver le point de rendement maximal.', en: 'Find the point of maximum efficiency.' },
    ],
    tests: [
      { what: { fr: 'Enclencher au maximum de tension sans rémanent : pas d’appel.', en: 'Switching at the voltage peak with no residual: no inrush.' }, why: { fr: 'Vérifie le principe de la manœuvre synchronisée.', en: 'Checks the principle of point-on-wave switching.' } },
      { what: { fr: 'Enclencher au zéro avec rémanent : flux > 2,3 pu et courant > 3 pu.', en: 'Switching at zero with residual: flux > 2.3 pu and current > 3 pu.' }, why: { fr: 'Vérifie le pire cas présenté.', en: 'Checks the worst case shown.' } },
      { what: { fr: 'L’appel s’amortit ; le rendement est maximal à $\\sqrt{p_0/u_R}$.', en: 'The inrush decays; efficiency peaks at $\\sqrt{p_0/u_R}$.' }, why: { fr: 'Vérifie l’amortissement et la formule du rendement.', en: 'Checks the decay and the efficiency formula.' } },
    ],
  },
  '4.3': {
    summary: {
      fr: 'L’alternateur fournit la puissance active voulue par la turbine et la puissance réactive voulue par son excitation. En court-circuit, son courant décroît en trois étapes.',
      en: 'The generator supplies the active power set by its turbine and the reactive power set by its excitation. In a short circuit, its current decays in three stages.',
    },
    objective: {
      fr: 'Lire le diagramme de phaseurs, les courbes en V, le diagramme de capacité et le courant de court-circuit.',
      en: 'Read the phasor diagram, V-curves, capability chart and short-circuit current.',
    },
    formulas: [
      { tex: r`\underline E = \underline V + jX_d\underline I`, meaning: { fr: 'Le modèle de l’alternateur en régime établi.', en: 'The generator model in steady state.' } },
      { tex: r`P = \frac{EV}{X_d}\sin\delta,\quad Q = \frac{EV\cos\delta - V^2}{X_d}`, meaning: { fr: 'La turbine règle P, l’excitation règle Q.', en: 'The turbine sets P, the excitation sets Q.' } },
      { tex: r`i_{crête} \approx \frac{2\sqrt2E}{X''_d}`, meaning: { fr: 'Le courant de crête de court-circuit, qui dimensionne les disjoncteurs.', en: 'The peak short-circuit current, which sizes the breakers.' } },
    ],
    exercises: [
      { fr: 'Découvrir que le courant de court-circuit décroît.', en: 'Discover that short-circuit current decays.' },
      { fr: 'Comprendre la composante continue et l’instant du défaut.', en: 'Understand the DC component and the fault instant.' },
      { fr: 'Fournir du réactif en surexcitant.', en: 'Export reactive power by over-exciting.' },
      { fr: 'Absorber du réactif en sous-excitant.', en: 'Absorb reactive power by under-exciting.' },
      { fr: 'Trouver le courant minimal (cos φ = 1).', en: 'Find the minimum current (unity power factor).' },
      { fr: 'Approcher la limite de stabilité.', en: 'Approach the stability limit.' },
    ],
    tests: [
      { what: { fr: '$Q = 0$ pour $E = \\sqrt{1 + (PX_d)^2}$.', en: '$Q = 0$ for $E = \\sqrt{1 + (PX_d)^2}$.' }, why: { fr: 'Vérifie le diagramme de phaseurs.', en: 'Checks the phasor diagram.' } },
      { what: { fr: 'Surexcité fournit Q, sous-excité l’absorbe ; pas d’équilibre si $PX_d > EV$.', en: 'Over-excited exports Q, under-excited absorbs it; no equilibrium if $PX_d > EV$.' }, why: { fr: 'Vérifie les régimes présentés.', en: 'Checks the operating regimes shown.' } },
      { what: { fr: 'Le courant de court-circuit part de zéro et décroît vers $\\sqrt2/X_d$.', en: 'The short-circuit current starts at zero and decays towards $\\sqrt2/X_d$.' }, why: { fr: 'Vérifie la formule à trois constantes de temps.', en: 'Checks the three-time-constant formula.' } },
    ],
  },
  '4.4': {
    summary: {
      fr: 'Quand la tension baisse, la consommation baisse aussi… plus ou moins selon les appareils. Certaines charges reviennent ensuite à leur puissance d’origine.',
      en: 'When voltage falls, consumption falls too… more or less depending on the appliances. Some loads then return to their original power.',
    },
    objective: {
      fr: 'Modéliser une charge (ZIP, exponentielle, à rétablissement) et comprendre l’effet sur la tension.',
      en: 'Model a load (ZIP, exponential, recovering) and understand its effect on voltage.',
    },
    formulas: [
      { tex: r`P/P_0 = a_ZV^2 + a_IV + a_P`, meaning: { fr: 'Le modèle ZIP : impédance, courant et puissance constants.', en: 'The ZIP model: constant impedance, current and power.' } },
      { tex: r`T_p\frac{dx}{dt} = -x + P_0(V^{\alpha_s} - V^{\alpha_t})`, meaning: { fr: 'Une charge qui se rétablit lentement après un échelon de tension.', en: 'A load that slowly recovers after a voltage step.' } },
      { tex: r`\mathrm{CVR} \approx 2a_Z + a_I`, meaning: { fr: 'L’économie d’énergie obtenue en baissant un peu la tension.', en: 'The energy saved by lowering voltage slightly.' } },
    ],
    exercises: [
      { fr: 'Découvrir que la consommation baisse avec la tension.', en: 'Discover that consumption falls with voltage.' },
      { fr: 'Voir la loi en $V^2$ d’un chauffage.', en: 'See the $V^2$ law of a heater.' },
      { fr: 'Voir le courant augmenter pour une charge à puissance constante.', en: 'See current rise for a constant-power load.' },
      { fr: 'Voir une charge revenir à sa puissance d’origine.', en: 'See a load return to its original power.' },
      { fr: 'Mesurer l’économie d’énergie par réduction de tension.', en: 'Measure the energy saved by voltage reduction.' },
    ],
    tests: [
      { what: { fr: 'Une impédance constante consomme $V^2$.', en: 'A constant impedance draws $V^2$.' }, why: { fr: 'Vérifie le modèle ZIP.', en: 'Checks the ZIP model.' } },
      { what: { fr: 'Les poids sont normalisés et le facteur CVR vaut $2a_Z + a_I$.', en: 'Weights are normalised and the CVR factor is $2a_Z + a_I$.' }, why: { fr: 'Vérifie les valeurs affichées.', en: 'Checks the values shown.' } },
      { what: { fr: 'Une charge qui se rétablit tombe à $V^2$ puis revient à 1.', en: 'A recovering load drops to $V^2$ then returns to 1.' }, why: { fr: 'Vérifie la dynamique de rétablissement.', en: 'Checks the recovery dynamics.' } },
    ],
  },
  '4.5': {
    summary: {
      fr: 'Le moteur asynchrone, le moteur le plus répandu : il démarre avec un courant énorme, tourne un peu moins vite que le champ, et peut caler si la tension s’effondre.',
      en: 'The induction motor, the most common motor: it starts with a huge current, turns slightly slower than the field, and can stall if voltage collapses.',
    },
    objective: {
      fr: 'Lire la courbe couple–vitesse, prévoir un démarrage et comprendre le calage pendant un creux.',
      en: 'Read the torque–speed curve, predict a start-up and understand stalling during a dip.',
    },
    formulas: [
      { tex: r`g = \frac{\omega_s - \omega}{\omega_s}`, meaning: { fr: 'Le glissement, qui crée le couple.', en: 'The slip, which creates torque.' } },
      { tex: r`T_e \propto V^2`, meaning: { fr: 'Le couple varie comme le carré de la tension.', en: 'Torque scales with the square of the voltage.' } },
      { tex: r`2H\frac{d\omega}{dt} = T_e - T_L`, meaning: { fr: 'Le moteur accélère tant que son couple dépasse celui de la charge.', en: 'The motor accelerates as long as its torque exceeds the load’s.' } },
    ],
    exercises: [
      { fr: 'Découvrir le courant de démarrage de 5 à 7 fois le nominal.', en: 'Discover the 5–7× starting current.' },
      { fr: 'Voir un moteur incapable de démarrer.', en: 'See a motor unable to start.' },
      { fr: 'Provoquer un calage par un creux de tension.', en: 'Cause a stall with a voltage dip.' },
      { fr: 'Voir qu’un ventilateur passe le même creux.', en: 'See that a fan rides through the same dip.' },
      { fr: 'Relier résistance rotorique, démarrage et glissement.', en: 'Link rotor resistance, starting and slip.' },
    ],
    tests: [
      { what: { fr: 'Couple maximal > 2 × couple de démarrage, courant de démarrage > 4 pu.', en: 'Breakdown torque > 2 × starting torque, starting current > 4 pu.' }, why: { fr: 'Vérifie le schéma équivalent.', en: 'Checks the equivalent circuit.' } },
      { what: { fr: 'Un ventilateur démarre ; un couple constant trop élevé ne démarre jamais.', en: 'A fan starts; too high a constant torque never starts.' }, why: { fr: 'Vérifie la dynamique de démarrage.', en: 'Checks the start-up dynamics.' } },
      { what: { fr: 'Un moteur en marche, à faible inertie et couple constant, cale sur un creux à 0,5 pu de 0,5 s ; le ventilateur passe, et le même creux éliminé en 0,3 s aussi.', en: 'A running low-inertia constant-torque motor stalls in a 0.5 pu, 0.5 s dip; the fan rides through, and so does the same dip cleared in 0.3 s.' }, why: { fr: 'Garantit l’exercice sur le FIDVR.', en: 'Guarantees the FIDVR exercise.' } },
    ],
  },
  '4.6': {
    summary: {
      fr: 'La tension dépend surtout de la puissance réactive. Des condensateurs ou des inductances (shunt), ou un condensateur série, permettent de la tenir et de transporter plus.',
      en: 'Voltage depends mainly on reactive power. Shunt capacitors or reactors, or a series capacitor, hold it and let more power through.',
    },
    objective: {
      fr: 'Lire une courbe P–V, choisir la bonne compensation et reconnaître l’effondrement de tension.',
      en: 'Read a P–V curve, choose the right compensation and recognise voltage collapse.',
    },
    formulas: [
      { tex: r`\Delta V \approx \frac{RP + XQ}{V}`, meaning: { fr: 'La chute de tension dépend surtout de Q.', en: 'Voltage drop depends mainly on Q.' } },
      { tex: r`Q_C = BV^2`, meaning: { fr: 'Un condensateur aide moins quand la tension baisse.', en: 'A capacitor helps less when voltage falls.' } },
      { tex: r`X_{eff} = X(1-k)`, meaning: { fr: 'La compensation série raccourcit électriquement la ligne.', en: 'Series compensation electrically shortens the line.' } },
    ],
    exercises: [
      { fr: 'Voir la tension chuter avec la charge.', en: 'See voltage fall with load.' },
      { fr: 'La relever avec un condensateur shunt.', en: 'Raise it with a shunt capacitor.' },
      { fr: 'Voir la surtension à faible charge.', en: 'See the overvoltage at light load.' },
      { fr: 'Augmenter le transfert par compensation série.', en: 'Increase transfer with series compensation.' },
      { fr: 'Provoquer l’effondrement au-delà du nez.', en: 'Cause collapse beyond the nose.' },
    ],
    tests: [
      { what: { fr: 'Un condensateur shunt relève la tension.', en: 'A shunt capacitor raises the voltage.' }, why: { fr: 'Vérifie l’effet de la compensation shunt.', en: 'Checks the effect of shunt compensation.' } },
      { what: { fr: '50 % de compensation série double presque le transfert maximal.', en: '50 % series compensation almost doubles maximum transfer.' }, why: { fr: 'Vérifie l’effet de la compensation série.', en: 'Checks the effect of series compensation.' } },
      { what: { fr: 'Au-delà du nez, il n’y a plus de solution.', en: 'Beyond the nose, there is no solution.' }, why: { fr: 'Vérifie la détection de l’effondrement.', en: 'Checks the collapse detection.' } },
    ],
  },
  '4.7': {
    summary: {
      fr: 'Les FACTS sont des équipements d’électronique de puissance qui règlent la tension en un cycle. Le STATCOM, un onduleur, tient mieux que le SVC quand la tension s’effondre.',
      en: 'FACTS are power-electronic devices that regulate voltage within one cycle. The STATCOM, an inverter, holds up better than the SVC when voltage collapses.',
    },
    objective: {
      fr: 'Comparer SVC et STATCOM et comprendre pourquoi les FACTS comptent surtout sur les réseaux faibles.',
      en: 'Compare the SVC and the STATCOM and understand why FACTS matter most on weak grids.',
    },
    formulas: [
      { tex: r`V = E + X I_c`, meaning: { fr: 'Un courant capacitif injecté remonte la tension du poste.', en: 'An injected capacitive current lifts the substation voltage.' } },
      { tex: r`Q_{SVC} = BV^2,\quad Q_{STAT} = IV`, meaning: { fr: 'Le SVC perd en $V^2$, le STATCOM seulement en $V$.', en: 'The SVC loses as $V^2$, the STATCOM only as $V$.' } },
      { tex: r`V = V_{ref} - kI`, meaning: { fr: 'La régulation avec statisme.', en: 'Regulation with droop.' } },
    ],
    exercises: [
      { fr: 'Voir les deux équipements soutenir la tension.', en: 'See both devices support the voltage.' },
      { fr: 'Constater l’avantage du STATCOM en creux profond.', en: 'See the STATCOM’s advantage in a deep dip.' },
      { fr: 'Comprendre qu’un réseau fort n’en a pas besoin.', en: 'Understand that a strong grid does not need them.' },
      { fr: 'Voir l’effet de la rapidité.', en: 'See the effect of speed.' },
      { fr: 'Dimensionner un STATCOM pour un réseau faible.', en: 'Size a STATCOM for a weak grid.' },
    ],
    tests: [
      { what: { fr: 'Les deux équipements relèvent la tension pendant le creux.', en: 'Both devices raise the voltage during the dip.' }, why: { fr: 'Vérifie le modèle de régulation.', en: 'Checks the control model.' } },
      { what: { fr: 'En creux profond, le STATCOM fournit plus de réactif que le SVC.', en: 'In a deep dip, the STATCOM supplies more reactive power than the SVC.' }, why: { fr: 'Vérifie le message central de la leçon.', en: 'Checks the central message of the lesson.' } },
    ],
  },
};
