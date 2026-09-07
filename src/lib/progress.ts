import { GameId, GameProgress, StageCompletion, TOTAL_STAGES } from './types';

const STORAGE_PREFIX = 'brainplay:progress:';

function emptyProgress(): GameProgress {
  return { unlockedStage: 1, stages: {} };
}

function safeParse(raw: string | null): GameProgress {
  if (!raw) return emptyProgress();
  try {
    const parsed = JSON.parse(raw) as GameProgress;
    if (!parsed || typeof parsed.unlockedStage !== 'number' || typeof parsed.stages !== 'object') {
      return emptyProgress();
    }
    return parsed;
  } catch {
    return emptyProgress();
  }
}

export function getProgress(gameId: GameId): GameProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    return safeParse(window.localStorage.getItem(STORAGE_PREFIX + gameId));
  } catch {
    return emptyProgress();
  }
}

function saveProgress(gameId: GameId, progress: GameProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + gameId, JSON.stringify(progress));
  } catch {
    // localStorage unavailable (private mode, quota) - progress just won't persist
  }
}

export function isStageUnlocked(gameId: GameId, stage: number): boolean {
  const progress = getProgress(gameId);
  return stage <= progress.unlockedStage;
}

export function recordStageCompletion(gameId: GameId, result: StageCompletion): GameProgress {
  const progress = getProgress(gameId);
  const existing = progress.stages[result.stage];
  progress.stages[result.stage] = {
    passed: result.passed || Boolean(existing?.passed),
    stars: Math.max(result.stars, existing?.stars ?? 0) as 0 | 1 | 2 | 3,
    bestScore: Math.max(result.score, existing?.bestScore ?? 0),
  };
  if (result.passed && result.stage === progress.unlockedStage && progress.unlockedStage < TOTAL_STAGES) {
    progress.unlockedStage = result.stage + 1;
  }
  saveProgress(gameId, progress);
  return progress;
}

export function resetGameProgress(gameId: GameId): void {
  saveProgress(gameId, emptyProgress());
}

export function totalStarsEarned(gameId: GameId): number {
  const progress = getProgress(gameId);
  return Object.values(progress.stages).reduce((sum, s) => sum + s.stars, 0);
}
