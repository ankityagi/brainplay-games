import { useEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { ROBOSHOOTER_STAGES } from './stages';

const ASPECT_RATIO = 16 / 10;
const HORIZON_Y = 20; // % from top where robots first appear
const PLAYER_Y = 82; // % from top - reaching here means the robot got the player
const GUN_X = 50;
const GUN_Y = 94;

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

export default function RoboShooterGame({ stage, onFinish }: GameComponentProps) {
  const config = ROBOSHOOTER_STAGES[stage - 1];

  const [robots, setRobots] = useState<Robot[]>([]);
  const [kills, setKills] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [box, setBox] = useState({ width: 640, height: 400 });
  const [muzzleFlash, setMuzzleFlash] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const robotsRef = useRef<Robot[]>([]);
  const killsRef = useRef(0);
  const finishedRef = useRef(false);
  const gameOverRef = useRef(false);
  const lastSpawnRef = useRef(0);

  robotsRef.current = robots;

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

  // Main spawn + movement loop
  useEffect(() => {
    let raf: number;
    let last = performance.now();
    lastSpawnRef.current = 0;

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!gameOverRef.current) {
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

  function shootRobot(id: number) {
    if (gameOverRef.current) return;
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 90);

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

  function finishNow() {
    if (kills >= config.targetKills) finish(kills);
  }

  const px = (pct: number, total: number) => (pct / 100) * total;

  const sorted = [...robots].sort((a, b) => b.distance - a.distance);

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
          className="relative rounded-lg overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 border border-slate-700 cursor-crosshair"
          style={{ width: box.width, height: box.height }}
        >
          <div
            className="absolute left-0 right-0 bg-gradient-to-b from-indigo-950/60 to-transparent"
            style={{ top: 0, height: px(HORIZON_Y, box.height) }}
          />

          {sorted.map((r) => {
            const t = 1 - r.distance;
            const scale = (MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t * t) * SIZE_SCALE[r.size];
            const y = HORIZON_Y + (PLAYER_Y - HORIZON_Y) * Math.pow(t, 1.4);
            const x = 50 + (r.x0 - 50) * r.distance;
            const fontSizePx = Math.max(14, box.height * 0.22 * scale);
            return (
              <button
                key={r.id}
                data-testid="robot"
                data-robot-hp={r.hp}
                data-robot-max-hp={r.maxHp}
                data-robot-distance={r.distance.toFixed(3)}
                data-robot-size={r.size}
                onClick={() => shootRobot(r.id)}
                className="absolute select-none touch-manipulation"
                style={{
                  left: px(x, box.width),
                  top: px(y, box.height),
                  transform: 'translate(-50%, -50%)',
                  zIndex: Math.round(t * 1000),
                  lineHeight: 1,
                  filter: `hue-rotate(${r.hue}deg) ${r.hitFlash ? 'brightness(2) saturate(3)' : ''}`,
                  transition: 'filter 80ms',
                }}
              >
                <span style={{ fontSize: fontSizePx }}>🤖</span>
                {r.maxHp > 1 && (
                  <div
                    className="mt-0.5 mx-auto rounded-full bg-slate-900/70 overflow-hidden border border-slate-600"
                    style={{ width: fontSizePx * 0.9, height: Math.max(3, fontSizePx * 0.08) }}
                  >
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${(r.hp / r.maxHp) * 100}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}

          {/* Player's gun - fixed, first-person, small recoil kick on fire */}
          <div
            data-testid="gun"
            className="absolute pointer-events-none"
            style={{
              left: px(GUN_X, box.width),
              top: px(GUN_Y, box.height),
              transform: `translate(-50%, -50%) translateY(${muzzleFlash ? -6 : 0}px)`,
              transition: 'transform 90ms',
            }}
          >
            {muzzleFlash && (
              <div
                className="absolute rounded-full bg-amber-300/90"
                style={{
                  width: box.height * 0.1,
                  height: box.height * 0.1,
                  left: -box.height * 0.05,
                  top: -box.height * 0.32,
                  boxShadow: '0 0 16px 6px rgba(252,211,77,0.7)',
                }}
              />
            )}
            <div
              className="bg-slate-300 rounded-t-md"
              style={{
                width: box.height * 0.08,
                height: box.height * 0.22,
                marginLeft: -box.height * 0.04,
                marginBottom: -box.height * 0.02,
              }}
            />
            <div
              className="bg-slate-600 rounded-t-2xl border border-slate-500"
              style={{ width: box.height * 0.34, height: box.height * 0.16, marginLeft: -box.height * 0.17 }}
            />
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

      <p className="shrink-0 text-xs sm:text-sm text-slate-600 text-center">
        Tap or click a robot to shoot it. Do not let one reach the gun!
      </p>
    </div>
  );
}
