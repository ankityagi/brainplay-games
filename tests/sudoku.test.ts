import { describe, expect, it } from 'vitest';
import {
  boxIndex,
  countSolutions,
  generatePuzzle,
  generateSolvedGrid,
  isSolvedGrid,
  solve,
} from '../src/games/sudoku/sudoku';
import { SUDOKU_STAGES } from '../src/games/sudoku/stages';

const MINI = { size: 4, boxRows: 2, boxCols: 2 };
const MIDI = { size: 6, boxRows: 2, boxCols: 3 };
const CLASSIC = { size: 9, boxRows: 3, boxCols: 3 };

describe('sudoku boxIndex', () => {
  it('maps 6x6 cells into 2x3 boxes', () => {
    expect(boxIndex(MIDI, 0, 0)).toBe(0);
    expect(boxIndex(MIDI, 1, 5)).toBe(1);
    expect(boxIndex(MIDI, 2, 0)).toBe(2);
    expect(boxIndex(MIDI, 5, 5)).toBe(5);
  });
});

describe('sudoku solved grids', () => {
  for (const spec of [MINI, MIDI, CLASSIC]) {
    it(`builds a valid ${spec.size}x${spec.size} grid`, () => {
      const grid = generateSolvedGrid(spec);
      expect(grid).toHaveLength(spec.size * spec.size);
      expect(isSolvedGrid(grid, spec)).toBe(true);
    });
  }

  it('rejects a grid with a duplicate in a row', () => {
    const grid = generateSolvedGrid(MINI);
    grid[1] = grid[0];
    expect(isSolvedGrid(grid, MINI)).toBe(false);
  });
});

describe('sudoku solver', () => {
  it('finds more than one solution for an empty grid', () => {
    expect(countSolutions(new Array(16).fill(0), MINI)).toBe(2);
  });

  it('solves a known classic puzzle', () => {
    // prettier-ignore
    const puzzle = [
      5,3,0, 0,7,0, 0,0,0,
      6,0,0, 1,9,5, 0,0,0,
      0,9,8, 0,0,0, 0,6,0,
      8,0,0, 0,6,0, 0,0,3,
      4,0,0, 8,0,3, 0,0,1,
      7,0,0, 0,2,0, 0,0,6,
      0,6,0, 0,0,0, 2,8,0,
      0,0,0, 4,1,9, 0,0,5,
      0,0,0, 0,8,0, 0,7,9,
    ];
    const solved = solve(puzzle, CLASSIC);
    expect(solved).not.toBeNull();
    expect(isSolvedGrid(solved!, CLASSIC)).toBe(true);
    expect(solved!.slice(0, 9)).toEqual([5, 3, 4, 6, 7, 8, 9, 1, 2]);
    expect(countSolutions(puzzle, CLASSIC)).toBe(1);
  });
});

describe('sudoku stage puzzles', () => {
  SUDOKU_STAGES.forEach((stage, i) => {
    it(`stage ${i + 1} (${stage.size}x${stage.size}) has one solution and about ${stage.givens} givens`, () => {
      const { puzzle, solution } = generatePuzzle(stage, stage.givens);
      const givens = puzzle.filter((v) => v !== 0).length;
      expect(givens).toBeGreaterThanOrEqual(stage.givens);
      expect(givens).toBeLessThanOrEqual(stage.givens + 6);
      expect(countSolutions(puzzle, stage)).toBe(1);
      expect(solve(puzzle, stage)).toEqual(solution);
      puzzle.forEach((v, k) => {
        if (v) expect(v).toBe(solution[k]);
      });
    });
  });

  it('gets harder: givens never increase within a grid size, and grids grow', () => {
    for (let i = 1; i < SUDOKU_STAGES.length; i++) {
      const prev = SUDOKU_STAGES[i - 1];
      const cur = SUDOKU_STAGES[i];
      expect(cur.size).toBeGreaterThanOrEqual(prev.size);
      if (cur.size === prev.size) expect(cur.givens).toBeLessThan(prev.givens);
    }
  });
});
