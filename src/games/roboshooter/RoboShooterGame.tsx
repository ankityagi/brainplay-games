import { useEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { ROBOSHOOTER_STAGES } from './stages';

const ASPECT_RATIO = 16 / 10;
const HORIZON_Y = 20; // % from top where robots first appear
const PLAYER_Y = 82; // % from top - reaching here means the robot got the player

const AIM_SPEED = 60; // % of playfield height per second
const AIM_MIN_X = 4;
const AIM_MAX_X = 96;
const AIM_MIN_Y = 10;
const AIM_MAX_Y = 92;
const FIRE_COOLDOWN_MS = 200;

type RobotSize = 'small' | 'medium' | 'large';
const SIZE_SCALE: Record<RobotSize, number> = { small: 0.8, medium: 1, large: 1.3 };
const SIZE_SPEED_MULT: Record<RobotSize, number> = { small: 1.15, medium: 1, large: 0.85 };
const SIZES: RobotSize[] = ['small', 'medium', 'large'];

const MIN_SCALE = 0.22;
const MAX_SCALE = 1.6;

interface Robot {
  id: number;
  x0: number; // base lateral position, 0-100, converges toward 50 as it nears the player
  distance: number; // 1 = just spawned (far), 0 = reached the player
  speed: number; // distance closed per second
  size: RobotSize;
  hp: number;
  maxHp: number;
  hue: number;
  hitFlash: boolean;
}

interface Aim {
  x: number;
  y: number;
}

type Direction = 'left' | 'right' | 'up' | 'down';

interface Box {
  width: number;
  height: number;
}

interface RobotVisual {
  xPx: number;
  yPx: number;
  fontSizePx: number;
  radiusPx: number;
  zIndex: number;
}

function robotVisual(r: Robot, box: Box): RobotVisual {
  const t = 1 - r.distance;
  const scale = (MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t * t) * SIZE_SCALE[r.size];
  const yPct = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * Math.pow(t, 1.4);
  const xPct = 50 + (r.x0 - 50) * r.distance;
  const fontSizePx = Math.max(14, box.height * 0.22 * scale);
  return {
    xPx: (xPct / 100) * box.width,
    yPx: (yPct / 100) * box.height,
    fontSizePx,
    radiusPx: fontSizePx * 0.6,
    zIndex: Math.round(t * 1000),
  };
}

function starsFor(score: number, target: number): 0 | 1 | 2 | 3 {
  if (score >= target * 1.6) return 3;
  if (score >= target * 1.3) return 2;
  if (score >= target) return 1;
  return 0;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let nextId = 1;

function spawnRobot(config: RoboShooterStageConfig): Robot {
  const size = SIZES[randInt(0, SIZES.length - 1)];
  const hp = Math.max(1, config.baseHp + (size === 'large' ? 1 : size === 'small' ? -1 : 0));
  return {
    id: nextId++,
    x0: randInt(12, 88),
    distance: 1,
    speed: config.baseSpeed * SIZE_SPEED_MULT[size],
    size,
    hp,
    maxHp: hp,
    hue: randInt(0, 360),
    hitFlash: false,
  };
}

type RoboShooterStageConfig = (typeof ROBOSHOOTER_STAGES)[number];

const DIRECTION_KEYS: Record<string, Direction> = {
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
};

export default function RoboShooterGame({ stage, onFinish }: GameComponentProps) {
  const config = ROBOSHOOTER_STAGES[stage - 1];

  const [robots, setRobots] = useState<Robot[]>([]);
  const [kills, setKills] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [box, setBox] = useState<Box>({ width: 640, height: 400 });
  const [aim, setAim] = useState<Aim>({ x: 50, y: 55 });
  const [muzzleFlash, setMuzzleFlash] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const robotsRef = useRef<Robot[]>([]);
  const boxRef = useRef<Box>(box);
  const aimRef = useRef<Aim>(aim);
  const killsRef = useRef(0);
  const finishedRef = useRef(false);
  const gameOverRef = useRef(false);
  const lastSpawnRef = useRef(0);
  const lastFireRef = useRef(0);
  const movementKeys = useRef<Set<Direction>>(new Set());

  robotsRef.current = robots;
  boxRef.current = box;
  aimRef.current = aim;

  const finish = (finalKills: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const passed = finalKills >= config.targetKills;
    onFinish({ passed, stars: starsFor(finalKills, config.targetKills), score: finalKills });
  };

  const loseGame = () => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    finish(killsRef.current);
  };

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

  function applyHit(id: number) {
    setRobots((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target) return prev;
      const nextHp = target.hp - 1;
      if (nextHp <= 0) {
        const newKills = killsRef.current + 1;
        killsRef.current = newKills;
        setKills(newKills);
        return prev.filter((r) => r.id !== id);
      }
      return prev.map((r) => (r.id === id ? { ...r, hp: nextHp, hitFlash: true } : r));
    });

    setTimeout(() => {
      setRobots((prev) => prev.map((r) => (r.id === id ? { ...r, hitFlash: false } : r)));
    }, 120);
  }

  function fire() {
    if (gameOverRef.current) return;
    const now = performance.now();
    if (now - lastFireRef.current < FIRE_COOLDOWN_MS) return;
    lastFireRef.current = now;

    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 90);

    const currentBox = boxRef.current;
    const currentAim = aimRef.current;
    const aimPxX = (currentAim.x / 100) * currentBox.width;
    const aimPxY = (currentAim.y / 100) * currentBox.height;

    let hitId: number | null = null;
    let closestDistance = Infinity;
    for (const r of robotsRef.current) {
      const v = robotVisual(r, currentBox);
      const dx = v.xPx - aimPxX;
      const dy = v.yPx - aimPxY;
      if (Math.hypot(dx, dy) <= v.radiusPx && r.distance < closestDistance) {
        closestDistance = r.distance;
        hitId = r.id;
      }
    }
    if (hitId !== null) applyHit(hitId);
  }

  // Keyboard controls: arrows/WASD move the aim, Space/Enter fires.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const dir = DIRECTION_KEYS[e.key.toLowerCase()];
      if (dir) {
        e.preventDefault();
        movementKeys.current.add(dir);
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault();
        fire();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      const dir = DIRECTION_KEYS[e.key.toLowerCase()];
      if (dir) movementKeys.current.delete(dir);
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function holdDirection(dir: Direction, pressed: boolean) {
    if (pressed) movementKeys.current.add(dir);
    else movementKeys.current.delete(dir);
  }

  // Main spawn + movement + aim loop
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    lastSpawnRef.current = 0;

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!gameOverRef.current) {
        const dyStep = AIM_SPEED * dt;
        const dxStep = dyStep / ASPECT_RATIO;
        if (movementKeys.current.size > 0) {
          setAim((prev) => {
            let { x, y } = prev;
            if (movementKeys.current.has('left')) x -= dxStep;
            if (movementKeys.current.has('right')) x += dxStep;
            if (movementKeys.current.has('up')) y -= dyStep;
            if (movementKeys.current.has('down')) y += dyStep;
            x = Math.min(AIM_MAX_X, Math.max(AIM_MIN_X, x));
            y = Math.min(AIM_MAX_Y, Math.max(AIM_MIN_Y, y));
            return { x, y };
          });
        }

        lastSpawnRef.current += dt * 1000;
        setRobots((prev) => {
          let next = prev.map((r) => ({ ...r, distance: Math.max(0, r.distance - r.speed * dt) }));

          const reachedPlayer = next.some((r) => r.distance <= 0);
          if (reachedPlayer) {
            loseGame();
            return next;
          }

          if (lastSpawnRef.current >= config.spawnIntervalMs && next.length < config.maxRobots) {
            lastSpawnRef.current = 0;
            next = [...next, spawnRobot(config)];
          }
          return next;
        });
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function finishNow() {
    if (kills >= config.targetKills) finish(kills);
  }

  const sorted = [...robots].sort((a, b) => b.distance - a.distance);
  const aimPxX = (aim.x / 100) * box.width;
  const aimPxY = (aim.y / 100) * box.height;
  const crosshairSize = Math.max(20, box.height * 0.1);

  return (
    <div className="h-full flex flex-col items-center gap-2 px-4 py-3 overflow-hidden">
      <div className="shrink-0 flex items-center gap-8 text-base sm:text-lg">
        <span className="text-slate-400">
          Kills: <span className="text-slate-100 font-bold">{kills}</span>
        </span>
        <span className="text-slate-400">
          Target: <span className="text-slate-100 font-bold">{config.targetKills}</span>
        </span>
      </div>

      <div ref={wrapRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          data-testid="playfield"
          className="relative rounded-lg overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 border border-slate-700"
          style={{ width: box.width, height: box.height }}
        >
          <div
            className="absolute left-0 right-0 bg-gradient-to-b from-indigo-950/60 to-transparent"
            style={{ top: 0, height: (HORIZON_Y / 100) * box.height }}
          />

          {sorted.map((r) => {
            const v = robotVisual(r, box);
            return (
              <div
                key={r.id}
                data-testid="robot"
                data-robot-hp={r.hp}
                data-robot-max-hp={r.maxHp}
                data-robot-distance={r.distance.toFixed(3)}
                data-robot-size={r.size}
                className="absolute select-none"
                style={{
                  left: v.xPx,
                  top: v.yPx,
                  transform: 'translate(-50%, -50%)',
                  zIndex: v.zIndex,
                  lineHeight: 1,
                  filter: `hue-rotate(${r.hue}deg) ${r.hitFlash ? 'brightness(2) saturate(3)' : ''}`,
                  transition: 'filter 80ms',
                }}
              >
                <span style={{ fontSize: v.fontSizePx }}>🤖</span>
                {r.maxHp > 1 && (
                  <div
                    className="mt-0.5 mx-auto rounded-full bg-slate-900/70 overflow-hidden border border-slate-600"
                    style={{ width: v.fontSizePx * 0.9, height: Math.max(3, v.fontSizePx * 0.08) }}
                  >
                    <div className="h-full bg-rose-500" style={{ width: `${(r.hp / r.maxHp) * 100}%` }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Crosshair: the player's aim point, moved with the movement keys/buttons */}
          <div
            data-testid="crosshair"
            data-aim-x={aim.x.toFixed(2)}
            data-aim-y={aim.y.toFixed(2)}
            className="absolute pointer-events-none"
            style={{
              left: aimPxX,
              top: aimPxY,
              width: crosshairSize,
              height: crosshairSize,
              transform: `translate(-50%, -50%) scale(${muzzleFlash ? 1.3 : 1})`,
              transition: 'transform 90ms',
              zIndex: 2000,
            }}
          >
            <div
              className={`absolute inset-0 rounded-full border-2 ${muzzleFlash ? 'border-amber-300' : 'border-emerald-400'}`}
            />
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${muzzleFlash ? 'bg-amber-300' : 'bg-emerald-400'}`}
              style={{ width: crosshairSize * 0.15, height: crosshairSize * 0.15 }}
            />
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                className={`absolute left-1/2 top-1/2 ${muzzleFlash ? 'bg-amber-300' : 'bg-emerald-400'}`}
                style={{
                  width: 2,
                  height: crosshairSize * 0.3,
                  transformOrigin: 'top center',
                  transform: `translateX(-50%) rotate(${deg}deg) translateY(${crosshairSize * 0.35}px)`,
                }}
              />
            ))}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-rose-950/70 flex items-center justify-center text-center px-4">
              <div className="text-lg sm:text-2xl font-bold text-rose-200">A robot reached you!</div>
            </div>
          )}
        </div>
      </div>

      {kills >= config.targetKills && !gameOver && (
        <button
          onClick={finishNow}
          className="shrink-0 bg-brand-600 hover:bg-brand-500 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          Finish stage now
        </button>
      )}

      <div className="shrink-0 flex items-center justify-center gap-6 sm:gap-10 w-full max-w-md">
        <button
          data-testid="fire-button"
          onClick={fire}
          aria-label="Fire"
          className="bg-rose-600 hover:bg-rose-500 active:bg-rose-500 rounded-full w-16 h-16 sm:w-20 sm:h-20 text-sm font-bold select-none touch-manipulation shadow-lg"
        >
          FIRE
        </button>

        <div className="grid grid-cols-3 grid-rows-2 gap-1.5 sm:gap-2">
          <span />
          <button
            data-testid="dpad-up"
            onPointerDown={() => holdDirection('up', true)}
            onPointerUp={() => holdDirection('up', false)}
            onPointerLeave={() => holdDirection('up', false)}
            aria-label="Aim up"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg py-2 px-3 text-lg select-none touch-manipulation"
          >
            ↑
          </button>
          <span />
          <button
            data-testid="dpad-left"
            onPointerDown={() => holdDirection('left', true)}
            onPointerUp={() => holdDirection('left', false)}
            onPointerLeave={() => holdDirection('left', false)}
            aria-label="Aim left"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg py-2 px-3 text-lg select-none touch-manipulation"
          >
            ←
          </button>
          <button
            data-testid="dpad-down"
            onPointerDown={() => holdDirection('down', true)}
            onPointerUp={() => holdDirection('down', false)}
            onPointerLeave={() => holdDirection('down', false)}
            aria-label="Aim down"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg py-2 px-3 text-lg select-none touch-manipulation"
          >
            ↓
          </button>
          <button
            data-testid="dpad-right"
            onPointerDown={() => holdDirection('right', true)}
            onPointerUp={() => holdDirection('right', false)}
            onPointerLeave={() => holdDirection('right', false)}
            aria-label="Aim right"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg py-2 px-3 text-lg select-none touch-manipulation"
          >
            →
          </button>
        </div>
      </div>

      <p className="shrink-0 text-xs sm:text-sm text-slate-600 text-center">
        Arrow keys / WASD to aim, Space to fire. Do not let a robot reach the crosshair!
      </p>
    </div>
  );
}
