import { useCallback, useEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { DINO_STAGES, DINO_TIERS, starsFor } from './stages';
import { DinoProblem, generateProblem } from './generator';

const ASPECT_RATIO = 4 / 3;
const PLAYER_SPEED = 26; // % of playfield width per second
const WANDER_CHANGE_MIN = 900;
const WANDER_CHANGE_MAX = 2400;
const GRACE_MS = 900;
const WARN_RADIUS = 15;
const MAX_TIER = 5;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function radiusForTier(tier: number): number {
  return 3.5 + tier * 1.1;
}

function tierForEaten(eaten: number, startTier: number): number {
  return Math.min(MAX_TIER, startTier + Math.floor(eaten / 2));
}

interface Npc {
  id: number;
  x: number;
  y: number;
  tier: number;
  angle: number; // radians
  nextTurnAt: number; // performance.now() timestamp
}

type EncounterKind = 'eat' | 'danger';
type Feedback = 'correct' | 'wrong' | 'timeout' | null;

interface Encounter {
  npcId: number;
  kind: EncounterKind;
  problem: DinoProblem;
  feedback: Feedback;
}

let nextId = 1;

export default function DinoChaosGame({ stage, onFinish }: GameComponentProps) {
  const config = DINO_STAGES[stage - 1];

  const [player, setPlayer] = useState({ x: 50, y: 50 });
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [eaten, setEaten] = useState(0);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.timePerQuestion);
  const [started, setStarted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [box, setBox] = useState({ width: 640, height: 480 });
  const [warning, setWarning] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef(player);
  const npcsRef = useRef(npcs);
  const eatenRef = useRef(0);
  const encounterRef = useRef<Encounter | null>(null);
  const graceUntilRef = useRef(0);
  const pressedKeys = useRef<Set<string>>(new Set());
  const finishedRef = useRef(false);
  const startedRef = useRef(false);

  playerRef.current = player;
  npcsRef.current = npcs;
  encounterRef.current = encounter;
  startedRef.current = started;

  const spawnNpc = useCallback(
    (avoid: { x: number; y: number }, isBug: boolean): Npc => {
      const tier = isBug ? 0 : randInt(config.minSpawnTier, config.maxSpawnTier);
      const r = radiusForTier(tier);
      let x = 50;
      let y = 50;
      for (let attempt = 0; attempt < 10; attempt++) {
        x = randInt(r, 100 - r);
        y = randInt(r, 100 - r);
        if (dist({ x, y }, avoid) > 25) break;
      }
      return {
        id: nextId++,
        x,
        y,
        tier,
        angle: Math.random() * Math.PI * 2,
        nextTurnAt: performance.now() + randInt(WANDER_CHANGE_MIN, WANDER_CHANGE_MAX),
      };
    },
    [config],
  );

  const setupStage = useCallback(() => {
    const start = { x: 50, y: 50 };
    setPlayer(start);
    setEaten(0);
    eatenRef.current = 0;
    setEncounter(null);
    setNpcs([
      ...Array.from({ length: config.bugCount }, () => spawnNpc(start, true)),
      ...Array.from({ length: config.npcCount }, () => spawnNpc(start, false)),
    ]);
    finishedRef.current = false;
    graceUntilRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    setupStage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(coarsePointer || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      let w = width;
      let h = w / ASPECT_RATIO;
      if (h > height) {
        h = height;
        w = h * ASPECT_RATIO;
      }
      setBox({ width: w, height: h });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const currentTier = tierForEaten(eaten, 1);

  function finish(finalScore: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const passed = finalScore >= config.targetScore;
    onFinish({ passed, stars: starsFor(finalScore, config.targetScore), score: finalScore });
  }

  function beginEncounter(npc: Npc, kind: EncounterKind) {
    setEncounter({ npcId: npc.id, kind, problem: generateProblem(config), feedback: null });
    setTimeLeft(config.timePerQuestion);
  }

  function resolveEncounter(correct: boolean, feedback: NonNullable<Feedback>) {
    const current = encounterRef.current;
    if (!current || current.feedback) return;
    setEncounter({ ...current, feedback });
    setTimeout(() => {
      const kind = current.kind;
      if (kind === 'danger' && !correct) {
        finish(eatenRef.current);
        return;
      }
      if (kind === 'eat' && correct) {
        const nextEaten = eatenRef.current + 1;
        eatenRef.current = nextEaten;
        setEaten(nextEaten);
      }
      setNpcs((prev) => {
        const removed = prev.find((n) => n.id === current.npcId);
        const survivors = prev.filter((n) => n.id !== current.npcId);
        return [...survivors, spawnNpc(playerRef.current, removed?.tier === 0)];
      });
      graceUntilRef.current = performance.now() + GRACE_MS;
      setEncounter(null);
    }, 900);
  }

  function answer(choiceIndex: number) {
    const current = encounterRef.current;
    if (!current || current.feedback) return;
    resolveEncounter(choiceIndex === current.problem.correctIndex, choiceIndex === current.problem.correctIndex ? 'correct' : 'wrong');
  }

  // Countdown while a question is active
  useEffect(() => {
    if (!encounter || encounter.feedback) return;
    if (timeLeft <= 0) {
      resolveEncounter(false, 'timeout');
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, encounter]);

  // Keyboard controls
  useEffect(() => {
    const MOVE_KEYS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      arrowup: 'up',
      w: 'up',
      arrowdown: 'down',
      s: 'down',
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    };
    function onKeyDown(e: KeyboardEvent) {
      const dir = MOVE_KEYS[e.key.toLowerCase()];
      if (dir) {
        e.preventDefault();
        pressedKeys.current.add(dir);
        if (!startedRef.current) setStarted(true);
      }
      if (['1', '2', '3', '4'].includes(e.key)) {
        answer(Number(e.key) - 1);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      const dir = MOVE_KEYS[e.key.toLowerCase()];
      if (dir) pressedKeys.current.delete(dir);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main game loop
  useEffect(() => {
    let raf: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (startedRef.current && !encounterRef.current && !finishedRef.current) {
        // move player
        let dx = 0;
        let dy = 0;
        if (pressedKeys.current.has('left')) dx -= 1;
        if (pressedKeys.current.has('right')) dx += 1;
        if (pressedKeys.current.has('up')) dy -= 1;
        if (pressedKeys.current.has('down')) dy += 1;
        let nextPlayer = playerRef.current;
        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy) || 1;
          const tier = tierForEaten(eatenRef.current, 1);
          const r = radiusForTier(tier);
          nextPlayer = {
            x: clamp(playerRef.current.x + (dx / len) * PLAYER_SPEED * dt, r, 100 - r),
            y: clamp(playerRef.current.y + ((dy / len) * PLAYER_SPEED * dt) / ASPECT_RATIO, r, 100 - r),
          };
          setPlayer(nextPlayer);
        }

        // move npcs (wander)
        const grace = performance.now() < graceUntilRef.current;
        let collided: Npc | null = null;
        const movedNpcs = npcsRef.current.map((n) => {
          let angle = n.angle;
          if (now > n.nextTurnAt) {
            angle = Math.random() * Math.PI * 2;
          }
          const r = radiusForTier(n.tier);
          let x = n.x + Math.cos(angle) * config.npcSpeed * dt;
          let y = n.y + Math.sin(angle) * config.npcSpeed * dt * ASPECT_RATIO;
          if (x < r || x > 100 - r) {
            angle = Math.PI - angle;
            x = clamp(x, r, 100 - r);
          }
          if (y < r || y > 100 - r) {
            angle = -angle;
            y = clamp(y, r, 100 - r);
          }
          const updated: Npc = { ...n, x, y, angle, nextTurnAt: now > n.nextTurnAt ? now + randInt(WANDER_CHANGE_MIN, WANDER_CHANGE_MAX) : n.nextTurnAt };
          if (!grace && !collided && dist(nextPlayer, updated) < (radiusForTier(tierForEaten(eatenRef.current, 1)) + r) * 0.55) {
            collided = updated;
          }
          return updated;
        });

        // other dinos snack on bugs too, so bugs get eaten even when the player isn't around
        const eatenBugIds = new Set<number>();
        for (const predator of movedNpcs) {
          if (predator.tier === 0) continue;
          for (const bug of movedNpcs) {
            if (bug.tier !== 0 || eatenBugIds.has(bug.id)) continue;
            if (dist(predator, bug) < (radiusForTier(predator.tier) + radiusForTier(0)) * 0.55) {
              eatenBugIds.add(bug.id);
            }
          }
        }
        const withBugsReplaced = eatenBugIds.size
          ? [
              ...movedNpcs.filter((n) => !eatenBugIds.has(n.id)),
              ...Array.from({ length: eatenBugIds.size }, () => spawnNpc(playerRef.current, true)),
            ]
          : movedNpcs;

        // guarantee at least one dino bigger than the player exists, so growing never
        // removes the danger - once you outgrow a stage's biggest spawn, promote one
        const myTierNow = tierForEaten(eatenRef.current, 1);
        let finalNpcs = withBugsReplaced;
        if (myTierNow < MAX_TIER && !withBugsReplaced.some((n) => n.tier > myTierNow)) {
          let biggestIdx = -1;
          withBugsReplaced.forEach((n, i) => {
            if (n.tier > 0 && (biggestIdx === -1 || n.tier > withBugsReplaced[biggestIdx].tier)) biggestIdx = i;
          });
          if (biggestIdx !== -1) {
            finalNpcs = withBugsReplaced.map((n, i) => (i === biggestIdx ? { ...n, tier: myTierNow + 1 } : n));
          }
        }
        setNpcs(finalNpcs);

        if (collided) {
          const myTier = tierForEaten(eatenRef.current, 1);
          const c = collided as Npc;
          if (c.tier < myTier) beginEncounter(c, 'eat');
          else if (c.tier > myTier) beginEncounter(c, 'danger');
        } else {
          const myTier = tierForEaten(eatenRef.current, 1);
          const nearDanger = finalNpcs.some((n) => n.tier > myTier && dist(nextPlayer, n) < WARN_RADIUS);
          setWarning(nearDanger);
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  function holdDirection(dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) {
    if (pressed) {
      pressedKeys.current.add(dir);
      if (!startedRef.current) setStarted(true);
    } else {
      pressedKeys.current.delete(dir);
    }
  }

  const px = (pct: number, total: number) => (pct / 100) * total;
  const myTierInfo = DINO_TIERS[currentTier];

  return (
    <div className="h-full flex flex-col items-center gap-2 px-4 py-3 overflow-hidden">
      <div className="shrink-0 w-full max-w-4xl flex items-center justify-between text-sm sm:text-base">
        <span className="text-slate-400">
          You: <span className="text-slate-100 font-semibold">{myTierInfo.emoji} {myTierInfo.label}</span>
        </span>
        <span className="text-slate-400">
          Eaten: <span className="text-slate-100 font-bold">{eaten}</span> / {config.targetScore}
        </span>
      </div>

      <div ref={wrapRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          data-testid="dino-playfield"
          className={`relative rounded-lg overflow-hidden bg-gradient-to-b from-emerald-800 to-emerald-950 border ${
            warning ? 'border-rose-500' : 'border-slate-700'
          }`}
          style={{ width: box.width, height: box.height }}
        >
          {warning && (
            <div className="absolute inset-0 pointer-events-none border-4 border-rose-500/70 animate-pulse" />
          )}
          {[10, 30, 70, 90].map((x, i) => (
            <span
              key={i}
              className="absolute text-3xl opacity-60 select-none pointer-events-none"
              style={{ left: px(x, box.width), top: px(i % 2 === 0 ? 8 : 88, box.height), transform: 'translate(-50%, -50%)' }}
            >
              🌲
            </span>
          ))}

          {npcs.map((n) => {
            const info = DINO_TIERS[n.tier];
            const size = Math.max(20, box.height * 0.16 * info.scale);
            const relation = n.tier < currentTier ? 'eat' : n.tier > currentTier ? 'danger' : 'neutral';
            const ringClass =
              relation === 'eat' ? 'ring-2 ring-emerald-400' : relation === 'danger' ? 'ring-2 ring-rose-500' : '';
            return (
              <div
                key={n.id}
                data-testid="npc-dino"
                className={`absolute flex items-center justify-center rounded-full ${ringClass}`}
                style={{
                  left: px(n.x, box.width),
                  top: px(n.y, box.height),
                  width: size,
                  height: size,
                  transform: `translate(-50%, -50%) ${Math.cos(n.angle) < 0 ? 'scaleX(-1)' : ''}`,
                  fontSize: size * 0.8,
                }}
              >
                <span style={{ filter: info.tint ? `hue-rotate(${info.tint}deg)` : undefined }}>{info.emoji}</span>
              </div>
            );
          })}

          <div
            data-testid="player-dino"
            className="absolute flex items-center justify-center select-none rounded-full ring-4 ring-sky-400 shadow-[0_0_12px_4px_rgba(56,189,248,0.7)]"
            style={{
              left: px(player.x, box.width),
              top: px(player.y, box.height),
              width: Math.max(24, box.height * 0.18 * myTierInfo.scale),
              height: Math.max(24, box.height * 0.18 * myTierInfo.scale),
              fontSize: Math.max(24, box.height * 0.18 * myTierInfo.scale) * 0.85,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span style={{ filter: myTierInfo.tint ? `hue-rotate(${myTierInfo.tint}deg)` : undefined }}>
              {myTierInfo.emoji}
            </span>
          </div>

          {!started && !encounter && (
            <button
              onClick={() => setStarted(true)}
              className="absolute inset-0 bg-black/60 text-white font-bold flex items-center justify-center text-lg text-center px-4"
            >
              Tap or press an arrow key to start
            </button>
          )}

          {encounter && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
              <div
                className={`w-full max-w-xs rounded-xl border-2 p-4 flex flex-col items-center gap-3 ${
                  encounter.kind === 'danger' ? 'bg-rose-950 border-rose-500' : 'bg-emerald-950 border-emerald-500'
                }`}
              >
                {encounter.feedback === null && (
                  <>
                    <div className="text-sm font-semibold text-center">
                      {encounter.kind === 'eat' ? '🍽️ Answer to eat it!' : '⚠️ Answer to escape!'}
                    </div>
                    <div className="text-2xl font-bold font-mono">{encounter.problem.prompt} = ?</div>
                    <div className="text-xs font-mono text-slate-400">⏱ {timeLeft}s</div>
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {encounter.problem.choices.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => answer(i)}
                          className="bg-slate-800 hover:bg-slate-700 rounded-lg py-2 font-bold text-lg"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {encounter.feedback === 'correct' && encounter.kind === 'eat' && (
                  <div className="text-lg font-semibold text-emerald-400">😋 Yum! Got it!</div>
                )}
                {encounter.feedback === 'correct' && encounter.kind === 'danger' && (
                  <div className="text-lg font-semibold text-emerald-400">🏃 Phew! You escaped!</div>
                )}
                {(encounter.feedback === 'wrong' || encounter.feedback === 'timeout') && encounter.kind === 'eat' && (
                  <div className="text-lg font-semibold text-amber-400">🏃 It got away!</div>
                )}
                {(encounter.feedback === 'wrong' || encounter.feedback === 'timeout') && encounter.kind === 'danger' && (
                  <div className="text-lg font-semibold text-rose-400">😵 Oh no...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {eaten >= config.targetScore && !encounter && (
        <button
          onClick={() => finish(eatenRef.current)}
          className="shrink-0 bg-brand-600 hover:bg-brand-500 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          Finish stage now
        </button>
      )}

      {isTouchDevice ? (
        <div className="shrink-0 grid grid-cols-3 grid-rows-3 gap-2 w-44 sm:w-52">
          <span />
          <button
            onPointerDown={() => holdDirection('up', true)}
            onPointerUp={() => holdDirection('up', false)}
            onPointerLeave={() => holdDirection('up', false)}
            aria-label="Move up"
            className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            ↑
          </button>
          <span />
          <button
            onPointerDown={() => holdDirection('left', true)}
            onPointerUp={() => holdDirection('left', false)}
            onPointerLeave={() => holdDirection('left', false)}
            aria-label="Move left"
            className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            ←
          </button>
          <button
            onPointerDown={() => holdDirection('down', true)}
            onPointerUp={() => holdDirection('down', false)}
            onPointerLeave={() => holdDirection('down', false)}
            aria-label="Move down"
            className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            ↓
          </button>
          <button
            onPointerDown={() => holdDirection('right', true)}
            onPointerUp={() => holdDirection('right', false)}
            onPointerLeave={() => holdDirection('right', false)}
            aria-label="Move right"
            className="bg-slate-800 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            →
          </button>
        </div>
      ) : (
        <p className="shrink-0 text-xs sm:text-sm text-slate-600 text-center">
          Arrow keys or WASD to move. Bump a smaller dino to eat it, but watch out for bigger ones!
        </p>
      )}
    </div>
  );
}
