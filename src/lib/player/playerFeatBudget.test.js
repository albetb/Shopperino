import Player from './player';

function make(cls, level, race = 'Elf') {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

describe('class bonus feat slots', () => {
  test('a fighter gains a slot at 1st level and at every even level', () => {
    expect(make('Fighter', 1).getClassBonusFeatSlotsMax()).toBe(1);
    expect(make('Fighter', 2).getClassBonusFeatSlotsMax()).toBe(2);
    expect(make('Fighter', 20).getClassBonusFeatSlotsMax()).toBe(11);
  });

  test('slots match 1 + floor(level / 2) at every fighter level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(make('Fighter', lvl).getClassBonusFeatSlotsMax()).toBe(1 + Math.floor(lvl / 2));
    }
  });

  test('classes with no bonus feats report none', () => {
    expect(make('Barbarian', 20).getClassBonusFeatSlotsMax()).toBe(0);
    expect(make('Rogue', 20).getClassBonusFeatSlotsMax()).toBe(0);
    expect(make('Cleric', 20).getClassBonusFeatSlotsMax()).toBe(0);
    expect(make('', 20).getClassBonusFeatSlotsMax()).toBe(0);
  });

  test('the slot count is data-driven, so wizards and monks get their own', () => {
    // Wizard: a bonus feat every five levels. Monk: 1st, 2nd and 6th.
    expect(make('Wizard', 4).getClassBonusFeatSlotsMax()).toBe(0);
    expect(make('Wizard', 5).getClassBonusFeatSlotsMax()).toBe(1);
    expect(make('Wizard', 20).getClassBonusFeatSlotsMax()).toBe(4);
    expect(make('Monk', 6).getClassBonusFeatSlotsMax()).toBe(3);
  });
});

describe('feats charged against the bonus slots', () => {
  test('only feats flagged fighterBonus in feats.json count', () => {
    const p = make('Fighter', 6);
    p.addFeat('Cleave');      // fighterBonus
    p.addFeat('Alertness');   // general only
    p.addFeat('Dodge');       // fighterBonus
    expect(p.getClassBonusFeatsUsed()).toBe(2);
    expect(p.getGeneralFeatsUsed()).toBe(1);
  });

  test('a feat taken with a choice matches on its base name', () => {
    const p = make('Fighter', 6);
    p.addFeat('Weapon focus (longsword)');
    p.addFeat('Improved critical (greataxe)');
    expect(p.getClassBonusFeatsUsed()).toBe(2);
    expect(p.getGeneralFeatsUsed()).toBe(0);
  });

  test('a canonical name carrying its own parenthetical is not misread', () => {
    // "Armor proficiency (heavy)" is a whole feat name, not a choice, and it
    // is not a fighter bonus feat — stripping the suffix must not change that.
    const p = make('Fighter', 6);
    p.addFeat('Armor proficiency (heavy)');
    expect(p.getClassBonusFeatsUsed()).toBe(0);
    expect(p.getGeneralFeatsUsed()).toBe(1);
  });

  test('combat feats beyond the bonus slots spill into the general budget', () => {
    // A 1st-level fighter has one bonus slot and one general feat point
    // (plus one for Human). Two combat feats fill the bonus slot, then the
    // general budget — the overflow is charged, not silently absorbed.
    const p = make('Fighter', 1);
    p.addFeat('Cleave');
    p.addFeat('Dodge');
    expect(p.getClassBonusFeatSlotsMax()).toBe(1);
    expect(p.getQualifyingBonusFeats()).toBe(2);
    expect(p.getClassBonusFeatsUsed()).toBe(1);
    expect(p.getGeneralFeatsUsed()).toBe(1);
  });

  test('every feat is charged exactly once across the two budgets', () => {
    const p = make('Fighter', 1);
    ['Cleave', 'Dodge', 'Blind-fight'].forEach((f) => p.addFeat(f));
    expect(p.getClassBonusFeatsUsed() + p.getGeneralFeatsUsed())
      .toBe(p.getFeatPointsUsed());
    expect(p.getClassBonusFeatsUsed()).toBe(1);
    expect(p.getGeneralFeatsUsed()).toBe(2);
  });

  test('a class with no bonus pool charges every feat to the general budget', () => {
    const b = make('Barbarian', 20);
    b.addFeat('Cleave');
    b.addFeat('Alertness');
    expect(b.getClassBonusFeatsUsed()).toBe(0);
    expect(b.getGeneralFeatsUsed()).toBe(2);
  });

  test('a combat feat is not a wizard bonus feat', () => {
    const w = make('Wizard', 20);
    w.addFeat('Cleave');
    w.addFeat('Alertness');
    expect(w.getClassBonusFeatsUsed()).toBe(0);
    expect(w.getGeneralFeatsUsed()).toBe(2);
  });

  test('the wizard pool takes metamagic and item creation feats, by tag', () => {
    const w = make('Wizard', 20);
    w.addFeat('Empower spell');       // Metamagic
    w.addFeat('Craft wand');          // Item creation
    w.addFeat('Alertness');           // General
    expect(w.getClassBonusFeatsUsed()).toBe(2);
    expect(w.getGeneralFeatsUsed()).toBe(1);
  });

  test('Spell mastery qualifies by name, having no category of its own', () => {
    // It is tagged "Special" in feats.json, so only the explicit name list
    // can pick it up.
    const w = make('Wizard', 20);
    w.addFeat('Spell mastery');
    expect(w.getClassBonusFeatsUsed()).toBe(1);
    expect(w.getGeneralFeatsUsed()).toBe(0);
  });

  test('the two pools stay separate: a fighter gets no credit for metamagic', () => {
    const f = make('Fighter', 20);
    f.addFeat('Empower spell');
    expect(f.getClassBonusFeatsUsed()).toBe(0);
    expect(f.getGeneralFeatsUsed()).toBe(1);
  });

  test('a fighter with no feats has nothing in either pool', () => {
    const p = make('Fighter', 10);
    expect(p.getClassBonusFeatsUsed()).toBe(0);
    expect(p.getGeneralFeatsUsed()).toBe(0);
  });
});

