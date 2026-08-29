import {
  METAMAGIC_FEATS,
  HEIGHTEN,
  encodeMetamagic,
  decodeMetamagic,
  getHeightenTarget,
  hasMetamagic,
  toggleMetamagic,
  getSlotAdjustment,
  getSlotAdjustments,
  effectiveSpellLevel,
  modifiedSpellLevel,
  isImpossibleSlot,
  metamagicLabels,
  metamagicCount,
} from './metamagic';
import { loadFile } from '../utils';

/* The encoding, and the two different level questions it has to answer.
 *
 * Everything a metamagic'd preparation is lives in one integer, because the
 * whole spellbook is one localStorage key. The value goes into a user's save,
 * so the bit order is fixed here by name and can never be re-derived from the
 * order of feats.json.
 */

describe('the nine feats', () => {
  test('every Metamagic-tagged feat in the data is one of them', () => {
    const tagged = (loadFile('feats') || [])
      .filter((f) => Array.isArray(f.Tags) && f.Tags.includes('Metamagic'))
      .map((f) => f.Name);
    expect(tagged).toHaveLength(9);
    expect([...tagged].sort()).toEqual([...METAMAGIC_FEATS].sort());
  });

  test('the slot adjustments come from the data, not from a second copy here', () => {
    const feats = loadFile('feats') || [];
    METAMAGIC_FEATS.forEach((name) => {
      const row = feats.find((f) => f.Name === name);
      expect(getSlotAdjustment(name)).toBe(row.spellSlotMalus);
    });
    // The eight fixed ones, as the feat table prints them.
    expect(getSlotAdjustments()['Empower spell']).toBe(2);
    expect(getSlotAdjustments()['Maximize spell']).toBe(3);
    expect(getSlotAdjustments()['Quicken spell']).toBe(4);
    // Heighten's is variable, so the data says 0 and the target level carries it.
    expect(getSlotAdjustment(HEIGHTEN)).toBe(0);
  });

  test('a feat that is not metamagic costs nothing', () => {
    expect(getSlotAdjustment('Power attack')).toBe(0);
    expect(getSlotAdjustment('')).toBe(0);
  });
});

describe('packing a choice into one integer', () => {
  test('nothing applied is zero — the value a plain preparation omits', () => {
    expect(encodeMetamagic([])).toBe(0);
    expect(decodeMetamagic(0)).toEqual({ feats: [], heightenTo: 0 });
  });

  test('a round trip returns what went in', () => {
    const mm = encodeMetamagic(['Empower spell', 'Silent spell']);
    expect(decodeMetamagic(mm).feats.sort()).toEqual(['Empower spell', 'Silent spell']);
  });

  test('order does not change the value — a set, not a list', () => {
    expect(encodeMetamagic(['Silent spell', 'Empower spell']))
      .toBe(encodeMetamagic(['Empower spell', 'Silent spell']));
  });

  test('each of the eight fixed feats has its own bit', () => {
    const values = METAMAGIC_FEATS
      .filter((n) => n !== HEIGHTEN)
      .map((n) => encodeMetamagic([n]));
    expect(new Set(values).size).toBe(8);
    // Powers of two: one bit each, so any combination is their sum.
    values.forEach((v) => expect(v & (v - 1)).toBe(0));
  });

  test('the bit order is fixed by name and must not drift', () => {
    /* These numbers are in users' saved data. Changing the order in the source
       would silently turn every empowered spell into a quickened one, so the
       encoding is pinned here rather than left to the shape of the file. */
    expect(encodeMetamagic(['Empower spell'])).toBe(1);
    expect(encodeMetamagic(['Enlarge spell'])).toBe(2);
    expect(encodeMetamagic(['Extend spell'])).toBe(4);
    expect(encodeMetamagic(['Maximize spell'])).toBe(8);
    expect(encodeMetamagic(['Quicken spell'])).toBe(16);
    expect(encodeMetamagic(['Silent spell'])).toBe(32);
    expect(encodeMetamagic(['Still spell'])).toBe(64);
    expect(encodeMetamagic(['Widen spell'])).toBe(128);
  });

  test('Heighten carries a target level above the bits', () => {
    const mm = encodeMetamagic([HEIGHTEN], 5);
    expect(getHeightenTarget(mm)).toBe(5);
    expect(decodeMetamagic(mm)).toEqual({ feats: [HEIGHTEN], heightenTo: 5 });
  });

  test('Heighten and a fixed feat coexist without colliding', () => {
    const mm = encodeMetamagic([HEIGHTEN, 'Silent spell'], 4);
    expect(getHeightenTarget(mm)).toBe(4);
    expect(hasMetamagic(mm, 'Silent spell')).toBe(true);
    expect(hasMetamagic(mm, 'Empower spell')).toBe(false);
  });

  test('Heighten with no target is not applied at all', () => {
    // "Heightened to 0" is not a thing; the picker has simply not been used.
    expect(encodeMetamagic([HEIGHTEN], 0)).toBe(0);
    expect(decodeMetamagic(encodeMetamagic([HEIGHTEN], 0)).feats).toEqual([]);
  });

  test('a target above 9th is clamped — there is no 10th-level spell', () => {
    expect(getHeightenTarget(encodeMetamagic([HEIGHTEN], 12))).toBe(9);
  });

  test('unknown names are ignored rather than corrupting the value', () => {
    expect(encodeMetamagic(['Power attack', 'Empower spell'])).toBe(encodeMetamagic(['Empower spell']));
  });

  test('junk decodes as nothing applied', () => {
    expect(decodeMetamagic(null).feats).toEqual([]);
    expect(decodeMetamagic(undefined).feats).toEqual([]);
    expect(decodeMetamagic(-5).feats).toEqual([]);
  });
});

