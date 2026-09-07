export type GameId = 'math' | 'geography' | 'logic' | 'coding' | 'chess' | 'snake';

export type GameCategory = 'learn' | 'play';

export interface GameMeta {
  id: GameId;
  title: string;
  tagline: string;
  emoji: string;
  category: GameCategory;
  accent: string;
}

export const TOTAL_STAGES = 10;

export interface StageRecord {
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
}

export interface GameProgress {
  unlockedStage: number;
  stages: Record<number, StageRecord>;
}

export interface StageCompletion {
  stage: number;
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  score: number;
}

export interface GameComponentProps {
  stage: number;
  onFinish: (result: { passed: boolean; stars: 0 | 1 | 2 | 3; score: number }) => void;
}
