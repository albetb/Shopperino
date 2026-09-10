import { TABS } from './top_menu';
import { TILES } from '../main_page/main_page';

/* The nav list and the home grid are two hand-written lists of the same eight
   tabs, and CLAUDE.md already flags that they have to stay in step. This is the
   part a test can hold: that they agree on the order, so a tool is not third in
   one place and last in the other.

   Neither holds Home. In the grid it never did — that grid *is* the home page.
   In the nav list it stopped being a row when the sheet started laying the
   destinations out two to a line: the logo goes home from anywhere, and the
   pairs below only read as pairs if nothing odd sits in front of them. */

// search, rules, shop, loot, monsters, traps, spellbook, sheet
const order = [4, 8, 1, 3, 6, 7, 2, 5];

test('the nav list follows the shared order and does not open on Home', () => {
  expect(TABS.map((t) => t.id)).toEqual(order);
});

test('the home grid follows the same order', () => {
  expect(TILES.map((t) => t.id)).toEqual(order);
});

test('every tab is listed exactly once in each', () => {
  expect(new Set(TABS.map((t) => t.id)).size).toBe(TABS.length);
  expect(new Set(TILES.map((t) => t.id)).size).toBe(TILES.length);
});

test('the two agree about which tabs are master-only', () => {
  const tileMasterOnly = Object.fromEntries(TILES.map((t) => [t.id, !!t.masterOnly]));
  TABS.forEach((tab) => {
    expect(tab.masterOnly).toBe(tileMasterOnly[tab.id]);
  });
});
