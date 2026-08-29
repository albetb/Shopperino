import MonsterSheet, { MAX_INDIVIDUALS } from './monsterSheet';
import {
  MAX_ROSTER_ENTRIES,
  addToRoster,
  addIndividual,
  removeIndividual,
  removeEntry,
  updateEntry,
  findRosterIndex,
  isInRoster,
  countIndividuals,
  rosterToTuples,
  rosterFromTuples,
} from './monsterRoster';
import { listBestiary } from './monsterBook';

/* The creatures a master is running at once.
 *
 * The Monster Book tracked exactly one: opening a second stat block threw the
 * first one's hit points away. The rule this file protects is the split — one
 * entry per *kind*, many individuals inside it, and everything except the
 * damage shared between them.
 */

/* Resolved in beforeAll rather than at import: the bestiary is a lazy chunk,
   and at module-evaluation time it is not loaded yet. */
let GOBLIN;
let ORC;
let WOLF;
beforeAll(() => {
  [GOBLIN, ORC, WOLF] = listBestiary().slice(0, 3).map((c) => c.ref);
});

const build = (...refs) => refs.reduce((roster, ref) => addToRoster(roster, ref).roster, []);

describe('adding', () => {
  test('a new creature becomes a new entry with one individual', () => {
    const { roster, added, index } = addToRoster([], GOBLIN);
    expect(added).toBe(true);
    expect(index).toBe(0);
    expect(roster).toHaveLength(1);
    expect(roster[0].getCount()).toBe(1);
  });

  test('the same creature again is another individual, not a second entry', () => {
    const roster = build(GOBLIN, GOBLIN, GOBLIN);
    expect(roster).toHaveLength(1);
    expect(roster[0].getCount()).toBe(3);
  });

  test('a different creature is a second entry', () => {
    const roster = build(GOBLIN, ORC);
    expect(roster).toHaveLength(2);
    expect(roster.map((s) => s.getRef())).toEqual([GOBLIN, ORC]);
  });

  test('a ref that names nothing is refused, with a reason', () => {
    const { roster, added, reason } = addToRoster([], 'monsters/not-a-creature');
    expect(added).toBe(false);
    expect(reason).toBe('unknown');
    expect(roster).toEqual([]);
  });

  test('an empty ref likewise', () => {
    expect(addToRoster([], '').added).toBe(false);
    expect(addToRoster([], null).added).toBe(false);
  });

  test('the input roster is never mutated', () => {
    const before = build(GOBLIN);
    const after = addToRoster(before, ORC).roster;
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(2);
    expect(after[0]).not.toBe(before[0]);
  });
});

describe('the two ceilings, flagged rather than enforced silently', () => {
  test('the tenth kind fits and the eleventh does not', () => {
    const refs = listBestiary().slice(0, MAX_ROSTER_ENTRIES + 1).map((c) => c.ref);
    let roster = [];
    refs.slice(0, MAX_ROSTER_ENTRIES).forEach((ref) => {
      const result = addToRoster(roster, ref);
      expect(result.added).toBe(true);
      roster = result.roster;
    });
    expect(roster).toHaveLength(MAX_ROSTER_ENTRIES);

    const refused = addToRoster(roster, refs[MAX_ROSTER_ENTRIES]);
    expect(refused.added).toBe(false);
    expect(refused.reason).toBe('entries');
    expect(refused.roster).toHaveLength(MAX_ROSTER_ENTRIES);
  });

  test('a full roster still takes another of a creature already on it', () => {
    /* The entry ceiling is about *kinds*. Eight more goblins cost one number
       each and must not be refused because ten other kinds are being run. */
    const refs = listBestiary().slice(0, MAX_ROSTER_ENTRIES).map((c) => c.ref);
    const roster = build(...refs);
    expect(roster).toHaveLength(MAX_ROSTER_ENTRIES);
    const result = addToRoster(roster, refs[0]);
    expect(result.added).toBe(true);
    expect(result.roster[0].getCount()).toBe(2);
  });

  test('the twentieth of one kind fits and the twenty-first does not', () => {
    let roster = build(GOBLIN);
    for (let i = 1; i < MAX_INDIVIDUALS; i += 1) {
      roster = addToRoster(roster, GOBLIN).roster;
    }
    expect(roster[0].getCount()).toBe(MAX_INDIVIDUALS);
    const refused = addToRoster(roster, GOBLIN);
    expect(refused.added).toBe(false);
    expect(refused.reason).toBe('individuals');
    expect(refused.roster[0].getCount()).toBe(MAX_INDIVIDUALS);
  });

  test('addIndividual reports the same ceiling', () => {
    let roster = build(GOBLIN);
    for (let i = 1; i < MAX_INDIVIDUALS; i += 1) {
      roster = addIndividual(roster, 0).roster;
    }
    expect(addIndividual(roster, 0).added).toBe(false);
    expect(addIndividual(roster, 0).reason).toBe('individuals');
  });

  test('adding to an entry that is not there is refused, not crashed', () => {
    expect(addIndividual(build(GOBLIN), 7).added).toBe(false);
  });
});

