import { FormEvent, useState } from 'react';
import { redeem } from '../lib/playgate';

/** Box where a kid types the play-time code from their learning site. */
export default function CodeEntry({ autoFocus = false }: { autoFocus?: boolean }) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const r = redeem(text);
    if (r.ok && r.parent) {
      const until = new Date(r.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setMsg({ ok: true, text: `Parent code: every game is open until ${until}.` });
      setText('');
    } else if (r.ok) {
      setMsg({ ok: true, text: `Nice, ${r.name}! +${r.minutes} minutes of play time.` });
      setText('');
    } else {
      setMsg({ ok: false, text: r.reason });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 w-full max-w-sm">
      <label htmlFor="play-code" className="text-sm font-semibold text-slate-300">
        Play-time code
      </label>
      <div className="flex gap-2">
        <input
          id="play-code"
          value={text}
          onChange={(e) => setText(e.target.value.toUpperCase())}
          placeholder="ABC-123"
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={9}
          className="min-w-0 flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 font-mono text-2xl tracking-widest uppercase text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button type="submit" className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300">
          Use code
        </button>
      </div>
      {msg && (
        <p role="status" className={msg.ok ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
