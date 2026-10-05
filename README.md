# Omega Lab

*Du circuit RLC à la stabilité des réseaux. From RLC circuits to grid stability.*

An interactive learning tool for electrical power systems. See [plan.md](plan.md) for the full
design and roadmap.

## Run it

```powershell
cd web
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm test` | 357 unit tests: solver, models and teaching-note and step-explanation completeness (closed forms, energy conservation, eigenvalues, RMS, phasors, margins, swing equation, PLL, frequency events, HVDC, lines, inrush, short circuit, loads, motor stall, nose curve, FACTS, Newton–Raphson, faults, dispatch, feeder, converters, IBRs, every Module 8 stability step, and the baked G2ELin data) |
| `npm run check` | Svelte + TypeScript type check |
| `npm run smoke` | Walks all 51 lessons, the documentation page, the teaching notes and the zoom window in a real Chrome (needs `npm run dev` running) |
| `node tests/shots.mjs <dir>` | Screenshots every lesson, for visual review |
| `npm run build` | Static build into `web/dist/` |

## Status

Fifty-one lessons are complete (Modules 0–8), in French and English, plus the **Atelier**, a free-style bench (`#atelier`): drag components, wire them, simulate with a nodal EMT solver, and analyse: oscilloscope, Bode, impedance scan, phasors, clickable poles that light up the elements making them, harmonic analyser and power measurements. Lessons 8.8 and 8.9 show G2ELin results
baked into the app (`web/scripts/bake-g2elin.mjs` and `bake-shapes.py` regenerate them from a local G2ELin). Open one directly with its number in the URL,
e.g. `http://localhost:5173/#1.4`.

