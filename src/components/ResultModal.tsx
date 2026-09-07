import Stars from './Stars';

interface ResultModalProps {
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  score: number;
  scoreLabel?: string;
  isLastStage: boolean;
  onRetry: () => void;
  onNextStage: () => void;
  onStageSelect: () => void;
}

export default function ResultModal({
  passed,
  stars,
  score,
  scoreLabel = 'Score',
  isLastStage,
  onRetry,
  onNextStage,
  onStageSelect,
}: ResultModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-2">{passed ? (isLastStage ? '🏆' : '🎉') : '💪'}</div>
        <h2 className="text-2xl font-bold mb-1">
          {passed ? (isLastStage ? 'All stages complete!' : 'Stage complete!') : 'Not quite'}
        </h2>
        <p className="text-slate-400 mb-4">
          {scoreLabel}: <span className="text-slate-100 font-semibold">{score}</span>
        </p>
        {passed && (
          <div className="mb-4">
            <Stars count={stars} size="lg" />
          </div>
        )}
        <div className="flex flex-col gap-2 mt-2">
          {passed && !isLastStage && (
            <button
              onClick={onNextStage}
              className="bg-brand-600 hover:bg-brand-500 transition-colors rounded-lg py-2 font-semibold"
            >
              Next stage →
            </button>
          )}
          {!passed && (
            <button
              onClick={onRetry}
              className="bg-brand-600 hover:bg-brand-500 transition-colors rounded-lg py-2 font-semibold"
            >
              Try again
            </button>
          )}
          <button
            onClick={onStageSelect}
            className="bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg py-2 font-medium"
          >
            All stages
          </button>
        </div>
      </div>
    </div>
  );
}
