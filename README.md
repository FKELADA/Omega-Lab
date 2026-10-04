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
| `npm test` | Solver and model unit tests (closed forms, energy conservation, eigenvalues, RMS, phasors) |
| `npm run check` | Svelte + TypeScript type check |
| `npm run smoke` | Walks every lesson in a real Chrome (needs `npm run dev` running) |
| `node tests/shots.mjs <dir>` | Screenshots every lesson, for visual review |
| `npm run build` | Static build into `web/dist/` |

## Status

Eleven lessons are complete (Modules 1 and 2), in French and English. Open one directly with its number in the URL,
e.g. `http://localhost:5173/#1.4`.

| Lesson | What the learner does | Signature instrument |
|---|---|---|
| **1.2 RLC transients** | Predicts the step response, finds critical damping, watches energy move between L and C | s-plane with root locus, energy balance |
| **1.3 AC sources and RMS** | Predicts p(t) for a 1 kW heater, finds the DC equivalent (230 V), fools an average-responding meter | Glowing heater, true-RMS vs average meters |
| **1.4 Resonance** | Watches the transient lock onto the phasor solution, tunes to f₀, gets Q·V across C | Clickable frequency response, rotating phasor diagram |
| **2.1 Euler** | Predicts the sum of two sinusoids, turns the Euler helix, adds and cancels phasors, previews three-phase | 3D Euler helix |
| **2.2 Phasors and impedance** | Predicts the current in an inductor, compares R, L and C, finds the 45° corner of an RL circuit | Impedance plane with the Z triangle and its frequency locus |
| **2.3 AC power** | Predicts p(t) for a motor (it goes negative), splits it into active and reactive parts, corrects the power factor, overcompensates | Power triangle, cos φ dial, cable-loss meter |
| **2.4 Three-phase** | Predicts the total power of three heaters (constant), unbalances the loads, breaks the neutral | Clickable neutral switch, phase-balance meter with ±10 % band |
| **2.5 Clarke and Park** | Predicts v_d in the synchronous frame (constant), aligns d like a PLL, sees unbalance as 2f and the 5th harmonic as 6f | Fixed αβ plane and a camera riding the dq frame |
| **2.6 Per-unit** | Changes the base, loads the feeder out of the ±5 % band, recovers with the tap changer and the power factor | One-line diagram across 11/132/33 kV, bases per zone, voltage profile |
| **2.7 Harmonics** | Builds a square wave, meets Gibbs, compares the triangle, finds the 6k±1 rectifier spectrum, listens to timbre | Fourier epicycles, spectrum with THD and audio |
| **2.8 Symmetrical components** | Rebalances, swaps two phases, isolates the zero sequence, analyses a phase-to-ground fault, hits the 2 % limit | Positive/negative/zero wheels with fault presets |

Shared by every lesson:

- **Layout:** each experiment declares its own canvas and instruments. Lessons are addressed by
  URL, and the last step links to the next lesson.
- **Live equations:** colour-coded KaTeX terms with live numbers, term-size bars and derivations
  on demand. Hovering any term highlights it everywhere.
- **Oscilloscope:** probes, frozen ghost traces, sweep fans, predict-then-reveal with scoring and
  misconception feedback.
- **Profiles:** Learner, Researcher and Engineer, each with their own equation cards.
- **Client solver:** exact ZOH discretisation via the matrix exponential. Sinusoidal sources are
  extra oscillator states, so AC simulations are exact too.

## Layout

```
web/src/
  lib/core/        linear algebra, LTI simulation (expm discretisation)
  lib/models/      models behind a common interface (RLC step, RLC AC, waveforms, phasors,
                   impedance, power, three-phase, Park, per-unit, Fourier, sequences;
                   G2ELin-backed models later)
  lib/lab/         lesson format (types.ts), shared experiment state, lesson + parameter panels
  lib/instruments/ oscilloscope, s-plane, energy balance, frequency response, phasor diagram,
                   live equations
  lib/canvas/      circuit schematics
  lib/ui/          i18n, formatting, markdown + math, top bar, course map
  lessons/         curriculum.ts (course map) and one folder per lesson, with any
                   lesson-specific panels (heater, meters, Euler helix, impedance plane,
                   power triangle, three-phase schematic, phase balance)
```

## Adding a lesson

1. Write (or reuse) a model in `lib/models/` that implements `Model`.
2. Create `lessons/<id>/experiment.ts` that exports an `Experiment`: parameters, signals,
   equations, steps, an optional prediction, and its `canvas` and `instruments`, all with
   `{ fr, en }` text.
3. Point the matching entry in `lessons/curriculum.ts` at it.

Lesson content is data. The interface code does not change when you add a lesson. A lesson that
needs a new drawing or panel keeps it in its own folder.
