import { act } from 'react-dom/test-utils';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Bugs only (no bigger dinos), so the test can eat its way up without being caught.
vi.mock('../src/games/dino/stages', async (orig) => {
  const real = await orig<typeof import('../src/games/dino/stages')>();
  return { ...real, DINO_STAGES: real.DINO_STAGES.map((s) => ({ ...s, npcCount: 0 })) };
});

import DinoChaosGame from '../src/games/dino/DinoChaosGame';

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
  };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function solve(prompt: string): number {
  const [a, op, b] = prompt.replace(' = ?', '').split(' ');
  const x = Number(a);
  const y = Number(b);
  return op === '+' ? x + y : op === '-' ? x - y : op === '×' ? x * y : x / y;
}

describe('Dinosaur Chaos play-through', () => {
  it('starts as the Lizard and grows into the next dino every 5 animals', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    // every bug spawns right on top of the player, so bumping into one is instant
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const finish = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(<DinoChaosGame stage={2} onFinish={finish} />));
    const you = () => host.textContent!.match(/You: \S+ ([A-Z][a-z-]+)/)![1];
    expect(you()).toBe('Lizard');

    act(() => (host.querySelector('button') as HTMLButtonElement).click()); // start
    const grew: string[] = [];
    for (let eaten = 0; eaten < 11; ) {
      act(() => vi.advanceTimersByTime(50));
      const prompt = Array.from(host.querySelectorAll('div')).find((d) => d.textContent?.endsWith(' = ?') && d.children.length === 0);
      if (!prompt) continue;
      const answer = String(solve(prompt.textContent!));
      const btn = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === answer)!;
      act(() => btn.click());
      act(() => vi.advanceTimersByTime(950));
      eaten++;
      const banner = host.querySelector('[data-testid="grew-banner"]');
      if (banner) grew.push(`${eaten}:${you()}`);
      act(() => vi.advanceTimersByTime(2100)); // banner hides, grace ends
    }
    expect(grew).toEqual(['5:Velociraptor', '10:Pachycephalosaurus']);
    expect(host.querySelector('[data-testid="next-dino"]')!.textContent).toBe('Next dino: 1 / 5');
    expect(host.querySelector('[data-testid="stage-goal"]')!.textContent).toBe('Eaten: 11 / 10');
    act(() => root.unmount());
  });
});
