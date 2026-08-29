import Player from './player';

function monk(level, wis = 10) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Monk');
  p.setLevel(level);
  p.setAbilityBase('wis', wis);
  return p;
}

/** A monk who took Stunning Fist as their 1st-level bonus feat. */
function stunningMonk(level, wis = 10) {
  const p = monk(level, wis);
  p.setMonkBonusFeat(1, 'Stunning Fist');
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
    expect(stunningMonk(1).getStunningFistMax()).toBe(1);
    expect(stunningMonk(4).getStunningFistMax()).toBe(4);
    expect(stunningMonk(7).getStunningFistMax()).toBe(7);
    expect(stunningMonk(11).getStunningFistMax()).toBe(11);
    expect(stunningMonk(20).getStunningFistMax()).toBe(20);
  });

  test('the save DC is 10 + half monk level + Wisdom modifier', () => {
    expect(stunningMonk(1, 14).getStunningFistDc()).toBe(12);   // 10 + 0 + 2
    expect(stunningMonk(4, 14).getStunningFistDc()).toBe(14);   // 10 + 2 + 2
    expect(stunningMonk(11, 16).getStunningFistDc()).toBe(18);  // 10 + 5 + 3
    expect(stunningMonk(20, 20).getStunningFistDc()).toBe(25);  // 10 + 10 + 5
  });

  test('a poor Wisdom lowers the DC', () => {
    expect(stunningMonk(20, 8).getStunningFistDc()).toBe(19);   // 10 + 10 - 1
  });

  test('a monk who never took the feat has no attempts', () => {
    // Stunning Fist is one of two options at 1st level, not an automatic
    // grant — a monk who took Improved Grapple instead has none.
    expect(monk(20, 20).getStunningFistMax()).toBe(0);
    expect(monk(20, 20).getStunningFistDc()).toBe(0);

    const grappler = monk(20, 20);
    grappler.setMonkBonusFeat(1, 'Improved Grapple');
    expect(grappler.getStunningFistMax()).toBe(0);
  });

  test('taking Stunning Fist as an ordinary feat also grants the attempts', () => {
    const p = monk(6, 14);
    p.addFeat('Stunning Fist');
    expect(p.hasStunningFist()).toBe(true);
    expect(p.getStunningFistMax()).toBe(6);
  });

  test('no other class gets it from the class', () => {
    expect(other('Fighter', 20).getStunningFistMax()).toBe(0);
    expect(other('Fighter', 20).getStunningFistDc()).toBe(0);
  });

  /* It is a general feat, not a monk feature. Anyone may spend a feat on it
     and gets the feat's own smaller allowance: one attempt per four levels. */
  test('a non-monk who takes the feat gets one attempt per four levels', () => {
    const withFeat = (cls, level) => {
      const p = other(cls, level, 14);
      p.addFeat('Stunning Fist');
      return p;
    };
    expect(withFeat('Fighter', 3).getStunningFistMax()).toBe(0);
    expect(withFeat('Fighter', 4).getStunningFistMax()).toBe(1);
    expect(withFeat('Fighter', 7).getStunningFistMax()).toBe(1);
    expect(withFeat('Fighter', 8).getStunningFistMax()).toBe(2);
    expect(withFeat('Ranger', 20).getStunningFistMax()).toBe(5);
    // A monk of the same level has four times as many.
    expect(stunningMonk(20).getStunningFistMax()).toBe(20);
  });

  test('the DC is the same formula whichever granted it', () => {
    const fighter = other('Fighter', 12, 14);
    fighter.addFeat('Stunning Fist');
    expect(fighter.getStunningFistDc()).toBe(18);         // 10 + 6 + 2
    expect(stunningMonk(12, 14).getStunningFistDc()).toBe(18);
  });

  test('the DC is known before the first attempt is earned', () => {
    // Below 4th the feat grants no attempts, but the number it would use is
    // still the honest answer — the card says so rather than hiding.
    const early = other('Fighter', 2, 14);
    early.addFeat('Stunning Fist');
    expect(early.getStunningFistMax()).toBe(0);
    expect(early.getStunningFistDc()).toBe(13);           // 10 + 1 + 2
  });
});

