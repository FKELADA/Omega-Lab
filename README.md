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
| `npm test` | Solver unit tests (closed-form solutions, energy conservation, eigenvalues) |
| `npm run check` | Svelte + TypeScript type check |
| `npm run smoke` | Drives the RLC lesson in a real Chrome (needs `npm run dev` running) |
| `npm run build` | Static build into `web/dist/` |

## Status: P0

P0 is in place, with one complete lesson: **1.2 RLC transients**, in French and English.

- **Layout:** canvas, instruments, live equations, parameter rail, synchronised time cursor.
- **Live equations:** colour-coded KaTeX terms with live numbers, term-size bars and
  derivations on demand. Hovering any term highlights it everywhere.
- **Oscilloscope:** probes, frozen ghost traces, sweep fans, predict-then-reveal with scoring and
  misconception feedback.
- **Instruments:** an s-plane with root locus, and an energy balance.
- **Profiles:** Learner, Researcher (state-space form) and Engineer (switching overvoltage).
- **Client solver:** exact ZOH discretisation via the matrix exponential, so results are exact
  samples at any step size and stiff circuits stay stable.

## Layout

```
web/src/
  lib/core/        linear algebra, LTI simulation (expm discretisation)
  lib/models/      models behind a common interface (rlcSeries; G2ELin-backed models later)
  lib/lab/         lesson format (types.ts), shared experiment state, lesson + parameter panels
  lib/instruments/ oscilloscope, s-plane, energy balance, live equations
  lib/canvas/      circuit schematics
  lib/ui/          i18n, formatting, markdown + math, top bar, course map
  lessons/         curriculum.ts (course map) and one folder per lesson
```

## Adding a lesson

1. Write (or reuse) a model in `lib/models/` that implements `Model`.
2. Create `lessons/<id>/experiment.ts` that exports an `Experiment`: parameters, signals,
   equations, steps and an optional prediction, all with `{ fr, en }` text.
3. Point the matching entry in `lessons/curriculum.ts` at it.

Lesson content is data. The interface code does not change when you add a lesson, except for a
new schematic when the circuit is new.
