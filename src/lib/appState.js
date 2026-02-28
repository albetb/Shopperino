/**
 * Single root app state: index-based hierarchy, no entity IDs.
 * Root key: "app". All data in one object.
 */
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import World from './world';
import City from './city';
import Shop from './shop';
import Spellbook from './spellbook';
import Loot from './loot';

const CURRENT_VERSION = 260210;
const ROOT_KEY = 'app';

//#region UI bitmask
// uiFlags: one integer, each bit = one boolean. stc: one integer, bits 0-9 = spell table level collapsed.
export const UI_FLAG = {
  mm: 0, sbc: 1, ibc: 2, wc: 3, cc: 4, sc: 5, pc: 6, src: 7, sbsbc: 8, cdc: 9, ddc: 10, ssd: 11, lsc: 12, lc: 13,
};
const DEFAULT_UI_FLAGS = (1 << UI_FLAG.cdc) | (1 << UI_FLAG.ssd); // cdc and ssd default true

export function getUIFlag(app, bit) {
  const flags = app?.uiFlags ?? DEFAULT_UI_FLAGS;
  return ((flags >> bit) & 1) === 1;
}

export function setUIFlagValue(uiFlags, bit, value) {
  const mask = 1 << bit;
  return value ? (uiFlags | mask) : (uiFlags & ~mask);
}

export function getSTCBit(app, index) {
  const stc = app?.stc ?? 0;
  return ((stc >> index) & 1) === 1;
}

export function setSTCBitValue(stc, index, value) {
  const mask = 1 << index;
  return value ? (stc | mask) : (stc & ~mask);
}

export function stcBitmaskToArray(app) {
  const stc = app?.stc ?? 0;
  return Array.from({ length: 10 }, (_, i) => ((stc >> i) & 1) === 1);
}

export function stcArrayToBitmask(arr) {
  if (!Array.isArray(arr) || arr.length < 10) return 0;
  let n = 0;
  for (let i = 0; i < 10; i++) if (arr[i]) n |= 1 << i;
  return n;
}

//#endregion

//#region Default root

export function getDefaultApp() {
  return {
    v: CURRENT_VERSION,
    sw: null,
    w: [],
    ssb: null,
    sb: [],
    sl: null,
    l: [],
    pss: null,
    psc: [],
    ct: 0,
    mc: null,
    uiFlags: DEFAULT_UI_FLAGS,
    stc: 0,
    sp: 0,
    ssn: '',
    sss: '',
  };
}

function isDefaultEmpty(val) {
  if (val === '' || val === null || val === undefined) return true;
  if (Array.isArray(val) && val.length === 0) return true;
  if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true;
  return false;
}

/** Omit keys that equal default or are empty. Keeps v always. */
export function compactApp(app) {
  if (!app || typeof app !== 'object') return getDefaultApp();
  const def = getDefaultApp();
  const out = { v: app.v ?? CURRENT_VERSION };
  for (const k of Object.keys(app)) {
    if (k === 'v') continue;
    const v = app[k];
    if (v === undefined) continue;
    const d = def[k];
    if (v === d) continue;
    if (isDefaultEmpty(v) && isDefaultEmpty(d)) continue;
    if (k === 'uiFlags' && v === DEFAULT_UI_FLAGS) continue;
    if (k === 'stc' && (v | 0) === 0) continue;
    out[k] = v;
  }
  return out;
}

/** Merge raw with defaults. Migrate legacy boolean keys into uiFlags/stc. */
export function expandApp(raw) {
  if (!raw || typeof raw !== 'object') return getDefaultApp();
  const def = getDefaultApp();
  let uiFlags = raw.uiFlags !== undefined ? (raw.uiFlags | 0) : DEFAULT_UI_FLAGS;
  let stc = raw.stc !== undefined ? (raw.stc | 0) : 0;
  if (raw.mm !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.mm, !!raw.mm);
  if (raw.sbc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.sbc, !!raw.sbc);
  if (raw.ibc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.ibc, !!raw.ibc);
  if (raw.wc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.wc, !!raw.wc);
  if (raw.cc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.cc, !!raw.cc);
  if (raw.sc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.sc, !!raw.sc);
  if (raw.pc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.pc, !!raw.pc);
  if (raw.src !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.src, !!raw.src);
  if (raw.sbsbc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.sbsbc, !!raw.sbsbc);
  if (raw.cdc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.cdc, raw.cdc !== false);
  if (raw.ddc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.ddc, !!raw.ddc);
  if (raw.ssd !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.ssd, raw.ssd !== false);
  if (raw.lsc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.lsc, !!raw.lsc);
  if (raw.lc !== undefined) uiFlags = setUIFlagValue(uiFlags, UI_FLAG.lc, !!raw.lc);
  if (Array.isArray(raw.stc) && raw.stc.length >= 10) stc = stcArrayToBitmask(raw.stc);
  const out = { ...def };
  for (const k of Object.keys(raw)) {
    if (k === 'mm' || k === 'sbc' || k === 'ibc' || k === 'wc' || k === 'cc' || k === 'sc' || k === 'pc' || k === 'src' || k === 'sbsbc' || k === 'cdc' || k === 'ddc' || k === 'ssd' || k === 'lsc' || k === 'lc' || k === 'stc') continue;
    if (raw[k] !== undefined) out[k] = raw[k];
  }
  out.v = raw.v ?? CURRENT_VERSION;
  out.uiFlags = uiFlags;
  out.stc = stc;
  return out;
}

