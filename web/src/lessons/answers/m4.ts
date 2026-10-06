// Module 4 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers4: Answers = {
  line: {
    predict: {
      hint: { fr: r`Une ligne à vide est une suite d’inductances en série et de capacités vers la terre. Le courant capacitif traverse les inductances…`, en: r`An open line is a chain of series inductances and shunt capacitances. The capacitive current flows through the inductances…` },
      answer: {
        fr: r`La tension en bout de ligne est **plus haute** que la tension d’envoi : c’est l’**effet Ferranti**. Le courant capacitif de la ligne, en passant dans son inductance, fait monter la tension. Pour une ligne sans pertes : $$\frac{V_r}{V_s} = \frac{1}{\cos\beta\ell}, \qquad \beta \approx 0{,}06\ °/\text{km} \text{ à 50 Hz}$$ À 600 km, $\beta\ell \approx 36°$ : $V_r \approx 1{,}24\,V_s$. Les longues lignes à vide ont besoin d’inductances shunt.`,
        en: r`The receiving-end voltage is **higher** than the sending-end voltage: the **Ferranti effect**. The line’s capacitive current, flowing through its inductance, raises the voltage. For a lossless line: $$\frac{V_r}{V_s} = \frac{1}{\cos\beta\ell}, \qquad \beta \approx 0.06\ °/\text{km} \text{ at 50 Hz}$$ At 600 km, $\beta\ell \approx 36°$: $V_r \approx 1.24\,V_s$. Long unloaded lines need shunt reactors.`,
      },
    },
    sil: {
      hint: { fr: r`Réglez $P$ vers 530 MW et $\cos\varphi = 1$.`, en: r`Set $P$ near 530 MW and $\cos\varphi = 1$.` },
      answer: {
        fr: r`À la puissance naturelle, la ligne est chargée par son impédance caractéristique : le réactif produit par la capacité égale celui consommé par l’inductance. $$Z_c = \sqrt{\frac{L'}{C'}} \approx 300\ \Omega, \qquad \text{SIL} = \frac{U^2}{Z_c} = \frac{400^2}{300} \approx 530\ \text{MW}$$ La tension est alors la même tout le long de la ligne.`,
        en: r`At surge impedance loading, the line is terminated by its characteristic impedance: the reactive power produced by the capacitance equals what the inductance absorbs. $$Z_c = \sqrt{\frac{L'}{C'}} \approx 300\ \Omega, \qquad \text{SIL} = \frac{U^2}{Z_c} = \frac{400^2}{300} \approx 530\ \text{MW}$$ The voltage is then the same all along the line.`,
      },
    },
    heavy: {
      hint: { fr: r`Montez $P$ bien au-delà de 530 MW, vers 1000 MW ou plus.`, en: r`Raise $P$ well beyond 530 MW, towards 1000 MW or more.` },
      answer: {
        fr: r`Au-delà de la puissance naturelle, les pertes réactives $X I^2$ dépassent la production capacitive $B V^2$ : la ligne **consomme** du réactif et la tension chute en bout. $$Q_{\text{ligne}} \approx X I^2 - B V^2 > 0 \quad \text{si } P > \text{SIL}$$ Il faut alors des condensateurs, une compensation série ou des compensateurs statiques (leçons 4.9 et 4.10).`,
        en: r`Beyond surge impedance loading, the reactive losses $X I^2$ exceed the capacitive production $B V^2$: the line **absorbs** reactive power and the far-end voltage drops. $$Q_{\text{line}} \approx X I^2 - B V^2 > 0 \quad \text{if } P > \text{SIL}$$ Capacitors, series compensation or static compensators are then needed (lessons 4.9 and 4.10).`,
      },
    },
    short: {
      hint: { fr: r`Choisissez le modèle « ligne courte » et une longueur d’au moins 400 km.`, en: r`Choose the “short line” model and a length of at least 400 km.` },
      answer: {
        fr: r`Le modèle ligne courte ne garde que $\underline Z = R + jX$ : il oublie la capacité, donc l’effet Ferranti et le courant de charge. Il convient aux lignes aériennes de moins de 80 km environ. Sur une longue ligne, l’erreur sur la tension à vide dépasse 20 %.`,
        en: r`The short-line model keeps only $\underline Z = R + jX$: it forgets the capacitance, hence the Ferranti effect and the charging current. It suits overhead lines shorter than about 80 km. On a long line, the error on the no-load voltage exceeds 20 %.`,
      },
    },
    pi: {
      hint: { fr: r`Modèle « π nominal », longueur 200 km ou moins.`, en: r`“Nominal π” model, length 200 km or less.` },
      answer: {
        fr: r`Le π nominal place la moitié de la capacité à chaque extrémité : $$\underline Z = (R' + jX')\ell, \qquad \frac{\underline Y}{2} = j\frac{B'\ell}{2}$$ Il approche le modèle exact (fonctions hyperboliques de $\gamma\ell$) à mieux que 1 % jusqu’à 200–250 km. Au-delà, on utilise le π équivalent ou plusieurs π en cascade.`,
        en: r`The nominal π puts half the capacitance at each end: $$\underline Z = (R' + jX')\ell, \qquad \frac{\underline Y}{2} = j\frac{B'\ell}{2}$$ It matches the exact model (hyperbolic functions of $\gamma\ell$) within 1 % up to 200–250 km. Beyond, the equivalent π or several cascaded π sections are used.`,
      },
    },
  },

  trafo: {
    predict: {
      hint: { fr: r`Le flux est l’intégrale de la tension. Si l’on démarre au passage par zéro, de combien le flux s’écarte-t-il de sa trajectoire normale ? Et que fait le fer au-delà de 1,2 pu ?`, en: r`Flux is the integral of voltage. Starting at a zero crossing, how far does the flux stray from its normal path? And what does the iron do beyond 1.2 pu?` },
      answer: {
        fr: r`Le courant fait de grands **pics unidirectionnels**, une fois par période, des dizaines de fois le courant à vide, qui s’amortissent lentement. Démarrer au passage par zéro décale le flux d’une composante continue : $$\varphi(t) = \varphi_r + \hat\varphi\,(1 - \cos\omega t) \quad \Rightarrow \quad \varphi_{max} = 0{,}6 + 2 = 2{,}6\ \text{pu}$$ Bien au-delà du coude de saturation (1,2 pu), l’inductance s’effondre et le courant explose. Ce courant riche en harmonique 2 sert aux protections à le distinguer d’un défaut.`,
        en: r`The current shows large **one-sided peaks**, once per period, tens of times the no-load current, decaying slowly. Starting at a zero crossing gives the flux a DC offset: $$\varphi(t) = \varphi_r + \hat\varphi\,(1 - \cos\omega t) \quad \Rightarrow \quad \varphi_{max} = 0.6 + 2 = 2.6\ \text{pu}$$ Far beyond the saturation knee (1.2 pu), the inductance collapses and the current soars. Its strong 2nd harmonic lets protection tell it from a fault.`,
      },
    },
    timing: {
      hint: { fr: r`Flux rémanent à 0, angle d’enclenchement $\theta_0 = 90°$.`, en: r`Residual flux at 0, switching angle $\theta_0 = 90°$.` },
      answer: {
        fr: r`En enclenchant au maximum de tension, le flux démarre à $-\hat\varphi$… exactement là où le régime établi le placerait : $$\varphi(t) = -\hat\varphi\cos(\omega t + \theta_0 - 90°) \;\Rightarrow\; \text{pas de composante continue}$$ Pas de saturation, pas d’appel. Les disjoncteurs à manœuvre synchronisée ferment chaque pôle au bon instant.`,
        en: r`Switching at the voltage peak, the flux starts at $-\hat\varphi$… exactly where the steady state would put it: $$\varphi(t) = -\hat\varphi\cos(\omega t + \theta_0 - 90°) \;\Rightarrow\; \text{no DC component}$$ No saturation, no inrush. Controlled switching breakers close each pole at the right instant.`,
      },
    },
    residual: {
      hint: { fr: r`Gardez $\theta_0 = 90°$, flux rémanent à −0,8 pu.`, en: r`Keep $\theta_0 = 90°$, residual flux at −0.8 pu.` },
      answer: {
        fr: r`Le flux rémanent s’ajoute à la composante continue : le pic devient $|\varphi_r| + $ l’écart dû à l’instant. Le bon instant dépend donc du flux laissé lors de la dernière ouverture : $$\theta_0^{\text{opt}} \text{ tel que } \varphi_r = -\hat\varphi\cos\theta_0$$ Les relais de manœuvre synchronisée mesurent ce flux à l’ouverture pour choisir l’instant de fermeture.`,
        en: r`Residual flux adds to the DC offset: the peak becomes $|\varphi_r|$ plus the offset due to timing. The best instant therefore depends on the flux left at the last opening: $$\theta_0^{\text{opt}} \text{ such that } \varphi_r = -\hat\varphi\cos\theta_0$$ Controlled-switching relays measure that flux at opening to choose the closing instant.`,
      },
    },
    damping: {
      hint: { fr: r`Montez $r$ à 0,03 pu.`, en: r`Raise $r$ to 0.03 pu.` },
      answer: {
        fr: r`La composante continue du flux s’amortit avec la constante de temps du circuit : $$\tau = \frac{L}{R}$$ Plus de résistance, extinction plus rapide. Les gros transformateurs ont un $X/R$ très élevé : l’appel peut durer plusieurs secondes et se transmettre aux transformateurs voisins (« sympathetic inrush »).`,
        en: r`The DC flux component decays with the circuit time constant: $$\tau = \frac{L}{R}$$ More resistance, faster decay. Large transformers have a very high $X/R$: inrush can last several seconds and spread to neighbouring transformers (sympathetic inrush).`,
      },
    },
    efficiency: {
      hint: { fr: r`Le rendement est maximal quand les pertes cuivre égalent les pertes fer : cherchez autour de 0,45 pu de charge.`, en: r`Efficiency peaks when copper losses equal iron losses: look around 0.45 pu load.` },
      answer: {
        fr: r`Les pertes fer sont constantes, les pertes cuivre croissent en $S^2$. Le rendement est maximal quand elles sont égales : $$\eta = \frac{S\cos\varphi}{S\cos\varphi + P_0 + P_{cc}(S/S_n)^2}, \qquad \frac{S^*}{S_n} = \sqrt{\frac{P_0}{P_{cc}}}$$ Un transformateur de distribution passe la plupart du temps à 30–50 % de charge : on le conçoit pour que son meilleur rendement soit là.`,
        en: r`Iron losses are constant, copper losses grow as $S^2$. Efficiency peaks when they are equal: $$\eta = \frac{S\cos\varphi}{S\cos\varphi + P_0 + P_{sc}(S/S_n)^2}, \qquad \frac{S^*}{S_n} = \sqrt{\frac{P_0}{P_{sc}}}$$ A distribution transformer spends most of its life at 30–50 % load: it is designed for its best efficiency to be there.`,
      },
    },
  },

  sm: {
    predict: {
      hint: { fr: r`Juste après le défaut, l’alternateur se comporte comme une source derrière une petite réactance ; quelques secondes plus tard, derrière une grande. Et il y a une composante continue…`, en: r`Just after the fault, the generator acts as a source behind a small reactance; seconds later, behind a large one. And there is a DC offset…` },
      answer: {
        fr: r`Le courant est d’abord très grand (subtransitoire), décroît en quelques dizaines de ms (transitoire) puis en une seconde vers le régime permanent, tout en étant décalé par une composante continue qui s’éteint : $$i_a(t) = \sqrt2 E\left[\left(\tfrac{1}{X''_d} - \tfrac{1}{X'_d}\right)e^{-t/T''_d} + \left(\tfrac{1}{X'_d} - \tfrac{1}{X_d}\right)e^{-t/T'_d} + \tfrac{1}{X_d}\right]\cos\omega t + i_{dc}$$ Ici $1/X''_d = 5$ pu, $1/X'_d \approx 3{,}3$ pu, $1/X_d \approx 0{,}56$ pu : le courant permanent est **inférieur** au nominal.`,
        en: r`The current is huge at first (sub-transient), decays within tens of ms (transient) then within a second to steady state, while shifted by a decaying DC offset: $$i_a(t) = \sqrt2 E\left[\left(\tfrac{1}{X''_d} - \tfrac{1}{X'_d}\right)e^{-t/T''_d} + \left(\tfrac{1}{X'_d} - \tfrac{1}{X_d}\right)e^{-t/T'_d} + \tfrac{1}{X_d}\right]\cos\omega t + i_{dc}$$ Here $1/X''_d = 5$ pu, $1/X'_d \approx 3.3$ pu, $1/X_d \approx 0.56$ pu: the sustained current is **below** rated.`,
      },
    },
    offset: {
      hint: { fr: r`En mode court-circuit, réglez l’instant du défaut $\theta$ à 90°.`, en: r`In short-circuit mode, set the fault instant $\theta$ to 90°.` },
      answer: {
        fr: r`Le courant d’une inductance ne peut pas sauter : la composante continue compense l’écart entre le courant juste avant (nul) et la valeur initiale de la sinusoïde forcée. $$i_{dc}(0) = -i_{ac}(0) = -\sqrt2 I''\cos\theta$$ Elle est maximale si le défaut survient au passage par zéro de la tension, nulle à son maximum. Elle peut presque doubler le premier pic : les disjoncteurs sont dimensionnés pour ce pic.`,
        en: r`An inductor’s current cannot jump: the DC component makes up the difference between the current just before (zero) and the initial value of the forced sinusoid. $$i_{dc}(0) = -i_{ac}(0) = -\sqrt2 I''\cos\theta$$ It is largest when the fault hits a voltage zero crossing, zero at the voltage peak. It can almost double the first peak: breakers are rated for that peak.`,
      },
    },
    over: {
      hint: { fr: r`Mode « régime établi », puis augmentez $E$ jusqu’à lire $Q \ge 0{,}3$ pu.`, en: r`“Steady state” mode, then raise $E$ until $Q \ge 0.3$ pu.` },
      answer: {
        fr: r`Pour une machine à pôles lisses raccordée à $V$ : $$P = \frac{EV}{X_d}\sin\delta, \qquad Q = \frac{EV\cos\delta - V^2}{X_d}$$ Augmenter l’excitation $E$ augmente $Q$ : l’alternateur **surexcité** fournit du réactif et soutient la tension. La limite est l’échauffement du rotor (courant d’excitation).`,
        en: r`For a round-rotor machine connected to $V$: $$P = \frac{EV}{X_d}\sin\delta, \qquad Q = \frac{EV\cos\delta - V^2}{X_d}$$ Raising the excitation $E$ raises $Q$: the **over-excited** generator supplies reactive power and supports voltage. The limit is rotor heating (field current).`,
      },
    },
    under: {
      hint: { fr: r`Baissez $E$ vers 0,8 pu en gardant la même puissance.`, en: r`Lower $E$ towards 0.8 pu, keeping the same power.` },
      answer: {
        fr: r`Quand $E\cos\delta < V$, $Q < 0$ : la machine **sous-excitée** absorbe du réactif (utile la nuit, quand les lignes peu chargées en produisent trop). Mais à $P$ donné, un $E$ plus faible impose un $\sin\delta$ plus grand : $$\sin\delta = \frac{P X_d}{EV}$$ On se rapproche de 90°, la limite de stabilité. Le diagramme de capacité montre cette frontière à gauche.`,
        en: r`When $E\cos\delta < V$, $Q < 0$: the **under-excited** machine absorbs reactive power (useful at night, when lightly loaded lines produce too much). But for a given $P$, a smaller $E$ forces a larger $\sin\delta$: $$\sin\delta = \frac{P X_d}{EV}$$ It moves towards 90°, the stability limit. The capability chart shows that boundary on the left.`,
      },
    },
    unity: {
      hint: { fr: r`Ajustez $E$ jusqu’à lire $Q \approx 0$ : avec $P = 0{,}8$ pu, c’est vers $E \approx 1{,}7$ pu.`, en: r`Adjust $E$ until $Q \approx 0$: with $P = 0.8$ pu, around $E \approx 1.7$ pu.` },
      answer: {
        fr: r`Le courant statorique vaut $I = \sqrt{P^2 + Q^2}/V$ : à $P$ fixé, il est minimal pour $Q = 0$. Tracé contre l’excitation, il dessine la **courbe en V** de Mordey. $$Q = 0 \;\Leftrightarrow\; E\cos\delta = V \;\Leftrightarrow\; E = \sqrt{V^2 + (PX_d/V)^2}$$`,
        en: r`The stator current is $I = \sqrt{P^2 + Q^2}/V$: for a given $P$, it is smallest at $Q = 0$. Plotted against excitation, it draws Mordey’s **V-curve**. $$Q = 0 \;\Leftrightarrow\; E\cos\delta = V \;\Leftrightarrow\; E = \sqrt{V^2 + (PX_d/V)^2}$$`,
      },
    },
    limit: {
      hint: { fr: r`Mettez $E$ assez bas (vers 1 pu) puis montez $P$ jusqu’à $\delta \ge 70°$.`, en: r`Set $E$ low (around 1 pu) then raise $P$ until $\delta \ge 70°$.` },
      answer: {
        fr: r`La puissance électrique maximale est atteinte à 90° : $$P_{max} = \frac{EV}{X_d}$$ Au-delà, toute augmentation de puissance mécanique accélère le rotor sans contrepartie électrique : perte de synchronisme. En pratique, on garde une marge (limite pratique de stabilité vers 70°) et le régulateur de tension relève $E$ quand $\delta$ croît.`,
        en: r`Maximum electrical power is reached at 90°: $$P_{max} = \frac{EV}{X_d}$$ Beyond, any extra mechanical power accelerates the rotor with no electrical counterpart: loss of synchronism. In practice a margin is kept (practical stability limit around 70°), and the voltage regulator raises $E$ as $\delta$ grows.`,
      },
    },
  },

  loads: {
    predict: {
      hint: { fr: r`La charge est un mélange : une part résistive (en $V^2$), une part à courant constant (en $V$), une part à puissance constante. Et certaines charges se rétablissent…`, en: r`The load is a mix: a resistive part (as $V^2$), a constant-current part (as $V$), a constant-power part. And some loads recover…` },
      answer: {
        fr: r`La puissance **chute aussitôt**, d’environ 10 % avec ce mélange, puis reste là (si aucune part ne se rétablit). Le modèle ZIP : $$P = P_0\left(a_Z V^2 + a_I V + a_P\right) = 0{,}4 \times 0{,}81 + 0{,}3 \times 0{,}9 + 0{,}3 \approx 0{,}89\ \text{pu}$$ La sensibilité de la charge à la tension aide le réseau : une tension plus basse soulage la demande, du moins au début.`,
        en: r`Power **drops at once**, by about 10 % with this mix, then stays there (if no part recovers). The ZIP model: $$P = P_0\left(a_Z V^2 + a_I V + a_P\right) = 0.4 \times 0.81 + 0.3 \times 0.9 + 0.3 \approx 0.89\ \text{pu}$$ The load’s voltage sensitivity helps the grid: lower voltage eases demand, at least at first.`,
      },
    },
    resistive: {
      hint: { fr: r`$a_Z = 1$, $a_I = 0$, et part qui se rétablit à 0.`, en: r`$a_Z = 1$, $a_I = 0$, and recovering share at 0.` },
      answer: {
        fr: r`Une résistance absorbe $P = V^2/R$ : $$\frac{P}{P_0} = V^2 = 0{,}9^2 = 0{,}81$$ C’est la charge la plus « coopérative » : la puissance baisse deux fois plus vite que la tension.`,
        en: r`A resistor draws $P = V^2/R$: $$\frac{P}{P_0} = V^2 = 0.9^2 = 0.81$$ It is the most “cooperative” load: power falls twice as fast as voltage.`,
      },
    },
    constant: {
      hint: { fr: r`$a_Z = a_I = 0$, puis cliquez sur la pastille $I$ au-dessus de l’oscilloscope.`, en: r`$a_Z = a_I = 0$, then click the $I$ chip above the oscilloscope.` },
      answer: {
        fr: r`Une alimentation électronique régulée garde $P$ constant : $$I = \frac{P}{V} = \frac{1}{0{,}9} \approx 1{,}11\ \text{pu}$$ Le courant **augmente** quand la tension baisse, ce qui accroît la chute de tension dans le réseau : ces charges aggravent l’instabilité de tension (leçons 4.9 et 8.3).`,
        en: r`A regulated electronic supply keeps $P$ constant: $$I = \frac{P}{V} = \frac{1}{0.9} \approx 1.11\ \text{pu}$$ Current **rises** when voltage falls, which deepens the voltage drop across the grid: such loads worsen voltage instability (lessons 4.9 and 8.3).`,
      },
    },
    recover: {
      hint: { fr: r`Part dynamique à 0,8 ou plus, puis ▶ jusqu’au bout.`, en: r`Dynamic share at 0.8 or more, then ▶ to the end.` },
      answer: {
        fr: r`Les charges thermostatées (chauffage, froid) compensent en restant allumées plus longtemps : la puissance remonte avec une constante de temps $T_p$ : $$T_p\,\dot x = P_s(V) - P_t(V), \qquad P = x + P_t(V)$$ Sur quelques minutes, la puissance revient à sa valeur d’avant. Le soulagement initial n’était que temporaire.`,
        en: r`Thermostatic loads (heating, cooling) make up by staying on longer: power recovers with a time constant $T_p$: $$T_p\,\dot x = P_s(V) - P_t(V), \qquad P = x + P_t(V)$$ Within a few minutes, power is back to its previous value. The initial relief was only temporary.`,
      },
    },
    cvr: {
      hint: { fr: r`Part dynamique à 0, $a_Z \ge 0{,}7$, et une baisse de tension réglée entre 0,95 et 0,97 pu.`, en: r`Dynamic share at 0, $a_Z \ge 0.7$, and a voltage step set between 0.95 and 0.97 pu.` },
      answer: {
        fr: r`Le facteur CVR (réduction de consommation par la tension) est la sensibilité relative : $$\text{CVR} = \frac{\Delta P/P}{\Delta V/V} \approx 2a_Z + a_I$$ Avec une charge surtout résistive, il approche 2. Des distributeurs abaissent ainsi la tension de quelques pour cent pour économiser de l’énergie, sans que les clients ne le remarquent.`,
        en: r`The CVR factor (conservation voltage reduction) is the relative sensitivity: $$\text{CVR} = \frac{\Delta P/P}{\Delta V/V} \approx 2a_Z + a_I$$ With a mostly resistive load it approaches 2. Some distributors lower voltage by a few per cent this way to save energy, unnoticed by customers.`,
      },
    },
  },

  motor: {
    predict: {
      hint: { fr: r`À l’arrêt, le glissement vaut 1 : le moteur est comme un transformateur en court-circuit. Puis il accélère…`, en: r`At standstill, slip is 1: the motor is like a short-circuited transformer. Then it speeds up…` },
      answer: {
        fr: r`Le courant de démarrage vaut **5 à 7 fois** le nominal et reste élevé tant que le moteur n’a pas pris de vitesse, puis chute vers sa valeur de marche quand le glissement devient petit. $$I(s) = \frac{V}{\sqrt{(R_s + R_r/s)^2 + X^2}} \;\xrightarrow{s = 1}\; \frac{V}{\sqrt{(R_s + R_r)^2 + X^2}}$$ Ces appels font des creux de tension dans le voisinage ; d’où les démarreurs étoile-triangle et les variateurs.`,
        en: r`Starting current is **5 to 7 times** rated and stays high until the motor gathers speed, then drops to its running value as slip becomes small. $$I(s) = \frac{V}{\sqrt{(R_s + R_r/s)^2 + X^2}} \;\xrightarrow{s = 1}\; \frac{V}{\sqrt{(R_s + R_r)^2 + X^2}}$$ These inrushes cause local voltage dips; hence star-delta starters and drives.`,
      },
    },
    heavy: {
      hint: { fr: r`Démarrage depuis l’arrêt, type de charge « couple constant », et couple de charge au-delà de la valeur du couple de démarrage (vers 1,2 pu).`, en: r`Start from standstill, “constant torque” load, and load torque above the starting torque (around 1.2 pu).` },
      answer: {
        fr: r`Le moteur ne démarre que si son couple dépasse celui de la charge dès l’arrêt : $$T_{em}(s = 1) = \frac{3V^2}{\omega_s}\frac{R_r}{(R_s + R_r)^2 + X^2} > T_{charge}$$ Sinon il reste calé, traversé par 5 à 7 fois son courant nominal : sa protection thermique doit le couper en quelques secondes.`,
        en: r`The motor starts only if its torque exceeds the load’s from standstill: $$T_{em}(s = 1) = \frac{3V^2}{\omega_s}\frac{R_r}{(R_s + R_r)^2 + X^2} > T_{load}$$ Otherwise it stays stalled, drawing 5 to 7 times rated current: its thermal protection must trip it within seconds.`,
      },
    },
    dip: {
      hint: { fr: r`Moteur en marche, couple constant 0,9 pu, $H = 0{,}2$ s, creux à 0,5 pu pendant 0,5 s.`, en: r`Running motor, constant torque 0.9 pu, $H = 0.2$ s, dip to 0.5 pu for 0.5 s.` },
      answer: {
        fr: r`Le couple moteur varie comme $V^2$ : à 0,5 pu, il est divisé par 4 et ne peut plus porter la charge. Le moteur ralentit ; s’il dépasse le glissement du couple maximal, il ne peut plus réaccélérer, même après le retour de la tension : $$2H\,\frac{d\omega}{dt} = T_{em}(s, V) - T_{charge}$$ Les climatiseurs calés tirent alors un fort courant réactif et retardent le retour de la tension : c’est le **FIDVR** (retour de tension retardé par défaut).`,
        en: r`Motor torque goes as $V^2$: at 0.5 pu it is divided by 4 and cannot carry the load. The motor slows; if it passes the slip of maximum torque, it cannot re-accelerate even once voltage returns: $$2H\,\frac{d\omega}{dt} = T_{em}(s, V) - T_{load}$$ Stalled air conditioners then draw heavy reactive current and delay voltage recovery: **FIDVR** (fault-induced delayed voltage recovery).`,
      },
    },
    fan: {
      hint: { fr: r`Mêmes réglages de creux, mais type de charge « ventilateur ».`, en: r`Same dip settings, but “fan” load type.` },
      answer: {
        fr: r`Le couple d’un ventilateur décroît avec le carré de la vitesse : $$T_{charge} = T_0\,\omega^2$$ En ralentissant, la charge s’allège d’elle-même et le moteur retrouve un équilibre. Les charges à couple constant (compresseurs, convoyeurs) sont bien plus sensibles aux creux.`,
        en: r`A fan’s torque falls with the square of speed: $$T_{load} = T_0\,\omega^2$$ As it slows, the load lightens itself and the motor finds a new balance. Constant-torque loads (compressors, conveyors) are far more sensitive to dips.`,
      },
    },
    rotor: {
      hint: { fr: r`Montez $R_r$ à 0,06 pu.`, en: r`Raise $R_r$ to 0.06 pu.` },
      answer: {
        fr: r`Le couple maximal ne dépend pas de $R_r$, mais le glissement où il se produit, si : $$s_{max} = \frac{R_r}{\sqrt{R_s^2 + X^2}}, \qquad T_{max} \approx \frac{3V^2}{2\omega_s X}$$ Une forte résistance rotorique déplace le pic vers le démarrage (plus de couple à l’arrêt) mais augmente le glissement et les pertes en marche. La double cage (ou les barres profondes) donne une forte résistance au démarrage et faible en marche.`,
        en: r`Maximum torque does not depend on $R_r$, but the slip at which it occurs does: $$s_{max} = \frac{R_r}{\sqrt{R_s^2 + X^2}}, \qquad T_{max} \approx \frac{3V^2}{2\omega_s X}$$ High rotor resistance moves the peak towards standstill (more starting torque) but raises running slip and losses. Double-cage (or deep-bar) rotors give high resistance at start and low resistance when running.`,
      },
    },
  },

  comp: {
    heavy: {
      hint: { fr: r`Sans condensateur ni compensation série, montez $P$ vers 1,2 pu.`, en: r`With no capacitor or series compensation, raise $P$ towards 1.2 pu.` },
      answer: {
        fr: r`Pour une charge alimentée par une réactance $X$, la tension suit la branche haute de la courbe P–V : $$V^2 = \frac{E^2}{2} - QX \pm \sqrt{\frac{E^4}{4} - X^2P^2 - XQE^2}$$ Plus on charge, plus la tension baisse, de plus en plus vite près du nez, où les deux solutions se rejoignent.`,
        en: r`For a load fed through a reactance $X$, voltage follows the upper branch of the P–V curve: $$V^2 = \frac{E^2}{2} - QX \pm \sqrt{\frac{E^4}{4} - X^2P^2 - XQE^2}$$ The heavier the load, the lower the voltage, falling faster and faster near the nose, where both solutions meet.`,
      },
    },
    capacitor: {
      hint: { fr: r`Gardez la charge et augmentez $B$ (condensateur shunt) jusqu’à $V \ge 0{,}98$ pu.`, en: r`Keep the load and raise $B$ (shunt capacitor) until $V \ge 0.98$ pu.` },
      answer: {
        fr: r`Le condensateur produit $Q_C = BV^2$ sur place : la ligne transporte moins de réactif et la chute $XQ/V$ diminue. Toute la courbe P–V monte et le nez s’éloigne. Mais $Q_C$ s’effondre avec $V^2$ : un condensateur aide moins quand on en a le plus besoin.`,
        en: r`The capacitor produces $Q_C = BV^2$ locally: the line carries less reactive power and the drop $XQ/V$ shrinks. The whole P–V curve rises and the nose moves out. But $Q_C$ collapses with $V^2$: a capacitor helps least when it is needed most.`,
      },
    },
    light: {
      hint: { fr: r`$B \ge 0{,}5$ pu, puis baissez $P$ sous 0,2 pu.`, en: r`$B \ge 0.5$ pu, then lower $P$ below 0.2 pu.` },
      answer: {
        fr: r`À faible charge, le condensateur injecte plus de réactif que la ligne n’en consomme : la tension monte (comme l’effet Ferranti). $$\Delta V \approx \frac{X(Q_{charge} - BV^2)}{V} < 0$$ D’où les manœuvres quotidiennes : condensateurs déconnectés et inductances shunt connectées la nuit.`,
        en: r`At light load, the capacitor injects more reactive power than the line absorbs: voltage rises (like the Ferranti effect). $$\Delta V \approx \frac{X(Q_{load} - BV^2)}{V} < 0$$ Hence the daily switching: capacitors off and shunt reactors on at night.`,
      },
    },
    series: {
      hint: { fr: r`Montez le taux de compensation série $k$ à 0,4.`, en: r`Raise the series compensation degree $k$ to 0.4.` },
      answer: {
        fr: r`Un condensateur série réduit la réactance de la ligne : $$X_{eff} = (1 - k)X, \qquad P_{max} = \frac{EV}{(1 - k)X}$$ À 40 %, le transfert maximal augmente de 67 %. C’est l’outil des très longues lignes, mais il crée une résonance électrique sous 50 Hz qui peut exciter les arbres des turbines (résonance hyposynchrone, leçon 8.6).`,
        en: r`A series capacitor reduces the line reactance: $$X_{eff} = (1 - k)X, \qquad P_{max} = \frac{EV}{(1 - k)X}$$ At 40 %, maximum transfer rises by 67 %. It is the tool of very long lines, but it creates an electrical resonance below 50 Hz that can excite turbine shafts (subsynchronous resonance, lesson 8.6).`,
      },
    },
    collapse: {
      hint: { fr: r`Montez $P$ jusqu’au bout de la courbe P–V, au-delà du nez.`, en: r`Raise $P$ to the end of the P–V curve, beyond the nose.` },
      answer: {
        fr: r`Au nez, le discriminant de l’équation P–V s’annule ; au-delà, il n’existe plus de tension qui satisfasse à la fois la charge et le réseau. Pour une charge à $\cos\varphi = 1$ : $$P_{max} = \frac{E^2}{2X}$$ La tension s’effondre : c’est l’instabilité de tension, cause de plusieurs grands incidents (France 1987, Grèce 2004).`,
        en: r`At the nose, the P–V discriminant vanishes; beyond it, no voltage satisfies both load and network. For a load at unity power factor: $$P_{max} = \frac{E^2}{2X}$$ Voltage collapses: this is voltage instability, the cause of several major blackouts (France 1987, Greece 2004).`,
      },
    },
  },

  facts: {
    compare: {
      hint: { fr: r`Appuyez sur ▶ et laissez la lecture aller au bout.`, en: r`Press ▶ and let it play to the end.` },
      answer: {
        fr: r`Pendant le creux, chaque équipement injecte du réactif pour relever la tension de son poste, selon sa pente de réglage : $$V = V_{ref} - s\,\frac{Q}{Q_n}$$ La tension tenue dépend de la force du réseau : le réactif injecté relève la tension de $\Delta V \approx Q/S_{cc}$.`,
        en: r`During the dip, each device injects reactive power to lift its substation voltage, according to its droop: $$V = V_{ref} - s\,\frac{Q}{Q_n}$$ The voltage held depends on grid strength: the injected reactive power raises voltage by $\Delta V \approx Q/S_{sc}$.`,
      },
    },
    deep: {
      hint: { fr: r`Baissez $E_{creux}$ à 0,5 pu.`, en: r`Lower $E_{dip}$ to 0.5 pu.` },
      answer: {
        fr: r`Le SVC est une susceptance variable ; le STATCOM une source de courant : $$Q_{SVC} = B_{max}V^2, \qquad Q_{STATCOM} = I_{max}V$$ À 0,5 pu, le SVC ne fournit plus que 25 % de son calibre, le STATCOM encore 50 %. C’est pourquoi le STATCOM est préféré pour tenir la tension pendant les défauts.`,
        en: r`The SVC is a variable susceptance; the STATCOM a current source: $$Q_{SVC} = B_{max}V^2, \qquad Q_{STATCOM} = I_{max}V$$ At 0.5 pu, the SVC delivers only 25 % of its rating, the STATCOM still 50 %. That is why the STATCOM is preferred to hold voltage during faults.`,
      },
    },
    strong: {
      hint: { fr: r`Montez le SCR à 8.`, en: r`Raise the SCR to 8.` },
      answer: {
        fr: r`L’effet d’une injection de réactif sur la tension est inversement proportionnel à la puissance de court-circuit : $$\Delta V \approx \frac{\Delta Q}{S_{cc}} = \frac{\Delta Q}{\text{SCR}\cdot S_n}$$ Sur un réseau fort, il faudrait un équipement énorme pour bouger la tension. Les FACTS sont placés aux points faibles : bouts de lignes longues, raccordements de parcs éoliens.`,
        en: r`The effect of injected reactive power on voltage is inversely proportional to short-circuit power: $$\Delta V \approx \frac{\Delta Q}{S_{sc}} = \frac{\Delta Q}{\text{SCR}\cdot S_n}$$ On a strong grid, a huge device would be needed to move the voltage. FACTS are placed at weak points: ends of long lines, wind-farm connections.`,
      },
    },
    fast: {
      hint: { fr: r`Baissez le temps de réponse $T_r$ à 10 ms.`, en: r`Lower the response time $T_r$ to 10 ms.` },
      answer: {
        fr: r`L’électronique de puissance commute en quelques millisecondes ; le temps de réponse est surtout fixé par la mesure et la régulation : $$Q(s) = \frac{Q_{ref}(s)}{1 + T_r s}$$ Un alternateur, limité par la constante de temps de son excitation ($T'_{d0} \approx 5$ s), est cent fois plus lent : les FACTS rattrapent la tension dès le premier cycle du défaut.`,
        en: r`Power electronics switch within milliseconds; response time is set mostly by measurement and control: $$Q(s) = \frac{Q_{ref}(s)}{1 + T_r s}$$ A generator, limited by its field time constant ($T'_{d0} \approx 5$ s), is a hundred times slower: FACTS catch the voltage within the first cycle of a fault.`,
      },
    },
    size: {
      hint: { fr: r`SCR ≤ 4 et creux ≤ 0,7 pu, puis augmentez le calibre du STATCOM jusqu’à lire $V \ge 0{,}9$ pu pendant le creux.`, en: r`SCR ≤ 4 and dip ≤ 0.7 pu, then raise the STATCOM rating until $V \ge 0.9$ pu during the dip.` },
      answer: {
        fr: r`Pour relever la tension de $\Delta V$ sur un réseau de puissance de court-circuit $S_{cc}$, il faut environ $$Q \approx \Delta V \cdot S_{cc}, \qquad \text{avec } Q \le I_{max}\,V$$ Le calibre nécessaire croît avec la profondeur du creux et la faiblesse du réseau. Le dimensionnement se fait sur le pire creux à tenir, d’où l’intérêt de connaître la force du réseau.`,
        en: r`To lift voltage by $\Delta V$ on a grid of short-circuit power $S_{sc}$, you need about $$Q \approx \Delta V \cdot S_{sc}, \qquad \text{with } Q \le I_{max}\,V$$ The rating needed grows with the depth of the dip and the weakness of the grid. Sizing is done for the worst dip to ride through, hence the need to know grid strength.`,
      },
    },
  },
};
