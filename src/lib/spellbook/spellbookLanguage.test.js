import Spellbook from './spellbook';
import { setLanguage } from '../i18n';

/**
 * The spellbook reads the prose in the language the app is in.
 *
 * It did not: `spellbook.js` held `const ALL_SPELLS = loadFile('spells')` at
 * module scope, and that snapshot is taken when the module is first imported —
 * before a language has been chosen and before the prose chunk has landed. So
 * every spell the spellbook handed out carried the English short description
 * for the life of the tab, while the same spell opened in the info sidebar
 * (which looks up at call time) read Italian.
 */

function wizard() {
  const s = new Spellbook('Tester');
  s.setClass('Wizard');
  s.setLevel(5);
  s.setCharacteristic(16);
  return s;
}

describe('the spell list the spellbook hands out', () => {
  afterEach(() => setLanguage('en'));

  test('carries the reading language, not the one at import time', () => {
    setLanguage('it');
    const magicMissile = wizard().getAllSpells({ name: 'Magic Missile' })
      .find((sp) => sp.Name === 'Magic Missile');

    expect(magicMissile).toBeDefined();
    /* The name is identity and stays as src/data spells it — it is what
       `learnSpell` stores and `getSpellByLink` finds. Only the prose moves. */
    expect(magicMissile.Name).toBe('Magic Missile');
    expect(magicMissile['Short Description']).toMatch(/danni; \+1 dardo/);
    expect(magicMissile['Short Description']).not.toMatch(/damage|missile/i);
  });

  test('and goes back to English when the language does', () => {
    setLanguage('en');
    const magicMissile = wizard().getAllSpells({ name: 'Magic Missile' })
      .find((sp) => sp.Name === 'Magic Missile');
    expect(magicMissile['Short Description'])
      .toBe('1d4+1 damage; +1 missile per two levels above 1st (max 5).');
  });

  test('a domain description is translated too', () => {
    /* `Domains/*` was missing from the prose manifest, so the card printed
       English under an Italian dropdown. */
    const cleric = new Spellbook('Tester');
    cleric.setClass('Cleric');
    cleric.setLevel(5);
    cleric.setCharacteristic(16);
    cleric.Domain1 = 'Death';
    cleric.Domain2 = 'Magic';

    setLanguage('it');
    const it = cleric.getDomainDescription();
    expect(it).toMatch(/tocco della morte/i);
    expect(it).toMatch(/pergamene, bacchette/i);
    expect(it).not.toMatch(/death touch|wands/i);

    setLanguage('en');
    expect(cleric.getDomainDescription()).toMatch(/death touch/i);
  });
});
