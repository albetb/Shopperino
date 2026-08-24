/**
 * Dice roller domain logic.
 *
 * Deliberately NOT built on prng.js. That generator is seeded so a shop can be
 * regenerated identically from a QR code — exactly the wrong property here,
 * where a repeat of yesterday's rolls would be a bug. This is the one place in
 * the app that should call Math.random().
 *
 * The roller is not tied to a character: it is reachable from every tab and
 * knows nothing about the player sheet.
 */

/** The amounts the count buttons add, in display order. */
export const DICE_MULTIPLIERS = [1, 2, 3, 4, 5, 10, 20];

/** Die types offered, in display order. */
export const DICE_TYPES = [2, 3, 4, 6, 8, 10, 12, 20, 100];

/* Selection is stored as one integer, a bit per multiplier button — the
   compact-storage rule in CLAUDE.md prefers a bitmask over seven booleans. */
export const DEFAULT_MULTIPLIER_MASK = 1; // only "+1"

/** Whether the button at `index` is currently pressed. */
export function isMultiplierSelected(mask, index) {
  return ((((Number(mask) || 0) >> index)) & 1) === 1;
}

/** The indices of every pressed button. */
export function selectedMultiplierIndices(mask) {
  return DICE_MULTIPLIERS.map((_, i) => i).filter((i) => isMultiplierSelected(mask, i));
}

/**
 * How many dice the current selection rolls: the sum of every pressed button.
 * Never less than one — an empty selection cannot roll nothing.
 */
export function diceCountFromMask(mask) {
  const total = selectedMultiplierIndices(mask)
    .reduce((sum, i) => sum + DICE_MULTIPLIERS[i], 0);
  return total > 0 ? total : 1;
}

/**
 * Press or release one button. Releasing the last pressed one falls back to
 * "+1" rather than leaving an empty selection, so the count is always valid.
 */
export function toggleMultiplier(mask, index) {
  const current = Number(mask) || 0;
  const next = current ^ (1 << index);
  return next === 0 ? DEFAULT_MULTIPLIER_MASK : next;
}

/** Discard bits that belong to no button, so stored junk cannot widen a roll. */
export function normalizeMultiplierMask(mask) {
  const clean = (Number(mask) || 0) & ((1 << DICE_MULTIPLIERS.length) - 1);
  return clean === 0 ? DEFAULT_MULTIPLIER_MASK : clean;
}

/** One die, 1..sides inclusive. */
export function rollDie(sides) {
  const faces = Math.max(2, Math.floor(Number(sides) || 0));
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Roll `count` dice of `sides`.
 * @returns {{sides: number, rolls: number[], total: number}}
 */
export function rollDice(sides, count = 1) {
  const faces = Math.max(2, Math.floor(Number(sides) || 0));
  const n = Math.max(1, Math.floor(Number(count) || 0));
  const rolls = Array.from({ length: n }, () => rollDie(faces));
  return { sides: faces, rolls, total: rolls.reduce((sum, r) => sum + r, 0) };
}

/**
 * A roll as the compact tuple stored in the app object: `[sides, ...rolls]`.
 * The total is derivable, so it is not stored.
 */
export function rollToTuple(roll) {
  if (!roll || !Array.isArray(roll.rolls) || roll.rolls.length === 0) return [];
  return [roll.sides, ...roll.rolls];
}

/** Rebuild a roll from its stored tuple, or null when there is none. */
export function rollFromTuple(tuple) {
  if (!Array.isArray(tuple) || tuple.length < 2) return null;
  const sides = Math.floor(Number(tuple[0])) || 0;
  const rolls = tuple.slice(1)
    .map((n) => Math.floor(Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (sides <= 0 || rolls.length === 0) return null;
  return { sides, rolls, total: rolls.reduce((sum, r) => sum + r, 0) };
}

/** "3d6" — how a roll reads at the table. */
export function formatRollLabel(roll) {
  if (!roll) return '';
  return `${roll.rolls.length}d${roll.sides}`;
}
