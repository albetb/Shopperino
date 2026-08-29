import {
  getScrollByRef,
  getScrollCasterLevel,
  resolveScroll,
  scrollUseMagicDeviceDC,
  stripScrollPrefix,
  SCROLL_SOURCES,
} from './scrolls';
import { loadFile } from '../loadFile';

/* What a scroll is, before anyone tries to read it.
 *
 * The two facts this file protects are the ones a card would get subtly wrong:
 * a scroll is identified by its **ref**, not its name, because 151 spells sit
 * on both lists under the same name; and its caster level comes out of its
 * **price**, except for the 54 whose price has a material component baked in.
 */

const allScrolls = () => {
  const data = loadFile('scrolls');
  return SCROLL_SOURCES.flatMap((source) => (data[source] || []).map((raw) => ({ raw, source })));
};

describe('finding a scroll by ref', () => {
  test('the source half of the ref is honoured, not guessed', () => {
    /* Detect magic is on both lists. A ref naming one must never return the
       other, or a divine caster's scroll would be checked against the arcane
       level. */
    const arcane = getScrollByRef('scrolls/Arcane/detect-magic');
    const divine = getScrollByRef('scrolls/Divine/detect-magic');
    expect(arcane?.source).toBe('Arcane');
    expect(divine?.source).toBe('Divine');
    expect(arcane.raw).not.toBe(divine.raw);
  });

  test('a malformed or unknown ref is null rather than a wrong row', () => {
    expect(getScrollByRef('')).toBeNull();
    expect(getScrollByRef(null)).toBeNull();
    expect(getScrollByRef('detect-magic')).toBeNull();
    expect(getScrollByRef('items/Potion/detect-magic')).toBeNull();
    expect(getScrollByRef('scrolls/Psionic/detect-magic')).toBeNull();
    expect(getScrollByRef('scrolls/Arcane/not-a-spell')).toBeNull();
  });
});

describe('caster level, out of the price', () => {
  test('a 0-level scroll counts its spell level as a half', () => {
    // 12.5 gp = CL 1 x 1/2 x 25.
    expect(getScrollCasterLevel({ Cost: 12.5, Level: 0 })).toBe(1);
  });

  test('the ordinary case divides straight back out', () => {
    // 375 gp = CL 5 x SL 3 x 25.
    expect(getScrollCasterLevel({ Cost: 375, Level: 3 })).toBe(5);
  });

  test('a price with a material component in it falls back to the minimum', () => {
    /* Sepia snake sigil carries 500 gp of powdered amber, so 875 gp no longer
       divides. The answer is the lowest level that could have scribed a
       3rd-level spell, not 875/75. */
    expect(getScrollCasterLevel({ Cost: 875, Level: 3 })).toBe(5);
    expect(getScrollCasterLevel({ Cost: 175, Level: 2 })).toBe(3);
  });

  test('a missing or nonsense price still gives the minimum', () => {
    expect(getScrollCasterLevel({ Level: 4 })).toBe(7);
    expect(getScrollCasterLevel({ Cost: 0, Level: 1 })).toBe(1);
    expect(getScrollCasterLevel({ Cost: -50, Level: 0 })).toBe(1);
  });

  test('no level at all reports zero rather than guessing', () => {
    expect(getScrollCasterLevel({ Cost: 100 })).toBe(0);
    expect(getScrollCasterLevel(null)).toBe(0);
  });

  test('every scroll in the file resolves to a legal caster level', () => {
    /* The floor matters: a scroll can never have been scribed below the
       lowest level at which its spell can be cast. */
    allScrolls().forEach(({ raw }) => {
      const cl = getScrollCasterLevel(raw);
      const floor = raw.Level === 0 ? 1 : (2 * raw.Level) - 1;
      expect(Number.isInteger(cl)).toBe(true);
      expect(cl).toBeGreaterThanOrEqual(floor);
    });
  });
});

describe('resolving one scroll', () => {
  test('the spell supplies the name and the description the row shows', () => {
    const scroll = resolveScroll('scrolls/Arcane/fireball');
    expect(scroll.spellName).toBe('Fireball');
    expect(scroll.link).toBe('fireball');
    expect(scroll.source).toBe('Arcane');
    expect(scroll.spellLevel).toBe(3);
    expect(scroll.description).not.toBe('');
    expect(scroll.school).toMatch(/Evocation/i);
  });

  test('the ref travels with the resolved scroll, since the name cannot identify it', () => {
    const scroll = resolveScroll('scrolls/Divine/cure-light-wounds');
    expect(scroll.ref).toBe('scrolls/Divine/cure-light-wounds');
  });

  test('an unknown ref resolves to null', () => {
    expect(resolveScroll('scrolls/Arcane/nope')).toBeNull();
    expect(resolveScroll('')).toBeNull();
  });

  test('every one of the 752 rows resolves, with a spell behind it', () => {
    /* The one row that would not — remove-blindness/deafness, a slash where
       spells.json has a hyphen — was fixed in the data. This is the guard. */
    const rows = allScrolls();
    expect(rows).toHaveLength(752);
    rows.forEach(({ raw, source }) => {
      const scroll = resolveScroll(`scrolls/${source}/${raw.Link}`);
      expect(scroll).not.toBeNull();
      expect(scroll.description).not.toBe('');
    });
  });
});

describe('the name prefix', () => {
  test('"Scroll of" comes off, and nothing else does', () => {
    expect(stripScrollPrefix('Scroll of Acid splash')).toBe('Acid splash');
    expect(stripScrollPrefix('Potion of Cure light wounds')).toBe('Potion of Cure light wounds');
    expect(stripScrollPrefix('')).toBe('');
    expect(stripScrollPrefix(null)).toBe('');
  });
});

describe('the Use Magic Device fallback', () => {
  test('a scroll asks 20 + its caster level, not the flat 20 a wand asks', () => {
    expect(scrollUseMagicDeviceDC(1)).toBe(21);
    expect(scrollUseMagicDeviceDC(17)).toBe(37);
    expect(scrollUseMagicDeviceDC(0)).toBe(20);
    expect(scrollUseMagicDeviceDC(null)).toBe(20);
  });
});
