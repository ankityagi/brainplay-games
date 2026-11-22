# BrainPlay Games

17 free browser games with no sign-up required, hosted at `games.ankityagi.online`.
Progress and play-time state are saved per-browser in `localStorage`, and the whole site works offline once visited online.

## Games

### Learn (always free)

| Game | Stages | What it tests |
| --- | --- | --- |
| 🔢 Math Blitz (`math`) | 10 stages | Arithmetic quiz, from single-digit addition to mixed operations with negatives |
| 🌍 Geo Explorer (`geography`) | 10 stages | World capitals quiz with flags and LRU country rotation |
| 🗺️ World Map (`map`) | 10 stages | Click the target country on an interactive SVG world map with distance warmth feedback |
| 🧩 Pattern Master (`logic`) | 10 stages | Number and shape sequence logic puzzles |
| 💻 Code Quest (`coding`) | 10 stages | "What does this code print?" programming puzzles |
| #️⃣ Sudoku (`sudoku`) | 10 stages | Mini 4×4 and 6×6 puzzles scaling up to classic 9×9 grids |

### Play (uses play time when coin gate is on)

| Game | Levels / Stages | Description |
| --- | --- | --- |
| ♟️ Chess Puzzles (`chess`) | 10 stages | Find checkmate in one move (every puzzle verified with `chess.js`) |
| 🐍 Snake (`snake`) | 10 stages | Grid-based arcade classic — faster speed, bigger board, more obstacles each stage |
| 🚀 Math Blaster (`blaster`) | 10 stages | Turret arcade shooter — shoot the drifting cloud matching the math problem |
| 🦖 Dinosaur Chaos (`dino`) | 10 stages | Eat smaller dinos and dodge bigger ones while solving math encounters |
| 🤖 RoboShooter (`roboshooter`) | 10 stages | First-person arcade shooter against approaching robots with math reloads |
| 🏎️ Zoom Valley (`racing`) | 4 levels (embedded) | 3D Three.js racer with 5 cars, 2 tracks (incl. Seashell Coast), computer rivals, and 2-player split screen |
| 🏏 Boundary Bash (`cricket`) | 3 levels (embedded) | 5-over cricket batting game with named bowlers and shot timing |
| 🦕 Dino Duel (`dinoduel`) | 10 levels (embedded) | Side-view 1P/2P dinosaur fighting game with 10 dinosaurs, Perfect Block parries, best-of-3 rounds, and an apex Level 10 boss |
| 🦖 Dino Truck Rumble (`dinotrucks`) | 6 levels (embedded) | 3D Three.js dino truck racing game with 5 trucks and per-truck attacks |
| 🍬 Jelly Jam (`jellyjam`) | 10 levels (embedded) | Falling jelly-shapes puzzle game with Fizz Pop bombs and endless mode |
| 🏀 Court Kings (`basketball`) | 6 levels + drills (embedded) | 3D Three.js 3v3 basketball with shot timing, catch-and-shoot passing, ankle-breaker crossovers, and 3 skill drills |

## Coin gate and play time

Play games need play time; Learn games are always free. Kids earn coins from stars on their
learning sites (Viraj's Math Quest, Vihaan's Quest) and trade them there for a 6-character
code, which they type into BrainPlay (home page, or the screen a Play game shows when time runs
out). A good code adds its minutes to this device's play time, which counts down only while a
Play game is on screen. Each code works once, and only on the day it was made.

- `src/lib/playcode.ts`: offline Crockford base32 + HMAC-SHA256 code check, kept in sync with the
  learning sites' `js/playcode.js` (format documented at the top of the file).
- `src/lib/playgate.ts`: gate state in `localStorage` (`brainplay:gate`: on/off, play time left,
  parent unlock, PIN hash, codes used).
- **Parent page** at `#/parent` (link at the bottom of the home page): PIN set on first visit;
  turn the gate on or off, unlock everything for 30 minutes to 4 hours, add or clear play time,
  see codes used. The page also shows the **parent code** (`PARENT_CODE` in
  `src/lib/playgate.ts`), which works every time in any code box and opens every game for an hour.
- **Offline:** `public/sw.js` saves the whole site on first visit (file list in
  `precache.json`, written at build time by the plugin in `vite.config.ts`), so games, codes
  and the parent page all work with no internet, e.g. on a flight. Open the site once while
  online first.

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + React Router (`HashRouter`), plus `d3-geo` / `topojson-client` / `world-atlas` for World Map and local vendored `three.min.js` for 3D embedded games. No backend, no authentication — everything runs client-side, React games are code-split and lazy-loaded, and CI deploys `dist/` to GitHub Pages on pushes to `main`.

## Development

```bash
npm install
npm run dev        # start dev server
npm run test       # run Vitest unit tests (registry, embedded games, playgate, progress, scoring, rotation, chess, map, sudoku)
npm run lint       # eslint
npm run build      # production build (also generates dist/precache.json)
npm run preview    # preview the production build
```

## Architecture

- `src/lib/types.ts`, `src/lib/games.ts`, `src/lib/registry.tsx` — game metadata, shared types, and lazy React component registry
- `src/lib/progress.ts`, `src/lib/scoring.ts`, `src/lib/rotation.ts`, `src/lib/mathProblem.ts` — `localStorage` progress/stars, pass/star thresholds, persisted LRU rotation picker, shared arithmetic problem generator
- `src/lib/playcode.ts`, `src/lib/playgate.ts`, `src/lib/useGate.ts` — coin gate verification, timer state, and React subscription hook
- `src/components/` — shared UI (`HomePage`, `GameIntroPage`, `StagePlayPage`, `GameShell`, `QuizGame`, `EmbeddedGame`, `PlayGate`, `PlayTimeBar`, `CodeEntry`, `ParentPage`, `ResultModal`, `StageSelect`, `Stars`, `TimeLeft`)
- `src/games/<game>/` — React 10-stage games (quiz-based via `QuizGame` or custom interactive loops)
- `public/<game>/` — standalone embedded HTML/JS/Canvas/Three.js games mounted via `EmbeddedGame` iframe; all scripts are self-contained/vendored locally so they work offline

### Adding a new game

- **React 10-stage game:** add `src/games/<id>/` exporting a component matching `GameComponentProps`, add its `GameId` to `src/lib/types.ts`, register its lazy import in `src/lib/registry.tsx`, and add its metadata to `src/lib/games.ts`.
- **Standalone embedded game:** place self-contained static assets (no external script CDNs) in `public/<slug>/index.html`, add its ID to `GameId` and `EmbeddedGameId` in `src/lib/types.ts`, add its metadata with `embedSrc` and `levelsLabel` in `src/lib/games.ts`, and add registry/smoke tests in `tests/games-registry.test.ts`.
