import { loadFile } from '../loadFile';
import { getSpellByLink } from '../spellbook/spellsUtils';
/* The bonus-type names, the AC groupings and `spread` are shared with
   wornEffects.js — one copy of "which AC numbers does an armor bonus reach". */
import { T, AC_ALL, AC_WORN, AC_DODGE, SAVES, spread } from './effectSchema';

/**
 * What drinking a potion actually does to the sheet.
 *
 * A potion in [items.json](../../data/items.json) carries no description at
 * all: its `Link` **is** the spell's link, and the effect text comes from
 * [spells.json](../../data/spells.json). So this module is not a parser — it is
 * the one place that says, per spell, which of the sheet's numbers the effect
 * moves and by how much. All 107 potions resolve to **70 distinct links**, which
 * is small enough to state outright and far more trustworthy than reading
 * bonuses back out of English prose.
 *
 * **Three outcomes, because the potions genuinely differ.**
 * - `buff` — the effect maps onto stats the sheet computes, so it becomes
 *   contributions and shows up in the breakdown box beside everything else.
 * - `condition` — nothing here moves a number the sheet owns (*water breathing*,
 *   *nondetection*, energy resistance). It becomes a named pill instead, so the
 *   table can see it is running without the sheet pretending to model it.
 * - `oil` — applied to an object rather than drunk, so it needs a target before
 *   it can do anything. `target` says what kind of object is eligible.
 *
 * `cure` and `heal` are `buff` variants that act once and leave nothing behind.
 *
 * Rules: dnd-rules/magic-items.md for potions and their caster level,
 * dnd-rules/magic.md for how the bonus types stack, dnd-rules/movement.md for
 * the size categories *enlarge/reduce person* move between.
 */

/* Ordered small→large. Enlarge person moves one step up this list, reduce
   person one step down; everything size touches (AC, attack, unarmed damage,
   carrying capacity) already reads Player.getSize(), so shifting the category
   is enough to move all of them at once. */
export const SIZE_ORDER = Object.freeze([
  'Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal',
]);

/** Shift a size category by `step` places, clamped to the ends of the ladder. */
export function shiftSize(size, step) {
  const index = SIZE_ORDER.indexOf(size);
  if (index < 0) return size;
  const moved = Math.min(SIZE_ORDER.length - 1, Math.max(0, index + (Number(step) || 0)));
  return SIZE_ORDER[moved];
}


/* Protection from X and magic circle against X are the same numbers at two
   radii, across four alignments — eight of the 107 potions. Generated rather
   than written out eight times, so the four cannot drift apart. */
function alignmentWards() {
  const out = {};
  ['evil', 'good', 'chaos', 'law'].forEach((side) => {
    const stats = { ...spread(AC_ALL, 2, T.DEFLECTION), ...spread(SAVES, 2, T.RESISTANCE) };
    const situational = `The bonuses apply only against ${side} foes. Also counters mind control and hedges out summoned ${side} creatures`;
    out[`protection-from-${side}`] = {
      kind: 'buff', label: `Protection from ${side}`, stats, situational,
    };
    out[`magic-circle-against-${side}`] = {
      kind: 'buff', label: `Magic circle against ${side}`, stats,
      situational: `${situational}. 10-ft radius`,
    };
  });
  return out;
}

/**
 * The table. Keyed by the potion's `Link`, which is the spell's link.
 *
 * `amountFromName` means the size of the bonus is written into the item name
 * ("Potion of Barkskin +3", "Oil of Greater magic weapon +2") rather than fixed
 * by the spell — those gradings are separate items sharing one link, and the
 * grade is the only thing that differs between them.
 */
