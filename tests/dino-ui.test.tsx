import { act } from 'react-dom/test-utils';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import DinoChaosGame from '../src/games/dino/DinoChaosGame';

let host: HTMLDivElement;
let root: Root;

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe() {}
    disconnect() {}
  };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function renderStage(stage: number) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<DinoChaosGame stage={stage} onFinish={() => {}} />));
}

describe('Dinosaur Chaos screen', () => {
  for (const stage of [1, 4, 10]) {
    it(`starts stage ${stage} as the Lizard and asks for 5 animals to grow`, () => {
      renderStage(stage);
      expect(host.textContent).toContain('🦎 Lizard');
      expect(host.querySelector('[data-testid="next-dino"]')!.textContent).toBe('Next dino: 0 / 5');
      expect(host.querySelector('[data-testid="stage-goal"]')!.textContent).toBe(`Eaten: 0 / ${stage * 5}`);
    });
  }
});
