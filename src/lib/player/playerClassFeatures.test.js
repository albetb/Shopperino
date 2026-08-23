import Player from './player';

function make(cls = 'Fighter', level = 1, race = 'Human') {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

describe('class-feature use tracking', () => {
  test('a fresh player has no recorded uses', () => {
    expect(make().getClassFeatureUses()).toEqual({});
    expect(make().getClassFeatureUsed('rage')).toBe(0);
  });

  test('useClassFeature consumes one use by default and accumulates', () => {
    const p = make('Barbarian', 8);
    p.useClassFeature('rage');
    expect(p.getClassFeatureUsed('rage')).toBe(1);
    p.useClassFeature('rage');
    p.useClassFeature('rage');
    expect(p.getClassFeatureUsed('rage')).toBe(3);
    expect(p.getClassFeatureUsed('smiteEvil')).toBe(0);
  });

  test('useClassFeature spends an arbitrary amount for pools', () => {
    const p = make('Paladin', 10);
    p.useClassFeature('layOnHands', 7);
    p.useClassFeature('layOnHands', 5);
    expect(p.getClassFeatureUsed('layOnHands')).toBe(12);
  });

  test('a negative amount gives back uses but never drops below zero', () => {
    const p = make('Barbarian', 8);
    p.useClassFeature('rage', 2);
    p.useClassFeature('rage', -1);
    expect(p.getClassFeatureUsed('rage')).toBe(1);
    p.useClassFeature('rage', -5);
    expect(p.getClassFeatureUsed('rage')).toBe(0);
  });

  test('setClassFeatureUses sets the value outright, flooring at zero', () => {
    const p = make('Cleric', 5);
    p.setClassFeatureUses('turnUndead', 4);
    expect(p.getClassFeatureUsed('turnUndead')).toBe(4);
    p.setClassFeatureUses('turnUndead', -3);
    expect(p.getClassFeatureUsed('turnUndead')).toBe(0);
  });

  test('uses beyond the feature maximum are stored, not clamped', () => {
    // A level 1 barbarian has 1 rage per day; the sheet flags over-cap visually
    // rather than blocking it, per the non-enforcing rule in CLAUDE.md.
    const p = make('Barbarian', 1);
    p.setClassFeatureUses('rage', 9);
    expect(p.getClassFeatureUsed('rage')).toBe(9);
  });

  test('invalid keys and amounts are ignored rather than corrupting state', () => {
    const p = make('Barbarian', 8);
    p.useClassFeature('', 1);
    p.useClassFeature(null, 1);
    p.useClassFeature('rage', 'abc');
    p.setClassFeatureUses('rage', 'abc');
    expect(p.getClassFeatureUses()).toEqual({});
  });

  test('getClassFeatureUses returns a defensive copy', () => {
    const p = make('Barbarian', 8);
    p.useClassFeature('rage');
    const snapshot = p.getClassFeatureUses();
    snapshot.rage = 99;
    snapshot.smiteEvil = 4;
    expect(p.getClassFeatureUsed('rage')).toBe(1);
    expect(p.getClassFeatureUsed('smiteEvil')).toBe(0);
  });

  test('resetClassFeatureUses clears every counter', () => {
    const p = make('Paladin', 12);
    p.useClassFeature('smiteEvil', 2);
    p.useClassFeature('layOnHands', 15);
    p.useClassFeature('turnUndead', 1);
    p.resetClassFeatureUses();
    expect(p.getClassFeatureUses()).toEqual({});
    expect(p.getClassFeatureUsed('layOnHands')).toBe(0);
  });

  test('uses survive a serialize and load round trip', () => {
    const p = make('Paladin', 12);
    p.useClassFeature('smiteEvil', 2);
    p.useClassFeature('layOnHands', 15);

    const restored = new Player();
    restored.load(JSON.parse(JSON.stringify(p.serialize())));

    expect(restored.getClassFeatureUsed('smiteEvil')).toBe(2);
    expect(restored.getClassFeatureUsed('layOnHands')).toBe(15);
    expect(restored.getClassFeatureUses()).toEqual({ smiteEvil: 2, layOnHands: 15 });
  });

  test('loading a payload without class-feature uses leaves the map empty', () => {
    const p = make('Barbarian', 5);
    const data = p.serialize();
    delete data.classFeatureUses;
    const restored = new Player();
    restored.load(data);
    expect(restored.getClassFeatureUses()).toEqual({});
  });

  test('resting clears every counter through a persistence round trip', () => {
    const p = make('Paladin', 12, 'Gnome');
    p.useClassFeature('smiteEvil', 2);
    p.useClassFeature('layOnHands', 15);
    p.useGnomeSpell('dancing-lights');

    // The model-side effect of onPlayerRest, before persistPlayer serializes.
    p.resetGnomeSpellUses();
    p.resetClassFeatureUses();

    const restored = new Player();
    restored.load(JSON.parse(JSON.stringify(p.serialize())));

    expect(restored.getClassFeatureUses()).toEqual({});
    expect(restored.getGnomeSpellUses()).toEqual({});
  });

  test('malformed persisted entries are discarded on load', () => {
    const p = new Player();
    p.load({ classFeatureUses: { rage: 3, '': 5, bad: 'x', negative: -4 } });
    expect(p.getClassFeatureUses()).toEqual({ rage: 3, negative: 0 });
  });
});

describe('rogue sneak attack', () => {
  test('dice scale with rogue level', () => {
    expect(make('Rogue', 1).getSneakAttackDice()).toBe(1);
    expect(make('Rogue', 3).getSneakAttackDice()).toBe(2);
    expect(make('Rogue', 19).getSneakAttackDice()).toBe(10);
  });

  test('dice match floor((level + 1) / 2) at every rogue level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(make('Rogue', lvl).getSneakAttackDice()).toBe(Math.floor((lvl + 1) / 2));
    }
  });

  test('dice cap at 10d6 rather than continuing past level 19', () => {
    expect(make('Rogue', 20).getSneakAttackDice()).toBe(10);
  });

  test('non-rogues never get sneak attack dice', () => {
    expect(make('Fighter', 19).getSneakAttackDice()).toBe(0);
    expect(make('Wizard', 20).getSneakAttackDice()).toBe(0);
    expect(make('', 10).getSneakAttackDice()).toBe(0);
  });
});

