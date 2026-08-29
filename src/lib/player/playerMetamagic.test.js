import Player from './player';
import { loadFile } from '../loadFile';
import { getRodMetamagicFeat, getRodMetamagicMaxLevel } from '../item/heldItems';
import { METAMAGIC_FEATS } from '../spellbook/metamagic';

/* What the character brings to metamagic: the feats they have, and the rods
 * they are holding.
 *
 * The eighteen rods were built and inert. A rod applies its feat **without
 * raising the slot level**, which is the entire reason to own one — and it
 * needed a spellbook that could represent a modified preparation before it
 * could do anything at all.
 */

const ROD_ROWS = () => (loadFile('items').Rod || []).filter((r) => r.Name.includes('Metamagic'));

function caster(cls = 'Wizard', level = 9, feats = []) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

/* The name is what resolves the row — `resolveHeldItem` matches on it before
   falling back to the link, exactly as the equipment grid stores it. */
const hold = (player, slot, name) => {
  player.equipment = player.equipment || {};
  player.equipment[slot] = { link: 'items/Rod/x', name };
  return player;
};

describe('the metamagic feats a character has', () => {
  test('none by default', () => {
    expect(caster().getMetamagicFeats()).toEqual([]);
  });

  test('exactly the ones taken, in the canonical order', () => {
    const p = caster('Wizard', 9, ['Silent spell', 'Empower spell', 'Power attack']);
    expect(p.getMetamagicFeats()).toEqual(['Empower spell', 'Silent spell']);
  });

  test('asked through hasFeatNamed, so a granted feat counts too', () => {
    /* Not the selected list: a feat can arrive from a class or from a worn
       item, and it is a real feat either way. */
    const p = caster('Wizard', 9, ['Maximize spell']);
    expect(p.hasFeatNamed('Maximize spell')).toBe(true);
    expect(p.getMetamagicFeats()).toContain('Maximize spell');
  });

  test('every name it can return is one the spellbook knows', () => {
    const p = caster('Wizard', 20, METAMAGIC_FEATS);
    expect(p.getMetamagicFeats()).toEqual(METAMAGIC_FEATS);
  });
});

describe('the level cap that was missing from all eighteen rods', () => {
  test('every metamagic rod now carries one', () => {
    const rows = ROD_ROWS();
    expect(rows).toHaveLength(18);
    rows.forEach((row) => {
      expect(getRodMetamagicMaxLevel(row)).toBeGreaterThan(0);
    });
  });

  test('and it is the only thing telling the three tiers apart', () => {
    /* Lesser reaches 3rd level, normal 6th, greater 9th. Before this the three
       rows differed by name and price alone, so all three behaved
       identically — item 9 shipped them and left this here. */
    const byTier = (suffix) => ROD_ROWS()
      .filter((r) => (suffix ? r.Name.endsWith(suffix) : !/, (lesser|greater)$/.test(r.Name)))
      .map(getRodMetamagicMaxLevel);
    expect(byTier(', lesser')).toEqual([3, 3, 3, 3, 3, 3]);
    expect(byTier('')).toEqual([6, 6, 6, 6, 6, 6]);
    expect(byTier(', greater')).toEqual([9, 9, 9, 9, 9, 9]);
  });

  test('a rod that is not a metamagic rod has no cap', () => {
    const absorption = (loadFile('items').Rod || []).find((r) => r.Name === 'Rod of Absorption');
    expect(getRodMetamagicMaxLevel(absorption)).toBe(0);
    expect(getRodMetamagicFeat(absorption)).toBe('');
  });
});

describe('rods in hand', () => {
  test('a metamagic rod is reported with its feat, cap and charges', () => {
    const p = hold(caster(), 'rh1', 'Rod of Metamagic, Quicken, greater');
    const [rod] = p.getMetamagicRods();
    expect(rod.feat).toBe('Quicken spell');
    expect(rod.maxLevel).toBe(9);
    expect(rod.maxCharges).toBe(3);
    expect(rod.remaining).toBe(3);
    expect(p.hasMetamagicRods()).toBe(true);
  });

  test('the lesser version of the same rod stops at 3rd level', () => {
    const p = hold(caster(), 'rh1', 'Rod of Metamagic, Empower, lesser');
    expect(p.getMetamagicRods()[0].maxLevel).toBe(3);
  });

  test('a rod that is not a metamagic rod is not one of them', () => {
    const p = hold(caster(), 'rh1', 'Rod of Absorption');
    expect(p.getMetamagicRods()).toEqual([]);
    expect(p.hasMetamagicRods()).toBe(false);
  });

  test('nor is a wand', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    expect(p.getMetamagicRods()).toEqual([]);
  });

  test('a rod in the other hand set is reported, and marked as such', () => {
    const p = hold(caster(), 'lh2', 'Rod of Metamagic, Silent');
    const [rod] = p.getMetamagicRods();
    expect(rod.isSecondarySet).toBe(true);
    expect(rod.maxLevel).toBe(6);
  });

  test('spending a charge is spending the rod’s charge', () => {
    const p = hold(caster(), 'rh1', 'Rod of Metamagic, Extend');
    const [before] = p.getMetamagicRods();
    p.spendHeldItemCharges(before.id, 1);
    expect(p.getMetamagicRods()[0].remaining).toBe(2);
  });

  test('and a night’s rest gives them back — a rod is per day, not per life', () => {
    const p = hold(caster(), 'rh1', 'Rod of Metamagic, Extend');
    const [rod] = p.getMetamagicRods();
    p.spendHeldItemCharges(rod.id, 3);
    expect(p.getMetamagicRods()[0].remaining).toBe(0);
    p.resetHeldItemsOnRest();
    expect(p.getMetamagicRods()[0].remaining).toBe(3);
  });
});
