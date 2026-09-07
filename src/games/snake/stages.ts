export interface SnakeStageConfig {
  boardSize: number;
  tickMs: number;
  obstacles: number;
  targetScore: number;
}

export const SNAKE_STAGES: SnakeStageConfig[] = [
  { boardSize: 13, tickMs: 220, obstacles: 0, targetScore: 5 },
  { boardSize: 13, tickMs: 205, obstacles: 0, targetScore: 6 },
  { boardSize: 13, tickMs: 190, obstacles: 2, targetScore: 7 },
  { boardSize: 15, tickMs: 180, obstacles: 3, targetScore: 8 },
  { boardSize: 15, tickMs: 170, obstacles: 4, targetScore: 9 },
  { boardSize: 15, tickMs: 160, obstacles: 5, targetScore: 10 },
  { boardSize: 17, tickMs: 150, obstacles: 6, targetScore: 11 },
  { boardSize: 17, tickMs: 140, obstacles: 8, targetScore: 12 },
  { boardSize: 17, tickMs: 130, obstacles: 9, targetScore: 13 },
  { boardSize: 19, tickMs: 115, obstacles: 12, targetScore: 15 },
];
