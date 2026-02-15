/**
 * Single-root, index-based persistence. All data under key "app".
 * No entity IDs; identity = array index.
 */
import * as appState from './appState';

// Re-export appState so consumers can use db.loadApp, db.saveApp, etc.
export const loadApp = appState.loadApp;
export const saveApp = appState.saveApp;
export const getDefaultApp = appState.getDefaultApp;
export const getWorldByIndex = appState.getWorldByIndex;
export const getCityByIndex = appState.getCityByIndex;
export const getShopByIndex = appState.getShopByIndex;
export const getSpellbookByIndex = appState.getSpellbookByIndex;
export const getLootByIndex = appState.getLootByIndex;
export const worldToTuple = appState.worldToTuple;
export const worldFromTuple = appState.worldFromTuple;
export const cityToTuple = appState.cityToTuple;
export const cityFromTuple = appState.cityFromTuple;
export const shopToTuple = appState.shopToTuple;
export const shopFromTuple = appState.shopFromTuple;
export const spellbookToTuple = appState.spellbookToTuple;
export const spellbookFromTuple = appState.spellbookFromTuple;
export const lootToTuple = appState.lootToTuple;
export const lootFromTuple = appState.lootFromTuple;
export const updateWorldAt = appState.updateWorldAt;
export const updateShopAt = appState.updateShopAt;
export const updateSpellbookAt = appState.updateSpellbookAt;
export const updateLootAt = appState.updateLootAt;
export const getUIFlag = appState.getUIFlag;
export const UI_FLAG = appState.UI_FLAG;
export const stcBitmaskToArray = appState.stcBitmaskToArray;
export const stcArrayToBitmask = appState.stcArrayToBitmask;
export const setUIFlagValue = appState.setUIFlagValue;
export const setSTCBitValue = appState.setSTCBitValue;

export function validateDb() {
  const app = appState.loadApp();
  if (!app || (app.v | 0) < appState.getDefaultApp().v) {
    appState.saveApp(appState.getDefaultApp());
  }
}

// Convenience: get list entries for sidebars (no class instances)
export function getWorldsList(app) {
  if (!app || !Array.isArray(app.w)) return [];
  return app.w.map(t => ({ name: t[0], level: t[1] }));
}

export function getSpellbooksList(app) {
  if (!app || !Array.isArray(app.sb)) return [];
  return app.sb.map(t => ({ name: t[0] }));
}

export function getLootsList(app) {
  if (!app || !Array.isArray(app.l)) return [];
  return app.l.map(t => ({ timestamp: t[5] }));
}

// Prefs: read from app (uiFlags bitmask, stc bitmask)
export function getCurrentTab(app) { return app?.ct ?? 0; }
export function getMainColor(app) { return app?.mc ?? null; }
export function getIsMasterMode(app) { return appState.getUIFlag(app, appState.UI_FLAG.mm); }
export function getIsShopSidebarCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.sbc); }
export function getIsInfoSidebarCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.ibc); }
export function getIsWorldCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.wc); }
export function getIsCityCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.cc); }
export function getIsShopCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.sc); }
export function getIsPlayerCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.pc); }
export function getIsSearchCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.src); }
export function getIsSpellTableCollapsed(app) { return appState.stcBitmaskToArray(app); }
export function getIsSpellbookSidebarCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.sbsbc); }
export function getSpellbookPage(app) { return app?.sp ?? 0; }
export function getIsClassDescriptionCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.cdc); }
export function getIsDomainDescriptionCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.ddc); }
export function getSearchSpellName(app) { return app?.ssn ?? ''; }
export function getSearchSpellSchool(app) { return app?.sss ?? ''; }
export function getShowShortDescriptions(app) { return appState.getUIFlag(app, appState.UI_FLAG.ssd); }
export function getIsLootSidebarCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.lsc); }
export function getIsLootCollapsed(app) { return appState.getUIFlag(app, appState.UI_FLAG.lc); }

export function setAppUIFlag(app, bit, value) {
  const def = appState.getDefaultApp();
  const uiFlags = appState.setUIFlagValue(app?.uiFlags ?? def.uiFlags, bit, value);
  return { ...app, uiFlags };
}

export function setAppSTCBit(app, index, value) {
  const stc = appState.setSTCBitValue(app?.stc ?? 0, index, value);
  return { ...app, stc };
}

//#region save storage (download/upload still use single key)

const ROOT_KEY = 'app';

export const downloadLocalStorage = () => {
  const app = appState.loadApp();
  const blob = new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ShopperinoStorageData.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const handleFileUpload = (event) => {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== 'object') return;
      appState.saveApp(data);
      input.value = '';
      window.location.reload();
    } catch {
      input.value = '';
    }
  };
  reader.readAsText(file);
};

//#endregion
