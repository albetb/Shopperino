/**
 * The vocabulary an item effect table speaks.
 *
 * Two tables now describe what a magic item does to a character —
 * [potionEffects.js](potionEffects.js) for what is drunk, and
 * [wornEffects.js](wornEffects.js) for what is worn — and both need the same
 * three things: the bonus-type names, **which AC numbers a bonus of each type
 * reaches**, and a way to spread one value across a group of stats.
 *
 * That middle one is the reason this module exists rather than each table
 * keeping its own copy. "An armor bonus is denied to touch AC, a deflection
 * bonus is not, and a dodge bonus is lost while flat-footed" is the classic AC
 * bug, and two copies of it are two chances to get it wrong.
 *
 * Bonus-type names are plain strings rather than an import of `BONUS_TYPES`
 * from [contributions.js](../player/contributions.js): the player package
 * imports the item package, and reversing that for a handful of string
 * constants would be a cycle. `effectSchema.test.js` asserts the two agree.
 *
 * Rules: dnd-rules/combat.md for how AC composes, dnd-rules/magic.md for what
 * a named bonus type means and which of them stack.
 */

/** The 3.5 bonus types an item effect can carry. */
export const T = Object.freeze({
  UNTYPED: '',
  ARMOR: 'armor',
  SHIELD: 'shield',
  DEFLECTION: 'deflection',
  DODGE: 'dodge',
  ENHANCEMENT: 'enhancement',
  MORALE: 'morale',
  RESISTANCE: 'resistance',
  NATURAL: 'natural',
  SIZE: 'size',
  RACIAL: 'racial',
  COMPETENCE: 'competence',
  INSIGHT: 'insight',
  LUCK: 'luck',
  SACRED: 'sacred',
  PROFANE: 'profane',
  CIRCUMSTANCE: 'circumstance',
  ALCHEMICAL: 'alchemical',
  SYNERGY: 'synergy',
});

/* Which AC numbers a bonus of each kind reaches.
   - Deflection, insight, luck, dodge and untyped bonuses are not tied to
     anything physical, so they apply against a touch attack too.
   - Armor, shield and natural-armor bonuses are **denied to touch AC**.
   - A dodge bonus is **lost while flat-footed**, along with Dexterity. */
export const AC_ALL = Object.freeze(['ac', 'acTouch', 'acFlat']);
export const AC_WORN = Object.freeze(['ac', 'acFlat']);
export const AC_DODGE = Object.freeze(['ac', 'acTouch']);

/** The three saving throws, for an effect that raises all of them at once. */
export const SAVES = Object.freeze(['fortitude', 'reflex', 'will']);

/** The six ability keys, in sheet order. */
export const ABILITIES = Object.freeze(['str', 'dex', 'con', 'int', 'wis', 'cha']);

/**
 * Expand a shorthand group into the `{ statKey: [value, type] }` shape both
 * tables use.
 *
 * @param {string[]} keys stat keys the bonus lands on
 * @param {number} value signed size of the bonus
 * @param {string} type a `T` value
 */
export function spread(keys, value, type) {
  return Object.fromEntries(keys.map((key) => [key, [value, type]]));
}
