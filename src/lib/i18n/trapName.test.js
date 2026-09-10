import { trapName } from './trapText';
import { setLanguage } from './index';

/**
 * A rolled trap is named in the reading language, the same as a book one.
 *
 * The generator composes its names in English and stores them there, which is
 * right — the name is the trap's identity and it is what the user edits. But
 * only the book's 105 samples were keyed in the pack, so every trap the dice
 * produced came out in English inside an Italian app.
 *
 * Sixteen of the generator's names are fixed phrases and are keyed whole,
 * because Italian rearranges them rather than translating them word by word: a
 * "Pit trap" is a "Fossa", not a "Trappola a fossa". Only the magic traps are
 * composed, since the spell inside one can be any of six hundred.
 */

afterEach(() => setLanguage('en'));

describe('in English', () => {
  test('the name is left exactly as the generator wrote it', () => {
    expect(trapName('Pit trap')).toBe('Pit trap');
    expect(trapName('Fireball trap')).toBe('Fireball trap');
    /* The book capitalises the word; nothing here may lowercase it. */
    expect(trapName('Wall Scythe Trap')).toBe('Wall Scythe Trap');
  });
});

describe('in Italian', () => {
  beforeEach(() => setLanguage('it'));

  test('a book sample reads as the book has it', () => {
    expect(trapName('Wall Scythe Trap')).toBe('Trappola a falce nel muro');
  });

  test('the mechanical shapes the generator rolls', () => {
    expect(trapName('Pit trap')).toBe('Fossa');
    expect(trapName('Crushing room trap')).toBe('Trappola a stanza che schiaccia');
    expect(trapName('Scythe blade trap')).toBe('Trappola a lama di falce');
    expect(trapName('Wall spikes trap')).toBe('Trappola a punte a muro');
  });

  test('and their poisoned forms, which the generator writes in lower case', () => {
    expect(trapName('Poisoned pit trap')).toBe('Fossa avvelenata');
    expect(trapName('Poisoned needle trap')).toBe('Trappola ad aghi avvelenati');
  });

  test('a spell trap is composed, because the spell can be any of them', () => {
    expect(trapName('Fireball trap')).toBe('Trappola con palla di fuoco');
  });

  test('a spell the pack does not know still reads as a trap', () => {
    /* The template translates even when the hole does not, so the sentence is
       Italian around an English name rather than English throughout. */
    expect(trapName('Zagyg’s spell trap')).toContain('Trappola con');
  });

  test('a name nobody knows is left alone rather than blanked', () => {
    expect(trapName('Something a master typed')).toBe('Something a master typed');
  });

  test('an empty name stays empty', () => {
    expect(trapName('')).toBe('');
    expect(trapName(null)).toBe('');
  });
});
