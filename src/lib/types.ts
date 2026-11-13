export type GameId =
  | 'math'
  | 'geography'
  | 'map'
  | 'logic'
  | 'coding'
  | 'chess'
  | 'snake'
  | 'blaster'
  | 'dino'
  | 'roboshooter'
  | 'sudoku'
  | 'racing';

export type GameCategory = 'learn' | 'play';

export interface GameMeta {
  id: GameId;
  title: string;
  tagline: string;
  emoji: string;
  category: GameCategory;
  accent: string;
  /**
   * Standalone games that run their own levels (not the 10-stage engine) set this to
   * the path of a static page under `public/`; the game page then embeds it.
   */
  embedSrc?: string;
  /** Card label when the game doesn't use the shared 10 stages, e.g. "2 levels". */
  levelsLabel?: string;
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
