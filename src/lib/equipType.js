import { getItemByRef } from './utils';

const NON_EQUIPPABLE_TYPES = new Set(['Potion', 'Scroll', 'Ammo']);
const ARMOR_TYPES = new Set(['Armor', 'Specific Armor', 'Magic Armor']);
const SHIELD_TYPES = new Set(['Shield', 'Specific Shield']);
const WEAPON_TYPES = new Set(['Weapon', 'Specific Weapon', 'Magic Weapon']);
const TWO_HAND_SUBTYPES = new Set(['Two-Handed Melee Weapons', 'Ranged Weapons']);

/**
 * Returns the equip category of an inventory item:
 *   'none'     — not equippable (Potion, Scroll, Ammo)
 *   'armor'    — goes in the armor slot
 *   'one-hand' — goes in a single hand slot (rh1/lh1/rh2/lh2)
 *   'two-hand' — goes in a full hand set (set1 or set2)
 *   'other'    — goes in an other slot (other1–other4)
 *
 * @param {{ ItemType: string, Link: string|null }} item
 * @returns {'none'|'armor'|'one-hand'|'two-hand'|'other'}
 */
export function getEquipType(item) {
  if (!item) return 'none';
  const { ItemType, Link } = item;
  if (Link && Link.startsWith('scrolls/')) return 'none';
  if (NON_EQUIPPABLE_TYPES.has(ItemType)) return 'none';
  if (ARMOR_TYPES.has(ItemType)) return 'armor';
  if (SHIELD_TYPES.has(ItemType)) return 'one-hand';
  if (WEAPON_TYPES.has(ItemType)) {
    const ref = getItemByRef(Link);
    const subtype = ref?.raw?.Subtype || '';
    return TWO_HAND_SUBTYPES.has(subtype) ? 'two-hand' : 'one-hand';
  }
  return 'other';
}
