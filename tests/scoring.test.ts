import { describe, expect, it } from 'vitest';
import { difficulty, lerp, passedFraction, starsForFraction } from '../src/lib/scoring';

describe('scoring', () => {
  it('awards 3 stars for a perfect score', () => {
    expect(starsForFraction(1)).toBe(3);
  });

  it('awards 2 stars for 80%+', () => {
    expect(starsForFraction(0.8)).toBe(2);
    expect(starsForFraction(0.9)).toBe(2);
  });

  it('awards 1 star at the pass threshold', () => {
    expect(starsForFraction(0.6)).toBe(1);
    expect(starsForFraction(0.75)).toBe(1);
  });

  it('awards 0 stars below the pass threshold', () => {
    expect(starsForFraction(0.59)).toBe(0);
    expect(starsForFraction(0)).toBe(0);
  });

  it('treats the pass threshold as inclusive', () => {
    expect(passedFraction(0.6)).toBe(true);
    expect(passedFraction(0.59)).toBe(false);
  });

  it('maps stage 1 and the last stage to 0 and 1', () => {
    expect(difficulty(1, 10)).toBe(0);
    expect(difficulty(10, 10)).toBe(1);
  });

  it('lerps and rounds to the nearest integer', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});
