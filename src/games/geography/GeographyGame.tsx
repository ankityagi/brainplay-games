import { useMemo } from 'react';
import QuizGame, { QuizQuestion } from '../../components/QuizGame';
import { createRotationPicker } from '../../lib/rotation';
import { GameComponentProps } from '../../lib/types';
import { COUNTRIES, Country } from './data';
import { GEOGRAPHY_STAGES } from './stages';

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

// Module-level so the rotation persists across stages within a session (not just one stage).
const pickCountries = createRotationPicker<Country>((c) => c.name);

function pickDistractorCapitals(pool: Country[], correct: Country, count: number): string[] {
  const values = new Set<string>();
  const shuffled = shuffle(pool.filter((c) => c.name !== correct.name));
  for (const c of shuffled) {
    if (c.capital !== correct.capital) values.add(c.capital);
    if (values.size >= count) break;
  }
  return Array.from(values);
}

function buildQuestion(pool: Country[], country: Country): QuizQuestion {
  const distractors = pickDistractorCapitals(pool, country, 3);
  const choices = shuffle([country.capital, ...distractors]);
  return {
    prompt: (
      <span>
        What is the capital of {country.flag} {country.name}?
      </span>
    ),
    choices,
    correctIndex: choices.indexOf(country.capital),
  };
}

export default function GeographyGame({ stage, onFinish }: GameComponentProps) {
  const config = GEOGRAPHY_STAGES[stage - 1];
  const questions = useMemo(() => {
    const pool = COUNTRIES.filter((c) => config.tiers.includes(c.tier));
    const selected = pickCountries(pool, config.questions);
    return selected.map((country) => buildQuestion(pool, country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return <QuizGame questions={questions} timePerQuestion={config.timePerQuestion} onFinish={onFinish} />;
}
