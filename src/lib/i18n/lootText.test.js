import Loot from '../loot/loot';
import { setLanguage, hasName } from './index';
import { goodsName } from './lootText';

/**
 * Gems and art objects are the one part of a hoard that is not an item, and
 * their name pools live in the loot model rather than in src/data — which is
 * why they were the last table on the page still reading English.
 */

afterEach(() => setLanguage('en'));

test('a gem and an art object are named from the pack', () => {
  setLanguage('it');
  expect(goodsName('Star Sapphire')).toBe('Zaffiro stellato');
  expect(goodsName('Silver Ewer')).toBe("Brocca d'argento");
});

test('English is what the pool spells', () => {
  expect(goodsName('Star Sapphire')).toBe('Star Sapphire');
});

test('every name the two pools can roll has an entry', () => {
  /* The pools are private to the model, so this rolls until every tier has
     been seen rather than reading the arrays. A name added to a pool and not
     to the pack fails here instead of appearing untranslated on the page. */
  setLanguage('it');
  const loot = new Loot(20, 1, 1, 1, true, 1);
  const rolled = new Set();
  for (let i = 0; i < 4000; i += 1) {
    rolled.add(loot.generateGems().Name);
    rolled.add(loot.generateArt().Name);
  }
  expect(rolled.size).toBeGreaterThan(150);
  /* Asked of the pack rather than by comparing the two strings: iolite and
     malachite are spelled the same in both languages, and a translation that
     happens to match is not a missing one. */
  const untranslated = [...rolled].filter((name) => !hasName('goods', name));
  expect(untranslated).toEqual([]);
});
