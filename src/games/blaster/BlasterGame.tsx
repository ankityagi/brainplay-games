import { useCallback, useEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { passedFraction, starsForFraction } from '../../lib/scoring';
import { generateDistractors, generateProblem } from './generator';
import { BLASTER_STAGES } from './stages';

const ASPECT_RATIO = 16 / 10;
const GUN_Y = 92;
const CLOUD_LANE_MIN = 14;
const CLOUD_LANE_MAX = 62;

/** Evenly spread `count` lanes across the usable sky band, regardless of stage's cloud count. */
function laneYPositions(count: number): number[] {
  if (count <= 1) return [(CLOUD_LANE_MIN + CLOUD_LANE_MAX) / 2];
  const step = (CLOUD_LANE_MAX - CLOUD_LANE_MIN) / (count - 1);
  return Array.from({ length: count }, (_, i) => CLOUD_LANE_MIN + i * step);
}
const CLOUD_HALF_WIDTH = 8;
const CLOUD_HALF_HEIGHT = 6;
const BULLET_SPEED = 70; // % of playfield height per second

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
}

type Feedback = { kind: 'correct' } | { kind: 'wrong'; answer: number } | { kind: 'timeout'; answer: number } | null;

let nextId = 1;

function spawnClouds(values: number[], speed: number): Cloud[] {
  const lanes = shuffle(laneYPositions(values.length));
  return values.map((value, i) => {
    const fromLeft = Math.random() < 0.5;
    return {
      id: nextId++,
      value,
      x: fromLeft ? -CLOUD_HALF_WIDTH : 100 + CLOUD_HALF_WIDTH,
      y: lanes[i],
      vx: (fromLeft ? 1 : -1) * speed * (0.85 + Math.random() * 0.3),
    };
  });
}

export default function BlasterGame({ stage, onFinish }: GameComponentProps) {
  const config = BLASTER_STAGES[stage - 1];

  const [problemIndex, setProblemIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [problem, setProblem] = useState(() => generateProblem(config));
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [gunX, setGunX] = useState(50);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [timeLeft, setTimeLeft] = useState(config.timePerProblem);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [box, setBox] = useState({ width: 640, height: 360 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const cloudsRef = useRef<Cloud[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const gunXRef = useRef(50);
  const resolvedRef = useRef(false);
  const finishedRef = useRef(false);
  const solvedRef = useRef(0);

  cloudsRef.current = clouds;
  bulletsRef.current = bullets;
  gunXRef.current = gunX;

  const spawnProblem = useCallback(() => {
    const p = generateProblem(config);
    const distractors = generateDistractors(p.answer, config.cloudCount - 1);
    const values = shuffle([p.answer, ...distractors]);
    setProblem(p);
    setClouds(spawnClouds(values, config.cloudSpeed));
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
    setBullets([{ id: nextId++, x: gunXRef.current, y: GUN_Y }]);
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
        const GUN_SPEED = 55;
        if (pressedKeys.current.has('left')) {
          setGunX((x) => Math.max(6, x - GUN_SPEED * dt));
        } else if (pressedKeys.current.has('right')) {
          setGunX((x) => Math.min(94, x + GUN_SPEED * dt));
        }

        setClouds((prev) =>
          prev.map((c) => {
            let x = c.x + c.vx * dt;
            if (c.vx > 0 && x > 100 + CLOUD_HALF_WIDTH) x = -CLOUD_HALF_WIDTH;
            if (c.vx < 0 && x < -CLOUD_HALF_WIDTH) x = 100 + CLOUD_HALF_WIDTH;
            return { ...c, x };
          }),
        );

        setBullets((prev) => {
          const moved = prev.map((b) => ({ ...b, y: b.y - BULLET_SPEED * dt })).filter((b) => b.y > -5);
          for (const b of moved) {
            const hit = cloudsRef.current.find(
              (c) => Math.abs(c.x - b.x) < CLOUD_HALF_WIDTH && Math.abs(c.y - b.y) < CLOUD_HALF_HEIGHT,
            );
            if (hit) {
              if (hit.value === problem.answer) {
                resolve({ kind: 'correct' }, true);
              } else {
                resolve({ kind: 'wrong', answer: problem.answer }, false);
              }
              return [];
            }
          }
          return moved;
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

          <div
            data-testid="gun"
            className="absolute text-4xl sm:text-5xl select-none"
            style={{ left: px(gunX, box.width), top: px(GUN_Y, box.height), transform: 'translate(-50%, -50%)' }}
          >
            🚀
          </div>
        </div>
      </div>

      {isTouchDevice ? (
        <div className="shrink-0 flex items-center gap-6">
          <button
            onPointerDown={() => holdDirection('left', true)}
            onPointerUp={() => holdDirection('left', false)}
            onPointerLeave={() => holdDirection('left', false)}
            aria-label="Move left"
            className="bg-slate-800 active:bg-slate-600 rounded-xl px-6 py-4 text-2xl select-none touch-manipulation"
          >
            ←
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
            aria-label="Move right"
            className="bg-slate-800 active:bg-slate-600 rounded-xl px-6 py-4 text-2xl select-none touch-manipulation"
          >
            →
          </button>
        </div>
      ) : (
        <p className="shrink-0 text-xs sm:text-sm text-slate-600">
          Arrow keys / A,D to move, Space to fire. Lead the cloud - it keeps drifting while your shot travels!
        </p>
      )}
    </div>
  );
}
