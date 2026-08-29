import Player from './player';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../utils';
import { sumContributions } from './contributions';

/* Power Attack and Combat Expertise are not bonuses the sheet can work out:
 * each is a number the player declares at the start of a round. Once declared
 * they are contributions like any other, because the attack and damage on the
 * card should be the numbers actually being rolled.
 *
 * Three rules are easy to get wrong and are what these tests exist for: Power
 * Attack caps at the base attack bonus and not at 5, two hands double the
 * damage but not the penalty, and a light weapon takes the penalty for nothing
 * at all.
 */

const weapon = (ref, extra = {}) => ({ weaponItem: getItemByRef(ref)?.raw, ...extra });
const longsword = () => weapon('items/Weapon/longsword');
const greatsword = () => weapon('items/Weapon/greatsword', { isTwoHanded: true });
const dagger = () => weapon('items/Weapon/dagger');
const shortbow = () => weapon('items/Weapon/shortbow');

function fighter(level = 12, feats = ['Power attack', 'Combat expertise']) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(level);
  p.setAbilityBase('str', 14);
  p.setAbilityBase('dex', 12);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

describe('the caps', () => {
  test('Power Attack stops at the base attack bonus, not at 5', () => {
    const p = fighter(12);
    expect(p.getBaseAttackBonus()).toBe(12);
    expect(p.getPowerAttackMax()).toBe(12);
  });

  test('Combat Expertise stops at 5 however high the attack bonus goes', () => {
    expect(fighter(12).getCombatExpertiseMax()).toBe(5);
  });

  test('and at the base attack bonus when that is lower than 5', () => {
    const low = fighter(3);
    expect(low.getBaseAttackBonus()).toBe(3);
    expect(low.getCombatExpertiseMax()).toBe(3);
    expect(low.getPowerAttackMax()).toBe(3);
  });

  test('going over is accepted and flagged, never blocked', () => {
    const p = fighter(3);
    p.setPowerAttack(9);
    p.setCombatExpertise(9);
    expect(p.getPowerAttack()).toBe(9);
    expect(p.isPowerAttackOverCap()).toBe(true);
    expect(p.isCombatExpertiseOverCap()).toBe(true);
    p.setPowerAttack(3);
    expect(p.isPowerAttackOverCap()).toBe(false);
  });

  test('a negative or fractional value is not a thing you can declare', () => {
    const p = fighter();
    p.setPowerAttack(-4);
    expect(p.getPowerAttack()).toBe(0);
    p.setPowerAttack(2.7);
    expect(p.getPowerAttack()).toBe(2);
  });
});

describe('without the feat there is no trade', () => {
  test('a stored value does nothing for a character who never took it', () => {
    const p = fighter(12, []);
    p.setPowerAttack(5);
    p.setCombatExpertise(5);
    expect(p.getPowerAttack()).toBe(0);
    expect(p.getCombatExpertise()).toBe(0);
    expect(p.getStanceAttackPenalty(longsword().weaponItem)).toBe(0);
  });

  test('and taking the feat later turns the stored value back on', () => {
    const p = fighter(12, []);
    p.setPowerAttack(4);
    expect(p.getPowerAttack()).toBe(0);
    p.addFeat('Power attack');
    expect(p.getPowerAttack()).toBe(4);
  });
});

