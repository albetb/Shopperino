import { getClassFeatureCards } from './class_feature_cards';

const keysFor = (cls, level) => getClassFeatureCards(cls, level).map((c) => c.key);

describe('class feature card registry', () => {
  test('druids get an animal companion at any level', () => {
    expect(keysFor('Druid', 1)).toEqual(['animalCompanion']);
    expect(keysFor('Druid', 20)).toEqual(['animalCompanion']);
  });

  test('ranger cards arrive one at a time, each at its own level', () => {
    expect(keysFor('Ranger', 1)).toEqual(['favoredEnemy']);
    expect(keysFor('Ranger', 2)).toEqual(['favoredEnemy', 'combatStyle']);
    expect(keysFor('Ranger', 4)).toEqual(['favoredEnemy', 'combatStyle', 'animalCompanion']);
    expect(keysFor('Ranger', 20)).toEqual(['favoredEnemy', 'combatStyle', 'animalCompanion']);
  });

  test('wizards and sorcerers get a familiar', () => {
    expect(keysFor('Wizard', 1)).toEqual(['familiar']);
    expect(keysFor('Sorcerer', 1)).toEqual(['familiar']);
  });

  test('barbarians get a rage card at any level', () => {
    expect(keysFor('Barbarian', 1)).toEqual(['rage']);
    expect(keysFor('Barbarian', 20)).toEqual(['rage']);
  });

  test('clerics turn undead and see their domains at any level', () => {
    expect(keysFor('Cleric', 1)).toEqual(['turnUndead', 'domains']);
    expect(keysFor('Cleric', 20)).toEqual(['turnUndead', 'domains']);
  });

  test('paladin cards arrive one at a time, each at its own level', () => {
    expect(keysFor('Paladin', 1)).toEqual(['smiteEvil']);
    expect(keysFor('Paladin', 2)).toEqual(['smiteEvil', 'layOnHands']);
    expect(keysFor('Paladin', 3)).toEqual(['smiteEvil', 'layOnHands']);
    expect(keysFor('Paladin', 4)).toEqual(['smiteEvil', 'layOnHands', 'turnUndead']);
    expect(keysFor('Paladin', 5)).toEqual(['smiteEvil', 'layOnHands', 'turnUndead', 'specialMount']);
    expect(keysFor('Paladin', 6))
      .toEqual(['smiteEvil', 'layOnHands', 'turnUndead', 'specialMount', 'removeDisease']);
  });

  test('monks get stunning fist at once and wholeness of body from 7th', () => {
    expect(keysFor('Monk', 1)).toEqual(['stunningFist']);
    expect(keysFor('Monk', 6)).toEqual(['stunningFist']);
    expect(keysFor('Monk', 7)).toEqual(['stunningFist', 'wholenessOfBody']);
  });

  test('bards get bardic music at any level', () => {
    expect(keysFor('Bard', 1)).toEqual(['bardicMusic']);
    expect(keysFor('Bard', 20)).toEqual(['bardicMusic']);
  });

  test('every registered entry carries a renderable component', () => {
    ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Monk', 'Paladin', 'Ranger', 'Wizard', 'Sorcerer'].forEach((cls) => {
      getClassFeatureCards(cls, 20).forEach((entry) => {
        expect(typeof entry.Component).toBe('function');
        expect(typeof entry.key).toBe('string');
      });
    });
  });

  test('classes with no registered cards render nothing', () => {
    ['Fighter', 'Rogue'].forEach((cls) => {
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
