import { beforeEach, describe, expect, it } from 'vitest';
import { check, make } from '../src/lib/playcode';
import { getGate, isLocked, redeem, spendSeconds, updateGate } from '../src/lib/playgate';

const DAY = '2026-11-18';

describe('play codes', () => {
  it('matches the code the learning sites make', () => {
    // made by js/playcode.js on Viraj's Math Quest for p1, 15 minutes, nonce 42, on 2026-11-18
    expect(make('p1', 15, 42, DAY)).toBe('12N5YT');
    expect(check('12n-5yt', DAY)).toEqual({ ok: true, player: 'p1', minutes: 15, code: '12N5YT' });
  });

  it('only works on the day it was made', () => {
    expect(check('12N-5YT', '2026-11-19').ok).toBe(false);
  });

  it('round-trips every kid and length', () => {
    for (const p of ['p1', 'p2'])
      for (const m of [5, 10, 30, 60, 80]) {
        const r = check(make(p, m, 7, DAY), DAY);
        expect(r).toMatchObject({ ok: true, player: p, minutes: m });
      }
  });
});

describe('coin gate', () => {
  beforeEach(() => window.localStorage.clear());

  it('starts on and locked, with no play time', () => {
    expect(getGate().enabled).toBe(true);
    expect(isLocked(getGate())).toBe(true);
  });

  it('adds play time for a good code and refuses it a second time', () => {
    const r = redeem('12N-5YT', DAY);
    expect(r).toMatchObject({ ok: true, name: 'Viraj', minutes: 15 });
    expect(getGate().bankSeconds).toBe(900);
    expect(isLocked(getGate())).toBe(false);
    expect(redeem('12N5YT', DAY).ok).toBe(false);
    expect(getGate().bankSeconds).toBe(900);
  });

  it('counts play time down and locks again at zero', () => {
    updateGate((s) => ({ ...s, bankSeconds: 2 }));
    spendSeconds(1);
    spendSeconds(1);
    spendSeconds(1);
    expect(getGate().bankSeconds).toBe(0);
    expect(isLocked(getGate())).toBe(true);
  });

  it('is open when a parent turns it off or unlocks it for a while', () => {
    updateGate((s) => ({ ...s, enabled: false }));
    expect(isLocked(getGate())).toBe(false);
    updateGate((s) => ({ ...s, enabled: true, freeUntil: Date.now() + 60000 }));
    expect(isLocked(getGate())).toBe(false);
    spendSeconds(5); // free play doesn't use up play time
    expect(getGate().bankSeconds).toBe(0);
    expect(isLocked(getGate(), Date.now() + 120000)).toBe(true);
  });
});
