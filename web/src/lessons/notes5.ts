// Teaching notes for Module 5 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module5Note: ModuleNote = {
  summary: {
    fr: 'Le réseau entier en régime permanent : où passe la puissance, jusqu’où on peut charger, ce qui se passe lors d’un court-circuit, qui produit et à quel prix, et ce que change le solaire en distribution.',
    en: 'The whole grid in steady state: where power flows, how far it can be loaded, what happens in a short circuit, who produces at what price, and what solar changes in distribution.',
  },
  objective: {
    fr: 'Savoir poser et résoudre une répartition de charge, et s’en servir pour les études de tension, de défauts, de coûts et d’intégration du solaire.',
    en: 'Know how to set up and solve a power flow, and use it for voltage, fault, cost and solar-integration studies.',
  },
  path: {
    fr: '5.1 matrice Y et Newton–Raphson → 5.2 courbes P–V et Q–V → 5.3 défauts → 5.4 dispatching économique → 5.5 une journée sur un départ.',
    en: '5.1 Y-bus and Newton–Raphson → 5.2 P–V and Q–V curves → 5.3 faults → 5.4 economic dispatch → 5.5 a day on a feeder.',
  },
};

export const module5Notes: Record<string, LessonNote> = {
  '5.1': {
    summary: {
      fr: 'Connaissant la consommation et la production, quelles sont les tensions et les transits ? Les équations sont non linéaires : on les résout par itérations. Newton–Raphson y arrive en quatre ou cinq pas.',
      en: 'Given consumption and generation, what are the voltages and flows? The equations are nonlinear, so they are solved iteratively. Newton–Raphson gets there in four or five steps.',
    },
    objective: {
      fr: 'Construire la matrice Y, connaître les types de nœuds, et comprendre pourquoi Newton–Raphson converge si vite.',
      en: 'Build the Y matrix, know the bus types, and understand why Newton–Raphson converges so fast.',
    },
    formulas: [
      { tex: r`Y_{ik} = -y_{ik},\quad Y_{ii} = \sum_k y_{ik} + \tfrac{jb}{2}`, meaning: { fr: 'La matrice d’admittance, construite ligne par ligne.', en: 'The admittance matrix, built line by line.' } },
      { tex: r`P_i = V_i\sum_k V_k(G_{ik}\cos\theta_{ik} + B_{ik}\sin\theta_{ik})`, meaning: { fr: 'L’équation de puissance active à chaque nœud (et son équivalent pour Q).', en: 'The active-power equation at each bus (and its counterpart for Q).' } },
      { tex: r`\Delta x = J^{-1}\,\Delta S`, meaning: { fr: 'Une itération de Newton–Raphson : on corrige par la tangente.', en: 'One Newton–Raphson iteration: correct along the tangent.' } },
      { tex: r`P_{ik} \approx (\theta_i - \theta_k)/x_{ik}`, meaning: { fr: 'L’approximation « DC », linéaire et rapide.', en: 'The “DC” approximation, linear and fast.' } },
    ],
    exercises: [
      { fr: 'Découvrir la convergence quadratique de Newton–Raphson.', en: 'Discover Newton–Raphson’s quadratic convergence.' },
      { fr: 'Construire Y ligne par ligne et voir les quatre cases touchées.', en: 'Build Y line by line and see the four entries touched.' },
      { fr: 'Voir la puissance se redistribuer après la perte d’une ligne.', en: 'See power redistribute after losing a line.' },
      { fr: 'Comprendre le rôle d’un nœud PV et du réactif.', en: 'Understand the role of a PV bus and reactive power.' },
      { fr: 'Voir les itérations augmenter sur un réseau chargé.', en: 'See iterations increase on a loaded grid.' },
      { fr: 'Reconnaître l’absence de solution au-delà du nez.', en: 'Recognise that no solution exists beyond the nose.' },
    ],
    tests: [
      { what: { fr: 'Y est symétrique et chaque ligne somme aux demi-capacités.', en: 'Y is symmetric and each row sums to the half-charging.' }, why: { fr: 'Vérifie la construction de Y.', en: 'Checks the construction of Y.' } },
      { what: { fr: 'Newton–Raphson converge en 5 itérations au plus, l’erreur étant à peu près élevée au carré à chaque pas.', en: 'Newton–Raphson converges in at most 5 iterations, the error roughly squared at each step.' }, why: { fr: 'Garantit le message de la prédiction.', en: 'Guarantees the prediction’s message.' } },
      { what: { fr: 'Newton–Raphson et Gauss–Seidel donnent la même solution (10⁻⁶) ; Gauss–Seidel demande plus de 5 fois plus d’itérations.', en: 'Newton–Raphson and Gauss–Seidel give the same solution (10⁻⁶); Gauss–Seidel needs over 5 times as many iterations.' }, why: { fr: 'Valide les deux méthodes l’une par l’autre.', en: 'Validates each method against the other.' } },
      { what: { fr: 'Le nœud bilan fournit charge − G2 + pertes ; le DC est à 10 % près de l’AC ; un PV en butée devient PQ ; pas de solution à λ = 3,5.', en: 'The slack supplies load − G2 + losses; DC is within 10 % of AC; a PV bus at its limit turns PQ; no solution at λ = 3.5.' }, why: { fr: 'Couvre les autres étapes.', en: 'Covers the other steps.' } },
    ],
  },
  '5.2': {
    summary: {
      fr: 'Si l’on augmente toutes les charges, la tension baisse doucement, puis de plus en plus vite, jusqu’au « nez » : au-delà, il n’y a plus de solution. C’est l’effondrement de tension.',
      en: 'As every load is increased, voltage falls gently, then faster and faster, up to the “nose”: beyond it there is no solution. This is voltage collapse.',
    },
    objective: {
      fr: 'Trouver la charge maximale d’un réseau, lire une marge réactive, et savoir ce qui la réduit ou l’augmente.',
      en: 'Find a grid’s maximum loading, read a reactive margin, and know what reduces or increases it.',
    },
    formulas: [
      { tex: r`P = \lambda P_0`, meaning: { fr: 'On multiplie toutes les charges par λ et on suit la solution (continuation).', en: 'Every load is multiplied by λ and the solution is followed (continuation).' } },
      { tex: r`\det J = 0`, meaning: { fr: 'Au nez, le jacobien devient singulier.', en: 'At the nose, the Jacobian becomes singular.' } },
      { tex: r`Q_C = BV^2`, meaning: { fr: 'Un condensateur aide moins quand la tension baisse.', en: 'A capacitor helps less as voltage falls.' } },
      { tex: r`\Delta Q_{marge} = -\min Q(V)`, meaning: { fr: 'La marge réactive, lue sur la courbe Q–V.', en: 'The reactive margin, read on the Q–V curve.' } },
    ],
    exercises: [
      { fr: 'Découvrir la chute brutale de tension près du nez.', en: 'Discover the sudden voltage drop near the nose.' },
      { fr: 'Trouver la charge maximale.', en: 'Find the maximum loading.' },
      { fr: 'Voir un alternateur en butée de réactif rapprocher le nez.', en: 'See a generator at its reactive limit pull the nose in.' },
      { fr: 'Éloigner le nez avec un condensateur.', en: 'Push the nose out with a capacitor.' },
      { fr: 'Mesurer l’effet d’une ligne perdue (N–1).', en: 'Measure the effect of a lost line (N–1).' },
      { fr: 'Lire la marge réactive sur la courbe Q–V.', en: 'Read the reactive margin on the Q–V curve.' },
    ],
    tests: [
      { what: { fr: 'Le nez se situe entre 2 et 3,5 fois la charge de base.', en: 'The nose lies between 2 and 3.5 times the base load.' }, why: { fr: 'Garde le nez dans la fenêtre du curseur.', en: 'Keeps the nose within the cursor window.' } },
      { what: { fr: 'Limite de réactif, ligne perdue et mauvais cos φ rapprochent le nez ; un condensateur l’éloigne.', en: 'A reactive limit, a lost line and a poor cos φ move the nose in; a capacitor moves it out.' }, why: { fr: 'Garantit les étapes 3 à 5.', en: 'Guarantees steps 3 to 5.' } },
      { what: { fr: 'La pente dV/dλ près du nez est plus de 4 fois celle à faible charge.', en: 'The slope dV/dλ near the nose is over 4 times that at light load.' }, why: { fr: 'Vérifie le message de la prédiction.', en: 'Checks the prediction’s message.' } },
      { what: { fr: 'La marge Q–V est positive à la charge de base et fond près du nez.', en: 'The Q–V margin is positive at base load and melts near the nose.' }, why: { fr: 'Garantit l’étape 6.', en: 'Guarantees step 6.' } },
    ],
  },
  '5.3': {
    summary: {
      fr: 'Un court-circuit n’est limité que par les impédances du réseau. Les défauts déséquilibrés se calculent en reliant trois réseaux équilibrés (direct, inverse, homopolaire) selon le type de défaut. La mise à la terre du neutre change tout pour les défauts à la terre.',
      en: 'A short circuit is limited only by the grid’s impedances. Unbalanced faults are computed by joining three balanced networks (positive, negative, zero) according to the fault type. How the neutral is earthed changes everything for ground faults.',
    },
    objective: {
      fr: 'Calculer les quatre types de défauts, comprendre le rôle du neutre et définir la puissance de court-circuit et le SCR.',
      en: 'Compute the four fault types, understand the role of the neutral, and define fault level and SCR.',
    },
    formulas: [
      { tex: r`I_{3\varphi} = E/Z_1`, meaning: { fr: 'Le défaut triphasé, équilibré.', en: 'The balanced three-phase fault.' } },
      { tex: r`I_a = 3E/(Z_1 + Z_2 + Z_0 + 3Z_f)`, meaning: { fr: 'Le défaut phase–terre : les trois réseaux en série.', en: 'The phase-to-ground fault: all three networks in series.' } },
      { tex: r`I_{bc} = \sqrt3\,E/(Z_1 + Z_2)`, meaning: { fr: 'Le défaut biphasé : √3/2 du triphasé.', en: 'The phase-to-phase fault: √3/2 of the three-phase.' } },
      { tex: r`S_{cc} = S_b/|Z_1|,\quad \mathrm{SCR} = S_{cc}/P_n`, meaning: { fr: 'La force du réseau en un point.', en: 'The strength of the grid at a point.' } },
    ],
    exercises: [
      { fr: 'Découvrir l’ampleur d’un courant de défaut.', en: 'Discover the size of a fault current.' },
      { fr: 'Calculer la puissance de court-circuit avec le défaut triphasé.', en: 'Compute the fault level with the three-phase fault.' },
      { fr: 'Voir qu’un neutre isolé supprime le courant mais élève les tensions.', en: 'See that an isolated neutral removes the current but raises voltages.' },
      { fr: 'Trouver un défaut phase–terre plus fort que le triphasé.', en: 'Find a phase-to-ground fault larger than the three-phase.' },
      { fr: 'Vérifier le rapport √3/2 du défaut biphasé.', en: 'Check the √3/2 ratio of the phase-to-phase fault.' },
      { fr: 'Comprendre pourquoi les défauts résistants sont difficiles à détecter.', en: 'Understand why resistive faults are hard to detect.' },
    ],
    tests: [
      { what: { fr: 'Biphasé / triphasé = √3/2 exactement.', en: 'Phase-to-phase / three-phase = √3/2 exactly.' }, why: { fr: 'Vérifie les connexions des réseaux de séquence.', en: 'Checks the sequence-network connections.' } },
      { what: { fr: 'Neutre isolé : courant nul, phases saines à √3 pu.', en: 'Isolated neutral: zero current, healthy phases at √3 pu.' }, why: { fr: 'Vérifie le rôle du réseau homopolaire.', en: 'Checks the role of the zero-sequence network.' } },
      { what: { fr: 'Au poste, phase–terre > triphasé ; une résistance de neutre le réduit.', en: 'At the substation, phase-to-ground > three-phase; a neutral resistor reduces it.' }, why: { fr: 'Garantit l’étape 4.', en: 'Guarantees step 4.' } },
      { what: { fr: 'Le courant baisse avec la distance et avec Rf ; il reste continu à l’instant du défaut.', en: 'The current falls with distance and with Rf; it stays continuous at the fault instant.' }, why: { fr: 'Vérifie la forme d’onde avec composante continue.', en: 'Checks the waveform with its DC offset.' } },
    ],
  },
  '5.4': {
    summary: {
      fr: 'Il faut produire à chaque instant ce qui est consommé, au moindre coût. On appelle les centrales de la moins chère à la plus chère ; le prix est le coût marginal de la dernière. Une ligne saturée oblige à produire plus cher près de la consommation.',
      en: 'Production must match consumption at every moment, at least cost. Plants are called from cheapest to most expensive; the price is the marginal cost of the last one. A congested line forces dearer production near the load.',
    },
    objective: {
      fr: 'Comprendre l’égalité des coûts marginaux, l’ordre de mérite, la congestion et les prix nodaux.',
      en: 'Understand equal incremental cost, the merit order, congestion and nodal prices.',
    },
    formulas: [
      { tex: r`dC_i/dP_i = \lambda`, meaning: { fr: 'Toutes les unités libres tournent au même coût marginal.', en: 'Every unit not at a limit runs at the same marginal cost.' } },
      { tex: r`\sum P_i = D`, meaning: { fr: 'L’équilibre offre–demande.', en: 'The supply–demand balance.' } },
      { tex: r`\lambda_k = \lambda - \mu\,\mathrm{PTDF}_k`, meaning: { fr: 'Le prix au nœud k quand une ligne est saturée.', en: 'The price at bus k when a line is congested.' } },
    ],
    exercises: [
      { fr: 'Découvrir que le prix varie au fil de la journée.', en: 'Discover that the price varies through the day.' },
      { fr: 'Voir la turbine de pointe fixer le prix du soir.', en: 'See the peaker set the evening price.' },
      { fr: 'Constater l’égalité des coûts marginaux.', en: 'See equal marginal costs.' },
      { fr: 'Créer une congestion et des prix nodaux différents.', en: 'Create congestion and different nodal prices.' },
      { fr: 'Voir le solaire faire baisser le prix de midi.', en: 'See solar lower the midday price.' },
      { fr: 'Provoquer un écrêtement derrière une ligne saturée.', en: 'Cause curtailment behind a congested line.' },
    ],
    tests: [
      { what: { fr: 'Les unités libres ont le même coût marginal et l’offre égale la demande.', en: 'Free units share one marginal cost and supply equals demand.' }, why: { fr: 'Vérifie l’optimum.', en: 'Checks the optimum.' } },
      { what: { fr: 'La turbine de pointe ne tourne qu’à forte demande.', en: 'The peaker runs only at high demand.' }, why: { fr: 'Vérifie l’ordre de mérite.', en: 'Checks the merit order.' } },
      { what: { fr: 'Une ligne saturée reste à sa limite, sépare les prix et augmente le coût.', en: 'A congested line stays at its limit, splits prices and raises cost.' }, why: { fr: 'Vérifie les prix nodaux.', en: 'Checks nodal prices.' } },
      { what: { fr: 'Le solaire baisse le prix de midi ; derrière une ligne étroite, il est écrêté.', en: 'Solar lowers the midday price; behind a tight line it is curtailed.' }, why: { fr: 'Garantit les étapes 5 et 6.', en: 'Guarantees steps 5 and 6.' } },
    ],
  },
  '5.5': {
    summary: {
      fr: 'En distribution, le solaire peut faire monter la tension au lieu de la faire baisser, et inverser le sens du flux. La quantité qu’un départ peut accueillir dépend du réglage des onduleurs.',
      en: 'In distribution, solar can raise the voltage instead of lowering it, and reverse the direction of flow. How much a feeder can host depends on how the inverters are controlled.',
    },
    objective: {
      fr: 'Mener une répartition de charge sur une journée et comparer les solutions de réglage de tension.',
      en: 'Run a power flow over a day and compare voltage-control solutions.',
    },
    formulas: [
      { tex: r`\Delta V \approx (RP + XQ)/V`, meaning: { fr: 'En distribution, R pèse autant que X : P fait bouger la tension.', en: 'In distribution, R matters as much as X: P moves the voltage.' } },
      { tex: r`Q_{PV} = -k\,(V - 1)`, meaning: { fr: 'Le réglage Q(V) : absorber du réactif quand la tension monte.', en: 'Q(V) control: absorb reactive power as voltage rises.' } },
      { tex: r`P_0 = \sum P_{charge} - \sum P_{PV}`, meaning: { fr: 'Négatif : flux inverse vers le poste.', en: 'Negative: reverse flow to the substation.' } },
    ],
    exercises: [
      { fr: 'Découvrir que la tension monte en bout de départ à midi.', en: 'Discover that voltage rises at the end of the feeder at midday.' },
      { fr: 'Observer le flux inverse.', en: 'Observe reverse flow.' },
      { fr: 'Trouver la surtension et la capacité d’accueil.', en: 'Find the overvoltage and the hosting capacity.' },
      { fr: 'Résoudre la surtension par le réglage Q(V).', en: 'Fix the overvoltage with Q(V) control.' },
      { fr: 'Voir les limites du régleur en charge seul.', en: 'See the limits of the tap changer alone.' },
      { fr: 'Comparer avec l’écrêtement et l’énergie perdue.', en: 'Compare with curtailment and the energy lost.' },
    ],
    tests: [
      { what: { fr: 'À 13 h la tension du bout dépasse celle du poste ; à 19 h 30 elle est plus basse ; le flux s’inverse plus de 2 h.', en: 'At 1 pm the far-end voltage exceeds the substation’s; at 7:30 pm it is lower; flow reverses for over 2 h.' }, why: { fr: 'Garantit la prédiction et l’étape 2.', en: 'Guarantees the prediction and step 2.' } },
      { what: { fr: 'Sans réglage, capacité d’accueil d’environ 3 MW par nœud.', en: 'Without control, hosting capacity of about 3 MW per node.' }, why: { fr: 'Garantit l’étape 3.', en: 'Guarantees step 3.' } },
      { what: { fr: 'Q(V) tient 3,5 MW par nœud sans écrêter ; l’écrêtement tient 5 MW en perdant de l’énergie ; un poste à 1,00 pu crée une sous-tension le soir.', en: 'Q(V) holds 3.5 MW per node without curtailing; curtailment holds 5 MW while losing energy; a substation at 1.00 pu causes evening undervoltage.' }, why: { fr: 'Garantit les étapes 4 à 6.', en: 'Guarantees steps 4 to 6.' } },
    ],
  },
};
