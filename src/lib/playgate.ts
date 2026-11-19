/* Coin gate: Play games need play time, bought with codes from the kids' learning sites.

   Everything lives in this browser's localStorage, so it works with no internet (on a flight):
   checking a code, the play-time bank, the parent PIN and the parent's unlock.
   Learn games are never gated. */
import { check as checkCode, clean, today, _sha256 } from './playcode';

const KEY = 'brainplay:gate';

export const KIDS: Record<string, string> = { p1: 'Viraj', p2: 'Vihaan', p3: 'Player 3', p4: 'Player 4' };

export interface UsedCode {
  code: string;
  day: string;
  player: string;
  minutes: number;
  at: string;
}

export interface GateState {
  /** Coin gate on: Play games need play time. Off: everything is free. */
  enabled: boolean;
  /** Play time left, in seconds. Counts down only while a Play game is open on screen. */
  bankSeconds: number;
  /** Parent unlock: everything is free until this time (ms), or null. */
  freeUntil: number | null;
  /** Hash of the parent PIN, set on first visit to the parent page. */
  pinHash: string | null;
  usedCodes: UsedCode[];
}

const DEFAULT: GateState = { enabled: true, bankSeconds: 0, freeUntil: null, pinHash: null, usedCodes: [] };

export function getGate(): GateState {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Partial<GateState> | null;
    if (!raw || typeof raw !== 'object') return { ...DEFAULT };
    return {
      enabled: raw.enabled !== false,
      bankSeconds: Math.max(0, Math.floor(Number(raw.bankSeconds) || 0)),
      freeUntil: typeof raw.freeUntil === 'number' ? raw.freeUntil : null,
      pinHash: typeof raw.pinHash === 'string' ? raw.pinHash : null,
      usedCodes: Array.isArray(raw.usedCodes) ? raw.usedCodes.slice(-200) : [],
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveGate(s: GateState): GateState {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: the gate still works for this visit */
  }
  window.dispatchEvent(new Event('brainplay:gate'));
  return s;
}

export function updateGate(fn: (s: GateState) => GateState): GateState {
  return saveGate(fn(getGate()));
}

export const isFreeNow = (s: GateState, now = Date.now()): boolean =>
  !s.enabled || (s.freeUntil !== null && s.freeUntil > now);

export const isLocked = (s: GateState, now = Date.now()): boolean => !isFreeNow(s, now) && s.bankSeconds <= 0;

/**
 * Parent code: works every time, any day, with no internet. Typed into the same code box,
 * it opens every game for PARENT_FREE_MINUTES (adding to any free play already running).
 * It sits in the page code, so it keeps young kids out but isn't real security.
 */
export const PARENT_CODE = '2451Q1';
export const PARENT_FREE_MINUTES = 60;

export type RedeemResult =
  | { ok: true; parent?: false; player: string; name: string; minutes: number }
  | { ok: true; parent: true; until: number }
  | { ok: false; reason: string };

/** Check a code and, if it's good and unused, add its minutes to the bank. */
export function redeem(text: string, day: string = today()): RedeemResult {
  if (clean(text) === PARENT_CODE) {
    const s = updateGate((g) => ({ ...g, freeUntil: Math.max(Date.now(), g.freeUntil ?? 0) + PARENT_FREE_MINUTES * 60000 }));
    return { ok: true, parent: true, until: s.freeUntil! };
  }
  const r = checkCode(text, day);
  if (!r.ok) return r;
  const s = getGate();
  if (s.usedCodes.some((u) => u.code === r.code && u.day === day)) {
    return { ok: false, reason: 'That code was already used. Each code works once.' };
  }
  saveGate({
    ...s,
    bankSeconds: s.bankSeconds + r.minutes * 60,
    usedCodes: [...s.usedCodes, { code: r.code, day, player: r.player, minutes: r.minutes, at: new Date().toISOString() }],
  });
  return { ok: true, player: r.player, name: KIDS[r.player] ?? r.player, minutes: r.minutes };
}

/** Take seconds off the bank (called once a second while a Play game is on screen). */
export function spendSeconds(n: number): GateState {
  return updateGate((s) => (isFreeNow(s) ? s : { ...s, bankSeconds: Math.max(0, s.bankSeconds - n) }));
}

export const hashPin = (pin: string): string =>
  Array.from(_sha256(new TextEncoder().encode('bp-pin:' + pin)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`;
}
