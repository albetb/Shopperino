import { loadFile } from '../loadFile';
import {
  isHeldItemType,
  resolveHeldItem,
  getHeldItemSpells,
  getHeldItemCasterLevel,
  getHeldItemMaxCharges,
  getRodUsesPerDay,
  getRodMetamagicFeat,
  refreshesOnRest,
  HELD_ITEM_TYPES,
  CREATED_CHARGES,
} from './heldItems';

/* Wands, rods and staffs. The rule this module exists to enforce is that a
 * held item is identified by its **id**, never by its link: `Link` is not
 * unique in items.json, and every collision is a caster level difference —
 * a Wand of Fireball (5th) and a Wand of Fireball (10th) share the link
 * "fireball" and roll 5d6 or 10d6.
 */

const items = () => loadFile('items');
const byName = (type, name) => items()[type].find((i) => i.Name === name);

describe('the link collisions this module exists for', () => {
  test('link is genuinely not unique, and only in these categories', () => {
    const dupes = (type) => {
      const seen = new Map();
      items()[type].forEach((i) => seen.set(i.Link, (seen.get(i.Link) || 0) + 1));
      return [...seen.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0);
    };
    // 23 of the 81 wands and all 18 metamagic rods share a link.
    expect(dupes('Wand')).toBe(23);
    expect(dupes('Rod')).toBe(18);
  });

  test('id picks the right entry where link cannot', () => {
    const fireballs = items().Wand.filter((i) => i.Link === 'fireball');
    expect(fireballs.length).toBeGreaterThan(1);
    fireballs.forEach((wand) => {
      const resolved = resolveHeldItem({ id: wand.id });
      expect(resolved.raw.Name).toBe(wand.Name);
      expect(resolved.itemType).toBe('Wand');
    });
  });

  test('and every held item has an id to be picked by', () => {
    HELD_ITEM_TYPES.forEach((type) => {
      items()[type].forEach((i) => expect(Number.isInteger(i.id)).toBe(true));
    });
  });

  test('a link-only entry still resolves, just to the first match', () => {
    // The lossy path, kept only for an entry saved before ids were stored.
    const resolved = resolveHeldItem({ link: 'items/Wand/fireball' });
    expect(resolved.raw.Link).toBe('fireball');
    expect(resolveHeldItem(null)).toBe(null);
    expect(resolveHeldItem({ link: 'items/Wand/no-such-wand' })).toBe(null);
  });

  test('something that is not a held item at all resolves to nothing', () => {
    /* A link resolves to anything in items.json, so callers can only treat a
       non-null answer as "this is a wand, rod or staff" if it is checked. */
    expect(resolveHeldItem({ link: 'items/Weapon/longsword', name: 'Longsword' })).toBe(null);
    expect(resolveHeldItem({ link: 'items/Shield/shield-heavy-steel' })).toBe(null);
    expect(resolveHeldItem({ name: 'Not an item' })).toBe(null);
  });
});

describe('caster level', () => {
  test('comes from the name when the name states it', () => {
    const wand = byName('Wand', 'Wand of Fireball (10th)');
    expect(getHeldItemCasterLevel(wand)).toBe(10);
    expect(getHeldItemCasterLevel(byName('Wand', 'Wand of Fireball (5th)'))).toBe(5);
  });

  test('and from the price when it does not', () => {
    // cost = caster level x spell level x 750; burning hands is 1st level.
    const wand = byName('Wand', 'Wand of Burning hands');
    expect(wand.Cost).toBe(750);
    expect(getHeldItemCasterLevel(wand, 1)).toBe(1);
  });

  test('a 0-level spell counts as half a level in that formula', () => {
    const wand = byName('Wand', 'Wand of Detect magic');
    expect(wand.Cost).toBe(375);
    expect(getHeldItemCasterLevel(wand, 0)).toBe(1);
  });

  test('every wand resolves one way or the other', () => {
    const spells = loadFile('spells');
    const levelOf = (link) => {
      const spell = spells.find((s) => s.Link === link);
      const nums = String(spell?.Level ?? '').match(/\d+/g);
      return nums ? nums.map(Number) : [];
    };
    const unresolved = items().Wand.filter((w) =>
      !levelOf(w.Link).some((lv) => getHeldItemCasterLevel(w, lv) > 0)
    );
    expect(unresolved).toEqual([]);
  });

  test('the two component wands fall back to the minimum for their spell', () => {
    /* Restoration and Stoneskin have a costly material component, which adds
       50 x its price to the wand and is stored nowhere — so their cost does
       not divide. Both are 4th-level spells, so the minimum rule gives 7th. */
    expect(getHeldItemCasterLevel(byName('Wand', 'Wand of Restoration'), 4)).toBe(7);
    expect(getHeldItemCasterLevel(byName('Wand', 'Wand of Stoneskin'), 4)).toBe(7);
  });

  test('no spell level to go on gives 0 rather than a guess', () => {
    // A bare price divides by anything, so without a level there is no answer.
    expect(getHeldItemCasterLevel(null)).toBe(0);
    expect(getHeldItemCasterLevel({ Name: 'Rod of Something', Cost: 3000 })).toBe(0);
    expect(getHeldItemCasterLevel({ Name: 'Wand of X', Cost: 750 }, -1)).toBe(0);
  });
});

