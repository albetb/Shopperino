import Player from './player';
import { getItemByRef, calculateWeaponDamage } from '../utils';
import { sumContributions } from './contributions';

/* A weapon in each hand grants an extra attack with the off hand and costs
 * both hands a penalty. Nothing on the sheet applied that penalty before, so
 * two weapons each showed their full attack bonus and the three Two-Weapon
 * Fighting feats had nothing at all to reduce.
 *
 * The table this guards, from combat-maneuvers.md:
 *
 *   default            −6 / −10
 *   off-hand is light  −4 / −8
 *   the feat           −4 / −4
 *   both               −2 / −2
 */

function equip(player, slot, ref, extra = {}) {
  const raw = getItemByRef(ref);
  player.equipment = player.equipment || {};
  player.equipment[slot] = { link: ref, name: raw?.raw?.Name ?? ref, ...extra };
}

function fighter(level = 12, feats = []) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(level);
  p.setAbilityBase('str', 16);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

/** A longsword in the main hand and a short sword — light — in the off hand. */
function dualWielder(level = 12, feats = [], offHand = 'items/Weapon/sword-short') {
  const p = fighter(level, feats);
  equip(p, 'rh1', 'items/Weapon/longsword');
  equip(p, 'lh1', offHand);
  return p;
}

describe('when the line appears at all', () => {
  test('not with one weapon and an empty hand', () => {
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/longsword');
    expect(p.getTwoWeaponFighting()).toBe(null);
    expect(p.isFightingWithTwoWeapons()).toBe(false);
  });

  test('not with a two-handed weapon, which occupies both hands', () => {
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/greatsword', { twoHanded: true });
    equip(p, 'lh1', 'items/Weapon/sword-short');
    expect(p.getTwoWeaponFighting()).toBe(null);
  });

  test('not with a shield in the off hand', () => {
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/longsword');
    equip(p, 'lh1', 'items/Shield/shield-heavy-steel');
    expect(p.getTwoWeaponFighting()).toBe(null);
  });

  test('with a weapon in each hand, whether or not the feat was taken', () => {
    expect(dualWielder().getTwoWeaponFighting()).toBeTruthy();
    expect(dualWielder(12, ['Two-weapon fighting']).getTwoWeaponFighting()).toBeTruthy();
  });
});

describe('the penalty table', () => {
  const penalties = (p) => p.getTwoWeaponFighting().penalties;

  test('a one-handed weapon in the off hand, no feat, is the worst case', () => {
    const p = dualWielder(12, [], 'items/Weapon/longsword');
    expect(penalties(p)).toEqual({ main: -6, offHand: -10 });
  });

  test('a light off-hand weapon is two better on both', () => {
    expect(penalties(dualWielder())).toEqual({ main: -4, offHand: -8 });
  });

  test('the feat brings the off hand up to match the main one', () => {
    const p = dualWielder(12, ['Two-weapon fighting'], 'items/Weapon/longsword');
    expect(penalties(p)).toEqual({ main: -4, offHand: -4 });
  });

  test('a light weapon and the feat together are the best case', () => {
    const p = dualWielder(12, ['Two-weapon fighting']);
    expect(penalties(p)).toEqual({ main: -2, offHand: -2 });
    expect(p.getTwoWeaponFighting().hasFeat).toBe(true);
    expect(p.getTwoWeaponFighting().offHandIsLight).toBe(true);
  });

  test('the penalty is really applied, not only reported', () => {
    const solo = fighter();
    equip(solo, 'rh1', 'items/Weapon/longsword');
    const alone = solo.getWeaponAttackContributions(solo.getHandWeapon('rh1'));

    const pair = dualWielder();
    expect(pair.getTwoWeaponFighting().main.attack)
      .toBe(sumContributions(alone) - 4);
  });
});

