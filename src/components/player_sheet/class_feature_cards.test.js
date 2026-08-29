import Player from '../../lib/player';
import { getClassFeatureCards, getFeatFeatureCards } from './class_feature_cards';

const keysFor = (cls, level) => getClassFeatureCards(cls, level).map((c) => c.key);

describe('class feature card registry', () => {
  test('druids get an animal companion at any level, wild shape at 5th, elemental at 16th', () => {
    expect(keysFor('Druid', 1)).toEqual(['animalCompanion']);
    expect(keysFor('Druid', 4)).toEqual(['animalCompanion']);
    // The companion leads: it is a creature in the fight, while the shape lists
    // are a reference consulted only when changing form.
    expect(keysFor('Druid', 5)).toEqual(['animalCompanion', 'wildShape']);
    expect(keysFor('Druid', 15)).toEqual(['animalCompanion', 'wildShape']);
    expect(keysFor('Druid', 16)).toEqual(['animalCompanion', 'wildShape', 'elementalWildShape']);
    expect(keysFor('Druid', 20)).toEqual(['animalCompanion', 'wildShape', 'elementalWildShape']);
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

  test('monks pick bonus feats from the start and start spending at 7th', () => {
    // Stunning fist is absent here on purpose: it follows the feat, not the
    // class, so it comes from getFeatFeatureCards and only once actually taken.
    expect(keysFor('Monk', 1)).toEqual(['monkBonusFeats']);
    expect(keysFor('Monk', 6)).toEqual(['monkBonusFeats']);
    // Wholeness of body arrives at 7th and shares the counters card with the
    // three abilities that follow it, rather than taking one of its own.
    expect(keysFor('Monk', 7)).toEqual(['monkBonusFeats', 'monkAbilities']);
    expect(keysFor('Monk', 12)).toEqual(['monkBonusFeats', 'monkAbilities']);
    expect(keysFor('Monk', 20)).toEqual(['monkBonusFeats', 'monkAbilities']);
  });

  test('rogues get a special-ability card only from 10th', () => {
    expect(keysFor('Rogue', 1)).toEqual([]);
    expect(keysFor('Rogue', 9)).toEqual([]);
    expect(keysFor('Rogue', 10)).toEqual(['rogueSpecialAbilities']);
    expect(keysFor('Rogue', 20)).toEqual(['rogueSpecialAbilities']);
  });

  test('bards get bardic music at any level', () => {
    expect(keysFor('Bard', 1)).toEqual(['bardicMusic']);
    expect(keysFor('Bard', 20)).toEqual(['bardicMusic']);
  });

  test('every registered entry carries a renderable component', () => {
    ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Wizard', 'Sorcerer'].forEach((cls) => {
      getClassFeatureCards(cls, 20).forEach((entry) => {
        expect(typeof entry.Component).toBe('function');
        expect(typeof entry.key).toBe('string');
      });
    });
  });

  test('classes with no registered cards render nothing', () => {
    // The fighter's whole feature set is bonus feats, which live in the
    // Feats tab rather than on a card of their own.
    expect(getClassFeatureCards('Fighter', 20)).toEqual([]);
  });

  test('unknown classes and missing levels are handled without throwing', () => {
    expect(getClassFeatureCards('Nonexistent', 10)).toEqual([]);
    expect(getClassFeatureCards('', 10)).toEqual([]);
    expect(getClassFeatureCards(undefined, undefined)).toEqual([]);
    expect(keysFor('Druid', undefined)).toEqual(['animalCompanion']);
  });
});

/* Stunning Fist is a general feat that a monk may take as a bonus feat and
   anyone else may spend an ordinary feat on. The card has to follow the feat,
   which is what the second registry is for. */
describe('feat-granted cards', () => {
  const make = (cls, level) => {
    const p = new Player();
    p.setRace('Human');
    p.setClass(cls);
    p.setLevel(level);
    return p;
  };
  const featKeys = (player) => getFeatFeatureCards(player).map((c) => c.key);

  test('nobody gets the card without the feat', () => {
    expect(featKeys(make('Monk', 20))).toEqual([]);
    expect(featKeys(make('Fighter', 20))).toEqual([]);
  });

  test('a fighter who spends a feat on it gets the card', () => {
    const fighter = make('Fighter', 12);
    fighter.addFeat('Stunning Fist');
    expect(featKeys(fighter)).toEqual(['stunningFist']);
  });

  test('a monk who takes it as a bonus feat gets the same card', () => {
    const monk = make('Monk', 6);
    monk.setMonkBonusFeat(1, 'Stunning Fist');
    expect(featKeys(monk)).toEqual(['stunningFist']);
  });

  test('a null player asks for nothing rather than throwing', () => {
    expect(getFeatFeatureCards(null)).toEqual([]);
    expect(getFeatFeatureCards(undefined)).toEqual([]);
  });
});