describe('alignment warnings', () => {
  function aligned(cls, ethical, moral, level = 5) {
    const p = make(cls, level);
    p.ethicalAlignment = ethical;
    p.moralAlignment = moral;
    return p;
  }

  const codes = (p) => p.getAlignmentWarnings().map((w) => w.code);

  test('a monk must be lawful', () => {
    expect(codes(aligned('Monk', 'Lawful', 'Good'))).toEqual([]);
    expect(codes(aligned('Monk', 'Lawful', 'Evil'))).toEqual([]);
    expect(codes(aligned('Monk', 'Chaotic', 'Good'))).toEqual(['alignmentRequired']);
    expect(codes(aligned('Monk', 'Neutral', 'Neutral'))).toEqual(['alignmentRequired']);
  });

  test('a paladin must be lawful good on both axes', () => {
    expect(codes(aligned('Paladin', 'Lawful', 'Good'))).toEqual([]);
    expect(codes(aligned('Paladin', 'Lawful', 'Neutral'))).toEqual(['alignmentRequired']);
    expect(codes(aligned('Paladin', 'Chaotic', 'Good'))).toEqual(['alignmentRequired']);
    expect(codes(aligned('Paladin', 'Chaotic', 'Evil'))).toEqual(['alignmentRequired']);
  });

  test('a barbarian and a bard must not be lawful', () => {
    expect(codes(aligned('Barbarian', 'Lawful', 'Good'))).toEqual(['alignmentForbidden']);
    expect(codes(aligned('Barbarian', 'Chaotic', 'Evil'))).toEqual([]);
    expect(codes(aligned('Bard', 'Lawful', 'Neutral'))).toEqual(['alignmentForbidden']);
    expect(codes(aligned('Bard', 'Neutral', 'Good'))).toEqual([]);
  });

  test('a druid must be neutral on at least one axis', () => {
    expect(codes(aligned('Druid', 'Neutral', 'Good'))).toEqual([]);
    expect(codes(aligned('Druid', 'Lawful', 'Neutral'))).toEqual([]);
    expect(codes(aligned('Druid', 'Neutral', 'Neutral'))).toEqual([]);
    expect(codes(aligned('Druid', 'Lawful', 'Good'))).toEqual(['neutralAxisRequired']);
    expect(codes(aligned('Druid', 'Chaotic', 'Evil'))).toEqual(['neutralAxisRequired']);
  });

  test('a cleric may only hold an alignment domain that matches them', () => {
    const evilClericGoodDomain = aligned('Cleric', 'Neutral', 'Evil');
    evilClericGoodDomain.domain1 = 'Good';
    expect(codes(evilClericGoodDomain)).toEqual(['alignmentDomainMismatch']);

    const lawfulClericLawDomain = aligned('Cleric', 'Lawful', 'Neutral');
    lawfulClericLawDomain.domain1 = 'Law';
    expect(codes(lawfulClericLawDomain)).toEqual([]);
  });

  test('both cleric domain slots are checked', () => {
    const p = aligned('Cleric', 'Chaotic', 'Good');
    p.domain1 = 'Law';   // needs Lawful
    p.domain2 = 'Evil';  // needs Evil
    expect(codes(p)).toEqual(['alignmentDomainMismatch', 'alignmentDomainMismatch']);
  });

  test('non-alignment domains are never flagged', () => {
    const p = aligned('Cleric', 'Chaotic', 'Evil');
    p.domain1 = 'Healing';
    p.domain2 = 'War';
    expect(codes(p)).toEqual([]);
  });

  test('classes with no alignment rule are never warned', () => {
    ['Fighter', 'Rogue', 'Wizard', 'Sorcerer', 'Ranger'].forEach((cls) => {
      expect(codes(aligned(cls, 'Lawful', 'Evil'))).toEqual([]);
      expect(codes(aligned(cls, 'Chaotic', 'Good'))).toEqual([]);
    });
  });

  test('each warning carries a message naming the problem', () => {
    const p = aligned('Paladin', 'Chaotic', 'Evil');
    const [warning] = p.getAlignmentWarnings();
    expect(warning.message).toContain('Lawful Good');
    expect(warning.message).toContain('Chaotic Evil');
  });

  test('warnings never change a derived value', () => {
    const ok = aligned('Paladin', 'Lawful', 'Good', 10);
    const fallen = aligned('Paladin', 'Chaotic', 'Evil', 10);
    ok.setAbilityBase('cha', 16);
    fallen.setAbilityBase('cha', 16);
    expect(fallen.getAlignmentWarnings()).toHaveLength(1);
    expect(fallen.getSmiteEvilMax()).toBe(ok.getSmiteEvilMax());
    expect(fallen.getLayOnHandsMax()).toBe(ok.getLayOnHandsMax());
    expect(fallen.getTotalWillSave()).toBe(ok.getTotalWillSave());
  });
});

