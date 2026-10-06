# Omega Lab — plan

> **Du circuit RLC à la stabilité des réseaux. From RLC circuits to grid stability.**
>
> An interactive learning tool on electrical power systems, for learners, researchers and
> utility engineers. Under the hood it uses the G2ELin engine (`C:\Users\kelad\G2ELin\python`)
> for its stability computations, but it is a separate product with its own name.

---

## Status (6 October 2026)

**All eleven modules (0 to 10) are built: 65 lessons, in French and English.** Code is on
[GitHub](https://github.com/FKELADA/Omega-Lab). Each lesson's objectives, formulas, models and
tests are in [documentation.md](documentation.md).

| Lesson | Status | Commit |
|---|---|---|
| 0.1 A day on the grid | ✅ Done | `4535b69` |
| 0.2 Replay a blackout | ✅ Done | `4535b69` |
| 1.1 R, L, C as energy elements | ✅ Done | `4535b69` |
| 1.2 RLC transients | ✅ Done | `84cf27a` |
| 1.3 AC sources and RMS | ✅ Done | `a9b0b3e` |
| 1.4 Resonance | ✅ Done | `a9b0b3e` |
| 1.5 DC versus AC | ✅ Done | `4535b69` |
| 2.1 Euler and the rotating vector | ✅ Done | `a9b0b3e` |
| 2.2 Phasors and impedance | ✅ Done | `07b14a7` |
| 2.3 AC power, P, Q, S | ✅ Done | `07b14a7` |
| 2.4 Three-phase systems | ✅ Done | `07b14a7` |
| 2.5 Clarke and Park | ✅ Done | `f446195` |
| 2.6 Per-unit system | ✅ Done | `f446195` |
| 2.7 Harmonics and Fourier | ✅ Done | `f446195` |
| 2.8 Symmetrical components | ✅ Done | `f446195` |
| 3.1 Laplace, poles and zeros | ✅ Done | `86c5bb2` |
| 3.2 Bode and Nyquist | ✅ Done | `86c5bb2` |
| 3.3 State space and linearisation | ✅ Done | `86c5bb2` |
| 3.4 PI control and the PLL | ✅ Done | `86c5bb2` |
| 4.1 Transmission lines | ✅ Done | `2e3694f` |
| 4.2 Transformer: inrush and efficiency | ✅ Done | `2e3694f` |
| 4.3 Transformer: tap changer, phase shifter, vector groups | ✅ Done | Module 4 extension |
| 4.4 Synchronous machine: short circuit and capability | ✅ Done | `2e3694f` |
| 4.5 Synchronous machine: models and controls | ✅ Done | Module 4 extension |
| 4.6 Loads: ZIP and recovery | ✅ Done | `2e3694f` |
| 4.7 Loads: exponential and frequency | ✅ Done | Module 4 extension |
| 4.8 Induction motor | ✅ Done | `2e3694f` |
| 4.9 Shunt and series compensation | ✅ Done | `2e3694f` |
| 4.10 FACTS | ✅ Done | `2e3694f` |
| 5.1 Y-bus and power flow | ✅ Done | `9ba10f5` |
| 5.2 P–V and Q–V curves | ✅ Done | `9ba10f5` |
| 5.3 Faults | ✅ Done | `9ba10f5` |
| 5.4 Economic dispatch | ✅ Done | `9ba10f5` |
| 5.5 A day on a feeder | ✅ Done | `9ba10f5` |
| 6.1 Choppers | ✅ Done | `ca70a97` |
| 6.2 Rectifiers | ✅ Done | `ca70a97` |
| 6.3 PWM | ✅ Done | `ca70a97` |
| 6.4 Averaged model and LCL filter | ✅ Done | `ca70a97` |
| 7.1 VSC control | ✅ Done | `c6c3613` |
| 7.2 Grid-following vs grid-forming | ✅ Done | `c6c3613` |
| 7.3 PV and MPPT | ✅ Done | `c6c3613` |
| 7.4 Wind | ✅ Done | `c6c3613` |
| 7.5 Storage (BESS) | ✅ Done | `c6c3613` |
| 7.6 HVDC and MMC | ✅ Done | `c6c3613` |
| 7.7 Grid codes | ✅ Done | `c6c3613` |
| 8.1 Transient stability | ✅ Done | `fe3f5c5` |
| 8.2 Small-signal stability | ✅ Done | `fe3f5c5` |
| 8.3 Long-term voltage stability | ✅ Done | `fe3f5c5` |
| 8.4 Frequency stability | ✅ Done | `fe3f5c5` |
| 8.5 Converter-driven stability | ✅ Done | `fe3f5c5` |
| 8.6 Resonance stability (SSR) | ✅ Done | `fe3f5c5` |
| 8.7 Inter-area oscillations | ✅ Done | `fe3f5c5`, reworked in `bd0d003` |
| 8.8 Modes and participation factors (G2ELin) | ✅ Done | `bd0d003` |
| 8.9 Model reduction: EMT, RMS, machine orders (G2ELin) | ✅ Done | `bd0d003` |
| 9.1 Voltage levels and orders of magnitude | ✅ Done | Module 9 |
| 9.2 Balancing and frequency control (FCR, aFRR, mFRR) | ✅ Done | Module 9 |
| 9.3 N-1 security and remedial actions | ✅ Done | Module 9 |
| 9.4 The transmission voltage plan | ✅ Done | Module 9 |
| 9.5 Stability and the defence plan | ✅ Done | Module 9 |
| 9.6 Connection studies | ✅ Done | Module 9 |
| 10.1 Architecture: the MV loop | ✅ Done | Module 10 |
| 10.2 The distribution voltage plan | ✅ Done | Module 10 |
| 10.3 Neutral earthing and 3I0 | ✅ Done | Module 10 |
| 10.4 The MV protection plan | ✅ Done | Module 10 |
| 10.5 Flexibility and planning | ✅ Done | Module 10 |

**Verification:** 518 unit tests (solver, models, baked G2ELin data, note and step-explanation completeness), and a browser test that walks
all 65 lessons, the documentation page, the teaching notes and the zoom window (predictions, misconception feedback, every step check, both languages, phone width,
no console errors).

### Which interaction ideas (§4) exist so far

| Idea | Status |
|---|---|
| 1. Live equations (colour-coded terms, live numbers, term bars, derivations) | ✅ All lessons |
| 2. Probes and virtual instruments | ✅ Oscilloscope with click-to-probe; frequency response, phasor diagram, s-plane, spectrum, meters, and x–y characteristic charts (line profile, B–H, capability, V-curves, P–V, torque–speed, V–I). No PMU or impedance scanner yet |
| 3. Sweep cursors | ✅ Sweep fans and root locus (in R, K, D, ζ); the cursor itself can be an NR iteration (5.1) or a load level (5.2). Stability region maps not yet |
| 4. Predict, then reveal | ✅ 18 lessons, with scoring |
| 5. Freeze and compare | ✅ Ghost traces. Split view (two cases side by side) not yet |
| 6. Synchronised time scrubber | ✅ Every panel follows the cursor, including rotating phasors, helix, epicycles, dq camera |
| 7. Inverse design (drag an eigenvalue) | ✅ Lesson 3.1: drag poles into a design target region |
| 8. Animated power flow | Partial: charge dots in 1.2, heater glow in 1.3, energy dots plant-to-socket in 0.1, reversing power arrow in 1.1 |
| 9. Sound | ✅ Lesson 2.7 (WebAudio) |
| 10. Break-it / fix-it challenges | ✅ As step checks. No scoring or leaderboard yet |
| 11. Misconception detectors | ✅ 18 lessons |
| 12. AI tutor | Not yet |
| 13. Export to code | Not yet |
| 14. Time-scale map | Not yet |
| Thread view, fidelity slider (§2) | Not yet. The fidelity slider becomes useful from Module 4 |
| Teaching notes and in-app documentation | ✅ ⓘ notes per module and lesson (FR/EN, plain language); `#docs` renders documentation.md |

### What changed from the plan

- **Order:** Modules 1–2 were built first, before connecting G2ELin (P2). The AC toolbox turned
  out to be the foundation every later module reuses: phasors, RMS, dq frames, per-unit.
- **Lessons are TypeScript data files**, not MyST + JSON. Type checking catches mistakes in step
  checks and equations, which plain JSON could not. A lesson still touches no interface code.
- **No three.js:** the Euler helix is an SVG orthographic projection, which is lighter and enough.
- **Plots:** uPlot for the oscilloscope; plain SVG for everything else. A first uPlot version of
  the frequency response had unreadable log axes.
- **Module 0** uses deliberately simple, illustrative models (a synthetic demand curve, one
  aggregated machine for the blackout). The 2019 GB replay reproduces the sequence of events with
  rounded figures, not the details.
- **Module 4** uses client-side models (ABCD lines, saturating-core RK4, the classical
  short-circuit expression, ZIP/Karlsson–Hill loads, the induction-motor equivalent circuit, nose
  curves, SVC/STATCOM controllers), not G2ELin's `sm.py`.
  - Added later (4.3, 4.5, 4.7): the tap changer with dead band and delays, the phase shifter,
    vector groups, the classical and one-axis generator models with AVR and governor, and
    exponential and frequency-dependent loads.
  - The fidelity slider stops at the one-axis model; the 4th- and 6th-order models are described,
    not simulated. The PSS stays in 8.2.
  - Still deferred: the travelling-wave animation in the lesson (the Atelier has the Bergeron
    line), and TCSC and UPFC as simulations (they appear as equation cards only).
- **Module 5** runs entirely in the browser on a new power-flow core (Y-bus, Newton–Raphson with
  reactive limits, Gauss–Seidel, DC flow).
  - The time-series power flow (5.5) is a client-side 20 kV feeder, not G2ELin's `timeseries`.
  - Economic dispatch (5.4) is a DC-OPF on three buses.
  - The Y-bus animation is a step-by-step builder.
  - The NR "mismatch surface" became a replay of the network iteration by iteration, with a
    convergence chart.

- **Module 8** runs in the browser:
  - 8.1–8.6 use reduced client-side models (SMIB, Heffron–Phillips, quasi-static OLTC and load
    recovery, one-bus frequency, Module 7's GFL model linearised numerically, a one-mode SSR
    damping balance).
  - 8.7 runs a classical two-area, four-machine system in the browser.
  - 8.8 and 8.9 show G2ELin results baked into the app (`web/scripts/bake-g2elin.mjs`, `bake-shapes.py`):
    modes, participation factors and mode shapes of six networks up to IEEE 39-bus, and the
    EMT → RMS → machine-order ladder with EMT runs. The live API panel was dropped: the baked data
    is instant, works offline, and the EMT runs take up to four minutes.
  - Not built from §5: the 100 % IBR island, PSS design on the
    full two-area system and the blackout replay capstones.

### Next

1. ✅ **Home page** (`#home`, the default route): pitch and demo animation, start or resume, entry points by profile, the course map with progress saved in the browser, the Atelier.
2. ✅ **Review of Modules 9–10:** figures checked against RTE, Enedis, ENTSO-E, UCTE and CRE publications; corrections listed in the documentation (§16).
3. **Progress and assessment:** per-lesson progress saved in the browser, a short quiz at the end
   of each module, and an export of results for teachers.
4. **Capstone labs** from §5 Module 8 and Modules 9–10 (for example "plan a primary substation
   for 2035"), and the split view (two cases side by side).
5. ✅ **Atelier ↔ Module 10:** MV-neutral transformer and protection-relay elements, benches for the MV loop, neutral earthing and feeder protection, two challenges (Petersen coil, grading).
6. ✅ **Deployment:** GitHub Actions workflow (check, test, build with the Pages base path, publish on GitHub Pages); the smoke test passes on the production build. Pages must be enabled once in the repository settings (a private repository needs a paid plan).
7. **G2ELin depth:** PSS design on G2ELin's full two-area model, GFM/GFL reduction levels.

Done: the Atelier, A0 to A6 (§10; no predict-then-run exercise there, by choice).

---

## 0. Name

**Omega Lab** (*Oméga Lab* in French).

- ω appears everywhere in the course: from X = ωL in the first AC lesson, to the rotor speed in
  the swing equation, to the eigenvalues σ ± jω of the stability modules.
- "Lab" says what the tool is: a place to build experiments, not a book to read.
- The name is the same in French and English.

> Trademark and domain availability have not been checked. "Omega" is a crowded brand name, so
> check before publishing.

---

## 1. Starting point: what G2ELin already provides

G2ELin already includes:

- a typed network schema
- pandapower power flow
- symbolic SM / GFM / GFL / line / load / node models
- linearisation
- modal analysis (participation, sensitivity, root locus, mode shapes, free and step response)
- a model-order reduction catalogue
- a nonlinear dq-frame EMT integrator
- time-series load flow
- a FastAPI layer (`/api/network/*`, `/modal/sweep`, `/emt/live`, …)
- a plain-JS web front end

So Omega Lab does **not** rebuild the stability engine. It builds the **path up to it**, and
reuses G2ELin's engine for the later chapters.

What G2ELin does **not** have, and Omega Lab needs:

- single-phase circuit primitives
- switching-level (PWM) converter models (G2ELin's models are averaged)
- abc / unbalanced representation
- impedance-scan (frequency-domain) analysis

---

## 2. The main idea: one physics, several views

Most courses split the subject into separate chapters. Omega Lab is organised around **threads**:
ideas that come back again and again at higher fidelity.

| Thread | Where it first appears | Where it comes back |
|---|---|---|
| **Resonance** | Series/parallel RLC | Line π-model → capacitor banks → LCL inverter filter → sub-synchronous resonance (series compensation plus shaft) → converter–grid harmonic instability |
| **Energy storage and exchange** | L and C energy; reactive power as energy moving back and forth | Rotor kinetic energy (inertia) → DC-link capacitor → virtual inertia in GFM |
| **Synchronism** | Two sources in parallel | Swing equation → PLL → GFL vs GFM → loss of synchronism |
| **Feedback** | RC as a first-order filter | AVR/PSS → current loops → PLL → impedance-based stability |
| **Fidelity** | Instantaneous waveform vs phasor | EMT vs RMS vs linearised modal model of the same element |

- **Thread view:** click "Resonance" and you see the same phenomenon across five chapters side by
  side. This gives the "aha, it's the same equation" moment, which is how experts actually think.
- **Fidelity slider:** every element can switch between *Instantaneous → Phasor/RMS → Linearised
  → Reduced order*, so learners see what each approximation discards. G2ELin's `reduction.py`
  catalogue already supports this.

---

## 3. Screen layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Concept map ▸ Module 4.4 Synchronous machine    [Learner|Research|Utility] │
├───────────────┬──────────────────────────────────┬───────────────────────┤
│ CANVAS        │ INSTRUMENTS (tabs, can be split) │ LIVE EQUATIONS        │
│ circuit /     │  Scope · Phasor · Spectrum ·     │  Each term in KaTeX,  │
│ network       │  s-plane · Bode/Nyquist · PMU ·  │  colour-matched to    │
│ editor; drop  │  P–V / P–δ curves · energy bars  │  its curve; live      │
│ probes on     │                                  │  numbers filled in;   │
│ nodes and     │  ←── time scrubber, every view ──→│  term-size bars;      │
│ branches      │       synchronised               │  "derive ▸" expands   │
├───────────────┴──────────────────────────────────┴───────────────────────┤
│ PARAMETER RAIL: sliders · sweep cursors · "freeze & compare" · events    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Interaction ideas

1. **Live equations.** The right panel doesn't show static formulas.
   - Each term is coloured to match its curve.
   - Hovering a term highlights the matching component on the canvas and the matching trace in
     the plot.
   - Current values are filled in, e.g. `X_L = ωL = 2π·50·0.1 = 31.4 Ω`.
   - **Term-size bars** show which term dominates right now, so the learner sees *why* an
     approximation (e.g. R ≪ X) holds or fails.
   - A "derive ▸" button expands a step-by-step derivation.
2. **Probes and virtual instruments.** Drag a probe onto any node or branch to open:
   - an oscilloscope
   - a phasor diagram
   - a spectrum analyser
   - a PMU
   - an impedance analyser (frequency scan)
   - a power analyser (P, Q, S, PF, THD)

   Utility engineers already think in instruments, so this metaphor suits them.
3. **Sweep cursors.** Drag a cursor along a parameter axis and the tool draws one of:
   - a "fan" of faded traces
   - root-locus trails in the s-plane
   - a stability region map (e.g. SCR × PLL bandwidth → coloured stable/unstable map)

   G2ELin's `/modal/sweep` and root locus already compute these.
4. **Predict, then reveal.** Before running, the learner sketches the curve they expect with the
   mouse. The tool then overlays the real result and highlights where the prediction was wrong.
   This is one of the most effective known teaching methods.
5. **Freeze and compare.** Pin a run as a ghost trace, change a parameter, and see the
   difference. A **split view** shows two cases side by side, e.g. the same grid with a GFL
   inverter on the left and a GFM inverter on the right, under the same fault.
6. **Synchronised time scrubber.** Scrub time and every view follows:
   - the waveform
   - the rotating phasor (Euler projection)
   - the dq frame
   - the energy bars
   - power-flow animation on the canvas
7. **Inverse design.** Drag an eigenvalue in the s-plane to where you want it, and the tool
   solves for the parameters that put it there. This uses eigenvalue sensitivity, which G2ELin's
   `parameter_sensitivity` provides. It also works with a target such as "ζ ≥ 5 %".
8. **Animated power flow.** Particles show active power moving one way and reactive power going
   back and forth. Learners see that reactive power does no net work, instead of just reading
   it.
9. **Sound.** Optional audio for harmonics, beats between two frequencies, PWM noise, and
   sub-synchronous oscillations. It makes these phenomena memorable and more accessible.
10. **Break it / fix it challenges.** For example: "Destabilise this system with the smallest
    change to one parameter", or "Tune this PSS until every mode has ζ > 10 %". Challenges are
    scored, with a leaderboard for classes.
11. **Misconception detectors.** They trigger from what the learner actually does in the
    sandbox. Example: "you increased C expecting the current to drop, but at this frequency the
    circuit is capacitive."
12. **Context-aware AI tutor (Claude).** It reads the current experiment state: parameters,
    eigenvalues, participation factors and the last event. It answers questions such as "why did
    this oscillate?", in Socratic mode for learners or by explaining directly for researchers.
13. **Export to code.** Every experiment exports as a Python script or notebook that uses
    `g2elin_core`. Learners can move on to research without leaving the ecosystem.
14. **Time-scale map.** A zoomable log-time axis from µs (switching) through ms (current loops,
    EMT) and s (electromechanical) to min (AGC, OLTC). Every phenomenon in the course is pinned
    on it, and clicking one jumps to its module.

---

## 5. Curriculum

The initial order (RLC → AC → conventional elements → IBR → stability) is kept, with five
changes:

- **(a)** Add a short **hook module** at the start (Module 0).
- **(b)** Add a **Signals & Control toolkit** spine (Module 3), because machines and inverters
  both need it.
- **(c)** Make **power flow and steady-state networks** their own module before stability
  (Module 5).
- **(d)** Split **power-electronics fundamentals** (switching, PWM, averaging) (Module 6) from
  **IBR systems** (PV, wind, HVDC) (Module 7).
- **(e)** Add **faults and symmetrical components**, which are essential for IBR short-circuit
  behaviour (Modules 2.8 and 5).

### Module 0: The grid in 10 minutes (hook)

- An interactive tour of the grid from turbine to socket.
- A blackout replay (simplified 2016 South Australia or 2019 UK 9 August event) showing
  frequency dropping as generators trip.
- The learner picks a "why should I care" path.

### Module 1: Circuits, DC vs AC

- ✅ 1.1 R, L, C as energy elements: energy bars, constitutive laws.
- ✅ 1.2 DC transients: RC, RL, RLC step response; τ; underdamped, critical and overdamped cases
  shown as a **damping-ratio cursor** on an s-plane preview. This is the first view of
  eigenvalues, planted early on purpose.
- ✅ 1.3 AC sources: sine, RMS (the shaded-area animation shows *why* it's √2), average vs RMS.
- ✅ 1.4 Resonance: frequency sweep, Q factor, bandwidth, and resonance by ear.
- ✅ 1.5 DC vs AC: why AC won (transformers), why DC is coming back (HVDC, PV, batteries). This
  sets up Module 6.

### Module 2: The AC toolbox

- ✅ 2.1 Euler and the rotating vector: a 3D helix showing e^{jωt}, with its shadows giving cos and
  sin.
- ✅ 2.2 Phasors and impedance, with the time ↔ phasor duality synchronised on the scrubber.
- ✅ 2.3 AC power: p(t) decomposed into P and Q, S, PF, the power triangle, and PF correction as a
  game.
- ✅ 2.4 Three-phase systems: balanced/unbalanced, Y/Δ, why three phases give constant power (watch
  p(t) flatten as phases are added). (Built with a star load and a broken-neutral fault; Δ connections are not covered yet.)
- ✅ 2.5 Clarke and Park (αβ, dq): a "camera riding the rotating frame" animation in which AC
  becomes DC. This is the key that unlocks machines and converters.
- ✅ 2.6 Per-unit system: a base-change calculator. (Built client-side; G2ELin's `pu_base.py` was not needed.)
- ✅ 2.7 Harmonics and Fourier: build a square wave from harmonics, THD.
- ✅ 2.8 Symmetrical components: decompose an unbalanced set into rotating sequence sets.

### Module 3: Signals & Control toolkit (spine)

✅ Built as four lessons: 3.1 Laplace, poles and zeros · 3.2 Bode and Nyquist · 3.3 state space and linearisation (on the swing equation) · 3.4 PI control, anti-windup and the PLL.

Topics:

- Laplace transforms
- transfer functions
- poles and zeros, with a drag-the-pole playground
- Bode and Nyquist plots
- state space, eigenvalues and eigenvectors
- linearisation, with a tangent-line animation on a nonlinear curve
- PI control and anti-windup
- the PLL as a control loop

Each tool is introduced on a circuit the learner already knows from Modules 1–2.

### Module 4: Conventional power-system elements

✅ Built as ten lessons: 4.1 lines (models, Ferranti, SIL) · 4.2 transformer inrush and efficiency · 4.3 tap changer, phase shifter, vector groups · 4.4 synchronous machine short circuit, excitation, capability · 4.5 generator models (classical, one-axis), AVR, governor and droop · 4.6 loads (ZIP, recovery, CVR) · 4.7 exponential and frequency-dependent loads · 4.8 induction motor (start-up, FIDVR stall) · 4.9 compensation (nose curve) · 4.10 SVC versus STATCOM. The module was renumbered when 4.3, 4.5 and 4.7 were added. See "What changed from the plan" for the parts deferred.

- **4.1 Lines:**
  - distributed → π model
  - SIL and the Ferranti effect
  - a travelling-wave animation
  - a short / medium / long slider
  - an "is the π-model valid?" frequency check
- **4.2–4.3 Transformers:**
  - ideal → real
  - magnetisation and the B-H curve
  - inrush
  - tap changers and phase shifters
  - vector groups (clock diagram)
- **4.4–4.5 Synchronous generator** (reuses G2ELin's `sm.py`):
  - rotating field animation and the dq model
  - the hierarchy of models (classical → 4th → 6th order via the fidelity slider)
  - capability curve
  - P–δ curve with the operating point as a draggable cursor
  - swing equation
  - exciter/AVR, governor, PSS
- **4.6–4.7 Loads:** ZIP, exponential, dynamic loads, voltage and frequency sensitivity.
- **4.8 Induction motor:** torque–slip curve with a cursor, start-up, stalling, and why induction
  motors drive FIDVR.
- **4.9 Shunt and series compensation:** capacitor banks, reactors, series capacitors (setting up
  SSR).
- **4.10 FACTS:** SVC, STATCOM, TCSC, UPFC, compared on a common V–I characteristic.

### Module 5: The network in steady state

✅ Built as five lessons: 5.1 Y-bus and Newton–Raphson · 5.2 P–V and Q–V curves · 5.3 faults (sequence networks, grounding, fault level, SCR) · 5.4 economic dispatch (merit order, congestion, nodal prices) · 5.5 a day on a PV feeder (time-series power flow, hosting capacity).

- Y-bus construction, animated one element at a time.
- Power flow: Newton–Raphson iterations animated on a mismatch surface; PV / PQ / slack buses.
- P–V and Q–V curves (the nose curve, with a loading cursor).
- Economic dispatch basics.
- Time-series power flow (reuses G2ELin's `timeseries`).
- Faults: symmetrical and unsymmetrical, sequence networks, fault levels, short-circuit ratio
  (SCR).

### Module 6: Power electronics fundamentals

- Switches: diode, thyristor, IGBT.
- Choppers: buck, boost, buck-boost; AC choppers.
- Rectifiers: line-commutated, commutation overlap.
- PWM: carrier vs reference animation, SPWM, the SVPWM hexagon.
- Averaging: switching model ↔ averaged model on the fidelity slider.
- Filters: L and LCL, with resonance damping (the Resonance thread returns here).
- DC link.

### Module 7: Inverter-based resources and HVDC

- **7.1 VSC control:** cascaded current loop → outer P/Q/V loops → PLL.
- **7.2 GFL vs GFM:** droop, virtual synchronous machine, dispatchable virtual oscillator, shown
  in the side-by-side split view (reuses `gfl.py` / `gfm.py`).
- **7.3 PV:** I–V and P–V curves with an MPPT animation climbing the curve, plus irradiance and
  temperature sliders.
- **7.4 Wind:** Cp–λ surface, Type 1–4 turbines, DFIG, full converter, synthetic inertia.
- **7.5 Batteries / BESS:** fast frequency response.
- **7.6 HVDC:**
  - LCC vs VSC
  - MMC: sub-module and arm-energy animation, capacitor balancing
  - point-to-point and multi-terminal DC grids
  - DC faults and DC breakers
- **7.7 Grid codes:** FRT envelopes, reactive current injection, a compliance test bench.

### Module 8: Power system stability (the G2ELin suite)

- **Organisation:** the IEEE/CIGRE 2020 classification as a clickable tree. Each leaf opens its
  experiment.
- **Rotor angle stability:**
  - small-signal: modes, participation, mode shapes
  - transient: equal-area criterion animated on the P–δ curve, with a critical-clearing-time
    cursor
- **Voltage stability:** short and long term, including OLTC and load-recovery dynamics.
- **Frequency stability:**
  - inertia, RoCoF, nadir
  - primary and secondary control
  - an **inertia slider showing the nadir dropping** as synchronous machines are replaced by GFL
- **Converter-driven stability:** PLL instability at low SCR, control interactions,
  impedance-based (Nyquist) analysis.
- **Resonance stability:** SSR and SSCI.
- **Tools:**
  - linking the time domain and modal results ("this eigenvalue *is* that oscillation")
  - an EMT vs RMS vs linear comparison on the same event
- **Capstone labs:**
  - "Run a 100 % IBR island."
  - "Design a PSS for Kundur's two-area system."
  - "Find the minimum SCR for this GFL plant."
  - "Replay the blackout from Module 0, now that you understand it."

### Module 9: The transmission system operator (the RTE view)

✅ Built as six lessons. The angle is the TSO engineer's: what sets transmission apart from
distribution, and which studies the TSO runs. Figures are orders of magnitude, flagged in the
lessons as to be checked against RTE and ENTSO-E publications.

- **9.1 Voltage levels:** 400/225/90/63 kV against 20 kV and 400 V; losses as $1/U^2$; R/X and
  why transmission voltage is a reactive-power matter; network sizes and who runs what.
- **9.2 Balancing:** FCR, aFRR and mFRR after a plant trips, in two areas sharing one frequency;
  area control error, non-intervention, the 3,000 MW reference incident.
- **9.3 N-1 security:** a day-ahead DC N-1 analysis on a meshed 400 kV system; redispatch,
  phase shifter and topology as remedies, and their costs.
- **9.4 The voltage plan:** primary, secondary (pilot node, alignment level) and tertiary
  control; capacitors and reactors; the reactive reserve.
- **9.5 The defence plan:** under-frequency load shedding, the 47.5–51.5 Hz range,
  over-shedding, low inertia.
- **9.6 Connection studies:** N-1 hosting capacity, SCR for inverters, breaking capacity for
  synchronous plants.

### Module 10: The distribution system operator (the Enedis view)

✅ Built as five lessons. Figures are orders of magnitude, flagged in the lessons as to be checked
against Enedis and CRE publications.
- **10.1 Distribution architecture:** primary substations (HV/MV), radial-but-loopable MV
  feeders, MV/LV substations, LV networks; the voltage profile of a feeder and the open point.
- **10.2 The voltage plan:** the primary substation's tap changer with line-drop compensation,
  the MV and LV drop budgets, PV voltage rise, reactive control of producers.
- **10.3 Neutral earthing and 3I0:** isolated, resistance-earthed and compensated (Petersen)
  neutral; the capacitive current of cables; what residual relays see on faulty and healthy
  feeders.
- **10.4 The MV protection plan:** phase and residual overcurrent settings between load and
  minimum fault current, time grading, auto-reclosing cycles, the effect of distributed
  generation.
- **10.5 Flexibility and planning:** N-1 at the primary substation, MV back-up, hosting
  capacity, flexible connection and local flexibility to defer reinforcement.

---

## 6. Three personas, one tool

| | Learner | Researcher | Utility engineer |
|---|---|---|---|
| Default view | Guided lessons, predict-then-reveal, hints | Sandbox, full equations, code export | Case library, instruments, grid-code bench |
| Equations | Simplified, derivations on demand | Full model, symbolic Jacobians | Key formulas, standard references |
| Output | Badges and progress on the concept map | Notebook / Python export | Report export (PDF), compliance checks |

The concept map is a **prerequisite graph**, not a linear book. An engineer can jump straight to
"GFM vs GFL", and the map shows which prerequisite concepts they can check quickly.

---

## 7. Architecture

- **Two engines, one schema:**
  - **Client-side JS/TS engine** for Modules 1–3 and 6: a small ODE/MNA solver plus analytic
    solutions, so sliders update at 60 fps with no server round-trip.
  - **It also needs a switched-circuit solver.** G2ELin uses averaged models only, with no PWM
    or switching.
  - **G2ELin backend** (the existing FastAPI app) for Modules 4–5, 7 and 8.
  - **Shared schema:** both engines use G2ELin's Network JSON schema, extended with
    "pedagogical primitives" (single-phase R/L/C, ideal switch, source).
- **Lessons as data:** each lesson is a MyST/Markdown file plus an `experiment.json` (canvas,
  probes, sliders, events, prediction prompt, checks). Content can then be added without writing
  code, and it fits the existing MyST/Sphinx tooling.
- **Equations:**
  - KaTeX, with term IDs that bind to plot series and canvas elements.
  - For machine and converter models, SymPy (already in G2ELin) **auto-generates the LaTeX** from
    the same symbolic models the solver uses. Displayed equations are then guaranteed to match
    the solver.
- **Plots and canvas:**
  - uPlot or ECharts for fast time series.
  - D3/SVG for the phasor, s-plane and canvas views.
  - three.js only for the Euler helix and rotating-field views.
- **Front end:** Svelte or React plus TypeScript. A plain-JS front end becomes hard to maintain
  at this size.
- **Backend additions to G2ELin:**
  - an impedance-scan endpoint
  - a LaTeX export of the symbolic models
  - abc / unbalanced extensions later
- **Deployment:**
  - HF Space, as for G2ELin
  - an offline desktop bundle for classrooms

> **As built (Modules 1–2):** Svelte 5 + TypeScript + Vite in `web/`. Client-side solver with
> exact zero-order-hold discretisation by the matrix exponential (sinusoidal sources are extra
> oscillator states, so AC is exact too). KaTeX for equations, uPlot for the oscilloscope, SVG for
> every other instrument. Lessons are typed TypeScript data. The G2ELin backend is not connected
> yet. Details in [documentation.md](documentation.md).

---

## 8. Roadmap

| Phase | Content | Why at this point |
|---|---|---|
| **P0 (2–3 wk)** ✅ | Lesson format, layout shell, live-equation component, client solver, one complete lesson (RLC step response) | Validates the core interaction before scaling up |
| **P1** ✅ | Modules 0–2 | Simple physics, large audience, mostly client-side |
| **P2** | Module 8 wired to the G2ELin API, plus the case library | The engine already exists, so this pays off quickly and suits researchers and engineers |
| **P3** ✅ | Modules 3–5 | The spine plus conventional elements |
| **P4** | Modules 6–7, plus the switched-circuit solver and an impedance-scan endpoint | The heaviest new engineering |
| **P5** | AI tutor, challenges/leaderboards, classroom mode (teacher dashboard, assignments), FR/EN localisation | Scaling up |

P2 comes before P3 deliberately. It gives researchers a credible tool early, and Module 8 shows
exactly which concepts Modules 3–5 must build up to.

---

## 9. Open decisions

1. ~~**Languages:** French, English, or both from the start?~~ **Decided:** both, from the start.
2. ~~**Delivery:** extend G2ELin's web front end, or keep Omega Lab as a separate project?~~
   **Decided:** a separate project, with G2ELin to be used as a backend.
3. **Switching-level detail:** how far should Modules 6–7 go (MMC sub-module level? DC breaker
   internals?). This drives most of the new engine work.
4. **First audience:** students, utility training, or both? This decides whether P1 or P2 ships
   first.

---

## 10. Free-style mode: the Atelier

> **Atelier** (FR) / **Workbench** (EN). A second mode next to *Leçons*: an empty bench where the
> learner builds any circuit or grid from the library, wires instruments to it, and runs every
> analysis the lessons used. The lessons teach one idea at a time; the Atelier lets the learner
> combine them.

### 10.1 Screen

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR   [Leçons | Atelier]   project ▾   ↶ ↷   ▶ Simuler   analyses ▾   share     │
├────────────────────────────────────────────────────────────────┬─────────────────────┤
│                                                                │ LIBRARY  (search)   │
│                         CANVAS (free space)                    │  Sources            │
│   drag & drop elements, wire ports, drop instrument probes     │  Passives           │
│   on wires; live values and moving current dots; a click       │  Switches & semis   │
│   on an element selects it                                     │  Machines · Grid    │
│                                                                │  Converters & IBR   │
│                                                                │  Control · Instr.   │
│                                                                │  Templates          │
│                                                                ├─────────────────────┤
├────────────────────────────────────────────────────────────────┤ INSPECTOR           │
│ INSTRUMENT DOCK  Oscilloscope · Multimètre · THD · Bode ·      │ (selected element)  │
│   Impédance · Phaseurs · Pôles · Répartition de charge         │ params, presets,    │
├────────────────────────────────────────────────────────────────┤ units, probes       │
│ FORMULAS  selected element: constitutive law, companion model, │                     │
│ live values · whole circuit: G·v = i, nodes, states, messages  │                     │
└────────────────────────────────────────────────────────────────┴─────────────────────┘
```

- **Right column:** the library on top (categories, search, drag to the canvas). When an element is
  selected, the inspector opens below it (or replaces it on small screens). It shows the
  parameters with sliders and typed inputs that accept units (`4,7µ`, `10k`, `20 kV`), presets
  (a 20 kV cable per km, a 400 kV line, a 2 MW wind turbine), probes, and rotate, flip and delete.
- **Bottom:** the formula panel. For the selected element, it shows:
  - its equations with live values;
  - its numerical (companion) model, for the Researcher profile;
  - engineering notes, for the Engineer profile.

  It reuses the equation cards. Without a selection, it shows the circuit's own equations (number
  of nodes and states, and the nodal matrix written out for small circuits) and plain-language
  solver messages (floating node, a loop of voltage sources, a step too large).
- **Instrument dock**, between the canvas and the formulas: the existing oscilloscope, Bode plot,
  s-plane and phasor diagram, plus a new THD analyser, multimeter, wattmeter and impedance scan.
  Each tab can be enlarged (⤢) like the lesson panels.
- Phone: canvas full screen; the library, inspector, dock and formulas become bottom sheets.

### 10.2 Architecture: the bench compiles into an experiment

The `Lab` already drives every instrument from an `Experiment` (model, params, signals, equations,
Bode and phasor specifications). The bench **compiles into a dynamic `Experiment`**:

| Experiment field | Built from the bench |
|---|---|
| `model.simulate` | the EMT solver run on the compiled netlist |
| `params` | every element parameter, as `R1.R`, `L1.L`… so sweeps, freeze-and-compare and the time cursor work unchanged |
| `signals` | every probe (node voltage, branch current, power, speed…) |
| `poles` | the modal analysis below |
| `bode` | the transfer from a chosen source to a chosen probe |
| `phasors` | the AC operating point |
| `equations` | the selected element's cards plus the circuit's |

The oscilloscope, Bode plot, s-plane, phasor diagram, equation cards, sweep, ghosts and even
predict-then-reveal therefore come for free, and behave exactly as in the lessons.

```
web/src/atelier/
  bench.svelte.ts      bench state: elements, wires, probes, selection, undo/redo, save
  netlist.ts           wires → nodes (union-find), ports → node ids, checks
  compile.ts           netlist → Experiment (params, signals, model, specs)
  engine/emt.ts        nodal EMT solver (below)
  engine/ac.ts         complex nodal solve at one frequency: phasors, Bode, impedance scan
  engine/modal.ts      poles and participation from the EMT step map
  engine/harmonics.ts  FFT, THD, harmonic table against EN 50160 / IEEE 519
  library/*.ts         one file per family; each element = ports + params + stamps + formulas + icon
  ui/                  Canvas, Library, Inspector, Dock, FormulaPanel, Wire, Probe
```

### 10.3 The solver: one drawing, three analyses

- **EMT (time domain).** This is the method of EMTP and of G2ELin's EMT solver.
  - Each element becomes a conductance plus a history current source (trapezoidal companion
    models, Dommel).
  - Each step solves `G·v = i_hist + i_src` by LU. The factorisation is reused while the topology
    and the switch states do not change.
  - Ideal voltage sources use modified nodal analysis.
  - After a switching event, two half steps of backward Euler remove trapezoidal chatter (CDA).
  - The step is chosen automatically from the smallest time constant, the switching frequency and
    50 Hz. It can be overridden.
- **AC (frequency domain).** The same stamps with $j\omega$ give the complex nodal matrix. It
  yields:
  - the phasor steady state at 50 Hz (phasor diagram, wattmeter);
  - any transfer function (Bode);
  - the impedance seen at any node (impedance scan, to find resonances as in 1.4, 6.4 and 8.6).
- **Small signal (poles).** The EMT step of a linear(ised) circuit is a linear map
  $x_{k+1} = M x_k$ on the history states. Its eigenvalues $z$ map exactly to continuous poles by
  the inverse Tustin transform $s = \frac2h\,\frac{z - 1}{z + 1}$.
  - This gives the poles of **any** circuit drawn on the bench, without writing state equations
    by hand.
  - It also gives participation factors that can be painted back onto the elements: click a pole,
    and the inductors and capacitors that make it light up (the 8.8 idea, on the learner's own
    circuit).
- **RMS power flow** for three-phase grids: the same drawing is read as buses and branches and
  solved by the existing Newton–Raphson. The EMT and RMS answers can be compared, as in 8.9.
- Machines, motors and averaged converters are interfaced as Norton (or Thevenin) equivalents.
  Their internal states are integrated with the same step (a one-step interface, standard
  practice).
- Control blocks (gain, PI, integrator, limiter, sum, PLL, measurement, PWM) form a signal domain,
  solved explicitly after each network step. This allows building a converter control from
  blocks.
- Long runs go in a Web Worker so the interface stays fluid. Dense LU up to about 150 nodes is
  enough for teaching circuits.

### 10.4 Library (each element: icon, ports, parameters, stamps, formulas)

| Family | Elements |
|---|---|
| Sources | DC, AC (amplitude, f, phase), step, ramp, pulse, three-phase source with impedance (SCR), current source, controlled sources |
| Passives | R, L (with optional saturation), C, series RLC, coupled inductors, ground |
| Switches & semiconductors | timed switch/breaker, diode, thyristor (firing angle), IGBT/MOSFET with gate signal, H-bridge and three-phase bridge |
| Machines | synchronous machine (classical and 6th order, AVR, governor, PSS), induction motor, DC motor |
| Grid | line (π and Bergeron travelling-wave), cable, transformer (single and three-phase, tap, saturation), ZIP and motor loads, fault (type, resistance, timing), capacitor bank, shunt reactor, series capacitor, SVC/STATCOM |
| Converters & IBR | buck, boost, buck-boost, thyristor rectifier, VSC averaged and switched with L/LCL filter, GFL and GFM control, PV array with MPPT, BESS, type-4 wind turbine, MMC (averaged) |
| Control | gain, sum, PI, integrator, first order, limiter, comparator, PLL, abc/dq, PWM modulator |
| Instruments | oscilloscope probe, multimeter, wattmeter (P, Q, S, pf), THD analyser, Bode input/output markers, impedance probe, frequency/RoCoF meter |
| Templates | every lesson circuit that maps to a netlist (1.2, 1.4, 2.2–2.4, 4.2, 6.1–6.4, 7.1, 8.6…), plus classic benches (RLC filter, LCL inverter, SMIB, two-area grid) |

Three-phase elements carry three-conductor ports, drawn as one line with a "///" mark
(single-line style). They expand to three nodes in the netlist.

### 10.5 Innovations

1. **Instruments are physical.** The learner drags a scope probe onto a wire, as on a real bench.
   Probes are colour-coded, and each trace takes its probe's colour.
2. **The circuit is alive.**
   - Live values on every wire at the time cursor.
   - Moving dots whose speed follows the current.
   - Power-flow arrows.
   - Overloaded elements turn red.
3. **One drawing, three solvers.** EMT, phasor/RMS and small-signal results side by side, with the
   differences explained (8.9 on your own circuit).
4. **Poles you can click.** Inverse-Tustin modal analysis of any circuit. Clicking a pole
   highlights the elements that participate in it.
5. **Impedance scan** at any node. Resonances are marked, and the elements that form them named.
6. **See the matrix.** For small circuits, the nodal matrix and the companion sources are written
   out live, so "how does a simulator work?" has a visible answer.
7. **Predict, then run**, in free mode too: sketch the expected trace on the scope before ▶.
8. **Challenges**, for example "design an LCL filter so that THD < 5 %" or "keep the frequency
   above 49.2 Hz with the least battery".
   - A challenge is a template with locked elements and a goal.
   - Checks reuse the step-check mechanism.
9. **Lessons ↔ Atelier.** An "Ouvrir dans l'Atelier" button on every lesson whose circuit maps to
   a netlist. The lesson's parameters come along.
10. **Plain-language diagnostics**, for example:
    - "node 3 is floating: connect it or add a ground";
    - "two ideal voltage sources in parallel";
    - "this step is too large for the 2 µs time constant of C2".
11. **Typed units and presets** (`4,7µ`, `20 kV`, "câble 240 mm² Al").
12. **Share without a server.**
    - A project fits in the URL (compressed JSON).
    - Projects can also be exported and imported as a file.
    - Several projects are kept in the browser.

### 10.6 Phases

| Phase | Content | Done when |
|---|---|---|
| **A0** | Mode switch, canvas (grid, pan, zoom), library panel, drag and drop, ports and orthogonal wires, selection, inspector with unit-aware inputs, undo/redo, local save, URL share | A circuit can be drawn, edited, saved and reopened |
| **A1** | Netlist and nodal EMT solver (R, L, C, sources, switch, ground), probes, oscilloscope via the dynamic Experiment, formula panel, diagnostics, templates 1.2 and 1.4 | The bench reproduces lessons 1.2 and 1.4 to within 0.1 % (unit tests) |
| **A2** | AC solve (phasors, Bode, impedance scan); inverse-Tustin poles with participation; THD analyser; multimeter and wattmeter | Bode and poles match the closed forms of 1.4 and 3.1; the THD of a square wave is 48.3 % |
| **A3** | Diode, thyristor, IGBT with PWM, CDA, transformer with saturation; chopper, rectifier, PWM and LCL templates | Matches lessons 6.1–6.4 |
| **A4** | Three-phase library: sources with SCR, lines (π, Bergeron), transformers, ZIP loads, faults, breakers, synchronous machine, induction motor; RMS power flow on the same drawing | Matches 4.1, 4.4, 4.8, 5.1 and 8.1 |
| **A5** | Control blocks; averaged VSC with GFL/GFM control, PV with MPPT, BESS, wind, MMC | Matches 7.1, 7.2, 7.5 and 8.5 |
| **A6** | Lessons ↔ Atelier, challenges, predict-then-run, docs, smoke test, phone layout | Every template and challenge passes the smoke test |

Every phase adds unit tests that compare the bench with the lesson models already validated, so
the lessons double as the Atelier's test suite.

### 10.7 Risks

- **Scope:** the library is large; each phase must be usable on its own.
- **Numerics:**
  - trapezoidal chatter after switching (handled by CDA);
  - stiff circuits (automatic step and warnings);
  - algebraic loops in control (one-step delay, stated in the diagnostics).
- **Usability of wiring:**
  - snapping and automatic orthogonal routing;
  - wires that follow moved elements;
  - probes dropped on wires rather than on hard-to-hit nodes.
