/**
 * D&D 3.5 character model. All derived values (modifiers, size) are computed here;
 * the UI must not perform calculations.
 *
 * Single-class only. Reuses same class list as spellbook (CLASSES).
 * Size and race-derived data come from src/data/races.json when available.
 */

import { loadFile } from '../loadFile';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage, getWeaponType } from '../utils';
import { getCarryingCapacity as capacityFromStr, classifyLoad } from './carryingCapacity';
import { aggregateConditionEffects, sumContributions } from './conditionEffects';
import { getClassProgression, getProgressionValue, hasFeatureAtLevel, resolveAtLevel } from './classProgression';
import { listAnimals, getCreatureBaseByRef } from '../animal/animalsUtils';
import { parseAttacks, recomputeAttack } from '../animal/attackParser';
import { getBaseFeatName, UNARMED_STRIKE } from '../featChoices';
import { spellAllowsSave } from '../spellbook/spellsUtils';
import { DOMAINS } from '../spellbook/spellbook';
import {
  getFeatSkillBonus,
  getFeatSaveBonus,
  getFeatInitiativeBonus,
  getFeatHpBonus,
  getFeatTurnUndeadAttempts,
  getFeatTurnUndeadLevelBonus,
  getFeatWeaponAttackBonus,
  getFeatWeaponDamageBonus,
  getFeatUnarmedAttackBonus,
  getFeatUnarmedDamageBonus,
  hasWeaponFinesse,
  isFinesseWeapon,
  getFeatSpellDcBonus,
  getBaseSchool,
  parseCritical,
  widenThreatRange,
  hasImprovedCritical,
  getWeaponRangeIncrement,
  hasRunFeat,
  getStunningFistFeatUses,
  STUNNING_FIST_FEAT_DC,
} from './featEffects';
import {
  getSynergiesInto,
  getSynergiesIntoCheck,
  synergyBonus,
  synergyRanks,
} from './skillSynergy';
import {
  NON_PROFICIENT_ATTACK_PENALTY,
  isProficientWithWeapon,
  isProficientWithArmor,
  isProficientWithShield,
  isProficientWithUnarmedStrike,
} from './proficiency';
import { contribution, situational, compactContributions, BONUS_TYPES } from './contributions';
import {
  getFlatRacialSkillBonus,
  getFlatRacialSaveBonus,
  getRacialIllusionDcBonus,
  getRacialSkillBonuses,
  getRacialSaveBonuses,
  getRacialAttackBonuses,
  getRacialACBonuses,
  getRacialImmunities,
} from './racialTraits';
import { getDeityByName, isWithinOneStep, formatDeityAlignment } from '../deityData';
import AnimalCompanion from './animalCompanion';
import Familiar from './familiar';
import SpecialMount from './specialMount';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Which saving throws a conditional racial save bonus applies to.
 *
 * `racialSaveBonuses` is keyed by what the bonus is *against*, not by which
 * save it modifies, so the two have to be related by hand: poison is resisted
 * with Fortitude, enchantments and fear with Will, while a dwarf's bonus
 * against spells applies to whichever save the spell calls for.
 */
const SAVE_SCOPES = {
  poison: ['fortitude'],
  spellsAndSpellLike: ['fortitude', 'reflex', 'will'],
  enchantment: ['will'],
  illusions: ['will'],
  fear: ['will'],
};

const SAVE_SCOPE_LABELS = {
  poison: 'poison',
  spellsAndSpellLike: 'spells and spell-like abilities',
  enchantment: 'enchantment spells and effects',
  illusions: 'illusions',
  fear: 'fear',
};

/** Full ability names, for breakdown rows that must read as prose. */
const ABILITY_LABELS = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

/* Abilities an assumed form replaces outright. Int, Wis and Cha stay the
   character's own — magic.md → Polymorph sub-rules. */
const SHAPE_REPLACED_ABILITIES = ['str', 'dex', 'con'];

/* Size modifier to AC and attack rolls. Also the inverse of the special-size
   modifier used for grapple, which this project does not model. */
const SIZE_AC_MODIFIER = {
  Fine: 8, Diminutive: 4, Tiny: 2, Small: 1, Medium: 0,
  Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8,
};

/* Speed ceilings an assumed form is subject to (alter self). */
const SHAPE_MAX_SPEED = { fly: 120, other: 60 };

/* Modes that carry a creature across open ground, and so compete to be the
   single speed the sheet reports. Swim and climb are deliberately absent:
   neither gets you anywhere on land. */
const SPEED_TRAVERSAL_MODES = ['land', 'fly', 'burrow'];

/**
 * One movement mode's speed in feet. Most modes are stored as a plain number,
 * but flight carries its maneuverability too ({ speed, maneuverability }), so
 * both shapes have to be read.
 */
function readSpeedValue(entry) {
  if (entry && typeof entry === 'object') return Number(entry.speed) || 0;
  return Number(entry) || 0;
}

/* Conditions implied by HP and applied automatically — never user-toggled. */
const HP_DERIVED_CONDITIONS = new Set(['Dead', 'Dying', 'Disabled']);

