export interface ChessStageConfig {
  tier: 1 | 2 | 3 | 4;
  timePerQuestion: number;
  questions: number;
}

export const CHESS_STAGES: ChessStageConfig[] = [
  { tier: 1, timePerQuestion: 30, questions: 5 },
  { tier: 1, timePerQuestion: 28, questions: 6 },
  { tier: 1, timePerQuestion: 26, questions: 6 },
  { tier: 2, timePerQuestion: 25, questions: 6 },
  { tier: 2, timePerQuestion: 24, questions: 6 },
  { tier: 3, timePerQuestion: 24, questions: 6 },
  { tier: 3, timePerQuestion: 22, questions: 6 },
  { tier: 3, timePerQuestion: 20, questions: 6 },
  { tier: 4, timePerQuestion: 20, questions: 6 },
  { tier: 4, timePerQuestion: 18, questions: 6 },
];