export const POTION_EFFECTS = Object.freeze({
  // —— Healing ——
  'cure-light-wounds':    { kind: 'heal', label: 'Cure light wounds',    dice: { expr: '1d8', perLevel: 1, maxBonus: 5 } },
  'cure-moderate-wounds': { kind: 'heal', label: 'Cure moderate wounds', dice: { expr: '2d8', perLevel: 1, maxBonus: 10 } },
  'cure-serious-wounds':  { kind: 'heal', label: 'Cure serious wounds',  dice: { expr: '3d8', perLevel: 1, maxBonus: 15 } },

  // —— Ability enhancement ——
  'bulls-strength':  { kind: 'buff', label: 'Bull’s strength',  stats: { str: [4, T.ENHANCEMENT] } },
  'bears-endurance': { kind: 'buff', label: 'Bear’s endurance', stats: { con: [4, T.ENHANCEMENT] } },
  'cats-grace':      { kind: 'buff', label: 'Cat’s grace',      stats: { dex: [4, T.ENHANCEMENT] } },
  'eagles-splendor': { kind: 'buff', label: 'Eagle’s splendor', stats: { cha: [4, T.ENHANCEMENT] } },
  'foxs-cunning':    { kind: 'buff', label: 'Fox’s cunning',    stats: { int: [4, T.ENHANCEMENT] } },
  'owls-wisdom':     { kind: 'buff', label: 'Owl’s wisdom',     stats: { wis: [4, T.ENHANCEMENT] } },

  // —— Armor class ——
  'mage-armor':      { kind: 'buff', label: 'Mage armor', stats: spread(AC_WORN, 4, T.ARMOR) },
  'barkskin':        { kind: 'buff', label: 'Barkskin', amountFromName: true, acGroup: AC_WORN, acType: T.NATURAL },
  'shield-of-faith': { kind: 'buff', label: 'Shield of faith', amountFromName: true, acGroup: AC_ALL, acType: T.DEFLECTION },

  // —— Protection from / magic circle against an alignment ——
  ...alignmentWards(),

  // —— Broad morale buffs ——
  aid: {
    kind: 'buff',
    label: 'Aid',
    stats: { attack: [1, T.MORALE] },
    dice: { expr: '1d8', perLevel: 1, maxBonus: 10, into: 'tempHp' },
    situational: '+1 morale bonus on saving throws against fear',
  },
  heroism: {
    kind: 'buff',
    label: 'Heroism',
    stats: { attack: [2, T.MORALE], ...spread(SAVES, 2, T.MORALE), skillsAll: [2, T.MORALE] },
  },
  'good-hope': {
    kind: 'buff',
    label: 'Good hope',
    stats: {
      attack: [2, T.MORALE], damage: [2, T.MORALE],
      ...spread(SAVES, 2, T.MORALE), skillsAll: [2, T.MORALE],
    },
  },
  rage: {
    kind: 'buff',
    label: 'Rage',
    stats: {
      str: [2, T.MORALE], con: [2, T.MORALE], will: [1, T.MORALE],
      ...spread(AC_ALL, -2, T.UNTYPED),
    },
  },
  haste: {
    kind: 'buff',
    label: 'Haste',
    stats: {
      attack: [1, T.UNTYPED], reflex: [1, T.DODGE], speed: [30, T.ENHANCEMENT],
      ...spread(AC_DODGE, 1, T.DODGE),
    },
    situational: 'One extra attack at the full attack bonus as part of a full attack action',
  },
  jump: { kind: 'buff', label: 'Jump', stats: { 'skill:Jump': [10, T.ENHANCEMENT] } },

  // —— Size ——
  'enlarge-person': {
    kind: 'buff',
    label: 'Enlarge person',
    size: 1,
    stats: { str: [2, T.SIZE], dex: [-2, T.SIZE] },
    situational: 'Reach increases by 5 ft, and the damage die of every wielded weapon steps up',
  },
  'reduce-person': {
    kind: 'buff',
    label: 'Reduce person',
    size: -1,
    stats: { str: [-2, T.SIZE], dex: [2, T.SIZE] },
    situational: 'Reach decreases by 5 ft, and the damage die of every wielded weapon steps down',
  },

  // —— Natural weapons: the wild-shaped druid's own form, and her companion ——
  'magic-fang': {
    kind: 'buff', label: 'Magic fang', natural: true,
    stats: { naturalAttack: [1, T.ENHANCEMENT], naturalDamage: [1, T.ENHANCEMENT] },
  },
  'greater-magic-fang': {
    kind: 'buff', label: 'Greater magic fang', natural: true, amountFromName: true,
    naturalGroup: ['naturalAttack', 'naturalDamage'], naturalType: T.ENHANCEMENT,
  },

  // —— Oils: applied to an object, never drunk ——
  'magic-weapon':         { kind: 'oil', label: 'Magic weapon',         target: 'weapon', item: { attack: [1, T.ENHANCEMENT], damage: [1, T.ENHANCEMENT] } },
  'greater-magic-weapon': { kind: 'oil', label: 'Greater magic weapon', target: 'weapon', amountFromName: true, itemGroup: ['attack', 'damage'], itemType: T.ENHANCEMENT },
  shillelagh:             { kind: 'oil', label: 'Shillelagh',           target: 'weapon', item: { attack: [1, T.ENHANCEMENT], damage: [1, T.ENHANCEMENT] }, situational: 'Only a club or a quarterstaff, and its damage becomes 1d10' },
  'keen-edge':            { kind: 'oil', label: 'Keen edge',            target: 'weapon', situational: 'Doubles the threat range of the weapon. Does not stack with the keen property' },
  'bless-weapon':         { kind: 'oil', label: 'Bless weapon',         target: 'weapon', situational: 'Hits against evil foes confirm criticals automatically, and the weapon counts as good-aligned' },
  'magic-stone':          { kind: 'oil', label: 'Magic stone',          target: 'ammo',   item: { attack: [1, T.ENHANCEMENT] }, situational: 'Three stones, each dealing 1d6+1 damage' },
  'flame-arrow':          { kind: 'oil', label: 'Flame arrow',          target: 'ammo',   situational: 'Each hit deals an extra 1d6 fire damage' },
  'magic-vestment':       { kind: 'oil', label: 'Magic vestment',       target: 'armor',  amountFromName: true, itemGroup: ['armorBonus'], itemType: T.ENHANCEMENT },
  darkness:               { kind: 'oil', label: 'Darkness',             target: 'any',    situational: 'The object sheds a 20-ft radius of supernatural shadow' },
  daylight:               { kind: 'oil', label: 'Daylight',             target: 'any',    situational: 'The object sheds bright light in a 60-ft radius' },

  // —— Cures: they take something away rather than adding to it ——
  'remove-paralysis':          { kind: 'cure', label: 'Remove paralysis',          clears: ['Paralyzed'] },
  'remove-blindness-deafness': { kind: 'cure', label: 'Remove blindness/deafness', clears: ['Blinded', 'Deafened'] },
  'remove-fear':               { kind: 'cure', label: 'Remove fear',               clears: ['Shaken', 'Frightened', 'Panicked'], situational: '+4 morale bonus on saving throws against fear for 10 minutes' },
  'neutralize-poison':         { kind: 'cure', label: 'Neutralize poison',         clears: ['Nauseated', 'Sickened'], situational: 'Ability damage the poison has already dealt is not repaired — that is lesser restoration' },
  'lesser-restoration':        { kind: 'cure', label: 'Lesser restoration',        repairs: 'Ability Damaged', dice: { expr: '1d4' } },
  'remove-disease':            { kind: 'cure', label: 'Remove disease',            situational: 'Cures every disease affecting the subject. The sheet does not track diseases, so no number changes' },
  'remove-curse':              { kind: 'cure', label: 'Remove curse',              situational: 'Frees the subject from one curse. The sheet does not track curses, so no number changes' },

  // —— A condition the sheet already models, so drinking it adds the real one ——
  invisibility: { kind: 'condition', label: 'Invisibility', adds: 'Invisible' },

  /* —— Five wondrous items that are potions in everything but their filing ——
     An elixir is drunk, lasts an hour and is gone; the salve is smeared on and
     lasts eight. That is this card's shape exactly, not an equipment slot's —
     so they live here rather than in wornEffects.js. items.json files them
     under `Wondrous Item`, which is correct (an elixir *is* a wondrous item),
     so `POTION_LIKE_LINKS` below is the allow-list that lets them through
     rather than a category change in the data.

     Their `Link` is the item's own, not a spell's, so the description comes
     from the row rather than from spells.json. */
  'elixir-of-hiding': {
    kind: 'buff', label: 'Elixir of hiding', stats: { 'skill:Hide': [10, T.COMPETENCE] },
    description: '+10 competence bonus on Hide checks for 1 hour.',
  },
  'elixir-of-sneaking': {
    kind: 'buff', label: 'Elixir of sneaking', stats: { 'skill:Move silently': [10, T.COMPETENCE] },
    description: '+10 competence bonus on Move Silently checks for 1 hour.',
  },
  'elixir-of-swimming': {
    kind: 'buff', label: 'Elixir of swimming', stats: { 'skill:Swim': [10, T.COMPETENCE] },
    description: '+10 competence bonus on Swim checks for 1 hour.',
  },
  'elixir-of-vision': {
    kind: 'buff', label: 'Elixir of vision', stats: { 'skill:Search': [10, T.COMPETENCE] },
    description: '+10 competence bonus on Search checks for 1 hour.',
  },
  'salve-of-slipperiness': {
    kind: 'buff', label: 'Salve of slipperiness', stats: { 'skill:Escape artist': [20, T.COMPETENCE] },
    description: '+20 competence bonus on Escape Artist checks for 8 hours.',
    situational: 'Webs — magical or not — cannot hold you. Smeared on a floor instead of a person it becomes a long-lasting grease, which the sheet cannot model',
  },
});

