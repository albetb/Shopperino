import displayItemName, { itemName } from './displayItemName';
import { formatItemName } from './formatItemName';
import { setLanguage } from '../i18n';

/* The composed name is four pieces of data and three of them are words, so it
   is the one place a half-translated string can appear without any gate
   noticing: an Italian base name with an English qualifier welded onto it. */

afterEach(() => setLanguage('en'));

describe('an item name on its way to the screen', () => {
  test('English is what src/data spells, in both directions', () => {
    expect(itemName('Longsword')).toBe('Longsword');
    expect(displayItemName('Longsword', { bonus: 2 })).toBe('Longsword +2');
  });

  test('Italian names the item from the pack', () => {
    setLanguage('it');
    expect(itemName('Longsword')).toBe('Spada lunga');
    expect(itemName('Full plate')).toBe('Armatura completa');
  });

  test('a name the pack does not have stays English rather than going blank', () => {
    setLanguage('it');
    expect(itemName('Sword of the planes')).toBe('Sword of the planes');
  });

  test('every part of a composed name is translated, or none of it is', () => {
    setLanguage('it');
    /* Masterwork is a sentence, not a prefix: Italian puts the qualifier
       after the noun, and it agrees with it. */
    expect(displayItemName('Longsword', { masterwork: true }))
      .toBe('Spada lunga di fattura perfetta');
    /* +N last, the property list before it, as formatItemName composes. */
    expect(displayItemName('Longsword', { bonus: 1, effectIds: [2] }))
      .toBe('Spada lunga, infuocata +1');
  });

  test('the model composes in English whatever the reader is reading', () => {
    setLanguage('it');
    /* Shop.resolveEntry composes the name it *stores* with this, and a stored
       name that changed with the language is the bug this all came from. */
    expect(formatItemName('Longsword', { bonus: 2 })).toBe('Longsword +2');
    expect(formatItemName('Longsword', { masterwork: true }))
      .toBe('Masterwork Longsword');
  });
});
