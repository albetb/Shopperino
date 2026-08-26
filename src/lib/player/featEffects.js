/**
 * Mechanical effects of feats, as flat numbers the sheet can add to a value it
 * already shows.
 *
 * Only feats whose benefit is a **fixed bonus to a stat the sheet displays**
 * live here. A feat whose benefit depends on the situation ("+1 dodge AC
 * against one designated opponent", "+4 on Concentration when casting
 * defensively", "+4 on the opposed Strength check to bull rush") has no honest
 * home in a headline number and is deliberately absent — see
 * obsidian-vault/docs/feature_backlog.md item 3 for the presentation question
 * those raise.
 *
 * Every bonus here is untyped, so repeated instances stack (Toughness taken
 * three times is +9 hp) and nothing needs stacking-by-type arbitration.
 *
 * Rules: dnd-rules/feats.md for the system; the per-feat numbers come from
 * src/data/feats.json.
 */

import { getBaseFeatName, UNARMED_STRIKE } from '../featChoices';

/** Feats granting +2 to a pair of skills. Keyed by the exact feats.json name. */
export const SKILL_PAIR_FEATS = {
  'Acrobatic': ['Jump', 'Tumble'],
  'Agile': ['Balance', 'Escape artist'],
  'Alertness': ['Listen', 'Spot'],
  'Animal affinity': ['Handle animal', 'Ride'],
  'Athletic': ['Climb', 'Swim'],
  'Deceitful': ['Disguise', 'Forgery'],
  'Deft hands': ['Sleight of hand', 'Use rope'],
  'Diligent': ['Appraise', 'Decipher script'],
  'Investigator': ['Gather information', 'Search'],
  'Magical aptitude': ['Spellcraft', 'Use magic device'],
  'Negotiator': ['Diplomacy', 'Sense motive'],
  'Nimble fingers': ['Disable device', 'Open lock'],
  'Persuasive': ['Bluff', 'Intimidate'],
  'Self-sufficient': ['Heal', 'Survival'],
  'Stealthy': ['Hide', 'Move silently'],
};

const SKILL_PAIR_BONUS = 2;
const SKILL_FOCUS_BONUS = 3;
const SAVE_FEAT_BONUS = 2;
const IMPROVED_INITIATIVE_BONUS = 4;
const TOUGHNESS_HP = 3;
const EXTRA_TURNING_ATTEMPTS = 4;
const WEAPON_FOCUS_ATTACK = 1;
const WEAPON_SPECIALIZATION_DAMAGE = 2;

/** Save feats, by the save they lift. */
const SAVE_FEATS = {
  fortitude: 'Great fortitude',
  reflex: 'Lightning reflexes',
  will: 'Iron will',
};

/**
 * Weapons Weapon Finesse applies to: anything light, plus the few one-handed
 * weapons the SRD calls out by name in their own description.
 */
const FINESSE_NAMED_WEAPONS = ['rapier', 'whip', 'spiked chain'];

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/** The choice inside a stored feat name: "Weapon focus (Longsword)" → "Longsword". */
function getFeatChoice(displayName) {
  if (typeof displayName !== 'string') return '';
  const match = displayName.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : '';
}

/** How many times a feat appears, counting every repeat. */
function countFeat(feats, featName) {
  const wanted = normalize(featName);
  return (feats || []).filter((f) => normalize(getBaseFeatName(f)) === wanted).length;
}

/**
 * How many times a feat appears with a given choice — "Weapon focus" taken for
 * a longsword does nothing for the dagger in the other hand.
 */
function countFeatForChoice(feats, featName, choice) {
  const wantedFeat = normalize(featName);
  const wantedChoice = normalize(choice);
  if (!wantedChoice) return 0;
  return (feats || []).filter((f) => (
    normalize(getBaseFeatName(f)) === wantedFeat && normalize(getFeatChoice(f)) === wantedChoice
  )).length;
}

/**
 * Feat bonus to one skill: the +2 pair feats plus +3 for each Skill Focus
 * taken in it. Skill Focus stores its choice, so "Skill focus (Tumble)" lifts
 * Tumble alone.
 */
