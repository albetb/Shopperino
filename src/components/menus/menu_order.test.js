import { TABS } from './top_menu';
import { TILES } from '../main_page/main_page';

/* The nav list and the home grid are two hand-written lists of the same seven
   tabs, and CLAUDE.md already flags that they have to stay in step. This is the
   part a test can hold: that they agree on the order, so a tool is not third in
   one place and last in the other. */

const order = [4, 1, 3, 6, 2, 5]; // search, shop, loot, monsters, spellbook, sheet

test('the nav list opens on Home and then follows the shared order', () => {
  expect(TABS[0].id).toBe(0);
  expect(TABS.slice(1).map((t) => t.id)).toEqual(order);
});

test('the home grid follows the same order, minus Home itself', () => {
  expect(TILES.map((t) => t.id)).toEqual(order);
});

test('every tab is listed exactly once in each', () => {
  expect(new Set(TABS.map((t) => t.id)).size).toBe(TABS.length);
  expect(new Set(TILES.map((t) => t.id)).size).toBe(TILES.length);
});

test('the two agree about which tabs are master-only', () => {
  const tileMasterOnly = Object.fromEntries(TILES.map((t) => [t.id, !!t.masterOnly]));
  TABS.filter((t) => t.id !== 0).forEach((tab) => {
    expect(tab.masterOnly).toBe(tileMasterOnly[tab.id]);
  });
});
