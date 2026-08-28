/**
 * Weapon, armor and shield proficiency.
 *
 * A character is proficient with what their class and race grant, plus what the
 * eight proficiency feats add. Being *non*-proficient is what costs something:
 *
 * - **Weapon**: −4 on attack rolls with it.
 * - **Armor / shield**: the armor check penalty applies to attack rolls and to
 *   every Strength- and Dexterity-based check, on top of its normal skill
 *   penalty. A shield's penalty stacks with the armor's.
 *
 * (equipment.md → Proficiency category, Armor categories.)
 *
 * None of this is enforced — the sheet applies the penalty the rules apply and
 * says where it came from, exactly as it does for encumbrance. It never stops
 * anyone equipping anything.
 *
 * The per-class lists come from classes.json (`weaponProficiency`,
 * `armorProficiency`) and the racial ones from races.json (`weaponProficiency`,
 * `weaponFamiliarity`). Shield proficiency is the one piece neither file holds,
 * so it is stated below.
 */

import { loadFile } from '../loadFile';

/** Attack penalty for using a weapon you are not proficient with. */
export const NON_PROFICIENT_ATTACK_PENALTY = -4;

/**
 * Shield proficiency per class — the one proficiency classes.json does not
 * carry. `armorProficiency` covers body armor only, and shields are a separate
 * grant in 3.5: most armored classes get shields but not tower shields, the
 * fighter and paladin get both, and the monk, rogue, sorcerer and wizard get
 * none. The druid's restriction is to *wooden* shields, which is a material
 * limit rather than a category and is not modelled here.
 */
const CLASS_SHIELD_PROFICIENCY = {
  Barbarian: 'shield',
  Bard: 'shield',
  Cleric: 'shield',
  Druid: 'shield',
  Fighter: 'tower',
  Monk: 'none',
  Paladin: 'tower',
  Ranger: 'shield',
  Rogue: 'none',
  Sorcerer: 'none',
  Wizard: 'none',
};

/** Armor categories, weakest first, so "proficient up to X" is a comparison. */
const ARMOR_RANK = { no: 0, none: 0, light: 1, medium: 2, heavy: 3 };

/** The armor proficiency feats, by the category each grants. */
const ARMOR_FEATS = {
  'armor proficiency (light)': 'light',
  'armor proficiency (medium)': 'medium',
  'armor proficiency (heavy)': 'heavy',
};

/**
 * The three list entries that stand for more than one weapon. Keyed by the
 * entry as written, lowercased — the parenthetical is the whole point of these,
 * so they are matched before `canonicalWeaponName` strips it. Every other entry
 * in both files is reachable by the comma-swap alone.
 */
const WEAPON_ALIASES = {
  'crossbow (light or heavy)': ['light crossbow', 'heavy crossbow'],
  'longbow (including composite longbow)': ['longbow', 'composite longbow'],
  'shortbow (including composite shortbow)': ['shortbow', 'composite shortbow'],
};

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * One spelling for a weapon, so a class list and items.json can be compared.
 *
 * The two files disagree about word order and punctuation in every direction:
 * items.json has "Crossbow, light", "Waraxe, dwarven", "Longbow, composite" and
 * — with no comma at all — "Sword short", while the class lists write "Light
 * crossbow", "Short sword". Sorting the words sidesteps the lot. Checked across
 * all 67 weapons and every class and race entry: **zero collisions, and every
 * entry resolves**, which no comma-swapping rule managed.
 */
