import { useMemo } from 'react';
import QuizGame, { QuizQuestion } from '../../components/QuizGame';
import { GameComponentProps } from '../../lib/types';
import { COUNTRIES, Country } from './data';
import { GEOGRAPHY_STAGES, GeoQuestionType } from './stages';

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

function pickDistractors(pool: Country[], correct: Country, field: keyof Country, count: number): string[] {
  const values = new Set<string>();
  const shuffled = shuffle(pool.filter((c) => c.name !== correct.name));
  for (const c of shuffled) {
    const value = String(c[field]);
    if (value !== String(correct[field])) values.add(value);
    if (values.size >= count) break;
  }
  return Array.from(values);
}

function buildQuestion(pool: Country[], type: GeoQuestionType): QuizQuestion {
  const country = pool[randInt(0, pool.length - 1)];
  if (type === 'flag') {
    const distractors = pickDistractors(pool, country, 'name', 3);
    const choices = shuffle([country.name, ...distractors]);
    return {
      prompt: (
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl">{country.flag}</span>
          <span className="text-base text-slate-400 font-normal">Which country is this?</span>
        </div>
      ),
      choices,
      correctIndex: choices.indexOf(country.name),
    };
  }
  if (type === 'capital') {
    const distractors = pickDistractors(pool, country, 'capital', 3);
    const choices = shuffle([country.capital, ...distractors]);
    return {
      prompt: `What is the capital of ${country.name}?`,
      choices,
      correctIndex: choices.indexOf(country.capital),
    };
  }
  const distractors = pickDistractors(pool, country, 'continent', 3);
  const choices = shuffle([country.continent, ...distractors]);
  return {
    prompt: `Which continent is ${country.name} in?`,
    choices,
    correctIndex: choices.indexOf(country.continent),
  };
}

export default function GeographyGame({ stage, onFinish }: GameComponentProps) {
  const config = GEOGRAPHY_STAGES[stage - 1];
  const questions = useMemo(() => {
    const pool = COUNTRIES.filter((c) => config.tiers.includes(c.tier));
    return Array.from({ length: config.questions }, () =>
      buildQuestion(pool, config.types[randInt(0, config.types.length - 1)]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return <QuizGame questions={questions} timePerQuestion={config.timePerQuestion} onFinish={onFinish} />;
}
