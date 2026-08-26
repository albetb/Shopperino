import { useCallback, useEffect, useRef, useState } from 'react';

/** How long a change stays on screen before the readout goes back to hp/max. */
const FEEDBACK_DURATION_MS = 5000;

/**
 * The hit-point readout's "what just changed" state, shared by the player
 * sheet and the monster sheet so both report a change the same way.
 *
 * Changes inside the window accumulate: three taps of −1 read as −3 rather
 * than flashing −1 three times, and a heal after a hit nets out. The window
 * restarts on every change, and the total resets once it lapses.
 *
 * @returns {{feedback: {text: string, delta: number}|null, show: (delta: number) => void}}
 */
export default function useHpFeedback() {
  const [feedback, setFeedback] = useState(null);
  const totalRef = useRef(0);

  const show = useCallback((delta) => {
    const amount = Number(delta) || 0;
    if (amount === 0) return;
    totalRef.current += amount;
    const total = totalRef.current;
    setFeedback({ text: total >= 0 ? `+${total}` : `${total}`, delta: total });
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const t = setTimeout(() => {
      totalRef.current = 0;
      setFeedback(null);
    }, FEEDBACK_DURATION_MS);
    return () => clearTimeout(t);
  }, [feedback]);

  return { feedback, show };
}
