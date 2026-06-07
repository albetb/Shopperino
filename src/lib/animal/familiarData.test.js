import {
  getFamiliarSpecies,
  getFamiliarBonus,
  getFamiliarAdvancement,
  isFamiliarSpecies,
} from './familiarData';
import { getAnimalBaseByRef } from './animalsUtils';

describe('getFamiliarSpecies', () => {
  const species = getFamiliarSpecies();

  test('returns the 10 fixed species, each resolving to a real animals.json block', () => {
    expect(species).toHaveLength(10);
    species.forEach((s) => {
      expect(getAnimalBaseByRef(s.ref)).toBeTruthy();
    });
  });

  test('labels include the per-species bonus descriptor', () => {
    const byRef = Object.fromEntries(species.map((s) => [s.ref, s.label]));
    expect(byRef['animals/bat']).toBe('Bat (+3 listen)');
    expect(byRef['animals/toad']).toBe('Toad (+3 hit points)');
    expect(byRef['animals/weasel']).toBe('Weasel (+2 reflex)');
    expect(byRef['animals/rat']).toBe('Rat (+2 fort)');
  });
});

describe('getFamiliarBonus', () => {
  test('toad is a flat +3 hp bonus', () => {
    expect(getFamiliarBonus('animals/toad')).toMatchObject({ kind: 'hp', value: 3 });
  });
  test('weasel is a +2 Reflex save bonus (rules-correct, not +3)', () => {
    expect(getFamiliarBonus('animals/weasel')).toMatchObject({ kind: 'save', target: 'reflex', value: 2 });
  });
  test('rat is a +2 Fortitude save bonus', () => {
    expect(getFamiliarBonus('animals/rat')).toMatchObject({ kind: 'save', target: 'fort', value: 2 });
  });
  test('cat is a +3 Move Silently skill bonus', () => {
    expect(getFamiliarBonus('animals/cat')).toMatchObject({ kind: 'skill', target: 'Move Silently', value: 3 });
  });
  test('hawk and owl Spot bonuses carry a condition', () => {
    expect(getFamiliarBonus('animals/hawk').condition).toBeTruthy();
    expect(getFamiliarBonus('animals/owl').condition).toBeTruthy();
  });
  test('unknown ref returns null', () => {
    expect(getFamiliarBonus('animals/wolf')).toBeNull();
  });
});

describe('getFamiliarAdvancement', () => {
  test('level 1: +1 natural armor, Int 6, the four L1 specials', () => {
    const adv = getFamiliarAdvancement(1);
    expect(adv.naturalArmorAdj).toBe(1);
    expect(adv.int).toBe(6);
    expect(adv.specials).toEqual(expect.arrayContaining(['Alertness', 'Improved Evasion', 'Share Spells', 'Empathic Link']));
    expect(adv.specials).not.toContain('Deliver Touch Spells');
  });

  test('level 13: +7 natural armor, Int 12, cumulative up to Scry on Familiar', () => {
    const adv = getFamiliarAdvancement(13);
    expect(adv.naturalArmorAdj).toBe(7);
    expect(adv.int).toBe(12);
    expect(adv.specials).toEqual(expect.arrayContaining([
      'Alertness', 'Deliver Touch Spells', 'Speak with Master',
      'Speak with Animals of Its Kind', 'Spell Resistance', 'Scry on Familiar',
    ]));
  });

  test('level 20: +10 natural armor, Int 15', () => {
    const adv = getFamiliarAdvancement(20);
    expect(adv.naturalArmorAdj).toBe(10);
    expect(adv.int).toBe(15);
  });
});

describe('isFamiliarSpecies', () => {
  test('recognizes familiar species and rejects others', () => {
    expect(isFamiliarSpecies('animals/toad')).toBe(true);
    expect(isFamiliarSpecies('animals/wolf')).toBe(false);
  });
});
