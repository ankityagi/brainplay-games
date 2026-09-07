export interface ChessPuzzle {
  fen: string;
  correct: string;
  distractors: string[];
  tier: 1 | 2 | 3 | 4;
}

export const CHESS_PUZZLES: ChessPuzzle[] = [
  {
    "fen": "6k1/8/7K/8/8/8/4Q3/8 w - - 0 1",
    "correct": "Qe8#",
    "distractors": [
      "Qd1",
      "Kh5",
      "Qb2"
    ],
    "tier": 1
  },
  {
    "fen": "8/k1K5/8/8/8/Q7/8/8 w - - 0 1",
    "correct": "Qa5#",
    "distractors": [
      "Qe7",
      "Qg3",
      "Kd8+"
    ],
    "tier": 1
  },
  {
    "fen": "7k/8/5K2/8/8/8/8/7Q w - - 0 1",
    "correct": "Kf7#",
    "distractors": [
      "Qb7",
      "Qh4+",
      "Qf1"
    ],
    "tier": 1
  },
  {
    "fen": "4QK1k/8/8/8/8/8/8/8 w - - 0 1",
    "correct": "Qh5#",
    "distractors": [
      "Qf7",
      "Kf7+",
      "Qc8"
    ],
    "tier": 1
  },
  {
    "fen": "3k4/8/4K3/8/5Q2/8/8/8 w - - 0 1",
    "correct": "Qb8#",
    "distractors": [
      "Qa4",
      "Qf7",
      "Qb4"
    ],
    "tier": 1
  },
  {
    "fen": "6k1/8/6K1/8/2Q5/8/8/8 w - - 0 1",
    "correct": "Qc8#",
    "distractors": [
      "Qb5",
      "Qe6+",
      "Qc6"
    ],
    "tier": 1
  },
  {
    "fen": "1k2Q3/8/2K5/8/8/8/8/8 w - - 0 1",
    "correct": "Kb6#",
    "distractors": [
      "Qxb8",
      "Qd7",
      "Kd6+"
    ],
    "tier": 1
  },
  {
    "fen": "2k5/8/3K4/8/2Q5/8/8/8 w - - 0 1",
    "correct": "Qc7#",
    "distractors": [
      "Kc5",
      "Qe2",
      "Qe4"
    ],
    "tier": 1
  },
  {
    "fen": "k1K5/8/8/1Q6/8/8/8/8 w - - 0 1",
    "correct": "Qa4#",
    "distractors": [
      "Qb1",
      "Qh5",
      "Qc4"
    ],
    "tier": 1
  },
  {
    "fen": "7k/8/6K1/8/8/7Q/8/8 w - - 0 1",
    "correct": "Qc8#",
    "distractors": [
      "Qxh8",
      "Qh1+",
      "Qe3"
    ],
    "tier": 1
  },
  {
    "fen": "k7/8/K7/8/1Q6/8/8/8 w - - 0 1",
    "correct": "Qb7#",
    "distractors": [
      "Qa3",
      "Qd2",
      "Qb8+"
    ],
    "tier": 1
  },
  {
    "fen": "2Q4k/8/5K2/8/8/8/8/8 w - - 0 1",
    "correct": "Kg6#",
    "distractors": [
      "Kg5+",
      "Qc2",
      "Ke6+"
    ],
    "tier": 1
  },
  {
    "fen": "1k6/8/1K6/8/8/8/8/4R3 w - - 0 1",
    "correct": "Re8#",
    "distractors": [
      "Rg1",
      "Re6",
      "Re2"
    ],
    "tier": 2
  },
  {
    "fen": "7k/5K2/8/1R6/8/8/8/8 w - - 0 1",
    "correct": "Rh5#",
    "distractors": [
      "Rc5",
      "Rb1",
      "Ke8"
    ],
    "tier": 2
  },
  {
    "fen": "3k4/8/3K4/8/8/8/1R6/8 w - - 0 1",
    "correct": "Rb8#",
    "distractors": [
      "Rb4",
      "Rb6",
      "Rh2"
    ],
    "tier": 2
  },
  {
    "fen": "8/5K1k/8/8/8/5R2/8/8 w - - 0 1",
    "correct": "Rh3#",
    "distractors": [
      "Rd3",
      "Rf4",
      "Kf6"
    ],
    "tier": 2
  },
  {
    "fen": "2R2k2/8/4K3/8/8/8/8/8 w - - 0 1",
    "correct": "Kf6#",
    "distractors": [
      "Kd7+",
      "Rc6",
      "Ke5+"
    ],
    "tier": 2
  },
  {
    "fen": "4k3/8/4K3/6R1/8/8/8/8 w - - 0 1",
    "correct": "Rg8#",
    "distractors": [
      "Rh5",
      "Rg1",
      "Kd5"
    ],
    "tier": 2
  },
  {
    "fen": "3k4/5R2/3K4/8/8/8/8/8 w - - 0 1",
    "correct": "Rf8#",
    "distractors": [
      "Rf2",
      "Kc5",
      "Ke5"
    ],
    "tier": 2
  },
  {
    "fen": "7k/8/3R2K1/8/8/8/8/8 w - - 0 1",
    "correct": "Rd8#",
    "distractors": [
      "Rd7",
      "Rd5",
      "Rd4"
    ],
    "tier": 2
  },
  {
    "fen": "k4R2/8/1K6/8/8/8/8/8 w - - 0 1",
    "correct": "Rc8#",
    "distractors": [
      "Rf2",
      "Rxa8",
      "Rf4"
    ],
    "tier": 2
  },
  {
    "fen": "2R4k/8/8/7K/8/8/8/8 w - - 0 1",
    "correct": "Kg6#",
    "distractors": [
      "Rg8+",
      "Kh4+",
      "Ra8+"
    ],
    "tier": 2
  },
  {
    "fen": "Q3k3/8/5K2/8/4p3/6p1/8/8 w - - 0 1",
    "correct": "Qc8#",
    "distractors": [
      "Qa5",
      "Qxe4+",
      "Ke5+"
    ],
    "tier": 3
  },
  {
    "fen": "Q6k/8/6K1/8/8/4p3/3p4/8 w - - 0 1",
    "correct": "Qf8#",
    "distractors": [
      "Qe4",
      "Qa3",
      "Qxh8"
    ],
    "tier": 3
  },
  {
    "fen": "3Q3k/7p/8/8/8/8/1p6/1K6 w - - 0 1",
    "correct": "Qf8#",
    "distractors": [
      "Qh4",
      "Qd2",
      "Qe7"
    ],
    "tier": 3
  },
  {
    "fen": "k2Q4/p7/8/8/K7/2p5/8/8 w - - 0 1",
    "correct": "Qc8#",
    "distractors": [
      "Qh8+",
      "Qe7",
      "Qd6"
    ],
    "tier": 3
  },
  {
    "fen": "7Q/2p2K1k/8/8/8/1p6/8/8 w - - 0 1",
    "correct": "Qg7#",
    "distractors": [
      "Qf6",
      "Qg8+",
      "Qc8"
    ],
    "tier": 3
  },
  {
    "fen": "5K1k/5p2/8/8/8/Q7/1p6/8 w - - 0 1",
    "correct": "Qh3#",
    "distractors": [
      "Qd3",
      "Kxf7",
      "Qf3"
    ],
    "tier": 3
  },
  {
    "fen": "2Q3k1/8/6K1/8/6p1/p7/8/8 w - - 0 1",
    "correct": "Qe8#",
    "distractors": [
      "Qxg4",
      "Kg5+",
      "Qe6+"
    ],
    "tier": 3
  },
  {
    "fen": "3k4/7Q/1p2K3/8/8/8/2p5/8 w - - 0 1",
    "correct": "Qd7#",
    "distractors": [
      "Qf7",
      "Kf7",
      "Qg8+"
    ],
    "tier": 3
  },
  {
    "fen": "k7/Q7/4p3/1K6/7p/8/8/8 w - - 0 1",
    "correct": "Kb6#",
    "distractors": [
      "Qa4+",
      "Qg1",
      "Qxa8"
    ],
    "tier": 3
  },
  {
    "fen": "8/kQ6/2K5/3p4/8/8/1p6/8 w - - 0 1",
    "correct": "Kc7#",
    "distractors": [
      "Kd7+",
      "Qe7+",
      "Kb5+"
    ],
    "tier": 3
  },
  {
    "fen": "2K5/k7/2p5/1p6/Q7/8/8/8 w - - 0 1",
    "correct": "Qa5#",
    "distractors": [
      "Qf4",
      "Kc7+",
      "Qd1"
    ],
    "tier": 3
  },
  {
    "fen": "k1K5/8/5p2/3p4/8/8/8/5Q2 w - - 0 1",
    "correct": "Qa1#",
    "distractors": [
      "Qf5",
      "Qb1",
      "Qe2"
    ],
    "tier": 3
  },
  {
    "fen": "k7/8/6p1/4K3/5R2/8/2p5/R7 w - - 0 1",
    "correct": "Rb4#",
    "distractors": [
      "Rh4+",
      "Ke4+",
      "Rf6+"
    ],
    "tier": 4
  },
  {
    "fen": "k7/5K2/8/5R2/5p2/8/1R1p4/8 w - - 0 1",
    "correct": "Ra5#",
    "distractors": [
      "Rg5",
      "Rfb5",
      "Rxf4"
    ],
    "tier": 4
  },
  {
    "fen": "K2R4/3k2R1/8/7p/3p4/8/8/8 w - - 0 1",
    "correct": "Rgxd7#",
    "distractors": [
      "Rg1+",
      "Ka7+",
      "Rdg8+"
    ],
    "tier": 4
  },
  {
    "fen": "1R2k3/8/8/3p3p/1K6/8/6R1/8 w - - 0 1",
    "correct": "Rg7#",
    "distractors": [
      "Ra8+",
      "Ka5+",
      "Kb3+"
    ],
    "tier": 4
  },
  {
    "fen": "k2RK3/8/8/1pp5/8/8/8/4R3 w - - 0 1",
    "correct": "Re7#",
    "distractors": [
      "Rb8+",
      "Rc1+",
      "Rd2"
    ],
    "tier": 4
  },
  {
    "fen": "k7/8/K7/8/2R5/7p/4R1p1/8 w - - 0 1",
    "correct": "Rc8#",
    "distractors": [
      "Ra2",
      "Rc3",
      "Rf2"
    ],
    "tier": 4
  },
  {
    "fen": "7k/6Rp/7R/8/8/8/6p1/K7 w - - 0 1",
    "correct": "Rhxh7#",
    "distractors": [
      "Rgg6",
      "Rg3",
      "Rb7"
    ],
    "tier": 4
  },
  {
    "fen": "5k2/1R4p1/2K5/8/7R/8/p7/8 w - - 0 1",
    "correct": "Rh8#",
    "distractors": [
      "Rb6",
      "Ra7",
      "Rf7+"
    ],
    "tier": 4
  },
  {
    "fen": "8/pk2RR2/5p2/K7/8/8/8/8 w - - 0 1",
    "correct": "Rxb7#",
    "distractors": [
      "Rh7+",
      "Re6+",
      "Re4+"
    ],
    "tier": 4
  },
  {
    "fen": "7k/8/2p1R2R/8/pK6/8/8/8 w - - 0 1",
    "correct": "Reg6#",
    "distractors": [
      "Re8+",
      "Rhf6",
      "Ref6+"
    ],
    "tier": 4
  }
];
