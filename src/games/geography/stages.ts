export type GeoQuestionType = 'flag' | 'capital' | 'continent';

export interface GeoStageConfig {
  tiers: (1 | 2 | 3)[];
  types: GeoQuestionType[];
  timePerQuestion: number;
  questions: number;
}

export const GEOGRAPHY_STAGES: GeoStageConfig[] = [
  { tiers: [1], types: ['flag'], timePerQuestion: 15, questions: 10 },
  { tiers: [1], types: ['flag', 'capital'], timePerQuestion: 15, questions: 10 },
  { tiers: [1, 2], types: ['flag', 'capital'], timePerQuestion: 14, questions: 10 },
  { tiers: [1, 2], types: ['flag', 'capital', 'continent'], timePerQuestion: 13, questions: 10 },
  { tiers: [1, 2], types: ['capital', 'continent'], timePerQuestion: 13, questions: 10 },
  { tiers: [1, 2, 3], types: ['flag', 'capital'], timePerQuestion: 12, questions: 10 },
  { tiers: [1, 2, 3], types: ['flag', 'capital', 'continent'], timePerQuestion: 11, questions: 10 },
  { tiers: [2, 3], types: ['flag', 'capital'], timePerQuestion: 10, questions: 10 },
  { tiers: [2, 3], types: ['flag', 'capital', 'continent'], timePerQuestion: 9, questions: 10 },
  { tiers: [1, 2, 3], types: ['flag', 'capital', 'continent'], timePerQuestion: 8, questions: 10 },
];
