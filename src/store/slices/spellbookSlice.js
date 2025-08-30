import { createSlice } from '@reduxjs/toolkit';
import * as db from '../../lib/storage';
import { isMobile, serialize } from '../../lib/utils';

const initialState = {
  spellbooks: [],
  selectedSpellbook: null,
  spellbook: null,
  spellbookPage: 0, // 0: learn, 1: prepare, 2: spellbook
  isSpellbookSidebarCollapsed: false,
  isSpellTableCollapsed: [false, false, false, false, false, false, false, false, false, false],
  isClassDescriptionCollapsed: true,
  isDomainDescriptionCollapsed: false,
  searchSpellName: false,
  searchSpellSchool: false,
};

export const spellbookSlice = createSlice({
  name: 'spellbook',
  initialState,
  reducers: {
    setSpellbooks(state, action) {
      db.setSpellbooks(action.payload);
      state.spellbooks = action.payload;
    },
    setSelectedSpellbook(state, action) {
      db.setSelectedSpellbook(action.payload);
      state.selectedSpellbook = action.payload;
    },
    setSpellbook: {
      reducer(state, action) {
        db.setSpellbook(action.payload);
        state.spellbook = action.payload;
      },
      prepare(spellbookInstance) {
        return { payload: serialize(spellbookInstance) };
      }
    },
    setSpellbookPage(state, action) {
      if (isMobile()) {
        db.setIsSpellbookSidebarCollapsed(true);
        state.isSpellbookSidebarCollapsed = true;
      }
      db.setSpellbookPage(action.payload);
      state.spellbookPage = action.payload;
    },
    setSpellbookPageNoCollapsing(state, action) {
      db.setSpellbookPage(action.payload);
      state.spellbookPage = action.payload;
    },
    setIsSpellTableCollapsed(state, action) {
      db.setIsSpellTableCollapsed(action.payload);
      state.isSpellTableCollapsed = action.payload;
    },
    setIsSpellbookSidebarCollapsed(state, action) {
      db.setIsSpellbookSidebarCollapsed(action.payload);
      state.isSpellbookSidebarCollapsed = action.payload;
    },
    setIsClassDescriptionCollapsed(state, action) {
      db.setIsClassDescriptionCollapsed(action.payload);
      state.isClassDescriptionCollapsed = action.payload;
    },
    setIsDomainDescriptionCollapsed(state, action) {
      db.setIsDomainDescriptionCollapsed(action.payload);
      state.isDomainDescriptionCollapsed = action.payload;
    },
    setSearchSpellName(state, action) {
      db.setSearchSpellName(action.payload);
      state.searchSpellName = action.payload;
    },
    setSearchSpellSchool(state, action) {
      db.setSearchSpellSchool(action.payload);
      state.searchSpellSchool = action.payload;
    }
  }
});

export const {
  setSpellbooks,
  setSelectedSpellbook,
  setSpellbook,
  setSpellbookPage,
  setSpellbookPageNoCollapsing,
  setIsSpellTableCollapsed,
  setIsSpellbookSidebarCollapsed,
  setIsClassDescriptionCollapsed,
  setIsDomainDescriptionCollapsed,
  setSearchSpellName,
  setSearchSpellSchool
} = spellbookSlice.actions;

export default spellbookSlice.reducer;