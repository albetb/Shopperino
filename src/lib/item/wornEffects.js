import { loadFile } from '../loadFile';
import { T, AC_ALL, AC_WORN, SAVES, spread } from './effectSchema';

/**
 * What a worn, held or carried magic item does to the character wearing it.
 *
 * Weapons, armor and shields already apply their masterwork, their `+N` and
 * their named properties through the weapon and armor paths. Everything else —
 * the cloak, the amulet, the two rings, the belt — did nothing at all: the
 * player added the numbers by hand or went without them. This table is the
 * missing half.
 *
 * **The shape is `POTION_EFFECTS`', deliberately.** `stats` is
 * `{ statKey: [value, bonusType] }`, and the consumption side —
 * `getPotionContributions` and the breakdown box behind it — was already wired
 * to every stat on the sheet. Pointing a second table at it is the whole
 * design; inventing a second schema would have been the mistake.
 *
 * **Keyed by `Link`, not by name.** A graded family is a family of *items* —
 * `bracers-of-armor-1` through `-8` are eight links — so the value sits in the
 * row rather than being read back out of the name, and `POTION_EFFECTS`'
 * `amountFromName` is not needed here. Three links are shared by more than one
 * item (`luck-blade` by all four wish counts, `ring-of-elemental-command` by
 * earth, fire and water); those rows say the same thing for every item that
 * shares them, and where the wording must differ it is derived from the name.
 *
 * **Three kinds of row.**
 * - `stats` — a number the sheet already computes. It becomes a contribution
 *   and shows up in the breakdown box beside armor and feats.
 * - a **Group B field** (`spellResistance`, `damageReduction`, `casterLevel`,
 *   `energyResistance`, …) — a number the sheet knows about but had no item
 *   source for. Each is read by one method on the player.
 * - `situational` — a real bonus that only exists in a stated situation. It
 *   never touches a total; it is a note in the `info` popover of the stat it
 *   belongs to, which is the channel the feat audit already shipped.
 *
 * A row can carry all three: *Belt of dwarvenkind* gives a flat +2 Con to a
 * non-dwarf and a situational bonus on Charisma checks that depends on who is
 * being talked to.
 *
 * Rules: dnd-rules/magic-items.md (what each category is, and the twelve worn
 * slots), dnd-rules/magic.md (which named bonus types stack).
 */

/** Expand a `{ 'link-2': 2, 'link-4': 4 }` grading into one row per link. */
function graded(grades, build) {
  return Object.fromEntries(Object.entries(grades).map(([link, n]) => [link, build(n, link)]));
}

/** `{ 'prefix-1': 1, 'prefix-2': 2, … }` for a family graded +1 upward. */
function ladder(prefix, from, to) {
  const out = {};
  for (let n = from; n <= to; n += 1) out[`${prefix}-${n}`] = n;
  return out;
}

/* The six ability items come in +2 / +4 / +6, one link each. */
const abilityItem = (prefix, ability, label) => graded(
  { [`${prefix}-2`]: 2, [`${prefix}-4`]: 4, [`${prefix}-6`]: 6 },
  (n) => ({ label: `${label} +${n}`, stats: { [ability]: [n, T.ENHANCEMENT] } })
);

/* The four Rings of Elemental command. Earth, fire and water share one link,
   so the note names the element from the item's own name rather than from the
   row — the one place in this table where the key cannot say which item it is. */
function elementalCommand() {
  const note = (element) => `Against extraplanar ${element} creatures: +2 resistance on saves, `
    + '+4 morale on attack rolls, and your weapons bypass their damage reduction. '
    + `${element} elementals cannot approach within 5 ft. Carries a saving-throw penalty of its own`;
  return {
    'ring-of-elemental-command-air': {
      label: 'Ring of elemental command (air)', situational: note('air'),
    },
    /* Earth, fire and water all resolve to this link in items.json. */
    'ring-of-elemental-command': {
      label: 'Ring of elemental command',
      situationalFromName: (name) => {
        const match = String(name).match(/\((air|earth|fire|water)\)/i);
        return note(match ? match[1].toLowerCase() : 'elemental');
      },
    },
  };
}

