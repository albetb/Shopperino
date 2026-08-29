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

/*
 * Dragons carry no Attack / Full Attack text. The SRD prints their routine as
 * a damage-by-size table plus one attack bonus per age category, and the data
 * keeps exactly that shape: `attackBonus` as a number, `attackDamage` as
 * `{ bite, claws, wings, tailSlap, crush, tailSweep }` with a null wherever
 * the age category has not grown that limb yet. So the routine is rebuilt
 * here rather than left blank — it is derivable, not missing.
 *
 * The rules it applies (SRD, Dragon entry): the bite is the primary attack at
 * the full bonus and full Strength to damage; claws, wings and tail slap are
 * secondary, at −5 to hit, with half Strength on the claws and wings and one
 * and a half on the tail slap. Crush and tail sweep are deliberately absent —
 * they are resolved by a Reflex save rather than an attack roll, which is why
 * the SRD keeps them out of the attack line too.
 */
const DRAGON_ROUTINE = [
  { key: 'bite', name: 'bite', count: 1, secondary: false, strFactor: 1 },
  { key: 'claws', name: 'claws', count: 2, secondary: true, strFactor: 0.5 },
  { key: 'wings', name: 'wings', count: 2, secondary: true, strFactor: 0.5 },
  { key: 'tailSlap', name: 'tail slap', count: 1, secondary: true, strFactor: 1.5 },
];

/*
 * Crush and tail sweep land differently: no attack roll, a Reflex save
 * instead, at the same DC as the dragon's breath weapon. The data decides who
 * has them — crush appears from Huge up, tail sweep from Gargantuan — so this
 * table needs no size check of its own. Both add one and a half times
 * Strength, as the tail slap does.
 */
const DRAGON_SAVE_ATTACKS = [
  { key: 'crush', name: 'crush', strFactor: 1.5 },
  { key: 'tailSweep', name: 'tail sweep', strFactor: 1.5 },
];

/**
 * The DC a dragon's crush and tail sweep use: its breath weapon's, printed in
 * the special-attack line as "Breath weapon 12d10 (DC 26)". Matched on the
 * breath entry specifically — frightful presence carries its own, different DC.
 */
function breathSaveDc(base) {
  const entry = (base?.specialAttacks || []).find((a) => /breath weapon/i.test(String(a)));
  const dc = String(entry || '').match(/DC\s*(\d+)/i);
  return dc ? Number(dc[1]) : null;
}

/** "2d8" + a modifier of 11 -> "2d8+11"; a modifier of 0 adds nothing. */
function withDamageMod(dice, mod) {
  if (!dice) return '';
  if (mod > 0) return `${dice}+${mod}`;
  if (mod < 0) return `${dice}${mod}`;
  return dice;
}

/** The attack rows a dragon's structured fields imply, in SRD order. */
function dragonAttacks(base, strMod) {
  const damage = base?.attackDamage;
  const bonus = base?.attackBonus;
  if (!damage || typeof bonus !== 'number') return [];
  const melee = DRAGON_ROUTINE
    .filter((limb) => damage[limb.key])
    .map((limb) => ({
      name: limb.name,
      count: limb.count,
      bonus: limb.secondary ? bonus - 5 : bonus,
      damage: withDamageMod(damage[limb.key], Math.floor(strMod * limb.strFactor)),
      type: limb.secondary ? 'secondary' : 'primary',
    }));

  const dc = breathSaveDc(base);
  const saves = DRAGON_SAVE_ATTACKS
    .filter((limb) => damage[limb.key])
    .map((limb) => ({
      name: limb.name,
      count: 1,
      bonus: null,
      damage: withDamageMod(damage[limb.key], Math.floor(strMod * limb.strFactor)),
      type: 'save',
      save: { ability: 'Reflex', dc },
    }));

  return [...melee, ...saves];
}

/** The stats a master can nudge, in the order the sheet lays them out. */
export const BONUS_KEYS = ['ac', 'initiative', 'speed', 'fort', 'reflex', 'will'];

/**
 * How many of one creature a single roster entry may hold.
 *
 * Far past any real encounter — a mob of twenty goblins is already more than a
 * table wants to track individually — and it exists to bound the saved blob
 * rather than to referee the fight. Going over is flagged, never blocked, per
 * the project's compute-but-do-not-enforce rule.
 */
export const MAX_INDIVIDUALS = 20;

