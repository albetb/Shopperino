import { createSlice } from '@reduxjs/toolkit';
import { getCreatureByLink, getCompanionAbilityByLink, getFamiliarAbilityByLink, getConditionByLink, getEffectByLink, getFeatByLink, getItemByLink, getItemByRef, getSkillByLink, getSpellByLink, isMobile } from '../../lib/utils';
import { applyColors } from '../../lib/colorUtils';
import { normalizeMultiplierMask } from '../../lib/dice';

const DEFAULT_BLUE = '#238f8b';
const DEFAULT_BLUE_T = '#238f8bb3';
const DEFAULT_BLUE_T2 = '#238f8b43';

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
  theme: 'dark',      // 'dark' | 'light' — drives body.theme-* class
  accent: 'crimson',  // accent hue name — drives body.accent-* class
  /* Dice roller. Not tied to a character — it opens over any tab — so its
     state lives here rather than on the player sheet. The mask is one bit per
     count button; the roll is { sides, rolls, total } or null. */
  diceMultiplierMask: 1,
  diceLastRoll: null,
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

    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = !!action.payload;
    },

    setInfoSidebarCollapsed(state, action) {
      state.infoSidebarCollapsed = !!action.payload;
    },

    addCardByLink(state, action) {
      const { links: raw, bonus = 0, overrides = null, editKey = null } = action.payload;
      const links = Array.isArray(raw) ? raw : [raw];
      const firstLink = links[0];
      const linkStr = firstLink && String(firstLink);
      const hasHash = linkStr && linkStr.includes('#');
      const isSpellLink = linkStr && (linkStr.startsWith('spells#') || linkStr === 'spells');
      const isFeatLink = linkStr && (linkStr.startsWith('feats#') || linkStr === 'feats');
      const isSkillLink = linkStr && (linkStr.startsWith('skills#') || linkStr === 'skills');
      const isConditionLink = linkStr && linkStr.includes('abilitiesAndConditions#');
      // Creature stat-block anchors: the SRD splits creatures across pages, so links
      // use prefixes like "monstersAnimal#dog", "monstersDtoDe#bone-devil" and
      // "monstersVermin#monstrous-spider". Any "monsters…#" anchor is looked up
      // against animals + monsters + vermin (an unknown anchor returns no card).
      const isCreatureLink = linkStr && (/^monsters[A-Za-z]*#/.test(linkStr) || /^(animals|monsters|vermin)[/#]/.test(linkStr));
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

      if (isCreatureLink) {
        const creatureCards = getCreatureByLink(firstLink);
        if (creatureCards.length) {
          const newLinks = new Set(creatureCards.map(c => c.Link));
          state.infoCards = state.infoCards.filter(c => !newLinks.has(c.Link));
          state.infoCards.unshift(...creatureCards);
          state.infoSidebarCollapsed = false;
        }
        return;
      }

      if (linkStr && linkStr.startsWith('companionAbility#')) {
        const abilityCards = getCompanionAbilityByLink(linkStr);
        if (abilityCards.length) {
          const newLinks = new Set(abilityCards.map(c => c.Link));
          state.infoCards = state.infoCards.filter(c => !newLinks.has(c.Link));
          state.infoCards.unshift(...abilityCards);
          state.infoSidebarCollapsed = false;
        }
        return;
      }

      if (linkStr && linkStr.startsWith('familiarAbility#')) {
        const abilityCards = getFamiliarAbilityByLink(linkStr);
        if (abilityCards.length) {
          const newLinks = new Set(abilityCards.map(c => c.Link));
          state.infoCards = state.infoCards.filter(c => !newLinks.has(c.Link));
          state.infoCards.unshift(...abilityCards);
          state.infoSidebarCollapsed = false;
        }
        return;
      }

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

      cards = getItemByLink(firstLink, bonus, overrides);

      const nameOverridden = !!(overrides && typeof overrides === 'object' && overrides.Name !== undefined);
      const descriptionOverridden = !!(overrides && typeof overrides === 'object' && overrides.Description !== undefined);

      links.slice(1).forEach(link => {
        const effect = getEffectByLink(link);

        if (effect) {
          if (!descriptionOverridden) {
            cards[0].Description = cards[0].Description + "<p><b>" + effect.Name + "</b></p>" + effect.Description;
          }
          if (!nameOverridden) {
            cards[0].Name = composeNameWithEffect(cards[0].Name, effect.Name);
          }
        }
      });

      if (cards.length) {
        if (editKey && typeof editKey === 'object') {
          cards[0].editable = true;
          cards[0].editKey = editKey;
        }
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
    },

    /* Which count buttons are pressed, as a bitmask. The dice module owns
       both the toggle rule and the "never empty" fallback. */
    setDiceMultiplierMask(state, action) {
      state.diceMultiplierMask = normalizeMultiplierMask(action.payload);
    },

    /* The roll shown when the modal is reopened. Null clears it. */
    setDiceLastRoll(state, action) {
      const roll = action.payload;
      state.diceLastRoll = roll && Array.isArray(roll.rolls) && roll.rolls.length > 0
        ? { sides: roll.sides, rolls: [...roll.rolls], total: roll.total }
        : null;
    },

    setMainColor(state, action) {
      state.mainColor = action.payload; // expect a hex like '#1a2b3c'
      applyColors(action.payload);
    },

    resetMainColor(state) {
      state.mainColor = null;
      applyColors(null);
    },

    setSharedShop(state, action) {
      state.sharedShop = action.payload; // { name, gold, stock } or null
    },

    clearSharedShop(state) {
      state.sharedShop = null;
    },

    /**
     * Take one row of a scanned shop off the shelf.
     *
     * Local to this phone, and deliberately so: the scan is a snapshot, so two
     * players each see the full stock and neither sees the other's purchases.
     * It is dishonest about "this is what is left" and honest about "I bought
     * this", which is the half that stops the last healing potion being bought
     * three times by accident. The master reconciles at the table either way.
     */
    buySharedShopItem(state, action) {
      const { stockIndex, quantity } = action.payload ?? {};
      const entry = state.sharedShop?.stock?.[stockIndex];
      if (!entry) return;
      const taken = Math.max(0, Math.floor(Number(quantity) || 0));
      entry.Number = Math.max(0, (Number(entry.Number) || 0) - taken);
    },

    setMasterMode(state, action) {
      state.isMasterMode = !!action.payload;
    },

    setTheme(state, action) {
      const v = action.payload;
      state.theme = (v === 'light' || v === 'dark') ? v : 'dark';
    },

    setAccent(state, action) {
      const v = action.payload;
      state.accent = typeof v === 'string' && v ? v : 'crimson';
    },
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
export const selectTheme = state => state.app.theme ?? 'dark';
export const selectAccent = state => state.app.accent ?? 'crimson';

export const {
  toggleSidebar,
  toggleInfoSidebar,
  setSidebarCollapsed,
  setInfoSidebarCollapsed,
  addCardByLink,
  removeCard,
  clearInfoCards,
  setStateCurrentTab,
  setMainColor,
  resetMainColor,
  setSharedShop,
  clearSharedShop,
  buySharedShopItem,
  setMasterMode,
  setTheme,
  setAccent,
  setDiceMultiplierMask,
  setDiceLastRoll,
} = appSlice.actions;

export default appSlice.reducer;
