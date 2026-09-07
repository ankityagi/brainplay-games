const STORAGE_PREFIX = 'brainplay:rotation:';

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

interface RotationState {
  counter: number;
  lastUsed: [string, number][];
}

function loadState(storageKey: string): RotationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RotationState;
    if (typeof parsed.counter !== 'number' || !Array.isArray(parsed.lastUsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(storageKey: string, state: RotationState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota) - rotation just won't persist
  }
}

/**
 * Tracks when each item was last picked and always prefers the least-recently-used
 * ones, so a pool never repeats an item until every other item has had a turn.
 *
 * When storageKey is given, the rotation state is persisted to localStorage so it
 * survives a page reload; otherwise it only lives for as long as the picker does.
 */
export function createRotationPicker<T>(getKey: (item: T) => string, storageKey?: string) {
  const saved = storageKey ? loadState(storageKey) : null;
  const lastUsed = new Map<string, number>(saved?.lastUsed ?? []);
  let counter = saved?.counter ?? 0;

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
    if (storageKey) {
      saveState(storageKey, { counter, lastUsed: Array.from(lastUsed.entries()) });
    }
    return selected;
  };
}
