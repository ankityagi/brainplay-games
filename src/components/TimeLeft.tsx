import { formatTime, isFreeNow } from '../lib/playgate';
import { useGate } from '../lib/useGate';

/** Small pill with the play time left, for Play games. */
export default function TimeLeft() {
  const gate = useGate();
  if (!gate.enabled) return null;
  const free = isFreeNow(gate);
  const low = !free && gate.bankSeconds <= 120;
  return (
    <div
      className={`text-sm font-semibold rounded-full px-3 py-1 tabular-nums ${
        free ? 'bg-emerald-900/60 text-emerald-300' : low ? 'bg-rose-900/60 text-rose-200' : 'bg-slate-800 text-amber-300'
      }`}
      aria-live="polite"
    >
      {free ? 'Free play' : `⏱ ${formatTime(gate.bankSeconds)} left`}
    </div>
  );
}
