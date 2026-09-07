import { Suspense, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGameMeta } from '../lib/games';
import { recordStageCompletion } from '../lib/progress';
import { GameId, TOTAL_STAGES } from '../lib/types';
import { GAME_COMPONENTS } from '../lib/registry';
import GameShell from './GameShell';
import ResultModal from './ResultModal';
import NotFound from './NotFound';

export default function StagePlayPage() {
  const { gameId, stage: stageParam } = useParams<{ gameId: string; stage: string }>();
  const navigate = useNavigate();
  const game = getGameMeta(gameId ?? '');
  const stage = Number(stageParam);
  const [result, setResult] = useState<{ passed: boolean; stars: 0 | 1 | 2 | 3; score: number } | null>(null);
  const [playKey, setPlayKey] = useState(0);

  if (!game || !Number.isInteger(stage) || stage < 1 || stage > TOTAL_STAGES) {
    return <NotFound />;
  }

  const GameComponent = GAME_COMPONENTS[game.id as GameId];

  function handleFinish(res: { passed: boolean; stars: 0 | 1 | 2 | 3; score: number }) {
    recordStageCompletion(game!.id, { stage, ...res });
    setResult(res);
  }

  function retry() {
    setResult(null);
    setPlayKey((k) => k + 1);
  }

  function goToStage(nextStage: number) {
    setResult(null);
    navigate(`/${game!.id}/stage/${nextStage}`);
  }

  return (
    <GameShell game={game} stage={stage}>
      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-slate-500">Loading game…</div>
          }
        >
          <GameComponent key={playKey} stage={stage} onFinish={handleFinish} />
        </Suspense>
      </div>
      {result && (
        <ResultModal
          passed={result.passed}
          stars={result.stars}
          score={result.score}
          isLastStage={stage === TOTAL_STAGES}
          onRetry={retry}
          onNextStage={() => goToStage(stage + 1)}
          onStageSelect={() => navigate(`/${game.id}`)}
        />
      )}
    </GameShell>
  );
}
