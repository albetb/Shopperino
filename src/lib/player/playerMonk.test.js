import Player from './player';

function monk(level, wis = 10) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Monk');
  p.setLevel(level);
  p.setAbilityBase('wis', wis);
  return p;
}

function other(cls, level, wis = 18) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.setAbilityBase('wis', wis);
  return p;
}

describe('stunning fist', () => {
  test('attempts per day equal the monk level', () => {
    expect(monk(1).getStunningFistMax()).toBe(1);
    expect(monk(4).getStunningFistMax()).toBe(4);
    expect(monk(7).getStunningFistMax()).toBe(7);
    expect(monk(11).getStunningFistMax()).toBe(11);
    expect(monk(20).getStunningFistMax()).toBe(20);
  });

  test('the save DC is 10 + half monk level + Wisdom modifier', () => {
    expect(monk(1, 14).getStunningFistDc()).toBe(12);   // 10 + 0 + 2
    expect(monk(4, 14).getStunningFistDc()).toBe(14);   // 10 + 2 + 2
    expect(monk(11, 16).getStunningFistDc()).toBe(18);  // 10 + 5 + 3
    expect(monk(20, 20).getStunningFistDc()).toBe(25);  // 10 + 10 + 5
  });

  test('a poor Wisdom lowers the DC', () => {
    expect(monk(20, 8).getStunningFistDc()).toBe(19);   // 10 + 10 - 1
  });

  test('no other class gets it from the class', () => {
    expect(other('Fighter', 20).getStunningFistMax()).toBe(0);
    expect(other('Fighter', 20).getStunningFistDc()).toBe(0);
  });
});

describe('ki strike', () => {
  test('bypasses magic at 4th, lawful at 10th and adamantine at 16th', () => {
    expect(monk(1).getKiStrikeTier()).toBe(null);
    expect(monk(4).getKiStrikeTier()).toBe('magic');
    expect(monk(7).getKiStrikeTier()).toBe('magic');
    expect(monk(11).getKiStrikeTier()).toBe('lawful');
    expect(monk(20).getKiStrikeTier()).toBe('adamantine');
  });

  test('no other class has it', () => {
    expect(other('Fighter', 20).getKiStrikeTier()).toBe(null);
  });
});

describe('wholeness of body', () => {
  test('the pool is 2 x monk level, from 7th level', () => {
    expect(monk(1).getWholenessOfBodyMax()).toBe(0);
    expect(monk(4).getWholenessOfBodyMax()).toBe(0);
    expect(monk(7).getWholenessOfBodyMax()).toBe(14);
    expect(monk(11).getWholenessOfBodyMax()).toBe(22);
    expect(monk(20).getWholenessOfBodyMax()).toBe(40);
  });

  test('spending draws down the pool and reports what is left', () => {
    const p = monk(11);
    expect(p.getWholenessOfBodyRemaining()).toBe(22);
    p.useClassFeature('wholenessOfBody', 9);
    expect(p.getWholenessOfBodyRemaining()).toBe(13);
    p.useClassFeature('wholenessOfBody', -4);
    expect(p.getWholenessOfBodyRemaining()).toBe(17);
  });

  test('overspending is recorded but never reported as a negative pool', () => {
    const p = monk(7);
    p.useClassFeature('wholenessOfBody', 50);
    expect(p.getClassFeatureUsed('wholenessOfBody')).toBe(50);
    expect(p.getWholenessOfBodyRemaining()).toBe(0);
  });

  test('no other class has a pool', () => {
    expect(other('Cleric', 20).getWholenessOfBodyMax()).toBe(0);
    expect(other('Cleric', 20).getWholenessOfBodyRemaining()).toBe(0);
  });
});

describe('slow fall', () => {
  test('starts at 20 ft at 4th level and grows every two levels', () => {
    expect(monk(1).getSlowFallDistance()).toBe(0);
    expect(monk(4).getSlowFallDistance()).toBe(20);
    expect(monk(7).getSlowFallDistance()).toBe(30);
    expect(monk(11).getSlowFallDistance()).toBe(50);
    expect(monk(18).getSlowFallDistance()).toBe(90);
  });

  test('at 20th the fall is ignored from any height', () => {
    expect(monk(20).getSlowFallDistance()).toBe(Infinity);
  });

  test('no other class has it', () => {
    expect(other('Rogue', 20).getSlowFallDistance()).toBe(0);
  });
});

