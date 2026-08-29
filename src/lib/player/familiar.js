/**
 * Wizard / sorcerer familiar domain model.
 *
 * Holds the persisted, user-editable state of a familiar (which creature,
 * custom name, current damage, optional max-HP override, per-stat bonus
 * overlays, per-attack overrides) and computes every derived value from the
 * base creature block (animals.json) + the MASTER context + the master-level
 * advancement table. Per CLAUDE.md, all game logic lives here — the card
 * component only reads these getters.
 *
 * Unlike the animal companion, a familiar's stats derive from its master:
 * HP = ⌊master max HP ÷ 2⌋, BAB = master BAB, saves = best of (master base,
 * fixed familiar base 2/2/0) + the familiar's own ability mod, and the attack
 * BONUS uses the master BAB while damage stays the base creature's. The
 * advancement table raises the familiar's natural armor and Intelligence score.
 *
 * Rules: obsidian-vault/dnd-rules/familiar.md.
 */

import { getAnimalBaseByRef } from '../animal/animalsUtils';
import { getFamiliarAdvancement, getFamiliarBonus } from '../animal/familiarData';
import { parseAttacks, recomputeAttack } from '../animal/attackParser';

/** Fixed familiar base save bonuses per the SRD (Fort +2, Ref +2, Will +0). */
const FAMILIAR_BASE_SAVES = { fort: 2, ref: 2, will: 0 };

