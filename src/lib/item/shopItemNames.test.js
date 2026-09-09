import { setLanguage } from '../i18n';
import { itemName, itemCardTitle } from './displayItemName';
import { itemDescription } from '../i18n/itemText';

/**
 * The three ways an item's name reaches the screen from the shop, and the two
 * sentences its card composes.
 */

describe('an item name that arrives already composed', () => {
  afterEach(() => setLanguage('en'));

  test('is taken apart rather than composed onto again', () => {
    /* A generated magic item is stored whole — effects and +N already in the
       Name — and the row used to compose the bonus onto it a second time,
       giving "Shield, heavy wooden, Arrow catching +1 +1" and asking the pack
       for a name it could never hold. */
    setLanguage('it');
    expect(itemCardTitle('Shield, heavy wooden, Arrow catching +1'))
      .toBe('Scudo pesante di legno, attirare frecce +1');
  });

  test('keeps the comma that belongs to the item itself', () => {
    setLanguage('it');
    expect(itemCardTitle('Shield, heavy wooden')).toBe('Scudo pesante di legno');
  });

  test('English is what src/data spells', () => {
    expect(itemCardTitle('Shield, heavy wooden, Arrow catching +1'))
      .toBe('Shield, heavy wooden, Arrow catching +1');
  });
});

describe('a scroll', () => {
  afterEach(() => setLanguage('en'));

  test('is named from the spell it holds, not from a list of its own', () => {
    /* 752 scrolls, one per spell per list. Only the spell is a word, so the
       name composes instead of being keyed 752 times. */
    setLanguage('it');
    expect(itemName('Scroll of Fireball')).toBe('Pergamena di Palla di fuoco');
    expect(itemName('Scroll of Acid splash')).toBe('Pergamena di Schizzo acido');
  });

  test('resolves whichever apostrophe the file happens to use', () => {
    /* scrolls.json writes Bear's, spells.json writes Bear’s. */
    setLanguage('it');
    expect(itemName("Scroll of Bear's endurance"))
      .toBe("Pergamena di Resistenza dell'orso");
  });

  test('English is unchanged', () => {
    expect(itemName('Scroll of Fireball')).toBe('Scroll of Fireball');
  });
});

describe("an item card's composed sentences", () => {
  afterEach(() => setLanguage('en'));

  test('the bonus note and the spell it contains are translated', () => {
    setLanguage('it');
    const html = itemDescription(
      '<p><i>+2 to attack rolls when used in combat.</i></p><p>A blade.</p>'
      + '<p>Contains the spell: <a href="spells#fireball">Fireball</a>.</p>');
    expect(html).toContain('+2 ai tiri per colpire quando è usata in combattimento.');
    expect(html).toContain('Palla di fuoco</a>');
    expect(html).toContain('Contiene l’incantesimo:');
    /* The link itself is identity and must survive untouched. */
    expect(html).toContain('href="spells#fireball"');
    expect(html).toContain('<p>A blade.</p>');
  });

  test('English passes through byte for byte', () => {
    const en = '<p><i>+1 to attack rolls when used in combat.</i></p>'
      + '<p>Contains the spell: <a href="spells#fireball">Fireball</a>.</p>';
    expect(itemDescription(en)).toBe(en);
  });
});
