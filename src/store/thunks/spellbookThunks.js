import Spellbook from '../../lib/spellbook';
import * as db from '../../lib/storage';
import { cap } from '../../lib/utils';
import {
  setIsSpellTableCollapsed,
  setSelectedSpellbookIndex,
  setSpellbook,
  setSpellbookPageNoCollapsing,
  setSpellbooksList,
} from '../slices/spellbookSlice';
import { setPersist } from '../slices/persistSlice';

function hydrateSpellbook(dispatch, app) {
  dispatch(setSpellbooksList(db.getSpellbooksList(app)));
  dispatch(setSelectedSpellbookIndex(app.ssb));
  if (app.ssb != null && app.ssb >= 0 && app.sb?.[app.ssb]) {
    dispatch(setSpellbook(db.getSpellbookByIndex(app, app.ssb)));
  } else {
    dispatch(setSpellbook(null));
  }
}

function persistSpellbook(dispatch, getState, spellbookInstance) {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const newApp = db.updateSpellbookAt(app, app.ssb, spellbookInstance);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setSpellbook(spellbookInstance));
}

export const onNewSpellbook = nameRaw => (dispatch, getState) => {
  const name = cap(nameRaw);
  if (!name.trim()) return;
  const app = getState().persist;
  const list = db.getSpellbooksList(app);
  const idx = list.findIndex(s => (s.name ?? s.Name) === name);
  if (idx >= 0) {
    const newApp = { ...app, ssb: idx };
    db.saveApp(newApp);
    dispatch(setPersist(newApp));
    hydrateSpellbook(dispatch, newApp);
    const s = db.getSpellbookByIndex(newApp, idx);
    if (s && ['Sorcerer', 'Bard', 'Wizard'].includes(s.Class))
      dispatch(setSpellbookPageNoCollapsing(0));
    else
      dispatch(setSpellbookPageNoCollapsing(1));
    return;
  }
  const s = new Spellbook(name);
  const newSb = [...(app.sb || []), db.spellbookToTuple(s)];
  const newApp = { ...app, sb: newSb, ssb: newSb.length - 1 };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydrateSpellbook(dispatch, newApp);
  if (['Sorcerer', 'Bard', 'Wizard'].includes(s.Class))
    dispatch(setSpellbookPageNoCollapsing(0));
  else
    dispatch(setSpellbookPageNoCollapsing(1));
};

export const onSelectSpellbook = name => (dispatch, getState) => {
  const app = getState().persist;
  const list = db.getSpellbooksList(app);
  const idx = list.findIndex(s => (s.name ?? s.Name) === name);
  if (idx < 0) return;
  const newApp = { ...app, ssb: idx };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydrateSpellbook(dispatch, newApp);
};

export const onPlayerLevelChange = level => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setLevel(level);
  persistSpellbook(dispatch, getState, s);
};

export const onPlayerClassChange = _class => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.Spells = [];
  s.setClass(_class);
  persistSpellbook(dispatch, getState, s);
  if (['Sorcerer', 'Bard', 'Wizard'].includes(s.Class))
    dispatch(setSpellbookPageNoCollapsing(0));
  else
    dispatch(setSpellbookPageNoCollapsing(1));
};

export const onPlayerCharacteristicChange = char => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setCharacteristic(char);
  persistSpellbook(dispatch, getState, s);
};

export const onMoralAlignmentChange = align => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setMoralAlignment(align);
  persistSpellbook(dispatch, getState, s);
};

export const onEthicalAlignmentChange = align => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setEthicalAlignment(align);
  persistSpellbook(dispatch, getState, s);
};

export const onDomain1Change = domain => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setDomain1(domain);
  persistSpellbook(dispatch, getState, s);
};

export const onDomain2Change = domain => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setDomain2(domain);
  persistSpellbook(dispatch, getState, s);
};

export const onUseDomainSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.useDomainSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onPrepareDomainSpell = (level, spell_link) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.prepareDomainSpell(level, spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onUnprepareDomainSpell = (level, spell_link) => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.unprepareDomainSpell(level, spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onSpecializedChange = school => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setSpecialized(school);
  persistSpellbook(dispatch, getState, s);
};

export const onForbidden1Change = school => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setForbidden1(school);
  persistSpellbook(dispatch, getState, s);
};

export const onForbidden2Change = school => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.setForbidden2(school);
  persistSpellbook(dispatch, getState, s);
};

export const onDeleteSpellbook = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.length) return;
  const newSb = app.sb.filter((_, i) => i !== app.ssb);
  const newSsb = newSb.length === 0 ? null : Math.min(app.ssb, newSb.length - 1);
  const newApp = { ...app, sb: newSb, ssb: newSsb };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydrateSpellbook(dispatch, newApp);
};

export const onCollapseSpellTable = num => (dispatch, getState) => {
  const { isSpellTableCollapsed } = getState().spellbook;
  if (!isSpellTableCollapsed) return;
  const updated = isSpellTableCollapsed.map((x, i) => i === num ? !x : x);
  dispatch(setIsSpellTableCollapsed(updated));
};

export const onLearnUnlearnSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.learnUnlearnSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onLearnSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.learnSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onUnlearnSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.unlearnSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onPrepareSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.prepareSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onUnprepareSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.unprepareSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onUseSpell = spell_link => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.useSpell(spell_link);
  persistSpellbook(dispatch, getState, s);
};

export const onRefreshSpell = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.ssb == null || app.ssb < 0 || !app.sb?.[app.ssb]) return;
  const s = db.getSpellbookByIndex(app, app.ssb);
  s.refreshSpell();
  persistSpellbook(dispatch, getState, s);
};