/* Dedupe a condition list by name+ability, keeping the first occurrence. */
function dedupeConditions(list) {
  const seen = new Set();
  const out = [];
  for (const c of list) {
    if (!c || typeof c.name !== 'string') continue;
    const key = `${c.name}::${c.ability || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/** Stable stringification of an overrides map for equality compare. */
function stableOverrides(o) {
  if (!o || typeof o !== 'object') return '';
  const keys = Object.keys(o).sort();
  if (keys.length === 0) return '';
  return JSON.stringify(keys.map((k) => [k, o[k]]));
}

/**
 * Normalize an overrides value into a plain { string: string } map. Returns
 * null if the result is empty (caller should omit the field then).
 */
function normalizeOverrides(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const out = {};
  let count = 0;
  for (const [k, v] of Object.entries(o)) {
    if (typeof k !== 'string' || k === '') continue;
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : String(v);
    count += 1;
  }
  return count > 0 ? out : null;
}

/** Two inventory entries stack only if every magical-identity field matches. */
function sameInventoryEntry(a, b) {
  if (a.Name !== b.Name) return false;
  if (a.ItemType !== b.ItemType) return false;
  if ((a.Link || '') !== (b.Link || '')) return false;
  if (!!a.masterwork !== !!b.masterwork) return false;
  if ((a.bonus || 0) !== (b.bonus || 0)) return false;
  const ae = (Array.isArray(a.effectIds) ? a.effectIds : []).slice().sort().join(',');
  const be = (Array.isArray(b.effectIds) ? b.effectIds : []).slice().sort().join(',');
  if (ae !== be) return false;
  return stableOverrides(a.overrides) === stableOverrides(b.overrides);
}

/* The four free slots at the bottom of the equipment grid. Not hands, not
   armor: whatever the character keeps to hand — a wondrous item, a wand, a
   potion belt. Order is display order. */
const OTHER_SLOTS = ['other1', 'other2', 'other3', 'other4'];

/** Fallback when race is not in races.json. Unknown races default to "Medium". */
const RACE_SIZE_FALLBACK = {
  Human: 'Medium',
  Elf: 'Medium',
  Dwarf: 'Medium',
  Halfling: 'Small',
  Gnome: 'Small',
  'Half-Elf': 'Medium',
  'Half-Orc': 'Medium',
  Orc: 'Medium',
  Goblin: 'Small',
  Kobold: 'Small',
};

function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function defaultAbilities() {
  return Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, { base: 10, bonus: 0 }])
  );
}

/** Hit dice string to max value (e.g. "d8" -> 8). Used for base life minimum. */
function hitDiceToMax(hd) {
  if (!hd || typeof hd !== 'string') return 4;
  const n = parseInt(hd.replace(/^d/i, ''), 10);
  return Number.isFinite(n) ? n : 4;
}

/**
 * Standard PHB unarmed strike damage by creature size. Per
 * combat.md / class-features.md. Used for any non-Monk who throws
 * a punch (or for Monks of unknown sizes).
 */
function defaultUnarmedDamage(size) {
  switch (size) {
    case 'Fine':       return '1';
    case 'Diminutive': return '1';
    case 'Tiny':       return '1';
    case 'Small':      return '1d2';
    case 'Medium':     return '1d3';
    case 'Large':      return '1d4';
    case 'Huge':       return '1d6';
    case 'Gargantuan': return '1d8';
    case 'Colossal':   return '2d6';
    default:           return '1d3';
  }
}

/**
 * Monk unarmed strike damage by level + size (PHB Table: The Monk).
 * Damage tier scales every few levels; size shifts the tier up or down.
 */
function monkUnarmedDamage(level, size) {
  const tier =
    level <= 3  ? 0 :
    level <= 7  ? 1 :
    level <= 11 ? 2 :
    level <= 15 ? 3 :
    level <= 19 ? 4 :
                  5;
  const tiers = {
    Small:  ['1d4', '1d6', '1d8',  '1d10', '2d6', '2d8'],
    Medium: ['1d6', '1d8', '1d10', '2d6',  '2d8', '2d10'],
    Large:  ['1d8', '2d6', '2d8',  '3d6',  '3d8', '4d6'],
  };
  return (tiers[size] || tiers.Medium)[tier];
}

/**
 * Convert an armor speed entry to feet. items.json stores these metric
 * ("6m", "4.5m") while every speed the sheet computes is in feet, so the
 * two have to be reconciled somewhere. Uses the D&D square as the bridge:
 * 1.5 m = 5 ft, giving 9 m → 30, 6 m → 20 and 4.5 m → 15.
 * @returns {number|null} feet, or null when the entry is unparseable.
 */
function metersToFeet(value) {
  const meters = parseFloat(String(value));
  if (!Number.isFinite(meters)) return null;
  return Math.round((meters / 1.5) * 5);
}

/**
 * Turning check result → the most powerful undead affected, as an offset from
 * the turner's effective level (SRD, Table: Turning Undead). Entries are
 * `[minimum check result, HD offset]`, read from the highest qualifying row.
 * Shared by every turning class, so it lives here rather than in classes.json.
 */
const TURN_UNDEAD_TABLE = [
  [-Infinity, -4],
  [1, -3],
  [4, -2],
  [7, -1],
  [10, 0],
  [13, 1],
  [16, 2],
  [19, 3],
  [22, 4],
];

/** Normalize spells to [[id, prepared, used], ...]. */
function normalizePlayerSpells(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((slot) => {
      if (Array.isArray(slot) && slot.length >= 3) {
        return [Number(slot[0]), Number(slot[1]) || 0, Number(slot[2]) || 0];
      }
      return null;
    })
    .filter(Boolean);
}

class Player {
  constructor() {
    this.name = '';
    this.race = '';
    this.class = '';
    this.level = 1;
    this.abilities = defaultAbilities();
    this.notes = {};
    this.selectedNoteName = '';
    this.portrait = ''; // data URL (JPEG ~256x256) or empty string
    this.maxLife = 10;
    this.healthModifier = 0;
    this.damage = 0;
    this.skills = {};
    this.gold = 0;
    this.feats = [];
    this.bonusLanguagesLearned = [];
    this.domain1 = '';
    this.domain2 = '';
    this.specialized = '';
    this.forbidden1 = '';
    this.forbidden2 = '';
    this.moralAlignment = 'Neutral';
    this.ethicalAlignment = 'Neutral';
    /* Patron deity, as free text. Names matching src/data/deities.json resolve
       to a known alignment and domain list; anything else is a homebrew patron
       the sheet records but cannot check. Only divine classes are asked for one. */
    this.deity = '';
    this.spells = [];
    this.usedDomainSpells = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.preparedDomainSpells = {};
    this.gnomeSpellUses = {}; // { [spellLink]: 0|1 } per-day uses for gnome racial spells
    /* The highest multiple-of-4 level whose +1 ability increase the player has
       already dealt with. It cannot be derived — base scores move for many
       reasons, so "did a score go up since 4th" is not answerable — and the
       sheet only reminds, never applies. 0 means nothing acknowledged yet. */
    this.abilityIncreaseAcked = 0;
    /* Per-day class-feature consumption, keyed by feature ("rage", "smiteEvil",
       "turnUndead", …). Uses-per-day features count whole uses; pools such as
       lay on hands and wholeness of body store the amount spent. Maximums are
       derived from class progression, never stored here, and over-cap values are
       kept as entered per the non-enforcing rule. Cleared by resetClassFeatureUses. */
    this.classFeatureUses = {};
    /* Spontaneous casters earn a spell swap at fixed levels; this is how many
       have been spent. Additive with a 0 default, so no version bump. */
    this.spellSwapsUsed = 0;
    /* Whether a barbarian rage is currently running. A stance rather than a
       condition: it grants bonuses instead of penalties and ends by choice, so
       it is not part of the condition subsystem. Its aftermath (Fatigued) is. */
    this.raging = false;
    /* Ranger favored enemies, in selection order. Each entry is
       { type, subtype?, bonus }; the bonus rises in steps of 2 when a later
       slot is spent raising an existing enemy rather than naming a new one. */
    this.favoredEnemies = [];
    /* Ranger combat style: 'Archery' or 'Two-Weapon Fighting'. The rules make
       the choice permanent; the sheet lets it be cleared anyway, since a
       misclick otherwise sticks to the character forever. */
    this.combatStyle = null;
    /* Monk bonus feats, keyed by the level they are chosen at ('1', '2', '6').
       One feat per level from a fixed two-option list — see class-features.md.
       Charged to no feat budget and stored as a plain object of short keys. */
    this.monkBonusFeats = {};
    /* Rogue special abilities, keyed by the level they are chosen at ('10',
       '13', '16', '19'). The value is an ability name, or the FEAT_INSTEAD
       sentinel when the rogue takes a bonus feat in its place. */
    this.rogueSpecialAbilities = {};
    /* Set when the character has broken their class's code or alignment
       requirement. Display only: the sheet says the features are lost until
       atonement, but every derived value stays as it was. */
    this.exClass = false;
    this.equipment = {}; // { lh1, rh1, lh2, rh2, set1, set2, armor, other1, other2, other3, other4 }
    this.speedBonus = 0;
    this.initiativeBonus = 0;
    this.fortBonus = 0;
    this.reflexBonus = 0;
    this.willBonus = 0;
    /* AC modifiers: general adds to AC/touch/flat; the touch and flat
       fields stack only on top of their respective totals. */
    this.acBonus = 0;
    this.acTouchBonus = 0;
    this.acFlatBonus = 0;
    /* Active conditions. Each entry: { name, ability?, amount? }. Some
       conditions take a sub-choice — Ability Damaged/Drained carry an
       `ability` (e.g. 'Str'); Energy Drained carries an `amount` (negative
       levels). Display-only for now; effects are not yet applied to stats. */
    this.conditions = [];
    this.inventory = []; // Array of { Name, ItemType, Number, Link, effectIds }
    /* Set true the first time a starting-equipment package is generated
       (when race + class are both chosen). Prevents regeneration if the
       class is later changed. See lib/player/startingEquipment.js. */
    this.startingEquipmentGenerated = false;
    /* Druid / ranger animal companion (AnimalCompanion instance) or null.
       Derived values live in the AnimalCompanion model; effective level is
       resolved from this player's class/level. */
    this.companion = null;
    /* Wizard / sorcerer familiar (Familiar instance) or null. Its stats derive
       from this player (master): HP ½ master, BAB = master, best-of saves, etc.
       Set only for familiar-granting classes. */
    this.familiar = null;
    /* Paladin special mount (SpecialMount instance) or null. Unlike the
       companion there is nothing to choose — the creature follows the
       paladin's size — so this is simply present or absent. */
    this.specialMount = null;
    /* Druid wild shape: the animals.json ref of the assumed form, or '' when
       in her true shape. The form is not a separate creature — it replaces
       this character's own physical stats — so unlike the companion there is
       no sub-model, only a reference. Uses per day live in classFeatureUses
       under 'wildShape', so Rest clears them with everything else. */
    this.wildShapeRef = '';
  }

  /**
   * Load from a plain object (e.g. from persistence).
   * @param {Object} data - Raw character data
   * @returns {this}
   */
  load(data) {
    if (typeof data !== 'object' || data === null) return this;

    this.name = typeof data.name === 'string' ? data.name : '';
    this.race = typeof data.race === 'string' ? data.race : '';
    this.class = typeof data.class === 'string' ? data.class : '';
    this.level = clamp(data.level, 1, 20);

    if (data.abilities && typeof data.abilities === 'object') {
      ABILITY_KEYS.forEach((key) => {
        const a = data.abilities[key];
        if (a && typeof a === 'object') {
          this.abilities[key] = {
            base: clamp(a.base, 0, 99),
            bonus: clamp(a.bonus, -20, 99),
          };
        }
      });
    }

    if (data.notes && typeof data.notes === 'object') {
      this.notes = {};
      Object.keys(data.notes).forEach((noteName) => {
        const n = data.notes[noteName];
        if (n && typeof n === 'object' && typeof noteName === 'string' && noteName.trim() !== '') {
          this.notes[noteName] = {
            text: typeof n.text === 'string' ? n.text : '',
            updatedAt: Number.isFinite(n.updatedAt) ? n.updatedAt : Date.now(),
          };
        }
      });
    }
    if (typeof data.selectedNoteName === 'string') {
      this.selectedNoteName = this.notes[data.selectedNoteName] != null ? data.selectedNoteName : '';
    }
    if (typeof data.portrait === 'string') this.portrait = data.portrait;

    if (Number.isFinite(data.maxLife)) this.maxLife = Math.max(this.getBaseLifeMin(), data.maxLife);
    if (Number.isFinite(data.healthModifier)) this.healthModifier = data.healthModifier;
    if (Number.isFinite(data.damage)) this.damage = Math.max(0, data.damage);

    if (data.skills && typeof data.skills === 'object') {
      this.skills = {};
      Object.keys(data.skills).forEach((skillName) => {
        const s = data.skills[skillName];
        if (s && typeof s === 'object' && typeof skillName === 'string' && skillName.trim() !== '') {
          this.skills[skillName] = {
            ranks: Math.max(0, Number(s.ranks) || 0),
            bonus: Number(s.bonus) || 0,
          };
        }
      });
    }

    if (Number.isFinite(data.gold)) this.gold = Math.max(0, Number(Number(data.gold).toFixed(2)));

    if (Array.isArray(data.feats)) {
      this.feats = data.feats
        .filter((f) => typeof f === 'string' && f.trim() !== '')
        .map((f) => f.trim());
    }

    if (Array.isArray(data.bonusLanguagesLearned)) {
      this.bonusLanguagesLearned = data.bonusLanguagesLearned
        .filter((l) => typeof l === 'string' && l.trim() !== '')
        .map((l) => l.trim());
    }

    if (typeof data.domain1 === 'string') this.domain1 = data.domain1;
    if (typeof data.domain2 === 'string') this.domain2 = data.domain2;
    if (typeof data.specialized === 'string') this.specialized = data.specialized;
    if (typeof data.forbidden1 === 'string') this.forbidden1 = data.forbidden1;
    if (typeof data.forbidden2 === 'string') this.forbidden2 = data.forbidden2;
    if (typeof data.moralAlignment === 'string') this.moralAlignment = data.moralAlignment;
    if (typeof data.ethicalAlignment === 'string') this.ethicalAlignment = data.ethicalAlignment;
    if (typeof data.deity === 'string') this.deity = data.deity;
    if (typeof data.wildShapeRef === 'string') this.wildShapeRef = data.wildShapeRef;

    if (Array.isArray(data.spells)) {
      this.spells = normalizePlayerSpells(data.spells);
    }
    if (Array.isArray(data.usedDomainSpells) && data.usedDomainSpells.length >= 10) {
      this.usedDomainSpells = data.usedDomainSpells.slice(0, 10).map((n) => Math.max(0, Number(n) || 0));
    }
    if (data.preparedDomainSpells && typeof data.preparedDomainSpells === 'object') {
      this.preparedDomainSpells = Object.fromEntries(
        Object.entries(data.preparedDomainSpells).map(([lvl, val]) => {
          const levelNum = Number(lvl);
          if (!Number.isFinite(levelNum)) return [lvl, []];
          const arr = Array.isArray(val) ? val : [];
          const normalized = arr.map((slot) => {
            if (slot && typeof slot === 'object' && slot.Link != null) {
              return {
                Link: String(slot.Link),
                Prepared: Math.max(0, Number(slot.Prepared) || 0),
                Used: Math.max(0, Number(slot.Used) || 0),
              };
            }
            return null;
          }).filter(Boolean);
          return [levelNum, normalized];
        })
      );
    }

    if (data.abilityIncreaseAcked != null) {
      this.abilityIncreaseAcked = Math.max(0, Math.floor(Number(data.abilityIncreaseAcked) || 0));
    }
    if (data.gnomeSpellUses && typeof data.gnomeSpellUses === 'object') {
      this.gnomeSpellUses = {};
      Object.entries(data.gnomeSpellUses).forEach(([link, n]) => {
        if (typeof link === 'string' && link.trim() !== '' && Number.isFinite(n)) {
          this.gnomeSpellUses[link] = Math.min(1, Math.max(0, Math.floor(n)));
        }
      });
    }

    if (Number.isFinite(Number(data.spellSwapsUsed))) {
      this.spellSwapsUsed = Math.max(0, Math.floor(Number(data.spellSwapsUsed)));
    }
    if (data.classFeatureUses && typeof data.classFeatureUses === 'object') {
      this.classFeatureUses = {};
      Object.entries(data.classFeatureUses).forEach(([key, n]) => {
        if (typeof key === 'string' && key.trim() !== '' && Number.isFinite(Number(n))) {
          this.classFeatureUses[key] = Math.max(0, Math.floor(Number(n)));
        }
      });
    }

    if (data.raging !== undefined) this.raging = !!data.raging;

    if (typeof data.combatStyle === 'string' && data.combatStyle.trim() !== '') {
      this.combatStyle = data.combatStyle.trim();
    }
    /* Both are level-keyed choice maps; a save written before they existed
       simply has none, which reads as "nothing chosen yet". */
    if (data.monkBonusFeats && typeof data.monkBonusFeats === 'object') {
      this.monkBonusFeats = { ...data.monkBonusFeats };
    }
    if (data.rogueSpecialAbilities && typeof data.rogueSpecialAbilities === 'object') {
      this.rogueSpecialAbilities = { ...data.rogueSpecialAbilities };
    }
    if (data.exClass !== undefined) this.exClass = !!data.exClass;

    if (Array.isArray(data.favoredEnemies)) {
      const step = Number(getClassProgression(data.class ?? this.class).favoredEnemyBonusStep) || 2;
      this.favoredEnemies = data.favoredEnemies
        .filter((e) => e && typeof e.type === 'string' && e.type.trim() !== '')
        .map((e) => {
          const entry = { type: e.type.trim(), bonus: Math.max(step, Math.floor(Number(e.bonus)) || step) };
          if (typeof e.subtype === 'string' && e.subtype.trim() !== '') entry.subtype = e.subtype.trim();
          return entry;
        });
    }

    if (data.equipment && typeof data.equipment === 'object') {
      this.equipment = {};
      for (const [slot, entry] of Object.entries(data.equipment)) {
        if (!entry || typeof entry !== 'object') continue;
        const copy = { ...entry };
        const ov = normalizeOverrides(entry.overrides);
        if (ov) copy.overrides = ov;
        else delete copy.overrides;
        this.equipment[slot] = copy;
      }
    }

    if (Array.isArray(data.inventory)) {
      this.inventory = data.inventory.map((item) => {
        if (!item || typeof item !== 'object') return null;
        const entry = {
          Name: typeof item.Name === 'string' ? item.Name : '',
          ItemType: typeof item.ItemType === 'string' ? item.ItemType : '',
          Number: Math.max(0, Number(item.Number) || 0),
          Link: typeof item.Link === 'string' ? item.Link : '',
          effectIds: Array.isArray(item.effectIds) ? item.effectIds.filter((n) => Number.isInteger(n)) : [],
        };
        if (item.masterwork === true) entry.masterwork = true;
        const b = parseInt(item.bonus, 10);
        if (Number.isFinite(b) && b > 0) entry.bonus = Math.min(5, b);
        if (typeof item.baseLink === 'string' && item.baseLink) entry.baseLink = item.baseLink;
        const ov = normalizeOverrides(item.overrides);
        if (ov) entry.overrides = ov;
        return entry;
      }).filter(Boolean);
    }

    if (typeof data.speedBonus === 'number') {
      this.speedBonus = data.speedBonus;
    }

    if (typeof data.initiativeBonus === 'number') {
      this.initiativeBonus = data.initiativeBonus;
    }

    if (typeof data.fortBonus === 'number') {
      this.fortBonus = data.fortBonus;
    }

    if (typeof data.reflexBonus === 'number') {
      this.reflexBonus = data.reflexBonus;
    }

    if (typeof data.willBonus === 'number') {
      this.willBonus = data.willBonus;
    }

    if (typeof data.acBonus === 'number') {
      this.acBonus = data.acBonus;
    }
    if (typeof data.acTouchBonus === 'number') {
      this.acTouchBonus = data.acTouchBonus;
    }
    if (typeof data.acFlatBonus === 'number') {
      this.acFlatBonus = data.acFlatBonus;
    }

    if (data.startingEquipmentGenerated === true) {
      this.startingEquipmentGenerated = true;
    }

    if (Array.isArray(data.conditions)) {
      this.conditions = data.conditions
        .filter((c) => c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim())
        .map((c) => {
          const entry = { name: c.name };
          if (typeof c.ability === 'string' && c.ability) entry.ability = c.ability;
          if (Number.isFinite(c.amount)) entry.amount = c.amount;
          return entry;
        });
    }

    this.companion = null;
    if (data.companion && typeof data.companion === 'object') {
      this.companion = new AnimalCompanion().load(data.companion, { class: this.class, level: this.level });
    }

    this.familiar = null;
    if (data.familiar && typeof data.familiar === 'object') {
      // Load the fields first (so the species ref is set), then sync the master
      // context — which reads getMaxLife() and the species bonus off this.familiar.
      this.familiar = new Familiar().load(data.familiar);
      this.familiar.setOwner(this._familiarOwnerContext());
    }

    this.specialMount = null;
    if (data.specialMount && typeof data.specialMount === 'object') {
      this.specialMount = new SpecialMount().load(data.specialMount, this._mountOwnerContext());
    }

    return this;
  }

  /**
   * Export for storage. Returns a plain object.
   */
  serialize() {
    return {
      name: this.name,
      race: this.race,
      class: this.class,
      level: this.level,
      abilities: { ...this.abilities },
      notes: { ...this.notes },
      selectedNoteName: this.selectedNoteName,
      portrait: this.portrait || '',
      maxLife: this.maxLife,
      healthModifier: this.healthModifier,
      damage: this.damage,
      skills: { ...this.skills },
      gold: Number(Number(this.gold).toFixed(2)),
      feats: Array.isArray(this.feats) ? [...this.feats] : [],
      bonusLanguagesLearned: [...(this.bonusLanguagesLearned || [])],
      domain1: this.domain1 || '',
      domain2: this.domain2 || '',
      specialized: this.specialized || '',
      forbidden1: this.forbidden1 || '',
      forbidden2: this.forbidden2 || '',
      moralAlignment: this.moralAlignment || 'Neutral',
      ethicalAlignment: this.ethicalAlignment || 'Neutral',
      deity: this.deity || '',
      spells: Array.isArray(this.spells) ? this.spells.map((s) => [...s]) : [],
      usedDomainSpells: Array.isArray(this.usedDomainSpells) ? [...this.usedDomainSpells] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      preparedDomainSpells:
        this.preparedDomainSpells && typeof this.preparedDomainSpells === 'object'
          ? Object.fromEntries(
              Object.entries(this.preparedDomainSpells).map(([k, v]) => [
                k,
                Array.isArray(v) ? v.map((slot) => ({ ...slot })) : [],
              ])
            )
          : {},
      gnomeSpellUses: this.gnomeSpellUses && typeof this.gnomeSpellUses === 'object' ? { ...this.gnomeSpellUses } : {},
      abilityIncreaseAcked: this.abilityIncreaseAcked || 0,
      classFeatureUses: this.classFeatureUses && typeof this.classFeatureUses === 'object' ? { ...this.classFeatureUses } : {},
      spellSwapsUsed: Math.max(0, Math.floor(Number(this.spellSwapsUsed) || 0)),
      raging: !!this.raging,
      favoredEnemies: Array.isArray(this.favoredEnemies)
        ? this.favoredEnemies.map((e) => ({ ...e }))
        : [],
      combatStyle: this.combatStyle || null,
      monkBonusFeats: { ...(this.monkBonusFeats || {}) },
      rogueSpecialAbilities: { ...(this.rogueSpecialAbilities || {}) },
      exClass: !!this.exClass,
      equipment: this.equipment && typeof this.equipment === 'object' ? { ...this.equipment } : {},
      inventory: Array.isArray(this.inventory) ? this.inventory.map((item) => ({ ...item })) : [],
      speedBonus: typeof this.speedBonus === 'number' ? this.speedBonus : 0,
      initiativeBonus: typeof this.initiativeBonus === 'number' ? this.initiativeBonus : 0,
      fortBonus: typeof this.fortBonus === 'number' ? this.fortBonus : 0,
      reflexBonus: typeof this.reflexBonus === 'number' ? this.reflexBonus : 0,
      willBonus: typeof this.willBonus === 'number' ? this.willBonus : 0,
      acBonus: typeof this.acBonus === 'number' ? this.acBonus : 0,
      acTouchBonus: typeof this.acTouchBonus === 'number' ? this.acTouchBonus : 0,
      acFlatBonus: typeof this.acFlatBonus === 'number' ? this.acFlatBonus : 0,
      startingEquipmentGenerated: !!this.startingEquipmentGenerated,
      conditions: Array.isArray(this.conditions) ? this.conditions.map((c) => ({ ...c })) : [],
      companion: this.companion ? this.companion.serialize() : null,
      familiar: this.familiar ? this.familiar.serialize() : null,
      specialMount: this.specialMount ? this.specialMount.serialize() : null,
      wildShapeRef: this.wildShapeRef || '',
    };
  }

  // —— Conditions ——
  /** Copy of the manually-toggled conditions list. */
  getConditions() {
    return Array.isArray(this.conditions) ? this.conditions.map((c) => ({ ...c })) : [];
  }

  /**
   * Conditions implied by the current HP, derived automatically and not
   * user-toggleable: Disabled at exactly 0 HP, Dying from −1 to −9, Dead at
   * −10 or below. Returned as { name } entries (no ability/amount).
   */
  getHpDerivedConditions() {
    const hp = this.getCurrentHp();
    if (hp <= -10) return [{ name: 'Dead' }];
    if (hp < 0) return [{ name: 'Dying' }];
    if (hp === 0) return [{ name: 'Disabled' }];
    return [];
  }

  /** True when a condition with the same name (and ability, if any) is active. */
  hasCondition(name, ability = null) {
    const ab = ability || null;
    return (this.conditions || []).some((c) => c.name === name && (c.ability || null) === ab);
  }

  /**
   * Add a condition. Blocks exact duplicates (same name + ability).
   * @param {{ name: string, ability?: string, amount?: number }} cond
   * @returns {boolean} whether it was added
   */
  addCondition(cond) {
    if (!cond || typeof cond.name !== 'string' || !cond.name.trim()) return false;
    // Dead/Dying/Disabled are derived from HP — never stored manually.
    if (HP_DERIVED_CONDITIONS.has(cond.name)) return false;
    const ability = typeof cond.ability === 'string' && cond.ability ? cond.ability : null;
    if (this.hasCondition(cond.name, ability)) return false;
    const entry = { name: cond.name };
    if (ability) entry.ability = ability;
    if (Number.isFinite(cond.amount)) entry.amount = cond.amount;
    if (!Array.isArray(this.conditions)) this.conditions = [];
    this.conditions.push(entry);
    return true;
  }

  /** Remove a condition by name (and ability, if it carries one). */
  removeCondition(name, ability = null) {
    if (!Array.isArray(this.conditions)) return;
    const ab = ability || null;
    this.conditions = this.conditions.filter((c) => !(c.name === name && (c.ability || null) === ab));
  }

  // —— Condition effects (aggregation) ——

  /**
   * Conditions that feed the ability-SCORE channel. Only the MANUAL conditions
   * carry score effects (ability damage/drain, fatigue, exhaustion, entangle,
   * Helpless/Paralyzed). Derived conditions are deliberately excluded:
   *   - ability-0-derived status would feed the score channel back into itself
   *     (a Str-0 derived Helpless must not then zero Dex);
   *   - HP-derived status (Dead/Dying/Disabled) would cause infinite recursion
   *     (getMaxLife -> getConMod -> getAbilityTotal -> score channel -> getCurrentHp),
   *     and they carry no ability-score effect anyway.
   * See plan preamble (loop-safety).
   */
  getScoreConditions() {
    if (this._ignoreConditions) return [];
    return dedupeConditions(this.getConditions());
  }

  /** Aggregated contributions from the score-channel conditions only. */
  getScoreConditionModifiers() {
    return aggregateConditionEffects(this.getScoreConditions());
  }

  /**
   * Ability total adjusted by the score-channel condition modifiers: additive
   * deltas (ability damage/drain, fatigue, exhaustion, entangle) plus the
   * explicit Helpless/Paralyzed zero-overrides. This is the single source of
   * truth reused by getAbilityTotal and by the ability-0 cascade below.
   */
  conditionAdjustedAbilityTotal(abilityKey) {
    const base = this._abilityScoreSum(abilityKey);
    if (!ABILITY_KEYS.includes(abilityKey)) return base;
    const mods = this.getScoreConditionModifiers();
    if (mods.abilityZero[abilityKey] && mods.abilityZero[abilityKey].length > 0) return 0;
    return base + sumContributions(mods.ability[abilityKey]);
  }

  /**
   * The pre-condition ability score: normally base + bonus + race + rage, but
   * a wild-shaped druid *replaces* Str, Dex and Con with the form's scores
   * (magic.md → Polymorph sub-rules) rather than adding to them. Int, Wis and
   * Cha are always the character's own.
   *
   * @param {boolean} shaped - false to read through the form, as if unshifted.
   *   Used by getMaxLife, since the rules keep hit points on the druid's own
   *   Constitution even while transformed.
   */
  _abilityScoreSum(abilityKey, shaped = true) {
    const rage = this.getRageAbilityBonus(abilityKey);
    if (shaped && SHAPE_REPLACED_ABILITIES.includes(abilityKey)) {
      const score = this.getWildShapeForm()?.abilities?.[abilityKey];
      if (Number.isFinite(Number(score))) return Number(score) + rage;
    }
    return this.getAbilityBase(abilityKey) + this.getAbilityBonus(abilityKey)
      + this.getRaceAbilityModifier(abilityKey) + rage;
  }

  /**
   * An ability total computed as if the character were not wild-shaped, with
   * condition effects still applied. Only Str/Dex/Con differ from the normal
   * total, and only while transformed.
   */
  unshapedAbilityTotal(abilityKey) {
    const base = this._abilityScoreSum(abilityKey, false);
    if (!ABILITY_KEYS.includes(abilityKey)) return base;
    const mods = this.getScoreConditionModifiers();
    if (mods.abilityZero[abilityKey] && mods.abilityZero[abilityKey].length > 0) return 0;
    return base + sumContributions(mods.ability[abilityKey]);
  }

  /** Con modifier ignoring any assumed form — the one hit points are built on. */
  getUnshapedConMod() {
    return Math.floor((this.unshapedAbilityTotal('con') - 10) / 2);
  }

  /**
   * All automatically-derived conditions: the HP-derived set plus the
   * full ability-score cascade (a score driven to 0 implies a status — Str 0
   * → Helpless, Dex 0 → Paralyzed, Con 0 → Dead, Int/Wis/Cha 0 → Unconscious).
   * Uses condition-adjusted scores, so condition-induced ability loss cascades.
   * Idempotent: returns status flags only and never re-enters the score channel.
   */
  getDerivedConditions() {
    const derived = [...this.getHpDerivedConditions()];
    const names = new Set(derived.map((d) => d.name));
    const add = (name) => { if (!names.has(name)) { derived.push({ name }); names.add(name); } };
    if (this.conditionAdjustedAbilityTotal('con') <= 0) add('Dead');
    if (this.conditionAdjustedAbilityTotal('str') <= 0) add('Helpless');
    if (this.conditionAdjustedAbilityTotal('dex') <= 0) add('Paralyzed');
    if (this.conditionAdjustedAbilityTotal('int') <= 0
      || this.conditionAdjustedAbilityTotal('wis') <= 0
      || this.conditionAdjustedAbilityTotal('cha') <= 0) add('Unconscious');
    return derived;
  }

  /** Manual ∪ derived conditions, deduped by name+ability (manual wins). */
  getActiveConditions() {
    if (this._ignoreConditions) return [];
    return dedupeConditions([...this.getConditions(), ...this.getDerivedConditions()]);
  }

  /** Aggregated contributions from ALL active conditions (used by flat channels). */
  getConditionModifiers() {
    return aggregateConditionEffects(this.getActiveConditions());
  }

  /** Net condition modifier to attack rolls (Shaken/Sickened/Invisible/etc.). */
  getAttackConditionModifier() {
    return sumContributions(this.getConditionModifiers().attack);
  }

  /** Net condition modifier to weapon damage rolls (Sickened). */
  getDamageConditionModifier() {
    return sumContributions(this.getConditionModifiers().damage);
  }

  /** Net condition modifier applied to all three saving throws. */
  getSaveConditionModifier() {
    return sumContributions(this.getConditionModifiers().saves);
  }

  /** Net condition modifier to initiative (Deafened). */
  getInitiativeConditionModifier() {
    return sumContributions(this.getConditionModifiers().initiative);
  }

  /** Net flat condition penalty to AC (Blinded/Cowering/Stunned −2 each). */
  getAcConditionModifier() {
    return sumContributions(this.getConditionModifiers().ac);
  }

  /** True when any active condition denies the Dex bonus to AC. */
  losesDexToAC() {
    return this.getConditionModifiers().loseDexToAC.length > 0;
  }

  /**
   * Net condition modifier to max HP (Energy Drained −5 per negative level).
   * Sourced from the score (manual) channel only — using the full active set
   * here would recurse (getMaxLife -> getCurrentHp -> derived conditions).
   */
  getHpConditionModifier() {
    return sumContributions(this.getScoreConditionModifiers().hp);
  }

  /** True when any active condition halves speed (applied once, never compounded). */
  isHalfSpeed() {
    return this.getConditionModifiers().halfSpeed.length > 0;
  }

  /**
   * True when any temporary effect is currently altering derived stats:
   * an active condition, a running rage, or an assumed wild-shape form.
   * These are exactly the effects the baseline below strips.
   */
  hasTemporaryEffects() {
    return this.getActiveConditions().length > 0 || this.isRaging() || this.isWildShaped();
  }

  /**
   * A clone of this character with every TEMPORARY effect switched off —
   * conditions (manual and derived), rage, and wild shape — used to compute
   * how much those effects changed a derived stat. Returns null when none are
   * active. Cached per instance.
   *
   * Equipment and permanent bonuses are deliberately kept, so the comparison
   * answers "what did the effects do to me" rather than "what would a naked
   * version of me look like".
   */
  getTemporaryBaseline() {
    if (this._ignoreTemporary) return null;
    if (this._temporaryBaselineCache !== undefined) return this._temporaryBaselineCache;
    if (!this.hasTemporaryEffects()) {
      this._temporaryBaselineCache = null;
      return null;
    }
    const clone = new this.constructor();
    clone.load(this.serialize());
    clone._ignoreConditions = true;
    clone._ignoreTemporary = true;
    clone.raging = false;
    clone.wildShapeRef = '';
    this._temporaryBaselineCache = clone;
    return clone;
  }

  /**
   * Net change to each displayed combat stat caused by temporary effects
   * (current minus effect-free baseline). Captures every channel, including
   * the ability cascade. Empty object when nothing temporary is active.
   *
   * The UI reads the sign to glow a changed stat green or red, so entries are
   * kept even when zero-valued callers filter them out themselves.
   */
  getTemporaryStatDeltas() {
    const base = this.getTemporaryBaseline();
    if (!base) return {};
    return {
      ac: this.getArmorClass() - base.getArmorClass(),
      acTouch: this.getContactAC() - base.getContactAC(),
      acFlat: this.getFlatFootedAC() - base.getFlatFootedAC(),
      initiative: this.getTotalInitiative() - base.getTotalInitiative(),
      fort: this.getTotalFortitudeSave() - base.getTotalFortitudeSave(),
      reflex: this.getTotalReflexSave() - base.getTotalReflexSave(),
      will: this.getTotalWillSave() - base.getTotalWillSave(),
      speed: this.getTotalSpeed() - base.getTotalSpeed(),
      maxHp: this.getMaxLife() - base.getMaxLife(),
      ...Object.fromEntries(ABILITY_KEYS.map((key) => [
        key, this.getAbilityTotal(key) - base.getAbilityTotal(key),
      ])),
    };
  }

  /** Back-compat alias: the deltas now cover rage and wild shape too. */
  getConditionStatDeltas() {
    return this.getTemporaryStatDeltas();
  }

  /** @deprecated Use getTemporaryBaseline — kept for existing callers. */
  getConditionBaseline() {
    return this.getTemporaryBaseline();
  }

  /**
   * How far a weapon's attack bonus sits from the plain one — base attack bonus
   * plus the ability modifier this character has with nothing temporary
   * running. Everything else is a deviation: a magic or masterwork weapon,
   * Weapon Focus, the non-proficiency penalty, ability damage, a condition.
   *
   * The sheet colours the attack pill by the sign of this, so "why is this
   * number not the one my class and Strength give me" is answerable at a
   * glance. Zero means the pill stays neutral.
   */
  getWeaponAttackDeviation(weaponData) {
    const data = weaponData?.weaponItem ? weaponData : { weaponItem: weaponData };
    if (!data.weaponItem) return 0;
    const baseline = this.getTemporaryBaseline() ?? this;
    const ranged = getWeaponType(data.weaponItem).isRanged;
    const finesse = baseline.usesWeaponFinesse(data.weaponItem);
    const key = ranged || (finesse && baseline.getDexMod() > baseline.getStrMod()) ? 'dex' : 'str';
    const plain = this.getBaseAttackBonus() + baseline.getModifier(key);
    return calculateWeaponAttackBonus(this, data) - plain;
  }

  /** The same question for the unarmed strike, which has no weapon to read. */
  getPunchAttackDeviation() {
    const baseline = this.getTemporaryBaseline() ?? this;
    const abilityMod = hasWeaponFinesse(baseline.getFeats())
      ? Math.max(baseline.getStrMod(), baseline.getDexMod())
      : baseline.getStrMod();
    return this.getPunchAttackBonus() - (this.getBaseAttackBonus() + abilityMod);
  }

  /** Temporary-effect change to a weapon's attack bonus (vs baseline). */
  getWeaponAttackConditionDelta(weaponData) {
    const base = this.getTemporaryBaseline();
    if (!base) return 0;
    return calculateWeaponAttackBonus(this, weaponData) - calculateWeaponAttackBonus(base, weaponData);
  }

  /** True when temporary effects change a weapon's damage string (vs baseline). */
  isWeaponDamageConditionAffected(weaponData) {
    const base = this.getTemporaryBaseline();
    if (!base) return false;
    return calculateWeaponDamage(this, weaponData) !== calculateWeaponDamage(base, weaponData);
  }

  /** Temporary-effect change to a single skill total (vs baseline). */
  getSkillConditionDelta(skillName) {
    const base = this.getTemporaryBaseline();
    if (!base) return 0;
    return this.getSkillTotal(skillName) - base.getSkillTotal(skillName);
  }

  // —— Identity ——
  getName() {
    return this.name;
  }

  getRace() {
    return this.race;
  }

  getClass() {
    return this.class;
  }

  getLevel() {
    return this.level;
  }

  getPortrait() {
    return this.portrait || '';
  }

  /** The animal companion (AnimalCompanion instance) or null. */
  getCompanion() {
    if (this.companion) this.companion.setOwner({ class: this.class, level: this.level });
    return this.companion || null;
  }

  // —— Special mount (paladin) ——

  /** Rider context fed to the mount: its whole advancement rides on these two. */
  _mountOwnerContext() {
    return { level: this.getLevel(), size: this.getSize() || 'Medium' };
  }

  /**
   * Whether the class grants a special mount at all, and at which level. The
   * paladin's arrives at 5th; every other class returns 0.
   */
  getSpecialMountLevel() {
    return Number(getClassProgression(this.class).specialMount?.minLevel) || 0;
  }

  /** True once the paladin is high enough level to call a mount. */
  canHaveSpecialMount() {
    const at = this.getSpecialMountLevel();
    return at > 0 && this.getLevel() >= at;
  }

  /** The special mount (SpecialMount instance) or null, with fresh context. */
  getSpecialMount() {
    if (this.specialMount) this.specialMount.setOwner(this._mountOwnerContext());
    return this.specialMount || null;
  }

  /**
   * Call the mount. No-op if one is already bonded or the class does not grant
   * one; the level requirement is not enforced, per the non-enforcing rule —
   * the card simply does not offer the button below 5th.
   */
  addSpecialMount() {
    if (this.specialMount) return this.specialMount;
    if (this.getSpecialMountLevel() === 0) return null;
    this.specialMount = new SpecialMount(this._mountOwnerContext());
    return this.specialMount;
  }

  /** Release or lose the mount. */
  removeSpecialMount() {
    this.specialMount = null;
  }

  // —— Wild shape (druid) ——

  /** The class's wildShape progression block, or an empty object. */
  getWildShapeConfig() {
    const config = getClassProgression(this.class).wildShape;
    return config && typeof config === 'object' ? config : {};
  }

  /** Whether the class has wild shape at all (regardless of level). */
  grantsWildShape() {
    return Array.isArray(this.getWildShapeConfig().usesPerDay);
  }

  /** Uses per day at this level. Zero below the first breakpoint. */
  getWildShapeMax() {
    const table = this.getWildShapeConfig().usesPerDay;
    if (!Array.isArray(table)) return 0;
    return resolveAtLevel(table, this.getLevel(), 0);
  }

  getWildShapeUsed() {
    return this.getClassFeatureUsed('wildShape');
  }

  /** Uses left today. Never negative, even when the used figure is over cap. */
  getWildShapeRemaining() {
    return Math.max(0, this.getWildShapeMax() - this.getWildShapeUsed());
  }

  /** True once the druid is high enough level to transform at all. */
  canWildShape() {
    return this.getWildShapeMax() > 0;
  }

  /** How long a form lasts: 1 hour per druid level. */
  getWildShapeDurationHours() {
    const perLevel = Number(this.getWildShapeConfig().durationHoursPerLevel) || 0;
    return perLevel * this.getLevel();
  }

  /** The largest HD an assumed form may have — the druid's class level. */
  getWildShapeHdCap() {
    return this.getWildShapeConfig().hdCapEqualsLevel ? this.getLevel() : 0;
  }

  /** Creature sizes unlocked at this level, in the order the rules grant them. */
  getWildShapeSizes() {
    const unlocks = this.getWildShapeConfig().sizeUnlocks;
    if (!Array.isArray(unlocks)) return [];
    const level = this.getLevel();
    return unlocks
      .filter((u) => Number(u?.level) <= level)
      .flatMap((u) => (Array.isArray(u.sizes) ? u.sizes : []));
  }

  /**
   * Creature types this druid may currently assume through the normal wild
   * shape pool: animals from 5th, plants from 12th. Elementals are excluded —
   * they draw on a separate daily allowance and grant the form's Su and Sp
   * abilities, so they are not interchangeable with these.
   */
  getWildShapeTypes() {
    const types = ['animal'];
    const plantLevel = Number(this.getWildShapeConfig().plantLevel);
    if (plantLevel && this.getLevel() >= plantLevel) types.push('plant');
    return types;
  }

  /**
   * The forms this druid may assume right now, sorted by name. Filtered to an
   * allowed creature type, an unlocked size, and an HD count within the cap.
   *
   * Draws from animals.json and the Plant entries of monsters.json — the two
   * files the project has creature blocks in. Elemental forms are not listed;
   * see getWildShapeMissingTiers().
   */
  getWildShapeForms() {
    if (!this.canWildShape()) return [];
    const sizes = new Set(this.getWildShapeSizes());
    const hdCap = this.getWildShapeHdCap();
    const types = new Set(this.getWildShapeTypes());
    const monsters = loadFile('monsters')?.monsters;
    const pool = [...listAnimals(), ...(Array.isArray(monsters) ? monsters : [])];
    return pool
      .filter((creature) => {
        if (!types.has(String(creature?.type || '').toLowerCase())) return false;
        if (!sizes.has(creature.size)) return false;
        const hd = Number(creature?.hitDice?.count) || 0;
        return hdCap === 0 || hd <= hdCap;
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  // —— Elemental wild shape (16th+, its own daily allowance) ——

  /**
   * Elemental uses per day: 1 at 16th, 2 at 18th, 3 at 20th. Entirely separate
   * from the animal/plant allowance — the rules call these "in addition to her
   * normal wild shape usage".
   */
  getElementalWildShapeMax() {
    const table = this.getWildShapeConfig().elementalUsesPerDay;
    if (!Array.isArray(table)) return 0;
    return resolveAtLevel(table, this.getLevel(), 0);
  }

  getElementalWildShapeUsed() {
    return this.getClassFeatureUsed('elementalWildShape');
  }

  getElementalWildShapeRemaining() {
    return Math.max(0, this.getElementalWildShapeMax() - this.getElementalWildShapeUsed());
  }

  /** True once the druid can assume elemental form at all. */
  canElementalWildShape() {
    return this.getElementalWildShapeMax() > 0;
  }

  /** Elemental sizes unlocked at this level: Small/Medium/Large at 16, Huge at 20. */
  getElementalWildShapeSizes() {
    const unlocks = this.getWildShapeConfig().elementalSizeUnlocks;
    if (!Array.isArray(unlocks)) return [];
    const level = this.getLevel();
    return unlocks
      .filter((u) => Number(u?.level) <= level)
      .flatMap((u) => (Array.isArray(u.sizes) ? u.sizes : []));
  }

  /**
   * Whether a creature block is one of the four elementals a druid may become.
   * Type alone is too loose: Belker, Invisible Stalker, Magmin and Thoqqua all
   * carry an elemental type and subtype without being elementals in the sense
   * the rule means, so the name must match too.
   */
  isElementalForm(creature) {
    if (String(creature?.type || '').toLowerCase() !== 'elemental') return false;
    const config = this.getWildShapeConfig();
    const allowed = Array.isArray(config.elementalSubtypes)
      ? config.elementalSubtypes.map((s) => String(s).toLowerCase())
      : [];
    const subtypes = Array.isArray(creature.subtypes)
      ? creature.subtypes.map((s) => String(s).toLowerCase())
      : [];
    if (!subtypes.some((s) => allowed.includes(s))) return false;
    const pattern = config.elementalNamePattern;
    if (!pattern) return true;
    return String(creature.name || '').toLowerCase().includes(String(pattern).toLowerCase());
  }

  /**
   * The elemental forms available right now, sorted by name. Bound by the
   * elemental size unlocks and by the same Hit Dice cap as any other form —
   * which is why a 20th-level druid may become a Huge elemental (16 HD) but
   * never a Greater (21) or Elder (24).
   */
  getElementalWildShapeForms() {
    if (!this.canElementalWildShape()) return [];
    const sizes = new Set(this.getElementalWildShapeSizes());
    const hdCap = this.getWildShapeHdCap();
    const monsters = loadFile('monsters')?.monsters;
    if (!Array.isArray(monsters)) return [];
    return monsters
      .filter((creature) => {
        if (!this.isElementalForm(creature)) return false;
        if (!sizes.has(creature.size)) return false;
        const hd = Number(creature?.hitDice?.count) || 0;
        return hdCap === 0 || hd <= hdCap;
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  /**
   * A creature's name with a trailing size dropped: "Air Elemental, Large"
   * becomes "Air Elemental", since the list already carries the size in its
   * own column. Only an exact size match is stripped, so the meaningful
   * suffixes ("Greater", "Elder") survive untouched.
   */
  getFormDisplayName(creature) {
    const name = String(creature?.name || '');
    const size = String(creature?.size || '');
    if (!size) return name;
    const suffix = `, ${size}`;
    return name.toLowerCase().endsWith(suffix.toLowerCase())
      ? name.slice(0, -suffix.length)
      : name;
  }

  /** True when the current form is an elemental rather than an animal or plant. */
  isElementalShaped() {
    const form = this.getWildShapeForm();
    return !!form && this.isElementalForm(form);
  }

  /**
   * Which daily allowance a form draws on. Elementals have their own pool;
   * animals and plants share the normal one.
   */
  getWildShapeUsesKey(ref) {
    const creature = getCreatureBaseByRef(ref);
    return creature && this.isElementalForm(creature) ? 'elementalWildShape' : 'wildShape';
  }

  /** True while transformed. */
  isWildShaped() {
    return !!this.wildShapeRef;
  }

  getWildShapeRef() {
    return this.wildShapeRef || '';
  }

  /** The animals.json block of the assumed form, or null when in true form. */
  getWildShapeForm() {
    if (!this.wildShapeRef) return null;
    return getCreatureBaseByRef(this.wildShapeRef) || null;
  }

  /** Display name of the current form, or '' when in true form. */
  getWildShapeName() {
    return this.getWildShapeForm()?.name || '';
  }

  /**
   * Assume a form. Spends one use and restores hit points as if rested for a
   * night (1 per character level), both per the rules. Returns false when the
   * ref names no known animal.
   *
   * The use is spent even when already over the daily allowance — going over
   * is flagged in the card, never blocked.
   */
  enterWildShape(ref) {
    if (!this.grantsWildShape()) return false;
    if (!getCreatureBaseByRef(ref)) return false;
    this.wildShapeRef = ref;
    this.useClassFeature(this.getWildShapeUsesKey(ref), 1);
    this.healAsIfRested();
    return true;
  }

  /** Revert to true form. Free: it costs no use and heals nothing. */
  exitWildShape() {
    this.wildShapeRef = '';
  }

  /**
   * How much a night's rest would actually restore: one hit point per
   * character level, or whatever damage is left when that is less. Separate
   * from healAsIfRested so the sheet can report the amount before applying it
   * — the two share this so the number shown and the number healed cannot
   * disagree.
   */
  getRestHealAmount() {
    return Math.min(Math.max(0, Number(this.damage) || 0), this.getLevel());
  }

  /** A night's natural healing: 1 HP per character level (combat.md). */
  healAsIfRested() {
    this.damage = Math.max(0, (Number(this.damage) || 0) - this.getRestHealAmount());
  }

  /** Size modifier to AC and attack rolls for the current size. */
  getSizeAcModifier() {
    return SIZE_AC_MODIFIER[this.getSize()] ?? 0;
  }

  /**
   * The natural attacks of the assumed form, as
   * `[{ name, count, bonus, damage, type, index }]`.
   *
   * The animals.json line is already computed for the creature's own BAB and
   * Str. A wild-shaped druid uses *her* base attack bonus with *the form's*
   * Str — and she has the form's Str already — so only the BAB gap needs
   * correcting. Size is likewise baked into the creature's line and is
   * unchanged by the druid inhabiting it.
   *
   * Empty in true form. Extra limbs grant no extra attacks, so the list is
   * taken verbatim from the block rather than multiplied.
   */
  getWildShapeAttacks() {
    const form = this.getWildShapeForm();
    if (!form) return [];
    const src = form.fullAttack && form.fullAttack !== '-' ? form.fullAttack : form.attack;
    const lines = parseAttacks(src);
    const babDelta = this.getBaseAttackBonus() - (Number(form.baseAttackGrapple?.baseAttack) || 0);
    return lines.map((line, index) => ({
      ...recomputeAttack(line, { babDelta, strModDelta: 0, sizeModDelta: 0 }),
      index,
    }));
  }

  /**
   * Special attacks the form grants. Extraordinary special *attacks* transfer;
   * special *qualities* (scent, low-light vision) do not, so those are
   * deliberately not read (magic.md → Polymorph sub-rules).
   */
  getWildShapeSpecialAttacks() {
    const list = this.getWildShapeForm()?.specialAttacks;
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Special qualities the form grants. Normally none — this is the single most
   * misapplied part of the polymorph rules — but an **elemental** form is the
   * stated exception: the druid gains all of the elemental's extraordinary,
   * supernatural and spell-like abilities.
   */
  getWildShapeSpecialQualities() {
    if (!this.isElementalShaped()) return [];
    const list = this.getWildShapeForm()?.specialQualities;
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Feats the form grants. Only an elemental form does: "she also gains the
   * elemental's feats for as long as she maintains the wild shape".
   */
  getWildShapeFeats() {
    if (!this.isElementalShaped()) return [];
    const list = this.getWildShapeForm()?.feats;
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Special qualities of the form that are NOT gained, returned so the card can
   * say so plainly. Empty for an elemental, which grants them all.
   */
  getWildShapeUngainedQualities() {
    if (this.isElementalShaped()) return [];
    const list = this.getWildShapeForm()?.specialQualities;
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * The assumed form's natural armor bonus, read off the parenthesised
   * components of its AC line ("14 (+2 Dex, +2 natural)"). Zero when in true
   * form or when the block lists none.
   */
  getWildShapeNaturalArmor() {
    const form = this.getWildShapeForm();
    if (!form) return 0;
    const match = String(form.armorClass?.components || '').match(/([+-]?\d+)\s*natural/i);
    return match ? Number(match[1]) || 0 : 0;
  }

  /**
   * Whether worn armor and shields still function. They meld into an assumed
   * form and stop contributing AC — the inventory stays fully editable, only
   * the numbers stop counting.
   */
  isEquipmentMelded() {
    return this.isWildShaped();
  }

  /**
   * Whether spells can be cast right now. A druid loses speech in animal form,
   * so verbal components fail — unless she has Natural Spell.
   */
  canCastSpells() {
    if (!this.isWildShaped()) return true;
    return this.hasNaturalSpell();
  }

  /** Whether the character holds the Natural Spell feat. */
  hasNaturalSpell() {
    return this.getFeats().some((f) => getBaseFeatName(f).toLowerCase() === 'natural spell');
  }

  /** Master context fed to the familiar so its derived stats resolve. */
  _familiarOwnerContext() {
    return {
      level: this.level,
      maxHp: this.getMaxLife(),
      bab: this.getBaseAttackBonus(),
      baseFort: this.getBaseFortitudeSave(),
      baseRef: this.getBaseReflexSave(),
      baseWill: this.getBaseWillSave(),
    };
  }

  /** True when this class grants a familiar (wizard / sorcerer). */
  grantsFamiliar() {
    return hasFeatureAtLevel(this.class, 'familiarLevel', this.getLevel());
  }

  /** The familiar (Familiar instance) or null, with a fresh master context. */
  getFamiliar() {
    if (this.familiar) this.familiar.setOwner(this._familiarOwnerContext());
    return this.familiar || null;
  }

  /**
   * The active familiar's per-species bonus to the master, flattened for
   * auto-application: { hp, fort, reflex, skills: { [name]: value } }. Empty
   * unless the class grants a familiar and one is set. Conditional bonuses
   * (Hawk/Owl Spot) are excluded — the sheet can't know the lighting.
   * Reads this.familiar directly (no owner sync) to avoid recursion via getMaxLife.
   */
  getFamiliarStatBonuses() {
    const out = { hp: 0, fort: 0, reflex: 0, skills: {} };
    if (!this.familiar || !this.grantsFamiliar()) return out;
    const bonus = this.familiar.getSpeciesBonus?.();
    if (!bonus || bonus.condition) return out;
    const value = Number(bonus.value) || 0;
    if (bonus.kind === 'hp') out.hp += value;
    else if (bonus.kind === 'save' && bonus.target === 'fort') out.fort += value;
    else if (bonus.kind === 'save' && bonus.target === 'reflex') out.reflex += value;
    else if (bonus.kind === 'skill' && bonus.target) out.skills[bonus.target] = (out.skills[bonus.target] || 0) + value;
    return out;
  }

  /**
   * Size category derived from race (e.g. "Medium", "Small").
   * Uses races.json when available; otherwise fallback map; unknown races default to "Medium".
   */
  /**
   * Current size. An assumed form's natural size replaces the character's own,
   * which cascades into AC, attack rolls and carrying capacity.
   */
  getSize() {
    const form = this.getWildShapeForm();
    if (form?.size) return form.size;
    return this.getTrueSize();
  }

  /** The character's own size, ignoring any assumed form. */
  getTrueSize() {
    if (!this.race) return '';
    const races = loadFile('races');
    const fromData = races?.[this.race]?.size;
    if (fromData) return fromData;
    return RACE_SIZE_FALLBACK[this.race] ?? 'Medium';
  }

  // —— Abilities ——
  /**
   * @param {string} abilityKey - One of 'str','dex','con','int','wis','cha'
   * @returns {number} Base score (0–99)
   */
  getAbilityBase(abilityKey) {
    const a = this.abilities[abilityKey];
    return a ? clamp(a.base, 0, 99) : 10;
  }

  /**
   * @param {string} abilityKey - One of 'str','dex','con','int','wis','cha'
   * @returns {number} Bonus (-20..99) — negatives allowed for stat-draining
   *   effects (poison, ability damage, etc.).
   */
  getAbilityBonus(abilityKey) {
    const a = this.abilities[abilityKey];
    return a ? clamp(a.bonus, -20, 99) : 0;
  }

  /**
   * Racial ability modifier from race data (abilityModifiers in races.json).
   * Returns 0 if no race or no modifier defined.
   * @param {string} abilityKey - One of 'str','dex','con','int','wis','cha'
   * @returns {number}
   */
  getRaceAbilityModifier(abilityKey) {
    if (!this.race || !ABILITY_KEYS.includes(abilityKey)) return 0;
    const races = loadFile('races');
    const mods = races?.[this.race]?.abilityModifiers;
    if (mods == null || typeof mods !== 'object') return 0;
    const value = mods[abilityKey];
    return Number.isFinite(value) ? value : 0;
  }

  /**
   * Total ability score = base + bonus + race modifier (from race's abilityModifiers).
   * @param {string} abilityKey - One of 'str','dex','con','int','wis','cha'
   * @returns {number}
   */
  getAbilityTotal(abilityKey) {
    // Condition score effects (ability damage/drain, fatigue, exhaustion,
    // entangle, Helpless/Paralyzed zero-overrides) flow through here so they
    // cascade into AC, saves, skills, HP, attack/damage and initiative.
    return this.conditionAdjustedAbilityTotal(abilityKey);
  }

  /**
   * The score-channel condition contributions affecting one ability, as
   * { source, label, value } entries (breakdown-ready). Empty when none.
   */
  getAbilityConditionContributions(abilityKey) {
    const mods = this.getScoreConditionModifiers();
    const zero = mods.abilityZero[abilityKey] || [];
    if (zero.length > 0) {
      // Represent the override as a single contribution down to 0.
      const base = this._abilityScoreSum(abilityKey);
      return zero.map((z) => ({ source: z.source, label: z.label, value: -base }));
    }
    return mods.ability[abilityKey] ? mods.ability[abilityKey].map((c) => ({ ...c })) : [];
  }

  /**
   * D&D 3.5 ability modifier: floor((total - 10) / 2).
   * @param {string} abilityKey - One of 'str','dex','con','int','wis','cha'
   * @returns {number}
   */
  getModifier(abilityKey) {
    const total = this.getAbilityTotal(abilityKey);
    return Math.floor((total - 10) / 2);
  }

  getStrMod() {
    return this.getModifier('str');
  }

  getDexMod() {
    return this.getModifier('dex');
  }

  getConMod() {
    return this.getModifier('con');
  }

  getIntMod() {
    return this.getModifier('int');
  }

  getWisMod() {
    return this.getModifier('wis');
  }

  getChaMod() {
    return this.getModifier('cha');
  }

  /** Gnome racial spell uses this day. Returns { [spellLink]: 0|1 }. */
  getGnomeSpellUses() {
    return this.gnomeSpellUses && typeof this.gnomeSpellUses === 'object' ? { ...this.gnomeSpellUses } : {};
  }

  /**
   * The highest multiple-of-4 level this character has reached — the level
   * whose +1 ability increase is the most recent one earned. 0 below 4th.
   *
   * There is no multiclassing in the model, so the count of increases earned
   * is exactly `floor(level / 4)`. (experience-and-leveling.md: +1 to one
   * ability score at character levels 4, 8, 12, 16 and 20.)
   */
  getAbilityIncreaseLevel() {
    return Math.floor(this.getLevel() / 4) * 4;
  }

  /**
   * How many +1 ability increases are earned but not yet acknowledged.
   *
   * More than one is normal rather than exceptional: a character entered at
   * 12th has crossed three, and one levelled from 7 to 8 without visiting the
   * ability screen has two outstanding.
   */
  getAbilityIncreasesOwed() {
    const earned = this.getAbilityIncreaseLevel();
    const acked = Math.min(this.abilityIncreaseAcked || 0, earned);
    return Math.max(0, (earned - acked) / 4);
  }

  /**
   * Record that the player has been to the ability screen and dealt with it.
   *
   * Deliberately not a check that a score actually rose: the sheet computes and
   * reminds but never enforces, and a player may legitimately decide to note
   * the increase elsewhere or to have already applied it by hand.
   */
  acknowledgeAbilityIncreases() {
    this.abilityIncreaseAcked = this.getAbilityIncreaseLevel();
  }

  /** Mark one use of a gnome racial spell (1/day). */
  useGnomeSpell(link) {
    if (typeof link !== 'string' || link.trim() === '') return;
    if (!this.gnomeSpellUses || typeof this.gnomeSpellUses !== 'object') this.gnomeSpellUses = {};
    const current = this.gnomeSpellUses[link] ?? 0;
    this.gnomeSpellUses[link] = Math.min(1, current + 1);
  }

  /** Reset all gnome spell uses (e.g. after long rest). */
  resetGnomeSpellUses() {
    this.gnomeSpellUses = {};
  }

  // —— Class-feature uses ——
  /**
   * Per-day class-feature consumption, keyed by feature. Uses-per-day features
   * count whole uses; pools store the amount spent. Returns a defensive copy.
   * @returns {Object<string, number>}
   */
  getClassFeatureUses() {
    return this.classFeatureUses && typeof this.classFeatureUses === 'object'
      ? { ...this.classFeatureUses }
      : {};
  }

  /** Amount already used or spent for one feature. */
  getClassFeatureUsed(key) {
    if (typeof key !== 'string' || key.trim() === '') return 0;
    return this.getClassFeatureUses()[key] ?? 0;
  }

  /**
   * Consume a feature: one use by default, or `amount` points for a pool.
   * Not capped against the feature's maximum — the sheet flags over-cap
   * visually instead of blocking it.
   */
  useClassFeature(key, amount = 1) {
    if (typeof key !== 'string' || key.trim() === '') return;
    const delta = Math.floor(Number(amount));
    if (!Number.isFinite(delta)) return;
    if (!this.classFeatureUses || typeof this.classFeatureUses !== 'object') this.classFeatureUses = {};
    const current = this.classFeatureUses[key] ?? 0;
    this.classFeatureUses[key] = Math.max(0, current + delta);
  }

  /** Set a feature's used amount outright (stepper edits, undoing a use). */
  setClassFeatureUses(key, value) {
    if (typeof key !== 'string' || key.trim() === '') return;
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return;
    if (!this.classFeatureUses || typeof this.classFeatureUses !== 'object') this.classFeatureUses = {};
    this.classFeatureUses[key] = Math.max(0, n);
  }

  /**
   * Whether a long rest would actually change anything: a spent class-feature
   * use, a used gnome racial spell, or damage still to heal. The spellbook's
   * rest button greys out when nothing is left to refresh, and it now performs
   * the same full rest as the combat page's, so it has to ask the same
   * question. Spell slots are the spellbook's own business and are tested
   * alongside this, not here.
   */
  needsRest() {
    /* A spent weekly counter is not a reason to rest: resting would not give
       it back, so offering the button would be a lie about what it does. */
    const daily = Object.entries(this.getClassFeatureUses())
      .filter(([key]) => !Player.WEEKLY_FEATURE_KEYS.includes(key));
    if (daily.some(([, n]) => Number(n) > 0)) return true;
    const gnome = this.gnomeSpellUses;
    if (gnome && typeof gnome === 'object' && Object.values(gnome).some((n) => Number(n) > 0)) return true;
    if (this.getRestHealAmount() > 0) return true;
    // A wounded companion, mount or familiar is reason enough to rest.
    return [this.companion, this.specialMount, this.familiar]
      .some((creature) => (creature?.getRestHealAmount?.() ?? 0) > 0);
  }

  /**
   * Counters that refresh **weekly** rather than daily, so a night's rest must
   * leave them alone. Both cards already told the player as much; until this
   * list existed the rest button quietly contradicted them.
   */
  static WEEKLY_FEATURE_KEYS = ['quiveringPalm', 'removeDisease'];

  /** Clear every daily class-feature counter (rest). */
  resetClassFeatureUses() {
    const kept = {};
    Player.WEEKLY_FEATURE_KEYS.forEach((key) => {
      const used = this.getClassFeatureUsed(key);
      if (used > 0) kept[key] = used;
    });
    this.classFeatureUses = kept;
    // The mount's summoning allowance is a daily pool too, but it lives on the
    // mount rather than in this map.
    if (this.specialMount) this.specialMount.resetSummonHours();
  }

  // —— Setters (for UI / Redux updates) ——
  setName(name) {
    this.name = typeof name === 'string' ? name : '';
  }

  setRace(race) {
    this.race = typeof race === 'string' ? race : '';
  }

  setPortrait(value) {
    this.portrait = typeof value === 'string' ? value : '';
  }

  setClass(_class) {
    this.class = typeof _class === 'string' ? _class : '';
    this.maxLife = Math.max(this.getBaseLifeMin(), this.maxLife);
  }

  setLevel(level) {
    this.level = clamp(level, 1, 20);
  }

  setAbilityBase(abilityKey, value) {
    if (!ABILITY_KEYS.includes(abilityKey)) return;
    this.abilities[abilityKey].base = clamp(value, 0, 99);
  }

  setAbilityBonus(abilityKey, value) {
    if (!ABILITY_KEYS.includes(abilityKey)) return;
    this.abilities[abilityKey].bonus = clamp(value, -20, 99);
  }

  // —— Notes ——
  getNoteNames() {
    return Object.keys(this.notes || {}).sort();
  }

  getSelectedNoteName() {
    return typeof this.selectedNoteName === 'string' ? this.selectedNoteName : '';
  }

  getNote(name) {
    const n = (this.notes || {})[name];
    if (!n || typeof n !== 'object') return { text: '', updatedAt: Date.now() };
    return {
      text: typeof n.text === 'string' ? n.text : '',
      updatedAt: Number.isFinite(n.updatedAt) ? n.updatedAt : Date.now(),
    };
  }

  addNote(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    if (!this.notes) this.notes = {};
    const now = Date.now();
    this.notes[trimmed] = { text: '', updatedAt: now };
    this.selectedNoteName = trimmed;
  }

  setSelectedNoteName(name) {
    const trimmed = (name || '').trim();
    if (trimmed === '' || (this.notes && this.notes[trimmed] != null)) {
      this.selectedNoteName = trimmed;
    }
  }

  updateNoteContent(name, text) {
    if (!this.notes || this.notes[name] == null) return;
    this.notes[name] = {
      text: typeof text === 'string' ? text : '',
      updatedAt: Date.now(),
    };
  }

  deleteNote(name) {
    if (!this.notes) return;
    delete this.notes[name];
    if (this.selectedNoteName === name) {
      const names = this.getNoteNames();
      this.selectedNoteName = names.length > 0 ? names[0] : '';
    }
  }

  // —— Combat / HP ——
  /**
   * Minimum base life = class hit dice max (e.g. d8 -> 8).
   * Represents the guaranteed L1 contribution (max roll on the first HD).
   */
  getBaseLifeMin() {
    const data = getClassData(this.class);
    return hitDiceToMax(data?.hitDice);
  }

  /**
   * Theoretical maximum base life: HD_max × level. This is what a character
   * gets if they roll the maximum value on every hit die at every level.
   * Used as a soft cap in the UI — exceeding it is allowed (UI must show
   * a warning) per the "rules are not enforced, only signaled" policy.
   */
  getBaseLifeMax() {
    const data = getClassData(this.class);
    return hitDiceToMax(data?.hitDice) * this.getLevel();
  }

  /**
   * Total max HP = base life + bonus modifier + (Con modifier × level).
   * Con modifier can be negative, so total can be reduced.
   */
  getMaxLife() {
    const base = Number(this.maxLife) || 0;
    const bonus = Number(this.healthModifier) || 0;
    // Deliberately the UNSHAPED Con: a wild-shaped druid keeps her own hit
    // points, even though the form's Con drives Fortitude saves and Con checks
    // (magic.md → Polymorph sub-rules → Hit points).
    const conBonus = this.getUnshapedConMod() * this.getLevel();
    // Energy Drained removes 5 HP per negative level (manual/score channel).
    // A Toad familiar grants the master +3 HP (per-species familiar bonus).
    // Toughness is +3 hp and may be taken more than once.
    return base + bonus + conBonus + this.getHpConditionModifier() + this.getFamiliarStatBonuses().hp
      + getFeatHpBonus(this.getFeats());
  }

  /**
   * Current HP. Can go negative — in D&D 3.5 a character is dying from
   * -1 to -9 and dead at -10. Floor is enforced upstream by the damage
   * thunk (damage capped at maxHp + 10), so this method intentionally
   * does NOT clamp at 0.
   */
  getCurrentHp() {
    return this.getMaxLife() - (Number(this.damage) || 0);
  }

  getDamage() {
    return Number(this.damage) || 0;
  }

  setMaxLife(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    this.maxLife = Math.max(this.getBaseLifeMin(), n);
  }

  setHealthModifier(value) {
    this.healthModifier = Number(value) || 0;
  }

  setDamage(value) {
    this.damage = Math.max(0, Number(value) || 0);
  }

  /**
   * The class fast-movement bonus in feet, after its own qualification gate.
   *
   * Barbarian fast movement applies only in light armor or none and at a light
   * load or lighter. The monk's unarmored speed bonus has the same shape with a
   * stricter armor gate. Both the value and the gate live in classes.json.
   *
   */
  getFastMovementBonus() {
    const bonus = Number(getProgressionValue(this.class, 'fastMovement', this.getLevel(), 0)) || 0;
    if (bonus <= 0) return 0;
    const prog = getClassProgression(this.class);
    const load = this.getLoadStatus();
    const encumbered = load !== 'none' && load !== 'light';
    const armorCategory = String(this.getEquippedArmorRaw()?.Category || '').toLowerCase();
    if (prog.fastMovementRequiresUnarmoredAndLight) {
      return armorCategory || encumbered ? 0 : bonus;
    }
    if (prog.fastMovementRequiresLightArmorAndLoad) {
      if (armorCategory && armorCategory !== 'light') return 0;
      if (encumbered) return 0;
    }
    return bonus;
  }

  /**
   * Base land speed (feet). From race, plus the class fast-movement bonus when
   * the character qualifies for it: Barbarian +10 in light armor or none at a
   * light load or lighter, Monk +10 at 3rd rising to +60 at 18th, unarmored.
   */
  getBaseSpeed() {
    // An assumed form replaces the character's land speed outright — class
    // fast movement is a class feature of the druid's own body, not the form's.
    const form = this.getWildShapeForm();
    if (form) return this.getWildShapeSpeed('land');
    const races = loadFile('races');
    const base = Number(races?.[this.race]?.landSpeed) || 30;
    if (!getClassData(this.class)) return base;
    return base + this.getFastMovementBonus();
  }

  /**
   * A movement mode of the assumed form, capped as alter self requires:
   * 120 ft flying, 60 ft for everything else. Zero when in true form or when
   * the form lacks that mode.
   */
  getWildShapeSpeed(mode = 'land') {
    const speed = readSpeedValue(this.getWildShapeForm()?.speed?.[mode]);
    if (speed <= 0) return 0;
    const cap = mode === 'fly' ? SHAPE_MAX_SPEED.fly : SHAPE_MAX_SPEED.other;
    return Math.min(speed, cap);
  }

  /**
   * Every movement mode the assumed form grants, as `{ mode, speed }`, capped.
   * Empty in true form. Used by the card to list burrow/climb/fly/swim, which
   * the single speed stat cannot show.
   */
  getWildShapeMovementModes() {
    const speed = this.getWildShapeForm()?.speed;
    if (!speed || typeof speed !== 'object') return [];
    return Object.keys(speed)
      .filter((mode) => mode !== 'raw' && readSpeedValue(speed[mode]) > 0)
      .map((mode) => ({ mode, speed: this.getWildShapeSpeed(mode) }));
  }

  /**
   * Total speed = base speed + speedBonus.
   */
  getTotalSpeed() {
    const speed = this.getBaseSpeed() + Number(this.speedBonus || 0);
    // Half-speed conditions (Blinded/Exhausted/Entangled/Disabled) apply once.
    return this.isHalfSpeed() ? Math.floor(speed / 2) : speed;
  }

  /** speedBonus and the half-speed conditions, applied to a raw mode speed. */
  _applySpeedModifiers(raw) {
    const speed = raw + Number(this.speedBonus || 0);
    return this.isHalfSpeed() ? Math.floor(speed / 2) : speed;
  }

  /**
   * The movement the character actually gets around on, as `{ mode, speed }`.
   *
   * Normally the land speed, but a form that flies or burrows faster than it
   * walks travels at that instead — an air elemental has no land speed at all,
   * so reporting only the walk would show 0 ft. Swimming and climbing are
   * excluded: neither carries you across open ground, so neither belongs in
   * the one number the sheet shows for "how far can I move".
   *
   * The other modes stay available through getWildShapeMovementModes.
   */
  getPrimaryMovement() {
    if (!this.getWildShapeForm()) return { mode: 'land', speed: this.getTotalSpeed() };
    let best = { mode: 'land', speed: this.getWildShapeSpeed('land') };
    SPEED_TRAVERSAL_MODES.forEach((mode) => {
      const speed = this.getWildShapeSpeed(mode);
      if (speed > best.speed) best = { mode, speed };
    });
    if (best.mode === 'land') return { mode: 'land', speed: this.getTotalSpeed() };
    return { mode: best.mode, speed: this._applySpeedModifiers(best.speed) };
  }

  /**
   * Get armor speed reduction info. Returns { hasReduction, originalSpeed, reducedSpeed }.
   * Dwarves ignore armor speed reduction. Monk/Barbarian bonuses are preserved on top of reduced speed.
   */
  getArmorSpeedInfo() {
    // Melded armor slows nothing: the form moves at its own speed.
    if (this.isEquipmentMelded()) {
      return { hasReduction: false, originalSpeed: this.getTotalSpeed(), reducedSpeed: this.getTotalSpeed() };
    }
    const armor = this.getEquippedArmorRaw();
    const races = loadFile('races');
    const raceLandSpeed = Number(races?.[this.race]?.landSpeed) || 30;

    // Dwarves ignore armor speed reduction
    if (this.race === 'Dwarf') {
      return { hasReduction: false, originalSpeed: this.getTotalSpeed(), reducedSpeed: this.getTotalSpeed() };
    }

    if (!armor) {
      return { hasReduction: false, originalSpeed: this.getTotalSpeed(), reducedSpeed: this.getTotalSpeed() };
    }

    const key = raceLandSpeed === 20 ? 'Speed (6m)' : 'Speed (9m)';
    const armorSpeedStr = armor[key];
    if (!armorSpeedStr) {
      return { hasReduction: false, originalSpeed: this.getTotalSpeed(), reducedSpeed: this.getTotalSpeed() };
    }

    const armorSpeed = metersToFeet(armorSpeedStr);
    if (armorSpeed === null || armorSpeed >= raceLandSpeed) {
      return { hasReduction: false, originalSpeed: this.getTotalSpeed(), reducedSpeed: this.getTotalSpeed() };
    }

    // Reduction applies to base race speed; class bonuses and speedBonus are added on top
    const classBonus = this.getBaseSpeed() - raceLandSpeed;
    let reducedTotal = armorSpeed + classBonus + Number(this.speedBonus || 0);
    // Half-speed conditions also halve the armor-reduced speed (once). originalSpeed
    // goes through getTotalSpeed, which already applies the same halving.
    if (this.isHalfSpeed()) reducedTotal = Math.floor(reducedTotal / 2);
    return {
      hasReduction: true,
      originalSpeed: this.getTotalSpeed(),
      reducedSpeed: reducedTotal,
    };
  }

  /**
   * Initiative modifier = Dexterity modifier.
   */
  getInitiativeModifier() {
    return this.getDexMod() + this.getInitiativeConditionModifier();
  }

  /**
   * Base Attack Bonus from the class's progression multiplier.
   * classes.json stores it as a string like "x1" (Good), "x3/4" (Average),
   * or "x1/2" (Poor). BAB = floor(level × multiplier).
   * See dnd-rules/combat.md and dnd-rules/classes.md.
   */
  getBaseAttackBonus() {
    const data = getClassData(this.class);
    const raw = data?.baseAttack;
    if (typeof raw !== 'string') return 0;
    const cleaned = raw.replace(/^x/i, '').trim();
    const parts = cleaned.split('/').map((n) => Number(n));
    let multiplier = 0;
    if (parts.length === 1 && Number.isFinite(parts[0])) {
      multiplier = parts[0];
    } else if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1]) && parts[1] !== 0) {
      multiplier = parts[0] / parts[1];
    }
    return Math.floor(this.getLevel() * multiplier);
  }

  /**
   * Caster level for the player's class. Used by feat prerequisites (item-creation
   * feats) and spell scaling. Non-casters get 0. Full casters (Bard, Cleric, Druid,
   * Sorcerer, Wizard) use their class level. Hybrid divine casters (Paladin, Ranger)
   * gain spells at 4th level with a caster level of half their class level.
   * See dnd-rules/magic.md.
   */
  getCasterLevel() {
    const data = getClassData(this.class);
    if (!data?.hasSpells) return 0;
    const level = this.getLevel();
    if (this.class === 'Paladin' || this.class === 'Ranger') {
      return level < 4 ? 0 : Math.floor(level / 2);
    }
    return level;
  }

  /**
   * The dice an unarmed strike rolls, with no modifiers. Defaults to PHB
   * size-based damage (Medium = 1d3); a monk uses the scaling table from
   * class-features.md (1d6 at L1, ..., 2d10 at L20), shifted for Large/Small.
   */
  getPunchDamageDice() {
    const size = this.getSize() || 'Medium';
    if (this.class === 'Monk') {
      return monkUnarmedDamage(this.getLevel(), size);
    }
    return defaultUnarmedDamage(size);
  }

  /**
   * Attack bonus for an unarmed strike, built the same way a weapon's is: base
   * attack, an ability modifier, active conditions, and Weapon Focus / Greater
   * Weapon Focus if they were taken in unarmed strike. An unarmed strike counts
   * as a light weapon, so Weapon Finesse applies to it and the better of
   * Strength or Dexterity is used.
   */
  getPunchAttackBonus() {
    const strMod = this.getStrMod();
    const dexMod = this.getDexMod();
    const abilityMod = hasWeaponFinesse(this.getFeats()) ? Math.max(strMod, dexMod) : strMod;
    return this.getBaseAttackBonus() + abilityMod + this.getAttackConditionModifier()
      + getFeatUnarmedAttackBonus(this.getFeats())
      + this.getPunchProficiencyPenalty();
  }

  /**
   * Full unarmed damage string, formatted like a weapon's: the dice plus the
   * Strength modifier, any condition penalty, and Weapon Specialization /
   * Greater Weapon Specialization taken in unarmed strike. An unarmed strike is
   * a light weapon, so it never gets the two-handed 1.5x Strength.
   */
  getPunchDamage() {
    const dice = this.getPunchDamageDice();
    const bonus = this.getStrMod()
      + this.getDamageConditionModifier()
      + getFeatUnarmedDamageBonus(this.getFeats());
    if (bonus === 0) return dice;
    return bonus > 0 ? `${dice}+${bonus}` : `${dice}${bonus}`;
  }

  /**
   * Rogue sneak attack bonus dice: +1d6 at 1st level and a further +1d6 every
   * two levels, to +10d6 at 19th. Zero for every other class.
   *
   * The dice apply when the target is denied its Dex bonus or the rogue is
   * flanking (ranged attacks only within 30 ft), and are added on a critical
   * hit but never multiplied. See dnd-rules/class-features.md (Rogue).
   */
  getSneakAttackDice() {
    return getProgressionValue(this.class, 'sneakAttackDice', this.getLevel(), 0);
  }

  /**
   * How far a ranged sneak attack still reaches, in feet. Both this and the
   * immune list sat in classes.json unread while the same numbers were typed
   * into a hover tooltip on the combat page — which a phone could not show.
   */
  getSneakAttackRange() {
    return getProgressionValue(this.class, 'sneakAttackRangeFeet', this.getLevel(), 0);
  }

  /** The creature types with no vitals to find, so no sneak attack lands. */
  getSneakAttackImmuneTypes() {
    const list = getClassProgression(this.class).sneakAttackImmuneTypes;
    return Array.isArray(list) ? [...list] : [];
  }

  // —— Rogue special abilities ——

  /**
   * The levels at which the rogue picks a special ability, filtered to those
   * already reached — 10th, then every third level. Empty for other classes.
   */
  getRogueSpecialAbilityLevels() {
    const levels = getClassProgression(this.class).specialAbilityLevels;
    if (!Array.isArray(levels)) return [];
    const level = this.getLevel();
    return levels.map(Number).filter((at) => Number.isFinite(at) && at <= level).sort((a, b) => a - b);
  }

  /**
   * Every option the rogue may pick, the six named abilities plus the "a feat
   * instead" entry the SRD offers alongside them.
   */
  getRogueSpecialAbilityOptions() {
    const prog = getClassProgression(this.class);
    const named = Array.isArray(prog.specialAbilities) ? [...prog.specialAbilities] : [];
    if (named.length === 0) return [];
    const featOption = prog.specialAbilityFeatOption;
    return featOption ? [...named, String(featOption)] : named;
  }

  /** The rules text for one option, for the card to show under the choice. */
  getRogueSpecialAbilityDescription(name) {
    const map = getClassProgression(this.class).specialAbilityDescriptions;
    return (map && map[name]) || '';
  }

  /** The ability chosen at one level, or '' while the choice is open. */
  getRogueSpecialAbility(level) {
    const chosen = this.rogueSpecialAbilities?.[String(level)];
    return this.getRogueSpecialAbilityOptions().includes(chosen) ? chosen : '';
  }

  /**
   * Choose (or clear, with '') the special ability for one level. The same
   * ability may not be taken twice — picking one already held elsewhere is
   * rejected — except the feat option, which can be repeated.
   */
  setRogueSpecialAbility(level, ability) {
    if (!this.rogueSpecialAbilities || typeof this.rogueSpecialAbilities !== 'object') {
      this.rogueSpecialAbilities = {};
    }
    const key = String(level);
    if (!ability || !this.getRogueSpecialAbilityOptions().includes(ability)) {
      delete this.rogueSpecialAbilities[key];
      return;
    }
    const featOption = getClassProgression(this.class).specialAbilityFeatOption;
    if (ability !== featOption) {
      const takenElsewhere = this.getRogueSpecialAbilityLevels()
        .some((at) => String(at) !== key && this.getRogueSpecialAbility(at) === ability);
      if (takenElsewhere) return;
    }
    this.rogueSpecialAbilities[key] = ability;
  }

  /** The chosen special abilities so far, as `{ level, ability }`. */
  getRogueSpecialAbilities() {
    return this.getRogueSpecialAbilityLevels()
      .map((level) => ({ level, ability: this.getRogueSpecialAbility(level) }))
      .filter((entry) => entry.ability !== '');
  }

  /** Whether the rogue took a particular special ability at any of her levels. */
  hasRogueSpecialAbility(name) {
    return this.getRogueSpecialAbilities().some((entry) => entry.ability === name);
  }

  /**
   * Improved evasion: half damage even on a failed Reflex save. The monk gains
   * it outright at the level in `progression`; a rogue may instead pick it as
   * one of her special abilities, so both channels are asked.
   */
  hasImprovedEvasion() {
    return hasFeatureAtLevel(this.class, 'improvedEvasionLevel', this.getLevel())
      || this.hasRogueSpecialAbility('Improved Evasion');
  }

  /**
   * Bonus feat slots earned by taking "a feat" in place of a special ability.
   * They widen the general feat budget rather than forming a pool of their
   * own — the SRD places no restriction on what the feat may be.
   */
  getRogueBonusFeatSlots() {
    const featOption = getClassProgression(this.class).specialAbilityFeatOption;
    if (!featOption) return 0;
    return this.getRogueSpecialAbilities().filter((e) => e.ability === featOption).length;
  }

  /**
   * Barbarian rages per day: 1 at 1st level and a further one every four
   * levels, to 6 at 20th. Zero for every other class.
   */
  getRageUsesMax() {
    return getProgressionValue(this.class, 'rageUsesPerDay', this.getLevel(), 0);
  }

  /**
   * The rage tier in effect: 'rage', 'greater rage' (11th) or 'mighty rage'
   * (20th), naming the bonus set in `rageBonuses`. Null for every other class.
   */
  getRageTier() {
    return getProgressionValue(this.class, 'rageTier', this.getLevel(), null);
  }

  /**
   * The bonuses the current rage tier grants: { str, con, will, ac }.
   * All zero when the character has no rage.
   */
  getRageTierBonuses() {
    const tier = this.getRageTier();
    const table = getClassProgression(this.class).rageBonuses;
    const bonuses = tier ? table?.[tier] : null;
    return {
      str: Number(bonuses?.str) || 0,
      con: Number(bonuses?.con) || 0,
      will: Number(bonuses?.will) || 0,
      ac: Number(bonuses?.ac) || 0,
    };
  }

  /**
   * Tireless rage (17th): the barbarian is no longer fatigued when a rage ends.
   * Orthogonal to the rage tier — a 17th level barbarian still rages at the
   * greater rage bonuses, simply without the aftermath.
   */
  hasTirelessRage() {
    return hasFeatureAtLevel(this.class, 'tirelessRageLevel', this.getLevel());
  }

  /**
   * Barbarian damage reduction X/—: 1 at 7th level and a further point every
   * three levels, to 5 at 19th. Zero below 7th and for every other class.
   */
  getDamageReduction() {
    return getProgressionValue(this.class, 'damageReduction', this.getLevel(), 0);
  }

  /**
   * Every damage reduction currently in effect, as `{ amount, bypass, source }`.
   *
   * Two sources exist: the barbarian's class progression, and an assumed
   * **elemental** form — a Large or bigger elemental carries DR 5/— or 10/—,
   * and elemental wild shape is the one case where the form's special
   * qualities transfer (magic.md, polymorph sub-rules). A normal animal or
   * plant form grants nothing, which getWildShapeSpecialQualities already
   * enforces by returning an empty list outside an elemental shape.
   *
   * DR from different sources does not stack in 3.5 — the best applies, or
   * each applies separately when the bypass types differ. That is a table
   * judgement, so every source is listed rather than silently merged.
   */
  getDamageReductions() {
    const out = [];
    const classDr = this.getDamageReduction();
    if (classDr > 0) out.push({ amount: classDr, bypass: '—', source: this.class });

    /* Perfect Self turns the monk into an outsider with DR 10/magic. It has
       no place in the barbarian's scaling table, so it is its own entry —
       and DR belongs beside the hit points it protects, not on a feature card. */
    if (hasFeatureAtLevel(this.class, 'perfectSelfLevel', this.getLevel())) {
      out.push({ amount: 10, bypass: 'magic', source: 'Perfect Self' });
    }

    this.getWildShapeSpecialQualities().forEach((quality) => {
      const match = String(quality).match(/damage reduction\s+(\d+)\s*\/\s*(\S[^,]*)/i);
      if (!match) return;
      const amount = Number(match[1]);
      if (!amount) return;
      const bypass = match[2].trim().replace(/[.\s]+$/, '');
      out.push({
        amount,
        bypass: bypass === '-' ? '—' : bypass,
        source: this.getWildShapeName() || 'form',
      });
    });

    return out;
  }

  // —— Rage (active stance) ——

  /**
   * Whether a rage is currently running. Gated on the class actually having
   * rage, so a stale flag left by a class change grants nothing.
   */
  isRaging() {
    return !!this.raging && !!this.getRageTier();
  }

  /** Set the rage stance directly, without touching the daily uses. */
  setRaging(value) {
    this.raging = !!value;
  }

  /** Enter a rage: spend one of the day's uses and start the stance. */
  startRage() {
    if (!this.getRageTier()) return;
    this.useClassFeature('rage', 1);
    this.raging = true;
  }

  /**
   * End a rage. The barbarian is fatigued for the rest of the encounter,
   * unless tireless rage (17th) has removed the aftermath.
   */
  endRage() {
    const wasRaging = this.isRaging();
    this.raging = false;
    if (wasRaging && !this.hasTirelessRage()) this.addCondition({ name: 'Fatigued' });
  }

  /**
   * The rage bonus to one ability score — Strength and Constitution only.
   * Applied inside the ability total so it cascades into hit points, saves,
   * skills, carrying capacity and attack and damage rolls.
   */
  getRageAbilityBonus(abilityKey) {
    if (!this.isRaging()) return 0;
    const bonuses = this.getRageTierBonuses();
    if (abilityKey === 'str') return bonuses.str;
    if (abilityKey === 'con') return bonuses.con;
    return 0;
  }

  /** The morale bonus a running rage grants on Will saves. */
  getRageWillBonus() {
    return this.isRaging() ? this.getRageTierBonuses().will : 0;
  }

  /** The AC penalty a running rage carries: −2 at every tier. */
  getRageAcModifier() {
    return this.isRaging() ? this.getRageTierBonuses().ac : 0;
  }

  /**
   * The hit points a rage is worth: the Constitution modifier gain times the
   * level, so `level × 2` at the base tier. The rules call these temporary hit
   * points; the model reaches the same total through the boosted Constitution
   * in getMaxLife, so this is reported for display and never added on top.
   * Non-zero for any barbarian, raging or not — it is what a rage would grant.
   */
  getRageTempHp() {
    if (!this.getRageTier()) return 0;
    return Math.floor(this.getRageTierBonuses().con / 2) * this.getLevel();
  }

  /**
   * Rage duration in rounds: 3 + the raged Constitution modifier — the
   * modifier of the boosted score, whether or not the rage is running yet.
   */
  getRageDuration() {
    if (!this.getRageTier()) return 0;
    const base = Number(getClassProgression(this.class).rageDurationBase) || 0;
    const ragedCon = this.isRaging()
      ? this.getConMod()
      : Math.floor((this.getAbilityTotal('con') + this.getRageTierBonuses().con - 10) / 2);
    return base + ragedCon;
  }

  // —— Turn / rebuke undead (cleric and paladin) ——

  /**
   * The class's turning configuration, or null when it has none. A paladin
   * turns as a cleric of three levels lower and only from 4th level, both of
   * which are expressed here rather than branching on the class name.
   */
  getTurnUndeadConfig() {
    const config = getClassProgression(this.class).turnUndead;
    if (!config || typeof config !== 'object') return null;
    return this.getLevel() >= (Number(config.minLevel) || 1) ? config : null;
  }

  /** Whether the character can turn or rebuke undead at their current level. */
  canTurnUndead() {
    return this.getTurnUndeadConfig() !== null;
  }

  /**
   * Attempts per day: `3 + Charisma modifier`, floored at zero. A cleric has
   * them from 1st level, a paladin from 4th.
   */
  getTurnUndeadAttemptsMax() {
    const config = this.getTurnUndeadConfig();
    if (!config) return 0;
    const base = Number(config.attemptsBase) || 0;
    // Extra Turning adds four attempts each time it is taken.
    return Math.max(0, base + this.getModifier(config.attemptsAbility || 'cha')
      + getFeatTurnUndeadAttempts(this.getFeats()));
  }

  /**
   * The level the character turns at: their class level for a cleric, three
   * lower for a paladin. Never negative, and zero without the feature.
   */
  getTurnUndeadEffectiveLevel() {
    const config = this.getTurnUndeadConfig();
    if (!config) return 0;
    // Improved Turning: turn as if one level higher in the granting class.
    return Math.max(0, this.getLevel() + (Number(config.effectiveLevelOffset) || 0)
      + getFeatTurnUndeadLevelBonus(this.getFeats()));
  }

  /**
   * The bonus added to the d20 turning check: the Charisma modifier, plus the
   * synergy from five ranks of Knowledge (religion). The synergy is on the
   * *check* only — the turning damage roll does not get it, which is why
   * `getTurnUndeadDamage` adds the ability modifier itself rather than
   * borrowing this number as it used to.
   */
  getTurnUndeadCheckBonus() {
    const config = this.getTurnUndeadConfig();
    if (!config) return 0;
    return this.getModifier(config.attemptsAbility || 'cha')
      + this.getCheckSynergyBonus('turnUndead');
  }

  /**
   * The highest undead HD a given turning check result reaches, from the SRD
   * table: the effective level shifted by −4 on a failed check up to +4 on 22
   * or better. Never negative.
   */
  getTurnUndeadHighestHd(checkResult) {
    if (!this.canTurnUndead()) return 0;
    const result = Number(checkResult);
    if (!Number.isFinite(result)) return 0;
    let offset = TURN_UNDEAD_TABLE[0][1];
    for (const [minimum, shift] of TURN_UNDEAD_TABLE) {
      if (result >= minimum) offset = shift;
    }
    return Math.max(0, this.getTurnUndeadEffectiveLevel() + offset);
  }

  /**
   * Turning damage — the total undead HD affected — as `2d6 + effective level
   * + Charisma modifier`. Returns the dice and the flat bonus separately so
   * the UI can show either the formula or just the modifier.
   */
  getTurnUndeadDamage() {
    const config = this.getTurnUndeadConfig();
    if (!config) return { dice: '', bonus: 0, formula: '' };
    const dice = getClassProgression(this.class).turningDamageDice || '2d6';
    const bonus = this.getTurnUndeadEffectiveLevel()
      + this.getModifier(config.attemptsAbility || 'cha');
    return { dice, bonus, formula: `${dice}${bonus >= 0 ? '+' : ''}${bonus}` };
  }

  /**
   * The highest undead HD destroyed outright rather than turned: destruction
   * applies when the effective level is at least twice the undead's HD.
   */
  getTurnUndeadDestroyThreshold() {
    return Math.floor(this.getTurnUndeadEffectiveLevel() / 2);
  }

  /**
   * Whether the character rebukes and commands undead instead of turning and
   * destroying them. Evil clerics rebuke; paladins never do.
   */
  rebukesUndead() {
    const config = this.getTurnUndeadConfig();
    if (!config?.canRebuke) return false;
    return this.moralAlignment === 'Evil';
  }

  // —— Alignment and code of conduct ——

  /**
   * Whether the character has fallen: a paladin who breaks the code, a monk
   * who stops being lawful, and so on. Display only — the model keeps every
   * derived value intact, per the non-enforcing rule in CLAUDE.md.
   */
  isExClass() {
    return !!this.exClass;
  }

  /** Mark or clear the fallen state. Cleared by atonement in the fiction. */
  setExClass(value) {
    this.exClass = !!value;
  }

  /** Whether the class carries a code of conduct that can be broken. */
  hasCodeOfConduct() {
    return !!getClassProgression(this.class).hasCodeOfConduct;
  }

  // —— Deity ——

  /**
   * Whether this class is asked for a patron deity. Divine classes only:
   * a cleric must have one, and paladins, druids and rangers may. Arcane and
   * non-casting classes are not asked — religion is flavor for them.
   */
  usesDeity() {
    return !!getClassProgression(this.class).usesDeity;
  }

  /** The recorded deity name, free text and possibly not in the table. */
  getDeity() {
    return this.deity || '';
  }

  setDeity(value) {
    this.deity = typeof value === 'string' ? value.trim() : '';
  }

  /** The deities.json entry for the recorded name, or null for a custom patron. */
  getDeityData() {
    return getDeityByName(this.deity);
  }

  /** The deity's alignment as a phrase ("Lawful Good"), empty if unknown. */
  getDeityAlignment() {
    return formatDeityAlignment(this.getDeityData());
  }

  /** The domains the deity grants, or [] when the patron is not in the table. */
  getDeityDomains() {
    const deity = this.getDeityData();
    return Array.isArray(deity?.domains) ? [...deity.domains] : [];
  }

  /**
   * Alignment problems with the current class, as `{ code, message }` entries.
   * Empty when nothing is wrong.
   *
   * Six rules, all data-driven: a required alignment (paladin, monk), a
   * forbidden one (barbarian, bard), a class needing one neutral axis (druid),
   * a cleric holding an alignment domain that does not match them, a cleric
   * drifted more than one step from their deity, and a cleric holding a domain
   * their deity does not grant.
   *
   * The last two are skipped for a deity that is not in deities.json — a
   * homebrew patron has no alignment or domain list to check against.
   */

  getAlignmentWarnings() {
    const prog = getClassProgression(this.class);
    const ethical = this.ethicalAlignment || 'Neutral';
    const moral = this.moralAlignment || 'Neutral';
    const current = ethical === 'Neutral' && moral === 'Neutral'
      ? 'True Neutral'
      : `${ethical} ${moral}`;
    const warnings = [];

    const required = prog.alignmentRequired;
    if (typeof required === 'string' && required) {
      const [needEthical, needMoral] = required.split(' ');
      if (ethical !== needEthical || (needMoral && moral !== needMoral)) {
        warnings.push({
          code: 'alignmentRequired',
          message: `A ${this.class} must be ${required}, not ${current}.`,
        });
      }
    }

    const forbidden = prog.alignmentForbidden;
    if (typeof forbidden === 'string' && (ethical === forbidden || moral === forbidden)) {
      warnings.push({
        code: 'alignmentForbidden',
        message: `A ${forbidden} character cannot advance as a ${this.class}.`,
      });
    }

    if (prog.alignmentRequiresNeutralAxis && ethical !== 'Neutral' && moral !== 'Neutral') {
      warnings.push({
        code: 'neutralAxisRequired',
        message: `A ${this.class} must be neutral on at least one axis; ${current} is neither.`,
      });
    }

    const alignmentDomains = prog.alignmentDomains;
    if (alignmentDomains) {
      [this.domain1, this.domain2].forEach((domain) => {
        const rule = domain ? alignmentDomains[domain] : null;
        if (!rule) return;
        const actual = rule.axis === 'ethical' ? ethical : moral;
        if (actual !== rule.value) {
          warnings.push({
            code: 'alignmentDomainMismatch',
            message: `The ${domain} domain needs a ${rule.value} cleric; this one is ${current}.`,
          });
        }
      });
    }

    const deity = this.getDeityData();
    if (deity && prog.alignmentWithinOneStepOfDeity
      && !isWithinOneStep(deity, ethical, moral)) {
      warnings.push({
        code: 'deityAlignmentDrift',
        message: `${current} is more than one step from ${deity.name} (${formatDeityAlignment(deity)}).`,
      });
    }

    if (deity && prog.deityDomainsRequired) {
      const granted = this.getDeityDomains();
      [this.domain1, this.domain2].forEach((domain) => {
        if (!domain || granted.includes(domain)) return;
        warnings.push({
          code: 'deityDomainNotGranted',
          message: `${deity.name} does not grant the ${domain} domain (${granted.join(', ')}).`,
        });
      });
    }

    return warnings;
  }

  /**
   * The druid's Nature Sense: a flat +2 to Knowledge (nature) and Survival,
   * the same shape as the fifteen skill-pair feats. Which skills and how much
   * are read from `progression.natureSense`, never restated here.
   * @returns {number} 0 for a class or skill it does not touch.
   */
  getNatureSenseBonus(skillName) {
    const table = getClassProgression(this.class).natureSense;
    if (!table || typeof table !== 'object') return 0;
    const wanted = String(skillName || '').trim().toLowerCase();
    const entry = Object.entries(table).find(([name]) => name.toLowerCase() === wanted);
    return entry ? Number(entry[1]) || 0 : 0;
  }

  /**
   * Wild empathy: `1d20 + class level + Cha` to shift an animal's attitude,
   * the druid's and ranger's version of a Diplomacy check. A magical beast of
   * Intelligence 1–2 can be worked at −4. The ability comes from
   * `progression.wildEmpathyAbility`; a class without one answers null, which
   * is what distinguishes "no such feature" from "a bonus of +0".
   * @returns {number|null}
   */
  getWildEmpathyBonus() {
    const ability = getClassProgression(this.class).wildEmpathyAbility;
    if (!ability) return null;
    // Five ranks of Handle animal help here as well as on Ride.
    return this.getLevel() + this.getModifier(ability)
      + this.getCheckSynergyBonus('wildEmpathy');
  }

  /**
   * Spell resistance from a class feature: the monk's Diamond Soul, at
   * `10 + monk level` from the level in `progression.diamondSoulLevel`.
   * Zero for everyone else — the paladin's mount has its own, on its own card.
   */
  getSpellResistance() {
    if (!hasFeatureAtLevel(this.class, 'diamondSoulLevel', this.getLevel())) return 0;
    return 10 + this.getLevel();
  }

  // —— Ranger ——

  /**
   * Favored enemy slots: one at 1st level and another every five levels, so
   * `1 + floor(level / 5)`. Each slot either names a new enemy or raises an
   * existing one. Zero for every other class.
   */
  getFavoredEnemySlotsMax() {
    const levels = getClassProgression(this.class).favoredEnemyLevels;
    if (!Array.isArray(levels)) return 0;
    const level = this.getLevel();
    return levels.filter((at) => Number(at) <= level).length;
  }

  /**
   * Slots actually spent. An entry at +2 cost one slot, +4 cost two, and so
   * on, since raising an existing enemy consumes a slot just as naming a new
   * one does.
   */
  getFavoredEnemySlotsUsed() {
    const step = Number(getClassProgression(this.class).favoredEnemyBonusStep) || 2;
    return this.getFavoredEnemies()
      .reduce((sum, entry) => sum + Math.max(1, Math.round(entry.bonus / step)), 0);
  }

  /** The chosen favored enemies, in selection order. Returns copies. */
  getFavoredEnemies() {
    return Array.isArray(this.favoredEnemies)
      ? this.favoredEnemies.map((e) => ({ ...e }))
      : [];
  }

  /** The creature types a favored enemy may be chosen from. */
  getFavoredEnemyTypes() {
    const types = getClassProgression(this.class).favoredEnemyTypes;
    return Array.isArray(types) ? [...types] : [];
  }

  /** The subtypes available for a type, empty when it takes none. */
  getFavoredEnemySubtypes(type) {
    const map = getClassProgression(this.class).favoredEnemySubtypes;
    const list = map?.[type];
    return Array.isArray(list) ? [...list] : [];
  }

  /** Humanoids and outsiders are too broad to take whole: they need a subtype. */
  favoredEnemyRequiresSubtype(type) {
    const required = getClassProgression(this.class).favoredEnemySubtypeRequiredFor;
    return Array.isArray(required) && required.includes(type);
  }

  /** The skills a favored enemy bonus applies to, against that enemy only. */
  getFavoredEnemySkills() {
    const skills = getClassProgression(this.class).favoredEnemySkills;
    return Array.isArray(skills) ? [...skills] : [];
  }

  /** Whether a named skill is one the favored enemy bonus reaches. */
  appliesFavoredEnemyBonusToSkill(skillName) {
    return this.getFavoredEnemySkills()
      .some((s) => s.toLowerCase() === String(skillName).trim().toLowerCase());
  }

  /**
   * The bonus this character has against one creature type, applying both to
   * the favored enemy skills and to weapon damage. Zero when the type is not
   * a favored enemy. A subtype must match when the entry carries one.
   */
  getFavoredEnemyBonus(type, subtype = null) {
    const wanted = String(type || '').trim().toLowerCase();
    if (!wanted) return 0;
    const wantedSub = subtype ? String(subtype).trim().toLowerCase() : null;
    const match = this.getFavoredEnemies().find((e) => {
      if (String(e.type).toLowerCase() !== wanted) return false;
      if (!e.subtype) return true;
      return wantedSub !== null && String(e.subtype).toLowerCase() === wantedSub;
    });
    return match ? match.bonus : 0;
  }

  /**
   * Name a new favored enemy at the base bonus. Duplicates are rejected —
   * raising an existing enemy is raiseFavoredEnemy, a different slot use.
   * Going past the earned slots is allowed and flagged in the UI.
   * @returns {boolean} whether it was added
   */
  addFavoredEnemy(type, subtype = null) {
    const name = String(type || '').trim();
    if (!name) return false;
    const sub = subtype ? String(subtype).trim() : null;
    if (!Array.isArray(this.favoredEnemies)) this.favoredEnemies = [];
    const exists = this.favoredEnemies.some((e) =>
      String(e.type).toLowerCase() === name.toLowerCase()
      && String(e.subtype || '').toLowerCase() === String(sub || '').toLowerCase());
    if (exists) return false;
    const step = Number(getClassProgression(this.class).favoredEnemyBonusStep) || 2;
    const entry = { type: name, bonus: step };
    if (sub) entry.subtype = sub;
    this.favoredEnemies.push(entry);
    return true;
  }

  /** Spend a slot raising an existing favored enemy by one step. */
  raiseFavoredEnemy(index) {
    if (!Array.isArray(this.favoredEnemies)) return false;
    const entry = this.favoredEnemies[index];
    if (!entry) return false;
    const step = Number(getClassProgression(this.class).favoredEnemyBonusStep) || 2;
    entry.bonus = (Number(entry.bonus) || 0) + step;
    return true;
  }

  /** Drop a favored enemy entirely, returning every slot it held. */
  removeFavoredEnemyAt(index) {
    if (!Array.isArray(this.favoredEnemies)) return;
    if (index < 0 || index >= this.favoredEnemies.length) return;
    this.favoredEnemies.splice(index, 1);
  }

  /** The combat styles a ranger may choose between, empty for other classes. */
  getCombatStyleOptions() {
    const styles = getClassProgression(this.class).combatStyle?.styles;
    return styles ? Object.keys(styles) : [];
  }

  /** The level at which the combat style is chosen, 0 without the feature. */
  getCombatStyleChoiceLevel() {
    return Number(getClassProgression(this.class).combatStyle?.chooseLevel) || 0;
  }

  /** Whether the ranger is high enough level to have chosen a style. */
  canChooseCombatStyle() {
    const at = this.getCombatStyleChoiceLevel();
    return at > 0 && this.getLevel() >= at;
  }

  /** The chosen combat style, or null when none is set or none is valid. */
  getCombatStyle() {
    const chosen = this.combatStyle;
    if (!chosen) return null;
    return this.getCombatStyleOptions().includes(chosen) ? chosen : null;
  }

  /**
   * Set the combat style. Permanent in the rules, so the model accepts only a
   * style the class actually offers; passing null clears it.
   * @returns {boolean} whether the style was set
   */
  setCombatStyle(style) {
    if (style === null || style === '') {
      this.combatStyle = null;
      return true;
    }
    if (!this.getCombatStyleOptions().includes(style)) return false;
    this.combatStyle = style;
    return true;
  }

  /**
   * The feats the chosen style has granted by this level, in order. These come
   * free of their normal prerequisites and are charged to neither feat budget,
   * so they are deliberately not part of getFeats().
   */
  getCombatStyleFeats() {
    const style = this.getCombatStyle();
    if (!style) return [];
    const table = getClassProgression(this.class).combatStyle?.styles?.[style];
    if (!Array.isArray(table)) return [];
    const level = this.getLevel();
    return table
      .filter((entry) => Array.isArray(entry) && Number(entry[0]) <= level)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([at, feat]) => ({ level: Number(at), feat }));
  }

  /**
   * Whether the style's benefits are currently suppressed: they apply only in
   * light armor or none. True only when a style is actually in play.
   */
  isCombatStyleSuppressed() {
    if (!this.getCombatStyle()) return false;
    if (!getClassProgression(this.class).combatStyle?.requiresLightArmor) return false;
    const category = String(this.getEquippedArmorRaw()?.Category || '').toLowerCase();
    return category !== '' && category !== 'light';
  }

  // —— Bard ——

  /** Bardic music uses per day: a number equal to the bard's class level. */
  getBardicMusicMax() {
    return getProgressionValue(this.class, 'bardicMusicUsesPerDay', this.getLevel(), 0);
  }

  /**
   * The bardic knowledge check modifier: bard level + Intelligence modifier,
   * rolled on a d20 to recall a piece of legend or lore.
   */
  getBardicKnowledgeBonus() {
    const ability = getClassProgression(this.class).bardicKnowledgeAbility;
    if (!ability) return 0;
    // Five ranks of Knowledge (history) help a bard remember.
    return this.getLevel() + this.getModifier(ability)
      + this.getCheckSynergyBonus('bardicKnowledge');
  }

  /** Save DC for the performances that allow one: `10 + half level + Cha`. */
  getPerformanceSaveDc() {
    if (!getClassProgression(this.class).performances) return 0;
    return this.getFeatureSaveDc('performanceSaveDc');
  }

  /** The morale bonus inspire courage grants: +1, rising to +4 at 20th. */
  getInspireCourageBonus() {
    return getProgressionValue(this.class, 'inspireCourageBonus', this.getLevel(), 0);
  }

  /**
   * Every bardic performance with its prerequisites and current availability.
   * A performance unlocks on both class level and actual Perform ranks, so
   * each entry reports the two gates separately — the UI shows a locked
   * performance alongside the prerequisite holding it back rather than hiding it.
   * @returns {Array<{name, level, performRanks, summary, saveDc, meetsLevel, meetsRanks, available}>}
   */
  getBardicPerformances() {
    const performances = getClassProgression(this.class).performances;
    if (!Array.isArray(performances)) return [];
    const level = this.getLevel();
    const ranks = this.getSkillRanks('Perform');
    const saveDc = this.getPerformanceSaveDc();
    return performances
      /* A performance the bard is too low-level for is not a goal, just noise
         — it arrives on its own. One gated on Perform ranks *is* actionable,
         so those stay on the list with the rank they need. */
      .filter((p) => level >= (Number(p.level) || 1))
      .map((p) => {
        const meetsRanks = ranks >= (Number(p.performRanks) || 0);
        return {
          name: p.name,
          level: Number(p.level) || 1,
          performRanks: Number(p.performRanks) || 0,
          summary: p.summary || '',
          saveDc: p.hasSave ? saveDc : null,
          meetsLevel: true,
          meetsRanks,
          available: meetsRanks,
        };
      });
  }

  // —— Monk ——

  /**
   * Stunning fist attempts per day: a number equal to the monk's level.
   * (The `1 per 4 levels` rate is what a non-monk gets from the feat.)
   *
   * Zero unless the feat is actually held — for a monk it is one of two
   * options at 1st level, not something the class hands out.
   */
  getStunningFistMax() {
    if (!this.hasStunningFist()) return 0;
    const fromClass = getProgressionValue(this.class, 'stunningFistUsesPerDay', this.getLevel(), 0);
    /* The monk's allowance equals her class level. Every other class holds the
       feat's own, smaller one — one attempt per four levels — which is why a
       fighter with Stunning Fist used to get a card that never appeared. */
    return fromClass > 0 ? fromClass : getStunningFistFeatUses(this.getLevel());
  }

  /**
   * A class feature's save DC, read from its descriptor in `progression`:
   * `{ base, halfLevel | fullLevel, ability }`. Both features that have one
   * are the familiar `10 + half level + ability`, and both used to state that
   * formula twice — once as prose in classes.json and once in JavaScript here.
   * @param {string} key e.g. 'stunningFistDc'
   * @returns {number} 0 when the class has no such feature.
   */
  getFeatureSaveDc(key) {
    return this.resolveSaveDc(getClassProgression(this.class)[key]);
  }

  /**
   * The same arithmetic for a descriptor that does not come from `progression`
   * — Stunning Fist taken as an ordinary feat has the monk's formula without
   * the monk's class entry to hold it.
   */
  resolveSaveDc(spec) {
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return 0;
    const level = this.getLevel();
    const fromLevel = spec.halfLevel ? Math.floor(level / 2) : (spec.fullLevel ? level : 0);
    return (Number(spec.base) || 0)
      + fromLevel
      + (spec.ability ? this.getModifier(spec.ability) : 0);
  }

  /**
   * Stunning fist save DC: `10 + half level + Wisdom modifier`, which is the
   * same formula whether the monk class or the feat granted it. Gated on
   * holding the feat rather than on having attempts left, so a character below
   * 4th who took it early still sees the number the attempt would use.
   */
  getStunningFistDc() {
    if (!this.hasStunningFist()) return 0;
    const spec = getClassProgression(this.class).stunningFistDc ?? STUNNING_FIST_FEAT_DC;
    return this.resolveSaveDc(spec);
  }

  /**
   * The damage reduction an unarmed strike bypasses: magic at 4th, lawful at
   * 10th, adamantine at 16th. Null before that and for every other class.
   */
  getKiStrikeTier() {
    return getProgressionValue(this.class, 'kiStrike', this.getLevel(), null);
  }

  /**
   * The wholeness of body pool: `2 × monk level` hit points a day, from 7th
   * level, which the monk spends on themselves in any split.
   */
  getWholenessOfBodyMax() {
    const config = getClassProgression(this.class).wholenessOfBody;
    if (!config || this.getLevel() < (Number(config.minLevel) || 1)) return 0;
    return Math.max(0, this.getLevel() * (Number(config.hpPerLevel) || 0));
  }

  /** Hit points still in the wholeness of body pool. Never negative. */
  getWholenessOfBodyRemaining() {
    return Math.max(0, this.getWholenessOfBodyMax() - this.getClassFeatureUsed('wholenessOfBody'));
  }

  /**
   * How much shorter a fall counts as, in feet, when the monk is within arm's
   * reach of a wall: 20 ft at 4th, rising every two levels. At 20th the fall
   * is ignored from any height, reported as Infinity. Zero below 4th.
   */
  getSlowFallDistance() {
    const distance = getProgressionValue(this.class, 'slowFall', this.getLevel(), 0);
    return distance === -1 ? Infinity : distance;
  }

  /**
   * Flurry of blows: the extra attacks it grants at the highest base attack
   * bonus, and the blanket penalty every attack in the flurry takes. The
   * penalty eases from −2 to −1 at 5th and disappears at 9th.
   * @returns {{extraAttacks: number, penalty: number}} both zero without flurry.
   */
  getFlurryOfBlows() {
    const extraAttacks = getProgressionValue(this.class, 'flurryExtraAttacks', this.getLevel(), 0);
    if (!extraAttacks) return { extraAttacks: 0, penalty: 0 };
    return {
      extraAttacks,
      penalty: getProgressionValue(this.class, 'flurryPenalty', this.getLevel(), 0),
    };
  }

  /** Whether the character has flurry of blows at all. */
  hasFlurryOfBlows() {
    return this.getFlurryOfBlows().extraAttacks > 0;
  }

  /**
   * Whether the unarmed strike is available right now — the gate on showing
   * the punch and flurry lines in the attacks card.
   *
   * A whole weapon set must qualify: every occupied hand slot in the active
   * set holds a monk weapon, or the set is empty. A monk with a longsword in
   * one hand is not flurrying, however free the other hand is.
   *
   * Only a class with monk weapons has a set to qualify — for everyone else
   * the punch is simply the fallback when nothing at all is equipped, which
   * the attacks card handles on its own.
   */
  /**
   * Whether a hand is free to punch with.
   *
   * Only the primary set counts: `rh2`/`lh2` is an alternate weapon set the
   * character would have to swap to, not a third and fourth hand. A two-handed
   * weapon occupies both, and a shield occupies the hand holding it.
   *
   * This is the gate on showing the punch line at all — every class can throw
   * one, and a fighter with a sword in one hand and nothing in the other has a
   * real attack the sheet was not offering.
   */
  hasFreeHand() {
    const held = ['rh1', 'lh1']
      .map((slot) => this.equipment?.[slot])
      .filter((entry) => entry?.link);
    if (held.some((entry) => entry.twoHanded === true)) return false;
    return held.length < 2;
  }

  canUseUnarmedStrike() {
    const prog = getClassProgression(this.class);
    if (!Array.isArray(prog.monkWeapons)) return false;
    const sets = [['lh1', 'rh1'], ['lh2', 'rh2']]
      .map((slots) => slots
        .map((slot) => this.equipment?.[slot])
        .filter((entry) => entry?.link));
    /* An empty set is only a qualifying one when *nothing* is held: an unused
       second row is the default for most characters and must not rescue a set
       that holds a longsword. */
    const inUse = sets.filter((held) => held.length > 0);
    if (inUse.length === 0) return true;
    return inUse.some((held) => held.every((entry) => {
      const rawItem = getItemByRef(entry.baseLink || entry.link)?.raw;
      if (!rawItem) return false;
      return this.isFlurryWeapon({ weaponItem: rawItem, isTwoHanded: entry.twoHanded === true });
    }));
  }

  // —— Monk bonus feats ——

  /**
   * The levels at which the monk picks a bonus feat, filtered to those already
   * reached. Empty for every other class.
   */
  getMonkBonusFeatLevels() {
    const options = getClassProgression(this.class).bonusFeatOptions;
    if (!options || typeof options !== 'object') return [];
    const level = this.getLevel();
    return Object.keys(options)
      .map(Number)
      .filter((at) => Number.isFinite(at) && at <= level)
      .sort((a, b) => a - b);
  }

  /** The two feats offered at a given bonus-feat level. */
  getMonkBonusFeatOptions(level) {
    const options = getClassProgression(this.class).bonusFeatOptions?.[String(level)];
    return Array.isArray(options) ? [...options] : [];
  }

  /** The feat chosen at a bonus-feat level, or '' if the choice is open. */
  getMonkBonusFeat(level) {
    const chosen = this.monkBonusFeats?.[String(level)];
    return this.getMonkBonusFeatOptions(level).includes(chosen) ? chosen : '';
  }

  /**
   * Choose (or clear, with '') the bonus feat for one level. The options are
   * mutually exclusive, so setting one replaces whatever was there.
   */
  setMonkBonusFeat(level, feat) {
    if (!this.monkBonusFeats || typeof this.monkBonusFeats !== 'object') this.monkBonusFeats = {};
    const key = String(level);
    if (!feat || !this.getMonkBonusFeatOptions(level).includes(feat)) {
      delete this.monkBonusFeats[key];
      return;
    }
    this.monkBonusFeats[key] = feat;
  }

  /**
   * Bonus feats the class grants by choice, as `{ level, feat }` — the monk's
   * only. Like the ranger's combat-style feats these are charged to no budget
   * and so are deliberately not part of getFeats().
   */
  getChosenClassBonusFeats() {
    return this.getMonkBonusFeatLevels()
      .map((level) => ({ level, feat: this.getMonkBonusFeat(level) }))
      .filter((entry) => entry.feat !== '');
  }

  /**
   * Whether the character has Stunning Fist from any source — chosen as a monk
   * bonus feat, or simply taken as a normal feat by anyone who qualifies.
   */
  hasStunningFist() {
    if (this.getChosenClassBonusFeats().some((e) => e.feat === 'Stunning Fist')) return true;
    return this.getFeats().some((f) => getBaseFeatName(f).toLowerCase() === 'stunning fist');
  }

  // —— The high monk abilities (12th to 19th) ——
  //
  // Each has a use to spend, which is what earns it a counter rather than a
  // line of prose. Every one clears on `resetClassFeatureUses`, so the long
  // rest button restores them along with everything else.

  /** Abundant step: *dimension door* once a day, from 12th. */
  getAbundantStepMax() {
    return hasFeatureAtLevel(this.class, 'abundantStepLevel', this.getLevel()) ? 1 : 0;
  }

  /** The caster level abundant step works at: half the monk's own. */
  getAbundantStepCasterLevel() {
    return this.getAbundantStepMax() > 0 ? Math.floor(this.getLevel() / 2) : 0;
  }

  /**
   * Quivering palm: once a *week*, from 15th. The sheet tracks it with the
   * per-day counters because it is the only counter there is — a rest restores
   * it early, which is the non-enforcing rule doing its job rather than a bug.
   */
  getQuiveringPalmMax() {
    return hasFeatureAtLevel(this.class, 'quiveringPalmLevel', this.getLevel()) ? 1 : 0;
  }

  /** The Fortitude DC to survive a declared quivering palm. */
  getQuiveringPalmDc() {
    return this.getQuiveringPalmMax() > 0 ? this.getFeatureSaveDc('quiveringPalmDc') : 0;
  }

  /** How long the victim stays vulnerable, in days: one per monk level. */
  getQuiveringPalmWindowDays() {
    return this.getQuiveringPalmMax() > 0 ? this.getLevel() : 0;
  }

  /** Empty body: rounds of *etherealness* a day, one per monk level, from 19th. */
  getEmptyBodyMax() {
    return hasFeatureAtLevel(this.class, 'emptyBodyLevel', this.getLevel()) ? this.getLevel() : 0;
  }

  /** Detect evil at will, from the level in `progression`. */
  hasDetectEvil() {
    return hasFeatureAtLevel(this.class, 'detectEvilLevel', this.getLevel());
  }

  /** Tongue of the sun and moon: speak with any living creature, from 17th. */
  hasTongueOfSunAndMoon() {
    return hasFeatureAtLevel(this.class, 'tongueOfSunAndMoonLevel', this.getLevel());
  }

  /**
   * Whether any monk ability with a use to spend has been reached, so the card
   * that holds them all knows whether to exist. Wholeness of body is the first
   * at 7th; the rest arrive between 12th and 19th.
   *
   * Tongue of the sun and moon is not among them: it has nothing to spend, so
   * it is reported on the language card instead.
   */
  hasMonkAbilities() {
    return this.getWholenessOfBodyMax() > 0
      || this.getAbundantStepMax() > 0
      || this.getQuiveringPalmMax() > 0
      || this.getEmptyBodyMax() > 0;
  }

  /**
   * Whether a weapon can be used in a flurry. Only unarmed strikes and monk
   * weapons qualify; a quarterstaff counts only in a two-handed grip.
   * @param {{weaponItem: Object, isTwoHanded: boolean}} weaponData
   */
  isFlurryWeapon(weaponData) {
    const monkWeapons = getClassProgression(this.class).monkWeapons;
    if (!Array.isArray(monkWeapons) || !this.hasFlurryOfBlows()) return false;
    const raw = String(weaponData?.weaponItem?.Name || '').trim().toLowerCase();
    if (!raw) return false;
    // Shuriken ship as "Shuriken (5)"; compare on the name without the count.
    const name = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!monkWeapons.some((w) => String(w).toLowerCase() === name)) return false;
    if (name === 'quarterstaff') return weaponData?.isTwoHanded === true;
    return true;
  }

  /**
   * The monk's AC bonus: the Wisdom modifier plus a level milestone, but only
   * while unarmored, shieldless and at a light load or lighter. Zero for every
   * other class. A negative Wisdom modifier never lowers AC.
   */
  getMonkAcBonus() {
    const milestone = getProgressionValue(this.class, 'acBonus', this.getLevel(), 0);
    const prog = getClassProgression(this.class);
    if (!prog.acBonus) return 0;
    if (this.getEquippedArmorRaw()) return 0;
    if (this.getShieldBonus() > 0) return 0;
    const load = this.getLoadStatus();
    if (load !== 'none' && load !== 'light') return 0;
    return Math.max(0, this.getWisMod()) + milestone;
  }

  // —— Paladin ——

  /**
   * Smite evil uses per day: one at 1st level and another every five levels.
   * Zero for every other class.
   */
  getSmiteEvilMax() {
    return getProgressionValue(this.class, 'smiteEvilUsesPerDay', this.getLevel(), 0);
  }

  /** Smite evil adds the Charisma modifier to the attack roll. */
  getSmiteEvilAttackBonus() {
    return this.getSmiteEvilMax() > 0 ? this.getChaMod() : 0;
  }

  /** Smite evil adds the paladin's level to the damage roll. */
  getSmiteEvilDamageBonus() {
    return this.getSmiteEvilMax() > 0 ? this.getLevel() : 0;
  }

  /**
   * The lay on hands pool: `paladin level × Charisma modifier` hit points a
   * day, from 2nd level. A non-positive Charisma modifier leaves no pool at
   * all, so the result floors at zero rather than going negative.
   */
  getLayOnHandsMax() {
    const config = getClassProgression(this.class).layOnHands;
    if (!config || this.getLevel() < (Number(config.minLevel) || 1)) return 0;
    return Math.max(0, this.getLevel() * this.getChaMod());
  }

  /**
   * Hit points still in the lay on hands pool. Unlike a uses-per-day feature
   * the paladin spends an arbitrary amount per use, so the model tracks the
   * running total spent and reports what is left. Never reports negative,
   * though the spent total itself is kept as entered.
   */
  getLayOnHandsRemaining() {
    return Math.max(0, this.getLayOnHandsMax() - this.getClassFeatureUsed('layOnHands'));
  }

  /**
   * Remove disease uses per week: one at 6th level and another every three
   * levels after. Zero below 6th and for every other class.
   */
  getRemoveDiseaseMax() {
    return getProgressionValue(this.class, 'removeDiseaseUsesPerWeek', this.getLevel(), 0);
  }

  getEquipmentBonus(slot) {
    return this.equipment?.[slot]?.bonus || 0;
  }

  isEquipmentMasterwork(slot) {
    return !!this.equipment?.[slot]?.masterwork;
  }

  getEquipmentEffectIds(slot) {
    return Array.isArray(this.equipment?.[slot]?.effectIds) ? this.equipment[slot].effectIds : [];
  }

  /**
   * Get equipped armor item's raw data, or null if no armor equipped.
   */
  getEquippedArmorRaw() {
    const entry = this.equipment?.armor;
    if (!entry?.link) return null;
    return getItemByRef(entry.baseLink || entry.link)?.raw || null;
  }

  /**
   * Armor bonus from equipped armor, parsed from "Armor/Shield Bonus" field.
   * Per-entry overrides take precedence over the raw item value.
   */
  getArmorBonus() {
    // Worn armor melds into an assumed form and stops functioning.
    if (this.isEquipmentMelded()) return 0;
    const entry = this.equipment?.armor;
    const override = entry?.overrides?.['Armor/Shield Bonus'];
    let val;
    if (override !== undefined) {
      val = override;
    } else {
      const armor = this.getEquippedArmorRaw();
      if (!armor) return 0;
      val = armor['Armor/Shield Bonus'];
    }
    if (val === undefined || val === null) return 0;
    const base = parseInt(String(val).replace('+', ''), 10) || 0;
    return base + (entry?.bonus || 0);
  }

  /**
   * Shield bonus from any shield equipped in a hand slot. Shields live
   * under the items.json "Shield" / "Specific Shield" buckets and use
   * the same "Armor/Shield Bonus" field as armor. Per project decision
   * this applies only to normal AC — not touch and not flat-footed.
   */
  getShieldBonus() {
    // A carried shield melds into an assumed form along with everything else.
    if (this.isEquipmentMelded()) return 0;
    const slots = ['lh1', 'rh1', 'lh2', 'rh2'];
    let total = 0;
    for (const slot of slots) {
      const entry = this.equipment?.[slot];
      if (!entry?.link) continue;
      if (!/\/(Shield|Specific Shield)\//.test(entry.link)) continue;
      const override = entry.overrides?.['Armor/Shield Bonus'];
      let val;
      if (override !== undefined) {
        val = override;
      } else {
        const raw = getItemByRef(entry.baseLink || entry.link)?.raw;
        val = raw?.['Armor/Shield Bonus'];
      }
      if (val === undefined || val === null) continue;
      total += (parseInt(String(val).replace('+', ''), 10) || 0) + (entry.bonus || 0);
    }
    return total;
  }

  /**
   * Maximum DEX bonus allowed by equipped armor. Returns Infinity if no cap.
   */
  getMaxDexBonus() {
    if (this.isEquipmentMelded()) return Infinity;
    const armor = this.getEquippedArmorRaw();
    if (!armor) return Infinity;
    const val = armor['Maximum Dex Bonus'];
    if (val === undefined || val === null || val === '—') return Infinity;
    const parsed = parseInt(String(val).replace('+', ''), 10);
    return isNaN(parsed) ? Infinity : parsed;
  }

  /**
   * Armor check penalty from equipped armor. Returns 0 if no penalty or no armor.
   */
  getArmorCheckPenalty() {
    if (this.isEquipmentMelded()) return 0;
    const armor = this.getEquippedArmorRaw();
    if (!armor) return 0;
    const val = armor['Armor Check Penalty'];
    if (!val || val === '—') return 0;
    return Math.abs(parseInt(String(val), 10)) || 0;
  }

  /**
   * Arcane spell failure: the percentage chance that an arcane spell with a
   * somatic component fizzles because of what is being worn. The armor's and
   * the shield's percentages add (equipment.md → Arcane spell failure), and
   * proficiency does not reduce it — only the bard's light-armor exemption does.
   *
   * Which classes it touches is read from `progression`; divine casters are
   * unaffected, and both flags there had no reader at all until now, so a
   * wizard in a chain shirt was told nothing.
   * @returns {number} 0 when nothing applies.
   */
  getArcaneSpellFailure() {
    const progression = getClassProgression(this.class);
    const lightArmorExempt = progression.noArcaneSpellFailureInLightArmor === true;
    if (!progression.arcaneSpellFailureApplies && !lightArmorExempt) return 0;
    if (this.isEquipmentMelded()) return 0;

    const chance = (item) => {
      const raw = item?.['Arcane Spell Failure Chance'];
      if (!raw || raw === '—') return 0;
      return Math.abs(parseInt(String(raw), 10)) || 0;
    };

    const armor = this.getEquippedArmorRaw();
    // A bard casts freely in light armor, but a shield costs the normal amount.
    const exempt = lightArmorExempt
      && String(armor?.Category || '').toLowerCase() === 'light';
    return (exempt ? 0 : chance(armor)) + chance(this.getEquippedShieldRaw());
  }

  /**
   * DEX modifier capped by armor's Maximum Dex Bonus. Used for AC calculations.
   */
  getEffectiveDexMod() {
    return Math.min(this.getDexMod(), this.getMaxDexBonus());
  }

  /**
   * Dex modifier as it applies to AC, honoring "lose Dex bonus to AC"
   * conditions (Flat-Footed, Blinded, Cowering, Stunned, Helpless, Paralyzed).
   * A Dex penalty still applies — only the positive bonus is denied.
   */
  getAcDexMod() {
    const dex = this.getEffectiveDexMod();
    return this.losesDexToAC() ? Math.min(0, dex) : dex;
  }

  /**
   * Armor class = 10 + Dex modifier (capped by armor) + armor bonus. Monk adds Wis bonus (min 0) and +1 at 5, +2 at 10, +3 at 15, +4 at 20.
   * Adds the user-supplied general acBonus on top.
   */
  getArmorClass() {
    const ac = 10 + this.getAcDexMod() + this.getArmorBonus() + this.getShieldBonus()
      + this.getMonkAcBonus() + this.getWildShapeNaturalArmor() + this.getSizeAcModifier();
    return ac + Number(this.acBonus || 0) + this.getAcConditionModifier() + this.getRageAcModifier();
  }

  /**
   * Touch AC (ignores armor bonus): 10 + Dex modifier (capped by armor).
   * Adds the general acBonus and the touch-only acTouchBonus.
   */
  getContactAC() {
    // Natural armor is excluded from touch AC; the size modifier is not.
    const ac = 10 + this.getAcDexMod() + this.getMonkAcBonus() + this.getSizeAcModifier();
    return ac + Number(this.acBonus || 0) + Number(this.acTouchBonus || 0)
      + this.getAcConditionModifier() + this.getRageAcModifier();
  }

  /**
   * Flat-footed AC (ignores DEX, uses armor): 10 + armor bonus. Monk still gets Wis bonus.
   * Adds the general acBonus and the flat-footed-only acFlatBonus.
   */
  getFlatFootedAC() {
    const ac = 10 + this.getArmorBonus() + this.getMonkAcBonus()
      + this.getWildShapeNaturalArmor() + this.getSizeAcModifier();
    return ac + Number(this.acBonus || 0) + Number(this.acFlatBonus || 0)
      + this.getAcConditionModifier() + this.getRageAcModifier();
  }

  /**
   * Base save progression only (no ability modifier, no bonuses):
   * high = 2 + floor(Level/2), low = floor(Level/3). Used to derive a
   * familiar's "best of master base / familiar base" saves.
   */
  getBaseFortitudeSave() {
    const data = getClassData(this.class);
    const level = this.getLevel();
    return (data?.fortSave === 'high') ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
  }

  getBaseReflexSave() {
    const data = getClassData(this.class);
    const level = this.getLevel();
    return (data?.reflexSave === 'high') ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
  }

  getBaseWillSave() {
    const data = getClassData(this.class);
    const level = this.getLevel();
    return (data?.willSave === 'high') ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
  }

  /**
   * Save base: high = 2 + floor(Level/2), low = floor(Level/3). Then add ability modifier.
   */
  getFortitudeSave() {
    return this.getBaseFortitudeSave() + this.getConMod() + this.getSaveConditionModifier();
  }

  getReflexSave() {
    return this.getBaseReflexSave() + this.getDexMod() + this.getSaveConditionModifier();
  }

  getWillSave() {
    return this.getBaseWillSave() + this.getWisMod() + this.getSaveConditionModifier()
      + this.getRageWillBonus();
  }

  /**
   * Divine grace: a paladin adds their Charisma modifier to every saving throw
   * from 2nd level. Zero for all other classes. A negative Charisma modifier
   * lowers the saves, as it does for the ability modifiers themselves.
   * See dnd-rules/class-features.md (Paladin).
   */
  getDivineGraceBonus() {
    if (!hasFeatureAtLevel(this.class, 'divineGraceLevel', this.getLevel())) return 0;
    return this.getChaMod();
  }

  getTotalFortitudeSave() {
    return this.getFortitudeSave() + Number(this.fortBonus || 0)
      + this.getFamiliarStatBonuses().fort + this.getDivineGraceBonus()
      + getFeatSaveBonus(this.getFeats(), 'fortitude')
      + this.getFlatRacialSaveBonus();
  }

  getTotalReflexSave() {
    return this.getReflexSave() + Number(this.reflexBonus || 0)
      + this.getFamiliarStatBonuses().reflex + this.getDivineGraceBonus()
      + getFeatSaveBonus(this.getFeats(), 'reflex')
      + this.getFlatRacialSaveBonus();
  }

  getTotalWillSave() {
    return this.getWillSave() + Number(this.willBonus || 0) + this.getDivineGraceBonus()
      + getFeatSaveBonus(this.getFeats(), 'will')
      + this.getFlatRacialSaveBonus();
  }

  /**
   * The racial bonus that applies to every saving throw. Only the halfling has
   * one, at +1; the dwarf's +2 against poison and the elf's +2 against
   * enchantment are conditional and stay out of the total, appearing beside it
   * as situational notes instead.
   */
  getFlatRacialSaveBonus() {
    return getFlatRacialSaveBonus(this.getRace());
  }

  getTotalInitiative() {
    return this.getInitiativeModifier() + Number(this.initiativeBonus || 0)
      + getFeatInitiativeBonus(this.getFeats());
  }

  getGold() {
    return Math.max(0, Number(this.gold) || 0);
  }

  setGold(value) {
    const n = Math.max(0, Number(value) || 0);
    this.gold = Number(n.toFixed(2));
  }

  /**
   * Total inventory weight in kg = Σ (item Weight × Number). Weight comes
   * from the items.json reference resolved via the saved Link. Items with
   * no Link or no Weight contribute 0.
   */
  getInventoryWeight() {
    if (!Array.isArray(this.inventory)) return 0;
    let total = 0;
    for (const entry of this.inventory) {
      if (!entry) continue;
      const count = Number(entry.Number) || 0;
      if (count <= 0) continue;
      const override = entry.overrides?.Weight;
      let weight;
      if (override !== undefined) {
        const parsed = parseFloat(String(override));
        weight = Number.isFinite(parsed) ? parsed : 0;
      } else {
        const lookupLink = entry.baseLink || entry.Link;
        const raw = lookupLink ? getItemByRef(lookupLink)?.raw : null;
        weight = Number(raw?.Weight) || 0;
      }
      total += weight * count;
    }
    return total;
  }

  /**
   * Carrying capacity ({ light, medium, heavy } max kg) based on the
   * character's total Str, race size, and biped/quadruped shape. No PC
   * race is a quadruped today so this always resolves to 'biped'.
   */
  getCarryingCapacity() {
    const str = this.getAbilityTotal('str');
    const size = this.getSize() || 'Medium';
    return capacityFromStr(str, size, 'biped');
  }

  /**
   * Which load tier the current inventory weight falls into.
   * @returns {'none' | 'light' | 'medium' | 'heavy' | 'over'}
   */
  getLoadStatus() {
    return classifyLoad(this.getInventoryWeight(), this.getCarryingCapacity());
  }

  /**
   * Max feat points = 1 + (1 if Human) + floor(level / 3), plus any slot a
   * rogue bought by taking a feat in place of a special ability.
   */
  getFeatPointsMax() {
    const level = this.getLevel();
    return 1 + (this.race === 'Human' ? 1 : 0) + Math.floor(level / 3)
      + this.getRogueBonusFeatSlots();
  }

  getFeatPointsUsed() {
    return Array.isArray(this.feats) ? this.feats.length : 0;
  }

  /**
   * Bonus combat feat slots the class grants on top of the general budget.
   * A fighter gets one at 1st level and another at every even level, so
   * `1 + floor(level / 2)`. Zero for every other class.
   */
  getClassBonusFeatSlotsMax() {
    const levels = getClassProgression(this.class).bonusFeatLevels;
    if (!Array.isArray(levels)) return 0;
    const level = this.getLevel();
    return levels.filter((at) => Number(at) <= level).length;
  }

  /**
   * The names of every feat that can fill this class's bonus slots, lowercased.
   * Three data-driven ways to qualify, combined: a per-feat boolean field in
   * feats.json (`bonusFeatSource`, the fighter's `fighterBonus`), a set of
   * feat tags (`bonusFeatTags`, the wizard's Metamagic and Item creation), and
   * an explicit name list (`bonusFeatNames`, the wizard's Spell mastery, which
   * belongs to no category of its own).
   */
  getClassBonusFeatNames() {
    const prog = getClassProgression(this.class);
    const feats = loadFile('feats');
    if (!Array.isArray(feats)) return new Set();
    const flag = prog.bonusFeatSource;
    const tags = Array.isArray(prog.bonusFeatTags)
      ? prog.bonusFeatTags.map((t) => String(t).toLowerCase())
      : [];
    const names = Array.isArray(prog.bonusFeatNames)
      ? prog.bonusFeatNames.map((n) => String(n).toLowerCase())
      : [];
    if (!flag && tags.length === 0 && names.length === 0) return new Set();
    const qualifying = new Set(names);
    feats.forEach((f) => {
      if (typeof f?.Name !== 'string') return;
      const byFlag = flag && f[flag];
      const byTag = tags.length > 0 && Array.isArray(f.Tags)
        && f.Tags.some((t) => tags.includes(String(t).toLowerCase()));
      if (byFlag || byTag) qualifying.add(f.Name.toLowerCase());
    });
    return qualifying;
  }

  /**
   * Whether one selected feat qualifies for this class's bonus slots.
   * Feats taken with a choice ("Weapon focus (longsword)") match on their
   * base name.
   */
  isClassBonusFeat(name, qualifying = this.getClassBonusFeatNames()) {
    if (qualifying.size === 0) return false;
    const stored = String(name).trim().toLowerCase();
    // Exact first: a canonical name may itself carry a parenthetical
    // ("Armor proficiency (heavy)") that must not be stripped away.
    return qualifying.has(stored) || qualifying.has(getBaseFeatName(name).toLowerCase());
  }

  /** How many selected feats *could* fill the bonus slots, ignoring capacity. */
  getQualifyingBonusFeats() {
    const qualifying = this.getClassBonusFeatNames();
    if (qualifying.size === 0) return 0;
    return this.getFeats().filter((name) => this.isClassBonusFeat(name, qualifying)).length;
  }

  /**
   * Bonus slots actually filled — the qualifying feats, capped at the number
   * of slots the class has granted. A 1st-level fighter with two combat feats
   * spends one on the bonus slot; the second spills into the general budget,
   * exactly as it would at the table.
   */
  getClassBonusFeatsUsed() {
    return Math.min(this.getQualifyingBonusFeats(), this.getClassBonusFeatSlotsMax());
  }

  /**
   * Feats charged against the general budget: everything the bonus slots could
   * not absorb. For a class without bonus slots this is the whole selection.
   */
  getGeneralFeatsUsed() {
    return this.getFeatPointsUsed() - this.getClassBonusFeatsUsed();
  }

  /**
   * Whether this class runs a second, independent feat budget — it must both
   * grant slots and define which feats fill them. A class that grants slots
   * without any qualifying rule (the monk, whose bonus feats are a fixed
   * per-level choice) has nothing to charge against them, so it keeps the
   * single general budget.
   */
  hasClassBonusFeatPool() {
    const prog = getClassProgression(this.class);
    return Array.isArray(prog.bonusFeatLevels) && this.getClassBonusFeatNames().size > 0;
  }

  /**
   * What the class calls its bonus pool — "combat" for a fighter, "bonus" for
   * a wizard. Used as a label only.
   */
  getClassBonusFeatLabel() {
    return getClassProgression(this.class).bonusFeatLabel || 'bonus';
  }

  /**
   * Feats the class hands out for free by this level, as `{ level, feat }`.
   * The wizard's Scribe Scroll at 1st is the only one: it is charged to
   * neither budget, so — like the ranger's combat-style feats — it is
   * deliberately not part of getFeats().
   */
  getGrantedFeats() {
    const table = getClassProgression(this.class).grantedFeats;
    if (!Array.isArray(table)) return [];
    const level = this.getLevel();
    return table
      .filter((entry) => Array.isArray(entry) && Number(entry[0]) <= level)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([at, feat]) => ({ level: Number(at), feat: String(feat) }));
  }

  /**
   * Selected feats by display name (e.g. "Weapon Focus", "Skill Focus (Tumble)").
   * Returned as a defensive copy so callers can't mutate the model state.
   */
  getFeats() {
    return Array.isArray(this.feats) ? [...this.feats] : [];
  }

  /**
   * Append a feat. Repeatable feats can appear multiple times; the model
   * doesn't enforce uniqueness (the page already filters duplicates for
   * non-repeatable feats).
   */
  /**
   * Attack bonus this character's feats add for one weapon: Weapon Focus and
   * Greater Weapon Focus, each only for the weapon they were selected for.
   * The weapon calculators in lib/utils.js read it from here so the rule
   * itself stays in the model.
   */
  getWeaponFeatAttackBonus(weaponItem) {
    return getFeatWeaponAttackBonus(this.getFeats(), weaponItem?.Name);
  }

  /** Damage bonus from Weapon Specialization / Greater Weapon Specialization. */
  getWeaponFeatDamageBonus(weaponItem) {
    return getFeatWeaponDamageBonus(this.getFeats(), weaponItem?.Name);
  }

  /**
   * Whether Weapon Finesse applies to this weapon — the feat plus a weapon it
   * covers (anything light, plus rapier, whip and spiked chain). The attack
   * calculation then uses whichever of Strength or Dexterity is higher, which
   * is what a character with the feat would always choose.
   */
  usesWeaponFinesse(weaponItem) {
    return hasWeaponFinesse(this.getFeats()) && isFinesseWeapon(weaponItem);
  }

  /** Class, race and feats — everything proficiency is decided from. */
  _proficiencyContext() {
    return { cls: this.getClass(), race: this.getRace(), feats: this.getFeats() };
  }

  /** Whether this character is proficient with one weapon. */
  isProficientWithWeapon(weaponItem) {
    return isProficientWithWeapon(this._proficiencyContext(), weaponItem);
  }

  /** Whether the equipped body armor is one this character is trained in. */
  isProficientWithArmor() {
    if (this.isEquipmentMelded()) return true;
    return isProficientWithArmor(this._proficiencyContext(), this.getEquippedArmorRaw());
  }

  /** The shield in a hand slot, or null. Mirrors getShieldBonus's own scan. */
  getEquippedShieldRaw() {
    if (this.isEquipmentMelded()) return null;
    for (const slot of ['lh1', 'rh1', 'lh2', 'rh2']) {
      const entry = this.equipment?.[slot];
      if (!entry?.link) continue;
      if (!/\/(Shield|Specific Shield)\//.test(entry.link)) continue;
      const raw = getItemByRef(entry.baseLink || entry.link)?.raw;
      if (raw) return raw;
    }
    return null;
  }

  /** Whether the carried shield is one this character is trained in. */
  isProficientWithShield() {
    return isProficientWithShield(this._proficiencyContext(), this.getEquippedShieldRaw());
  }

  /**
   * The attack penalty for wearing armor or carrying a shield you are not
   * trained in: the item's armor check penalty applies to attack rolls, and the
   * two stack. (equipment.md → Armor categories.)
   */
  getArmorProficiencyAttackPenalty() {
    let penalty = 0;
    if (!this.isProficientWithArmor()) penalty -= this.getArmorCheckPenalty();
    if (!this.isProficientWithShield()) {
      const shield = this.getEquippedShieldRaw();
      const acp = shield?.['Armor Check Penalty'];
      if (acp && acp !== '—') penalty -= Math.abs(parseInt(String(acp), 10)) || 0;
    }
    return penalty;
  }

  /**
   * Everything non-proficiency costs this attack roll: -4 for the weapon, plus
   * the armor and shield check penalties if they are not trained in either.
   *
   * Nothing is blocked — the sheet shows the penalty the rules impose and says
   * where it came from, the same way it treats encumbrance.
   */
  getProficiencyAttackPenalty(weaponItem) {
    const weapon = this.isProficientWithWeapon(weaponItem) ? 0 : NON_PROFICIENT_ATTACK_PENALTY;
    return weapon + this.getArmorProficiencyAttackPenalty();
  }

  /**
   * The same for a bare fist. An unarmed strike is a simple weapon, so anyone
   * granted simple weapons is trained in it — which is nearly everyone, but not
   * a wizard, whose list names five specific weapons and no category.
   */
  getPunchProficiencyPenalty() {
    const weapon = isProficientWithUnarmedStrike(this._proficiencyContext())
      ? 0
      : NON_PROFICIENT_ATTACK_PENALTY;
    return weapon + this.getArmorProficiencyAttackPenalty();
  }

  /**
   * The fist's critical profile: an unarmed strike threatens on a natural 20
   * for double damage. It has no items.json entry, so the profile is stated
   * here rather than read — but Improved Critical still reaches it, because
   * "Unarmed strike" is a legal choice for the feat.
   *
   * @returns {{text: string, improved: boolean}}
   */
  getPunchCritical() {
    const improved = hasImprovedCritical(this.getFeats(), UNARMED_STRIKE);
    const low = improved ? widenThreatRange(20) : 20;
    // Same rule as a weapon's: a bare natural 20 is the default and goes unsaid.
    return { text: low >= 20 ? 'x2' : `${low}-20/x2`, improved };
  }

  /**
   * A weapon's critical profile as the sheet shows it — "19-20/x2" widened by
   * Improved Critical when the feat names this weapon.
   *
   * Answers null for a weapon that cannot score one at all (the net), which is
   * the signal to print nothing rather than a blank profile.
   *
   * @returns {{text: string, improved: boolean} | null}
   */
  getWeaponCritical(weaponItem) {
    const parsed = parseCritical(weaponItem?.Critical);
    if (!parsed) return null;
    const improved = hasImprovedCritical(this.getFeats(), weaponItem?.Name);
    const low = improved ? widenThreatRange(parsed.low) : parsed.low;
    /* A threat range of a natural 20 alone is every weapon's default, so it is
       left unsaid — only a range that is actually wider is worth the space.
       The multiplier always shows, because that one does differ per weapon. */
    const text = low >= 20 ? parsed.multiplier : `${low}-20/${parsed.multiplier}`;
    return { text, improved };
  }

  /**
   * A weapon's range increment in feet, after Far Shot. 0 means the weapon has
   * no ranged profile at all, which is how items.json marks pure melee.
   *
   * @returns {{feet: number, extended: boolean}} `feet` 0 when there is no range.
   */
  getWeaponRange(weaponItem) {
    const base = Number(weaponItem?.Range) || 0;
    if (base <= 0) return { feet: 0, extended: false };
    const feet = getWeaponRangeIncrement(this.getFeats(), weaponItem);
    return { feet, extended: feet !== base };
  }

  /**
   * How many times speed a run covers. Normally 4, dropping to 3 in heavy
   * armor or under a heavy load; the Run feat lifts each by one, to 5 and 4.
   * (movement.md, and the feat's own text.)
   */
  getRunSpeedMultiplier() {
    const armor = String(this.getEquippedArmorRaw()?.Category || '').toLowerCase();
    const load = this.getLoadStatus();
    const encumbered = armor === 'heavy' || load === 'heavy' || load === 'over';
    const base = encumbered ? 3 : 4;
    return hasRunFeat(this.getFeats()) ? base + 1 : base;
  }

  /**
   * The domains this cleric may still pick for one slot.
   *
   * Mirrors the spellbook's own rule so the two dropdowns offer the same list:
   * a cleric cannot take the domain opposed to their alignment, and cannot
   * take the same domain twice.
   *
   * @param {1|2} slot which domain slot the list is for.
   */
  getPossibleDomains(slot) {
    const opposed = [
      { Lawful: 'Chaos', Chaotic: 'Law' }[this.ethicalAlignment],
      { Good: 'Evil', Evil: 'Good' }[this.moralAlignment],
    ];
    const taken = slot === 1 ? this.domain2 : this.domain1;
    return DOMAINS.filter((d) => !opposed.includes(d) && d !== taken);
  }

  /** Whether the Run feat is held — it also keeps Dex to AC while running. */
  hasRunFeat() {
    return hasRunFeat(this.getFeats());
  }

  /**
   * The save DC of one of this character's spells: `10 + spell level + casting
   * ability modifier`, plus Spell Focus and Greater Spell Focus in that school.
   *
   * The spell level is the spell's own, not the slot it is prepared in — a
   * metamagic'd spell still saves against its base level (metamagic.md).
   *
   * @returns {number|null} null when the class has no spellcasting.
   */
  getSpellSaveDC(spellLevel, school) {
    const ability = this.getCastingAbility();
    if (!ability) return null;
    const level = Number(spellLevel) || 0;
    return 10 + level + this.getModifier(ability)
      + getFeatSpellDcBonus(this.getFeats(), school)
      + this.getRacialSpellDcBonus(school);
  }

  /**
   * A racial bonus to the save DC of one school. The gnome is the only race
   * with one: +1 to the DC of every illusion they cast.
   */
  getRacialSpellDcBonus(school) {
    if (getBaseSchool(school) !== 'Illusion') return 0;
    return getRacialIllusionDcBonus(this.getRace());
  }

  /**
   * Which ability powers this class's spells, or '' for a non-caster. Read
   * from `progression.castingAbility`, which every casting class now carries;
   * the class→ability map that used to live here was the same knowledge kept
   * in a second place, free to disagree with the first.
   */
  getCastingAbility() {
    const ability = getClassProgression(this.class).castingAbility;
    return typeof ability === 'string' ? ability : '';
  }

  // —— Stat breakdown ——
  //
  // One `get…Contributions()` per derived stat, each returning the list of
  // sources that make up the number the sheet shows. The list MUST sum to that
  // number: the info box prints the total and flags a mismatch, so a breakdown
  // that does not add up is reporting a bug rather than hiding one.
  //
  // Zero rows are dropped by `compactContributions`, so a plain character gets
  // a short list instead of a wall of "+0".

  /**
   * What makes up one ability score: the rolled base, the manual bonus, the
   * racial modifier, rage, and any condition that damaged or drained it.
   *
   * An assumed form replaces Strength, Dexterity and Constitution outright
   * rather than modifying them, so in that case the form is the single source
   * and the character's own base does not appear at all.
   */
  getAbilityContributions(abilityKey) {
    const rows = [];
    const formScore = this.getWildShapeForm()?.abilities?.[abilityKey];
    const replaced = SHAPE_REPLACED_ABILITIES.includes(abilityKey)
      && Number.isFinite(Number(formScore));

    if (replaced) {
      rows.push(contribution('form', this.getWildShapeName() || 'assumed form', Number(formScore)));
    } else {
      rows.push(contribution('base', 'base score', this.getAbilityBase(abilityKey)));
      rows.push(contribution('manual', 'manual bonus', this.getAbilityBonus(abilityKey)));
      rows.push(contribution(
        'race', this.getRace() || 'race',
        this.getRaceAbilityModifier(abilityKey), BONUS_TYPES.RACIAL
      ));
    }
    rows.push(contribution('rage', 'rage', this.getRageAbilityBonus(abilityKey), BONUS_TYPES.MORALE));
    this.getAbilityConditionContributions(abilityKey).forEach((c) => {
      rows.push(contribution(c.source, c.label, c.value));
    });
    return compactContributions(rows);
  }

  /**
   * What makes up one saving throw. `which` is 'fortitude', 'reflex' or 'will'.
   *
   * Will deliberately has no familiar row: the per-species familiar bonuses
   * cover Fortitude and Reflex only. Divine Grace adds Charisma to all three.
   */
  getSaveContributions(which) {
    const familiar = this.getFamiliarStatBonuses();
    const byWhich = {
      fortitude: {
        base: this.getBaseFortitudeSave(),
        ability: ['con', this.getConMod()],
        manual: Number(this.fortBonus || 0),
        familiar: familiar.fort,
      },
      reflex: {
        base: this.getBaseReflexSave(),
        ability: ['dex', this.getDexMod()],
        manual: Number(this.reflexBonus || 0),
        familiar: familiar.reflex,
      },
      will: {
        base: this.getBaseWillSave(),
        ability: ['wis', this.getWisMod()],
        manual: Number(this.willBonus || 0),
        familiar: 0,
      },
    }[which];
    if (!byWhich) return [];

    const [abilityKey, abilityMod] = byWhich.ability;
    const rows = [
      contribution('base', `${this.getClass() || 'class'} base save`, byWhich.base),
      contribution('ability', ABILITY_LABELS[abilityKey] || abilityKey, abilityMod),
      contribution('manual', 'manual bonus', byWhich.manual),
      contribution('familiar', 'familiar', byWhich.familiar),
      contribution('divineGrace', 'Divine Grace', this.getDivineGraceBonus()),
      contribution('feats', 'feats', getFeatSaveBonus(this.getFeats(), which)),
      contribution('race', this.getRace() || 'race', this.getFlatRacialSaveBonus(), BONUS_TYPES.RACIAL),
      contribution('conditions', 'conditions', this.getSaveConditionModifier()),
    ];
    if (which === 'will') {
      rows.push(contribution('rage', 'rage', this.getRageWillBonus(), BONUS_TYPES.MORALE));
    }
    return compactContributions(rows);
  }

  /** What makes up initiative: Dexterity, the manual bonus, and the feat. */
  getInitiativeContributions() {
    return compactContributions([
      contribution('ability', 'Dexterity', this.getDexMod()),
      contribution('manual', 'manual bonus', Number(this.initiativeBonus || 0)),
      contribution('feats', 'Improved Initiative', getFeatInitiativeBonus(this.getFeats())),
      contribution('conditions', 'conditions', this.getInitiativeConditionModifier()),
    ]);
  }

  /**
   * What makes up maximum hit points. The Constitution row uses the character's
   * own Constitution even in an assumed form: a wild-shaped druid keeps her own
   * hit points (magic.md, polymorph sub-rules).
   */
  getMaxLifeContributions() {
    return compactContributions([
      contribution('rolled', 'rolled hit points', Number(this.maxLife) || 0),
      contribution('con', `Constitution x ${this.getLevel()} levels`, this.getUnshapedConMod() * this.getLevel()),
      contribution('manual', 'bonus life', Number(this.healthModifier) || 0),
      contribution('familiar', 'familiar', this.getFamiliarStatBonuses().hp),
      contribution('feats', 'Toughness', getFeatHpBonus(this.getFeats())),
      contribution('conditions', 'conditions', this.getHpConditionModifier()),
    ]);
  }

  /**
   * What makes up armor class. The largest breakdown on the sheet: ten possible
   * sources, of which a first-level character in leather has three.
   *
   * The Dexterity row is the modifier *after* the armor's maximum, so a
   * character whose Dex is being capped sees the number the armor allows rather
   * than the one their score would give — the cap is reported as its own note
   * in the situational group rather than as a negative row here.
   */
  getArmorClassContributions() {
    const armor = this.getEquippedArmorRaw();
    const shield = this.getEquippedShieldRaw();
    return compactContributions([
      contribution('base', 'base', 10),
      contribution('ability', 'Dexterity', this.getAcDexMod()),
      contribution('armor', armor?.Name || 'armor', this.getArmorBonus(), BONUS_TYPES.ARMOR),
      contribution('shield', shield?.Name || 'shield', this.getShieldBonus(), BONUS_TYPES.SHIELD),
      contribution('monk', 'monk AC bonus', this.getMonkAcBonus()),
      contribution('natural', 'natural armor', this.getWildShapeNaturalArmor(), BONUS_TYPES.NATURAL),
      contribution('size', `${this.getSize()} size`, this.getSizeAcModifier(), BONUS_TYPES.SIZE),
      contribution('manual', 'manual bonus', Number(this.acBonus || 0)),
      contribution('rage', 'rage', this.getRageAcModifier(), BONUS_TYPES.MORALE),
      contribution('conditions', 'conditions', this.getAcConditionModifier()),
    ]);
  }

  /** Touch AC: armor, shield and natural armor do not apply; size still does. */
  getTouchAcContributions() {
    return compactContributions([
      contribution('base', 'base', 10),
      contribution('ability', 'Dexterity', this.getAcDexMod()),
      contribution('monk', 'monk AC bonus', this.getMonkAcBonus()),
      contribution('size', `${this.getSize()} size`, this.getSizeAcModifier(), BONUS_TYPES.SIZE),
      contribution('manual', 'manual bonus', Number(this.acBonus || 0)),
      contribution('manualTouch', 'touch bonus', Number(this.acTouchBonus || 0)),
      contribution('rage', 'rage', this.getRageAcModifier(), BONUS_TYPES.MORALE),
      contribution('conditions', 'conditions', this.getAcConditionModifier()),
    ]);
  }

  /** Flat-footed AC: the Dexterity bonus is denied; everything worn still counts. */
  getFlatFootedAcContributions() {
    const armor = this.getEquippedArmorRaw();
    return compactContributions([
      contribution('base', 'base', 10),
      contribution('armor', armor?.Name || 'armor', this.getArmorBonus(), BONUS_TYPES.ARMOR),
      contribution('monk', 'monk AC bonus', this.getMonkAcBonus()),
      contribution('natural', 'natural armor', this.getWildShapeNaturalArmor(), BONUS_TYPES.NATURAL),
      contribution('size', `${this.getSize()} size`, this.getSizeAcModifier(), BONUS_TYPES.SIZE),
      contribution('manual', 'manual bonus', Number(this.acBonus || 0)),
      contribution('manualFlat', 'flat-footed bonus', Number(this.acFlatBonus || 0)),
      contribution('rage', 'rage', this.getRageAcModifier(), BONUS_TYPES.MORALE),
      contribution('conditions', 'conditions', this.getAcConditionModifier()),
    ]);
  }

  /**
   * What makes up speed: the racial land speed, class fast movement, the manual
   * bonus and the conditions that halve it.
   *
   * The armor and encumbrance reduction is deliberately **not** a row. It does
   * not reduce this number — the sheet shows it as "20 / 30 ft", both figures at
   * once — so it belongs beside the total as a note, not inside it.
   */
  getSpeedContributions() {
    const rows = [];
    if (this.getWildShapeForm()) {
      rows.push(contribution('form', this.getWildShapeName() || 'assumed form', this.getWildShapeSpeed('land')));
    } else {
      const races = loadFile('races');
      const racial = Number(races?.[this.race]?.landSpeed) || 30;
      rows.push(contribution('race', `${this.getRace() || 'race'} base speed`, racial));
      rows.push(contribution('class', 'fast movement', this.getBaseSpeed() - racial));
    }
    rows.push(contribution('manual', 'manual bonus', Number(this.speedBonus || 0)));
    const raw = this.getBaseSpeed() + Number(this.speedBonus || 0);
    if (this.isHalfSpeed()) {
      rows.push(contribution('conditions', 'halved by conditions', Math.floor(raw / 2) - raw));
    }
    /* Armor and encumbrance land last, on the speed everything else produced.
       This is a real row rather than a situational note because the sheet now
       shows the reduced speed as *the* speed — so it has to be a number the
       breakdown adds up to, not a remark beside a total that disagrees. */
    const armorSpeed = this.getArmorSpeedInfo();
    if (armorSpeed?.hasReduction) {
      rows.push(contribution(
        'armorSpeed', 'armor and load',
        armorSpeed.reducedSpeed - armorSpeed.originalSpeed
      ));
    }
    return compactContributions(rows);
  }

  /**
   * What makes up one skill total: ranks, the key ability, the manual bonus,
   * the racial bonus, a familiar's per-species bonus, the flat skill feats, the
   * armor check penalty and any condition.
   *
   * The armor check penalty is doubled on Swim, which is the one place the
   * penalty is not simply itself.
   */
  getSkillContributions(skillName) {
    const skills = loadFile('skills');
    const list = Array.isArray(skills) ? skills : skills?.Skills;
    let skill = Array.isArray(list) ? list.find((sk) => sk && sk.Name === skillName) : null;
    if (!skill && /^Knowledge\s*\(/.test(skillName)) {
      skill = Array.isArray(list) ? list.find((sk) => sk && sk.Name === 'Knowledge') : null;
    }
    const abilityKey = skill?.Characteristic
      ? { Str: 'str', Dex: 'dex', Con: 'con', Int: 'int', Wis: 'wis', Cha: 'cha' }[skill.Characteristic]
      : null;

    const rows = [
      contribution('ranks', 'ranks', Math.floor(this.getSkillRanks(skillName))),
      contribution('ability', abilityKey ? ABILITY_LABELS[abilityKey] : 'ability', abilityKey ? this.getModifier(abilityKey) : 0),
      contribution('manual', 'manual bonus', this.getSkillBonus(skillName)),
      contribution('race', this.getRace() || 'race', getFlatRacialSkillBonus(this.getRace(), skillName), BONUS_TYPES.RACIAL),
      contribution('familiar', 'familiar', this.getFamiliarStatBonuses().skills[skillName] || 0),
      contribution('feats', 'feats', getFeatSkillBonus(this.getFeats(), skillName)),
      contribution('classFeature', 'Nature Sense', this.getNatureSenseBonus(skillName)),
      contribution('conditions', 'conditions', this.getSkillConditionModifier(skillName)),
    ];

    /* One row per source rather than one lumped total: which skill paid for
       the bonus is the part a reader wants, and two synergies into the same
       skill only stack because they come from different sources. */
    this.getSkillSynergies(skillName).forEach(({ from, bonus: value }) => {
      rows.push(contribution(`synergy:${from}`, `${from} (5 ranks)`, value, BONUS_TYPES.SYNERGY));
    });

    const penalty = this.getArmorCheckPenalty();
    if (penalty > 0 && skill?.ArmorPenalty) {
      const multiplier = skillName === 'Swim' ? 2 : 1;
      rows.push(contribution('armorCheck', 'armor check penalty', -penalty * multiplier, BONUS_TYPES.ARMOR));
    }
    return compactContributions(rows);
  }

  /**
   * What makes up one weapon's attack bonus: base attack, the ability modifier
   * (Dexterity for a ranged weapon, or the better of the two under Weapon
   * Finesse), masterwork or enhancement, Weapon Focus, conditions, and the
   * penalties for using something you were never trained in.
   *
   * Lives here rather than beside the calculator in lib/utils.js so that module
   * keeps reaching the model through optional chaining and gains no import.
   */
  getWeaponAttackContributions(weaponData) {
    const data = weaponData?.weaponItem ? weaponData : { weaponItem: weaponData };
    const { weaponItem, itemData } = data;
    if (!weaponItem) return [];
    const ranged = getWeaponType(weaponItem).isRanged;
    const finesse = this.usesWeaponFinesse(weaponItem);
    const abilityKey = ranged ? 'dex' : (finesse && this.getDexMod() > this.getStrMod() ? 'dex' : 'str');
    const enhancement = itemData ? Math.max(itemData.bonus || 0, itemData.masterwork ? 1 : 0) : 0;
    const perfect = (weaponItem.isPerfect || weaponItem.Name?.toLowerCase().includes('perfect')) ? 1 : 0;
    const armorPenalty = this.getArmorProficiencyAttackPenalty();

    return compactContributions([
      contribution('bab', 'base attack bonus', this.getBaseAttackBonus()),
      contribution('ability', ABILITY_LABELS[abilityKey] + (finesse && !ranged ? ' (Weapon Finesse)' : ''), this.getModifier(abilityKey)),
      contribution('perfect', 'perfect weapon', perfect, BONUS_TYPES.ENHANCEMENT),
      contribution('enhancement', enhancement > 1 ? `+${enhancement} weapon` : 'masterwork', enhancement, BONUS_TYPES.ENHANCEMENT),
      contribution('feats', 'Weapon Focus', this.getWeaponFeatAttackBonus(weaponItem)),
      contribution('proficiency', 'not proficient', this.isProficientWithWeapon(weaponItem) ? 0 : NON_PROFICIENT_ATTACK_PENALTY),
      contribution('armorProficiency', 'untrained armor', armorPenalty, BONUS_TYPES.ARMOR),
      contribution('conditions', 'conditions', this.getAttackConditionModifier()),
    ]);
  }

  /**
   * What makes up one weapon's damage *bonus* — the number after the dice. The
   * dice themselves are not a contribution, since they are not added to
   * anything; they are reported by `getWeaponDamageDice`.
   */
  getWeaponDamageContributions(weaponData) {
    const data = weaponData?.weaponItem ? weaponData : { weaponItem: weaponData };
    const { weaponItem, isTwoHanded, itemData } = data;
    if (!weaponItem) return [];
    const type = getWeaponType(weaponItem);
    const strMod = this.getStrMod();

    let strValue = 0;
    let strLabel = 'Strength';
    if (type.isMelee) {
      strValue = isTwoHanded ? Math.floor(strMod * 1.5) : strMod;
      if (isTwoHanded) strLabel = 'Strength (two-handed)';
    } else if (type.isCompositeRanged) {
      strValue = Math.max(0, strMod);
    }
    const perfect = (weaponItem.isPerfect || weaponItem.Name?.toLowerCase().includes('perfect'))
      && (type.isMelee || type.isCompositeRanged) ? 1 : 0;

    return compactContributions([
      contribution('ability', strLabel, strValue),
      contribution('perfect', 'perfect weapon', perfect, BONUS_TYPES.ENHANCEMENT),
      contribution('enhancement', `+${itemData?.bonus || 0} weapon`, itemData?.bonus || 0, BONUS_TYPES.ENHANCEMENT),
      contribution('feats', 'Weapon Specialization', this.getWeaponFeatDamageBonus(weaponItem)),
      contribution('conditions', 'conditions', this.getDamageConditionModifier()),
    ]);
  }

  /** The dice a weapon rolls, before any bonus — sized for this character. */
  getWeaponDamageDice(weaponItem) {
    if (!weaponItem) return '';
    return this.getSize() === 'Small'
      ? (weaponItem['Dmg (S)'] || '1d4')
      : (weaponItem['Dmg (M)'] || '1d6');
  }

  /**
   * What makes up a spell's save DC: 10, the spell's own level, the casting
   * ability modifier, Spell Focus and its Greater form, and the gnome's
   * illusion bonus. The level is the spell's, not the slot it occupies — a
   * metamagic'd spell still saves against its base level (metamagic.md).
   */
  getSpellSaveDCContributions(spell, level) {
    const ability = this.getCastingAbility();
    if (!ability) return [];
    const school = spell?.School ?? spell;
    return compactContributions([
      contribution('base', 'base', 10),
      contribution('level', `spell level ${Number(level) || 0}`, Number(level) || 0),
      contribution('ability', ABILITY_LABELS[ability], this.getModifier(ability)),
      contribution('feats', 'Spell Focus', this.getSpellFocusBonus(school)),
      contribution('race', this.getRace() || 'race', this.getRacialSpellDcBonus(school), BONUS_TYPES.RACIAL),
    ]);
  }

  /**
   * Things tied to a stat that do not change its number.
   *
   * A dwarf's +2 against poison is real and worth knowing, but it is not part
   * of the Fortitude save — putting it there would be wrong every time the
   * threat is not poison. So it is reported beside the total instead, carrying
   * a note rather than a value, and `sumContributions` cannot pick it up even
   * if the two lists were concatenated by mistake.
   *
   * The `statKey` vocabulary matches the contribution methods: 'ac', 'acTouch',
   * 'acFlat', 'fortitude', 'reflex', 'will', 'speed', 'attack', an ability key,
   * or `skill:<Name>`. This is the socket the remaining conditional feats and
   * class features plug into — backlog items 3 and 4.
   */
  getSituationalContributions(statKey) {
    if (!statKey) return [];
    const race = this.getRace();
    const cls = this.getClass();
    const level = this.getLevel();
    const out = [];
    const isSave = ['fortitude', 'reflex', 'will'].includes(statKey);

    // —— Racial ——
    if (isSave) {
      getRacialSaveBonuses(race).filter((b) => !b.flat).forEach((b) => {
        if (!SAVE_SCOPES[b.against]?.includes(statKey)) return;
        out.push(situational(
          `race:${b.against}`, race,
          `+${b.bonus} on ${statKey} saves against ${SAVE_SCOPE_LABELS[b.against] || b.against}`
        ));
      });
      getRacialImmunities(race).forEach((what) => {
        if (statKey !== 'will') return;
        out.push(situational('race:immunity', race, `Immune to ${String(what).toLowerCase()}`));
      });
    }

    if (statKey === 'ac' || statKey === 'acTouch') {
      getRacialACBonuses(race).forEach((b) => {
        out.push(situational('race:ac', race, `+${b.bonus} ${b.type || ''} bonus against ${b.against}`.replace(/\s+/g, ' ')));
      });
    }

    if (statKey === 'attack') {
      getRacialAttackBonuses(race).forEach((b) => {
        out.push(situational('race:attack', race, `+${b.bonus} on attack rolls against ${b.against}`));
      });
    }

    /* Weapon damage against a favored enemy. It shares the weapon's box with
       the attack bonus, so it needs its own key to stay on the right list —
       favored enemy adds to damage and never to the attack roll. */
    if (statKey === 'damage') {
      this.getFavoredEnemies().forEach((enemy) => {
        const name = enemy.subtype ? `${enemy.type} (${enemy.subtype})` : enemy.type;
        out.push(situational(
          `favoredEnemy:${name}`, 'Favored enemy',
          `+${enemy.bonus} to weapon damage against ${String(name).toLowerCase()}`
        ));
      });
    }

    if (statKey.startsWith('skill:')) {
      const skillName = statKey.slice('skill:'.length);
      getRacialSkillBonuses(race)
        .filter((b) => !b.flat && b.skill.toLowerCase() === skillName.toLowerCase())
        .forEach((b) => out.push(situational('race:skill', race, `+${b.bonus} when ${b.condition}`)));
    }

    // —— The caps and reductions that are real but sit outside the total ——
    if (statKey === 'ac' && this.getMaxDexBonus() < this.getDexMod()) {
      out.push(situational(
        'armorMaxDex', 'armor maximum Dexterity',
        `Your armor caps the Dexterity bonus at +${this.getMaxDexBonus()}`
      ));
    }
    /* Slow fall is a movement ability with no counter of its own, so it rode
       along on the stunning fist card, which is not where anyone asks how far
       a monk moves. It belongs with the speed it qualifies. */
    if (statKey === 'speed') {
      const slowFall = this.getSlowFallDistance();
      if (slowFall > 0) {
        out.push(situational(
          'slowFall', 'Slow fall',
          slowFall === Infinity
            ? 'Falling within arm’s reach of a wall costs you no damage, from any height'
            : `Falling within arm’s reach of a wall counts as ${slowFall} ft shorter`
        ));
      }
    }

    // —— Class features whose bonus only exists in a situation ——
    const trapSense = getProgressionValue(cls, 'trapSense', level, 0);
    if (trapSense > 0 && (statKey === 'reflex' || statKey === 'ac')) {
      out.push(situational('trapSense', 'Trap Sense', `+${trapSense} against traps`));
    }
    if (statKey === 'will' && hasFeatureAtLevel(cls, 'stillMindLevel', level)) {
      out.push(situational('stillMind', 'Still Mind', '+2 against enchantment spells and effects'));
    }
    if (statKey === 'will' && hasFeatureAtLevel(cls, 'indomitableWillLevel', level)) {
      out.push(situational('indomitableWill', 'Indomitable Will', '+4 against enchantment while raging'));
    }
    if (statKey === 'ac' && hasFeatureAtLevel(cls, 'improvedUncannyDodgeLevel', level)) {
      out.push(situational('improvedUncannyDodge', 'Improved Uncanny Dodge', 'Cannot be flanked'));
    }
    if (isSave && hasFeatureAtLevel(cls, 'resistNaturesLureLevel', level)) {
      out.push(situational('resistNaturesLure', "Resist Nature's Lure", '+4 against the spell-like abilities of fey'));
    }

    /* —— Pass/fail class features, each on the number it qualifies ——
       None of these move a total, so none can be a contribution; each is one
       note against the stat a player is looking at when the question comes up,
       rather than prose three pages away on the features list. Levels are read
       from the `progression` block, never restated here. Mechanics:
       dnd-rules/class-features.md. */
    if (statKey === 'reflex') {
      if (hasFeatureAtLevel(cls, 'evasionLevel', level)) {
        out.push(situational(
          'evasion', 'Evasion',
          'No damage at all on a successful save against an effect that allows half. Light or no armor only'
        ));
      }
      if (this.hasImprovedEvasion()) {
        out.push(situational(
          'improvedEvasion', 'Improved Evasion',
          'Half damage even when the save fails, and still none when it succeeds'
        ));
      }
      if (this.hasRogueSpecialAbility('Defensive Roll')) {
        out.push(situational(
          'defensiveRoll', 'Defensive Roll',
          'Once a day, a blow that would drop you to 0 hp allows a save against a DC equal to the damage, for half'
        ));
      }
    }

    if (statKey === 'ac' && hasFeatureAtLevel(cls, 'uncannyDodgeLevel', level)) {
      out.push(situational(
        'uncannyDodge', 'Uncanny Dodge',
        'Keeps your Dexterity bonus to AC against an unseen attacker and while flat-footed'
      ));
    }

    if (statKey === 'fortitude') {
      if (hasFeatureAtLevel(cls, 'venomImmunityLevel', level)) {
        out.push(situational('venomImmunity', 'Venom Immunity', 'Immune to every poison, natural and magical'));
      }
      if (hasFeatureAtLevel(cls, 'diamondBodyLevel', level)) {
        out.push(situational('diamondBody', 'Diamond Body', 'Immune to every poison'));
      }
      if (hasFeatureAtLevel(cls, 'divineHealthLevel', level)) {
        out.push(situational('divineHealth', 'Divine Health', 'Immune to every disease, magical and mundane'));
      }
      if (hasFeatureAtLevel(cls, 'purityOfBodyLevel', level)) {
        out.push(situational('purityOfBody', 'Purity of Body', 'Immune to every disease that is not magical'));
      }
    }

    if (statKey === 'will') {
      if (hasFeatureAtLevel(cls, 'auraOfCourageLevel', level)) {
        out.push(situational(
          'auraOfCourage', 'Aura of Courage',
          'Immune to fear, and allies within 10 ft gain +4 morale against it'
        ));
      }
      if (this.hasRogueSpecialAbility('Slippery Mind')) {
        out.push(situational(
          'slipperyMind', 'Slippery Mind',
          'A failed save against an enchantment may be attempted once more, a round later'
        ));
      }
    }

    if (statKey === 'speed') {
      if (hasFeatureAtLevel(cls, 'woodlandStrideLevel', level)) {
        out.push(situational(
          'woodlandStride', 'Woodland Stride',
          'Natural difficult terrain costs no extra movement and deals no damage; magic such as entangle still does'
        ));
      }
      if (hasFeatureAtLevel(cls, 'tracklessStepLevel', level)) {
        out.push(situational(
          'tracklessStep', 'Trackless Step',
          'Leaves no trail in natural terrain, unless you choose to'
        ));
      }
    }

    /* Aging penalties fall on the physical scores only, so Int, Wis and Cha
       have nothing to report — they improve with age either way. */
    if (['str', 'dex', 'con'].includes(statKey) && hasFeatureAtLevel(cls, 'timelessBodyLevel', level)) {
      out.push(situational(
        'timelessBody', 'Timeless Body',
        'No aging penalty to this score, though you still die of old age on schedule'
      ));
    }

    /* Skills a class feature qualifies without adding to: the number is
       unchanged, but what the roll is allowed to attempt is not. */
    if (statKey.startsWith('skill:')) {
      /* Compared case-insensitively, as the racial block above does:
         skills.json spells them 'Disable device' and 'Handle animal', and a
         mismatched capital is a silent miss rather than an error. */
      const skill = statKey.slice('skill:'.length).toLowerCase();
      const trapfinding = hasFeatureAtLevel(cls, 'trapfindingLevel', level);
      if (trapfinding && skill === 'search') {
        out.push(situational(
          'trapfinding', 'Trapfinding',
          'Can find traps with a DC above 20, which no other class may attempt'
        ));
      }
      if (trapfinding && skill === 'disable device') {
        out.push(situational(
          'trapfinding', 'Trapfinding',
          'Can disarm magic traps, against a DC of 25 plus the spell’s level'
        ));
      }
      if (skill === 'survival' && hasFeatureAtLevel(cls, 'swiftTrackerLevel', level)) {
        out.push(situational(
          'swiftTracker', 'Swift Tracker',
          'Follow tracks at full speed for −10 instead of −20, or at double speed for −20 instead of −40'
        ));
      }
      if (skill === 'hide' && hasFeatureAtLevel(cls, 'camouflageLevel', level)) {
        out.push(situational(
          'camouflage', 'Camouflage',
          'Can hide in any natural terrain, even where it offers no cover or concealment'
        ));
      }
      if (skill === 'hide' && hasFeatureAtLevel(cls, 'hideInPlainSightLevel', level)) {
        out.push(situational(
          'hideInPlainSight', 'Hide in Plain Sight',
          'Can hide in natural terrain even while being observed'
        ));
      }
      /* Favored enemy: a real +2 (or more), but only against that creature,
         so it is a note rather than a contribution. The model knew both the
         skill list and the per-enemy bonus already; nothing asked it. */
      if (this.appliesFavoredEnemyBonusToSkill(skill)) {
        this.getFavoredEnemies().forEach((enemy) => {
          const name = enemy.subtype ? `${enemy.type} (${enemy.subtype})` : enemy.type;
          out.push(situational(
            `favoredEnemy:${name}`, 'Favored enemy',
            `+${enemy.bonus} against ${String(name).toLowerCase()}`
          ));
        });
      }
      if (skill === 'handle animal') {
        const empathy = this.getWildEmpathyBonus();
        if (empathy !== null) {
          out.push(situational(
            'wildEmpathy', 'Wild empathy',
            `1d20${empathy >= 0 ? '+' : ''}${empathy} to change an animal’s attitude, as a Diplomacy check. A magical beast of Intelligence 1–2 at −4`
          ));
        }
      }
      /* A synergy that applies to one use of the skill rather than all of it:
         five ranks of Use rope help you climb a rope and nothing else. Real,
         but wrong to fold into the number the row shows. */
      getSynergiesInto(statKey.slice('skill:'.length)).conditional
        .filter((entry) => this.hasEarnedSynergy(entry))
        .forEach((entry) => {
          out.push(situational(
            `synergy:${entry.from}`, `${entry.from} (5 ranks)`,
            `+${synergyBonus(entry)} ${entry.when}`
          ));
        });

      if (skill === 'disguise' && hasFeatureAtLevel(cls, 'aThousandFacesLevel', level)) {
        out.push(situational(
          'aThousandFaces', 'A Thousand Faces',
          'Change your appearance at will, as alter self — but only while in your own form'
        ));
      }
      if (this.hasRogueSpecialAbility('Skill Mastery')) {
        out.push(situational(
          'skillMastery', 'Skill Mastery',
          'If this is one of the skills you chose, you may take 10 even under stress'
        ));
      }
    }

    return out;
  }

  /** Spell Focus / Greater Spell Focus bonus for one school, on its own. */
  getSpellFocusBonus(school) {
    return getFeatSpellDcBonus(this.getFeats(), getBaseSchool(school));
  }

  /**
   * The save DC to show beside one spell, or null when the spell offers no save
   * and there is nothing to resist. `focused` says whether Spell Focus or its
   * Greater form contributed, so the row can show that the feat did something.
   *
   * @param {object} spell - A spell object from spells.json
   * @param {number} level - The spell's level for this character's class
   * @returns {{dc: number, focused: boolean} | null}
   */
  getSpellSaveDCFor(spell, level) {
    if (!spellAllowsSave(spell)) return null;
    const dc = this.getSpellSaveDC(level, spell?.School);
    if (dc == null) return null;
    return { dc, focused: this.getSpellFocusBonus(spell?.School) > 0 };
  }

  addFeat(featName) {
    if (typeof featName !== 'string') return;
    const trimmed = featName.trim();
    if (trimmed === '') return;
    if (!Array.isArray(this.feats)) this.feats = [];
    this.feats.push(trimmed);
  }

  /**
   * Remove the feat at the given index (1:1 with the displayed list, so
   * removing a repeated entry only removes that specific instance).
   */
  removeFeatAt(index) {
    if (!Array.isArray(this.feats)) return;
    if (typeof index !== 'number' || index < 0 || index >= this.feats.length) return;
    this.feats.splice(index, 1);
  }

  // —— Skills ——
  /** Knowledge sub-skills from skills.json description (each has its own ranks/bonus). */
  static KNOWLEDGE_SUBSKILLS = [
    'arcana', 'architecture and engineering', 'dungeoneering', 'geography',
    'history', 'local', 'nature', 'nobility and royalty', 'religion', 'the planes',
  ];

  /**
   * All skill names from skills.json. Expands "Knowledge" into Knowledge (X) sub-skills.
   */
  getSkillNames() {
    const list = loadFile('skills');
    if (!Array.isArray(list)) return [];
    const names = list.map((s) => (s && s.Name ? String(s.Name) : '')).filter(Boolean);
    const result = [];
    for (const n of names) {
      if (n === 'Knowledge') {
        for (const sub of Player.KNOWLEDGE_SUBSKILLS) {
          result.push(`Knowledge (${sub})`);
        }
      } else {
        result.push(n);
      }
    }
    return result;
  }

  getSkillRanks(skillName) {
    const s = (this.skills || {})[skillName];
    return s && typeof s.ranks === 'number' ? Math.max(0, s.ranks) : 0;
  }

  getSkillBonus(skillName) {
    const s = (this.skills || {})[skillName];
    return s && typeof s.bonus === 'number' ? s.bonus : 0;
  }

  /** Whether a synergy entry's source skill has enough ranks to grant it. */
  hasEarnedSynergy(entry) {
    return this.getSkillRanks(entry?.from) >= synergyRanks(entry);
  }

  /**
   * Synergies actually earned into one skill, as `{ from, bonus }` rows ready
   * to become contributions. Only the unconditional ones: a synergy that
   * applies to a single use of the skill is reported beside the total instead.
   */
  getSkillSynergies(skillName) {
    return getSynergiesInto(skillName).flat
      .filter((entry) => this.hasEarnedSynergy(entry))
      .map((entry) => ({ from: entry.from, bonus: synergyBonus(entry) }));
  }

  /**
   * The flat synergy bonus to one skill. Sources are distinct by construction,
   * so they stack — Diplomacy really can carry +6, from Bluff, Knowledge
   * (nobility and royalty) and Sense motive at once.
   */
  getSkillSynergyBonus(skillName) {
    return this.getSkillSynergies(skillName)
      .reduce((total, row) => total + row.bonus, 0);
  }

  /**
   * The synergy bonus to a class check rather than a skill row: wild empathy,
   * bardic knowledge, a turning check.
   * @param {string} checkKey 'wildEmpathy' | 'bardicKnowledge' | 'turnUndead'
   */
  getCheckSynergyBonus(checkKey) {
    return getSynergiesIntoCheck(checkKey)
      .filter((entry) => this.hasEarnedSynergy(entry))
      .reduce((total, entry) => total + synergyBonus(entry), 0);
  }

  /** Whether this skill is a class skill for the player's current class. */
  isClassSkill(skillName) {
    const list = getClassSkillsListFromString(getClassData(this.class)?.classSkills ?? '');
    if (list.includes(skillName)) return true;
    if (/^Knowledge\s*\(/.test(skillName) && list.some((s) => /Knowledge\s*\(all\s+skills/i.test(s))) {
      return true;
    }
    return false;
  }

  /** Max ranks allowed for this skill (class: level+3; cross-class: (level+3)/2). */
  getMaxSkillRanks(skillName) {
    const level = this.getLevel();
    const cap = level + 3;
    return this.isClassSkill(skillName) ? cap : cap / 2;
  }

  /**
   * Skill total for display and dice: ability modifier + floor(ranks) + bonus.
   * Only the integer part of ranks is used. Applies armor check penalty if ArmorPenalty: true.
   * Swim skill gets double the penalty.
   */
  getSkillTotal(skillName) {
    const skills = loadFile('skills');
    let skill = Array.isArray(skills) ? skills.find((s) => s && s.Name === skillName) : null;
    if (!skill && /^Knowledge\s*\(/.test(skillName)) {
      skill = Array.isArray(skills) ? skills.find((s) => s && s.Name === 'Knowledge') : null;
    }
    const char = skill?.Characteristic;
    const key = char && { Str: 'str', Dex: 'dex', Con: 'con', Int: 'int', Wis: 'wis', Cha: 'cha' }[char];
    const mod = key ? this.getModifier(key) : 0;
    const ranks = Math.floor(this.getSkillRanks(skillName));
    const bonus = this.getSkillBonus(skillName);
    // A familiar grants the master a per-species skill bonus (e.g. Cat → Move
    // Silently +3); conditional Spot bonuses (Hawk/Owl) are excluded.
    const familiarSkillBonus = this.getFamiliarStatBonuses().skills[skillName] || 0;
    // Acrobatic, Stealthy, Skill Focus and the rest of the flat skill feats.
    const featBonus = getFeatSkillBonus(this.getFeats(), skillName);
    // A flat class bonus of the same shape: the druid's Nature Sense.
    const classBonus = this.getNatureSenseBonus(skillName);
    // An elf's +2 on Listen, a halfling's +2 on Move Silently. Only the
    // unconditional ones — a dwarf's +2 on Appraise applies to stonework alone
    // and is reported beside the total rather than inside it.
    const racialBonus = getFlatRacialSkillBonus(this.getRace(), skillName);
    // Five ranks in a related skill: the pairings are in skills.json.
    const synergyBonusTotal = this.getSkillSynergyBonus(skillName);
    let result = mod + ranks + bonus + familiarSkillBonus + featBonus + classBonus
      + racialBonus + synergyBonusTotal;

    // Apply armor check penalty if skill has ArmorPenalty flag
    const penalty = this.getArmorCheckPenalty();
    if (penalty > 0 && skill?.ArmorPenalty) {
      const multiplier = skillName === 'Swim' ? 2 : 1;
      result -= penalty * multiplier;
    }

    return result + this.getSkillConditionModifier(skillName);
  }

  /**
   * Net condition modifier for a single skill: the global penalty that hits
   * every skill (fear/Sickened/Energy Drained) plus any scoped penalties whose
   * scope matches this skill — by ability (e.g. Blinded −4 to Str/Dex skills) or
   * by name (Blinded Search, Dazzled Search/Spot). A scoped penalty applies once.
   */
  getSkillConditionModifier(skillName) {
    const mods = this.getConditionModifiers();
    let total = sumContributions(mods.skillsAll);

    const skills = loadFile('skills');
    let skill = Array.isArray(skills) ? skills.find((s) => s && s.Name === skillName) : null;
    if (!skill && /^Knowledge\s*\(/.test(skillName)) {
      skill = Array.isArray(skills) ? skills.find((s) => s && s.Name === 'Knowledge') : null;
    }
    const abilityKey = skill?.Characteristic
      ? { Str: 'str', Dex: 'dex', Con: 'con', Int: 'int', Wis: 'wis', Cha: 'cha' }[skill.Characteristic]
      : null;

    mods.skillSpecial.forEach((s) => {
      const nameMatch = Array.isArray(s.names) && s.names.includes(skillName);
      const abilityMatch = Array.isArray(s.abilities) && abilityKey && s.abilities.includes(abilityKey);
      if (nameMatch || abilityMatch) total += s.value;
    });

    return total;
  }

  setSkillRanks(skillName, value) {
    if (!skillName || typeof skillName !== 'string') return;
    if (!this.skills) this.skills = {};
    if (this.skills[skillName] == null) this.skills[skillName] = { ranks: 0, bonus: 0 };
    const num = Number(value);
    const max = this.getMaxSkillRanks(skillName);
    this.skills[skillName].ranks = clamp(Number.isNaN(num) ? 0 : num, 0, max);
  }

  setSkillBonus(skillName, value) {
    if (!skillName || typeof skillName !== 'string') return;
    if (!this.skills) this.skills = {};
    if (this.skills[skillName] == null) this.skills[skillName] = { ranks: 0, bonus: 0 };
    this.skills[skillName].bonus = clamp(Number(value) || 0, 0, 99);
  }

  /**
   * Total skill points to distribute = (skillPointsPerLevel + Int mod + 1 if Human) * (level + 3).
   */
  getTotalSkillPoints() {
    const data = getClassData(this.class);
    const perLevel = (data?.skillPointsPerLevel ?? 0) + this.getIntMod() + (this.race === 'Human' ? 1 : 0);
    const level = this.getLevel();
    return Math.max(0, perLevel * (level + 3));
  }

  /**
   * Skill points used = class skills contribute ranks; cross-class contribute ranks * 2.
   * Extra bonus languages (beyond Int mod) cost 2 SP each, or 1 SP if Speak Language is a class skill.
   */
  getUsedSkillPoints() {
    const names = this.getSkillNames();
    let sum = names.reduce((acc, name) => {
      const ranks = this.getSkillRanks(name);
      return acc + (this.isClassSkill(name) ? ranks : ranks * 2);
    }, 0);
    const learnedBonus = this.getBonusLanguagesLearned();
    const maxBonus = this.getMaxBonusLanguages();
    if (learnedBonus.length > maxBonus) {
      const extra = learnedBonus.length - maxBonus;
      const costPerExtra = this.isClassSkill('Speak Language') ? 1 : 2;
      sum += extra * costPerExtra;
    }
    return sum;
  }

  // —— Languages ——
  /** Automatic languages from race; Druid also gets Druidic. */
  getAutomaticLanguages() {
    const raceData = getRaceData(this.race);
    const list = Array.isArray(raceData?.automaticLanguages)
      ? [...raceData.automaticLanguages]
      : [];
    if (this.class === 'Druid' && !list.includes('Druidic')) list.push('Druidic');
    return list;
  }

  /** Bonus languages the player has learned (non-automatic). */
  getBonusLanguagesLearned() {
    return Array.isArray(this.bonusLanguagesLearned) ? [...this.bonusLanguagesLearned] : [];
  }

  /** Max number of bonus (non-automatic) languages from Int modifier. */
  getMaxBonusLanguages() {
    return Math.max(0, this.getIntMod());
  }

  /**
   * Options for the bonus language dropdown: race bonusLanguages + class extras,
   * excluding already known (automatic + learned). Returns sorted array.
   */
  getBonusLanguagesOptions() {
    const known = new Set([...this.getAutomaticLanguages(), ...this.getBonusLanguagesLearned()]);
    const raceData = getRaceData(this.race);
    let options = [];
    const bl = raceData?.bonusLanguages;
    if (Array.isArray(bl)) {
      options = [...bl];
    } else if (typeof bl === 'string' && bl.toLowerCase().includes('any')) {
      options = getAllBonusLanguageNames();
    }
    if (this.class === 'Cleric') {
      ['Celestial', 'Abyssal', 'Infernal'].forEach((l) => { if (!options.includes(l)) options.push(l); });
    }
    if (this.class === 'Druid') {
      if (!options.includes('Sylvan')) options.push('Sylvan');
    }
    if (this.class === 'Wizard') {
      if (!options.includes('Draconic')) options.push('Draconic');
    }
    options = [...new Set(options)];
    return options.filter((l) => !known.has(l)).sort((a, b) => a.localeCompare(b));
  }

  addBonusLanguage(lang) {
    const trimmed = (lang || '').trim();
    if (!trimmed) return;
    if (!this.bonusLanguagesLearned) this.bonusLanguagesLearned = [];
    if (this.bonusLanguagesLearned.includes(trimmed)) return;
    this.bonusLanguagesLearned.push(trimmed);
  }

  removeBonusLanguage(lang) {
    if (!this.bonusLanguagesLearned) return;
    this.bonusLanguagesLearned = this.bonusLanguagesLearned.filter((l) => l !== lang);
  }

  // —— Inventory ——
  getInventory() {
    return Array.isArray(this.inventory) ? this.inventory : [];
  }

  addInventoryItem(name, type, number, link = '', opts = {}) {
    if (!name || !type) return;
    if (!Array.isArray(this.inventory)) this.inventory = [];

    const masterwork = !!opts.masterwork;
    const bonus = Math.max(0, Math.min(5, parseInt(opts.bonus, 10) || 0));
    const effectIds = Array.isArray(opts.effectIds)
      ? opts.effectIds.filter((n) => Number.isInteger(n))
      : [];
    const overrides = normalizeOverrides(opts.overrides);

    const existingItem = this.inventory.find((item) =>
      sameInventoryEntry(item, { Name: name, ItemType: type, Link: link, masterwork, bonus, effectIds, overrides: overrides || undefined })
    );

    if (existingItem) {
      existingItem.Number = Math.max(0, (existingItem.Number || 0) + Math.max(1, Math.floor(number)));
    } else {
      const entry = {
        Name: name,
        ItemType: type,
        Number: Math.max(1, Math.floor(number)),
        Link: link || '',
        effectIds,
      };
      if (masterwork) entry.masterwork = true;
      if (bonus > 0) entry.bonus = bonus;
      if (typeof opts.baseLink === 'string' && opts.baseLink) entry.baseLink = opts.baseLink;
      if (overrides) entry.overrides = overrides;
      this.inventory.push(entry);
    }
  }

  removeInventoryItem(name, type, number, opts = {}) {
    if (!Array.isArray(this.inventory)) return;

    const link = typeof opts.link === 'string' ? opts.link : '';
    const masterwork = !!opts.masterwork;
    const bonus = Math.max(0, Math.min(5, parseInt(opts.bonus, 10) || 0));
    const effectIds = Array.isArray(opts.effectIds)
      ? opts.effectIds.filter((n) => Number.isInteger(n))
      : [];
    const overrides = normalizeOverrides(opts.overrides);

    const idx = this.inventory.findIndex((item) =>
      sameInventoryEntry(item, { Name: name, ItemType: type, Link: link, masterwork, bonus, effectIds, overrides: overrides || undefined })
    );
    if (idx === -1) return;

    const item = this.inventory[idx];
    item.Number = Math.max(0, (item.Number || 0) - Math.max(1, Math.floor(number)));

    if (item.Number <= 0) {
      this.inventory.splice(idx, 1);
    }
  }

  // —— Equipment ——
  getEquipment() {
    return this.equipment && typeof this.equipment === 'object' ? this.equipment : {};
  }

  equipItem(slot, itemData) {
    if (!slot || !itemData) return;
    if (!this.equipment || typeof this.equipment !== 'object') {
      this.equipment = {};
    }
    const entry = { ...itemData };
    const masterwork = !!itemData.masterwork;
    const bonus = clamp(parseInt(itemData.bonus, 10) || 0, 0, 5);
    const effectIds = Array.isArray(itemData.effectIds)
      ? itemData.effectIds.filter((n) => Number.isInteger(n))
      : [];
    if (masterwork) entry.masterwork = true;
    else delete entry.masterwork;
    if (bonus) entry.bonus = bonus;
    else delete entry.bonus;
    if (effectIds.length) entry.effectIds = effectIds;
    else delete entry.effectIds;
    const overrides = normalizeOverrides(itemData.overrides);
    if (overrides) entry.overrides = overrides;
    else delete entry.overrides;
    // Clear the paired hand slot when a 1H weapon (or shield) goes into a
    // hand that's currently half of a 2H grip — otherwise the other hand
    // keeps the 2H entry and the UI hides the newly-equipped item.
    const PAIR = { lh1: 'rh1', rh1: 'lh1', lh2: 'rh2', rh2: 'lh2' };
    const pair = PAIR[slot];
    if (pair && !entry.twoHanded && this.equipment?.[pair]?.twoHanded) {
      delete this.equipment[pair];
    }
    this.equipment[slot] = entry;
  }

  unequipSlot(slot) {
    if (!slot || !this.equipment) return;
    delete this.equipment[slot];
  }

  /**
   * What is equipped in the four free slots, in slot order.
   *
   * An equipped entry stores no quantity — it points at an inventory row — so
   * the count is read back off that row, matched on everything that makes two
   * otherwise-identical items different: the enhancement bonus, masterwork,
   * named effects and any overrides. A count of 1 is the fallback when no row
   * matches, which is what an item equipped and then removed from the bag
   * looks like.
   *
   * @returns {{slot: string, name: string, link: string, number: number,
   *   bonus: number, effectIds: number[], overrides: object|null}[]}
   */
  getEquippedAccessories() {
    const equipment = this.getEquipment();
    const inventory = this.getInventory();

    return OTHER_SLOTS
      .map((slot) => ({ slot, entry: equipment[slot] }))
      .filter(({ entry }) => entry && (entry.name || entry.link))
      .map(({ slot, entry }) => {
        const name = entry.overrides?.Name ?? entry.name ?? '';
        /* Same test as sameInventoryEntry, minus ItemType — an equipped entry
           does not carry one. */
        const row = inventory.find((item) => (
          item.Name === (entry.name ?? '')
          && (item.Link || '') === (entry.link || '')
          && !!item.masterwork === !!entry.masterwork
          && (item.bonus || 0) === (entry.bonus || 0)
          && (Array.isArray(item.effectIds) ? item.effectIds : []).slice().sort().join(',')
             === (Array.isArray(entry.effectIds) ? entry.effectIds : []).slice().sort().join(',')
          && stableOverrides(item.overrides) === stableOverrides(entry.overrides)
        ));
        return {
          slot,
          name,
          link: entry.link || '',
          number: Math.max(1, Number(row?.Number) || 1),
          masterwork: !!entry.masterwork,
          bonus: entry.bonus || 0,
          effectIds: Array.isArray(entry.effectIds) ? entry.effectIds : [],
          overrides: entry.overrides ?? null,
        };
      });
  }

  /**
   * Replace the overrides map on an inventory entry. Passing an empty or
   * null map clears the field. Callers pre-compute the diff against the
   * resolved base item.
   */
  setInventoryItemOverrides(index, overrides) {
    if (!Array.isArray(this.inventory)) return;
    if (typeof index !== 'number' || index < 0 || index >= this.inventory.length) return;
    const entry = this.inventory[index];
    if (!entry) return;
    const normalized = normalizeOverrides(overrides);
    if (normalized) entry.overrides = normalized;
    else delete entry.overrides;
  }

  /**
   * Replace the overrides map on an equipment slot entry. Passing an empty
   * or null map clears the field.
   */
  setEquipmentSlotOverrides(slot, overrides) {
    if (!slot || !this.equipment || typeof this.equipment !== 'object') return;
    const entry = this.equipment[slot];
    if (!entry || typeof entry !== 'object') return;
    const normalized = normalizeOverrides(overrides);
    if (normalized) entry.overrides = normalized;
    else delete entry.overrides;
  }

  /**
   * Atomic update of an inventory entry's magical fields. Used by the
   * card editor to persist masterwork/bonus/effectIds alongside overrides.
   */
  setInventoryItemMagic(index, { masterwork, bonus, effectIds, overrides } = {}) {
    if (!Array.isArray(this.inventory)) return;
    if (typeof index !== 'number' || index < 0 || index >= this.inventory.length) return;
    const entry = this.inventory[index];
    if (!entry) return;
    if (masterwork === true) entry.masterwork = true;
    else delete entry.masterwork;
    const b = Math.max(0, Math.min(5, parseInt(bonus, 10) || 0));
    if (b > 0) entry.bonus = b;
    else delete entry.bonus;
    if (Array.isArray(effectIds)) {
      entry.effectIds = effectIds.filter((n) => Number.isInteger(n));
    }
    const normalized = normalizeOverrides(overrides);
    if (normalized) entry.overrides = normalized;
    else delete entry.overrides;
  }

  /** Atomic update of an equipment slot entry's magical fields. */
  setEquipmentSlotMagic(slot, { masterwork, bonus, effectIds, overrides } = {}) {
    if (!slot || !this.equipment || typeof this.equipment !== 'object') return;
    const entry = this.equipment[slot];
    if (!entry || typeof entry !== 'object') return;
    if (masterwork === true) entry.masterwork = true;
    else delete entry.masterwork;
    const b = Math.max(0, Math.min(5, parseInt(bonus, 10) || 0));
    if (b > 0) entry.bonus = b;
    else delete entry.bonus;
    if (Array.isArray(effectIds)) {
      entry.effectIds = effectIds.filter((n) => Number.isInteger(n));
    }
    const normalized = normalizeOverrides(overrides);
    if (normalized) entry.overrides = normalized;
    else delete entry.overrides;
  }

  // —— Gold ——
  adjustGold(delta) {
    const current = Math.max(0, Number(this.gold) || 0);
    const adjusted = current + Number(delta || 0);
    this.setGold(adjusted);
  }
}

/**
 * Returns the race data object from races.json for a given race name.
 * Use this to read abilityModifiers, landSpeed, automaticLanguages, bonusLanguages,
 * favoredClass, traits, weaponProficiency, etc. for the player sheet.
 * @param {string} raceName - Race name (e.g. "Human", "Dwarf")
 * @returns {Object|null} Race object or null if not found
 */
export function getRaceData(raceName) {
  if (!raceName || typeof raceName !== 'string') return null;
  const races = loadFile('races');
  return races?.[raceName] ?? null;
}

/**
 * Parse classSkills string from classes.json into an array of skill names.
 * Handles "Name (Abi), Name (Abi), and Name (Abi)." and names with parentheses e.g. "Knowledge (arcana) (Int)".
 * @param {string} classSkillsStr - The classSkills string from class data
 * @returns {string[]} Skill names (trimmed)
 */
export function getClassSkillsListFromString(classSkillsStr) {
  if (!classSkillsStr || typeof classSkillsStr !== 'string') return [];
  const abilitySuffix = /\s+\((?:Str|Dex|Con|Int|Wis|Cha)\)\s*\.?\s*$/i;
  const nASuffix = /\s+\(n\/a\)\s*\.?\s*$/i;
  const parts = classSkillsStr.split(/\s*,\s*|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
  return parts.map((part) => {
    let p = part;
    const abMatch = p.match(abilitySuffix);
    if (abMatch) p = p.slice(0, -abMatch[0].length).trim();
    const naMatch = p.match(nASuffix);
    if (naMatch) p = p.slice(0, -naMatch[0].length).trim();
    return p;
  }).filter(Boolean);
}

/**
 * Returns the class data object from classes.json for a given class name.
 * Use this to read hitDice, baseAttack, saves, classFeatures, etc. for the player sheet.
 * @param {string} className - Class name (e.g. "Wizard", "Fighter")
 * @returns {Object|null} Class object or null if not found
 */
export function getClassData(className) {
  if (!className || typeof className !== 'string') return null;
  const classes = loadFile('classes');
  return classes?.[className] ?? null;
}

/** All language names used as bonus options when race says "Any". Excludes secret (Druidic). */
export function getAllBonusLanguageNames() {
  const races = loadFile('races');
  const set = new Set(['Abyssal', 'Celestial', 'Draconic', 'Dwarven', 'Elven', 'Giant', 'Gnoll', 'Gnome', 'Goblin', 'Halfling', 'Infernal', 'Orc', 'Sylvan', 'Terran', 'Undercommon']);
  if (races && typeof races === 'object') {
    Object.values(races).forEach((r) => {
      if (Array.isArray(r.automaticLanguages)) r.automaticLanguages.forEach((l) => set.add(l));
      if (Array.isArray(r.bonusLanguages)) r.bonusLanguages.forEach((l) => set.add(l));
    });
  }
  set.delete('Common');
  set.delete('Druidic');
  return [...set].sort((a, b) => a.localeCompare(b));
}

export { ABILITY_KEYS, RACE_SIZE_FALLBACK as RACE_SIZE };
export default Player;
