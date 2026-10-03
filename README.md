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

Four lessons are complete, in French and English. Open one directly with its number in the URL,
e.g. `http://localhost:5173/#1.4`.

| Lesson | What the learner does | Signature instrument |
|---|---|---|
| **1.2 RLC transients** | Predicts the step response, finds critical damping, watches energy move between L and C | s-plane with root locus, energy balance |
| **1.3 AC sources and RMS** | Predicts p(t) for a 1 kW heater, finds the DC equivalent (230 V), fools an average-responding meter | Glowing heater, true-RMS vs average meters |
| **1.4 Resonance** | Watches the transient lock onto the phasor solution, tunes to f₀, gets Q·V across C | Clickable frequency response, rotating phasor diagram |
| **2.1 Euler** | Predicts the sum of two sinusoids, turns the Euler helix, adds and cancels phasors, previews three-phase | 3D Euler helix |

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
  lib/models/      models behind a common interface (RLC step, RLC AC, waveforms, phasors;
                   G2ELin-backed models later)
  lib/lab/         lesson format (types.ts), shared experiment state, lesson + parameter panels
  lib/instruments/ oscilloscope, s-plane, energy balance, frequency response, phasor diagram,
                   live equations
  lib/canvas/      circuit schematics
  lib/ui/          i18n, formatting, markdown + math, top bar, course map
  lessons/         curriculum.ts (course map) and one folder per lesson, with any
                   lesson-specific panels (heater, meters, Euler helix)
```

## Adding a lesson

1. Write (or reuse) a model in `lib/models/` that implements `Model`.
2. Create `lessons/<id>/experiment.ts` that exports an `Experiment`: parameters, signals,
   equations, steps, an optional prediction, and its `canvas` and `instruments`, all with
   `{ fr, en }` text.
3. Point the matching entry in `lessons/curriculum.ts` at it.

Lesson content is data. The interface code does not change when you add a lesson. A lesson that
needs a new drawing or panel keeps it in its own folder.