describe('the high monk abilities', () => {
  test('abundant step arrives at 12th, once a day, at half caster level', () => {
    expect(monk(11).getAbundantStepMax()).toBe(0);
    expect(monk(12).getAbundantStepMax()).toBe(1);
    expect(monk(12).getAbundantStepCasterLevel()).toBe(6);
    expect(monk(19).getAbundantStepCasterLevel()).toBe(9);
    expect(monk(11).getAbundantStepCasterLevel()).toBe(0);
  });

  test('quivering palm arrives at 15th with its DC and its window', () => {
    expect(monk(14).getQuiveringPalmMax()).toBe(0);
    expect(monk(14, 16).getQuiveringPalmDc()).toBe(0);
    expect(monk(15).getQuiveringPalmMax()).toBe(1);
    expect(monk(15, 16).getQuiveringPalmDc()).toBe(20);   // 10 + 7 + 3
    expect(monk(20, 20).getQuiveringPalmDc()).toBe(25);   // 10 + 10 + 5
    expect(monk(15).getQuiveringPalmWindowDays()).toBe(15);
  });

  test('empty body arrives at 19th with one round per monk level', () => {
    expect(monk(18).getEmptyBodyMax()).toBe(0);
    expect(monk(19).getEmptyBodyMax()).toBe(19);
    expect(monk(20).getEmptyBodyMax()).toBe(20);
  });

  test('tongue of the sun and moon arrives at 17th and has no counter', () => {
    expect(monk(16).hasTongueOfSunAndMoon()).toBe(false);
    expect(monk(17).hasTongueOfSunAndMoon()).toBe(true);
    /* It contributes nothing to the counted three, which is why it is reported
       on the language card instead: at 17th empty body is still unearned even
       though the tongue is in hand. */
    expect(monk(17).getEmptyBodyMax()).toBe(0);
    expect(monk(17).getAbundantStepMax() + monk(17).getQuiveringPalmMax()).toBe(2);
  });

  test('the card exists from 7th, when the first counter arrives', () => {
    // Wholeness of body is the earliest thing a monk spends.
    expect(monk(6).hasMonkAbilities()).toBe(false);
    expect(monk(7).hasMonkAbilities()).toBe(true);
    expect(monk(20).hasMonkAbilities()).toBe(true);
    ['Fighter', 'Rogue', 'Druid', 'Paladin'].forEach((cls) => {
      expect(other(cls, 20).hasMonkAbilities()).toBe(false);
    });
  });

  test('the daily uses clear on a rest', () => {
    const p = monk(20);
    p.useClassFeature('abundantStep', 1);
    p.useClassFeature('emptyBody', 6);
    p.useClassFeature('wholenessOfBody', 4);
    expect(p.needsRest()).toBe(true);

    p.resetClassFeatureUses();
    expect(p.getClassFeatureUsed('abundantStep')).toBe(0);
    expect(p.getClassFeatureUsed('emptyBody')).toBe(0);
    expect(p.getClassFeatureUsed('wholenessOfBody')).toBe(0);
  });

  /* Quivering palm refreshes weekly, so a night's rest must not give it back —
     and offering the rest button for it alone would be a lie about what the
     button does. The paladin's remove disease is weekly for the same reason,
     and its card had been promising this behaviour before it was true. */
  test('a weekly counter survives the rest that clears the daily ones', () => {
    const p = monk(20);
    p.useClassFeature('quiveringPalm', 1);
    p.useClassFeature('abundantStep', 1);

    p.resetClassFeatureUses();
    expect(p.getClassFeatureUsed('quiveringPalm')).toBe(1);
    expect(p.getClassFeatureUsed('abundantStep')).toBe(0);
  });

  test('a spent weekly counter alone is not a reason to rest', () => {
    const p = monk(20);
    expect(p.needsRest()).toBe(false);
    p.useClassFeature('quiveringPalm', 1);
    expect(p.needsRest()).toBe(false);
    p.useClassFeature('abundantStep', 1);
    expect(p.needsRest()).toBe(true);
  });

  test('the same holds for the paladin remove disease its card describes', () => {
    const paladin = other('Paladin', 20, 10);
    paladin.useClassFeature('removeDisease', 1);
    paladin.useClassFeature('smiteEvil', 1);
    expect(paladin.needsRest()).toBe(true);

    paladin.resetClassFeatureUses();
    expect(paladin.getClassFeatureUsed('removeDisease')).toBe(1);
    expect(paladin.getClassFeatureUsed('smiteEvil')).toBe(0);
    expect(paladin.needsRest()).toBe(false);
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
