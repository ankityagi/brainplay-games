import { useMemo } from 'react';
import QuizGame, { QuizQuestion } from '../../components/QuizGame';
import { GameComponentProps } from '../../lib/types';
import { CHESS_PUZZLES } from './puzzles';
import { CHESS_STAGES } from './stages';
import MiniBoard from './MiniBoard';

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

function toQuestion(puzzle: (typeof CHESS_PUZZLES)[number]): QuizQuestion {
  const choices = shuffle([puzzle.correct, ...puzzle.distractors]);
  return {
    prompt: (
      <div className="flex flex-col items-center gap-4">
        <MiniBoard fen={puzzle.fen} />
        <span className="text-lg text-slate-400 font-normal">White to move. Which move is checkmate?</span>
      </div>
    ),
    choices,
    correctIndex: choices.indexOf(puzzle.correct),
  };
}

export default function ChessGame({ stage, onFinish }: GameComponentProps) {
  const config = CHESS_STAGES[stage - 1];
  const questions = useMemo(() => {
    const pool = shuffle(CHESS_PUZZLES.filter((p) => p.tier === config.tier));
    const selected = Array.from({ length: config.questions }, (_, i) => pool[i % pool.length]);
    return selected.map(toQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return <QuizGame questions={questions} timePerQuestion={config.timePerQuestion} onFinish={onFinish} />;
}
