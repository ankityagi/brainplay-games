import { describe, expect, it } from 'vitest';
import { formatDistanceKm, getWarmthLevel } from '../src/games/map/feedback';
import { distanceBetweenCountriesKm, WORLD_CENTROIDS } from '../src/games/map/worldGeo';
import { MAP_COUNTRIES } from '../src/games/map/countries';

describe('getWarmthLevel', () => {
  it('gets warmer as distance decreases', () => {
    const far = getWarmthLevel(15000);
    const mid = getWarmthLevel(3000);
    const near = getWarmthLevel(100);
    expect(near.label).not.toBe(mid.label);
    expect(mid.label).not.toBe(far.label);
  });

  it('treats 0 km as the warmest level', () => {
    expect(getWarmthLevel(0).label).toBe('Nailed the neighborhood!');
  });
});

describe('formatDistanceKm', () => {
  it('rounds and adds thousands separators', () => {
    expect(formatDistanceKm(1234.6)).toBe('1,235 km');
    expect(formatDistanceKm(42)).toBe('42 km');
  });
});

describe('distanceBetweenCountriesKm', () => {
  it('is zero for the same country', () => {
    expect(distanceBetweenCountriesKm('250', '250')).toBe(0);
  });

  it('gives a plausible distance for two known neighboring-ish countries (France <-> Germany)', () => {
    const km = distanceBetweenCountriesKm('250', '276');
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(1500);
  });

  it('gives a large distance for two countries on opposite sides of the globe (France <-> Australia)', () => {
    const km = distanceBetweenCountriesKm('250', '036');
    expect(km).toBeGreaterThan(10000);
  });

  it('has a centroid for every country in our target pool', () => {
    for (const c of MAP_COUNTRIES) {
      expect(WORLD_CENTROIDS[c.id], `${c.name} (${c.id}) has no centroid`).toBeDefined();
    }
  });
});
