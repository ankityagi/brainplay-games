export interface GeoStageConfig {
  tiers: (1 | 2 | 3)[];
  timePerQuestion: number;
  questions: number;
}

export const GEOGRAPHY_STAGES: GeoStageConfig[] = [
  { tiers: [1], timePerQuestion: 15, questions: 10 },
  { tiers: [1], timePerQuestion: 14, questions: 10 },
  { tiers: [1, 2], timePerQuestion: 14, questions: 10 },
  { tiers: [1, 2], timePerQuestion: 13, questions: 10 },
  { tiers: [1, 2], timePerQuestion: 12, questions: 10 },
  { tiers: [2], timePerQuestion: 12, questions: 10 },
  { tiers: [2, 3], timePerQuestion: 11, questions: 10 },
  { tiers: [2, 3], timePerQuestion: 10, questions: 10 },
  { tiers: [3], timePerQuestion: 9, questions: 10 },
  { tiers: [1, 2, 3], timePerQuestion: 8, questions: 10 },
];
