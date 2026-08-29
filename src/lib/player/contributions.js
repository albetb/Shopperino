/**
 * The vocabulary the stat breakdown speaks.
 *
 * A **contribution** is one source feeding a derived number: `{ source, label,
 * type, value }`. The list for a stat must sum to the value the sheet displays —
 * that equality is the whole point, because a breakdown that does not add up has
 * just found a bug rather than explained a number.
 *
 * A **situational** entry is something tied to the same stat that does *not*
 * move it: a dodge bonus against one kind of creature, a save bonus against one
 * school. It carries a note instead of a value, so it can never be summed into
 * a total by accident.
 *
 * `{ source, label, value }` is the shape `conditionEffects.js` already produces
 * and calls breakdown-ready; this adds the optional `type` rather than inventing
 * a second shape. `sumContributions` here is deliberately a standalone twin of
 * the one in `conditionEffects.js`: same arithmetic, but this module imports
 * nothing, so anything in the model can use it without an import cycle.
 *
 * Rules: dnd-rules/combat.md for how AC and the saves compose, and the bonus
 * stacking rules for what `type` means — two bonuses of the same named type do
 * not stack, and untyped ones always do.
 */

/**
 * The 3.5 bonus types the sheet can currently source. Untyped is the common
 * case and is represented by the empty string rather than a name, because
 * "untyped" is the absence of a type and always stacks.
 */
export const BONUS_TYPES = {
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
};

const TYPE_VALUES = new Set(Object.values(BONUS_TYPES));

/**
 * One source feeding a derived value.
 *
 * @param {string} source - Machine key for the source ('armor', 'dex', 'rage').
 * @param {string} label - What the reader sees ('chain shirt', 'Dexterity').
 * @param {number} value - Signed contribution to the total.
 * @param {string} [type] - A `BONUS_TYPES` value; anything unrecognised is
 *   stored as untyped rather than passed through, so a typo cannot invent a
 *   bonus type that the stacking rules would then have to reason about.
 * @returns {{source: string, label: string, type: string, value: number}}
 */
export function contribution(source, label, value, type = BONUS_TYPES.UNTYPED) {
  return {
    source: String(source ?? ''),
    label: String(label ?? ''),
    type: TYPE_VALUES.has(type) ? type : BONUS_TYPES.UNTYPED,
    value: Number(value) || 0,
  };
}

/**
 * Something tied to a stat that does not change it — a bonus that only exists
 * in a situation the sheet cannot know it is in.
 *
 * Deliberately has no `value` field at all, rather than a value of zero: the
 * absence is what stops it being summed, and what makes it obvious in a debugger
 * which kind of entry is being looked at.
 *
 * @param {string} source - Machine key ('dwarfPoison', 'trapSense').
 * @param {string} label - The heading the reader sees ('Hardy').
 * @param {string} note - When it applies ('+2 on saves against poison').
 * @returns {{source: string, label: string, note: string}}
 */
export function situational(source, label, note) {
  return {
    source: String(source ?? ''),
    label: String(label ?? ''),
    note: String(note ?? ''),
  };
}

/**
 * Total of a contribution list.
 *
 * Entries with no numeric `value` contribute nothing, so a situational entry
 * that finds its way into a mixed list cannot corrupt the sum — which matters,
 * because the sum is what the UI checks the displayed number against.
 *
 * @param {Array<{value?: number}>} list
 * @returns {number}
 */
export function sumContributions(list) {
  if (!Array.isArray(list)) return 0;
  return list.reduce((total, entry) => {
    const value = Number(entry?.value);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}

/**
 * Drop the contributions that say nothing.
 *
 * A zero contributes nothing to the total and nothing to the reader's
 * understanding, so a plain character produces a short list rather than a wall
 * of "+0" rows.
 *
 * @param {Array<{value?: number}>} list
 * @returns {Array<object>}
 */
export function compactContributions(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((entry) => (Number(entry?.value) || 0) !== 0);
}
