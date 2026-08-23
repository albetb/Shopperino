import Player from './player';

function ranger(level) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Ranger');
  p.setLevel(level);
  return p;
}

function other(cls, level) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

const roundTrip = (p) => new Player().load(JSON.parse(JSON.stringify(p.serialize())));

describe('favored enemy slots', () => {
  test('one at 1st level and another every five levels', () => {
    expect(ranger(1).getFavoredEnemySlotsMax()).toBe(1);
    expect(ranger(4).getFavoredEnemySlotsMax()).toBe(1);
    expect(ranger(5).getFavoredEnemySlotsMax()).toBe(2);
    expect(ranger(20).getFavoredEnemySlotsMax()).toBe(5);
  });

  test('slots match 1 + floor(level / 5) at every level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(ranger(lvl).getFavoredEnemySlotsMax()).toBe(1 + Math.floor(lvl / 5));
    }
  });

  test('no other class has favored enemies', () => {
    expect(other('Fighter', 20).getFavoredEnemySlotsMax()).toBe(0);
    expect(other('Fighter', 20).getFavoredEnemyTypes()).toEqual([]);
  });
});

describe('choosing favored enemies', () => {
  test('a new enemy starts at +2 and costs one slot', () => {
    const p = ranger(5);
    expect(p.addFavoredEnemy('Undead')).toBe(true);
    expect(p.getFavoredEnemies()).toEqual([{ type: 'Undead', bonus: 2 }]);
    expect(p.getFavoredEnemySlotsUsed()).toBe(1);
  });

  test('raising an existing enemy adds +2 and costs another slot', () => {
    const p = ranger(10);
    p.addFavoredEnemy('Undead');
    p.raiseFavoredEnemy(0);
    expect(p.getFavoredEnemies()[0].bonus).toBe(4);
    expect(p.getFavoredEnemySlotsUsed()).toBe(2);

    p.raiseFavoredEnemy(0);
    expect(p.getFavoredEnemies()[0].bonus).toBe(6);
    expect(p.getFavoredEnemySlotsUsed()).toBe(3);
  });

  test('a subtype is stored and distinguishes otherwise identical types', () => {
    const p = ranger(10);
    p.addFavoredEnemy('Humanoid', 'Goblinoid');
    p.addFavoredEnemy('Humanoid', 'Orc');
    expect(p.getFavoredEnemies()).toEqual([
      { type: 'Humanoid', subtype: 'Goblinoid', bonus: 2 },
      { type: 'Humanoid', subtype: 'Orc', bonus: 2 },
    ]);
  });

  test('the same enemy cannot be named twice', () => {
    const p = ranger(10);
    expect(p.addFavoredEnemy('Undead')).toBe(true);
    expect(p.addFavoredEnemy('Undead')).toBe(false);
    expect(p.getFavoredEnemies()).toHaveLength(1);
  });

  test('removing an entry returns every slot it held', () => {
    const p = ranger(20);
    p.addFavoredEnemy('Undead');
    p.raiseFavoredEnemy(0);
    p.addFavoredEnemy('Dragon');
    expect(p.getFavoredEnemySlotsUsed()).toBe(3);

    p.removeFavoredEnemyAt(0);
    expect(p.getFavoredEnemies()).toEqual([{ type: 'Dragon', bonus: 2 }]);
    expect(p.getFavoredEnemySlotsUsed()).toBe(1);
  });

  test('using more slots than earned is allowed, per the non-enforcing rule', () => {
    const p = ranger(1); // one slot
    p.addFavoredEnemy('Undead');
    p.addFavoredEnemy('Dragon');
    p.addFavoredEnemy('Giant');
    expect(p.getFavoredEnemySlotsUsed()).toBe(3);
    expect(p.getFavoredEnemySlotsMax()).toBe(1);
  });

  test('empty and malformed selections are rejected', () => {
    const p = ranger(5);
    expect(p.addFavoredEnemy('')).toBe(false);
    expect(p.addFavoredEnemy(null)).toBe(false);
    expect(p.raiseFavoredEnemy(3)).toBe(false);
    expect(p.getFavoredEnemies()).toEqual([]);
  });

  test('getFavoredEnemies returns copies, not the live entries', () => {
    const p = ranger(5);
    p.addFavoredEnemy('Undead');
    const snapshot = p.getFavoredEnemies();
    snapshot[0].bonus = 99;
    expect(p.getFavoredEnemies()[0].bonus).toBe(2);
  });
});

