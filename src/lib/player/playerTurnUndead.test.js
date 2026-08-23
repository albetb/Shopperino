import Player from './player';

function make(cls, level, cha = 10) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.setAbilityBase('cha', cha);
  return p;
}

describe('who can turn undead', () => {
  test('a cleric can from 1st level', () => {
    expect(make('Cleric', 1).canTurnUndead()).toBe(true);
    expect(make('Cleric', 20).canTurnUndead()).toBe(true);
  });

  test('a paladin only from 4th level', () => {
    expect(make('Paladin', 3).canTurnUndead()).toBe(false);
    expect(make('Paladin', 4).canTurnUndead()).toBe(true);
  });

  test('no other class can', () => {
    expect(make('Fighter', 20).canTurnUndead()).toBe(false);
    expect(make('Druid', 20).canTurnUndead()).toBe(false);
    expect(make('', 20).canTurnUndead()).toBe(false);
  });
});

describe('attempts per day', () => {
  test('is 3 + the Charisma modifier for a cleric at any level', () => {
    expect(make('Cleric', 3, 10).getTurnUndeadAttemptsMax()).toBe(3);
    expect(make('Cleric', 4, 16).getTurnUndeadAttemptsMax()).toBe(6);
    expect(make('Cleric', 10, 18).getTurnUndeadAttemptsMax()).toBe(7);
  });

  test('a paladin has none before 4th level and 3 + Cha from then on', () => {
    expect(make('Paladin', 3, 16).getTurnUndeadAttemptsMax()).toBe(0);
    expect(make('Paladin', 4, 16).getTurnUndeadAttemptsMax()).toBe(6);
    expect(make('Paladin', 10, 14).getTurnUndeadAttemptsMax()).toBe(5);
  });

  test('a poor Charisma reduces the attempts but never past zero', () => {
    expect(make('Cleric', 10, 8).getTurnUndeadAttemptsMax()).toBe(2);
    expect(make('Cleric', 10, 1).getTurnUndeadAttemptsMax()).toBe(0);
  });

  test('non-turning classes have none however high their Charisma', () => {
    expect(make('Sorcerer', 20, 20).getTurnUndeadAttemptsMax()).toBe(0);
  });
});

describe('effective turning level', () => {
  test('a cleric turns at their class level', () => {
    expect(make('Cleric', 3).getTurnUndeadEffectiveLevel()).toBe(3);
    expect(make('Cleric', 4).getTurnUndeadEffectiveLevel()).toBe(4);
    expect(make('Cleric', 10).getTurnUndeadEffectiveLevel()).toBe(10);
  });

  test('a paladin turns as a cleric of three levels lower, from 4th', () => {
    expect(make('Paladin', 3).getTurnUndeadEffectiveLevel()).toBe(0);
    expect(make('Paladin', 4).getTurnUndeadEffectiveLevel()).toBe(1);
    expect(make('Paladin', 10).getTurnUndeadEffectiveLevel()).toBe(7);
  });

  test('a non-turning class has none', () => {
    expect(make('Rogue', 20).getTurnUndeadEffectiveLevel()).toBe(0);
  });
});

describe('resolving a turning attempt', () => {
  test('the turning check adds the Charisma modifier to a d20', () => {
    expect(make('Cleric', 10, 18).getTurnUndeadCheckBonus()).toBe(4);
    expect(make('Paladin', 10, 8).getTurnUndeadCheckBonus()).toBe(-1);
    expect(make('Fighter', 10, 18).getTurnUndeadCheckBonus()).toBe(0);
  });

  test('the check result sets the highest HD affected, level -4 to level +4', () => {
    const c = make('Cleric', 10, 10); // effective level 10
    expect(c.getTurnUndeadHighestHd(0)).toBe(6);
    expect(c.getTurnUndeadHighestHd(3)).toBe(7);
    expect(c.getTurnUndeadHighestHd(6)).toBe(8);
    expect(c.getTurnUndeadHighestHd(9)).toBe(9);
    expect(c.getTurnUndeadHighestHd(12)).toBe(10);
    expect(c.getTurnUndeadHighestHd(15)).toBe(11);
    expect(c.getTurnUndeadHighestHd(18)).toBe(12);
    expect(c.getTurnUndeadHighestHd(21)).toBe(13);
    expect(c.getTurnUndeadHighestHd(30)).toBe(14);
  });

  test('a badly failed check still cannot reach below zero HD', () => {
    const c = make('Cleric', 1, 10);
    expect(c.getTurnUndeadHighestHd(-5)).toBe(0);
  });

  test('the paladin table is read off the reduced effective level', () => {
    const p = make('Paladin', 10, 10); // effective level 7
    expect(p.getTurnUndeadHighestHd(12)).toBe(7);
    expect(p.getTurnUndeadHighestHd(22)).toBe(11);
  });

  test('turning damage is 2d6 + effective level + Charisma modifier', () => {
    const c = make('Cleric', 10, 18); // 10 + 4
    expect(c.getTurnUndeadDamage()).toEqual({ dice: '2d6', bonus: 14, formula: '2d6+14' });

    const p = make('Paladin', 10, 14); // 7 + 2
    expect(p.getTurnUndeadDamage()).toEqual({ dice: '2d6', bonus: 9, formula: '2d6+9' });
  });

  test('a non-turning class has no damage formula at all', () => {
    expect(make('Wizard', 20, 20).getTurnUndeadDamage()).toEqual({ dice: '', bonus: 0, formula: '' });
  });

  test('undead of half the effective level or less are destroyed outright', () => {
    expect(make('Cleric', 10).getTurnUndeadDestroyThreshold()).toBe(5);
    expect(make('Cleric', 3).getTurnUndeadDestroyThreshold()).toBe(1);
    expect(make('Paladin', 10).getTurnUndeadDestroyThreshold()).toBe(3);
    expect(make('Paladin', 3).getTurnUndeadDestroyThreshold()).toBe(0);
  });
});

describe('turning versus rebuking', () => {
  test('an evil cleric rebukes instead of turning', () => {
    const evil = make('Cleric', 5);
    evil.moralAlignment = 'Evil';
    expect(evil.rebukesUndead()).toBe(true);
  });

  test('good and neutral clerics turn', () => {
    const good = make('Cleric', 5);
    good.moralAlignment = 'Good';
    expect(good.rebukesUndead()).toBe(false);
    expect(make('Cleric', 5).rebukesUndead()).toBe(false);
  });

  test('a paladin always turns, whatever the alignment field says', () => {
    const p = make('Paladin', 10);
    p.moralAlignment = 'Evil';
    expect(p.rebukesUndead()).toBe(false);
  });
});