//#endregion

//#region World tuple: [name, level, selectedCityIndex, cities]
export function worldToTuple(world) {
  const cities = (world.Cities || []).map(c => cityToTuple(c));
  const sel = world.SelectedCityIndex != null ? world.SelectedCityIndex : 0;
  const safeSel = cities.length ? Math.max(0, Math.min(sel, cities.length - 1)) : 0;
  return [world.Name || '', world.Level ?? 1, safeSel, cities];
}

export function worldFromTuple(t) {
  if (!Array.isArray(t) || t.length < 4) return null;
  const w = new World();
  w.Name = t[0] ?? '';
  w.Level = t[1] ?? 1;
  w.SelectedCityIndex = Math.max(0, t[2] | 0);
  w.Cities = (t[3] || []).map(ct => cityFromTuple(ct));
  return w;
}

//#endregion

//#region City tuple: [name, level, playerLevel, selectedShopIndex, shops]
export function cityToTuple(city) {
  const shops = (city.Shops || []).map(s => shopToTuple(s));
  const sel = city.SelectedShopIndex != null ? city.SelectedShopIndex : 0;
  const safeSel = shops.length ? Math.max(0, Math.min(sel, shops.length - 1)) : 0;
  return [city.Name || '', city.Level ?? 0, city.PlayerLevel ?? 1, safeSel, shops];
}

export function cityFromTuple(t) {
  if (!Array.isArray(t) || t.length < 5) return null;
  const c = new City();
  c.Name = t[0] ?? '';
  c.Level = t[1] ?? 0;
  c.PlayerLevel = t[2] ?? 1;
  c.SelectedShopIndex = Math.max(0, t[3] | 0);
  c.Shops = (t[4] || []).map(st => shopFromTuple(st));
  return c;
}

//#endregion

//#region Shop tuple: [name, level, cityLevel, playerLevel, rep, gold, time, arcaneChance, shopType, seed?, genLevel?, genCityLevel?, genPlayerLevel?, genShopType?, userAdditions, sold?]
const SHOP_TUPLE_KEYS = ['Name', 'Level', 'CityLevel', 'PlayerLevel', 'Reputation', 'Gold', 'Time', 'ArcaneChance', 'ShopType', 'Seed', 'GenLevel', 'GenCityLevel', 'GenPlayerLevel', 'GenShopType', 'UserAdditions', 'Sold'];

export function shopToTuple(shop) {
  const data = typeof shop.serialize === 'function' ? shop.serialize() : shop;
  const arr = [];
  for (const k of SHOP_TUPLE_KEYS) {
    if (k === 'UserAdditions') arr.push(data.UserAdditions ?? []);
    else if (k === 'Sold') {
      const sold = Array.isArray(data.Sold) ? data.Sold : [];
      arr.push(sold.map(row => Array.isArray(row) ? [...row] : row));
    } else arr.push(data[k]);
  }
  return arr;
}

export function shopFromTuple(t) {
  if (!Array.isArray(t) || t.length < 9) return null;
  const data = {
    Id: '',
    Name: t[0],
    Level: t[1],
    CityLevel: t[2],
    PlayerLevel: t[3],
    Reputation: t[4],
    Gold: t[5],
    Time: t[6],
    ArcaneChance: t[7],
    ShopType: t[8],
  };
  if (t[9] != null) data.Seed = t[9];
  if (t[10] != null) data.GenLevel = t[10];
  if (t[11] != null) data.GenCityLevel = t[11];
  if (t[12] != null) data.GenPlayerLevel = t[12];
  if (t[13] != null) data.GenShopType = t[13];
  data.UserAdditions = Array.isArray(t[14]) ? t[14] : [];
  data.Sold = t.length > 15 && Array.isArray(t[15]) ? t[15] : [];
  const s = new Shop();
  return s.load(data);
}

//#endregion

//#region Spellbook tuple: [name, class, level, characteristic, spells, moralAlign, ethicalAlign, domain1, domain2, usedDomainSpells, preparedDomainSpells, specialized, forbidden1, forbidden2]
const SB_TUPLE_KEYS = ['Name', 'Class', 'Level', 'Characteristic', 'Spells', 'MoralAlignment', 'EthicalAlignment', 'Domain1', 'Domain2', 'UsedDomainSpells', 'PreparedDomainSpells', 'Specialized', 'Forbidden1', 'Forbidden2'];

export function spellbookToTuple(sb) {
  const data = typeof sb.serialize === 'function' ? sb.serialize() : sb;
  return SB_TUPLE_KEYS.map(k => data[k]);
}

