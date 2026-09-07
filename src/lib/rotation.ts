function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Tracks when each item was last picked and always prefers the least-recently-used
 * ones, so a pool never repeats an item until every other item has had a turn.
 * State lives for the lifetime of the picker (i.e. the browser session) - a page
 * reload starts a fresh rotation.
 */
export function createRotationPicker<T>(getKey: (item: T) => string) {
  const lastUsed = new Map<string, number>();
  let counter = 0;

  return function pick(pool: T[], count: number): T[] {
    const sorted = shuffle(pool).sort((a, b) => {
      const la = lastUsed.get(getKey(a)) ?? -1;
      const lb = lastUsed.get(getKey(b)) ?? -1;
      return la - lb;
    });
    const selected = sorted.slice(0, Math.min(count, pool.length));
    for (const item of selected) {
      counter += 1;
      lastUsed.set(getKey(item), counter);
    }
    return selected;
  };
}
