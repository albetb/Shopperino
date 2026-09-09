import {
  translate, translateName, t, tName, tx, setLanguage, getLanguage,
  normalizeLang, hasPack, hasName, knownNames, knownStrings,
  LANGUAGES, DEFAULT_LANG,
} from './index';
import React from 'react';
import { render } from '@testing-library/react';
import { applyProse, prosePack } from './prose';
import { loadFile } from '../loadFile';
import names from '../../data/it/names.json';

/* The contract is that English is the source and never moves: every key in
   every pack is the English text exactly as it appears in the app, and a
   missing entry falls back to that English rather than to a blank. These tests
   are what fails when a key drifts by one character — otherwise the app would
   just quietly show English for that one row, with nothing going wrong
   anywhere a person would look. */

afterEach(() => setLanguage(DEFAULT_LANG));

describe('the language itself', () => {
  test('English is the default and needs no pack', () => {
    expect(DEFAULT_LANG).toBe('en');
    expect(hasPack('en')).toBe(false);
    expect(hasPack('it')).toBe(true);
  });

  test('an unknown code falls back to English rather than breaking', () => {
    expect(normalizeLang('xx')).toBe('en');
    expect(normalizeLang(undefined)).toBe('en');
    expect(normalizeLang('it')).toBe('it');
  });

  test('every language declares a code and its own name for itself', () => {
    LANGUAGES.forEach((l) => {
      expect(typeof l.code).toBe('string');
      expect(l.endonym.length).toBeGreaterThan(0);
    });
  });
});

describe('an interface string', () => {
  test('is English in English, Italian in Italian', () => {
    expect(translate('en', 'Collapse')).toBe('Collapse');
    expect(translate('it', 'Collapse')).toBe('Comprimi');
  });

  test('falls back to the English when the pack has no entry', () => {
    // A half-finished pack shows English words, never blanks — which is what
    // lets the translation land one component at a time.
    expect(translate('it', 'Not translated yet')).toBe('Not translated yet');
  });

  test('survives rubbish without throwing', () => {
    expect(translate('it', '')).toBe('');
    expect(translate('it', undefined)).toBe('');
    expect(translate('xx', 'Collapse')).toBe('Collapse');
  });

  test('a context picks a different translation for the same English', () => {
    // "Init" is a label in one place and a cramped column heading in another.
    expect(translate('it', 'Init', 'nonexistent-context')).toBe(translate('it', 'Init'));
  });
});

describe('a name, which is also a key', () => {
  test('is English in English, Italian in Italian', () => {
    expect(translateName('en', 'conditions', 'Fatigued')).toBe('Fatigued');
    expect(translateName('it', 'conditions', 'Fatigued')).toBe('Affaticato');
    expect(translateName('it', 'abilities', 'Dexterity')).toBe('Destrezza');
  });

  test('falls back to the English name', () => {
    expect(translateName('it', 'conditions', 'Not A Condition')).toBe('Not A Condition');
    expect(translateName('it', 'nope', 'Fatigued')).toBe('Fatigued');
  });
});

describe('the current language, for code outside React', () => {
  test('t and tName follow it', () => {
    expect(getLanguage()).toBe('en');
    expect(t('Collapse')).toBe('Collapse');
    expect(tName('conditions', 'Fatigued')).toBe('Fatigued');

    setLanguage('it');
    expect(t('Collapse')).toBe('Comprimi');
    expect(tName('conditions', 'Fatigued')).toBe('Affaticato');
  });
});

describe('the Italian pack against the data it describes', () => {
  const dataNames = Object.keys(loadFile('tables').Conditions);

  test('every condition in the data has an Italian name', () => {
    expect(dataNames.filter((n) => !hasName('conditions', n))).toEqual([]);
  });

  test('no entry names a condition that does not exist', () => {
    // Catches a typo in a key, which is otherwise invisible: the app would
    // simply keep showing English for that row.
    expect(knownNames('conditions').filter((n) => !dataNames.includes(n))).toEqual([]);
  });

  test('no two conditions share one Italian name', () => {
    const values = Object.values(names.conditions);
    expect(new Set(values).size).toBe(values.length);
  });

  test('the UI pack is not empty and holds no empty translations', () => {
    const strings = knownStrings('it');
    expect(strings.length).toBeGreaterThan(0);
    strings.forEach((k) => expect(translate('it', k).trim()).not.toBe(''));
  });
});

