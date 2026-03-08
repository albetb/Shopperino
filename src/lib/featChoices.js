/**
 * Feat choice utilities for repeatable feats with/without choice.
 * Uses exact names from feats.json (lowercase).
 */

import { loadFile } from './loadFile';
import { MAGICSCHOOLS } from './spellbook';

/** Feats that can be taken multiple times with no choice each time. */
export const REPEATABLE_NO_CHOICE = ['Extra turning', 'Toughness'];

/** Feat name -> choice type for repeatable feats requiring a choice. */
export const REPEATABLE_WITH_CHOICE = {
  'Exotic weapon proficiency': 'exoticWeapon',
  'Greater spell focus': 'greaterSpellFocus',
  'Greater weapon focus': 'weapon',
  'Greater weapon specialization': 'weapon',
  'Improved critical': 'weapon',
  'Martial weapon proficiency': 'martialWeapon',
  'Rapid reload': 'crossbow',
  'Skill focus': 'skill',
  'Spell focus': 'school',
  'Weapon focus': 'weapon',
  'Weapon specialization': 'weapon',
};

const SPELL_SCHOOLS = (MAGICSCHOOLS || []).filter((s) => s !== 'Universal');

function getWeaponsByCategory(category) {
  const items = loadFile('items');
  const arr = items?.Weapon;
  if (!Array.isArray(arr)) return [];
  if (!category) return arr.map((w) => w?.Name).filter(Boolean);
  return arr
    .filter((w) => w?.Category === category)
    .map((w) => w?.Name)
    .filter(Boolean);
}

function getCrossbowWeapons() {
  const items = loadFile('items');
  const arr = items?.Weapon;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((w) => w?.Name && /crossbow/i.test(w.Name))
    .map((w) => w.Name);
}

function getSkills() {
  const data = loadFile('skills');
  const arr = data?.Skills ?? (Array.isArray(data) ? data : []);
  return arr.map((s) => s?.Name).filter(Boolean);
}

/**
 * Get choices already taken for a feat from player feats.
 * @param {string} featName - Feat name (e.g. "Weapon focus")
 * @param {string[]} playerFeats - Player's feat list
 * @returns {string[]} Choices already taken
 */
function getTakenChoices(featName, playerFeats) {
  const prefix = featName + ' (';
  return (playerFeats || [])
    .filter((f) => typeof f === 'string' && f.startsWith(prefix) && f.includes(')'))
    .map((f) => {
      const match = f.match(/\(([^)]+)\)\s*$/);
      return match ? match[1].trim() : '';
    })
    .filter(Boolean);
}

/**
 * Get available choices for a feat, excluding already taken.
 * @param {string} featName - Feat name (exact from feats.json)
 * @param {string[]} playerFeats - Player's feat list
 * @returns {string[]}
 */
export function getChoicesForFeat(featName, playerFeats) {
  const type = REPEATABLE_WITH_CHOICE[featName];
  if (!type) return [];

  const taken = new Set(getTakenChoices(featName, playerFeats));

  let options = [];
  if (type === 'exoticWeapon') {
    options = getWeaponsByCategory('Exotic Weapons');
  } else if (type === 'martialWeapon') {
    options = getWeaponsByCategory('Martial Weapons');
  } else if (type === 'weapon') {
    options = getWeaponsByCategory(null);
  } else if (type === 'crossbow') {
    options = getCrossbowWeapons();
  } else if (type === 'skill') {
    const skills = getSkills();
    for (const s of skills) {
      if (s === 'Knowledge') {
        for (const sub of ['arcana', 'architecture and engineering', 'dungeoneering', 'geography', 'history', 'local', 'nature', 'nobility and royalty', 'religion', 'the planes']) {
          options.push(`Knowledge (${sub})`);
        }
      } else {
        options.push(s);
      }
    }
  } else if (type === 'school') {
    options = [...SPELL_SCHOOLS];
  } else if (type === 'greaterSpellFocus') {
    const spellFocusTaken = getTakenChoices('Spell focus', playerFeats);
    options = spellFocusTaken.filter((s) => SPELL_SCHOOLS.includes(s));
    const gsfTaken = getTakenChoices('Greater spell focus', playerFeats);
    options = options.filter((s) => !gsfTaken.includes(s));
  }

  return [...new Set(options)].filter((c) => !taken.has(c)).sort((a, b) => a.localeCompare(b));
}

/**
 * Check if there are choices remaining for a repeatable choice feat.
 * @param {string} featName
 * @param {string[]} playerFeats
 * @returns {boolean}
 */
export function hasChoicesRemaining(featName, playerFeats) {
  return getChoicesForFeat(featName, playerFeats).length > 0;
}

/**
 * Format feat with choice for storage.
 * @param {string} featName
 * @param {string} choice
 * @returns {string}
 */
export function formatFeatWithChoice(featName, choice) {
  if (!featName || !choice) return featName || '';
  return `${featName} (${choice})`;
}

/**
 * Extract base feat name from display string (e.g. "Weapon focus (Longsword)" -> "Weapon focus").
 * @param {string} displayName
 * @returns {string}
 */
export function getBaseFeatName(displayName) {
  if (!displayName || typeof displayName !== 'string') return '';
  const idx = displayName.indexOf(' (');
  if (idx > 0 && displayName.includes(')')) {
    return displayName.slice(0, idx).trim();
  }
  return displayName.trim();
}
