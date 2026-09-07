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
    <div className="grid grid-cols-8 w-[22rem] h-[22rem] sm:w-[30rem] sm:h-[30rem] lg:w-[36rem] lg:h-[36rem] rounded-lg overflow-hidden border border-slate-700 shadow-lg">
      {rows.map((row, r) =>
        row.map((cell, c) => {
          const dark = (r + c) % 2 === 1;
          const labelColor = dark ? 'text-slate-300' : 'text-slate-600';
          return (
            <div
              key={`${r}-${c}`}
              className={`relative flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl ${
                dark ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            >
              {c === 0 && (
                <span className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold ${labelColor}`}>
                  {8 - r}
                </span>
              )}
              {r === 7 && (
                <span className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold ${labelColor}`}>
                  {String.fromCharCode(97 + c)}
                </span>
              )}
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