describe('the extra off-hand attacks', () => {
  const offAttacks = (p) => p.getTwoWeaponFighting().offHand.attacks;

  test('one, for a character with no follow-up feat', () => {
    expect(offAttacks(dualWielder())).toHaveLength(1);
  });

  test('two with Improved, and each five worse than the last', () => {
    const attacks = offAttacks(dualWielder(12, ['Two-weapon fighting', 'Improved two-weapon fighting']));
    expect(attacks).toHaveLength(2);
    expect(attacks[1]).toBe(attacks[0] - 5);
  });

  test('three with Greater as well', () => {
    const attacks = offAttacks(dualWielder(20, [
      'Two-weapon fighting', 'Improved two-weapon fighting', 'Greater two-weapon fighting',
    ]));
    expect(attacks).toHaveLength(3);
    expect(attacks[2]).toBe(attacks[0] - 10);
  });
});

describe('the off hand adds only half its Strength to damage', () => {
  test('half, rounded down', () => {
    const p = dualWielder();
    expect(p.getStrMod()).toBe(3);
    const off = { ...p.getHandWeapon('lh1'), isOffHand: true };
    // +3 in the main hand, +1 in the off hand.
    expect(calculateWeaponDamage(p, p.getHandWeapon('rh1'))).toContain('+3');
    expect(calculateWeaponDamage(p, off)).toContain('+1');
    expect(p.getTwoWeaponFighting().offHand.damage).toContain('+1');
  });

  test('a Strength penalty is never halved', () => {
    const p = dualWielder();
    p.setAbilityBase('str', 6);
    expect(p.getStrMod()).toBe(-2);
    const off = { ...p.getHandWeapon('lh1'), isOffHand: true };
    expect(calculateWeaponDamage(p, off)).toContain('-2');
  });

  test('the breakdown says which hand it is talking about', () => {
    const p = dualWielder();
    const off = { ...p.getHandWeapon('lh1'), isOffHand: true };
    const row = p.getWeaponDamageContributions(off).find((r) => r.source === 'ability');
    expect(row.label).toBe('Strength (off-hand)');
    expect(row.value).toBe(1);
    // The main hand is unchanged by any of this.
    const mainRow = p.getWeaponDamageContributions(p.getHandWeapon('rh1'))
      .find((r) => r.source === 'ability');
    expect(mainRow.label).toBe('Strength');
    expect(mainRow.value).toBe(3);
  });
});

describe("a ranger's combat style counts as holding the feat", () => {
  function ranger(level, style = 'Two-Weapon Fighting') {
    const p = new Player();
    p.setRace('Human');
    p.setClass('Ranger');
    p.setLevel(level);
    p.setAbilityBase('str', 16);
    p.setCombatStyle(style);
    equip(p, 'rh1', 'items/Weapon/longsword');
    equip(p, 'lh1', 'items/Weapon/sword-short');
    return p;
  }

  test('the style feat is never in getFeats(), and still counts', () => {
    const r = ranger(6);
    expect(r.getFeats()).not.toContain('Two-Weapon Fighting');
    expect(r.hasFeatNamed('Two-weapon fighting')).toBe(true);
    expect(r.getTwoWeaponFighting().penalties).toEqual({ main: -2, offHand: -2 });
  });

  test('Improved arrives at 6th and adds the second off-hand attack', () => {
    expect(ranger(5).getTwoWeaponFighting().offHand.attacks).toHaveLength(1);
    expect(ranger(6).getTwoWeaponFighting().offHand.attacks).toHaveLength(2);
    expect(ranger(11).getTwoWeaponFighting().offHand.attacks).toHaveLength(3);
  });

  test('the archery style grants none of it', () => {
    const r = ranger(11, 'Archery');
    expect(r.hasFeatNamed('Two-weapon fighting')).toBe(false);
    expect(r.getTwoWeaponFighting().penalties).toEqual({ main: -4, offHand: -8 });
    // The archery path grants Improved precise shot instead, which the
    // situational notes must also be able to see.
    expect(r.hasFeatNamed('Improved precise shot')).toBe(true);
    expect(r.getSituationalContributions('attack').map((n) => n.label))
      .toContain('Improved precise shot');
  });

  test('medium armor suppresses the style, and the penalties get worse', () => {
    const r = ranger(6);
    r.equipment.armor = { link: 'items/Armor/breastplate', name: 'Breastplate' };
    expect(r.isCombatStyleSuppressed()).toBe(true);
    expect(r.hasFeatNamed('Two-weapon fighting')).toBe(false);
    expect(r.getTwoWeaponFighting().penalties).toEqual({ main: -4, offHand: -8 });
  });
});
