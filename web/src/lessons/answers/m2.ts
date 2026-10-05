// Module 2 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers2: Answers = {
  euler: {
    predict: {
      hint: { fr: r`Dessinez les deux flèches bout à bout : deux vecteurs de même longueur à 120° l’un de l’autre. Quelle est la longueur de leur somme ?`, en: r`Draw the two arrows head to tail: two equal vectors 120° apart. How long is their sum?` },
      answer: {
        fr: r`La somme de deux sinusoïdes de même fréquence est une sinusoïde **de même fréquence**. Son amplitude se lit sur les phaseurs : $$|\underline V_1 + \underline V_2| = 2A\cos\frac{\Delta\varphi}{2} = 2 \times 5 \times \cos 60° = 5\ \text{V}$$ À 120° de décalage, la somme a la **même amplitude** que chacune, et une phase intermédiaire (60°).`,
        en: r`The sum of two sinusoids of the same frequency is a sinusoid **of that frequency**. Its amplitude comes from the phasors: $$|\underline V_1 + \underline V_2| = 2A\cos\frac{\Delta\varphi}{2} = 2 \times 5 \times \cos 60° = 5\ \text{V}$$ At 120° apart, the sum has the **same amplitude** as each one, at an in-between phase (60°).`,
      },
    },
    helix: {
      hint: { fr: r`Utilisez le bouton de vue « en bout » au-dessus de l’hélice, puis ▶.`, en: r`Use the “end-on” view button above the helix, then ▶.` },
      answer: {
        fr: r`La formule d’Euler relie le vecteur tournant aux sinusoïdes : $$e^{j\omega t} = \cos\omega t + j\sin\omega t$$ Le cosinus est sa projection sur l’axe réel, le sinus sur l’axe imaginaire. Un phaseur est ce vecteur figé à $t = 0$ : il garde l’amplitude et la phase, la rotation $e^{j\omega t}$ étant commune à toutes les grandeurs du circuit.`,
        en: r`Euler’s formula links the rotating vector to sinusoids: $$e^{j\omega t} = \cos\omega t + j\sin\omega t$$ The cosine is its projection on the real axis, the sine on the imaginary axis. A phasor is that vector frozen at $t = 0$: it keeps amplitude and phase, the rotation $e^{j\omega t}$ being common to every quantity in the circuit.`,
      },
    },
    'in-phase': {
      hint: { fr: r`Il faut $\varphi_2 = \varphi_1$.`, en: r`You need $\varphi_2 = \varphi_1$.` },
      answer: {
        fr: r`En phase, les flèches sont alignées et les amplitudes s’additionnent simplement : $$\hat V = A_1 + A_2$$ C’est le maximum possible : dans tous les autres cas, $|\underline V_1 + \underline V_2| < A_1 + A_2$ (inégalité triangulaire).`,
        en: r`In phase, the arrows line up and the amplitudes simply add: $$\hat V = A_1 + A_2$$ That is the largest possible sum: in any other case $|\underline V_1 + \underline V_2| < A_1 + A_2$ (triangle inequality).`,
      },
    },
    cancel: {
      hint: { fr: r`Égalisez les amplitudes, puis décalez $\varphi_2$ de 180° par rapport à $\varphi_1$.`, en: r`Make the amplitudes equal, then set $\varphi_2$ 180° away from $\varphi_1$.` },
      answer: {
        fr: r`En opposition de phase, $\underline V_2 = -\underline V_1$ et la somme est nulle à chaque instant : $$A\sin\omega t + A\sin(\omega t + \pi) = 0$$ C’est l’interférence destructive, utilisée par les casques anti-bruit et, sur le réseau, par les filtres actifs qui injectent l’opposé des harmoniques.`,
        en: r`In phase opposition, $\underline V_2 = -\underline V_1$ and the sum is zero at every instant: $$A\sin\omega t + A\sin(\omega t + \pi) = 0$$ This is destructive interference, used by noise-cancelling headphones and, on the grid, by active filters that inject the opposite of the harmonics.`,
      },
    },
    'three-phase': {
      hint: { fr: r`Mettez les deux amplitudes égales, puis les phases à +120° et −120°.`, en: r`Make both amplitudes equal, then set the phases to +120° and −120°.` },
      answer: {
        fr: r`Trois phaseurs égaux à 120° forment un triangle fermé : $$1 + e^{j2\pi/3} + e^{-j2\pi/3} = 0$$ La somme de deux d’entre eux est l’opposé du troisième. Dans un système triphasé équilibré, les trois courants s’annulent : le neutre ne transporte rien, et trois conducteurs suffisent pour transporter trois fois la puissance d’un monophasé.`,
        en: r`Three equal phasors 120° apart close a triangle: $$1 + e^{j2\pi/3} + e^{-j2\pi/3} = 0$$ The sum of two of them is minus the third. In a balanced three-phase system the three currents cancel: the neutral carries nothing, and three conductors carry three times the power of a single phase.`,
      },
    },
  },

  impedance: {
    predict: {
      hint: { fr: r`Pour une bobine, $v = L\,di/dt$ : le courant est l’intégrale de la tension. Où est-il maximal quand la tension passe par zéro ?`, en: r`For an inductor, $v = L\,di/dt$: current is the integral of voltage. Where is it maximum when voltage crosses zero?` },
      answer: {
        fr: r`Le courant est une sinusoïde **en retard de 90°** sur la tension (un quart de période, 5 ms), d’amplitude : $$\underline I = \frac{\underline V}{jL\omega}, \qquad I = \frac{230}{2\pi \cdot 50 \cdot 0{,}05} \approx 14{,}6\ \text{A}$$ Il est maximal quand la tension s’annule : c’est l’intégrale d’un cosinus.`,
        en: r`The current is a sinusoid **lagging the voltage by 90°** (a quarter period, 5 ms), with amplitude: $$\underline I = \frac{\underline V}{jL\omega}, \qquad I = \frac{230}{2\pi \cdot 50 \cdot 0.05} \approx 14.6\ \text{A}$$ It peaks when the voltage is zero: the integral of a cosine.`,
      },
    },
    capacitor: {
      hint: { fr: r`Choisissez le circuit « C » dans le sélecteur du bas.`, en: r`Choose the “C” circuit in the bottom selector.` },
      answer: {
        fr: r`Pour un condensateur, le courant est la dérivée de la tension : il est **en avance** de 90°. $$\underline I = jC\omega\,\underline V, \qquad X_C = \frac{1}{C\omega}$$ Mnémotechnique : « CIVIL » — dans C, I avant V ; dans L, V avant I.`,
        en: r`For a capacitor, current is the derivative of voltage: it **leads** by 90°. $$\underline I = jC\omega\,\underline V, \qquad X_C = \frac{1}{C\omega}$$ Mnemonic: “CIVIL” — in C, I before V; in L, V before I.`,
      },
    },
    frequency: {
      hint: { fr: r`Circuit « L », puis montez $f$ à 500 Hz.`, en: r`“L” circuit, then raise $f$ to 500 Hz.` },
      answer: {
        fr: r`La réactance d’une bobine croît avec la fréquence, celle d’un condensateur décroît : $$X_L = L\omega, \qquad X_C = \frac{1}{C\omega}$$ À 500 Hz, $X_L$ est 10 fois plus grande : le courant est divisé par 10. Combinées, bobines et condensateurs font des filtres passe-bas, passe-haut ou réjecteurs, comme le filtre LCL d’un onduleur (leçon 6.4).`,
        en: r`An inductor’s reactance rises with frequency, a capacitor’s falls: $$X_L = L\omega, \qquad X_C = \frac{1}{C\omega}$$ At 500 Hz, $X_L$ is 10 times larger: the current is divided by 10. Combined, inductors and capacitors make low-pass, high-pass or notch filters, such as an inverter’s LCL filter (lesson 6.4).`,
      },
    },
    corner: {
      answer: {
        fr: r`Le déphasage d’un circuit R + L est $$\tan\varphi = \frac{L\omega}{R} = 1 \;\Rightarrow\; f = \frac{R}{2\pi L} \approx 32\ \text{Hz}$$ (avec $R = 10\ \Omega$, $L = 50$ mH). Le module vaut alors $|Z| = \sqrt2\,R$. Cette fréquence « de coin » est aussi celle où un filtre RL atténue de 3 dB.`,
        en: r`The phase of an R + L circuit is $$\tan\varphi = \frac{L\omega}{R} = 1 \;\Rightarrow\; f = \frac{R}{2\pi L} \approx 32\ \text{Hz}$$ (with $R = 10\ \Omega$, $L = 50$ mH). The magnitude is then $|Z| = \sqrt2\,R$. This “corner” frequency is also where an RL filter attenuates by 3 dB.`,
      },
      hint: { fr: r`Il faut $X_L = R$. Avec les valeurs par défaut, essayez $f \approx 32$ Hz.`, en: r`You need $X_L = R$. With the default values, try $f \approx 32$ Hz.` },
    },
    locus: {
      hint: { fr: r`Circuit « R + C », puis montez $f$ jusqu’à ce que $X_C$ devienne petite devant $R$.`, en: r`“R + C” circuit, then raise $f$ until $X_C$ becomes small compared with $R$.` },
      answer: {
        fr: r`L’impédance d’un circuit R + C est $$\underline Z = R - \frac{j}{C\omega}$$ Sa partie réelle est fixe : quand $f$ varie, le point se déplace sur une droite verticale. À haute fréquence, $X_C \to 0$ et le condensateur se comporte comme un court-circuit : il ne reste que $R$. À basse fréquence, il bloque le courant.`,
        en: r`The impedance of an R + C circuit is $$\underline Z = R - \frac{j}{C\omega}$$ Its real part is fixed: as $f$ varies, the point moves on a vertical line. At high frequency $X_C \to 0$ and the capacitor acts like a short circuit: only $R$ remains. At low frequency it blocks the current.`,
      },
    },
  },

  power: {
    predict: {
      hint: { fr: r`Courant et tension ne sont plus en phase : pendant une partie de chaque période, l’un est positif et l’autre négatif.`, en: r`Current and voltage are no longer in phase: for part of every period, one is positive and the other negative.` },
      answer: {
        fr: r`$p(t)$ oscille toujours à $2f$, mais devient **négative** pendant une partie de chaque période : le moteur rend un peu d’énergie au réseau. Sa moyenne reste $P = 10$ kW : $$p(t) = VI\cos\varphi\,(1 - \cos 2\omega t) - VI\sin\varphi\,\sin 2\omega t$$ Avec $\cos\varphi = 0{,}7$, $S = P/\cos\varphi \approx 14{,}3$ kVA, donc le pic atteint $P + S \approx 24$ kW et le creux $P - S \approx -4$ kW.`,
        en: r`$p(t)$ still oscillates at $2f$, but goes **negative** for part of each period: the motor gives some energy back to the grid. Its average is still $P = 10$ kW: $$p(t) = VI\cos\varphi\,(1 - \cos 2\omega t) - VI\sin\varphi\,\sin 2\omega t$$ With $\cos\varphi = 0.7$, $S = P/\cos\varphi \approx 14.3$ kVA, so the peak reaches $P + S \approx 24$ kW and the dip $P - S \approx -4$ kW.`,
      },
    },
    parts: {
      hint: { fr: r`Cliquez sur les pastilles $p_P$ et $p_Q$ au-dessus de l’oscilloscope, puis ▶.`, en: r`Click the $p_P$ and $p_Q$ chips above the oscilloscope, then ▶.` },
      answer: {
        fr: r`La puissance instantanée se décompose en deux termes : $$p(t) = \underbrace{P\,(1 - \cos 2\omega t)}_{p_P \ge 0} \;-\; \underbrace{Q\,\sin 2\omega t}_{p_Q}, \qquad P = VI\cos\varphi,\ \ Q = VI\sin\varphi$$ $P$ est l’énergie réellement transférée par seconde. $Q$ mesure l’énergie qui fait l’aller-retour entre la source et les champs du moteur ; elle ne travaille pas, mais elle charge les câbles.`,
        en: r`Instantaneous power splits into two terms: $$p(t) = \underbrace{P\,(1 - \cos 2\omega t)}_{p_P \ge 0} \;-\; \underbrace{Q\,\sin 2\omega t}_{p_Q}, \qquad P = VI\cos\varphi,\ \ Q = VI\sin\varphi$$ $P$ is the energy actually delivered per second. $Q$ measures the energy shuttling between the source and the motor’s fields; it does no work, but it loads the cables.`,
      },
    },
    correct: {
      answer: {
        fr: r`Le condensateur fournit le réactif que le moteur consomme : $$Q_C = P\,(\tan\varphi_1 - \tan\varphi_2) = 10\ \text{kW} \times (1{,}02 - 0{,}33) \approx 6{,}9\ \text{kvar}$$ $$C = \frac{Q_C}{\omega V^2} \approx 416\ \mu\text{F}$$ $P$ ne change pas ; $Q$ et $S$ diminuent, donc le courant de ligne aussi.`,
        en: r`The capacitor supplies the reactive power the motor absorbs: $$Q_C = P\,(\tan\varphi_1 - \tan\varphi_2) = 10\ \text{kW} \times (1.02 - 0.33) \approx 6.9\ \text{kvar}$$ $$C = \frac{Q_C}{\omega V^2} \approx 416\ \mu\text{F}$$ $P$ is unchanged; $Q$ and $S$ shrink, and so does the line current.`,
      },
      hint: { fr: r`Il faut environ $420\ \mu$F : montez le curseur $C$ jusqu’à lire $\cos\varphi \ge 0{,}95$.`, en: r`You need about $420\ \mu$F: raise the $C$ slider until $\cos\varphi \ge 0.95$.` },
    },
    losses: {
      hint: { fr: r`Continuez à augmenter $C$, vers $560\ \mu$F, pour viser $\cos\varphi > 0{,}99$.`, en: r`Keep raising $C$, towards $560\ \mu$F, to reach $\cos\varphi > 0.99$.` },
      answer: {
        fr: r`À puissance active donnée, le courant et les pertes varient comme : $$I = \frac{P}{V\cos\varphi}, \qquad P_{\text{pertes}} = R I^2 \propto \frac{1}{\cos^2\varphi}$$ Passer de 0,7 à 1 divise les pertes par $1/0{,}49 \approx 2$. C’est pourquoi les fournisseurs facturent le réactif au-delà d’un seuil ($\tan\varphi > 0{,}4$ en France).`,
        en: r`For a given active power, current and losses go as: $$I = \frac{P}{V\cos\varphi}, \qquad P_{\text{losses}} = R I^2 \propto \frac{1}{\cos^2\varphi}$$ Going from 0.7 to 1 divides losses by $1/0.49 \approx 2$. That is why utilities bill reactive energy beyond a threshold ($\tan\varphi > 0.4$ in France).`,
      },
    },
    over: {
      hint: { fr: r`Montez $C$ au-delà d’environ $700\ \mu$F : le déphasage devient négatif.`, en: r`Raise $C$ beyond about $700\ \mu$F: the phase angle becomes negative.` },
      answer: {
        fr: r`Au-delà de la compensation exacte, $Q_C > Q_{\text{moteur}}$ : l’ensemble devient **capacitif**, le courant passe en avance et remonte. Sur un réseau inductif, injecter du réactif **élève** la tension : $$\Delta V \approx \frac{RP + XQ}{V}, \quad Q < 0 \Rightarrow \Delta V < 0 \ \text{(la tension monte)}$$ D’où des batteries en gradins, enclenchées selon la charge.`,
        en: r`Beyond exact compensation, $Q_C > Q_{\text{motor}}$: the whole becomes **capacitive**, the current leads and grows again. On an inductive grid, injecting reactive power **raises** the voltage: $$\Delta V \approx \frac{RP + XQ}{V}, \quad Q < 0 \Rightarrow \Delta V < 0 \ \text{(voltage rises)}$$ Hence banks in steps, switched according to the load.`,
      },
    },
  },

  'three-phase': {
    predict: {
      hint: { fr: r`Chaque radiateur pulse entre 0 et 4 kW à 100 Hz, mais les trois sont décalés d’un tiers de période. Que donne la somme ?`, en: r`Each heater pulses between 0 and 4 kW at 100 Hz, but the three are shifted by a third of a period. What does the sum give?` },
      answer: {
        fr: r`La puissance totale est **constante**, égale à 6 kW : les trois termes en $\cos 2\omega t$ sont décalés de 120° et s’annulent. $$p(t) = \sum_k \frac{V^2}{R}\big(1 - \cos(2\omega t - k\tfrac{4\pi}{3})\big) = 3\,\frac{V^2}{R}$$ C’est l’un des grands avantages du triphasé : un alternateur ou un moteur triphasé fournit un couple **sans à-coups**.`,
        en: r`Total power is **constant**, 6 kW: the three $\cos 2\omega t$ terms are 120° apart and cancel. $$p(t) = \sum_k \frac{V^2}{R}\big(1 - \cos(2\omega t - k\tfrac{4\pi}{3})\big) = 3\,\frac{V^2}{R}$$ That is one of the great advantages of three-phase: a three-phase generator or motor delivers a **smooth** torque.`,
      },
    },
    single: {
      hint: { fr: r`Mettez le sélecteur de phases sur 1.`, en: r`Set the phase selector to 1.` },
      answer: {
        fr: r`En monophasé, $p(t) = P(1 - \cos 2\omega t)$ pulse entre 0 et $2P$ à 100 Hz : couple pulsé dans les moteurs, vibrations. En triphasé équilibré, les trois pulsations sont décalées de 120° et se compensent.`,
        en: r`In single phase, $p(t) = P(1 - \cos 2\omega t)$ pulses between 0 and $2P$ at 100 Hz: pulsating torque in motors, vibration. In balanced three-phase, the three pulsations are 120° apart and cancel.`,
      },
    },
    unbalance: {
      hint: { fr: r`Réduisez fortement $R_a$ (par exemple à 10 Ω) en laissant $R_b$ et $R_c$ inchangées.`, en: r`Reduce $R_a$ strongly (e.g. to 10 Ω), leaving $R_b$ and $R_c$ unchanged.` },
      answer: {
        fr: r`Le courant de neutre est la somme des trois courants de phase : $$\underline I_N = \underline I_a + \underline I_b + \underline I_c$$ Équilibrés, ils s’annulent ; déséquilibrés, il reste une différence. En basse tension, les charges monophasées sont réparties entre les phases pour limiter ce courant.`,
        en: r`The neutral current is the sum of the three phase currents: $$\underline I_N = \underline I_a + \underline I_b + \underline I_c$$ Balanced, they cancel; unbalanced, a difference remains. In low-voltage networks, single-phase loads are spread across the phases to keep it small.`,
      },
    },
    broken: {
      hint: { fr: r`Gardez une phase très chargée, puis cliquez sur l’interrupteur du neutre dans le schéma.`, en: r`Keep one phase heavily loaded, then click the neutral switch on the schematic.` },
      answer: {
        fr: r`Sans neutre, le point étoile de la charge n’est plus tenu à 0 ; il se déplace jusqu’à ce que la somme des courants soit nulle : $$\underline V_{N'} = \frac{\sum_k \underline V_k / R_k}{\sum_k 1/R_k}$$ La phase la plus chargée voit sa tension baisser, les phases peu chargées montent vers 400 V. Une rupture de neutre peut ainsi détruire les appareils d’un immeuble.`,
        en: r`Without a neutral, the load’s star point is no longer held at 0; it moves until the currents sum to zero: $$\underline V_{N'} = \frac{\sum_k \underline V_k / R_k}{\sum_k 1/R_k}$$ The most loaded phase sees its voltage drop, the lightly loaded ones rise towards 400 V. A broken neutral can destroy the appliances of a whole building.`,
      },
    },
    line: {
      hint: { fr: r`Refermez le neutre et remettez les trois résistances à la même valeur (26,45 Ω).`, en: r`Close the neutral and set all three resistances back to the same value (26.45 Ω).` },
      answer: {
        fr: r`La tension entre deux phases est la différence de deux phaseurs à 120° : $$\underline V_{ab} = \underline V_a - \underline V_b = \sqrt3\,V\,e^{j30°}, \qquad 230 \times \sqrt3 = 400\ \text{V}$$ D’où la notation 230/400 V : simple et composée. Les gros appareils (moteurs, plaques) sont branchés entre phases.`,
        en: r`The voltage between two phases is the difference of two phasors 120° apart: $$\underline V_{ab} = \underline V_a - \underline V_b = \sqrt3\,V\,e^{j30°}, \qquad 230 \times \sqrt3 = 400\ \text{V}$$ Hence 230/400 V: phase and line voltage. Large appliances (motors, hobs) are connected between phases.`,
      },
    },
  },

  park: {
    predict: {
      hint: { fr: r`Si vous tournez à la même vitesse qu’un objet en rotation, il vous paraît immobile.`, en: r`If you spin at the same speed as a rotating object, it looks still to you.` },
      answer: {
        fr: r`$v_d$ est **constante** : vu depuis un repère qui tourne avec lui, le vecteur tension est immobile. Ses coordonnées dépendent seulement de l’angle entre le repère et le vecteur : $$\begin{pmatrix} v_d \\ v_q \end{pmatrix} = \hat V \begin{pmatrix} \cos(\varphi_v - \theta) \\ \sin(\varphi_v - \theta) \end{pmatrix}$$ C’est tout l’intérêt de Park : des grandeurs alternatives deviennent continues, et on peut les réguler avec de simples PI.`,
        en: r`$v_d$ is **constant**: seen from a frame rotating with it, the voltage vector stands still. Its coordinates depend only on the angle between the frame and the vector: $$\begin{pmatrix} v_d \\ v_q \end{pmatrix} = \hat V \begin{pmatrix} \cos(\varphi_v - \theta) \\ \sin(\varphi_v - \theta) \end{pmatrix}$$ That is the whole point of Park: AC quantities become DC, and simple PI controllers can regulate them.`,
      },
    },
    fixed: {
      hint: { fr: r`Mettez le curseur de vitesse du repère à 0.`, en: r`Set the frame-speed slider to 0.` },
      answer: {
        fr: r`Un repère immobile, c’est la transformation de Clarke : $$v_\alpha = \tfrac23\big(v_a - \tfrac12 v_b - \tfrac12 v_c\big), \qquad v_\beta = \tfrac{1}{\sqrt3}(v_b - v_c)$$ Le vecteur tourne à $\omega$ dans ce plan, et ses deux coordonnées sont des sinusoïdes en quadrature. Park, c’est Clarke suivi d’une rotation de $-\theta$.`,
        en: r`A still frame is the Clarke transform: $$v_\alpha = \tfrac23\big(v_a - \tfrac12 v_b - \tfrac12 v_c\big), \qquad v_\beta = \tfrac{1}{\sqrt3}(v_b - v_c)$$ The vector rotates at $\omega$ in this plane, and its two coordinates are sinusoids in quadrature. Park is Clarke followed by a rotation by $-\theta$.`,
      },
    },
    align: {
      hint: { fr: r`Vitesse 1, puis réglez $\varphi$ jusqu’à lire $v_q \approx 0$ (autour de 0°).`, en: r`Speed 1, then adjust $\varphi$ until $v_q \approx 0$ (around 0°).` },
      answer: {
        fr: r`Quand l’axe $d$ est aligné sur la tension, $v_q = 0$ et $v_d = \hat V$. La PLL (leçon 3.4) régule $v_q$ à zéro en ajustant l’angle du repère : $$\frac{d\theta}{dt} = \omega_0 + K_p v_q + K_i \int v_q\,dt$$ Dans ce repère, $P \propto v_d i_d$ et $Q \propto -v_d i_q$ : on commande $P$ et $Q$ séparément (leçon 7.1).`,
        en: r`When the $d$ axis is aligned with the voltage, $v_q = 0$ and $v_d = \hat V$. The PLL (lesson 3.4) drives $v_q$ to zero by adjusting the frame angle: $$\frac{d\theta}{dt} = \omega_0 + K_p v_q + K_i \int v_q\,dt$$ In that frame, $P \propto v_d i_d$ and $Q \propto -v_d i_q$: $P$ and $Q$ are controlled separately (lesson 7.1).`,
      },
    },
    unbalance: {
      hint: { fr: r`Descendez $k_c$ à 0,6.`, en: r`Bring $k_c$ down to 0.6.` },
      answer: {
        fr: r`Un système déséquilibré est la somme d’un vecteur direct (qui tourne à $+\omega$) et d’un vecteur inverse (à $-\omega$). Dans le repère qui tourne à $+\omega$, le direct est immobile et l’inverse tourne à $-2\omega$ : $$v_{dq}(t) = V_1 + V_2\,e^{-j2\omega t}$$ D’où l’ellipse et l’ondulation à 100 Hz, que les onduleurs doivent filtrer ou compenser pendant les défauts déséquilibrés.`,
        en: r`An unbalanced set is a positive-sequence vector (rotating at $+\omega$) plus a negative-sequence one (at $-\omega$). In the frame rotating at $+\omega$, the positive one stands still and the negative one spins at $-2\omega$: $$v_{dq}(t) = V_1 + V_2\,e^{-j2\omega t}$$ Hence the ellipse and the 100 Hz ripple, which inverters must filter or compensate during unbalanced faults.`,
      },
    },
    harmonic: {
      hint: { fr: r`$k_c = 1$, puis montez l’harmonique 5 à 10 %.`, en: r`$k_c = 1$, then raise the 5th harmonic to 10 %.` },
      answer: {
        fr: r`L’harmonique 5 d’un système équilibré est de séquence **inverse** : il tourne à $-5\omega$. Vu depuis le repère à $+\omega$, il tourne à $-6\omega$ (l’harmonique 7, direct, à $+6\omega$) : $$v_{dq} = V_1 + V_5\,e^{-j6\omega t}$$ Les ondulations à $6f$ sont la signature des harmoniques 5 et 7 dans les commandes $dq$.`,
        en: r`The 5th harmonic of a balanced set is **negative**-sequence: it rotates at $-5\omega$. Seen from the frame at $+\omega$, it spins at $-6\omega$ (the 7th, positive-sequence, at $+6\omega$): $$v_{dq} = V_1 + V_5\,e^{-j6\omega t}$$ Ripples at $6f$ are the signature of 5th and 7th harmonics in $dq$ controls.`,
      },
    },
  },

  'per-unit': {
    base: {
      hint: { fr: r`Changez $S_{base}$ (par exemple à 10 MVA) et comparez la tension de la charge avant et après.`, en: r`Change $S_{base}$ (e.g. to 10 MVA) and compare the load voltage before and after.` },
      answer: {
        fr: r`En per-unit, chaque grandeur est divisée par une base : $$z_{pu} = \frac{Z}{Z_{base}}, \qquad Z_{base} = \frac{U_{base}^2}{S_{base}}$$ Changer $S_{base}$ change tous les $z_{pu}$ dans le même rapport, mais pas les résultats physiques. Avec une tension de base par niveau (dans le rapport des transformateurs), les transformateurs idéaux disparaissent du calcul.`,
        en: r`In per-unit, every quantity is divided by a base: $$z_{pu} = \frac{Z}{Z_{base}}, \qquad Z_{base} = \frac{U_{base}^2}{S_{base}}$$ Changing $S_{base}$ scales every $z_{pu}$ by the same ratio, but not the physical results. With one base voltage per level (in the transformer ratios), ideal transformers vanish from the calculation.`,
      },
    },
    heavy: {
      hint: { fr: r`Montez $P_{charge}$ vers 30–40 MW.`, en: r`Raise $P_{load}$ towards 30–40 MW.` },
      answer: {
        fr: r`La chute de tension cumulée sur les impédances des transformateurs et de la ligne croît avec la charge : $$\Delta v \approx r\,p + x\,q \quad \text{(en pu)}$$ Le profil montre où se produit la chute : surtout dans les transformateurs, dont la réactance en pu est grande (8 à 15 %).`,
        en: r`The voltage drop across the transformer and line impedances grows with load: $$\Delta v \approx r\,p + x\,q \quad \text{(in pu)}$$ The profile shows where the drop happens: mostly in the transformers, whose per-unit reactance is large (8 to 15 %).`,
      },
    },
    tap: {
      hint: { fr: r`Montez la prise de T2 au-dessus de 1, par exemple 1,05.`, en: r`Raise T2’s tap above 1, e.g. 1.05.` },
      answer: {
        fr: r`Le régleur change le rapport du transformateur : une prise $t > 1$ relève la tension secondaire d’autant : $$v_2 \approx t\,v_1 - \Delta v$$ Les transformateurs HTB/HTA ont typiquement ±12 % en 17 prises, manœuvrées automatiquement en charge. Ils ne créent pas de réactif : ils déplacent le problème vers l’amont (leçon 8.3).`,
        en: r`The tap changer alters the transformer ratio: a tap $t > 1$ raises the secondary voltage accordingly: $$v_2 \approx t\,v_1 - \Delta v$$ HV/MV transformers typically have ±12 % in 17 steps, operated automatically on load. They create no reactive power: they shift the problem upstream (lesson 8.3).`,
      },
    },
    pf: {
      hint: { fr: r`Prise à 1, puis $\cos\varphi$ de la charge à 1.`, en: r`Tap back to 1, then the load $\cos\varphi$ to 1.` },
      answer: {
        fr: r`Sur un réseau où $X \gg R$, la chute de tension vient surtout du réactif : $$\Delta V \approx \frac{RP + XQ}{V}$$ Supprimer $Q$ supprime le terme dominant. Contrôler la tension, c’est donc d’abord contrôler les flux de puissance réactive (compensation, alternateurs, onduleurs).`,
        en: r`On a grid where $X \gg R$, the voltage drop comes mostly from reactive power: $$\Delta V \approx \frac{RP + XQ}{V}$$ Removing $Q$ removes the dominant term. Controlling voltage therefore means, first of all, controlling reactive power flows (compensation, generators, inverters).`,
      },
    },
  },

  fourier: {
    square: {
      hint: { fr: r`Cible « carré », puis montez $N$ à 15 ou plus.`, en: r`“Square” target, then raise $N$ to 15 or more.` },
      answer: {
        fr: r`Un carré d’amplitude $A$ ne contient que des harmoniques impairs, d’amplitude décroissant en $1/n$ : $$v(t) = \frac{4A}{\pi}\sum_{n\ \text{impair}} \frac{\sin n\omega t}{n}$$ Chaque harmonique ajoute un épicycle plus petit, tournant $n$ fois plus vite. Les fronts raides demandent beaucoup d’harmoniques élevés.`,
        en: r`A square wave of amplitude $A$ contains only odd harmonics, with amplitudes falling as $1/n$: $$v(t) = \frac{4A}{\pi}\sum_{n\ \text{odd}} \frac{\sin n\omega t}{n}$$ Each harmonic adds a smaller epicycle spinning $n$ times faster. Steep edges need many high harmonics.`,
      },
    },
    gibbs: {
      hint: { fr: r`Montez $N$ jusqu’au maximum (49).`, en: r`Raise $N$ to the maximum (49).` },
      answer: {
        fr: r`Près d’une discontinuité, une série de Fourier tronquée dépasse toujours d’environ **9 % du saut** (ici 18 % de l’amplitude, le saut valant $2A$), quel que soit $N$ : $$\max v_N \to A\left(\frac{2}{\pi}\int_0^\pi \frac{\sin x}{x}dx\right) \approx 1{,}18\,A$$ Le dépassement se resserre mais ne disparaît pas : c’est le phénomène de Gibbs, visible aussi dans les filtres numériques.`,
        en: r`Near a discontinuity, a truncated Fourier series always overshoots by about **9 % of the jump** (here 18 % of the amplitude, the jump being $2A$), whatever $N$: $$\max v_N \to A\left(\frac{2}{\pi}\int_0^\pi \frac{\sin x}{x}dx\right) \approx 1.18\,A$$ The overshoot narrows but never disappears: the Gibbs phenomenon, also seen in digital filters.`,
      },
    },
    triangle: {
      hint: { fr: r`Cible « triangle », $N$ à 3.`, en: r`“Triangle” target, $N$ at 3.` },
      answer: {
        fr: r`Le triangle est continu : ses harmoniques décroissent en $1/n^2$, bien plus vite que ceux du carré : $$v(t) = \frac{8A}{\pi^2}\sum_{n\ \text{impair}} (-1)^{\frac{n-1}{2}}\frac{\sin n\omega t}{n^2}$$ Plus un signal est lisse, plus son spectre décroît vite. Le taux de distorsion $\text{THD} = \sqrt{\sum_{n\ge2} V_n^2}/V_1$ vaut 12 % ici contre 48 % pour le carré.`,
        en: r`The triangle is continuous: its harmonics fall as $1/n^2$, much faster than the square’s: $$v(t) = \frac{8A}{\pi^2}\sum_{n\ \text{odd}} (-1)^{\frac{n-1}{2}}\frac{\sin n\omega t}{n^2}$$ The smoother a signal, the faster its spectrum falls. The distortion $\text{THD} = \sqrt{\sum_{n\ge2} V_n^2}/V_1$ is 12 % here versus 48 % for the square.`,
      },
    },
    rectifier: {
      hint: { fr: r`Choisissez la cible « redresseur 6 pulses » et regardez le spectre.`, en: r`Choose the “6-pulse rectifier” target and look at the spectrum.` },
      answer: {
        fr: r`Un pont triphasé à 6 pulses absorbe des blocs de courant de 120°. Par symétrie, seuls subsistent les rangs $$n = 6k \pm 1 = 5, 7, 11, 13, \dots \qquad I_n \approx \frac{I_1}{n}$$ Les harmoniques 5 et 7 (20 % et 14 % du fondamental) sont la principale pollution des réseaux industriels ; on les filtre ou on passe à 12 pulses ($12k \pm 1$).`,
        en: r`A 6-pulse three-phase bridge draws 120° current blocks. By symmetry, only the orders $$n = 6k \pm 1 = 5, 7, 11, 13, \dots \qquad I_n \approx \frac{I_1}{n}$$ remain. The 5th and 7th (20 % and 14 % of the fundamental) are the main pollution of industrial grids; they are filtered, or 12-pulse bridges ($12k \pm 1$) are used.`,
      },
    },
    listen: {
      hint: { fr: r`Le bouton « ♪ Écouter » est dans le panneau du spectre.`, en: r`The “♪ Listen” button is in the spectrum panel.` },
      answer: {
        fr: r`La hauteur perçue est celle du fondamental ; le **timbre** est fixé par les harmoniques. Un sinus pur est terne, un carré est nasillard. Le transformateur ronronne à 100 Hz, car la magnétostriction allonge le fer deux fois par période, et ses harmoniques lui donnent son grain.`,
        en: r`Perceived pitch is the fundamental’s; **timbre** is set by the harmonics. A pure sine sounds dull, a square nasal. A transformer hums at 100 Hz, because magnetostriction stretches the iron twice per period, and the harmonics give the hum its texture.`,
      },
    },
  },

  sequences: {
    balance: {
      hint: { fr: r`Montez $|V_c|$ à 1 pu.`, en: r`Raise $|V_c|$ to 1 pu.` },
      answer: {
        fr: r`La transformation de Fortescue décompose tout système triphasé : $$\begin{pmatrix} V_0 \\ V_1 \\ V_2 \end{pmatrix} = \frac13 \begin{pmatrix} 1 & 1 & 1 \\ 1 & a & a^2 \\ 1 & a^2 & a \end{pmatrix} \begin{pmatrix} V_a \\ V_b \\ V_c \end{pmatrix}, \quad a = e^{j2\pi/3}$$ Un système équilibré direct n’a que $V_1$ ; tout déséquilibre fait apparaître $V_2$ et éventuellement $V_0$.`,
        en: r`Fortescue’s transform decomposes any three-phase set: $$\begin{pmatrix} V_0 \\ V_1 \\ V_2 \end{pmatrix} = \frac13 \begin{pmatrix} 1 & 1 & 1 \\ 1 & a & a^2 \\ 1 & a^2 & a \end{pmatrix} \begin{pmatrix} V_a \\ V_b \\ V_c \end{pmatrix}, \quad a = e^{j2\pi/3}$$ A balanced positive set has only $V_1$; any unbalance brings $V_2$ and possibly $V_0$.`,
      },
    },
    swap: {
      hint: { fr: r`Cliquez sur le bouton « b ↔ c ».`, en: r`Click the “b ↔ c” button.` },
      answer: {
        fr: r`Avec l’ordre a-c-b, le système est équilibré mais tourne dans l’autre sens : il n’a plus que de l’inverse, $V_2 = 1$, $V_1 = 0$. Le champ tournant d’un moteur s’inverse, et le moteur aussi. Dans un moteur normal, une petite composante inverse crée un couple de freinage et chauffe le rotor : d’où les protections de déséquilibre.`,
        en: r`With sequence a-c-b, the set is balanced but rotates the other way: it has only negative sequence, $V_2 = 1$, $V_1 = 0$. A motor’s rotating field reverses, and so does the motor. In a normal motor, a small negative-sequence component creates a braking torque and heats the rotor: hence unbalance protection.`,
      },
    },
    zero: {
      hint: { fr: r`Mettez les angles de b et c à 0°, avec les trois amplitudes égales.`, en: r`Set the b and c angles to 0°, with the three amplitudes equal.` },
      answer: {
        fr: r`Trois phaseurs identiques forment la composante homopolaire : $V_0 = V_a$, $V_1 = V_2 = 0$. Ils ne créent pas de champ tournant, mais leurs courants s’additionnent dans le neutre ou la terre : $$\underline I_N = 3\,\underline I_0$$ Les harmoniques de rang 3, 9… sont homopolaires : ils s’additionnent dans le neutre au lieu de s’annuler.`,
        en: r`Three identical phasors form the zero sequence: $V_0 = V_a$, $V_1 = V_2 = 0$. They create no rotating field, but their currents add up in the neutral or the earth: $$\underline I_N = 3\,\underline I_0$$ Harmonics of order 3, 9… are zero-sequence: they add in the neutral instead of cancelling.`,
      },
    },
    fault: {
      hint: { fr: r`Remettez les angles à −120° et +120°, $|V_b| = |V_c| = 1$, puis $|V_a| = 0$.`, en: r`Set the angles back to −120° and +120°, $|V_b| = |V_c| = 1$, then $|V_a| = 0$.` },
      answer: {
        fr: r`Avec $V_a = 0$ et $V_b, V_c$ intacts : $$V_1 = \tfrac13(0 + a\,a^2 + a^2 a) = \tfrac23, \qquad V_2 = V_0 = -\tfrac13$$ Les trois séquences apparaissent. C’est le principe du calcul des défauts (leçon 5.3) : un défaut monophasé relie en série les réseaux direct, inverse et homopolaire. Les relais détectent l’apparition de $I_0$ et $I_2$.`,
        en: r`With $V_a = 0$ and $V_b, V_c$ intact: $$V_1 = \tfrac13(0 + a\,a^2 + a^2 a) = \tfrac23, \qquad V_2 = V_0 = -\tfrac13$$ All three sequences appear. That is the basis of fault calculation (lesson 5.3): a single-phase fault puts the positive, negative and zero-sequence networks in series. Relays detect the appearance of $I_0$ and $I_2$.`,
      },
    },
    limit: {
      answer: {
        fr: r`Le taux de déséquilibre est $\text{VUF} = |V_2|/|V_1|$. Une baisse de $\delta$ sur une seule phase donne environ : $$\text{VUF} \approx \frac{\delta/3}{1 - \delta/3} \approx \frac{\delta}{3}$$ Il suffit donc de 3 à 6 % de creux sur une phase pour atteindre 1 à 2 %. La norme EN 50160 limite le déséquilibre à 2 % (moyennes 10 min, 95 % du temps).`,
        en: r`The unbalance factor is $\text{VUF} = |V_2|/|V_1|$. A drop of $\delta$ on one phase gives roughly: $$\text{VUF} \approx \frac{\delta/3}{1 - \delta/3} \approx \frac{\delta}{3}$$ So a 3 to 6 % dip on one phase is enough to reach 1 to 2 %. EN 50160 limits unbalance to 2 % (10-minute averages, 95 % of the time).`,
      },
      hint: { fr: r`Partez de trois phases à 1 pu, puis baissez une seule amplitude de quelques pour cent (vers 0,95).`, en: r`Start from three phases at 1 pu, then lower a single amplitude by a few per cent (towards 0.95).` },
    },
  },
};
