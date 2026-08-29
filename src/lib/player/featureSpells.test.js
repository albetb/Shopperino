import { getFeatureSpell } from './featureSpells';
import { loadFile } from '../loadFile';

describe('features that cast a spell', () => {
  const spells = loadFile('spells');
  const linkOf = (name) => spells.find((s) => s.Name.toLowerCase() === name)?.Link;

  test('every mapped feature points at a spell that exists', () => {
    ['remove disease', 'detect evil', 'suggestion', 'mass suggestion', 'song of freedom',
      'abundant step', 'empty body'].forEach((feature) => {
      const spell = getFeatureSpell(feature);
      expect(spell).not.toBeNull();
      const slug = spell.link.replace(/^spells#/, '');
      expect(spells.some((s) => s.Link === slug)).toBe(true);
    });
  });

  test('a feature and its spell can carry different names', () => {
    // Song of freedom casts break enchantment; abundant step, dimension door.
    expect(getFeatureSpell('Song of freedom').link).toBe(`spells#${linkOf('break enchantment')}`);
    expect(getFeatureSpell('Abundant step').link).toBe(`spells#${linkOf('dimension door')}`);
    expect(getFeatureSpell('Empty body').link).toBe(`spells#${linkOf('etherealness')}`);
  });

  test('the "(Sp)" marker on a short feature line is not part of the name', () => {
    // classes.json labels these "Detect Evil (Sp)" / "Remove Disease (Sp)".
    expect(getFeatureSpell('Detect Evil (Sp)')).toEqual(getFeatureSpell('detect evil'));
    expect(getFeatureSpell('Remove Disease (Sp)')).not.toBeNull();
  });

  test('an ability that is not a spell maps to nothing', () => {
    ['Lay on hands', 'Turn undead', 'Rage', 'Wholeness of body', 'Inspire courage', '', null]
      .forEach((f) => expect(getFeatureSpell(f)).toBeNull());
  });

  test('the bardic performances the data lists still match their keys', () => {
    // The map is keyed on the name the sheet renders; if a performance is
    // renamed in classes.json its link silently disappears, so pin it here.
    const bard = (loadFile('classes').Bard?.progression?.performances ?? []).map((p) => p.name);
    expect(bard).toEqual(expect.arrayContaining(['Suggestion', 'Song of freedom', 'Mass suggestion']));
    bard.filter((n) => ['Suggestion', 'Song of freedom', 'Mass suggestion'].includes(n))
      .forEach((n) => expect(getFeatureSpell(n)).not.toBeNull());
  });

  test('the monk and paladin short-feature lines still match their keys', () => {
    const classes = loadFile('classes');
    const named = (cls, needle) => (classes[cls]?.shortClassFeatures ?? [])
      .find((f) => f.toLowerCase().includes(needle));
    // "[12] Abundant Step: ..." -> the name is what the pill shows.
    const nameOf = (line) => line.replace(/^\[\d+\]\s*/, '').split(':')[0].trim();
    expect(getFeatureSpell(nameOf(named('Monk', 'abundant step')))).not.toBeNull();
    expect(getFeatureSpell(nameOf(named('Monk', 'empty body')))).not.toBeNull();
    expect(getFeatureSpell(nameOf(named('Paladin', 'detect evil')))).not.toBeNull();
    expect(getFeatureSpell(nameOf(named('Paladin', 'remove disease')))).not.toBeNull();
    expect(getFeatureSpell(nameOf(named('Druid', 'a thousand faces')))).not.toBeNull();
  });
});
