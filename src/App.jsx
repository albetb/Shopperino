import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MainPage from './components/main_page/main_page';
import InfoSidebar from './components/menus/info_sidebar/info_sidebar';
import ShopSidebar from './components/menus/shop_sidebar/shop_sidebar';
import SpellbookSidebar from './components/menus/spellbook_sidebar/spellbook_sidebar';
import TopMenu from './components/menus/top_menu';
import ShopInventory from './components/shop_inventory/shop_inventory';
import SpellbookTable from './components/spellbook/spellbook_table';
import * as db from './lib/storage';
import { serialize } from './lib/utils';
import {
  setStateCurrentTab
} from './store/slices/appSlice';
import {
  setCity
} from './store/slices/citySlice';
import {
  setShop,
  setShopGenerated
} from './store/slices/shopSlice';
import {
  setIsClassDescriptionCollapsed,
  setIsDomainDescriptionCollapsed,
  setSpellbookPage,
  setIsSpellbookSidebarCollapsed,
  setIsSpellTableCollapsed,
  setSearchSpellName,
  setSearchSpellSchool,
  setSelectedSpellbook,
  setSpellbook,
  setSpellbooks
} from './store/slices/spellbookSlice';
import {
  setSelectedWorld,
  setWorld,
  setWorlds
} from './store/slices/worldSlice';
import './style/App.css';
import './style/buttons.css';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize localStorage/db
    db.validateDb();

    const worldsDb = db.getWorlds();
    const selW = db.getSelectedWorld();
    const w = db.getWorld(selW?.Id);
    const c = db.getCity(w?.SelectedCity?.Id);
    const s = db.getShop(c?.SelectedShop?.Id);
    const ct = db.getCurrentTab();
    const sbs = db.getSpellbooks();
    const ssb = db.getSelectedSpellbook();
    const sb = db.getSpellbook(ssb?.Id);
    const ie = db.getSpellbookPage();
    const stc = db.getIsSpellTableCollapsed();
    const ssc = db.getIsSpellbookSidebarCollapsed();
    const cdc = db.getIsClassDescriptionCollapsed();
    const ddc = db.getIsDomainDescriptionCollapsed();
    const ssn = db.getSearchSpellName();
    const sss = db.getSearchSpellSchool();

    // Populate Redux
    dispatch(setWorlds(worldsDb));
    dispatch(setSelectedWorld(selW));
    dispatch(setWorld(w));
    dispatch(setCity(c));
    dispatch(setShop(s));
    dispatch(setStateCurrentTab(ct));
    dispatch(setSpellbooks(sbs));
    dispatch(setSelectedSpellbook(ssb));
    dispatch(setSpellbook(sb));
    dispatch(setSpellbookPage(ie));
    dispatch(setIsSpellTableCollapsed(stc));
    dispatch(setIsSpellbookSidebarCollapsed(ssc));
    dispatch(setIsClassDescriptionCollapsed(cdc));
    dispatch(setIsDomainDescriptionCollapsed(ddc));
    dispatch(setSearchSpellName(ssn));
    dispatch(setSearchSpellSchool(sss));

    // Compute shopGenerated flag
    const generated = w?.Cities?.some(ci =>
      db.getCity(ci.Id).Shops.some(sh =>
        (db.getShop(sh.Id).getInventory() || []).length > 0
      )
    ) ?? false;
    dispatch(setShopGenerated(serialize(generated)));
  }, [dispatch]);

  const currentTab = useSelector(state => state.app.currentTab);

  const mainPage = <>
    <header className="app-header">
      <MainPage />
    </header>
  </>;

  const shopper = <>
    <ShopSidebar />
    <header className="app-header">
      <ShopInventory />
    </header>
  </>;

  const spellbook = <>
    <SpellbookSidebar />
    <header className="app-header">
      <SpellbookTable />
    </header>
  </>;

  const loot = <>
    <></>
    <header className="app-header">
      <></>
    </header>
  </>;

  const tabPages = {
    0: mainPage,
    1: shopper,
    2: spellbook,
    3: loot
  };

  const currentTabContent = tabPages[currentTab] ??
    <header className="app-header"></header>;

  return (
    <div className="app">
      <TopMenu />
      {tabPages !== 0 && <InfoSidebar />}
      {currentTabContent}
    </div>
  );
}
