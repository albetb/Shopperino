/**
 * The racial bonuses races.json already describes and nothing has ever read.
 *
 * Eight structured keys sit in that file unused — `racialSkillBonuses`,
 * `racialSaveBonuses`, `racialAttackBonuses`, `racialACBonuses`, `immunities`
 * and `illusionDCBonus` among them — while the same facts are duplicated as
 * prose in the race card and again in each race's `traits` array. This module
 * reads the structured half, which is the only one a number can be computed
 * from.
 *
 * **Flat versus conditional is the split that matters.** An elf's +2 on Listen
 * applies always and belongs inside the total; a dwarf's +2 on Appraise applies
 * only to stone and metal, and belongs beside the total as a situational note.
 * Every reader here reports which kind an entry is, and the caller decides.
 *
 * Rules: dnd-rules/races.md for the trait system; the per-race values are
 * src/data/races.json.
 */

import { loadFile } from '../loadFile';

/** Races are stored at the top level, but tolerate a `races` wrapper. */
function getRaceEntry(race) {
  const data = loadFile('races');
  return (data?.races ?? data)?.[race] ?? null;
}

/**
 * Racial skill bonuses.
 *
 * An entry with a `condition` applies only in that circumstance and is reported
 * as conditional; everything else is flat and belongs in the skill total.
 *
 * @param {string} race
 * @returns {Array<{skill: string, bonus: number, condition: string, flat: boolean}>}
 */
export function getRacialSkillBonuses(race) {
  const list = getRaceEntry(race)?.racialSkillBonuses;
  if (!Array.isArray(list)) return [];
  return list
    .filter((entry) => entry && entry.skill)
    .map((entry) => ({
      skill: String(entry.skill),
      bonus: Number(entry.bonus) || 0,
      condition: String(entry.condition ?? ''),
      flat: !entry.condition,
    }));
}

/** The flat racial bonus to one named skill, 0 when there is none. */
export function getFlatRacialSkillBonus(race, skillName) {
  if (!skillName) return 0;
  const wanted = String(skillName).trim().toLowerCase();
  return getRacialSkillBonuses(race)
    .filter((entry) => entry.flat && entry.skill.trim().toLowerCase() === wanted)
    .reduce((total, entry) => total + entry.bonus, 0);
}

/**
 * Racial saving throw bonuses.
 *
 * `racialSaveBonuses` is an object keyed by what the bonus applies against —
 * `poison`, `spellsAndSpellLike`, `enchantment`, `illusions`, `fear` — with the
 * single key `all` meaning every save unconditionally. Only `all` is flat; the
 * halfling is the one race that has it, at +1.
 *
 * @param {string} race
 * @returns {Array<{against: string, bonus: number, flat: boolean}>}
 */
export function getRacialSaveBonuses(race) {
  const map = getRaceEntry(race)?.racialSaveBonuses;
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map).map(([against, bonus]) => ({
    against,
    bonus: Number(bonus) || 0,
    flat: against === 'all',
  }));
}

/** The racial bonus applying to every saving throw, 0 for most races. */
export function getFlatRacialSaveBonus(race) {
  return getRacialSaveBonuses(race)
    .filter((entry) => entry.flat)
    .reduce((total, entry) => total + entry.bonus, 0);
}

/**
 * Racial attack bonuses. Every one of these is against a named kind of
 * creature or a kind of weapon, so none is ever flat.
 *
 * @param {string} race
 * @returns {Array<{against: string, bonus: number}>}
 */
export function getRacialAttackBonuses(race) {
  const list = getRaceEntry(race)?.racialAttackBonuses;
  if (!Array.isArray(list)) return [];
  return list
    .filter((entry) => entry && entry.against)
    .map((entry) => ({ against: String(entry.against), bonus: Number(entry.bonus) || 0 }));
}

/**
 * Racial armor class bonuses — the +4 dodge against giants that the dwarf and
 * the gnome share. Conditional by definition, and typed `dodge`.
 *
 * @param {string} race
 * @returns {Array<{against: string, bonus: number, type: string}>}
 */
export function getRacialACBonuses(race) {
  const list = getRaceEntry(race)?.racialACBonuses;
  if (!Array.isArray(list)) return [];
  return list
    .filter((entry) => entry && entry.against)
    .map((entry) => ({
      against: String(entry.against),
      bonus: Number(entry.bonus) || 0,
      type: String(entry.type ?? ''),
    }));
}

/** What a race is outright immune to — sleep, for the elf and half-elf. */
export function getRacialImmunities(race) {
  const list = getRaceEntry(race)?.immunities;
  return Array.isArray(list) ? list.map((entry) => String(entry)) : [];
}

/**
 * The gnome's +1 to the save DC of illusion spells they cast. The only race
 * with one, and it finally has somewhere to land now that the spellbook shows
 * a save DC at all.
 */
export function getRacialIllusionDcBonus(race) {
  return Number(getRaceEntry(race)?.illusionDCBonus) || 0;
}
