import { useEffect, useState } from 'react';

/**
 * A value that settles a little after the one it follows.
 *
 * For a search box over a list big enough that scanning it on every keystroke
 * is felt. Typing "counterspell" is twelve renders and twelve scans, eleven of
 * which nobody ever reads — the results for "c", "co", "cou" are on screen for
 * a few milliseconds each and are thrown away.
 *
 * The input itself stays uncontrolled by this: the box shows what was typed
 * immediately, and only the work hanging off the value waits. A debounce that
 * delays the caret is worse than no debounce at all.
 *
 * @param {*} value - the value to follow.
 * @param {number} [delay] - milliseconds of quiet before it settles.
 */
export default function useDebounced(value, delay = 200) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return settled;
}
