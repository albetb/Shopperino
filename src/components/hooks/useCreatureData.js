import { useSyncExternalStore } from 'react';
import { isCreatureDataReady, subscribeCreatureData } from '../../lib/loadFile';

/**
 * Whether the lazily-loaded creature files are in place.
 *
 * The bestiary ships as its own chunk (see loadFile.js), so anything that
 * renders creature data has to redraw when it lands. Call this in such a
 * component and feed the result into any `useMemo` that reads the data —
 * without it the memo caches the empty list it saw on first render.
 */
export default function useCreatureData() {
  return useSyncExternalStore(subscribeCreatureData, isCreatureDataReady, isCreatureDataReady);
}
