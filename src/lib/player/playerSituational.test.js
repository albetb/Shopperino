import Player from './player';
import { sumContributions } from './contributions';

/* The situational group is everything the sheet knows about a stat that it must
   not add to that stat. A dwarf's +2 against poison is real and worth reading;
   putting it inside the Fortitude save would be wrong every time the threat is
   not poison.

   The two things worth guarding are that these entries carry no value at all —
   so they cannot be summed even by accident — and that the stat keys line up
   with the contribution methods, since that vocabulary is the socket the
   remaining conditional feats and class features plug into later. */

function make({ race = 'Human', cls = 'Fighter', level = 8 } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = race;
  return p;
}

const notes = (p, key) => p.getSituationalContributions(key).map((e) => `${e.label}: ${e.note}`).join(' | ');

describe('the shape of a situational entry', () => {
  test('carries a note and never a value', () => {
    const entries = make({ race: 'Dwarf' }).getSituationalContributions('fortitude');
    expect(entries.length).toBeGreaterThan(0);
    entries.forEach((e) => {
      expect(typeof e.note).toBe('string');
      expect(e.note.length).toBeGreaterThan(0);
      expect('value' in e).toBe(false);
    });
    // Even concatenated into a contribution list, they add nothing.
    expect(sumContributions(entries)).toBe(0);
  });

  test('an unknown stat key answers nothing rather than throwing', () => {
    expect(make().getSituationalContributions('nonsense')).toEqual([]);
    expect(make().getSituationalContributions('')).toEqual([]);
    expect(make().getSituationalContributions(undefined)).toEqual([]);
  });
});

describe('racial conditionals land on the right stat', () => {
  test('a dwarf reports poison on Fortitude and spells on all three', () => {
    const dwarf = make({ race: 'Dwarf' });
    expect(notes(dwarf, 'fortitude')).toMatch(/poison/i);
    expect(notes(dwarf, 'fortitude')).toMatch(/spells and spell-like/i);
    expect(notes(dwarf, 'will')).toMatch(/spells and spell-like/i);
    expect(notes(dwarf, 'reflex')).toMatch(/spells and spell-like/i);
    // Poison is a Fortitude matter and must not appear on the other two.
    expect(notes(dwarf, 'will')).not.toMatch(/poison/i);
  });

  test('the giant-fighting dodge bonus lands on armor class', () => {
    const dwarf = make({ race: 'Dwarf' });
    expect(notes(dwarf, 'ac')).toMatch(/\+4 dodge bonus against/i);
    expect(notes(dwarf, 'ac')).toMatch(/giant/i);
    // A dodge bonus is lost when flat-footed, so it is not reported there.
    expect(notes(dwarf, 'acFlat')).not.toMatch(/giant/i);
  });

  test('racial attack bonuses land on the attack key', () => {
    expect(notes(make({ race: 'Dwarf' }), 'attack')).toMatch(/orcs/i);
    expect(notes(make({ race: 'Halfling' }), 'attack')).toMatch(/thrown/i);
    expect(make({ race: 'Human' }).getSituationalContributions('attack')).toEqual([]);
  });

  test("a dwarf's conditional skill bonus lands on that skill and no other", () => {
    const dwarf = make({ race: 'Dwarf' });
    expect(notes(dwarf, 'skill:Appraise')).toMatch(/stone or metal/i);
    expect(dwarf.getSituationalContributions('skill:Listen')).toEqual([]);
  });

  test('an elf reports its sleep immunity and its enchantment bonus on Will', () => {
    const elf = make({ race: 'Elf' });
    expect(notes(elf, 'will')).toMatch(/immune to/i);
    expect(notes(elf, 'will')).toMatch(/enchantment/i);
  });

  test('a human reports nothing racial at all', () => {
    const human = make({ race: 'Human' });
    ['fortitude', 'reflex', 'will', 'ac', 'attack'].forEach((key) => {
      expect(human.getSituationalContributions(key)).toEqual([]);
    });
  });
});

