import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isFreeNow, isLocked, spendSeconds } from '../lib/playgate';
import { useGate } from '../lib/useGate';
import CodeEntry from './CodeEntry';

const LEARN_SITES = [
  { name: "Viraj's Math Quest", href: 'https://viraj.ankityagi.online/#coins' },
  { name: "Vihaan's Quest", href: 'https://vihaan.ankityagi.online/#coins' },
];

/**
 * Wraps a Play game. With no play time left it shows the code box instead of the game;
 * otherwise it shows the game and takes a second off the play time for every second the
 * game is on screen. Works offline.
 */
export default function PlayGate({ children }: { children: ReactNode }) {
  const gate = useGate();
  const locked = isLocked(gate);
  const free = isFreeNow(gate);

  useEffect(() => {
    if (locked || free) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') spendSeconds(1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [locked, free]);

  if (!locked) return <>{children}</>;
  return <GateScreen />;
}

export function GateScreen() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full flex flex-col items-center gap-5 text-center">
        <div className="text-6xl" aria-hidden="true">
          🪙
        </div>
        <h1 className="text-3xl font-bold">Play time needed</h1>
        <p className="text-slate-400 text-lg">
          Earn coins on your learning site, trade them for a code, and type it here. Learn games are always free.
        </p>
        <CodeEntry autoFocus />
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          {LEARN_SITES.map((s) => (
            <a key={s.href} href={s.href} className="text-sky-400 hover:text-sky-300 font-semibold">
              {s.name} →
            </a>
          ))}
        </div>
        <Link to="/parent" className="text-xs text-slate-600 hover:text-slate-400">
          Parent
        </Link>
      </div>
    </div>
  );
}
