import { useMemo } from 'react';
import QuizGame, { QuizQuestion } from '../../components/QuizGame';
import { GameComponentProps } from '../../lib/types';
import { buildChoices, generatePuzzle } from './generators';
import { LOGIC_STAGES } from './stages';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQuestion(config: (typeof LOGIC_STAGES)[number]): QuizQuestion {
  const rule = config.rules[randInt(0, config.rules.length - 1)];
  const puzzle = generatePuzzle(rule, config.hardness);
  const { choices, correctIndex } = buildChoices(puzzle);
  return {
    prompt: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3 text-5xl">
          {puzzle.items.map((item, i) => (
            <span key={i} className={puzzle.isShape ? '' : 'font-mono'}>
              {item}
            </span>
          ))}
          <span className="text-slate-500">?</span>
        </div>
        <span className="text-lg text-slate-400 font-normal">What comes next?</span>
      </div>
    ),
    choices,
    correctIndex,
  };
}

export default function LogicGame({ stage, onFinish }: GameComponentProps) {
  const config = LOGIC_STAGES[stage - 1];
  const questions = useMemo(
    () => Array.from({ length: config.questions }, () => buildQuestion(config)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );

  return <QuizGame questions={questions} timePerQuestion={config.timePerQuestion} onFinish={onFinish} />;
}
