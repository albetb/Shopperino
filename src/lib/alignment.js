/**
 * Alignment options and defaults by class for the player sheet.
 * Moral: Good, Neutral, Evil. Ethics: Lawful, Neutral, Chaotic.
 */

export const MORAL_OPTIONS = ['Good', 'Neutral', 'Evil'];
export const ETHICAL_OPTIONS = ['Lawful', 'Neutral', 'Chaotic'];

/** Classes that cannot be Lawful (ethics dropdown excludes Lawful). */
const NONLAWFUL_CLASSES = ['Barbarian', 'Bard'];

/** Ethics options for a class (subset of ETHICAL_OPTIONS). */
export function getAllowedEthics(className) {
  if (!className) return [...ETHICAL_OPTIONS];
  if (NONLAWFUL_CLASSES.includes(className)) return ['Neutral', 'Chaotic'];
  if (className === 'Monk' || className === 'Paladin') return ['Lawful'];
  return [...ETHICAL_OPTIONS];
}

/** Moral options for a class (subset of MORAL_OPTIONS). */
export function getAllowedMorals(className) {
  if (!className) return [...MORAL_OPTIONS];
  if (className === 'Paladin') return ['Good'];
  return [...MORAL_OPTIONS];
}

/** Default alignment when switching to this class. */
export function getDefaultAlignmentForClass(className) {
  if (!className) return { moral: 'Neutral', ethical: 'Neutral' };
  if (className === 'Monk') return { moral: 'Neutral', ethical: 'Lawful' };
  if (className === 'Paladin') return { moral: 'Good', ethical: 'Lawful' };
  return { moral: 'Neutral', ethical: 'Neutral' };
}

/** Druid: if one axis is non-neutral, the other must be Neutral. Apply when setting moral. */
export function druidMoralToEthical(moral) {
  if (moral === 'Good' || moral === 'Evil') return 'Neutral';
  return null; // no change
}

/** Druid: if one axis is non-neutral, the other must be Neutral. Apply when setting ethical. */
export function druidEthicalToMoral(ethical) {
  if (ethical === 'Lawful' || ethical === 'Chaotic') return 'Neutral';
  return null;
}