describe('what the trade costs and buys', () => {
  test('a one-handed weapon trades one for one', () => {
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, longsword());
    const dmgBefore = calculateWeaponDamage(p, longsword());
    p.setPowerAttack(4);
    expect(calculateWeaponAttackBonus(p, longsword())).toBe(before - 4);
    expect(p.getPowerAttackDamageBonus(longsword())).toBe(4);
    expect(calculateWeaponDamage(p, longsword())).not.toBe(dmgBefore);
  });

  test('two hands double the damage while the penalty stays the same', () => {
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, greatsword());
    p.setPowerAttack(4);
    expect(calculateWeaponAttackBonus(p, greatsword())).toBe(before - 4);
    expect(p.getPowerAttackDamageBonus(greatsword())).toBe(8);
  });

  test('a one-handed weapon held in two hands doubles it too', () => {
    const p = fighter();
    p.setPowerAttack(3);
    expect(p.getPowerAttackDamageBonus(longsword())).toBe(3);
    expect(p.getPowerAttackDamageBonus(weapon('items/Weapon/longsword', { isTwoHanded: true }))).toBe(6);
  });

  test('a light weapon takes the penalty and gains nothing, which is the trap', () => {
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, dagger());
    p.setPowerAttack(3);
    expect(calculateWeaponAttackBonus(p, dagger())).toBe(before - 3);
    expect(p.getPowerAttackDamageBonus(dagger())).toBe(0);
    expect(p.isPowerAttackWasted(dagger())).toBe(true);
    expect(p.isPowerAttackWasted(longsword())).toBe(false);
  });

  test('an unarmed strike is the exception and does get the damage', () => {
    const p = fighter();
    const attackBefore = p.getPunchAttackBonus();
    p.setPowerAttack(2);
    expect(p.getPowerAttackDamageBonus()).toBe(2);
    expect(p.getPunchAttackBonus()).toBe(attackBefore - 2);
    expect(p.getPunchDamage()).toContain('+');
  });

  test('a ranged weapon is untouched by either feat', () => {
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, shortbow());
    p.setPowerAttack(5);
    p.setCombatExpertise(5);
    expect(calculateWeaponAttackBonus(p, shortbow())).toBe(before);
    expect(p.getPowerAttackDamageBonus(shortbow())).toBe(0);
  });

  test('both stances at once stack onto the same attack roll', () => {
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, longsword());
    p.setPowerAttack(3);
    p.setCombatExpertise(2);
    expect(calculateWeaponAttackBonus(p, longsword())).toBe(before - 5);
  });
});

describe('Combat Expertise on armor class', () => {
  test('it is a dodge bonus, so it reaches AC and touch AC', () => {
    const p = fighter();
    const ac = p.getArmorClass();
    const touch = p.getContactAC();
    const flat = p.getFlatFootedAC();
    p.setCombatExpertise(5);
    expect(p.getArmorClass()).toBe(ac + 5);
    expect(p.getContactAC()).toBe(touch + 5);
    // A dodge bonus is lost the moment you are denied your Dexterity.
    expect(p.getFlatFootedAC()).toBe(flat);
  });

  test('the row is typed as dodge and the breakdown still sums to the total', () => {
    const p = fighter();
    p.setCombatExpertise(4);
    const rows = p.getArmorClassContributions();
    const row = rows.find((r) => r.source === 'combatExpertise');
    expect(row.value).toBe(4);
    expect(row.type).toBe('dodge');
    expect(sumContributions(rows)).toBe(p.getArmorClass());
    expect(sumContributions(p.getTouchAcContributions())).toBe(p.getContactAC());
    expect(sumContributions(p.getFlatFootedAcContributions())).toBe(p.getFlatFootedAC());
  });
});

describe('the breakdown box agrees with the number beside it', () => {
  test('attack sums to what the card shows, for every kind of weapon', () => {
    const p = fighter();
    p.setPowerAttack(4);
    p.setCombatExpertise(3);
    [longsword(), greatsword(), dagger(), shortbow()].forEach((w) => {
      expect(sumContributions(p.getWeaponAttackContributions(w)))
        .toBe(calculateWeaponAttackBonus(p, w));
    });
  });

  test('the two-handed damage row says so in its label', () => {
    const p = fighter();
    p.setPowerAttack(3);
    const row = p.getWeaponDamageContributions(greatsword())
      .find((r) => r.source === 'powerAttack');
    expect(row.label).toBe('Power attack (two-handed)');
    expect(row.value).toBe(6);
  });

  test('a stance of zero adds no rows at all', () => {
    const p = fighter();
    const sources = p.getWeaponAttackContributions(longsword()).map((r) => r.source);
    expect(sources).not.toContain('powerAttack');
    expect(sources).not.toContain('combatExpertise');
  });
});

describe('it is a stance, not a resource', () => {
  test('it survives a save and a load', () => {
    const p = fighter();
    p.setPowerAttack(6);
    p.setCombatExpertise(2);
    const copy = new Player();
    copy.load(p.serialize());
    expect(copy.getPowerAttack()).toBe(6);
    expect(copy.getCombatExpertise()).toBe(2);
  });

  test('a long rest does not clear it, being per round and not per day', () => {
    const p = fighter();
    p.setPowerAttack(5);
    p.resetClassFeatureUses();
    expect(p.getPowerAttack()).toBe(5);
  });
});
