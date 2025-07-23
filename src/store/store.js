import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import cityReducer from './slices/citySlice';
import shopReducer from './slices/shopSlice';
import worldReducer from './slices/worldSlice';
import spellbookReducer from './slices/spellbookSlice';
import lootReducer from './slices/lootSlice';

const store = configureStore({
  reducer: {
    app: appReducer,
    world: worldReducer,
    city: cityReducer,
    shop: shopReducer,
    spellbook: spellbookReducer,
    loot: lootReducer
  },
});

export default store;