describe('conditional class features', () => {
  test('Trap Sense appears at 3rd on both Reflex and armor class, and not before', () => {
    expect(make({ cls: 'Barbarian', level: 2 }).getSituationalContributions('reflex')).toEqual([]);
    const barb = make({ cls: 'Barbarian', level: 3 });
    expect(notes(barb, 'reflex')).toMatch(/Trap Sense: \+1 against traps/);
    expect(notes(barb, 'ac')).toMatch(/Trap Sense: \+1 against traps/);
  });

  test('Trap Sense scales, and the rogue gets the same table', () => {
    expect(notes(make({ cls: 'Barbarian', level: 9 }), 'reflex')).toMatch(/\+3 against traps/);
    expect(notes(make({ cls: 'Rogue', level: 6 }), 'reflex')).toMatch(/\+2 against traps/);
  });

  test('Still Mind is a monk matter from 3rd', () => {
    expect(make({ cls: 'Monk', level: 2 }).getSituationalContributions('will')).toEqual([]);
    expect(notes(make({ cls: 'Monk', level: 3 }), 'will')).toMatch(/Still Mind.*enchantment/);
  });

  test('Indomitable Will arrives at 14th for the barbarian', () => {
    expect(notes(make({ cls: 'Barbarian', level: 13 }), 'will')).not.toMatch(/Indomitable/);
    expect(notes(make({ cls: 'Barbarian', level: 14 }), 'will')).toMatch(/Indomitable Will.*raging/);
  });

  test('Improved Uncanny Dodge is an armor class note', () => {
    expect(notes(make({ cls: 'Rogue', level: 8 }), 'ac')).toMatch(/Cannot be flanked/);
    expect(notes(make({ cls: 'Rogue', level: 7 }), 'ac')).not.toMatch(/flanked/);
  });

  test("Resist Nature's Lure covers all three saves from 4th", () => {
    const druid = make({ cls: 'Druid', level: 4 });
    ['fortitude', 'reflex', 'will'].forEach((key) => {
      expect(notes(druid, key)).toMatch(/fey/i);
    });
    expect(make({ cls: 'Druid', level: 3 }).getSituationalContributions('will')).toEqual([]);
  });
});

describe('caps and reductions that sit outside the total', () => {
  test('an armor Dex cap is reported against armor class', () => {
    const p = make({ cls: 'Fighter', level: 8 });
    p.setAbilityBase('dex', 18);
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(notes(p, 'ac')).toMatch(/caps the Dexterity bonus/i);
  });

  test('no cap is reported when the armor allows the whole modifier', () => {
    const p = make({ cls: 'Fighter', level: 8 });
    p.setAbilityBase('dex', 12);
    p.equipItem('armor', { link: 'items/Armor/leather' });
    expect(notes(p, 'ac')).not.toMatch(/caps the Dexterity/i);
  });

  /* The armor speed reduction moved out of this group: the sheet now shows the
     reduced speed as the speed, so the reduction has to be a counted row the
     breakdown adds up to, not a remark beside a total that disagrees with it. */
  test('the armor speed reduction is a counted row, not a situational note', () => {
    const p = make({ cls: 'Fighter', level: 8 });
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    const info = p.getArmorSpeedInfo();
    expect(info.hasReduction).toBe(true);

    expect(notes(p, 'speed')).not.toMatch(/encumbered/i);
    const rows = p.getSpeedContributions();
    expect(rows.some((r) => /armor and load/i.test(r.label))).toBe(true);
    expect(sumContributions(rows)).toBe(info.reducedSpeed);
  });
});

describe('situational entries never move a number', () => {
  test('a dwarf barbarian with several of them has unchanged totals', () => {
    const plain = make({ race: 'Human', cls: 'Barbarian', level: 9 });
    const laden = make({ race: 'Dwarf', cls: 'Barbarian', level: 9 });
    // The dwarf reports Trap Sense, poison, spells and the giant bonus...
    expect(laden.getSituationalContributions('will').length).toBeGreaterThan(0);
    expect(laden.getSituationalContributions('ac').length).toBeGreaterThan(1);
    // ...and its Will save still differs from the human's only by Wisdom, and
    // its AC only by size, with nothing situational leaking in.
    expect(laden.getTotalWillSave() - plain.getTotalWillSave())
      .toBe(laden.getModifier('wis') - plain.getModifier('wis'));
    expect(sumContributions(laden.getArmorClassContributions())).toBe(laden.getArmorClass());
  });
});
