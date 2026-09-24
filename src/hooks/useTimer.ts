import { useEffect, useRef, useState } from 'react';

/**
 * Per-question countdown. Restarts whenever `resetKey` changes, freezes while
 * `running` is false, and calls `onExpire` once when it reaches zero.
 * A `seconds` value of 0 disables the timer entirely.
 */
export function useTimer(seconds: number, running: boolean, resetKey: unknown, onExpire: () => void) {
  const durationMs = seconds * 1000;
  const [remainingMs, setRemainingMs] = useState(durationMs);
  // Mirrors `remainingMs` so the countdown effect can resume from the latest value.
  const remainingRef = useRef(durationMs);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Declared before the countdown effect so a reset is applied before it restarts.
  useEffect(() => {
    remainingRef.current = durationMs;
    setRemainingMs(durationMs);
  }, [durationMs, resetKey]);

  useEffect(() => {
    const startRemaining = remainingRef.current;
    if (!running || durationMs === 0 || startRemaining <= 0) return;
    const startedAt = Date.now();

    const id = setInterval(() => {
      const next = Math.max(0, startRemaining - (Date.now() - startedAt));
      remainingRef.current = next;
      setRemainingMs(next);
      if (next === 0) {
        clearInterval(id);
        onExpireRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, durationMs, resetKey]);

  return {
    enabled: durationMs > 0,
    remainingMs,
    fraction: durationMs > 0 ? remainingMs / durationMs : 1,
  };
}
