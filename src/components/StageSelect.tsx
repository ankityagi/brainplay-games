import { Link } from 'react-router-dom';
import { GameId, GameProgress, TOTAL_STAGES } from '../lib/types';
import Stars from './Stars';

interface StageSelectProps {
  gameId: GameId;
  progress: GameProgress;
}

export default function StageSelect({ gameId, progress }: StageSelectProps) {
  const stages = Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {stages.map((stage) => {
        const unlocked = stage <= progress.unlockedStage;
        const record = progress.stages[stage];
        return unlocked ? (
          <Link
            key={stage}
            to={`/${gameId}/stage/${stage}`}
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 py-7"
          >
            <span className="text-2xl font-bold">{stage}</span>
            {record ? <Stars count={record.stars} /> : <span className="text-sm text-slate-500">New</span>}
          </Link>
        ) : (
          <div
            key={stage}
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 py-7 opacity-50 cursor-not-allowed"
            aria-disabled
          >
            <span className="text-2xl font-bold">🔒</span>
            <span className="text-sm text-slate-500">Stage {stage}</span>
          </div>
        );
      })}
    </div>
  );
}
