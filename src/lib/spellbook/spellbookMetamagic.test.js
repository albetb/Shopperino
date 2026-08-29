import Spellbook from './spellbook';
import { encodeMetamagic, HEIGHTEN, METAMAGIC_FEATS } from './metamagic';
import { loadFile } from '../utils';

/* Two preparations of the same spell.
 *
 * The spellbook could hold exactly one row per spell, so a wizard could not
 * record one ordinary *magic missile* and one maximized *magic missile* — which
 * is the whole of metamagic. Identity is now `(spellId, mm)`, and this file is
 * about the consequences: the fourth element of the tuple, the slot a
 * preparation actually occupies, and the fact that a save written before any of
 * this existed still loads.
 */

const ALL_SPELLS = loadFile('spells');

function make(className, level, characteristic = 18) {
  const s = new Spellbook('Tester');
  s.setClass(className);
  s.setLevel(level);
  s.setCharacteristic(characteristic);
  return s;
}

const MAGIC_MISSILE = 'magic-missile';
const FIREBALL = 'fireball';
const EMPOWER = encodeMetamagic(['Empower spell']);
const SILENT = encodeMetamagic(['Silent spell']);

describe('the stored tuple', () => {
  test('a plain preparation stays three elements long', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    expect(s.Spells).toEqual([[expect.any(Number), 1, 0]]);
  });

  test('a metamagic’d one carries a fourth', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    const row = s.Spells.find((r) => r.length === 4);
    expect(row[3]).toBe(EMPOWER);
  });

  test('a save written before metamagic existed loads unchanged', () => {
    /* The whole reason no CURRENT_VERSION bump was needed: three elements
       means mm === 0, so an old spellbook is a valid new one. */
    const id = ALL_SPELLS.find((sp) => sp.Link === MAGIC_MISSILE).id;
    const s = new Spellbook().load({
      Name: 'Old', Class: 'Wizard', Level: 5, Characteristic: 16,
      Spells: [[id, 2, 1]],
      MoralAlignment: 'Neutral', EthicalAlignment: 'Neutral',
      Domain1: '', Domain2: '', UsedDomainSpells: new Array(10).fill(0),
      Specialized: '', Forbidden1: '', Forbidden2: '',
    });
    expect(s.Spells).toEqual([[id, 2, 1]]);
    expect(s.getSpellPreparedUsed(MAGIC_MISSILE)).toEqual({ Prepared: 2, Used: 1 });
  });

  test('a stray fourth element of zero is dropped rather than stored', () => {
    const id = ALL_SPELLS.find((sp) => sp.Link === MAGIC_MISSILE).id;
    const s = new Spellbook().load({
      Name: 'X', Class: 'Wizard', Level: 5, Characteristic: 16,
      Spells: [[id, 1, 0, 0]],
      MoralAlignment: 'Neutral', EthicalAlignment: 'Neutral',
      Domain1: '', Domain2: '', UsedDomainSpells: new Array(10).fill(0),
      Specialized: '', Forbidden1: '', Forbidden2: '',
    });
    expect(s.Spells).toEqual([[id, 1, 0]]);
  });

  test('and it survives a serialize/load round trip, metamagic and all', () => {
    /* No CURRENT_VERSION bump was needed for this feature, which is only true
       if the tuple goes out and comes back the same length it left. */
    const a = make('Wizard', 9);
    a.learnSpell(MAGIC_MISSILE);
    a.prepareSpell(MAGIC_MISSILE);
    a.prepareSpell(MAGIC_MISSILE, EMPOWER);
    a.prepareSpell(MAGIC_MISSILE, EMPOWER);
    const b = new Spellbook().load(JSON.parse(JSON.stringify(a.serialize())));
    expect(b.Spells).toEqual(a.Spells);
    expect(b.getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER).Prepared).toBe(2);
    expect(b.getMetamagicEntries()[0].level).toBe(3);
  });
});

