import Player from './player';
import SpecialMount from './specialMount';

/** A paladin of the given level and size, with a mount already called. */
function paladin(level, size = 'Medium') {
  const p = new Player('Sir Tester');
  p.setClass('Paladin');
  p.setLevel(level);
  // Race drives size; override directly so the test does not depend on which
  // race happens to be Small in races.json.
  p.getSize = () => size;
  return p;
}

function mounted(level, size = 'Medium') {
  const p = paladin(level, size);
  p.addSpecialMount();
  return { player: p, mount: p.getSpecialMount() };
}

describe('who gets a special mount', () => {
  test('only the paladin, and only from 5th level', () => {
    expect(paladin(1).getSpecialMountLevel()).toBe(5);
    expect(paladin(4).canHaveSpecialMount()).toBe(false);
    expect(paladin(5).canHaveSpecialMount()).toBe(true);
    expect(paladin(20).canHaveSpecialMount()).toBe(true);
  });

  test('other classes grant none and cannot call one', () => {
    const p = new Player('Nobody');
    p.setClass('Fighter');
    p.setLevel(20);
    expect(p.getSpecialMountLevel()).toBe(0);
    expect(p.canHaveSpecialMount()).toBe(false);
    expect(p.addSpecialMount()).toBeNull();
    expect(p.getSpecialMount()).toBeNull();
  });

  test('calling twice keeps the same mount rather than replacing it', () => {
    const p = paladin(10);
    const first = p.addSpecialMount();
    first.setName('Bayard');
    expect(p.addSpecialMount()).toBe(first);
    expect(p.getSpecialMount().getName()).toBe('Bayard');
  });

  test('releasing clears it', () => {
    const p = paladin(10);
    p.addSpecialMount();
    p.removeSpecialMount();
    expect(p.getSpecialMount()).toBeNull();
  });
});

describe('which creature the mount is', () => {
  test('a Medium paladin rides a heavy warhorse', () => {
    const { mount } = mounted(5, 'Medium');
    expect(mount.getRef()).toBe('animals/warhorse-heavy');
    expect(mount.getName()).toBe('Warhorse, Heavy');
  });

  test('a Small paladin rides a war pony', () => {
    const { mount } = mounted(5, 'Small');
    expect(mount.getRef()).toBe('animals/pony-war');
    expect(mount.getName()).toBe('Pony, War');
  });

  test('any other size falls back to the Medium mount', () => {
    const { mount } = mounted(5, 'Large');
    expect(mount.getRef()).toBe('animals/warhorse-heavy');
  });

  test('it is a magical beast once bonded, not an animal', () => {
    const { mount } = mounted(5);
    expect(mount.getType()).toBe('Magical beast');
  });

  test('a custom name overrides the creature name', () => {
    const { mount } = mounted(5);
    mount.setName('Bayard');
    expect(mount.getName()).toBe('Bayard');
  });
});

describe('advancement by paladin level', () => {
  const rows = [
    { level: 5, bonusHD: 2, na: 4, str: 1, int: 6 },
    { level: 7, bonusHD: 2, na: 4, str: 1, int: 6 },
    { level: 8, bonusHD: 4, na: 6, str: 2, int: 7 },
    { level: 10, bonusHD: 4, na: 6, str: 2, int: 7 },
    { level: 11, bonusHD: 6, na: 8, str: 3, int: 8 },
    { level: 14, bonusHD: 6, na: 8, str: 3, int: 8 },
    { level: 15, bonusHD: 8, na: 10, str: 4, int: 9 },
    { level: 20, bonusHD: 8, na: 10, str: 4, int: 9 },
  ];

  test.each(rows)('level $level gives +$bonusHD HD, +$na natural armor, +$str Str, Int $int',
    ({ level, bonusHD, na, str, int }) => {
      const { mount } = mounted(level);
      expect(mount.getBonusHD()).toBe(bonusHD);
      expect(mount.getNaturalArmorAdj()).toBe(na);
      expect(mount.getStrAdj()).toBe(str);
      expect(mount.getIntelligence()).toBe(int);
    });

  test('total HD is the base creature plus the bonus dice', () => {
    // Heavy warhorse is 4 HD before advancement.
    expect(mounted(5).mount.getTotalHD()).toBe(6);
    expect(mounted(20).mount.getTotalHD()).toBe(12);
  });

  test('special abilities accumulate rather than replacing each other', () => {
    expect(mounted(5).mount.getSpecialAbilities()).toEqual([
      'Empathic link', 'Improved evasion', 'Share spells', 'Share saving throws',
    ]);
    const late = mounted(15).mount.getSpecialAbilities();
    expect(late).toContain('Empathic link');       // still there from the 5th row
    expect(late).toContain('Improved speed');      // 8th
    expect(late).toContain('Spell resistance');    // 11th
  });

  test('natural armor raises full and flat-footed AC but not touch', () => {
    // Heavy warhorse: AC 14, touch 10, flat-footed 13.
    const early = mounted(5).mount;
    expect(early.getArmorClass()).toBe(18);   // 14 + 4
    expect(early.getContactAC()).toBe(10);    // unchanged
    expect(early.getFlatFootedAC()).toBe(17); // 13 + 4
  });

  test('improved speed only applies once the 8th-level row is reached', () => {
    // Heavy warhorse moves 50 ft; improved speed adds 10.
    expect(mounted(7).mount.getSpeed()).toBe(50);
    expect(mounted(8).mount.getSpeed()).toBe(60);
  });

  test('spell resistance is level + 5, and zero before it is granted', () => {
    expect(mounted(10).mount.getSpellResistance()).toBe(0);
    expect(mounted(11).mount.getSpellResistance()).toBe(16);
    expect(mounted(20).mount.getSpellResistance()).toBe(25);
  });

  test('bonus hit dice raise BAB and the good saves', () => {
    const early = mounted(5).mount;   // 6 HD
    const late = mounted(20).mount;   // 12 HD
    expect(early.getBaseAttackBonus()).toBe(4);
    expect(late.getBaseAttackBonus()).toBe(9);
    expect(late.getFortSave()).toBeGreaterThan(early.getFortSave());
    expect(late.getReflexSave()).toBeGreaterThan(early.getReflexSave());
  });

  test('Will is not improved by advancement', () => {
    expect(mounted(20).mount.getWillSave()).toBe(mounted(5).mount.getWillSave());
  });

  test('a mount whose paladin is below 5th has no advancement row at all', () => {
    const orphan = new SpecialMount({ level: 3, size: 'Medium' });
    expect(orphan.getAdvancement()).toBeNull();
    expect(orphan.getBonusHD()).toBe(0);
    expect(orphan.getSpecialAbilities()).toEqual([]);
    expect(orphan.getSpellResistance()).toBe(0);
  });
});

