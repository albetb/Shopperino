import {
  getRacialSkillBonuses,
  getFlatRacialSkillBonus,
  getRacialSaveBonuses,
  getFlatRacialSaveBonus,
  getRacialAttackBonuses,
  getRacialACBonuses,
  getRacialImmunities,
  getRacialIllusionDcBonus,
} from './racialTraits';

/* races.json has carried these for as long as the file has existed and nothing
   has ever read them. The split these tests care about is flat versus
   conditional: an elf's +2 Listen belongs inside the total, a dwarf's +2
   Appraise on stonework does not, and getting that backwards would silently
   inflate every dwarf's skills. */

describe('racial skill bonuses', () => {
  test("the elf's three are flat", () => {
    const bonuses = getRacialSkillBonuses('Elf');
    expect(bonuses.map((b) => b.skill).sort()).toEqual(['Listen', 'Search', 'Spot']);
    expect(bonuses.every((b) => b.flat)).toBe(true);
    expect(bonuses.every((b) => b.bonus === 2)).toBe(true);
  });

  test("the dwarf's two are conditional and carry the condition text", () => {
    const bonuses = getRacialSkillBonuses('Dwarf');
    expect(bonuses.map((b) => b.skill).sort()).toEqual(['Appraise', 'Craft']);
    expect(bonuses.every((b) => b.flat)).toBe(false);
    expect(bonuses.find((b) => b.skill === 'Appraise').condition).toMatch(/stone or metal/i);
  });

  test('the flat lookup answers per skill and ignores the conditional ones', () => {
    expect(getFlatRacialSkillBonus('Elf', 'Listen')).toBe(2);
    expect(getFlatRacialSkillBonus('Half-Elf', 'Listen')).toBe(1);
    expect(getFlatRacialSkillBonus('Half-Elf', 'Diplomacy')).toBe(2);
    expect(getFlatRacialSkillBonus('Halfling', 'Move Silently')).toBe(2);
    // Conditional, so it must not reach the total.
    expect(getFlatRacialSkillBonus('Dwarf', 'Appraise')).toBe(0);
    // A race with no bonus to that skill, and a race with no bonuses at all.
    expect(getFlatRacialSkillBonus('Elf', 'Climb')).toBe(0);
    expect(getFlatRacialSkillBonus('Human', 'Listen')).toBe(0);
  });
});

describe('racial save bonuses', () => {
  test("the halfling's blanket +1 is flat and its fear bonus is not", () => {
    const bonuses = getRacialSaveBonuses('Halfling');
    const all = bonuses.find((b) => b.against === 'all');
    const fear = bonuses.find((b) => b.against === 'fear');
    expect(all).toEqual({ against: 'all', bonus: 1, flat: true });
    expect(fear).toEqual({ against: 'fear', bonus: 2, flat: false });
  });

  test('the flat lookup finds the halfling and nobody else', () => {
    expect(getFlatRacialSaveBonus('Halfling')).toBe(1);
    // The dwarf has +2 against poison and against spells, but neither is flat.
    expect(getFlatRacialSaveBonus('Dwarf')).toBe(0);
    expect(getFlatRacialSaveBonus('Elf')).toBe(0);
    expect(getFlatRacialSaveBonus('Human')).toBe(0);
  });
});

describe('the conditional-only categories', () => {
  test('attack bonuses name what they apply against', () => {
    const dwarf = getRacialAttackBonuses('Dwarf');
    expect(dwarf).toHaveLength(1);
    expect(dwarf[0].bonus).toBe(1);
    expect(dwarf[0].against).toMatch(/orcs/i);
    expect(getRacialAttackBonuses('Human')).toEqual([]);
  });

  test('the giant-fighting dodge bonus carries its bonus type', () => {
    const gnome = getRacialACBonuses('Gnome');
    expect(gnome).toHaveLength(1);
    expect(gnome[0].bonus).toBe(4);
    expect(gnome[0].type).toBe('dodge');
    expect(gnome[0].against).toMatch(/giant/i);
  });

  test('immunities are listed for the two races that have them', () => {
    expect(getRacialImmunities('Elf').join(' ')).toMatch(/sleep/i);
    expect(getRacialImmunities('Half-Elf').join(' ')).toMatch(/sleep/i);
    expect(getRacialImmunities('Dwarf')).toEqual([]);
  });
});

describe('the gnome illusion save DC bonus', () => {
  test('is one for the gnome and zero for everyone else', () => {
    expect(getRacialIllusionDcBonus('Gnome')).toBe(1);
    ['Human', 'Dwarf', 'Elf', 'Half-Elf', 'Half-Orc', 'Halfling'].forEach((race) => {
      expect(getRacialIllusionDcBonus(race)).toBe(0);
    });
  });

  test('an unknown race answers zero rather than throwing', () => {
    expect(getRacialIllusionDcBonus('Tiefling')).toBe(0);
    expect(getRacialSkillBonuses('Tiefling')).toEqual([]);
    expect(getFlatRacialSaveBonus(undefined)).toBe(0);
  });
});
