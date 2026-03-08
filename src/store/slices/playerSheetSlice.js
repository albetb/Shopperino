import { createSlice } from '@reduxjs/toolkit';

const PLAYER_SHEET_CARD_KEYS = ['identity', 'abilityScores', 'Combat', 'Spells', 'Character', 'Notes'];

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
  combatPageCardsCollapsed: { player: false, combat: false, items: false },
  playerSpellbookPage: 0,
  playerSpellbookLevelCollapsed: [false, false, false, false, false, false, false, false, false, false],
  playerSpellbookClassDescCollapsed: true,
  playerSpellbookDomainDescCollapsed: false,
  playerSpellbookWizardSchoolsCollapsed: true,
  playerSpellbookSearchName: '',
  playerSpellbookSearchSchool: '',
  playerSpellbookShowShortDescriptions: true,
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
    setCombatPageCardCollapsed(state, action) {
      const { key, value } = action.payload || {};
      if (key && (key === 'player' || key === 'combat' || key === 'items')) {
        state.combatPageCardsCollapsed[key] = !!value;
      }
    },
    setPlayerSpellbookPage(state, action) {
      const p = action.payload;
      if (typeof p === 'number' && p >= 0 && p <= 2) state.playerSpellbookPage = p;
    },
    setPlayerSpellbookLevelCollapsed(state, action) {
      const arr = action.payload;
      if (Array.isArray(arr) && arr.length >= 10) state.playerSpellbookLevelCollapsed = arr.slice(0, 10);
    },
    setPlayerSpellbookClassDescCollapsed(state, action) {
      state.playerSpellbookClassDescCollapsed = !!action.payload;
    },
    setPlayerSpellbookDomainDescCollapsed(state, action) {
      state.playerSpellbookDomainDescCollapsed = !!action.payload;
    },
    setPlayerSpellbookWizardSchoolsCollapsed(state, action) {
      state.playerSpellbookWizardSchoolsCollapsed = !!action.payload;
    },
    setPlayerSpellbookSearchName(state, action) {
      state.playerSpellbookSearchName = typeof action.payload === 'string' ? action.payload : '';
    },
    setPlayerSpellbookSearchSchool(state, action) {
      state.playerSpellbookSearchSchool = typeof action.payload === 'string' ? action.payload : '';
    },
    setPlayerSpellbookShowShortDescriptions(state, action) {
      state.playerSpellbookShowShortDescriptions = !!action.payload;
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
  setCombatPageCardCollapsed,
  setPlayerSpellbookPage,
  setPlayerSpellbookLevelCollapsed,
  setPlayerSpellbookClassDescCollapsed,
  setPlayerSpellbookDomainDescCollapsed,
  setPlayerSpellbookWizardSchoolsCollapsed,
  setPlayerSpellbookSearchName,
  setPlayerSpellbookSearchSchool,
  setPlayerSpellbookShowShortDescriptions,
} = playerSheetSlice.actions;

export default playerSheetSlice.reducer;