| Lesson | What the learner does | Signature instrument |
|---|---|---|
| **0.1 A day on the grid** | Predicts daily demand, picks a transmission voltage, meets the solar duck curve, balances the day | Plant-to-socket chain with energy flow, 24 h stacked chart, losses per voltage |
| **0.2 Replay a blackout** | Predicts the frequency after a 1 GW trip, replays the 2019 GB cascade, lowers inertia, fixes protection settings | Frequency meter, event timeline, nadir versus inertia |
| **1.1 R, L, C as energy elements** | Predicts an inductor's voltage for a triangle current, stores and returns energy, cuts a current abruptly | Energy tank with a reversing power arrow, energy meter |
| **1.2 RLC transients** | Predicts the step response, finds critical damping, watches energy move between L and C | s-plane with root locus, energy balance |
| **1.3 AC sources and RMS** | Predicts p(t) for a 1 kW heater, finds the DC equivalent (230 V), fools an average-responding meter | Glowing heater, true-RMS vs average meters |
| **1.4 Resonance** | Watches the transient lock onto the phasor solution, tunes to f₀, gets Q·V across C | Clickable frequency response, rotating phasor diagram |
| **1.5 DC versus AC** | Compares AC and DC at the same insulation, finds the break-even distance, hits the AC cable limit | AC and DC corridors, cost versus distance, usable AC current |
| **2.1 Euler** | Predicts the sum of two sinusoids, turns the Euler helix, adds and cancels phasors, previews three-phase | 3D Euler helix |
| **2.2 Phasors and impedance** | Predicts the current in an inductor, compares R, L and C, finds the 45° corner of an RL circuit | Impedance plane with the Z triangle and its frequency locus |
| **2.3 AC power** | Predicts p(t) for a motor (it goes negative), splits it into active and reactive parts, corrects the power factor, overcompensates | Power triangle, cos φ dial, cable-loss meter |
| **2.4 Three-phase** | Predicts the total power of three heaters (constant), unbalances the loads, breaks the neutral | Clickable neutral switch, phase-balance meter with ±10 % band |
| **2.5 Clarke and Park** | Predicts v_d in the synchronous frame (constant), aligns d like a PLL, sees unbalance as 2f and the 5th harmonic as 6f | Fixed αβ plane and a camera riding the dq frame |
| **2.6 Per-unit** | Changes the base, loads the feeder out of the ±5 % band, recovers with the tap changer and the power factor | One-line diagram across 11/132/33 kV, bases per zone, voltage profile |
| **2.7 Harmonics** | Builds a square wave, meets Gibbs, compares the triangle, finds the 6k±1 rectifier spectrum, listens to timbre | Fourier epicycles, spectrum with THD and audio |
| **2.8 Symmetrical components** | Rebalances, swaps two phases, isolates the zero sequence, analyses a phase-to-ground fault, hits the 2 % limit | Positive/negative/zero wheels with fault presets |
| **3.1 Poles and zeros** | Predicts a lightly damped response, drags poles into a design target, meets a right-half-plane zero | Draggable s-plane with the target region, measured performance table |
| **3.2 Bode and Nyquist** | Shrinks the margins, crosses into instability, tunes for 45° PM, trades accuracy for stability | Block diagram, Bode with margins, Nyquist around −1, root locus |
| **3.3 State space and linearisation** | Predicts a generator's swing, compares linear and nonlinear models, loses synchronism, weakens the grid | Rotor-angle dial, P–δ curve with the tangent, phase portrait |
| **3.4 PI control and the PLL** | Predicts the frequency spike after a phase jump, tunes bandwidth, P versus PI, windup and anti-windup | PLL block diagram, phase tracker |
| **4.1 Transmission lines** | Predicts the far-end voltage of an unloaded line (Ferranti), loads it at SIL, overloads it, compares short, π and exact models | Voltage profile along the line, three-model table |
| **4.2 Transformers** | Predicts the inrush current, switches at the right instant, meets residual flux, finds the efficiency peak | Saturating core, magnetising curve, efficiency versus load |
| **4.3 Synchronous machine** | Predicts a terminal short circuit, finds the DC offset, over- and under-excites, reaches the stability limit | Phasor diagram, capability chart, V-curves |
| **4.4 Loads** | Predicts consumption after a voltage step, compares Z, I and P loads, watches load recovery, estimates CVR savings | P–V and I–V curves, load composition |
| **4.5 Induction motor** | Predicts the starting current, fails to start a heavy load, stalls a compressor in a dip (FIDVR), lets a fan ride through | Torque–speed and current–speed curves, turning rotor |
| **4.6 Compensation** | Drops the voltage with load, restores it with a shunt capacitor, overshoots at night, adds series compensation, collapses past the nose | Nose curve, P_max versus series compensation |
| **4.7 FACTS** | Compares an SVC and a STATCOM in a dip, deepens it, strengthens the grid, sizes the STATCOM | Side-by-side systems, V–I characteristics, Q_max versus V |
| **5.1 Y-bus and power flow** | Predicts Newton–Raphson's convergence, builds Y line by line, trips a line, pushes the load until there is no solution | Network replayed iteration by iteration, Y matrix, NR versus Gauss–Seidel |
| **5.2 P–V and Q–V curves** | Predicts the voltage as load rises, finds the nose, hits a generator's reactive limit, adds a capacitor, loses a line, reads the reactive margin | Load-level cursor, P–V curve, Q–V curve |
| **5.3 Faults** | Predicts a fault current, compares fault types, isolates the neutral, finds a ground fault larger than three-phase, adds fault resistance | Sequence-network connections, fault phasors, current versus distance |
| **5.4 Economic dispatch** | Predicts the price over a day, calls the peaker, checks equal marginal costs, congests a line, adds solar until it is curtailed | Three-bus network with nodal prices, merit order, marginal-cost curves |
| **5.5 A day on a feeder** | Predicts the feeder-end voltage with PV, finds reverse flow and overvoltage, compares Q(V), the tap changer and curtailment | Feeder with voltage bars, daily profile envelope, hosting capacity by control |
| **8.1 Transient stability** | Predicts the rotor angle after a fault, exceeds the critical clearing time, sits just below it, adds inertia, unloads, moves the fault | Equal-area chart with both areas, IEEE/CIGRE classification tree |
| **8.2 Small-signal stability** | Predicts a growing swing, softens the AVR, tunes a PSS to 15 %, checks it on a weak link | Heffron–Phillips block diagram, s-plane, damping versus AVR gain |
| **8.3 Voltage stability** | Predicts the HV voltage after a line trip, watches the tap changer drag it down, blocks it, adds capacitors, meets thermostats | Radial supply with OLTC, P–V curves with the trajectory |
| **8.4 Frequency stability** | Predicts the frequency after a 1.3 GW trip, replaces machines by inverters until shedding and RoCoF trips, fixes it with batteries or grid-forming | Fleet bar and frequency gauge, nadir and RoCoF versus inverter share |
| **8.5 Converter-driven stability** | Predicts a GFL plant on a weak grid, slows the PLL, strengthens the grid, curtails, finds the minimum SCR | Stability boundary (SCR versus PLL bandwidth), slow eigenvalues |
| **8.6 Resonance stability** | Predicts a shaft's torsion on a compensated line, detunes, finds another resonance, tries mechanical damping, installs a TCSC | Twisting shaft masses, growth rate and frequency-coincidence charts |
| **8.7 Inter-area oscillations** | Predicts a distant machine's swing, reads inter-area and local mode shapes, weakens and loads the tie, damps the mode | Two-area mode-shape bars, s-plane, inter-area frequency versus tie |
| **8.8 Modes and participation** | Finds inter-area, local and control modes on G2ELin's Kundur, WSCC 9-bus (with inverters) and IEEE 39-bus models, sees the classical model go unstable | Mode table, participation factors, mode shape on the network map |
| **8.9 Model reduction** | Steps down from full EMT to RMS and 6th/4th/3rd-order and classical machines, compares with EMT and the linearised response | Model ladder, eigenvalues on log scales, damping and size versus level |

