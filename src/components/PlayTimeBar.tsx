import { formatTime, isFreeNow } from '../lib/playgate';
import { useGate } from '../lib/useGate';
import CodeEntry from './CodeEntry';

/** Home-page strip: play time left for Play games, and the box for a new code. */
export default function PlayTimeBar() {
  const gate = useGate();
  if (!gate.enabled) return null;
  const free = isFreeNow(gate);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-end gap-5 justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="text-base font-semibold uppercase tracking-wider text-slate-500">Play time</h2>
        <p className="text-3xl font-bold tabular-nums text-amber-300">
          {free ? 'Free play' : gate.bankSeconds > 0 ? `${formatTime(gate.bankSeconds)} left` : 'None yet'}
        </p>
        <p className="text-slate-400">
          {free
            ? 'Every game is open right now.'
            : 'Play games use play time. Earn coins on your learning site and trade them for a code. Learn games are always free.'}
        </p>
      </div>
      {!free && <CodeEntry />}
    </section>
  );
}
