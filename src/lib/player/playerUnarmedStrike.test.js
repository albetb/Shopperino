import Player from './player';

function monk(level = 6) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Monk');
  p.setLevel(level);
  return p;
}

const equip = (p, slot, link, extra = {}) =>
  p.equipItem(slot, { link, name: link.split('/').pop(), ...extra });

describe('unarmed strike availability', () => {
  test('empty hands qualify', () => {
    expect(monk().canUseUnarmedStrike()).toBe(true);
  });

  test('a set of monk weapons qualifies', () => {
    const p = monk();
    equip(p, 'lh1', 'items/Weapon/kama');
    equip(p, 'rh1', 'items/Weapon/sai');
    expect(p.canUseUnarmedStrike()).toBe(true);
  });

  test('one monk weapon and one free hand qualifies', () => {
    const p = monk();
    equip(p, 'rh1', 'items/Weapon/nunchaku');
    expect(p.canUseUnarmedStrike()).toBe(true);
  });

  test('a non-monk weapon disqualifies the whole set, free hand or not', () => {
    const p = monk();
    equip(p, 'rh1', 'items/Weapon/longsword');
    expect(p.canUseUnarmedStrike()).toBe(false);
  });

  test('an unused second set does not rescue a disqualified first one', () => {
    // An empty second row is the default for almost every character. Treating
    // it as a qualifying set would make the punch line show for every monk
    // regardless of what they are actually holding.
    const p = monk();
    equip(p, 'lh1', 'items/Weapon/longsword');
    expect(p.canUseUnarmedStrike()).toBe(false);
  });

  test('a monk-weapon second set qualifies while the first does not', () => {
    // Switching weapon sets is a free action, so a genuinely equipped monk
    // set in the second row is available.
    const p = monk();
    equip(p, 'lh1', 'items/Weapon/longsword');
    equip(p, 'rh2', 'items/Weapon/kama');
    expect(p.canUseUnarmedStrike()).toBe(true);
  });

  test('a quarterstaff qualifies only in a two-handed grip', () => {
    const oneHanded = monk();
    equip(oneHanded, 'rh1', 'items/Weapon/quarterstaff');
    expect(oneHanded.canUseUnarmedStrike()).toBe(false);

    const twoHanded = monk();
    equip(twoHanded, 'rh1', 'items/Weapon/quarterstaff', { twoHanded: true });
    expect(twoHanded.canUseUnarmedStrike()).toBe(true);
  });

  test('a class without monk weapons never qualifies', () => {
    // For everyone else the punch is simply the fallback when nothing is
    // equipped, which the attacks card decides on its own.
    const p = new Player();
    p.setRace('Human');
    p.setClass('Fighter');
    p.setLevel(20);
    expect(p.canUseUnarmedStrike()).toBe(false);
  });
});
