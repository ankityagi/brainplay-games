export type LogicRule =
  | 'arithmetic'
  | 'geometric'
  | 'shapePattern'
  | 'alternating'
  | 'fibonacci'
  | 'composite';

const SHAPES = ['🔺', '🔵', '🟩', '⭐', '⬛', '🔶', '🟣', '🔻'];

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

export interface LogicPuzzle {
  items: string[];
  next: string;
  isShape: boolean;
}

function numberDistractors(next: number, count: number): number[] {
  const set = new Set<number>();
  const spread = Math.max(2, Math.round(Math.abs(next) * 0.2) + 3);
  let guard = 0;
  while (set.size < count && guard < 50) {
    guard++;
    const candidate = next + randInt(-spread, spread);
    if (candidate !== next) set.add(candidate);
  }
  return Array.from(set);
}

function arithmeticPuzzle(stepMin: number, stepMax: number, length = 5): LogicPuzzle {
  const step = randInt(stepMin, stepMax) * (Math.random() < 0.5 && stepMin < 0 ? -1 : 1);
  const start = randInt(1, 20);
  const seq = Array.from({ length }, (_, i) => start + step * i);
  const next = start + step * length;
  return { items: seq.map(String), next: String(next), isShape: false };
}

function geometricPuzzle(ratioMin: number, ratioMax: number, length = 4): LogicPuzzle {
  const ratio = randInt(ratioMin, ratioMax);
  const start = randInt(1, 3);
  const seq: number[] = [start];
  for (let i = 1; i < length; i++) seq.push(seq[i - 1] * ratio);
  const next = seq[length - 1] * ratio;
  return { items: seq.map(String), next: String(next), isShape: false };
}

function shapePatternPuzzle(period: number, length = 6): LogicPuzzle {
  const palette = shuffle(SHAPES).slice(0, period);
  const seq = Array.from({ length }, (_, i) => palette[i % period]);
  const next = palette[length % period];
  return { items: seq, next, isShape: true };
}

function alternatingPuzzle(deltaA: number, deltaB: number, length = 6): LogicPuzzle {
  const start = randInt(2, 15);
  const seq = [start];
  const deltas = [deltaA, deltaB];
  for (let i = 1; i < length; i++) {
    seq.push(seq[i - 1] + deltas[(i - 1) % 2]);
  }
  const next = seq[length - 1] + deltas[(length - 1) % 2];
  return { items: seq.map(String), next: String(next), isShape: false };
}

function fibonacciPuzzle(length = 6): LogicPuzzle {
  const a0 = randInt(1, 5);
  const a1 = randInt(1, 5);
  const seq = [a0, a1];
  for (let i = 2; i < length; i++) seq.push(seq[i - 1] + seq[i - 2]);
  const next = seq[length - 1] + seq[length - 2];
  return { items: seq.map(String), next: String(next), isShape: false };
}

function compositePuzzle(length = 5): LogicPuzzle {
  const mult = randInt(2, 3);
  const sub = randInt(1, 4);
  const start = randInt(1, 4);
  const seq = [start];
  for (let i = 1; i < length; i++) {
    seq.push(seq[i - 1] * mult - sub);
  }
  const next = seq[length - 1] * mult - sub;
  return { items: seq.map(String), next: String(next), isShape: false };
}

export function generatePuzzle(rule: LogicRule, hardness: number): LogicPuzzle {
  switch (rule) {
    case 'arithmetic':
      return arithmeticPuzzle(1, 3 + hardness);
    case 'geometric':
      return geometricPuzzle(2, 2 + Math.min(hardness, 2));
    case 'shapePattern':
      return shapePatternPuzzle(2 + Math.min(hardness, 2));
    case 'alternating':
      return alternatingPuzzle(2 + hardness, -(1 + Math.floor(hardness / 2)));
    case 'fibonacci':
      return fibonacciPuzzle();
    case 'composite':
      return compositePuzzle();
  }
}

export function buildChoices(puzzle: LogicPuzzle): { choices: string[]; correctIndex: number } {
  let choices: string[];
  if (puzzle.isShape) {
    const others = shuffle(SHAPES.filter((s) => s !== puzzle.next)).slice(0, 3);
    choices = shuffle([puzzle.next, ...others]);
  } else {
    const distractors = numberDistractors(Number(puzzle.next), 3);
    choices = shuffle([puzzle.next, ...distractors.map(String)]);
  }
  return { choices, correctIndex: choices.indexOf(puzzle.next) };
}