/**
 * The table. Keyed by the item's `Link` in
 * [items.json](../../data/items.json).
 *
 * The audit behind it is [wondrous_item_audit.md](../../../obsidian-vault/docs/wondrous_item_audit.md),
 * which triaged all 538 items in the five non-weapon categories and the three
 * `Specific` ones. Every row here is one of the 138 it found; every item it
 * ruled out is absent on purpose, and the note says why.
 */
export const WORN_EFFECTS = Object.freeze({
  // —— Ability scores ——
  ...abilityItem('amulet-of-health', 'con', 'Amulet of health'),
  ...abilityItem('cloak-of-charisma', 'cha', 'Cloak of Charisma'),
  ...abilityItem('gloves-of-dexterity', 'dex', 'Gloves of Dexterity'),
  ...abilityItem('periapt-of-wisdom', 'wis', 'Periapt of Wisdom'),
  ...graded({ 'belt-of-giant-strength-4': 4, 'belt-of-giant-strength-6': 6 },
    (n) => ({ label: `Belt of giant Strength +${n}`, stats: { str: [n, T.ENHANCEMENT] } })),
  /* The headband is the one ability item with a rule-level trap: an
     enhancement bonus to Intelligence grants **no retroactive skill points**,
     so anything deriving skill points from Int must read the unenhanced score.
     `getSkillPointsPerLevel` does — see the test that pins it. */
  ...graded({ 'headband-of-intellect-2': 2, 'headband-of-intellect-4': 4, 'headband-of-intellect-6': 6 },
    (n) => ({
      label: `Headband of intellect +${n}`,
      stats: { int: [n, T.ENHANCEMENT] },
      situational: 'Grants no extra skill points — an enhancement bonus to Intelligence never does',
    })),
  'gauntlets-of-ogre-power': { label: 'Gauntlets of ogre power', stats: { str: [2, T.ENHANCEMENT] } },
  'ioun-stones-pale-blue-rhomboid': { label: 'Ioun stone (pale blue rhomboid)', stats: { str: [2, T.ENHANCEMENT] } },
  'ioun-stones-deep-red-sphere': { label: 'Ioun stone (deep red sphere)', stats: { dex: [2, T.ENHANCEMENT] } },
  'ioun-stones-pink-rhomboid': { label: 'Ioun stone (pink rhomboid)', stats: { con: [2, T.ENHANCEMENT] } },
  'ioun-stones-scarlet-and-blue-sphere': { label: 'Ioun stone (scarlet and blue sphere)', stats: { int: [2, T.ENHANCEMENT] } },
  'ioun-stones-incandescent-blue-sphere': { label: 'Ioun stone (incandescent blue sphere)', stats: { wis: [2, T.ENHANCEMENT] } },
  'ioun-stones-pink-and-green-sphere': { label: 'Ioun stone (pink and green sphere)', stats: { cha: [2, T.ENHANCEMENT] } },
  'rod-of-splendor': { label: 'Rod of Splendor', stats: { cha: [4, T.ENHANCEMENT] } },

  // —— Armor class ——
  /* Bracers grant an *armor* bonus, so they are denied to touch AC and do not
     stack with worn armor. A ring of protection is *deflection* and reaches
     all three numbers. Getting that split wrong is the classic AC bug. */
  ...graded(ladder('bracers-of-armor', 1, 8),
    (n) => ({ label: `Bracers of armor +${n}`, stats: spread(AC_WORN, n, T.ARMOR) })),
  ...graded(ladder('ring-of-protection', 1, 5),
    (n) => ({ label: `Ring of Protection +${n}`, stats: spread(AC_ALL, n, T.DEFLECTION) })),
  /* An enhancement bonus *to natural armor* is natural-armor typed, so it is
     denied to touch AC exactly as barkskin is. No new channel needed. */
  ...graded(ladder('amulet-of-natural-armor', 1, 5),
    (n) => ({ label: `Amulet of natural armor +${n}`, stats: spread(AC_WORN, n, T.NATURAL) })),
  'ioun-stones-dusty-rose-prism': { label: 'Ioun stone (dusty rose prism)', stats: spread(AC_ALL, 1, T.INSIGHT) },
  'ring-of-force-shield': {
    label: 'Ring of Force shield',
    stats: spread(AC_WORN, 2, T.SHIELD),
    situational: 'A shield bonus with no arm used, no armor check penalty and no arcane spell failure',
  },

  // —— Saving throws ——
  ...graded(ladder('cloak-of-resistance', 1, 5),
    (n) => ({ label: `Cloak of resistance +${n}`, stats: spread(SAVES, n, T.RESISTANCE) })),
  'stone-of-good-luck': {
    label: 'Stone of good luck',
    stats: { ...spread(SAVES, 1, T.LUCK), skillsAll: [1, T.LUCK] },
    situational: 'The same +1 luck bonus applies to ability checks, which the sheet does not roll',
  },
  'robe-of-stars': { label: 'Robe of stars', stats: spread(SAVES, 1, T.LUCK) },
  /* One link for all four wish counts — the wishes are the only difference,
     and the +1 luck bonus survives them all being spent. */
  'luck-blade': {
    label: 'Luck blade',
    stats: spread(SAVES, 1, T.LUCK),
    situational: 'Also one reroll per day, of a roll you have just made',
  },
  /* The one staff with a passive half. Its ten spells and its +2 quarterstaff
     are separate concerns; this is the bonus for merely wielding it. */
  'staff-of-power': {
    label: 'Staff of Power',
    stats: { ...spread(SAVES, 2, T.LUCK), ...spread(AC_ALL, 2, T.LUCK) },
  },

  // —— Skills ——
  'boots-of-elvenkind': { label: 'Boots of elvenkind', stats: { 'skill:Move silently': [5, T.COMPETENCE] } },
  'cloak-of-elvenkind': {
    label: 'Cloak of elvenkind',
    stats: { 'skill:Hide': [5, T.COMPETENCE] },
    situational: 'Only with the hood drawn up around the head',
  },
  'cloak-of-the-bat': { label: 'Cloak of the bat', stats: { 'skill:Hide': [5, T.COMPETENCE] } },
  'robe-of-blending': { label: 'Robe of blending', stats: { 'skill:Hide': [10, T.COMPETENCE] } },
  'ring-of-chameleon-power': { label: 'Ring of Chameleon power', stats: { 'skill:Hide': [10, T.COMPETENCE] } },
  'eyes-of-the-eagle': {
    label: 'Eyes of the eagle',
    stats: { 'skill:Spot': [5, T.COMPETENCE] },
    situational: 'Both lenses must be worn — one alone stuns for a round and then needs the other eye covered',
  },
  'goggles-of-minute-seeing': {
    label: 'Goggles of minute seeing',
    stats: { 'skill:Search': [5, T.COMPETENCE] },
    situational: 'Only to find secret doors, traps and similar concealed objects, at 1 ft or less',
  },
  'lens-of-detection': {
    label: 'Lens of detection',
    stats: { 'skill:Search': [5, T.UNTYPED] },
    situational: 'A further +5 on Survival checks when following tracks',
  },
  'robe-of-eyes': {
    label: 'Robe of eyes',
    stats: { 'skill:Search': [10, T.COMPETENCE], 'skill:Spot': [10, T.COMPETENCE] },
    situational: 'Also 120-ft darkvision, sight in every direction at once, and it sees invisible and ethereal things',
  },
  'gloves-of-swimming-and-climbing': {
    label: 'Gloves of swimming and climbing',
    stats: { 'skill:Swim': [5, T.COMPETENCE], 'skill:Climb': [5, T.COMPETENCE] },
  },
  'vest-of-escape': {
    label: 'Vest of escape',
    stats: { 'skill:Open lock': [4, T.COMPETENCE], 'skill:Escape artist': [6, T.COMPETENCE] },
  },
  ...graded({ 'ring-of-climbing': 5, 'ring-of-climbing-improved': 10 },
    (n, link) => ({
      label: `Ring of Climbing${link.endsWith('improved') ? ', improved' : ''}`,
      stats: { 'skill:Climb': [n, T.COMPETENCE] },
    })),
  ...graded({ 'ring-of-jumping': 5, 'ring-of-jumping-improved': 10 },
    (n, link) => ({
      label: `Ring of Jumping${link.endsWith('improved') ? ', improved' : ''}`,
      stats: { 'skill:Jump': [n, T.COMPETENCE] },
    })),
  ...graded({ 'ring-of-swimming': 5, 'ring-of-swimming-improved': 10 },
    (n, link) => ({
      label: `Ring of Swimming${link.endsWith('improved') ? ', improved' : ''}`,
      stats: { 'skill:Swim': [n, T.COMPETENCE] },
    })),
  /* "+N to every Charisma-based check" — between `skill:<Name>` and
     `skillsAll`, and the one shape the potion table never needed. */
  'circlet-of-persuasion': {
    label: 'Circlet of persuasion',
    skillsByAbility: { cha: [3, T.COMPETENCE] },
  },
  'helm-of-comprehend-languages-and-read-magic': {
    label: 'Helm of comprehend languages and read magic',
    stats: { 'skill:Decipher script': [5, T.COMPETENCE] },
    situational: 'Only for messages in incomplete, archaic or exotic forms. Also understands any spoken language and any writing',
  },

  // —— Attack, damage and speed ——
  /* Unarmed strikes and natural weapons only, which is exactly what the
     `naturalAttack` / `naturalDamage` keys the magic fang oils added mean. */
  ...graded(ladder('amulet-of-mighty-fists', 1, 5),
    (n) => ({
      label: `Amulet of mighty fists +${n}`,
      stats: { naturalAttack: [n, T.ENHANCEMENT], naturalDamage: [n, T.ENHANCEMENT] },
    })),
  'boots-of-striding-and-springing': {
    label: 'Boots of striding and springing',
    stats: { speed: [10, T.ENHANCEMENT], 'skill:Jump': [5, T.COMPETENCE] },
  },
  'ioun-stones-pale-green-prism': {
    label: 'Ioun stone (pale green prism)',
    stats: { attack: [1, T.COMPETENCE], ...spread(SAVES, 1, T.COMPETENCE), skillsAll: [1, T.COMPETENCE] },
  },
  /* Two halves: a flat Constitution bonus that only a non-dwarf gets, and a
     Charisma-check bonus that depends entirely on who is being talked to. */
  'belt-of-dwarvenkind': {
    label: 'Belt of dwarvenkind',
    stats: { con: [2, T.ENHANCEMENT] },
    raceExcept: 'Dwarf',
    situational: 'On Charisma checks and Cha-based skills: +4 competence with dwarves, +2 with gnomes and halflings, −2 with everyone else. A non-dwarf also gains darkvision 60 ft, stonecunning, and +2 resistance on saves against poison, spells and spell-like effects',
  },

  // —— Group B: the sheet knows the number, nothing fed it ——
  'rod-of-alertness': { label: 'Rod of Alertness', stats: { initiative: [1, T.INSIGHT] } },
  'scarab-of-protection': {
    label: 'Scarab of protection',
    spellResistance: 20,
    situational: 'Also absorbs twelve energy-draining attacks, death effects or negative energy effects, then crumbles',
  },
  'mantle-of-spell-resistance': { label: 'Mantle of spell resistance', spellResistance: 21 },
  /* Arcane casters only, and it says so rather than silently applying to a
     cleric who put it on. */
  'robe-of-the-archmagi': {
    label: 'Robe of the archmagi',
    arcaneOnly: true,
    stats: { ...spread(AC_WORN, 5, T.ARMOR), ...spread(SAVES, 4, T.RESISTANCE) },
    spellResistance: 18,
    situational: 'Also +2 enhancement on caster level checks to overcome spell resistance. A wearer whose alignment does not match the robe gains negative levels',
  },
  'mantle-of-faith': { label: 'Mantle of faith', damageReduction: { amount: 5, bypass: 'evil' } },
  'adamantine-breastplate': { label: 'Adamantine breastplate', damageReduction: { amount: 2, bypass: '—' } },
  'dwarven-plate': { label: 'Dwarven plate', damageReduction: { amount: 3, bypass: '—' } },
  'ioun-stones-orange': { label: 'Ioun stone (orange)', casterLevel: 1 },
  'phylactery-of-undead-turning': { label: 'Phylactery of undead turning', turnUndeadLevel: 4 },
  'vestment-druids': { label: "Druid's vestment", wildShapeUses: 1 },
  /* AC and unarmed damage only — not flurry, not the monk's other class
     features. A non-monk gets both as a 5th-level monk. */
  'belt-monks': {
    label: "Monk's belt",
    monkLevel: 5,
    situational: 'A wearer with Stunning Fist also gets one extra stunning attack per day',
  },
  /* The stone grants the *feat*, so it carries both halves: the feat itself,
     which anything gated on "do you have Alertness" now sees, and the feat's
     own +2s, which are dropped when the character already took it — the same
     feat never applies twice. */
  'ioun-stones-dark-blue-rhomboid': {
    label: 'Ioun stone (dark blue rhomboid)',
    grantsFeat: 'Alertness',
    stats: { 'skill:Listen': [2, T.UNTYPED], 'skill:Spot': [2, T.UNTYPED] },
  },
  'ioun-stones-pearly-white-spindle': { label: 'Ioun stone (pearly white spindle)', restHealPerHour: 1 },
  'periapt-of-wound-closure': {
    label: 'Periapt of wound closure',
    restHealMultiplier: 2,
    stabilizes: true,
    situational: 'Bleeding damage is negated, though bleeding that costs Constitution still applies',
  },
  'ring-of-sustenance': {
    label: 'Ring of Sustenance',
    sleepHours: 2,
    situational: 'Must be worn for a full week before it begins to work',
  },
  /* The energy type is chosen when the ring is made, so items.json cannot
     supply it — it is picked when the ring is added to the inventory and
     stored on the row. See `needsChoice`. */
  ...graded({
    'ring-of-energy-resistance-minor': 10,
    'ring-of-energy-resistance-major': 20,
    'ring-of-energy-resistance-greater': 30,
  }, (n, link) => ({
    label: `Ring of Energy resistance, ${link.split('-').pop()}`,
    energyResistance: n,
    needsChoice: 'energy',
  })),
  ...graded({ 'cloak-of-displacement-minor': 20 },
    (n) => ({ label: 'Cloak of displacement, minor', missChance: n })),
  ...graded({
    'ring-of-wizardry-1': 1, 'ring-of-wizardry-2': 2, 'ring-of-wizardry-3': 3, 'ring-of-wizardry-4': 4,
  }, (n) => ({
    label: `Ring of Wizardry (${'I'.repeat(n).replace('IIII', 'IV')})`,
    arcaneOnly: true,
    doublesSpellLevel: n,
    situational: `Doubles your arcane spells per day at level ${n}. Bonus spells from a high ability score or from specialization are not doubled`,
  })),

  // —— Group B: immunities and granted abilities, shown rather than summed ——
  'periapt-of-proof-against-poison': { label: 'Periapt of proof against poison', immunities: ['Poison'] },
  'periapt-of-health': { label: 'Periapt of health', immunities: ['Disease'] },
  'necklace-of-adaptation': {
    label: 'Necklace of adaptation',
    immunities: ['Inhaled poison', 'Harmful vapors and gases'],
    situational: 'Also lets the wearer breathe underwater or in a vacuum',
  },
  'ring-of-mind-shielding': {
    label: 'Ring of Mind shielding',
    immunities: ['Detect thoughts', 'Discern lies', 'Alignment detection'],
  },
  'ring-of-freedom-of-movement': {
    label: 'Ring of Freedom of movement',
    immunities: ['Grapple', 'Paralysis', 'Slow'],
    situational: 'Acts as a continuous freedom of movement',
  },
  'ring-of-evasion': {
    label: 'Ring of Evasion',
    grantsAbility: 'Evasion',
    situational: 'A successful Reflex save for half damage takes none instead',
  },
  /* Fits the animal, so it belongs on the companion card rather than on the
     character's own speed. */
  'horseshoes-of-speed': {
    label: 'Horseshoes of speed',
    companionSpeed: [30, T.ENHANCEMENT],
    situational: 'All four shoes must be worn by the same animal',
  },

  // —— Situational only: a real number, in a stated situation ——
  'bracers-of-archery-lesser': {
    label: 'Bracers of archery, lesser',
    situational: '+1 competence on attack rolls with any bow',
  },
  'bracers-of-archery-greater': {
    label: 'Bracers of archery, greater',
    situational: '+2 competence on attack rolls and +1 on damage with a bow you are proficient with. Also grants proficiency with any bow',
  },
  'cloak-of-arachnida': {
    label: 'Cloak of arachnida',
    situational: '+2 luck on Fortitude saves against spider poison. Also spider climb at will, immunity to web entrapment, and web once per day',
  },
  ...elementalCommand(),
  'candle-of-invocation': {
    label: 'Candle of invocation',
    situational: '+2 morale on attack rolls, saves and skill checks while within 30 ft of the flame, for a character of the candle’s own alignment',
  },
  'sword-of-subtlety': {
    label: 'Sword of subtlety',
    situational: '+4 on attack and damage rolls when making a sneak attack with this blade',
  },
  'sword-of-the-planes': {
    label: 'Sword of the planes',
    situational: '+1 on the Material Plane, +2 on an Elemental Plane or against elementals, +3 on the Astral or Ethereal or against their natives, +4 on any other plane or against any outsider',
  },
  'sun-blade': {
    label: 'Sun blade',
    situational: '+4 enhancement against evil creatures, +2 otherwise. Double damage against undead and Negative Energy Plane creatures. An evil wielder gains a negative level',
  },
  'mace-of-smiting': {
    label: 'Mace of smiting',
    situational: '+5 enhancement against constructs, +3 otherwise. A critical hit destroys a construct outright',
  },
  'dwarven-thrower': {
    label: 'Dwarven thrower',
    situational: '+3 enhancement and returning in the hands of a dwarf, +2 otherwise. Thrown, it deals +2d8 against giants and +1d8 against anything else',
  },
  'oathbow': {
    label: 'Oathbow',
    situational: '+5 enhancement and +2d6 damage against a sworn enemy, once per day. Only masterwork against anything else, and −1 on attack rolls with every other weapon',
  },
  'rhino-hide': {
    label: 'Rhino hide',
    situational: '+2d6 damage on any successful charge, including a mounted charge',
  },
  'assassins-dagger': {
    label: "Assassin's dagger",
    situational: '+1 to the DC of the Fortitude save against an assassin’s death attack',
  },
  'holy-avenger': {
    label: 'Holy avenger',
    situational: 'In a paladin’s hands: a +5 holy longsword, and spell resistance 5 + paladin level for the wielder and anyone adjacent',
  },
  'shatterspike': {
    label: 'Shatterspike',
    situational: '+4 on the opposed roll when sundering a weapon — only with the Improved Sunder feat',
  },
  'breastplate-of-command': {
    label: 'Breastplate of command',
    skillsByAbility: { cha: [2, T.COMPETENCE] },
    situational: 'The same +2 competence applies to turning checks and to the Leadership score. The wearer cannot hide or conceal themselves and keep the effect',
  },
  /* Five manuals, and the flesh one's link is the bare `golem-manual` rather
     than `golem-manual-flesh` — a data quirk, not a typo. */
  ...graded({
    'golem-manual': 'flesh', 'golem-manual-clay': 'clay', 'golem-manual-stone': 'stone',
    'golem-manual-greater-stone': 'greater stone', 'golem-manual-iron': 'iron',
  }, (kind) => ({
    label: `Golem manual (${kind})`,
    situational: `+5 competence on Craft checks, only when building that ${kind} golem's body`,
  })),
});

