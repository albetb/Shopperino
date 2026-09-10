import { configureStore } from '@reduxjs/toolkit';
import appReducer from '../slices/appSlice';
import playerSheetReducer from '../slices/playerSheetSlice';
import persistReducer from '../slices/persistSlice';
import Player from '../../lib/player';
import { onGiveInventoryItem, onReceiveGift, onAcceptGift } from './playerSheetThunks';
import { giftFromInventoryEntry } from '../../lib/share';

/**
 * Handing an item from one phone to another, both ends.
 *
 * The two halves never meet — there is no server, only a code on a screen —
 * so each end is its own act: one bag loses the item when its owner says so,
 * the other gains it when its owner says so. What is tested here is that each
 * press does the whole of its own half.
 */

const sword = () => ({
  Name: 'Longsword', ItemType: 'Weapon', Number: 1, Link: 'items/Weapon/longsword',
});

function pc() {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(1);
  return p;
}

/* `pss: null` stops persistPlayer before localStorage, so the instance is
   mutated in place and read back — the harness the other thunk tests use. */
function storeWith(player, persist = { pss: null }) {
  return configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (state = { player }) => state,
      persist: (state = persist) => state,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

describe('giving', () => {
  test('the item leaves the bag, and the hand holding the last one lets go', () => {
    const p = pc();
    p.addInventoryItem('Longsword', 'Weapon', 1, 'items/Weapon/longsword');
    p.equipItem('rh1', { name: 'Longsword', link: 'items/Weapon/longsword' });
    storeWith(p).dispatch(onGiveInventoryItem(giftFromInventoryEntry(sword(), 1)));
    expect(p.getInventory()).toHaveLength(0);
    expect(p.getEquipment().rh1).toBeUndefined();
  });

  test('a +1 flaming sword is given as one, not as a sword', () => {
    const p = pc();
    p.addInventoryItem('Longsword', 'Weapon', 2, 'items/Weapon/longsword', { bonus: 1, effectIds: [3] });
    const gift = giftFromInventoryEntry({
      ...sword(), Number: 2, bonus: 1, effectIds: [3],
    }, 1);
    storeWith(p).dispatch(onGiveInventoryItem(gift));
    const row = p.getInventory()[0];
    expect(row.Number).toBe(1);
    expect(row.bonus).toBe(1);
    expect(row.effectIds).toEqual([3]);
  });
});

describe('receiving', () => {
  test('with no character saved there is nobody to offer it to', () => {
    const store = storeWith(null, { pss: null, psc: [] });
    expect(store.dispatch(onReceiveGift(giftFromInventoryEntry(sword(), 1)))).toBe(false);
    expect(store.getState().app.incomingGift).toBeNull();
  });

  test('the offer opens on the bag of the character in front of the reader', () => {
    const p = pc();
    const store = storeWith(p, { pss: null, psc: [{}] });
    expect(store.dispatch(onReceiveGift(giftFromInventoryEntry(sword(), 1)))).toBe(true);
    expect(store.getState().app.currentTab).toBe(5);
    expect(store.getState().app.incomingGift.name).toBe('Longsword');
  });

  test('nothing is in the bag until it is accepted', () => {
    const p = pc();
    const store = storeWith(p, { pss: null, psc: [{}] });
    store.dispatch(onReceiveGift(giftFromInventoryEntry(sword(), 1)));
    expect(p.getInventory()).toHaveLength(0);
    store.dispatch(onAcceptGift());
    expect(p.getInventory()[0]).toMatchObject({ Name: 'Longsword', Number: 1 });
    expect(store.getState().app.incomingGift).toBeNull();
  });
});

describe('with no sheet open at all', () => {
  /* The real slices, because this is the one path that reads localStorage:
     the phone was on the rules tab, and the gift has to find the character it
     was last used for. */
  function realStore() {
    const saved = pc();
    saved.setName('Kaleb');
    const app = { psc: [saved.serialize()], pss: 0 };
    return configureStore({
      reducer: { app: appReducer, playerSheet: playerSheetReducer, persist: persistReducer },
      preloadedState: { persist: app },
      middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
    });
  }

  test('the last character this phone was used for is the one offered it', () => {
    const store = realStore();
    expect(store.dispatch(onReceiveGift(giftFromInventoryEntry(sword(), 1)))).toBe(true);
    expect(store.getState().playerSheet.player?.getName()).toBe('Kaleb');
    expect(store.getState().playerSheet.mainView).toBe('inventory');
    expect(store.getState().app.currentTab).toBe(5);
  });

  test('and accepting puts the item in that character\'s bag', () => {
    const store = realStore();
    store.dispatch(onReceiveGift(giftFromInventoryEntry({ ...sword(), Number: 3 }, 3)));
    store.dispatch(onAcceptGift());
    const inventory = store.getState().playerSheet.player.getInventory();
    expect(inventory[0]).toMatchObject({ Name: 'Longsword', Number: 3 });
  });
});
