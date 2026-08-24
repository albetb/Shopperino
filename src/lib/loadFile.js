import items from '../data/items.json';
import scrolls from '../data/scrolls.json';
import tables from '../data/tables.json';
import spells from '../data/spells.json';
import featsData from '../data/feats.json';
import skillsData from '../data/skills.json';
import racesData from '../data/races.json';
import classesData from '../data/classes.json';
import deitiesData from '../data/deities.json';
import companionAbilitiesData from '../data/companionAbilities.json';
import familiarAbilitiesData from '../data/familiarAbilities.json';

/*
 * The three creature files are deliberately NOT imported here.
 *
 * Together they are 2.2 MB of JSON — about half the bundle — and nothing on
 * screen at first paint needs a single byte of it: the bestiary, wild shape,
 * companions and the creature links inside spell descriptions are all reached
 * by a later interaction. Statically importing them made every visitor wait on
 * the whole monster manual before the app rendered.
 *
 * So they load as one lazy chunk, started right after mount by App.jsx.
 * `loadFile` stays synchronous for every caller — it just answers with the
 * empty shape until the chunk lands, and anything that renders creature data
 * subscribes through `useCreatureData` so it redraws when it does.
 */

/** What the creature accessors answer with before the chunk arrives. */
const EMPTY_CREATURES = {
  monsters: { monsters: [] },
  animals: { animals: [] },
  vermin: { vermin: [] },
};

let creatures = null;
let creaturesPromise = null;
const listeners = new Set();

/**
 * Fetch the creature chunk. Idempotent — every caller shares one request, and
 * the returned promise resolves once the data is in place.
 */
export function preloadCreatureData() {
  if (creaturesPromise) return creaturesPromise;
  creaturesPromise = Promise.all([
    import(/* webpackChunkName: "creatures" */ '../data/monsters.json'),
    import(/* webpackChunkName: "creatures" */ '../data/animals.json'),
    import(/* webpackChunkName: "creatures" */ '../data/vermin.json'),
  ])
    .then(([monsters, animals, vermin]) => {
      creatures = {
        monsters: monsters.default ?? monsters,
        animals: animals.default ?? animals,
        vermin: vermin.default ?? vermin,
      };
      listeners.forEach((fn) => fn());
      return creatures;
    })
    .catch((error) => {
      // Allow a retry rather than caching the failure forever.
      creaturesPromise = null;
      throw error;
    });
  return creaturesPromise;
}

/** Whether the creature chunk has arrived. */
export function isCreatureDataReady() {
  return creatures !== null;
}

/** Notified once, when the chunk lands. Returns its own unsubscribe. */
export function subscribeCreatureData(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A creature file, or its empty shape while the chunk is still in flight. */
function creatureFile(key) {
  if (creatures) return creatures[key];
  // A sync read this early means nobody kicked the preload off yet — start it,
  // so the caller's next render has something to show.
  preloadCreatureData().catch(() => {});
  return EMPTY_CREATURES[key];
}

/**
 * Load a data file by name. Returns the parsed content or null.
 * Supported: 'items' | 'scrolls' | 'tables' | 'spells' | 'feats' | 'skills' | 'races' | 'classes' | 'animals' | 'monsters' | 'vermin' | 'deities'
 */
export function loadFile(fileName) {
  try {
    switch (fileName.toLowerCase()) {
      case 'items':
        return items;
      case 'scrolls':
        return scrolls;
      case 'tables':
        return tables;
      case 'spells':
        return spells;
      case 'feats':
        return featsData?.Feats || [];
      case 'skills':
        return skillsData?.Skills || [];
      case 'races':
        return racesData?.races ?? {};
      case 'classes':
        return classesData?.classes ?? {};
      case 'animals':
        return creatureFile('animals');
      case 'monsters':
        return creatureFile('monsters');
      case 'vermin':
        return creatureFile('vermin');
      case 'deities':
        return deitiesData?.deities ?? [];
      case 'companionabilities':
        return companionAbilitiesData ?? {};
      case 'familiarabilities':
        return familiarAbilitiesData ?? {};
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}
