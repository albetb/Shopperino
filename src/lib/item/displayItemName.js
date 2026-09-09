import { tx, tName, hasName } from '../i18n';
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

/* The suffixes an already-composed name carries, in the order they are read
   off the end: the bonus last, then whatever was joined with a comma. */
const TRAILING_BONUS = / \+\d+$/;
const MASTERWORK_SUFFIX = /^perfect$/i;

/**
 * The title of an info card, which arrives already composed.
 *
 * `getItemByLink` builds one string — "Longsword, Flaming +1" — because the
 * card is a snapshot of an item rather than the item itself, so the three
 * parts `displayItemName` takes separately are gone by the time it is
 * rendered. This takes them apart again.
 *
 * The name is peeled from the right, one comma-separated piece at a time,
 * until what is left is a name the pack knows. That order matters: half the
 * item list has a comma in its own name — *Mace, light*, *Shield, heavy
 * steel*, *Rod of Metamagic, Enlarge* — so splitting on commas would cut those
 * in half. Asking the pack where the name ends cannot.
 *
 * A card that is not an item never reaches here (the caller checks `kind`),
 * which is what keeps the *Hide* skill from being renamed after the armour.
 *
 * @param {string} composed - the card's Name, as the card carries it.
 */
export function itemCardTitle(composed) {
  let name = String(composed ?? '');
  if (!name) return name;

  const bonus = name.match(TRAILING_BONUS);
  const tail = bonus ? bonus[0] : '';
  if (bonus) name = name.slice(0, bonus.index);

  const suffixes = [];
  while (!hasName('items', name)) {
    const comma = name.lastIndexOf(', ');
    if (comma < 0) break;
    suffixes.unshift(name.slice(comma + 2));
    name = name.slice(0, comma);
  }

  /* Unknown either way: an item the pack has no name for comes back exactly as
     it went in, because every lookup below falls back to its English key. */
  let head = tName('items', name);
  const rest = [];
  suffixes.forEach((suffix) => {
    if (MASTERWORK_SUFFIX.test(suffix)) head = tx('Masterwork {0}', head);
    else rest.push(tName('itemEffects', suffix));
  });

  return [head, ...rest].join(', ') + tail;
}
