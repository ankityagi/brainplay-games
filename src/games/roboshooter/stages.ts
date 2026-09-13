import { MathOperation } from '../../lib/mathProblem';

export interface RoboShooterStageConfig {
  /** ms between robot spawns, while under the maxRobots cap */
  spawnIntervalMs: number;
  /** how fast a robot's distance (1 = just entered, 0 = reached the player) closes per second */
  baseSpeed: number;
  /** hits needed to destroy a medium robot; large robots take one more, small robots take one fewer (min 1) */
  baseHp: number;
  /** max robots approaching at once */
  maxRobots: number;
  /** kills needed to pass the stage */
  targetKills: number;
  /** reload math problem: allowed operations and operand ranges, same shape/progression as Math Blaster */
  operations: MathOperation[];
  addSubMin: number;
  addSubMax: number;
  mulDivMin: number;
  mulDivMax: number;
  allowNegativeResult: boolean;
}

export const ROBOSHOOTER_STAGES: RoboShooterStageConfig[] = [
  { spawnIntervalMs: 2200, baseSpeed: 0.09, baseHp: 1, maxRobots: 3, targetKills: 8, operations: ['+'], addSubMin: 1, addSubMax: 10, mulDivMin: 2, mulDivMax: 5, allowNegativeResult: false },
  { spawnIntervalMs: 2000, baseSpeed: 0.1, baseHp: 1, maxRobots: 3, targetKills: 9, operations: ['+', '-'], addSubMin: 1, addSubMax: 15, mulDivMin: 2, mulDivMax: 5, allowNegativeResult: false },
  { spawnIntervalMs: 1900, baseSpeed: 0.11, baseHp: 1, maxRobots: 4, targetKills: 10, operations: ['+', '-'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 6, allowNegativeResult: false },
  { spawnIntervalMs: 1800, baseSpeed: 0.13, baseHp: 2, maxRobots: 4, targetKills: 10, operations: ['×'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 6, allowNegativeResult: false },
  { spawnIntervalMs: 1700, baseSpeed: 0.14, baseHp: 2, maxRobots: 4, targetKills: 11, operations: ['×', '÷'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 9, allowNegativeResult: false },
  { spawnIntervalMs: 1600, baseSpeed: 0.16, baseHp: 2, maxRobots: 5, targetKills: 12, operations: ['+', '-', '×'], addSubMin: 10, addSubMax: 35, mulDivMin: 3, mulDivMax: 9, allowNegativeResult: false },
  { spawnIntervalMs: 1500, baseSpeed: 0.18, baseHp: 2, maxRobots: 5, targetKills: 12, operations: ['×', '÷'], addSubMin: 10, addSubMax: 35, mulDivMin: 4, mulDivMax: 12, allowNegativeResult: false },
  { spawnIntervalMs: 1400, baseSpeed: 0.19, baseHp: 3, maxRobots: 5, targetKills: 13, operations: ['+', '-', '×', '÷'], addSubMin: 15, addSubMax: 45, mulDivMin: 5, mulDivMax: 12, allowNegativeResult: true },
  { spawnIntervalMs: 1200, baseSpeed: 0.21, baseHp: 3, maxRobots: 6, targetKills: 13, operations: ['+', '-', '×', '÷'], addSubMin: 20, addSubMax: 65, mulDivMin: 6, mulDivMax: 12, allowNegativeResult: true },
  { spawnIntervalMs: 1100, baseSpeed: 0.22, baseHp: 3, maxRobots: 6, targetKills: 14, operations: ['+', '-', '×', '÷'], addSubMin: 25, addSubMax: 99, mulDivMin: 7, mulDivMax: 12, allowNegativeResult: true },
];
