export interface MapStageConfig {
  tiers: (1 | 2 | 3)[];
  timePerQuestion: number;
  questions: number;
  showHint: boolean;
}

export const MAP_STAGES: MapStageConfig[] = [
  { tiers: [1], timePerQuestion: 22, questions: 6, showHint: true },
  { tiers: [1], timePerQuestion: 20, questions: 7, showHint: true },
  { tiers: [1, 2], timePerQuestion: 18, questions: 7, showHint: true },
  { tiers: [1, 2], timePerQuestion: 17, questions: 8, showHint: false },
  { tiers: [2], timePerQuestion: 16, questions: 8, showHint: false },
  { tiers: [2], timePerQuestion: 15, questions: 8, showHint: false },
  { tiers: [2, 3], timePerQuestion: 14, questions: 8, showHint: false },
  { tiers: [2, 3], timePerQuestion: 13, questions: 8, showHint: false },
  { tiers: [3], timePerQuestion: 12, questions: 8, showHint: false },
  { tiers: [1, 2, 3], timePerQuestion: 11, questions: 8, showHint: false },
];
