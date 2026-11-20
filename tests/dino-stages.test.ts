import { describe, expect, it } from 'vitest';
import { DINO_STAGES, DINO_TIERS, EAT_PER_DINO, starsFor, tierForEaten } from '../src/games/dino/stages';

describe('Dinosaur Chaos growth', () => {
  it('always starts as the Lizard', () => {
    expect(DINO_TIERS[tierForEaten(0)].label).toBe('Lizard');
  });

  it('grows into the next dino every 5 animals eaten', () => {
    expect(EAT_PER_DINO).toBe(5);
    expect(tierForEaten(4)).toBe(1);
    expect(tierForEaten(5)).toBe(2);
    expect(tierForEaten(9)).toBe(2);
    expect(tierForEaten(10)).toBe(3);
  });

  it('stops growing at the Spinosaurus', () => {
    expect(tierForEaten(45)).toBe(10);
    expect(tierForEaten(200)).toBe(10);
  });

  it('clears stage N by growing N times (5 animals per dino)', () => {
    DINO_STAGES.forEach((cfg, i) => {
      expect(cfg.targetScore).toBe(EAT_PER_DINO * (i + 1));
    });
  });

  it('gives at least one star for clearing a stage and more for eating extra', () => {
    for (const cfg of DINO_STAGES) {
      const t = cfg.targetScore;
      expect(starsFor(t, t)).toBeGreaterThanOrEqual(1);
      expect(starsFor(Math.ceil(t * 1.4), t)).toBe(3);
    }
    expect(starsFor(5, 5)).toBe(1);
    expect(starsFor(6, 5)).toBe(2);
    expect(starsFor(7, 5)).toBe(3);
  });
});
