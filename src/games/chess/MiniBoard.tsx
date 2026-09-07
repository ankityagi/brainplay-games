const PIECE_GLYPHS: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

function parsePlacement(fen: string): (string | null)[][] {
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');
  return rows.map((row) => {
    const cells: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) cells.push(null);
      } else {
        cells.push(ch);
      }
    }
    return cells;
  });
}

interface MiniBoardProps {
  fen: string;
}

export default function MiniBoard({ fen }: MiniBoardProps) {
  const rows = parsePlacement(fen);
  return (
    <div className="grid grid-cols-8 w-64 h-64 sm:w-80 sm:h-80 rounded-lg overflow-hidden border border-slate-700 shadow-lg">
      {rows.map((row, r) =>
        row.map((cell, c) => {
          const dark = (r + c) % 2 === 1;
          return (
            <div
              key={`${r}-${c}`}
              className={`flex items-center justify-center text-3xl sm:text-4xl ${
                dark ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            >
              {cell ? (
                <span className={/[A-Z]/.test(cell) ? 'text-white drop-shadow' : 'text-slate-950'}>
                  {PIECE_GLYPHS[cell]}
                </span>
              ) : null}
            </div>
          );
        }),
      )}
    </div>
  );
}
