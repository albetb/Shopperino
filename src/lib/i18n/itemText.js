import { tx, tName } from './index';
import { spellName } from './spellText';

/**
 * An item card's fields, in the reading language.
 *
 * Most of the card is numbers — a cost, a weight, a damage die, a critical
 * range — and those say the same thing in both languages. Three fields are
 * vocabulary (`Type`, `Category`, `Subtype`, between them 25 distinct words
 * across all 828 items), and two more are *composed* by `getItemByLink` in
 * English out of the bonus the caller asked for and the spell the item holds.
 *
 * A model may not read the reading language — it would make the card depend on
 * hidden global state, and the same call has to be able to answer the share
 * codec — so the English is composed there exactly as before and the words are
 * swapped here, on the way to the screen. Same arrangement as
 * `creatureDescription`.
 */

/* "+1 to attack rolls when used in combat." — added by getItemByLink for a
   masterwork or enhanced weapon, and by nothing else. */
const COMBAT_NOTE = /<p><i>\+(\d+) to attack rolls when used in combat\.<\/i><\/p>/g;

/* "Contains the spell: <a …>Fireball</a>." — a potion, a scroll or a wand. */
const CONTAINS = /<p>Contains the spell: (<a\b[^>]*>)([^<]*)(<\/a>)\.<\/p>/g;

export function itemDescription(html) {
  return String(html ?? '')
    .replace(COMBAT_NOTE,
      (_, n) => `<p><i>${tx('+{0} to attack rolls when used in combat.', n)}</i></p>`)
    .replace(CONTAINS,
      (_, open, name, close) => `<p>${tx('Contains the spell: {0}.',
        `${open}${spellName(name)}${close}`)}</p>`);
}

export const itemCategory = (en) => tName('itemCategories', en);
export const itemSubtype = (en) => tName('itemSubtypes', en);
export const itemTypeName = (en) => tName('itemTypes', en);
