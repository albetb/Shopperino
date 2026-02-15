import * as db from '../lib/storage';
import { setPersist } from './slices/persistSlice';
import {
  toggleSidebar,
  toggleInfoSidebar,
  setSidebarCollapsed,
  setInfoSidebarCollapsed,
  setStateCurrentTab,
  setMainColor,
  resetMainColor,
  setMasterMode,
} from './slices/appSlice';

const PREF_ACTIONS = [
  toggleSidebar.type,
  toggleInfoSidebar.type,
  setSidebarCollapsed.type,
  setInfoSidebarCollapsed.type,
  setStateCurrentTab.type,
  setMainColor.type,
  resetMainColor.type,
  setMasterMode.type,
  'spellbook/setIsSpellTableCollapsed',
  'spellbook/setIsClassDescriptionCollapsed',
  'spellbook/setIsDomainDescriptionCollapsed',
  'spellbook/setIsSpellbookSidebarCollapsed',
  'spellbook/setShowShortDescriptions',
  'spellbook/setSearchSpellName',
  'spellbook/setSearchSpellSchool',
];

export function persistSyncMiddleware(store) {
  return next => action => {
    const result = next(action);
    if (!PREF_ACTIONS.includes(action.type)) return result;
    const state = store.getState();
    const persist = state.persist;
    const app = state.app;
    if (!persist) return result;
    let nextPersist = { ...persist };
    switch (action.type) {
      case toggleSidebar.type:
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.sbc, app.sidebarCollapsed);
        break;
      case toggleInfoSidebar.type:
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.ibc, app.infoSidebarCollapsed);
        break;
      case setSidebarCollapsed.type:
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.sbc, !!action.payload);
        break;
      case setInfoSidebarCollapsed.type:
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.ibc, !!action.payload);
        break;
      case setStateCurrentTab.type:
        nextPersist = { ...nextPersist, ct: action.payload };
        break;
      case setMainColor.type:
        nextPersist = { ...nextPersist, mc: action.payload };
        break;
      case resetMainColor.type:
        nextPersist = { ...nextPersist, mc: null };
        break;
      case setMasterMode.type:
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.mm, !!action.payload);
        break;
      case 'spellbook/setIsSpellTableCollapsed':
        if (Array.isArray(action.payload) && action.payload.length >= 10)
          nextPersist = { ...nextPersist, stc: db.stcArrayToBitmask(action.payload) };
        break;
      case 'spellbook/setIsClassDescriptionCollapsed':
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.cdc, !!action.payload);
        break;
      case 'spellbook/setIsDomainDescriptionCollapsed':
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.ddc, !!action.payload);
        break;
      case 'spellbook/setIsSpellbookSidebarCollapsed':
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.sbsbc, !!action.payload);
        break;
      case 'spellbook/setShowShortDescriptions':
        nextPersist = db.setAppUIFlag(nextPersist, db.UI_FLAG.ssd, !!action.payload);
        break;
      case 'spellbook/setSearchSpellName':
        nextPersist = { ...nextPersist, ssn: action.payload ?? '' };
        break;
      case 'spellbook/setSearchSpellSchool':
        nextPersist = { ...nextPersist, sss: action.payload ?? '' };
        break;
      default:
        return result;
    }
    db.saveApp(nextPersist);
    store.dispatch(setPersist(nextPersist));
    return result;
  };
}
