import { createSlice } from '@reduxjs/toolkit';
import { isMobile } from '../../lib/utils';

const initialState = {
  spellbooks: [],
  selectedSpellbook: null,  // { Name } for UI compat
  spellbook: null,
  spellbookPage: 0,
  isSpellbookSidebarCollapsed: false,
  isSpellTableCollapsed: [false, false, false, false, false, false, false, false, false, false],
  isClassDescriptionCollapsed: true,
  isDomainDescriptionCollapsed: false,
  searchSpellName: false,
  searchSpellSchool: false,
  showShortDescriptions: true,
};

export const spellbookSlice = createSlice({
  name: 'spellbook',
  initialState,
  reducers: {
    setSpellbooksList(state, action) {
      state.spellbooks = action.payload ?? [];
    },
    setSelectedSpellbookIndex(state, action) {
      const i = action.payload;
      state.selectedSpellbook = (state.spellbooks[i] != null) ? { Name: state.spellbooks[i].name } : null;
    },
    setSpellbook(state, action) {
      state.spellbook = action.payload;
    },
    setSpellbookPage(state, action) {
      if (isMobile()) state.isSpellbookSidebarCollapsed = true;
      state.spellbookPage = action.payload;
    },
    setSpellbookPageNoCollapsing(state, action) {
      state.spellbookPage = action.payload;
    },
    setIsSpellTableCollapsed(state, action) {
      state.isSpellTableCollapsed = action.payload;
    },
    setIsSpellbookSidebarCollapsed(state, action) {
      state.isSpellbookSidebarCollapsed = action.payload;
    },
    setIsClassDescriptionCollapsed(state, action) {
      state.isClassDescriptionCollapsed = action.payload;
    },
    setIsDomainDescriptionCollapsed(state, action) {
      state.isDomainDescriptionCollapsed = action.payload;
    },
    setSearchSpellName(state, action) {
      state.searchSpellName = action.payload;
    },
    setSearchSpellSchool(state, action) {
      state.searchSpellSchool = action.payload;
    },
    setShowShortDescriptions(state, action) {
      state.showShortDescriptions = action.payload;
    },
  },
});

export const {
  setSpellbooksList,
  setSelectedSpellbookIndex,
  setSpellbook,
  setSpellbookPage,
  setSpellbookPageNoCollapsing,
  setIsSpellTableCollapsed,
  setIsSpellbookSidebarCollapsed,
  setIsClassDescriptionCollapsed,
  setIsDomainDescriptionCollapsed,
  setSearchSpellName,
  setSearchSpellSchool,
  setShowShortDescriptions,
} = spellbookSlice.actions;

export default spellbookSlice.reducer;