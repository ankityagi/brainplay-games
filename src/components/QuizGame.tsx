import { ReactNode, useEffect, useMemo, useState } from 'react';
import { PASS_THRESHOLD, passedFraction, starsForFraction } from '../lib/scoring';

export interface QuizQuestion {
  prompt: ReactNode;
  choices: string[];
  correctIndex: number;
}

interface QuizGameProps {
  questions: QuizQuestion[];
  timePerQuestion?: number;
  onFinish: (result: { passed: boolean; stars: 0 | 1 | 2 | 3; score: number }) => void;
  scoreSuffix?: string;
}

type Feedback = 'correct' | 'wrong' | 'timeout' | null;

export default function QuizGame({ questions, timePerQuestion, onFinish, scoreSuffix = '' }: QuizGameProps) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion ?? 0);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  const advance = (wasCorrect: boolean) => {
    setTimeout(() => {
      if (isLast) {
        const finalCorrect = correctCount + (wasCorrect ? 1 : 0);
        const fraction = finalCorrect / questions.length;
        onFinish({
          passed: passedFraction(fraction),
          stars: starsForFraction(fraction),
          score: finalCorrect,
        });
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
        setFeedback(null);
        setTimeLeft(timePerQuestion ?? 0);
      }
    }, 550);
  };

  function choose(choiceIndex: number) {
    if (selected !== null) return;
    const correct = choiceIndex === question.correctIndex;
    setSelected(choiceIndex);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setCorrectCount((c) => c + 1);
    advance(correct);
  }

  useEffect(() => {
    if (!timePerQuestion || selected !== null) return;
    if (timeLeft <= 0) {
      setSelected(-1);
      setFeedback('timeout');
      advance(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, selected, timePerQuestion]);

  const progressPct = useMemo(() => (index / questions.length) * 100, [index, questions.length]);

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 gap-6">
      <div>
        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between text-sm text-slate-500 mt-1.5">
          <span>
            Question {index + 1} / {questions.length}
          </span>
          <span>
            {correctCount} correct{scoreSuffix}
          </span>
        </div>
      </div>

      {timePerQuestion ? (
        <div className="self-end text-base font-mono text-slate-400">⏱ {timeLeft}s</div>
      ) : null}

      <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center">
        <div className="text-4xl sm:text-5xl font-bold">{question.prompt}</div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
          {question.choices.map((choice, i) => {
            let style = 'bg-slate-800 hover:bg-slate-700 border-slate-700';
            if (selected !== null) {
              if (i === question.correctIndex) {
                style = 'bg-emerald-600 border-emerald-500';
              } else if (i === selected) {
                style = 'bg-rose-600 border-rose-500';
              } else {
                style = 'bg-slate-800 border-slate-700 opacity-50';
              }
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={selected !== null}
                className={`rounded-xl border py-6 px-5 font-semibold text-2xl transition-colors ${style}`}
              >
                {choice}
              </button>
            );
          })}
        </div>
        {feedback === 'timeout' && <p className="text-rose-400 text-base">Time&apos;s up!</p>}
      </div>
      <p className="text-center text-sm text-slate-600">Pass with {Math.round(PASS_THRESHOLD * 100)}%+ correct</p>
    </div>
  );
}
