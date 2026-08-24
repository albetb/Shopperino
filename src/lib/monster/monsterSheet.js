import { getCreatureBaseByRef } from '../animal/animalsUtils';
import { parseAttacks } from '../animal/attackParser';

/**
 * One monster as the master runs it in combat: the stat block plus the damage
 * it has taken and any bonuses applied at the table.
 *
 * Deliberately narrower than the Player model. A monster has no class, no
 * equipment and no conditions — only the handful of numbers a master adjusts
 * mid-fight. One bonus per stat, matching what the player sheet exposes and
 * nothing more.
 *
 * Every derived value lives here rather than in the sheet component, per the
 * domain-model rule in CLAUDE.md.
 */

/** The stats a master can nudge, in the order the sheet lays them out. */
export const BONUS_KEYS = ['ac', 'initiative', 'speed', 'fort', 'reflex', 'will'];

export default class MonsterSheet {
  constructor(ref = '') {
    this.ref = ref;
    /* Damage taken, not current HP — the same shape the Player model uses, so
       a change to max HP does not silently heal or hurt the creature. */
    this.damage = 0;
    /* Overrides the stat block's rolled hit points when set. Null means "use
       the average printed in the block". */
    this.maxLife = null;
    BONUS_KEYS.forEach((key) => { this[`${key}Bonus`] = 0; });
  }

  /** The raw stat block, or null when the ref names nothing. */
  getBase() {
    return getCreatureBaseByRef(this.ref);
  }

  getName() {
    return this.getBase()?.name || '';
  }

  getRef() {
    return this.ref;
  }

  isValid() {
    return !!this.getBase();
  }

  // —— Hit points ——

  /** The hit points printed in the stat block. */
  getDefaultMaxLife() {
    return Math.max(1, Math.floor(Number(this.getBase()?.hitDice?.hp) || 1));
  }

  getMaxLife() {
    if (this.maxLife == null) return this.getDefaultMaxLife();
    return Math.max(1, Math.floor(Number(this.maxLife) || 1));
  }

  setMaxLife(value) {
    this.maxLife = value == null ? null : Math.max(1, Math.floor(Number(value) || 1));
  }

  getDamage() {
    return Math.max(0, Math.floor(Number(this.damage) || 0));
  }

  getCurrentHp() {
    return this.getMaxLife() - this.getDamage();
  }

  /**
   * Heal (positive) or hurt (negative). Clamped between full health and −10,
   * the point at which a creature is dead — the same bounds the player sheet
   * uses, so the two HP controls behave identically.
   */
  adjustHp(delta) {
    const max = this.getMaxLife();
    const next = this.getDamage() - Math.floor(Number(delta) || 0);
    this.damage = Math.max(0, Math.min(max + 10, next));
  }

  /** Back to full, for reusing a stat block on the next identical creature. */
  resetHp() {
    this.damage = 0;
  }

  // —— Bonuses ——

  getBonus(key) {
    return Math.floor(Number(this[`${key}Bonus`]) || 0);
  }

  setBonus(key, value) {
    if (!BONUS_KEYS.includes(key)) return;
    this[`${key}Bonus`] = Math.floor(Number(value) || 0);
  }

  /** True when any bonus is set or damage taken — i.e. the sheet is dirty. */
  hasAdjustments() {
    if (this.getDamage() !== 0) return true;
    if (this.maxLife != null) return true;
    return BONUS_KEYS.some((key) => this.getBonus(key) !== 0);
  }

  // —— Derived combat values ——

  /**
   * The three armour classes. One bonus moves all three together: a master
   * saying "+2 AC" means the creature is harder to hit, however you attack it.
   */
  getArmorClass() {
    return (Number(this.getBase()?.armorClass?.total) || 10) + this.getBonus('ac');
  }

  getTouchAc() {
    return (Number(this.getBase()?.armorClass?.touch) || 10) + this.getBonus('ac');
  }

  getFlatFootedAc() {
    return (Number(this.getBase()?.armorClass?.flatFooted) || 10) + this.getBonus('ac');
  }

  /** The parenthesised breakdown from the stat block ("+2 Dex, +7 natural"). */
  getAcComponents() {
    return this.getBase()?.armorClass?.components || '';
  }

  getInitiative() {
    return (Number(this.getBase()?.initiative) || 0) + this.getBonus('initiative');
  }

  getSave(which) {
    const key = which === 'reflex' ? 'ref' : which;
    return (Number(this.getBase()?.saves?.[key]) || 0) + this.getBonus(which);
  }

