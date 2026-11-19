import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { KIDS, PARENT_CODE, PARENT_FREE_MINUTES, formatTime, getGate, hashPin, isFreeNow, updateGate } from '../lib/playgate';
import { useGate } from '../lib/useGate';

/**
 * Parent page for the coin gate: turn it on or off, unlock free play for a while, add or clear
 * play time, and see the codes used. Behind a PIN set on first visit. Everything is stored in
 * this browser, so it all works offline.
 */
export default function ParentPage() {
  const [unlocked, setUnlocked] = useState(false);
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-10 flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Parent settings</h1>
        <Link to="/" className="text-slate-400 hover:text-slate-100 text-sm font-medium">
          ← Games
        </Link>
      </div>
      {unlocked ? <Settings /> : <PinGate onOk={() => setUnlocked(true)} />}
    </div>
  );
}

function PinGate({ onOk }: { onOk: () => void }) {
  const setting = !getGate().pinHash;
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (setting) {
      if (!/^\d{4,8}$/.test(a)) return setErr('Use 4 to 8 digits.');
      if (a !== b) return setErr('The two PINs do not match.');
      updateGate((s) => ({ ...s, pinHash: hashPin(a) }));
      onOk();
    } else if (hashPin(a) === getGate().pinHash) {
      onOk();
    } else {
      setErr('That PIN is not right.');
      setA('');
    }
  }

  const field =
    'rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400';
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 max-w-xs">
      <p className="text-slate-400">
        {setting ? 'Choose a parent PIN of 4 to 8 digits for this device.' : 'Enter the parent PIN.'}
      </p>
      <label className="sr-only" htmlFor="pin-a">
        PIN
      </label>
      <input id="pin-a" type="password" inputMode="numeric" maxLength={8} autoFocus value={a} onChange={(e) => setA(e.target.value)} placeholder="PIN" className={field} />
      {setting && (
        <>
          <label className="sr-only" htmlFor="pin-b">
            Type it again
          </label>
          <input id="pin-b" type="password" inputMode="numeric" maxLength={8} value={b} onChange={(e) => setB(e.target.value)} placeholder="Type it again" className={field} />
        </>
      )}
      {err && <p className="text-rose-400">{err}</p>}
      <button type="submit" className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300">
        {setting ? 'Save PIN' : 'Unlock'}
      </button>
    </form>
  );
}

const btn = 'rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 font-semibold hover:bg-slate-800';
const btnOn = 'rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300';

function Settings() {
  const gate = useGate();
  const free = isFreeNow(gate);
  const freeTimed = gate.enabled && gate.freeUntil !== null && gate.freeUntil > Date.now();
  const unlockFor = (min: number) =>
    updateGate((s) => ({ ...s, freeUntil: Math.max(Date.now(), s.freeUntil ?? 0) + min * 60000 }));
  const recent = gate.usedCodes.slice().reverse().slice(0, 12);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3">
        <h2 className="text-xl font-bold">Coin gate</h2>
        <p className="text-slate-400">
          {gate.enabled
            ? 'On: Play games need play time from a code. Learn games are always free.'
            : 'Off: every game is free on this device.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={gate.enabled ? btnOn : btn} onClick={() => updateGate((s) => ({ ...s, enabled: true }))}>
            Gate on
          </button>
          <button type="button" className={!gate.enabled ? btnOn : btn} onClick={() => updateGate((s) => ({ ...s, enabled: false, freeUntil: null }))}>
            Gate off
          </button>
        </div>
      </section>

      {gate.enabled && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3">
          <h2 className="text-xl font-bold">Unlock for a while</h2>
          <p className="text-slate-400">
            {freeTimed
              ? `Free play until ${new Date(gate.freeUntil!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. The gate comes back on by itself.`
              : 'Every game is free for the time you pick, then the gate comes back on.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {[30, 60, 120, 240].map((m) => (
              <button key={m} type="button" className={btn} onClick={() => unlockFor(m)}>
                +{m >= 60 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} min`}
              </button>
            ))}
            {freeTimed && (
              <button type="button" className={btn} onClick={() => updateGate((s) => ({ ...s, freeUntil: null }))}>
                End now
              </button>
            )}
          </div>
        </section>
      )}

      {gate.enabled && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3">
          <h2 className="text-xl font-bold">Play time left</h2>
          <p className="text-3xl font-bold tabular-nums text-amber-300">
            {formatTime(gate.bankSeconds)}
            {free && <span className="ml-3 text-base font-semibold text-emerald-400">(not counting down during free play)</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {[10, 30, 60].map((m) => (
              <button key={m} type="button" className={btn} onClick={() => updateGate((s) => ({ ...s, bankSeconds: s.bankSeconds + m * 60 }))}>
                Add {m} min
              </button>
            ))}
            <button type="button" className={btn} onClick={() => updateGate((s) => ({ ...s, bankSeconds: 0 }))}>
              Clear
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-2">
        <h2 className="text-xl font-bold">Parent code</h2>
        <p className="text-slate-400">
          Type <span className="font-mono text-amber-300 text-lg">{PARENT_CODE.slice(0, 3)}-{PARENT_CODE.slice(3)}</span> into any code box to open every game for{' '}
          {PARENT_FREE_MINUTES} minutes. It works every time, on any day, with no internet.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3">
        <h2 className="text-xl font-bold">Codes used on this device</h2>
        {recent.length ? (
          <ul className="flex flex-col gap-1 text-slate-300">
            {recent.map((u) => (
              <li key={u.code + u.at} className="flex flex-wrap gap-x-3">
                <span className="font-mono">{u.code.slice(0, 3)}-{u.code.slice(3)}</span>
                <span>{KIDS[u.player] ?? u.player}</span>
                <span>{u.minutes} min</span>
                <span className="text-slate-500">{new Date(u.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No codes used yet.</p>
        )}
      </section>

      <p className="text-sm text-slate-500">
        Everything here is saved in this browser and works without internet. To change the PIN, clear it with{' '}
        <button type="button" className="text-sky-400 hover:text-sky-300" onClick={() => updateGate((s) => ({ ...s, pinHash: null }))}>
          Reset PIN
        </button>{' '}
        and set a new one on your next visit.
      </p>
    </div>
  );
}
