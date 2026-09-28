import { SudokuSpec } from './sudoku';

export interface SudokuStageConfig extends SudokuSpec {
  /** pre-filled cells; fewer givens = harder */
  givens: number;
}

const MINI: SudokuSpec = { size: 4, boxRows: 2, boxCols: 2 };
const MIDI: SudokuSpec = { size: 6, boxRows: 2, boxCols: 3 };
const CLASSIC: SudokuSpec = { size: 9, boxRows: 3, boxCols: 3 };

export const SUDOKU_STAGES: SudokuStageConfig[] = [
  { ...MINI, givens: 10 },
  { ...MINI, givens: 8 },
  { ...MINI, givens: 6 },
  { ...MIDI, givens: 22 },
  { ...MIDI, givens: 18 },
  { ...MIDI, givens: 14 },
  { ...CLASSIC, givens: 45 },
  { ...CLASSIC, givens: 38 },
  { ...CLASSIC, givens: 32 },
  { ...CLASSIC, givens: 28 },
];

export const MAX_MISTAKES = 3;
