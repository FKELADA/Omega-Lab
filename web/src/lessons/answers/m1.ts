// Module 1 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers1: Answers = {
  energy: {
    predict: {
      hint: { fr: r`La tension d’une bobine dépend de la **pente** du courant, pas de sa valeur. Quelle est la pente d’un triangle ?`, en: r`An inductor’s voltage depends on the **slope** of the current, not its value. What is the slope of a triangle?` },
      answer: {
        fr: r`La tension est la dérivée du courant : $$v = L\,\frac{di}{dt}$$ Un courant triangulaire a une pente constante qui change de signe : la tension est donc un **créneau** (carré), positif quand le courant monte, négatif quand il descend. Elle saute à chaque sommet du triangle, alors que le courant, lui, reste continu.`,
        en: r`Voltage is the derivative of current: $$v = L\,\frac{di}{dt}$$ A triangular current has a constant slope that changes sign, so the voltage is a **square wave**: positive while the current rises, negative while it falls. It jumps at each corner of the triangle, while the current itself stays continuous.`,
      },
    },
    store: {
      hint: { fr: r`Choisissez la bobine, la source « sinus », puis appuyez sur ▶ et laissez la lecture aller au bout.`, en: r`Choose the inductor, the “sine” source, then press ▶ and let it play to the end.` },
      answer: {
        fr: r`La bobine stocke l’énergie dans son champ magnétique : $$W_L = \tfrac12 L i^2, \qquad p = v\,i = \frac{dW_L}{dt}$$ $W_L$ est maximale aux crêtes du courant, nulle à ses passages par zéro, donc deux cycles par période. La puissance moyenne est **nulle** : la bobine emprunte et rend. C’est l’image de la **puissance réactive**.`,
        en: r`The inductor stores energy in its magnetic field: $$W_L = \tfrac12 L i^2, \qquad p = v\,i = \frac{dW_L}{dt}$$ $W_L$ peaks with the current and vanishes at its zero crossings, so two cycles per period. Average power is **zero**: the inductor borrows and gives back. That is the picture behind **reactive power**.`,
      },
    },
    capacitor: {
      hint: { fr: r`Élément : condensateur ; source : triangle.`, en: r`Element: capacitor; source: triangle.` },
      answer: {
        fr: r`Le condensateur est le **dual** de la bobine : $$i = C\,\frac{dv}{dt}, \qquad W_C = \tfrac12 C v^2$$ Une tension triangulaire donne un courant carré. Il stocke l’énergie dans son champ électrique et la rend intégralement. C’est la tension d’un condensateur qui ne peut pas sauter, comme le courant d’une bobine.`,
        en: r`The capacitor is the **dual** of the inductor: $$i = C\,\frac{dv}{dt}, \qquad W_C = \tfrac12 C v^2$$ A triangular voltage gives a square current. It stores energy in its electric field and returns all of it. A capacitor’s voltage cannot jump, just as an inductor’s current cannot.`,
      },
    },
    resistor: {
      hint: { fr: r`Choisissez la résistance, avec n’importe quelle source.`, en: r`Choose the resistor, with any source.` },
      answer: {
        fr: r`Pour une résistance, tension et courant ont toujours le même signe : $$p = R\,i^2 \ge 0$$ L’énergie ne revient jamais : elle part en chaleur. C’est le seul des trois éléments qui consomme de la **puissance active** ; $L$ et $C$ ne font que l’échanger.`,
        en: r`For a resistor, voltage and current always share the same sign: $$p = R\,i^2 \ge 0$$ Energy never comes back: it leaves as heat. It is the only one of the three elements that consumes **active power**; $L$ and $C$ only exchange it.`,
      },
    },
    edge: {
      hint: { fr: r`Bobine, source trapèze, puis réduisez le curseur « durée des fronts » vers 0,2 ms.`, en: r`Inductor, trapezoid source, then reduce the “edge time” slider to about 0.2 ms.` },
      answer: {
        fr: r`La tension est proportionnelle à la vitesse de variation du courant : $$v = L\,\frac{\Delta i}{\Delta t}$$ Diviser la durée du front par 10 multiplie la tension par 10. Couper brutalement le courant d’une bobine produit une **surtension** énorme : c’est l’étincelle à l’ouverture d’un interrupteur, la raison des diodes de roue libre et des parafoudres, et le principe de l’allumage des moteurs à essence.`,
        en: r`Voltage is proportional to how fast the current changes: $$v = L\,\frac{\Delta i}{\Delta t}$$ Dividing the edge time by 10 multiplies the voltage by 10. Cutting an inductor’s current abruptly makes a huge **overvoltage**: the spark when a switch opens, the reason for freewheeling diodes and surge arresters, and how petrol-engine ignition works.`,
      },
    },
  },

  'rlc-step': {
    predict: {
      hint: { fr: r`À l’instant de la fermeture, la bobine empêche le courant de sauter. À la fin, le condensateur chargé bloque le continu. Entre les deux, $L$ et $C$ s’échangent de l’énergie…`, en: r`When the switch closes, the inductor stops the current from jumping. At the end, the charged capacitor blocks DC. In between, $L$ and $C$ exchange energy…` },
      answer: {
        fr: r`Le courant part de **zéro** (la bobine l’impose), monte, puis **oscille** en s’amortissant autour de zéro, car le condensateur finit par bloquer le continu. Avec $R = 2\ \Omega$, $\zeta = 0{,}1$ : l’oscillation est peu amortie, à $f_0 \approx 159$ Hz. $$i(t) = \frac{V}{L\omega_d}\,e^{-\alpha t}\sin\omega_d t, \quad \alpha = \frac{R}{2L}, \quad \omega_0 = \frac{1}{\sqrt{LC}}$$`,
        en: r`The current starts at **zero** (the inductor forces it), rises, then **oscillates** while decaying around zero, since the capacitor ends up blocking DC. With $R = 2\ \Omega$, $\zeta = 0.1$: a lightly damped oscillation at $f_0 \approx 159$ Hz. $$i(t) = \frac{V}{L\omega_d}\,e^{-\alpha t}\sin\omega_d t, \quad \alpha = \frac{R}{2L}, \quad \omega_0 = \frac{1}{\sqrt{LC}}$$`,
      },
    },
    kvl: {
      hint: { fr: r`Faites glisser le curseur de temps de 0 jusqu’à la fin, en regardant les barres sous l’équation des mailles.`, en: r`Drag the time cursor from 0 to the end, watching the bars under the loop equation.` },
      answer: {
        fr: r`La loi des mailles vaut à chaque instant : $$V = R\,i + L\frac{di}{dt} + v_C$$ À $t = 0^+$ : $i = 0$ et $v_C = 0$, donc $L\,di/dt = V$. En régime final : $i = 0$, $di/dt = 0$, donc $v_C = V$. Entre les deux, la tension passe de la bobine au condensateur, en oscillant.`,
        en: r`The loop law holds at every instant: $$V = R\,i + L\frac{di}{dt} + v_C$$ At $t = 0^+$: $i = 0$ and $v_C = 0$, so $L\,di/dt = V$. At the end: $i = 0$, $di/dt = 0$, so $v_C = V$. In between, the voltage moves from the inductor to the capacitor, oscillating.`,
      },
    },
    critical: {
      answer: {
        fr: r`L’amortissement critique est atteint quand les deux pôles se confondent : $$\zeta = \frac{R}{2}\sqrt{\frac{C}{L}} = 1 \;\Leftrightarrow\; R_c = 2\sqrt{\frac{L}{C}} = 20\ \Omega$$ En dessous, pôles complexes et oscillation ; au-dessus, deux pôles réels et une réponse plus lente. Le critique est la réponse **la plus rapide sans dépassement**, recherchée dans de nombreuses régulations.`,
        en: r`Critical damping is reached when the two poles merge: $$\zeta = \frac{R}{2}\sqrt{\frac{C}{L}} = 1 \;\Leftrightarrow\; R_c = 2\sqrt{\frac{L}{C}} = 20\ \Omega$$ Below, complex poles and oscillation; above, two real poles and a slower response. Critical damping is the **fastest response without overshoot**, a common target in control.`,
      },
      hint: { fr: r`Le facteur d’amortissement vaut $\zeta = \frac R2\sqrt{C/L}$ : avec les valeurs par défaut, il faut $R = 20\ \Omega$.`, en: r`The damping ratio is $\zeta = \frac R2\sqrt{C/L}$: with the default values you need $R = 20\ \Omega$.` },
    },
    energy: {
      hint: { fr: r`Descendez $R$ vers son minimum (0,1 Ω) puis appuyez sur ▶ et regardez le bilan d’énergie.`, en: r`Bring $R$ down to its minimum (0.1 Ω), press ▶ and watch the energy balance.` },
      answer: {
        fr: r`La source fournit $W = V\,Q = CV^2$ ; à la fin, le condensateur garde $\tfrac12 CV^2$. Le reste, **exactement $\tfrac12 CV^2$**, est dissipé dans $R$, quelle que soit sa valeur : $$W_R = \int_0^\infty R\,i^2\,dt = \tfrac12 CV^2$$ Plus $R$ est petite, plus l’énergie oscille longtemps entre $L$ et $C$ avant d’être dissipée, mais le total est le même.`,
        en: r`The source supplies $W = V\,Q = CV^2$; at the end the capacitor keeps $\tfrac12 CV^2$. The rest, **exactly $\tfrac12 CV^2$**, is dissipated in $R$, whatever its value: $$W_R = \int_0^\infty R\,i^2\,dt = \tfrac12 CV^2$$ The smaller $R$, the longer energy sloshes between $L$ and $C$ before being dissipated, but the total is the same.`,
      },
    },
    compare: {
      hint: { fr: r`Cliquez d’abord sur « Figer et comparer », puis réglez $L$ à quatre fois sa valeur (par exemple de 10 à 40 mH).`, en: r`First click “Freeze and compare”, then set $L$ to four times its value (e.g. from 10 to 40 mH).` },
      answer: {
        fr: r`La pulsation propre varie comme l’inverse de la racine de $L$ : $$\omega_0 = \frac{1}{\sqrt{LC}} \;\Rightarrow\; L \times 4 \;\Rightarrow\; \omega_0 \div 2$$ L’amortissement $\alpha = R/2L$ est aussi divisé par 4 : l’oscillation est plus lente **et** dure plus longtemps. Sur le plan $s$, les pôles se rapprochent de l’origine.`,
        en: r`The natural frequency goes as one over the square root of $L$: $$\omega_0 = \frac{1}{\sqrt{LC}} \;\Rightarrow\; L \times 4 \;\Rightarrow\; \omega_0 \div 2$$ The decay rate $\alpha = R/2L$ is also divided by 4: the oscillation is slower **and** lasts longer. On the s-plane, the poles move towards the origin.`,
      },
    },
    locus: {
      hint: { fr: r`Le bouton « Balayer » est à côté du curseur $R$, dans la barre du bas.`, en: r`The “Sweep” button sits next to the $R$ slider, in the bottom bar.` },
      answer: {
        fr: r`Les pôles sont les valeurs propres de la matrice d’état : $$\dot x = A x, \quad A = \begin{pmatrix} -R/L & -1/L \\ 1/C & 0 \end{pmatrix}, \quad s^2 + \frac RL s + \frac{1}{LC} = 0$$ Quand $R$ croît, ils parcourent un cercle de rayon $\omega_0$, se rejoignent sur l’axe réel ($\zeta = 1$) puis se séparent. L’analyse modale d’un réseau (module 8) fait la même chose avec des centaines d’états.`,
        en: r`The poles are the eigenvalues of the state matrix: $$\dot x = A x, \quad A = \begin{pmatrix} -R/L & -1/L \\ 1/C & 0 \end{pmatrix}, \quad s^2 + \frac RL s + \frac{1}{LC} = 0$$ As $R$ grows, they travel a circle of radius $\omega_0$, meet on the real axis ($\zeta = 1$) and split. A grid’s modal analysis (module 8) does the same with hundreds of states.`,
      },
    },
  },

  'ac-rms': {
    predict: {
      hint: { fr: r`$p = v^2/R$ : que devient un sinus mis au carré ? Peut-il être négatif ?`, en: r`$p = v^2/R$: what does a squared sine look like? Can it be negative?` },
      answer: {
        fr: r`La puissance est toujours **positive** et oscille à **deux fois** la fréquence du réseau (100 Hz), entre 0 et le pic $\hat V^2/R \approx 2$ kW : $$p(t) = \frac{\hat V^2}{R}\sin^2\omega t = \frac{\hat V^2}{2R}\,(1 - \cos 2\omega t)$$ Sa moyenne est la moitié du pic : 1 kW.`,
        en: r`Power is always **positive** and oscillates at **twice** the grid frequency (100 Hz), between 0 and the peak $\hat V^2/R \approx 2$ kW: $$p(t) = \frac{\hat V^2}{R}\sin^2\omega t = \frac{\hat V^2}{2R}\,(1 - \cos 2\omega t)$$ Its average is half the peak: 1 kW.`,
      },
    },
    'why-root2': {
      hint: { fr: r`Appuyez sur ▶ et laissez la lecture aller au bout ; regardez la jauge de puissance moyenne.`, en: r`Press ▶ and let it play to the end; watch the average-power gauge.` },
      answer: {
        fr: r`La valeur efficace est la tension continue qui chauffe autant : $$V_{\text{eff}} = \sqrt{\frac1T\int_0^T v^2\,dt} = \frac{\hat V}{\sqrt2}, \qquad \bar P = \frac{V_{\text{eff}}^2}{R}$$ $325/\sqrt2 = 230$ V. Toutes les tensions et courants alternatifs sont donnés en valeur efficace.`,
        en: r`The RMS value is the DC voltage that heats just as much: $$V_{\text{rms}} = \sqrt{\frac1T\int_0^T v^2\,dt} = \frac{\hat V}{\sqrt2}, \qquad \bar P = \frac{V_{\text{rms}}^2}{R}$$ $325/\sqrt2 = 230$ V. All AC voltages and currents are quoted as RMS values.`,
      },
    },
    'dc-equivalent': {
      answer: {
        fr: r`Il faut $V = \sqrt{\bar P R} = \sqrt{1000 \times 52{,}9} = 230$ V en continu, exactement la valeur efficace du sinus de crête 325 V. C’est la définition même de la valeur efficace : **l’équivalent thermique** en continu.`,
        en: r`You need $V = \sqrt{\bar P R} = \sqrt{1000 \times 52.9} = 230$ V DC, exactly the RMS value of the 325 V-peak sine. That is the very definition of RMS: the **heating-equivalent** DC value.`,
      },
      hint: { fr: r`Choisissez « Continu » puis cherchez la tension qui donne 1 kW : $V = \sqrt{\bar P R}$.`, en: r`Choose “DC” then find the voltage giving 1 kW: $V = \sqrt{\bar P R}$.` },
    },
    meters: {
      hint: { fr: r`Changez la forme d’onde en carré ou triangle et comparez les deux afficheurs.`, en: r`Switch the waveform to square or triangle and compare the two displays.` },
      answer: {
        fr: r`Un multimètre « moyenne » calcule $1{,}111 \times \overline{|v|}$, car pour un sinus $V_{\text{eff}}/\overline{|v|} = \pi/(2\sqrt2) = 1{,}111$ (facteur de forme). Pour un carré, $V_{\text{eff}} = \overline{|v|} = \hat V$ : il lit **11 % trop haut**. Pour un triangle, $V_{\text{eff}} = \hat V/\sqrt3$ et $\overline{|v|} = \hat V/2$ : il lit **4 % trop bas**. Seul un appareil « TRMS » mesure la vraie valeur efficace, indispensable avec des harmoniques.`,
        en: r`An “average” meter computes $1.111 \times \overline{|v|}$, because for a sine $V_{\text{rms}}/\overline{|v|} = \pi/(2\sqrt2) = 1.111$ (form factor). For a square, $V_{\text{rms}} = \overline{|v|} = \hat V$: it reads **11 % high**. For a triangle, $V_{\text{rms}} = \hat V/\sqrt3$ and $\overline{|v|} = \hat V/2$: it reads **4 % low**. Only a “true RMS” meter gets it right, which matters with harmonics.`,
      },
    },
  },

  resonance: {
    settle: {
      hint: { fr: r`Faites glisser le curseur de temps jusqu’à la fin : le trait plein finit par recouvrir les pointillés.`, en: r`Drag the time cursor to the end: the solid line ends up on top of the dashed one.` },
      answer: {
        fr: r`La réponse complète est la somme d’un **transitoire** (les modes propres du circuit, qui s’amortissent en $e^{-\alpha t}$) et du **régime établi** à la fréquence de la source : $$i(t) = i_{\text{tr}}(t) + \operatorname{Re}\{\sqrt2\,\underline I e^{j\omega t}\}, \qquad \underline I = \frac{\underline V}{R + j(L\omega - 1/C\omega)}$$ Les phaseurs ne décrivent que le second : ils sont valables une fois le transitoire éteint.`,
        en: r`The full response is a **transient** (the circuit’s natural modes, decaying as $e^{-\alpha t}$) plus the **steady state** at the source frequency: $$i(t) = i_{\text{tr}}(t) + \operatorname{Re}\{\sqrt2\,\underline I e^{j\omega t}\}, \qquad \underline I = \frac{\underline V}{R + j(L\omega - 1/C\omega)}$$ Phasors describe only the second part: they hold once the transient has died out.`,
      },
    },
    'find-f0': {
      answer: {
        fr: r`À la résonance, les réactances s’annulent : $$L\omega_0 = \frac{1}{C\omega_0} \;\Rightarrow\; f_0 = \frac{1}{2\pi\sqrt{LC}} \approx 159\ \text{Hz}$$ L’impédance se réduit à $R$ : le courant est maximal, $\hat V/R$, et en phase avec la tension. $\underline V_L$ et $\underline V_C$ sont égales et opposées.`,
        en: r`At resonance the reactances cancel: $$L\omega_0 = \frac{1}{C\omega_0} \;\Rightarrow\; f_0 = \frac{1}{2\pi\sqrt{LC}} \approx 159\ \text{Hz}$$ The impedance reduces to $R$: the current is maximum, $\hat V/R$, and in phase with the voltage. $\underline V_L$ and $\underline V_C$ are equal and opposite.`,
      },
      hint: { fr: r`Avec $L = 10$ mH et $C = 100\ \mu$F, $f_0 = 1/(2\pi\sqrt{LC}) \approx 159$ Hz. Vous pouvez cliquer directement sur le pic de la réponse en fréquence.`, en: r`With $L = 10$ mH and $C = 100\ \mu$F, $f_0 = 1/(2\pi\sqrt{LC}) \approx 159$ Hz. You can click straight on the peak of the frequency response.` },
    },
    overvoltage: {
      hint: { fr: r`$V_C/V = Q = \frac1R\sqrt{L/C}$ : avec les valeurs par défaut, il faut $R < 2\ \Omega$.`, en: r`$V_C/V = Q = \frac1R\sqrt{L/C}$: with the default values you need $R < 2\ \Omega$.` },
      answer: {
        fr: r`À la résonance, $I = V/R$ et la tension du condensateur vaut $I/(C\omega_0)$ : $$\frac{V_C}{V} = Q = \frac{1}{R}\sqrt{\frac LC}$$ Une faible résistance donne une **surtension** de résonance. Sur un réseau, une batterie de condensateurs qui résonne avec l’inductance du réseau sur un harmonique peut ainsi amplifier les tensions et se détruire.`,
        en: r`At resonance $I = V/R$ and the capacitor voltage is $I/(C\omega_0)$: $$\frac{V_C}{V} = Q = \frac{1}{R}\sqrt{\frac LC}$$ A small resistance gives a resonant **overvoltage**. On a grid, a capacitor bank resonating with the network inductance at a harmonic can amplify voltages this way and destroy itself.`,
      },
    },
    bandwidth: {
      hint: { fr: r`Cliquez sur « Balayer » à côté de $R$.`, en: r`Click “Sweep” next to $R$.` },
      answer: {
        fr: r`La bande passante à mi-puissance (−3 dB) est inversement proportionnelle au facteur de qualité : $$\Delta f = \frac{f_0}{Q} = \frac{R}{2\pi L}$$ Moins de résistance, résonance plus étroite et plus haute : le circuit devient **sélectif**. C’est ainsi qu’un récepteur radio choisit une station, et qu’un filtre d’harmoniques vise un rang précis.`,
        en: r`The half-power (−3 dB) bandwidth is inversely proportional to the quality factor: $$\Delta f = \frac{f_0}{Q} = \frac{R}{2\pi L}$$ Less resistance, a narrower and taller resonance: the circuit becomes **selective**. That is how a radio picks a station, and how a harmonic filter targets one order.`,
      },
    },
    inductive: {
      hint: { fr: r`Réglez $f$ au-dessus de $1{,}5\,f_0$, soit environ 240 Hz avec les valeurs par défaut.`, en: r`Set $f$ above $1.5\,f_0$, about 240 Hz with the default values.` },
      answer: {
        fr: r`Au-dessus de $f_0$, $L\omega > 1/C\omega$ : la réactance est positive, le circuit est **inductif** et le courant est en retard : $$\varphi = \arctan\frac{L\omega - 1/C\omega}{R} > 0$$ Lignes, transformateurs, moteurs : le réseau est essentiellement inductif. C’est pourquoi il consomme de la puissance réactive et qu’on le compense avec des condensateurs (leçon 2.3).`,
        en: r`Above $f_0$, $L\omega > 1/C\omega$: the reactance is positive, the circuit is **inductive** and the current lags: $$\varphi = \arctan\frac{L\omega - 1/C\omega}{R} > 0$$ Lines, transformers, motors: the grid is mostly inductive. That is why it absorbs reactive power and is compensated with capacitors (lesson 2.3).`,
      },
    },
  },

  'dc-ac': {
    peak: {
      hint: { fr: r`Faites glisser le curseur de temps jusqu’à la fin et comparez les deux courbes à leurs crêtes.`, en: r`Drag the time cursor to the end and compare the two curves at their peaks.` },
      answer: {
        fr: r`L’isolation est dimensionnée par la tension **crête**. À crête égale, l’alternatif ne transporte que sa valeur efficace : $$V_{\text{eff}} = \frac{\hat V}{\sqrt2} \approx 0{,}71\,\hat V$$ À isolation égale, une ligne en continu transporte donc environ 40 % de puissance de plus par conducteur.`,
        en: r`Insulation is sized for the **peak** voltage. At equal peak, AC only carries its RMS value: $$V_{\text{rms}} = \frac{\hat V}{\sqrt2} \approx 0.71\,\hat V$$ For the same insulation, a DC line therefore carries about 40 % more power per conductor.`,
      },
    },
    short: {
      hint: { fr: r`Réduisez la distance sous 50 km et regardez le graphique des coûts.`, en: r`Bring the distance below 50 km and look at the cost chart.` },
      answer: {
        fr: r`Le coût d’une liaison est un fixe (postes) plus un coût par kilomètre : $$C = C_{\text{postes}} + c_{\text{km}}\,d$$ En continu, les stations de conversion coûtent cher, en alternatif les transformateurs sont bon marché. Sur courte distance, le fixe domine : l’alternatif gagne. C’est la victoire de Tesla et Westinghouse sur Edison à la fin du XIXᵉ siècle.`,
        en: r`A link’s cost is a fixed part (stations) plus a cost per kilometre: $$C = C_{\text{stations}} + c_{\text{km}}\,d$$ In DC the converter stations are expensive; in AC transformers are cheap. Over short distances the fixed part dominates: AC wins. That was Tesla and Westinghouse’s victory over Edison in the late 19th century.`,
      },
    },
    long: {
      hint: { fr: r`Restez en ligne aérienne et augmentez la distance jusqu’à ce que la courbe du continu passe sous celle de l’alternatif.`, en: r`Stay with an overhead line and increase the distance until the DC curve drops below the AC one.` },
      answer: {
        fr: r`Le continu coûte moins par kilomètre (deux conducteurs au lieu de trois, pas de compensation réactive, pas de pertes liées au réactif). Au-delà du seuil de rentabilité, l’économie par kilomètre amortit les stations : $$d^* = \frac{C_{\text{postes,DC}} - C_{\text{postes,AC}}}{c_{\text{km,AC}} - c_{\text{km,DC}}}$$ Pour les lignes aériennes, il est de l’ordre de 600 à 800 km.`,
        en: r`DC costs less per kilometre (two conductors instead of three, no reactive compensation, no losses from reactive current). Beyond the break-even distance, the savings per kilometre pay for the stations: $$d^* = \frac{C_{\text{stations,DC}} - C_{\text{stations,AC}}}{c_{\text{km,AC}} - c_{\text{km,DC}}}$$ For overhead lines it is around 600 to 800 km.`,
      },
    },
    cable: {
      hint: { fr: r`Choisissez « câble », puis augmentez la distance au-delà d’environ 100 km.`, en: r`Choose “cable”, then increase the distance beyond about 100 km.` },
      answer: {
        fr: r`Un câble est un long condensateur : en alternatif, il appelle un courant de charge proportionnel à sa longueur, $$I_c = \omega\,C' \ell\,\frac{U}{\sqrt3}$$ Quand $I_c$ atteint le courant admissible, il ne reste plus de place pour le courant utile. En continu, ce courant de charge n’existe pas (une fois chargé) : d’où le continu pour les liaisons sous-marines et les parcs éoliens en mer lointains.`,
        en: r`A cable is a long capacitor: in AC it draws a charging current proportional to its length, $$I_c = \omega\,C' \ell\,\frac{U}{\sqrt3}$$ When $I_c$ reaches the current rating, there is no room left for useful current. In DC that charging current does not exist (once charged): hence DC for submarine links and distant offshore wind farms.`,
      },
    },
  },
};
