import Player from './player';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../utils';
import { sumContributions } from './contributions';

/**
 * A song somebody else is singing at you reaches the weapon rows.
 *
 * The breakdown box and the number beside it are computed by two different
 * pieces of code — `getWeaponAttackContributions` on the model, and
 * `calculateWeaponAttackBonus` in lib/utils, which is what the card actually
 * prints. When the shared-effect rail was added the first learned about it and
 * the second did not, so an accepted inspire courage showed up in the
 * explanation of a number it had not changed. These tests hold the two
 * together: the rows must add up to the printed total, not merely contain the
 * right entry.
 */

const weapon = (ref, extra = {}) => ({ weaponItem: getItemByRef(ref)?.raw, ...extra });
const longsword = () => weapon('items/Weapon/longsword');

function fighter() {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(6);
  p.setAbilityBase('str', 14);
  p.setAbilityBase('dex', 12);
  return p;
}

/* +2 at 8th level and above; the bard's level is what sized it, and it travels
   already sized so both sheets agree on it. */
const courage = { id: 'inspireCourage', bonus: 2, from: 'Lyra' };

describe('inspire courage on an equipped weapon', () => {
  test('moves the attack number, not only its explanation', () => {
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, longsword());
    p.addSharedEffect(courage);
    expect(calculateWeaponAttackBonus(p, longsword())).toBe(before + 2);
  });

  test('moves the damage string too', () => {
    const p = fighter();
    const before = calculateWeaponDamage(p, longsword());
    p.addSharedEffect(courage);
    expect(calculateWeaponDamage(p, longsword())).not.toBe(before);
  });

  test('the breakdown adds up to the number the card prints', () => {
    const p = fighter();
    p.addSharedEffect(courage);
    const total = calculateWeaponAttackBonus(p, longsword());
    expect(sumContributions(p.getWeaponAttackContributions(longsword()))).toBe(total);
  });

  test('and ending it puts both back', () => {
    const p = fighter();
    const attack = calculateWeaponAttackBonus(p, longsword());
    const damage = calculateWeaponDamage(p, longsword());
    p.addSharedEffect(courage);
    p.removeSharedEffect(0);
    expect(calculateWeaponAttackBonus(p, longsword())).toBe(attack);
    expect(calculateWeaponDamage(p, longsword())).toBe(damage);
  });
});

describe('an effect that says nothing about weapons', () => {
  test('leaves the attack alone', () => {
    /* Inspire heroism is saves and a dodge bonus to AC — nothing on the
       attack roll, so the weapon row must not move. */
    const p = fighter();
    const before = calculateWeaponAttackBonus(p, longsword());
    p.addSharedEffect({ id: 'inspireHeroism', from: 'Lyra' });
    expect(calculateWeaponAttackBonus(p, longsword())).toBe(before);
  });
});
