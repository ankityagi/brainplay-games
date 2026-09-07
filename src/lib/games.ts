import { GameMeta } from './types';

export const GAMES: GameMeta[] = [
  {
    id: 'math',
    title: 'Math Blitz',
    tagline: 'Solve problems before time runs out',
    emoji: '🔢',
    category: 'learn',
    accent: 'from-sky-500 to-blue-600',
  },
  {
    id: 'geography',
    title: 'Geo Explorer',
    tagline: 'Flags, capitals and continents',
    emoji: '🌍',
    category: 'learn',
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'logic',
    title: 'Pattern Master',
    tagline: 'Spot the pattern, crack the sequence',
    emoji: '🧩',
    category: 'learn',
    accent: 'from-amber-500 to-orange-600',
  },
  {
    id: 'coding',
    title: 'Code Quest',
    tagline: 'Think like a programmer',
    emoji: '💻',
    category: 'learn',
    accent: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'chess',
    title: 'Chess Puzzles',
    tagline: 'Find the winning move',
    emoji: '♟️',
    category: 'play',
    accent: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'snake',
    title: 'Snake',
    tagline: 'The arcade classic, 10 levels deep',
    emoji: '🐍',
    category: 'play',
    accent: 'from-lime-500 to-green-600',
  },
];

export function getGameMeta(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}
