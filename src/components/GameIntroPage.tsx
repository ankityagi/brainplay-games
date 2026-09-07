import { useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getGameMeta } from '../lib/games';
import { getProgress } from '../lib/progress';
import { GameId } from '../lib/types';
import GameShell from './GameShell';
import StageSelect from './StageSelect';
import NotFound from './NotFound';

export default function GameIntroPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = getGameMeta(gameId ?? '');
  const [progress] = useState(() => getProgress((gameId ?? '') as GameId));
  const stars = useMemo(() => Object.values(progress.stages).reduce((s, r) => s + r.stars, 0), [progress]);

  if (!game) return <NotFound />;

  return (
    <GameShell game={game}>
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{game.emoji}</div>
          <div>
            <h1 className="text-2xl font-bold">{game.title}</h1>
            <p className="text-slate-400">{game.tagline}</p>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          {stars > 0 ? `${stars} / 30 stars earned` : 'Play stage 1 to get started'}
        </div>
        <StageSelect gameId={game.id} progress={progress} />
      </div>
    </GameShell>
  );
}
