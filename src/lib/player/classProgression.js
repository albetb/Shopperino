/**
 * Per-class progression lookups.
 *
 * Source of truth: the `progression` block on each class in
 * src/data/classes.json, documented by obsidian-vault/dnd-rules/class-features.md.
 *
 * Three shapes live in that data:
 *  - Scalars — a value that never changes with level (Barbarian `fastMovement`).
 *  - Breakpoint lists — `[[level, value], ...]`, resolved as the value of the
 *    highest entry whose level is <= the character's level. Below the first
 *    breakpoint the feature is not yet gained, so the caller's fallback applies.
 *  - The string `"level"` — a value equal to the class level itself, used where
 *    the rules say "a number of times per day equal to her <class> level"
 *    (monk stunning fist, bardic music). Resolves to the level as a number.
 *
 * Single-level markers (`evasionLevel`, `divineGraceLevel`, …) are plain numbers
 * and are tested with `hasFeatureAtLevel`.
 *
 * Every accessor is total: an unknown class, a missing key or a malformed table
 * yields the fallback rather than throwing, so callers never need guards.
 */

import { loadFile } from '../loadFile';

const EMPTY = Object.freeze({});

/** Progression value meaning "equal to the class level". */
const LEVEL_SENTINEL = 'level';

/**
 * The raw progression block for a class.
 * @param {string} className
 * @returns {Object} the progression object, or an empty object when unknown.
 */
export function getClassProgression(className) {
  if (!className || typeof className !== 'string') return EMPTY;
  const classes = loadFile('classes');
  return classes?.[className]?.progression ?? EMPTY;
}

/**
 * Resolve a breakpoint list at a character level.
 * Picks the highest qualifying entry, so the table need not be sorted.
 * @param {Array<[number, *]>} table
 * @param {number} level
 * @param {*} [fallback=0] returned when the table is unusable or no entry applies yet.
 */
export function resolveAtLevel(table, level, fallback = 0) {
  if (!Array.isArray(table)) return fallback;
  const lvl = Number(level);
  if (!Number.isFinite(lvl)) return fallback;
  let bestLevel = -Infinity;
  let result = fallback;
  for (const entry of table) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const at = Number(entry[0]);
    if (!Number.isFinite(at)) continue;
    if (at <= lvl && at > bestLevel) {
      bestLevel = at;
      result = entry[1];
    }
  }
  return result;
}

/**
 * Value of a progression key at a level. Breakpoint lists are resolved, the
 * `"level"` sentinel becomes the level itself, and every other scalar passes
 * through unchanged.
 * @param {string} className
 * @param {string} key
 * @param {number} level
 * @param {*} [fallback=0]
 */
export function getProgressionValue(className, key, level, fallback = 0) {
  const raw = getClassProgression(className)[key];
  if (raw === undefined || raw === null) return fallback;
  if (Array.isArray(raw)) return resolveAtLevel(raw, level, fallback);
  if (raw === LEVEL_SENTINEL) {
    const lvl = Number(level);
    return Number.isFinite(lvl) ? lvl : fallback;
  }
  return raw;
}

/**
 * Whether a feature gated by a single level marker has been gained.
 * @param {string} className
 * @param {string} key e.g. 'evasionLevel'
 * @param {number} level
 */
export function hasFeatureAtLevel(className, key, level) {
  const at = Number(getClassProgression(className)[key]);
  const lvl = Number(level);
  if (!Number.isFinite(at) || !Number.isFinite(lvl)) return false;
  return lvl >= at;
}