Shared by every lesson:

- **Teaching notes:** an ⓘ next to every module and lesson (course map and lesson panel) opens a
  plain-language note: what the lesson is about, its objective, each formula in words, the
  objective of each exercise, and what each automated test guarantees.
- **Documentation in the app:** `#docs` (📖 in the top bar) renders [documentation.md](documentation.md).

- **Layout:** each experiment declares its own canvas and instruments. Lessons are addressed by
  URL, and the last step links to the next lesson.
- **Live equations:** colour-coded KaTeX terms with live numbers, term-size bars and derivations
  on demand. Hovering any term highlights it everywhere.
- **Oscilloscope:** probes, frozen ghost traces, sweep fans, predict-then-reveal with scoring and
  misconception feedback.
- **Hints and explanations:** every guided step has a hint, and once done, a full explanation with its formula.
- **Enlarge and zoom:** every panel opens live in a large window; charts zoom and pan.
- **Profiles:** Learner, Researcher and Engineer, each with their own equation cards.
- **Client solver:** exact ZOH discretisation via the matrix exponential. Sinusoidal sources are
  extra oscillator states, so AC simulations are exact too.

## Layout

```
web/src/
  lib/core/        linear algebra, LTI simulation (expm discretisation), RK4 for nonlinear models,
                   power flow (Y-bus, Newton–Raphson, Gauss–Seidel, DC)
  lib/models/      models behind a common interface (RLC step, RLC AC, waveforms, phasors,
                   impedance, power, three-phase, Park, per-unit, Fourier, sequences,
                   grid elements, converters, IBRs, stability; g2data.ts reads the baked
                   G2ELin results in src/data/g2elin)
  lib/lab/         lesson format (types.ts), shared experiment state, lesson + parameter panels
  lib/instruments/ oscilloscope, s-plane, energy balance, frequency response, phasor diagram,
                   live equations, x–y characteristic charts (XYChart)
  lib/canvas/      circuit schematics
  lib/ui/          i18n, formatting, markdown + math, top bar, course map
  lessons/         curriculum.ts (course map) and one folder per lesson, with any
                   lesson-specific panels (heater, meters, Euler helix, impedance plane,
                   power triangle, three-phase schematic, phase balance, line, transformer,
                   machines, loads, compensation, FACTS, power-flow networks, faults,
                   dispatch, feeder, converters, IBRs, stability tree, mode table,
                   participation, mode shape, model ladder)
```

## Adding a lesson

1. Write (or reuse) a model in `lib/models/` that implements `Model`.
2. Create `lessons/<id>/experiment.ts` that exports an `Experiment`: parameters, signals,
   equations, steps, an optional prediction, and its `canvas` and `instruments`, all with
   `{ fr, en }` text.
3. Point the matching entry in `lessons/curriculum.ts` at it.

Lesson content is data. The interface code does not change when you add a lesson. A lesson that
needs a new drawing or panel keeps it in its own folder.
