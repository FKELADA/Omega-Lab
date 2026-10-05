// Module 7 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers7: Answers = {
  vsc: {
    predict: {
      hint: { fr: r`La boucle de puissance a une bande passante de 5 Hz : quelle constante de temps ? Et le réactif demandé plus tard touche-t-il $P$ ?`, en: r`The power loop has a 5 Hz bandwidth: what time constant is that? And does the reactive request later affect $P$?` },
      answer: {
        fr: r`$P$ monte vers 0,8 pu comme un premier ordre, avec la constante de temps de la boucle externe, puis reste presque inchangée quand le réactif est demandé : les axes $d$ et $q$ sont découplés. $$\tau \approx \frac{1}{2\pi f_{ext}} \approx 32\ \text{ms}, \qquad P = \tfrac32 v_d i_d, \quad Q = -\tfrac32 v_d i_q$$`,
        en: r`$P$ rises to 0.8 pu like a first-order system with the outer loop’s time constant, then stays almost unchanged when reactive power is requested: the $d$ and $q$ axes are decoupled. $$\tau \approx \frac{1}{2\pi f_{outer}} \approx 32\ \text{ms}, \qquad P = \tfrac32 v_d i_d, \quad Q = -\tfrac32 v_d i_q$$`,
      },
    },
    outer: {
      hint: { fr: r`Montez la bande passante des boucles externes vers 20–30 Hz (en gardant la boucle de courant bien plus rapide).`, en: r`Raise the outer-loop bandwidth to 20–30 Hz (keeping the current loop much faster).` },
      answer: {
        fr: r`Le temps de montée d’un premier ordre vaut environ $2{,}2\,\tau$ : $$t_m \approx \frac{2{,}2}{2\pi f_{ext}} \;\Rightarrow\; f_{ext} > 18\ \text{Hz pour } t_m < 20\ \text{ms}$$ Un onduleur peut changer sa puissance en quelques dizaines de millisecondes, bien plus vite qu’une centrale thermique : c’est ce qui permet les services de réponse rapide.`,
        en: r`A first-order rise time is about $2.2\,\tau$: $$t_r \approx \frac{2.2}{2\pi f_{outer}} \;\Rightarrow\; f_{outer} > 18\ \text{Hz for } t_r < 20\ \text{ms}$$ An inverter can change its power within tens of milliseconds, far faster than a thermal plant: that is what enables fast-response services.`,
      },
    },
    inner: {
      hint: { fr: r`Baissez la bande passante de courant $f_c$ sous 5 fois celle de la boucle externe, puis affichez $i_d$ et $i_d^*$.`, en: r`Lower the current bandwidth $f_c$ below 5 times the outer loop’s, then show $i_d$ and $i_d^*$.` },
      answer: {
        fr: r`La commande en cascade suppose que la boucle interne suit sa référence « instantanément » vu de la boucle externe : $$f_c \ge 5 \text{ à } 10 \times f_{ext}$$ Sinon les deux boucles interagissent : dépassements, couplage, voire instabilité. La même règle sépare la boucle de courant du découpage ($f_c \le f_s/10$).`,
        en: r`Cascaded control assumes the inner loop tracks its reference “instantly” as seen by the outer loop: $$f_c \ge 5 \text{ to } 10 \times f_{outer}$$ Otherwise the two loops interact: overshoot, coupling, even instability. The same rule separates the current loop from switching ($f_c \le f_s/10$).`,
      },
    },
    decouple: {
      hint: { fr: r`Remontez $f_c$ à au moins 5 fois $f_{ext}$ et regardez le plan P–Q.`, en: r`Raise $f_c$ back to at least 5 times $f_{outer}$ and look at the P–Q plane.` },
      answer: {
        fr: r`Dans le repère $dq$ aligné par la PLL, les équations de l’inductance de sortie se couplent par $\omega L$ : $$v_d = R i_d + L\frac{di_d}{dt} - \omega L i_q + e_d, \qquad v_q = R i_q + L\frac{di_q}{dt} + \omega L i_d + e_q$$ La commande compense ces termes croisés (découplage) ; avec des boucles bien séparées, $P$ et $Q$ se commandent indépendamment.`,
        en: r`In the PLL-aligned $dq$ frame, the output inductor equations are coupled through $\omega L$: $$v_d = R i_d + L\frac{di_d}{dt} - \omega L i_q + e_d, \qquad v_q = R i_q + L\frac{di_q}{dt} + \omega L i_d + e_q$$ The control cancels these cross terms (decoupling); with well-separated loops, $P$ and $Q$ are controlled independently.`,
      },
    },
    limit: {
      hint: { fr: r`$P^* = 1$ pu et $Q^* = 0{,}7$ pu.`, en: r`$P^* = 1$ pu and $Q^* = 0.7$ pu.` },
      answer: {
        fr: r`Les semi-conducteurs ne supportent pas de surintensité : le courant est limité, en général à 1,1–1,2 pu. $$\sqrt{i_d^2 + i_q^2} \le I_{max}$$ Il faut choisir une priorité : ici $P$ d’abord. Pendant un défaut, les codes de réseau imposent au contraire la priorité au réactif (leçon 7.7).`,
        en: r`Semiconductors cannot handle overcurrent: current is limited, usually to 1.1–1.2 pu. $$\sqrt{i_d^2 + i_q^2} \le I_{max}$$ A priority must be chosen: here $P$ first. During a fault, grid codes instead require reactive priority (lesson 7.7).`,
      },
    },
    weak: {
      hint: { fr: r`SCR sous 2, bande passante de la PLL au-delà de 80 Hz.`, en: r`SCR below 2, PLL bandwidth beyond 80 Hz.` },
      answer: {
        fr: r`Sur un réseau faible, le courant injecté par l’onduleur déplace sensiblement la tension à ses bornes, que la PLL mesure. Une PLL rapide réagit à sa propre action : la boucle onduleur–réseau–PLL perd sa marge. $$\Delta\theta_{PCC} \approx \frac{X_g}{V}\,\Delta i_q, \qquad X_g = \frac{1}{\text{SCR}}$$ D’où les règles pratiques : PLL lente et commande adaptée en dessous d’un SCR de 2 à 3, ou commande « grid-forming » (leçon 7.2).`,
        en: r`On a weak grid, the current injected by the inverter noticeably moves the voltage at its terminals, which the PLL measures. A fast PLL reacts to its own action: the inverter–grid–PLL loop loses its margin. $$\Delta\theta_{PCC} \approx \frac{X_g}{V}\,\Delta i_q, \qquad X_g = \frac{1}{\text{SCR}}$$ Hence the practical rules: slow PLL and adapted control below an SCR of 2 to 3, or grid-forming control (lesson 7.2).`,
      },
    },
  },

  gfm: {
    predict: {
      hint: { fr: r`Un formeur est une source de tension derrière une réactance, comme un alternateur. Que fait la puissance d’un alternateur quand l’angle du réseau recule brusquement ?`, en: r`A grid-forming inverter is a voltage source behind a reactance, like a generator. What does a generator’s power do when the grid angle suddenly falls back?` },
      answer: {
        fr: r`La puissance du formeur **saute aussitôt** (son angle interne n’a pas bougé, l’écart d’angle augmente d’un coup), puis revient vers sa consigne en oscillant légèrement, à la vitesse de son inertie virtuelle : $$\Delta P(0^+) = \frac{EV}{X}\cos\delta_0\,\Delta\theta, \qquad 2H\frac{d\omega}{dt} = P^* - P - D\,\Delta\omega$$ Ce réflexe instantané, sans mesure ni régulation, est ce qui stabilise un réseau.`,
        en: r`The grid-forming power **jumps at once** (its internal angle did not move, so the angle difference widens instantly), then returns to its setpoint with a slight oscillation, at the pace of its virtual inertia: $$\Delta P(0^+) = \frac{EV}{X}\cos\delta_0\,\Delta\theta, \qquad 2H\frac{d\omega}{dt} = P^* - P - D\,\Delta\omega$$ This instant reflex, with no measurement or control loop, is what stabilises a grid.`,
      },
    },
    compare: {
      hint: { fr: r`Événement « saut de phase », puis parcourez le temps juste après 0,1 s.`, en: r`“Phase jump” event, then scrub just past 0.1 s.` },
      answer: {
        fr: r`Le suiveur (GFL) est une source de **courant** synchronisée par sa PLL : il continue d’injecter le même courant, sa puissance bouge à peine. Le formeur (GFM) est une source de **tension** : il répond naturellement, comme une machine synchrone. Un réseau à 100 % d’onduleurs a besoin d’une part de formeurs pour tenir sa tension et sa fréquence.`,
        en: r`The grid-following (GFL) unit is a **current** source synchronised by its PLL: it keeps injecting the same current, its power barely moves. The grid-forming (GFM) unit is a **voltage** source: it responds naturally, like a synchronous machine. A 100 % inverter grid needs a share of grid-forming units to hold its voltage and frequency.`,
      },
    },
    rocof: {
      hint: { fr: r`Choisissez l’événement « chute de fréquence ».`, en: r`Choose the “frequency ramp” event.` },
      answer: {
        fr: r`Le formeur fournit une puissance proportionnelle au RoCoF pendant la rampe (inertie), puis à l’écart de fréquence (statisme) : $$\Delta P = -2H\,\frac{d\Delta f}{dt}\Big/f_0 - \frac{1}{R}\,\frac{\Delta f}{f_0}$$ Le suiveur, sans fonction de fréquence ajoutée, reste à sa consigne. Pour la batterie ou le parc qui l’héberge, cette énergie doit être réservée.`,
        en: r`The grid-forming unit supplies power proportional to the RoCoF during the ramp (inertia), then to the frequency deviation (droop): $$\Delta P = -2H\,\frac{d\Delta f}{dt}\Big/f_0 - \frac{1}{R}\,\frac{\Delta f}{f_0}$$ The grid-following unit, without added frequency functions, stays at its setpoint. For the battery or plant hosting it, that energy must be reserved.`,
      },
    },
    inertia: {
      hint: { fr: r`Chute de fréquence, inertie virtuelle $H$ à 8 s.`, en: r`Frequency ramp, virtual inertia $H$ at 8 s.` },
      answer: {
        fr: r`La puissance inertielle est proportionnelle à $H$ : $$P_{inertie} = 2H\,S_n\,\frac{1}{f_0}\left|\frac{df}{dt}\right|$$ Avec $H = 8$ s et −1 Hz/s, cela fait 0,32 pu. Contrairement à une machine, l’onduleur peut choisir son $H$, mais l’énergie et la surcharge en courant doivent suivre.`,
        en: r`Inertial power is proportional to $H$: $$P_{inertia} = 2H\,S_n\,\frac{1}{f_0}\left|\frac{df}{dt}\right|$$ With $H = 8$ s and −1 Hz/s, that is 0.32 pu. Unlike a machine, the inverter can choose its $H$, but the energy and current headroom must follow.`,
      },
    },
    weak: {
      hint: { fr: r`Saut de phase, SCR sous 1,6, PLL du suiveur à 80 Hz ou plus.`, en: r`Phase jump, SCR below 1.6, grid-following PLL at 80 Hz or more.` },
      answer: {
        fr: r`Le suiveur dépend de sa PLL, qui devient instable sur un réseau très faible (leçons 7.1 et 8.5). Le formeur n’a pas besoin de PLL : il se synchronise par la puissance, comme une machine, et reste stable même avec un SCR proche de 1. C’est pourquoi les codes de réseau commencent à exiger des capacités « grid-forming » (Royaume-Uni, Australie, ENTSO-E).`,
        en: r`The grid-following unit relies on its PLL, which becomes unstable on a very weak grid (lessons 7.1 and 8.5). The grid-forming unit needs no PLL: it synchronises through power, like a machine, and stays stable even with an SCR close to 1. That is why grid codes are starting to require grid-forming capability (Great Britain, Australia, ENTSO-E).`,
      },
    },
  },

  pvmppt: {
    predict: {
      hint: { fr: r`Le courant d’un panneau est proportionnel à l’ensoleillement. Et l’algorithme doit retrouver le nouveau maximum…`, en: r`A panel’s current is proportional to irradiance. And the algorithm has to find the new maximum…` },
      answer: {
        fr: r`La puissance tombe **presque aussitôt** de moitié (le courant suit l’ensoleillement), puis l’algorithme réajuste la tension en quelques pas et la puissance se stabilise vers 50 % de la valeur initiale, avec une petite oscillation autour du maximum. $$I_{sc} \propto G, \qquad P_{max} \approx V_{mp}\,I_{mp} \propto G$$`,
        en: r`Power drops **almost at once** by half (current follows irradiance), then the algorithm readjusts the voltage in a few steps and power settles near 50 % of its initial value, with a small oscillation around the maximum. $$I_{sc} \propto G, \qquad P_{max} \approx V_{mp}\,I_{mp} \propto G$$`,
      },
    },
    climb: {
      hint: { fr: r`Faites glisser le curseur de temps jusqu’à la fin.`, en: r`Drag the time cursor to the end.` },
      answer: {
        fr: r`« Perturber et observer » : l’onduleur change la tension d’un pas $\Delta V$ et regarde si la puissance augmente. Si oui, il continue dans le même sens ; sinon, il fait demi-tour. $$\text{sign}(\Delta V_{k+1}) = \text{sign}(\Delta V_k)\cdot\text{sign}(\Delta P_k)$$ Arrivé au sommet ($dP/dV = 0$), il oscille de part et d’autre.`,
        en: r`“Perturb and observe”: the inverter changes the voltage by a step $\Delta V$ and checks whether power increases. If so, it keeps going the same way; if not, it turns back. $$\text{sign}(\Delta V_{k+1}) = \text{sign}(\Delta V_k)\cdot\text{sign}(\Delta P_k)$$ At the top ($dP/dV = 0$), it oscillates on either side.`,
      },
    },
    heat: {
      hint: { fr: r`Montez la température $T$ à 60 °C.`, en: r`Raise the temperature $T$ to 60 °C.` },
      answer: {
        fr: r`La tension d’un panneau au silicium baisse d’environ 0,3 % par degré, sa puissance d’environ 0,4 % par degré : $$P_{max}(T) \approx P_{max,25}\,[1 - 0{,}004\,(T - 25)]$$ À 60 °C, environ 14 % de moins qu’à 25 °C. C’est pourquoi les panneaux produisent mieux par une journée froide et ensoleillée, et qu’on soigne leur ventilation.`,
        en: r`A silicon panel’s voltage falls by about 0.3 % per degree, its power by about 0.4 % per degree: $$P_{max}(T) \approx P_{max,25}\,[1 - 0.004\,(T - 25)]$$ At 60 °C, about 14 % less than at 25 °C. That is why panels do best on cold sunny days, and why their ventilation matters.`,
      },
    },
    step: {
      hint: { fr: r`Montez le pas $\Delta V$ à 2 V ou plus.`, en: r`Raise the step $\Delta V$ to 2 V or more.` },
      answer: {
        fr: r`Un grand pas suit vite les changements d’ensoleillement, mais oscille loin du sommet ; un petit pas colle au sommet mais réagit lentement. La perte autour d’un sommet arrondi croît comme le carré du pas : $$\Delta P \approx \tfrac12\left|\frac{d^2P}{dV^2}\right|\Delta V^2$$ Les algorithmes à pas variable prennent de grands pas loin du maximum et de petits pas près de lui.`,
        en: r`A large step tracks irradiance changes quickly but oscillates far from the top; a small step hugs the top but reacts slowly. The loss around a rounded peak grows with the square of the step: $$\Delta P \approx \tfrac12\left|\frac{d^2P}{dV^2}\right|\Delta V^2$$ Variable-step algorithms take big steps far from the maximum and small ones near it.`,
      },
    },
    shade: {
      hint: { fr: r`Pas $\Delta V$ sous 1 V, ombrage d’une sous-chaîne à 0,5 ou plus.`, en: r`Step $\Delta V$ below 1 V, shading of one sub-string at 0.5 or more.` },
      answer: {
        fr: r`Les cellules ombragées sont court-circuitées par leurs diodes de dérivation : la courbe P–V présente deux maxima. « Perturber et observer » ne voit que la pente locale : il s’arrête sur le premier sommet trouvé, qui peut être le plus bas. La perte peut dépasser 30 % de la production.`,
        en: r`Shaded cells are bypassed by their diodes: the P–V curve has two maxima. “Perturb and observe” only sees the local slope: it stops on the first peak it finds, which may be the lower one. The loss can exceed 30 % of the output.`,
      },
    },
    scan: {
      hint: { fr: r`Activez le balayage global, en gardant l’ombrage.`, en: r`Turn on the global scan, keeping the shading.` },
      answer: {
        fr: r`Le balayage parcourt périodiquement toute la plage de tension, mémorise le maximum global et y relance la recherche locale. Il coûte un peu de production pendant le balayage (une fraction de seconde), mais garantit de ne pas rester sur un sommet secondaire. Tous les onduleurs modernes l’utilisent.`,
        en: r`The scan periodically sweeps the whole voltage range, records the global maximum and restarts local tracking there. It costs a little output during the sweep (a fraction of a second), but guarantees not staying on a secondary peak. All modern inverters use it.`,
      },
    },
  },

  wind: {
    predict: {
      hint: { fr: r`La puissance du vent varie comme le cube de sa vitesse. Mais le rotor est lourd, et la commande ne suit pas instantanément…`, en: r`Wind power goes with the cube of its speed. But the rotor is heavy, and control does not follow instantly…` },
      answer: {
        fr: r`La puissance électrique **monte** pendant la rafale, mais moins vite et moins haut que le cube du vent : l’inertie du rotor stocke une partie de l’énergie en accélérant, puis la rend. $$P = \tfrac12\rho\,\pi R^2\,C_p(\lambda,\beta)\,v^3, \qquad \left(\frac{11}{8}\right)^3 \approx 2{,}6$$ À la fin de la rafale, la puissance redescend progressivement.`,
        en: r`Electrical power **rises** during the gust, but more slowly and less than the cube of wind speed: rotor inertia stores part of the energy while accelerating, then gives it back. $$P = \tfrac12\rho\,\pi R^2\,C_p(\lambda,\beta)\,v^3, \qquad \left(\frac{11}{8}\right)^3 \approx 2.6$$ When the gust ends, power comes back down gradually.`,
      },
    },
    optimal: {
      hint: { fr: r`Rafale à 0, vent moyen sous 10 m/s ; essayez par exemple 6 puis 9 m/s.`, en: r`Gust at 0, mean wind below 10 m/s; try for example 6 then 9 m/s.` },
      answer: {
        fr: r`Le rendement aérodynamique $C_p$ dépend du rapport entre la vitesse en bout de pale et celle du vent : $$\lambda = \frac{\omega R}{v}, \qquad C_p \le \frac{16}{27} \approx 0{,}59 \ \text{(limite de Betz)}$$ Sous le nominal, la commande ajuste la vitesse du rotor proportionnellement au vent pour garder $\lambda$ à sa valeur optimale.`,
        en: r`The aerodynamic efficiency $C_p$ depends on the ratio of blade-tip speed to wind speed: $$\lambda = \frac{\omega R}{v}, \qquad C_p \le \frac{16}{27} \approx 0.59 \ \text{(Betz limit)}$$ Below rated, control adjusts rotor speed in proportion to the wind to keep $\lambda$ at its optimum.`,
      },
    },
    rated: {
      hint: { fr: r`Montez le vent moyen à 14 m/s.`, en: r`Raise the mean wind to 14 m/s.` },
      answer: {
        fr: r`Au-delà du vent nominal, le générateur et le convertisseur sont à pleine charge. Le calage des pales (angle $\beta$) réduit volontairement $C_p$ : $$C_p(\lambda,\beta)\,v^3 = \text{constante} \Rightarrow P = P_n$$ Au-delà d’environ 25 m/s, l’éolienne s’arrête pour se protéger.`,
        en: r`Above rated wind, the generator and converter are fully loaded. Pitching the blades (angle $\beta$) deliberately lowers $C_p$: $$C_p(\lambda,\beta)\,v^3 = \text{constant} \Rightarrow P = P_n$$ Beyond about 25 m/s, the turbine shuts down to protect itself.`,
      },
    },
    gust: {
      hint: { fr: r`Vent moyen 13 m/s ou plus, rafale de 6 m/s.`, en: r`Mean wind 13 m/s or more, gust of 6 m/s.` },
      answer: {
        fr: r`Le calage réagit en quelques secondes ; pendant ce temps, l’excédent d’énergie accélère un peu le rotor, qui sert de tampon : $$J\omega\,\frac{d\omega}{dt} = P_{aero} - P_{elec}$$ Le convertisseur garde la puissance électrique constante : le réseau ne voit presque rien de la rafale.`,
        en: r`Pitch reacts within seconds; meanwhile, the surplus energy speeds up the rotor slightly, which acts as a buffer: $$J\omega\,\frac{d\omega}{dt} = P_{aero} - P_{elec}$$ The converter holds electrical power constant: the grid hardly sees the gust.`,
      },
    },
    inertia: {
      hint: { fr: r`Vent sous 11 m/s, inertie synthétique $H_{syn}$ à 5 s.`, en: r`Wind below 11 m/s, synthetic inertia $H_{syn}$ at 5 s.` },
      answer: {
        fr: r`L’éolienne puise dans l’énergie cinétique de son rotor : $$\Delta P = -2H_{syn}\,\frac{df/dt}{f_0}\,P_n, \qquad E_c = \tfrac12 J\omega^2$$ Mais ralentir l’éloigne de son $\lambda$ optimal : après le soutien, elle doit reprendre de la vitesse et produit **moins** pendant un moment. Ce « second creux » doit être géré pour ne pas aggraver l’incident.`,
        en: r`The turbine draws on its rotor’s kinetic energy: $$\Delta P = -2H_{syn}\,\frac{df/dt}{f_0}\,P_n, \qquad E_k = \tfrac12 J\omega^2$$ But slowing down moves it away from its optimal $\lambda$: after the support, it must speed up again and produces **less** for a while. That “second dip” must be managed so as not to worsen the incident.`,
      },
    },
  },

  bess: {
    predict: {
      hint: { fr: r`Même situation qu’en 0.2 : inertie, réserve primaire. Où la fréquence se stabilise-t-elle, et après combien de temps ?`, en: r`Same situation as 0.2: inertia, primary reserve. Where does frequency settle, and after how long?` },
      answer: {
        fr: r`La fréquence chute (RoCoF initial fixé par l’inertie), atteint un creux après quelques secondes, puis remonte et se stabilise sous 50 Hz, à l’écart fixé par le statisme : $$\left.\frac{df}{dt}\right|_{0^+} = -\frac{\Delta P\,f_0}{2HS} = -\frac{1 \times 50}{2 \times 4 \times 30} \approx -0{,}21\ \text{Hz/s}, \qquad \Delta f_\infty = -\frac{\Delta P}{\sum 1/R_i}$$`,
        en: r`Frequency falls (initial RoCoF set by inertia), reaches a nadir after a few seconds, then recovers and settles below 50 Hz, at the offset set by droop: $$\left.\frac{df}{dt}\right|_{0^+} = -\frac{\Delta P\,f_0}{2HS} = -\frac{1 \times 50}{2 \times 4 \times 30} \approx -0.21\ \text{Hz/s}, \qquad \Delta f_\infty = -\frac{\Delta P}{\sum 1/R_i}$$`,
      },
    },
    add: {
      hint: { fr: r`Montez $P_b$ à 500 MW.`, en: r`Raise $P_b$ to 500 MW.` },
      answer: {
        fr: r`La batterie répond en quelques centaines de millisecondes, bien avant les turbines (plusieurs secondes). Elle compense une partie de la perte pendant la phase critique : $$2H\frac{d\Delta f}{dt} = -\Delta P_{perte} + \Delta P_{turbines}(t) + \Delta P_{batterie}(t)$$ Le creux remonte nettement. C’est aujourd’hui le principal service rendu par les grandes batteries.`,
        en: r`The battery responds within a few hundred milliseconds, well before turbines (several seconds). It covers part of the loss during the critical phase: $$2H\frac{d\Delta f}{dt} = -\Delta P_{loss} + \Delta P_{turbines}(t) + \Delta P_{battery}(t)$$ The nadir rises clearly. This is today the main service provided by large batteries.`,
      },
    },
    slow: {
      hint: { fr: r`Montez le temps de réponse $\tau$ à 2 s.`, en: r`Raise the response time $\tau$ to 2 s.` },
      answer: {
        fr: r`Le creux survient en quelques secondes : seule compte l’énergie fournie avant lui. Une réponse lente arrive trop tard, même à pleine puissance. $$\Delta P_b(t) = P_b\,(1 - e^{-t/\tau})$$ Pour le creux, la **vitesse** de la réserve compte autant que sa taille.`,
        en: r`The nadir happens within seconds: only the energy delivered before it counts. A slow response arrives too late, even at full power. $$\Delta P_b(t) = P_b\,(1 - e^{-t/\tau})$$ For the nadir, the **speed** of reserve matters as much as its size.`,
      },
    },
    empty: {
      hint: { fr: r`$\tau$ sous 0,5 s, puis baissez l’énergie $E_b$ à 2 MWh.`, en: r`$\tau$ below 0.5 s, then lower the energy $E_b$ to 2 MWh.` },
      answer: {
        fr: r`La durée de soutien est limitée par l’énergie : $$t_{max} = \frac{E_b}{P_b} = \frac{2\ \text{MWh}}{500\ \text{MW}} \approx 14\ \text{s}$$ Une batterie vide s’arrête brutalement, comme une seconde perte de production. Les services de réglage exigent donc une durée minimale (15 à 30 min pour la réserve primaire en Europe).`,
        en: r`Support time is limited by energy: $$t_{max} = \frac{E_b}{P_b} = \frac{2\ \text{MWh}}{500\ \text{MW}} \approx 14\ \text{s}$$ An empty battery stops abruptly, like a second loss of generation. Frequency services therefore require a minimum duration (15 to 30 min for primary reserve in Europe).`,
      },
    },
    ffr: {
      hint: { fr: r`Énergie ≥ 10 MWh, puis mode « FFR ».`, en: r`Energy ≥ 10 MWh, then “FFR” mode.` },
      answer: {
        fr: r`La FFR (réponse rapide en fréquence) délivre toute sa puissance dès qu’un seuil est franchi, au lieu d’une réponse proportionnelle : $$P_b = P_{max} \quad \text{si } f < 49{,}8\ \text{Hz}$$ Elle arrête la chute plus tôt. Ses risques : un retour brutal à l’arrêt, et des déclenchements simultanés de nombreuses batteries.`,
        en: r`FFR (fast frequency response) delivers full power as soon as a threshold is crossed, instead of a proportional response: $$P_b = P_{max} \quad \text{if } f < 49.8\ \text{Hz}$$ It stops the fall sooner. Its risks: an abrupt return to zero, and many batteries triggering at once.`,
      },
    },
    inertia: {
      hint: { fr: r`$H = 2$ s, puis augmentez $P_b$ (essayez 400 à 600 MW, en FFR ou en statisme rapide).`, en: r`$H = 2$ s, then raise $P_b$ (try 400 to 600 MW, in FFR or fast droop).` },
      answer: {
        fr: r`Avec moitié moins d’inertie, la fréquence chute deux fois plus vite et les turbines n’ont pas le temps d’agir. Une réserve très rapide **remplace** en partie l’inertie manquante : $$\int_0^{t_{nadir}} \Delta P_b\,dt \approx 2\,\Delta H\,S\,\frac{\Delta f}{f_0}$$ C’est l’enjeu des réseaux à forte part d’énergies renouvelables : acheter de la rapidité là où l’inertie disparaît.`,
        en: r`With half the inertia, frequency falls twice as fast and turbines have no time to act. Very fast reserve partly **replaces** the missing inertia: $$\int_0^{t_{nadir}} \Delta P_b\,dt \approx 2\,\Delta H\,S\,\frac{\Delta f}{f_0}$$ This is the challenge of high-renewable grids: buying speed where inertia disappears.`,
      },
    },
  },

  mmc: {
    staircase: {
      hint: { fr: r`Montez le nombre de sous-modules $N$ à 20.`, en: r`Raise the number of submodules $N$ to 20.` },
      answer: {
        fr: r`Chaque bras insère ou retire des sous-modules (des condensateurs chargés) un par un : la sortie est un escalier de $N + 1$ niveaux. Sa distorsion décroît à peu près comme $1/N$ : $$\text{THD} \approx \frac{1}{\sqrt3\,N}\ \text{(ordre de grandeur)}$$ Les MMC des liaisons CCHT ont des centaines de sous-modules par bras : la tension est presque sinusoïdale sans filtre, et chaque semi-conducteur commute rarement (peu de pertes).`,
        en: r`Each arm inserts or bypasses submodules (charged capacitors) one at a time: the output is a staircase of $N + 1$ levels. Its distortion falls roughly as $1/N$: $$\text{THD} \approx \frac{1}{\sqrt3\,N}\ \text{(order of magnitude)}$$ HVDC MMCs have hundreds of submodules per arm: the voltage is almost sinusoidal without filters, and each device switches rarely (low losses).`,
      },
    },
    insertion: {
      hint: { fr: r`Faites glisser le curseur de temps sur au moins un tiers de la fenêtre.`, en: r`Drag the time cursor over at least a third of the window.` },
      answer: {
        fr: r`Les bras haut et bas se partagent la tension continue : $$n_{haut} + n_{bas} = N, \qquad v_{sortie} = \frac{V_{dc}}{2}\,\frac{n_{bas} - n_{haut}}{N}$$ Quand l’un insère, l’autre retire. Le bras entier est une source de tension contrôlable, d’où le nom « modulaire ».`,
        en: r`The upper and lower arms share the DC voltage: $$n_{up} + n_{low} = N, \qquad v_{out} = \frac{V_{dc}}{2}\,\frac{n_{low} - n_{up}}{N}$$ When one inserts, the other bypasses. Each arm is a controllable voltage source, hence “modular”.`,
      },
    },
    drift: {
      hint: { fr: r`Mettez l’équilibrage sur « ordre fixe ».`, en: r`Set balancing to “fixed order”.` },
      answer: {
        fr: r`Le courant de bras charge ou décharge chaque condensateur inséré ; avec un ordre fixe, certains sont toujours insérés aux mêmes moments et dérivent : $$C\,\frac{dv_{c,k}}{dt} = s_k(t)\,i_{bras}(t)$$ Sans correction, certains sous-modules finiraient en surtension, d’autres déchargés.`,
        en: r`The arm current charges or discharges each inserted capacitor; with a fixed order, some are always inserted at the same moments and drift: $$C\,\frac{dv_{c,k}}{dt} = s_k(t)\,i_{arm}(t)$$ Without correction, some submodules would end up overvolted, others discharged.`,
      },
    },
    sort: {
      hint: { fr: r`Remettez l’équilibrage sur « tri des tensions ».`, en: r`Set balancing back to “voltage sorting”.` },
      answer: {
        fr: r`À chaque instant, on choisit quels sous-modules insérer selon le signe du courant : s’il charge, on insère les moins chargés ; s’il décharge, les plus chargés. Ce tri, simple et efficace, garde toutes les tensions groupées sans mesure coûteuse ni régulation supplémentaire.`,
        en: r`At each instant, which submodules to insert is chosen from the current’s sign: if it charges, insert the least charged; if it discharges, the most charged. This simple, effective sort keeps all voltages together without costly extra control.`,
      },
    },
    capacitor: {
      hint: { fr: r`Baissez la capacité $C$ des sous-modules vers 0,1 mF.`, en: r`Lower the submodule capacitance $C$ towards 0.1 mF.` },
      answer: {
        fr: r`L’énergie qui transite par chaque bras au cours d’une période fait onduler la tension des condensateurs : $$\frac{\Delta v_c}{v_c} \approx \frac{\Delta E_{bras}}{N\,C\,v_c^2} \propto \frac{P}{\omega\,N C v_c^2}$$ Les condensateurs représentent une grande part du volume et du coût d’un MMC ; on les dimensionne typiquement pour 30 à 40 kJ/MVA.`,
        en: r`The energy flowing through each arm over a period makes the capacitor voltages ripple: $$\frac{\Delta v_c}{v_c} \approx \frac{\Delta E_{arm}}{N\,C\,v_c^2} \propto \frac{P}{\omega\,N C v_c^2}$$ Capacitors are a large share of an MMC’s volume and cost; they are typically sized at 30 to 40 kJ/MVA.`,
      },
    },
    fault: {
      hint: { fr: r`Choisissez le type de sous-module « pont complet ».`, en: r`Choose the “full bridge” submodule type.` },
      answer: {
        fr: r`Avec des demi-ponts, les diodes forment un pont redresseur incontrôlé : le réseau alternatif alimente le défaut continu, et il faut ouvrir des disjoncteurs côté alternatif. Le pont complet peut insérer une tension **négative** qui s’oppose au courant de défaut et l’éteint. Il double les semi-conducteurs et les pertes : c’est un choix pour les lignes aériennes et les réseaux CC maillés.`,
        en: r`With half bridges, the diodes form an uncontrolled rectifier: the AC grid feeds the DC fault, and AC breakers must open. The full bridge can insert a **negative** voltage that opposes the fault current and extinguishes it. It doubles the devices and the losses: a choice for overhead lines and meshed DC grids.`,
      },
    },
  },

  frt: {
    predict: {
      hint: { fr: r`Les codes demandent de soutenir la tension pendant le creux : $\Delta I_q = K\,\Delta V$. Avec $K = 2$ et un creux de 0,5 pu ?`, en: r`Codes require voltage support during the dip: $\Delta I_q = K\,\Delta V$. With $K = 2$ and a 0.5 pu dip?` },
      answer: {
        fr: r`Le courant réactif **saute** au début du creux, en quelques dizaines de ms, à environ 1 pu, s’y maintient pendant 150 ms, puis revient à zéro quand la tension se rétablit. $$\Delta I_q = K\,(1 - V) = 2 \times 0{,}5 = 1\ \text{pu} \quad (\le I_{max})$$ Ce courant soutient la tension du réseau pendant le défaut et aide les protections à le détecter.`,
        en: r`The reactive current **jumps** at the start of the dip, within tens of ms, to about 1 pu, holds there for 150 ms, then returns to zero when voltage recovers. $$\Delta I_q = K\,(1 - V) = 2 \times 0.5 = 1\ \text{pu} \quad (\le I_{max})$$ This current supports grid voltage during the fault and helps protection detect it.`,
      },
    },
    legacy: {
      hint: { fr: r`Protection « ancienne », avec le creux par défaut (0,5 pu, 150 ms).`, en: r`“Legacy” protection, with the default dip (0.5 pu, 150 ms).` },
      answer: {
        fr: r`Les anciennes protections déconnectaient la production dès que la tension sortait de ±15 % : raisonnable quand elle était marginale, dangereux quand elle représente des gigawatts. Un défaut sur le transport fait un creux sur une grande zone : si toute la production décentralisée se déconnecte, l’incident devient une perte de production massive (voir 0.2).`,
        en: r`Older protection disconnected generation as soon as voltage left ±15 %: reasonable when it was marginal, dangerous when it amounts to gigawatts. A transmission fault creates a dip over a wide area: if all distributed generation disconnects, the incident becomes a massive loss of generation (see 0.2).`,
      },
    },
    compliant: {
      hint: { fr: r`Choisissez la protection « conforme ».`, en: r`Choose the “compliant” protection.` },
      answer: {
        fr: r`Les codes de réseau (règlement européen RfG, codes nationaux) imposent de rester connecté tant que la tension reste au-dessus d’un **gabarit** tension-temps (par exemple 0 pu pendant 150 ms, puis remontée), et d’injecter un courant réactif proportionnel au creux, en moins de 30 à 60 ms.`,
        en: r`Grid codes (the European RfG regulation, national codes) require staying connected while voltage remains above a voltage-time **profile** (e.g. 0 pu for 150 ms, then rising), and injecting reactive current proportional to the dip within 30 to 60 ms.`,
      },
    },
    deep: {
      hint: { fr: r`Baissez la tension résiduelle sous 0,2 pu, en gardant la durée à 0,15 s.`, en: r`Lower the residual voltage below 0.2 pu, keeping the duration at 0.15 s.` },
      answer: {
        fr: r`Le courant réactif demandé dépasse la limite de l’onduleur, qui donne la priorité au réactif : $$i_q = \min(K\,\Delta V,\ I_{max}), \qquad i_d \le \sqrt{I_{max}^2 - i_q^2} \approx 0$$ La puissance active s’effondre pendant le creux ; l’énergie produite s’accumule dans le bus continu ou est dissipée dans un hacheur de freinage.`,
        en: r`The required reactive current exceeds the inverter limit, which gives priority to reactive current: $$i_q = \min(K\,\Delta V,\ I_{max}), \qquad i_d \le \sqrt{I_{max}^2 - i_q^2} \approx 0$$ Active power collapses during the dip; the energy produced accumulates in the DC bus or is dissipated in a braking chopper.`,
      },
    },
    below: {
      hint: { fr: r`Gardez le creux profond et allongez la durée au-delà de 0,4 s.`, en: r`Keep the deep dip and extend the duration beyond 0.4 s.` },
      answer: {
        fr: r`Sous le gabarit, le défaut est jugé trop sévère ou trop long : le réseau ne compte plus sur ce parc, qui peut se protéger. Le gabarit résulte d’un compromis entre la tenue du matériel et le temps d’élimination des défauts par les protections du réseau (typiquement 100 à 150 ms en transport).`,
        en: r`Below the profile, the fault is deemed too severe or too long: the grid no longer counts on that plant, which may protect itself. The profile is a compromise between equipment withstand and the time grid protection takes to clear faults (typically 100 to 150 ms on transmission).`,
      },
    },
    ramp: {
      hint: { fr: r`Revenez à un creux tenu (par exemple 0,5 pu, 0,15 s), puis réduisez la rampe sous 1 pu/s.`, en: r`Go back to a ride-through dip (e.g. 0.5 pu, 0.15 s), then lower the ramp below 1 pu/s.` },
      answer: {
        fr: r`Après le défaut, la puissance active remonte selon la rampe imposée : $$t_{reprise} \approx \frac{\Delta P}{\text{rampe}}$$ Une reprise lente prive le réseau de production juste après le défaut, ce qui peut faire chuter la fréquence sur un réseau à forte part d’onduleurs (Australie-Méridionale 2016). Les codes exigent une reprise en moins d’une seconde.`,
        en: r`After the fault, active power recovers along the imposed ramp: $$t_{recovery} \approx \frac{\Delta P}{\text{ramp}}$$ A slow recovery deprives the grid of generation right after the fault, which can drag frequency down on an inverter-rich grid (South Australia 2016). Codes require recovery within about a second.`,
      },
    },
  },
};