const abilityMod = (score) => Math.floor(((Number(score) || 0) - 10) / 2);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export default class Familiar {
  /** @param {{level?:number, maxHp?:number, bab?:number, baseFort?:number, baseRef?:number, baseWill?:number}|null} owner */
  constructor(owner = null) {
    this.ref = '';
    this.name = '';
    this.damage = 0;
    this.maxLife = null; // null → use the computed default (½ master HP)
    // Editable bonus overlays, added on top of the computed base stat.
    this.acBonus = 0;
    this.acTouchBonus = 0;
    this.acFlatBonus = 0;
    this.initBonus = 0;
    this.speedBonus = 0;
    this.fortBonus = 0;
    this.reflexBonus = 0;
    this.willBonus = 0;
    // Per-attack overrides keyed by line index: { [index]: { bonus?, damage? } }.
    this.overrides = {};
    this._owner = this._normalizeOwner(owner);
  }

  _normalizeOwner(owner) {
    return {
      level: num(owner?.level, 0),
      maxHp: num(owner?.maxHp, 0),
      bab: num(owner?.bab, 0),
      baseFort: num(owner?.baseFort, 0),
      baseRef: num(owner?.baseRef, 0),
      baseWill: num(owner?.baseWill, 0),
    };
  }

  // —— Owner / master context ——
  setOwner(owner) {
    this._owner = this._normalizeOwner(owner);
    return this;
  }

  getMasterLevel() {
    return this._owner.level;
  }

  getMasterBaseAttackBonus() {
    return this._owner.bab;
  }

  getAdvancement() {
    return getFamiliarAdvancement(this.getMasterLevel());
  }

  // —— Base creature ——
  getRef() {
    return this.ref || '';
  }

  getBase() {
    return this.ref ? getAnimalBaseByRef(this.ref) : null;
  }

  getName() {
    if (this.name) return this.name;
    return this.getBase()?.name || '';
  }

  getSize() {
    return this.getBase()?.size || '';
  }

  getType() {
    // A familiar is treated as a magical beast regardless of its base type.
    return 'Magical Beast';
  }

  getDescriptionHtml() {
    return this.getBase()?.description || '';
  }

  getCombatHtml() {
    return this.getBase()?.combat || '';
  }

  /** The structured per-species bonus this familiar grants its master. */
  getSpeciesBonus() {
    return getFamiliarBonus(this.ref);
  }

  // —— Hit dice ——
  getNaturalHD() {
    return num(this.getBase()?.hitDice?.count, 0);
  }

  /** For HD-dependent effects: the greater of the master's level and natural HD. */
  getEffectiveHD() {
    return Math.max(this.getMasterLevel(), this.getNaturalHD());
  }

  // —— Abilities (unchanged from the base animal) ——
  getStrMod() {
    return abilityMod(this.getBase()?.abilities?.str);
  }

  getDexMod() {
    return abilityMod(this.getBase()?.abilities?.dex);
  }

  getConMod() {
    return abilityMod(this.getBase()?.abilities?.con);
  }

  getWisMod() {
    return abilityMod(this.getBase()?.abilities?.wis);
  }

  /** Familiar Intelligence SCORE from the advancement table (replaces the base Int). */
  getInt() {
    return this.getAdvancement().int;
  }

  /**
   * The six ability scores as the sheet shows them. A familiar keeps the base
   * animal's physical and mental scores except Intelligence, which the
   * advancement table replaces outright as the master gains levels.
   */
  getAbilities() {
    const base = this.getBase()?.abilities ?? {};
    const score = (key) => (Number.isFinite(Number(base[key])) ? Number(base[key]) : null);
    return {
      str: score('str'),
      dex: score('dex'),
      con: score('con'),
      int: this.getInt(),
      wis: score('wis'),
      cha: score('cha'),
    };
  }

  /** The modifier for one ability, or null when the creature has no such score. */
  getAbilityMod(key) {
    const score = this.getAbilities()[key];
    return score == null ? null : abilityMod(score);
  }

  // —— Hit points ——
  /** Default max HP = ⌊master max HP ÷ 2⌋ (excluding temp HP). */
  getDefaultMaxLife() {
    return Math.floor(num(this._owner.maxHp, 0) / 2);
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
    return this.getAdvancement().naturalArmorAdj;
  }

  /** Full AC = base total + natural-armor adj + general bonus. */
  getArmorClass() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus);
    return num(base.armorClass?.total, 10) + this.getNaturalArmorAdj() + num(this.acBonus);
  }

  /** Touch AC = base touch + general + touch bonus (natural armor excluded). */
  getContactAC() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus) + num(this.acTouchBonus);
    return num(base.armorClass?.touch, 10) + num(this.acBonus) + num(this.acTouchBonus);
  }

  /** Flat-footed AC = base flat + natural-armor adj + general + flat bonus. */
  getFlatFootedAC() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus) + num(this.acFlatBonus);
    return num(base.armorClass?.flatFooted, 10) + this.getNaturalArmorAdj() + num(this.acBonus) + num(this.acFlatBonus);
  }

  // —— Initiative / speed ——
  getInitiative() {
    const base = this.getBase();
    if (!base) return num(this.initBonus);
    return num(base.initiative, 0) + num(this.initBonus);
  }

  getSpeed() {
    const base = this.getBase();
    if (!base) return num(this.speedBonus);
    return num(base.speed?.land, 0) + num(this.speedBonus);
  }

  // —— Saves: max(master base, fixed familiar base 2/2/0) + familiar ability mod ——
  getFortSave() {
    return Math.max(num(this._owner.baseFort, 0), FAMILIAR_BASE_SAVES.fort) + this.getConMod() + num(this.fortBonus);
  }

  getReflexSave() {
    return Math.max(num(this._owner.baseRef, 0), FAMILIAR_BASE_SAVES.ref) + this.getDexMod() + num(this.reflexBonus);
  }

  getWillSave() {
    return Math.max(num(this._owner.baseWill, 0), FAMILIAR_BASE_SAVES.will) + this.getWisMod() + num(this.willBonus);
  }

  // —— Attacks ——
  /** Familiar BAB = master's BAB. */
  getBaseAttackBonus() {
    return this.getMasterBaseAttackBonus();
  }

  /**
   * Structured attack lines with per-line overrides applied:
   * [{ name, count, bonus, damage, type, index }]. The base animal's listed
   * bonus already bakes in size + best-of-Str/Dex + feats; since a familiar's
   * abilities don't change, we only swap the animal's BAB for the master's
   * (babDelta) and leave damage as the base creature's (no Str delta).
   */
  getAttacks() {
    const base = this.getBase();
    if (!base) return [];
    const src = base.fullAttack && base.fullAttack !== '-' ? base.fullAttack : base.attack;
    const lines = parseAttacks(src);
    const babDelta = this.getBaseAttackBonus() - num(base.baseAttackGrapple?.baseAttack, 0);
    return lines.map((line, index) => {
      const computed = recomputeAttack(line, { babDelta, strModDelta: 0, sizeModDelta: 0 });
      const ov = this.overrides?.[index];
      if (ov) {
        if (ov.bonus !== undefined && ov.bonus !== null && ov.bonus !== '') computed.bonus = Number(ov.bonus);
        if (ov.damage !== undefined && ov.damage !== null) computed.damage = String(ov.damage);
      }
      return { ...computed, index };
    });
  }

  // —— Special abilities ——
  getSpecialAbilities() {
    return this.getAdvancement().specials.slice();
  }

  // —— Setters ——
  setRef(ref) {
    this.ref = typeof ref === 'string' ? ref : '';
    return this;
  }

  setName(name) {
    this.name = typeof name === 'string' ? name : '';
    return this;
  }

  /**
   * A night's natural healing: 1 hit point per Hit Die, or whatever damage is
   * left when that is less — the creature version of the character rule in
   * combat.md, where a character heals 1 per level. Split from
   * `healAsIfRested` so the sheet can report the amount before applying it.
   */
  getRestHealAmount() {
    return Math.min(this.getDamage(), this.getEffectiveHD());
  }

  /** Apply that night's healing. */
  healAsIfRested() {
    this.setDamage(this.getDamage() - this.getRestHealAmount());
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
    const current = this.overrides[i] || {};
    const next = { ...current };
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
    const out = { ref: this.ref || '' };
    if (this.name) out.name = this.name;
    if (num(this.damage) > 0) out.damage = num(this.damage);
    if (this.maxLife != null) out.maxLife = num(this.maxLife);
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

  /**
   * Load persisted state. Optionally (re)set the master context so derived
   * values resolve — the Player model passes its { level, maxHp, bab, base saves }.
   */
  load(data, owner = null) {
    if (owner) this.setOwner(owner);
    if (!data || typeof data !== 'object') return this;
    this.ref = typeof data.ref === 'string' ? data.ref : '';
    this.name = typeof data.name === 'string' ? data.name : '';
    this.damage = Math.max(0, num(data.damage, 0));
    this.maxLife = data.maxLife == null ? null : Math.max(0, num(data.maxLife, 0));
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