export function canonicalWeaponName(name) {
  return normalize(name)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

/** Every weapon a class or race list entry stands for, in canonical form. */
function expandWeaponEntry(entry) {
  const bare = normalize(entry).replace(/\s+/g, ' ').trim();
  const aliases = WEAPON_ALIASES[bare];
  if (aliases) return aliases.map(canonicalWeaponName);
  return [canonicalWeaponName(entry)];
}

/** 'simple' | 'martial' | 'exotic' — from the weapon's items.json Category. */
export function getWeaponCategory(weaponItem) {
  const category = normalize(weaponItem?.Category);
  if (category.startsWith('simple')) return 'simple';
  if (category.startsWith('martial')) return 'martial';
  if (category.startsWith('exotic')) return 'exotic';
  return '';
}

function countsAsCategory(list, category) {
  return list.some((entry) => normalize(entry) === `${category} weapons`);
}

/** The named weapons a race hands over outright (the elf's four). */
function getRaceWeapons(race) {
  const data = loadFile('races');
  const entry = (data?.races ?? data)?.[race];
  return Array.isArray(entry?.weaponProficiency) ? entry.weaponProficiency : [];
}

/**
 * The exotic weapons a race is *familiar* with. Familiarity is not proficiency:
 * it makes the weapon count as a martial weapon for that race, so a dwarf is
 * proficient with a dwarven waraxe only if something gives them martial weapons.
 */
function getRaceFamiliarWeapons(race) {
  const data = loadFile('races');
  const entry = (data?.races ?? data)?.[race];
  return Array.isArray(entry?.weaponFamiliarity) ? entry.weaponFamiliarity : [];
}

function getClassEntry(cls) {
  const data = loadFile('classes');
  return (data?.classes ?? data)?.[cls] ?? null;
}

/** The choice stored on a feat: "Martial weapon proficiency (Longsword)". */
function featChoice(featName) {
  const match = String(featName ?? '').match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : '';
}

function featBase(featName) {
  const text = String(featName ?? '').trim();
  const idx = text.indexOf(' (');
  return idx > 0 && text.includes(')') ? text.slice(0, idx).trim() : text;
}

/**
 * Whether a character is proficient with one weapon.
 *
 * @param {{cls: string, race: string, feats: string[]}} who
 * @param {object} weaponItem - A weapon from items.json
 */
export function isProficientWithWeapon(who, weaponItem) {
  if (!weaponItem) return true;
  const feats = who?.feats ?? [];
  const wanted = canonicalWeaponName(weaponItem.Name);
  const category = getWeaponCategory(weaponItem);

  const classEntry = getClassEntry(who?.cls);
  const classList = Array.isArray(classEntry?.weaponProficiency) ? classEntry.weaponProficiency : [];

  // Whole categories, from the class list or the two category feats.
  const featBases = feats.map((f) => normalize(featBase(f)));
  const hasSimple = countsAsCategory(classList, 'simple')
    || featBases.includes('simple weapon proficiency');
  // Martial Weapon Proficiency is taken per weapon, so unlike the simple feat
  // it never grants the whole category — only a class list can.
  const hasMartial = countsAsCategory(classList, 'martial');

  if (category === 'simple' && hasSimple) return true;
  if (category === 'martial' && hasMartial) return true;

  // Named weapons: the class list, then the race's own grants.
  const named = [...classList, ...getRaceWeapons(who?.race)]
    .flatMap(expandWeaponEntry);
  if (named.includes(wanted)) return true;

  // Racial familiarity demotes an exotic weapon to martial for this character.
  if (category === 'exotic') {
    const familiar = getRaceFamiliarWeapons(who?.race).flatMap(expandWeaponEntry);
    if (familiar.includes(wanted) && hasMartial) return true;
  }

  // Finally the per-weapon feats, whichever category they name.
  return feats.some((f) => {
    const base = normalize(featBase(f));
    if (base !== 'martial weapon proficiency' && base !== 'exotic weapon proficiency') return false;
    return canonicalWeaponName(featChoice(f)) === wanted;
  });
}

/**
 * Whether a character is proficient with their own fist.
 *
 * An unarmed strike is a simple weapon, so anyone granted simple weapons is
 * trained in it — but it has no items.json entry of its own (the closest is the
 * gauntlet, a different weapon), and the monk names it explicitly rather than
 * taking the category. Both routes are checked here.
 *
 * A wizard is genuinely not proficient: their list names five weapons and no
 * category, so a punching wizard takes the -4 the rules give them.
 */
export function isProficientWithUnarmedStrike(who) {
  const classEntry = getClassEntry(who?.cls);
  const classList = Array.isArray(classEntry?.weaponProficiency) ? classEntry.weaponProficiency : [];
  if (countsAsCategory(classList, 'simple')) return true;
  const unarmed = canonicalWeaponName('Unarmed strike');
  if (classList.some((entry) => canonicalWeaponName(entry) === unarmed)) return true;
  return (who?.feats ?? []).some((f) => normalize(featBase(f)) === 'simple weapon proficiency');
}

/**
 * The heaviest armor category a character is proficient with.
 *
 * Feats are taken at face value: someone holding only Armor Proficiency (heavy)
 * is treated as proficient with everything below it too. The feats' own
 * prerequisite chain means that is always true in practice, and the sheet does
 * not enforce prerequisites anyway — reading it strictly would invent a state
 * no legal character can be in.
 */
export function getArmorProficiencyRank(who) {
  const classEntry = getClassEntry(who?.cls);
  let rank = ARMOR_RANK[normalize(classEntry?.armorProficiency)] ?? 0;
  (who?.feats ?? []).forEach((f) => {
    const granted = ARMOR_FEATS[normalize(f)];
    if (granted) rank = Math.max(rank, ARMOR_RANK[granted]);
  });
  return rank;
}

/** Whether a character can wear this armor without the non-proficiency penalty. */
export function isProficientWithArmor(who, armorItem) {
  if (!armorItem) return true;
  const needed = ARMOR_RANK[normalize(armorItem.Category)] ?? 0;
  return getArmorProficiencyRank(who) >= needed;
}

/** Whether a shield is a tower shield, which is its own proficiency. */
export function isTowerShield(shieldItem) {
  return /tower/i.test(String(shieldItem?.Name ?? shieldItem?.Link ?? ''));
}

/** Whether a character can carry this shield without the non-proficiency penalty. */
export function isProficientWithShield(who, shieldItem) {
  if (!shieldItem) return true;
  const feats = (who?.feats ?? []).map((f) => normalize(f));
  const fromClass = CLASS_SHIELD_PROFICIENCY[who?.cls] ?? 'none';
  const tower = fromClass === 'tower' || feats.includes('tower shield proficiency');
  if (isTowerShield(shieldItem)) return tower;
  return tower || fromClass === 'shield' || feats.includes('shield proficiency');
}
