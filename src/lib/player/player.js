/**
 * D&D 3.5 character model. All derived values (modifiers, size) are computed here;
 * the UI must not perform calculations.
 *
 * Single-class only. Reuses same class list as spellbook (CLASSES).
 * Size and race-derived data come from src/data/races.json when available.
 */

import { loadFile } from '../loadFile';

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

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

class Player {
  constructor() {
    this.name = '';
    this.race = '';
    this.class = '';
    this.level = 1;
    this.abilities = defaultAbilities();
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
            bonus: clamp(a.bonus, 0, 99),
          };
        }
      });
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
    };
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
   * @returns {number} Bonus (0–99)
   */
  getAbilityBonus(abilityKey) {
    const a = this.abilities[abilityKey];
    return a ? clamp(a.bonus, 0, 99) : 0;
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
    return this.getAbilityBase(abilityKey) + this.getAbilityBonus(abilityKey) + this.getRaceAbilityModifier(abilityKey);
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

  // —— Setters (for UI / Redux updates) ——
  setName(name) {
    this.name = typeof name === 'string' ? name : '';
  }

  setRace(race) {
    this.race = typeof race === 'string' ? race : '';
  }

  setClass(_class) {
    this.class = typeof _class === 'string' ? _class : '';
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
    this.abilities[abilityKey].bonus = clamp(value, 0, 99);
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

export { ABILITY_KEYS, RACE_SIZE_FALLBACK as RACE_SIZE };
export default Player;
