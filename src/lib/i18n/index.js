/**
 * i18n — one app, several languages, English on disk.
 *
 * **English is the source and never leaves.** Every string in `src/components`
 * and `src/data` stays in English exactly as it was written; a translation is a
 * *pack* that sits beside it, keyed by that English text. Nothing is
 * overwritten, so switching back to English is free and a missing translation
 * degrades to the English rather than to a blank.
 *
 * That is the correction of an earlier mistake worth recording: the first
 * version of the translation replaced the English where it stood. It read
 * fine, but it made English unrecoverable without git and left no way to offer
 * both. Everything here follows from not doing that.
 *
 * Three kinds of string, three places the Italian lives:
 *
 * | Kind | Example | Pack file |
 * |---|---|---|
 * | A literal in a component | `t('Collapse')` | `src/data/<lang>/ui.json` |
 * | A name that is also a key | `tName('conditions', c.name)` | `src/data/<lang>/names.json` |
 * | Prose in `src/data` | a spell description | `src/data/<lang>/<file>.json` |
 *
 * The third one matters most for safety: because the Italian description lives
 * in its own file keyed by JSON path, **`src/data/*.json` is never written to
 * by a translator at all**. The English data — with every `Link`, every
 * `Category` that `startsWith('martial')`, every `attack` string the companion
 * parser reads — is immutable. A translation can no longer break a rule,
 * because it never touches the file the rules are in.
 *
 * ## Adding a language
 *
 * 1. Create `src/data/<code>/ui.json` and `names.json`.
 * 2. Add two imports and one entry to `PACKS` below.
 * 3. Add the code to `LANGUAGES`.
 *
 * Nothing else in the app knows how many languages there are.
 */

import itUi from '../../data/it/ui.json';
import itNames from '../../data/it/names.json';

/** Every language the app can be read in. `en` is the source and has no pack. */
export const LANGUAGES = [
  { code: 'en', label: 'English', endonym: 'English' },
  { code: 'it', label: 'Italian', endonym: 'Italiano' },
];

export const DEFAULT_LANG = 'en';

/* The UI and name packs are imported rather than fetched: they are small
   (tens of kB), and every screen needs them from the first paint. Prose packs
   are the big ones and load separately — see prose.js. */
const PACKS = {
  it: { ui: itUi, names: itNames },
};

/* Separates a disambiguating context from the English text in a key.
   The same English word does not always take the same Italian: "Init" is
   "Iniziativa" as a label and "Iniz." as a cramped column heading. Where that
   happens the call site says which it means — `t('Init', 'abbrev')` — and the
   pack holds a key of `abbrev\u0004Init`. Borrowed from gettext's msgctxt,
   which exists for exactly this. */
export const CONTEXT_SEP = '\u0004';

export function normalizeLang(value) {
  return LANGUAGES.some((l) => l.code === value) ? value : DEFAULT_LANG;
}

/** Whether a language has anything to say — English never does. */
export function hasPack(lang) {
  return Boolean(PACKS[normalizeLang(lang)]);
}

/**
 * One interface string, in the given language.
 *
 * @param {string} lang - language code.
 * @param {string} en - the English text, exactly as written in the component.
 * @param {string} [ctx] - optional disambiguator when one English string needs
 *   more than one translation.
 * @returns {string} the translation, or the English when there is none.
 */
export function translate(lang, en, ctx) {
  if (typeof en !== 'string' || !en) return en ?? '';
  const pack = PACKS[normalizeLang(lang)];
  if (!pack) return en;
  if (ctx) {
    const withCtx = pack.ui[ctx + CONTEXT_SEP + en];
    if (withCtx != null) return withCtx;
  }
  return pack.ui[en] ?? en;
}

/**
 * The name of a thing whose English name is its identity.
 *
 * The English name stays in `src/data`, in the save file and in every lookup;
 * only what the reader sees changes. See the module comment.
 *
 * @param {string} lang - language code.
 * @param {string} domain - a top-level key of the names pack ('conditions', …).
 * @param {string} en - the English name, exactly as it appears in the data.
 */
export function translateName(lang, domain, en) {
  if (typeof en !== 'string' || !en) return '';
  const pack = PACKS[normalizeLang(lang)];
  if (!pack) return en;
  return pack.names?.[domain]?.[en] ?? en;
}

/* ------------------------------------------------------------------------ *
 * The current language, for code that is not a React component.
 *
 * Components should use `useI18n()`, which subscribes to the store and so
 * re-renders when the language changes. But a few display strings are built
 * outside React — `getConditionByLink` composes the card the info sidebar
 * shows — and those need to know the language without being handed it through
 * five call sites. The store keeps this in step; see persistSyncMiddleware.
 * ------------------------------------------------------------------------ */

let current = DEFAULT_LANG;

/** Called by the store whenever the language changes. */
export function setLanguage(lang) {
  current = normalizeLang(lang);
}

export function getLanguage() {
  return current;
}

/** `translate` in the current language. For non-component code. */
export function t(en, ctx) {
  return translate(current, en, ctx);
}

/** `translateName` in the current language. For non-component code. */
export function tName(domain, en) {
  return translateName(current, domain, en);
}

/* --- tooling: used by the coverage tests and the translate-it skill ------- */

/** Whether a language pack has an entry for this name. */
export function hasName(domain, en, lang = 'it') {
  const names = PACKS[lang]?.names?.[domain];
  return Boolean(names && Object.prototype.hasOwnProperty.call(names, en));
}

/** Every English name a language pack knows for a domain. */
export function knownNames(domain, lang = 'it') {
  return Object.keys(PACKS[lang]?.names?.[domain] ?? {});
}

/** Every English string a language pack can translate. */
export function knownStrings(lang = 'it') {
  return Object.keys(PACKS[lang]?.ui ?? {});
}

export default t;
