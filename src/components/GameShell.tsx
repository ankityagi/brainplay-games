import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { GameMeta } from '../lib/types';

interface GameShellProps {
  game: GameMeta;
  stage?: number;
  totalStages?: number;
  children: ReactNode;
}

export default function GameShell({ game, stage, totalStages = 10, children }: GameShellProps) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-slate-400 hover:text-slate-100 text-sm font-medium transition-colors"
            aria-label="Back to all games"
          >
            ← Home
          </Link>
          <span className="text-slate-700">/</span>
          <Link to={`/${game.id}`} className="flex items-center gap-2 hover:text-slate-100 transition-colors">
            <span className="text-xl leading-none">{game.emoji}</span>
            <span className="font-semibold">{game.title}</span>
          </Link>
        </div>
        {stage ? (
          <div className="text-sm font-medium text-slate-300 bg-slate-800 rounded-full px-3 py-1">
            Stage {stage} / {totalStages}
          </div>
        ) : null}
      </header>
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
