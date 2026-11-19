/*
 * Jelly Jam game rules: board, jelly shapes, levels, moving, turning, dropping, popping rows.
 * No drawing and no page code here, so the page (index.html) and the unit tests share it.
 * Exposes globalThis.JellyEngine.
 */
(function (root) {
  'use strict';

  const COLS = 10;
  const ROWS = 18;
  const LEVEL_COUNT = 10;
  const LOCK_DELAY = 0.5;
  const MAX_LOCK_RESETS = 15;
  const CLEAR_TIME = 0.32;
  const SOFT_DROP_INTERVAL = 0.035;
  /** Stack heights (in rows) that still earn 3 and 2 stars. */
  const STAR_HEIGHTS = { three: 9, two: 12 };

  /*
   * Jelly shapes, each drawn in a square box so turning spins it around the middle.
   * 'X' is a jelly, '.' is empty. They grow from 2 jellies up to 5 as the levels go up.
   */
  const SHAPES = {
    twins: { name: 'Twins', color: '#ff6fa8', grid: ['XX', '..'] },
    noodle: { name: 'Noodle', color: '#ffb02e', grid: ['...', 'XXX', '...'] },
    elbow: { name: 'Elbow', color: '#3ec6ff', grid: ['X.', 'XX'] },
    cube: { name: 'Cube', color: '#ffd93b', grid: ['XX', 'XX'] },
    tee: { name: 'Tee', color: '#b57bff', grid: ['...', 'XXX', '.X.'] },
    hook: { name: 'Hook', color: '#4fdc8a', grid: ['X..', 'XXX', '...'] },
    zigzag: { name: 'Zigzag', color: '#ff7a5c', grid: ['XX.', '.XX', '...'] },
    cup: { name: 'Cup', color: '#38e0d0', grid: ['...', 'X.X', 'XXX'] },
    boot: { name: 'Boot', color: '#ff9ed2', grid: ['XX.', 'XX.', 'X..'] },
    plus: { name: 'Plus', color: '#ffe066', grid: ['.X.', 'XXX', '.X.'] },
    stairs: { name: 'Stairs', color: '#7d8bff', grid: ['X..', 'XX.', '.XX'] },
    longnoodle: { name: 'Long Noodle', color: '#ff8f3d', grid: ['....', 'XXXX', '....', '....'] },
    bolt: { name: 'Bolt', color: '#5be36b', grid: ['XX.', '.X.', '.XX'] },
    bigcorner: { name: 'Big Corner', color: '#4aa8ff', grid: ['X..', 'X..', 'XXX'] },
    fizz: { name: 'Fizz Pop', color: '#ff4f9a', grid: ['X'], bomb: true },
  };

  const POOL_1 = ['twins', 'noodle', 'elbow', 'cube'];
  const POOL_2 = POOL_1.concat(['tee', 'hook', 'zigzag']);
  const POOL_3 = POOL_2.concat(['cup', 'boot']);
  const POOL_4 = POOL_3.concat(['plus', 'stairs', 'longnoodle']);
  const POOL_5 = POOL_4.concat(['bolt', 'bigcorner']);

  /** goal = rows to pop, fall = seconds per row, fizz = chance of a Fizz Pop jelly. */
  const LEVELS = [
    { id: 1, goal: 5, pool: POOL_1, fizz: 0.1 },
    { id: 2, goal: 6, pool: POOL_1, fizz: 0.09 },
    { id: 3, goal: 7, pool: POOL_2, fizz: 0.08 },
    { id: 4, goal: 8, pool: POOL_2, fizz: 0.08 },
    { id: 5, goal: 8, pool: POOL_3, fizz: 0.07 },
    { id: 6, goal: 9, pool: POOL_3, fizz: 0.07 },
    { id: 7, goal: 10, pool: POOL_4, fizz: 0.06 },
    { id: 8, goal: 10, pool: POOL_4, fizz: 0.06 },
    { id: 9, goal: 12, pool: POOL_5, fizz: 0.05 },
    { id: 10, goal: 14, pool: POOL_5, fizz: 0.05 },
  ].map((l, i) => Object.assign(l, { fall: Math.round(1000 * Math.pow(0.85, i)) / 1000 }));

  /** Endless mode goes up a level every this many rows. */
  const ENDLESS_ROWS_PER_LEVEL = 10;

  function cellsOf(grid) {
    const out = [];
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === 'X') out.push([x, y]);
    });
    return out;
  }

  /** All four turns of a shape (clockwise), each a list of [x, y] inside its box. */
  function rotations(key) {
    const grid = SHAPES[key].grid;
    const n = grid.length;
    const list = [cellsOf(grid)];
    for (let r = 1; r < 4; r++) list.push(list[r - 1].map(([x, y]) => [n - 1 - y, x]));
    return list;
  }

  const ROTATIONS = {};
  for (const key of Object.keys(SHAPES)) ROTATIONS[key] = rotations(key);

  /** Small seeded random numbers, so tests can replay a game. */
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function emptyBoard() {
    const b = [];
    for (let y = 0; y < ROWS; y++) b.push(new Array(COLS).fill(null));
    return b;
  }

  function starsForHeight(peak) {
    if (peak <= STAR_HEIGHTS.three) return 3;
    if (peak <= STAR_HEIGHTS.two) return 2;
    return 1;
  }

  const LINE_POINTS = [0, 100, 300, 500, 800];

  /**
   * One game. opts: { level: 1..10, endless: bool, seed: number }.
   * The page calls the control methods and update(dt), then reads state and drains events.
   */
  function createGame(opts) {
    const o = opts || {};
    const rng = o.rng || makeRng(o.seed == null ? Date.now() : o.seed);
    const endless = !!o.endless;
    const g = {
      endless,
      level: endless ? 1 : Math.min(LEVEL_COUNT, Math.max(1, o.level || 1)),
      board: emptyBoard(),
      cur: null,
      next: null,
      score: 0,
      lines: 0,
      levelLines: 0,
      phase: 'play', // play | clearing | won | over
      clearRows: [],
      clearTimer: 0,
      fallTimer: 0,
      lockTimer: 0,
      lockResets: 0,
      softDrop: false,
      peak: 0,
      stars: 0,
      bag: [],
      lastWasFizz: false,
      events: [],
    };

    function levelInfo() { return LEVELS[Math.min(g.level, LEVEL_COUNT) - 1]; }
    g.levelInfo = levelInfo;
    g.goal = function () { return endless ? Infinity : levelInfo().goal; };
    g.fallInterval = function () {
      if (!endless || g.level <= LEVEL_COUNT) return levelInfo().fall;
      return Math.max(0.12, levelInfo().fall * Math.pow(0.92, g.level - LEVEL_COUNT));
    };

    function pick() {
      const info = levelInfo();
      if (!g.lastWasFizz && rng() < info.fizz) { g.lastWasFizz = true; return 'fizz'; }
      g.lastWasFizz = false;
      if (!g.bag.length) {
        g.bag = info.pool.slice();
        for (let i = g.bag.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const t = g.bag[i]; g.bag[i] = g.bag[j]; g.bag[j] = t;
        }
      }
      return g.bag.pop();
    }

    function fits(key, rot, x, y) {
      const cells = ROTATIONS[key][rot];
      for (const [cx, cy] of cells) {
        const bx = x + cx, by = y + cy;
        if (bx < 0 || bx >= COLS || by >= ROWS) return false;
        if (by >= 0 && g.board[by][bx]) return false;
      }
      return true;
    }
    g.fits = fits;

    function spawn() {
      const key = g.next || pick();
      g.next = pick();
      const cells = ROTATIONS[key][0];
      const n = SHAPES[key].grid.length;
      const minY = Math.min.apply(null, cells.map((c) => c[1]));
      const piece = { key, rot: 0, x: Math.floor((COLS - n) / 2), y: -minY };
      g.cur = piece;
      g.fallTimer = 0;
      g.lockTimer = 0;
      g.lockResets = 0;
      if (!fits(key, 0, piece.x, piece.y)) {
        g.phase = 'over';
        g.events.push({ type: 'over' });
      }
    }

    function onGround() { return !fits(g.cur.key, g.cur.rot, g.cur.x, g.cur.y + 1); }

    function touchLock() {
      if (onGround() && g.lockResets < MAX_LOCK_RESETS) { g.lockTimer = 0; g.lockResets++; }
    }

    function stackHeight() {
      for (let y = 0; y < ROWS; y++) if (g.board[y].some(Boolean)) return ROWS - y;
      return 0;
    }
    g.stackHeight = stackHeight;

    function lock() {
      const p = g.cur;
      const cells = ROTATIONS[p.key][p.rot].map(([cx, cy]) => [p.x + cx, p.y + cy]);
      g.cur = null;
      if (SHAPES[p.key].bomb) {
        const [bx, by] = cells[0];
        let popped = 0;
        const hit = [];
        for (let y = by - 1; y <= by + 1; y++) {
          for (let x = bx - 1; x <= bx + 1; x++) {
            if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
            if (g.board[y][x]) { hit.push({ x, y, key: g.board[y][x].key }); g.board[y][x] = null; popped++; }
          }
        }
        g.score += popped * 10;
        g.events.push({ type: 'fizz', x: bx, y: by, popped, cells: hit });
        spawn();
        return;
      }
      let above = false;
      for (const [x, y] of cells) {
        if (y < 0) { above = true; continue; }
        g.board[y][x] = { key: p.key };
      }
      g.peak = Math.max(g.peak, stackHeight());
      g.events.push({ type: 'land', key: p.key, cells });
      if (above) { g.phase = 'over'; g.events.push({ type: 'over' }); return; }
      const full = [];
      for (let y = 0; y < ROWS; y++) if (g.board[y].every(Boolean)) full.push(y);
      if (full.length) {
        g.phase = 'clearing';
        g.clearRows = full;
        g.clearTimer = CLEAR_TIME;
        const pts = LINE_POINTS[Math.min(4, full.length)] * g.level;
        g.score += pts;
        g.events.push({ type: 'clear', rows: full.slice(), count: full.length, points: pts });
      } else {
        spawn();
      }
    }

    function finishClear() {
      const rows = g.clearRows;
      g.board = g.board.filter((_, y) => rows.indexOf(y) < 0);
      while (g.board.length < ROWS) g.board.unshift(new Array(COLS).fill(null));
      g.clearRows = [];
      g.lines += rows.length;
      g.levelLines += rows.length;
      if (!endless && g.levelLines >= g.goal()) {
        g.phase = 'won';
        g.stars = starsForHeight(g.peak);
        g.events.push({ type: 'won', stars: g.stars });
        return;
      }
      if (endless && Math.floor(g.lines / ENDLESS_ROWS_PER_LEVEL) + 1 > g.level) {
        g.level = Math.floor(g.lines / ENDLESS_ROWS_PER_LEVEL) + 1;
        g.bag = [];
        g.events.push({ type: 'levelup', level: g.level });
      }
      g.phase = 'play';
      spawn();
    }

    g.move = function (dx) {
      if (g.phase !== 'play' || !g.cur) return false;
      if (!fits(g.cur.key, g.cur.rot, g.cur.x + dx, g.cur.y)) return false;
      g.cur.x += dx;
      touchLock();
      g.events.push({ type: 'move' });
      return true;
    };

    /** dir 1 = clockwise, -1 = the other way. Nudges sideways or up if a wall is in the way. */
    g.rotate = function (dir) {
      if (g.phase !== 'play' || !g.cur) return false;
      const p = g.cur;
      const rot = (p.rot + (dir < 0 ? 3 : 1)) % 4;
      const kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]];
      for (const [kx, ky] of kicks) {
        if (fits(p.key, rot, p.x + kx, p.y + ky)) {
          p.rot = rot; p.x += kx; p.y += ky;
          touchLock();
          g.events.push({ type: 'rotate' });
          return true;
        }
      }
      return false;
    };

    g.ghostY = function () {
      if (!g.cur) return 0;
      let y = g.cur.y;
      while (fits(g.cur.key, g.cur.rot, g.cur.x, y + 1)) y++;
      return y;
    };

    g.hardDrop = function () {
      if (g.phase !== 'play' || !g.cur) return 0;
      const y = g.ghostY();
      const dist = y - g.cur.y;
      g.cur.y = y;
      g.score += dist * 2;
      g.events.push({ type: 'drop', dist });
      lock();
      return dist;
    };

    g.setSoftDrop = function (on) { g.softDrop = !!on; };

    g.update = function (dt) {
      if (g.phase === 'clearing') {
        g.clearTimer -= dt;
        if (g.clearTimer <= 0) finishClear();
        return;
      }
      if (g.phase !== 'play' || !g.cur) return;
      const interval = g.softDrop ? Math.min(SOFT_DROP_INTERVAL, g.fallInterval()) : g.fallInterval();
      if (onGround()) {
        g.lockTimer += dt;
        g.fallTimer = 0;
        if (g.lockTimer >= LOCK_DELAY) lock();
        return;
      }
      g.fallTimer += dt;
      while (g.fallTimer >= interval && g.cur && !onGround()) {
        g.fallTimer -= interval;
        g.cur.y++;
        if (g.softDrop) g.score += 1;
      }
    };

    g.cells = function (piece) {
      const p = piece || g.cur;
      if (!p) return [];
      return ROTATIONS[p.key][p.rot].map(([cx, cy]) => [p.x + cx, p.y + cy]);
    };

    g.drainEvents = function () { const e = g.events; g.events = []; return e; };

    /** Test helper: put jellies on the board, e.g. setRow(17, 'XXXXXXXXX.'). */
    g.setRow = function (y, pattern, key) {
      for (let x = 0; x < COLS; x++) g.board[y][x] = pattern[x] === 'X' ? { key: key || 'cube' } : null;
    };
    /** Test helper: make the falling jelly a given shape at the top. */
    g.setPiece = function (key, x, rot) {
      const cells = ROTATIONS[key][rot || 0];
      const minY = Math.min.apply(null, cells.map((c) => c[1]));
      g.cur = { key, rot: rot || 0, x: x == null ? Math.floor((COLS - SHAPES[key].grid.length) / 2) : x, y: -minY };
      g.lockTimer = 0; g.fallTimer = 0; g.lockResets = 0;
    };

    spawn();
    return g;
  }

  root.JellyEngine = {
    COLS, ROWS, LEVEL_COUNT, LOCK_DELAY, STAR_HEIGHTS, ENDLESS_ROWS_PER_LEVEL,
    SHAPES, ROTATIONS, LEVELS, LINE_POINTS,
    createGame, starsForHeight, makeRng,
  };
})(typeof window !== 'undefined' ? window : globalThis);
