/**
 * The SRD summoning tables link every creature they list. These tests keep those
 * links resolving to real stat blocks, across all three creature files.
 */

import { getCreatureByLink } from './animalsUtils';
import { loadFile } from '../loadFile';

/** Every creature href used by a family of spells, e.g. "Summon Monster". */
function linksOf(spellPrefix) {
  const spells = loadFile('spells').filter((s) => s.Name.startsWith(spellPrefix));
  const hrefs = new Set();
  for (const spell of spells) {
    const matches = String(spell.Description || '').matchAll(/<a href="([^"]+)"/g);
    for (const m of matches) if (/^monsters[A-Za-z]*#/.test(m[1])) hrefs.add(m[1]);
  }
  return [...hrefs];
}

// Templates, not creatures: the SRD has no stat block for them, only the rules
// for applying them to the animal named alongside on the same row.
const TEMPLATES = ['monstersBtoC#celestial-creature', 'monstersEtoF#fiendish-creature'];

describe('creature links in the summoning tables', () => {
  test('every Summon Monster creature link resolves', () => {
    const unresolved = linksOf('Summon Monster')
      .filter((link) => !TEMPLATES.includes(link))
      .filter((link) => getCreatureByLink(link).length === 0);
    expect(unresolved).toEqual([]);
  });

  test('every Summon Nature’s Ally creature link resolves', () => {
    const unresolved = linksOf('Summon Nature’s Ally')
      .filter((link) => !TEMPLATES.includes(link))
      .filter((link) => getCreatureByLink(link).length === 0);
    expect(unresolved).toEqual([]);
  });

  test('the two templates have no stat block, so they open nothing', () => {
    for (const link of TEMPLATES) expect(getCreatureByLink(link)).toEqual([]);
  });
});

describe('getCreatureByLink', () => {
  test('resolves a monster link to a single block', () => {
    const cards = getCreatureByLink('monstersDtoDe#bone-devil');
    expect(cards).toHaveLength(1);
    expect(cards[0].Name).toBe('Bone Devil (Osyluth)');
    expect(cards[0]['Challenge Rating']).toBe('9');
  });

  test('resolves a vermin link to every size variant, smallest first', () => {
    const cards = getCreatureByLink('monstersVermin#monstrous-spider');
    expect(cards).toHaveLength(7);
    expect(cards[0].Name).toBe('Monstrous Spider, Tiny');
    expect(cards[6].Name).toBe('Monstrous Spider, Colossal');
  });

  test('a size-qualified elemental link returns only that size', () => {
    const cards = getCreatureByLink('monstersEtoF#elemental-small');
    expect(cards.map((c) => c.Name).sort()).toEqual([
      'Air Elemental, Small',
      'Earth Elemental, Small',
      'Fire Elemental, Small',
      'Water Elemental, Small',
    ]);
  });

  test('matches a compound-word name written as two words', () => {
    const cards = getCreatureByLink('monstersHtoI#hell-hound');
    expect(cards.map((c) => c.Name)).toContain('Hellhound');
  });

  test('animal links still resolve to animals.json blocks', () => {
    const cards = getCreatureByLink('monstersAnimal#black-bear');
    expect(cards).toHaveLength(1);
    expect(cards[0].Name).toBe('Bear, Black');
  });

  test('dragons expose an attack bonus and damage-by-size instead of an attack line', () => {
    const cards = getCreatureByLink('monsters/black-dragon-wyrmling');
    expect(cards).toHaveLength(1);
    expect(cards[0]['Attack Bonus']).toBe('+6');
    expect(cards[0]['Natural Attacks']).toBe('Bite 1d4, 2 claws 1d3');
    expect(cards[0].Age).toBe('Wyrmling (0-5 years)');
  });

  test('an unknown link returns no cards', () => {
    expect(getCreatureByLink('monstersA#not-a-creature')).toEqual([]);
  });
});
