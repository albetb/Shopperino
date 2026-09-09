import { getEffectById } from './effectsUtils';

/**
 * The name a row shows, composed from the parts a row stores.
 *
 * English in, English out by default -- Shop.resolveEntry composes with it too,
 * and a name that is going to be compared, keyed or shared must not depend on
 * who is reading. A caller that is *displaying* passes `naming`, which is the
 * one place the reading language enters: see displayItemName.js.
 *
 * @param {string} baseName - the item's name as src/data spells it.
 * @param {object} [parts] - masterwork, bonus and effectIds, as stored.
 * @param {object} [naming] - `item`, `masterwork` and `effect` translators.
 */
export function formatItemName(baseName, { masterwork, bonus, effectIds } = {}, naming = {}) {
  const base = naming.item ? naming.item(baseName) : baseName;
  let name = ((bonus == null || bonus === 0) && masterwork === true)
    ? (naming.masterwork ? naming.masterwork(base) : `Masterwork ${base}`)
    : base;

  if (Array.isArray(effectIds) && effectIds.length) {
    const suffix = effectIds
      .map(id => getEffectById(id)?.Name)
      .filter(Boolean)
      .map(effect => (naming.effect ? naming.effect(effect) : effect));
    if (suffix.length) name = `${name}, ${suffix.join(', ')}`;
  }

  // +N always last (matches composeNameWithEffect convention in appSlice).
  if (typeof bonus === 'number' && bonus > 0) name = `${name} +${bonus}`;

  return name;
}

/**
 * Returns the "Magic ..." display label for a base item type when the item
 * carries an enhancement bonus or magical effects, otherwise null.
 */
export function magicTypeFor(baseType, { bonus, effectIds } = {}) {
  const hasBonus = typeof bonus === 'number' && bonus > 0;
  const hasEffects = Array.isArray(effectIds) && effectIds.length > 0;
  if (!hasBonus && !hasEffects) return null;
  switch (baseType) {
    case 'Weapon':
    case 'Specific Weapon':
      return 'Magic Weapon';
    case 'Armor':
    case 'Specific Armor':
      return 'Magic Armor';
    case 'Shield':
    case 'Specific Shield':
      return 'Magic Shield';
    default:
      return null;
  }
}

/** Material-symbol icon for an inventory item's type. */
export function iconForItemType(itemType) {
  switch (itemType) {
    case 'Weapon':
    case 'Specific Weapon':
    case 'Magic Weapon':
      return 'swords';
    case 'Armor':
    case 'Specific Armor':
    case 'Magic Armor':
      return 'security';
    case 'Shield':
    case 'Specific Shield':
    case 'Magic Shield':
      return 'shield';
    case 'Ammo':
      return 'arrow_forward';
    case 'Potion':
      return 'science';
    case 'Ring':
      return 'circle';
    case 'Rod':
      return 'straighten';
    case 'Scroll':
      return 'article';
    case 'Staff':
      return 'colors';
    case 'Wand':
      return 'auto_fix_high';
    case 'Wondrous Item':
      return 'auto_awesome';
    case 'Good':
    default:
      return 'inventory_2';
  }
}

export default formatItemName;