describe('the favored enemy bonus', () => {
  test('reports the accumulated bonus against that enemy only', () => {
    const p = ranger(10);
    p.addFavoredEnemy('Undead');
    p.raiseFavoredEnemy(0);
    expect(p.getFavoredEnemyBonus('Undead')).toBe(4);
    expect(p.getFavoredEnemyBonus('Dragon')).toBe(0);
  });

  test('matching is case-insensitive', () => {
    const p = ranger(5);
    p.addFavoredEnemy('Undead');
    expect(p.getFavoredEnemyBonus('undead')).toBe(2);
    expect(p.getFavoredEnemyBonus('UNDEAD')).toBe(2);
  });

  test('an entry with a subtype only answers for that subtype', () => {
    const p = ranger(5);
    p.addFavoredEnemy('Humanoid', 'Goblinoid');
    expect(p.getFavoredEnemyBonus('Humanoid', 'Goblinoid')).toBe(2);
    expect(p.getFavoredEnemyBonus('Humanoid', 'Orc')).toBe(0);
    expect(p.getFavoredEnemyBonus('Humanoid')).toBe(0);
  });

  test('applies to the five listed skills and to weapon damage', () => {
    const p = ranger(5);
    expect(p.getFavoredEnemySkills())
      .toEqual(['Bluff', 'Listen', 'Sense Motive', 'Spot', 'Survival']);
    ['Bluff', 'Listen', 'Sense Motive', 'Spot', 'Survival'].forEach((s) => {
      expect(p.appliesFavoredEnemyBonusToSkill(s)).toBe(true);
    });
    expect(p.appliesFavoredEnemyBonusToSkill('Hide')).toBe(false);
    expect(p.appliesFavoredEnemyBonusToSkill('Climb')).toBe(false);
  });

  test('an unknown enemy or an empty name yields nothing', () => {
    const p = ranger(5);
    p.addFavoredEnemy('Undead');
    expect(p.getFavoredEnemyBonus('')).toBe(0);
    expect(p.getFavoredEnemyBonus(null)).toBe(0);
  });
});

describe('which types need a subtype', () => {
  test('humanoids and outsiders do, other types do not', () => {
    const p = ranger(5);
    expect(p.favoredEnemyRequiresSubtype('Humanoid')).toBe(true);
    expect(p.favoredEnemyRequiresSubtype('Outsider')).toBe(true);
    expect(p.favoredEnemyRequiresSubtype('Undead')).toBe(false);
    expect(p.favoredEnemyRequiresSubtype('Dragon')).toBe(false);
  });

  test('the subtype list is offered for the types that take one', () => {
    const p = ranger(5);
    expect(p.getFavoredEnemySubtypes('Humanoid')).toContain('Goblinoid');
    expect(p.getFavoredEnemySubtypes('Outsider')).toContain('Native');
    expect(p.getFavoredEnemySubtypes('Undead')).toEqual([]);
  });

  test('the type list covers the SRD creature types', () => {
    const types = ranger(5).getFavoredEnemyTypes();
    expect(types).toHaveLength(15);
    expect(types).toContain('Aberration');
    expect(types).toContain('Magical beast');
    expect(types).toContain('Vermin');
  });
});