/**
 * Where each situational note is shown.
 *
 * A note whose row already carries `stats` follows those numbers into their own
 * popovers, which is right for most of them — the headband's "grants no skill
 * points" belongs beside the Intelligence it raises. This map is for the rest:
 * the rows that carry no number at all, and the two whose note is about a
 * *different* stat from their bonus (*Lens of detection* adds to Search and
 * says something about Survival).
 *
 * `ability` means "every skill keyed off that ability", the same shape
 * `skillsByAbility` uses.
 */
const SITUATIONAL_HOMES = Object.freeze({
  // The note is about a different stat from the bonus.
  'lens-of-detection': { stats: ['skill:Survival'] },
  'belt-of-dwarvenkind': { ability: 'cha' },
  'belt-monks': { stats: ['ac'] },

  // Defenses and immunities, filed under the save that would be rolled.
  'scarab-of-protection': { stats: ['fortitude'] },
  'periapt-of-proof-against-poison': { stats: ['fortitude'] },
  'periapt-of-health': { stats: ['fortitude'] },
  'necklace-of-adaptation': { stats: ['fortitude'] },
  'cloak-of-arachnida': { stats: ['fortitude'] },
  'ring-of-mind-shielding': { stats: ['will'] },
  'ring-of-freedom-of-movement': { stats: ['reflex'] },
  'ring-of-evasion': { stats: ['reflex'] },
  'periapt-of-wound-closure': { stats: ['maxHp'] },
  'ring-of-sustenance': { stats: ['maxHp'] },
  'horseshoes-of-speed': { stats: ['speed'] },

  // Weapons and shields whose bonus only exists against something.
  'bracers-of-archery-lesser': { stats: ['attack'] },
  'bracers-of-archery-greater': { stats: ['attack', 'damage'] },
  'sword-of-subtlety': { stats: ['attack', 'damage'] },
  'sword-of-the-planes': { stats: ['attack', 'damage'] },
  'sun-blade': { stats: ['attack', 'damage'] },
  'mace-of-smiting': { stats: ['attack', 'damage'] },
  'dwarven-thrower': { stats: ['attack', 'damage'] },
  'oathbow': { stats: ['attack', 'damage'] },
  'holy-avenger': { stats: ['attack', 'damage'] },
  'rhino-hide': { stats: ['damage'] },
  'assassins-dagger': { stats: ['attack'] },
  'shatterspike': { stats: ['attack'] },
  'ring-of-elemental-command-air': { stats: ['attack', 'fortitude', 'reflex', 'will'] },
  'ring-of-elemental-command': { stats: ['attack', 'fortitude', 'reflex', 'will'] },
  'candle-of-invocation': { stats: ['attack', 'fortitude', 'reflex', 'will'] },

  // The five manuals are a Craft bonus and nothing else.
  'golem-manual': { stats: ['skill:Craft'] },
  'golem-manual-clay': { stats: ['skill:Craft'] },
  'golem-manual-stone': { stats: ['skill:Craft'] },
  'golem-manual-greater-stone': { stats: ['skill:Craft'] },
  'golem-manual-iron': { stats: ['skill:Craft'] },
});

