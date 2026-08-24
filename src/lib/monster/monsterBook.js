import { loadFile } from '../loadFile';

/**
 * Bestiary browsing: which creatures exist, and which of them match a filter.
 *
 * The three creature files are disjoint, so a creature belongs to exactly one
 * source and each can be switched in or out of a search independently.
 */

/** The three creature files, as switchable sources. Bit order is display order. */
export const SOURCES = [
  { key: 'monsters', label: 'Monsters', file: 'monsters', field: 'monsters' },
  { key: 'animals', label: 'Animals', file: 'animals', field: 'animals' },
  { key: 'vermin', label: 'Vermin', file: 'vermin', field: 'vermin' },
];

/* Selection is one integer, a bit per source — CLAUDE.md prefers a bitmask
   over a set of booleans. All three on by default. */
export const ALL_SOURCES_MASK = (1 << SOURCES.length) - 1;

export function isSourceSelected(mask, index) {
  return (((Number(mask) || 0) >> index) & 1) === 1;
}

/** Flip one source. Turning the last one off is refused: a search of nothing
 *  finds nothing, which reads as a bug rather than as a choice. */
export function toggleSource(mask, index) {
  const next = (Number(mask) || 0) ^ (1 << index);
  return next === 0 ? (Number(mask) || ALL_SOURCES_MASK) : next;
}

export function normalizeSourceMask(mask) {
  const clean = (Number(mask) || 0) & ALL_SOURCES_MASK;
  return clean === 0 ? ALL_SOURCES_MASK : clean;
}

/**
 * Terrain buckets. The data carries 52 distinct environment strings — climate
 * and terrain glued together ("Temperate forests", "Warm marshes") plus the
 * planes — which is far too many for a dropdown. Each bucket matches on
 * keywords, so every climate of a terrain lands in one entry.
 */
export const TERRAINS = [
  { key: 'forest', label: 'Forest', match: ['forest'] },
  { key: 'hills', label: 'Hills', match: ['hill'] },
  { key: 'mountains', label: 'Mountains', match: ['mountain'] },
  { key: 'desert', label: 'Desert', match: ['desert'] },
  { key: 'marsh', label: 'Marsh', match: ['marsh', 'swamp'] },
  { key: 'plains', label: 'Plains', match: ['plain'] },
  { key: 'aquatic', label: 'Aquatic', match: ['aquatic', 'ocean', 'sea'] },
  { key: 'underground', label: 'Underground', match: ['underground'] },
  { key: 'plane', label: 'Other planes', match: ['plane'] },
  { key: 'any', label: 'Any environment', match: ['any'] },
];

/** Every creature in the selected sources, tagged with the source it came from. */
export function listBestiary(sourceMask = ALL_SOURCES_MASK) {
  const mask = normalizeSourceMask(sourceMask);
  const out = [];
  SOURCES.forEach((source, index) => {
    if (!isSourceSelected(mask, index)) return;
    const data = loadFile(source.file);
    const list = Array.isArray(data?.[source.field]) ? data[source.field] : [];
    list.forEach((creature) => out.push({ ...creature, source: source.key }));
  });
  return out.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/** A creature's challenge rating as a number, or null when it has none. */
export function creatureCr(creature) {
  const value = Number(creature?.challengeRating?.value);
  return Number.isFinite(value) ? value : null;
}

/**
 * Every challenge rating present across all three files, ascending. The CR
 * scale is not linear — it runs 1/4, 1/3, 1/2, then 1..27 — so the range
 * slider steps over these values by index rather than over the numbers.
 */
export function listChallengeRatings() {
  const seen = new Set();
  listBestiary(ALL_SOURCES_MASK).forEach((creature) => {
    const cr = creatureCr(creature);
    if (cr !== null) seen.add(cr);
  });
  return [...seen].sort((a, b) => a - b);
}

/** "1/4" rather than "0.25" — how a challenge rating is written. */
export function formatCr(value) {
  const cr = Number(value);
  if (!Number.isFinite(cr)) return '—';
  if (cr >= 1) return String(cr);
  if (Math.abs(cr - 0.25) < 0.01) return '1/4';
  if (Math.abs(cr - 0.3333) < 0.01) return '1/3';
  if (Math.abs(cr - 0.5) < 0.01) return '1/2';
  return String(cr);
}

/** Creature types present, for the type dropdown. */
export function listCreatureTypes() {
  const seen = new Set();
  listBestiary(ALL_SOURCES_MASK).forEach((c) => { if (c.type) seen.add(c.type); });
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** Sizes, largest to smallest — the order they read in a stat block. */
export const SIZES = [
  'Colossal', 'Gargantuan', 'Huge', 'Large', 'Medium', 'Small', 'Tiny', 'Diminutive', 'Fine',
];

/** Whether a creature's environment falls in a terrain bucket. */
export function matchesTerrain(creature, terrainKey) {
  if (!terrainKey) return true;
  const terrain = TERRAINS.find((t) => t.key === terrainKey);
  if (!terrain) return true;
  const environment = String(creature?.environment || '').toLowerCase();
  return terrain.match.some((word) => environment.includes(word));
}

/**
 * The creatures matching a filter, name-sorted.
 * @param {{sourceMask?: number, name?: string, type?: string, size?: string,
 *          terrain?: string, crMin?: number, crMax?: number}} filters
 */
export function filterBestiary(filters = {}) {
  const {
    sourceMask = ALL_SOURCES_MASK,
    name = '',
    type = '',
    size = '',
    terrain = '',
    crMin = null,
    crMax = null,
  } = filters;
  const query = String(name).trim().toLowerCase();

  return listBestiary(sourceMask).filter((creature) => {
    if (query && !String(creature.name).toLowerCase().includes(query)) return false;
    if (type && creature.type !== type) return false;
    if (size && creature.size !== size) return false;
    if (!matchesTerrain(creature, terrain)) return false;
    const cr = creatureCr(creature);
    // A creature with no CR cannot satisfy a CR range, so it drops out of one.
    if (crMin !== null && (cr === null || cr < crMin)) return false;
    if (crMax !== null && (cr === null || cr > crMax)) return false;
    return true;
  });
}

/**
 * One creature at random from those matching, or null when nothing matches.
 * Math.random, not the seeded prng: a repeat of yesterday's pick is not wanted.
 */
export function pickRandomCreature(filters = {}) {
  const matches = filterBestiary(filters);
  if (matches.length === 0) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}
