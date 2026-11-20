# BrainPlay Games — Repository Context

## Overview

BrainPlay Games is a client-side collection of **16 free browser games** for kids (6 **Learn**, 10 **Play**), deployed to GitHub Pages at `https://games.ankityagi.online` (`public/CNAME`). There is no backend and no authentication; all progress, question rotation, and coin-gate state live in `localStorage`. The site is designed to work **fully offline** (e.g. on flights) after a single online visit.

## Tech Stack & Tooling

- **App:** React 18, TypeScript (`strict: true`), Vite 5, Tailwind CSS 3, React Router 6 (`HashRouter` in `src/main.tsx`)
- **Libraries:** `d3-geo`, `topojson-client`, `world-atlas` (World Map); `chess.js` (devDependency used to verify chess puzzles in tests); local vendored `three.min.js` for 3D embedded games
- **Testing & Lint:** Vitest (`jsdom` environment), ESLint (`@typescript-eslint`, `react`, `react-hooks`)
- **CI/CD:** `.github/workflows/deploy.yml` runs `npm ci`, `npm run lint`, `npm run test`, `npm run build` on Node 20 and deploys `dist/` to GitHub Pages on push to `main`.

### Commands

```bash
npm install
npm run lint      # eslint . --ext .ts,.tsx
npm run test      # vitest run
npm run build     # vite build (also emits dist/precache.json)
npm run dev       # local dev server (SW does not register in dev)
```

## Routing & Core Shell

Routes (`src/App.tsx`, using `HashRouter`):
- `#/` → `HomePage` (play-time bar + Learn/Play game grids + Parent link)
- `#/parent` → `ParentPage` (PIN-gated settings for coin gate, timed free unlock, play-time bank, parent code display, used-code log)
- `#/:gameId` → `GameIntroPage` (stage select for React games; directly renders `PlayGate` → `EmbeddedGame` iframe for embedded games)
- `#/:gameId/stage/:stage` → `StagePlayPage` (lazy-loads React game component inside `GameShell`; wraps in `PlayGate` when `game.category === 'play'`)

## Two Game Architectures

All 16 games are declared in `src/lib/games.ts` (`GAMES`) and typed in `src/lib/types.ts` (`GameId`).

### 1. React 10-Stage Games (11 games)
Live under `src/games/<id>/` and registered via `React.lazy` in `src/lib/registry.tsx` (`GAME_COMPONENTS`). Each default-exported component implements `GameComponentProps` (`{ stage: number; onFinish: ({ passed, stars, score }) => void }`).

- **Learn (6):**
  - `math` (`MathGame.tsx`) — `QuizGame` + `src/lib/mathProblem.ts`
  - `geography` (`GeographyGame.tsx`) — `QuizGame` + `createRotationPicker` (`geography-capitals`)
  - `map` (`MapGame.tsx`) — Interactive SVG map (`d3-geo`/`world-atlas`) + distance warmth feedback + `createRotationPicker` (`map-countries`)
  - `logic` (`LogicGame.tsx`) — `QuizGame` + sequence generators
  - `coding` (`CodingGame.tsx`) — `QuizGame` + code-output templates
  - `sudoku` (`SudokuGame.tsx`) — Custom responsive 4×4 / 6×6 / 9×9 board, mistake-based stars
- **Play (5):**
  - `chess` (`ChessGame.tsx`) — `QuizGame` + `MiniBoard` mate-in-1 puzzles (validated with `chess.js` in `tests/chess-puzzles.test.ts`)
  - `snake` (`SnakeGame.tsx`) — Custom grid arcade loop
  - `blaster` (`BlasterGame.tsx`) — Custom turret/cloud math shooter
  - `dino` (`DinoChaosGame.tsx`) — Custom arena game with math encounters
  - `roboshooter` (`RoboShooterGame.tsx`) — Custom perspective shooter with math reloads

Shared utilities in `src/lib/`:
- `progress.ts` — `localStorage` under `brainplay:progress:<gameId>` (unlocks next stage up to `TOTAL_STAGES = 10`, keeps max stars & best score)
- `scoring.ts` — `PASS_THRESHOLD = 0.6`, `starsForFraction` (60%=1★, 80%=2★, 100%=3★), `difficulty`, `lerp`
- `rotation.ts` — `createRotationPicker` persisted under `brainplay:rotation:<key>` so pools avoid repeats across stages/reloads
- `mathProblem.ts` — shared arithmetic problem & distractor generator