/** Every link the table knows, for the coverage guard in the tests. */
export function wornEffectLinks() {
  return Object.keys(WORN_EFFECTS);
}

/**
 * Links in the table that name no item in items.json.
 *
 * A typo in a key is silent otherwise: the row simply never matches anything.
 * The test calls this and asserts it is empty.
 */
export function unknownWornLinks() {
  const items = loadFile('items') || {};
  const known = new Set();
  Object.values(items).forEach((rows) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((row) => { if (row?.Link) known.add(row.Link); });
  });
  return wornEffectLinks().filter((link) => !known.has(link));
}

/**
 * Everything the model needs about one worn item, resolved.
 *
 * @param {string} link the item's `Link`
 * @param {string} [name] the item's own name — used only where one link is
 *   shared by items whose wording differs (the elemental command rings)
 * @returns {object|null} null when the item carries no effect, which is the
 *   common case: 400 of the 538 items in these categories do nothing the
 *   sheet can show
 */
export function resolveWornEffect(link, name = '') {
  const entry = WORN_EFFECTS[link];
  if (!entry) return null;

  const situational = entry.situationalFromName
    ? entry.situationalFromName(name)
    : (entry.situational || '');

  const home = SITUATIONAL_HOMES[link] || null;

  return {
    link,
    label: entry.label || name || link,
    stats: entry.stats || {},
    skillsByAbility: entry.skillsByAbility || null,
    situational,
    /* Where the note shows. Empty means "wherever this row's own bonuses
       land", which is the common case. */
    situationalOn: home?.stats || [],
    situationalOnAbility: home?.ability || '',
    // Group B, all optional and all zero/null when the item does not carry one.
    spellResistance: entry.spellResistance || 0,
    damageReduction: entry.damageReduction || null,
    casterLevel: entry.casterLevel || 0,
    turnUndeadLevel: entry.turnUndeadLevel || 0,
    wildShapeUses: entry.wildShapeUses || 0,
    monkLevel: entry.monkLevel || 0,
    restHealPerHour: entry.restHealPerHour || 0,
    restHealMultiplier: entry.restHealMultiplier || 0,
    stabilizes: Boolean(entry.stabilizes),
    sleepHours: entry.sleepHours || 0,
    energyResistance: entry.energyResistance || 0,
    missChance: entry.missChance || 0,
    doublesSpellLevel: entry.doublesSpellLevel || 0,
    immunities: entry.immunities || [],
    grantsFeat: entry.grantsFeat || '',
    grantsAbility: entry.grantsAbility || '',
    companionSpeed: entry.companionSpeed || null,
    // Gates.
    arcaneOnly: Boolean(entry.arcaneOnly),
    raceExcept: entry.raceExcept || '',
    needsChoice: entry.needsChoice || '',
  };
}