describe('removing', () => {
  test('one of several leaves the entry standing', () => {
    const roster = build(GOBLIN, GOBLIN, GOBLIN);
    const { roster: next, removedEntry } = removeIndividual(roster, 0, 1);
    expect(removedEntry).toBe(false);
    expect(next).toHaveLength(1);
    expect(next[0].getCount()).toBe(2);
  });

  test('the last one takes the whole entry with it', () => {
    const roster = build(GOBLIN, ORC);
    const { roster: next, removedEntry } = removeIndividual(roster, 0, 0);
    expect(removedEntry).toBe(true);
    expect(next).toHaveLength(1);
    expect(next[0].getRef()).toBe(ORC);
  });

  test('the right individual goes, by its damage', () => {
    let roster = build(GOBLIN, GOBLIN, GOBLIN);
    roster = updateEntry(roster, 0, (s) => { s.adjustHp(-5, 1); });
    expect(roster[0].getDamage(1)).toBe(5);
    const { roster: next } = removeIndividual(roster, 0, 1);
    expect(next[0].getIndividuals().map((i) => i.damage)).toEqual([0, 0]);
  });

  test('an entry that is not there removes nothing', () => {
    const roster = build(GOBLIN);
    expect(removeIndividual(roster, 9, 0).roster).toHaveLength(1);
  });

  test('removeEntry drops the whole thing however many it holds', () => {
    const roster = build(GOBLIN, GOBLIN, ORC);
    const next = removeEntry(roster, 0);
    expect(next).toHaveLength(1);
    expect(next[0].getRef()).toBe(ORC);
  });
});

describe('lookups', () => {
  test('an entry is found by ref, and a missing one reports -1', () => {
    const roster = build(GOBLIN, ORC);
    expect(findRosterIndex(roster, ORC)).toBe(1);
    expect(findRosterIndex(roster, WOLF)).toBe(-1);
    expect(findRosterIndex(roster, '')).toBe(-1);
    expect(isInRoster(roster, GOBLIN)).toBe(true);
    expect(isInRoster(roster, WOLF)).toBe(false);
  });

  test('individuals are counted across every entry', () => {
    const roster = build(GOBLIN, GOBLIN, GOBLIN, ORC);
    expect(countIndividuals(roster)).toBe(4);
    expect(countIndividuals([])).toBe(0);
  });
});

describe('what the individuals share, and what they do not', () => {
  test('a bonus set once lands on every one of them', () => {
    const roster = updateEntry(build(GOBLIN, GOBLIN), 0, (s) => s.setBonus('ac', 2));
    const entry = roster[0];
    expect(entry.getCount()).toBe(2);
    // One stat block, one bonus: there is nowhere for the two to disagree.
    expect(entry.getBonus('ac')).toBe(2);
    expect(entry.getArmorClass()).toBe(entry.getBase().armorClass.total + 2);
  });

  test('a max-HP override moves every bar', () => {
    const roster = updateEntry(build(GOBLIN, GOBLIN), 0, (s) => s.setMaxLife(40));
    expect(roster[0].getIndividuals().map((i) => i.maxHp)).toEqual([40, 40]);
  });

  test('but damage is each creature’s own', () => {
    const roster = updateEntry(build(GOBLIN, GOBLIN, GOBLIN), 0, (s) => {
      s.adjustHp(-4, 0);
      s.adjustHp(-9, 2);
    });
    expect(roster[0].getIndividuals().map((i) => i.damage)).toEqual([4, 0, 9]);
  });
});

describe('persistence', () => {
  test('a roster survives the round trip, damage and all', () => {
    const roster = updateEntry(build(GOBLIN, GOBLIN, ORC), 0, (s) => {
      s.setBonus('ac', 2);
      s.setMaxLife(33);
      s.adjustHp(-7, 1);
    });
    const back = rosterFromTuples(rosterToTuples(roster));
    expect(back).toHaveLength(2);
    expect(back[0].getCount()).toBe(2);
    expect(back[0].getBonus('ac')).toBe(2);
    expect(back[0].getMaxLife()).toBe(33);
    expect(back[0].getIndividuals().map((i) => i.damage)).toEqual([0, 7]);
    expect(back[1].getRef()).toBe(ORC);
  });

  test('junk in the stored array is dropped rather than crashing', () => {
    expect(rosterFromTuples(null)).toEqual([]);
    expect(rosterFromTuples([[], ['monsters/nope'], null])).toEqual([]);
  });

  test('a stored roster longer than the cap is trimmed on the way in', () => {
    const tuples = listBestiary().slice(0, MAX_ROSTER_ENTRIES + 4)
      .map((c) => new MonsterSheet(c.ref).serialize());
    expect(rosterFromTuples(tuples)).toHaveLength(MAX_ROSTER_ENTRIES);
  });
});
