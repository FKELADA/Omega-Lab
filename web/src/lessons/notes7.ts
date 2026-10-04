// Teaching notes for Module 7 (merged into notes.ts).

import type { LessonNote, ModuleNote } from './notes';

const r = String.raw;

export const module7Note: ModuleNote = {
  summary: {
    fr: 'Les sources d’aujourd’hui — solaire, éolien, batteries, liaisons CCHT — se raccordent au réseau par des onduleurs. Leur comportement n’est pas dicté par la physique d’une machine tournante, mais par leur commande.',
    en: 'Today’s sources — solar, wind, batteries, HVDC links — connect to the grid through inverters. Their behaviour is not dictated by the physics of a rotating machine, but by their control.',
  },
  objective: {
    fr: 'Comprendre comment on commande un onduleur, ce qui distingue suiveur et formeur de réseau, comment chaque technologie produit, et ce que les codes de réseau exigent.',
    en: 'Understand how an inverter is controlled, what separates grid-following from grid-forming, how each technology produces, and what grid codes require.',
  },
  path: {
    fr: '7.1 commande des VSC → 7.2 suiveur ou formeur → 7.3 photovoltaïque → 7.4 éolien → 7.5 batteries → 7.6 CCHT et MMC → 7.7 codes de réseau.',
    en: '7.1 VSC control → 7.2 grid-following or grid-forming → 7.3 PV → 7.4 wind → 7.5 batteries → 7.6 HVDC and MMC → 7.7 grid codes.',
  },
};