export default class MonsterSheet {
  constructor(ref = '') {
    this.ref = ref;
    /* Damage taken per individual, not current HP — the same shape the Player
       model uses, so a change to max HP does not silently heal or hurt anyone.
     *
     * One entry per creature of this kind in the fight. Everything else on
     * this object is *shared*: eight goblins are eight numbers in this array
     * and one stat block, one max-HP override and one set of bonuses. That is
     * the whole point of the roster — a master who rules "these goblins are
     * all +2 AC" says it once. */
    this.damages = [0];
    /* Overrides the stat block's rolled hit points when set. Null means "use
       the average printed in the block". Shared by every individual. */
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

  // —— Individuals ——
  //
  // A roster entry is one *kind* of creature and however many of it are in the
  // fight. Everything below is indexed by individual; everything above is
  // shared. An index that names nobody is treated as the first, so a caller
  // that has not caught up with a deletion gets a wrong answer rather than a
  // crash.

  /** How many of this creature are in the fight. */
  getCount() {
    return Array.isArray(this.damages) ? this.damages.length : 0;
  }

  /** Clamp an index onto the individuals that exist. */
  _at(index) {
    const count = this.getCount();
    if (count === 0) return 0;
    const i = Math.floor(Number(index) || 0);
    return Math.max(0, Math.min(count - 1, i));
  }

  getDamage(index = 0) {
    return Math.max(0, Math.floor(Number(this.damages?.[this._at(index)]) || 0));
  }

  getCurrentHp(index = 0) {
    return this.getMaxLife() - this.getDamage(index);
  }

  /** True once an individual is at or below 0 — it stays on the card either way. */
  isDead(index = 0) {
    return this.getCurrentHp(index) <= 0;
  }

  /**
   * Heal (positive) or hurt (negative) one individual. Clamped between full
   * health and −10, the point at which a creature is dead — the same bounds
   * the player sheet uses, so the two HP controls behave identically.
   */
  adjustHp(delta, index = 0) {
    if (this.getCount() === 0) return;
    const at = this._at(index);
    const max = this.getMaxLife();
    const next = this.getDamage(at) - Math.floor(Number(delta) || 0);
    this.damages[at] = Math.max(0, Math.min(max + 10, next));
  }

  /** One individual back to full. */
  resetHp(index = 0) {
    if (this.getCount() === 0) return;
    this.damages[this._at(index)] = 0;
  }

  /** Every individual back to full, for reusing the entry on the next fight. */
  resetAllHp() {
    this.damages = this.damages.map(() => 0);
  }

  /**
   * Another one of this creature, at full health.
   *
   * Refuses past `MAX_INDIVIDUALS` and says so by returning false, so the
   * caller can flag the ceiling rather than silently doing nothing.
   */
  addIndividual() {
    if (!Array.isArray(this.damages)) this.damages = [];
    if (this.damages.length >= MAX_INDIVIDUALS) return false;
    this.damages.push(0);
    return true;
  }

  /**
   * Remove one individual. The entry may be left empty — the roster drops an
   * entry whose last individual has gone, which is what deleting the last
   * health bar is meant to do.
   */
  removeIndividual(index) {
    if (this.getCount() === 0) return false;
    this.damages.splice(this._at(index), 1);
    return true;
  }

  /**
   * The individuals as rows ready to draw: current and maximum hit points, the
   * bar ratio, and whether this one is down.
   *
   * The two-mode ratio matches the player sheet — a normal bar above 0, and a
   * "dying" bar counting the ten points from 0 to −10 — so a master reads a
   * monster's health the same way they read a character's.
   */
  getIndividuals() {
    const max = this.getMaxLife();
    return (this.damages || []).map((_, index) => {
      const currentHp = this.getCurrentHp(index);
      const dying = currentHp <= 0;
      return {
        index,
        damage: this.getDamage(index),
        currentHp,
        maxHp: max,
        isDying: dying,
        ratio: dying
          ? Math.max(0, Math.min(1, (currentHp + 10) / 10))
          : (max > 0 ? Math.max(0, Math.min(1, currentHp / max)) : 0),
      };
    });
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
    if ((this.damages || []).some((d) => (Number(d) || 0) !== 0)) return true;
    if (this.getCount() > 1) return true;
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
    const source = this.getAttackLine();
    const lines = source
      ? parseAttacks(source)
      : dragonAttacks(base, this.getAbilityMod('str') ?? 0);
    return lines.map((line, index) => ({ ...line, index }));
  }

  /**
   * The raw attack line, for the cases the parser cannot break down. A bare
   * "-" is the SRD's way of writing "this creature has no attacks" — the
   * Formian Queen, a shrieker, a bat — so it reads as absent, not as text.
   */
  getAttackLine() {
    const base = this.getBase();
    if (!base) return '';
    const line = base.fullAttack && base.fullAttack !== '-' ? base.fullAttack : (base.attack || '');
    return String(line).trim() === '-' ? '' : line;
  }

  // —— Persistence ——

  /**
   * Compact tuple: `[ref, maxLife, ...bonuses, ...damages]`.
   *
   * The damages go **last** because they are the one variable-length part —
   * everything before them sits at a fixed index, so reading the tuple needs
   * no length arithmetic. maxLife is 0 when unset, since a real override is
   * always at least 1.
   */
  serialize() {
    return [
      this.ref,
      this.maxLife == null ? 0 : this.getMaxLife(),
      ...BONUS_KEYS.map((key) => this.getBonus(key)),
      ...(this.damages || []).map((_, i) => this.getDamage(i)),
    ];
  }

  static load(tuple) {
    if (!Array.isArray(tuple) || tuple.length < 1) return null;
    const ref = String(tuple[0] || '').trim();
    if (!ref) return null;
    const sheet = new MonsterSheet(ref);
    if (!sheet.isValid()) return null;
    const maxLife = Math.floor(Number(tuple[1]) || 0);
    sheet.maxLife = maxLife > 0 ? maxLife : null;
    BONUS_KEYS.forEach((key, i) => sheet.setBonus(key, tuple[2 + i]));
    const damages = tuple.slice(2 + BONUS_KEYS.length)
      .map((d) => Math.max(0, Math.floor(Number(d) || 0)));
    /* An entry with no individuals cannot exist — the roster drops it — so a
       tuple that somehow carries none is read as a single healthy creature. */
    sheet.damages = damages.length > 0 ? damages : [0];
    return sheet;
  }

  /** A copy, so reducers never mutate the instance already in the store. */
  clone() {
    return MonsterSheet.load(this.serialize());
  }
}
