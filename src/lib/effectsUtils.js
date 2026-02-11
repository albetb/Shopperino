import { loadFile } from './loadFile';

/** Canonical order of effect tables in tables.json (used for id lookup and iteration). */
export const EFFECT_TABLE_ORDER = ['Magic Melee Weapon', 'Magic Ranged Weapon', 'Magic Shield', 'Magic Armor'];

function getEffectsArray() {
  const tables = loadFile('tables');
  if (!tables) return [];
  return EFFECT_TABLE_ORDER.flatMap(type => tables[type] || []);
}

/**
 * Get effect by link (slug). Returns { Name, Link, Description } or [] when not found.
 * Strips Minor, Medium, Major, Cost Modifier.
 */
export function getEffectByLink(link) {
  try {
    const effects = getEffectsArray();
    const found = effects.find(item => item.Link === link);
    if (!found) return [];
    const { Minor, Medium, Major, 'Cost Modifier': costModifier, ...cleaned } = found;
    return cleaned;
  } catch (err) {
    return null;
  }
}

/** Get effect by global id. Same shape as getEffectByLink. */
export function getEffectById(id) {
  try {
    const tables = loadFile('tables');
    if (!tables || typeof id !== 'number' || id < 0) return null;
    const effects = EFFECT_TABLE_ORDER.flatMap(type => tables[type] || []);
    const found = effects.find(entry => entry && entry.id === id);
    if (!found) return null;
    const { Minor, Medium, Major, 'Cost Modifier': costModifier, ...cleaned } = found;
    return cleaned;
  } catch (err) {
    return null;
  }
}

/** Get effect id from slug (e.g. "flaming"). Returns number or null. */
export function getEffectIdBySlug(slugName) {
  if (!slugName || typeof slugName !== 'string') return null;
  const tables = loadFile('tables');
  if (!tables) return null;
  for (const type of EFFECT_TABLE_ORDER) {
    const arr = tables[type] || [];
    const entry = arr.find(e => e && e.Link === slugName);
    if (entry && typeof entry.id === 'number') return entry.id;
  }
  return null;
}
