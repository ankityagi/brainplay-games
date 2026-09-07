import { useMemo } from 'react';
import QuizGame, { QuizQuestion } from '../../components/QuizGame';
import { GameComponentProps } from '../../lib/types';
import { generateSnippet } from './templates';
import { CODING_STAGES } from './stages';

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

function buildQuestion(config: (typeof CODING_STAGES)[number]): QuizQuestion {
  const templateId = config.templates[randInt(0, config.templates.length - 1)];
  const snippet = generateSnippet(templateId);
  const choices = shuffle([snippet.answer, ...snippet.distractors]);
  return {
    prompt: (
      <div className="flex flex-col items-center gap-3 w-full">
        <pre className="text-left text-base sm:text-lg bg-slate-900 border border-slate-800 rounded-xl p-4 w-full overflow-x-auto font-mono text-emerald-300">
          {snippet.code}
        </pre>
        <span className="text-base text-slate-400 font-normal">What does this print?</span>
      </div>
    ),
    choices,
    correctIndex: choices.indexOf(snippet.answer),
  };
}

export default function CodingGame({ stage, onFinish }: GameComponentProps) {
  const config = CODING_STAGES[stage - 1];
  const questions = useMemo(
    () => Array.from({ length: config.questions }, () => buildQuestion(config)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage],
  );

  return <QuizGame questions={questions} timePerQuestion={config.timePerQuestion} onFinish={onFinish} />;
}
