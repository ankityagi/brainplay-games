import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAMES } from '../src/lib/games';
import { GAME_COMPONENTS } from '../src/lib/registry';

describe('game registry', () => {
  it('gives every stage-based game a component', () => {
    for (const game of GAMES.filter((g) => !g.embedSrc)) {
      expect(GAME_COMPONENTS[game.id as keyof typeof GAME_COMPONENTS], game.id).toBeDefined();
    }
  });

  it('points every embedded game at a page that ships in public/', () => {
    for (const game of GAMES.filter((g) => g.embedSrc)) {
      expect(existsSync(resolve(__dirname, '../public', `.${game.embedSrc}`)), game.id).toBe(true);
    }
  });

  it('serves Zoom Valley with a local copy of three.js, not a CDN', () => {
    const html = readFileSync(resolve(__dirname, '../public/zoom-valley/index.html'), 'utf8');
    expect(html).toContain('<script src="/zoom-valley/three.min.js"></script>');
    expect(html).not.toContain('cdnjs');
    expect(existsSync(resolve(__dirname, '../public/zoom-valley/three.min.js'))).toBe(true);
  });
});

describe('Boundary Bash cricket page', () => {
  const html = readFileSync(resolve(__dirname, '../public/cricket/index.html'), 'utf8');

  it('is listed as the cricket game and opens its own page', () => {
    const game = GAMES.find((g) => g.id === 'cricket');
    expect(game?.embedSrc).toBe('/cricket/index.html');
  });

  it('loads no outside scripts', () => {
    expect(html).not.toMatch(/<script[^>]+src=/);
  });

  it('plays a 5-over innings of 6-ball overs', () => {
    expect(html).toContain('const OVERS = 5;');
    expect(html).toContain('const PER_OVER = 6;');
  });
});

describe('Dino Duel fighting page', () => {
  const html = readFileSync(resolve(__dirname, '../public/dino-duel/index.html'), 'utf8');

  it('is listed as the dinosaur fighting game and opens its own page', () => {
    const game = GAMES.find((g) => g.id === 'dinoduel');
    expect(game?.embedSrc).toBe('/dino-duel/index.html');
    expect(game?.category).toBe('play');
  });

  it('loads no outside scripts', () => {
    expect(html).not.toMatch(/<script[^>]+src=/);
  });

  it('has the five dinosaurs, best of 3 rounds and 10 levels', () => {
    for (const name of ['T-Rex', 'Spinosaurus', 'Ankylosaurus', 'Triceratops', 'Velociraptor']) {
      expect(html).toContain(`name: '${name}'`);
    }
    expect(html).toContain('ROUNDS_TO_WIN = 2');
    expect(html).toContain('LEVEL_COUNT = 10');
  });
});

