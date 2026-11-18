import { act } from 'react-dom/test-utils';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { make, today } from '../src/lib/playcode';
import { getGate } from '../src/lib/playgate';

let host: HTMLDivElement;
function render(path: string) {
  host = document.createElement('div');
  document.body.appendChild(host);
  act(() => {
    createRoot(host).render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  });
}
function typeAndSubmit(input: HTMLInputElement, value: string) {
  act(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => {
    input.form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

describe('coin gate screens', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => host.remove());

  it('shows the code box on a Play game, then the game after a good code', () => {
    render('/racing');
    expect(host.textContent).toContain('Play time needed');
    expect(host.querySelector('iframe')).toBeNull();
    typeAndSubmit(host.querySelector('#play-code')!, make('p2', 20, 3, today()));
    expect(host.querySelector('iframe')).not.toBeNull();
    expect(host.textContent).toContain('20:00 left');
  });

  it('keeps Learn games free', () => {
    render('/math/stage/1');
    expect(host.textContent).not.toContain('Play time needed');
  });

  it('parent page sets a PIN and turns the gate off', () => {
    render('/parent');
    const [a, b] = Array.from(host.querySelectorAll('input')) as HTMLInputElement[];
    act(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      set.call(a, '2468');
      a.dispatchEvent(new Event('input', { bubbles: true }));
      set.call(b, '2468');
      b.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      a.form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(host.textContent).toContain('Coin gate');
    const off = Array.from(host.querySelectorAll('button')).find((x) => x.textContent === 'Gate off')!;
    act(() => off.click());
    expect(getGate().enabled).toBe(false);
  });
});