describe('the fallen (ex-class) flag', () => {
  test('only paladins carry a code of conduct today', () => {
    expect(make('Paladin', 5).hasCodeOfConduct()).toBe(true);
    expect(make('Fighter', 5).hasCodeOfConduct()).toBe(false);
    expect(make('Monk', 5).hasCodeOfConduct()).toBe(false);
  });

  test('the flag is settable and starts clear', () => {
    const p = make('Paladin', 5);
    expect(p.isExClass()).toBe(false);
    p.setExClass(true);
    expect(p.isExClass()).toBe(true);
    p.setExClass(false);
    expect(p.isExClass()).toBe(false);
  });

  test('it survives a serialize and load round trip', () => {
    const p = make('Paladin', 5);
    p.setExClass(true);
    const restored = new Player();
    restored.load(JSON.parse(JSON.stringify(p.serialize())));
    expect(restored.isExClass()).toBe(true);
  });

  test('being fallen changes nothing the model derives', () => {
    const p = make('Paladin', 10);
    p.setAbilityBase('cha', 16);
    const smite = p.getSmiteEvilMax();
    const pool = p.getLayOnHandsMax();
    const will = p.getTotalWillSave();

    p.setExClass(true);
    expect(p.getSmiteEvilMax()).toBe(smite);
    expect(p.getLayOnHandsMax()).toBe(pool);
    expect(p.getTotalWillSave()).toBe(will);
  });
});

describe('paladin divine grace', () => {
  function paladin(level, cha) {
    const p = make('Paladin', level);
    p.setAbilityBase('cha', cha);
    return p;
  }

  test('adds the Charisma modifier to all three saves from level 2', () => {
    const p = paladin(2, 16); // +3 modifier
    expect(p.getDivineGraceBonus()).toBe(3);
    expect(p.getTotalFortitudeSave()).toBe(p.getFortitudeSave() + 3);
    expect(p.getTotalReflexSave()).toBe(p.getReflexSave() + 3);
    expect(p.getTotalWillSave()).toBe(p.getWillSave() + 3);
  });

  test('a level 1 paladin has no divine grace yet', () => {
    const p = paladin(1, 16);
    expect(p.getDivineGraceBonus()).toBe(0);
    expect(p.getTotalFortitudeSave()).toBe(p.getFortitudeSave());
    expect(p.getTotalReflexSave()).toBe(p.getReflexSave());
    expect(p.getTotalWillSave()).toBe(p.getWillSave());
  });

  test('levelling from 1 to 2 adds exactly the Charisma modifier on top of the base save gain', () => {
    const before = paladin(1, 16);
    const after = paladin(2, 16);
    const baseGain = after.getBaseFortitudeSave() - before.getBaseFortitudeSave();
    expect(after.getTotalFortitudeSave() - before.getTotalFortitudeSave()).toBe(baseGain + 3);
  });

  test('a negative Charisma modifier lowers the saves', () => {
    const p = paladin(2, 6); // -2 modifier
    expect(p.getDivineGraceBonus()).toBe(-2);
    expect(p.getTotalWillSave()).toBe(p.getWillSave() - 2);
  });

  test('non-paladins are unaffected however high their Charisma', () => {
    const f = make('Fighter', 10);
    f.setAbilityBase('cha', 18);
    expect(f.getDivineGraceBonus()).toBe(0);
    expect(f.getTotalFortitudeSave()).toBe(f.getFortitudeSave());
    expect(f.getTotalWillSave()).toBe(f.getWillSave());
  });
});

