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
  'Greater spell focus': 'school',
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

/**
 * Choice feats that can only be taken for a subject another feat already names.
 *
 * Greater Weapon Focus is *"choose one type of weapon for which you have already
 * selected Weapon Focus"* — the choice is not free, it is drawn from what an
 * earlier feat picked. Four feats work this way; the values are read as "the
 * choice must appear in every one of these", so Greater Weapon Specialization
 * needs one weapon carrying both of its prerequisites, not one of each.
 *
 * Keys and values are the exact names in feats.json. Prerequisites that are not
 * per-choice — a base attack bonus, a fighter level, proficiency with the weapon
 * — are not here; they stay with the non-blocking `prereq` pill, because they
 * say nothing about *which* subject is legal.
 */
const CHOICE_PREREQUISITE_FEATS = {
  'Greater spell focus': ['Spell focus'],
  'Greater weapon focus': ['Weapon focus'],
  'Weapon specialization': ['Weapon focus'],
  'Greater weapon specialization': ['Greater weapon focus', 'Weapon specialization'],
};

/** What a choice type is choosing, for use in a sentence. */
const CHOICE_SUBJECT = {
  exoticWeapon: 'weapon',
  martialWeapon: 'weapon',
  weapon: 'weapon',
  crossbow: 'crossbow',
  skill: 'skill',
  school: 'school',
};

/**
 * An unarmed strike is a legal choice for every weapon-choice feat and is one
 * of the commonest picks in the game, but it is not an item — items.json has
 * no entry for it — so it is added to the weapon list by hand.
 */
export const UNARMED_STRIKE = 'Unarmed strike';

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

  let options = getChoiceUniverse(type);

  // A dependent feat inherits its list from what its prerequisites already
  // chose, rather than offering every weapon or school in the game.
  for (const required of CHOICE_PREREQUISITE_FEATS[featName] ?? []) {
    const allowed = new Set(getTakenChoices(required, playerFeats));
    options = options.filter((c) => allowed.has(c));
  }

  return [...new Set(options)].filter((c) => !taken.has(c)).sort((a, b) => a.localeCompare(b));
}

/** Every choice a feat of this type could name, before any prerequisite narrows it. */
function getChoiceUniverse(type) {
  let options = [];
  if (type === 'exoticWeapon') {
    options = getWeaponsByCategory('Exotic Weapons');
  } else if (type === 'martialWeapon') {
    options = getWeaponsByCategory('Martial Weapons');
  } else if (type === 'weapon') {
    options = [UNARMED_STRIKE, ...getWeaponsByCategory(null)];
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
  }
  return options;
}

/** "a", "a and b", "a, b and c" — for feat names inside a sentence. */
function joinNames(names) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Why a choice feat has nothing left to offer.
 *
 * A dependent feat like Greater spell focus is only ever taken for a subject an
 * earlier feat already named, so a character without that earlier feat has an
 * empty list. The picker used to render nothing at all in that case, which
 * reads as a dead button — this is the sentence it shows instead.
 *
 * Three different things can be wrong, and they need different sentences: the
 * prerequisite feat is missing entirely, it is there but no single subject
 * carries all of them, or it is there and every eligible subject has already
 * been taken for this feat.
 *
 * @param {string} featName - Feat name (exact from feats.json)
 * @param {string[]} playerFeats - Player's feat list
 * @returns {string} Empty string when choices are available.
 */
export function getChoiceUnavailableReason(featName, playerFeats) {
  const type = REPEATABLE_WITH_CHOICE[featName];
  if (!type) return '';
  if (getChoicesForFeat(featName, playerFeats).length > 0) return '';

  const required = CHOICE_PREREQUISITE_FEATS[featName] ?? [];
  const subject = CHOICE_SUBJECT[type] ?? 'option';

  if (required.length > 0) {
    const universe = getChoiceUniverse(type);
    const chosenFor = (name) => getTakenChoices(name, playerFeats).filter((c) => universe.includes(c));

    const missing = required.filter((name) => chosenFor(name).length === 0);
    if (missing.length > 0) {
      return `No ${joinNames(missing)} feat selected — pick a ${subject} there first.`;
    }

    // Each prerequisite has been taken, but never for the same subject.
    const shared = required.reduce(
      (acc, name) => acc.filter((c) => chosenFor(name).includes(c)),
      universe
    );
    if (shared.length === 0) {
      return `No ${subject} has all of ${joinNames(required)} — they must name the same one.`;
    }

    return `Every ${subject} you have ${joinNames(required)} for already has ${featName.toLowerCase()}.`;
  }

  return `Every ${subject} is already taken for this feat.`;
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
 * Extract base feat name from a display string:
 * "Weapon focus (Longsword)" -> "Weapon focus".
 *
 * The parenthetical is only stripped when what is left is a feat that actually
 * takes a choice. Three real feats carry a parenthetical **in their own name** —
 * Armor proficiency (light), (medium) and (heavy) — and stripping theirs
 * collapsed all three onto one name: taking one hid the other two from the
 * picker and lost every one of them its description, because nothing in
 * feats.json is called "Armor proficiency".
 *
 * @param {string} displayName
 * @returns {string}
 */
export function getBaseFeatName(displayName) {
  if (!displayName || typeof displayName !== 'string') return '';
  const idx = displayName.indexOf(' (');
  if (idx > 0 && displayName.includes(')')) {
    const base = displayName.slice(0, idx).trim();
    if (REPEATABLE_WITH_CHOICE[base]) return base;
  }
  return displayName.trim();
}