describe('combat style', () => {
  test('is chosen from 2nd level, not before', () => {
    expect(ranger(1).canChooseCombatStyle()).toBe(false);
    expect(ranger(2).canChooseCombatStyle()).toBe(true);
    expect(ranger(2).getCombatStyleChoiceLevel()).toBe(2);
    expect(other('Fighter', 20).canChooseCombatStyle()).toBe(false);
  });

  test('offers archery and two-weapon fighting', () => {
    expect(ranger(2).getCombatStyleOptions().sort())
      .toEqual(['Archery', 'Two-Weapon Fighting']);
    expect(other('Fighter', 20).getCombatStyleOptions()).toEqual([]);
  });

  test('accepts only a style the class offers', () => {
    const p = ranger(6);
    expect(p.getCombatStyle()).toBe(null);
    expect(p.setCombatStyle('Archery')).toBe(true);
    expect(p.getCombatStyle()).toBe('Archery');
    expect(p.setCombatStyle('Sword and board')).toBe(false);
    expect(p.getCombatStyle()).toBe('Archery');
    expect(p.setCombatStyle(null)).toBe(true);
    expect(p.getCombatStyle()).toBe(null);
  });

  test('archery grants its feats at the style, improvement and mastery levels', () => {
    const at = (level) => {
      const p = ranger(level);
      p.setCombatStyle('Archery');
      return p.getCombatStyleFeats().map((f) => f.feat);
    };
    expect(at(2)).toEqual(['Rapid Shot']);
    expect(at(5)).toEqual(['Rapid Shot']);
    expect(at(6)).toEqual(['Rapid Shot', 'Manyshot']);
    expect(at(11)).toEqual(['Rapid Shot', 'Manyshot', 'Improved Precise Shot']);
  });

  test('two-weapon fighting grants its own three feats', () => {
    const at = (level) => {
      const p = ranger(level);
      p.setCombatStyle('Two-Weapon Fighting');
      return p.getCombatStyleFeats().map((f) => f.feat);
    };
    expect(at(2)).toEqual(['Two-Weapon Fighting']);
    expect(at(6)).toEqual(['Two-Weapon Fighting', 'Improved Two-Weapon Fighting']);
    expect(at(11)).toEqual([
      'Two-Weapon Fighting', 'Improved Two-Weapon Fighting', 'Greater Two-Weapon Fighting',
    ]);
  });

  test('each granted feat reports the level it arrived at', () => {
    const p = ranger(11);
    p.setCombatStyle('Archery');
    expect(p.getCombatStyleFeats()).toEqual([
      { level: 2, feat: 'Rapid Shot' },
      { level: 6, feat: 'Manyshot' },
      { level: 11, feat: 'Improved Precise Shot' },
    ]);
  });

  test('granted feats consume neither feat budget', () => {
    const p = ranger(11);
    p.setCombatStyle('Archery');
    expect(p.getFeats()).toEqual([]);
    expect(p.getFeatPointsUsed()).toBe(0);
    expect(p.getClassBonusFeatsUsed()).toBe(0);
  });

  test('nothing is granted before a style is chosen', () => {
    expect(ranger(11).getCombatStyleFeats()).toEqual([]);
  });

  test('armor heavier than light suppresses the style', () => {
    const p = ranger(6);
    p.setCombatStyle('Archery');
    expect(p.isCombatStyleSuppressed()).toBe(false);

    p.equipItem('armor', { link: 'items/Armor/leather' });
    expect(p.isCombatStyleSuppressed()).toBe(false);

    p.equipItem('armor', { link: 'items/Armor/breastplate' });
    expect(p.isCombatStyleSuppressed()).toBe(true);

    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(p.isCombatStyleSuppressed()).toBe(true);
  });

  test('suppression only applies once a style is actually chosen', () => {
    const p = ranger(6);
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(p.isCombatStyleSuppressed()).toBe(false);
  });

  test('the chosen style survives a serialize and load round trip', () => {
    const p = ranger(11);
    p.setCombatStyle('Two-Weapon Fighting');
    const restored = roundTrip(p);
    expect(restored.getCombatStyle()).toBe('Two-Weapon Fighting');
    expect(restored.getCombatStyleFeats()).toHaveLength(3);
  });

  test('a style that is not valid for the class is ignored on read', () => {
    const restored = new Player().load({
      class: 'Ranger', level: 11, combatStyle: 'Sword and board',
    });
    expect(restored.getCombatStyle()).toBe(null);
    expect(restored.getCombatStyleFeats()).toEqual([]);
  });
});

describe('persistence', () => {
  test('entries and their bonuses survive a serialize and load round trip', () => {
    const p = ranger(20);
    p.addFavoredEnemy('Undead');
    p.raiseFavoredEnemy(0);
    p.addFavoredEnemy('Humanoid', 'Goblinoid');
    p.addFavoredEnemy('Dragon');

    const restored = roundTrip(p);
    expect(restored.getFavoredEnemies()).toEqual([
      { type: 'Undead', bonus: 4 },
      { type: 'Humanoid', subtype: 'Goblinoid', bonus: 2 },
      { type: 'Dragon', bonus: 2 },
    ]);
    expect(restored.getFavoredEnemyBonus('Undead')).toBe(4);
    expect(restored.getFavoredEnemySlotsUsed()).toBe(4);
  });

  test('selection order is preserved', () => {
    const p = ranger(20);
    ['Giant', 'Undead', 'Dragon'].forEach((t) => p.addFavoredEnemy(t));
    expect(roundTrip(p).getFavoredEnemies().map((e) => e.type))
      .toEqual(['Giant', 'Undead', 'Dragon']);
  });

  test('a payload with no favored enemies leaves the list empty', () => {
    const p = ranger(5);
    const data = p.serialize();
    delete data.favoredEnemies;
    expect(new Player().load(data).getFavoredEnemies()).toEqual([]);
  });

  test('malformed persisted entries are discarded on load', () => {
    const restored = new Player().load({
      class: 'Ranger',
      level: 10,
      favoredEnemies: [
        { type: 'Undead', bonus: 4 },
        { type: '', bonus: 2 },
        { bonus: 2 },
        { type: 'Dragon', bonus: 'x' },
      ],
    });
    expect(restored.getFavoredEnemies()).toEqual([
      { type: 'Undead', bonus: 4 },
      { type: 'Dragon', bonus: 2 },
    ]);
  });
});