describe('toggling one feat at a time', () => {
  test('adding and removing returns to where it started', () => {
    const on = toggleMetamagic(0, 'Extend spell', true);
    expect(hasMetamagic(on, 'Extend spell')).toBe(true);
    expect(toggleMetamagic(on, 'Extend spell', false)).toBe(0);
  });

  test('toggling one leaves the others alone', () => {
    const both = toggleMetamagic(encodeMetamagic(['Empower spell']), 'Silent spell', true);
    expect(metamagicCount(both)).toBe(2);
    const one = toggleMetamagic(both, 'Empower spell', false);
    expect(decodeMetamagic(one).feats).toEqual(['Silent spell']);
  });

  test('turning Heighten off clears its target too', () => {
    const on = toggleMetamagic(0, HEIGHTEN, true, 6);
    expect(getHeightenTarget(on)).toBe(6);
    expect(toggleMetamagic(on, HEIGHTEN, false)).toBe(0);
  });

  test('a fixed feat toggled on top of Heighten keeps the target', () => {
    const on = toggleMetamagic(encodeMetamagic([HEIGHTEN], 7), 'Still spell', true);
    expect(getHeightenTarget(on)).toBe(7);
  });
});

describe('the slot, and the level the spell still works at', () => {
  test('with nothing applied the two are the spell’s own level', () => {
    expect(modifiedSpellLevel(3, 0)).toBe(3);
    expect(effectiveSpellLevel(3, 0)).toBe(3);
  });

  test('a fixed feat moves the slot and leaves the spell where it was', () => {
    /* This is the rule the whole feature turns on: an empowered magic missile
       occupies a 3rd-level slot and still saves and dispels as a 1st-level
       spell. A display that moved both would make the save DC wrong. */
    const mm = encodeMetamagic(['Empower spell']);
    expect(modifiedSpellLevel(1, mm)).toBe(3);
    expect(effectiveSpellLevel(1, mm)).toBe(1);
  });

  test('several feats sum', () => {
    const mm = encodeMetamagic(['Empower spell', 'Silent spell', 'Still spell']);
    expect(modifiedSpellLevel(1, mm)).toBe(1 + 2 + 1 + 1);
  });

  test('Heighten is the exception — it moves both', () => {
    // "Unlike other metamagic feats, Heighten Spell actually increases the
    // effective level of the spell that it modifies."
    const mm = encodeMetamagic([HEIGHTEN], 5);
    expect(modifiedSpellLevel(2, mm)).toBe(5);
    expect(effectiveSpellLevel(2, mm)).toBe(5);
  });

  test('Heighten stacks with a fixed feat, and only the slot takes the extra', () => {
    const mm = encodeMetamagic([HEIGHTEN, 'Silent spell'], 4);
    expect(modifiedSpellLevel(1, mm)).toBe(5);
    expect(effectiveSpellLevel(1, mm)).toBe(4);
  });

  test('heightening below the spell’s own level does nothing', () => {
    const mm = encodeMetamagic([HEIGHTEN], 2);
    expect(modifiedSpellLevel(5, mm)).toBe(5);
  });

  test('a slot no caster could have is reported, not clamped', () => {
    // Per CLAUDE.md: computed and displayed, never enforced.
    const mm = encodeMetamagic(['Maximize spell']);
    expect(modifiedSpellLevel(9, mm)).toBe(12);
    expect(isImpossibleSlot(9, mm)).toBe(true);
    expect(isImpossibleSlot(6, mm)).toBe(false);
  });
});

describe('what the pills say', () => {
  test('past participles, not feat names', () => {
    expect(metamagicLabels(encodeMetamagic(['Empower spell']))).toEqual(['Empowered']);
    expect(metamagicLabels(encodeMetamagic(['Still spell']))).toEqual(['Stilled']);
  });

  test('Heighten names its target, because the target is the whole choice', () => {
    expect(metamagicLabels(encodeMetamagic([HEIGHTEN], 6))).toEqual(['Heightened to 6']);
  });

  test('two feats read as two pills in a stable order', () => {
    const a = metamagicLabels(encodeMetamagic(['Silent spell', 'Empower spell']));
    const b = metamagicLabels(encodeMetamagic(['Empower spell', 'Silent spell']));
    expect(a).toEqual(b);
    expect(a).toHaveLength(2);
  });

  test('nothing applied says nothing', () => {
    expect(metamagicLabels(0)).toEqual([]);
  });
});
