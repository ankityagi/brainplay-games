import { describe, expect, it } from 'vitest';
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
});
