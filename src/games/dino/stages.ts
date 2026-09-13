export type DinoOperation = '+' | '-' | '×' | '÷';

export interface DinoStageConfig {
  /** how many non-bug NPC dinos roam the arena at once */
  npcCount: number;
  /** how many bugs (tier 0, always-safe snacks) roam the arena at once */
  bugCount: number;
  /** NPC wander speed, in % of playfield width per second */
  npcSpeed: number;
  /** lowest/highest size tier (1-5) that a non-bug dino can spawn at on this stage */
  minSpawnTier: number;
  maxSpawnTier: number;
  operations: DinoOperation[];
  addSubMin: number;
  addSubMax: number;
  mulDivMin: number;
  mulDivMax: number;
  allowNegativeResult: boolean;
  timePerQuestion: number;
  /** dinos you need to eat to clear the stage */
  targetScore: number;
}

export const DINO_STAGES: DinoStageConfig[] = [
  { npcCount: 4, bugCount: 10, npcSpeed: 5, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '×'], addSubMin: 1, addSubMax: 10, mulDivMin: 2, mulDivMax: 5, allowNegativeResult: false, timePerQuestion: 12, targetScore: 5 },
  { npcCount: 5, bugCount: 10, npcSpeed: 6, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '-', '×'], addSubMin: 1, addSubMax: 15, mulDivMin: 2, mulDivMax: 5, allowNegativeResult: false, timePerQuestion: 11, targetScore: 5 },
  { npcCount: 5, bugCount: 10, npcSpeed: 7, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '-', '×'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 6, allowNegativeResult: false, timePerQuestion: 11, targetScore: 5 },
  { npcCount: 6, bugCount: 10, npcSpeed: 8, minSpawnTier: 1, maxSpawnTier: 5, operations: ['×'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 6, allowNegativeResult: false, timePerQuestion: 10, targetScore: 5 },
  { npcCount: 6, bugCount: 10, npcSpeed: 9, minSpawnTier: 1, maxSpawnTier: 5, operations: ['×', '÷'], addSubMin: 5, addSubMax: 25, mulDivMin: 2, mulDivMax: 9, allowNegativeResult: false, timePerQuestion: 10, targetScore: 5 },
  { npcCount: 7, bugCount: 10, npcSpeed: 10, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '-', '×'], addSubMin: 10, addSubMax: 35, mulDivMin: 3, mulDivMax: 9, allowNegativeResult: false, timePerQuestion: 9, targetScore: 5 },
  { npcCount: 7, bugCount: 10, npcSpeed: 11, minSpawnTier: 1, maxSpawnTier: 5, operations: ['×', '÷'], addSubMin: 10, addSubMax: 35, mulDivMin: 4, mulDivMax: 12, allowNegativeResult: false, timePerQuestion: 9, targetScore: 5 },
  { npcCount: 8, bugCount: 10, npcSpeed: 12, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '-', '×', '÷'], addSubMin: 15, addSubMax: 45, mulDivMin: 5, mulDivMax: 12, allowNegativeResult: true, timePerQuestion: 8, targetScore: 5 },
  { npcCount: 8, bugCount: 10, npcSpeed: 13, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '-', '×', '÷'], addSubMin: 20, addSubMax: 65, mulDivMin: 6, mulDivMax: 12, allowNegativeResult: true, timePerQuestion: 8, targetScore: 5 },
  { npcCount: 9, bugCount: 10, npcSpeed: 14, minSpawnTier: 1, maxSpawnTier: 5, operations: ['+', '-', '×', '÷'], addSubMin: 25, addSubMax: 99, mulDivMin: 7, mulDivMax: 12, allowNegativeResult: true, timePerQuestion: 7, targetScore: 5 },
];

export interface DinoTierInfo {
  label: string;
  emoji: string;
  /** rendered size, in px, at a 100px-tall reference playfield */
  scale: number;
  /** CSS hue-rotate degrees, to tell same-emoji tiers apart at a glance */
  tint: number;
}

export const DINO_TIERS: Record<number, DinoTierInfo> = {
  0: { label: 'Bug', emoji: '🐛', scale: 0.4, tint: 0 },
  1: { label: 'Lizard', emoji: '🦎', scale: 0.6, tint: 0 },
  2: { label: 'Velociraptor', emoji: '🦖', scale: 0.85, tint: 0 },
  3: { label: 'Brontosaurus', emoji: '🦕', scale: 1.1, tint: 0 },
  4: { label: 'T-Rex', emoji: '🦖', scale: 1.35, tint: -50 },
  5: { label: 'Spinosaurus', emoji: '🦖', scale: 1.6, tint: 170 },
};

export function starsFor(score: number, target: number): 0 | 1 | 2 | 3 {
  if (score >= target * 1.4) return 3;
  if (score >= target * 1.1) return 2;
  if (score >= target * 0.6) return 1;
  return 0;
}