### 2. Standalone Embedded Static Games (5 games, all `play`)
Self-contained HTML/JS pages under `public/<slug>/` rendered inside `EmbeddedGame.tsx` (full-height `<iframe>`, auto-focused on load for keyboard controls). They manage their own levels/menus/canvas/WebGL instead of the 10-stage React shell, declare `embedSrc` and `levelsLabel` in `src/lib/games.ts`, and are listed in `EmbeddedGameId` in `src/lib/types.ts` (excluded from `GAME_COMPONENTS`).

- `racing` — **Zoom Valley** (`/zoom-valley/index.html`, 4 levels, local `three.min.js`, 2 tracks, 5 cars, 2P split screen)
- `cricket` — **Boundary Bash** (`/cricket/index.html`, 3 levels, 5-over cricket batting)
- `dinoduel` — **Dino Duel** (`/dino-duel/index.html`, 10 levels, 1P/2P dino fighter, 10 dinos, Perfect Block parries, best of 3, Level 10 Giganotosaurus boss)
- `dinotrucks` — **Dino Truck Rumble** (`/dino-trucks/index.html`, 6 levels, local `three.min.js`, 5 trucks with unique attacks)
- `jellyjam` — **Jelly Jam** (`/jelly-jam/index.html` + `/jelly-jam/engine.js`, 10 levels + endless, testable pure JS engine)

## Coin Gate, Play Codes & Offline Support

- **Rule:** `category === 'learn'` games are always free. `category === 'play'` games are wrapped in `PlayGate`, which shows `GateScreen` (with `CodeEntry` and links to Viraj's Math Quest and Vihaan's Quest `#coins` pages) when locked, or ticks `spendSeconds(1)` every second while `document.visibilityState === 'visible'`.
- **Play codes (`src/lib/playcode.ts`):** Pure-JS SHA-256 + HMAC-SHA256 (works without WebCrypto / secure context). Validates 6-char Crockford base32 codes (`K7Q-2MX`) signed with local calendar date `YYYY-MM-DD`. **Keep in sync with the learning sites' `js/playcode.js` — do not change the key or bit format unilaterally.**
- **Gate state (`src/lib/playgate.ts` + `src/lib/useGate.ts`):** Persisted in `localStorage` under `brainplay:gate`, broadcasts `brainplay:gate` custom event + listens to `storage` event for multi-tab sync. `PARENT_CODE` (`2451Q1`) grants `PARENT_FREE_MINUTES` (60 min) of free play offline in any code box.
- **Offline caching (`public/sw.js` + `vite.config.ts`):** `precacheList()` Vite build plugin walks `dist/` (excluding `sw.js`, `precache.json`, `CNAME`) and writes `dist/precache.json` with a SHA-256 build hash. `public/sw.js` precaches every file in `precache.json` and caches Google Fonts on first load. SW registers only in `import.meta.env.PROD`.

## Invariants & Gotchas

1. **No external script CDNs in `public/` games:** All embedded games must work offline and pass `tests/games-registry.test.ts` (no CDN `<script src=...>`; vendor libraries like `three.min.js` locally in the game's `public/<slug>/` folder).
2. **Testable embedded logic:** Follow Jelly Jam's pattern (`engine.js` separated from `index.html`) when adding complex standalone games so core rules can be unit-tested in Vitest.
3. **Route reuse in `StagePlayPage`:** React Router reuses `StagePlayPage` across `:gameId`/`:stage` changes; the game component uses `key={`${gameId}-${stage}-${playKey}`}` and `result` resets in `useEffect([gameId, stage])`. (Note: `GameIntroPage` currently initializes `progress` with `useState(() => ...)` and always wraps `embedSrc` games in `PlayGate` regardless of category — keep that in mind if adding an embedded `learn` game or direct cross-game links.)
4. **Tests to maintain (`tests/`):**
   - `games-registry.test.ts` — verifies every React game has a component, every `embedSrc` exists in `public/`, no external scripts, plus smoke/engine tests for embedded games
   - `playgate.test.ts`, `playgate-ui.test.tsx` — code verification, parent code, timer/gate UI
   - `chess-puzzles.test.ts`, `map-countries.test.ts`, `map-feedback.test.ts`, `sudoku.test.ts`, `progress.test.ts`, `scoring.test.ts`, `rotation.test.ts`
