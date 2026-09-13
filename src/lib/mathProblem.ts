export type MathOperation = '+' | '-' | '×' | '÷';

export interface MathProblemConfig {
  operations: MathOperation[];
  /** operand range used for + and - */
  addSubMin: number;
  addSubMax: number;
  /** operand range used for × and ÷ (kept separate so late stages don't roll things like 47×82) */
  mulDivMin: number;
  mulDivMax: number;
  allowNegativeResult: boolean;
}

export interface MathProblem {
  prompt: string;
  answer: number;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function computeAnswer(a: number, b: number, op: MathOperation): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return a / b;
  }
}

export function generateProblem(config: MathProblemConfig): MathProblem {
  const op = config.operations[randInt(0, config.operations.length - 1)];
  const isMulDiv = op === '×' || op === '÷';
  const min = isMulDiv ? config.mulDivMin : config.addSubMin;
  const max = isMulDiv ? config.mulDivMax : config.addSubMax;
  let a = randInt(min, max);
  let b = randInt(min, max);

  if (op === '÷') {
    b = randInt(2, max);
    a = b * randInt(2, Math.max(2, Math.floor(max / b)));
  }
  if (op === '-' && !config.allowNegativeResult && b > a) {
    [a, b] = [b, a];
  }

  return { prompt: `${a} ${op} ${b}`, answer: computeAnswer(a, b, op) };
}

export function generateDistractors(answer: number, count: number): number[] {
  const values = new Set<number>();
  let guard = 0;
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.3) + 3);
  while (values.size < count && guard < 100) {
    guard++;
    const candidate = answer + randInt(-spread, spread);
    if (candidate !== answer) values.add(candidate);
  }
  return Array.from(values);
}
