import { getEffectById } from './effectsUtils';

export function formatItemName(baseName, { masterwork, bonus, effectIds } = {}) {
  let name = ((bonus == null || bonus === 0) && masterwork === true)
    ? `Masterwork ${baseName}`
    : baseName;

  if (Array.isArray(effectIds) && effectIds.length) {
    const suffix = effectIds
      .map(id => getEffectById(id)?.Name)
      .filter(Boolean);
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
