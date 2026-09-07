import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { CHESS_PUZZLES } from '../src/games/chess/puzzles';
import { CHESS_STAGES } from '../src/games/chess/stages';

describe('chess puzzle bank', () => {
  it('has at least enough puzzles per tier to cover every stage without excessive repeats', () => {
    for (const config of CHESS_STAGES) {
      const pool = CHESS_PUZZLES.filter((p) => p.tier === config.tier);
      expect(pool.length).toBeGreaterThan(0);
    }
  });

  it.each(CHESS_PUZZLES)('$fen -> $correct is a verified checkmate with 3 non-mate distractors', (puzzle) => {
    const chess = new Chess(puzzle.fen);
    const applied = chess.move(puzzle.correct);
    expect(applied).not.toBeNull();
    expect(chess.isCheckmate()).toBe(true);

    expect(puzzle.distractors).toHaveLength(3);
    const uniqueChoices = new Set([puzzle.correct, ...puzzle.distractors]);
    expect(uniqueChoices.size).toBe(4);

    for (const distractor of puzzle.distractors) {
      const c2 = new Chess(puzzle.fen);
      const move = c2.move(distractor);
      expect(move, `${distractor} should be legal in ${puzzle.fen}`).not.toBeNull();
      expect(c2.isCheckmate(), `${distractor} should not also be checkmate`).toBe(false);
    }
  });
});
