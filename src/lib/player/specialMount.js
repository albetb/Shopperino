/**
 * Paladin special-mount domain model.
 *
 * Rules: obsidian-vault/dnd-rules/class-features.md → "Special mount (paladin
 * sub-system)". The mount is a magical beast, not a normal animal: it advances
 * on the paladin's own level (no −3 style level adjustment), gains d10 bonus
 * Hit Dice rather than the companion's d8, and climbs an Intelligence track
 * until it can be communicated with.
 *
 * Deliberately narrower than AnimalCompanion: the creature is fixed by the
 * paladin's size (heavy warhorse for a Medium paladin, war pony for a Small
 * one), so there is no picker and no `ref` to persist. Everything derived
 * comes from that base block plus the advancement row for the paladin's level.
 *
 * Per CLAUDE.md all game logic lives here; the card only reads these getters.
 */

import { getAnimalBaseByRef } from '../animal/animalsUtils';
import { parseAttacks, recomputeAttack } from '../animal/attackParser';
import { getClassProgression } from './classProgression';

/** Average roll on a d10 (the default hit points per bonus HD). */
const AVG_D10 = 5.5;

const abilityMod = (score) => Math.floor(((Number(score) || 0) - 10) / 2);
const goodSaveBase = (hd) => 2 + Math.floor((Number(hd) || 0) / 2);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** The mount block from the paladin's class progression, or an empty object. */
function mountConfig() {
  const config = getClassProgression('Paladin').specialMount;
  return config && typeof config === 'object' ? config : {};
}

export default class SpecialMount {
  /** @param {{level?:number, size?:string}|null} owner */
  constructor(owner = null) {
    this.name = '';
    this.damage = 0;
    this.maxLife = null; // null → use the computed default
    // Editable bonus overlays, added on top of the computed base stat.
    this.acBonus = 0;
    this.acTouchBonus = 0;
    this.acFlatBonus = 0;
    this.initBonus = 0;
    this.speedBonus = 0;
    this.fortBonus = 0;
    this.reflexBonus = 0;
    this.willBonus = 0;
    /** Hours of the daily summoning allowance already spent. */
    this.hoursUsed = 0;
    /** Per-attack overrides keyed by line index: { [index]: { bonus?, damage? } }. */
    this.overrides = {};
    this._owner = { level: num(owner?.level, 0), size: owner?.size || 'Medium' };
  }

  // —— Owner ——
  setOwner(owner) {
    this._owner = { level: num(owner?.level, 0), size: owner?.size || 'Medium' };
    return this;
  }

  /** The paladin's level, which drives the whole advancement table. */
  getPaladinLevel() {
    return this._owner.level;
  }

  // —— Base creature ——
  /**
   * Which creature the paladin's size grants. Anything other than Small falls
   * back to the Medium entry — the SRD only distinguishes those two, and a DM
   * substitute is a table decision the sheet does not model.
   */
  getRef() {
    const mounts = mountConfig().mountsBySize || {};
    return mounts[this._owner.size] || mounts.Medium || '';
  }

  getBase() {
    const ref = this.getRef();
    return ref ? getAnimalBaseByRef(ref) : null;
  }

  getName() {
    if (this.name) return this.name;
    return this.getBase()?.name || '';
  }

  getSize() {
    return this.getBase()?.size || '';
  }

  /** The mount is a magical beast once bonded, whatever the base block says. */
  getType() {
    return 'Magical beast';
  }

  getDescriptionHtml() {
    return this.getBase()?.description || '';
  }

  getCombatHtml() {
    return this.getBase()?.combat || '';
  }

  // —— Advancement ——
  /**
   * The advancement row for the paladin's level: the highest whose `minLevel`
   * has been reached. Null below 5th, when there is no mount yet.
   */
  getAdvancement() {
    const rows = mountConfig().advancement;
    if (!Array.isArray(rows)) return null;
    const level = this.getPaladinLevel();
    const reached = rows.filter((r) => num(r?.minLevel, Infinity) <= level);
    if (reached.length === 0) return null;
    return reached.reduce((best, r) => (num(r.minLevel) > num(best.minLevel) ? r : best));
  }

  /** Every special ability granted so far, in the order the rows award them. */
  getSpecialAbilities() {
    const rows = mountConfig().advancement;
    if (!Array.isArray(rows)) return [];
    const level = this.getPaladinLevel();
    return rows
      .filter((r) => num(r?.minLevel, Infinity) <= level)
      .sort((a, b) => num(a.minLevel) - num(b.minLevel))
      .flatMap((r) => (Array.isArray(r.specials) ? r.specials : []));
  }

  hasSpecialAbility(name) {
    const wanted = String(name).toLowerCase();
    return this.getSpecialAbilities().some((s) => String(s).toLowerCase() === wanted);
  }

  // —— Hit dice ——
  getBaseHD() {
    return num(this.getBase()?.hitDice?.count, 0);
  }

  getBonusHD() {
    return num(this.getAdvancement()?.bonusHD, 0);
  }

