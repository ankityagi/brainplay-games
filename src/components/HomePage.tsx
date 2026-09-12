import { Link } from 'react-router-dom';
import { GAMES } from '../lib/games';
import { totalStarsEarned } from '../lib/progress';
import { GameCategory } from '../lib/types';

function GameGrid({ category }: { category: GameCategory }) {
  const games = GAMES.filter((g) => g.category === category);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {games.map((game) => {
        const stars = totalStarsEarned(game.id);
        return (
          <Link
            key={game.id}
            to={`/${game.id}`}
            className={`group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br ${game.accent} p-[1px] transition-transform hover:-translate-y-0.5`}
          >
            <div className="rounded-2xl bg-slate-950/90 p-6 h-full flex flex-col gap-3">
              <div className="text-5xl">{game.emoji}</div>
              <h3 className="text-xl font-bold">{game.title}</h3>
              <p className="text-base text-slate-400 flex-1">{game.tagline}</p>
              <div className="flex items-center justify-between text-sm text-slate-500 mt-2">
                <span>10 stages</span>
                {stars > 0 && <span className="text-amber-400">★ {stars}</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col gap-12">
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">🧠 BrainPlay</h1>
        <p className="text-slate-400 text-lg">
          Eight free games. No sign-up. Ten stages each, getting trickier as you climb.
        </p>
      </div>
      <section>
        <h2 className="text-base font-semibold uppercase tracking-wider text-slate-500 mb-4">Learn</h2>
        <GameGrid category="learn" />
      </section>
      <section>
        <h2 className="text-base font-semibold uppercase tracking-wider text-slate-500 mb-4">Play</h2>
        <GameGrid category="play" />
      </section>
      <p className="text-center text-sm text-slate-600">Progress is saved in this browser only.</p>
    </div>
  );
}
