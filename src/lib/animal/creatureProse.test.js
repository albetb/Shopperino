import { getCreatureByLink } from './animalsUtils';
import { loadFile } from '../loadFile';
import { setLanguage } from '../i18n';
import { parseAttacks } from './attackParser';

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

describe('the attack line the parser reads', () => {
  /* The one that must never be translated. `attackParser` reads `attack` and
     `fullAttack` back to recompute an animal companion's, a familiar's, a
     special mount's and a wild-shape form's attacks from their own BAB,
     Strength and size — so a translated string in the data breaks every one of
     them, silently and only for Italian readers. The display is translated
     instead; see lib/i18n/creatureText.js. */

  test('stays English in the data whatever the reader is reading', () => {
    setLanguage('it');
    const aboleth = loadFile('monsters').monsters
      .find((m) => m.ref === 'monsters/aboleth');
    expect(aboleth.attack).toBe('Tentacle +12 melee (1d6+8 plus slime)');
    expect(aboleth.fullAttack).toBe('4 tentacles +12 melee (1d6+8 plus slime)');
  });

  test('and the parser still breaks it down', () => {
    setLanguage('it');
    const aboleth = loadFile('monsters').monsters
      .find((m) => m.ref === 'monsters/aboleth');
    const [line] = parseAttacks(aboleth.fullAttack);
    expect(line).toMatchObject({ name: 'tentacles', count: 4, bonus: 12 });
  });
});