describe('which classes run a second budget', () => {
  test('a fighter does: it grants slots and defines what fills them', () => {
    expect(make('Fighter', 1).hasClassBonusFeatPool()).toBe(true);
  });

  test('a wizard does: metamagic, item creation and Spell mastery fill its slots', () => {
    expect(make('Wizard', 20).hasClassBonusFeatPool()).toBe(true);
  });

  test('a monk does not — its bonus feats are a fixed per-level choice', () => {
    // It grants slots, but nothing qualifies for them in data, so a second
    // budget would only ever read "0 of N". It keeps the single general budget.
    expect(make('Monk', 20).hasClassBonusFeatPool()).toBe(false);
  });

  test('classes with no bonus feats at all do not', () => {
    expect(make('Barbarian', 20).hasClassBonusFeatPool()).toBe(false);
    expect(make('', 20).hasClassBonusFeatPool()).toBe(false);
  });

  test('each pool carries its own label', () => {
    expect(make('Fighter', 1).getClassBonusFeatLabel()).toBe('combat');
    expect(make('Wizard', 5).getClassBonusFeatLabel()).toBe('bonus');
    expect(make('Barbarian', 1).getClassBonusFeatLabel()).toBe('bonus');
  });
});

describe('class-granted feats', () => {
  test('a wizard has Scribe Scroll from 1st level', () => {
    expect(make('Wizard', 1).getGrantedFeats()).toEqual([{ level: 1, feat: 'Scribe scroll' }]);
    expect(make('Wizard', 20).getGrantedFeats()).toEqual([{ level: 1, feat: 'Scribe scroll' }]);
  });

  test('it is charged to neither budget and is not part of getFeats', () => {
    const w = make('Wizard', 5);
    expect(w.getFeats()).toEqual([]);
    expect(w.getFeatPointsUsed()).toBe(0);
    expect(w.getGeneralFeatsUsed()).toBe(0);
    expect(w.getClassBonusFeatsUsed()).toBe(0);
  });

  test('other classes are granted nothing', () => {
    expect(make('Fighter', 20).getGrantedFeats()).toEqual([]);
    expect(make('Sorcerer', 20).getGrantedFeats()).toEqual([]);
    expect(make('', 20).getGrantedFeats()).toEqual([]);
  });
});

describe('the general feat budget is unchanged', () => {
  test('getFeatPointsMax still returns the general allotment alone', () => {
    expect(make('Fighter', 1).getFeatPointsMax()).toBe(1);
    expect(make('Fighter', 20).getFeatPointsMax()).toBe(1 + Math.floor(20 / 3));
    expect(make('Wizard', 20).getFeatPointsMax()).toBe(1 + Math.floor(20 / 3));
  });

  test('humans still get their extra general feat, fighters included', () => {
    expect(make('Fighter', 1, 'Human').getFeatPointsMax()).toBe(2);
    expect(make('Wizard', 1, 'Human').getFeatPointsMax()).toBe(2);
  });

  test('getFeatPointsUsed still counts every selected feat', () => {
    const p = make('Fighter', 6);
    p.addFeat('Cleave');
    p.addFeat('Alertness');
    expect(p.getFeatPointsUsed()).toBe(2);
    expect(p.getGeneralFeatsUsed() + p.getClassBonusFeatsUsed()).toBe(2);
  });
});
