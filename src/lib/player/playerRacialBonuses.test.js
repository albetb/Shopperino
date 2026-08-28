import Player from './player';

/* Fifteen flat racial bonuses were described in races.json and applied nowhere:
   an elf was missing +2 on Listen, Search and Spot, a halfling +1 on every
   saving throw. These check they now land, and — the half that is easier to get
   wrong — that the conditional ones still do not. */

function make({ race = 'Human', cls = 'Fighter', level = 6 } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = race;
  return p;
}

/* Compare against a Human, who has no racial skill or save bonuses at all, so
   the difference is exactly the racial contribution and nothing else. Ability
   modifiers differ by race, so each comparison uses a skill whose key ability
   the two races modify identically, or reads the delta rather than the total. */
function skillDelta(race, skill) {
  return make({ race }).getSkillTotal(skill) - make({ race: 'Human' }).getSkillTotal(skill);
}

describe('flat racial skill bonuses reach the total', () => {
  test('an elf gains its three', () => {
    // Elf is +2 Dex / -2 Con; Listen, Search and Spot key off Wis, Int and Wis,
    // none of which an elf modifies, so the delta is purely racial.
    expect(skillDelta('Elf', 'Listen')).toBe(2);
    expect(skillDelta('Elf', 'Search')).toBe(2);
    expect(skillDelta('Elf', 'Spot')).toBe(2);
  });

  test('a half-elf gains its five, at the two different sizes', () => {
    expect(skillDelta('Half-Elf', 'Listen')).toBe(1);
    expect(skillDelta('Half-Elf', 'Search')).toBe(1);
    expect(skillDelta('Half-Elf', 'Spot')).toBe(1);
    expect(skillDelta('Half-Elf', 'Diplomacy')).toBe(2);
    expect(skillDelta('Half-Elf', 'Gather Information')).toBe(2);
  });

  test('a halfling gains its four', () => {
    expect(skillDelta('Halfling', 'Move Silently')).toBe(2);
    expect(skillDelta('Halfling', 'Listen')).toBe(2);
  });

  test('a gnome gains its Listen bonus', () => {
    expect(skillDelta('Gnome', 'Listen')).toBe(2);
  });

  test('a skill the race says nothing about is untouched', () => {
    expect(skillDelta('Elf', 'Climb')).toBe(0);
    expect(skillDelta('Elf', 'Diplomacy')).toBe(0);
  });
});

describe("conditional racial bonuses stay out of the numbers", () => {
  test("a dwarf's Appraise is unchanged, because its bonus is stonework only", () => {
    expect(skillDelta('Dwarf', 'Appraise')).toBe(0);
    expect(skillDelta('Dwarf', 'Craft')).toBe(0);
  });

  test("a dwarf's saves gain nothing from its poison and spell bonuses", () => {
    const dwarf = make({ race: 'Dwarf' });
    const human = make({ race: 'Human' });
    // Dwarf is +2 Con, so Fortitude differs by exactly the Con modifier and
    // nothing more — no +2 from the conditional poison entry.
    expect(dwarf.getTotalFortitudeSave() - human.getTotalFortitudeSave())
      .toBe(dwarf.getModifier('con') - human.getModifier('con'));
    expect(dwarf.getTotalWillSave() - human.getTotalWillSave())
      .toBe(dwarf.getModifier('wis') - human.getModifier('wis'));
  });

  test("an elf's saves gain nothing from its enchantment bonus", () => {
    const elf = make({ race: 'Elf' });
    const human = make({ race: 'Human' });
    expect(elf.getTotalWillSave() - human.getTotalWillSave())
      .toBe(elf.getModifier('wis') - human.getModifier('wis'));
  });
});

describe("the halfling's blanket +1 to every save", () => {
  test('lands on all three', () => {
    const halfling = make({ race: 'Halfling' });
    const human = make({ race: 'Human' });
    // Halfling is +2 Dex / -2 Str, so Reflex also moves by its Dex modifier.
    expect(halfling.getTotalFortitudeSave() - human.getTotalFortitudeSave()).toBe(1);
    expect(halfling.getTotalReflexSave() - human.getTotalReflexSave())
      .toBe(1 + halfling.getModifier('dex') - human.getModifier('dex'));
    expect(halfling.getTotalWillSave() - human.getTotalWillSave()).toBe(1);
  });

  test('and no other race gets one', () => {
    expect(make({ race: 'Elf' }).getFlatRacialSaveBonus()).toBe(0);
    expect(make({ race: 'Dwarf' }).getFlatRacialSaveBonus()).toBe(0);
    expect(make({ race: 'Halfling' }).getFlatRacialSaveBonus()).toBe(1);
  });
});

describe("the gnome's illusion save DC", () => {
  test('is one higher than another school of the same level', () => {
    const gnome = make({ race: 'Gnome', cls: 'Wizard' });
    gnome.setAbilityBase('int', 16);
    expect(gnome.getSpellSaveDC(3, 'Illusion (Figment)'))
      .toBe(gnome.getSpellSaveDC(3, 'Evocation') + 1);
  });

  test('another race sees no difference between the two schools', () => {
    const human = make({ race: 'Human', cls: 'Wizard' });
    human.setAbilityBase('int', 16);
    expect(human.getSpellSaveDC(3, 'Illusion (Figment)'))
      .toBe(human.getSpellSaveDC(3, 'Evocation'));
  });

  test('it stacks with Spell Focus in illusion', () => {
    const plain = make({ race: 'Gnome', cls: 'Wizard' });
    plain.setAbilityBase('int', 16);
    const focused = make({ race: 'Gnome', cls: 'Wizard' });
    focused.setAbilityBase('int', 16);
    focused.feats = ['Spell focus (Illusion)'];
    expect(focused.getSpellSaveDC(2, 'Illusion')).toBe(plain.getSpellSaveDC(2, 'Illusion') + 1);
  });
});
