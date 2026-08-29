import Player from './player';
import { sumContributions } from './contributions';

/* The pass/fail half of the class-feature audit (backlog item 4).
 *
 * None of these features move a number: Evasion changes what a successful
 * Reflex save is worth, Trapfinding changes what a Search roll may attempt,
 * Timeless Body removes a penalty that has not been applied yet. So each is a
 * situational note on the stat it qualifies, and the two things worth guarding
 * are that it appears on the level the class grants it — not one level early —
 * and that it lands on the right stat and nowhere else.
 */

function make(cls, level) {
  const p = new Player();
  p.name = 'Test';
  p.race = 'Human';
  p.class = cls;
  p.level = level;
  return p;
}

/** The labels reported for one stat, which is what the box actually shows. */
const labels = (p, key) => p.getSituationalContributions(key).map((e) => e.label);

describe('a feature appears on the level that grants it, and not before', () => {
  test.each([
    ['Monk', 'Evasion', 'reflex', 2],
    ['Rogue', 'Evasion', 'reflex', 2],
    ['Ranger', 'Evasion', 'reflex', 9],
    ['Monk', 'Improved Evasion', 'reflex', 9],
    ['Barbarian', 'Uncanny Dodge', 'ac', 2],
    ['Rogue', 'Uncanny Dodge', 'ac', 4],
    ['Druid', 'Venom Immunity', 'fortitude', 9],
    ['Monk', 'Diamond Body', 'fortitude', 11],
    ['Paladin', 'Divine Health', 'fortitude', 3],
    ['Monk', 'Purity of Body', 'fortitude', 5],
    ['Paladin', 'Aura of Courage', 'will', 3],
    ['Druid', 'Woodland Stride', 'speed', 2],
    ['Ranger', 'Woodland Stride', 'speed', 7],
    ['Druid', 'Trackless Step', 'speed', 3],
    ['Druid', 'Timeless Body', 'con', 15],
    ['Monk', 'Timeless Body', 'con', 17],
  ])('%s: %s on %s at level %i', (cls, label, statKey, at) => {
    expect(labels(make(cls, at - 1), statKey)).not.toContain(label);
    expect(labels(make(cls, at), statKey)).toContain(label);
    expect(labels(make(cls, 20), statKey)).toContain(label);
  });
});

describe('each one lands on its own stat and no other', () => {
  test('evasion is a Reflex note, not a Fortitude or Will one', () => {
    const monk = make('Monk', 9);
    expect(labels(monk, 'reflex')).toContain('Evasion');
    expect(labels(monk, 'fortitude')).not.toContain('Evasion');
    expect(labels(monk, 'will')).not.toContain('Evasion');
  });

  test('uncanny dodge is an AC note, and is not the improved form', () => {
    const barbarian = make('Barbarian', 2);
    expect(labels(barbarian, 'ac')).toContain('Uncanny Dodge');
    expect(labels(barbarian, 'ac')).not.toContain('Improved Uncanny Dodge');
    // The improved form arrives separately at 5th, alongside the plain one.
    expect(labels(make('Barbarian', 5), 'ac')).toEqual(
      expect.arrayContaining(['Uncanny Dodge', 'Improved Uncanny Dodge'])
    );
  });

  test('timeless body spares the physical scores only', () => {
    const druid = make('Druid', 15);
    ['str', 'dex', 'con'].forEach((key) => {
      expect(labels(druid, key)).toContain('Timeless Body');
    });
    ['int', 'wis', 'cha'].forEach((key) => {
      expect(labels(druid, key)).not.toContain('Timeless Body');
    });
  });

  test('a fighter of the same level reports none of them', () => {
    const fighter = make('Fighter', 20);
    const never = ['Evasion', 'Uncanny Dodge', 'Venom Immunity', 'Aura of Courage',
      'Woodland Stride', 'Timeless Body'];
    ['reflex', 'ac', 'fortitude', 'will', 'speed', 'con'].forEach((key) => {
      const found = labels(fighter, key);
      never.forEach((label) => expect(found).not.toContain(label));
    });
  });
});

describe('skill notes reach the skill the feature qualifies', () => {
  test('trapfinding reaches Search and Disable Device, saying something different on each', () => {
    const rogue = make('Rogue', 1);
    const search = rogue.getSituationalContributions('skill:Search');
    const disable = rogue.getSituationalContributions('skill:Disable device');
    expect(search.map((e) => e.label)).toContain('Trapfinding');
    expect(disable.map((e) => e.label)).toContain('Trapfinding');
    expect(search.find((e) => e.label === 'Trapfinding').note)
      .not.toBe(disable.find((e) => e.label === 'Trapfinding').note);
    // It is a Search and Disable Device ability; Hide knows nothing of it.
    expect(labels(rogue, 'skill:Hide')).not.toContain('Trapfinding');
  });

  test('the ranger stealth and tracking notes arrive at their own levels', () => {
    expect(labels(make('Ranger', 7), 'skill:Survival')).not.toContain('Swift Tracker');
    expect(labels(make('Ranger', 8), 'skill:Survival')).toContain('Swift Tracker');
    expect(labels(make('Ranger', 12), 'skill:Hide')).not.toContain('Camouflage');
    expect(labels(make('Ranger', 13), 'skill:Hide')).toContain('Camouflage');
    expect(labels(make('Ranger', 16), 'skill:Hide')).not.toContain('Hide in Plain Sight');
    expect(labels(make('Ranger', 17), 'skill:Hide')).toEqual(
      expect.arrayContaining(['Camouflage', 'Hide in Plain Sight'])
    );
  });
});

