import { useSyncExternalStore } from 'react';
import { isProseReady, subscribeProse } from '../../lib/i18n/prose';

/**
 * Whether the current language's translated descriptions are in place.
 *
 * The prose packs ship as one chunk per language (see i18n/prose.js), so a
 * component showing a translated description has to redraw when the chunk
 * lands. App.jsx calls this once and feeds the result into its key, which
 * remounts the tree — so nothing else needs to call it.
 *
 * Always true for English, which has no chunk and never fetches one.
 */
export default function useProse() {
  return useSyncExternalStore(subscribeProse, isProseReady, isProseReady);
}
