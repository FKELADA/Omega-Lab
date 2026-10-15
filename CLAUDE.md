# Omega Lab

Interactive course on electrical power systems, from RLC circuits to grid stability (67 lessons, French and English). Svelte + TypeScript + Vite, published on GitHub Pages: https://fkelada.github.io/Omega-Lab/

Design and roadmap: `plan.md`. Technical documentation: `documentation.md`.

## Commands (run from `web/`)

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server (Vite default port 5173) |
| `npm test` | Vitest unit tests: solver, models, and completeness of teaching notes and step explanations |
| `npm run check` | Svelte + TypeScript type check |
| `npm run smoke` | Walks every lesson in a real Chrome. Needs `npm run dev` running. |
| `node tests/shots.mjs <dir>` | Screenshots of every lesson, for visual review |
| `npm run build` | Static build into `web/dist/` (`BASE=/Omega-Lab/` for the Pages sub-path) |

Before committing: `npm run check && npm test`. CI (`.github/workflows/deploy.yml`) runs both, then deploys on every push to `main`.

## Where things are

- `web/src/lessons/`: the lessons. `web/src/lib/`: `core` (solver), `models`, `instruments`, `lab`, `canvas`, `ui`.
- `web/src/data/`: includes data baked from G2ELin.
- `web/scripts/bake-*.py`: regenerate that data using G2ELin's Python environment at `../../G2ELin/python/.venv` (G2ELin must stay next to this repo).

## Rules

- **This repo is public.** `slides/` (Beamer decks built on a corporate template) and the PGM `.pdf`/`.pptx` files at the root stay local: never commit or push them. Review `git status` before every `git add`.
- Every lesson needs its teaching notes and step explanations: the tests enforce it.
- Physics must stay consistent with closed forms (energy conservation, eigenvalues, phasors). Add a test whenever you add a model.
