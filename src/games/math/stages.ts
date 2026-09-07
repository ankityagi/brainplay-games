export type Operation = '+' | '-' | '×' | '÷';

export interface MathStageConfig {
  operations: Operation[];
  min: number;
  max: number;
  allowNegativeResult: boolean;
  timePerQuestion: number;
  questions: number;
}

export const MATH_STAGES: MathStageConfig[] = [
  { operations: ['+'], min: 1, max: 10, allowNegativeResult: false, timePerQuestion: 15, questions: 10 },
  { operations: ['+', '-'], min: 1, max: 10, allowNegativeResult: false, timePerQuestion: 15, questions: 10 },
  { operations: ['+', '-'], min: 5, max: 25, allowNegativeResult: false, timePerQuestion: 14, questions: 10 },
  { operations: ['+', '-'], min: 10, max: 50, allowNegativeResult: false, timePerQuestion: 13, questions: 10 },
  { operations: ['×'], min: 2, max: 10, allowNegativeResult: false, timePerQuestion: 13, questions: 10 },
  { operations: ['×', '÷'], min: 2, max: 12, allowNegativeResult: false, timePerQuestion: 12, questions: 10 },
  { operations: ['+', '-', '×'], min: 5, max: 20, allowNegativeResult: false, timePerQuestion: 12, questions: 10 },
  { operations: ['+', '-', '×', '÷'], min: 5, max: 30, allowNegativeResult: true, timePerQuestion: 11, questions: 10 },
  { operations: ['×', '÷'], min: 6, max: 15, allowNegativeResult: true, timePerQuestion: 10, questions: 10 },
  { operations: ['+', '-', '×', '÷'], min: 10, max: 40, allowNegativeResult: true, timePerQuestion: 10, questions: 10 },
];
