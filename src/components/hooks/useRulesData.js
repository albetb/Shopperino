import { useSyncExternalStore } from 'react';
import { isRulesDataReady, subscribeRulesData } from '../../lib/loadFile';

/**
 * Whether the lazily-loaded rule notes are in place.
 *
 * `rules.json` is its own chunk — 123 kB gzipped of prose that only the rules
 * tab reads, plus as much again in Italian — so a component that renders it
 * has to redraw when the chunk lands. Same shape and the same reason as
 * `useCreatureData`: without it, a `useMemo` caches the empty topic list it
 * saw on the first render and the page stays blank.
 */
export default function useRulesData() {
  return useSyncExternalStore(subscribeRulesData, isRulesDataReady, isRulesDataReady);
}
