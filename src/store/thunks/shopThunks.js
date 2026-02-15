import { createPrng } from '../../lib/prng';
import City from '../../lib/city';
import Shop from '../../lib/shop';
import * as db from '../../lib/storage';
import { cap, serialize } from '../../lib/utils';
import { setCity } from '../slices/citySlice';
import { setShop, setShopGenerated } from '../slices/shopSlice';
import { setWorld, setWorldsList, setSelectedWorldIndex } from '../slices/worldSlice';
import { setPersist } from '../slices/persistSlice';

export const onNewShop = (nameRaw) => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  const c = w?.Cities?.[w.SelectedCityIndex];
  if (!c) return;
  const name = cap(nameRaw);
  if (!name || name.trim().length === 0) return;
  if (c.Shops.some(s => s.Name === name)) {
    const idx = c.Shops.findIndex(s => s.Name === name);
    c.selectShopByIndex(idx);
    const newApp = db.updateWorldAt(app, app.sw, w);
    db.saveApp(newApp);
    dispatch(setPersist(newApp));
    dispatch(setWorld(w));
    dispatch(setCity(c));
    dispatch(setShop(c.Shops[c.SelectedShopIndex]));
    return;
  }

  c.addShop(name, c.Level, w.Level);
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  dispatch(setCity(c));
  dispatch(setShop(c.Shops[c.SelectedShopIndex]));
};

export const onSelectShop = (name) => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  const c = w?.Cities?.[w.SelectedCityIndex];
  if (!c) return;

  const idx = c.Shops.findIndex(s => s.Name === name);
  if (idx < 0) return;
  c.selectShopByIndex(idx);
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  dispatch(setCity(c));
  dispatch(setShop(c.Shops[c.SelectedShopIndex]));
};

export const onDeleteShop = () => (dispatch, getState) => {
  const state = getState();
  const app = state.persist;
  if (app.sw == null || app.sw < 0 || !app.w?.length) return;
  const w = state.world?.world ?? db.getWorldByIndex(app, app.sw);
  const c = state.city?.city ?? w?.Cities?.[w.SelectedCityIndex];
  const shop = state.shop.shop;
  if (!w || !c || !shop) return;

  const shopIdx = c.Shops.findIndex(s => s.Name === shop.Name);
  if (shopIdx < 0) return;
  c.deleteShopByIndex(shopIdx);
  const newApp = { ...app, w: app.w.map((wt, wi) => (wi === app.sw ? db.worldToTuple(w) : wt)) };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  dispatch(setCity(c));
  const nextS = c.Shops?.[c.SelectedShopIndex];
  dispatch(setShop(nextS ?? null));

  const hasInventory = w.Cities?.some(c2 =>
    c2.Shops?.some(s2 => (s2.getInventory?.() || []).length > 0)
  ) ?? false;
  dispatch(setShopGenerated(serialize(hasInventory)));
};

export const updateShop = ([method, ...args]) => (dispatch, getState) => {
  const state = getState();
  const shop = state.shop.shop;
  if (!shop) return;
  shop[method](...args);
  const app = state.persist;
  if (app.sw == null || app.sw < 0 || !app.w?.length) return;
  let w = state.world?.world ?? db.getWorldByIndex(app, app.sw);
  if (!w) return;
  const c = w.Cities?.[w.SelectedCityIndex];
  if (c?.Shops?.length) c.Shops[c.SelectedShopIndex] = shop;
  const newApp = { ...app, w: app.w.map((wt, wi) => (wi === app.sw ? db.worldToTuple(w) : wt)) };
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  if (c) dispatch(setCity(c));
  dispatch(setShop(shop));
};

export const onCreateShop = () => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  const c = w?.Cities?.[w.SelectedCityIndex];
  const shop = c?.Shops?.[c.SelectedShopIndex];
  if (!shop) return;
  shop.template();
  const seed = (Math.random() * 0x100000000) >>> 0;
  shop.Seed = seed;
  shop.generateInventory(createPrng(seed));
  const newApp = db.updateShopAt(app, app.sw, w.SelectedCityIndex, c.SelectedShopIndex, shop);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  dispatch(setCity(c));
  dispatch(setShop(shop));
  const hasInventory = w.Cities?.some(c2 =>
    c2.Shops?.some(s2 => (s2.getInventory?.() || []).length > 0)
  ) ?? false;
  dispatch(setShopGenerated(serialize(hasInventory)));
};
