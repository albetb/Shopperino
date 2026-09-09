import displayItemName, { itemName, itemCardTitle } from './displayItemName';
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

describe('a name that arrives already composed', () => {
  /* An info card is a snapshot of an item, so the three parts are gone by the
     time it renders: getItemByLink has welded them into one string. */

  test('the bonus comes off the end and goes back on', () => {
    setLanguage('it');
    expect(itemCardTitle('Longsword +2')).toBe('Spada lunga +2');
  });

  test("a comma in the item's own name is not a seam", () => {
    setLanguage('it');
    expect(itemCardTitle('Mace, light')).toBe('Mazza leggera');
    expect(itemCardTitle('Shield, heavy steel')).toBe('Scudo pesante di metallo');
  });

  test('a property joined with a comma is one, and is named too', () => {
    setLanguage('it');
    expect(itemCardTitle('Longsword, Flaming +1')).toBe('Spada lunga, infuocata +1');
    /* Both at once: the item's comma and the property's. */
    expect(itemCardTitle('Mace, light, Flaming')).toBe('Mazza leggera, infuocata');
  });

  test('masterwork agrees with the noun rather than prefixing it', () => {
    setLanguage('it');
    expect(itemCardTitle('Longsword, perfect')).toBe('Spada lunga di fattura perfetta');
  });

  test('a name the pack does not have comes back exactly as it went in', () => {
    setLanguage('it');
    expect(itemCardTitle('Sword of the planes +3')).toBe('Sword of the planes +3');
  });

  test('English changes nothing', () => {
    expect(itemCardTitle('Longsword, Flaming +1')).toBe('Longsword, Flaming +1');
  });
});
