/**
 * Starting-equipment generation. Runs once per character, the first time both
 * race and class are selected (the caller gates on that). Adds the class
 * package to inventory, auto-equips armor / shield / a primary melee weapon
 * (Set 1) and a primary ranged weapon (Set 2), and rolls starting gold.
 *
 * The per-class package data lives in src/data/startingEquipment.json; item
 * display names are resolved from items.json via getItemByRef so they never
 * drift from the canonical data.
 */

import startingEquipment from '../../data/startingEquipment.json';
import { getItemByRef } from '../utils';
import { getEquipType } from '../equipType';

/** Roll `count` dice of `sides` and return the sum (min `count`, max `count*sides`). */
function rollDice(count, sides) {
  const n = Math.max(0, Math.floor(count) || 0);
  const s = Math.max(1, Math.floor(sides) || 1);
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    total += Math.floor(Math.random() * s) + 1;
  }
  return total;
}

/** Equip-slot itemData shape, matching handleEquipItem in inventory_page.jsx. */
function equipData(name, link, twoHanded) {
  return { name, link, twoHanded: !!twoHanded, masterwork: false, bonus: 0, effectIds: [] };
}

/**
 * Generate and apply the starting equipment package for the player's class.
 * No-op (returns false) if already generated or the class has no package.
 * @param {import('./player').default} player
 * @returns {boolean} true if a package was generated
 */
export function generateStartingEquipment(player) {
  if (!player || player.startingEquipmentGenerated) return false;
  const cls = player.getClass?.();
  const pkg = cls ? startingEquipment[cls] : null;
  if (!pkg || !Array.isArray(pkg.items)) return false;

  let meleeEquipped = false;
  let rangedEquipped = false;

  for (const item of pkg.items) {
    const name = getItemByRef(item.link)?.raw?.Name;
    if (!name) continue; // defensively skip any unresolved link
    const count = Math.max(1, Math.floor(item.count || 1));
    player.addInventoryItem(name, item.type, count, item.link);

    if (item.role === 'armor') {
      player.equipItem('armor', equipData(name, item.link, false));
    } else if (item.role === 'shield') {
      // Off-hand of Set 1, alongside a one-handed melee weapon.
      player.equipItem('lh1', equipData(name, item.link, false));
    } else if (item.role === 'melee' && !meleeEquipped) {
      const twoHanded = getEquipType({ ItemType: item.type, Link: item.link }) === 'two-hand';
      if (twoHanded) {
        player.equipItem('lh1', equipData(name, item.link, true));
        player.equipItem('rh1', equipData(name, item.link, true));
      } else {
        player.equipItem('rh1', equipData(name, item.link, false));
      }
      meleeEquipped = true;
    } else if (item.role === 'ranged' && !rangedEquipped) {
      // Ranged weapons fill both hands of Set 2.
      player.equipItem('lh2', equipData(name, item.link, true));
      player.equipItem('rh2', equipData(name, item.link, true));
      rangedEquipped = true;
    }
    // Extra weapons (additional melee/ranged) stay in inventory only.
  }

  player.setGold(rollDice(pkg.gold?.count, pkg.gold?.sides));
  player.startingEquipmentGenerated = true;
  return true;
}
