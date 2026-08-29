import { T, AC_ALL, AC_WORN, AC_DODGE, SAVES, ABILITIES, spread } from './effectSchema';
import { BONUS_TYPES } from '../player/contributions';

/* The vocabulary the two item-effect tables share.
 *
 * The bonus-type names are duplicated here as plain strings rather than
 * imported from the player package — the dependency runs the other way, and
 * reversing it for a handful of constants would be a cycle. That duplication
 * is only safe if something checks the two stay equal, which is this file.
 */

describe('the bonus type names', () => {
  test('agree exactly with the ones the breakdown box accepts', () => {
    /* `contribution()` silently drops a type it does not recognise, so a
       mistyped name here would quietly untype every bonus using it. */
    expect(new Set(Object.values(T))).toEqual(new Set(Object.values(BONUS_TYPES)));
    expect(Object.keys(T).sort()).toEqual(Object.keys(BONUS_TYPES).sort());
  });

  test('untyped is the empty string, because it is the absence of a type', () => {
    expect(T.UNTYPED).toBe('');
  });
});

describe('which AC numbers a bonus reaches', () => {
  test('a worn bonus is denied to touch AC', () => {
    // Armor, shield and natural armor: something physical is in the way.
    expect(AC_WORN).toEqual(['ac', 'acFlat']);
    expect(AC_WORN).not.toContain('acTouch');
  });

  test('a dodge bonus is lost while flat-footed', () => {
    expect(AC_DODGE).toEqual(['ac', 'acTouch']);
    expect(AC_DODGE).not.toContain('acFlat');
  });

  test('deflection, insight and luck reach all three', () => {
    expect(AC_ALL).toEqual(['ac', 'acTouch', 'acFlat']);
  });

  test('the three groups are frozen, so no caller can edit them in place', () => {
    expect(Object.isFrozen(AC_ALL)).toBe(true);
    expect(Object.isFrozen(AC_WORN)).toBe(true);
    expect(Object.isFrozen(AC_DODGE)).toBe(true);
  });
});

describe('the small lists', () => {
  test('the saves and the abilities are in sheet order', () => {
    expect(SAVES).toEqual(['fortitude', 'reflex', 'will']);
    expect(ABILITIES).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha']);
  });
});

describe('spread', () => {
  test('gives every key the same value and type', () => {
    expect(spread(SAVES, 3, T.RESISTANCE)).toEqual({
      fortitude: [3, 'resistance'],
      reflex: [3, 'resistance'],
      will: [3, 'resistance'],
    });
  });

  test('carries a negative value unchanged — a penalty is a bonus below zero', () => {
    expect(spread(['ac'], -2, T.UNTYPED)).toEqual({ ac: [-2, ''] });
  });

  test('an empty group spreads to nothing', () => {
    expect(spread([], 5, T.LUCK)).toEqual({});
  });
});
