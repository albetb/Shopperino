import { getCreatureByLink } from './animalsUtils';
import { loadFile } from '../loadFile';
import { setLanguage } from '../i18n';

/* The bestiary is the largest pack and the one furthest from its data: the
   creature files arrive as their own lazy chunk, the pack as another, and the
   card is assembled in a reducer from whatever `loadFile` answers with at that
   moment. Three things therefore have to be true at once, and each of them has
   failed silently before — so each is asserted here rather than assumed. */

afterEach(() => setLanguage('en'));

describe('a creature stat block in Italian', () => {
  test('the pack is wired to the file, not just present on disk', () => {
    setLanguage('it');
    const monsters = loadFile('monsters').monsters;
    const aboleth = monsters.find((m) => m.ref === 'monsters/aboleth');
    expect(aboleth.description).toMatch(/anfibio/i);
    expect(aboleth.combat).toMatch(/tentacoli/i);
  });

  test('the English data underneath is untouched', () => {
    setLanguage('en');
    const aboleth = loadFile('monsters').monsters
      .find((m) => m.ref === 'monsters/aboleth');
    expect(aboleth.description).toMatch(/fishlike amphibian/i);
  });

  test('the info card carries the translated prose', () => {
    setLanguage('it');
    const [card] = getCreatureByLink('monsters/aboleth');
    expect(card.Description).toMatch(/anfibio/i);
  });
});
