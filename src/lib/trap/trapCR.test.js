import { getTraps, getTrapByRef } from './trapData';
import { trapCR, averageDamage, magicSpellLevel, isMagicTrap } from './trapCR';
import { averageOf, damageToCR, leadingDamage } from './trapMath';

/* The CR calculator, measured against the book's own 105 samples.
 *
 * This is the only honest way to know whether it works: the tables and the
 * traps were printed in the same book, so every sample is a worked example of
 * the rules the calculator implements. Where the two disagree it is worth
 * knowing which ones, and why — so the disagreements are listed by name rather
 * than absorbed into a tolerance.
 */

const SINGLE = () => getTraps().filter((t) => !t.multipleTraps);

/** The samples whose printed CR the tables do not reproduce, by ref. */
const KNOWN_DISAGREEMENTS = {
  // The book rates these above what its own tables add up to.
  'traps/cr7/black-tentacles-trap': -2,
  'traps/cr8/well-camouflaged-pit-trap': -2,
  'traps/cr2/large-net-trap': -1,
  'traps/cr5/fusillade-of-darts': -1,
  'traps/cr6/compacting-room': -1,
  'traps/cr6/fusillade-of-spears': -1,
  'traps/cr7/fusillade-of-greenblood-oil-darts': -1,
  // And below, on these three.
  'traps/cr1/portcullis-trap': 1,
  'traps/cr5/falling-block-trap': 1,
  'traps/cr5/flooding-room-trap': 1,
};

describe('reading damage', () => {
  test('a die averages the middle of its faces', () => {
    expect(averageOf('1d6')).toBe(3.5);
    expect(averageOf('2d6')).toBe(7);
    expect(averageOf('10d6')).toBe(35);
  });

  test('a modifier is added, and a negative one subtracted', () => {
    expect(averageOf('1d4+4')).toBe(6.5);
    expect(averageOf('1d8-1')).toBe(3.5);
  });

  test('a flat number is its own average', () => {
    expect(averageOf('1')).toBe(1);
  });

  test('junk is nothing rather than NaN', () => {
    expect(averageOf(null)).toBe(0);
    expect(averageOf('')).toBe(0);
    expect(averageOf('see note')).toBe(0);
  });

  test('a spell effect states its damage in dice, and a bare number is not damage', () => {
    /* earthquake's effect reads "65-ft. radius". Reading 65 points of damage
       out of it put that trap two CR above the book's own answer. */
    expect(leadingDamage('8d6 fire')).toBe(28);
    expect(leadingDamage('1d4+3 fire')).toBe(5.5);
    expect(leadingDamage('65-ft. radius')).toBe(0);
    expect(leadingDamage('hamatula')).toBe(0);
  });
});

describe('damage is priced in sevens', () => {
  test('one CR per 7 points', () => {
    expect(damageToCR(7)).toEqual({ rounded: 7, cr: 1 });
    expect(damageToCR(21)).toEqual({ rounded: 21, cr: 3 });
  });

  test('rounded to the nearest multiple of 7', () => {
    expect(damageToCR(9).cr).toBe(1);
    expect(damageToCR(12).cr).toBe(2);
  });

  test('an exact tie rounds up — and that is worth six samples', () => {
    /* 3.5 sits exactly between 0 and 7, and 10.5 exactly between 7 and 14.
       Rounding ties up agrees with the book on six more traps than rounding
       them down, which is the only evidence either way. */
    expect(damageToCR(3.5).cr).toBe(1);
    expect(damageToCR(10.5).cr).toBe(2);
  });

  test('no damage is no CR', () => {
    expect(damageToCR(0).cr).toBe(0);
    expect(damageToCR(-4).cr).toBe(0);
  });
});

describe('what counts as damage', () => {
  test('an attack and a pit both count', () => {
    const pit = getTrapByRef('traps/cr2/spiked-pit-trap');
    // 20 ft. of falling is 2d6, and the spikes are not part of it.
    expect(averageDamage(pit)).toBe(7);
  });

  test('poison and pit spikes do not — the rules say so outright', () => {
    const spiked = getTrapByRef('traps/cr10/poisoned-spiked-pit-trap');
    expect(spiked.pit.spikes).toBeTruthy();
    expect(spiked.poison).toBeTruthy();
    // Only the fall itself.
    expect(averageDamage(spiked)).toBe(averageOf(spiked.pit.fallDamage));
  });
});