  getTotalHD() {
    return this.getBaseHD() + this.getBonusHD();
  }

  // —— Abilities ——
  getBaseStrMod() {
    return abilityMod(this.getBase()?.abilities?.str);
  }

  getStrAdj() {
    return num(this.getAdvancement()?.strAdj, 0);
  }

  getStrMod() {
    return abilityMod(num(this.getBase()?.abilities?.str, 10) + this.getStrAdj());
  }

  /** Dex is not advanced for a mount — only Str and Intelligence are. */
  getDexMod() {
    return abilityMod(this.getBase()?.abilities?.dex);
  }

  getConMod() {
    return abilityMod(this.getBase()?.abilities?.con);
  }

  /** The mount's Intelligence, which climbs from 6 to 9 as the paladin levels. */
  getIntelligence() {
    const advanced = this.getAdvancement()?.intelligence;
    if (Number.isFinite(Number(advanced))) return Number(advanced);
    return num(this.getBase()?.abilities?.int, 2);
  }

  // —— Hit points ——
  /** Default max HP = base creature HP + bonusHD × (avg d10 + Con mod). */
  getDefaultMaxLife() {
    const base = this.getBase();
    if (!base) return 0;
    const bonusHD = this.getBonusHD();
    const conMod = this.getConMod();
    return num(base.hitDice?.hp, 0) + Math.floor(bonusHD * AVG_D10) + bonusHD * conMod;
  }

  getMaxLife() {
    return this.maxLife == null ? this.getDefaultMaxLife() : num(this.maxLife, 0);
  }

  getCurrentHp() {
    return this.getMaxLife() - num(this.damage, 0);
  }

  getDamage() {
    return num(this.damage, 0);
  }

  // —— Armor class ——
  getNaturalArmorAdj() {
    return num(this.getAdvancement()?.naturalArmorAdj, 0);
  }