export function spellbookFromTuple(t) {
  if (!Array.isArray(t) || t.length < 14) return null;
  const data = {};
  SB_TUPLE_KEYS.forEach((k, i) => { data[k] = t[i]; });
  const s = new Spellbook();
  return s.load(data);
}

//#endregion

//#region Loot tuple: [level, goldMod, goodsMod, itemsMod, seed, timestamp, classicGen]
export function lootToTuple(loot) {
  const data = typeof loot.serialize === 'function' ? loot.serialize() : loot;
  return [data.Level, data.GoldMod, data.GoodsMod, data.ItemsMod, data.Seed, data.Timestamp, data.ClassicGen];
}

export function lootFromTuple(t) {
  if (!Array.isArray(t) || t.length < 7) return null;
  const data = {
    Level: t[0],
    GoldMod: t[1],
    GoodsMod: t[2],
    ItemsMod: t[3],
    Seed: t[4],
    Timestamp: t[5],
    ClassicGen: t[6],
  };
  const l = new Loot();
  return l.load(data);
}

//#endregion

//#region Mutate app (immutable updates)

export function updateWorldAt(app, worldIndex, world) {
  const w = [...(app.w || [])];
  w[worldIndex] = worldToTuple(world);
  return { ...app, w };
}

export function updateShopAt(app, worldIndex, cityIndex, shopIndex, shop) {
  const w = (app.w || []).map((wt, wi) => {
    if (wi !== worldIndex) return wt;
    const cities = (wt[3] || []).map((ct, ci) => {
      if (ci !== cityIndex) return ct;
      const shops = [...(ct[4] || [])];
      shops[shopIndex] = shopToTuple(shop);
      return [ct[0], ct[1], ct[2], ct[3], shops];
    });
    return [wt[0], wt[1], wt[2], cities];
  });
  return { ...app, w };
}

export function updateSpellbookAt(app, index, spellbook) {
  const sb = [...(app.sb || [])];
  sb[index] = spellbookToTuple(spellbook);
  return { ...app, sb };
}

export function updateLootAt(app, index, loot) {
  const l = [...(app.l || [])];
  l[index] = lootToTuple(loot);
  return { ...app, l };
}

export function updatePlayerAt(app, index, serializedCharacter) {
  if (!app || !Array.isArray(app.psc) || index < 0 || index >= app.psc.length) return app;
  const psc = [...app.psc];
  psc[index] = serializedCharacter && typeof serializedCharacter === 'object' ? { ...serializedCharacter } : app.psc[index];
  return { ...app, psc };
}

//#endregion

//#region Load / Save

export function loadApp() {
  try {
    const raw = localStorage.getItem(ROOT_KEY);
    if (!raw) return getDefaultApp();
    const parsed = JSON.parse(decompressFromUTF16(raw));
    if (!parsed || typeof parsed !== 'object') return getDefaultApp();
    if ((parsed.v | 0) < CURRENT_VERSION) return getDefaultApp();
    return expandApp(parsed);
  } catch {
    return getDefaultApp();
  }
}

export function saveApp(app) {
  if (!app || typeof app !== 'object') return;
  const toSave = compactApp({ ...app, v: CURRENT_VERSION });
  localStorage.setItem(ROOT_KEY, compressToUTF16(JSON.stringify(toSave)));
}

//#endregion

//#region Index-based accessors (return class instances from tuples)

export function getWorldByIndex(app, i) {
  if (!app || !Array.isArray(app.w) || i == null || i < 0 || i >= app.w.length) return null;
  return worldFromTuple(app.w[i]);
}

export function getCityByIndex(app, worldIndex, cityIndex) {
  const world = getWorldByIndex(app, worldIndex);
  if (!world || !Array.isArray(world.Cities) || cityIndex < 0 || cityIndex >= world.Cities.length) return null;
  return world.Cities[cityIndex];
}

export function getShopByIndex(app, worldIndex, cityIndex, shopIndex) {
  const city = getCityByIndex(app, worldIndex, cityIndex);
  if (!city || !Array.isArray(city.Shops) || shopIndex < 0 || shopIndex >= city.Shops.length) return null;
  return city.Shops[shopIndex];
}

export function getSpellbookByIndex(app, i) {
  if (!app || !Array.isArray(app.sb) || i == null || i < 0 || i >= app.sb.length) return null;
  return spellbookFromTuple(app.sb[i]);
}

export function getLootByIndex(app, i) {
  if (!app || !Array.isArray(app.l) || i == null || i < 0 || i >= app.l.length) return null;
  return lootFromTuple(app.l[i]);
}

/** Return serialized character at index (plain object). For Player instance use storage.getPlayerByIndex. */
export function getPlayerSheetCharacterAt(app, i) {
  if (!app || !Array.isArray(app.psc) || i == null || i < 0 || i >= app.psc.length) return null;
  return app.psc[i] || null;
}

//#endregion
