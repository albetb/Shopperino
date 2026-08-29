import { createSlice } from '@reduxjs/toolkit';

/**
 * The trap generator's state — and **none of it is persisted**.
 *
 * A rolled trap lives until the next roll. That is a deliberate decision, not
 * an omission: the whole app shares one ~5 MB localStorage key, and a trap is
 * a thing the master reads out once and then throws away. No new array in the
 * `app` object, no tuple schema, no `CURRENT_VERSION` bump, nothing against
 * the budget.
 */
const initialState = {
  /** The trap on the page: rolled, picked from the catalogue, or edited. */
  trap: null,
  /** What the roll button aims at. */
  targetCR: 3,
  /** '' means any of the three kinds. */
  rollType: '',
  /** The catalogue's filters. */
  filters: { name: '', type: '', minCR: 1, maxCR: 10 },
  isTrapSidebarCollapsed: false,
  isCatalogueCollapsed: true,
};

export const trapSlice = createSlice({
  name: 'trap',
  initialState,
  reducers: {
    setTrap(state, action) {
      state.trap = action.payload ?? null;
    },
    setTargetCR(state, action) {
      const cr = Math.max(1, Math.min(10, Math.round(Number(action.payload) || 1)));
      state.targetCR = cr;
    },
    setRollType(state, action) {
      state.rollType = action.payload ?? '';
    },
    setTrapFilters(state, action) {
      state.filters = { ...state.filters, ...(action.payload || {}) };
    },
    setIsTrapSidebarCollapsed(state, action) {
      state.isTrapSidebarCollapsed = Boolean(action.payload);
    },
    setIsCatalogueCollapsed(state, action) {
      state.isCatalogueCollapsed = Boolean(action.payload);
    },
  },
});

export const {
  setTrap,
  setTargetCR,
  setRollType,
  setTrapFilters,
  setIsTrapSidebarCollapsed,
  setIsCatalogueCollapsed,
} = trapSlice.actions;

export default trapSlice.reducer;
