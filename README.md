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

## Coin gate and play time

Play games need play time; Learn games are always free. Kids earn coins from stars on their
learning sites (Viraj's Math Quest, Vihaan's Quest) and trade them there for a 6-character
code, which they type into BrainPlay (home page, or the screen a Play game shows when time runs
out). A good code adds its minutes to this device's play time, which counts down only while a
Play game is on screen. Each code works once, and only on the day it was made.

- `src/lib/playcode.ts`: code check, a copy of the learning sites' `js/playcode.js`
  (format documented at the top of the file).
- `src/lib/playgate.ts`: gate state in localStorage (on/off, play time left, parent unlock,
  PIN hash, codes used).
- **Parent page** at `#/parent` (link at the bottom of the home page): PIN set on first visit;
  turn the gate on or off, unlock everything for 30 minutes to 4 hours, add or clear play time,
  see codes used. The page also shows the **parent code** (`PARENT_CODE` in
  `src/lib/playgate.ts`), which works every time in any code box and opens every game for an hour.
- **Offline:** `public/sw.js` saves the whole site on first visit (file list in
  `precache.json`, written at build time by the plugin in `vite.config.ts`), so games, codes
  and the parent page all work with no internet, e.g. on a flight. Open the site once while
  online first.

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
