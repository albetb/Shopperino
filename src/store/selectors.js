import {
  getWorldByIndex,
  getWorldsList,
  getSpellbookByIndex,
  getLootByIndex,
} from '../lib/storage';

export function selectPersist(state) {
  return state.persist ?? null;
}

export function selectWorldIndex(state) {
  const p = selectPersist(state);
  return p?.sw ?? null;
}

export function selectWorld(state) {
  const p = selectPersist(state);
  if (!p) return null;
  return getWorldByIndex(p, p?.sw);
}

export function selectCity(state) {
  const w = selectWorld(state);
  if (!w || !Array.isArray(w.Cities)) return null;
  const i = w.SelectedCityIndex ?? 0;
  return w.Cities[i] ?? null;
}

export function selectShop(state) {
  const c = selectCity(state);
  if (!c || !Array.isArray(c.Shops)) return null;
  const i = c.SelectedShopIndex ?? 0;
  return c.Shops[i] ?? null;
}

export function selectWorldsList(state) {
  const p = selectPersist(state);
  return getWorldsList(p);
}

export function selectSpellbookIndex(state) {
  const p = selectPersist(state);
  return p?.ssb ?? null;
}

export function selectSpellbook(state) {
  const p = selectPersist(state);
  if (!p) return null;
  return getSpellbookByIndex(p, p?.ssb);
}

export function selectSpellbooksList(state) {
  const p = selectPersist(state);
  if (!p || !Array.isArray(p.sb)) return [];
  return (p.sb || []).map(t => ({ name: t[0] }));
}

export function selectLootIndex(state) {
  const p = selectPersist(state);
  return p?.sl ?? null;
}

export function selectLoot(state) {
  const p = selectPersist(state);
  if (!p) return null;
  return getLootByIndex(p, p?.sl);
}

export function selectLootsList(state) {
  const p = selectPersist(state);
  if (!p || !Array.isArray(p.l)) return [];
  return (p.l || []).map(t => ({ timestamp: t[5] }));
}
