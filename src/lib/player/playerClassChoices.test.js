import Player from './player';

function make(cls, level, race = 'Human') {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

describe('monk bonus feats', () => {
  test('a level only opens once the monk reaches it', () => {
    expect(make('Monk', 1).getMonkBonusFeatLevels()).toEqual([1]);
    expect(make('Monk', 5).getMonkBonusFeatLevels()).toEqual([1, 2]);
    expect(make('Monk', 6).getMonkBonusFeatLevels()).toEqual([1, 2, 6]);
    expect(make('Monk', 20).getMonkBonusFeatLevels()).toEqual([1, 2, 6]);
  });

  test('each level offers its own two options', () => {
    const p = make('Monk', 20);
    expect(p.getMonkBonusFeatOptions(1)).toEqual(['Improved Grapple', 'Stunning Fist']);
    expect(p.getMonkBonusFeatOptions(2)).toEqual(['Combat Reflexes', 'Deflect Arrows']);
    expect(p.getMonkBonusFeatOptions(6)).toEqual(['Improved Disarm', 'Improved Trip']);
  });

  test('the two options at a level are exclusive', () => {
    const p = make('Monk', 6);
    p.setMonkBonusFeat(1, 'Stunning Fist');
    expect(p.getMonkBonusFeat(1)).toBe('Stunning Fist');
    p.setMonkBonusFeat(1, 'Improved Grapple');
    expect(p.getMonkBonusFeat(1)).toBe('Improved Grapple');
  });

  test('a choice can be cleared, and a bogus one is refused', () => {
    const p = make('Monk', 6);
    p.setMonkBonusFeat(2, 'Combat Reflexes');
    p.setMonkBonusFeat(2, '');
    expect(p.getMonkBonusFeat(2)).toBe('');

    p.setMonkBonusFeat(2, 'Power Attack'); // not on this level's list
    expect(p.getMonkBonusFeat(2)).toBe('');
  });

  test('chosen bonus feats are reported with the level that granted them', () => {
    const p = make('Monk', 6);
    p.setMonkBonusFeat(1, 'Stunning Fist');
    p.setMonkBonusFeat(6, 'Improved Trip');
    expect(p.getChosenClassBonusFeats()).toEqual([
      { level: 1, feat: 'Stunning Fist' },
      { level: 6, feat: 'Improved Trip' },
    ]);
  });

  test('they are charged to neither feat budget', () => {
    const p = make('Monk', 6);
    const before = p.getFeatPointsUsed();
    p.setMonkBonusFeat(1, 'Stunning Fist');
    p.setMonkBonusFeat(2, 'Deflect Arrows');
    expect(p.getFeatPointsUsed()).toBe(before);
    expect(p.getGeneralFeatsUsed()).toBe(before);
    expect(p.getFeats()).not.toContain('Stunning Fist');
  });

  test('no other class has them', () => {
    expect(make('Fighter', 20).getMonkBonusFeatLevels()).toEqual([]);
    expect(make('Rogue', 20).getChosenClassBonusFeats()).toEqual([]);
  });

  test('the choices survive a serialize / load round trip', () => {
    const p = make('Monk', 6);
    p.setMonkBonusFeat(1, 'Improved Grapple');
    p.setMonkBonusFeat(6, 'Improved Disarm');
    const copy = new Player().load(p.serialize());
    expect(copy.getMonkBonusFeat(1)).toBe('Improved Grapple');
    expect(copy.getMonkBonusFeat(6)).toBe('Improved Disarm');
  });
});

describe('rogue special abilities', () => {
  test('a pick opens at 10th and every third level after', () => {
    expect(make('Rogue', 9).getRogueSpecialAbilityLevels()).toEqual([]);
    expect(make('Rogue', 10).getRogueSpecialAbilityLevels()).toEqual([10]);
    expect(make('Rogue', 15).getRogueSpecialAbilityLevels()).toEqual([10, 13]);
    expect(make('Rogue', 20).getRogueSpecialAbilityLevels()).toEqual([10, 13, 16, 19]);
  });

  test('the options are the six named abilities plus the feat trade', () => {
    const options = make('Rogue', 20).getRogueSpecialAbilityOptions();
    expect(options).toEqual([
      'Crippling Strike', 'Defensive Roll', 'Improved Evasion',
      'Opportunist', 'Skill Mastery', 'Slippery Mind', 'Feat',
    ]);
  });

  test('every named option carries its rules text', () => {
    const p = make('Rogue', 20);
    p.getRogueSpecialAbilityOptions().forEach((option) => {
      expect(p.getRogueSpecialAbilityDescription(option).length).toBeGreaterThan(20);
    });
  });

  test('a named ability cannot be taken twice', () => {
    const p = make('Rogue', 20);
    p.setRogueSpecialAbility(10, 'Opportunist');
    p.setRogueSpecialAbility(13, 'Opportunist');
    expect(p.getRogueSpecialAbility(13)).toBe('');
    expect(p.getRogueSpecialAbility(10)).toBe('Opportunist');
  });

  test('the feat trade may be taken more than once', () => {
    const p = make('Rogue', 20);
    p.setRogueSpecialAbility(10, 'Feat');
    p.setRogueSpecialAbility(13, 'Feat');
    expect(p.getRogueBonusFeatSlots()).toBe(2);
  });

  test('each feat trade adds one to the general feat budget', () => {
    const p = make('Rogue', 20);
    const before = p.getFeatPointsMax();
    p.setRogueSpecialAbility(10, 'Feat');
    expect(p.getFeatPointsMax()).toBe(before + 1);
    p.setRogueSpecialAbility(16, 'Feat');
    expect(p.getFeatPointsMax()).toBe(before + 2);
  });

  test('a named ability adds no feat slot', () => {
    const p = make('Rogue', 20);
    const before = p.getFeatPointsMax();
    p.setRogueSpecialAbility(10, 'Skill Mastery');
    expect(p.getFeatPointsMax()).toBe(before);
    expect(p.getRogueBonusFeatSlots()).toBe(0);
  });

  test('a pick can be cleared and a bogus one is refused', () => {
    const p = make('Rogue', 20);
    p.setRogueSpecialAbility(10, 'Slippery Mind');
    p.setRogueSpecialAbility(10, '');
    expect(p.getRogueSpecialAbility(10)).toBe('');

    p.setRogueSpecialAbility(10, 'Evasion'); // a class feature, not an option
    expect(p.getRogueSpecialAbility(10)).toBe('');
  });

  test('no other class has them', () => {
    expect(make('Fighter', 20).getRogueSpecialAbilityLevels()).toEqual([]);
    expect(make('Fighter', 20).getRogueBonusFeatSlots()).toBe(0);
    expect(make('Monk', 20).getRogueSpecialAbilityOptions()).toEqual([]);
  });

  test('the picks survive a serialize / load round trip', () => {
    const p = make('Rogue', 20);
    p.setRogueSpecialAbility(10, 'Crippling Strike');
    p.setRogueSpecialAbility(13, 'Feat');
    const copy = new Player().load(p.serialize());
    expect(copy.getRogueSpecialAbility(10)).toBe('Crippling Strike');
    expect(copy.getRogueBonusFeatSlots()).toBe(1);
  });
});

describe('combat style can be cleared', () => {
  test('a chosen style is dropped along with the feats it granted', () => {
    const p = make('Ranger', 11);
    p.setCombatStyle('Archery');
    expect(p.getCombatStyleFeats().length).toBeGreaterThan(0);

    expect(p.setCombatStyle('')).toBe(true);
    expect(p.getCombatStyle()).toBe(null);
    expect(p.getCombatStyleFeats()).toEqual([]);
  });
});
