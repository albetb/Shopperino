import { getClassFeatureCards } from './class_feature_cards';

const keysFor = (cls, level) => getClassFeatureCards(cls, level).map((c) => c.key);

describe('class feature card registry', () => {
  test('druids get an animal companion at any level', () => {
    expect(keysFor('Druid', 1)).toEqual(['animalCompanion']);
    expect(keysFor('Druid', 20)).toEqual(['animalCompanion']);
  });

  test('rangers only get an animal companion from level 4', () => {
    expect(keysFor('Ranger', 3)).toEqual([]);
    expect(keysFor('Ranger', 4)).toEqual(['animalCompanion']);
    expect(keysFor('Ranger', 20)).toEqual(['animalCompanion']);
  });

  test('wizards and sorcerers get a familiar', () => {
    expect(keysFor('Wizard', 1)).toEqual(['familiar']);
    expect(keysFor('Sorcerer', 1)).toEqual(['familiar']);
  });

  test('every registered entry carries a renderable component', () => {
    ['Druid', 'Ranger', 'Wizard', 'Sorcerer'].forEach((cls) => {
      getClassFeatureCards(cls, 20).forEach((entry) => {
        expect(typeof entry.Component).toBe('function');
        expect(typeof entry.key).toBe('string');
      });
    });
  });

  test('classes with no registered cards render nothing', () => {
    ['Fighter', 'Barbarian', 'Rogue', 'Monk', 'Bard', 'Cleric', 'Paladin'].forEach((cls) => {
      expect(getClassFeatureCards(cls, 20)).toEqual([]);
    });
  });

  test('unknown classes and missing levels are handled without throwing', () => {
    expect(getClassFeatureCards('Nonexistent', 10)).toEqual([]);
    expect(getClassFeatureCards('', 10)).toEqual([]);
    expect(getClassFeatureCards(undefined, undefined)).toEqual([]);
    expect(keysFor('Druid', undefined)).toEqual(['animalCompanion']);
  });
});
