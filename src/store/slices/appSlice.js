import { createSlice } from '@reduxjs/toolkit';
import * as db from '../../lib/storage';
import { getEffectByLink, getItemByLink, getSpellByLink, isMobile } from '../../lib/utils';
import { applyColors } from '../../lib/colorUtils';

const DEFAULT_BLUE = '#017474';
const DEFAULT_BLUE_T = '#015974b3';
const DEFAULT_BLUE_T2 = '#01597443';

export const DEFAULTS = {
  blue: DEFAULT_BLUE,
  blueT: DEFAULT_BLUE_T,
  blueT2: DEFAULT_BLUE_T2,
};

const initialState = {
  sidebarCollapsed: false,
  infoSidebarCollapsed: false,
  infoCards: [],
  currentTab: 100,
  mainColor: null
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    toggleInfoSidebar(state) {
      state.infoSidebarCollapsed = !state.infoSidebarCollapsed;
    },

    addCardByLink(state, action) {
      const { links: raw, bonus = 0 } = action.payload;
      const links = Array.isArray(raw) ? raw : [raw];

      state.infoCards = state.infoCards.filter(c => c.Link !== links[0]);

      let cards = getSpellByLink(links[0]);

      if (cards.length) {
        state.infoCards.unshift(...cards);
        if (isMobile()) state.infoSidebarCollapsed = false;
        return;
      }

      cards = getItemByLink(links[0], bonus);

      links.slice(1).forEach(link => {
        const effect = getEffectByLink(link);

        if (effect) {
          cards[0].Description = cards[0].Description + "<p><b>" + effect.Name + "</b></p>" + effect.Description;
          cards[0].Name = composeNameWithEffect(cards[0].Name, effect.Name);
        }
      });

      if (cards.length) {
        state.infoCards.unshift(...cards);
        state.infoSidebarCollapsed = false;
      }
    },

    removeCard(state, action) {
      const card = action.payload;
      state.infoCards = state.infoCards.filter(c => c.Link !== card.Link && c.Name !== card.Name);
    },

    clearInfoCards(state) {
      state.infoCards = [];
    },

    setStateCurrentTab(state, action) {
      state.currentTab = action.payload;
      db.setCurrentTab(action.payload);
    },

    setMainColor(state, action) {
      state.mainColor = action.payload; // expect a hex like '#1a2b3c'
      db.setMainColor(action.payload);
      applyColors(action.payload);
    },

    resetMainColor(state) {
      state.mainColor = null;
      db.setMainColor(null);
      applyColors(null);
    }
  }
});

function composeNameWithEffect(name, effect) {
  const suffixMatch = name.match(/(,perfect|\+[1-5])$/);
  const suffix = suffixMatch ? suffixMatch[1] : '';

  const base = suffixMatch
    ? name.slice(0, suffixMatch.index)
    : name;

  const trimmedBase = base.trim();
  const trimmedEffect = effect.trim();
  const joined = trimmedBase
    ? `${trimmedBase}, ${trimmedEffect}`
    : trimmedEffect;
  const space = suffix.includes("+") ? " " : "";

  return `${joined}${space}${suffix}`;
}

export const selectMainColor = state => state.app.mainColor;

export const {
  toggleSidebar,
  toggleInfoSidebar,
  addCardByLink,
  removeCard,
  clearInfoCards,
  setStateCurrentTab,
  setMainColor,
  resetMainColor
} = appSlice.actions;

export default appSlice.reducer;
