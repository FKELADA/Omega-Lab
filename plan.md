# Omega Lab — plan

> **Du circuit RLC à la stabilité des réseaux. From RLC circuits to grid stability.**
>
> An interactive learning tool on electrical power systems, for learners, researchers and
> utility engineers. Under the hood it uses the G2ELin engine (`C:\Users\kelad\G2ELin\python`)
> for its stability computations, but it is a separate product with its own name.

---

## Status (4 October 2026)

**Modules 0 to 5 are built: 31 lessons, in French and English.** Code is on
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
| 4.2 Transformers | ✅ Done | `2e3694f` |
| 4.3 Synchronous machine | ✅ Done | `2e3694f` |
| 4.4 Loads | ✅ Done | `2e3694f` |
| 4.5 Induction motor | ✅ Done | `2e3694f` |
| 4.6 Shunt and series compensation | ✅ Done | `2e3694f` |
| 4.7 FACTS | ✅ Done | `2e3694f` |
| 5.1 Y-bus and power flow | ✅ Done | `M5` |
| 5.2 P–V and Q–V curves | ✅ Done | `M5` |
| 5.3 Faults | ✅ Done | `M5` |
| 5.4 Economic dispatch | ✅ Done | `M5` |
| 5.5 A day on a feeder | ✅ Done | `M5` |
| Modules 6–8 | Not started | — |

**Verification:** 161 unit tests (solver, models, note completeness), and a browser test that walks
all 31 lessons, the documentation page and the teaching notes (114 checks: predictions, misconception feedback, every step check, both languages, phone width,
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
  curves, SVC/STATCOM controllers), not G2ELin's `sm.py`. Deferred from the plan:
  - the travelling-wave animation;
  - tap changers and phase shifters;
  - the generator's dq model and its fidelity slider, AVR, governor and PSS (better placed with
    Module 8 on G2ELin);
  - TCSC and UPFC as simulations (they appear as equation cards only).
- **Module 5** runs entirely in the browser on a new power-flow core (Y-bus, Newton–Raphson with
  reactive limits, Gauss–Seidel, DC flow).
  - The time-series power flow (5.5) is a client-side 20 kV feeder, not G2ELin's `timeseries`.
  - Economic dispatch (5.4) is a DC-OPF on three buses.
  - The Y-bus animation is a step-by-step builder.
  - The NR "mismatch surface" became a replay of the network iteration by iteration, with a
    convergence chart.

### Next

1. **P2:** connect the G2ELin API for Module 8.
2. **Module 6**, power electronics fundamentals (choppers, rectifiers, PWM, averaged models).

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
│ Concept map ▸ Module 4.3 Synchronous machine    [Learner|Research|Utility] │
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

✅ Built as seven lessons: 4.1 lines (models, Ferranti, SIL) · 4.2 transformers (inrush, efficiency) · 4.3 synchronous machine (short circuit, excitation, capability) · 4.4 loads (ZIP, recovery, CVR) · 4.5 induction motor (start-up, FIDVR stall) · 4.6 compensation (nose curve) · 4.7 SVC versus STATCOM. See "What changed from the plan" for the parts deferred.

- **4.1 Lines:**
  - distributed → π model
  - SIL and the Ferranti effect
  - a travelling-wave animation
  - a short / medium / long slider
  - an "is the π-model valid?" frequency check
- **4.2 Transformers:**
  - ideal → real
  - magnetisation and the B-H curve
  - inrush
  - tap changers and phase shifters
  - vector groups (clock diagram)
- **4.3 Synchronous generator** (reuses G2ELin's `sm.py`):
  - rotating field animation and the dq model
  - the hierarchy of models (classical → 4th → 6th order via the fidelity slider)
  - capability curve
  - P–δ curve with the operating point as a draggable cursor
  - swing equation
  - exciter/AVR, governor, PSS
- **4.4 Loads:** ZIP, exponential, dynamic loads, and voltage sensitivity.
- **4.5 Induction motor:** torque–slip curve with a cursor, start-up, stalling, and why induction
  motors drive FIDVR.
- **4.6 Shunt and series compensation:** capacitor banks, reactors, series capacitors (setting up
  SSR).
- **4.7 FACTS:** SVC, STATCOM, TCSC, UPFC, compared on a common V–I characteristic.

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
