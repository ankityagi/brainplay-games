import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { boxIndex, generatePuzzle } from './sudoku';
import { MAX_MISTAKES, SUDOKU_STAGES } from './stages';

const PAD_WIDTH = 200;
const PAD_ROW_HEIGHT = 56;
const GAP = 16;

function starsForMistakes(mistakes: number): 0 | 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes === 1) return 2;
  if (mistakes === 2) return 1;
  return 0;
}

export default function SudokuGame({ stage, onFinish }: GameComponentProps) {
  const config = SUDOKU_STAGES[stage - 1];
  const { size, boxRows, boxCols } = config;

  const [{ puzzle, solution }] = useState(() => generatePuzzle(config, config.givens));
  const [values, setValues] = useState<number[]>(() => puzzle.slice());
  const [selected, setSelected] = useState<number>(() => puzzle.findIndex((v) => v === 0));
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const [layout, setLayout] = useState({ boardPx: 300, horizontal: false });

  const areaRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const blankCount = puzzle.filter((v) => v === 0).length;

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const horizontal = width > height * 1.2;
      const fit = horizontal ? Math.min(height, width - PAD_WIDTH - GAP) : Math.min(width, height - PAD_ROW_HEIGHT - GAP);
      setLayout({ boardPx: Math.max(160, Math.min(Math.floor(fit), 720)), horizontal });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function finish(passed: boolean, finalMistakes: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish({ passed, stars: passed ? starsForMistakes(finalMistakes) : 0, score: passed ? blankCount : 0 });
  }

  function enterDigit(digit: number) {
    if (finishedRef.current || solved || selected < 0 || puzzle[selected] !== 0) return;
    if (values[selected] === digit) return;

    const next = values.slice();
    next[selected] = digit;
    setValues(next);

    if (digit !== 0 && digit !== solution[selected]) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= MAX_MISTAKES) finish(false, nextMistakes);
      return;
    }

    if (next.every((v, i) => v === solution[i])) {
      setSolved(true);
      setTimeout(() => finish(true, mistakes), 700);
    }
  }

  function moveSelection(dRow: number, dCol: number) {
    setSelected((prev) => {
      const start = prev < 0 ? 0 : prev;
      const row = (Math.floor(start / size) + dRow + size) % size;
      const col = ((start % size) + dCol + size) % size;
      return row * size + col;
    });
  }

  // Keyboard: digits enter, 0/Backspace/Delete clear, arrows move the selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      if (moves[e.key]) {
        e.preventDefault();
        moveSelection(...moves[e.key]);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        e.preventDefault();
        enterDigit(0);
        return;
      }
      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= size) {
        e.preventDefault();
        enterDigit(digit);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const selRow = selected >= 0 ? Math.floor(selected / size) : -1;
  const selCol = selected >= 0 ? selected % size : -1;
  const selBox = selected >= 0 ? boxIndex(config, selRow, selCol) : -1;
  const selValue = selected >= 0 ? values[selected] : 0;
  const cellPx = layout.boardPx / size;

  const placedCorrectly = (digit: number) => values.filter((v, i) => v === digit && v === solution[i]).length;
  const digits = Array.from({ length: size }, (_, i) => i + 1);

  const padButton = 'rounded-xl font-bold select-none touch-manipulation transition-colors';

  return (
    <div className="h-full flex flex-col items-center gap-2 px-4 py-3 overflow-hidden">
      <div className="shrink-0 flex items-center gap-8 text-base sm:text-lg">
        <span className="text-slate-400">
          Grid: <span className="text-slate-100 font-bold">{size}×{size}</span>
        </span>
        <span className="text-slate-400" data-testid="mistakes" data-mistakes={mistakes}>
          Mistakes:{' '}
          <span className={`font-bold ${mistakes > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
            {mistakes} / {MAX_MISTAKES}
          </span>
        </span>
      </div>

      <div
        ref={areaRef}
        className={`flex-1 min-h-0 w-full flex items-center justify-center ${layout.horizontal ? 'flex-row' : 'flex-col'}`}
        style={{ gap: GAP }}
      >
        <div
          data-testid="sudoku-board"
          className={`grid bg-slate-900 border-2 rounded-lg overflow-hidden shrink-0 ${solved ? 'border-emerald-400' : 'border-slate-400'}`}
          style={{
            width: layout.boardPx,
            height: layout.boardPx,
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
          }}
        >
          {values.map((v, i) => {
            const row = Math.floor(i / size);
            const col = i % size;
            const given = puzzle[i] !== 0;
            const wrong = v !== 0 && v !== solution[i];
            const isSelected = i === selected;
            const related = row === selRow || col === selCol || boxIndex(config, row, col) === selBox;
            const sameDigit = selValue !== 0 && v === selValue;

            let bg = 'bg-slate-900';
            if (related) bg = 'bg-slate-800';
            if (sameDigit) bg = 'bg-sky-900';
            if (isSelected) bg = 'bg-sky-700';
            if (solved) bg = 'bg-emerald-900/60';

            let color = 'text-sky-300';
            if (given) color = 'text-slate-100';
            if (wrong) color = 'text-rose-400';

            return (
              <button
                key={i}
                data-testid="sudoku-cell"
                data-index={i}
                data-value={v}
                data-given={given ? '1' : '0'}
                data-wrong={wrong ? '1' : '0'}
                onClick={() => setSelected(i)}
                aria-label={`Row ${row + 1}, column ${col + 1}${v ? `, ${v}` : ', empty'}`}
                className={`flex items-center justify-center border-slate-600 select-none touch-manipulation ${bg} ${color} ${given ? 'font-extrabold' : 'font-semibold'}`}
                style={{
                  fontSize: cellPx * 0.55,
                  borderRightWidth: col < size - 1 ? ((col + 1) % boxCols === 0 ? 2 : 1) : 0,
                  borderBottomWidth: row < size - 1 ? ((row + 1) % boxRows === 0 ? 2 : 1) : 0,
                  borderRightColor: (col + 1) % boxCols === 0 ? 'rgb(148 163 184)' : undefined,
                  borderBottomColor: (row + 1) % boxRows === 0 ? 'rgb(148 163 184)' : undefined,
                }}
              >
                {v || ''}
              </button>
            );
          })}
        </div>

        <div
          className={layout.horizontal ? 'grid grid-cols-3 gap-2 shrink-0' : 'flex gap-1.5 shrink-0'}
          style={layout.horizontal ? { width: PAD_WIDTH } : { width: layout.boardPx, height: PAD_ROW_HEIGHT }}
        >
          {digits.map((d) => {
            const done = placedCorrectly(d) === size;
            return (
              <button
                key={d}
                data-testid="pad-digit"
                data-digit={d}
                onClick={() => enterDigit(d)}
                disabled={done || solved}
                className={`${padButton} ${layout.horizontal ? 'h-14 text-2xl' : 'flex-1 text-xl'} bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30`}
              >
                {d}
              </button>
            );
          })}
          <button
            data-testid="pad-erase"
            onClick={() => enterDigit(0)}
            disabled={solved}
            aria-label="Erase"
            className={`${padButton} ${layout.horizontal ? 'h-14 text-xl col-span-3' : 'flex-1 text-lg'} bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-30`}
          >
            ⌫
          </button>
        </div>
      </div>

      <p className="shrink-0 text-xs sm:text-sm text-slate-600 text-center">
        {solved
          ? 'Solved!'
          : `Fill every row, column and box with 1–${size}. Tap a square, then a number (or type it). ${MAX_MISTAKES} mistakes ends the stage.`}
      </p>
    </div>
  );
}
