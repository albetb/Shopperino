import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  characters: [],
  selectedCharacterIndex: null,
  selectedCharacter: null,  // { name } for UI compat
  player: null,
  isPlayerSheetSidebarCollapsed: false,
  mainView: 'none', // 'none' | 'race' | 'class'
};

export const playerSheetSlice = createSlice({
  name: 'playerSheet',
  initialState,
  reducers: {
    setCharactersList(state, action) {
      state.characters = action.payload ?? [];
    },
    setSelectedCharacterIndex(state, action) {
      const i = action.payload;
      state.selectedCharacterIndex = i;
      state.selectedCharacter = (state.characters[i] != null) ? state.characters[i] : null;
    },
    setPlayer(state, action) {
      state.player = action.payload;
    },
    setIsPlayerSheetSidebarCollapsed(state, action) {
      state.isPlayerSheetSidebarCollapsed = !!action.payload;
    },
    setPlayerSheetMainView(state, action) {
      state.mainView = action.payload || 'none';
    },
  },
});

export const {
  setCharactersList,
  setSelectedCharacterIndex,
  setPlayer,
  setIsPlayerSheetSidebarCollapsed,
  setPlayerSheetMainView,
} = playerSheetSlice.actions;

export default playerSheetSlice.reducer;
