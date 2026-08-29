import { configureStore } from '@reduxjs/toolkit';
import appReducer from '../slices/appSlice';
import Player from '../../lib/player';
import { onBuyFromSharedShop } from './playerSheetThunks';

/* Buying out of a scanned shop, end to end.
 *
 * One press is one act, and the act has three halves that have to happen
 * together or not at all: the item lands in the bag, the gold leaves the
 * purse, and the shop's shelf goes down. Each is tested apart from the others
 * elsewhere; this file is about them happening as one thing.
 */

function storeWith(player, stock) {
  const app = { ...appReducer(undefined, { type: '@@init' }), sharedShop: { name: 'Gundren', gold: 500, stock } };
  return configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (state = { player }) => state,
      /* `pss: null` makes persistPlayer return before it touches localStorage,
         so the player instance is mutated in place and read back directly —
         the same harness potionThunks.test.js uses. */
      persist: (state = { pss: null }) => state,
    },
    preloadedState: { app },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

function pc(gold = 100) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(3);
  p.setGold(gold);
  return p;
}

const row = (over = {}) => ({
  Name: 'Dagger', ItemType: 'Weapon', Number: 4, Cost: 2, stockIndex: 0, ...over,
});

const countOf = (p, name) => p.getInventory().find((r) => r.Name === name)?.Number ?? 0;

describe('one press does all three things', () => {
  test('the item is in the bag', () => {
    const p = pc();
    storeWith(p, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true, ItemType: 'Weapon' }])
      .dispatch(onBuyFromSharedShop(row(), 2, 4));
    expect(countOf(p, 'Dagger')).toBe(2);
  });

  test('the gold is out of the purse', () => {
    const p = pc(100);
    storeWith(p, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true }])
      .dispatch(onBuyFromSharedShop(row(), 2, 4));
    expect(p.getGold()).toBe(96);
  });

  test('and the shop has two fewer', () => {
    const p = pc();
    const store = storeWith(p, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true }]);
    store.dispatch(onBuyFromSharedShop(row(), 2, 4));
    expect(store.getState().app.sharedShop.stock[0].Number).toBe(2);
  });
});

describe('the price is the one that was agreed, not the one on the shelf', () => {
  test('a discount takes only what was paid', () => {
    // The whole reason the price box is editable.
    const p = pc(100);
    storeWith(p, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true }])
      .dispatch(onBuyFromSharedShop(row(), 2, 1));
    expect(p.getGold()).toBe(99);
  });

  test('a gift costs nothing and still hands the item over', () => {
    const p = pc(100);
    storeWith(p, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true }])
      .dispatch(onBuyFromSharedShop(row(), 1, 0));
    expect(p.getGold()).toBe(100);
    expect(countOf(p, 'Dagger')).toBe(1);
  });
});

describe('a purchase is never refused for want of money', () => {
  test('the item still arrives, and the purse empties rather than going negative', () => {
    /* The app computes and displays, and does not enforce — a master saying
       "you can owe me" is a real table moment. `Player.setGold` floors at
       zero, so the debt lives at the table rather than in the sheet, which is
       why the drawer states the shortfall before the press. */
    const p = pc(10);
    storeWith(p, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true }])
      .dispatch(onBuyFromSharedShop(row(), 1, 50));
    expect(countOf(p, 'Dagger')).toBe(1);
    expect(p.getGold()).toBe(0);
  });
});

describe('what a row carries with it', () => {
  test('an enhancement bonus survives the trip into the bag', () => {
    const p = pc(1000);
    storeWith(p, [{ Number: 1, Cost: 300, link: 'items/Weapon/longsword', Bonus: 1 }])
      .dispatch(onBuyFromSharedShop(
        { Name: 'Longsword +1', ItemType: 'Weapon', Number: 1, Cost: 300, Link: 'items/Weapon/longsword', Bonus: 1, stockIndex: 0 },
        1, 300,
      ));
    const entry = p.getInventory()[0];
    expect(entry.bonus).toBe(1);
    expect(entry.Link).toBe('items/Weapon/longsword');
  });
});

describe('the edges', () => {
  test('buying with no character loaded does nothing at all', () => {
    const store = storeWith(null, [{ Name: 'Dagger', Number: 4, Cost: 2, isCustom: true }]);
    store.dispatch(onBuyFromSharedShop(row(), 1, 2));
    expect(store.getState().app.sharedShop.stock[0].Number).toBe(4);
  });

  test('the shelf cannot go below zero', () => {
    const p = pc();
    const store = storeWith(p, [{ Name: 'Dagger', Number: 1, Cost: 2, isCustom: true }]);
    store.dispatch(onBuyFromSharedShop(row({ Number: 1 }), 5, 2));
    expect(store.getState().app.sharedShop.stock[0].Number).toBe(0);
  });

  test('the row is found by its stock index, not by its position in the list', () => {
    /* Sold-out rows are dropped and the rest are sorted before they reach the
       drawer, so the two arrays do not line up — and a shop can stock the same
       item twice at different prices, so the name is no better. */
    const p = pc();
    const store = storeWith(p, [
      { Name: 'Dagger', Number: 0, Cost: 2, isCustom: true },
      { Name: 'Rope', Number: 3, Cost: 1, isCustom: true },
    ]);
    store.dispatch(onBuyFromSharedShop(
      { Name: 'Rope', ItemType: 'Good', Number: 3, Cost: 1, stockIndex: 1 }, 1, 1,
    ));
    expect(store.getState().app.sharedShop.stock[1].Number).toBe(2);
    expect(store.getState().app.sharedShop.stock[0].Number).toBe(0);
  });
});