/* The wondrous items the potions card is allowed to carry. Deliberately a
   short explicit list: everything else filed under `Wondrous Item` is worn or
   activated, and letting the card guess would put a bag of holding on it. */
export const POTION_LIKE_LINKS = Object.freeze([
  'elixir-of-hiding', 'elixir-of-sneaking', 'elixir-of-swimming', 'elixir-of-vision',
  'salve-of-slipperiness',
]);

/** The items.json category a carried potion-shaped item is filed under. */
export function potionItemType(name) {
  const wanted = String(name || '').trim().toLowerCase();
  const rows = loadFile('items')?.['Wondrous Item'] || [];
  const found = rows.find((row) => String(row?.Name || '').toLowerCase() === wanted);
  return found && POTION_LIKE_LINKS.includes(found.Link) ? 'Wondrous Item' : 'Potion';
}

/** Whether an inventory row belongs on the potions card. */
export function isPotionLikeRow(row) {
  if (row?.ItemType === 'Potion') return true;
  if (row?.ItemType !== 'Wondrous Item') return false;
  const slug = String(row?.Link || '').split('/').pop();
  return POTION_LIKE_LINKS.includes(slug);
}

/* Everything else becomes a pill carrying the spell's own short description.
   Listed explicitly rather than defaulted, so that a potion added later cannot
   slip through unnoticed — `unclassifiedPotionLinks()` reports any that do. */
