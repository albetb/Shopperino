import * as db from '../../lib/storage';
import { cap, serialize } from '../../lib/utils';
import World from '../../lib/world';
import { setCity } from '../slices/citySlice';
import { setShop, setShopGenerated } from '../slices/shopSlice';
import { setWorldsList, setSelectedWorldIndex, setWorld } from '../slices/worldSlice';
import { setPersist } from '../slices/persistSlice';

const DEFAULT_CITY_NAME = 'Village';
const DEFAULT_CITY_LEVEL = 0;

function ensureWorldHasDefaultCity(w) {
  if (w.Cities.length > 0) return w;
  w.addCity(DEFAULT_CITY_NAME, w.Level);
  const c = w.Cities[w.Cities.length - 1];
  c.Level = DEFAULT_CITY_LEVEL;
  return w;
}

function hydrateFromApp(dispatch, app) {
  const worlds = db.getWorldsList(app);
  dispatch(setWorldsList(worlds));
  if (app.sw != null && app.sw >= 0 && app.w?.[app.sw]) {
    dispatch(setSelectedWorldIndex(app.sw));
    const w = db.getWorldByIndex(app, app.sw);
    dispatch(setWorld(w ?? null));
    const c = w?.Cities?.[w.SelectedCityIndex];
    dispatch(setCity(c ?? null));
    const s = c?.Shops?.[c.SelectedShopIndex];
    dispatch(setShop(s ?? null));
    const hasInventory = w?.Cities?.some(c2 =>
      c2.Shops?.some(s2 => (s2.getInventory?.() || []).length > 0)
    ) ?? false;
    dispatch(setShopGenerated(serialize(hasInventory)));
  }
}

export const onNewWorld = (nameRaw) => (dispatch, getState) => {
  const name = cap(nameRaw);
  const app = getState().persist;
  const worlds = db.getWorldsList(app);
  if (!name || name.trim().length === 0) return;
  const foundIdx = worlds.findIndex(w => (w.name ?? w.Name) === name);
  if (foundIdx >= 0) {
    const newApp = { ...app, sw: foundIdx };
    dispatch(setPersist(newApp));
    hydrateFromApp(dispatch, newApp);
    return;
  }

  const w = new World(name);
  w.Level = 1;
  const wWithCity = ensureWorldHasDefaultCity(w);
  const newWorlds = [...(app.w || []), db.worldToTuple(wWithCity)];
  const newApp = { ...app, w: newWorlds, sw: newWorlds.length - 1 };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  hydrateFromApp(dispatch, newApp);
};

export const onSelectWorld = (name) => (dispatch, getState) => {
  const app = getState().persist;
  const worlds = db.getWorldsList(app);
  const foundIdx = worlds.findIndex(w => (w.name ?? w.Name) === name);
  if (foundIdx < 0) return;

  const newApp = { ...app, sw: foundIdx };
  dispatch(setPersist(newApp));
  let w = db.getWorldByIndex(newApp, foundIdx);
  w = ensureWorldHasDefaultCity(w);
  dispatch(setWorldsList(db.getWorldsList(newApp)));
  dispatch(setSelectedWorldIndex(foundIdx));
  dispatch(setWorld(w));
  const c = w?.Cities?.[w.SelectedCityIndex];
  dispatch(setCity(c ?? null));
  const s = c?.Shops?.[c.SelectedShopIndex];
  dispatch(setShop(s ?? null));
  const hasInventory = w?.Cities?.some(c2 =>
    c2.Shops?.some(s2 => (s2.getInventory?.() || []).length > 0)
  ) ?? false;
  dispatch(setShopGenerated(serialize(hasInventory)));
};

export const onPlayerLevelChange = (level) => (dispatch, getState) => {
  const state = getState();
  const app = state.persist;
  if (app.sw == null || app.sw < 0 || !app.w?.length) return;
  const w = state.world?.world ?? db.getWorldByIndex(app, app.sw);
  if (!w) return;

  w.setPlayerLevel(level);
  const newApp = { ...app, w: app.w.map((wt, wi) => (wi === app.sw ? db.worldToTuple(w) : wt)) };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  const c = w.Cities?.[w.SelectedCityIndex];
  if (c) dispatch(setCity(c));
  dispatch(setShop(c?.Shops?.[c.SelectedShopIndex] ?? null));
};

export const onDeleteWorld = () => (dispatch, getState) => {
  const app = getState().persist;
  if (app.sw == null || app.sw < 0 || !app.w?.length) return;

  const newW = app.w.filter((_, i) => i !== app.sw);
  const newSw = newW.length === 0 ? null : Math.min(app.sw, newW.length - 1);
  const newApp = { ...app, w: newW, sw: newSw };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));

  if (newSw != null) {
    const w = db.getWorldByIndex(newApp, newSw);
    dispatch(setWorldsList(db.getWorldsList(newApp)));
    dispatch(setSelectedWorldIndex(newSw));
    dispatch(setWorld(w));
    const c = w?.Cities?.[w.SelectedCityIndex];
    dispatch(setCity(c ?? null));
    dispatch(setShop(c?.Shops?.[c.SelectedShopIndex] ?? null));
  } else {
    dispatch(setWorldsList([]));
    dispatch(setSelectedWorldIndex(null));
    dispatch(setWorld(null));
    dispatch(setCity(null));
    dispatch(setShop(null));
  }
  const hasInventory = newSw != null && (() => {
    const w2 = db.getWorldByIndex(newApp, newSw);
    return w2?.Cities?.some(c2 => c2.Shops?.some(s2 => (s2.getInventory?.() || []).length > 0)) ?? false;
  })();
  dispatch(setShopGenerated(serialize(hasInventory)));
};

export const onWaitTime = ([days, hours]) => (dispatch, getState) => {
  const app = getState().persist;
  const { shop } = getState().shop;
  if (app.sw == null) return;

  const w = db.getWorldByIndex(app, app.sw);
  if (!w) return;
  w.Cities.forEach(c => {
    c.Shops.forEach(s => {
      s.passingTime(days, hours);
    });
  });
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  const c = w.Cities?.[w.SelectedCityIndex];
  dispatch(setCity(c ?? null));
  const s = c?.Shops?.[c.SelectedShopIndex];
  dispatch(setShop(s ?? null));
  if (s === shop) dispatch(setShop(s));
};
