import { DinoOperation, DinoStageConfig } from './stages';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function computeAnswer(a: number, b: number, op: DinoOperation): number {
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

export interface DinoProblem {
  prompt: string;
  choices: number[];
  correctIndex: number;
}

export function generateProblem(config: DinoStageConfig): DinoProblem {
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

  const answer = computeAnswer(a, b, op);
  const distractors = new Set<number>();
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.3) + 3);
  let guard = 0;
  while (distractors.size < 3 && guard < 100) {
    guard++;
    const candidate = answer + randInt(-spread, spread);
    if (candidate !== answer) distractors.add(candidate);
  }

  const choices = [answer, ...Array.from(distractors)];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return { prompt: `${a} ${op} ${b}`, choices, correctIndex: choices.indexOf(answer) };
}
