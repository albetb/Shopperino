import { ALL_SOURCES_MASK, normalizeSourceMask, listChallengeRatings } from './monsterBook';

/**
 * The monster book's filter selection, and its compact storage form.
 *
 * Kept apart from monsterBook.js so storage.js can read the tuple without
 * pulling the whole bestiary loader in with it.
 */

/** The filters as they start: everything included, nothing narrowed. */
export function getDefaultFilters() {
  const crs = listChallengeRatings();
  return {
    sourceMask: ALL_SOURCES_MASK,
    name: '',
    type: '',
    size: '',
    terrain: '',
    crMin: crs.length ? crs[0] : 0,
    crMax: crs.length ? crs[crs.length - 1] : 0,
  };
}

/** Compact tuple: `[srcMask, name, type, size, terrain, crMin, crMax]`. */
export function filtersToTuple(filters) {
  const f = { ...getDefaultFilters(), ...(filters || {}) };
  return [f.sourceMask, f.name, f.type, f.size, f.terrain, f.crMin, f.crMax];
}

/** Rebuild filters from a stored tuple, falling back to the defaults. */
export function filtersFromTuple(tuple) {
  const defaults = getDefaultFilters();
  if (!Array.isArray(tuple) || tuple.length < 7) return defaults;
  const [sourceMask, name, type, size, terrain, crMin, crMax] = tuple;
  const min = Number(crMin);
  const max = Number(crMax);
  return {
    sourceMask: normalizeSourceMask(sourceMask),
    name: typeof name === 'string' ? name : '',
    type: typeof type === 'string' ? type : '',
    size: typeof size === 'string' ? size : '',
    terrain: typeof terrain === 'string' ? terrain : '',
    crMin: Number.isFinite(min) ? min : defaults.crMin,
    crMax: Number.isFinite(max) ? max : defaults.crMax,
  };
}
