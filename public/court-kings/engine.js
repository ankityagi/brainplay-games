/*
 * Court Kings 3D basketball game engine:
 * 3v3 half-court rules, shot timing windows, 3D ballistic rim/backboard physics,
 * dribble crossovers & ankle-breakers, off-ball cuts/screens, passing lanes, and 3 skill drills.
 * Pure JS (no DOM, no Three.js) so index.html and Vitest unit tests share it.
 * Exposes globalThis.CourtEngine / window.CourtEngine.
 */
(function (root) {
  'use strict';

  const COURT_W = 15;
  const HALF_W = COURT_W / 2; // 7.5
  const BASELINE_Z = -7.6;
  const HALF_Z = 6.4;
  const RIM_X = 0;
  const RIM_Y = 3.05;
  const RIM_Z = -6.4;
  const RIM_R = 0.24;
  const RIM_TUBE_R = 0.02;
  const BALL_R = 0.125;
  const BACKBOARD_Z = -6.78;
  const BACKBOARD_W = 1.83;
  const BACKBOARD_BOT = 2.9;
  const BACKBOARD_TOP = 3.97;
  const THREE_PT_R = 6.25;
  const SHOT_CLOCK = 14;
  const GRAV = -14.2;

  const LEVELS = [
    {
      id: 1,
      theme: 'vines',
      roundLabel: 'Round 1 · Play-In',
      shortRound: 'R1 VINES',
      rival: 'THORNS',
      icon: '🌿',
      name: 'Vineland Roots & Vines',
      subtitle: 'Jungle vine court · wide windows & helpers',
      targetScore: 11,
      matchTime: 150,
      greenScale: 1.22,
      greenMs: { layup: 390, mid: 330, three: 290 },
      aiSpeed: 0.78,
      aiDef: 0.42,
      aiShoot: 0.45,
      helpers: true,
      doubleTeam: false,
      boss: false,
    },
    {
      id: 2,
      theme: 'ice',
      roundLabel: 'Round 2 · Wild Card',
      shortRound: 'R2 ICE',
      rival: 'SHIVERS',
      icon: '❄️',
      name: 'Cryosphere Ice Court',
      subtitle: 'Frozen glacier floor · tighter shot contests',
      targetScore: 11,
      matchTime: 150,
      greenScale: 1.1,
      greenMs: { layup: 370, mid: 310, three: 270 },
      aiSpeed: 0.86,
      aiDef: 0.55,
      aiShoot: 0.56,
      helpers: true,
      doubleTeam: false,
      boss: false,
    },
    {
      id: 3,
      theme: 'canyon',
      roundLabel: 'Quarterfinals',
      shortRound: 'QF CANYON',
      rival: 'SCORCHERS',
      icon: '🏜️',
      name: 'Red Rock Sandstorm',
      subtitle: 'Sandstone canyon arena · quick closeouts',
      targetScore: 15,
      matchTime: 165,
      greenScale: 1.0,
      greenMs: { layup: 330, mid: 270, three: 230 },
      aiSpeed: 0.94,
      aiDef: 0.68,
      aiShoot: 0.66,
      helpers: true,
      doubleTeam: false,
      boss: false,
    },
    {
      id: 4,
      theme: 'shadow',
      roundLabel: 'Semifinals',
      shortRound: 'SF SHADOW',
      rival: 'SHADOWS',
      icon: '🦇',
      name: 'Sunken City Shadow Cave',
      subtitle: 'Glowing amethyst cavern · read without arrows',
      targetScore: 15,
      matchTime: 165,
      greenScale: 0.9,
      greenMs: { layup: 310, mid: 250, three: 210 },
      aiSpeed: 1.0,
      aiDef: 0.78,
      aiShoot: 0.74,
      helpers: false,
      doubleTeam: false,
      boss: false,
    },
    {
      id: 5,
      theme: 'lava',
      roundLabel: 'Conference Finals',
      shortRound: 'CF LAVA',
      rival: 'MAGMA',
      icon: '🌋',
      name: 'Lava Coast Inferno',
      subtitle: 'Molten volcanic basalt · aggressive double-teams',
      targetScore: 17,
      matchTime: 180,
      greenScale: 0.82,
      greenMs: { layup: 270, mid: 220, three: 180 },
      aiSpeed: 1.06,
      aiDef: 0.86,
      aiShoot: 0.82,
      helpers: false,
      doubleTeam: true,
      boss: false,
    },
    {
      id: 6,
      theme: 'claw',
      roundLabel: 'Finals · For The Claw',
      shortRound: '🏆 THE CLAW',
      rival: 'APEX',
      icon: '🏆',
      name: 'The Claw Finals',
      subtitle: 'Roarball Championship · win the title & The Claw!',
      targetScore: 21,
      matchTime: 180,
      greenScale: 0.74,
      greenMs: { layup: 250, mid: 200, three: 165 },
      aiSpeed: 1.12,
      aiDef: 0.94,
      aiShoot: 0.9,
      helpers: false,
      doubleTeam: true,
      boss: true,
    },
  ];

  const DRILLS = [
    {
      id: 'shootout',
      theme: 'lava',
      name: '3-Point Shootout',
      desc: '5 racks around the Lava arc. Gold Money Balls count 2 pts!',
      duration: 60,
      starThresholds: [8, 14, 20],
    },
    {
      id: 'passing',
      theme: 'vines',
      name: 'Passing Vision',
      desc: 'Thread passes through the Vines while a gold ring glows!',
      duration: 50,
      starThresholds: [6, 12, 18],
    },
    {
      id: 'dribble',
      theme: 'ice',
      name: 'Ankle-Breaker & Finish',
      desc: 'Cross up lunging defenders on the Ice, then finish at the rim!',
      duration: 50,
      starThresholds: [4, 8, 13],
    },
  ];

  const SHOOTOUT_SPOTS = [
    { x: -6.65, z: -5.8 },
    { x: -5.2, z: -1.5 },
    { x: 0, z: 0.25 },
    { x: 5.2, z: -1.5 },
    { x: 6.65, z: -5.8 },
  ];

  const PLAYER_ARCHETYPES = [
    { num: 1, name: 'Nova', role: 'PG', speed: 5.5, height: 1.84, radius: 0.34, jump: 5.3 },
    { num: 7, name: 'Blaze', role: 'WING', speed: 5.25, height: 1.94, radius: 0.35, jump: 5.4 },
    { num: 23, name: 'Titan', role: 'BIG', speed: 4.8, height: 2.06, radius: 0.38, jump: 5.65 },
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function dist2D(ax, az, bx, bz) {
    return Math.hypot(ax - bx, az - bz);
  }

  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  function isThreePoint(x, z) {
    return Math.hypot(x - RIM_X, z - RIM_Z) >= THREE_PT_R || (z < -4.2 && Math.abs(x) >= 6.25);
  }

  function pointSegDist2D(px, pz, ax, az, bx, bz) {
    const abx = bx - ax;
    const abz = bz - az;
    const lenSq = abx * abx + abz * abz;
    if (lenSq < 1e-6) return Math.hypot(px - ax, pz - az);
    const t = clamp(((px - ax) * abx + (pz - az) * abz) / lenSq, 0, 1);
    return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
  }

  function computeContest(shooter, defenders) {
    const dxRim = RIM_X - shooter.x;
    const dzRim = RIM_Z - shooter.z;
    const rimDist = Math.max(0.01, Math.hypot(dxRim, dzRim));
    const dirX = dxRim / rimDist;
    const dirZ = dzRim / rimDist;
    let maxContest = 0;

    for (let i = 0; i < defenders.length; i++) {
      const d = defenders[i];
      const vx = d.x - shooter.x;
      const vz = d.z - shooter.z;
      const dd = Math.hypot(vx, vz);
      if (dd >= 2.35) continue;
      const dot = vx * dirX + vz * dirZ;
      if (dot <= -0.35 && dd >= 1.05) continue;

      let c = Math.max(0, 1 - dd / 2.35);
      if (d.guarding) c *= 1.25;
      if (d.y > 0.2) c *= 1.35;
      if (d.state === 'stumbled') c *= 0.1;
      if (c > maxContest) maxContest = c;
    }
    return clamp(maxContest, 0, 1);
  }

  const DEFAULT_GREEN_MS = { layup: 370, mid: 310, three: 270 };

  function computeShotWindow(shooter, defenders, level) {
    const lvl = level || LEVELS[1];
    const dist = dist2D(shooter.x, shooter.z, RIM_X, RIM_Z);
    const contest = computeContest(shooter, defenders || []);
    const isThree = isThreePoint(shooter.x, shooter.z);
    const isLayup = dist < 2.6 && (!!shooter.driving || dist < 2.15);

    const gatherTime = isLayup ? 0.25 : 0.4;
    const jumpVy = isLayup ? 3.55 : 4.26;
    const sweetTime = isLayup ? 0.5 : 0.7;
    const chargeTime = isLayup ? 0.72 : 1.0;
    const sweetSpot = sweetTime / chargeTime;

    const gms = lvl.greenMs || DEFAULT_GREEN_MS;
    let greenMs = isLayup ? gms.layup : isThree ? gms.three : gms.mid;
    greenMs *= 1 - 0.45 * contest;
    if ((shooter.catchBoost || 0) > 0) greenMs *= 1.2;

    const lvlId = lvl.id || 0;
    const tired = lvlId >= 4 && (shooter.stamina != null ? shooter.stamina : 100) < 30;
    if (tired) greenMs *= 0.8;
    greenMs = Math.max(110, Math.round(greenMs));

    const greenHalf = greenMs / 1000 / (2 * chargeTime);
    const goodHalf = greenHalf * 1.6;

    return {
      sweetSpot,
      sweetTime,
      gatherTime,
      jumpVy,
      chargeTime,
      greenMs,
      greenHalf,
      goodHalf,
      greenMin: clamp(sweetSpot - greenHalf, 0.05, 0.94),
      greenMax: clamp(sweetSpot + greenHalf, 0.06, 0.96),
      goodMin: clamp(sweetSpot - goodHalf, 0.03, 0.96),
      goodMax: clamp(sweetSpot + goodHalf, 0.05, 0.98),
      contest,
      isThree,
      isLayup,
      catchBoost: (shooter.catchBoost || 0) > 0,
      tired,
    };
  }

  function coachTip(stats) {
    if (!stats) return 'Pass to open teammates and release your shot inside the green bar!';
    if (stats.contestedShots >= 3 && stats.ast < 3) {
      return 'You forced ' + stats.contestedShots + ' contested shots. Pass to open teammates for a much wider green release!';
    }
    if (stats.fga >= 4 && stats.greens / stats.fga < 0.3) {
      return 'Watch the shot meter above your player and release right as it enters the green zone!';
    }
    if (stats.tov >= 3) {
      return 'Keep space from defenders and avoid throwing passes right across a defender in the lane.';
    }
    if (stats.ast >= 3 && stats.pts > stats.oppPts) {
      return 'Great floor vision! Moving the ball created high-percentage open looks.';
    }
    if (stats.ankleBreakers >= 2) {
      return 'Nasty handles! Keep reading defender lunges with your crossover to open driving lanes.';
    }
    if (stats.oppPts > stats.pts) {
      return 'Hold Guard between your opponent and the basket to shrink their shot window!';
    }
    return 'Solid all-around basketball! Keep mixing crossovers, screens, and catch-and-shoot jumpers.';
  }

  function createBlankInput() {
    return {
      moveX: 0,
      moveZ: 0,
      shootHeld: false,
      shootPressed: false,
      shootReleased: false,
      passPressed: false,
      passTarget: -1,
      movePressed: false,
      guardHeld: false,
      screenPressed: false,
    };
  }

  function makePlayer(id, team, idx, arch) {
    return {
      id,
      team,
      idx,
      num: arch.num,
      name: arch.name,
      role: arch.role,
      speed: arch.speed,
      height: arch.height,
      radius: arch.radius,
      jumpVel: arch.jump,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facingX: 0,
      facingZ: -1,
      stamina: 100,
      dribbleHand: 1,
      dribblePhase: 0,
      walkPhase: 0,
      state: 'idle', // idle | run | shooting | stumbled | recover
      stateT: 0,
      stumbleT: 0,
      guarding: false,
      driving: false,
      catchBoost: 0,
      openWindow: 0,
      screenActiveT: 0,
      stealLungeT: 0,
      lungeWindupT: 0,
      stealCooldown: 0,
      moveCooldown: 0,
      lastMoveAt: -10,
      sloppyT: 0,
      lastPasserId: -1,
      assistT: 0,
      shotMeter: 0,
      shotElapsed: 0,
      shotJumped: false,
      shotWindow: null,
      aiReleaseTarget: 0.7,
      shootWaitT: 0,
      cutTimer: 0,
      cutTargetX: 0,
      cutTargetZ: -2,
      aiThinkT: 0.2,
      aiRole: idx === 0 ? 'ball' : idx === 1 ? 'wing' : 'big',
      _prevShootHeld: false,
    };
  }

  function createGame(opts) {
    const o = opts || {};
    const rng = o.rng || makeRng(o.seed == null ? 1337 : o.seed);
    const mode = o.drill ? 'drill' : 'season';
    const drillCfg = mode === 'drill' ? DRILLS.find((d) => d.id === o.drill) || DRILLS[0] : null;
    const levelCfg =
      mode === 'season'
        ? LEVELS[clamp((o.level || 1) - 1, 0, LEVELS.length - 1)]
        : {
            id: 0,
            name: drillCfg.name,
            greenScale: 1.0,
            greenMs: DEFAULT_GREEN_MS,
            aiSpeed: 0.88,
            aiDef: 0.65,
            aiShoot: 0.65,
            helpers: true,
            doubleTeam: false,
          };
    const rookieAssist = o.rookieAssist != null ? !!o.rookieAssist : mode === 'drill' || levelCfg.id <= 2;

    const g = {
      mode,
      level: levelCfg.id,
      levelCfg,
      rookieAssist,
      timeScale: 1,
      drill: drillCfg ? drillCfg.id : null,
      drillCfg,
      rng,
      phase: 'playing', // playing | reset | over
      resetT: 0,
      resetPossession: 0,
      clock: 0,
      timeLeft: mode === 'drill' ? drillCfg.duration : levelCfg.matchTime,
      shotClock: SHOT_CLOCK,
      possession: 0, // 0 = blue (user), 1 = red (AI)
      needsClear: false,
      userId: 0,
      lastShotFeedback: null,
      _passPrevId: -1,
      _passPrevHoldT: 0,
      players: [],
      ball: {
        mode: 'held', // held | pass | shot | loose
        x: 0,
        y: 1.1,
        z: 2.2,
        vx: 0,
        vy: 0,
        vz: 0,
        holderId: 0,
        lastShooterId: -1,
        lastTouchTeam: 0,
        passFromId: -1,
        passToId: -1,
        passWasOpen: false,
        passStartX: 0,
        passStartY: 1.2,
        passStartZ: 0,
        passTargetX: 0,
        passTargetZ: 0,
        passT: 0,
        passDuration: 0.25,
        shotQuality: 'normal', // green | close | miss
        shotIsThree: false,
        shotContested: false,
        shotPoints: 2,
        isMoneyBall: false,
        scored: false,
        hitRim: false,
        spin: 0,
      },
      score: [0, 0],
      winner: -1,
      stars: 0,
      stats: {
        pts: 0,
        oppPts: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        reb: 0,
        tov: 0,
        greens: 0,
        contestedShots: 0,
        ankleBreakers: 0,
      },
      drillState: {
        score: 0,
        streak: 0,
        bestStreak: 0,
        makes: 0,
        attempts: 0,
        spotIdx: 0,
        ballInRack: 0,
        rep: 0,
        ankleBonusPending: false,
        cooldown: 0,
      },
      events: [],
      input: createBlankInput(),
    };

    function setUser(newId) {
      if (g.userId === newId) return;
      g.userId = newId;
      const p = g.players.find((pl) => pl.id === newId);
      if (p) emit('userSwitch', { playerId: p.id, name: p.name, num: p.num, slot: p.idx });
    }

    function emit(type, payload) {
      g.events.push(Object.assign({ type, t: g.clock }, payload || {}));
    }

    function teamPlayers(team) {
      return g.players.filter((p) => p.team === team);
    }

    function activeBallHandler() {
      if (g.ball.mode !== 'held') return null;
      return g.players.find((p) => p.id === g.ball.holderId) || null;
    }

    function setupSeasonFormation(poss) {
      g.possession = poss;
      g.needsClear = false;
      g.shotClock = SHOT_CLOCK;
      const offTeam = poss;
      const defTeam = 1 - poss;
      const off = teamPlayers(offTeam);
      const def = teamPlayers(defTeam);

      const offSpots = [
        [0, 2.2],
        [-5.2, -2.5],
        [4.5, -2.1],
      ];
      const defSpots = [
        [0, 0.25],
        [-4.1, -3.3],
        [3.5, -3.1],
      ];

      off.forEach((p, i) => {
        p.x = offSpots[i][0];
        p.z = offSpots[i][1];
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
        p.state = 'idle';
        p.stumbleT = 0;
        p.guarding = false;
        p.catchBoost = 0;
        p.openWindow = 0;
        p.screenActiveT = 0;
        p.shotMeter = 0;
        p.shotElapsed = 0;
        p.shotJumped = false;
        p.shotWindow = null;
        p.lastPasserId = -1;
        p.assistT = 0;
        p.cutTimer = i === 1 ? 1.8 : 2.6;
        p.facingX = 0;
        p.facingZ = -1;
      });
      def.forEach((p, i) => {
        p.x = defSpots[i][0];
        p.z = defSpots[i][1];
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
        p.state = 'idle';
        p.stumbleT = 0;
        p.guarding = false;
        p.shotMeter = 0;
        p.shotElapsed = 0;
        p.shotJumped = false;
        p.shotWindow = null;
        p.stealLungeT = 0;
        p.lungeWindupT = 0;
        p.facingX = 0;
        p.facingZ = 1;
      });

      const pg = off[0];
      g.ball.mode = 'held';
      g.ball.holderId = pg.id;
      g.ball.lastTouchTeam = offTeam;
      g.ball.scored = false;
      g.ball.hitRim = false;
      g._passPrevId = -1;
      g._passPrevHoldT = 0;
      if (offTeam === 0) g.userId = pg.id;
      else g.userId = def[0].id;
    }

    function setupDrill() {
      g.players = [];
      g.possession = 0;
      g.needsClear = false;
      g.shotClock = 99;
      if (g.drill === 'shootout') {
        const shooter = makePlayer(0, 0, 0, PLAYER_ARCHETYPES[0]);
        g.players.push(shooter);
        g.userId = 0;
        placeShootoutSpot(0, 0);
      } else if (g.drill === 'passing') {
        for (let i = 0; i < 3; i++) g.players.push(makePlayer(i, 0, i, PLAYER_ARCHETYPES[i]));
        for (let i = 0; i < 2; i++) {
          const d = makePlayer(3 + i, 1, i + 1, PLAYER_ARCHETYPES[i + 1]);
          d.speed *= 0.88;
          g.players.push(d);
        }
        resetPassingDrillRep();
      } else {
        // dribble drill
        const user = makePlayer(0, 0, 0, PLAYER_ARCHETYPES[0]);
        const onBall = makePlayer(1, 1, 0, PLAYER_ARCHETYPES[0]);
        const rimHelp = makePlayer(2, 1, 2, PLAYER_ARCHETYPES[2]);
        onBall.speed *= 0.94;
        rimHelp.speed *= 0.86;
        g.players.push(user, onBall, rimHelp);
        resetDribbleDrillRep();
      }
    }

    function placeShootoutSpot(spotIdx, ballInRack) {
      const shooter = g.players[0];
      const spot = SHOOTOUT_SPOTS[spotIdx % SHOOTOUT_SPOTS.length];
      shooter.x = spot.x;
      shooter.z = spot.z;
      shooter.y = 0;
      shooter.vx = 0;
      shooter.vy = 0;
      shooter.vz = 0;
      shooter.state = 'idle';
      shooter.stamina = 100;
      shooter.shotMeter = 0;
      shooter.shotElapsed = 0;
      shooter.shotJumped = false;
      shooter.shotWindow = null;
      const toRim = Math.hypot(RIM_X - shooter.x, RIM_Z - shooter.z) || 1;
      shooter.facingX = (RIM_X - shooter.x) / toRim;
      shooter.facingZ = (RIM_Z - shooter.z) / toRim;

      g.ball.mode = 'held';
      g.ball.holderId = shooter.id;
      g.ball.scored = false;
      g.ball.hitRim = false;
      g.ball.isMoneyBall = ballInRack === 2;
      g.drillState.spotIdx = spotIdx % SHOOTOUT_SPOTS.length;
      g.drillState.ballInRack = ballInRack;
      g.drillState.cooldown = 0;
    }

    function resetPassingDrillRep() {
      const [pg, w1, w2, d1, d2] = g.players;
      pg.x = 0;
      pg.z = 1.65;
      pg.y = 0;
      pg.vx = 0;
      pg.vz = 0;
      pg.state = 'idle';
      pg.facingX = 0;
      pg.facingZ = -1;

      w1.x = -5.4;
      w1.z = -2.8;
      w1.y = 0;
      w1.openWindow = 0;
      w1.cutTimer = 0.6;
      w1.cutTargetX = -1.6;
      w1.cutTargetZ = -5.1;

      w2.x = 5.4;
      w2.z = -2.8;
      w2.y = 0;
      w2.openWindow = 0;
      w2.cutTimer = 1.9;
      w2.cutTargetX = 1.6;
      w2.cutTargetZ = -5.1;

      d1.x = -3.4;
      d1.z = -3.4;
      d1.y = 0;
      d1.state = 'idle';
      d1.stumbleT = 0;
      d2.x = 3.4;
      d2.z = -3.4;
      d2.y = 0;
      d2.state = 'idle';
      d2.stumbleT = 0;

      g.userId = pg.id;
      g.ball.mode = 'held';
      g.ball.holderId = pg.id;
      g.ball.scored = false;
      g.drillState.cooldown = 0;
    }

    function resetDribbleDrillRep() {
      const [user, onBall, rimHelp] = g.players;
      user.x = 0;
      user.z = 1.9;
      user.y = 0;
      user.vx = 0;
      user.vy = 0;
      user.vz = 0;
      user.state = 'idle';
      user.stamina = 100;
      user.shotMeter = 0;
      user.shotElapsed = 0;
      user.shotJumped = false;
      user.shotWindow = null;
      user.sloppyT = 0;
      user.facingX = 0;
      user.facingZ = -1;

      onBall.x = 0;
      onBall.z = 0.15;
      onBall.y = 0;
      onBall.vx = 0;
      onBall.vz = 0;
      onBall.state = 'idle';
      onBall.stumbleT = 0;
      onBall.stealLungeT = 0;
      onBall.lungeWindupT = 0;
      onBall.stealCooldown = 0.7;
      onBall.guarding = true;
      onBall.facingX = 0;
      onBall.facingZ = 1;

      rimHelp.x = -1.35;
      rimHelp.z = -4.6;
      rimHelp.y = 0;
      rimHelp.vx = 0;
      rimHelp.vz = 0;
      rimHelp.state = 'idle';
      rimHelp.stumbleT = 0;
      rimHelp.lungeWindupT = 0;
      rimHelp.facingX = 0;
      rimHelp.facingZ = 1;

      g.possession = 0;
      g.userId = user.id;
      g.ball.mode = 'held';
      g.ball.holderId = user.id;
      g.ball.scored = false;
      g.ball.hitRim = false;
      g.drillState.ankleBonusPending = false;
      g.drillState.cooldown = 0;
    }

    function init() {
      if (mode === 'drill') {
        setupDrill();
      } else {
        for (let i = 0; i < 3; i++) g.players.push(makePlayer(i, 0, i, PLAYER_ARCHETYPES[i]));
        for (let i = 0; i < 3; i++) {
          const p = makePlayer(3 + i, 1, i, PLAYER_ARCHETYPES[i]);
          p.speed *= levelCfg.aiSpeed;
          g.players.push(p);
        }
        setupSeasonFormation(0);
      }
      syncBallToHolder(0);
    }

    function syncBallToHolder(dt) {
      if (g.ball.mode !== 'held') return;
      const h = activeBallHandler();
      if (!h) return;
      const sideX = -h.facingZ * h.dribbleHand;
      const sideZ = h.facingX * h.dribbleHand;
      const moving = Math.hypot(h.vx, h.vz) > 0.35;
      const bounceSpeed = moving ? 10.5 : 5.5;
      h.dribblePhase += dt * bounceSpeed;
      const dribbleY = h.state === 'shooting'
        ? h.height * 0.9 + h.y
        : BALL_R + Math.abs(Math.sin(h.dribblePhase)) * 0.78 + h.y;
      if (moving && dt > 0 && Math.sin(h.dribblePhase) > 0 && Math.sin(h.dribblePhase - dt * bounceSpeed) <= 0) {
        emit('dribble', { x: g.ball.x, z: g.ball.z });
      }
      g.ball.x = h.x + h.facingX * 0.28 + sideX * 0.26;
      g.ball.z = h.z + h.facingZ * 0.28 + sideZ * 0.26;
      g.ball.y = dribbleY;
    }

    function fireBallisticShot(shooter, quality, targetX, targetZ, isThree, contested, feedback) {
      const isLayup = shooter.shotWindow ? shooter.shotWindow.isLayup : dist2D(shooter.x, shooter.z, RIM_X, RIM_Z) < 2.4;
      const sx = shooter.x + shooter.facingX * 0.24;
      const sz = shooter.z + shooter.facingZ * 0.24;
      const sy = shooter.y + (isLayup ? shooter.height + 0.32 : shooter.height + 0.25);

      const d = dist2D(sx, sz, targetX, targetZ);
      const peakY = Math.max(sy, RIM_Y) + (isLayup ? 0.65 : 0.88 + d * 0.16);
      const tUp = Math.sqrt(Math.max(0.01, (2 * (peakY - sy)) / -GRAV));
      const tDown = Math.sqrt(Math.max(0.01, (2 * (peakY - RIM_Y)) / -GRAV));
      const totalT = tUp + tDown;

      const b = g.ball;
      b.mode = 'shot';
      b.holderId = -1;
      b.lastShooterId = shooter.id;
      b.lastTouchTeam = shooter.team;
      b.x = sx;
      b.y = sy;
      b.z = sz;
      b.vx = (targetX - sx) / totalT;
      b.vz = (targetZ - sz) / totalT;
      b.vy = -GRAV * tUp;
      b.shotQuality = quality;
      b.shotIsThree = isThree;
      b.shotContested = contested;
      b.shotPoints = g.mode === 'drill' && g.drill === 'shootout' && b.isMoneyBall ? 2 : isThree ? 3 : 2;
      b.scored = false;
      b.hitRim = false;
      b.spin = 1;

      if (shooter.team === 0 && g.mode === 'season') {
        g.stats.fga++;
        if (isThree) g.stats.tpa++;
        if (quality === 'green') g.stats.greens++;
        if (contested) g.stats.contestedShots++;
      }
      if (g.mode === 'drill') g.drillState.attempts++;

      shooter.state = 'recover';
      shooter.stateT = 0.32;
      shooter.shotMeter = 0;
      shooter.shotElapsed = 0;
      shooter.shotJumped = false;
      shooter.shotWindow = null;
      shooter.driving = false;
      shooter.catchBoost = 0;
      emit('shot', { playerId: shooter.id, team: shooter.team, quality, isThree, contested, feedback: feedback || null });

      // Immediate airborne block check if a defender is jumping right in front
      const defenders = teamPlayers(1 - shooter.team);
      for (let i = 0; i < defenders.length; i++) {
        const def = defenders[i];
        if (def.state === 'stumbled') continue;
        const dd = dist2D(def.x, def.z, shooter.x, shooter.z);
        if (dd < 1.65 && (def.y > 0.38 || def.vy > 1.2)) {
          b.mode = 'loose';
          b.vx = -shooter.facingX * (2.6 + rng() * 1.4) + (rng() - 0.5) * 3.0;
          b.vz = -shooter.facingZ * (2.6 + rng() * 1.4) + (rng() - 0.5) * 3.0;
          b.vy = 2.4;
          if (def.team === 0) g.stats.blk++;
          if (g.mode === 'drill') {
            g.drillState.streak = 0;
            g.drillState.cooldown = 0.75;
          }
          emit('block', { playerId: def.id, team: def.team, x: b.x, y: b.y, z: b.z });
          break;
        }
      }
    }

    function releaseShot(shooter) {
      if (!shooter || g.ball.holderId !== shooter.id || shooter.state !== 'shooting') return;
      const win = shooter.shotWindow || computeShotWindow(shooter, teamPlayers(1 - shooter.team), levelCfg);
      const meter = shooter.shotMeter;
      const diff = meter - win.sweetSpot;
      const absDiff = Math.abs(diff);

      let quality = 'miss';
      let timingLabel = diff < 0 ? 'EARLY' : 'LATE';
      let symbol = diff < 0 ? '◀' : '▶';
      let targetX = RIM_X;
      let targetZ = RIM_Z;

      if (absDiff <= win.greenHalf) {
        quality = 'green';
        timingLabel = 'PERFECT';
        symbol = '✓';
      } else if (absDiff <= win.goodHalf) {
        quality = 'good';
        timingLabel = diff < 0 ? 'SLIGHTLY EARLY' : 'SLIGHTLY LATE';
        const makeChance = clamp(0.72 - 0.32 * win.contest, 0.35, 0.75);
        if (rng() < makeChance) {
          targetX = RIM_X + (rng() - 0.5) * 0.14;
          targetZ = RIM_Z + (rng() - 0.5) * 0.14;
        } else {
          const ang = rng() * Math.PI * 2;
          const rOff = 0.21 + rng() * 0.06;
          targetX = RIM_X + Math.cos(ang) * rOff;
          targetZ = RIM_Z + Math.sin(ang) * rOff;
        }
      } else {
        quality = 'miss';
        const missDir = diff < 0 ? -1 : 1; // early = short, late = long
        const toRim = Math.max(0.01, dist2D(shooter.x, shooter.z, RIM_X, RIM_Z));
        const ux = (RIM_X - shooter.x) / toRim;
        const uz = (RIM_Z - shooter.z) / toRim;
        const side = (rng() - 0.5) * 0.52;
        const distOff = missDir * (0.28 + Math.min(0.4, absDiff * 0.65));
        targetX = RIM_X + ux * distOff - uz * side;
        targetZ = RIM_Z + uz * distOff + ux * side;
      }

      const covBase = win.catchBoost
        ? 'CATCH & SHOOT'
        : win.contest < 0.15
          ? 'WIDE OPEN'
          : win.contest < 0.5
            ? 'CONTESTED'
            : 'HEAVY CONTEST';
      const coverageLabel = covBase + (win.tired ? ' · TIRED' : '');
      const feedback = {
        playerId: shooter.id,
        team: shooter.team,
        x: shooter.x,
        y: shooter.y + shooter.height,
        z: shooter.z,
        meter,
        win,
        quality,
        timingLabel,
        symbol,
        coverageLabel,
        timer: 0.9,
      };
      if (shooter.team === 0) g.lastShotFeedback = feedback;

      fireBallisticShot(shooter, quality, targetX, targetZ, win.isThree, win.contest >= 0.45, feedback);
    }

    function beginShot(shooter) {
      if (!shooter || g.ball.mode !== 'held' || g.ball.holderId !== shooter.id) return false;
      if (shooter.state === 'shooting' || shooter.state === 'stumbled') return false;
      if (g.mode === 'season' && g.needsClear) {
        emit('mustClear', { playerId: shooter.id, x: shooter.x, z: shooter.z });
        return false;
      }
      const toRim = Math.max(0.01, dist2D(shooter.x, shooter.z, RIM_X, RIM_Z));
      shooter.facingX = (RIM_X - shooter.x) / toRim;
      shooter.facingZ = (RIM_Z - shooter.z) / toRim;
      shooter.driving = Math.hypot(shooter.vx, shooter.vz) > 2.2;
      shooter.shotWindow = computeShotWindow(shooter, teamPlayers(1 - shooter.team), levelCfg);
      shooter.aiReleaseTarget = clamp(
        shooter.shotWindow.sweetSpot + (rng() - 0.5) * (1 - levelCfg.aiShoot) * 0.24,
        0.35,
        0.96,
      );
      shooter.shotMeter = 0;
      shooter.shotElapsed = 0;
      shooter.shotJumped = false;
      shooter.shootWaitT = 0;
      shooter.state = 'shooting';
      shooter.vx *= 0.25;
      shooter.vz *= 0.25;
      return true;
    }

    function triggerMove(player) {
      if (!player || g.ball.mode !== 'held' || g.ball.holderId !== player.id) return false;
      if (player.state === 'shooting' || player.state === 'stumbled' || player.moveCooldown > 0) return false;

      player.dribbleHand = -player.dribbleHand;
      player.moveCooldown = 0.28;
      if (g.clock - player.lastMoveAt < 0.9 || player.stamina < 20) {
        player.sloppyT = 0.65;
      }
      player.lastMoveAt = g.clock;
      player.stamina = Math.max(0, player.stamina - 22);

      // Lateral + forward burst toward hoop or input direction
      const toRim = Math.max(0.01, dist2D(player.x, player.z, RIM_X, RIM_Z));
      const fwdX = (RIM_X - player.x) / toRim;
      const fwdZ = (RIM_Z - player.z) / toRim;
      const sideX = -fwdZ * player.dribbleHand;
      const sideZ = fwdX * player.dribbleHand;
      player.vx = (fwdX * 0.55 + sideX * 0.85) * (player.speed * 1.45);
      player.vz = (fwdZ * 0.55 + sideZ * 0.85) * (player.speed * 1.45);
      player.facingX = fwdX;
      player.facingZ = fwdZ;
      player.driving = true;
      emit('crossover', { playerId: player.id, sloppy: player.sloppyT > 0, x: player.x, z: player.z });

      // Check ankle-breaker on close defenders who are lunging or rushing
      const defenders = teamPlayers(1 - player.team);
      for (let i = 0; i < defenders.length; i++) {
        const def = defenders[i];
        if (def.state === 'stumbled') continue;
        const dd = dist2D(def.x, def.z, player.x, player.z);
        if (dd > 2.35) continue;
        const dx = (player.x - def.x) / Math.max(0.01, dd);
        const dz = (player.z - def.z) / Math.max(0.01, dd);
        const closing = def.vx * dx + def.vz * dz;
        if (def.lungeWindupT > 0 || def.stealLungeT > 0 || closing > 1.8 || (def.guarding && player.sloppyT <= 0 && dd < 1.85)) {
          def.state = 'stumbled';
          def.stumbleT = g.drill === 'dribble' ? 1.25 : 0.9;
          def.guarding = false;
          def.stealLungeT = 0;
          def.lungeWindupT = 0;
          def.vx = -sideX * 2.5;
          def.vz = -sideZ * 2.5;
          if (player.team === 0) g.stats.ankleBreakers++;
          if (g.mode === 'drill' && g.drill === 'dribble') {
            g.drillState.score += 1;
            g.drillState.ankleBonusPending = true;
          }
          emit('ankleBreaker', { playerId: player.id, defId: def.id, x: def.x, z: def.z });
        }
      }
      return true;
    }

    function scorePassCandidate(from, m, dirX, dirZ) {
      const dMag = Math.hypot(dirX || 0, dirZ || 0);
      const hasDir = dMag > 0.2;
      const dx = m.x - from.x;
      const dz = m.z - from.z;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      let score = 0;
      if (hasDir) {
        score += ((dx / len) * (dirX / dMag) + (dz / len) * (dirZ / dMag)) * 4;
      }
      if (m.openWindow > 0) score += 2.2;
      score -= len * 0.12;
      return score;
    }

    function computePassLane(from, target) {
      const defenders = teamPlayers(1 - from.team);
      const passDist = dist2D(from.x, from.z, target.x, target.z);
      for (let i = 0; i < defenders.length; i++) {
        const d = defenders[i];
        if (d.state === 'stumbled') continue;
        if (
          pointSegDist2D(d.x, d.z, from.x, from.z, target.x, target.z) < 0.95 &&
          dist2D(d.x, d.z, from.x, from.z) < passDist + 0.35
        ) {
          return 'risky';
        }
      }
      if (target.openWindow > 0 || computeContest(target, defenders) < 0.22) return 'open';
      return 'safe';
    }

    function pickPassTarget(from, dirX, dirZ, explicitSlot) {
      const mates = teamPlayers(from.team).filter((p) => p.id !== from.id);
      if (!mates.length) return null;
      if (explicitSlot != null && explicitSlot >= 0) {
        if (explicitSlot === from.idx) return null;
        return mates.find((p) => p.idx === explicitSlot) || null;
      }

      let best = mates[0];
      let bestScore = -1e9;
      for (let i = 0; i < mates.length; i++) {
        const m = mates[i];
        const score = scorePassCandidate(from, m, dirX, dirZ);
        if (score > bestScore) {
          bestScore = score;
          best = m;
        }
      }
      return best;
    }

    function getPassPreview(from, dirX, dirZ) {
      if (!from) return null;
      const mates = teamPlayers(from.team).filter((p) => p.id !== from.id);
      if (!mates.length) return null;

      let best = mates[0];
      let bestScore = -1e9;
      for (let i = 0; i < mates.length; i++) {
        const s = scorePassCandidate(from, mates[i], dirX, dirZ);
        if (s > bestScore) {
          bestScore = s;
          best = mates[i];
        }
      }

      let chosen = best;
      if (g._passPrevId >= 0 && g._passPrevHoldT > 0 && best.id !== g._passPrevId) {
        const prev = mates.find((m) => m.id === g._passPrevId);
        if (prev) {
          const prevScore = scorePassCandidate(from, prev, dirX, dirZ);
          if (bestScore - prevScore < 1.4) chosen = prev;
        }
      }
      if (chosen.id !== g._passPrevId) {
        g._passPrevId = chosen.id;
        g._passPrevHoldT = 0.25;
      }

      return {
        target: chosen,
        targetId: chosen.id,
        slot: chosen.idx,
        keyNum: chosen.idx + 1,
        name: chosen.name,
        lane: computePassLane(from, chosen),
      };
    }

    function triggerPass(from, dirX, dirZ, explicitSlot) {
      if (!from || g.ball.mode !== 'held' || g.ball.holderId !== from.id) return false;
      if (from.state === 'shooting' || from.state === 'stumbled') return false;
      let target = null;
      if (explicitSlot != null && explicitSlot >= 0) {
        target = pickPassTarget(from, dirX, dirZ, explicitSlot);
      } else {
        const preview = getPassPreview(from, dirX, dirZ);
        target = preview ? preview.target : null;
      }
      if (!target) return false;

      const d = dist2D(from.x, from.z, target.x, target.z);
      const dur = clamp(d / 16.5, 0.16, 0.46);
      const leadX = clamp(target.x + target.vx * dur * 0.58, -HALF_W + 0.5, HALF_W - 0.5);
      const leadZ = clamp(target.z + target.vz * dur * 0.58, BASELINE_Z + 0.5, HALF_Z - 0.5);

      const b = g.ball;
      b.mode = 'pass';
      b.holderId = -1;
      b.passFromId = from.id;
      b.passToId = target.id;
      b.passWasOpen = target.openWindow > 0;
      b.passStartX = from.x;
      b.passStartY = 1.25 + from.y;
      b.passStartZ = from.z;
      b.passTargetX = leadX;
      b.passTargetZ = leadZ;
      b.passT = 0;
      b.passDuration = dur;
      b.lastTouchTeam = from.team;

      const pLen = Math.max(0.01, dist2D(from.x, from.z, leadX, leadZ));
      from.facingX = (leadX - from.x) / pLen;
      from.facingZ = (leadZ - from.z) / pLen;
      from.state = 'recover';
      from.stateT = 0.16;
      emit('pass', { fromId: from.id, toId: target.id, open: b.passWasOpen });
      return true;
    }

    function triggerSteal(def) {
      if (!def || def.state === 'stumbled' || def.stealCooldown > 0) return false;
      def.stealLungeT = 0.24;
      def.stealCooldown = 0.8;
      const handler = activeBallHandler();
      if (!handler || handler.team === def.team || handler.state === 'shooting') {
        emit('stealAttempt', { playerId: def.id, team: def.team, inRange: false });
        return true;
      }
      const dd = dist2D(def.x, def.z, handler.x, handler.z);
      if (def.team === 0 && dd < 2.4 && dd > 0.4) {
        const ux = (handler.x - def.x) / dd;
        const uz = (handler.z - def.z) / dd;
        def.vx = ux * 4.2;
        def.vz = uz * 4.2;
        def.facingX = ux;
        def.facingZ = uz;
      }
      const reach = def.team === 0 ? 1.85 : 1.55;
      emit('stealAttempt', { playerId: def.id, team: def.team, inRange: dd <= reach });
      if (dd > reach) return true;

      let chance = def.team === 0 ? 0.48 : 0.26 * (0.6 + levelCfg.aiDef * 0.6);
      if (handler.sloppyT > 0) chance += 0.35;
      else if (handler.moveCooldown > 0.12) chance += 0.35;
      if (handler.guarding) chance *= 0.35;

      if (rng() < chance) {
        if (g.mode === 'drill' && g.drill === 'dribble') {
          g.ball.mode = 'loose';
          g.ball.holderId = -1;
          g.ball.vx = (def.facingX || 0) * 2.4 + (rng() - 0.5) * 1.5;
          g.ball.vz = (def.facingZ || 1) * 2.4 + (rng() - 0.5) * 1.5;
          g.ball.vy = 2.6;
          g.possession = 0;
          g.drillState.streak = 0;
          g.drillState.ankleBonusPending = false;
          g.drillState.cooldown = 0.75;
          emit('steal', { playerId: def.id, team: def.team, drillReset: true, x: def.x, z: def.z });
          return true;
        }
        // Clean steal!
        const oldTeam = handler.team;
        g.ball.mode = 'held';
        g.ball.holderId = def.id;
        g.ball.lastTouchTeam = def.team;
        g.possession = def.team;
        g.shotClock = SHOT_CLOCK;
        g.needsClear = g.mode === 'season';
        if (def.team === 0) {
          setUser(def.id);
          g.stats.stl++;
        } else if (oldTeam === 0) {
          g.stats.tov++;
        }
        emit('steal', { playerId: def.id, team: def.team, x: def.x, z: def.z });
        if (g.needsClear) emit('clearArc', { team: def.team });
      }
      return true;
    }

    function triggerJump(p) {
      if (!p || p.y > 0.05 || p.state === 'stumbled' || p.state === 'shooting') return false;
      p.vy = p.jumpVel;
      p.y = 0.01;
      return true;
    }

    function switchDefender() {
      const blue = teamPlayers(0);
      if (blue.length <= 1) return;
      const handler = activeBallHandler();
      const refX = handler ? handler.x : g.ball.x;
      const refZ = handler ? handler.z : g.ball.z;
      let best = blue[0];
      let bestD = 1e9;
      for (let i = 0; i < blue.length; i++) {
        if (blue[i].id === g.userId) continue;
        const d = dist2D(blue[i].x, blue[i].z, refX, refZ);
        if (d < bestD) {
          bestD = d;
          best = blue[i];
        }
      }
      setUser(best.id);
    }

    function callScreen() {
      if (g.mode !== 'season' || g.possession !== 0) return false;
      const handler = activeBallHandler();
      if (!handler || handler.team !== 0) return false;
      const mates = teamPlayers(0).filter((p) => p.id !== handler.id);
      if (!mates.length) return false;
      // Prefer the Big (#23) if available
      const screener = mates.find((m) => m.role === 'BIG') || mates[0];
      screener.screenActiveT = 2.4;
      emit('screenCalled', { screenerId: screener.id });
      return true;
    }

    function handleUserInput(dt) {
      const user = g.players.find((p) => p.id === g.userId);
      const inp = g.input;
      const shootPressed = !!inp.shootPressed || (!!inp.shootHeld && !user._prevShootHeld);
      const shootReleased = !!inp.shootReleased || (!inp.shootHeld && !!user._prevShootHeld);
      user._prevShootHeld = !!inp.shootHeld;

      const onOffense = g.mode === 'drill' || g.possession === 0;
      const hasBall = g.ball.mode === 'held' && g.ball.holderId === user.id;

      if (user.state !== 'stumbled') {
        if (onOffense && hasBall) {
          user.guarding = !!inp.guardHeld;
          if (inp.screenPressed) callScreen();
          if (inp.passPressed || inp.passTarget >= 0) {
            triggerPass(user, inp.moveX, inp.moveZ, inp.passTarget >= 0 ? inp.passTarget : -1);
          } else if (inp.movePressed) {
            triggerMove(user);
          } else if (shootPressed) {
            beginShot(user);
          } else if (user.state === 'shooting' && shootReleased) {
            releaseShot(user);
          }
        } else if (onOffense && g.mode === 'season') {
          user.guarding = false;
          if (inp.screenPressed) callScreen();
          if (shootPressed) triggerJump(user);
        } else {
          // Defense
          user.guarding = !!inp.guardHeld;
          if (inp.passPressed) switchDefender();
          if (inp.movePressed) triggerSteal(user);
          if (shootPressed) triggerJump(user);
        }
      }

      // Movement (not during shooting or stumble; move burst keeps short impulse)
      if (user.state !== 'shooting' && user.state !== 'stumbled' && user.moveCooldown <= 0.14) {
        let mx = inp.moveX || 0;
        let mz = inp.moveZ || 0;
        const mag = Math.hypot(mx, mz);
        if (mag > 1) {
          mx /= mag;
          mz /= mag;
        }
        if (g.mode === 'drill' && g.drill === 'shootout') {
          mx = 0;
          mz = 0;
        }
        const spd = user.speed * (user.guarding ? 0.72 : 1.0) * (user.stamina < 15 ? 0.8 : 1.0);
        user.vx = lerp(user.vx, mx * spd, clamp(dt * 14, 0, 1));
        user.vz = lerp(user.vz, mz * spd, clamp(dt * 14, 0, 1));
        if (mag > 0.15) {
          if (user.guarding) {
            const h = activeBallHandler();
            if (h) {
              const td = Math.max(0.01, dist2D(user.x, user.z, h.x, h.z));
              user.facingX = (h.x - user.x) / td;
              user.facingZ = (h.z - user.z) / td;
            }
          } else {
            user.facingX = mx / mag;
            user.facingZ = mz / mag;
          }
          user.state = 'run';
          user.walkPhase += dt * spd * 2.4;
        } else {
          user.state = 'idle';
        }
      }

      // Clear one-shot input edge flags
      inp.shootPressed = false;
      inp.shootReleased = false;
      inp.passPressed = false;
      inp.passTarget = -1;
      inp.movePressed = false;
      inp.screenPressed = false;
    }

    function moveToward(p, tx, tz, speedMult, dt) {
      if (p.state === 'stumbled' || p.state === 'shooting') return;
      const dx = tx - p.x;
      const dz = tz - p.z;
      const d = Math.hypot(dx, dz);
      const spd = p.speed * speedMult;
      if (d > 0.18) {
        p.vx = lerp(p.vx, (dx / d) * spd, clamp(dt * 10, 0, 1));
        p.vz = lerp(p.vz, (dz / d) * spd, clamp(dt * 10, 0, 1));
        p.facingX = dx / d;
        p.facingZ = dz / d;
        p.state = 'run';
        p.walkPhase += dt * spd * 2.4;
      } else {
        p.vx = lerp(p.vx, 0, clamp(dt * 12, 0, 1));
        p.vz = lerp(p.vz, 0, clamp(dt * 12, 0, 1));
        p.state = 'idle';
      }
    }

    function updateTeammateOffenseAI(p, handler, defenders, dt) {
      if (p.id === g.userId || p.state === 'shooting' || p.state === 'stumbled') return;
      // Pick & Roll screen behavior
      if (p.screenActiveT > 0 && handler && handler.team === p.team) {
        p.screenActiveT = Math.max(0, p.screenActiveT - dt);
        const side = handler.x > 0 ? -1 : 1;
        const sx = clamp(handler.x + side * 1.15, -HALF_W + 1, HALF_W - 1);
        const sz = clamp(handler.z - 0.85, BASELINE_Z + 1, HALF_Z - 1);
        if (dist2D(p.x, p.z, sx, sz) < 0.7 && p.screenActiveT < 1.2) {
          // Roll to basket!
          p.cutTimer = 1.6;
          p.cutTargetX = side * 1.2;
          p.cutTargetZ = -5.2;
          p.screenActiveT = 0;
        } else {
          moveToward(p, sx, sz, 0.95, dt);
          return;
        }
      }

      p.cutTimer -= dt;
      if (p.cutTimer <= 0) {
        // Alternate between open 3PT spacing & crisp backdoor cuts
        const isWing = p.aiRole === 'wing';
        const doCut = rng() < 0.55;
        if (doCut) {
          p.cutTimer = 1.8 + rng() * 1.1;
          p.cutTargetX = (isWing ? -1 : 1) * (1.1 + rng() * 1.5);
          p.cutTargetZ = -5.4 + rng() * 1.1;
        } else {
          p.cutTimer = 2.2 + rng() * 1.4;
          p.cutTargetX = (isWing ? -1 : 1) * (5.2 + rng() * 1.4);
          p.cutTargetZ = -4.2 + rng() * 3.0;
        }
      }

      moveToward(p, p.cutTargetX, p.cutTargetZ, 0.88, dt);

      // Compute nearest defender separation for golden openWindow
      let minDef = 99;
      for (let i = 0; i < defenders.length; i++) {
        const dd = dist2D(p.x, p.z, defenders[i].x, defenders[i].z);
        if (dd < minDef) minDef = dd;
      }
      if (minDef >= 2.25 && dist2D(p.x, p.z, RIM_X, RIM_Z) <= 7.8) {
        p.openWindow = Math.max(p.openWindow, 0.45);
      }
    }

    function updateDefenseAI(d, assignment, handler, dt) {
      if (d.id === g.userId || d.state === 'stumbled') return;
      d.aiThinkT -= dt;

      const isOnBall = handler && assignment && handler.id === assignment.id;
      if (isOnBall) {
        // Stay between ball handler and the rim
        const toRim = Math.max(0.01, dist2D(handler.x, handler.z, RIM_X, RIM_Z));
        const tx = handler.x + ((RIM_X - handler.x) / toRim) * (1.25 - 0.3 * levelCfg.aiDef);
        const tz = handler.z + ((RIM_Z - handler.z) / toRim) * (1.25 - 0.3 * levelCfg.aiDef);
        d.guarding = dist2D(d.x, d.z, handler.x, handler.z) < 2.2;
        moveToward(d, clamp(tx, -HALF_W + 0.5, HALF_W - 0.5), clamp(tz, BASELINE_Z + 0.5, HALF_Z - 0.5), 0.92, dt);

        if (d.guarding) {
          d.facingX = (handler.x - d.x) / Math.max(0.01, dist2D(d.x, d.z, handler.x, handler.z));
          d.facingZ = (handler.z - d.z) / Math.max(0.01, dist2D(d.x, d.z, handler.x, handler.z));
        }
        // Contest jump if handler is shooting
        if (handler.state === 'shooting' && handler.shotMeter > 0.35 && d.y <= 0.02 && dist2D(d.x, d.z, handler.x, handler.z) < 2.1) {
          if (rng() < levelCfg.aiDef * 0.75) triggerJump(d);
        }
        // Steal lunge if sloppy or close
        if (d.aiThinkT <= 0 && dist2D(d.x, d.z, handler.x, handler.z) < 1.5 && d.stealCooldown <= 0) {
          d.aiThinkT = 0.55;
          if (handler.sloppyT > 0 || rng() < levelCfg.aiDef * 0.25) triggerSteal(d);
        }
        return;
      }

      // Off-ball help defense (or double team on higher levels)
      if (levelCfg.doubleTeam && handler && handler.team !== d.team && handler.sloppyT > 0 && d.idx === 2) {
        moveToward(d, handler.x + 0.8, handler.z - 0.5, 0.96, dt);
        d.guarding = true;
        return;
      }

      if (assignment) {
        const helpPull = 0.32 + 0.14 * levelCfg.aiDef;
        const tx = lerp(assignment.x, RIM_X, helpPull);
        const tz = lerp(assignment.z, RIM_Z, helpPull);
        d.guarding = false;
        moveToward(d, tx, tz, 0.84, dt);
      }
    }

    function updateAIBallHandler(p, defenders, mates, dt) {
      if (p.state === 'shooting') {
        const win = p.shotWindow;
        if (win && p.shotMeter >= (p.aiReleaseTarget || win.sweetSpot)) {
          releaseShot(p);
        }
        return;
      }
      if (p.state === 'stumbled') return;

      // Clear the arc first if needed!
      if (g.needsClear) {
        const dRim = dist2D(p.x, p.z, RIM_X, RIM_Z);
        if (dRim < THREE_PT_R + 0.45) {
          const ux = (p.x - RIM_X) / Math.max(0.01, dRim);
          const uz = (p.z - RIM_Z) / Math.max(0.01, dRim);
          moveToward(p, RIM_X + ux * (THREE_PT_R + 0.8), RIM_Z + uz * (THREE_PT_R + 0.8), 0.95, dt);
          return;
        }
      }

      const dRim = dist2D(p.x, p.z, RIM_X, RIM_Z);
      const contest = computeContest(p, defenders);
      p.aiThinkT -= dt;

      if (p.aiThinkT <= 0) {
        p.aiThinkT = 0.38 - levelCfg.aiDef * 0.14;
        // Shoot if open or shot clock is low
        if ((contest < 0.35 && dRim < 7.2 && rng() < 0.45 + levelCfg.aiShoot * 0.35) || g.shotClock < 2.2) {
          beginShot(p);
          return;
        }
        // Pass to an open teammate if defended closely
        if (contest >= 0.42 && mates.length) {
          for (let i = 0; i < mates.length; i++) {
            if (mates[i].openWindow > 0 || computeContest(mates[i], defenders) < 0.2) {
              triggerPass(p, mates[i].x - p.x, mates[i].z - p.z, mates[i].idx);
              return;
            }
          }
        }
        // Crossover drive
        if (contest > 0.35 && p.stamina > 35 && rng() < 0.45) {
          triggerMove(p);
          return;
        }
      }

      // Drive toward basket lane
      const sideBias = p.idx === 0 ? 0 : p.idx === 1 ? -1.4 : 1.4;
      moveToward(p, sideBias, -4.6, 0.9, dt);
    }

    function updateDrillAI(dt) {
      if (g.drill === 'passing') {
        const [pg, w1, w2, d1, d2] = g.players;
        const mates = [w1, w2];
        const defs = [d1, d2];
        for (let i = 0; i < 2; i++) {
          const w = mates[i];
          const d = defs[i];
          w.cutTimer -= dt;
          if (w.cutTimer <= 0) {
            w.cutTimer = 2.1 + rng() * 0.9;
            const atWing = Math.abs(w.x) > 3.6;
            if (atWing) {
              w.cutTargetX = (i === 0 ? -1.4 : 1.4) + (rng() - 0.5) * 0.9;
              w.cutTargetZ = -5.2 + rng() * 0.9;
            } else {
              w.cutTargetX = (i === 0 ? -5.5 : 5.5) + (rng() - 0.5) * 0.8;
              w.cutTargetZ = -2.2 - rng() * 2.2;
            }
          }
          moveToward(w, w.cutTargetX, w.cutTargetZ, 0.92, dt);

          // Defenders lag behind sharp cuts, opening timing windows!
          const lagX = lerp(w.x, pg.x, 0.28);
          const lagZ = lerp(w.z, pg.z, 0.28);
          moveToward(d, lagX, lagZ, 0.72, dt);

          const sep = dist2D(w.x, w.z, d.x, d.z);
          const laneBlocked = pointSegDist2D(d.x, d.z, pg.x, pg.z, w.x, w.z) < 0.85;
          if (sep > 1.75 && !laneBlocked) {
            w.openWindow = 0.35;
          } else {
            w.openWindow = Math.max(0, w.openWindow - dt * 1.5);
          }
        }
      } else if (g.drill === 'dribble') {
        const [user, onBall, rimHelp] = g.players;
        const userHasBall = g.ball.mode === 'held' && g.ball.holderId === user.id;
        if (userHasBall && onBall.state !== 'stumbled') {
          if (onBall.lungeWindupT > 0) {
            onBall.lungeWindupT -= dt;
            onBall.vx = 0;
            onBall.vz = 0;
            onBall.guarding = true;
            const td = Math.max(0.01, dist2D(onBall.x, onBall.z, user.x, user.z));
            onBall.facingX = (user.x - onBall.x) / td;
            onBall.facingZ = (user.z - onBall.z) / td;
            if (onBall.lungeWindupT <= 0) {
              onBall.lungeWindupT = 0;
              triggerSteal(onBall);
              onBall.stealCooldown = 1.4;
            }
          } else {
            const toRim = Math.max(0.01, dist2D(user.x, user.z, RIM_X, RIM_Z));
            const tx = user.x + ((RIM_X - user.x) / toRim) * 1.15;
            const tz = user.z + ((RIM_Z - user.z) / toRim) * 1.15;
            onBall.guarding = dist2D(onBall.x, onBall.z, user.x, user.z) < 2.2;
            moveToward(onBall, clamp(tx, -HALF_W + 0.6, HALF_W - 0.6), clamp(tz, BASELINE_Z + 0.6, HALF_Z - 0.6), 0.86, dt);
            if (onBall.stealCooldown <= 0 && dist2D(onBall.x, onBall.z, user.x, user.z) < 2.25) {
              onBall.lungeWindupT = 0.55;
              emit('lungeCue', { defId: onBall.id, x: onBall.x, z: onBall.z });
            }
          }
        }
        // Help rim protector shifts side to side near the paint
        if (userHasBall || g.ball.mode === 'shot') {
          const helpX = clamp(user.x * 0.45, -2.0, 2.0);
          moveToward(rimHelp, helpX, -4.9, 0.82, dt);
          if (user.state === 'shooting' && rimHelp.y <= 0.02 && dist2D(rimHelp.x, rimHelp.z, user.x, user.z) < 2.1) {
            triggerJump(rimHelp);
          }
        }
      }
    }

    function updateSeasonAI(dt) {
      const handler = activeBallHandler();
      const offTeam = g.possession;
      const off = teamPlayers(offTeam);
      const def = teamPlayers(1 - offTeam);
      const chaseBall = g.ball.mode === 'loose' || (g.ball.mode === 'shot' && !g.ball.scored && g.ball.hitRim);

      if (chaseBall) {
        // Closest non-user player on each team crashes for the rebound / loose ball
        for (const grp of [off, def]) {
          let best = null;
          let bestD = 1e9;
          for (let i = 0; i < grp.length; i++) {
            const p = grp[i];
            if (p.id === g.userId || p.state === 'stumbled') continue;
            const d = dist2D(p.x, p.z, g.ball.x, g.ball.z);
            if (d < bestD) {
              bestD = d;
              best = p;
            }
          }
          if (best) {
            moveToward(best, g.ball.x, g.ball.z, 1.02, dt);
            if (best.y <= 0.02 && g.ball.y > 1.75 && g.ball.y < 3.0 && bestD < 1.25 && rng() < 0.15 + levelCfg.aiDef * 0.25) {
              triggerJump(best);
            }
          }
        }
      }

      for (let i = 0; i < off.length; i++) {
        const p = off[i];
        if (handler && p.id === handler.id && p.team === 1) {
          updateAIBallHandler(p, def, off.filter((m) => m.id !== p.id), dt);
        } else if (p.id !== g.userId && !chaseBall) {
          updateTeammateOffenseAI(p, handler, def, dt);
        }
      }
      for (let i = 0; i < def.length; i++) {
        const d = def[i];
        const assign = off[i % off.length];
        if (!chaseBall) updateDefenseAI(d, assign, handler, dt);
      }
    }

    function updatePlayersPhysics(dt) {
      for (let i = 0; i < g.players.length; i++) {
        const p = g.players[i];
        p.moveCooldown = Math.max(0, p.moveCooldown - dt);
        p.stealLungeT = Math.max(0, p.stealLungeT - dt);
        p.stealCooldown = Math.max(0, p.stealCooldown - dt);
        p.sloppyT = Math.max(0, p.sloppyT - dt);
        p.catchBoost = Math.max(0, p.catchBoost - dt);
        p.openWindow = Math.max(0, p.openWindow - dt);
        p.assistT = Math.max(0, p.assistT - dt);
        if (p.assistT <= 0) p.lastPasserId = -1;

        if (p.state === 'stumbled') {
          p.stumbleT -= dt;
          p.vx *= Math.pow(0.08, dt);
          p.vz *= Math.pow(0.08, dt);
          if (p.stumbleT <= 0) p.state = 'idle';
        } else if (p.state === 'recover') {
          p.stateT -= dt;
          p.vx *= Math.pow(0.12, dt);
          p.vz *= Math.pow(0.12, dt);
          if (p.stateT <= 0) p.state = 'idle';
        } else if (p.state === 'shooting') {
          const win = p.shotWindow || { gatherTime: 0.4, jumpVy: 4.26, chargeTime: 1.0 };
          p.shotElapsed += dt;
          if (!p.shotJumped && p.shotElapsed >= win.gatherTime) {
            p.shotJumped = true;
            if (p.y <= 0.02) p.vy = win.jumpVy;
          }
          p.shotMeter = p.shotElapsed / win.chargeTime;
          if (p.shotMeter >= 1.05) {
            p.shotMeter = 1.05;
            releaseShot(p);
          }
        }

        // Stamina recovery / drain
        if (p.state === 'run' && p.moveCooldown <= 0) {
          p.stamina = clamp(p.stamina - 6 * dt, 0, 100);
        } else {
          p.stamina = clamp(p.stamina + 18 * dt, 0, 100);
        }

        // Integrate position & jump
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        if (p.y > 0 || p.vy > 0) {
          p.y += p.vy * dt + 0.5 * GRAV * dt * dt;
          p.vy += GRAV * dt;
          if (p.y <= 0) {
            p.y = 0;
            p.vy = 0;
          }
        }

        // Court boundaries (out-of-bounds turnover if user ball handler steps out in season mode)
        const outX = Math.abs(p.x) > HALF_W - 0.12;
        const outZ = p.z < BASELINE_Z + 0.12 || p.z > HALF_Z - 0.12;
        if (g.mode === 'season' && g.ball.mode === 'held' && g.ball.holderId === p.id && (outX || outZ)) {
          const oldTeam = p.team;
          if (oldTeam === 0) g.stats.tov++;
          emit('outOfBounds', { team: oldTeam, x: p.x, z: p.z });
          g.phase = 'reset';
          g.resetT = 0.75;
          g.resetPossession = 1 - oldTeam;
        }
        p.x = clamp(p.x, -HALF_W + p.radius, HALF_W - p.radius);
        p.z = clamp(p.z, BASELINE_Z + p.radius, HALF_Z - p.radius);

        // Clear-the-arc check when ball handler steps behind 3PT arc
        if (g.needsClear && g.ball.mode === 'held' && g.ball.holderId === p.id && isThreePoint(p.x, p.z)) {
          g.needsClear = false;
          emit('cleared', { team: p.team, x: p.x, z: p.z });
        }
      }

      // Soft player-player separation
      for (let i = 0; i < g.players.length; i++) {
        for (let j = i + 1; j < g.players.length; j++) {
          const a = g.players[i];
          const b = g.players[j];
          const minD = a.radius + b.radius;
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const d = Math.hypot(dx, dz);
          if (d < minD && d > 1e-4) {
            const push = (minD - d) * 0.5;
            const nx = dx / d;
            const nz = dz / d;
            a.x -= nx * push;
            a.z -= nz * push;
            b.x += nx * push;
            b.z += nz * push;
          }
        }
      }
    }

    function handleBucket(team, pts, isThree, quality) {
      const b = g.ball;
      b.scored = true;
      emit('swish', { team, pts, isThree, quality });

      if (g.mode === 'drill') {
        const ds = g.drillState;
        ds.makes++;
        ds.streak++;
        if (ds.streak > ds.bestStreak) ds.bestStreak = ds.streak;
        if (g.drill === 'shootout') {
          ds.score += pts + (quality === 'green' && ds.streak >= 3 ? 1 : 0);
          ds.cooldown = 0.65;
        } else if (g.drill === 'dribble') {
          ds.score += 2 + (ds.ankleBonusPending ? 1 : 0);
          ds.ankleBonusPending = false;
          ds.cooldown = 0.7;
        }
        emit('score', { team: 0, pts, drillScore: ds.score });
        return;
      }

      g.score[team] += pts;
      if (team === 0) {
        g.stats.pts = g.score[0];
        g.stats.fgm++;
        if (isThree) g.stats.tpm++;
        const shooter = g.players.find((p) => p.id === b.lastShooterId);
        if (shooter && shooter.lastPasserId >= 0 && shooter.assistT > 0) {
          g.stats.ast++;
        }
      } else {
        g.stats.oppPts = g.score[1];
      }

      emit('score', { team, pts, score: g.score.slice() });

      if (g.score[team] >= levelCfg.targetScore) {
        finishGame(team);
      } else {
        g.phase = 'reset';
        g.resetT = 1.05;
        g.resetPossession = 1 - team;
      }
    }

    function updateBall(dt) {
      const b = g.ball;
      if (b.mode === 'held') {
        syncBallToHolder(dt);
        return;
      }

      if (b.mode === 'pass') {
        b.passT += dt;
        const u = clamp(b.passT / b.passDuration, 0, 1);
        const dist = dist2D(b.passStartX, b.passStartZ, b.passTargetX, b.passTargetZ);
        b.x = lerp(b.passStartX, b.passTargetX, u);
        b.z = lerp(b.passStartZ, b.passTargetZ, u);
        b.y = lerp(b.passStartY, 1.28, u) + Math.sin(u * Math.PI) * (0.16 + dist * 0.025);

        // Interception check against defenders in the pass corridor
        const receiver = g.players.find((p) => p.id === b.passToId);
        const defTeam = receiver ? 1 - receiver.team : 1;
        const defenders = teamPlayers(defTeam);
        for (let i = 0; i < defenders.length; i++) {
          const def = defenders[i];
          if (def.state === 'stumbled' || def.stealCooldown > 0.35) continue;
          const dd = dist2D(def.x, def.z, b.x, b.z);
          if (dd < 0.65 && b.y < 2.2) {
            const interceptChance = g.mode === 'drill' ? 0.92 : 0.45 + levelCfg.aiDef * 0.45;
            if (rng() < interceptChance) {
              if (g.mode === 'drill' && g.drill === 'passing') {
                g.drillState.attempts++;
                g.drillState.streak = 0;
                g.drillState.cooldown = 0.55;
                b.mode = 'loose';
                b.vx = (rng() - 0.5) * 3;
                b.vz = 2.5;
                b.vy = 2.2;
                emit('intercept', { defId: def.id, x: b.x, z: b.z });
                return;
              }
              if (receiver && receiver.team === 0) g.stats.tov++;
              b.mode = 'held';
              b.holderId = def.id;
              b.lastTouchTeam = def.team;
              g.possession = def.team;
              g.shotClock = SHOT_CLOCK;
              g.needsClear = true;
              if (def.team === 0) {
                setUser(def.id);
                g.stats.stl++;
              }
              emit('intercept', { defId: def.id, team: def.team, x: def.x, z: def.z });
              emit('clearArc', { team: def.team });
              return;
            }
          }
        }

        if (u >= 1 && receiver) {
          b.mode = 'held';
          b.holderId = receiver.id;
          b.lastTouchTeam = receiver.team;
          receiver.lastPasserId = b.passFromId;
          receiver.assistT = 3.2;

          const defContest = computeContest(receiver, defenders);
          const goodPass = b.passWasOpen || defContest < 0.22;
          if (goodPass) {
            receiver.catchBoost = 1.6;
            emit('greatPass', { fromId: b.passFromId, toId: receiver.id, x: receiver.x, z: receiver.z });
          }
          if (receiver.team === 0 && g.mode === 'season') {
            setUser(receiver.id);
          }
          if (g.mode === 'drill' && g.drill === 'passing') {
            const ds = g.drillState;
            ds.attempts++;
            if (goodPass) {
              ds.makes++;
              ds.streak++;
              if (ds.streak > ds.bestStreak) ds.bestStreak = ds.streak;
              ds.score += 2 + (ds.streak >= 3 ? 1 : 0);
            } else {
              ds.streak = 0;
              ds.score += 1;
            }
            ds.cooldown = 0.6;
            emit('score', { team: 0, pts: goodPass ? 2 : 1, drillScore: ds.score });
          }
        }
        return;
      }

      // Shot or loose ball: sub-stepped ballistic integration for exact rim/backboard precision
      const subSteps = b.mode === 'shot' ? 4 : 2;
      const hdt = dt / subSteps;
      for (let s = 0; s < subSteps; s++) {
        const prevX = b.x;
        const prevY = b.y;
        const prevZ = b.z;

        b.x += b.vx * hdt;
        b.z += b.vz * hdt;
        b.y += b.vy * hdt + 0.5 * GRAV * hdt * hdt;
        b.vy += GRAV * hdt;

        // Backboard front & back plane collision
        if (
          prevZ > BACKBOARD_Z + BALL_R &&
          b.z <= BACKBOARD_Z + BALL_R &&
          b.vz < 0 &&
          Math.abs(b.x) <= BACKBOARD_W * 0.5 &&
          b.y >= BACKBOARD_BOT &&
          b.y <= BACKBOARD_TOP
        ) {
          b.z = BACKBOARD_Z + BALL_R + 0.005;
          b.vz = -b.vz * 0.62;
          b.vx *= 0.85;
          emit('backboard', { x: b.x, y: b.y, z: b.z });
        } else if (
          prevZ < BACKBOARD_Z - BALL_R &&
          b.z >= BACKBOARD_Z - BALL_R &&
          b.vz > 0 &&
          Math.abs(b.x) <= BACKBOARD_W * 0.5 &&
          b.y >= BACKBOARD_BOT &&
          b.y <= BACKBOARD_TOP
        ) {
          b.z = BACKBOARD_Z - BALL_R - 0.005;
          b.vz = -b.vz * 0.55;
          b.vx *= 0.85;
          emit('backboard', { x: b.x, y: b.y, z: b.z });
        }

        // Hoop score detection (crossing downward inside RIM_R)
        if (!b.scored && prevY >= RIM_Y && b.y < RIM_Y) {
          const alpha = (prevY - RIM_Y) / Math.max(1e-6, prevY - b.y);
          const cx = lerp(prevX, b.x, alpha);
          const cz = lerp(prevZ, b.z, alpha);
          const hr = dist2D(cx, cz, RIM_X, RIM_Z);
          if (hr < RIM_R - BALL_R * 0.35) {
            const shooter = g.players.find((p) => p.id === b.lastShooterId);
            const team = shooter ? shooter.team : b.lastTouchTeam;
            b.vx *= 0.25;
            b.vz *= 0.25;
            handleBucket(team, b.shotPoints, b.shotIsThree, b.shotQuality);
          }
        }

        // Rim torus collision (only if not yet scored)
        if (!b.scored) {
          const dx = b.x - RIM_X;
          const dz = b.z - RIM_Z;
          const hr = Math.hypot(dx, dz);
          if (hr > 1e-5) {
            const cx = RIM_X + (dx / hr) * RIM_R;
            const cz = RIM_Z + (dz / hr) * RIM_R;
            const cy = RIM_Y;
            const dTube = Math.hypot(b.x - cx, b.y - cy, b.z - cz);
            const minR = BALL_R + RIM_TUBE_R;
            if (dTube < minR && dTube > 1e-5) {
              const nx = (b.x - cx) / dTube;
              const ny = (b.y - cy) / dTube;
              const nz = (b.z - cz) / dTube;
              b.x = cx + nx * (minR + 0.003);
              b.y = cy + ny * (minR + 0.003);
              b.z = cz + nz * (minR + 0.003);
              const vn = b.vx * nx + b.vy * ny + b.vz * nz;
              if (vn < 0) {
                b.vx -= (1 + 0.58) * vn * nx;
                b.vy -= (1 + 0.58) * vn * ny;
                b.vz -= (1 + 0.58) * vn * nz;
                b.hitRim = true;
                g.shotClock = Math.max(g.shotClock, SHOT_CLOCK);
                emit('rimBounce', { x: b.x, y: b.y, z: b.z });
              }
            }
          }
        }

        // Floor bounce
        if (b.y <= BALL_R) {
          b.y = BALL_R;
          if (b.vy < -1.2) {
            b.vy = -b.vy * 0.72;
            b.vx *= 0.86;
            b.vz *= 0.86;
            emit('dribble', { x: b.x, z: b.z });
          } else {
            b.vy = 0;
            b.vx *= 0.92;
            b.vz *= 0.92;
          }
          if (b.mode === 'shot' && !b.scored) {
            b.mode = 'loose';
            if (g.mode === 'drill') {
              g.drillState.streak = 0;
              g.drillState.cooldown = 0.45;
            }
          }
        }
      }

      // Live rebound / loose-ball pickup (only after shot descends below 2.75m and missed)
      if ((b.mode === 'loose' || (b.mode === 'shot' && !b.scored && b.vy < 0 && b.y < 2.6)) && g.mode === 'season') {
        for (let i = 0; i < g.players.length; i++) {
          const p = g.players[i];
          if (p.state === 'stumbled') continue;
          const reachY = p.height + p.y + 0.45;
          if (dist2D(p.x, p.z, b.x, b.z) < p.radius + 0.48 && b.y <= reachY) {
            const oldPoss = g.possession;
            const isDefReb = p.team !== oldPoss;
            b.mode = 'held';
            b.holderId = p.id;
            b.lastTouchTeam = p.team;
            b.scored = false;
            g.possession = p.team;
            g.shotClock = SHOT_CLOCK;
            if (isDefReb) g.needsClear = true;
            if (p.team === 0) {
              setUser(p.id);
              g.stats.reb++;
            }
            emit('rebound', { playerId: p.id, team: p.team, defensive: isDefReb, x: p.x, z: p.z });
            if (isDefReb) emit('clearArc', { team: p.team });
            return;
          }
        }
      }
    }

    function finishGame(winnerTeam) {
      g.phase = 'over';
      if (mode === 'drill') {
        const ds = g.drillState;
        const th = drillCfg.starThresholds;
        g.winner = 0;
        g.stars = ds.score >= th[2] ? 3 : ds.score >= th[1] ? 2 : ds.score >= th[0] ? 1 : 0;
      } else {
        let w = winnerTeam;
        if (w == null || w < 0) {
          w = g.score[0] > g.score[1] ? 0 : g.score[1] > g.score[0] ? 1 : 0;
        }
        g.winner = w;
        if (w === 0) {
          const margin = g.score[0] - g.score[1];
          const fgPct = g.stats.fga > 0 ? g.stats.fgm / g.stats.fga : 0;
          g.stars = 1 + (margin >= 4 || g.stats.ast >= 2 ? 1 : 0) + (margin >= 6 && (fgPct >= 0.5 || g.stats.greens >= 3) ? 1 : 0);
        } else {
          g.stars = 0;
        }
      }
      emit('buzzer', { winner: g.winner, stars: g.stars });
    }

    g.update = function (dtRaw) {
      if (g.phase === 'over') return;
      const rawDt = Math.min(0.05, Math.max(0, dtRaw || 0));
      if (g.lastShotFeedback && g.lastShotFeedback.timer > 0) {
        g.lastShotFeedback.timer = Math.max(0, g.lastShotFeedback.timer - rawDt);
      }
      g._passPrevHoldT = Math.max(0, g._passPrevHoldT - rawDt);

      const activeUser = g.players.find((p) => p.id === g.userId);
      const slowActive = !!(g.rookieAssist && g.phase === 'playing' && activeUser && activeUser.state === 'shooting');
      g.timeScale = slowActive ? 0.8 : 1;
      const dt = rawDt * g.timeScale;
      g.clock += dt;

      if (g.phase === 'reset') {
        g.resetT -= dt;
        for (let i = 0; i < g.players.length; i++) {
          const p = g.players[i];
          if (p.y > 0 || p.vy > 0) {
            p.y += p.vy * dt + 0.5 * GRAV * dt * dt;
            p.vy += GRAV * dt;
            if (p.y <= 0) {
              p.y = 0;
              p.vy = 0;
            }
          }
        }
        updateBall(dt);
        if (g.resetT <= 0) {
          g.phase = 'playing';
          setupSeasonFormation(g.resetPossession);
          emit('whistle', { possession: g.possession });
        }
        return;
      }

      // Clock countdown
      g.timeLeft = Math.max(0, g.timeLeft - dt);
      if (g.timeLeft <= 0) {
        finishGame(g.score[0] >= g.score[1] ? 0 : 1);
        return;
      }

      // Drill cooldown advancement
      if (g.mode === 'drill' && g.drillState.cooldown > 0) {
        g.drillState.cooldown -= dt;
        if (g.drillState.cooldown <= 0) {
          if (g.drill === 'shootout') {
            const nextBall = g.drillState.ballInRack + 1;
            const nextSpot = nextBall >= 3 ? (g.drillState.spotIdx + 1) % SHOOTOUT_SPOTS.length : g.drillState.spotIdx;
            placeShootoutSpot(nextSpot, nextBall % 3);
          } else if (g.drill === 'passing') {
            resetPassingDrillRep();
          } else if (g.drill === 'dribble') {
            g.drillState.rep++;
            resetDribbleDrillRep();
          }
        }
      }

      // 14-second shot clock in 3v3 season mode
      if (g.mode === 'season' && g.ball.mode !== 'shot') {
        g.shotClock -= dt;
        if (g.shotClock <= 0) {
          const oldTeam = g.possession;
          if (oldTeam === 0) g.stats.tov++;
          g.shotClock = SHOT_CLOCK;
          emit('shotClock', { team: oldTeam });
          g.phase = 'reset';
          g.resetT = 0.8;
          g.resetPossession = 1 - oldTeam;
          return;
        }
      }

      handleUserInput(dt);
      if (g.mode === 'drill') updateDrillAI(dt);
      else updateSeasonAI(dt);
      updatePlayersPhysics(dt);
      updateBall(dt);
    };

    g.beginShot = beginShot;
    g.releaseShot = releaseShot;
    g.triggerMove = triggerMove;
    g.triggerPass = triggerPass;
    g.getPassPreview = getPassPreview;
    g.computePassLane = computePassLane;
    g.triggerSteal = triggerSteal;
    g.triggerJump = triggerJump;
    g.switchDefender = switchDefender;
    g.callScreen = callScreen;
    g.drainEvents = function () {
      const e = g.events;
      g.events = [];
      return e;
    };
    g.getTip = function () {
      return coachTip(g.stats);
    };

    init();
    return g;
  }

  root.CourtEngine = {
    COURT_W,
    HALF_W,
    BASELINE_Z,
    HALF_Z,
    RIM_X,
    RIM_Y,
    RIM_Z,
    RIM_R,
    BALL_R,
    BACKBOARD_Z,
    BACKBOARD_W,
    BACKBOARD_BOT,
    BACKBOARD_TOP,
    THREE_PT_R,
    SHOT_CLOCK,
    GRAV,
    LEVELS,
    DRILLS,
    SHOOTOUT_SPOTS,
    PLAYER_ARCHETYPES,
    isThreePoint,
    computeContest,
    computeShotWindow,
    coachTip,
    createGame,
    makeRng,
  };
})(typeof window !== 'undefined' ? window : globalThis);
