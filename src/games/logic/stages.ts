import { LogicRule } from './generators';

export interface LogicStageConfig {
  rules: LogicRule[];
  hardness: number;
  timePerQuestion: number;
  questions: number;
}

export const LOGIC_STAGES: LogicStageConfig[] = [
  { rules: ['arithmetic'], hardness: 0, timePerQuestion: 18, questions: 10 },
  { rules: ['arithmetic', 'shapePattern'], hardness: 1, timePerQuestion: 17, questions: 10 },
  { rules: ['arithmetic', 'shapePattern'], hardness: 2, timePerQuestion: 16, questions: 10 },
  { rules: ['shapePattern', 'geometric'], hardness: 2, timePerQuestion: 15, questions: 10 },
  { rules: ['arithmetic', 'geometric', 'alternating'], hardness: 3, timePerQuestion: 15, questions: 10 },
  { rules: ['alternating', 'shapePattern'], hardness: 3, timePerQuestion: 14, questions: 10 },
  { rules: ['geometric', 'alternating', 'fibonacci'], hardness: 4, timePerQuestion: 13, questions: 10 },
  { rules: ['fibonacci', 'composite'], hardness: 4, timePerQuestion: 13, questions: 10 },
  { rules: ['composite', 'alternating', 'geometric'], hardness: 5, timePerQuestion: 12, questions: 10 },
  {
    rules: ['arithmetic', 'geometric', 'shapePattern', 'alternating', 'fibonacci', 'composite'],
    hardness: 5,
    timePerQuestion: 11,
    questions: 10,
  },
];
