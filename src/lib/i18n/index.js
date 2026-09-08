/**
 * i18n — the Italian name of a thing whose English name is its identity.
 *
 * The app is Italian. Most of its words are simply written in Italian where
 * they live: a label in a component, a description in `src/data`. Those need
 * nothing from this file.
 *
 * **Names are the exception, and this is the whole reason the module exists.**
 * An English name in `src/data` is rarely just a name — it is also the key
 * everything else is hung on:
 *
 * - `tables.json` keys its conditions by name, and `Player.conditions` stores
 *   that name into the save. Translating the key renames every condition on
 *   every character already rolled.
 * - `conditionSlug('Flat-Footed')` builds the `#flat-footed` anchor the info
 *   sidebar opens. The slug is the English name, lowercased.
 * - `player.js` asks `HP_DERIVED_CONDITIONS.has(cond.name)`, `shop.js` matches
 *   a saved item by `r.Name === savedName`, `proficiency.js` reads a weapon's
 *   `Category` with `startsWith('martial')`. All of it is English text used as
 *   an enum.
 *
 * So the English name stays exactly where it is, and the Italian one is looked
 * up here, once, at the point of display. It is the same shape the units
 * feature already uses: the model keeps the canonical value, and the edge
 * decides what the reader sees. A character rolled before the translation
 * keeps working, because nothing it stored ever changed.
 *
 * Prose is *not* here. A description is read, never matched, so it is
 * translated in place in `src/data` — one source of truth, and no second copy
 * of 1.6 MB of English riding along in the bundle for nothing.
 */

import names from '../../data/it/names.json';

/**
 * The Italian name for one English name, within a domain.
 *
 * Falls back to the English when there is no entry yet, so a half-finished
 * dictionary shows English words rather than blanks or `undefined` — the
 * translation can land a domain at a time.
 *
 * @param {string} domain - a top-level key of `src/data/it/names.json`
 *   ('conditions', 'abilities', …).
 * @param {string} en - the English name, exactly as it appears in the data.
 * @returns {string} the Italian name, or `en` when none is known.
 */
export function tName(domain, en) {
  if (typeof en !== 'string' || !en) return '';
  return names?.[domain]?.[en] ?? en;
}

/** Whether a domain has an entry for this name — for tests and tooling. */
export function hasName(domain, en) {
  return Boolean(names?.[domain] && Object.hasOwn(names[domain], en));
}

/** Every English name known for a domain. Used by the coverage checker. */
export function knownNames(domain) {
  return Object.keys(names?.[domain] ?? {});
}

export default tName;
