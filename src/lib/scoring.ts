export const PASS_THRESHOLD = 0.6;

export function starsForFraction(fraction: number): 0 | 1 | 2 | 3 {
  if (fraction >= 1) return 3;
  if (fraction >= 0.8) return 2;
  if (fraction >= PASS_THRESHOLD) return 1;
  return 0;
}

export function passedFraction(fraction: number): boolean {
  return fraction >= PASS_THRESHOLD;
}

/** Difficulty multiplier 0..1 for a given stage (1-10), useful for scaling ranges/timers. */
export function difficulty(stage: number, totalStages = 10): number {
  return (stage - 1) / (totalStages - 1);
}

export function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}
