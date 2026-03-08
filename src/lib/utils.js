import { loadFile } from './loadFile';
import { slug } from './slugUtils';

export { loadFile };
export { itemTypes, getItemByRef, getItemByLink, getItemById, getItemIdByRef } from './item/itemsUtils';
export { getScrollById, getScrollIdByLink } from './spellbook/scrollUtils';
export { getEffectByLink, getEffectById, getEffectIdBySlug } from './item/effectsUtils';
export { getSpellByLink } from './spellbook/spellsUtils';

const CHARACTERISTIC_FULL = { Str: 'Strength', Dex: 'Dexterity', Con: 'Constitution', Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma', None: 'None' };

/** Returns a card for the info sidebar when link is a feat anchor. */
export function getFeatByLink(link) {
  try {
    const feats = loadFile('feats');
    if (!Array.isArray(feats) || !link || typeof link !== 'string') return [];
    const normalized = link.toLowerCase().trim();
    const feat = feats.find(f => slug(f.Name) === normalized);
    if (!feat) return [];
    const tagsLine = Array.isArray(feat.Tags) && feat.Tags.length ? '<p><i>' + feat.Tags.join(', ') + '</i></p>' : '';
    const prereqLine = feat.Prerequisites ? '<p><b>Prerequisites:</b> ' + feat.Prerequisites + '</p>' : '';
    const description = (tagsLine + prereqLine + (feat.Description || '')).trim();
    return [{ Name: feat.Name, Description: description, Link: normalized }];
  } catch (err) {
    return [];
  }
}

/** Returns a card for the info sidebar when link is a skill anchor. */
export function getSkillByLink(link) {
  try {
    const skills = loadFile('skills');
    if (!Array.isArray(skills) || !link || typeof link !== 'string') return [];
    const normalized = link.toLowerCase().trim();
    let skill = skills.find(s => slug(s.Name) === normalized);
    if (!skill && /^knowledge-/.test(normalized)) {
      skill = skills.find(s => s && s.Name === 'Knowledge');
    }
    if (!skill) return [];
    const charFull = (skill.Characteristic && CHARACTERISTIC_FULL[skill.Characteristic]) ? CHARACTERISTIC_FULL[skill.Characteristic] : (skill.Characteristic || '');
    const italicParts = [charFull, skill.Note].filter(Boolean);
    const italicLine = italicParts.length ? '<p><i>' + italicParts.join(' — ') + '</i></p>' : '';
    const description = (italicLine + (skill.Description || '')).trim();
    return [{ Name: skill.Name, Description: description, Link: normalized }];
  } catch (err) {
    return [];
  }
}

/** Returns a card for the info sidebar when link is a condition anchor. */
export function getConditionByLink(link) {
  try {
    const data = loadFile('tables');
    const conditions = data?.Conditions;
    if (!conditions || typeof link !== 'string' || !link.trim()) return [];
    const normalized = link.toLowerCase().trim().replace(/\s+/g, '-');
    const keyToSlug = k => k.toLowerCase().replace(/\s+/g, '-');
    let entry = Object.entries(conditions).find(([k]) => keyToSlug(k) === normalized);
    if (!entry && normalized === 'deafend') {
      entry = Object.entries(conditions).find(([k]) => k === 'Deafened');
    }
    if (!entry) return [];
    const [name, description] = entry;
    return [{ Name: name, Description: description || '', Link: link }];
  } catch (err) {
    return [];
  }
}

/** Optional rng: { nextFloat() } for deterministic choice. Always returns an index in [0, weights.length - 1]. */
export function weightedRandom(weights, rng) {
  if (!weights || weights.length === 0) return 0;
  const totalWeight = weights.reduce((acc, val) => acc + val, 0);
  const randomNum = totalWeight <= 0 ? 0 : (rng ? rng.nextFloat() : Math.random()) * totalWeight;
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (randomNum < sum) return i;
  }
  return weights.length - 1;
}