/* How each stat key reads in a one-line summary. Only the keys this table
   actually uses — a key with no entry falls back to itself, which is legible
   enough for `initiative` and `speed`. */
const STAT_LABELS = Object.freeze({
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
  ac: 'AC', acTouch: 'touch AC', acFlat: 'flat-footed AC',
  fortitude: 'Fortitude', reflex: 'Reflex', will: 'Will',
  speed: 'speed', attack: 'attack', damage: 'damage', initiative: 'initiative',
  naturalAttack: 'natural weapon attack', naturalDamage: 'natural weapon damage',
  skillsAll: 'all skills',
});

/* The three AC numbers are one bonus wearing three keys. Collapsing them keeps
   "+2 deflection to AC" from reading as three separate bonuses. */
const AC_KEYS = new Set(AC_ALL);

/**
 * A one-line summary of what an item does, for the equipment card.
 *
 * The exact arithmetic already lives in each stat's breakdown box, so this is
 * deliberately a sentence rather than a table: it answers "is this cloak doing
 * anything" without repeating the numbers the popovers own.
 *
 * @param {object} effect - a `resolveWornEffect` result
 * @returns {string} empty when the item carries no numbers at all
 */
export function formatWornEffectSummary(effect) {
  if (!effect) return '';
  const parts = [];
  const seenAc = new Set();

  Object.entries(effect.stats || {}).forEach(([key, [value, type]]) => {
    if (AC_KEYS.has(key)) {
      /* One entry per bonus type, whichever of the three keys arrives first. */
      if (seenAc.has(type)) return;
      seenAc.add(type);
      parts.push(`${value >= 0 ? '+' : ''}${value}${type ? ` ${type}` : ''} to AC`);
      return;
    }
    parts.push(`${value >= 0 ? '+' : ''}${value}${type ? ` ${type}` : ''} to ${STAT_LABELS[key] || key.replace('skill:', '')}`);
  });

  Object.entries(effect.skillsByAbility || {}).forEach(([ability, [value, type]]) => {
    parts.push(`${value >= 0 ? '+' : ''}${value}${type ? ` ${type}` : ''} to every ${STAT_LABELS[ability] || ability}-based skill`);
  });

  if (effect.spellResistance) parts.push(`spell resistance ${effect.spellResistance}`);
  if (effect.damageReduction) parts.push(`DR ${effect.damageReduction.amount}/${effect.damageReduction.bypass}`);
  if (effect.casterLevel) parts.push(`+${effect.casterLevel} caster level`);
  if (effect.turnUndeadLevel) parts.push(`turn undead as ${effect.turnUndeadLevel} levels higher`);
  if (effect.wildShapeUses) parts.push(`+${effect.wildShapeUses} wild shape use per day`);
  if (effect.monkLevel) parts.push(`monk AC and unarmed damage as ${effect.monkLevel} levels higher`);
  if (effect.restHealPerHour) parts.push(`regenerate ${effect.restHealPerHour} hp per hour`);
  if (effect.restHealMultiplier) parts.push(`heals ${effect.restHealMultiplier}x as fast`);
  if (effect.stabilizes) parts.push('stabilises automatically when dying');
  if (effect.sleepHours) parts.push(`needs only ${effect.sleepHours} hours of sleep`);
  if (effect.energyResistance) {
    parts.push(`resist ${effect.energyResistance} of one energy type`);
  }
  if (effect.missChance) parts.push(`${effect.missChance}% miss chance against you`);
  if (effect.doublesSpellLevel) parts.push(`doubles your level ${effect.doublesSpellLevel} arcane spells per day`);
  if (effect.companionSpeed) parts.push(`+${effect.companionSpeed[0]} ft to an animal's speed`);
  if (effect.grantsFeat) parts.push(`grants ${effect.grantsFeat}`);
  if (effect.grantsAbility) parts.push(`grants ${effect.grantsAbility}`);
  effect.immunities.forEach((what) => parts.push(`immune to ${String(what).toLowerCase()}`));

  return parts.join(', ');
}

/** The energy types a Ring of Energy resistance can be attuned to. */
export const ENERGY_TYPES = Object.freeze(['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic']);

/** Whether adding this item should ask the player a question first. */
export function wornChoiceKind(link) {
  return WORN_EFFECTS[link]?.needsChoice || '';
}
