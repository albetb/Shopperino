/**
 * Deity lookup and alignment-step math.
 *
 * Source of truth: src/data/deities.json (the 21 core SRD deities), with the
 * "within one step" rule from obsidian-vault/dnd-rules/alignment.md — two
 * alignments are within one step when they differ on at most one axis.
 *
 * A character's deity is free text: any name that is not in the table is a
 * homebrew patron with no known alignment, so no drift can be computed for it.
 */

import { loadFile } from './loadFile';

/** Axis order, used to turn an alignment component into a position. */
const ETHICAL_AXIS = ['Lawful', 'Neutral', 'Chaotic'];
const MORAL_AXIS = ['Good', 'Neutral', 'Evil'];

/** All deities, in the table's order. */
export function listDeities() {
  const list = loadFile('deities');
  return Array.isArray(list) ? list : [];
}

/** The deity entry for a name (case-insensitive), or null for a custom one. */
export function getDeityByName(name) {
  const wanted = String(name || '').trim().toLowerCase();
  if (!wanted) return null;
  return listDeities().find((d) => String(d?.name || '').toLowerCase() === wanted) || null;
}

/** True when the name matches a deity in the table (i.e. not a custom patron). */
export function isKnownDeity(name) {
  return getDeityByName(name) !== null;
}

/**
 * Distance between two alignments, counted as the number of axes on which they
 * differ by more than nothing. Returns { ethical, moral, steps } where `steps`
 * is how many axes are off — "within one step" means steps <= 1 *and* neither
 * axis is at opposite ends.
 *
 * Both are reported because the rule is per-axis: a Lawful Good cleric of a
 * Chaotic Good deity is off by a full axis (Lawful vs Chaotic), which is two
 * positions on one axis, not one step.
 */
export function alignmentDistance(deity, ethical, moral) {
  if (!deity) return null;
  const ei = ETHICAL_AXIS.indexOf(ethical);
  const mi = MORAL_AXIS.indexOf(moral);
  const dei = ETHICAL_AXIS.indexOf(deity.ethical);
  const dmi = MORAL_AXIS.indexOf(deity.moral);
  if (ei < 0 || mi < 0 || dei < 0 || dmi < 0) return null;
  const ethicalGap = Math.abs(ei - dei);
  const moralGap = Math.abs(mi - dmi);
  return { ethical: ethicalGap, moral: moralGap, steps: ethicalGap + moralGap };
}

/**
 * The SRD cleric test: alignment must be within one step of the deity's on
 * both axes. That means at most one axis may differ, and it may differ by only
 * one position — LG serving NG is fine, LG serving CG is not.
 */
export function isWithinOneStep(deity, ethical, moral) {
  const distance = alignmentDistance(deity, ethical, moral);
  if (!distance) return true; // unknown deity — nothing to compare against
  return distance.steps <= 1;
}

/** Human-readable alignment of a deity, e.g. "Lawful Good" or "Neutral". */
export function formatDeityAlignment(deity) {
  if (!deity) return '';
  if (deity.ethical === 'Neutral' && deity.moral === 'Neutral') return 'Neutral';
  return `${deity.ethical} ${deity.moral}`;
}
