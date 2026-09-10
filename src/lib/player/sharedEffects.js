/**
 * Effects one character hands another.
 *
 * A bard's music is the first of them, and it is the reason this table looks
 * the way it does: the bonus lands on somebody else's sheet, so the *receiving*
 * character has to be able to compute it from what fits in a QR code. What
 * travels is an id, a number and sometimes a skill — never the arithmetic, and
 * never a translated word. Both phones read the same table below and each one
 * names it in its own language.
 *
 * The `{ statKey: [value, type] }` shape is the one `potionEffects.js` and
 * `wornEffects.js` already speak, so a shared effect rides the same rail into
 * `Player.getSharedEffectContributions` that a drunk potion rides into
 * `getPotionContributions` — every total and every breakdown that already
 * counts a potion counts this too.
 *
 * What is *not* in `stats` is as deliberate as what is. Inspire courage's save
 * bonus applies against charm and fear only, and the sheet cannot know what it
 * is saving against, so it is a situational note beside the three saves rather
 * than a number inside them. Inspire greatness's two bonus Hit Dice are rolled
 * temporary hit points, not a change to the maximum, so they are a note too.
 *
 * Rules: dnd-rules/class-features.md (bardic music), dnd-rules/combat.md for
 * which AC numbers a dodge bonus reaches.
 */
import { T, AC_DODGE, SAVES } from '../item/effectSchema';
import { named } from './contributions';

/**
 * One entry per shareable effect.
 *
 * - `name` is the English name, which is the key `names.json` answers to and
 *   the id that travels is *not*: the id is stable, the name is a word.
 * - `scaled` marks an effect whose size the sharer's own level decides.
 * - `needsSkill` marks one that has to be pointed at a skill before it means
 *   anything.
 * - `stats(entry)` and `situational(entry)` are read with the stored entry, so
 *   both see the bonus and the chosen skill.
 */
export const SHARED_EFFECTS = {
  inspireCourage: {
    id: 'inspireCourage',
    name: 'Inspire courage',
    feature: 'Bardic music',
    scaled: true,
    stats: ({ bonus }) => ({
      attack: [bonus, T.MORALE],
      damage: [bonus, T.MORALE],
    }),
    situational: ({ bonus }) => SAVES.map((save) => [
      save, ['+{0} morale against charm and fear', bonus],
    ]),
    summary: ({ bonus }) => [
      '+{0} morale on attack rolls and weapon damage, and on saves against charm and fear',
      bonus,
    ],
  },

  inspireCompetence: {
    id: 'inspireCompetence',
    name: 'Inspire competence',
    feature: 'Bardic music',
    needsSkill: true,
    stats: ({ skill }) => (skill ? { [`skill:${skill}`]: [2, T.COMPETENCE] } : {}),
    summary: ({ skill }) => ['+2 competence on {0}', named('skills', skill)],
  },

  inspireGreatness: {
    id: 'inspireGreatness',
    name: 'Inspire greatness',
    feature: 'Bardic music',
    stats: () => ({
      attack: [2, T.COMPETENCE],
      fortitude: [1, T.MORALE],
    }),
    /* The two bonus Hit Dice are d10s of *temporary* hit points, rolled with
       the Constitution modifier on each — a number this sheet cannot know and
       must not invent, so it is said rather than added. */
    situational: () => [[
      'maxHp', '+2 Hit Dice of temporary hit points (2d10, plus the Constitution modifier on each)',
    ]],
    summary: () => '+2 competence on attack rolls, +1 morale on Fortitude, and 2 bonus Hit Dice of temporary hit points',
  },

  inspireHeroism: {
    id: 'inspireHeroism',
    name: 'Inspire heroism',
    feature: 'Bardic music',
    stats: () => ({
      fortitude: [4, T.MORALE],
      reflex: [4, T.MORALE],
      will: [4, T.MORALE],
      /* A dodge bonus is lost with Dexterity, so it reaches AC and touch AC
         and stops at flat-footed. */
      ...Object.fromEntries(AC_DODGE.map((key) => [key, [4, T.DODGE]])),
    }),
    summary: () => '+4 morale on every saving throw and +4 dodge to AC',
  },
};

/** Every effect that can be shared, in the order they are learned. */
export const SHAREABLE_EFFECT_IDS = Object.keys(SHARED_EFFECTS);

/** The catalogue entry a performance's English name belongs to, if any. */
export function sharedEffectForFeature(name) {
  const wanted = String(name ?? '').trim().toLowerCase();
  return Object.values(SHARED_EFFECTS).find((e) => e.name.toLowerCase() === wanted) || null;
}

const clampBonus = (n) => Math.max(0, Math.min(20, Math.floor(Number(n) || 0)));

/**
 * Fill in an entry as it will be stored and shared: the id, the size the
 * sharer's level gives it, the skill it was pointed at, and who it came from.
 *
 * The sharer's name rides along because a pill saying "Inspire courage" twice
 * tells the reader nothing, and two bards in a party is not unusual.
 */
export function makeSharedEffect(id, { bonus = 0, skill = '', from = '' } = {}) {
  const entry = SHARED_EFFECTS[id];
  if (!entry) return null;
  const out = { id };
  if (entry.scaled) out.bonus = clampBonus(bonus) || 1;
  if (entry.needsSkill && skill) out.skill = String(skill);
  if (from) out.from = String(from);
  return out;
}

/**
 * A stored entry with its table row resolved.
 *
 * @returns {{id, name, feature, bonus, skill, from, stats, situational,
 *   summary}|null} null when the id is not one this build knows — a code from
 *   a newer version of the app should be refused, not half-applied.
 */
export function resolveSharedEffect(stored) {
  const entry = stored && SHARED_EFFECTS[stored.id];
  if (!entry) return null;
  const filled = {
    id: entry.id,
    bonus: entry.scaled ? (clampBonus(stored.bonus) || 1) : 0,
    skill: entry.needsSkill ? String(stored.skill || '') : '',
    from: String(stored.from || ''),
  };
  return {
    ...filled,
    name: entry.name,
    feature: entry.feature,
    needsSkill: Boolean(entry.needsSkill),
    scaled: Boolean(entry.scaled),
    stats: entry.stats(filled) || {},
    situational: (entry.situational ? entry.situational(filled) : []) || [],
    summary: entry.summary(filled),
  };
}
