import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MainPage from './components/main_page/main_page';
import InfoSidebar from './components/menus/info_sidebar/info_sidebar';
import LootSidebar from './components/menus/loot_sidebar/loot_sidebar';
import ShopSidebar from './components/menus/shop_sidebar/shop_sidebar';
import SpellbookSidebar from './components/menus/spellbook_sidebar/spellbook_sidebar';
import TopMenu from './components/menus/top_menu';
import { ShopInventory } from 'components/shop';
import SpellbookTable from './components/spellbook/spellbook_table';
import SearchPage from './components/search/search_page';
import * as db from './lib/storage';
import { serialize } from './lib/utils';
import {
  setStateCurrentTab,
  setMainColor,
  clearSharedShop,
  setMasterMode,
  setSidebarCollapsed,
  setInfoSidebarCollapsed
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

    const w = db.getWorldByIndex(app, app.sw);
    const hasInventory = w?.Cities?.some(c =>
      c.Shops?.some(s => (s.getInventory?.() || []).length > 0)
    ) ?? false;
    dispatch(setShopGenerated(serialize(hasInventory)));
  }, [dispatch]);

  const currentTab = useSelector(state => state.persist?.ct ?? state.app?.currentTab ?? 0);
  const sharedShop = useSelector(state => state.app.sharedShop);

  useEffect(() => {
    if (currentTab !== 1 && sharedShop) {
      dispatch(clearSharedShop());
    }
  }, [currentTab, sharedShop, dispatch]);

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

  const tabPages = {
    0: mainPage,
    1: shopper,
    2: spellbook,
    3: loot,
    4: search
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