  getArmorClass() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus);
    return num(base.armorClass?.total, 10) + this.getNaturalArmorAdj() + num(this.acBonus);
  }

  /** Touch AC excludes natural armor, so advancement does not raise it. */
  getContactAC() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus) + num(this.acTouchBonus);
    return num(base.armorClass?.touch, 10) + num(this.acBonus) + num(this.acTouchBonus);
  }

  getFlatFootedAC() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus) + num(this.acFlatBonus);
    return num(base.armorClass?.flatFooted, 10) + this.getNaturalArmorAdj()
      + num(this.acBonus) + num(this.acFlatBonus);
  }

  // —— Initiative / speed ——
  getInitiative() {
    const base = this.getBase();
    if (!base) return num(this.initBonus);
    return num(base.initiative, 0) + num(this.initBonus);
  }

  /** Land speed, including the improved-speed bonus once that row is reached. */
  getSpeed() {
    const base = this.getBase();
    if (!base) return num(this.speedBonus);
    const improved = this.hasSpecialAbility('Improved speed')
      ? num(mountConfig().improvedSpeedBonus, 0)
      : 0;
    return num(base.speed?.land, 0) + improved + num(this.speedBonus);
  }

  // —— Saves ——
  getFortSave() {
    return goodSaveBase(this.getTotalHD()) + this.getConMod() + num(this.fortBonus);
  }

  getReflexSave() {
    return goodSaveBase(this.getTotalHD()) + this.getDexMod() + num(this.reflexBonus);
  }

  /** Will is not improved by advancement — it stays at the base creature's value. */
  getWillSave() {
    return num(this.getBase()?.saves?.will, 0) + num(this.willBonus);
  }

  // —— Spell resistance ——
  /**
   * Spell resistance equals the paladin's level + 5, but only once the mount
   * has reached the row that grants it. Zero otherwise.
   */
  getSpellResistance() {
    if (!this.hasSpecialAbility('Spell resistance')) return 0;
    return this.getPaladinLevel() + num(mountConfig().spellResistanceBonus, 0);
  }

  // —— Attacks ——
  /** Mount BAB = ¾ progression on total HD, as for an animal companion. */
  getBaseAttackBonus() {
    return Math.floor((this.getTotalHD() * 3) / 4);
  }

  getAttacks() {
    const base = this.getBase();
    if (!base) return [];
    const src = base.fullAttack && base.fullAttack !== '-' ? base.fullAttack : base.attack;
    const lines = parseAttacks(src);
    const babDelta = this.getBaseAttackBonus() - num(base.baseAttackGrapple?.baseAttack, 0);
    const strModDelta = this.getStrMod() - this.getBaseStrMod();
    return lines.map((line, index) => {
      const computed = recomputeAttack(line, { babDelta, strModDelta, sizeModDelta: 0 });
      const ov = this.overrides?.[index];
      if (ov) {
        if (ov.bonus !== undefined && ov.bonus !== null && ov.bonus !== '') computed.bonus = Number(ov.bonus);
        if (ov.damage !== undefined && ov.damage !== null) computed.damage = String(ov.damage);
      }
      return { ...computed, index };
    });
  }

  // —— Summoning ——
  /** The daily allowance: 2 hours per paladin level. */
  getSummonHoursMax() {
    return this.getPaladinLevel() * num(mountConfig().summonHoursPerLevel, 0);
  }

  getSummonHoursUsed() {
    return Math.max(0, num(this.hoursUsed, 0));
  }

  /** Hours left today. Never negative, even when the used figure is over cap. */
  getSummonHoursRemaining() {
    return Math.max(0, this.getSummonHoursMax() - this.getSummonHoursUsed());
  }

  /** Whether more hours have been spent than the day allows — flagged, not blocked. */
  isSummonOverCap() {
    return this.getSummonHoursUsed() > this.getSummonHoursMax();
  }

  /** Spend (or, with a negative delta, give back) summoning hours. */
  useSummonHours(delta = 1) {
    this.hoursUsed = Math.max(0, num(this.hoursUsed, 0) + num(delta, 0));
    return this;
  }

  resetSummonHours() {
    this.hoursUsed = 0;
    return this;
  }

  // —— Setters ——
  setName(name) {
    this.name = typeof name === 'string' ? name : '';
    return this;
  }

  setDamage(value) {
    this.damage = Math.max(0, num(value, 0));
    return this;
  }

  adjustDamage(delta) {
    this.damage = Math.max(0, num(this.damage, 0) + num(delta, 0));
    return this;
  }

  setMaxLife(value) {
    this.maxLife = value == null || value === '' ? null : Math.max(0, num(value, 0));
    return this;
  }

  setStatBonus(key, value) {
    const allowed = ['acBonus', 'acTouchBonus', 'acFlatBonus', 'initBonus', 'speedBonus', 'fortBonus', 'reflexBonus', 'willBonus'];
    if (allowed.includes(key)) this[key] = num(value, 0);
    return this;
  }

  setAttackOverride(index, patch) {
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0) return this;
    if (!this.overrides || typeof this.overrides !== 'object') this.overrides = {};
    if (patch == null) {
      delete this.overrides[i];
      return this;
    }
    const next = { ...(this.overrides[i] || {}) };
    if (patch.bonus === undefined) { /* leave */ }
    else if (patch.bonus === null || patch.bonus === '') delete next.bonus;
    else next.bonus = Number(patch.bonus);
    if (patch.damage === undefined) { /* leave */ }
    else if (patch.damage === null || patch.damage === '') delete next.damage;
    else next.damage = String(patch.damage);
    if (Object.keys(next).length === 0) delete this.overrides[i];
    else this.overrides[i] = next;
    return this;
  }

  // —— Persistence ——
  serialize() {
    const out = {};
    if (this.name) out.name = this.name;
    if (num(this.damage) > 0) out.damage = num(this.damage);
    if (this.maxLife != null) out.maxLife = num(this.maxLife);
    if (num(this.hoursUsed) > 0) out.hoursUsed = num(this.hoursUsed);
    for (const key of ['acBonus', 'acTouchBonus', 'acFlatBonus', 'initBonus', 'speedBonus', 'fortBonus', 'reflexBonus', 'willBonus']) {
      if (num(this[key]) !== 0) out[key] = num(this[key]);
    }
    if (this.overrides && Object.keys(this.overrides).length) {
      const ov = {};
      for (const [k, v] of Object.entries(this.overrides)) {
        if (!v || typeof v !== 'object') continue;
        const entry = {};
        if (v.bonus !== undefined && v.bonus !== null) entry.bonus = Number(v.bonus);
        if (v.damage !== undefined && v.damage !== null) entry.damage = String(v.damage);
        if (Object.keys(entry).length) ov[k] = entry;
      }
      if (Object.keys(ov).length) out.overrides = ov;
    }
    return out;
  }

  load(data, owner = null) {
    if (owner) this.setOwner(owner);
    if (!data || typeof data !== 'object') return this;
    this.name = typeof data.name === 'string' ? data.name : '';
    this.damage = Math.max(0, num(data.damage, 0));
    this.maxLife = data.maxLife == null ? null : Math.max(0, num(data.maxLife, 0));
    this.hoursUsed = Math.max(0, num(data.hoursUsed, 0));
    for (const key of ['acBonus', 'acTouchBonus', 'acFlatBonus', 'initBonus', 'speedBonus', 'fortBonus', 'reflexBonus', 'willBonus']) {
      this[key] = num(data[key], 0);
    }
    this.overrides = {};
    if (data.overrides && typeof data.overrides === 'object') {
      for (const [k, v] of Object.entries(data.overrides)) {
        if (!v || typeof v !== 'object') continue;
        const entry = {};
        if (v.bonus !== undefined && v.bonus !== null) entry.bonus = Number(v.bonus);
        if (v.damage !== undefined && v.damage !== null) entry.damage = String(v.damage);
        if (Object.keys(entry).length) this.overrides[k] = entry;
      }
    }
    return this;
  }
}
