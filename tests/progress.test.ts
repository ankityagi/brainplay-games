import { beforeEach, describe, expect, it } from 'vitest';
import { getProgress, isStageUnlocked, recordStageCompletion, resetGameProgress, totalStarsEarned } from '../src/lib/progress';

describe('progress store', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with only stage 1 unlocked', () => {
    const progress = getProgress('math');
    expect(progress.unlockedStage).toBe(1);
    expect(isStageUnlocked('math', 1)).toBe(true);
    expect(isStageUnlocked('math', 2)).toBe(false);
  });

  it('unlocks the next stage after a pass', () => {
    recordStageCompletion('math', { stage: 1, passed: true, stars: 2, score: 8 });
    expect(isStageUnlocked('math', 2)).toBe(true);
    expect(isStageUnlocked('math', 3)).toBe(false);
  });

  it('does not unlock the next stage on a fail', () => {
    recordStageCompletion('math', { stage: 1, passed: false, stars: 0, score: 3 });
    expect(isStageUnlocked('math', 2)).toBe(false);
  });

  it('keeps the best stars and score across repeated attempts', () => {
    recordStageCompletion('math', { stage: 1, passed: true, stars: 1, score: 6 });
    recordStageCompletion('math', { stage: 1, passed: true, stars: 3, score: 10 });
    recordStageCompletion('math', { stage: 1, passed: true, stars: 1, score: 6 });
    const progress = getProgress('math');
    expect(progress.stages[1].stars).toBe(3);
    expect(progress.stages[1].bestScore).toBe(10);
  });

  it('sums total stars across stages', () => {
    recordStageCompletion('geography', { stage: 1, passed: true, stars: 2, score: 8 });
    recordStageCompletion('geography', { stage: 2, passed: true, stars: 3, score: 10 });
    expect(totalStarsEarned('geography')).toBe(5);
  });

  it('resets progress back to only stage 1 unlocked', () => {
    recordStageCompletion('logic', { stage: 1, passed: true, stars: 3, score: 10 });
    resetGameProgress('logic');
    const progress = getProgress('logic');
    expect(progress.unlockedStage).toBe(1);
    expect(progress.stages).toEqual({});
  });

  it('does not advance past the final stage', () => {
    for (let stage = 1; stage <= 10; stage++) {
      recordStageCompletion('coding', { stage, passed: true, stars: 3, score: 10 });
    }
    const progress = getProgress('coding');
    expect(progress.unlockedStage).toBe(10);
  });

  it('keeps separate progress per game', () => {
    recordStageCompletion('chess', { stage: 1, passed: true, stars: 3, score: 6 });
    expect(getProgress('snake').unlockedStage).toBe(1);
    expect(getProgress('chess').unlockedStage).toBe(2);
  });
});
