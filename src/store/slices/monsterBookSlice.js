import { createSlice } from '@reduxjs/toolkit';
import { getDefaultFilters } from '../../lib/monster/monsterFilters';

/**
 * Monster book tab state.
 *
 * `results` is the list produced by the last Search press — the list is not
 * live-filtered, since the master presses Search deliberately. `sheet` is the
 * one open monster, or null while the list is showing.
 */
const initialState = {
  filters: getDefaultFilters(),
  results: [],
  hasSearched: false,
  sheet: null,
};

export const monsterBookSlice = createSlice({
  name: 'monsterBook',
  initialState,
  reducers: {
    setMonsterFilters(state, action) {
      state.filters = { ...state.filters, ...(action.payload || {}) };
    },
    setMonsterResults(state, action) {
      state.results = Array.isArray(action.payload) ? action.payload : [];
      state.hasSearched = true;
    },
    clearMonsterResults(state) {
      state.results = [];
      state.hasSearched = false;
    },
    /* The open sheet is a MonsterSheet instance, held as-is rather than
       serialized — the same pattern the player sheet uses for its Player. */
    setMonsterSheet(state, action) {
      state.sheet = action.payload ?? null;
    },
  },
});

export const {
  setMonsterFilters,
  setMonsterResults,
  clearMonsterResults,
  setMonsterSheet,
} = monsterBookSlice.actions;

export default monsterBookSlice.reducer;
