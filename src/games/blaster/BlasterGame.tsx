import { useCallback, useEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { passedFraction, starsForFraction } from '../../lib/scoring';
import { generateDistractors, generateProblem } from './generator';
import { BLASTER_STAGES } from './stages';

const ASPECT_RATIO = 16 / 10;
const GUN_X = 50;
const GUN_Y = 92;
const MAX_TURRET_ANGLE = 65; // degrees from vertical, each side
const TURRET_ROTATE_SPEED = 80; // degrees per second
const BARREL_LEN_PCT = 13; // % of playfield height

const CLOUD_LANE_MIN = 14;
const CLOUD_LANE_MAX = 62;
const CLOUD_HALF_WIDTH = 8;
const CLOUD_HALF_HEIGHT = 6;
const BULLET_SPEED = 70; // % of playfield height per second

// Each sky "row" always drifts at its own fixed relative speed, so rows drift out of
// sync with each other over time instead of clumping together in lockstep.
const LANE_SPEED_MULTIPLIERS = [0.8, 1.25, 0.95, 1.1, 0.85];

const DECOY_EMOJIS = ['🐦', '✈️', '🎈', '🪁', '🦅', '🐝'];
const DECOY_Y_MIN = 10;
const DECOY_Y_MAX = 68;
const DECOY_HALF_WIDTH = 5;
const DECOY_HALF_HEIGHT = 5;

/** Evenly spread `count` lanes across the usable sky band, regardless of stage's cloud count. */
function laneYPositions(count: number): number[] {
  if (count <= 1) return [(CLOUD_LANE_MIN + CLOUD_LANE_MAX) / 2];
  const step = (CLOUD_LANE_MAX - CLOUD_LANE_MIN) / (count - 1);
  return Array.from({ length: count }, (_, i) => CLOUD_LANE_MIN + i * step);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Cloud {
  id: number;
  value: number;
  x: number;
  y: number;
  vx: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Decoy {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
}

function moveAndWrap<T extends { x: number; vx: number }>(entities: T[], dt: number, halfWidth: number): T[] {
  return entities.map((e) => {
    let x = e.x + e.vx * dt;
    if (e.vx > 0 && x > 100 + halfWidth) x = -halfWidth;
    if (e.vx < 0 && x < -halfWidth) x = 100 + halfWidth;
    return { ...e, x };
  });
}

type Feedback = { kind: 'correct' } | { kind: 'wrong'; answer: number } | { kind: 'timeout'; answer: number } | null;

let nextId = 1;

function spawnClouds(values: number[], speed: number): Cloud[] {
  const lanePairs = shuffle(
    laneYPositions(values.length).map((y, i) => ({
      y,
      speedMult: LANE_SPEED_MULTIPLIERS[i % LANE_SPEED_MULTIPLIERS.length],
    })),
  );
  return values.map((value, i) => {
    const fromLeft = Math.random() < 0.5;
    const { y, speedMult } = lanePairs[i];
    return {
      id: nextId++,
      value,
      x: fromLeft ? -CLOUD_HALF_WIDTH : 100 + CLOUD_HALF_WIDTH,
      y,
      vx: (fromLeft ? 1 : -1) * speed * speedMult,
    };
  });
}

function spawnDecoys(count: number, speed: number): Decoy[] {
  return Array.from({ length: count }, () => {
    const fromLeft = Math.random() < 0.5;
    return {
      id: nextId++,
      emoji: DECOY_EMOJIS[randInt(0, DECOY_EMOJIS.length - 1)],
      x: fromLeft ? -DECOY_HALF_WIDTH : 100 + DECOY_HALF_WIDTH,
      y: randInt(DECOY_Y_MIN, DECOY_Y_MAX),
      vx: (fromLeft ? 1 : -1) * speed * (0.8 + Math.random() * 0.4),
    };
  });
}

export default function BlasterGame({ stage, onFinish }: GameComponentProps) {
  const config = BLASTER_STAGES[stage - 1];

  const [problemIndex, setProblemIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [problem, setProblem] = useState(() => generateProblem(config));
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [decoys, setDecoys] = useState<Decoy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [turretAngle, setTurretAngle] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [timeLeft, setTimeLeft] = useState(config.timePerProblem);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [box, setBox] = useState({ width: 640, height: 400 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const cloudsRef = useRef<Cloud[]>([]);
  const decoysRef = useRef<Decoy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const turretAngleRef = useRef(0);
  const resolvedRef = useRef(false);
  const finishedRef = useRef(false);
  const solvedRef = useRef(0);

  cloudsRef.current = clouds;
  decoysRef.current = decoys;
  bulletsRef.current = bullets;
  turretAngleRef.current = turretAngle;

  const spawnProblem = useCallback(() => {
    const p = generateProblem(config);
    const distractors = generateDistractors(p.answer, config.cloudCount - 1);
    const values = shuffle([p.answer, ...distractors]);
    setProblem(p);
    setClouds(spawnClouds(values, config.cloudSpeed));
    setDecoys(spawnDecoys(config.decoyCount, config.decoySpeed));
    setBullets([]);
    setFeedback(null);
    resolvedRef.current = false;
    setTimeLeft(config.timePerProblem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    spawnProblem();
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

  function finishGame(finalSolved: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const fraction = finalSolved / config.problems;
    onFinish({ passed: passedFraction(fraction), stars: starsForFraction(fraction), score: finalSolved });
  }

  function advanceAfterResult() {
    setTimeout(() => {
      const nextIndex = problemIndex + 1;
      if (nextIndex >= config.problems) {
        finishGame(solvedRef.current);
      } else {
        setProblemIndex(nextIndex);
        spawnProblem();
      }
    }, 1100);
  }

  function resolve(feedbackValue: NonNullable<Feedback>, wasSolved: boolean) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setFeedback(feedbackValue);
    if (wasSolved) {
      solvedRef.current += 1;
      setSolvedCount(solvedRef.current);
    }
    advanceAfterResult();
  }

  function fire() {
    if (resolvedRef.current || bulletsRef.current.length > 0) return;
    const angleRad = (turretAngleRef.current * Math.PI) / 180;
    const spawnX = GUN_X + (BARREL_LEN_PCT * Math.sin(angleRad)) / ASPECT_RATIO;
    const spawnY = GUN_Y - BARREL_LEN_PCT * Math.cos(angleRad);
    const vx = (BULLET_SPEED * Math.sin(angleRad)) / ASPECT_RATIO;
    const vy = -BULLET_SPEED * Math.cos(angleRad);
    setBullets([{ id: nextId++, x: spawnX, y: spawnY, vx, vy }]);
  }

  // Keyboard controls
  useEffect(() => {
    const DIRECTION_KEYS: Record<string, 'left' | 'right'> = {
      arrowleft: 'left',
      a: 'left',
      arrowright: 'right',
      d: 'right',
    };
    function onKeyDown(e: KeyboardEvent) {
      const dir = DIRECTION_KEYS[e.key.toLowerCase()];
      if (dir) {
        e.preventDefault();
        pressedKeys.current.add(dir);
      }
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !e.repeat) {
        e.preventDefault();
        fire();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      const dir = DIRECTION_KEYS[e.key.toLowerCase()];
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

  // Per-problem countdown
  useEffect(() => {
    if (feedback !== null) return;
    if (timeLeft <= 0) {
      resolve({ kind: 'timeout', answer: problem.answer }, false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, feedback]);

  // Main animation loop
  useEffect(() => {
    let raf: number;
    let last = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!resolvedRef.current) {
        if (pressedKeys.current.has('left')) {
          setTurretAngle((a) => Math.max(-MAX_TURRET_ANGLE, a - TURRET_ROTATE_SPEED * dt));
        } else if (pressedKeys.current.has('right')) {
          setTurretAngle((a) => Math.min(MAX_TURRET_ANGLE, a + TURRET_ROTATE_SPEED * dt));
        }

        setClouds((prev) => moveAndWrap(prev, dt, CLOUD_HALF_WIDTH));
        setDecoys((prev) => moveAndWrap(prev, dt, DECOY_HALF_WIDTH));

        setBullets((prev) => {
          const moved = prev
            .map((b) => ({ ...b, x: b.x + b.vx * dt, y: b.y + b.vy * dt }))
            .filter((b) => b.y > -5 && b.x > -10 && b.x < 110);
          const survivors: Bullet[] = [];
          for (const b of moved) {
            const hitCloud = cloudsRef.current.find(
              (c) => Math.abs(c.x - b.x) < CLOUD_HALF_WIDTH && Math.abs(c.y - b.y) < CLOUD_HALF_HEIGHT,
            );
            if (hitCloud) {
              if (hitCloud.value === problem.answer) {
                resolve({ kind: 'correct' }, true);
              } else {
                resolve({ kind: 'wrong', answer: problem.answer }, false);
              }
              return [];
            }
            const hitDecoy = decoysRef.current.some(
              (d) => Math.abs(d.x - b.x) < DECOY_HALF_WIDTH && Math.abs(d.y - b.y) < DECOY_HALF_HEIGHT,
            );
            if (!hitDecoy) survivors.push(b);
          }
          return survivors;
        });
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem]);

  function holdDirection(dir: 'left' | 'right', pressed: boolean) {
    if (pressed) pressedKeys.current.add(dir);
    else pressedKeys.current.delete(dir);
  }

  const px = (pct: number, total: number) => (pct / 100) * total;

  const barrelLenPx = px(BARREL_LEN_PCT, box.height);
  const barrelWPx = Math.max(6, box.height * 0.045);
  const baseWPx = Math.max(16, box.height * 0.14);
  const baseHPx = Math.max(10, box.height * 0.09);
  const hubDPx = Math.max(10, box.height * 0.07);

  return (
    <div className="h-full flex flex-col items-center gap-2 px-4 py-3 overflow-hidden">
      <div className="shrink-0 w-full max-w-4xl">
        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${(problemIndex / config.problems) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-slate-500 mt-1.5">
          <span>
            Problem {problemIndex + 1} / {config.problems}
          </span>
          <span>{solvedCount} solved</span>
        </div>
      </div>

      <div className="shrink-0 text-center min-h-[4.5rem]">
        {feedback === null && (
          <>
            <div className="text-3xl sm:text-4xl font-bold font-mono">{problem.prompt} = ?</div>
            <div className="text-base font-mono text-slate-400 mt-1">⏱ {timeLeft}s</div>
          </>
        )}
        {feedback?.kind === 'correct' && <div className="text-xl font-semibold text-emerald-400">🎯 Direct hit!</div>}
        {feedback?.kind === 'wrong' && (
          <div className="text-xl font-semibold text-rose-400">💥 Wrong cloud! It was {feedback.answer}</div>
        )}
        {feedback?.kind === 'timeout' && (
          <div className="text-xl font-semibold text-rose-400">⏰ Too slow! It was {feedback.answer}</div>
        )}
      </div>

      <div ref={wrapRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          data-testid="playfield"
          className="relative rounded-lg overflow-hidden bg-gradient-to-b from-sky-800 to-sky-950 border border-slate-700"
          style={{ width: box.width, height: box.height }}
        >
          {decoys.map((d) => (
            <div
              key={d.id}
              data-testid="decoy"
              className="absolute flex items-center justify-center text-3xl sm:text-4xl select-none opacity-90"
              style={{
                left: px(d.x, box.width),
                top: px(d.y, box.height),
                transform: `translate(-50%, -50%) ${d.vx < 0 ? 'scaleX(-1)' : ''}`,
              }}
            >
              {d.emoji}
            </div>
          ))}

          {clouds.map((c) => (
            <div
              key={c.id}
              data-testid="cloud"
              data-cloud-value={c.value}
              className="absolute flex items-center justify-center"
              style={{
                left: px(c.x, box.width),
                top: px(c.y, box.height),
                transform: 'translate(-50%, -50%)',
                width: px(CLOUD_HALF_WIDTH * 2, box.width),
                height: px(CLOUD_HALF_HEIGHT * 2, box.height),
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl select-none">
                ☁️
              </span>
              <span className="relative text-lg sm:text-xl font-extrabold text-slate-900">{c.value}</span>
            </div>
          ))}

          {bullets.map((b) => (
            <div
              key={b.id}
              className="absolute rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(252,211,77,0.8)]"
              style={{
                left: px(b.x, box.width),
                top: px(b.y, box.height),
                width: 8,
                height: 8,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}

          {/* Turret: fixed base + a barrel that rotates in place and always fires along its heading. */}
          <div
            data-testid="gun"
            data-turret-angle={turretAngle}
            className="absolute"
            style={{ left: px(GUN_X, box.width), top: px(GUN_Y, box.height) }}
          >
            <div
              className="absolute bg-slate-300 rounded-t-full"
              style={{
                width: barrelWPx,
                height: barrelLenPx,
                left: -barrelWPx / 2,
                top: -barrelLenPx,
                transformOrigin: 'bottom center',
                transform: `rotate(${turretAngle}deg)`,
              }}
            />
            <div
              className="absolute bg-slate-600 rounded-md border border-slate-500"
              style={{ width: baseWPx, height: baseHPx, left: -baseWPx / 2, top: -baseHPx / 2 }}
            />
            <div
              className="absolute bg-slate-400 rounded-full border border-slate-200"
              style={{ width: hubDPx, height: hubDPx, left: -hubDPx / 2, top: -hubDPx / 2 }}
            />
          </div>
        </div>
      </div>

      {isTouchDevice ? (
        <div className="shrink-0 flex items-center gap-6">
          <button
            onPointerDown={() => holdDirection('left', true)}
            onPointerUp={() => holdDirection('left', false)}
            onPointerLeave={() => holdDirection('left', false)}
            aria-label="Aim left"
            className="bg-slate-800 active:bg-slate-600 rounded-xl px-6 py-4 text-2xl select-none touch-manipulation"
          >
            ↺
          </button>
          <button
            onClick={fire}
            aria-label="Fire"
            className="bg-rose-600 active:bg-rose-500 rounded-xl px-8 py-4 text-xl font-bold select-none touch-manipulation"
          >
            FIRE
          </button>
          <button
            onPointerDown={() => holdDirection('right', true)}
            onPointerUp={() => holdDirection('right', false)}
            onPointerLeave={() => holdDirection('right', false)}
            aria-label="Aim right"
            className="bg-slate-800 active:bg-slate-600 rounded-xl px-6 py-4 text-2xl select-none touch-manipulation"
          >
            ↻
          </button>
        </div>
      ) : (
        <p className="shrink-0 text-xs sm:text-sm text-slate-600">
          Arrow keys / A,D to aim, Space to fire. Lead the cloud, and watch out for birds and planes in the way!
        </p>
      )}
    </div>
  );
}
