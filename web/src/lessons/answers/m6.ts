// Module 6 — hints and explanations (see index.ts).
import type { Answers } from '.';

const r = String.raw;

export const answers6: Answers = {
  chopper: {
    predict: {
      hint: { fr: r`Interrupteur fermé : l’inductance voit $48 - 24 = 24$ V et le courant monte. Ouvert : elle voit $-24$ V et le courant descend. À quelle allure ?`, en: r`Switch on: the inductor sees $48 - 24 = 24$ V and current rises. Off: it sees $-24$ V and current falls. How fast?` },
      answer: {
        fr: r`Le courant est un **triangle** autour de sa moyenne $I = V_s/R = 2{,}4$ A : il monte en ligne droite pendant $DT$, descend pendant $(1-D)T$. $$\Delta I_L = \frac{(V_e - V_s)\,D}{L\,f_s} = \frac{24 \times 0{,}5}{200\ \mu\text{H} \times 20\ \text{kHz}} = 3\ \text{A}$$ Il oscille donc entre 0,9 et 3,9 A environ, sans s’annuler.`,
        en: r`The current is a **triangle** around its average $I = V_o/R = 2.4$ A: it ramps up during $DT$ and down during $(1-D)T$. $$\Delta I_L = \frac{(V_i - V_o)\,D}{L\,f_s} = \frac{24 \times 0.5}{200\ \mu\text{H} \times 20\ \text{kHz}} = 3\ \text{A}$$ So it swings between about 0.9 and 3.9 A, never reaching zero.`,
      },
    },
    ratio: {
      hint: { fr: r`$V_s = D\,V_e$ : pour 12 V depuis 48 V, il faut $D = 0{,}25$.`, en: r`$V_o = D\,V_i$: for 12 V from 48 V you need $D = 0.25$.` },
      answer: {
        fr: r`En régime établi, la tension moyenne aux bornes de l’inductance est nulle (bilan volt-seconde) : $$(V_e - V_s)\,D = V_s\,(1 - D) \;\Rightarrow\; V_s = D\,V_e$$ L’abaisseur est un « transformateur continu » réglable, de rendement élevé (95–98 %), car ses interrupteurs sont soit ouverts, soit fermés : ils dissipent très peu.`,
        en: r`In steady state, the average inductor voltage is zero (volt-second balance): $$(V_i - V_o)\,D = V_o\,(1 - D) \;\Rightarrow\; V_o = D\,V_i$$ The buck is an adjustable “DC transformer” with high efficiency (95–98 %), because its switches are either fully on or fully off: they dissipate very little.`,
      },
    },
    boost: {
      hint: { fr: r`Type « élévateur », $D \approx 0{,}5$ donne 96 V.`, en: r`“Boost” type, $D \approx 0.5$ gives 96 V.` },
      answer: {
        fr: r`Bilan volt-seconde sur l’inductance : $$V_e\,D = (V_s - V_e)(1 - D) \;\Rightarrow\; V_s = \frac{V_e}{1 - D}$$ Avec $D = 0{,}5$ la tension double. C’est le montage des onduleurs photovoltaïques, qui élèvent la tension des panneaux avant de la convertir en alternatif.`,
        en: r`Volt-second balance on the inductor: $$V_i\,D = (V_o - V_i)(1 - D) \;\Rightarrow\; V_o = \frac{V_i}{1 - D}$$ With $D = 0.5$ the voltage doubles. This is the stage in PV inverters that raises the panel voltage before converting it to AC.`,
      },
    },
    dcm: {
      hint: { fr: r`Baissez $L$ vers 20 µH ou montez $R$ vers 100 Ω.`, en: r`Lower $L$ to about 20 µH or raise $R$ to about 100 Ω.` },
      answer: {
        fr: r`La conduction devient discontinue quand l’ondulation dépasse le double du courant moyen. Pour l’abaisseur : $$L < L_{crit} = \frac{(1 - D)\,R}{2 f_s}$$ Le courant reste nul une partie de la période, le bilan volt-seconde change et $V_s$ dépend de la charge : la régulation doit en tenir compte.`,
        en: r`Conduction becomes discontinuous when the ripple exceeds twice the average current. For the buck: $$L < L_{crit} = \frac{(1 - D)\,R}{2 f_s}$$ The current stays at zero for part of the period, the volt-second balance changes and $V_o$ depends on the load: the control must account for it.`,
      },
    },
    ripple: {
      hint: { fr: r`Remettez $L$ et $R$ près de leurs valeurs par défaut, puis montez $f_s$ (vers 100 kHz) ou $L$ (vers 1 mH).`, en: r`Bring $L$ and $R$ back near their defaults, then raise $f_s$ (towards 100 kHz) or $L$ (towards 1 mH).` },
      answer: {
        fr: r`L’ondulation est inversement proportionnelle à $L\,f_s$ : $$\Delta I_L = \frac{V_s(1 - D)}{L\,f_s}$$ Monter $f_s$ permet une inductance plus petite et plus légère, mais augmente les pertes de commutation. Les semi-conducteurs en carbure de silicium et nitrure de gallium repoussent ce compromis vers les centaines de kHz.`,
        en: r`The ripple is inversely proportional to $L\,f_s$: $$\Delta I_L = \frac{V_o(1 - D)}{L\,f_s}$$ Raising $f_s$ allows a smaller, lighter inductor but increases switching losses. Silicon-carbide and gallium-nitride devices push that trade-off into the hundreds of kHz.`,
      },
    },
    buckboost: {
      hint: { fr: r`Type « inverseur », $D$ au-dessus de 0,5 (par exemple 0,7).`, en: r`“Buck-boost” type, $D$ above 0.5 (e.g. 0.7).` },
      answer: {
        fr: r`L’inductance se charge sur l’entrée puis se décharge seule dans la sortie, de polarité inversée : $$V_s = -\frac{D}{1 - D}\,V_e$$ $|V_s| > V_e$ pour $D > 0{,}5$, $|V_s| < V_e$ sinon. Toute l’énergie transite par l’inductance, d’où des courants crêtes plus élevés que dans l’abaisseur ou l’élévateur.`,
        en: r`The inductor charges from the input then discharges alone into the output, with reversed polarity: $$V_o = -\frac{D}{1 - D}\,V_i$$ $|V_o| > V_i$ for $D > 0.5$, $|V_o| < V_i$ otherwise. All the energy passes through the inductor, hence higher peak currents than in the buck or boost.`,
      },
    },
  },

  rectifier: {
    predict: {
      hint: { fr: r`Un pont triphasé connecte la sortie à la plus grande tension composée, six fois par période. Avec un retard de 30°, chaque segment commence plus tard sur la sinusoïde.`, en: r`A three-phase bridge connects the output to the largest line voltage, six times per period. With a 30° delay, each segment starts later on the sine.` },
      answer: {
        fr: r`La tension continue est faite de **six segments de sinusoïde par période**, plus bas qu’avec des diodes, avec de petites encoches dues à l’empiètement. Sa moyenne vaut : $$V_d = \frac{3\sqrt2}{\pi}V_{LL}\cos\alpha - \frac{3}{\pi}\omega L_s I_d \approx 540 \times \cos 30° - 24 \approx 444\ \text{V}$$`,
        en: r`The DC voltage is made of **six sine segments per period**, lower than with diodes, with small notches from commutation overlap. Its average is: $$V_d = \frac{3\sqrt2}{\pi}V_{LL}\cos\alpha - \frac{3}{\pi}\omega L_s I_d \approx 540 \times \cos 30° - 24 \approx 444\ \text{V}$$`,
      },
    },
    diode: {
      hint: { fr: r`α = 0 et $L_s$ = 0.`, en: r`α = 0 and $L_s$ = 0.` },
      answer: {
        fr: r`Sans retard ni inductance, chaque thyristor conduit dès qu’il est polarisé en direct, comme une diode : $$V_{d0} = \frac{3\sqrt2}{\pi}V_{LL} \approx 1{,}35 \times 400 = 540\ \text{V}$$ C’est la tension maximale du pont.`,
        en: r`With no delay and no inductance, each thyristor conducts as soon as it is forward-biased, like a diode: $$V_{d0} = \frac{3\sqrt2}{\pi}V_{LL} \approx 1.35 \times 400 = 540\ \text{V}$$ That is the bridge’s maximum voltage.`,
      },
    },
    delay: {
      hint: { fr: r`Montez α vers 60°.`, en: r`Raise α towards 60°.` },
      answer: {
        fr: r`La tension moyenne suit $\cos\alpha$, et le fondamental du courant de ligne est décalé de α par rapport à la tension : $$V_d = V_{d0}\cos\alpha, \qquad \cos\varphi_1 \approx \cos\alpha$$ Un redresseur à thyristors consomme donc du **réactif**, d’autant plus que α est grand : les stations CCHT classiques ont de grandes batteries de condensateurs et de filtres.`,
        en: r`The average voltage follows $\cos\alpha$, and the line current’s fundamental is shifted by α from the voltage: $$V_d = V_{d0}\cos\alpha, \qquad \cos\varphi_1 \approx \cos\alpha$$ A thyristor rectifier therefore absorbs **reactive power**, the more so as α grows: classic HVDC stations have large capacitor banks and filters.`,
      },
    },
    inverter: {
      hint: { fr: r`Montez α au-delà de 90°, vers 120°.`, en: r`Raise α beyond 90°, towards 120°.` },
      answer: {
        fr: r`Pour $\alpha > 90°$, $\cos\alpha < 0$ : $V_d < 0$ alors que $I_d$, imposé par les thyristors, garde son sens. $$P_d = V_d\,I_d < 0$$ La puissance va du continu vers l’alternatif. Une liaison CCHT à thyristors (LCC) fait de même : un poste redresseur à α ≈ 15°, un poste onduleur à α ≈ 140°.`,
        en: r`For $\alpha > 90°$, $\cos\alpha < 0$: $V_d < 0$ while $I_d$, set by the thyristors, keeps its direction. $$P_d = V_d\,I_d < 0$$ Power flows from DC to AC. A thyristor HVDC link (LCC) does the same: a rectifier station at α ≈ 15°, an inverter station at α ≈ 140°.`,
      },
    },
    overlap: {
      hint: { fr: r`α sous 90°, puis montez $L_s$ vers 1,5 mH ou $I_d$ vers 1000 A.`, en: r`α below 90°, then raise $L_s$ towards 1.5 mH or $I_d$ towards 1000 A.` },
      answer: {
        fr: r`L’inductance de la source empêche le courant de passer instantanément d’un thyristor au suivant : pendant l’angle d’empiètement μ, deux thyristors conduisent ensemble. $$\cos\alpha - \cos(\alpha + \mu) = \frac{2\omega L_s I_d}{\sqrt2\,V_{LL}}$$ La tension continue perd $\frac{3}{\pi}\omega L_s I_d$ et la tension du réseau présente des encoches, gênantes pour les autres usagers.`,
        en: r`The source inductance stops the current from moving instantly from one thyristor to the next: during the overlap angle μ, two thyristors conduct together. $$\cos\alpha - \cos(\alpha + \mu) = \frac{2\omega L_s I_d}{\sqrt2\,V_{LL}}$$ The DC voltage loses $\frac{3}{\pi}\omega L_s I_d$, and the grid voltage gets notches that disturb other users.`,
      },
    },
    failure: {
      hint: { fr: r`α vers 150°, $I_d$ et $L_s$ au maximum.`, en: r`α towards 150°, $I_d$ and $L_s$ at maximum.` },
      answer: {
        fr: r`Le thyristor qui s’éteint doit voir une tension inverse pendant un temps minimal pour se bloquer. Il faut garder une marge d’extinction : $$\gamma = 180° - \alpha - \mu > \gamma_{min} \approx 15–18°$$ Sinon, il se réamorce : court-circuit côté continu, la puissance s’effondre. Un creux de tension côté onduleur (qui allonge μ) suffit à provoquer ces échecs, problème majeur des liaisons LCC raccordées à des réseaux faibles.`,
        en: r`The outgoing thyristor must see reverse voltage for a minimum time to turn off. An extinction margin must be kept: $$\gamma = 180° - \alpha - \mu > \gamma_{min} \approx 15–18°$$ Otherwise it re-conducts: a DC-side short circuit, and power collapses. A voltage dip on the inverter side (which lengthens μ) is enough to cause such failures, a major problem for LCC links on weak grids.`,
      },
    },
  },

  pwm: {
    predict: {
      hint: { fr: r`Le bras ne peut valoir que $+V_{dc}/2$ ou $-V_{dc}/2$. C’est la largeur des créneaux qui suit la sinusoïde.`, en: r`The leg can only be at $+V_{dc}/2$ or $-V_{dc}/2$. It is the pulse width that follows the sine.` },
      answer: {
        fr: r`La tension du bras est une suite de **créneaux** entre $\pm V_{dc}/2$, à la fréquence de la porteuse ; leur largeur suit la référence : larges en haut quand le sinus est positif, étroits quand il est négatif. Sa moyenne glissante est la sinusoïde voulue : $$\bar v_a = m\,\frac{V_{dc}}{2}\sin\omega t \quad (m \le 1)$$`,
        en: r`The leg voltage is a train of **pulses** between $\pm V_{dc}/2$ at the carrier frequency; their width follows the reference: wide at the top when the sine is positive, narrow when negative. Its moving average is the desired sinusoid: $$\bar v_a = m\,\frac{V_{dc}}{2}\sin\omega t \quad (m \le 1)$$`,
      },
    },
    linear: {
      hint: { fr: r`MLI sinus, $m = 1$.`, en: r`Sine PWM, $m = 1$.` },
      answer: {
        fr: r`Tant que la référence reste dans la porteuse ($m \le 1$), le fondamental est proportionnel à $m$ : $$\hat V_{LL,1} = m\,\frac{\sqrt3}{2}\,V_{dc}$$ et les harmoniques sont regroupés autour de $m_f$, $2m_f$… loin du fondamental, donc faciles à filtrer.`,
        en: r`As long as the reference stays within the carrier ($m \le 1$), the fundamental is proportional to $m$: $$\hat V_{LL,1} = m\,\frac{\sqrt3}{2}\,V_{dc}$$ and the harmonics cluster around $m_f$, $2m_f$… far from the fundamental, hence easy to filter.`,
      },
    },
    overmod: {
      hint: { fr: r`MLI sinus, $m$ au-delà de 1,15.`, en: r`Sine PWM, $m$ beyond 1.15.` },
      answer: {
        fr: r`Au-delà de $m = 1$, la référence dépasse la porteuse : le bras reste collé à $\pm V_{dc}/2$ pendant plusieurs périodes de découpage. Le fondamental n’augmente plus proportionnellement, et la forme écrêtée contient des harmoniques basses (5, 7) que le filtre ne peut pas éliminer. À l’extrême, c’est l’onde pleine (six créneaux).`,
        en: r`Beyond $m = 1$ the reference exceeds the carrier: the leg sticks at $\pm V_{dc}/2$ for several switching periods. The fundamental no longer grows proportionally, and the clipped shape contains low harmonics (5th, 7th) that the filter cannot remove. At the extreme, it is the six-step wave.`,
      },
    },
    third: {
      hint: { fr: r`Gardez $m \approx 1{,}15$, méthode « 3ᵉ harmonique » ou « vectorielle ».`, en: r`Keep $m \approx 1.15$, “3rd harmonic” or “space vector” method.` },
      answer: {
        fr: r`Ajouter une composante homopolaire (un sixième de 3ᵉ harmonique, ou l’équivalent de la MLI vectorielle) aplatit la référence de chaque phase sans changer les tensions **composées**, où elle s’annule : $$v_a^* = m\sin\omega t + \tfrac{m}{6}\sin 3\omega t, \qquad v_a - v_b \text{ inchangée}$$ La zone linéaire s’étend jusqu’à $m = 2/\sqrt3 \approx 1{,}155$ : 15 % de tension en plus pour la même tension continue.`,
        en: r`Adding a zero-sequence component (one sixth of 3rd harmonic, or the space-vector equivalent) flattens each phase reference without changing the **line** voltages, where it cancels: $$v_a^* = m\sin\omega t + \tfrac{m}{6}\sin 3\omega t, \qquad v_a - v_b \text{ unchanged}$$ The linear range extends to $m = 2/\sqrt3 \approx 1.155$: 15 % more voltage from the same DC bus.`,
      },
    },
    hexagon: {
      hint: { fr: r`Faites glisser le curseur de temps sur toute la période, avec $m$ au-delà de 1,155.`, en: r`Drag the time cursor over the whole period, with $m$ beyond 1.155.` },
      answer: {
        fr: r`Les huit états de l’onduleur donnent six vecteurs actifs (les sommets d’un hexagone) et deux vecteurs nuls. La MLI vectorielle reproduit le vecteur de référence en moyenne, en dosant les deux vecteurs voisins : $$\vec v^*\,T_s = \vec v_1\,t_1 + \vec v_2\,t_2 + \vec 0\,t_0$$ Le plus grand cercle inscrit a pour rayon $V_{dc}/\sqrt3$ ; au-delà ($m > 1{,}155$), le cercle sort de l’hexagone et la tension se déforme.`,
        en: r`The inverter’s eight states give six active vectors (the corners of a hexagon) and two zero vectors. Space-vector PWM reproduces the reference vector on average by mixing the two neighbouring vectors: $$\vec v^*\,T_s = \vec v_1\,t_1 + \vec v_2\,t_2 + \vec 0\,t_0$$ The largest inscribed circle has radius $V_{dc}/\sqrt3$; beyond ($m > 1.155$), the circle leaves the hexagon and the voltage distorts.`,
      },
    },
    mf: {
      hint: { fr: r`Montez $m_f$ à 27.`, en: r`Raise $m_f$ to 27.` },
      answer: {
        fr: r`Les harmoniques de découpage se placent autour de $m_f f_1$ et de ses multiples. Un filtre passe-bas du second ordre les atténue en $1/f^2$ : $$\text{atténuation} \approx \left(\frac{f_{res}}{m_f f_1}\right)^2$$ Doubler $m_f$ divise l’ondulation de courant environ par 4, mais double les pertes de commutation. Les gros convertisseurs (MW) découpent à quelques kHz, les petits à plusieurs dizaines.`,
        en: r`Switching harmonics sit around $m_f f_1$ and its multiples. A second-order low-pass filter attenuates them as $1/f^2$: $$\text{attenuation} \approx \left(\frac{f_{res}}{m_f f_1}\right)^2$$ Doubling $m_f$ divides current ripple by about 4, but doubles switching losses. Large converters (MW) switch at a few kHz, small ones at tens of kHz.`,
      },
    },
  },

  lcl: {
    average: {
      hint: { fr: r`Cliquez sur la pastille du modèle découpé au-dessus de l’oscilloscope pour la masquer.`, en: r`Click the switched-model chip above the oscilloscope to hide it.` },
      answer: {
        fr: r`Le modèle moyen remplace les créneaux par leur moyenne sur une période de découpage : $$\bar v = d(t)\,V_{dc}$$ Il garde la dynamique lente (régulation, réseau) et ignore l’ondulation. Il est des milliers de fois plus rapide à simuler : c’est le modèle des études de stabilité (modules 7 et 8), le modèle découpé servant aux études de pertes et d’harmoniques.`,
        en: r`The averaged model replaces the pulses by their mean over a switching period: $$\bar v = d(t)\,V_{dc}$$ It keeps the slow dynamics (control, grid) and ignores the ripple. It simulates thousands of times faster: it is the model for stability studies (modules 7 and 8), the switched model being kept for loss and harmonic studies.`,
      },
    },
    lfilter: {
      hint: { fr: r`Réaffichez le modèle découpé, puis $C_f = 0$.`, en: r`Show the switched model again, then $C_f = 0$.` },
      answer: {
        fr: r`Un filtre L n’atténue qu’en $1/f$ : $$\frac{i_g}{v}(j\omega) = \frac{1}{j\omega(L_1 + L_2)}$$ Pour respecter les limites d’harmoniques du réseau (IEEE 519, EN 61000), il faudrait une inductance énorme, lourde et chère, qui chuterait beaucoup de tension à 50 Hz.`,
        en: r`An L filter only attenuates as $1/f$: $$\frac{i_g}{v}(j\omega) = \frac{1}{j\omega(L_1 + L_2)}$$ Meeting grid harmonic limits (IEEE 519, EN 61000) would need a huge, heavy, expensive inductor with a large 50 Hz voltage drop.`,
      },
    },
    lcl: {
      hint: { fr: r`$C_f$ à 5 µF ou plus ; si l’atténuation n’est pas atteinte, montez $f_s$.`, en: r`$C_f$ at 5 µF or more; if the attenuation is not reached, raise $f_s$.` },
      answer: {
        fr: r`Le LCL est un filtre du troisième ordre : au-delà de la résonance, il atténue en $1/f^3$. $$\frac{i_g}{v}(s) = \frac{1}{L_1 L_2 C_f\,s^3 + (L_1 + L_2)\,s}, \qquad \omega_{res} = \sqrt{\frac{L_1 + L_2}{L_1 L_2 C_f}}$$ Par rapport au filtre L, il gagne un facteur $(\omega_{res}/\omega_s)^2$ : les courants de découpage se referment dans le condensateur au lieu d’aller au réseau.`,
        en: r`The LCL is a third-order filter: above resonance it attenuates as $1/f^3$. $$\frac{i_g}{v}(s) = \frac{1}{L_1 L_2 C_f\,s^3 + (L_1 + L_2)\,s}, \qquad \omega_{res} = \sqrt{\frac{L_1 + L_2}{L_1 L_2 C_f}}$$ Compared with the L filter it gains a factor $(\omega_{res}/\omega_s)^2$: switching currents close through the capacitor instead of reaching the grid.`,
      },
    },
    resonance: {
      hint: { fr: r`$R_d = 0$, puis baissez $f_s$ vers la fréquence de résonance affichée (environ 2 kHz par défaut).`, en: r`$R_d = 0$, then lower $f_s$ towards the displayed resonant frequency (about 2 kHz by default).` },
      answer: {
        fr: r`À la résonance, le gain du filtre non amorti devient très grand : le moindre harmonique proche de $f_{res}$ est amplifié au lieu d’être filtré. $$f_{res} = \frac{1}{2\pi}\sqrt{\frac{L_1 + L_2}{L_1 L_2 C_f}}$$ La résonance peut aussi être excitée par les harmoniques du réseau ou par la régulation de courant, et rendre l’onduleur instable.`,
        en: r`At resonance, the undamped filter’s gain becomes very large: any harmonic near $f_{res}$ is amplified instead of filtered. $$f_{res} = \frac{1}{2\pi}\sqrt{\frac{L_1 + L_2}{L_1 L_2 C_f}}$$ The resonance can also be excited by grid harmonics or by the current controller, and destabilise the inverter.`,
      },
    },
    damp: {
      hint: { fr: r`Montez $R_d$ jusqu’à au moins la moitié de la valeur conseillée, affichée dans les équations.`, en: r`Raise $R_d$ to at least half the recommended value shown in the equations.` },
      answer: {
        fr: r`Une résistance en série avec le condensateur amortit la résonance. La valeur conseillée est de l’ordre d’un tiers de l’impédance du condensateur à la résonance : $$R_d \approx \frac{1}{3\,\omega_{res}C_f}$$ C’est l’amortissement **passif**, simple mais avec des pertes. Les onduleurs modernes l’obtiennent souvent par la commande (amortissement **actif**), sans pertes.`,
        en: r`A resistor in series with the capacitor damps the resonance. The recommended value is about a third of the capacitor’s impedance at resonance: $$R_d \approx \frac{1}{3\,\omega_{res}C_f}$$ This is **passive** damping, simple but lossy. Modern inverters often obtain it through control (**active** damping), without losses.`,
      },
    },
    design: {
      hint: { fr: r`Visez une résonance entre 500 Hz et $f_s/2$ : ajustez $C_f$ ou les inductances, gardez $R_d$ suffisante, et montez $f_s$ si besoin.`, en: r`Aim for a resonance between 500 Hz and $f_s/2$: adjust $C_f$ or the inductors, keep $R_d$ high enough, and raise $f_s$ if needed.` },
      answer: {
        fr: r`La règle usuelle encadre la résonance : $$10\,f_1 < f_{res} < \frac{f_s}{2}$$ Assez haut pour ne pas interagir avec la régulation et les harmoniques bas du réseau, assez bas pour bien atténuer le découpage. On limite aussi $C_f$ (moins de 5 % de la puissance nominale en réactif) et on choisit $L_1$ pour limiter l’ondulation dans l’onduleur.`,
        en: r`The usual rule brackets the resonance: $$10\,f_1 < f_{res} < \frac{f_s}{2}$$ High enough not to interact with control and low grid harmonics, low enough to attenuate switching well. $C_f$ is also limited (under 5 % of rated power in reactive power) and $L_1$ is chosen to limit ripple inside the inverter.`,
      },
    },
  },
};
