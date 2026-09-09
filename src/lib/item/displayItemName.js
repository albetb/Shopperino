import { tx, tName } from '../i18n';
import { formatItemName } from './formatItemName';

/**
 * An item's name, in the reading language.
 *
 * ## Why the name is translated here and not in the data
 *
 * `src/data/items.json` is the source and is never edited, and its `Name` is
 * not prose — it is identity. A row stores it, `getItemByRef` looks items up by
 * it, the share codec puts it on the wire, and `itemBonus` reads a `+` out of
 * it. So it stays English in every one of those places and changes only on the
 * way to the screen, which is exactly what `names.json` is for: the English key
 * is what the code uses, the Italian value is only ever shown.
 *
 * That also means a character sheet written in one language reads correctly in
 * the other. Nothing about an item is stored in the language it was added in.
 *
 * ## Three parts, three translations
 *
 * "Masterwork Longsword +1, Flaming" is four pieces of data — a base name, a
 * flag, a number and an effect id — and three of them are words. The base name
 * and the effect are names; the qualifier is a sentence with the name in it,
 * because Italian puts it after: *spada lunga di fattura superiore*.
 */
export const ITEM_NAMING = {
  item: (name) => tName('items', name),
  masterwork: (name) => tx('Masterwork {0}', name),
  effect: (name) => tName('itemEffects', name),
};

/**
 * @param {string} baseName - the item's name as src/data spells it.
 * @param {object} [parts] - masterwork, bonus and effectIds, as stored.
 */
export default function displayItemName(baseName, parts) {
  return formatItemName(baseName, parts, ITEM_NAMING);
}

/** Just the name, with no masterwork or bonus around it. */
export function itemName(name) {
  return tName('items', name);
}
