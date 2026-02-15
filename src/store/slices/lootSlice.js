import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loots: [],           // [{ timestamp }]
  selectedLoot: null,  // { Id: index, Name: timestamp } for UI compat
  loot: null,
  isLootSidebarCollapsed: false,
};

export const lootSlice = createSlice({
  name: 'loot',
  initialState,
  reducers: {
    setLootsList(state, action) {
      state.loots = action.payload ?? [];
    },
    setSelectedLootIndex(state, action) {
      const i = action.payload;
      state.selectedLoot = (state.loots[i] != null) ? { Id: i, Name: state.loots[i].timestamp } : null;
    },
    setLoot(state, action) {
      state.loot = action.payload;
    },
    resetLoot(state) {
      state.selectedLoot = null;
      state.loot = null;
    },
    setIsLootSidebarCollapsed(state, action) {
      state.isLootSidebarCollapsed = action.payload;
    },
  },
});

export const {
  setLootsList,
  setSelectedLootIndex,
  setLoot,
  resetLoot,
  setIsLootSidebarCollapsed,
} = lootSlice.actions;

export default lootSlice.reducer;