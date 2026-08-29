/**
 * Druid / ranger animal-companion domain model.
 *
 * Holds the persisted, user-editable state of a companion (which creature,
 * custom name, current damage, optional max-HP override, per-stat bonus
 * overlays, per-attack overrides) and computes every derived value from the
 * base creature block (animals.json) + the owner's effective druid level +
 * the advancement table. Per CLAUDE.md, all game logic lives here — the card
 * component only reads these getters.
 *
 * Rules: obsidian-vault/dnd-rules/animal-companion.md.
 */

import { getAnimalBaseByRef } from '../animal/animalsUtils';
import { effectiveCompanionLevel, getCompanionAdvancement, getCompanionAdjustment } from '../animal/animalCompanionData';
import { parseAttacks, recomputeAttack } from '../animal/attackParser';

/** Average roll on a d8 (used for the default bonus-HD hit points). */
const AVG_D8 = 4.5;

const abilityMod = (score) => Math.floor(((Number(score) || 0) - 10) / 2);
const goodSaveBase = (hd) => 2 + Math.floor((Number(hd) || 0) / 2);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export default class AnimalCompanion {
  /** @param {{class?:string, level?:number}|null} owner */
  constructor(owner = null) {
    this.ref = '';
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
    // Per-attack overrides keyed by line index: { [index]: { bonus?, damage? } }.
    this.overrides = {};
    this._owner = { class: owner?.class || '', level: num(owner?.level, 0) };
  }

  // —— Owner / effective level ——
  setOwner(owner) {
    this._owner = { class: owner?.class || '', level: num(owner?.level, 0) };
    return this;
  }

  /** The owner's effective druid level (druid level, or ⌊ranger/2⌋). */
  getCharacterEffectiveLevel() {
    return effectiveCompanionLevel(this._owner);
  }

  /** Level adjustment of the chosen creature (0 standard list, negative otherwise). */
  getAdjustment() {
    return getCompanionAdjustment(this.ref) ?? 0;
  }

  /**
   * The companion's own effective level driving the advancement table:
   * the owner's effective level plus the creature's (negative) list adjustment.
   * E.g. a level-7 druid's leopard (−3) advances as effective level 4.
   */
  getEffectiveLevel() {
    return this.getCharacterEffectiveLevel() + this.getAdjustment();
  }

  getAdvancement() {
    return getCompanionAdvancement(this.getEffectiveLevel());
  }

  // —— Base creature ——
  getRef() {
    return this.ref || '';
  }

  /** Raw animals.json block for the selected ref, or null. */
  getBase() {
    return this.ref ? getAnimalBaseByRef(this.ref) : null;
  }

  getName() {
    if (this.name) return this.name;
    const base = this.getBase();
    return base?.name || '';
  }

  getSize() {
    return this.getBase()?.size || '';
  }

  getType() {
    return this.getBase()?.type || '';
  }

  getDescriptionHtml() {
    return this.getBase()?.description || '';
  }

  getCombatHtml() {
    return this.getBase()?.combat || '';
  }

  // —— Hit dice ——
  getBaseHD() {
    return num(this.getBase()?.hitDice?.count, 0);
  }

  getBonusHD() {
    return this.getAdvancement().bonusHD;
  }

  getTotalHD() {
    return this.getBaseHD() + this.getBonusHD();
  }

  // —— Abilities ——
  getBaseStrMod() {
    return abilityMod(this.getBase()?.abilities?.str);
  }

  getBaseDexMod() {
    return abilityMod(this.getBase()?.abilities?.dex);
  }

  getStrMod() {
    const adj = this.getAdvancement().abilityAdj;
    return abilityMod(num(this.getBase()?.abilities?.str, 10) + adj);
  }

  getDexMod() {
    const adj = this.getAdvancement().abilityAdj;
    return abilityMod(num(this.getBase()?.abilities?.dex, 10) + adj);
  }

  getConMod() {
    return abilityMod(this.getBase()?.abilities?.con);
  }

  /**
   * The six ability scores as the sheet shows them, with the advancement
   * adjustment already applied — it raises **both** Strength and Dexterity
   * (animal-companion.md), and nothing else. A score the base block omits
   * comes back null, which is how an animal with no Intelligence entry reads.
   */
  getAbilities() {
    const base = this.getBase()?.abilities ?? {};
    const adj = this.getAdvancement().abilityAdj;
    const score = (key, bonus = 0) => {
      const raw = base[key];
      return Number.isFinite(Number(raw)) ? Number(raw) + bonus : null;
    };
    return {
      str: score('str', adj),
      dex: score('dex', adj),
      con: score('con'),
      int: score('int'),
      wis: score('wis'),
      cha: score('cha'),
    };
  }

  /** The modifier for one ability, or null when the creature has no such score. */
  getAbilityMod(key) {
    const score = this.getAbilities()[key];
    return score == null ? null : abilityMod(score);
  }

  /** Net change in the Dex modifier caused by the Str/Dex advancement adjustment. */
  getDexModDelta() {
    return this.getDexMod() - this.getBaseDexMod();
  }

  // —— Hit points ——
  /**
   * Default max HP = base creature HP + bonusHD × (avg d8 + Con mod).
   * The user may override this with setMaxLife(value); clearing it restores
   * the computed default.
   */
  getDefaultMaxLife() {
    const base = this.getBase();
    if (!base) return 0;
    const bonusHD = this.getBonusHD();
    const conMod = this.getConMod();
    const bonusHp = Math.floor(bonusHD * AVG_D8) + bonusHD * conMod;
    return num(base.hitDice?.hp, 0) + bonusHp;
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

  /** Full AC = base total + natural-armor adj + Dex-mod delta + general bonus. */
  getArmorClass() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus);
    return num(base.armorClass?.total, 10) + this.getNaturalArmorAdj() + this.getDexModDelta() + num(this.acBonus);
  }

  /** Touch AC = base touch + Dex-mod delta + general + touch bonus (natural armor excluded). */
  getContactAC() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus) + num(this.acTouchBonus);
    return num(base.armorClass?.touch, 10) + this.getDexModDelta() + num(this.acBonus) + num(this.acTouchBonus);
  }

  /** Flat-footed AC = base flat + natural-armor adj + general + flat bonus (Dex excluded). */
  getFlatFootedAC() {
    const base = this.getBase();
    if (!base) return 10 + num(this.acBonus) + num(this.acFlatBonus);
    return num(base.armorClass?.flatFooted, 10) + this.getNaturalArmorAdj() + num(this.acBonus) + num(this.acFlatBonus);
  }

  // —— Initiative / speed ——
  getInitiative() {
    const base = this.getBase();
    if (!base) return num(this.initBonus);
    // Preserve any feat-granted init (base.initiative may exceed base Dex mod).
    return num(base.initiative, 0) + this.getDexModDelta() + num(this.initBonus);
  }

  getSpeed() {
    const base = this.getBase();
    if (!base) return num(this.speedBonus);
    return num(base.speed?.land, 0) + num(this.speedBonus);
  }

  // —— Saves ——
  /** Good-save base on total HD (Fort + Ref are good for companions). */
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

  // —— Attacks ——
  /** Companion BAB = druid ¾ progression on total HD. */
  getBaseAttackBonus() {
    return Math.floor((this.getTotalHD() * 3) / 4);
  }

  /**
   * Structured, advancement-adjusted attack lines with per-line overrides
   * applied: [{ name, count, bonus, damage, type, index }].
   */
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

  // —— Tricks / special abilities ——
  getBonusTricks() {
    return this.getAdvancement().bonusTricks;
  }

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
    return Math.min(this.getDamage(), this.getTotalHD());
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
   * Load persisted state. Optionally (re)set the owner so effective level
   * resolves — the Player model passes its { class, level } here.
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
