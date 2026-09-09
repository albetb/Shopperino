import { setLanguage } from './index';
import { featDescription, skillDescription } from './entryText';
import { featName } from './creatureText';
import { getFeatByLink, getSkillByLink } from '../utils';

/**
 * A feat card and a skill card are composed out of their record at the moment
 * of the click, so the sentence around the prose is English however well the
 * prose itself is translated.
 */

afterEach(() => setLanguage('en'));

describe('a feat card', () => {
  test('names its tags and its Prerequisites heading', () => {
    setLanguage('it');
    const html = featDescription(
      '<p><i>General, Metamagic</i></p>'
      + '<p><b>Prerequisites:</b> Des 13.</p><p>Il resto.</p>');
    expect(html).toContain('<p><i>Generale, Metamagico</i></p>');
    expect(html).toContain('<b>Prerequisiti:</b>');
    expect(html).toContain('<p>Il resto.</p>');
  });

  test('is built that way by the lookup the sidebar calls', () => {
    setLanguage('it');
    const [card] = getFeatByLink('combat-reflexes');
    expect(featDescription(card.Description)).toContain('Generale');
  });

  test('English passes through byte for byte', () => {
    const en = '<p><i>General</i></p><p><b>Prerequisites:</b> Dex 13.</p>';
    expect(featDescription(en)).toBe(en);
  });
});

describe('a skill card', () => {
  test('names the ability the check is rolled against', () => {
    setLanguage('it');
    const [card] = getSkillByLink('tumble');
    expect(skillDescription(card.Description)).toContain('<i>Destrezza</i>');
  });

  test('English passes through byte for byte', () => {
    const en = '<p><i>Dexterity</i></p><p>Some prose.</p>';
    expect(skillDescription(en)).toBe(en);
  });
});

describe('a feat taken for a subject', () => {
  test('translates the subject as well as the feat', () => {
    setLanguage('it');
    expect(featName('Weapon focus (Longsword)'))
      .toBe('Arma Focalizzata (Spada lunga)');
    expect(featName('Skill focus (Tumble)'))
      .toBe('Abilità Focalizzata (Acrobazia)');
  });

  test('a parenthetical that belongs to the feat itself is not split', () => {
    /* Armor proficiency (light) is the feat's whole name, not a subject it
       was taken in — splitting it asks the pack for "Armor proficiency". */
    setLanguage('it');
    expect(featName('Armor proficiency (light)'))
      .toBe('Competenza nelle Armature (leggere)');
  });

  test('English is what the data spells', () => {
    expect(featName('Weapon focus (Longsword)')).toBe('Weapon focus (Longsword)');
    expect(featName('Armor proficiency (light)')).toBe('Armor proficiency (light)');
  });
});
