import City from '../../lib/city';
import * as db from '../../lib/storage';
import { cap, serialize } from '../../lib/utils';
import World from '../../lib/world';
import { setCity } from '../slices/citySlice';
import { setShop, setShopGenerated } from '../slices/shopSlice';
import { setSelectedWorld, setWorld, setWorlds } from '../slices/worldSlice';

/** Name and level of the default city created with each world when city card is hidden. */
const DEFAULT_CITY_NAME = 'Village';
const DEFAULT_CITY_LEVEL = 0;

function ensureWorldHasDefaultCity(w) {
  if (w.Cities.length > 0) return w;
  const c = new City(DEFAULT_CITY_NAME, w.Level);
  c.Level = DEFAULT_CITY_LEVEL;
  w.addCity(c.Id, c.Name);
  db.setCity(c.serialize());
  return w;
}

export const onNewWorld = (nameRaw) => (dispatch, getState) => {
  const name = cap(nameRaw);
  const { worlds } = getState().world;
  if (!name || name.trim().length === 0) return;
  if (worlds.some(w => w.Name === name)) { // If name already present select that item
    const found = worlds.find(w => w.Name === name)
    const w = db.getWorld(found.Id);
    dispatch(setWorld(w));
    dispatch(setSelectedWorld(found));
    return;
  }

  const w = new World(name);
  const entry = { Id: w.Id, Name: w.Name };

  // Create default city (level 0 = village) and assign all shops to it; city card is hidden in UI
  const wWithCity = ensureWorldHasDefaultCity(w);
  const defaultCity = db.getCity(wWithCity.SelectedCity.Id);

  const newWorlds = [...worlds, entry];

  dispatch(setWorld(wWithCity));
  dispatch(setWorlds(newWorlds));
  dispatch(setSelectedWorld(entry));
  dispatch(setCity(defaultCity));
  dispatch(setShop(null));

  const dbW = db.getWorld(wWithCity.Id);
  const hasInventory = dbW.Cities.some(c =>
    db.getCity(c.Id).Shops.some(s => (db.getShop(s.Id).getInventory() || []).length > 0)
  );
  dispatch(setShopGenerated(serialize(hasInventory)));
};

export const onSelectWorld = (name) => (dispatch, getState) => {
  const { worlds } = getState().world;
  const entry = worlds.find(w => w.Name === name);
  if (!entry) return;

  dispatch(setSelectedWorld(entry));

  let w = db.getWorld(entry.Id);
  // Migration: ensure world has default city (e.g. when city card is hidden)
  w = ensureWorldHasDefaultCity(w);
  dispatch(setWorld(w));

  const cDb = w.SelectedCity?.Id ? db.getCity(w.SelectedCity.Id) : null;
  dispatch(setCity(cDb));

  const shop = cDb?.SelectedShop != null ? db.getShop(cDb.SelectedShop.Id) : null;
  dispatch(setShop(shop ? shop : null));

  const hasInventory = w.Cities.some(c =>
    db.getCity(c.Id).Shops.some(s => (db.getShop(s.Id).getInventory() || []).length > 0)
  );
  dispatch(setShopGenerated(serialize(hasInventory)));
};

export const onPlayerLevelChange = (level) => (dispatch, getState) => {
  const { world } = getState().world;
  if (!world) return;

  const w = new World().load(world);
  w.setPlayerLevel(level);
  dispatch(setWorld(w));

  const c = db.getCity(w.SelectedCity.Id);
  dispatch(setCity(c));

  const shop = c?.SelectedShop != null ? db.getShop(c.SelectedShop.Id) : null;
  dispatch(setShop(shop ? shop : null));
};

export const onDeleteWorld = () => (dispatch, getState) => {
  const { selectedWorld, worlds } = getState().world;
  if (!selectedWorld) return;

  const old = selectedWorld;
  const oldDb = db.getWorld(old.Id);

  oldDb.Cities.forEach(c => {
    db.getCity(c.Id).Shops.forEach(s => db.deleteShop(s.Id));
    db.deleteCity(c.Id);
  });
  db.deleteWorld(old.Id);

  const updatedWorlds = worlds.filter(w => w.Id !== old.Id);
  const next = updatedWorlds[0] || null;

  dispatch(setWorlds(updatedWorlds));
  dispatch(setSelectedWorld(next));

  if (next) {
    const w = db.getWorld(next.Id);
    dispatch(setWorld(w));
    const c = db.getCity(w.SelectedCity.Id);
    dispatch(setCity(c));
    dispatch(setShop(db.getShop(c.SelectedShop.Id)));
  } else {
    dispatch(setWorld(null));
    dispatch(setCity(null));
    dispatch(setShop(null));
  }
};

export const onWaitTime = ([days, hours]) => (dispatch, getState) => {
  const { selectedWorld } = getState().world;
  const { shop } = getState().shop;
  if (!selectedWorld) return;

  const w = db.getWorld(selectedWorld.Id);
  w.Cities.forEach(cMeta => {
    const c = db.getCity(cMeta.Id);
    c.Shops.forEach(sMeta => {
      const s = db.getShop(sMeta.Id);
      s.passingTime(days, hours);
      db.setShop(s);
      if (s.Id === shop?.Id) {
        dispatch(setShop(s));
      }
    });
  });
};