describe('what each category casts', () => {
  test('a wand is one spell, and its own link is the spell', () => {
    const wand = byName('Wand', 'Wand of Fireball (5th)');
    const spells = getHeldItemSpells(wand, 'Wand');
    expect(spells).toHaveLength(1);
    expect(spells[0].link).toBe('fireball');
    expect(spells[0].charges).toBe(1);
    // The caster level in the name is not part of the spell's name.
    expect(spells[0].name).toBe('Fireball');
  });

  test('a staff is several spells, each with its own cost', () => {
    const staff = byName('Staff', 'Staff of Fire');
    expect(getHeldItemSpells(staff, 'Staff')).toEqual([
      { link: 'burning-hands', name: 'Burning hands', charges: 1 },
      { link: 'fireball', name: 'Fireball', charges: 1 },
      { link: 'wall-of-fire', name: 'Wall of fire', charges: 2 },
    ]);
  });

  test('a spell qualified by a note keeps the note and still finds its cost', () => {
    const power = getHeldItemSpells(byName('Staff', 'Staff of Power'), 'Staff');
    const bolt = power.find((s) => s.link === 'lightning-bolt');
    expect(bolt.charges).toBe(1);
    expect(bolt.note).toBe('heightened to 5th level');
    const wall = power.find((s) => s.link === 'wall-of-force');
    expect(wall.charges).toBe(2);
    expect(wall.note).toContain('hemisphere');
  });

  test('every spell link on every staff is parsed, and resolves to a real spell', () => {
    const known = new Set(loadFile('spells').map((s) => s.Link));
    let linksInData = 0;
    let parsed = 0;
    items().Staff.forEach((staff) => {
      linksInData += (staff.Description.match(/href="spells#/g) || []).length;
      const spells = getHeldItemSpells(staff, 'Staff');
      parsed += spells.length;
      spells.forEach((s) => expect(known.has(s.link)).toBe(true));
    });
    expect(linksInData).toBe(98);
    expect(parsed).toBe(98);
  });

  test('a rod casts no spells at all — it has powers, not spells', () => {
    items().Rod.forEach((rod) => expect(getHeldItemSpells(rod, 'Rod')).toEqual([]));
  });
});

describe('charges', () => {
  test('a wand and a staff are created with fifty', () => {
    expect(getHeldItemMaxCharges(byName('Wand', 'Wand of Fireball (5th)'), 'Wand')).toBe(CREATED_CHARGES);
    expect(getHeldItemMaxCharges(byName('Staff', 'Staff of Fire'), 'Staff')).toBe(50);
  });

  test('a metamagic rod is three a day, not fifty charges', () => {
    const rod = byName('Rod', 'Rod of Metamagic, Quicken, greater');
    expect(getRodUsesPerDay(rod)).toBe(3);
    expect(getHeldItemMaxCharges(rod, 'Rod')).toBe(3);
  });

  test('all eighteen metamagic rods state the same allowance', () => {
    const meta = items().Rod.filter((r) => /metamagic/i.test(r.Name));
    expect(meta).toHaveLength(18);
    meta.forEach((r) => expect(getRodUsesPerDay(r)).toBe(3));
  });

  test('a rod that states no allowance gets none, rather than a made-up one', () => {
    const absorption = byName('Rod', 'Rod of Absorption');
    expect(getHeldItemMaxCharges(absorption, 'Rod')).toBe(0);
  });

  test('only a rod refreshes with rest; a spent wand stays spent', () => {
    expect(refreshesOnRest('Rod')).toBe(true);
    expect(refreshesOnRest('Wand')).toBe(false);
    expect(refreshesOnRest('Staff')).toBe(false);
  });
});

describe('metamagic rods', () => {
  test('name the feat they apply', () => {
    expect(getRodMetamagicFeat(byName('Rod', 'Rod of Metamagic, Quicken, greater')))
      .toBe('Quicken spell');
    expect(getRodMetamagicFeat(byName('Rod', 'Rod of Metamagic, Enlarge, lesser')))
      .toBe('Enlarge spell');
  });

  test('and a rod that is not a metamagic rod names nothing', () => {
    expect(getRodMetamagicFeat(byName('Rod', 'Rod of Absorption'))).toBe('');
  });

  test('the feat named is one feats.json actually has', () => {
    const known = new Set(loadFile('feats').map((f) => f.Name.toLowerCase()));
    items().Rod
      .map(getRodMetamagicFeat)
      .filter(Boolean)
      .forEach((name) => expect(known.has(name.toLowerCase())).toBe(true));
  });
});

describe('the type test', () => {
  test('names the three held categories and nothing else', () => {
    expect(HELD_ITEM_TYPES).toEqual(['Wand', 'Rod', 'Staff']);
    ['Wand', 'Rod', 'Staff'].forEach((t) => expect(isHeldItemType(t)).toBe(true));
    ['Weapon', 'Armor', 'Shield', 'Potion', 'Ring', 'Wondrous Item', '', null]
      .forEach((t) => expect(isHeldItemType(t)).toBe(false));
  });
});
