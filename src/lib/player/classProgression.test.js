import {
  getClassProgression,
  resolveAtLevel,
  getProgressionValue,
  hasFeatureAtLevel,
} from './classProgression';

describe('getClassProgression', () => {
  test('returns the progression block for a known class', () => {
    const prog = getClassProgression('Barbarian');
    expect(prog.fastMovement).toBe(10);
    expect(Array.isArray(prog.rageUsesPerDay)).toBe(true);
  });
  test('every class in classes.json carries a progression block', () => {
    const classNames = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
      'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'];
    classNames.forEach((name) => {
      expect(Object.keys(getClassProgression(name)).length).toBeGreaterThan(0);
    });
  });
  test('unknown and invalid class names give an empty object, not a throw', () => {
    expect(getClassProgression('Bardbarian')).toEqual({});
    expect(getClassProgression('')).toEqual({});
    expect(getClassProgression(null)).toEqual({});
    expect(getClassProgression(undefined)).toEqual({});
  });
});

describe('resolveAtLevel', () => {
  const table = [[1, 1], [4, 2], [8, 3]];
  test('returns the value in effect at the given level', () => {
    expect(resolveAtLevel(table, 1)).toBe(1);
    expect(resolveAtLevel(table, 3)).toBe(1);
    expect(resolveAtLevel(table, 4)).toBe(2);
    expect(resolveAtLevel(table, 7)).toBe(2);
    expect(resolveAtLevel(table, 20)).toBe(3);
  });
  test('returns the fallback below the first breakpoint', () => {
    expect(resolveAtLevel([[7, 1]], 6, 0)).toBe(0);
    expect(resolveAtLevel([[7, 1]], 7, 0)).toBe(1);
  });
  test('picks the highest qualifying entry even when the table is unsorted', () => {
    expect(resolveAtLevel([[8, 3], [1, 1], [4, 2]], 9)).toBe(3);
    expect(resolveAtLevel([[8, 3], [1, 1], [4, 2]], 5)).toBe(2);
  });
  test('returns the fallback for a missing or malformed table', () => {
    expect(resolveAtLevel(undefined, 5, 0)).toBe(0);
    expect(resolveAtLevel(null, 5, 'none')).toBe('none');
    expect(resolveAtLevel([[]], 5, 0)).toBe(0);
    expect(resolveAtLevel(table, NaN, 0)).toBe(0);
  });
});

describe('getProgressionValue', () => {
  test('resolves barbarian rage uses per day at key levels', () => {
    expect(getProgressionValue('Barbarian', 'rageUsesPerDay', 1)).toBe(1);
    expect(getProgressionValue('Barbarian', 'rageUsesPerDay', 4)).toBe(2);
    expect(getProgressionValue('Barbarian', 'rageUsesPerDay', 20)).toBe(6);
  });
  test('rage uses match 1 + floor(level / 4) at every level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(getProgressionValue('Barbarian', 'rageUsesPerDay', lvl))
        .toBe(1 + Math.floor(lvl / 4));
    }
  });
  test('resolves rogue sneak attack dice at key levels', () => {
    expect(getProgressionValue('Rogue', 'sneakAttackDice', 1)).toBe(1);
    expect(getProgressionValue('Rogue', 'sneakAttackDice', 3)).toBe(2);
    expect(getProgressionValue('Rogue', 'sneakAttackDice', 19)).toBe(10);
  });
  test('sneak attack dice match floor((level + 1) / 2) at every level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(getProgressionValue('Rogue', 'sneakAttackDice', lvl))
        .toBe(Math.floor((lvl + 1) / 2));
    }
  });
  test('barbarian damage reduction starts at level 7 and scales every three levels', () => {
    expect(getProgressionValue('Barbarian', 'damageReduction', 6)).toBe(0);
    expect(getProgressionValue('Barbarian', 'damageReduction', 7)).toBe(1);
    expect(getProgressionValue('Barbarian', 'damageReduction', 19)).toBe(5);
  });
  test('resolves string-valued breakpoint tables', () => {
    expect(getProgressionValue('Monk', 'kiStrike', 3, null)).toBe(null);
    expect(getProgressionValue('Monk', 'kiStrike', 4, null)).toBe('magic');
    expect(getProgressionValue('Monk', 'kiStrike', 10, null)).toBe('lawful');
    expect(getProgressionValue('Monk', 'kiStrike', 20, null)).toBe('adamantine');
  });
  test('returns scalars unchanged regardless of level', () => {
    expect(getProgressionValue('Barbarian', 'fastMovement', 1)).toBe(10);
    expect(getProgressionValue('Barbarian', 'fastMovement', 20)).toBe(10);
  });
  test('the "level" sentinel resolves to the class level itself', () => {
    // "a number of times per day equal to her monk level" — SRD, Stunning Fist.
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(getProgressionValue('Monk', 'stunningFistUsesPerDay', lvl)).toBe(lvl);
      expect(getProgressionValue('Bard', 'bardicMusicUsesPerDay', lvl)).toBe(lvl);
    }
  });
  test('the "level" sentinel falls back when the level is not a number', () => {
    expect(getProgressionValue('Monk', 'stunningFistUsesPerDay', NaN, 0)).toBe(0);
    expect(getProgressionValue('Monk', 'stunningFistUsesPerDay', undefined, null)).toBe(null);
  });
  test('other strings are not mistaken for the sentinel', () => {
    expect(getProgressionValue('Cleric', 'turningDamageDice', 10)).toBe('2d6');
    expect(getProgressionValue('Monk', 'alignmentRequired', 10)).toBe('Lawful');
  });
  test('returns the fallback for missing keys and unknown classes', () => {
    expect(getProgressionValue('Barbarian', 'noSuchKey', 10)).toBe(0);
    expect(getProgressionValue('Nonexistent', 'rageUsesPerDay', 10)).toBe(0);
    expect(getProgressionValue('Fighter', 'rageUsesPerDay', 10, null)).toBe(null);
  });
});

describe('hasFeatureAtLevel', () => {
  test('gates a feature on its level marker', () => {
    expect(hasFeatureAtLevel('Rogue', 'uncannyDodgeLevel', 3)).toBe(false);
    expect(hasFeatureAtLevel('Rogue', 'uncannyDodgeLevel', 4)).toBe(true);
    expect(hasFeatureAtLevel('Rogue', 'uncannyDodgeLevel', 20)).toBe(true);
  });
  test('paladin divine grace begins at level 2', () => {
    expect(hasFeatureAtLevel('Paladin', 'divineGraceLevel', 1)).toBe(false);
    expect(hasFeatureAtLevel('Paladin', 'divineGraceLevel', 2)).toBe(true);
  });
  test('returns false for missing markers and unknown classes', () => {
    expect(hasFeatureAtLevel('Rogue', 'noSuchLevel', 20)).toBe(false);
    expect(hasFeatureAtLevel('Nonexistent', 'uncannyDodgeLevel', 20)).toBe(false);
    expect(hasFeatureAtLevel('Rogue', 'uncannyDodgeLevel', NaN)).toBe(false);
  });
});