export function cap(string) {
  if (typeof string !== 'string' || string.length === 0) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function shopTypes() {
  const tables = loadFile('tables');
  return tables['Shop Types'].map(item => item.Name);
}

export function isMobile() {
  return window.innerWidth <= 760;
}

/** Format a number with thousands separator (') and optional decimals (e.g. 1'234.5). */
export function formatNumber(num) {
  const n = parseFloat(num);
  if (isNaN(n)) return '0';
  const [intPart, decPart] = n.toFixed(2).split('.');
  const sep = "'";
  const rev = intPart.split('').reverse().join('');
  const fmtInt = rev.match(/.{1,3}/g).join(sep).split('').reverse().join('');
  let decimals = '';
  if (decPart !== '00') {
    if (decPart[1] === '0') decimals = `.${decPart[0]}`;
    else decimals = `.${decPart}`;
  }
  return `${fmtInt}${decimals}`;
}

export function trimLine(string, endLine = 11) {
  if (string) {
    const dot = string.length > endLine ? '…' : '';
    return `${string.slice(0, endLine)}${dot}`;
  }
  return string;
}

export function order(list, element) {
  if (list != null && list.length > 0) {
    list = list.filter(item => item !== element);
    list.sort();
    return [element].concat(list);
  }
  return [];
}

export function newGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

export function serialize(obj) {
  return obj && typeof obj.serialize === 'function' ? obj.serialize() : obj;
}

/**
 * Get weapon type details (melee, ranged, two-handed, etc.)
 * @param {Object} weaponItem - The weapon data from items.json
 * @returns {Object} { isMelee, isRanged, isTwoHanded, isCompositeRanged }
 */
export function getWeaponType(weaponItem) {
  if (!weaponItem) return { isMelee: false, isRanged: false, isTwoHanded: false, isCompositeRanged: false };

  const subtype = (weaponItem.Subtype || '').toLowerCase();
  const isMelee = subtype.includes('melee');
  const isRanged = subtype.includes('ranged');
  const isTwoHanded = subtype.includes('two-handed');
  const isCompositeRanged = isRanged && (weaponItem.Name || '').toLowerCase().includes('composite');

  return { isMelee, isRanged, isTwoHanded, isCompositeRanged };
}

/**
 * Get the material symbol icon for a weapon (melee or ranged)
 * @param {Object} weaponItem - The weapon data
 * @returns {string} Material symbol name
 */
export function getWeaponIcon(weaponItem) {
  const { isRanged } = getWeaponType(weaponItem);
  return isRanged ? 'straight' : 'swords'; // straight arrow for ranged, swords for melee
}

/**
 * Calculate weapon attack bonus
 * @param {Player} player - The player object
 * @param {Object} weaponData - { itemData: equipment item, weaponItem: weapon from items.json }
 * @returns {number} The attack bonus
 */
export function calculateWeaponAttackBonus(player, weaponData) {
  if (!player || !weaponData) return 0;

  const { weaponItem } = weaponData;
  const weaponType = getWeaponType(weaponItem);
  const bab = player.getBaseAttackBonus?.() ?? 0;

  // Determine ability modifier (STR for melee, DEX for ranged)
  const abilityMod = weaponType.isRanged ? (player.getDexMod?.() ?? 0) : (player.getStrMod?.() ?? 0);

  // Weapon bonus: perfect weapons give +1 attack
  const weaponBonus = (weaponItem.isPerfect || weaponItem.Name?.toLowerCase().includes('perfect')) ? 1 : 0;

  return bab + abilityMod + weaponBonus;
}

/**
 * Calculate weapon damage string with bonuses
 * @param {Player} player - The player object
 * @param {Object} weaponData - { itemData: equipment item, weaponItem: weapon from items.json }
 * @returns {string} The damage string (e.g., "1d8+2")
 */
export function calculateWeaponDamage(player, weaponData) {
  if (!player || !weaponData) return '0';

  const { weaponItem, isTwoHanded } = weaponData;
  const weaponType = getWeaponType(weaponItem);

  // Get the base damage for medium creatures (or small if player is small)
  const size = player.getSize?.() ?? 'Medium';
  const baseDamage = size === 'Small' ? (weaponItem['Dmg (S)'] || '1d4') : (weaponItem['Dmg (M)'] || '1d6');

  // Calculate damage bonus
  let damageBonus = 0;

  if (weaponType.isMelee) {
    const strMod = player.getStrMod?.() ?? 0;
    if (isTwoHanded) {
      // Two-handed weapons get 1.5x STR modifier (rounded down)
      damageBonus = Math.floor(strMod * 1.5);
    } else {
      // One-handed weapons get full STR modifier
      damageBonus = strMod;
    }
  } else if (weaponType.isCompositeRanged) {
    // Composite ranged weapons (composite bow) can add STR modifier
    const strMod = player.getStrMod?.() ?? 0;
    damageBonus = Math.max(0, strMod); // Only positive bonuses for composite
  }

  // Perfect weapons give +1 damage bonus (except perfect ranged non-composite, which give 0)
  const isPerfect = weaponItem.isPerfect || (weaponItem.Name?.toLowerCase().includes('perfect'));
  if (isPerfect && (weaponType.isMelee || weaponType.isCompositeRanged)) {
    damageBonus += 1;
  }

  // Format the damage string
  if (damageBonus === 0) {
    return baseDamage;
  } else if (damageBonus > 0) {
    return `${baseDamage}+${damageBonus}`;
  } else {
    return `${baseDamage}${damageBonus}`; // negative already includes the minus sign
  }
}
