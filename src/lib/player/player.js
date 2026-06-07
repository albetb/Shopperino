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
    const base = this.getAbilityBase(abilityKey) + this.getAbilityBonus(abilityKey) + this.getRaceAbilityModifier(abilityKey);
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
      const base = this.getAbilityBase(abilityKey) + this.getAbilityBonus(abilityKey) + this.getRaceAbilityModifier(abilityKey);
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
   * Base land speed (feet). From race; Barbarian +10; Monk +10 at 3, +20 at 6, +30 at 9, +40 at 12, +50 at 15, +60 at 18.
   */
  getBaseSpeed() {
    const races = loadFile('races');
    const base = Number(races?.[this.race]?.landSpeed) || 30;
    const data = getClassData(this.class);
    if (!data) return base;
    if (this.class === 'Barbarian') return base + 10;
    if (this.class === 'Monk') {
      const level = this.getLevel();
      const monkBonus = 10 * Math.min(6, Math.floor(level / 3));
      return base + monkBonus;
    }
    return base;
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

    const key = raceLandSpeed === 20 ? 'Speed (20ft)' : 'Speed (30ft)';
    const armorSpeedStr = armor[key];
    if (!armorSpeedStr) {
      return { hasReduction: false, originalSpeed: this.getTotalSpeed(), reducedSpeed: this.getTotalSpeed() };
    }

    const armorSpeed = parseInt(armorSpeedStr, 10);
    if (isNaN(armorSpeed) || armorSpeed >= raceLandSpeed) {
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
    let ac = 10 + this.getAcDexMod() + this.getArmorBonus() + this.getShieldBonus();
    if (this.class === 'Monk') {
      ac += Math.max(0, this.getWisMod());
      const level = this.getLevel();
      if (level >= 20) ac += 4;
      else if (level >= 15) ac += 3;
      else if (level >= 10) ac += 2;
      else if (level >= 5) ac += 1;
    }
    return ac + Number(this.acBonus || 0) + this.getAcConditionModifier();
  }

  /**
   * Touch AC (ignores armor bonus): 10 + Dex modifier (capped by armor).
   * Adds the general acBonus and the touch-only acTouchBonus.
   */
  getContactAC() {
    let ac = 10 + this.getAcDexMod();
    if (this.class === 'Monk') {
      ac += Math.max(0, this.getWisMod());
      const level = this.getLevel();
      if (level >= 20) ac += 4;
      else if (level >= 15) ac += 3;
      else if (level >= 10) ac += 2;
      else if (level >= 5) ac += 1;
    }
    return ac + Number(this.acBonus || 0) + Number(this.acTouchBonus || 0) + this.getAcConditionModifier();
  }

  /**
   * Flat-footed AC (ignores DEX, uses armor): 10 + armor bonus. Monk still gets Wis bonus.
   * Adds the general acBonus and the flat-footed-only acFlatBonus.
   */
  getFlatFootedAC() {
    let ac = 10 + this.getArmorBonus();
    if (this.class === 'Monk') {
      ac += Math.max(0, this.getWisMod());
      const level = this.getLevel();
      if (level >= 20) ac += 4;
      else if (level >= 15) ac += 3;
      else if (level >= 10) ac += 2;
      else if (level >= 5) ac += 1;
    }
    return ac + Number(this.acBonus || 0) + Number(this.acFlatBonus || 0) + this.getAcConditionModifier();
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
    return this.getBaseWillSave() + this.getWisMod() + this.getSaveConditionModifier();
  }

  getTotalFortitudeSave() {
    return this.getFortitudeSave() + Number(this.fortBonus || 0) + this.getFamiliarStatBonuses().fort;
  }

  getTotalReflexSave() {
    return this.getReflexSave() + Number(this.reflexBonus || 0) + this.getFamiliarStatBonuses().reflex;
  }

  getTotalWillSave() {
    return this.getWillSave() + Number(this.willBonus || 0);
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