describe('two preparations of one spell', () => {
  test('the plain and the empowered are counted apart', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getSpellPreparedUsed(MAGIC_MISSILE).Prepared).toBe(2);
    expect(s.getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER).Prepared).toBe(1);
  });

  test('casting one does not spend the other', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    s.useSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getSpellPreparedUsed(MAGIC_MISSILE).Used).toBe(0);
    expect(s.getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER).Used).toBe(1);
  });

  test('two different metamagics are two different preparations', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    s.prepareSpell(MAGIC_MISSILE, SILENT);
    expect(s.getMetamagicPreparations(MAGIC_MISSILE)).toHaveLength(2);
  });

  test('unpreparing the last metamagic’d copy removes its row entirely', () => {
    // It is a preparation and nothing else — an empty one is dead weight
    // against a 5 MB budget shared by every spellbook there is.
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    s.unprepareSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.Spells.every((r) => r.length === 3)).toBe(true);
  });

  test('but the plain row survives, because for a wizard it is the spell', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    s.unprepareSpell(MAGIC_MISSILE);
    expect(s.getLearnedSpells().some((sp) => sp.Link === MAGIC_MISSILE)).toBe(true);
  });

  test('the spell is still known once, however many preparations it has', () => {
    /* A metamagic'd preparation does not count again toward spells known —
       it is the same spell. */
    const s = make('Sorcerer', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getLearnedSpells().filter((sp) => sp.Link === MAGIC_MISSILE)).toHaveLength(1);
    expect(s.getKnownCountByLevel()[1]).toBe(1);
  });

  test('unlearning a spell takes every preparation of it', () => {
    const s = make('Sorcerer', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    s.unlearnSpell(MAGIC_MISSILE);
    expect(s.Spells).toEqual([]);
  });
});

describe('the slot it occupies', () => {
  test('an empowered magic missile is a 3rd-level preparation', () => {
    const s = make('Wizard', 9);
    expect(s.getSpellBaseLevelByLink(MAGIC_MISSILE)).toBe(1);
    expect(s.getModifiedLevel(MAGIC_MISSILE, EMPOWER)).toBe(3);
  });

  test('and still works as a 1st-level spell', () => {
    expect(make('Wizard', 9).getEffectiveLevel(MAGIC_MISSILE, EMPOWER)).toBe(1);
  });

  test('a heightened spell moves both numbers', () => {
    const s = make('Wizard', 9);
    const mm = encodeMetamagic([HEIGHTEN], 5);
    expect(s.getModifiedLevel(MAGIC_MISSILE, mm)).toBe(5);
    expect(s.getEffectiveLevel(MAGIC_MISSILE, mm)).toBe(5);
  });

  test('the level is read off this class’s own list', () => {
    // Fireball is Sor/Wiz 3, and the level depends on who is asking.
    expect(make('Wizard', 9).getSpellBaseLevelByLink(FIREBALL)).toBe(3);
    expect(make('Cleric', 9).getSpellBaseLevelByLink(FIREBALL)).toBeNull();
  });

  test('a spell off this class’s list has no slot at all', () => {
    expect(make('Cleric', 9).getModifiedLevel(FIREBALL, EMPOWER)).toBeNull();
  });
});

describe('what the level card counts', () => {
  test('a metamagic’d preparation is counted at the slot it takes', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getPreparedCountAtLevel(1)).toBe(1);
    expect(s.getPreparedCountAtLevel(3)).toBe(1);
  });

  test('and appears as a row under that level', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    const [entry] = s.getMetamagicEntries();
    expect(entry.spell.Link).toBe(MAGIC_MISSILE);
    expect(entry.level).toBe(3);
    expect(entry.baseLevel).toBe(1);
    expect(entry.effectiveLevel).toBe(1);
  });

  test('a plain preparation is not one of those rows', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    expect(s.getMetamagicEntries()).toEqual([]);
  });

  test('the rows obey the name filter, like every other list here', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getMetamagicEntries({ name: 'magic' })).toHaveLength(1);
    expect(s.getMetamagicEntries({ name: 'fireball' })).toHaveLength(0);
  });

  test('the specialist count can be asked for one school', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE);
    expect(s.getPreparedCountAtLevel(1, { school: 'Evocation' })).toBe(1);
    expect(s.getPreparedCountAtLevel(1, { school: 'Illusion' })).toBe(0);
  });
});

