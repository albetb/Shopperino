import Player from './player';

function paladin(level, cha = 10) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Paladin');
  p.setLevel(level);
  p.setAbilityBase('cha', cha);
  return p;
}

function other(cls, level, cha = 18) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.setAbilityBase('cha', cha);
  return p;
}

describe('smite evil', () => {
  test('one use at 1st level and another every five levels', () => {
    expect(paladin(1).getSmiteEvilMax()).toBe(1);
    expect(paladin(5).getSmiteEvilMax()).toBe(2);
    expect(paladin(6).getSmiteEvilMax()).toBe(2);
    expect(paladin(12).getSmiteEvilMax()).toBe(3);
    expect(paladin(20).getSmiteEvilMax()).toBe(5);
  });

  test('matches 1 + floor(level / 5) at every level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(paladin(lvl).getSmiteEvilMax()).toBe(1 + Math.floor(lvl / 5));
    }
  });

  test('adds Charisma to the attack and the paladin level to the damage', () => {
    const p = paladin(12, 16); // +3 Cha
    expect(p.getSmiteEvilAttackBonus()).toBe(3);
    expect(p.getSmiteEvilDamageBonus()).toBe(12);
  });

  test('no other class can smite', () => {
    expect(other('Fighter', 20).getSmiteEvilMax()).toBe(0);
    expect(other('Cleric', 20).getSmiteEvilMax()).toBe(0);
    expect(other('Fighter', 20).getSmiteEvilAttackBonus()).toBe(0);
    expect(other('Fighter', 20).getSmiteEvilDamageBonus()).toBe(0);
  });
});

describe('lay on hands', () => {
  test('the pool is level x Charisma modifier, from 2nd level', () => {
    expect(paladin(1, 16).getLayOnHandsMax()).toBe(0);
    expect(paladin(5, 16).getLayOnHandsMax()).toBe(15);  // 5 x +3
    expect(paladin(6, 16).getLayOnHandsMax()).toBe(18);
    expect(paladin(12, 18).getLayOnHandsMax()).toBe(48); // 12 x +4
  });

  test('a non-positive Charisma modifier leaves no pool at all', () => {
    expect(paladin(12, 10).getLayOnHandsMax()).toBe(0);
    expect(paladin(12, 6).getLayOnHandsMax()).toBe(0);   // -2 would be -24
  });

  test('spending takes an arbitrary amount and reports what is left', () => {
    const p = paladin(12, 18); // 48 point pool
    expect(p.getLayOnHandsRemaining()).toBe(48);

    p.useClassFeature('layOnHands', 7);
    expect(p.getLayOnHandsRemaining()).toBe(41);

    p.useClassFeature('layOnHands', 30);
    expect(p.getClassFeatureUsed('layOnHands')).toBe(37);
    expect(p.getLayOnHandsRemaining()).toBe(11);
  });

  test('giving points back returns them to the pool', () => {
    const p = paladin(12, 18);
    p.useClassFeature('layOnHands', 20);
    p.useClassFeature('layOnHands', -5);
    expect(p.getLayOnHandsRemaining()).toBe(33);
  });

  test('overspending is recorded but never reported as a negative pool', () => {
    const p = paladin(5, 16); // 15 point pool
    p.useClassFeature('layOnHands', 40);
    expect(p.getClassFeatureUsed('layOnHands')).toBe(40);
    expect(p.getLayOnHandsRemaining()).toBe(0);
  });

  test('no other class has a pool', () => {
    expect(other('Cleric', 20).getLayOnHandsMax()).toBe(0);
    expect(other('Cleric', 20).getLayOnHandsRemaining()).toBe(0);
  });
});

describe('remove disease', () => {
  test('one use a week at 6th level, another every three levels after', () => {
    expect(paladin(1).getRemoveDiseaseMax()).toBe(0);
    expect(paladin(5).getRemoveDiseaseMax()).toBe(0);
    expect(paladin(6).getRemoveDiseaseMax()).toBe(1);
    expect(paladin(12).getRemoveDiseaseMax()).toBe(3);
    expect(paladin(20).getRemoveDiseaseMax()).toBe(5);
  });

  test('holds steady between breakpoints', () => {
    expect(paladin(8).getRemoveDiseaseMax()).toBe(1);
    expect(paladin(9).getRemoveDiseaseMax()).toBe(2);
    expect(paladin(17).getRemoveDiseaseMax()).toBe(4);
    expect(paladin(18).getRemoveDiseaseMax()).toBe(5);
  });

  test('no other class has it', () => {
    expect(other('Cleric', 20).getRemoveDiseaseMax()).toBe(0);
    expect(other('Druid', 20).getRemoveDiseaseMax()).toBe(0);
  });
});
