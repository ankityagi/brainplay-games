import { useEffect, useMemo, useState } from 'react';
import { GameComponentProps } from '../../lib/types';
import { createRotationPicker } from '../../lib/rotation';
import { passedFraction, starsForFraction, PASS_THRESHOLD } from '../../lib/scoring';
import { MAP_COUNTRIES, MapCountry } from './countries';
import { MAP_STAGES } from './stages';
import { MAP_HEIGHT, MAP_WIDTH, WORLD_FEATURES } from './worldGeo';

// Module-level so the rotation persists across stages within a session (not just one stage).
const pickTargets = createRotationPicker<MapCountry>((c) => c.id, 'map-countries');

type Feedback = 'correct' | 'wrong' | 'timeout' | null;

export default function MapGame({ stage, onFinish }: GameComponentProps) {
  const config = MAP_STAGES[stage - 1];
  const targets = useMemo(() => {
    const pool = MAP_COUNTRIES.filter((c) => config.tiers.includes(c.tier));
    return pickTargets(pool, config.questions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [timeLeft, setTimeLeft] = useState(config.timePerQuestion);

  const target = targets[index];
  const isLast = index === targets.length - 1;

  function advance(wasCorrect: boolean) {
    setTimeout(() => {
      if (isLast) {
        const finalCorrect = correctCount + (wasCorrect ? 1 : 0);
        const fraction = finalCorrect / targets.length;
        onFinish({
          passed: passedFraction(fraction),
          stars: starsForFraction(fraction),
          score: finalCorrect,
        });
      } else {
        setIndex((i) => i + 1);
        setSelectedId(null);
        setFeedback(null);
        setTimeLeft(config.timePerQuestion);
      }
    }, 900);
  }

  function handleClick(id: string) {
    if (selectedId !== null || feedback !== null) return;
    const correct = id === target.id;
    setSelectedId(id);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setCorrectCount((c) => c + 1);
    advance(correct);
  }

  useEffect(() => {
    if (feedback !== null) return;
    if (timeLeft <= 0) {
      setFeedback('timeout');
      advance(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, feedback]);

  const progressPct = (index / targets.length) * 100;

  return (
    <div className="h-full flex flex-col items-center gap-3 px-4 py-3 overflow-hidden">
      <div className="shrink-0 w-full max-w-5xl">
        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between text-sm text-slate-500 mt-1.5">
          <span>
            Question {index + 1} / {targets.length}
          </span>
          <span>{correctCount} correct</span>
        </div>
      </div>

      <div className="shrink-0 text-center">
        <div className="text-2xl sm:text-3xl font-bold">Click on: {target.name}</div>
        {config.showHint && <div className="text-base text-slate-400 mt-1">Hint: {target.continent}</div>}
        <div className="text-base font-mono text-slate-400 mt-1">⏱ {timeLeft}s</div>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-5xl flex items-center justify-center">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full"
          role="img"
          aria-label="World map"
        >
          <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="fill-slate-950" />
          {WORLD_FEATURES.map((f) => {
            let cls = 'fill-slate-700 hover:fill-slate-600';
            if (feedback !== null) {
              if (f.id === target.id) {
                cls = 'fill-emerald-500';
              } else if (f.id === selectedId) {
                cls = 'fill-rose-500';
              } else {
                cls = 'fill-slate-800';
              }
            }
            return (
              <path
                key={f.id}
                d={f.d}
                onClick={() => handleClick(f.id)}
                className={`stroke-slate-950 stroke-[0.5] cursor-pointer transition-colors ${cls}`}
              />
            );
          })}
        </svg>
      </div>

      <p className="shrink-0 text-xs sm:text-sm text-slate-600">
        Pass with {Math.round(PASS_THRESHOLD * 100)}%+ correct
      </p>
    </div>
  );
}
