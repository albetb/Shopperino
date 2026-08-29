/**
 * Augment Summoning: every creature you conjure gains +4 enhancement to
 * Strength and Constitution for the spell's whole duration.
 *
 * The feat says "any summon spell", which in 3.5 means the **Summoning
 * subschool** rather than any spell whose name begins with "Summon" — that
 * catches *Mount* and *Insect plague*, which have no such name, and it is the
 * only reading that also excludes the three spells below.
 *
 * There is no list of affected spells written down here: it is derived from
 * `School` in spells.json, so a spell added to the data file is covered the
 * day it lands, and a spell renamed does not silently drop out.
 *
 * Rules: dnd-rules/feats.md, dnd-rules/magic.md for the subschools.
 */

/** The bonus, and the two scores it raises. */
export const AUGMENT_SUMMONING_BONUS = 4;
export const AUGMENT_SUMMONING_ABILITIES = Object.freeze(['str', 'con']);

/** The two scores by their full names, for anything that has to say them. */
export const AUGMENT_SUMMONING_ABILITY_NAMES = Object.freeze({
  str: 'Strength',
  con: 'Constitution',
});

/**
 * The three Summoning-subschool spells that summon **no creature**, and so
 * have no Strength or Constitution for the feat to raise. Each conjures an
 * object or traps a soul; they carry the subschool because of how they move
 * something to you, not because anything arrives to fight.
 */
export const NON_CREATURE_SUMMONS = Object.freeze([
  'Instant Summons',
  'Secret Chest',
  'Trap the Soul',
]);

const excluded = new Set(NON_CREATURE_SUMMONS.map((n) => n.toLowerCase()));

/**
 * Whether Augment Summoning would apply to one spell — that is, whether the
 * spell is in the Summoning subschool *and* brings a creature.
 *
 * @param {object|string} spell - A spells.json entry, or its School string.
 * @returns {boolean}
 */
export function isAugmentableSummon(spell) {
  const school = typeof spell === 'string' ? spell : (spell?.School || '');
  if (!/\(summoning\)/i.test(school)) return false;
  const name = typeof spell === 'string' ? '' : String(spell?.Name || '');
  return !excluded.has(name.toLowerCase());
}