describe('flurry of blows', () => {
  test('one extra attack at -2, easing to -1 at 5th and to none at 9th', () => {
    expect(monk(1).getFlurryOfBlows()).toEqual({ extraAttacks: 1, penalty: -2 });
    expect(monk(4).getFlurryOfBlows()).toEqual({ extraAttacks: 1, penalty: -2 });
    expect(monk(5).getFlurryOfBlows()).toEqual({ extraAttacks: 1, penalty: -1 });
    expect(monk(7).getFlurryOfBlows()).toEqual({ extraAttacks: 1, penalty: -1 });
    expect(monk(9).getFlurryOfBlows()).toEqual({ extraAttacks: 1, penalty: 0 });
  });

  test('a second extra attack arrives at 11th level', () => {
    expect(monk(11).getFlurryOfBlows()).toEqual({ extraAttacks: 2, penalty: 0 });
    expect(monk(20).getFlurryOfBlows()).toEqual({ extraAttacks: 2, penalty: 0 });
  });

  test('no other class has flurry', () => {
    expect(other('Fighter', 20).getFlurryOfBlows()).toEqual({ extraAttacks: 0, penalty: 0 });
    expect(other('Fighter', 20).hasFlurryOfBlows()).toBe(false);
    expect(monk(1).hasFlurryOfBlows()).toBe(true);
  });

  test('monk weapons qualify for the flurry, other weapons do not', () => {
    const p = monk(5);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Kama' } })).toBe(true);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Nunchaku' } })).toBe(true);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Sai' } })).toBe(true);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Siangham' } })).toBe(true);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Longsword' } })).toBe(false);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Greataxe' } })).toBe(false);
  });

  test('shuriken qualify despite shipping as a bundle name', () => {
    expect(monk(5).isFlurryWeapon({ weaponItem: { Name: 'Shuriken (5)' } })).toBe(true);
  });

  test('a quarterstaff only qualifies in a two-handed grip', () => {
    const p = monk(5);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Quarterstaff' }, isTwoHanded: true })).toBe(true);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Quarterstaff' }, isTwoHanded: false })).toBe(false);
    expect(p.isFlurryWeapon({ weaponItem: { Name: 'Quarterstaff' } })).toBe(false);
  });

  test('a non-monk cannot flurry even with a kama', () => {
    expect(other('Fighter', 20).isFlurryWeapon({ weaponItem: { Name: 'Kama' } })).toBe(false);
  });

  test('missing or malformed weapon data is handled without throwing', () => {
    const p = monk(5);
    expect(p.isFlurryWeapon(undefined)).toBe(false);
    expect(p.isFlurryWeapon({})).toBe(false);
    expect(p.isFlurryWeapon({ weaponItem: {} })).toBe(false);
  });
});

describe('monk AC bonus', () => {
  test('adds Wisdom plus a level milestone while unarmored', () => {
    expect(monk(1, 16).getMonkAcBonus()).toBe(3);       // +3 Wis, no milestone
    expect(monk(4, 16).getMonkAcBonus()).toBe(3);
    expect(monk(7, 16).getMonkAcBonus()).toBe(4);       // +1 from 5th
    expect(monk(11, 16).getMonkAcBonus()).toBe(5);      // +2 from 10th
    expect(monk(20, 16).getMonkAcBonus()).toBe(7);      // +4 from 20th
  });

  test('wearing armor or a shield removes it entirely', () => {
    const armored = monk(11, 16);
    armored.equipItem('armor', { link: 'items/Armor/leather' });
    expect(armored.getMonkAcBonus()).toBe(0);

    const shielded = monk(11, 16);
    shielded.equipItem('lh1', { link: 'items/Shield/shield-heavy-steel' });
    expect(shielded.getMonkAcBonus()).toBe(0);
  });

  test('a medium or heavier load removes it', () => {
    const p = monk(11, 16);
    p.addInventoryItem('Full plate', 'Armor', 1, 'items/Armor/full-plate'); // 22.5 kg
    expect(p.getLoadStatus()).toBe('medium');
    expect(p.getMonkAcBonus()).toBe(0);
  });

  test('a negative Wisdom modifier never lowers AC', () => {
    // The milestone still applies; only the ability part floors at zero.
    expect(monk(11, 6).getMonkAcBonus()).toBe(2);
  });

  test('the bonus reaches all three AC values', () => {
    const p = monk(11, 16);
    const bare = other('Fighter', 11, 16);
    expect(p.getArmorClass() - bare.getArmorClass()).toBe(5);
    expect(p.getContactAC() - bare.getContactAC()).toBe(5);
    expect(p.getFlatFootedAC() - bare.getFlatFootedAC()).toBe(5);
  });

  test('no other class gets it however high their Wisdom', () => {
    expect(other('Cleric', 20, 20).getMonkAcBonus()).toBe(0);
  });
});

describe('monk fast movement', () => {
  test('scales with level while unarmored and unencumbered', () => {
    expect(monk(1).getBaseSpeed()).toBe(30);
    expect(monk(3).getBaseSpeed()).toBe(40);
    expect(monk(11).getBaseSpeed()).toBe(60);   // +30 from 9th
    expect(monk(20).getBaseSpeed()).toBe(90);   // +60 from 18th
  });

  test('any armor at all removes it, light included', () => {
    const p = monk(11);
    p.equipItem('armor', { link: 'items/Armor/leather' });
    expect(p.getBaseSpeed()).toBe(30);
  });

  test('a medium or heavier load removes it', () => {
    const p = monk(11);
    p.addInventoryItem('Full plate', 'Armor', 1, 'items/Armor/full-plate');
    expect(p.getBaseSpeed()).toBe(30);
  });
});
