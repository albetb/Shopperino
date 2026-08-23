import Spellbook from './spellbook';
import { loadFile } from '../utils';

const ALL_SPELLS = loadFile('spells');

/** A spellbook of a class and level, with no spells learned yet. */
function make(className, level, characteristic = 14) {
  const s = new Spellbook('Tester');
  s.setClass(className);
  s.setLevel(level);
  s.setCharacteristic(characteristic);
  return s;
}

/** Learn `count` distinct spells of the given class-list level. */
function learnSpellsAtLevel(book, key, level, count) {
  const matching = ALL_SPELLS.filter((sp) =>
    String(sp.Level || '').split(',').map((p) => p.trim()).includes(`${key} ${level}`)
  );
  expect(matching.length).toBeGreaterThanOrEqual(count);
  matching.slice(0, count).forEach((sp) => book.learnSpell(sp.Link));
}

describe('spells known cap', () => {
  test('only the fixed-table classes have a cap', () => {
    expect(make('Sorcerer', 5).hasSpellsKnownCap()).toBe(true);
    expect(make('Bard', 5).hasSpellsKnownCap()).toBe(true);
    // A wizard's figure is what levelling grants free, not a ceiling.
    expect(make('Wizard', 5).hasSpellsKnownCap()).toBe(false);
    expect(make('Cleric', 5).hasSpellsKnownCap()).toBe(false);
  });

  test('known spells are counted per spell level', () => {
    const s = make('Sorcerer', 6);
    learnSpellsAtLevel(s, 'Sor/Wiz', 1, 3);
    learnSpellsAtLevel(s, 'Sor/Wiz', 2, 1);
    const counts = s.getKnownCountByLevel();
    expect(counts[1]).toBe(3);
    expect(counts[2]).toBe(1);
    expect(counts[3]).toBeUndefined();
  });

  test('a sorcerer inside the table is not over cap', () => {
    // A level 6 sorcerer knows 4 first-level spells.
    const s = make('Sorcerer', 6);
    expect(s.getSpellsKnown()[1]).toBe(4);
    learnSpellsAtLevel(s, 'Sor/Wiz', 1, 4);
    expect(s.getSpellsKnownOverCap(1)).toBe(0);
  });

  test('the excess is reported rather than blocked', () => {
    const s = make('Sorcerer', 6);
    learnSpellsAtLevel(s, 'Sor/Wiz', 1, 6);
    expect(s.getKnownCountByLevel()[1]).toBe(6); // all six were accepted
    expect(s.getSpellsKnownOverCap(1)).toBe(2);
  });

  test('a bard is measured against the bard table', () => {
    // A level 4 bard knows 3 first-level spells.
    const b = make('Bard', 4);
    expect(b.getSpellsKnown()[1]).toBe(3);
    learnSpellsAtLevel(b, 'Brd', 1, 5);
    expect(b.getSpellsKnownOverCap(1)).toBe(2);
  });

  test('a wizard is never over cap, however many spells are copied', () => {
    const w = make('Wizard', 1);
    learnSpellsAtLevel(w, 'Sor/Wiz', 1, 8);
    expect(w.getSpellsKnownOverCap(1)).toBe(0);
  });

  test('spells above the castable level are not counted — they are not listed either', () => {
    // getLearnedSpells() drops anything past maxSpellLevel(), so a level 1
    // sorcerer holding a 2nd-level spell sees no card for it and no flag.
    const s = make('Sorcerer', 1);
    expect(s.getSpellsKnown()[2]).toBe(0);
    learnSpellsAtLevel(s, 'Sor/Wiz', 2, 2);
    expect(s.getKnownCountByLevel()[2]).toBeUndefined();
    expect(s.getSpellsKnownOverCap(2)).toBe(0);
  });

  test('the same spells are counted once the sorcerer can cast that level', () => {
    const s = make('Sorcerer', 1);
    learnSpellsAtLevel(s, 'Sor/Wiz', 2, 2);
    s.setLevel(4); // 2nd-level slots arrive; the table allows 1 spell known
    expect(s.getKnownCountByLevel()[2]).toBe(2);
    expect(s.getSpellsKnownOverCap(2)).toBe(1);
  });

  test('an empty spellbook is never over cap', () => {
    const s = make('Sorcerer', 20);
    expect(s.getKnownCountByLevel()).toEqual({});
    for (let lvl = 0; lvl <= 9; lvl += 1) {
      expect(s.getSpellsKnownOverCap(lvl)).toBe(0);
    }
  });

  test('a classless spellbook counts nothing and reports nothing', () => {
    const s = new Spellbook('Nobody');
    expect(s.getKnownCountByLevel()).toEqual({});
    expect(s.getSpellsKnownOverCap(1)).toBe(0);
  });
});

describe('spell swap levels', () => {
  test('a sorcerer swaps at 4th and every even level after', () => {
    expect(make('Sorcerer', 1).getSpellSwapLevels())
      .toEqual([4, 6, 8, 10, 12, 14, 16, 18, 20]);
  });

  test('a bard swaps at 5th and every third level after', () => {
    expect(make('Bard', 1).getSpellSwapLevels()).toEqual([5, 8, 11, 14, 17, 20]);
  });

  test('the list does not depend on current level — it is the whole schedule', () => {
    expect(make('Sorcerer', 20).getSpellSwapLevels())
      .toEqual(make('Sorcerer', 1).getSpellSwapLevels());
  });

  test('classes that learn freely have no swap schedule', () => {
    expect(make('Wizard', 20).getSpellSwapLevels()).toEqual([]);
    expect(make('Cleric', 20).getSpellSwapLevels()).toEqual([]);
    expect(new Spellbook('Nobody').getSpellSwapLevels()).toEqual([]);
  });

  test('swapping is not enforced: unlearning stays available at any level', () => {
    const s = make('Sorcerer', 3); // below the first swap level
    learnSpellsAtLevel(s, 'Sor/Wiz', 1, 1);
    const learned = s.getLearnedSpells();
    expect(learned).toHaveLength(1);
    s.unlearnSpell(learned[0].Link);
    expect(s.getLearnedSpells()).toHaveLength(0);
  });
});
