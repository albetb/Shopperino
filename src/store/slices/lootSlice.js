import { createSlice } from '@reduxjs/toolkit';
import * as db from '../../lib/storage';
import { serialize } from '../../lib/utils';

const initialState = {
  loots: [],
  selectedLoot: null,
  loot: null,
  isLootSidebarCollapsed: false
};

export const lootSlice = createSlice({
  name: 'loot',
  initialState,
  reducers: {
    setLoots(state, action) {
      db.setLoots(action.payload);
      state.loots = action.payload;
    },
    setSelectedLoot(state, action) {
      db.setSelectedLoot(action.payload);
      state.selectedLoot = action.payload;
    },
    setLoot: {
      reducer(state, action) {
        if (action.payload?.Id) {
          db.setLoot(action.payload);
          state.loot = action.payload;
        }
      },
      prepare(lootInstance) {
        return { payload: serialize(lootInstance) };
      }
    },
    setIsLootSidebarCollapsed(state, action) {
      db.setIsLootSidebarCollapsed(action.payload);
      state.isLootSidebarCollapsed = action.payload;
    }
  }
});

export const {
  setLoots,
  setSelectedLoot,
  setLoot,
  setIsLootSidebarCollapsed,
} = lootSlice.actions;

export default lootSlice.reducer;