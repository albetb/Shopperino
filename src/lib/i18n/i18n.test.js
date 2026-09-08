import { tName, hasName, knownNames } from './index';
import { loadFile } from '../loadFile';
import { getConditionByLink } from '../utils';
import names from '../../data/it/names.json';

/* The dictionary is keyed by the English name that lives in src/data, and that
   is the whole contract: get a key wrong by one character and the app quietly
   shows English for that one row, with nothing failing anywhere. These tests
   are the thing that fails instead. */

describe('looking a name up', () => {
  test('answers in Italian', () => {
    expect(tName('conditions', 'Fatigued')).toBe('Affaticato');
    expect(tName('abilities', 'Dexterity')).toBe('Destrezza');
  });

  test('falls back to the English when the entry is missing', () => {
    // A half-finished domain shows English words rather than blanks, so the
    // translation can land one file at a time.
    expect(tName('conditions', 'Not A Condition')).toBe('Not A Condition');
    expect(tName('spells', 'Acid Arrow')).toBe('Acid Arrow');
  });

  test('survives rubbish without throwing', () => {
    expect(tName('conditions', '')).toBe('');
    expect(tName('conditions', undefined)).toBe('');
    expect(tName('nope', 'Fatigued')).toBe('Fatigued');
  });

  test('hasName tells a real entry from a fallback', () => {
    expect(hasName('conditions', 'Fatigued')).toBe(true);
    expect(hasName('conditions', 'Not A Condition')).toBe(false);
  });
});

describe('the conditions dictionary against the data it describes', () => {
  const dataNames = Object.keys(loadFile('tables').Conditions);

  test('every condition in tables.json has an Italian name', () => {
    const missing = dataNames.filter((n) => !hasName('conditions', n));
    expect(missing).toEqual([]);
  });

  test('no entry names a condition that does not exist', () => {
    // Catches a typo in the key, which would otherwise be invisible: the app
    // would just keep showing the English name for that row.
    const orphans = knownNames('conditions').filter((n) => !dataNames.includes(n));
    expect(orphans).toEqual([]);
  });

  test('no two conditions share one Italian name', () => {
    const values = Object.values(names.conditions);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('the info-sidebar card for a condition', () => {
  test('carries the Italian title over the Italian description', () => {
    /* The card body comes from tables.json, which is translated in place; the
       title came from the key, which is not. They have to agree, or the sidebar
       reads "Fatigued" over a paragraph of Italian. */
    const [card] = getConditionByLink('fatigued');
    expect(card.Name).toBe('Affaticato');
    expect(card.Description).toMatch(/affaticato/i);
  });

  test('still resolves by the English slug, because that is the link', () => {
    expect(getConditionByLink('flat-footed')[0].Name).toBe('Colto alla Sprovvista');
  });
});
