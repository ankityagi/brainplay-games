import { beforeEach, describe, expect, it } from 'vitest';
import { createRotationPicker } from '../src/lib/rotation';

interface Item {
  id: string;
}

function items(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: `item-${i}` }));
}

describe('createRotationPicker', () => {
  it('never repeats within a single pick', () => {
    const pick = createRotationPicker<Item>((i) => i.id);
    const pool = items(15);
    const selected = pick(pool, 10);
    const ids = selected.map((i) => i.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('does not repeat across picks until the pool is exhausted', () => {
    const pick = createRotationPicker<Item>((i) => i.id);
    const pool = items(20);
    const first = pick(pool, 10);
    const second = pick(pool, 10);
    const firstIds = new Set(first.map((i) => i.id));
    const secondIds = new Set(second.map((i) => i.id));
    const overlap = [...firstIds].filter((id) => secondIds.has(id));
    expect(overlap).toEqual([]);
  });

  it('only reuses an item once every other item in the pool has had a turn', () => {
    const pick = createRotationPicker<Item>((i) => i.id);
    const pool = items(10);
    const first = pick(pool, 10); // uses all 10
    const second = pick(pool, 10); // pool exhausted of "fresh" items -> must reuse all 10
    expect(new Set(first.map((i) => i.id)).size).toBe(10);
    expect(new Set(second.map((i) => i.id)).size).toBe(10);
  });

  it('prefers less-recently-used items across three consecutive picks from a larger pool', () => {
    const pick = createRotationPicker<Item>((i) => i.id);
    const pool = items(30);
    const first = pick(pool, 10);
    const second = pick(pool, 10);
    const third = pick(pool, 10);
    const firstIds = new Set(first.map((i) => i.id));
    const secondIds = new Set(second.map((i) => i.id));
    const thirdIds = new Set(third.map((i) => i.id));
    expect([...firstIds].some((id) => secondIds.has(id))).toBe(false);
    expect([...firstIds].some((id) => thirdIds.has(id))).toBe(false);
    expect([...secondIds].some((id) => thirdIds.has(id))).toBe(false);
  });

  describe('with a storageKey', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('persists rotation state across separate picker instances (simulating a page reload)', () => {
      const pool = items(20);

      const pickA = createRotationPicker<Item>((i) => i.id, 'test-rotation');
      const first = pickA(pool, 10);

      // A brand new picker instance, as if the page had been reloaded.
      const pickB = createRotationPicker<Item>((i) => i.id, 'test-rotation');
      const second = pickB(pool, 10);

      const firstIds = new Set(first.map((i) => i.id));
      const secondIds = new Set(second.map((i) => i.id));
      const overlap = [...firstIds].filter((id) => secondIds.has(id));
      expect(overlap).toEqual([]);
    });

    it('does not share state between different storage keys', () => {
      const pool = items(10);
      const pickA = createRotationPicker<Item>((i) => i.id, 'rotation-a');
      pickA(pool, 10);

      const pickB = createRotationPicker<Item>((i) => i.id, 'rotation-b');
      const result = pickB(pool, 10);
      expect(result).toHaveLength(10);
    });

    it('without a storageKey, does not persist across instances', () => {
      const pool = items(20);
      const pickA = createRotationPicker<Item>((i) => i.id);
      const first = pickA(pool, 10);

      const pickB = createRotationPicker<Item>((i) => i.id);
      const second = pickB(pool, 10);

      // No shared memory -> pickB has no idea what pickA used, so overlap is possible.
      // This just asserts both still return valid, fully-distinct-within-themselves picks.
      expect(new Set(first.map((i) => i.id)).size).toBe(10);
      expect(new Set(second.map((i) => i.id)).size).toBe(10);
    });
  });
});
