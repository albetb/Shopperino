import {
  effectiveCompanionLevel,
  getCompanionAdjustment,
  getSelectableCompanions,
  getCompanionAdvancement,
} from './animalCompanionData';
import { getAnimalBaseByRef, listAnimals } from './animalsUtils';

describe('effectiveCompanionLevel', () => {
  test('druid uses class level directly', () => {
    expect(effectiveCompanionLevel({ class: 'Druid', level: 9 })).toBe(9);
  });
  test('ranger uses floor(level / 2); first companion at L4 → 2', () => {
    expect(effectiveCompanionLevel({ class: 'Ranger', level: 4 })).toBe(2);
    expect(effectiveCompanionLevel({ class: 'Ranger', level: 3 })).toBe(1);
    expect(effectiveCompanionLevel({ class: 'Ranger', level: 7 })).toBe(3);
  });
  test('other classes and missing input → 0', () => {
    expect(effectiveCompanionLevel({ class: 'Fighter', level: 20 })).toBe(0);
    expect(effectiveCompanionLevel()).toBe(0);
  });
});

describe('getCompanionAdjustment', () => {
  test('standard-list creatures have adjustment 0', () => {
    expect(getCompanionAdjustment('animals/wolf')).toBe(0);
  });
  test('crocodile is on the −3 list (and not the standard list)', () => {
    expect(getCompanionAdjustment('animals/crocodile')).toBe(-3);
  });
  test('unknown ref returns null', () => {
    expect(getCompanionAdjustment('animals/nope')).toBeNull();
  });
});

describe('getSelectableCompanions', () => {
  test('at effective level 1 only standard-list creatures appear', () => {
    const refs = getSelectableCompanions(1).map((c) => c.ref);
    expect(refs).toContain('animals/wolf');
    // No alternative-list (−3 or lower) creature is selectable yet.
    expect(refs).not.toContain('animals/crocodile');
    expect(refs).not.toContain('animals/lion');
    expect(refs).not.toContain('animals/dire-tiger');
    // Every selectable creature has adjustment 0 at level 1.
    expect(getSelectableCompanions(1).every((c) => c.adjustment === 0)).toBe(true);
  });

  test('at effective level 4 the crocodile is selectable with a -3 label', () => {
    const croc = getSelectableCompanions(4).find((c) => c.ref === 'animals/crocodile');
    expect(croc).toBeTruthy();
    expect(croc.label).toContain('-3');
    expect(croc.requiredLevel).toBe(4);
  });

  test('dinosaurs never appear (not in animals.json)', () => {
    const labels = getSelectableCompanions(20).map((c) => `${c.ref} ${c.label}`).join(' | ');
    expect(labels.toLowerCase()).not.toMatch(/dinosaur|deinonychus|elasmosaurus|megaraptor|triceratops|tyrannosaurus/);
  });

  test('every selectable ref resolves to a real animals.json block', () => {
    getSelectableCompanions(20).forEach((c) => {
      expect(getAnimalBaseByRef(c.ref)).toBeTruthy();
    });
  });
});

describe('getCompanionAdvancement', () => {
  test('level 9 band: +6 HD, +6 natural armor, +3 Str/Dex, 4 tricks, Multiattack', () => {
    const adv = getCompanionAdvancement(9);
    expect(adv.bonusHD).toBe(6);
    expect(adv.naturalArmorAdj).toBe(6);
    expect(adv.abilityAdj).toBe(3);
    expect(adv.bonusTricks).toBe(4);
    expect(adv.specials).toEqual(expect.arrayContaining(['Link', 'Share spells', 'Evasion', 'Devotion', 'Multiattack']));
    expect(adv.specials).not.toContain('Improved evasion');
  });

  test('level 1 band: no bonuses, Link + Share spells only', () => {
    const adv = getCompanionAdvancement(1);
    expect(adv.bonusHD).toBe(0);
    expect(adv.bonusTricks).toBe(1);
    expect(adv.specials).toEqual(['Link', 'Share spells']);
  });

  test('below level 1 returns the empty band', () => {
    expect(getCompanionAdvancement(0)).toEqual({
      bonusHD: 0, naturalArmorAdj: 0, abilityAdj: 0, bonusTricks: 0, specials: [],
    });
  });
});

describe('listAnimals / getAnimalBaseByRef', () => {
  test('listAnimals returns the full set and wolf is present', () => {
    const all = listAnimals();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(60);
  });
  test('getAnimalBaseByRef returns the wolf block', () => {
    const wolf = getAnimalBaseByRef('animals/wolf');
    expect(wolf?.name).toBe('Wolf');
    expect(wolf?.hitDice?.count).toBe(2);
  });
  test('getAnimalBaseByRef returns null for an unknown ref', () => {
    expect(getAnimalBaseByRef('animals/nope')).toBeNull();
  });
});