export const CONDITION_ONLY = Object.freeze([
  'blur', 'darkvision', 'delay-poison', 'displacement', 'endure-elements', 'fly',
  'gaseous-form', 'hide-from-animals', 'hide-from-undead', 'levitate', 'misdirection',
  'nondetection', 'pass-without-trace', 'protection-from-arrows', 'protection-from-energy',
  'resist-energy', 'sanctuary', 'spider-climb', 'tongues', 'undetectable-alignment',
  'water-breathing', 'water-walk',
]);

/** Oil target kinds, in the order the picker offers them. */
export const OIL_TARGETS = Object.freeze(['weapon', 'ammo', 'armor', 'any']);

/**
 * Potion links that neither the effect table nor the condition list mentions.
 * Empty today; a guard against items.json growing a potion nobody classified.
 */
export function unclassifiedPotionLinks() {
  const items = loadFile('items') || {};
  const rows = [
    ...(items.Potion || []),
    ...(items['Wondrous Item'] || []).filter((row) => POTION_LIKE_LINKS.includes(row?.Link)),
  ];
  const known = new Set([...Object.keys(POTION_EFFECTS), ...CONDITION_ONLY]);
  return [...new Set(rows.map((row) => row?.Link).filter((link) => link && !known.has(link)))];
}

/** "Potion of Water breathing" -> "Water breathing". */
export function stripPotionPrefix(name) {
  return String(name || '').replace(/^(?:Potion|Oil)\s+of\s+/i, '').trim();
}

