import { signed } from './utils';
import Player from './player';
import { calculateWeaponAttackBonus } from './utils';
import { getItemByRef } from './item';

/* A d20 modifier always carries its sign.
 *
 * The sign belongs to the number, not to the label beside it. Hardcoding a `+`
 * in the markup and interpolating the value is correct exactly until the value
 * goes negative — an inventory row for a weapon the character is not
 * proficient with printed `+-4`.
 */

describe('signed', () => {
  test('a positive modifier keeps its plus', () => {
    expect(signed(4)).toBe('+4');
    expect(signed(1)).toBe('+1');
  });

  test('a negative one carries its own minus and gains no plus', () => {
    expect(signed(-4)).toBe('-4');
    expect(signed(-1)).toBe('-1');
  });

  test('zero reads +0 — a bonus that is nothing, not the absence of one', () => {
    expect(signed(0)).toBe('+0');
    expect(signed(-0)).toBe('+0');
  });

  test('junk is treated as zero rather than printed', () => {
    expect(signed(null)).toBe('+0');
    expect(signed(undefined)).toBe('+0');
    expect(signed(NaN)).toBe('+0');
    expect(signed('3')).toBe('+3');
  });
});

describe('the case that produced the bug', () => {
  test('a non-proficient wielder really does get a negative attack bonus', () => {
    /* The −4 non-proficiency penalty is the common way this goes below zero,
       and it is what the inventory was rendering as "+-4". */
    const p = new Player();
    p.name = 'Test';
    p.setRace('Human');
    p.setClass('Wizard');
    p.setLevel(1);
    p.setAbilityBase('str', 10);

    const weaponItem = getItemByRef('items/Weapon/greatsword')?.raw;
    expect(weaponItem).toBeTruthy();
    const bonus = calculateWeaponAttackBonus(p, { weaponItem, isTwoHanded: true, itemData: {} });

    expect(bonus).toBeLessThan(0);
    expect(signed(bonus)).toBe(String(bonus));
    expect(signed(bonus)).not.toMatch(/\+-/);
  });
});