export function getFeatSkillBonus(feats, skillName) {
  if (!Array.isArray(feats) || !feats.length || !skillName) return 0;
  const wanted = normalize(skillName);
  let total = 0;

  Object.entries(SKILL_PAIR_FEATS).forEach(([featName, skills]) => {
    if (!skills.some((s) => normalize(s) === wanted)) return;
    total += SKILL_PAIR_BONUS * countFeat(feats, featName);
  });

  total += SKILL_FOCUS_BONUS * countFeatForChoice(feats, 'Skill focus', skillName);
  return total;
}

/**
 * Feat bonus to one saving throw. `which` is 'fortitude', 'reflex' or 'will'.
 */
export function getFeatSaveBonus(feats, which) {
  const featName = SAVE_FEATS[which];
  if (!featName) return 0;
  return SAVE_FEAT_BONUS * countFeat(feats, featName);
}

/** Improved Initiative: +4 on initiative checks. */
export function getFeatInitiativeBonus(feats) {
  return IMPROVED_INITIATIVE_BONUS * countFeat(feats, 'Improved initiative');
}

/** Toughness: +3 hit points, and it may be taken more than once. */
export function getFeatHpBonus(feats) {
  return TOUGHNESS_HP * countFeat(feats, 'Toughness');
}

/**
 * Attack bonus for one weapon: +1 from Weapon Focus and +1 more from Greater
 * Weapon Focus, each only for the weapon it was selected for.
 */
export function getFeatWeaponAttackBonus(feats, weaponName) {
  const focus = countFeatForChoice(feats, 'Weapon focus', weaponName);
  const greater = countFeatForChoice(feats, 'Greater weapon focus', weaponName);
  return WEAPON_FOCUS_ATTACK * (focus + greater);
}

/**
 * Damage bonus for one weapon: +2 from Weapon Specialization and +2 more from
 * Greater Weapon Specialization, for that weapon only.
 */
export function getFeatWeaponDamageBonus(feats, weaponName) {
  const spec = countFeatForChoice(feats, 'Weapon specialization', weaponName);
  const greater = countFeatForChoice(feats, 'Greater weapon specialization', weaponName);
  return WEAPON_SPECIALIZATION_DAMAGE * (spec + greater);
}

/** Whether the character has Weapon Finesse. */
export function hasWeaponFinesse(feats) {
  return countFeat(feats, 'Weapon finesse') > 0;
}

/**
 * Whether Weapon Finesse can apply to a weapon: light melee weapons, plus the
 * rapier, whip and spiked chain, which say so in their own entries. Ranged
 * weapons already use Dexterity and are excluded. An unarmed strike also
 * counts as a light weapon (combat-maneuvers.md), but it has no weapon entry,
 * so the punch line asks `hasWeaponFinesse` directly.
 */
export function isFinesseWeapon(weaponItem) {
  if (!weaponItem) return false;
  const name = normalize(weaponItem.Name);
  if (FINESSE_NAMED_WEAPONS.some((w) => name === w || name.startsWith(`${w},`))) return true;
  return /light melee/i.test(weaponItem.Subtype || '');
}

/**
 * Attack bonus a Weapon Focus taken in unarmed strike gives the fist. An
 * unarmed strike is a legal choice for the weapon feats but has no items.json
 * entry, so it is matched by name rather than through a weapon object.
 */
export function getFeatUnarmedAttackBonus(feats) {
  return getFeatWeaponAttackBonus(feats, UNARMED_STRIKE);
}

/** The same for Weapon Specialization taken in unarmed strike. */
export function getFeatUnarmedDamageBonus(feats) {
  return getFeatWeaponDamageBonus(feats, UNARMED_STRIKE);
}

/** Extra Turning: four more turn attempts per day, per time it was taken. */
export function getFeatTurnUndeadAttempts(feats) {
  return EXTRA_TURNING_ATTEMPTS * countFeat(feats, 'Extra turning');
}

/** Improved Turning: turn as though one level higher. Not repeatable. */
export function getFeatTurnUndeadLevelBonus(feats) {
  return countFeat(feats, 'Improved turning') > 0 ? 1 : 0;
}
