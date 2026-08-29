import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MainPage from './components/main_page/main_page';
import InfoSidebar from './components/menus/info_sidebar/info_sidebar';
import LootSidebar from './components/menus/loot_sidebar/loot_sidebar';
import TrapSidebar from './components/menus/trap_sidebar/trap_sidebar';
import ShopSidebar from './components/menus/shop_sidebar/shop_sidebar';
import SpellbookSidebar from './components/menus/spellbook_sidebar/spellbook_sidebar';
import PlayerSheetSidebar from './components/menus/player_sheet_sidebar/player_sheet_sidebar';
import PlayerSheetBottomNav from './components/player_sheet/PlayerSheetBottomNav';
import TopMenu from './components/menus/top_menu';
import { ShopInventory } from './components/shop';
import SpellbookTable from './components/spellbook/spellbook_table';
import SearchPage from './components/search/search_page';
import PlayerSheetPage from './components/player_sheet/player_sheet_page';
import MonsterBookPage from './components/monster_book/monster_book_page';
import TrapPage from './components/trap/trap_page';
import * as db from './lib/storage';
import { preloadCreatureData } from './lib/loadFile';
import useCreatureData from './components/hooks/useCreatureData';
import { serialize } from './lib/utils';
import {
  setStateCurrentTab,
  setMainColor,
  clearSharedShop,
  setMasterMode,
  setSidebarCollapsed,
  setInfoSidebarCollapsed,
  setTheme,
  setAccent,
  setUnits,
  setDiceMultiplierMask,
  setDiceLastRoll,
  selectTheme,
  selectAccent
} from './store/slices/appSlice';
import {
  setSpellbookPage,
  setSpellbooksList,
  setSelectedSpellbookIndex,
  setSpellbook,
  setIsSpellTableCollapsed,
  setIsSpellbookSidebarCollapsed,
  setIsClassDescriptionCollapsed,
  setIsDomainDescriptionCollapsed,
  setSearchSpellName,
  setSearchSpellSchool,
  setShowShortDescriptions,
} from './store/slices/spellbookSlice';
import {
  setLootsList,
  setSelectedLootIndex,
  setLoot,
  setIsLootSidebarCollapsed,
} from './store/slices/lootSlice';
import { setShop, setShopGenerated } from './store/slices/shopSlice';
import { setCity } from './store/slices/citySlice';
import { setWorldsList, setSelectedWorldIndex, setWorld } from './store/slices/worldSlice';
import { setCharactersList, setSelectedCharacterIndex, setPlayer, setIsPlayerSheetSidebarCollapsed, setPlayerSheetMainView, setPlayerSheetCardsCollapsed, setCombatPageCardsCollapsed } from './store/slices/playerSheetSlice';
import { setMonsterFilters, setMonsterRoster, setMonsterOpenIndex } from './store/slices/monsterBookSlice';
import { setPersist } from './store/slices/persistSlice';
import './style/App.css';
import './style/buttons.css';
import LootInventory from './components/loot/loot_inventory';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    db.validateDb();
    const app = db.loadApp();
    dispatch(setPersist(app));

    dispatch(clearSharedShop());
    dispatch(setMasterMode(db.getIsMasterMode(app)));
    dispatch(setSidebarCollapsed(db.getIsShopSidebarCollapsed(app)));
    dispatch(setInfoSidebarCollapsed(db.getIsInfoSidebarCollapsed(app)));
    dispatch(setStateCurrentTab(db.getCurrentTab(app)));
    dispatch(setMainColor(db.getMainColor(app)));
    dispatch(setTheme(db.getTheme(app)));
    dispatch(setAccent(db.getAccent(app)));
    dispatch(setUnits(db.getUnits(app)));
    dispatch(setDiceMultiplierMask(db.getDiceMultiplierMask(app)));
    dispatch(setDiceLastRoll(db.getDiceLastRoll(app)));
    /* The bestiary is a lazy chunk (see loadFile.js). Start it now, so it is in
       place long before anything asks for a creature, and read the monster-book
       filters only once it is — their CR bounds are derived from the data.

       The roster waits for the same reason and a sharper one: MonsterSheet.load
       validates its ref against the bestiary, so reading it any earlier throws
       every saved creature away. */
    preloadCreatureData()
      .then(() => {
        dispatch(setMonsterFilters(db.getMonsterBookFilters(app)));
        dispatch(setMonsterRoster(db.getMonsterRoster(app)));
        dispatch(setMonsterOpenIndex(db.getMonsterOpenIndex(app)));
      })
      .catch(() => {});

    const worlds = db.getWorldsList(app);
    dispatch(setWorldsList(worlds));
    if (app.sw != null && app.sw >= 0 && app.w?.[app.sw]) {
      dispatch(setSelectedWorldIndex(app.sw));
      const w = db.getWorldByIndex(app, app.sw);
      if (w) {
        dispatch(setWorld(w));
        const c = w.Cities?.[w.SelectedCityIndex];
        dispatch(setCity(c ?? null));
        const s = c?.Shops?.[c.SelectedShopIndex];
        dispatch(setShop(s ?? null));
      }
    }

    dispatch(setSpellbooksList(db.getSpellbooksList(app)));
    if (app.ssb != null && app.ssb >= 0 && app.sb && app.sb[app.ssb]) {
      dispatch(setSelectedSpellbookIndex(app.ssb));
      const sb = db.getSpellbookByIndex(app, app.ssb);
      if (sb) dispatch(setSpellbook(sb));
    }
    dispatch(setSpellbookPage(db.getSpellbookPage(app)));
    dispatch(setIsSpellTableCollapsed(db.getIsSpellTableCollapsed(app)));
    dispatch(setIsSpellbookSidebarCollapsed(db.getIsSpellbookSidebarCollapsed(app)));
    dispatch(setIsClassDescriptionCollapsed(db.getIsClassDescriptionCollapsed(app)));
    dispatch(setIsDomainDescriptionCollapsed(db.getIsDomainDescriptionCollapsed(app)));
    dispatch(setSearchSpellName(db.getSearchSpellName(app)));
    dispatch(setSearchSpellSchool(db.getSearchSpellSchool(app)));
    dispatch(setShowShortDescriptions(db.getShowShortDescriptions(app)));

    dispatch(setLootsList(db.getLootsList(app)));
    if (app.sl != null && app.sl >= 0 && app.l && app.l[app.sl]) {
      dispatch(setSelectedLootIndex(app.sl));
      const l = db.getLootByIndex(app, app.sl);
      if (l) dispatch(setLoot(l));
    }
    dispatch(setIsLootSidebarCollapsed(db.getIsLootSidebarCollapsed(app)));

    dispatch(setCharactersList(db.getPlayerSheetCharactersList(app)));
    if (app.pss != null && app.pss >= 0 && app.psc?.[app.pss]) {
      dispatch(setSelectedCharacterIndex(app.pss));
      const p = db.getPlayerByIndex(app, app.pss);
      if (p) dispatch(setPlayer(p));
    } else {
      dispatch(setSelectedCharacterIndex(null));
      dispatch(setPlayer(null));
    }
    dispatch(setIsPlayerSheetSidebarCollapsed(db.getIsPlayerSheetSidebarCollapsed(app)));
    const psv = db.getPlayerSheetMainView(app);
    // Never restore to spellbook on load so selecting/loading a character doesn't show the spellbook
    dispatch(setPlayerSheetMainView(psv === 'playerSpells' ? 'none' : psv));
    dispatch(setPlayerSheetCardsCollapsed(db.getPlayerSheetCardsCollapsed(app)));
    dispatch(setCombatPageCardsCollapsed(db.getCombatPageCardsCollapsed(app)));

    const w = db.getWorldByIndex(app, app.sw);
    const hasInventory = w?.Cities?.some(c =>
      c.Shops?.some(s => (s.getInventory?.() || []).length > 0)
    ) ?? false;
    dispatch(setShopGenerated(serialize(hasInventory)));
  }, [dispatch]);

  /* Redraw once the creature chunk lands, so anything showing creature-derived
     values (a wild-shaped sheet, a companion) stops showing the empty state. */
  useCreatureData();

  const currentTab = useSelector(state => state.persist?.ct ?? state.app?.currentTab ?? 0);
  const sharedShop = useSelector(state => state.app.sharedShop);
  const theme = useSelector(selectTheme);
  const accent = useSelector(selectAccent);

  useEffect(() => {
    const cls = document.body.className.split(/\s+/).filter(c => c && !c.startsWith('theme-') && !c.startsWith('accent-'));
    cls.push(`theme-${theme}`);
    cls.push(`accent-${accent}`);
    document.body.className = cls.join(' ');
  }, [theme, accent]);

  /* A scanned shop used to be destroyed the moment you left tab 1, which made
     stepping over to your sheet to check your gold lose the shop you were
     reading. It is now held until you close it or scan another — and it is
     still cleared on load above, since `sharedShop` is not persisted, so it
     never outlives the session that scanned it. */

  const mainPage = <>
    <header className="app-header">
      <MainPage />
    </header>
  </>;

  const shopper = sharedShop ? (
    <header className="app-header">
      <ShopInventory />
    </header>
  ) : (
    <>
      <ShopSidebar />
      <header className="app-header">
        <ShopInventory />
      </header>
    </>
  );

  const spellbook = <>
    <SpellbookSidebar />
    <header className="app-header">
      <SpellbookTable />
    </header>
  </>;

  const loot = <>
    <LootSidebar />
    <header className="app-header">
      <LootInventory />
    </header>
  </>;

  const search = <>
    <SearchPage />
  </>;

  /* No control sidebar: the filters live in a card on the page itself. The
     info sidebar still opens creature stat blocks, as everywhere else. */
  const monsterBook = <>
    <header className="app-header">
      <MonsterBookPage />
    </header>
  </>;

  /* Its own tab, alongside the Monster Book, and master-only: a player has no
     use for the trap they are about to walk into. */
  const traps = <>
    <TrapSidebar />
    <header className="app-header">
      <TrapPage />
    </header>
  </>;

  const playerSheet = <>
    <PlayerSheetSidebar />
    <header className="app-header">
      <PlayerSheetPage />
    </header>
    <PlayerSheetBottomNav />
  </>;

  const tabPages = {
    0: mainPage,
    1: shopper,
    2: spellbook,
    3: loot,
    4: search,
    5: playerSheet,
    6: monsterBook,
    7: traps,
  };

  const currentTabContent = tabPages[currentTab] ??
    <header className="app-header"></header>;

  return (
    <div className="app">
      <TopMenu />
      {currentTab !== 0 && <InfoSidebar />}
      {currentTabContent}
    </div>
  );
}
