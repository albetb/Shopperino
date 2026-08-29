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

const CURRENT_VERSION = 260609;
const ROOT_KEY = 'app';

//#region UI bitmask
// uiFlags: one integer, each bit = one boolean. stc: one integer, bits 0-9 = spell table level collapsed.
export const UI_FLAG = {
  mm: 0, sbc: 1, ibc: 2, wc: 3, cc: 4, sc: 5, pc: 6, src: 7, sbsbc: 8, cdc: 9, ddc: 10, ssd: 11, lsc: 12, lc: 13, psbc: 14,
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
    psv: 'none', // player sheet main view: 'none' | 'race' | 'class' | 'note'
    pscards: {}, // player sheet sidebar card collapsed: { identity?, abilityScores?, Combat?, ... } true = collapsed
    pscombat: {}, // combat / inventory page card collapsed: { player?, combat?, items?, carry?, money? } true = collapsed
    th: 'dark',     // theme: 'dark' | 'light' (omitted when default)
    ac: 'crimson',  // accent hue name (omitted when default)
    un: 'metric',   // units: 'metric' | 'imperial' | 'squares' (omitted when default)
    dcm: 1,         // dice roller: count-button selection, one bit per button
    dlr: [],        // dice roller: last roll as [sides, ...rolls]
    mbf: [],        // monster book filters: [srcMask, name, type, size, terrain, crMin, crMax]
    mbr: [],        // monster book roster: array of [ref, maxLife, ...bonuses, ...damages]
    mbo: -1,        // monster book: index of the open roster entry, -1 for none
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

/** Merge raw with defaults. */
export function expandApp(raw) {
  if (!raw || typeof raw !== 'object') return getDefaultApp();
  const def = getDefaultApp();
  const out = { ...def };
  for (const k of Object.keys(raw)) {
    if (raw[k] !== undefined) out[k] = raw[k];
  }
  out.v = raw.v ?? CURRENT_VERSION;
  out.uiFlags = raw.uiFlags !== undefined ? (raw.uiFlags | 0) : DEFAULT_UI_FLAGS;
  out.stc = raw.stc !== undefined ? (raw.stc | 0) : 0;
  return out;
}

//#endregion

//#region World data
export function worldToData(world) {
  const Cities = (world.Cities || []).map(c => cityToData(c));
  const sel = world.SelectedCityIndex != null ? world.SelectedCityIndex : 0;
  const SelectedCityIndex = Cities.length ? Math.max(0, Math.min(sel, Cities.length - 1)) : 0;
  return { Name: world.Name || '', Level: world.Level ?? 1, SelectedCityIndex, Cities };
}

export function worldFromData(d) {
  if (!d || typeof d !== 'object') return null;
  const w = new World();
  w.Name = d.Name ?? '';
  w.Level = d.Level ?? 1;
  w.SelectedCityIndex = Math.max(0, d.SelectedCityIndex | 0);
  w.Cities = (d.Cities || []).map(cd => cityFromData(cd));
  return w;
}

//#endregion

//#region City data
export function cityToData(city) {
  const Shops = (city.Shops || []).map(s => shopToData(s));
  const sel = city.SelectedShopIndex != null ? city.SelectedShopIndex : 0;
  const SelectedShopIndex = Shops.length ? Math.max(0, Math.min(sel, Shops.length - 1)) : 0;
  return { Name: city.Name || '', Level: city.Level ?? 0, PlayerLevel: city.PlayerLevel ?? 1, SelectedShopIndex, Shops };
}

export function cityFromData(d) {
  if (!d || typeof d !== 'object') return null;
  const c = new City();
  c.Name = d.Name ?? '';
  c.Level = d.Level ?? 0;
  c.PlayerLevel = d.PlayerLevel ?? 1;
  c.SelectedShopIndex = Math.max(0, d.SelectedShopIndex | 0);
  c.Shops = (d.Shops || []).map(sd => shopFromData(sd));
  return c;
}

//#endregion

//#region Shop data — delegates to Shop.serialize / Shop.load
export function shopToData(shop) {
  return typeof shop.serialize === 'function' ? shop.serialize() : shop;
}

export function shopFromData(d) {
  if (!d || typeof d !== 'object') return null;
  return new Shop().load(d);
}

//#endregion

//#region Spellbook data — delegates to Spellbook.serialize / Spellbook.load
export function spellbookToData(sb) {
  return typeof sb.serialize === 'function' ? sb.serialize() : sb;
}

export function spellbookFromData(d) {
  if (!d || typeof d !== 'object') return null;
  return new Spellbook().load(d);
}

//#endregion

//#region Loot data — delegates to Loot.serialize / Loot.load
export function lootToData(loot) {
  return typeof loot.serialize === 'function' ? loot.serialize() : loot;
}

export function lootFromData(d) {
  if (!d || typeof d !== 'object') return null;
  return new Loot().load(d);
}

//#endregion

//#region Mutate app (immutable updates)

export function updateWorldAt(app, worldIndex, world) {
  const w = [...(app.w || [])];
  w[worldIndex] = worldToData(world);
  return { ...app, w };
}

export function updateShopAt(app, worldIndex, cityIndex, shopIndex, shop) {
  const w = (app.w || []).map((wd, wi) => {
    if (wi !== worldIndex) return wd;
    const Cities = (wd.Cities || []).map((cd, ci) => {
      if (ci !== cityIndex) return cd;
      const Shops = [...(cd.Shops || [])];
      Shops[shopIndex] = shopToData(shop);
      return { ...cd, Shops };
    });
    return { ...wd, Cities };
  });
  return { ...app, w };
}

export function updateSpellbookAt(app, index, spellbook) {
  const sb = [...(app.sb || [])];
  sb[index] = spellbookToData(spellbook);
  return { ...app, sb };
}

export function updateLootAt(app, index, loot) {
  const l = [...(app.l || [])];
  l[index] = lootToData(loot);
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

//#region Index-based accessors (return class instances from persisted data)

export function getWorldByIndex(app, i) {
  if (!app || !Array.isArray(app.w) || i == null || i < 0 || i >= app.w.length) return null;
  return worldFromData(app.w[i]);
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
  return spellbookFromData(app.sb[i]);
}

export function getLootByIndex(app, i) {
  if (!app || !Array.isArray(app.l) || i == null || i < 0 || i >= app.l.length) return null;
  return lootFromData(app.l[i]);
}

/** Return serialized character at index (plain object). For Player instance use storage.getPlayerByIndex. */
export function getPlayerSheetCharacterAt(app, i) {
  if (!app || !Array.isArray(app.psc) || i == null || i < 0 || i >= app.psc.length) return null;
  return app.psc[i] || null;
}

//#endregion