describe('a sorcerer, whose slots are a pool', () => {
  test('an empowered cast comes out of the 3rd-level pool', () => {
    const s = make('Sorcerer', 10);
    s.learnSpell(MAGIC_MISSILE);
    s.useSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getSpontaneousUsedAtLevel(3)).toBe(1);
    expect(s.getSpontaneousUsedAtLevel(1)).toBe(0);
  });

  test('so casting it eats a 3rd-level slot, not a 1st', () => {
    const s = make('Sorcerer', 10);
    s.learnSpell(MAGIC_MISSILE);
    const before1 = s.getRemainingFor(MAGIC_MISSILE, 0);
    const before3 = s.getRemainingFor(FIREBALL, 0);
    s.useSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getRemainingFor(MAGIC_MISSILE, 0)).toBe(before1);
    expect(s.getRemainingFor(FIREBALL, 0)).toBe(before3 - 1);
  });

  test('a prepared caster’s remaining is their own copies, not a pool', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getRemainingFor(MAGIC_MISSILE, EMPOWER)).toBe(2);
    s.useSpell(MAGIC_MISSILE, EMPOWER);
    expect(s.getRemainingFor(MAGIC_MISSILE, EMPOWER)).toBe(1);
  });
});

describe('a night’s rest', () => {
  test('gives the metamagic’d preparation back, metamagic and all', () => {
    const s = make('Wizard', 9);
    s.learnSpell(MAGIC_MISSILE);
    s.prepareSpell(MAGIC_MISSILE, EMPOWER);
    s.useSpell(MAGIC_MISSILE, EMPOWER);
    s.refreshSpell();
    expect(s.getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER)).toEqual({ Prepared: 1, Used: 0 });
  });

  test('and clears the row a sorcerer’s cast left behind', () => {
    // Nothing is prepared there — the row existed only to record the slot.
    const s = make('Sorcerer', 10);
    s.learnSpell(MAGIC_MISSILE);
    s.useSpell(MAGIC_MISSILE, EMPOWER);
    s.refreshSpell();
    expect(s.Spells.every((r) => r.length === 3)).toBe(true);
    expect(s.getSpontaneousUsedAtLevel(3)).toBe(0);
  });
});

describe('which feats a book may offer', () => {
  test('a book with no character behind it offers all nine', () => {
    // The standalone Spellbook tab: nothing to check feats against.
    expect(make('Wizard', 9).getAvailableMetamagic()).toEqual(METAMAGIC_FEATS);
  });

  test('a character’s book offers what the character has', () => {
    const s = new Spellbook().load({
      Name: 'PC', Class: 'Wizard', Level: 9, Characteristic: 18,
      Spells: [], MoralAlignment: 'Neutral', EthicalAlignment: 'Neutral',
      Domain1: '', Domain2: '', UsedDomainSpells: new Array(10).fill(0),
      Specialized: '', Forbidden1: '', Forbidden2: '',
      MetamagicFeats: ['Empower spell', 'Silent spell'],
    });
    expect(s.getAvailableMetamagic()).toEqual(['Empower spell', 'Silent spell']);
    expect(s.hasMetamagic()).toBe(true);
  });

  test('an empty list is a real answer — a character who has none', () => {
    const s = new Spellbook().load({
      Name: 'PC', Class: 'Wizard', Level: 9, Characteristic: 18,
      Spells: [], MoralAlignment: 'Neutral', EthicalAlignment: 'Neutral',
      Domain1: '', Domain2: '', UsedDomainSpells: new Array(10).fill(0),
      Specialized: '', Forbidden1: '', Forbidden2: '',
      MetamagicFeats: [],
    });
    expect(s.hasMetamagic()).toBe(false);
  });

  test('the two casting styles are told apart', () => {
    expect(make('Sorcerer', 9).isSpontaneous()).toBe(true);
    expect(make('Bard', 9).isSpontaneous()).toBe(true);
    expect(make('Wizard', 9).isSpontaneous()).toBe(false);
    expect(make('Cleric', 9).isSpontaneous()).toBe(false);
  });
});
