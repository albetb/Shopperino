import { createSlice } from '@reduxjs/toolkit';
import { getDefaultFilters } from '../../lib/monster/monsterFilters';

/**
 * Monster book tab state.
 *
 * `results` is the list produced by the last Search press — the list is not
 * live-filtered, since the master presses Search deliberately.
 *
 * `roster` is the creatures currently being run: an array of MonsterSheet
 * instances held as-is rather than serialized, the same pattern the player
 * sheet uses for its Player. It replaced a single `sheet`, which meant opening
 * a second stat block threw away the first one's hit points — a fight is
 * rarely one creature.
 *
 * `openIndex` is which roster entry has its sheet showing, or null while the
 * list is. It is an index rather than a reference so it cannot go stale
 * against a roster that has been rebuilt.
 */
const initialState = {
  filters: getDefaultFilters(),
  results: [],
  hasSearched: false,
  roster: [],
  openIndex: null,
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
    setMonsterRoster(state, action) {
      state.roster = Array.isArray(action.payload) ? action.payload : [];
      /* An open index that now names nothing closes the sheet rather than
         showing a different creature than the one the master was reading. */
      if (state.openIndex != null && !state.roster[state.openIndex]) {
        state.openIndex = null;
      }
    },
    setMonsterOpenIndex(state, action) {
      const index = action.payload;
      state.openIndex = (Number.isInteger(index) && state.roster[index]) ? index : null;
    },
  },
});

export const {
  setMonsterFilters,
  setMonsterResults,
  clearMonsterResults,
  setMonsterRoster,
  setMonsterOpenIndex,
} = monsterBookSlice.actions;

export default monsterBookSlice.reducer;
