import { configureStore } from '@reduxjs/toolkit';
import appReducer, {
  setSharedShop,
  setSharedShopSheetOpen,
  setStateCurrentTab,
} from '../../store/slices/appSlice';
import playerSheetReducer, { setPlayerSheetMainView } from '../../store/slices/playerSheetSlice';
import Player from '../../lib/player';
import { scanLanding } from '../../lib/shop';

/* Where a scanned shop lands.
 *
 * There is no button behind this any more — the old "Buy on «character»"
 * pointer is gone — so the routing *is* the feature, and it has to be tested
 * as the decision it is rather than through the camera that triggers it.
 *
 * The rule mirrors what the person is plainly doing: scanning with your own
 * sheet in front of you means you are about to buy something, so the shop
 * opens there. Scanning from anywhere else opens the read-only list.
 */

const SHOP = { name: 'Gundren', gold: 500, stock: [{ Name: 'Rope', Number: 2, Cost: 1, isCustom: true }] };

function pc() {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(1);
  return p;
}

function storeOn(tab, player) {
  return configureStore({
    reducer: { app: appReducer, playerSheet: playerSheetReducer },
    preloadedState: {
      app: { ...appReducer(undefined, { type: '@@init' }), currentTab: tab },
      playerSheet: { ...playerSheetReducer(undefined, { type: '@@init' }), player },
    },
    middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
  });
}

/**
 * What `handleScanSuccess` in top_menu.jsx does with a decoded shop.
 *
 * The decision itself comes from `scanLanding` — the same function the handler
 * calls — rather than being written out again here. A copy would pass even if
 * the handler were deleted, which is the one thing this file exists to catch.
 */
function land(store, shop) {
  const { currentTab } = store.getState().app;
  const hasCharacter = !!store.getState().playerSheet?.player;
  store.dispatch(setSharedShop(shop));
  const { openOnSheet, goToTab } = scanLanding({ currentTab, hasCharacter });
  if (openOnSheet) {
    store.dispatch(setPlayerSheetMainView('inventory'));
    store.dispatch(setSharedShopSheetOpen(true));
  } else {
    store.dispatch(setStateCurrentTab(goToTab));
  }
}

describe('scanning while the character sheet is open', () => {
  test('the shop opens there, with no tab change', () => {
    const store = storeOn(5, pc());
    land(store, SHOP);
    expect(store.getState().app.currentTab).toBe(5);
    expect(store.getState().app.sharedShopSheetOpen).toBe(true);
  });

  test('and the Inventory page is the one showing, since the card lives on it', () => {
    /* The drawer is rendered by a card on the Inventory page. Landing on the
       Combat page would open a sheet that is not mounted — that is, nothing. */
    const store = storeOn(5, pc());
    store.dispatch(setPlayerSheetMainView('combat'));
    land(store, SHOP);
    expect(store.getState().playerSheet.mainView).toBe('inventory');
  });
});

describe('scanning from anywhere else', () => {
  test('opens the read-only list on the Shop tab, as it always has', () => {
    const store = storeOn(0, pc());
    land(store, SHOP);
    expect(store.getState().app.currentTab).toBe(1);
    expect(store.getState().app.sharedShopSheetOpen).toBe(false);
  });

  test('the sheet tab with no character loaded still goes to the Shop tab', () => {
    // There is nothing to buy for, so the drawer would have nothing to open.
    const store = storeOn(5, null);
    land(store, SHOP);
    expect(store.getState().app.currentTab).toBe(1);
    expect(store.getState().app.sharedShopSheetOpen).toBe(false);
  });
});

describe('either way', () => {
  test('the shop itself is held', () => {
    const onSheet = storeOn(5, pc());
    const elsewhere = storeOn(2, pc());
    land(onSheet, SHOP);
    land(elsewhere, SHOP);
    expect(onSheet.getState().app.sharedShop.name).toBe('Gundren');
    expect(elsewhere.getState().app.sharedShop.name).toBe('Gundren');
  });
});

describe('the decision on its own', () => {
  test('the sheet with a character is the only case that opens in place', () => {
    expect(scanLanding({ currentTab: 5, hasCharacter: true })).toEqual({ openOnSheet: true, goToTab: null });
    expect(scanLanding({ currentTab: 5, hasCharacter: false })).toEqual({ openOnSheet: false, goToTab: 1 });
    expect(scanLanding({ currentTab: 1, hasCharacter: true })).toEqual({ openOnSheet: false, goToTab: 1 });
    expect(scanLanding({ currentTab: 0, hasCharacter: true })).toEqual({ openOnSheet: false, goToTab: 1 });
  });
});
