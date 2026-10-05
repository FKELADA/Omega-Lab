// Module 3 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers3: Answers = {
  poles: {
    predict: {
      hint: { fr: r`La partie imaginaire (10 rad/s) donne la vitesse d’oscillation, la partie réelle (−2) la vitesse d’amortissement. Laquelle est la plus grande ?`, en: r`The imaginary part (10 rad/s) sets how fast it oscillates, the real part (−2) how fast it decays. Which is larger?` },
      answer: {
        fr: r`Les pôles $-2 \pm 10j$ donnent une réponse **très oscillante** : environ 1,6 Hz, un premier dépassement de plus de 50 %, et un temps de réponse de 2 s. $$\zeta = \frac{\sigma}{\sqrt{\sigma^2 + \omega_d^2}} \approx 0{,}2, \qquad D = e^{-\pi\sigma/\omega_d} \approx 53\ \%, \qquad t_{2\%} \approx \frac{4}{\sigma} = 2\ \text{s}$$ Près de l’axe imaginaire, l’amortissement est faible.`,
        en: r`Poles at $-2 \pm 10j$ give a **very oscillatory** response: about 1.6 Hz, a first overshoot above 50 %, and a 2 s settling time. $$\zeta = \frac{\sigma}{\sqrt{\sigma^2 + \omega_d^2}} \approx 0.2, \qquad OS = e^{-\pi\sigma/\omega_d} \approx 53\ \%, \qquad t_{2\%} \approx \frac{4}{\sigma} = 2\ \text{s}$$ Close to the imaginary axis, damping is low.`,
      },
    },
    drag: {
      hint: { fr: r`Glissez un pôle à droite de l’axe vertical ($\sigma > 0$), ou mettez $\sigma$ positif avec le curseur.`, en: r`Drag a pole to the right of the vertical axis ($\sigma > 0$), or set $\sigma$ positive with the slider.` },
      answer: {
        fr: r`Chaque paire de pôles $s = -\sigma \pm j\omega_d$ contribue un mode $$e^{-\sigma t}\cos(\omega_d t + \varphi)$$ À gauche ($\sigma > 0$ dans cette écriture, partie réelle négative) il s’éteint ; sur l’axe il oscille indéfiniment ; à droite il **croît** exponentiellement. Un système est stable si et seulement si tous ses pôles sont à gauche de l’axe imaginaire.`,
        en: r`Each pole pair $s = -\sigma \pm j\omega_d$ contributes a mode $$e^{-\sigma t}\cos(\omega_d t + \varphi)$$ On the left (negative real part) it dies out; on the axis it oscillates forever; on the right it **grows** exponentially. A system is stable if and only if all its poles lie left of the imaginary axis.`,
      },
    },
    design: {
      hint: { fr: r`Il faut $\zeta \ge 0{,}69$ (5 % de dépassement) et une partie réelle au-delà de $4/0{,}6 \approx 6{,}7$ s⁻¹ : par exemple $-8 \pm 6j$.`, en: r`You need $\zeta \ge 0.69$ (5 % overshoot) and a real part beyond $4/0.6 \approx 6.7$ s⁻¹: for example $-8 \pm 6j$.` },
      answer: {
        fr: r`Le cahier des charges se traduit en zone du plan $s$ : $$D \le 5\ \% \Leftrightarrow \zeta \ge 0{,}69 \ \text{(un secteur de ±46° autour de l’axe réel négatif)}, \qquad t_r \le 0{,}6\ \text{s} \Leftrightarrow \sigma \ge \frac{4}{0{,}6}$$ C’est le **placement de pôles** : on choisit où doivent être les pôles, puis on calcule les gains du régulateur qui les y mettent.`,
        en: r`The specification maps to a region of the s-plane: $$OS \le 5\ \% \Leftrightarrow \zeta \ge 0.69 \ \text{(a ±46° sector around the negative real axis)}, \qquad t_s \le 0.6\ \text{s} \Leftrightarrow \sigma \ge \frac{4}{0.6}$$ That is **pole placement**: choose where the poles must be, then compute the controller gains that put them there.`,
      },
    },
    zero: {
      hint: { fr: r`Activez le zéro, puis placez-le à droite de l’axe, pas trop loin (par exemple $z = 5$).`, en: r`Turn the zero on, then put it right of the axis, not too far (e.g. $z = 5$).` },
      answer: {
        fr: r`Un zéro à partie réelle positive rend le système **à non-minimum de phase** : la réponse part d’abord dans le mauvais sens. $$H(s) = \frac{\omega_0^2}{z}\,\frac{z - s}{s^2 + 2\zeta\omega_0 s + \omega_0^2}$$ Plus le zéro est proche de l’origine, plus la contre-réaction est forte. Exemples : le niveau d’eau d’une chaudière, ou une turbine hydraulique dont la puissance baisse d’abord quand on ouvre la vanne (coup de bélier).`,
        en: r`A zero with a positive real part makes the system **non-minimum-phase**: the response first goes the wrong way. $$H(s) = \frac{\omega_0^2}{z}\,\frac{z - s}{s^2 + 2\zeta\omega_0 s + \omega_0^2}$$ The closer the zero to the origin, the larger the undershoot. Examples: a boiler’s drum level, or a hydro turbine whose power first drops when the gate opens (water hammer).`,
      },
    },
  },

  loop: {
    predict: {
      hint: { fr: r`Avec un gain $K$ en boucle fermée sans intégrateur, la sortie ne rejoint pas exactement la consigne. Où se stabilise-t-elle ?`, en: r`With a gain $K$ in a closed loop without an integrator, the output does not quite reach the setpoint. Where does it settle?` },
      answer: {
        fr: r`La sortie monte, dépasse un peu en oscillant, et se stabilise **sous** la consigne, à $$y(\infty) = \frac{K}{1 + K} = \frac{10}{11} \approx 0{,}91$$ L’erreur statique $1/(1 + K) \approx 9\ \%$ est inévitable sans intégrateur.`,
        en: r`The output rises, overshoots a little while oscillating, and settles **below** the setpoint, at $$y(\infty) = \frac{K}{1 + K} = \frac{10}{11} \approx 0.91$$ The steady-state error $1/(1 + K) \approx 9\ \%$ is unavoidable without an integrator.`,
      },
    },
    shrink: {
      hint: { fr: r`Montez $K$ à 30.`, en: r`Raise $K$ to 30.` },
      answer: {
        fr: r`Multiplier $K$ décale toute la courbe de gain vers le haut sans changer la phase. La coupure $\omega_c$ (où $|L| = 1$) se déplace vers des fréquences où la phase est plus proche de −180° : $$\text{MP} = 180° + \arg L(j\omega_c), \qquad \text{MG} = -20\log_{10}|L(j\omega_{180})|$$ Les deux marges diminuent ensemble.`,
        en: r`Multiplying $K$ shifts the whole gain curve up without changing the phase. The crossover $\omega_c$ (where $|L| = 1$) moves to frequencies where the phase is closer to −180°: $$\text{PM} = 180° + \arg L(j\omega_c), \qquad \text{GM} = -20\log_{10}|L(j\omega_{180})|$$ Both margins shrink together.`,
      },
    },
    edge: {
      hint: { fr: r`Avec ces trois pôles (1, 10 et 100 rad/s), l’instabilité arrive vers $K \approx 122$.`, en: r`With these three poles (1, 10 and 100 rad/s), instability comes near $K \approx 122$.` },
      answer: {
        fr: r`L’équation caractéristique est $s^3 + 111 s^2 + 1110 s + 1000(1 + K) = 0$. Le critère de Routh donne la limite : $$111 \times 1110 > 1000\,(1 + K) \;\Leftrightarrow\; K < 122$$ Au-delà, la marge de gain est négative, Nyquist entoure −1 et deux pôles passent à droite : trois lectures du même fait.`,
        en: r`The characteristic equation is $s^3 + 111 s^2 + 1110 s + 1000(1 + K) = 0$. Routh’s criterion gives the limit: $$111 \times 1110 > 1000\,(1 + K) \;\Leftrightarrow\; K < 122$$ Beyond it, the gain margin is negative, Nyquist encircles −1 and two poles cross to the right: three views of the same fact.`,
      },
    },
    pm45: {
      hint: { fr: r`Partez de $K = 10$ et augmentez doucement en surveillant la marge de phase affichée.`, en: r`Start from $K = 10$ and raise it slowly while watching the displayed phase margin.` },
      answer: {
        fr: r`Pour une boucle dominée par un second ordre, la marge de phase fixe l’amortissement en boucle fermée : $$\zeta \approx \frac{\text{MP}}{100}$$ 45° donne $\zeta \approx 0{,}45$ et environ 20 % de dépassement. On vise 45 à 60° : assez de rapidité, assez de robustesse face aux erreurs de modèle.`,
        en: r`For a loop dominated by a second-order pair, the phase margin sets closed-loop damping: $$\zeta \approx \frac{\text{PM}}{100}$$ 45° gives $\zeta \approx 0.45$ and about 20 % overshoot. Typical targets are 45 to 60°: fast enough, robust enough to model errors.`,
      },
    },
    tradeoff: {
      hint: { fr: r`Il faut $1/(1 + K) < 5\ \%$, soit $K \ge 19$ (et rester sous 122).`, en: r`You need $1/(1 + K) < 5\ \%$, i.e. $K \ge 19$ (and stay below 122).` },
      answer: {
        fr: r`L’erreur statique d’une boucle sans intégrateur vaut $$e_\infty = \frac{1}{1 + L(0)} = \frac{1}{1 + K}$$ Plus de précision demande plus de gain, donc moins de marge. Un intégrateur rend $L(0)$ infini et annule l’erreur, au prix de 90° de phase en moins : c’est tout l’art du réglage PI.`,
        en: r`The steady-state error of a loop without an integrator is $$e_\infty = \frac{1}{1 + L(0)} = \frac{1}{1 + K}$$ More accuracy needs more gain, hence less margin. An integrator makes $L(0)$ infinite and removes the error, at the cost of 90° of phase: that is the art of PI tuning.`,
      },
    },
  },

  swing: {
    predict: {
      hint: { fr: r`Le rotor est comme une masse sur un ressort : un échelon de force le déplace vers un nouvel équilibre… en le dépassant.`, en: r`The rotor is like a mass on a spring: a step in force moves it to a new equilibrium… overshooting it.` },
      answer: {
        fr: r`L’angle **oscille** autour d’un nouvel équilibre un peu plus élevé, à environ 1 Hz, en s’amortissant lentement. Le modèle linéarisé est un oscillateur : $$\frac{2H}{\omega_0}\Delta\ddot\delta + \frac{D}{\omega_0}\Delta\dot\delta + K_s\,\Delta\delta = \Delta P_m, \quad K_s = P_{max}\cos\delta_0$$ $\Delta\delta_\infty = \Delta P/K_s \approx 3{,}3°$, et le premier pic monte presque au double.`,
        en: r`The angle **oscillates** around a slightly higher equilibrium, at about 1 Hz, decaying slowly. The linearised model is an oscillator: $$\frac{2H}{\omega_0}\Delta\ddot\delta + \frac{D}{\omega_0}\Delta\dot\delta + K_s\,\Delta\delta = \Delta P_m, \quad K_s = P_{max}\cos\delta_0$$ $\Delta\delta_\infty = \Delta P/K_s \approx 3.3°$, and the first peak reaches almost twice that.`,
      },
    },
    tangent: {
      hint: { fr: r`Faites glisser le curseur de temps jusqu’au bout.`, en: r`Drag the time cursor to the end.` },
      answer: {
        fr: r`Linéariser, c’est remplacer la courbe $P_e = P_{max}\sin\delta$ par sa tangente en $\delta_0$ : $$P_e \approx P_{e0} + K_s\,\Delta\delta$$ Tant que l’angle reste près de $\delta_0$, l’erreur est du second ordre en $\Delta\delta$. C’est la base de toute l’analyse aux petits signaux (leçons 8.2, 8.7, 8.8).`,
        en: r`Linearising means replacing the curve $P_e = P_{max}\sin\delta$ by its tangent at $\delta_0$: $$P_e \approx P_{e0} + K_s\,\Delta\delta$$ As long as the angle stays near $\delta_0$, the error is second-order in $\Delta\delta$. That is the basis of all small-signal analysis (lessons 8.2, 8.7, 8.8).`,
      },
    },
    large: {
      hint: { fr: r`Montez l’échelon $\Delta P$ à 0,3 pu.`, en: r`Raise the step $\Delta P$ to 0.3 pu.` },
      answer: {
        fr: r`Pour un grand écart, la courbe sinusoïdale s’écarte de sa tangente : le « ressort » s’assouplit quand $\delta$ approche 90° ($K_s = P_{max}\cos\delta$ diminue). Le vrai rotor oscille plus lentement et plus loin que ne le prévoit le modèle linéaire.`,
        en: r`For a large swing, the sine curve departs from its tangent: the “spring” softens as $\delta$ approaches 90° ($K_s = P_{max}\cos\delta$ decreases). The real rotor swings slower and further than the linear model predicts.`,
      },
    },
    sync: {
      hint: { fr: r`Augmentez $\Delta P$ par petits pas au-delà de 0,3 pu jusqu’à ce que l’angle s’emballe.`, en: r`Increase $\Delta P$ in small steps beyond 0.3 pu until the angle runs away.` },
      answer: {
        fr: r`Au-delà de l’angle instable $\delta_u = 180° - \arcsin P_m/P_{max}$, la puissance électrique redevient inférieure à la puissance mécanique : le rotor accélère et décroche. Le critère des aires (leçon 8.1) donne la limite. Le modèle linéaire, avec son ressort constant, ne peut pas voir ce phénomène : la stabilité transitoire exige une simulation non linéaire.`,
        en: r`Beyond the unstable angle $\delta_u = 180° - \arcsin P_m/P_{max}$, electrical power falls below mechanical power again: the rotor accelerates and slips. The equal-area criterion (lesson 8.1) gives the limit. The linear model, with its constant spring, cannot see this: transient stability needs nonlinear simulation.`,
      },
    },
    weak: {
      hint: { fr: r`Remettez $\Delta P$ à 0,05 pu, puis baissez $P_{max}$ à 0,75.`, en: r`Set $\Delta P$ back to 0.05 pu, then lower $P_{max}$ to 0.75.` },
      answer: {
        fr: r`Une ligne plus longue réduit $P_{max} = EV/X$. Pour la même puissance, l’angle de fonctionnement augmente et le coefficient synchronisant diminue : $$K_s = P_{max}\cos\delta_0, \qquad f_n = \frac{1}{2\pi}\sqrt{\frac{\omega_0 K_s}{2H}}$$ L’oscillation ralentit et la marge vers $\delta_u$ fond : un réseau faible est moins stable.`,
        en: r`A longer line reduces $P_{max} = EV/X$. For the same power, the operating angle rises and the synchronising coefficient falls: $$K_s = P_{max}\cos\delta_0, \qquad f_n = \frac{1}{2\pi}\sqrt{\frac{\omega_0 K_s}{2H}}$$ The swing slows down and the margin to $\delta_u$ shrinks: a weak grid is less stable.`,
      },
    },
    damping: {
      hint: { fr: r`Montez $D$ à 10.`, en: r`Raise $D$ to 10.` },
      answer: {
        fr: r`L’amortissement ajoute un couple proportionnel à la vitesse. Les pôles deviennent : $$s = -\frac{D}{4H} \pm j\sqrt{\frac{\omega_0 K_s}{2H} - \left(\frac{D}{4H}\right)^2}$$ Ils partent vers la gauche. Physiquement, ce couple vient des enroulements amortisseurs, de la charge, et surtout du PSS qui module l’excitation en phase avec la vitesse (leçon 8.2).`,
        en: r`Damping adds a torque proportional to speed. The poles become: $$s = -\frac{D}{4H} \pm j\sqrt{\frac{\omega_0 K_s}{2H} - \left(\frac{D}{4H}\right)^2}$$ They move left. Physically, this torque comes from damper windings, the load, and above all the PSS, which modulates excitation in phase with speed (lesson 8.2).`,
      },
    },
  },

  pll: {
    predict: {
      hint: { fr: r`La PLL ne voit qu’un saut d’angle. Pour le rattraper, elle doit tourner plus vite un moment, puis revenir à 50 Hz.`, en: r`The PLL only sees an angle jump. To catch up, it must spin faster for a while, then return to 50 Hz.` },
      answer: {
        fr: r`La fréquence estimée fait un **pic** immédiat, puis revient à zéro en quelques dizaines de millisecondes, avec un léger dépassement : la PLL a rattrapé l’angle. Le pic vaut à peu près $$\Delta\hat f_{max} \approx \frac{K_p\,\Delta\varphi}{2\pi} = \frac{2\zeta\omega_n\,\Delta\varphi}{2\pi} \approx 15\ \text{Hz}$$ Pourtant la vraie fréquence n’a jamais changé : une PLL rapide « voit » de fausses fréquences pendant les défauts.`,
        en: r`The estimated frequency **spikes** at once, then returns to zero within a few tens of milliseconds, with a slight overshoot: the PLL has caught up with the angle. The spike is about $$\Delta\hat f_{max} \approx \frac{K_p\,\Delta\varphi}{2\pi} = \frac{2\zeta\omega_n\,\Delta\varphi}{2\pi} \approx 15\ \text{Hz}$$ Yet the true frequency never changed: a fast PLL “sees” false frequencies during faults.`,
      },
    },
    fast: {
      hint: { fr: r`Montez la bande passante $f_n$ à 50 Hz.`, en: r`Raise the bandwidth $f_n$ to 50 Hz.` },
      answer: {
        fr: r`Les gains PI sont choisis pour placer les pôles : $$K_p = 2\zeta\omega_n, \qquad K_i = \omega_n^2$$ Une bande passante plus grande rattrape plus vite, mais $K_p$ plus grand amplifie le saut de phase en pic de fréquence, et le bruit. Sur un réseau faible, une PLL trop rapide peut même déstabiliser l’onduleur (leçon 8.5).`,
        en: r`The PI gains are chosen to place the poles: $$K_p = 2\zeta\omega_n, \qquad K_i = \omega_n^2$$ A wider bandwidth catches up faster, but a larger $K_p$ turns the phase jump into a bigger frequency spike, and amplifies noise. On a weak grid, a PLL that is too fast can even destabilise the inverter (lesson 8.5).`,
      },
    },
    freq: {
      hint: { fr: r`$f_n$ vers 20 Hz, régulateur PI, échelon de fréquence $\Delta f = 1$ Hz.`, en: r`$f_n$ around 20 Hz, PI controller, frequency step $\Delta f = 1$ Hz.` },
      answer: {
        fr: r`Un échelon de fréquence est une rampe de phase. Le PI contient un intégrateur, et la boucle en contient un second (l’angle intègre la fréquence) : elle est de **type 2**, donc suit une rampe sans erreur. $$e_\infty = \lim_{s\to0} s \cdot \frac{s^2}{s^2 + K_p s + K_i}\cdot\frac{\Delta\omega}{s^2} = 0$$ La sortie de l’intégrateur vaut alors exactement $\Delta\omega$ : la PLL a « appris » la nouvelle fréquence.`,
        en: r`A frequency step is a phase ramp. The PI has an integrator, and the loop has a second one (angle integrates frequency): it is **type 2**, so it tracks a ramp with no error. $$e_\infty = \lim_{s\to0} s \cdot \frac{s^2}{s^2 + K_p s + K_i}\cdot\frac{\Delta\omega}{s^2} = 0$$ The integrator output then equals $\Delta\omega$: the PLL has “learnt” the new frequency.`,
      },
    },
    ponly: {
      hint: { fr: r`Passez le type de régulateur sur « P seul », en gardant l’échelon de fréquence.`, en: r`Switch the controller type to “P only”, keeping the frequency step.` },
      answer: {
        fr: r`Sans intégrateur, il faut une erreur permanente pour produire la sortie $\Delta\omega$ : $$K_p\,e_\infty = \Delta\omega \;\Rightarrow\; e_\infty = \frac{\Delta\omega}{K_p}$$ La PLL suit la fréquence, mais avec un angle décalé : l’onduleur injecterait son courant avec un mauvais déphasage, donc un réactif parasite.`,
        en: r`Without an integrator, a permanent error is needed to produce the output $\Delta\omega$: $$K_p\,e_\infty = \Delta\omega \;\Rightarrow\; e_\infty = \frac{\Delta\omega}{K_p}$$ The PLL tracks the frequency, but with an offset angle: the inverter would inject its current at the wrong phase, hence spurious reactive power.`,
      },
    },
    windup: {
      hint: { fr: r`PI, saut de phase 60° ou plus, limite de fréquence 3 Hz ou moins, anti-emballement désactivé.`, en: r`PI, phase jump of 60° or more, frequency limit 3 Hz or less, anti-windup off.` },
      answer: {
        fr: r`Pendant que la sortie est en butée, l’erreur reste grande et l’intégrateur continue de s’accumuler sans effet. Quand l’erreur s’annule enfin, l’intégrateur est « gonflé » et pousse la sortie trop loin : grand dépassement et retour lent. $$\dot x_i = K_i\,e \quad \text{même quand } u = u_{max}$$ Ce défaut classique touche tous les régulateurs à saturation : vannes, onduleurs limités en courant, PLL limitées en fréquence.`,
        en: r`While the output is saturated, the error stays large and the integrator keeps accumulating to no effect. When the error finally vanishes, the integrator is “wound up” and pushes the output too far: large overshoot and slow return. $$\dot x_i = K_i\,e \quad \text{even when } u = u_{max}$$ This classic flaw affects every controller with limits: valves, current-limited inverters, frequency-limited PLLs.`,
      },
    },
    antiwindup: {
      hint: { fr: r`Gardez les mêmes réglages et réactivez simplement l’anti-emballement.`, en: r`Keep the same settings and simply turn anti-windup back on.` },
      answer: {
        fr: r`L’anti-emballement gèle l’intégrateur (ou le ramène) tant que la sortie est saturée : $$\dot x_i = \begin{cases} K_i\,e & \text{si } |u| < u_{max} \\ 0 & \text{sinon} \end{cases}$$ La PLL se recale sans dépassement excessif. Tout régulateur PI industriel en est équipé ; c’est essentiel pour les onduleurs pendant les creux de tension (leçon 7.7).`,
        en: r`Anti-windup freezes (or bleeds) the integrator while the output is saturated: $$\dot x_i = \begin{cases} K_i\,e & \text{if } |u| < u_{max} \\ 0 & \text{otherwise} \end{cases}$$ The PLL resynchronises without excessive overshoot. Every industrial PI controller has it; it is essential for inverters during voltage dips (lesson 7.7).`,
      },
    },
  },
};
