import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="text-5xl">🤔</div>
      <h1 className="text-xl font-bold">We couldn&apos;t find that page</h1>
      <Link to="/" className="text-brand-400 hover:text-brand-300 font-medium">
        ← Back to all games
      </Link>
    </div>
  );
}