describe('hit points', () => {
  test('the default adds avg d10 plus Con per bonus die', () => {
    // Heavy warhorse: 30 hp, Con 17 (+3). 2 bonus HD → 30 + floor(2*5.5) + 2*3.
    const { mount } = mounted(5);
    expect(mount.getDefaultMaxLife()).toBe(30 + 11 + 6);
    expect(mount.getMaxLife()).toBe(mount.getDefaultMaxLife());
  });

  test('an override replaces the computed value until cleared', () => {
    const { mount } = mounted(5);
    mount.setMaxLife(60);
    expect(mount.getMaxLife()).toBe(60);
    mount.setMaxLife(null);
    expect(mount.getMaxLife()).toBe(mount.getDefaultMaxLife());
  });

  test('current HP is max minus damage, and damage never goes negative', () => {
    const { mount } = mounted(5);
    mount.setDamage(10);
    expect(mount.getCurrentHp()).toBe(mount.getMaxLife() - 10);
    mount.adjustDamage(-50);
    expect(mount.getDamage()).toBe(0);
  });
});

describe('summoning allowance', () => {
  test('the daily pool is two hours per paladin level', () => {
    expect(mounted(5).mount.getSummonHoursMax()).toBe(10);
    expect(mounted(20).mount.getSummonHoursMax()).toBe(40);
  });

  test('spending reduces what is left', () => {
    const { mount } = mounted(5);
    mount.useSummonHours(3);
    expect(mount.getSummonHoursUsed()).toBe(3);
    expect(mount.getSummonHoursRemaining()).toBe(7);
  });

  test('a negative delta gives hours back, floored at zero', () => {
    const { mount } = mounted(5);
    mount.useSummonHours(3);
    mount.useSummonHours(-5);
    expect(mount.getSummonHoursUsed()).toBe(0);
  });

  test('going over the allowance is recorded and flagged, not blocked', () => {
    const { mount } = mounted(5); // 10 hours
    mount.useSummonHours(14);
    expect(mount.getSummonHoursUsed()).toBe(14);
    expect(mount.isSummonOverCap()).toBe(true);
    expect(mount.getSummonHoursRemaining()).toBe(0);
  });

  test('resting clears the allowance along with the other daily pools', () => {
    const { player, mount } = mounted(5);
    mount.useSummonHours(6);
    player.useClassFeature('smiteEvil', 1);
    player.resetClassFeatureUses();
    expect(player.getSpecialMount().getSummonHoursUsed()).toBe(0);
  });
});

describe('persistence', () => {
  test('the mount round-trips through the player serialize/load', () => {
    const { player, mount } = mounted(11);
    mount.setName('Bayard');
    mount.setDamage(7);
    mount.setMaxLife(70);
    mount.useSummonHours(4);
    mount.setStatBonus('willBonus', 2);
    mount.setAttackOverride(0, { bonus: 15, damage: '1d8+9' });

    const revived = new Player().load(player.serialize());
    revived.setClass('Paladin');
    revived.setLevel(11);
    const back = revived.getSpecialMount();

    expect(back).not.toBeNull();
    expect(back.getName()).toBe('Bayard');
    expect(back.getDamage()).toBe(7);
    expect(back.getMaxLife()).toBe(70);
    expect(back.getSummonHoursUsed()).toBe(4);
    expect(back.willBonus).toBe(2);
    expect(back.getAttacks()[0].bonus).toBe(15);
    expect(back.getAttacks()[0].damage).toBe('1d8+9');
  });

  test('an absent mount round-trips as absent', () => {
    const p = paladin(10);
    const revived = new Player().load(p.serialize());
    expect(revived.getSpecialMount()).toBeNull();
  });

  test('serialize omits every default, keeping stored state small', () => {
    const { mount } = mounted(5);
    expect(mount.serialize()).toEqual({});
  });
});