  getFortitudeSave() { return this.getSave('fort'); }
  getReflexSave() { return this.getSave('reflex'); }
  getWillSave() { return this.getSave('will'); }

  /** Land speed in feet, the one number a speed bonus moves. */
  getSpeed() {
    const speed = this.getBase()?.speed;
    const land = speed && typeof speed === 'object' ? Number(speed.land) : 0;
    return (Number.isFinite(land) ? land : 0) + this.getBonus('speed');
  }

  /** The full speed line ("40 ft., fly 80 ft. (good)"), which one number cannot show. */
  getSpeedLine() {
    return this.getBase()?.speed?.raw || '';
  }

  // —— Stat block passthroughs ——

  getAbilities() {
    return this.getBase()?.abilities || {};
  }

  /** Ability modifier, floor((score − 10) / 2). A null score is a dash, not a 0. */
  getAbilityMod(key) {
    const score = Number(this.getAbilities()[key]);
    if (!Number.isFinite(score)) return null;
    return Math.floor((score - 10) / 2);
  }

  getHitDiceLine() { return this.getBase()?.hitDice?.raw || ''; }
  getSizeAndType() {
    const base = this.getBase();
    if (!base) return '';
    const subtypes = Array.isArray(base.subtypes) && base.subtypes.length
      ? ` (${base.subtypes.join(', ')})`
      : '';
    return `${base.size || ''} ${base.type || ''}${subtypes}`.trim();
  }

  getSpaceReach() { return this.getBase()?.spaceReach?.raw || ''; }
  getBaseAttackGrapple() { return this.getBase()?.baseAttackGrapple?.raw || ''; }
  getSpecialAttacks() { return this.getBase()?.specialAttacks || []; }
  getSpecialQualities() { return this.getBase()?.specialQualities || []; }
  getFeats() { return this.getBase()?.feats || []; }
  getSkills() { return this.getBase()?.skills || []; }
  getEnvironment() { return this.getBase()?.environment || ''; }
  getOrganization() { return this.getBase()?.organization || ''; }
  getAlignment() { return this.getBase()?.alignment || ''; }
  getTreasure() { return this.getBase()?.treasure || ''; }
  getChallengeRating() { return this.getBase()?.challengeRating?.text || ''; }
  getCombatHtml() { return this.getBase()?.combat || ''; }
  getDescriptionHtml() { return this.getBase()?.description || ''; }

  /**
   * The attack lines, parsed into `{ name, count, bonus, damage }` rows so the
   * sheet can lay them out like the player's attacks card rather than printing
   * one dense string. Falls back to the single-attack line when there is no
   * full-attack routine.
   */
  getAttacks() {
    const base = this.getBase();
    if (!base) return [];
    const source = base.fullAttack && base.fullAttack !== '-' ? base.fullAttack : base.attack;
    if (!source) return [];
    return parseAttacks(source).map((line, index) => ({ ...line, index }));
  }

  /** The raw attack lines, for the cases the parser cannot break down. */
  getAttackLine() {
    const base = this.getBase();
    if (!base) return '';
    return base.fullAttack && base.fullAttack !== '-' ? base.fullAttack : (base.attack || '');
  }

  // —— Persistence ——

  /**
   * Compact tuple: `[ref, damage, maxLife, ...bonuses]`. maxLife is 0 when
   * unset, since a real override is always at least 1.
   */
  serialize() {
    return [
      this.ref,
      this.getDamage(),
      this.maxLife == null ? 0 : this.getMaxLife(),
      ...BONUS_KEYS.map((key) => this.getBonus(key)),
    ];
  }

  static load(tuple) {
    if (!Array.isArray(tuple) || tuple.length < 1) return null;
    const ref = String(tuple[0] || '').trim();
    if (!ref) return null;
    const sheet = new MonsterSheet(ref);
    if (!sheet.isValid()) return null;
    sheet.damage = Math.max(0, Math.floor(Number(tuple[1]) || 0));
    const maxLife = Math.floor(Number(tuple[2]) || 0);
    sheet.maxLife = maxLife > 0 ? maxLife : null;
    BONUS_KEYS.forEach((key, i) => sheet.setBonus(key, tuple[3 + i]));
    return sheet;
  }

  /** A copy, so reducers never mutate the instance already in the store. */
  clone() {
    return MonsterSheet.load(this.serialize());
  }
}
