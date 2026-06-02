import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import persistReducer from './slices/persistSlice';
import cityReducer from './slices/citySlice';
import shopReducer from './slices/shopSlice';
import worldReducer from './slices/worldSlice';
import spellbookReducer from './slices/spellbookSlice';
import lootReducer from './slices/lootSlice';
import playerSheetReducer from './slices/playerSheetSlice';
import { persistSyncMiddleware } from './persistSyncMiddleware';

const store = configureStore({
  reducer: {
    app: appReducer,
    persist: persistReducer,
    world: worldReducer,
    city: cityReducer,
    shop: shopReducer,
    spellbook: spellbookReducer,
    loot: lootReducer,
    playerSheet: playerSheetReducer,
  },
  // Domain models (Player, Spellbook, Shop, World, City, Loot) are stored as
  // live class instances per the project's architecture (see CLAUDE.md →
  // Domain Models). Toolkit's serializableCheck warns about them on every
  // action; disable it. Persistence goes through each class's serialize()
  // in src/lib/appState.js, not via the store snapshot.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(persistSyncMiddleware),
});

export default store;
