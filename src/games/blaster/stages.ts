export type BlasterOperation = '+' | '-' | '×' | '÷';

export interface BlasterStageConfig {
  operations: BlasterOperation[];
  /** operand range used for + and - */
  addSubMin: number;
  addSubMax: number;
  /** operand range used for × and ÷ (kept separate so late stages don't roll things like 47×82) */
  mulDivMin: number;
  mulDivMax: number;
  allowNegativeResult: boolean;
  cloudCount: number;
  /** cloud horizontal speed, in % of playfield width per second */
  cloudSpeed: number;
  /** non-target decoys (birds, planes, ...) drifting through - hitting one just wastes a shot */
  decoyCount: number;
  decoySpeed: number;
  timePerProblem: number;
  problems: number;
}

export const BLASTER_STAGES: BlasterStageConfig[] = [
  { operations: ['+'], addSubMin: 1, addSubMax: 10, mulDivMin: 2, mulDivMax: 5, allowNegativeResult: false, cloudCount: 2, cloudSpeed: 6, decoyCount: 0, decoySpeed: 8, timePerProblem: 14, problems: 8 },
  { operations: ['+', '-'], addSubMin: 1, addSubMax: 15, mulDivMin: 2, mulDivMax: 5, allowNegativeResult: false, cloudCount: 2, cloudSpeed: 8, decoyCount: 1, decoySpeed: 10, timePerProblem: 13, problems: 8 },
  { operations: ['+', '-'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 6, allowNegativeResult: false, cloudCount: 3, cloudSpeed: 9, decoyCount: 1, decoySpeed: 12, timePerProblem: 12, problems: 8 },
  { operations: ['×'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 6, allowNegativeResult: false, cloudCount: 3, cloudSpeed: 10, decoyCount: 2, decoySpeed: 13, timePerProblem: 12, problems: 8 },
  { operations: ['×', '÷'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 9, allowNegativeResult: false, cloudCount: 3, cloudSpeed: 11, decoyCount: 2, decoySpeed: 14, timePerProblem: 11, problems: 8 },
  { operations: ['+', '-', '×'], addSubMin: 10, addSubMax: 35, mulDivMin: 3, mulDivMax: 9, allowNegativeResult: false, cloudCount: 4, cloudSpeed: 12, decoyCount: 3, decoySpeed: 15, timePerProblem: 11, problems: 8 },
  { operations: ['×', '÷'], addSubMin: 10, addSubMax: 35, mulDivMin: 4, mulDivMax: 12, allowNegativeResult: false, cloudCount: 4, cloudSpeed: 13, decoyCount: 3, decoySpeed: 16, timePerProblem: 10, problems: 8 },
  { operations: ['+', '-', '×', '÷'], addSubMin: 15, addSubMax: 45, mulDivMin: 5, mulDivMax: 12, allowNegativeResult: true, cloudCount: 4, cloudSpeed: 14, decoyCount: 4, decoySpeed: 17, timePerProblem: 10, problems: 9 },
  { operations: ['+', '-', '×', '÷'], addSubMin: 20, addSubMax: 65, mulDivMin: 6, mulDivMax: 12, allowNegativeResult: true, cloudCount: 5, cloudSpeed: 15, decoyCount: 4, decoySpeed: 18, timePerProblem: 9, problems: 9 },
  { operations: ['+', '-', '×', '÷'], addSubMin: 25, addSubMax: 99, mulDivMin: 7, mulDivMax: 12, allowNegativeResult: true, cloudCount: 5, cloudSpeed: 17, decoyCount: 5, decoySpeed: 20, timePerProblem: 9, problems: 10 },
];
