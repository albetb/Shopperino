import { createSlice } from '@reduxjs/toolkit';

const PLAYER_SHEET_CARD_KEYS = ['identity', 'abilityScores', 'Combat', 'Skills', 'Inventory', 'Details', 'Notes'];

function defaultCardCollapsed() {
  return Object.fromEntries(PLAYER_SHEET_CARD_KEYS.map(k => [k, false]));
}

const initialState = {
  characters: [],
  selectedCharacterIndex: null,
  selectedCharacter: null,  // { name } for UI compat
  player: null,
  isPlayerSheetSidebarCollapsed: false,
  mainView: 'none', // 'none' | 'race' | 'class' | 'note'
  cardCollapsed: defaultCardCollapsed(),
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
    setPlayerSheetCardCollapsed(state, action) {
      const { key, value } = action.payload || {};
      if (key && PLAYER_SHEET_CARD_KEYS.includes(key)) {
        state.cardCollapsed[key] = !!value;
      }
    },
    setPlayerSheetCardsCollapsed(state, action) {
      const obj = action.payload;
      if (obj && typeof obj === 'object') {
        PLAYER_SHEET_CARD_KEYS.forEach(k => {
          if (obj[k] !== undefined) state.cardCollapsed[k] = !!obj[k];
        });
      }
    },
  },
});

export const {
  setCharactersList,
  setSelectedCharacterIndex,
  setPlayer,
  setIsPlayerSheetSidebarCollapsed,
  setPlayerSheetMainView,
  setPlayerSheetCardCollapsed,
  setPlayerSheetCardsCollapsed,
} = playerSheetSlice.actions;

export default playerSheetSlice.reducer;
