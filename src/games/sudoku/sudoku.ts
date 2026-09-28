/** Grid shape: `size` x `size` cells, split into boxes of `boxRows` x `boxCols`. */
export interface SudokuSpec {
  size: number;
  boxRows: number;
  boxCols: number;
}

export interface SudokuPuzzle {
  /** Flat row-major grid, 0 = empty. */
  puzzle: number[];
  solution: number[];
}

interface SearchResult {
  count: number;
  first: number[] | null;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function boxIndex(spec: SudokuSpec, row: number, col: number): number {
  return Math.floor(row / spec.boxRows) * (spec.size / spec.boxCols) + Math.floor(col / spec.boxCols);
}

function popcount(n: number): number {
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

/**
 * Backtracking search using bitmasks and a fewest-candidates-first cell choice.
 * Stops once `limit` solutions are found; `randomize` shuffles digit order (used to build fresh grids).
 */
function search(grid: number[], spec: SudokuSpec, limit: number, randomize: boolean): SearchResult {
  const { size } = spec;
  const total = size * size;
  const cells = grid.slice();
  const rowOf = new Array<number>(total);
  const colOf = new Array<number>(total);
  const boxOf = new Array<number>(total);
  const rows = new Array<number>(size).fill(0);
  const cols = new Array<number>(size).fill(0);
  const boxes = new Array<number>(size).fill(0);
  const allDigits = ((1 << (size + 1)) - 1) & ~1;
  const digits = Array.from({ length: size }, (_, i) => i + 1);

  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    rowOf[i] = r;
    colOf[i] = c;
    boxOf[i] = boxIndex(spec, r, c);
    const v = cells[i];
    if (!v) continue;
    const bit = 1 << v;
    if (rows[r] & bit || cols[c] & bit || boxes[boxOf[i]] & bit) return { count: 0, first: null };
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[boxOf[i]] |= bit;
  }

  const result: SearchResult = { count: 0, first: null };

  function step(): boolean {
    let best = -1;
    let bestMask = 0;
    let bestCount = size + 1;
    for (let i = 0; i < total; i++) {
      if (cells[i]) continue;
      const mask = allDigits & ~(rows[rowOf[i]] | cols[colOf[i]] | boxes[boxOf[i]]);
      const n = popcount(mask);
      if (n === 0) return false;
      if (n < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = n;
        if (n === 1) break;
      }
    }
    if (best === -1) {
      result.count++;
      if (!result.first) result.first = cells.slice();
      return result.count >= limit;
    }
    const r = rowOf[best];
    const c = colOf[best];
    const b = boxOf[best];
    for (const v of randomize ? shuffle(digits) : digits) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      cells[best] = v;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      if (step()) return true;
      cells[best] = 0;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
    return false;
  }

  step();
  return result;
}

/** Number of solutions, counting no higher than `limit` (2 is enough to test uniqueness). */
export function countSolutions(grid: number[], spec: SudokuSpec, limit = 2): number {
  return search(grid, spec, limit, false).count;
}

export function solve(grid: number[], spec: SudokuSpec): number[] | null {
  return search(grid, spec, 1, false).first;
}

export function generateSolvedGrid(spec: SudokuSpec): number[] {
  const solved = search(new Array(spec.size * spec.size).fill(0), spec, 1, true).first;
  if (!solved) throw new Error('Could not build a solved grid');
  return solved;
}

/** True when every row, column and box holds each digit exactly once. */
export function isSolvedGrid(grid: number[], spec: SudokuSpec): boolean {
  const { size } = spec;
  if (grid.length !== size * size || grid.some((v) => v < 1 || v > size)) return false;
  return countSolutions(grid, spec, 1) === 1;
}

/**
 * Clears cells from a random solved grid, one at a time in random order, keeping each removal only
 * while the puzzle still has exactly one solution. Stops at `targetGivens`; a hard target may not be
 * reachable for a given grid, in which case the puzzle keeps a few extra givens.
 */
export function generatePuzzle(spec: SudokuSpec, targetGivens: number): SudokuPuzzle {
  const solution = generateSolvedGrid(spec);
  const puzzle = solution.slice();
  let givens = puzzle.length;
  for (const i of shuffle(Array.from({ length: puzzle.length }, (_, k) => k))) {
    if (givens <= targetGivens) break;
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, spec, 2) === 1) {
      givens--;
    } else {
      puzzle[i] = saved;
    }
  }
  return { puzzle, solution };
}
