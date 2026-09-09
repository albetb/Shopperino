import { detectLanguage, LANGUAGES, DEFAULT_LANG } from './index';
import { readSavedApp, saveApp, getDefaultApp } from '../appState';

/* The app should open in Italian for an Italian reader who has never chosen a
   language, and in English for everyone else. The whole difficulty is in what
   counts as "never chosen" — see the readSavedApp block below, which is the
   part that would silently undo a reader's choice if it were got wrong. */

const nav = (...languages) => ({ languages, language: languages[0] });

describe('picking a language from the browser', () => {
  test('the first preference the app speaks wins', () => {
    expect(detectLanguage(nav('it'))).toBe('it');
    expect(detectLanguage(nav('en'))).toBe('en');
  });

  test('region is dropped — it-CH is Italian', () => {
    expect(detectLanguage(nav('it-CH'))).toBe('it');
    expect(detectLanguage(nav('IT-it'))).toBe('it');
  });

  test('a language with no pack falls through to the next one', () => {
    expect(detectLanguage(nav('de', 'fr', 'it', 'en'))).toBe('it');
  });

  test('a reader who speaks nothing the app speaks gets English', () => {
    expect(detectLanguage(nav('de', 'fr', 'ja'))).toBe(DEFAULT_LANG);
  });

  test('order is the reader\'s, not ours', () => {
    // English first means English, even though Italian is also on the list.
    expect(detectLanguage(nav('en-GB', 'it'))).toBe('en');
  });

  test('a browser that reports nothing useful still yields a language', () => {
    expect(detectLanguage({})).toBe(DEFAULT_LANG);
    expect(detectLanguage({ languages: [] })).toBe(DEFAULT_LANG);
    expect(detectLanguage({ languages: [undefined, ''] })).toBe(DEFAULT_LANG);
    expect(detectLanguage(null)).toBe(DEFAULT_LANG);
  });

  test('every declared language can be detected — no second list to maintain', () => {
    LANGUAGES.forEach(({ code }) => {
      expect(detectLanguage(nav(code))).toBe(code);
    });
  });
});

describe('what counts as "nobody has chosen yet"', () => {
  beforeEach(() => localStorage.clear());

  test('nothing stored is a first visit', () => {
    expect(readSavedApp().saved).toBe(false);
  });

  test('a reader who chose English is NOT a first visit', () => {
    /* This is the case that makes the whole feature work. `compactApp` omits
       any key equal to its default and the default language is English, so
       choosing English leaves `lg` absent — byte-identical to never having
       chosen. Keying off the missing `lg` would flip an Italian-browser reader
       back to Italian on every reload, and the setting would look broken.
       `saved` is what tells them apart. */
    saveApp({ ...getDefaultApp(), lg: 'en' });
    expect(readSavedApp().saved).toBe(true);

    // And the stored bytes really do drop the key, which is why `saved` has to
    // carry this and `lg` cannot.
    const stored = JSON.parse(
      require('lz-string').decompressFromUTF16(localStorage.getItem('app')));
    expect(stored.lg).toBeUndefined();
  });

  test('a reader who chose Italian keeps Italian', () => {
    saveApp({ ...getDefaultApp(), lg: 'it' });
    const { app, saved } = readSavedApp();
    expect(saved).toBe(true);
    expect(app.lg).toBe('it');
  });

  test('an unreadable save is a first visit rather than a crash', () => {
    localStorage.setItem('app', 'not compressed json');
    expect(readSavedApp().saved).toBe(false);
  });

  test('a save from an older CURRENT_VERSION is a first visit', () => {
    // Deliberate: every other preference resets at a version bump, so the
    // language resetting with them is consistent rather than surprising.
    saveApp({ ...getDefaultApp(), lg: 'it' });
    const raw = localStorage.getItem('app');
    expect(raw).toBeTruthy();
    localStorage.setItem('app', raw);
    // Rewrite it with a version that is definitely older.
    const stale = { ...getDefaultApp(), v: 1, lg: 'it' };
    localStorage.setItem('app', require('lz-string')
      .compressToUTF16(JSON.stringify(stale)));
    expect(readSavedApp().saved).toBe(false);
  });
});
