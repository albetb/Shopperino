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
 * ## Size: one lazy chunk per language
 *
 * These were imported statically while they were small — tens of kB. They are
 * not small any more: the Italian is **235 kB gzipped** with spells still only
 * two thirds translated, and an English reader should not download a byte of
 * it. So they load the way `loadFile.js` already loads the creature files —
 * one dynamic `import()` per pack under a shared chunk name, a `listeners`
 * set, and a synchronous accessor that answers with the English until the
 * chunk arrives.
 *
 * `applyProse` stays synchronous for every caller. Nothing downstream of
 * `loadFile` knows the difference; the only visible consequence is that a
 * description reads English for the few hundred milliseconds before the chunk
 * lands, which is why App.jsx keys the tree on `isProseReady` as well as the
 * language — see the note there.
 *
 * The English path never loads anything at all: `en` has no entry in FILES, so
 * `isProseReady('en')` is true from the first frame and nothing is fetched.
 */

import { getLanguage } from './index';

/**
 * Every prose pack, by language and then by data file name.
 *
 * One `webpackChunkName` for the whole language, so the twelve files arrive as
 * a single request rather than twelve. Adding a pack means adding a line here
 * — and `verify.py` fails the build if a pack exists in `src/data/<lang>/` and
 * this map does not name it, because a pack nobody imports is invisible.
 */
const FILES = {
  it: {
    tables: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/tables.json'),
    feats: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/feats.json'),
    skills: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/skills.json'),
    races: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/races.json'),
    classes: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/classes.json'),
    items: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/items.json'),
    animals: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/animals.json'),
    traps: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/traps.json'),
    vermin: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/vermin.json'),
    deities: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/deities.json'),
    familiarAbilities: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/familiarAbilities.json'),
    companionAbilities: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/companionAbilities.json'),
    monsters: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/monsters.json'),
    spells: () => import(/* webpackChunkName: "prose-it" */ '../../data/it/spells.json'),
  },
};

/**
 * Packs that are declared but not fetched with the rest of their language.
 *
 * `rules` is 131 kB gzipped on its own — as large as everything above put
 * together — and nothing outside the rules tab ever reads a word of it. Adding
 * it to `FILES` would put that on the critical path of every Italian reader
 * who never opens the tab, which is the mistake the lazy chunk was created to
 * undo in the first place.
 *
 * It is still *declared* here, and `proseFiles` reports it, because
 * `verify.py` fails on a pack in `src/data/it/` that this module does not
 * name — a pack nobody imports is a translation nobody can read, and that gate
 * exists because three finished packs once sat dead on disk. Declaring it
 * late keeps the gate satisfied and the chunk out of the way.
 *
 * `preloadProseFile` fetches one of these; `loadFile.preloadRules` is what
 * calls it, alongside the English data it translates.
 */
const LATE = {
  it: {
    rules: () => import(/* webpackChunkName: "prose-it-rules" */ '../../data/it/rules.json'),
  },
};

/** Packs that have arrived, by language. A language absent here is not ready. */
const PROSE = {};
/* One request per language however many callers ask, and a failure that can be
   retried rather than cached forever. */
const inFlight = {};
const listeners = new Set();

/** Whether a language needs a chunk at all. English is the source and does not. */
function isTranslated(lang) {
  return Boolean(FILES[lang]);
}

/**
 * Whether a language's prose is in place.
 *
 * True immediately for a language with no packs, so an English reader never
 * waits for — or downloads — anything.
 */
export function isProseReady(lang = getLanguage()) {
  return !isTranslated(lang) || Boolean(PROSE[lang]);
}

/** Fetch a language's prose chunk. Idempotent; every caller shares one request. */
export function preloadProse(lang = getLanguage()) {
  if (!isTranslated(lang) || PROSE[lang]) return Promise.resolve();
  if (inFlight[lang]) return inFlight[lang];

  const entries = Object.entries(FILES[lang]);
  inFlight[lang] = Promise.all(entries.map(([, load]) => load()))
    .then((mods) => {
      const pack = {};
      entries.forEach(([name], i) => {
        pack[name] = mods[i].default ?? mods[i];
      });
      PROSE[lang] = pack;
      listeners.forEach((fn) => fn());
      return pack;
    })
    .catch((error) => {
      // Allow a retry rather than caching the failure forever.
      delete inFlight[lang];
      throw error;
    });
  return inFlight[lang];
}

/**
 * Fetch one late pack and merge it into the language that is already loaded.
 *
 * Resolves to nothing at all for a language with no such pack, so a caller
 * never has to ask whether the current language is translated. Safe to call
 * repeatedly: the second caller gets the first one's request.
 */
export function preloadProseFile(lang, name) {
  const load = LATE[lang]?.[name];
  if (!load) return Promise.resolve();
  if (PROSE[lang]?.[name]) return Promise.resolve();

  const key = `${lang}:${name}`;
  if (inFlight[key]) return inFlight[key];

  /* The eager packs have to be in place first: this merges into `PROSE[lang]`,
     and `preloadProse` assigns that object wholesale when it resolves, which
     would drop a late pack that landed before it. */
  inFlight[key] = preloadProse(lang)
    .then(load)
    .then((mod) => {
      PROSE[lang][name] = mod.default ?? mod;
      listeners.forEach((fn) => fn());
    })
    .catch((error) => {
      delete inFlight[key];
      throw error;
    });
  return inFlight[key];
}

/** Whether a late pack is in place — or was never needed in this language. */
export function isProseFileReady(name, lang = getLanguage()) {
  if (!LATE[lang]?.[name]) return true;
  return Boolean(PROSE[lang]?.[name]);
}

/** Notified when a prose chunk lands. Returns its own unsubscribe. */
export function subscribeProse(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

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
  if (!pack || !data) {
    /* A synchronous read this early means nobody started the chunk yet — start
       it, so the caller's next render has something to show. Same shape as
       `creatureFile` in loadFile.js. */
    if (!pack && LATE[lang]?.[name]) {
      preloadProseFile(lang, name).catch(() => {});
    } else if (!pack && isTranslated(lang)) {
      preloadProse(lang).catch(() => {});
    }
    return data;
  }

  const key = `${lang}:${name}`;
  const hit = cache.get(key);
  if (hit && hit.source === data) return hit.value;

  const copy = JSON.parse(JSON.stringify(data));
  Object.keys(pack).forEach((path) => setPath(copy, path, pack[path]));
  cache.set(key, { source: data, value: copy });
  return copy;
}

/** Which data files a language has prose for. Used by the coverage tests.
    Read from the declaration, not from what has arrived, so it answers the
    same before and after the chunk lands. */
export function proseFiles(lang) {
  return [...Object.keys(FILES[lang] ?? {}), ...Object.keys(LATE[lang] ?? {})];
}

/** One pack, for tests and tooling. */
export function prosePack(lang, name) {
  return PROSE[lang]?.[name] ?? null;
}
