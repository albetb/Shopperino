import MonsterSheet, { MAX_INDIVIDUALS } from './monsterSheet';

/**
 * The creatures the master is running right now.
 *
 * A fight is rarely one monster, and the Monster Book used to track exactly
 * one: opening a second stat block threw away the first one's hit points. The
 * roster is the fix — a short list of *kinds*, each holding however many of
 * that kind are on the table.
 *
 * **One entry per kind, many individuals per entry.** Eight goblins are one
 * `MonsterSheet` with eight numbers in its `damages` array, not eight sheets:
 * everything except the damage is shared, so a master who rules "these goblins
 * are all +2 AC" says it once and it lands on all of them.
 *
 * Pure functions over a plain array. Nothing here mutates its input — each
 * returns a fresh array of fresh sheets, so a reducer holding the previous one
 * still sees a changed reference and re-renders.
 */

/**
 * How many different creatures the roster holds.
 *
 * Ten is a storage bound rather than a rule about encounters: everything the
 * app owns lives in one ~5 MB localStorage key (see CLAUDE.md), and a roster
 * entry is the largest thing the Monster Book writes. Both this and
 * `MAX_INDIVIDUALS` are flagged in the UI rather than silently enforced.
 */
export const MAX_ROSTER_ENTRIES = 10;

/** Fresh copies, so a caller can mutate the result without touching the store. */
function copy(roster) {
  return (roster || []).map((sheet) => sheet.clone()).filter(Boolean);
}

/** Index of the entry for this creature, or -1. */
export function findRosterIndex(roster, ref) {
  const wanted = String(ref || '').trim();
  if (!wanted) return -1;
  return (roster || []).findIndex((sheet) => sheet.getRef() === wanted);
}

/** True when this creature is already being tracked. */
export function isInRoster(roster, ref) {
  return findRosterIndex(roster, ref) >= 0;
}

/** Individuals across every entry — what the card counts in its heading. */
export function countIndividuals(roster) {
  return (roster || []).reduce((total, sheet) => total + sheet.getCount(), 0);
}

/**
 * Add one creature to the roster.
 *
 * **A creature already on the roster gains another individual** rather than a
 * second entry — pressing Goblin eight times is how an encounter of eight
 * goblins gets built, and it is the common case at the table.
 *
 * @returns {{roster: Array<MonsterSheet>, index: number, added: boolean,
 *   reason: string}} `index` is the entry the creature landed in (or would
 *   have), and `reason` names the ceiling that refused it: 'entries',
 *   'individuals', 'unknown', or '' on success.
 */
export function addToRoster(roster, ref) {
  const current = copy(roster);
  const wanted = String(ref || '').trim();
  if (!wanted) return { roster: current, index: -1, added: false, reason: 'unknown' };

  const existing = findRosterIndex(current, wanted);
  if (existing >= 0) {
    if (!current[existing].addIndividual()) {
      return { roster: current, index: existing, added: false, reason: 'individuals' };
    }
    return { roster: current, index: existing, added: true, reason: '' };
  }

  if (current.length >= MAX_ROSTER_ENTRIES) {
    return { roster: current, index: -1, added: false, reason: 'entries' };
  }

  const sheet = new MonsterSheet(wanted);
  if (!sheet.isValid()) {
    return { roster: current, index: -1, added: false, reason: 'unknown' };
  }
  current.push(sheet);
  return { roster: current, index: current.length - 1, added: true, reason: '' };
}

/** Another individual of an entry already on the roster. */
export function addIndividual(roster, entryIndex) {
  const current = copy(roster);
  const entry = current[entryIndex];
  if (!entry) return { roster: current, added: false, reason: 'unknown' };
  if (!entry.addIndividual()) {
    return { roster: current, added: false, reason: 'individuals' };
  }
  return { roster: current, added: true, reason: '' };
}

/**
 * Remove one individual — and **the whole entry when it was the last one**,
 * which is what deleting the last health bar is meant to do.
 *
 * @returns {{roster: Array<MonsterSheet>, removedEntry: boolean}}
 */
export function removeIndividual(roster, entryIndex, individualIndex) {
  const current = copy(roster);
  const entry = current[entryIndex];
  if (!entry) return { roster: current, removedEntry: false };

  entry.removeIndividual(individualIndex);
  if (entry.getCount() === 0) {
    current.splice(entryIndex, 1);
    return { roster: current, removedEntry: true };
  }
  return { roster: current, removedEntry: false };
}

/** Drop a whole entry, however many individuals it holds. */
export function removeEntry(roster, entryIndex) {
  const current = copy(roster);
  if (!current[entryIndex]) return current;
  current.splice(entryIndex, 1);
  return current;
}

/** Replace one entry with a mutated copy of itself. */
export function updateEntry(roster, entryIndex, mutate) {
  const current = copy(roster);
  const entry = current[entryIndex];
  if (!entry) return current;
  mutate(entry);
  return current;
}

/** Tuples for localStorage, and back. */
export function rosterToTuples(roster) {
  return (roster || []).map((sheet) => sheet.serialize());
}

export function rosterFromTuples(tuples) {
  if (!Array.isArray(tuples)) return [];
  return tuples
    .map((tuple) => MonsterSheet.load(tuple))
    .filter(Boolean)
    .slice(0, MAX_ROSTER_ENTRIES);
}

export { MAX_INDIVIDUALS };