/** True when this item is applied to an object instead of drunk. */
export function isOil(item) {
  return String(item?.Name ?? item?.name ?? '').trim().toLowerCase().startsWith('oil ');
}

/**
 * The `+N` grade written into the item's own name.
 *
 * Four *barkskin* potions and five *greater magic weapon* oils share one link
 * each; the grade is the only thing separating them, so it has to come from the
 * name. Returns 0 when the name carries no grade.
 */
export function gradeFromName(name) {
  const match = String(name || '').match(/\+(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

/**
 * A potion's caster level, which the item itself does not store.
 *
 * A potion is priced at `caster level x spell level x 50 gp`
 * (magic-items.md), so the level divides straight back out of `Cost` for a
 * standard potion. Falls back to the minimum caster level able to cast the
 * spell — `2L - 1` — when the price does not divide, which happens for the few
 * potions carrying a material component cost.
 */
export function getPotionCasterLevel(raw, spellLevel = null) {
  if (spellLevel === null || spellLevel === undefined) return 0;
  const level = Number(spellLevel);
  if (!Number.isFinite(level) || level < 0) return 0;

  const cost = Number(raw?.Cost);
  const effective = level === 0 ? 0.5 : level;
  if (Number.isFinite(cost) && cost > 0) {
    const fromPrice = cost / (effective * 50);
    if (Number.isInteger(fromPrice) && fromPrice >= 1) return fromPrice;
  }
  return level === 0 ? 1 : (2 * level) - 1;
}

/* getSpellByLink returns an array of matches (usually one), so it is unwrapped
   here rather than at each of the four call sites below. */
function spellOf(link) {
  const found = getSpellByLink(link);
  return (Array.isArray(found) ? found[0] : found) || null;
}

/** The lowest level at which any class gets this spell, or null. */
export function getPotionSpellLevel(link) {
  const spell = spellOf(link);
  const levels = String(spell?.Level || '').match(/\d+/g);
  if (!levels || levels.length === 0) return null;
  return Math.min(...levels.map(Number));
}

/** Look up the raw items.json Potion row by name. Potion names are unique. */
export function getPotionByName(name) {
  const wanted = String(name || '').trim().toLowerCase();
  if (!wanted) return null;
  const items = loadFile('items') || {};
  const rows = items.Potion || [];
  const found = rows.find((row) => String(row?.Name || '').toLowerCase() === wanted);
  if (found) return found;
  /* The five elixirs and the salve are filed under Wondrous Item but behave
     like potions; nothing else in that category is searched. */
  return (items['Wondrous Item'] || []).find((row) => (
    POTION_LIKE_LINKS.includes(row?.Link)
    && String(row?.Name || '').toLowerCase() === wanted
  )) || null;
}

/**
 * Everything the UI and the model need about one potion, resolved.
 *
 * Returns null only for a row with no link at all. A potion with no table
 * entry still resolves — as a condition carrying the spell's own short
 * description — because a potion nobody classified is still a potion the
 * player drank.
 *
 * @param {{Name: string, Link: string, Cost: number}} raw - an items.json Potion row
 * @returns {object|null}
 */
export function resolvePotionEffect(raw) {
  if (!raw?.Link) return null;
  const link = raw.Link;
  const name = raw.Name || '';
  const spell = spellOf(link);
  const spellLevel = getPotionSpellLevel(link);
  const casterLevel = getPotionCasterLevel(raw, spellLevel);
  const entry = POTION_EFFECTS[link];

  const base = {
    link,
    name,
    spellName: spell?.Name || name,
    /* A potion's description is its spell's. The six potion-shaped wondrous
       items have no spell behind them, so their row carries its own text. */
    description: String(spell?.['Short Description'] || POTION_EFFECTS[link]?.description || '').trim(),
    casterLevel,
    spellLevel,
    /* Where an info card for this effect should open.
       A potion's `Link` **is** its spell's link, so a running effect opens the
       spell that is running rather than the empty bottle it came from. The six
       potion-shaped wondrous items have no spell behind them and open their own
       item page instead. */
    infoRef: spell ? `spells#${link}` : `items/Wondrous Item/${link}`,
    oil: isOil(raw),
    stats: {},
    item: {},
    grade: 0,
    situational: '',
    clears: [],
    adds: '',
    size: 0,
    natural: false,
    target: null,
    dice: null,
    repairs: '',
  };

  /* An unclassified potion is labelled from its own item name rather than from
     the spell's: items.json is sentence case ("Potion of Water breathing") and
     spells.json is title case ("Water Breathing"), and the item's spelling is
     both the one on the card above and the one the effect table uses. */
  if (!entry) return { ...base, kind: 'condition', label: stripPotionPrefix(name) || spell?.Name || name };

  const grade = entry.amountFromName ? gradeFromName(name) : 0;
  const stats = { ...(entry.stats || {}) };

  /* The graded families write their bonus into the name, so the entry declares
     which stats and which bonus type, and the number comes from the item. */
  if (entry.acGroup && grade) Object.assign(stats, spread(entry.acGroup, grade, entry.acType));
  if (entry.naturalGroup && grade) Object.assign(stats, spread(entry.naturalGroup, grade, entry.naturalType));

  const item = { ...(entry.item || {}) };
  if (entry.itemGroup && grade) Object.assign(item, spread(entry.itemGroup, grade, entry.itemType));

  return {
    ...base,
    kind: entry.kind,
    label: entry.label || spell?.Name || name,
    stats,
    item,
    grade,
    situational: entry.situational || '',
    clears: entry.clears || [],
    adds: entry.adds || '',
    size: entry.size || 0,
    natural: Boolean(entry.natural),
    target: entry.target || null,
    dice: entry.dice || null,
    repairs: entry.repairs || '',
  };
}

/**
 * The fixed part of a dice effect: `+1 per caster level`, capped.
 *
 * Kept separate from the roll so the modal can show "1d8 + 5" before anything
 * is rolled, and so a player who types the number their own dice showed keeps
 * the level bonus rather than overwriting it.
 */
export function dicePerLevelBonus(dice, casterLevel) {
  if (!dice?.perLevel) return 0;
  const perLevel = Number(dice.perLevel) || 0;
  const raw = perLevel * (Number(casterLevel) || 0);
  const cap = Number(dice.maxBonus);
  return Number.isFinite(cap) ? Math.min(cap, raw) : raw;
}

/** Split "3d8" into its count and its die. */
export function parseDiceExpr(expr) {
  const match = String(expr || '').match(/^(\d+)d(\d+)$/i);
  if (!match) return null;
  return { count: Number(match[1]), sides: Number(match[2]) };
}
