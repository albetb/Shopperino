import { createSlice } from '@reduxjs/toolkit';
import * as db from '../../lib/storage';
import { getConditionByLink, getEffectByLink, getFeatByLink, getItemByLink, getItemByRef, getSkillByLink, getSpellByLink, isMobile } from '../../lib/utils';
import { applyColors } from '../../lib/colorUtils';

const DEFAULT_BLUE = '#2fa6a1';
const DEFAULT_BLUE_T = '#2a9591b3';
const DEFAULT_BLUE_T2 = '#2a959143';

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
  mainColor: null,
  sharedShop: null, // { name, gold, stock } when viewing a scanned shop (read-only)
  isMasterMode: false, // false = Player (hide Shop/Loot), true = Master (show all)
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
      const firstLink = links[0];
      const linkStr = firstLink && String(firstLink);
      const hasHash = linkStr && linkStr.includes('#');
      const isSpellLink = linkStr && (linkStr.startsWith('spells#') || linkStr === 'spells');
      const isFeatLink = linkStr && (linkStr.startsWith('feats#') || linkStr === 'feats');
      const isSkillLink = linkStr && (linkStr.startsWith('skills#') || linkStr === 'skills');
      const isConditionLink = linkStr && linkStr.includes('abilitiesAndConditions#');
      const conditionAnchor = isConditionLink ? linkStr.split('#')[1] : null;
      const spellLookupLink = isSpellLink
        ? (hasHash ? linkStr.split('#')[1] : firstLink)
        : null;
      const featLookupLink = isFeatLink && hasHash ? linkStr.split('#')[1] : null;
      const skillLookupLink = isSkillLink && hasHash ? linkStr.split('#')[1] : null;

      state.infoCards = state.infoCards.filter(c => {
        if (c.Link === firstLink) return false;
        if (conditionAnchor && c.Link === conditionAnchor) return false;
        if (spellLookupLink && c.Link === spellLookupLink) return false;
        if (featLookupLink && c.Link === featLookupLink) return false;
        if (skillLookupLink && c.Link === skillLookupLink) return false;
        return true;
      });

      let cards = spellLookupLink ? getSpellByLink(spellLookupLink) : [];

      if (cards.length) {
        state.infoCards.unshift(...cards);
        state.infoSidebarCollapsed = false;
        return;
      }

      if (isSpellLink) return;

      cards = getConditionByLink(conditionAnchor ?? firstLink);

      if (cards.length) {
        state.infoCards.unshift(...cards);
        state.infoSidebarCollapsed = false;
        return;
      }

      cards = getFeatByLink(featLookupLink ?? (isFeatLink ? firstLink : null));

      if (cards.length) {
        state.infoCards.unshift(...cards);
        state.infoSidebarCollapsed = false;
        return;
      }

      if (isFeatLink) return;

      cards = getSkillByLink(skillLookupLink ?? (isSkillLink ? firstLink : null));

      if (cards.length) {
        state.infoCards.unshift(...cards);
        if (isMobile()) state.infoSidebarCollapsed = false;
        return;
      }

      if (isSkillLink) return;

      // Fallback: if this looks like a plain spell slug (and not explicitly a feat/skill/condition),
      // prefer opening the spell card instead of an item/scroll card.
      if (!isSpellLink && !isFeatLink && !isSkillLink && !isConditionLink && linkStr) {
        const plainSpellSlug = hasHash ? linkStr.split('#')[1] : linkStr;
        const spellCards = getSpellByLink(plainSpellSlug);
        if (spellCards.length) {
          state.infoCards.unshift(...spellCards);
          state.infoSidebarCollapsed = false;
          return;
        }
      }

      const itemRef = linkStr && linkStr.includes('/') ? getItemByRef(firstLink) : null;
      const spellSlug = itemRef?.raw?.Link && getSpellByLink(itemRef.raw.Link).length ? itemRef.raw.Link : null;
      if (spellSlug) {
        cards = getSpellByLink(spellSlug);
        if (cards.length) {
          state.infoCards = state.infoCards.filter(c => c.Link !== spellSlug);
          state.infoCards.unshift(...cards);
          if (isMobile()) state.infoSidebarCollapsed = false;
          return;
        }
      }

      cards = getItemByLink(firstLink, bonus);

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
    },

    setSharedShop(state, action) {
      state.sharedShop = action.payload; // { name, gold, stock } or null
    },

    clearSharedShop(state) {
      state.sharedShop = null;
    },

    setMasterMode(state, action) {
      state.isMasterMode = !!action.payload;
      db.setIsMasterMode(state.isMasterMode);
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
  resetMainColor,
  setSharedShop,
  clearSharedShop,
  setMasterMode
} = appSlice.actions;

export default appSlice.reducer;
