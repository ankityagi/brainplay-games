import { describe, expect, it } from 'vitest';
import { MAP_COUNTRIES } from '../src/games/map/countries';
import { WORLD_FEATURES } from '../src/games/map/worldGeo';

describe('map country pool', () => {
  const worldIds = new Set(WORLD_FEATURES.map((f) => f.id));

  it('has exactly 50 countries', () => {
    expect(MAP_COUNTRIES.length).toBe(50);
  });

  it('has unique ids', () => {
    const ids = new Set(MAP_COUNTRIES.map((c) => c.id));
    expect(ids.size).toBe(MAP_COUNTRIES.length);
  });

  it('every id matches a real drawable feature in the world map data', () => {
    for (const c of MAP_COUNTRIES) {
      expect(worldIds.has(c.id), `${c.name} (${c.id}) has no matching map feature`).toBe(true);
    }
  });

  it('splits into 15/20/15 across tiers 1/2/3', () => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const c of MAP_COUNTRIES) counts[c.tier]++;
    expect(counts).toEqual({ 1: 15, 2: 20, 3: 15 });
  });
});
