/**
 * Prose packs — the translated descriptions, applied over the English data.
 *
 * `src/data/*.json` is English and never changes. A pack is a flat map from a
 * JSON path to the translated string:
 *
 *     { "Conditions/Blinded": "Il personaggio non può vedere…" }
 *
 * `applyProse` lays that over a copy of the English file, so everything
 * downstream of `loadFile` sees translated text without a single caller
 * knowing a translation exists. The English original is untouched in memory
 * and on disk, which is what lets the language switch back instantly.
 *
 * ## Why the whole file, not the slice
 *
 * The paths are rooted at the file, so `feats.json` is keyed `Feats/0/Description`
 * even though `loadFile('feats')` hands back the inner `Feats` array. The
 * translation therefore happens on the whole parsed file, before `loadFile`
 * takes its slice.
 *
 * ## Size
 *
 * These are imported statically because right now they are small — tens of kB.
 * **That stops being true once spells and monsters are translated**: those two
 * packs alone will be well over a megabyte, and an English reader should not
 * download a byte of them. When the first big pack lands, move these to a lazy
 * chunk with the pattern `loadFile.js` already uses for the creature files —
 * one dynamic `import()`, a `listeners` set, and a synchronous accessor that
 * answers with the English until the chunk arrives.
 */

import { getLanguage } from './index';
import itTables from '../../data/it/tables.json';
import itFeats from '../../data/it/feats.json';
import itSkills from '../../data/it/skills.json';
import itRaces from '../../data/it/races.json';
import itClasses from '../../data/it/classes.json';

/** Every prose pack, by language and then by data file name. */
const PROSE = {
  it: {
    tables: itTables,
    feats: itFeats,
    skills: itSkills,
    races: itRaces,
    classes: itClasses,
  },
};

/* One translated copy per (language, file), built on first use. Keyed by
   language so switching back and forth costs nothing after the first time. */
const cache = new Map();

function setPath(root, path, value) {
  const parts = path.split('/');
  let node = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const next = Array.isArray(node) ? node[Number(key)] : node[key];
    if (next == null || typeof next !== 'object') return false;
    node = next;
  }
  const last = parts[parts.length - 1];
  const index = Array.isArray(node) ? Number(last) : last;
  if (Array.isArray(node) ? !Number.isInteger(index) : !(index in node)) return false;
  if (typeof node[index] !== 'string') return false;
  node[index] = value;
  return true;
}

/**
 * The English data with a language's translated prose laid over it.
 *
 * Returns the original object unchanged when there is nothing to apply, so the
 * English path costs nothing at all — no copy, no walk.
 *
 * @param {string} name - the data file's short name, as `loadFile` spells it.
 * @param {object} data - the parsed English file.
 * @param {string} [lang] - defaults to the current language.
 */
export function applyProse(name, data, lang = getLanguage()) {
  const pack = PROSE[lang]?.[name];
  if (!pack || !data) return data;

  const key = `${lang}:${name}`;
  const hit = cache.get(key);
  if (hit && hit.source === data) return hit.value;

  const copy = JSON.parse(JSON.stringify(data));
  Object.keys(pack).forEach((path) => setPath(copy, path, pack[path]));
  cache.set(key, { source: data, value: copy });
  return copy;
}

/** Which data files a language has prose for. Used by the coverage tests. */
export function proseFiles(lang) {
  return Object.keys(PROSE[lang] ?? {});
}

/** One pack, for tests and tooling. */
export function prosePack(lang, name) {
  return PROSE[lang]?.[name] ?? null;
}
