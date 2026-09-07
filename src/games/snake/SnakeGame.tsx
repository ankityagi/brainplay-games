import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { SNAKE_STAGES } from './stages';

interface Cell {
  x: number;
  y: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const DELTAS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function cellKey(c: Cell): string {
  return `${c.x},${c.y}`;
}

function randomEmptyCell(size: number, occupied: Set<string>): Cell {
  let cell: Cell;
  do {
    cell = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
  } while (occupied.has(cellKey(cell)));
  return cell;
}

function starsFor(score: number, target: number): 0 | 1 | 2 | 3 {
  if (score >= target * 1.6) return 3;
  if (score >= target * 1.3) return 2;
  if (score >= target) return 1;
  return 0;
}

export default function SnakeGame({ stage, onFinish }: GameComponentProps) {
  const config = SNAKE_STAGES[stage - 1];
  const { boardSize, tickMs, targetScore } = config;

  const initial = useCallback(() => {
    const mid = Math.floor(boardSize / 2);
    const snake: Cell[] = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    const occupied = new Set(snake.map(cellKey));
    const obstacles: Cell[] = [];
    for (let i = 0; i < config.obstacles; i++) {
      const c = randomEmptyCell(boardSize, occupied);
      occupied.add(cellKey(c));
      obstacles.push(c);
    }
    const food = randomEmptyCell(boardSize, occupied);
    return { snake, obstacles, food };
  }, [boardSize, config.obstacles]);

  const [state, setState] = useState(initial);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const [boardPx, setBoardPx] = useState(280);
  const directionRef = useRef<Direction>('right');
  const queuedRef = useRef<Direction>('right');
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);

  const finish = useCallback(
    (finalScore: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const passed = finalScore >= targetScore;
      onFinish({ passed, stars: starsFor(finalScore, targetScore), score: finalScore });
    },
    [onFinish, targetScore],
  );

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(coarsePointer || navigator.maxTouchPoints > 0);
  }, []);

  useLayoutEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const size = Math.floor(Math.min(width, height)) - 8;
      setBoardPx(Math.max(140, Math.min(size, 720)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isTouchDevice]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      if (!started) setStarted(true);
      if (dir !== OPPOSITE[directionRef.current]) {
        queuedRef.current = dir;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started]);

  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      setState((prev) => {
        directionRef.current = queuedRef.current;
        const delta = DELTAS[directionRef.current];
        const head = prev.snake[0];
        const newHead: Cell = { x: head.x + delta.x, y: head.y + delta.y };

        const outOfBounds =
          newHead.x < 0 || newHead.y < 0 || newHead.x >= boardSize || newHead.y >= boardSize;
        const bodyKeys = new Set(prev.snake.slice(0, -1).map(cellKey));
        const hitObstacle = prev.obstacles.some((o) => o.x === newHead.x && o.y === newHead.y);
        const hitSelf = bodyKeys.has(cellKey(newHead));

        if (outOfBounds || hitObstacle || hitSelf) {
          setGameOver(true);
          finish(scoreRef.current);
          return prev;
        }

        const ateFood = newHead.x === prev.food.x && newHead.y === prev.food.y;
        const newSnake = [newHead, ...prev.snake];
        if (!ateFood) {
          newSnake.pop();
          return { ...prev, snake: newSnake };
        }

        const nextScore = scoreRef.current + 1;
        scoreRef.current = nextScore;
        setScore(nextScore);
        const occupied = new Set([...newSnake.map(cellKey), ...prev.obstacles.map(cellKey)]);
        const newFood = randomEmptyCell(boardSize, occupied);
        return { ...prev, snake: newSnake, food: newFood };
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [started, gameOver, boardSize, tickMs, finish]);

  function setDirection(dir: Direction) {
    if (!started) setStarted(true);
    if (dir !== OPPOSITE[directionRef.current]) queuedRef.current = dir;
  }

  const occupiedSnake = new Set(state.snake.map(cellKey));
  const occupiedObstacles = new Set(state.obstacles.map(cellKey));

  return (
    <div className="h-full flex flex-col items-center gap-2 px-4 py-3 overflow-hidden">
      <div className="shrink-0 flex items-center gap-8 text-base sm:text-lg">
        <span className="text-slate-400">
          Score: <span className="text-slate-100 font-bold">{score}</span>
        </span>
        <span className="text-slate-400">
          Target: <span className="text-slate-100 font-bold">{targetScore}</span>
        </span>
      </div>

      <div ref={boardAreaRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          className="grid bg-slate-900 border border-slate-700 rounded-lg overflow-hidden relative"
          style={{
            width: boardPx,
            height: boardPx,
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${boardSize}, 1fr)`,
          }}
        >
          {Array.from({ length: boardSize * boardSize }, (_, i) => {
            const x = i % boardSize;
            const y = Math.floor(i / boardSize);
            const key = `${x},${y}`;
            const isHead = state.snake[0].x === x && state.snake[0].y === y;
            const isSnake = occupiedSnake.has(key);
            const isFood = state.food.x === x && state.food.y === y;
            const isObstacle = occupiedObstacles.has(key);
            let cls = (x + y) % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/60';
            if (isSnake) cls = isHead ? 'bg-emerald-400' : 'bg-emerald-600';
            if (isFood) cls = 'bg-rose-500';
            if (isObstacle) cls = 'bg-slate-500';
            return <div key={key} className={cls} />;
          })}

          {!started && !gameOver && (
            <button
              onClick={() => setStarted(true)}
              className="absolute inset-0 bg-black/60 text-white font-bold flex items-center justify-center text-lg text-center px-2"
            >
              Tap or press an arrow key to start
            </button>
          )}
        </div>
      </div>

      {score >= targetScore && !gameOver && (
        <button
          onClick={() => finish(scoreRef.current)}
          className="shrink-0 bg-brand-600 hover:bg-brand-500 rounded-lg px-4 py-2 font-semibold text-sm"
        >
          Finish stage now
        </button>
      )}

      {isTouchDevice && (
        <div className="shrink-0 grid grid-cols-3 grid-rows-3 gap-2 w-44 sm:w-52">
          <span />
          <button
            onClick={() => setDirection('up')}
            aria-label="Move up"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            ↑
          </button>
          <span />
          <button
            onClick={() => setDirection('left')}
            aria-label="Move left"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            ←
          </button>
          <button
            onClick={() => setDirection('down')}
            aria-label="Move down"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            ↓
          </button>
          <button
            onClick={() => setDirection('right')}
            aria-label="Move right"
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl py-3 text-2xl select-none touch-manipulation"
          >
            →
          </button>
        </div>
      )}
      <p className="shrink-0 text-xs sm:text-sm text-slate-600 text-center">
        {isTouchDevice ? 'Tap the arrows to steer.' : 'Arrow keys or WASD to steer.'}
      </p>
    </div>
  );
}