describe('a rogue special ability is reported once it has been picked', () => {
  test('improved evasion is silent until chosen, then reported on Reflex', () => {
    const rogue = make('Rogue', 10);
    expect(rogue.hasImprovedEvasion()).toBe(false);
    expect(labels(rogue, 'reflex')).not.toContain('Improved Evasion');

    rogue.setRogueSpecialAbility(10, 'Improved Evasion');
    expect(rogue.hasImprovedEvasion()).toBe(true);
    expect(labels(rogue, 'reflex')).toContain('Improved Evasion');
  });

  test('slippery mind is a Will note and defensive roll a Reflex one', () => {
    const rogue = make('Rogue', 13);
    rogue.setRogueSpecialAbility(10, 'Slippery Mind');
    rogue.setRogueSpecialAbility(13, 'Defensive Roll');
    expect(labels(rogue, 'will')).toContain('Slippery Mind');
    expect(labels(rogue, 'reflex')).toContain('Defensive Roll');
    expect(labels(rogue, 'reflex')).not.toContain('Slippery Mind');
  });

  test('the monk has improved evasion without picking anything', () => {
    expect(make('Monk', 9).hasImprovedEvasion()).toBe(true);
    expect(make('Monk', 8).hasImprovedEvasion()).toBe(false);
  });
});

describe('none of it moves a number', () => {
  test('a 20th-level monk carrying every note has unchanged totals', () => {
    const monk = make('Monk', 20);
    const keys = ['reflex', 'fortitude', 'will', 'ac', 'speed', 'str', 'dex', 'con'];
    const everything = keys.flatMap((k) => monk.getSituationalContributions(k));
    expect(everything.length).toBeGreaterThan(5);
    everything.forEach((e) => expect('value' in e).toBe(false));
    expect(sumContributions(everything)).toBe(0);

    expect(sumContributions(monk.getSaveContributions('reflex'))).toBe(monk.getTotalReflexSave());
    expect(sumContributions(monk.getArmorClassContributions())).toBe(monk.getArmorClass());
  });
});

describe('the ranger free feats are granted rather than restated', () => {
  test('Track at 1st and Endurance at 3rd, from the granted-feat table', () => {
    expect(make('Ranger', 1).getGrantedFeats()).toEqual([{ level: 1, feat: 'Track' }]);
    expect(make('Ranger', 2).getGrantedFeats()).toEqual([{ level: 1, feat: 'Track' }]);
    expect(make('Ranger', 3).getGrantedFeats()).toEqual([
      { level: 1, feat: 'Track' },
      { level: 3, feat: 'Endurance' },
    ]);
  });

  test('neither is charged to a feat budget', () => {
    const ranger = make('Ranger', 3);
    expect(ranger.getFeats()).toEqual([]);
    expect(ranger.getGeneralFeatsUsed()).toBe(0);
  });
});

describe('favored enemy reaches the skills it applies to', () => {
  function ranger() {
    const p = make('Ranger', 10);
    p.addFavoredEnemy('Giant');
    p.addFavoredEnemy('Humanoid', 'Orc');
    p.raiseFavoredEnemy(0);
    return p;
  }

  test('the five listed skills carry a note, and others do not', () => {
    const p = ranger();
    ['skill:Bluff', 'skill:Listen', 'skill:Sense motive', 'skill:Spot', 'skill:Survival']
      .forEach((key) => expect(labels(p, key)).toContain('Favored enemy'));
    ['skill:Hide', 'skill:Climb', 'skill:Search']
      .forEach((key) => expect(labels(p, key)).not.toContain('Favored enemy'));
  });

  test('each chosen enemy is named with its own bonus', () => {
    const notes = ranger().getSituationalContributions('skill:Spot')
      .filter((e) => e.label === 'Favored enemy')
      .map((e) => e.note);
    expect(notes).toEqual(['+4 against giant', '+2 against humanoid (orc)']);
  });

  test('a ranger who has chosen none reports none', () => {
    expect(labels(make('Ranger', 10), 'skill:Spot')).not.toContain('Favored enemy');
  });
});

describe('the at-will spell-like features that qualify a skill', () => {
  test('a thousand faces reaches Disguise from 13th, and nothing else', () => {
    expect(labels(make('Druid', 12), 'skill:Disguise')).not.toContain('A Thousand Faces');
    expect(labels(make('Druid', 13), 'skill:Disguise')).toContain('A Thousand Faces');
    expect(labels(make('Druid', 20), 'skill:Hide')).not.toContain('A Thousand Faces');
    expect(labels(make('Bard', 20), 'skill:Disguise')).not.toContain('A Thousand Faces');
  });

  test('detect evil is the paladin’s from 1st and nobody else’s', () => {
    expect(make('Paladin', 1).hasDetectEvil()).toBe(true);
    expect(make('Paladin', 20).hasDetectEvil()).toBe(true);
    ['Cleric', 'Fighter', 'Druid'].forEach((cls) => {
      expect(make(cls, 20).hasDetectEvil()).toBe(false);
    });
  });
});
