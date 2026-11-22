import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
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

  it('has all ten dinosaurs, best of 3 rounds, 10 levels and a tough level 10 boss', () => {
    for (const name of [
      'T-Rex',
      'Spinosaurus',
      'Ankylosaurus',
      'Triceratops',
      'Velociraptor',
      'Stegosaurus',
      'Carnotaurus',
      'Pachycephalosaurus',
      'Therizinosaurus',
      'Giganotosaurus',
    ]) {
      expect(html).toContain(`name: '${name}'`);
    }
    expect(html).toContain('ROUNDS_TO_WIN = 2');
    expect(html).toContain('LEVEL_COUNT = 10');
    expect(html).toContain('PERFECT_BLOCK_WIN');
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

describe('Court Kings 3D basketball page', () => {
  const html = readFileSync(resolve(__dirname, '../public/court-kings/index.html'), 'utf8');
  const engineSrc = readFileSync(resolve(__dirname, '../public/court-kings/engine.js'), 'utf8');

  interface CourtPlayer {
    id: number;
    team: number;
    idx: number;
    name: string;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    stamina: number;
    state: string;
    catchBoost: number;
    openWindow: number;
    stealLungeT: number;
    lungeWindupT: number;
    stealCooldown: number;
    sloppyT: number;
    shotMeter: number;
    shotElapsed: number;
    shotJumped: boolean;
    shotWindow: {
      sweetSpot: number;
      sweetTime: number;
      gatherTime: number;
      chargeTime: number;
      greenMs: number;
      greenHalf: number;
      goodHalf: number;
      greenMin: number;
      greenMax: number;
      contest: number;
      tired: boolean;
    } | null;
  }

  interface CourtGame {
    mode: string;
    level: number;
    rookieAssist: boolean;
    timeScale: number;
    phase: string;
    clock: number;
    timeLeft: number;
    shotClock: number;
    possession: number;
    needsClear: boolean;
    score: [number, number];
    players: CourtPlayer[];
    ball: { mode: string; x: number; y: number; z: number; holderId: number; isMoneyBall: boolean };
    lastShotFeedback: {
      timingLabel: string;
      symbol: string;
      coverageLabel: string;
      quality: string;
      timer: number;
    } | null;
    drillState: { score: number; makes: number; streak: number; spotIdx: number; ballInRack: number; cooldown: number };
    input: { moveX: number; moveZ: number; movePressed: boolean; passPressed: boolean };
    beginShot(p: CourtPlayer): boolean;
    releaseShot(p: CourtPlayer): void;
    triggerMove(p: CourtPlayer): boolean;
    triggerPass(p: CourtPlayer, dx?: number, dz?: number, explicitSlot?: number): boolean;
    triggerSteal(def: CourtPlayer): boolean;
    getPassPreview(
      from: CourtPlayer,
      dx?: number,
      dz?: number,
    ): { target: CourtPlayer; targetId: number; slot: number; keyNum: number; name: string; lane: string } | null;
    update(dt: number): void;
    drainEvents(): { type: string; [k: string]: unknown }[];
  }

  interface CourtEngineApi {
    RIM_X: number;
    RIM_Z: number;
    SHOT_CLOCK: number;
    LEVELS: { id: number; greenScale: number; greenMs: { layup: number; mid: number; three: number }; aiDef: number; aiSpeed: number }[];
    DRILLS: { id: string }[];
    makeRng(seed: number): () => number;
    isThreePoint(x: number, z: number): boolean;
    computeShotWindow(
      shooter: Partial<CourtPlayer>,
      defenders: Partial<CourtPlayer>[],
      level?: { id?: number; greenScale: number; greenMs?: { layup: number; mid: number; three: number } },
    ): NonNullable<CourtPlayer['shotWindow']>;
    createGame(opts: { level?: number; drill?: string; rookieAssist?: boolean; seed?: number }): CourtGame;
  }

  const sandbox: { CourtEngine?: CourtEngineApi } = {};
  new Function('window', engineSrc)(sandbox);
  const E = sandbox.CourtEngine as CourtEngineApi;

  it('is listed as a Play game that opens its own page', () => {
    const game = GAMES.find((g) => g.id === 'basketball');
    expect(game?.embedSrc).toBe('/court-kings/index.html');
    expect(game?.category).toBe('play');
    expect(game?.title).toBe('Court Kings');
  });

  it('loads only local Three.js and its engine without deprecated r139+ APIs', () => {
    const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs).toEqual(['/court-kings/three.min.js', '/court-kings/engine.js']);
    expect(existsSync(resolve(__dirname, '../public/court-kings/three.min.js'))).toBe(true);
    expect(html).toContain('LatheGeometry');
    expect(html).toContain('kneeR');
    expect(html).toContain('elbowR');
    expect(html).toContain('ballAnchorR');
    expect(html).not.toContain('CapsuleGeometry');
    expect(html).not.toContain('outputColorSpace');
  });

  it('has 6 Roarball Championship biome rounds culminating in The Claw Finals plus 3 skill drills', () => {
    expect(E.LEVELS).toHaveLength(6);
    expect(E.LEVELS.map((l) => (l as unknown as { theme: string }).theme)).toEqual([
      'vines',
      'ice',
      'canyon',
      'shadow',
      'lava',
      'claw',
    ]);
    for (let i = 1; i < E.LEVELS.length; i++) {
      expect(E.LEVELS[i].greenScale).toBeLessThan(E.LEVELS[i - 1].greenScale);
      expect(E.LEVELS[i].aiDef).toBeGreaterThan(E.LEVELS[i - 1].aiDef);
      expect(E.LEVELS[i].aiSpeed).toBeGreaterThan(E.LEVELS[i - 1].aiSpeed);
    }
    expect(E.LEVELS[5].boss).toBe(true);
    expect(E.LEVELS[5].name).toContain('The Claw');
    expect(E.DRILLS.map((d) => d.id)).toEqual(['shootout', 'passing', 'dribble']);
  });

  it('scores open green-release 2PT and 3PT shots and scales shot windows for contest and catch-boost', () => {
    const open = E.computeShotWindow({ x: 0, z: 0.3, catchBoost: 0, stamina: 100 }, [], E.LEVELS[2]);
    const contested = E.computeShotWindow(
      { x: 0, z: 0.3, catchBoost: 0, stamina: 100 },
      [{ x: 0, z: -0.7, y: 0, state: 'idle' }],
      E.LEVELS[2],
    );
    const catchBoost = E.computeShotWindow({ x: 0, z: 0.3, catchBoost: 1.4, stamina: 100 }, [], E.LEVELS[2]);
    expect(contested.greenHalf).toBeLessThan(open.greenHalf);
    expect(catchBoost.greenHalf).toBeGreaterThan(open.greenHalf);

    const g = E.createGame({ level: 1, seed: 42 });
    g.players.filter((p) => p.team === 1).forEach((d) => {
      d.x = 6;
      d.z = 5;
    });
    const u = g.players[0];
    u.x = 0;
    u.z = 0.3; // 3-pointer
    expect(g.beginShot(u)).toBe(true);
    if (u.shotWindow) u.shotMeter = u.shotWindow.sweetSpot;
    g.releaseShot(u);
    for (let i = 0; i < 120; i++) g.update(1 / 60);
    expect(g.score[0]).toBe(3);
    expect(g.drainEvents().some((ev) => ev.type === 'swish')).toBe(true);
  });

  it('transfers possession with catchBoost on open passes and intercepts passes through defenders', () => {
    const gOpen = E.createGame({ level: 1, seed: 5 });
    const pg = gOpen.players[0];
    const wing = gOpen.players[1];
    gOpen.players.filter((p) => p.team === 1).forEach((d) => {
      d.x = 6.5;
      d.z = 5.5;
    });
    wing.openWindow = 1.0;
    expect(gOpen.triggerPass(pg, wing.x - pg.x, wing.z - pg.z, 1)).toBe(true);
    for (let i = 0; i < 40; i++) gOpen.update(1 / 60);
    expect(gOpen.ball.mode).toBe('held');
    expect(gOpen.ball.holderId).toBe(wing.id);
    expect(wing.catchBoost).toBeGreaterThan(0);

    const gInt = E.createGame({ level: 4, seed: 9 });
    const pg2 = gInt.players[0];
    const wing2 = gInt.players[1];
    const def = gInt.players[4];
    pg2.x = 0;
    pg2.z = -2.0;
    wing2.x = -2.2;
    wing2.z = -4.2;
    wing2.vx = 0;
    wing2.vz = 0;
    def.x = (pg2.x + wing2.x) / 2;
    def.z = (pg2.z + wing2.z) / 2;
    def.stealCooldown = 0;
    gInt.triggerPass(pg2, 0, 0, 1);
    for (let i = 0; i < 30; i++) gInt.update(1 / 60);
    expect(gInt.drainEvents().some((ev) => ev.type === 'intercept')).toBe(true);
    expect(gInt.possession).toBe(1);
    expect(gInt.needsClear).toBe(true);
  });

  it('triggers ankle breakers on timed crossovers and penalizes move spam', () => {
    const g = E.createGame({ level: 2, seed: 3 });
    const u = g.players[0];
    const d = g.players[3];
    d.x = u.x;
    d.z = u.z - 1.1;
    d.stealLungeT = 0.2;
    expect(g.triggerMove(u)).toBe(true);
    expect(d.state).toBe('stumbled');
    expect(g.drainEvents().some((ev) => ev.type === 'ankleBreaker')).toBe(true);

    const staminaAfterOne = u.stamina;
    for (let i = 0; i < 20; i++) g.update(1 / 60);
    g.triggerMove(u);
    expect(u.sloppyT).toBeGreaterThan(0);
    expect(u.stamina).toBeLessThan(staminaAfterOne);
  });

  it('enforces the 14s shot clock, Clear-the-Arc, and simulates 20s cleanly', () => {
    const g = E.createGame({ level: 3, seed: 77 });
    g.players.filter((p) => p.team === 1).forEach((d) => {
      d.stealCooldown = 20;
    });
    for (let i = 0; i < 15 * 60; i++) g.update(1 / 60);
    const events = g.drainEvents();
    expect(events.some((ev) => ev.type === 'shotClock')).toBe(true);
    g.players.forEach((p) => {
      p.stealCooldown = 0;
    });

    g.needsClear = true;
    const holder = g.players.find((p) => p.id === g.ball.holderId) || g.players[0];
    holder.x = 0;
    holder.z = -3.0; // inside arc
    expect(g.beginShot(holder)).toBe(false);
    holder.x = 0;
    holder.z = 1.5; // outside 3PT arc
    g.update(1 / 60);
    expect(g.needsClear).toBe(false);

    for (let i = 0; i < 1200; i++) {
      g.input.moveX = Math.sin(i * 0.05);
      g.input.moveZ = Math.cos(i * 0.03);
      g.update(1 / 60);
      expect(Number.isNaN(g.ball.x)).toBe(false);
      expect(Number.isNaN(g.ball.y)).toBe(false);
      expect(Number.isNaN(g.ball.z)).toBe(false);
    }
  });

  it('runs and scores all 3 skill drills cleanly', () => {
    // 1. 3-Point Shootout (including Money Ball worth 2)
    const s = E.createGame({ drill: 'shootout', seed: 1 });
    for (let b = 0; b < 3; b++) {
      const shooter = s.players[0];
      expect(s.beginShot(shooter)).toBe(true);
      if (shooter.shotWindow) shooter.shotMeter = shooter.shotWindow.sweetSpot;
      s.releaseShot(shooter);
      for (let i = 0; i < 120; i++) s.update(1 / 60);
    }
    expect(s.drillState.score).toBeGreaterThanOrEqual(4);

    // 2. Passing Vision drill
    const p = E.createGame({ drill: 'passing', seed: 2 });
    p.players[1].openWindow = 1.0;
    p.players[3].x = 6;
    p.players[3].z = 5;
    p.triggerPass(p.players[0], p.players[1].x - p.players[0].x, p.players[1].z - p.players[0].z, 1);
    for (let i = 0; i < 40; i++) p.update(1 / 60);
    expect(p.drillState.score).toBeGreaterThanOrEqual(2);

    // 3. Dribble & Finish drill
    const dr = E.createGame({ drill: 'dribble', seed: 4 });
    const u = dr.players[0];
    const onBall = dr.players[1];
    onBall.x = u.x;
    onBall.z = u.z - 1.1;
    onBall.stealLungeT = 0.2;
    dr.triggerMove(u);
    dr.players[2].x = 6;
    dr.players[2].z = 5;
    dr.beginShot(u);
    if (u.shotWindow) u.shotMeter = u.shotWindow.sweetSpot;
    dr.releaseShot(u);
    for (let i = 0; i < 120; i++) dr.update(1 / 60);
    expect(dr.drillState.score).toBeGreaterThanOrEqual(3);
  });

  it('syncs the jump apex with the sweet spot for jumpers and layups', () => {
    for (const [x, z] of [
      [0, -2.5], // jumper
      [0.3, -5.0], // layup
    ]) {
      const g = E.createGame({ level: 3, rookieAssist: false, seed: 10 });
      g.players.filter((p) => p.team === 1).forEach((d) => {
        d.x = 6;
        d.z = 5;
      });
      const u = g.players[0];
      u.x = x;
      u.z = z;
      expect(g.beginShot(u)).toBe(true);
      const win = u.shotWindow!;
      const steps = Math.round(win.sweetTime * 120);
      for (let i = 0; i < steps; i++) g.update(1 / 120);
      expect(u.shotJumped).toBe(true);
      expect(u.y).toBeGreaterThan(0.35);
      expect(Math.abs(u.vy)).toBeLessThan(0.25);
      expect(Math.abs(u.shotMeter - win.sweetSpot)).toBeLessThan(0.02);
    }
  });

  it('enforces millisecond windows >= 110ms, visible L4+ fatigue only, feedback linger, and Rookie Assist', () => {
    const l6TiredContested = E.computeShotWindow(
      { x: 0, z: 0.3, catchBoost: 0, stamina: 0 },
      [{ x: 0, z: -0.5, y: 0.5, guarding: true, state: 'idle' }],
      E.LEVELS[5],
    );
    expect(l6TiredContested.greenMs).toBeGreaterThanOrEqual(110);
    expect(l6TiredContested.tired).toBe(true);

    const l2Tired = E.computeShotWindow({ x: 0, z: 0.3, catchBoost: 0, stamina: 5 }, [], E.LEVELS[1]);
    expect(l2Tired.tired).toBe(false);

    const g1 = E.createGame({ level: 1, seed: 15 });
    const g3 = E.createGame({ level: 3, seed: 15 });
    const gD = E.createGame({ drill: 'shootout', seed: 15 });
    expect(g1.rookieAssist).toBe(true);
    expect(g3.rookieAssist).toBe(false);
    expect(gD.rookieAssist).toBe(true);

    const u = g1.players[0];
    u.x = 0;
    u.z = -2.5;
    g1.beginShot(u);
    for (let i = 0; i < 4; i++) g1.update(0.05); // 0.2s wall time at 0.8x slow-mo => 0.16s meter progress
    expect(g1.timeScale).toBe(0.8);
    expect(u.shotElapsed).toBeCloseTo(0.16, 4);

    // Early release sets lingering feedback with symbol and coverage
    u.shotMeter = 0.2;
    g1.releaseShot(u);
    expect(g1.lastShotFeedback).not.toBeNull();
    expect(g1.lastShotFeedback!.timingLabel).toBe('EARLY');
    expect(g1.lastShotFeedback!.symbol).toBe('◀');
    expect(g1.lastShotFeedback!.timer).toBeCloseTo(0.9, 4);
    for (let i = 0; i < 6; i++) g1.update(0.05);
    expect(g1.lastShotFeedback!.timer).toBeCloseTo(0.6, 4);
  });

  it('uses fixed player pass numbers (1/2/3) and accurate getPassPreview lane safety', () => {
    const g = E.createGame({ level: 1, seed: 22 });
    const [nova, blaze, titan] = g.players;
    g.players.filter((p) => p.team === 1).forEach((d) => {
      d.x = 6.5;
      d.z = 5.5;
    });

    // Nova (slot 0) cannot pass to slot 0, passes to Blaze (slot 1)
    expect(g.triggerPass(nova, 0, 0, 0)).toBe(false);
    blaze.openWindow = 1.0;
    const prevOpen = g.getPassPreview(nova, blaze.x - nova.x, blaze.z - nova.z)!;
    expect(prevOpen.keyNum).toBe(2);
    expect(prevOpen.name).toBe('Blaze');
    expect(prevOpen.lane).toBe('open');

    // Place a defender right on the line to Blaze -> risky
    const def = g.players[3];
    def.x = (nova.x + blaze.x) / 2;
    def.z = (nova.z + blaze.z) / 2;
    const prevRisky = g.getPassPreview(nova, blaze.x - nova.x, blaze.z - nova.z)!;
    expect(prevRisky.lane).toBe('risky');

    // Pass to Titan (slot 2) and confirm fixed numbering keeps [1]=Nova, [2]=Blaze
    expect(g.triggerPass(nova, 0, 0, 2)).toBe(true);
    for (let i = 0; i < 40; i++) g.update(1 / 60);
    expect(g.ball.holderId).toBe(titan.id);
    expect(g.triggerPass(titan, 0, 0, 2)).toBe(false);
    expect(g.triggerPass(titan, 0, 0, 0)).toBe(true);
    for (let i = 0; i < 45; i++) g.update(1 / 60);
    expect(g.ball.holderId).toBe(nova.id);
  });

  it('lets a simulated human (±90ms Gaussian) hit realistic green & make rates on L1 and L6', () => {
    const rng = E.makeRng(2026);
    function gaussianMs(sigma: number): number {
      const u1 = Math.max(1e-7, rng());
      const u2 = rng();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
    }

    function runTrials(level: number, x: number, z: number, trials: number) {
      let greens = 0;
      let makes = 0;
      for (let t = 0; t < trials; t++) {
        const g = E.createGame({ level, rookieAssist: false, seed: 100 + t });
        g.players.filter((p) => p.team === 1).forEach((d) => {
          d.x = 6.5;
          d.z = 5.5;
        });
        const u = g.players[0];
        u.x = x;
        u.z = z;
        g.beginShot(u);
        const win = u.shotWindow!;
        const relTime = Math.max(0.05, win.sweetTime + gaussianMs(90) / 1000);
        u.shotMeter = relTime / win.chargeTime;
        g.releaseShot(u);
        const evs = g.drainEvents();
        const shotEv = evs.find((e) => e.type === 'shot');
        if (shotEv && shotEv.quality === 'green') greens++;
        for (let i = 0; i < 120; i++) g.update(1 / 60);
        if (g.score[0] > 0) makes++;
      }
      return { greenRate: greens / trials, makeRate: makes / trials };
    }

    const l1 = runTrials(1, 0, -2.5, 200);
    expect(l1.greenRate).toBeGreaterThanOrEqual(0.55);
    expect(l1.makeRate).toBeGreaterThanOrEqual(0.6);

    const l6 = runTrials(6, 0, 0.3, 200);
    expect(l6.greenRate).toBeGreaterThanOrEqual(0.25);
  });

  it('telegraphs defender lunge in dribble drill, resets cleanly after a strip, and maps R for crossover/steal', () => {
    expect(html).toContain("'KeyR'");
    expect(html).not.toContain('ShiftLeft');
    expect(html).not.toContain('ShiftRight');

    // Defender telegraphs lunge with lungeWindupT > 0 and lungeCue event, allowing easy ankle-breaker
    const dr = E.createGame({ drill: 'dribble', seed: 12 });
    const [user, onBall] = dr.players;
    for (let i = 0; i < 120 && onBall.lungeWindupT <= 0; i++) dr.update(1 / 60);
    expect(onBall.lungeWindupT).toBeGreaterThan(0);
    expect(dr.drainEvents().some((ev) => ev.type === 'lungeCue')).toBe(true);
    expect(dr.triggerMove(user)).toBe(true);
    expect(onBall.state).toBe('stumbled');
    expect(dr.drillState.score).toBe(1);

    // Stripped ball resets cleanly back to user at top of key
    const drStrip = E.createGame({ drill: 'dribble', rng: () => 0 });
    const [u2, def2] = drStrip.players;
    def2.x = u2.x;
    def2.z = u2.z - 0.8;
    def2.stealCooldown = 0;
    drStrip.triggerSteal(def2);
    expect(drStrip.drillState.cooldown).toBeGreaterThan(0);
    for (let i = 0; i < 55; i++) drStrip.update(1 / 60);
    expect(drStrip.ball.mode).toBe('held');
    expect(drStrip.ball.holderId).toBe(u2.id);
    expect(drStrip.possession).toBe(0);
  });

  it('runs the inline 3D client script without ReferenceErrors or missing DOM ids across menu, match, and drills', () => {
    const threeSrc = readFileSync(resolve(__dirname, '../public/court-kings/three.min.js'), 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).not.toBeNull();
    const inlineScript = scriptMatch![1];

    const noop = () => undefined;
    const fakeCtx2d = new Proxy(
      {
        createLinearGradient: () => ({ addColorStop: noop }),
        createRadialGradient: () => ({ addColorStop: noop }),
        measureText: () => ({ width: 50 }),
      },
      { get: (t, k) => (k in t ? t[k as keyof typeof t] : noop) },
    );

    const makeEl = (tag: string) => ({
      tagName: tag.toUpperCase(),
      style: {} as Record<string, string>,
      dataset: {} as Record<string, string>,
      classList: { add: noop, remove: noop, toggle: noop },
      hidden: false,
      textContent: '',
      innerHTML: '',
      width: 512,
      height: 512,
      addEventListener: noop,
      removeEventListener: noop,
      setAttribute: noop,
      removeAttribute: noop,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: noop,
      focus: noop,
      getContext: (type: string) => (type === '2d' ? fakeCtx2d : null),
    });

    const elMap: Record<string, ReturnType<typeof makeEl>> = {};
    for (const m of html.matchAll(/id="([^"]+)"/g)) {
      elMap[m[1]] = makeEl('div');
    }

    const rafQueue: Array<(now: number) => void> = [];
    const sandbox: Record<string, unknown> = {
      console,
      Math,
      Date,
      Number,
      String,
      Array,
      Object,
      Set,
      Map,
      Float32Array,
      Uint16Array,
      Uint32Array,
      Int32Array,
      ArrayBuffer,
      DataView,
      RegExp,
      Error,
      TypeError,
      JSON,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      performance: { now: () => 1000 },
      setTimeout: () => 0,
      clearTimeout: noop,
      requestAnimationFrame: (cb: (now: number) => void) => {
        rafQueue.push(cb);
        return rafQueue.length;
      },
      localStorage: { getItem: () => null, setItem: noop },
      document: {
        body: makeEl('body'),
        getElementById: (id: string) => {
          if (!elMap[id]) throw new Error(`Missing DOM element #${id}`);
          return elMap[id];
        },
        createElement: (tag: string) => makeEl(tag),
      },
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 1,
      addEventListener: noop,
      matchMedia: () => ({ matches: false }),
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.globalThis = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(threeSrc, sandbox);
    (sandbox.THREE as { WebGLRenderer: new () => unknown }).WebGLRenderer = function WebGLRendererStub(this: Record<string, unknown>) {
      this.shadowMap = {};
      this.setPixelRatio = noop;
      this.setSize = noop;
      this.render = noop;
    } as unknown as new () => unknown;
    vm.runInContext(engineSrc, sandbox);
    vm.runInContext(inlineScript, sandbox);

    // 1. Menu showcase frames
    expect(rafQueue.length).toBeGreaterThan(0);
    rafQueue.shift()!(1016);
    rafQueue.shift()!(1032);

    const api = sandbox.CourtKings as {
      startMatch: (level: number, seed?: number) => CourtGame;
      startDrill: (drill: string, seed?: number) => CourtGame;
      step: (sec: number) => void;
      state: () => { ball: { x: number; y: number; z: number } } | null;
    };

    // 2. Match gameplay covering all player poses & ball-in-hands sync
    const g = api.startMatch(1, 42);
    api.step(0.2);
    g.input.moveX = 1;
    g.input.moveZ = -1;
    api.step(0.3);
    g.triggerMove(g.players[0]);
    api.step(0.25);
    g.triggerPass(g.players[0], 0, 0, 1);
    api.step(0.4);
    g.beginShot(g.players[1]);
    api.step(0.5);
    g.releaseShot(g.players[1]);
    api.step(0.6);

    // Force layup & defensive/stumbled pose branches
    const u = g.players[0];
    u.x = 0.2;
    u.z = -5.2;
    g.ball.mode = 'held';
    g.ball.holderId = u.id;
    g.players[1].guarding = true;
    g.players[2].y = 0.45;
    g.players[3].state = 'stumbled';
    g.players[4].lungeWindupT = 0.4;
    g.players[5].stealLungeT = 0.2;
    g.beginShot(u);
    api.step(0.45);
    g.releaseShot(u);
    api.step(0.5);

    // Run RAF frame during active match
    rafQueue[rafQueue.length - 1](2000);
    const st = api.state();
    expect(st).not.toBeNull();
    expect(Number.isFinite(st!.ball.x)).toBe(true);
    expect(Number.isFinite(st!.ball.y)).toBe(true);
    expect(Number.isFinite(st!.ball.z)).toBe(true);

    // 3. All 6 biome tournament rounds & all 3 skill drills
    for (let lvl = 2; lvl <= 6; lvl++) {
      api.startMatch(lvl, 40 + lvl);
      api.step(0.15);
      expect(api.state()).not.toBeNull();
    }
    for (const d of ['shootout', 'passing', 'dribble']) {
      api.startDrill(d, 7);
      api.step(0.6);
      expect(api.state()).not.toBeNull();
    }
  });
});
