import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import persistReducer from './slices/persistSlice';
import cityReducer from './slices/citySlice';
import shopReducer from './slices/shopSlice';
import worldReducer from './slices/worldSlice';
import spellbookReducer from './slices/spellbookSlice';
import lootReducer from './slices/lootSlice';
import { persistSyncMiddleware } from './persistSyncMiddleware';

const store = configureStore({
  reducer: {
    app: appReducer,
    persist: persistReducer,
    world: worldReducer,
    city: cityReducer,
    shop: shopReducer,
    spellbook: spellbookReducer,
    loot: lootReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistSyncMiddleware),
});

export default store;
