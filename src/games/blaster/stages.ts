export type BlasterOperation = '+' | '-' | '×' | '÷';

export interface BlasterStageConfig {
  operations: BlasterOperation[];
  min: number;
  max: number;
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
  { operations: ['+'], min: 1, max: 10, allowNegativeResult: false, cloudCount: 2, cloudSpeed: 6, decoyCount: 0, decoySpeed: 8, timePerProblem: 14, problems: 8 },
  { operations: ['+', '-'], min: 1, max: 12, allowNegativeResult: false, cloudCount: 2, cloudSpeed: 8, decoyCount: 1, decoySpeed: 10, timePerProblem: 13, problems: 8 },
  { operations: ['+', '-'], min: 5, max: 20, allowNegativeResult: false, cloudCount: 3, cloudSpeed: 9, decoyCount: 1, decoySpeed: 12, timePerProblem: 12, problems: 8 },
  { operations: ['×'], min: 2, max: 8, allowNegativeResult: false, cloudCount: 3, cloudSpeed: 10, decoyCount: 2, decoySpeed: 13, timePerProblem: 12, problems: 8 },
  { operations: ['+', '-', '×'], min: 2, max: 15, allowNegativeResult: false, cloudCount: 3, cloudSpeed: 11, decoyCount: 2, decoySpeed: 14, timePerProblem: 11, problems: 8 },
  { operations: ['×', '÷'], min: 2, max: 10, allowNegativeResult: false, cloudCount: 4, cloudSpeed: 12, decoyCount: 3, decoySpeed: 15, timePerProblem: 11, problems: 8 },
  { operations: ['+', '-', '×', '÷'], min: 3, max: 18, allowNegativeResult: false, cloudCount: 4, cloudSpeed: 13, decoyCount: 3, decoySpeed: 16, timePerProblem: 10, problems: 8 },
  { operations: ['+', '-', '×', '÷'], min: 5, max: 25, allowNegativeResult: true, cloudCount: 4, cloudSpeed: 14, decoyCount: 4, decoySpeed: 17, timePerProblem: 10, problems: 9 },
  { operations: ['×', '÷'], min: 6, max: 14, allowNegativeResult: true, cloudCount: 5, cloudSpeed: 15, decoyCount: 4, decoySpeed: 18, timePerProblem: 9, problems: 9 },
  { operations: ['+', '-', '×', '÷'], min: 8, max: 30, allowNegativeResult: true, cloudCount: 5, cloudSpeed: 17, decoyCount: 5, decoySpeed: 20, timePerProblem: 9, problems: 10 },
];
