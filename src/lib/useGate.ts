import { useEffect, useState } from 'react';
import { GateState, getGate } from './playgate';

/** The coin gate's current state, kept fresh when it changes here or in another tab. */
export function useGate(): GateState {
  const [gate, setGate] = useState(getGate);
  useEffect(() => {
    const refresh = () => setGate(getGate());
    window.addEventListener('brainplay:gate', refresh);
    window.addEventListener('storage', refresh);
    // a parent unlock ends on its own, so look again every few seconds
    const t = window.setInterval(refresh, 5000);
    return () => {
      window.removeEventListener('brainplay:gate', refresh);
      window.removeEventListener('storage', refresh);
      window.clearInterval(t);
    };
  }, []);
  return gate;
}
