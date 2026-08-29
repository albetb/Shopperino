import { loadFile } from '../loadFile';

/**
 * Skill synergies: five ranks in one skill grant +2 to a related one.
 *
 * The pairings used to exist **only inside the `Description` prose** of 23 of
 * the 36 entries in skills.json, so nothing computed any of them and every
 * synergy a character had earned was missing from their totals. They are now a
 * structured `Synergies` array in that same file — data belongs in `src/data`,
 * not in a table in `src/lib` that would be a fourth place D&D facts live.
 *
 * Every core synergy is "5 ranks, +2", so neither number is stored per entry;
 * they are the constants below, and an entry that ever needs a different one
 * can carry `ranks` or `bonus` to override.
 *
 * An entry is one of three shapes:
 *  - `{ from, to }` — the whole target skill gains the bonus.
 *  - `{ from, to, when }` — real, but only for one use of the target, so it is
 *    reported beside the total rather than inside it. Same split the racial
 *    bonuses already make.
 *  - `{ from, toCheck }` — the target is a class check, not a skill row:
 *    wild empathy, bardic knowledge, a turning check.
 *
 * Stacking: two synergies into the same skill stack only when they come from
 * **different source skills**, which the data guarantees — each pairing appears
 * once. Diplomacy really can reach +6, from Bluff, Knowledge (nobility and
 * royalty) and Sense motive together.
 *
 * Rules: dnd-rules/skills.md → Synergy bonuses.
 */

/** Ranks the source skill needs. Every core synergy uses five. */
export const SYNERGY_RANKS = 5;

/** What a synergy is worth. Every core synergy is +2. */
export const SYNERGY_BONUS = 2;

const asArray = (value) => (Array.isArray(value) ? value : []);

const sameSkill = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

/** Every synergy entry, as stored. */
export function getAllSynergies() {
  return asArray(loadFile('skillsynergies'));
}

/** The ranks an entry needs, defaulting to the universal five. */
export function synergyRanks(entry) {
  const value = Number(entry?.ranks);
  return Number.isFinite(value) && value > 0 ? value : SYNERGY_RANKS;
}

/** What an entry is worth, defaulting to the universal +2. */
export function synergyBonus(entry) {
  const value = Number(entry?.bonus);
  return Number.isFinite(value) ? value : SYNERGY_BONUS;
}

/**
 * Synergies feeding one skill, split by whether they move the number.
 * @param {string} skillName as spelled in skills.json ('Sense motive').
 * @returns {{flat: Array, conditional: Array}}
 */
export function getSynergiesInto(skillName) {
  const flat = [];
  const conditional = [];
  getAllSynergies().forEach((entry) => {
    if (!sameSkill(entry?.to, skillName)) return;
    (entry.when ? conditional : flat).push(entry);
  });
  return { flat, conditional };
}

/**
 * Synergies feeding a class check rather than a skill row.
 * @param {string} checkKey 'wildEmpathy' | 'bardicKnowledge' | 'turnUndead'
 */
export function getSynergiesIntoCheck(checkKey) {
  const wanted = String(checkKey || '').trim().toLowerCase();
  if (!wanted) return [];
  return getAllSynergies()
    .filter((entry) => String(entry?.toCheck || '').trim().toLowerCase() === wanted);
}

/** Everything five ranks in this skill would unlock, for the source's own row. */
export function getSynergiesFrom(skillName) {
  return getAllSynergies().filter((entry) => sameSkill(entry?.from, skillName));
}
