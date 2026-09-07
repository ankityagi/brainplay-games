# BrainPlay Games

Six free browser games, no sign-up required. Each game has 10 stages that get
progressively harder; progress is saved per-browser in `localStorage`.

## Games

| Game | Type | What it tests |
| --- | --- | --- |
| 🔢 Math Blitz | Learn | Arithmetic, from single-digit addition to mixed operations with negatives |
| 🌍 Geo Explorer | Learn | Flags, capitals and continents |
| 🧩 Pattern Master | Learn | Number/shape sequence logic puzzles |
| 💻 Code Quest | Learn | "What does this code print?" style programming puzzles |
| ♟️ Chess Puzzles | Play | Find the checkmate in one move (every puzzle is programmatically verified with chess.js) |
| 🐍 Snake | Play | The arcade classic — faster speed, bigger board, more obstacles each stage |

## Stack

React + TypeScript + Vite + Tailwind CSS + React Router. No backend, no
authentication — everything runs client-side and each game is code-split
and lazy-loaded.

## Development

```bash
npm install
npm run dev       # start dev server
npm run test      # run unit tests (progress store, scoring, chess puzzle bank)
npm run lint       # eslint
npm run build      # production build
npm run preview    # preview the production build
```

## Architecture

- `src/lib/types.ts`, `src/lib/games.ts` — game registry and shared types
- `src/lib/progress.ts` — localStorage-backed stage progress/star tracking
- `src/lib/scoring.ts` — shared pass/star thresholds
- `src/components/QuizGame.tsx` — reusable multiple-choice quiz engine used
  by Math, Geography, Logic, Coding and Chess
- `src/games/<game>/` — per-game stage configs and question/puzzle generators
- `src/games/snake/` — custom grid-based game loop (not quiz-based)

Adding a new game means adding a `src/games/<id>/` folder with a component
matching `GameComponentProps`, registering it in `src/lib/registry.tsx`, and
adding its metadata to `src/lib/games.ts`.
