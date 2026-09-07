export type TemplateId = 'assign' | 'ifelse' | 'array' | 'forsum' | 'while' | 'nested' | 'func' | 'evensum' | 'strlen' | 'divcount';

export interface Snippet {
  code: string;
  answer: string;
  distractors: string[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function numericDistractors(answer: number, count = 3): string[] {
  const set = new Set<number>();
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.2) + 2);
  let guard = 0;
  while (set.size < count && guard < 60) {
    guard++;
    const candidate = answer + randInt(-spread, spread);
    if (candidate !== answer) set.add(candidate);
  }
  return Array.from(set).map(String);
}

function assignSnippet(): Snippet {
  const a = randInt(2, 20);
  const b = randInt(2, 20);
  const ops = ['+', '-', '*'] as const;
  const op = ops[randInt(0, ops.length - 1)];
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return {
    code: `let a = ${a};\nlet b = ${b};\nprint(a ${op} b);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function ifElseSnippet(): Snippet {
  const x = randInt(1, 30);
  const threshold = randInt(1, 30);
  const answer = x > threshold ? 'big' : 'small';
  return {
    code: `let x = ${x};\nif (x > ${threshold}) {\n  print("big");\n} else {\n  print("small");\n}`,
    answer,
    distractors: [answer === 'big' ? 'small' : 'big', 'undefined', 'error'],
  };
}

function arraySnippet(): Snippet {
  const arr = Array.from({ length: 4 }, () => randInt(1, 50));
  const idx = randInt(0, 3);
  const answer = arr[idx];
  return {
    code: `let arr = [${arr.join(', ')}];\nprint(arr[${idx}]);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function forSumSnippet(): Snippet {
  const n = randInt(3, 10);
  const answer = (n * (n + 1)) / 2;
  return {
    code: `let total = 0;\nfor (let i = 1; i <= ${n}; i++) {\n  total += i;\n}\nprint(total);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function whileSnippet(): Snippet {
  const n = randInt(10, 40);
  const step = randInt(2, 5);
  const answer = Math.ceil(n / step);
  return {
    code: `let count = 0;\nlet n = ${n};\nwhile (n > 0) {\n  n = n - ${step};\n  count++;\n}\nprint(count);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function nestedSnippet(): Snippet {
  const n = randInt(2, 6);
  const m = randInt(2, 6);
  const answer = n * m;
  return {
    code: `let total = 0;\nfor (let i = 1; i <= ${n}; i++) {\n  for (let j = 1; j <= ${m}; j++) {\n    total++;\n  }\n}\nprint(total);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function funcSnippet(): Snippet {
  const n = randInt(2, 9);
  const m = randInt(1, 10);
  const answer = n * n + m;
  return {
    code: `function square(x) {\n  return x * x;\n}\nprint(square(${n}) + ${m});`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function evenSumSnippet(): Snippet {
  const n = randInt(6, 20);
  let answer = 0;
  for (let i = 2; i <= n; i += 2) answer += i;
  return {
    code: `let total = 0;\nfor (let i = 1; i <= ${n}; i++) {\n  if (i % 2 === 0) {\n    total += i;\n  }\n}\nprint(total);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

const WORDS = ['hello', 'coding', 'brainplay', 'javascript', 'puzzle', 'variable', 'function', 'array'];

function strLenSnippet(): Snippet {
  const word = WORDS[randInt(0, WORDS.length - 1)];
  const answer = word.length;
  return {
    code: `let s = "${word}";\nprint(s.length);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

function divCountSnippet(): Snippet {
  const n = randInt(9, 30);
  const div = [3, 4, 5][randInt(0, 2)];
  const answer = Math.floor(n / div);
  return {
    code: `let count = 0;\nfor (let i = 1; i <= ${n}; i++) {\n  if (i % ${div} === 0) count++;\n}\nprint(count);`,
    answer: String(answer),
    distractors: numericDistractors(answer),
  };
}

const GENERATORS: Record<TemplateId, () => Snippet> = {
  assign: assignSnippet,
  ifelse: ifElseSnippet,
  array: arraySnippet,
  forsum: forSumSnippet,
  while: whileSnippet,
  nested: nestedSnippet,
  func: funcSnippet,
  evensum: evenSumSnippet,
  strlen: strLenSnippet,
  divcount: divCountSnippet,
};

export function generateSnippet(id: TemplateId): Snippet {
  return GENERATORS[id]();
}
