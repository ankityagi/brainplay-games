import { useMemo } from 'react';
import QuizGame, { QuizQuestion } from '../../components/QuizGame';
import { GameComponentProps } from '../../lib/types';
import { MATH_STAGES, Operation } from './stages';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function computeAnswer(a: number, b: number, op: Operation): number {
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

function buildQuestion(config: (typeof MATH_STAGES)[number]): QuizQuestion {
  const op = config.operations[randInt(0, config.operations.length - 1)];
  let a = randInt(config.min, config.max);
  let b = randInt(config.min, config.max);

  if (op === '÷') {
    // ensure whole-number division
    b = randInt(2, Math.min(config.max, 12));
    a = b * randInt(2, Math.max(2, Math.floor(config.max / b)));
  }
  if (op === '-' && !config.allowNegativeResult && b > a) {
    [a, b] = [b, a];
  }

  const answer = computeAnswer(a, b, op);
  const distractors = new Set<number>();
  while (distractors.size < 3) {
    const spread = Math.max(2, Math.round(Math.abs(answer) * 0.25) + randInt(1, 5));
    const candidate = answer + randInt(-spread, spread) * (randInt(0, 1) === 0 ? 1 : -1) || answer + randInt(1, spread);
    if (candidate !== answer && !distractors.has(candidate)) {
      distractors.add(candidate);
    }
  }

  const choices = [answer, ...Array.from(distractors)];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return {
    prompt: `${a} ${op} ${b} = ?`,
    choices: choices.map((c) => String(c)),
    correctIndex: choices.indexOf(answer),
  };
}

export default function MathGame({ stage, onFinish }: GameComponentProps) {
  const config = MATH_STAGES[stage - 1];
  const questions = useMemo(
    () => Array.from({ length: config.questions }, () => buildQuestion(config)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );

  return <QuizGame questions={questions} timePerQuestion={config.timePerQuestion} onFinish={onFinish} />;
}