describe('a magic trap knows its own spell level', () => {
  test('the Search DC is 25 + the spell level, so it declares it', () => {
    const fireball = getTrapByRef('traps/cr5/fireball-trap');
    expect(fireball.searchDC).toBe(28);
    expect(magicSpellLevel(fireball)).toEqual({ level: 3, source: 'searchDC' });
  });

  test('the two sources agree on 31 of the 33 magic samples', () => {
    /* spells.json is the cross-check. Where they part company is exactly
       where the book's printed CR follows the DC and not the spell. */
    const magic = getTraps().filter(isMagicTrap);
    expect(magic).toHaveLength(33);
    const { resolveTrapSpell } = require('./trapData');
    const disagree = magic.filter((t) => {
      const levels = (t.spellEffects || [])
        .map((sp) => resolveTrapSpell(sp.spell, sp.casterClass)?.level)
        .filter((l) => Number.isFinite(l));
      return levels.length && Math.max(...levels) !== t.searchDC - 25;
    });
    expect(disagree.map((t) => t.ref)).toEqual([
      'traps/cr8/earthquake-trap',
      'traps/cr8/power-word-stun-trap',
    ]);
  });

  test('the higher of the spell level and the damage wins — never both', () => {
    // A fireball trap is rated on 8d6, not on being a 3rd-level spell.
    const fireball = trapCR(getTrapByRef('traps/cr5/fireball-trap'));
    expect(fireball.cr).toBe(5);
    expect(fireball.parts.map((p) => p.key)).toEqual(['base', 'damage']);
    // An energy drain trap deals no hit points at all.
    const drain = trapCR(getTrapByRef('traps/cr10/energy-drain-trap'));
    expect(drain.cr).toBe(10);
    expect(drain.parts.map((p) => p.key)).toEqual(['base', 'spellLevel']);
  });
});

describe('the breakdown', () => {
  test('adds up to the number it reports', () => {
    SINGLE().forEach((t) => {
      const { cr, parts } = trapCR(t);
      expect(parts.reduce((s, p) => s + p.cr, 0)).toBe(cr);
    });
  });

  test('names every line it charges for', () => {
    const { parts } = trapCR(getTrapByRef('traps/cr5/falling-block-trap'));
    const labels = parts.map((p) => p.label);
    expect(labels).toContain('Disable Device DC 25');
    expect(labels).toContain('Attack bonus +15');
    expect(labels.some((l) => l.startsWith('Average damage'))).toBe(true);
  });

  test('a mechanical trap never comes out below CR 1', () => {
    // "if the final total lands at 0 or below, keep adding features until it
    // reaches 1" — a trap that exists is worth something.
    const needle = trapCR(getTrapByRef('traps/cr1/poison-needle-trap'));
    expect(needle.cr).toBe(1);
    expect(needle.parts.some((p) => p.key === 'floor')).toBe(true);
  });

  test('the poison table is reached despite the book naming poisons differently', () => {
    /* The traps say "large monstrous scorpion venom"; the CR table says
       "large scorpion venom". Four samples silently lost their poison
       modifier over that one word. */
    const arrow = getTrapByRef('traps/cr3/poisoned-arrow-trap');
    const poison = trapCR(arrow).parts.find((p) => p.key === 'poison');
    expect(poison.cr).toBe(3);
  });
});

describe('measured against the book', () => {
  test('92 of the 102 single-trap samples come out exactly right', () => {
    const exact = SINGLE().filter((t) => trapCR(t).cr === t.cr);
    expect(SINGLE()).toHaveLength(102);
    expect(exact).toHaveLength(92);
  });

  test('and the ten that do not are these ten, by this much', () => {
    /* Named rather than tolerated. Each is the book disagreeing with its own
       tables — a fusillade charged for multiple targets in one entry and not
       in the next, a pit whose printed CR no combination of bands reaches. */
    const off = {};
    SINGLE().forEach((t) => {
      const got = trapCR(t).cr;
      if (got !== t.cr) off[t.ref] = got - t.cr;
    });
    expect(off).toEqual(KNOWN_DISAGREEMENTS);
  });

  test('the three multi-trap entries are left alone on purpose', () => {
    /* Two traps sharing a trigger combine like an encounter level, and the
       component CRs live in free-text notes. The page shows the note instead
       of guessing. */
    const multi = getTraps().filter((t) => t.multipleTraps);
    expect(multi).toHaveLength(3);
    multi.forEach((t) => expect(t.note).toBeTruthy());
  });
});