export const module7Notes: Record<string, LessonNote> = {
  '7.1': {
    summary: {
      fr: 'Un onduleur raccordé au réseau se commande par boucles imbriquées : une boucle de courant rapide, des boucles de puissance plus lentes, et une PLL qui donne l’angle du réseau.',
      en: 'A grid-connected inverter is controlled by nested loops: a fast current loop, slower power loops, and a PLL that provides the grid angle.',
    },
    objective: {
      fr: 'Régler les bandes passantes, comprendre le découplage P/Q et la limitation de courant, et voir les limites sur réseau faible.',
      en: 'Set the bandwidths, understand P/Q decoupling and current limiting, and see the limits on a weak grid.',
    },
    formulas: [
      { tex: r`P = v_d i_d,\ Q = -v_d i_q`, meaning: { fr: 'Dans le repère de la tension, P et Q se règlent séparément.', en: 'In the voltage frame, P and Q are set separately.' } },
      { tex: r`K_p = \omega_c L_f`, meaning: { fr: 'Le gain de la boucle de courant pour une bande passante ωc.', en: 'The current-loop gain for a bandwidth ωc.' } },
      { tex: r`f_o \ll f_c \ll f_s`, meaning: { fr: 'La séparation des échelles de temps.', en: 'Time-scale separation.' } },
    ],
    exercises: [
      { fr: 'Découvrir la montée progressive de la puissance.', en: 'Discover the gradual rise of power.' },
      { fr: 'Accélérer la boucle externe.', en: 'Speed up the outer loop.' },
      { fr: 'Voir ce que coûte une boucle interne trop lente.', en: 'See the cost of a too-slow inner loop.' },
      { fr: 'Vérifier le découplage P/Q.', en: 'Check P/Q decoupling.' },
      { fr: 'Atteindre la limite de courant.', en: 'Reach the current limit.' },
      { fr: 'Rendre le système instable sur réseau faible.', en: 'Make the system unstable on a weak grid.' },
    ],
    tests: [
      { what: { fr: 'P et Q atteignent leurs consignes avec moins de 0,02 pu de couplage.', en: 'P and Q reach their setpoints with under 0.02 pu of coupling.' }, why: { fr: 'Vérifie la commande vectorielle.', en: 'Checks vector control.' } },
      { what: { fr: 'Temps de montée ≈ 0,35/f₀ ; priorité à P en limitation.', en: 'Rise time ≈ 0.35/f₀; P priority when limited.' }, why: { fr: 'Garantit les étapes 2 et 5.', en: 'Guarantees steps 2 and 5.' } },
      { what: { fr: 'PLL à 100 Hz : instable à SCR 1,5, stable à SCR 3 ; PLL à 20 Hz stable à SCR 1,5.', en: '100 Hz PLL: unstable at SCR 1.5, stable at SCR 3; 20 Hz PLL stable at SCR 1.5.' }, why: { fr: 'Garantit l’étape 6.', en: 'Guarantees step 6.' } },
    ],
  },
  '7.2': {
    summary: {
      fr: 'Un onduleur suiveur injecte un courant calé sur la tension qu’il mesure. Un onduleur formeur impose lui-même une tension, comme un alternateur : il réagit instantanément aux perturbations et peut tenir un réseau seul.',
      en: 'A grid-following inverter injects a current locked to the voltage it measures. A grid-forming inverter imposes a voltage itself, like a generator: it reacts instantly to disturbances and can hold a grid on its own.',
    },
    objective: {
      fr: 'Comparer les deux familles face à un saut de phase, une chute de fréquence et un réseau faible.',
      en: 'Compare both families under a phase jump, a frequency drop and a weak grid.',
    },
    formulas: [
      { tex: r`2H\dot\omega = P^* - P - (\omega-1)/m`, meaning: { fr: 'La machine synchrone virtuelle : inertie et statisme.', en: 'The virtual synchronous machine: inertia and droop.' } },
      { tex: r`P = \tfrac{EV}{X}\sin(\delta - \theta_g)`, meaning: { fr: 'La puissance du formeur suit l’angle à travers sa réactance.', en: 'The grid-forming power follows the angle across its reactance.' } },
      { tex: r`\Delta P = -2H\,\dot f / f_0`, meaning: { fr: 'La puissance d’inertie pendant une rampe de fréquence.', en: 'Inertial power during a frequency ramp.' } },
    ],
    exercises: [
      { fr: 'Découvrir la réponse instantanée du formeur.', en: 'Discover the grid-forming unit’s instant response.' },
      { fr: 'Comparer formeur et suiveur sur un saut de phase.', en: 'Compare both on a phase jump.' },
      { fr: 'Voir inertie et statisme lors d’une chute de fréquence.', en: 'See inertia and droop in a frequency drop.' },
      { fr: 'Augmenter l’inertie virtuelle.', en: 'Increase the virtual inertia.' },
      { fr: 'Voir le suiveur décrocher sur réseau très faible.', en: 'See the follower fail on a very weak grid.' },
    ],
    tests: [
      { what: { fr: 'Saut de phase : ΔP du formeur > 0,5 pu et > 10 fois celui du suiveur.', en: 'Phase jump: grid-forming ΔP > 0.5 pu and > 10 times the follower’s.' }, why: { fr: 'Garantit la prédiction et l’étape 2.', en: 'Guarantees the prediction and step 2.' } },
      { what: { fr: 'Chute de fréquence : part de statisme = Δf/(m f₀) ; plus d’inertie, plus de réponse ; le suiveur ne bouge pas.', en: 'Frequency drop: droop share = Δf/(m f₀); more inertia, more response; the follower does not move.' }, why: { fr: 'Garantit les étapes 3 et 4.', en: 'Guarantees steps 3 and 4.' } },
      { what: { fr: 'SCR 1,3 et PLL rapide : le suiveur est instable.', en: 'SCR 1.3 and a fast PLL: the follower is unstable.' }, why: { fr: 'Garantit l’étape 5.', en: 'Guarantees step 5.' } },
    ],
  },
  '7.3': {
    summary: {
      fr: 'Un module solaire est une source de courant proportionnelle à l’ensoleillement. Sa puissance dépend de la tension imposée : l’onduleur cherche en permanence le point de puissance maximale.',
      en: 'A solar module is a current source proportional to irradiance. Its power depends on the voltage imposed: the inverter keeps searching for the maximum power point.',
    },
    objective: {
      fr: 'Lire les courbes I–V et P–V, comprendre l’algorithme P&O, l’effet de la température et de l’ombrage.',
      en: 'Read the I–V and P–V curves, understand the P&O algorithm, and the effects of temperature and shading.',
    },
    formulas: [
      { tex: r`I = I_{ph} - I_0(e^{V/(nN_sV_T)} - 1)`, meaning: { fr: 'Le modèle à une diode.', en: 'The single-diode model.' } },
      { tex: r`dP/dV = 0`, meaning: { fr: 'Le point de puissance maximale.', en: 'The maximum power point.' } },
      { tex: r`V_{k+1} = V_k \pm \Delta V`, meaning: { fr: 'Perturber et observer.', en: 'Perturb and observe.' } },
    ],
    exercises: [
      { fr: 'Découvrir l’effet d’un nuage.', en: 'Discover the effect of a cloud.' },
      { fr: 'Suivre l’algorithme qui grimpe vers le maximum.', en: 'Follow the algorithm climbing to the maximum.' },
      { fr: 'Voir la chaleur réduire la puissance.', en: 'See heat reduce power.' },
      { fr: 'Comprendre le compromis du pas de recherche.', en: 'Understand the search-step trade-off.' },
      { fr: 'Voir l’ombrage piéger l’algorithme.', en: 'See shading trap the algorithm.' },
      { fr: 'Le libérer par un balayage global.', en: 'Free it with a global scan.' },
    ],
    tests: [
      { what: { fr: 'Isc = 9,5 A, Voc = 37,8 V, un seul maximum ; −12 % de puissance à 65 °C ; puissance ∝ ensoleillement.', en: 'Isc = 9.5 A, Voc = 37.8 V, one maximum; −12 % power at 65 °C; power ∝ irradiance.' }, why: { fr: 'Vérifie le modèle de cellule.', en: 'Checks the cell model.' } },
      { what: { fr: 'P&O > 99 % avec un petit pas ; oscillation 5 fois plus grande avec un grand pas.', en: 'P&O > 99 % with a small step; oscillation 5 times larger with a large step.' }, why: { fr: 'Garantit l’étape 4.', en: 'Guarantees step 4.' } },
      { what: { fr: 'Ombrage : deux maxima, P&O bloqué sur le local, le balayage trouve le global.', en: 'Shading: two maxima, P&O stuck on the local one, the scan finds the global one.' }, why: { fr: 'Garantit les étapes 5 et 6.', en: 'Guarantees steps 5 and 6.' } },
    ],
  },
  '7.4': {
    summary: {
      fr: 'Une éolienne capte une partie de l’énergie du vent, qui croît comme le cube de sa vitesse. Sous la vitesse nominale, on règle la vitesse du rotor pour capter le maximum ; au-dessus, on oriente les pales pour limiter la puissance.',
      en: 'A wind turbine captures part of the wind’s energy, which grows with the cube of its speed. Below rated wind, rotor speed is set to capture the maximum; above it, the blades are pitched to limit power.',
    },
    objective: {
      fr: 'Lire Cp(λ, β) et la courbe de puissance, comprendre le calage et l’inertie synthétique.',
      en: 'Read Cp(λ, β) and the power curve, understand pitch control and synthetic inertia.',
    },
    formulas: [
      { tex: r`P = \tfrac12\rho\pi R^2 v^3 C_p`, meaning: { fr: 'La puissance captée.', en: 'The power captured.' } },
      { tex: r`\lambda = \Omega R / v`, meaning: { fr: 'La vitesse spécifique, à tenir à sa valeur optimale.', en: 'The tip-speed ratio, held at its optimum.' } },
      { tex: r`C_p < 16/27`, meaning: { fr: 'La limite de Betz.', en: 'The Betz limit.' } },
    ],
    exercises: [
      { fr: 'Découvrir l’effet cubique d’une rafale.', en: 'Discover the cubic effect of a gust.' },
      { fr: 'Rester au sommet de Cp quelle que soit la vitesse du vent.', en: 'Stay at the top of Cp whatever the wind speed.' },
      { fr: 'Plafonner la puissance par le calage.', en: 'Cap power by pitching.' },
      { fr: 'Voir le calage absorber une forte rafale.', en: 'See pitch absorb a strong gust.' },
      { fr: 'Soutenir la fréquence par inertie synthétique.', en: 'Support frequency with synthetic inertia.' },
    ],
    tests: [
      { what: { fr: 'Cp max ≈ 0,48 à λ ≈ 8,1, sous Betz ; courbe de puissance en v³ puis plafonnée.', en: 'Cp max ≈ 0.48 at λ ≈ 8.1, below Betz; power curve in v³ then capped.' }, why: { fr: 'Vérifie l’aérodynamique.', en: 'Checks the aerodynamics.' } },
      { what: { fr: 'Pas de calage sous le nominal ; au-dessus, la puissance reste < 2,1 MW malgré une rafale de 6 m/s.', en: 'No pitch below rated; above, power stays < 2.1 MW despite a 6 m/s gust.' }, why: { fr: 'Garantit les étapes 3 et 4.', en: 'Guarantees steps 3 and 4.' } },
      { what: { fr: 'L’inertie synthétique ajoute > 0,15 MW puis provoque un creux de reprise.', en: 'Synthetic inertia adds > 0.15 MW, then causes a recovery dip.' }, why: { fr: 'Garantit l’étape 5.', en: 'Guarantees step 5.' } },
    ],
  },
  '7.5': {
    summary: {
      fr: 'Quand une centrale déclenche, la fréquence chute à une vitesse fixée par l’inertie, puis remonte grâce aux réserves. Une batterie répond en une fraction de seconde : elle limite le creux, tant qu’il lui reste de l’énergie.',
      en: 'When a plant trips, frequency falls at a rate set by inertia, then recovers thanks to reserves. A battery responds within a fraction of a second: it limits the nadir, as long as it has energy left.',
    },
    objective: {
      fr: 'Relier inertie, RoCoF, creux, puissance, énergie et rapidité de la batterie.',
      en: 'Relate inertia, RoCoF, nadir, battery power, energy and speed.',
    },
    formulas: [
      { tex: r`\dot f = -\Delta P\, f_0 / (2HS)`, meaning: { fr: 'La pente initiale, fixée par l’inertie.', en: 'The initial slope, set by inertia.' } },
      { tex: r`P_b = -K\,\Delta f`, meaning: { fr: 'La réponse en statisme.', en: 'The droop response.' } },
      { tex: r`E = \int P_b\,dt`, meaning: { fr: 'L’énergie consommée, limitée par la capacité.', en: 'The energy used, limited by the capacity.' } },
    ],
    exercises: [
      { fr: 'Découvrir le creux de fréquence.', en: 'Discover the frequency nadir.' },
      { fr: 'Remonter le creux avec une batterie.', en: 'Raise the nadir with a battery.' },
      { fr: 'Voir qu’une réponse lente arrive trop tard.', en: 'See that a slow response arrives too late.' },
      { fr: 'Vider la batterie en plein événement.', en: 'Empty the battery mid-event.' },
      { fr: 'Comparer statisme et FFR déclenchée.', en: 'Compare droop and triggered FFR.' },
      { fr: 'Compenser une baisse d’inertie.', en: 'Compensate for lower inertia.' },
    ],
    tests: [
      { what: { fr: 'RoCoF initial = ΔP·f₀/(2HS).', en: 'Initial RoCoF = ΔP·f₀/(2HS).' }, why: { fr: 'Vérifie l’équation du réseau.', en: 'Checks the system equation.' } },
      { what: { fr: '600 MW rapides remontent le creux de plus de 0,15 Hz ; lents, nettement moins ; 2 MWh se vident en moins de 30 s.', en: '600 MW fast raise the nadir by over 0.15 Hz; slow, much less; 2 MWh empty in under 30 s.' }, why: { fr: 'Garantit les étapes 2 à 4.', en: 'Guarantees steps 2 to 4.' } },
      { what: { fr: 'H = 2 s creuse le creux ; 400 MW le ramènent au-dessus de 49,4 Hz.', en: 'H = 2 s deepens the nadir; 400 MW bring it back above 49.4 Hz.' }, why: { fr: 'Garantit l’étape 6.', en: 'Guarantees step 6.' } },
    ],
  },
  '7.6': {
    summary: {
      fr: 'Un convertisseur modulaire multiniveau empile des centaines de petits sous-modules à condensateur. En insérant le bon nombre de sous-modules, il fabrique une tension en escalier presque sinusoïdale. C’est le cœur des liaisons CCHT modernes.',
      en: 'A modular multilevel converter stacks hundreds of small capacitor sub-modules. By inserting the right number of them, it builds a nearly sinusoidal staircase voltage. It is the heart of modern HVDC links.',
    },
    objective: {
      fr: 'Comprendre la modulation au plus proche niveau, l’équilibrage des condensateurs, leur dimensionnement et le problème des défauts continus.',
      en: 'Understand nearest-level modulation, capacitor balancing, capacitor sizing and the DC-fault problem.',
    },
    formulas: [
      { tex: r`n = \mathrm{round}\big(\tfrac N2(1 - v^*/\tfrac{V_{dc}}2)\big)`, meaning: { fr: 'Le nombre de sous-modules insérés dans le bras haut.', en: 'The number of sub-modules inserted in the upper arm.' } },
      { tex: r`C\,\dot v_c = s\,i_{bras}`, meaning: { fr: 'Un sous-module inséré se charge ou se décharge.', en: 'An inserted sub-module charges or discharges.' } },
      { tex: r`\Delta v_c \propto 1/C`, meaning: { fr: 'L’ondulation diminue avec la capacité.', en: 'Ripple falls with capacitance.' } },
    ],
    exercises: [
      { fr: 'Réduire la distorsion avec plus de sous-modules.', en: 'Reduce distortion with more sub-modules.' },
      { fr: 'Voir l’insertion complémentaire des deux bras.', en: 'See the complementary insertion of both arms.' },
      { fr: 'Laisser les condensateurs dériver.', en: 'Let the capacitors drift.' },
      { fr: 'Les rééquilibrer par le tri.', en: 'Rebalance them by sorting.' },
      { fr: 'Voir l’ondulation des petits condensateurs.', en: 'See the ripple of small capacitors.' },
      { fr: 'Choisir le sous-module qui éteint un défaut continu.', en: 'Choose the sub-module that clears a DC fault.' },
    ],
    tests: [
      { what: { fr: 'La DHT diminue avec N et passe sous 5 % à N = 20.', en: 'THD falls with N and drops below 5 % at N = 20.' }, why: { fr: 'Garantit l’étape 1.', en: 'Guarantees step 1.' } },
      { what: { fr: 'Dispersion < 2 % avec tri, > 10 % sans ; ondulation ∝ 1/C.', en: 'Spread < 2 % with sorting, > 10 % without; ripple ∝ 1/C.' }, why: { fr: 'Garantit les étapes 3 à 5.', en: 'Guarantees steps 3 to 5.' } },
      { what: { fr: 'Le pont complet annule le courant de défaut ; le demi-pont le laisse monter.', en: 'The full-bridge clears the fault current; the half-bridge lets it rise.' }, why: { fr: 'Garantit l’étape 6.', en: 'Guarantees step 6.' } },
    ],
  },
  '7.7': {
    summary: {
      fr: 'Les codes de réseau imposent aux parcs de rester connectés pendant les creux de tension et d’aider le réseau en injectant du courant réactif. Un banc d’essai vérifie la conformité.',
      en: 'Grid codes require plants to stay connected during voltage dips and to help the grid by injecting reactive current. A test bench checks compliance.',
    },
    objective: {
      fr: 'Lire un gabarit de tenue aux creux, régler l’injection de réactif et la reprise de la puissance active.',
      en: 'Read a ride-through envelope, set reactive injection and active-power recovery.',
    },
    formulas: [
      { tex: r`V(t) \ge V_{gabarit}(t)`, meaning: { fr: 'Au-dessus du gabarit, il faut rester connecté.', en: 'Above the envelope, the plant must stay connected.' } },
      { tex: r`\Delta i_q = K(\Delta V - 0{,}1)`, meaning: { fr: 'L’injection de courant réactif.', en: 'Reactive-current injection.' } },
      { tex: r`i_p \le \sqrt{I_{max}^2 - i_q^2}`, meaning: { fr: 'Le réactif est prioritaire.', en: 'Reactive current has priority.' } },
    ],
    exercises: [
      { fr: 'Découvrir l’injection de réactif pendant un creux.', en: 'Discover reactive injection during a dip.' },
      { fr: 'Voir une protection ancienne déclencher à tort.', en: 'See legacy protection trip wrongly.' },
      { fr: 'Passer au réglage conforme.', en: 'Switch to the compliant setting.' },
      { fr: 'Saturer le courant sur un creux profond.', en: 'Saturate the current in a deep dip.' },
      { fr: 'Passer sous le gabarit.', en: 'Go below the envelope.' },
      { fr: 'Voir l’effet d’une reprise lente.', en: 'See the effect of a slow recovery.' },
    ],
    tests: [
      { what: { fr: 'La protection ancienne déclenche sur un creux à tenir : non conforme.', en: 'The legacy protection trips on a dip to ride through: non-compliant.' }, why: { fr: 'Garantit l’étape 2.', en: 'Guarantees step 2.' } },
      { what: { fr: 'Réglage conforme : pas de déclenchement, iq = K(ΔV − 0,1) en moins de 60 ms.', en: 'Compliant setting: no trip, iq = K(ΔV − 0.1) within 60 ms.' }, why: { fr: 'Garantit l’étape 3.', en: 'Guarantees step 3.' } },
      { what: { fr: 'Creux profond : iq saturé ; sous le gabarit : déclenchement admis ; rampe lente : reprise 5 fois plus longue.', en: 'Deep dip: iq saturated; below the envelope: tripping allowed; slow ramp: 5 times longer recovery.' }, why: { fr: 'Garantit les étapes 4 à 6.', en: 'Guarantees steps 4 to 6.' } },
    ],
  },
};
