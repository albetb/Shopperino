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
import trapsData from '../data/traps.json';
import { applyProse, preloadProseFile } from './i18n/prose';
import { getLanguage } from './i18n';

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

/*
 * The rule notes are the same story a second time, one tab further away.
 *
 * `rules.json` is generated from obsidian-vault/dnd-rules/ by
 * scripts/build-rules.mjs — 33 topics, 498 sections, 123 kB gzipped — and it
 * is reached only by an explicit click on the rules tab. So it loads on the
 * creature pattern: one chunk, a synchronous accessor that answers with the
 * empty shape until it lands, and subscribers that redraw when it does.
 *
 * The Italian pack rides along in the same call but a *different* chunk, so an
 * English reader fetches only the English and an Italian reader pays for both
 * exactly once, when they open the tab.
 */
const EMPTY_RULES = { topics: [] };
let rulesData = null;
let rulesPromise = null;

/** Fetch the rules chunk, and the current language's pack for it. */
export function preloadRules() {
  if (rulesPromise) return rulesPromise;
  rulesPromise = Promise.all([
    import(/* webpackChunkName: "rules" */ '../data/rules.json'),
    preloadProseFile(getLanguage(), 'rules'),
  ])
    .then(([mod]) => {
      rulesData = mod.default ?? mod;
      listeners.forEach((fn) => fn());
      return rulesData;
    })
    .catch((error) => {
      rulesPromise = null;
      throw error;
    });
  return rulesPromise;
}

/** Whether the rules chunk has arrived. */
export function isRulesDataReady() {
  return rulesData !== null;
}

/**
 * The rule notes in English, whatever the reading language is.
 *
 * The rules search matches an Italian reader's query against both languages,
 * because half the terms of art in 3.5 are remembered in English by anyone who
 * has read the SRD. `loadFile('rules')` answers in the reading language, so
 * the English original needs its own way out — and it is already in memory,
 * since the pack is laid over a copy rather than replacing it.
 *
 * This is the only accessor that returns untranslated text on purpose. Nothing
 * should render from it.
 */
export function rulesEnglish() {
  return rulesData ?? EMPTY_RULES;
}

/**
 * Notified when the rules chunk lands.
 *
 * The same listener set as the creatures, so a subscriber to either is woken
 * by both. That costs a re-render nothing was waiting for, once, and is worth
 * more than two sets that can drift apart.
 */
export const subscribeRulesData = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

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
 * Supported: 'items' | 'scrolls' | 'tables' | 'spells' | 'feats' | 'skills' | 'skillsynergies' | 'races' | 'classes' | 'animals' | 'monsters' | 'vermin' | 'deities' | 'traps' | 'rules'
 */
export function loadFile(fileName) {
  try {
    /* Every file goes through `applyProse`, which lays the current language's
       translated descriptions over a copy of the English. With no pack — which
       is every file in English — it hands the original straight back, so the
       English path costs nothing. The English data itself is never modified.

       The translation is applied to the WHOLE parsed file before the slice
       below, because a pack's keys are rooted at the file: feats.json is keyed
       `Feats/0/Description` even though this returns the inner array. */
    switch (fileName.toLowerCase()) {
      case 'items':
        return applyProse('items', items);
      case 'scrolls':
        return applyProse('scrolls', scrolls);
      case 'tables':
        return applyProse('tables', tables);
      case 'spells':
        return applyProse('spells', spells);
      case 'feats':
        return applyProse('feats', featsData)?.Feats || [];
      case 'skills':
        return applyProse('skills', skillsData)?.Skills || [];
      case 'skillsynergies':
        return applyProse('skills', skillsData)?.Synergies || [];
      case 'races':
        return applyProse('races', racesData)?.races ?? {};
      case 'classes':
        return applyProse('classes', classesData)?.classes ?? {};
      case 'animals':
        return applyProse('animals', creatureFile('animals'));
      case 'monsters':
        return applyProse('monsters', creatureFile('monsters'));
      case 'vermin':
        return applyProse('vermin', creatureFile('vermin'));
      case 'rules': {
        if (!rulesData) {
          preloadRules().catch(() => {});
          return EMPTY_RULES;
        }
        return applyProse('rules', rulesData);
      }
      case 'traps':
        return applyProse('traps', trapsData) ?? { traps: [], tables: {} };
      case 'deities':
        return applyProse('deities', deitiesData)?.deities ?? [];
      case 'companionabilities':
        return applyProse('companionAbilities', companionAbilitiesData) ?? {};
      case 'familiarabilities':
        return applyProse('familiarAbilities', familiarAbilitiesData) ?? {};
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}
