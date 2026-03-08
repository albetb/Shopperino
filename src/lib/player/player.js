/**
 * D&D 3.5 character model. All derived values (modifiers, size) are computed here;
 * the UI must not perform calculations.
 *
 * Single-class only. Reuses same class list as spellbook (CLASSES).
 * Size and race-derived data come from src/data/races.json when available.
 */

import { loadFile } from '../loadFile';
import { getItemByRef } from '../utils';

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

/** Hit dice string to max value (e.g. "d8" -> 8). Used for base life minimum. */
function hitDiceToMax(hd) {
  if (!hd || typeof hd !== 'string') return 4;
  const n = parseInt(hd.replace(/^d/i, ''), 10);
  return Number.isFinite(n) ? n : 4;
}

/** Resolve spell link to numeric id from spells.json (same as Spellbook). */
function getSpellIdByLink(link) {
  if (!link) return -1;
  const spells = loadFile('spells');
  if (!Array.isArray(spells)) return -1;
  const s = spells.find((x) => x && x.Link === link);
  return s != null && typeof s.id === 'number' ? s.id : -1;
}

/** Normalize spells to [[id, prepared, used], ...]. Accepts legacy {Link, Prepared, Used}. */
function normalizePlayerSpells(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((slot) => {
      if (Array.isArray(slot) && slot.length >= 3) {
        return [Number(slot[0]), Number(slot[1]) || 0, Number(slot[2]) || 0];
      }
      if (slot && typeof slot === 'object' && slot.Link != null) {
        const id = getSpellIdByLink(slot.Link);
        if (id >= 0) {
          return [id, Number(slot.Prepared) || 0, Number(slot.Used) || 0];
        }
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
    this.maxLife = 10;
    this.healthModifier = 0;
    this.damage = 0;
    this.skills = {};
    this.gold = 0;
    this.featsUsed = 0;
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

    if (Number.isFinite(data.featsUsed)) this.featsUsed = Math.max(0, Math.floor(data.featsUsed));

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
          const arr = Array.isArray(val) ? val : (val && val.Link ? [val] : []);
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
      this.equipment = { ...data.equipment };
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
      maxLife: this.maxLife,
      healthModifier: this.healthModifier,
      damage: this.damage,
      skills: { ...this.skills },
      gold: Number(Number(this.gold).toFixed(2)),
      featsUsed: Math.max(0, Math.floor(this.featsUsed)),
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
      speedBonus: typeof this.speedBonus === 'number' ? this.speedBonus : 0,
      initiativeBonus: typeof this.initiativeBonus === 'number' ? this.initiativeBonus : 0,
      fortBonus: typeof this.fortBonus === 'number' ? this.fortBonus : 0,
      reflexBonus: typeof this.reflexBonus === 'number' ? this.reflexBonus : 0,
      willBonus: typeof this.willBonus === 'number' ? this.willBonus : 0,
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

  getEquipment() {
    return this.equipment || {};
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
    this.abilities[abilityKey].bonus = clamp(value, 0, 99);
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
   */
  getBaseLifeMin() {
    const data = getClassData(this.class);
    return hitDiceToMax(data?.hitDice);
  }

  /**
   * Total max HP = base life + bonus modifier + (Con modifier × level).
   * Con modifier can be negative, so total can be reduced.
   */
  getMaxLife() {
    const base = Number(this.maxLife) || 0;
    const bonus = Number(this.healthModifier) || 0;
    const conBonus = this.getConMod() * this.getLevel();
    return base + bonus + conBonus;
  }

  getCurrentHp() {
    return Math.max(0, this.getMaxLife() - (Number(this.damage) || 0));
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
    return this.getBaseSpeed() + Number(this.speedBonus || 0);
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
    const reducedTotal = armorSpeed + classBonus + Number(this.speedBonus || 0);
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
    return this.getDexMod();
  }

  /**
   * Get equipped armor item's raw data, or null if no armor equipped.
   */
  getEquippedArmorRaw() {
    const entry = this.equipment?.armor;
    if (!entry?.link) return null;
    return getItemByRef(entry.link)?.raw || null;
  }

  /**
   * Armor bonus from equipped armor, parsed from "Armor/Shield Bonus" field.
   */
  getArmorBonus() {
    const armor = this.getEquippedArmorRaw();
    if (!armor) return 0;
    const val = armor['Armor/Shield Bonus'];
    if (val === undefined || val === null) return 0;
    return parseInt(String(val).replace('+', ''), 10) || 0;
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
   * Armor class = 10 + Dex modifier (capped by armor) + armor bonus. Monk adds Wis bonus (min 0) and +1 at 5, +2 at 10, +3 at 15, +4 at 20.
   */
  getArmorClass() {
    let ac = 10 + this.getEffectiveDexMod() + this.getArmorBonus();
    if (this.class === 'Monk') {
      ac += Math.max(0, this.getWisMod());
      const level = this.getLevel();
      if (level >= 20) ac += 4;
      else if (level >= 15) ac += 3;
      else if (level >= 10) ac += 2;
      else if (level >= 5) ac += 1;
    }
    return ac;
  }

  /**
   * Touch AC (ignores armor bonus): 10 + Dex modifier (capped by armor).
   */
  getContactAC() {
    let ac = 10 + this.getEffectiveDexMod();
    if (this.class === 'Monk') {
      ac += Math.max(0, this.getWisMod());
      const level = this.getLevel();
      if (level >= 20) ac += 4;
      else if (level >= 15) ac += 3;
      else if (level >= 10) ac += 2;
      else if (level >= 5) ac += 1;
    }
    return ac;
  }

  /**
   * Flat-footed AC (ignores DEX, uses armor): 10 + armor bonus. Monk still gets Wis bonus.
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
    return ac;
  }

  /**
   * Save base: high = 2 + floor(Level/2), low = floor(Level/3). Then add ability modifier.
   */
  getFortitudeSave() {
    const data = getClassData(this.class);
    const level = this.getLevel();
    const base = (data?.fortSave === 'high') ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
    return base + this.getConMod();
  }

  getReflexSave() {
    const data = getClassData(this.class);
    const level = this.getLevel();
    const base = (data?.reflexSave === 'high') ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
    return base + this.getDexMod();
  }

  getWillSave() {
    const data = getClassData(this.class);
    const level = this.getLevel();
    const base = (data?.willSave === 'high') ? (2 + Math.floor(level / 2)) : Math.floor(level / 3);
    return base + this.getWisMod();
  }

  getTotalFortitudeSave() {
    return this.getFortitudeSave() + Number(this.fortBonus || 0);
  }

  getTotalReflexSave() {
    return this.getReflexSave() + Number(this.reflexBonus || 0);
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
   * Total weight of inventory. For now returns 0; will be derived later.
   */
  getInventoryWeight() {
    return 0;
  }

  /**
   * Max feat points = 1 + (1 if Human) + floor(level / 3).
   */
  getFeatPointsMax() {
    const level = this.getLevel();
    return 1 + (this.race === 'Human' ? 1 : 0) + Math.floor(level / 3);
  }

  getFeatPointsUsed() {
    return Math.max(0, Math.floor(Number(this.featsUsed) || 0));
  }

  setFeatPointsUsed(value) {
    this.featsUsed = Math.max(0, Math.floor(Number(value) || 0));
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
    let result = mod + ranks + bonus;

    // Apply armor check penalty if skill has ArmorPenalty flag
    const penalty = this.getArmorCheckPenalty();
    if (penalty > 0 && skill?.ArmorPenalty) {
      const multiplier = skillName === 'Swim' ? 2 : 1;
      result -= penalty * multiplier;
    }

    return result;
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
