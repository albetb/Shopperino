import * as db from '../../lib/storage';
import { cap } from '../../lib/utils';
import { setCity } from '../slices/citySlice';
import { setShop } from '../slices/shopSlice';
import { setWorld, setWorldsList, setSelectedWorldIndex } from '../slices/worldSlice';
import { setPersist } from '../slices/persistSlice';

export const onNewCity = (nameRaw) => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  if (!w) return;
  const name = cap(nameRaw);
  if (!name || name.trim().length === 0) return;
  if (w.Cities.some(c => c.Name === name)) {
    const idx = w.Cities.findIndex(c => c.Name === name);
    w.selectCityByIndex(idx);
    const newApp = db.updateWorldAt(app, app.sw, w);
    db.saveApp(newApp);
    dispatch(setPersist(newApp));
    dispatch(setWorld(w));
    dispatch(setCity(w.Cities[w.SelectedCityIndex]));
    dispatch(setShop(null));
    return;
  }

  w.addCity(name, w.Level);
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorldsList(db.getWorldsList(newApp)));
  dispatch(setSelectedWorldIndex(app.sw));
  dispatch(setWorld(w));
  dispatch(setCity(w.Cities[w.SelectedCityIndex]));
  dispatch(setShop(null));
};

export const onSelectCity = (name) => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  if (!w) return;

  const idx = w.Cities.findIndex(c => c.Name === name);
  if (idx < 0) return;
  w.selectCityByIndex(idx);
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  const c = w.Cities[w.SelectedCityIndex];
  dispatch(setCity(c));
  dispatch(setShop(c?.Shops?.[c.SelectedShopIndex] ?? null));
};

export const onCityLevelChange = (level) => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  if (!w) return;
  const c = w.Cities?.[w.SelectedCityIndex];
  if (!c) return;

  c.setCityLevel(level);
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorld(w));
  dispatch(setCity(c));
  dispatch(setShop(c.Shops?.[c.SelectedShopIndex] ?? null));
};

export const onDeleteCity = () => (dispatch, getState) => {
  const app = getState().persist;
  const w = db.getWorldByIndex(app, app.sw);
  const c = getState().city.city;
  if (!w || !c) return;

  const cityIdx = w.Cities.findIndex(city => city.Name === c.Name);
  if (cityIdx < 0) return;
  w.deleteCityByIndex(cityIdx);
  const newApp = db.updateWorldAt(app, app.sw, w);
  db.saveApp(newApp);
  dispatch(setPersist(newApp));
  dispatch(setWorldsList(db.getWorldsList(newApp)));
  dispatch(setSelectedWorldIndex(app.sw));
  dispatch(setWorld(w));
  const nextC = w.Cities?.[w.SelectedCityIndex];
  dispatch(setCity(nextC ?? null));
  dispatch(setShop(nextC?.Shops?.[nextC.SelectedShopIndex] ?? null));
};
