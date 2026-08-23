/**
 * D&D 3.5 character model. All derived values (modifiers, size) are computed here;
 * the UI must not perform calculations.
 *
 * Single-class only. Reuses same class list as spellbook (CLASSES).
 * Size and race-derived data come from src/data/races.json when available.
 */

import { loadFile } from '../loadFile';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../utils';
import { getCarryingCapacity as capacityFromStr, classifyLoad } from './carryingCapacity';
import { aggregateConditionEffects, sumContributions } from './conditionEffects';
import { getClassProgression, getProgressionValue, hasFeatureAtLevel } from './classProgression';
import { getBaseFeatName } from '../featChoices';
import AnimalCompanion from './animalCompanion';
import Familiar from './familiar';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

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
    this.spells = [];
    this.usedDomainSpells = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.preparedDomainSpells = {};
    this.gnomeSpellUses = {}; // { [spellLink]: 0|1 } per-day uses for gnome racial spells
    /* Per-day class-feature consumption, keyed by feature ("rage", "smiteEvil",
       "turnUndead", …). Uses-per-day features count whole uses; pools such as
       lay on hands and wholeness of body store the amount spent. Maximums are
       derived from class progression, never stored here, and over-cap values are
       kept as entered per the non-enforcing rule. Cleared by resetClassFeatureUses. */
    this.classFeatureUses = {};
    /* Whether a barbarian rage is currently running. A stance rather than a
       condition: it grants bonuses instead of penalties and ends by choice, so
       it is not part of the condition subsystem. Its aftermath (Fatigued) is. */
    this.raging = false;
    /* Ranger favored enemies, in selection order. Each entry is
       { type, subtype?, bonus }; the bonus rises in steps of 2 when a later
       slot is spent raising an existing enemy rather than naming a new one. */
    this.favoredEnemies = [];
    /* Ranger combat style: 'Archery' or 'Two-Weapon Fighting', chosen once at
       2nd level and permanent thereafter. Null until chosen. */
    this.combatStyle = null;
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

    if (data.gnomeSpellUses && typeof data.gnomeSpellUses === 'object') {
      this.gnomeSpellUses = {};
      Object.entries(data.gnomeSpellUses).forEach(([link, n]) => {
        if (typeof link === 'string' && link.trim() !== '' && Number.isFinite(n)) {
          this.gnomeSpellUses[link] = Math.min(1, Math.max(0, Math.floor(n)));
        }
      });
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
      classFeatureUses: this.classFeatureUses && typeof this.classFeatureUses === 'object' ? { ...this.classFeatureUses } : {},
      raging: !!this.raging,
      favoredEnemies: Array.isArray(this.favoredEnemies)
        ? this.favoredEnemies.map((e) => ({ ...e }))
        : [],
      combatStyle: this.combatStyle || null,
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
    const base = this.getAbilityBase(abilityKey) + this.getAbilityBonus(abilityKey)
      + this.getRaceAbilityModifier(abilityKey) + this.getRageAbilityBonus(abilityKey);
    if (!ABILITY_KEYS.includes(abilityKey)) return base;
    const mods = this.getScoreConditionModifiers();
    if (mods.abilityZero[abilityKey] && mods.abilityZero[abilityKey].length > 0) return 0;
    return base + sumContributions(mods.ability[abilityKey]);
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
   * A clone of this character with ALL condition effects (manual and derived)
   * switched off, used to compute how much active conditions changed a derived
   * stat. Returns null when no conditions are active. Cached per instance.
   */
  getConditionBaseline() {
    if (this._ignoreConditions) return null;
    if (this._conditionBaselineCache !== undefined) return this._conditionBaselineCache;
    if (this.getActiveConditions().length === 0) {
      this._conditionBaselineCache = null;
      return null;
    }
    const clone = new this.constructor();
    clone.load(this.serialize());
    clone._ignoreConditions = true;
    this._conditionBaselineCache = clone;
    return clone;
  }

  /**
   * Net condition-caused change for each displayed combat stat (current minus
   * condition-free baseline). Captures both channels, including the ability
   * cascade. Empty object when no conditions are active.
   */
  getConditionStatDeltas() {
    const base = this.getConditionBaseline();
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
    };
  }

  /** Condition-caused change to a weapon's attack bonus (vs baseline). */
  getWeaponAttackConditionDelta(weaponData) {
    const base = this.getConditionBaseline();
    if (!base) return 0;
    return calculateWeaponAttackBonus(this, weaponData) - calculateWeaponAttackBonus(base, weaponData);
  }

  /** True when active conditions change a weapon's damage string (vs baseline). */
  isWeaponDamageConditionAffected(weaponData) {
    const base = this.getConditionBaseline();
    if (!base) return false;
    return calculateWeaponDamage(this, weaponData) !== calculateWeaponDamage(base, weaponData);
  }

  /** Condition-caused change to a single skill total (vs baseline). */
  getSkillConditionDelta(skillName) {
    const base = this.getConditionBaseline();
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

  getEquipment() {
    return this.equipment || {};
  }

  /** The animal companion (AnimalCompanion instance) or null. */
  getCompanion() {
    if (this.companion) this.companion.setOwner({ class: this.class, level: this.level });
    return this.companion || null;
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
    return this.class === 'Wizard' || this.class === 'Sorcerer';
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
  getSize() {
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
      const base = this.getAbilityBase(abilityKey) + this.getAbilityBonus(abilityKey)
        + this.getRaceAbilityModifier(abilityKey) + this.getRageAbilityBonus(abilityKey);
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

  /** Clear every class-feature counter (rest). */
  resetClassFeatureUses() {
    this.classFeatureUses = {};
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
    const conBonus = this.getConMod() * this.getLevel();
    // Energy Drained removes 5 HP per negative level (manual/score channel).
    // A Toad familiar grants the master +3 HP (per-species familiar bonus).
    return base + bonus + conBonus + this.getHpConditionModifier() + this.getFamiliarStatBonuses().hp;
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
    const races = loadFile('races');
    const base = Number(races?.[this.race]?.landSpeed) || 30;
    if (!getClassData(this.class)) return base;
    return base + this.getFastMovementBonus();
  }

  /**
   * Total speed = base speed + speedBonus.
   */
  getTotalSpeed() {
    const speed = this.getBaseSpeed() + Number(this.speedBonus || 0);
    // Half-speed conditions (Blinded/Exhausted/Entangled/Disabled) apply once.
    return this.isHalfSpeed() ? Math.floor(speed / 2) : speed;
  }

  /**
   * Get armor speed reduction info. Returns { hasReduction, originalSpeed, reducedSpeed }.
   * Dwarves ignore armor speed reduction. Monk/Barbarian bonuses are preserved on top of reduced speed.
   */
  getArmorSpeedInfo() {
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
   * Unarmed strike damage. Defaults to PHB size-based damage (Medium = 1d3).
   * Monk uses the scaling table from class-features.md (1d6 at L1, ..., 2d10 at L20),
   * shifted up/down for Large/Small.
   */
  getPunchDamage() {
    const size = this.getSize() || 'Medium';
    if (this.class === 'Monk') {
      return monkUnarmedDamage(this.getLevel(), size);
    }
    return defaultUnarmedDamage(size);
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
    return Math.max(0, base + this.getModifier(config.attemptsAbility || 'cha'));
  }

  /**
   * The level the character turns at: their class level for a cleric, three
   * lower for a paladin. Never negative, and zero without the feature.
   */
  getTurnUndeadEffectiveLevel() {
    const config = this.getTurnUndeadConfig();
    if (!config) return 0;
    return Math.max(0, this.getLevel() + (Number(config.effectiveLevelOffset) || 0));
  }

  /** The bonus added to the d20 turning check: the Charisma modifier. */
  getTurnUndeadCheckBonus() {
    const config = this.getTurnUndeadConfig();
    if (!config) return 0;
    return this.getModifier(config.attemptsAbility || 'cha');
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
    const bonus = this.getTurnUndeadEffectiveLevel() + this.getTurnUndeadCheckBonus();
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

  /**
   * Alignment problems with the current class, as `{ code, message }` entries.
   * Empty when nothing is wrong.
   *
   * Four rules, all data-driven: a required alignment (paladin, monk), a
   * forbidden one (barbarian, bard), a class needing one neutral axis (druid),
   * and a cleric holding an alignment domain that does not match them.
   *
   * The cleric's "within one step of their deity" rule is not checked: the
   * model stores no deity to compare against.
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

    return warnings;
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
    return this.getLevel() + this.getModifier(ability);
  }

  /** Save DC for the performances that allow one: `10 + half level + Cha`. */
  getPerformanceSaveDc() {
    if (!getClassProgression(this.class).performances) return 0;
    return 10 + Math.floor(this.getLevel() / 2) + this.getChaMod();
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
    return performances.map((p) => {
      const meetsLevel = level >= (Number(p.level) || 1);
      const meetsRanks = ranks >= (Number(p.performRanks) || 0);
      return {
        name: p.name,
        level: Number(p.level) || 1,
        performRanks: Number(p.performRanks) || 0,
        summary: p.summary || '',
        saveDc: p.hasSave ? saveDc : null,
        meetsLevel,
        meetsRanks,
        available: meetsLevel && meetsRanks,
      };
    });
  }

  // —— Monk ——

  /**
   * Stunning fist attempts per day: a number equal to the monk's level.
   * (The `1 per 4 levels` rate is what a non-monk gets from the feat.)
   */
  getStunningFistMax() {
    return getProgressionValue(this.class, 'stunningFistUsesPerDay', this.getLevel(), 0);
  }

  /** Stunning fist save DC: `10 + half monk level + Wisdom modifier`. */
  getStunningFistDc() {
    if (this.getStunningFistMax() <= 0) return 0;
    return 10 + Math.floor(this.getLevel() / 2) + this.getWisMod();
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
    const armor = this.getEquippedArmorRaw();
    if (!armor) return 0;
    const val = armor['Armor Check Penalty'];
    if (!val || val === '—') return 0;
    return Math.abs(parseInt(String(val), 10)) || 0;
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
      + this.getMonkAcBonus();
    return ac + Number(this.acBonus || 0) + this.getAcConditionModifier() + this.getRageAcModifier();
  }

  /**
   * Touch AC (ignores armor bonus): 10 + Dex modifier (capped by armor).
   * Adds the general acBonus and the touch-only acTouchBonus.
   */
  getContactAC() {
    const ac = 10 + this.getAcDexMod() + this.getMonkAcBonus();
    return ac + Number(this.acBonus || 0) + Number(this.acTouchBonus || 0)
      + this.getAcConditionModifier() + this.getRageAcModifier();
  }

  /**
   * Flat-footed AC (ignores DEX, uses armor): 10 + armor bonus. Monk still gets Wis bonus.
   * Adds the general acBonus and the flat-footed-only acFlatBonus.
   */
  getFlatFootedAC() {
    const ac = 10 + this.getArmorBonus() + this.getMonkAcBonus();
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
      + this.getFamiliarStatBonuses().fort + this.getDivineGraceBonus();
  }

  getTotalReflexSave() {
    return this.getReflexSave() + Number(this.reflexBonus || 0)
      + this.getFamiliarStatBonuses().reflex + this.getDivineGraceBonus();
  }

  getTotalWillSave() {
    return this.getWillSave() + Number(this.willBonus || 0) + this.getDivineGraceBonus();
  }

  getTotalInitiative() {
    return this.getInitiativeModifier() + Number(this.initiativeBonus || 0);
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
   * Max feat points = 1 + (1 if Human) + floor(level / 3).
   */
  getFeatPointsMax() {
    const level = this.getLevel();
    return 1 + (this.race === 'Human' ? 1 : 0) + Math.floor(level / 3);
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
   * Selected feats that qualify for the class bonus slots — for a fighter,
   * those flagged `fighterBonus` in feats.json. Feats taken with a choice
   * ("Weapon focus (longsword)") match on their base name.
   *
   * Uncapped: a fighter may hold more combat feats than they have slots for,
   * and the UI flags the overflow rather than blocking it.
   */
  getClassBonusFeatsUsed() {
    const flag = getClassProgression(this.class).bonusFeatSource;
    if (!flag) return 0;
    const feats = loadFile('feats');
    if (!Array.isArray(feats)) return 0;
    const qualifying = new Set(
      feats.filter((f) => f?.[flag] && typeof f.Name === 'string')
        .map((f) => f.Name.toLowerCase())
    );
    return this.getFeats()
      .filter((name) => {
        const stored = String(name).trim().toLowerCase();
        // Exact first: a canonical name may itself carry a parenthetical
        // ("Armor proficiency (heavy)") that must not be stripped away.
        return qualifying.has(stored) || qualifying.has(getBaseFeatName(name).toLowerCase());
      })
      .length;
  }

  /**
   * Feats charged against the general budget: everything that does not
   * qualify for the class bonus slots. For a class without bonus slots this
   * is simply the whole selection.
   */
  getGeneralFeatsUsed() {
    return this.getFeatPointsUsed() - this.getClassBonusFeatsUsed();
  }

  /**
   * Whether this class runs a second, independent feat budget — it must both
   * grant slots and define which feats fill them. A class that grants slots
   * without a qualifying flag has nothing to charge against them yet, so it
   * keeps the single general budget.
   */
  hasClassBonusFeatPool() {
    const prog = getClassProgression(this.class);
    return Array.isArray(prog.bonusFeatLevels) && !!prog.bonusFeatSource;
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
    let result = mod + ranks + bonus + familiarSkillBonus;

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