describe('prose packs', () => {
  test('English data is returned untouched, with no copy taken', () => {
    const english = loadFile('tables');
    expect(applyProse('tables', english, 'en')).toBe(english);
  });

  test('Italian lays the translation over a copy, leaving the English alone', () => {
    const english = { Conditions: { Blinded: 'The character cannot see.' } };
    const before = english.Conditions.Blinded;
    const italian = applyProse('tables', english, 'it');
    expect(english.Conditions.Blinded).toBe(before);   // the source never moves
    expect(italian).not.toBe(english);
  });

  test('every path in a pack still exists in the English data', () => {
    /* A pack key is a path into src/data. If the data is reshaped and a key is
       left behind, that translation silently stops being applied — this is the
       thing that notices. */
    const pack = prosePack('it', 'tables');
    const data = loadFile('tables');
    const missing = Object.keys(pack).filter((path) => {
      let node = data;
      for (const part of path.split('/')) {
        if (node == null || typeof node !== 'object') return true;
        node = Array.isArray(node) ? node[Number(part)] : node[part];
      }
      return typeof node !== 'string';
    });
    expect(missing).toEqual([]);
  });

  test('loadFile hands back the translated prose once the language is Italian', () => {
    expect(loadFile('tables').Conditions.Blinded).toMatch(/^<p>The character cannot see/);
    setLanguage('it');
    expect(loadFile('tables').Conditions.Blinded).toMatch(/^<p>Il personaggio non pu/);
  });
});

/* A sentence with holes, rather than fragments glued around the values. The
   point of the holes is that a translation may put them in a different order,
   so that is the case worth pinning down. */
describe('tx — a whole sentence with holes', () => {
  afterEach(() => setLanguage('en'));

  test('fills the holes in order', () => {
    expect(tx('{0} of {1}', 3, 7)).toBe('3 of 7');
  });

  test('a translation may reorder the holes', () => {
    setLanguage('it');
    const en = 'The book prints this as {0}. Its own tables add up to {1} — '
      + 'one of the ten samples where the two disagree.';
    const out = tx(en, 'GS 5', 3);
    expect(out).toContain('GS 5');
    expect(out).toContain('3');
    expect(out).not.toContain('{0}');
    expect(out).not.toContain('{1}');
  });

  test('an untranslated sentence still fills its holes', () => {
    expect(tx('nothing here knows {0}', 'this')).toBe('nothing here knows this');
  });

  test('a hole with no value left for it renders empty, not "undefined"', () => {
    expect(tx('{0} and {1}', 'one')).toBe('one and ');
  });

  test('returns nodes, not a string, once a value is an element', () => {
    const out = tx('as {0} today', React.createElement('b', null, 'CR 5'));
    expect(Array.isArray(out)).toBe(true);
    expect(render(React.createElement('p', null, out)).container.textContent)
      .toBe('as CR 5 today');
  });
});

/* The data does not always capitalise a name the way the pack keys it: a
   trap's casterClass is 'cleric' against a pack that holds 'Cleric'. */
describe('tName and the data capitalisation', () => {
  afterEach(() => setLanguage('en'));

  test('matches a name the data spells in lower case', () => {
    setLanguage('it');
    expect(tName('classes', 'cleric')).toBe('chierico');
    expect(tName('classes', 'Cleric')).toBe('Chierico');
  });

  test('an unknown name is still handed back unchanged', () => {
    setLanguage('it');
    expect(tName('classes', 'Warlock')).toBe('Warlock');
  });

  test('every tName domain a component asks for exists in the pack', () => {
    // The fallback that makes a missing *name* harmless also hides a misspelt
    // *domain*, which silently translates nothing at all.
    const domains = ['alignments', 'classes', 'conditions', 'creatures',
      'saves', 'trapBypass'];
    domains.forEach((d) => expect(knownNames(d, 'it').length).toBeGreaterThan(0));
  });
});