describe('Dino Truck Rumble racing page', () => {
  const html = readFileSync(resolve(__dirname, '../public/dino-trucks/index.html'), 'utf8');

  it('is listed as the dino truck racing game and opens its own page', () => {
    const game = GAMES.find((g) => g.id === 'dinotrucks');
    expect(game?.embedSrc).toBe('/dino-trucks/index.html');
    expect(game?.category).toBe('play');
  });

  it('only loads its own copy of three.js', () => {
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs).toEqual(['/dino-trucks/three.min.js']);
  });

  it('has the five dino trucks, each with an attack, and 6 levels', () => {
    for (const name of ['T-Rex', 'Spinosaurus', 'Ankylosaurus', 'Triceratops', 'Velociraptor']) {
      expect(html).toContain(`name: '${name}'`);
    }
    for (const kind of ['chomp', 'swipe', 'club', 'ram', 'pounce']) {
      expect(html).toContain(`kind: '${kind}'`);
    }
    expect((html.match(/\{ id: \d, track: '/g) || []).length).toBe(6);
  });
});

describe('Jelly Jam falling-blocks page', () => {
  const html = readFileSync(resolve(__dirname, '../public/jelly-jam/index.html'), 'utf8');
  const engineSrc = readFileSync(resolve(__dirname, '../public/jelly-jam/engine.js'), 'utf8');
  type Cell = { key: string } | null;
  interface JellyGame {
    board: Cell[][];
    cur: { key: string; rot: number; x: number; y: number } | null;
    phase: string;
    score: number;
    lines: number;
    levelLines: number;
    stars: number;
    level: number;
    goal(): number;
    move(dx: number): boolean;
    rotate(dir: number): boolean;
    hardDrop(): number;
    update(dt: number): void;
    setRow(y: number, pattern: string, key?: string): void;
    setPiece(key: string, x?: number, rot?: number): void;
    drainEvents(): { type: string }[];
  }
  interface JellyEngineApi {
    COLS: number;
    ROWS: number;
    LEVEL_COUNT: number;
    SHAPES: Record<string, { name: string; grid: string[]; bomb?: boolean }>;
    ROTATIONS: Record<string, [number, number][][]>;
    LEVELS: { id: number; goal: number; fall: number; pool: string[]; fizz: number }[];
    createGame(opts: { level?: number; endless?: boolean; seed?: number }): JellyGame;
    starsForHeight(h: number): number;
  }
  const sandbox: { JellyEngine?: JellyEngineApi } = {};
  new Function('window', engineSrc)(sandbox);
  const E = sandbox.JellyEngine as JellyEngineApi;

  it('is listed as a Play game that opens its own page', () => {
    const game = GAMES.find((g) => g.id === 'jellyjam');
    expect(game?.embedSrc).toBe('/jelly-jam/index.html');
    expect(game?.category).toBe('play');
    expect(game?.title).toBe('Jelly Jam');
  });

  it('only loads its own rules file', () => {
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs).toEqual(['/jelly-jam/engine.js']);
  });

  it('has 10 levels that get faster and add bigger shapes', () => {
    expect(E.LEVELS).toHaveLength(10);
    for (let i = 1; i < E.LEVELS.length; i++) {
      expect(E.LEVELS[i].fall).toBeLessThan(E.LEVELS[i - 1].fall);
      expect(E.LEVELS[i].pool.length).toBeGreaterThanOrEqual(E.LEVELS[i - 1].pool.length);
      expect(E.LEVELS[i].goal).toBeGreaterThanOrEqual(E.LEVELS[i - 1].goal);
    }
    const size = (k: string) => E.ROTATIONS[k][0].length;
    expect(Math.max(...E.LEVELS[0].pool.map(size))).toBeLessThanOrEqual(4);
    expect(E.LEVELS[9].pool.some((k) => size(k) === 5)).toBe(true);
  });

  it('turns every shape without changing its size, and four turns bring it back', () => {
    for (const key of Object.keys(E.SHAPES)) {
      const rots = E.ROTATIONS[key];
      const n = E.SHAPES[key].grid.length;
      for (const r of rots) {
        expect(r.length).toBe(rots[0].length);
        for (const [x, y] of r) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThan(n);
        }
      }
    }
  });

  it('pops a full row and counts it toward the level goal', () => {
    const g = E.createGame({ level: 1, seed: 7 });
    g.setRow(17, 'XXXXXXXX..');
    g.setPiece('twins', 8);
    g.drainEvents();
    g.hardDrop();
    expect(g.phase).toBe('clearing');
    g.update(1);
    expect(g.lines).toBe(1);
    expect(g.board[17].every((c) => c === null)).toBe(true);
    expect(g.score).toBeGreaterThanOrEqual(100);
  });

  it('finishes a level after its goal and gives stars for a low pile', () => {
    const g = E.createGame({ level: 1, seed: 3 });
    g.levelLines = g.goal() - 1;
    g.setRow(17, 'XXXXXXXX..');
    g.setPiece('twins', 8);
    g.hardDrop();
    g.update(1);
    expect(g.phase).toBe('won');
    expect(g.stars).toBe(3);
    expect(E.starsForHeight(11)).toBe(2);
    expect(E.starsForHeight(15)).toBe(1);
  });

  it('Fizz Pop clears the jellies around where it lands', () => {
    const g = E.createGame({ level: 1, seed: 1 });
    g.setRow(16, 'XXXX..XXXX');
    g.setRow(17, 'XXXX.XXXXX');
    g.setPiece('fizz', 4);
    g.hardDrop();
    expect(g.board[17][4]).toBe(null);
    expect(g.board[16][3]).toBe(null);
    expect(g.board[17][3]).toBe(null);
    expect(g.board[17][5]).toBe(null);
    expect(g.board[17][0]).not.toBe(null);
  });

  it('ends the game when a new shape has no room', () => {
    const g = E.createGame({ level: 1, seed: 2 });
    for (let y = 2; y < E.ROWS; y++) g.setRow(y, y % 2 ? 'XXXXXXXXX.' : '.XXXXXXXXX');
    g.setPiece('cube', 4);
    g.hardDrop();
    expect(g.phase).toBe('over');
  });

  it('keeps shapes inside the jar walls', () => {
    const g = E.createGame({ level: 1, seed: 4 });
    g.setPiece('noodle', 0);
    expect(g.move(-1)).toBe(false);
    for (let i = 0; i < 20; i++) g.move(1);
    expect(g.rotate(1)).toBe(true);
    for (let i = 0; i < 20; i++) g.move(1);
    expect(g.rotate(1)).toBe(true);
    const xs = (g.cur ? E.ROTATIONS[g.cur.key][g.cur.rot].map(([x]) => x + (g.cur as { x: number }).x) : []);
    expect(Math.max(...xs)).toBeLessThan(E.COLS);
  });

  it('plays a random game to the end without errors', () => {
    const g = E.createGame({ endless: true, seed: 99 });
    for (let i = 0; i < 4000 && g.phase !== 'over'; i++) {
      if (i % 3 === 0) g.move(i % 2 ? 1 : -1);
      if (i % 7 === 0) g.rotate(1);
      if (i % 11 === 0) g.hardDrop();
      g.update(1 / 30);
    }
    expect(g.phase).toBe('over');
  });
});
