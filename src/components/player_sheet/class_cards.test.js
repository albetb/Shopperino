import { parseClassFeature, findFullFeatureText } from './class_cards';
import { loadFile } from '../../lib/loadFile';

describe('parsing a class feature entry', () => {
  test('splits the gain level, the name and the description', () => {
    expect(parseClassFeature('[4] Uncanny Dodge (Ex): retain Dex to AC when flat-footed.'))
      .toEqual({
        level: 4,
        name: 'Uncanny Dodge (Ex)',
        description: 'retain Dex to AC when flat-footed.',
      });
  });

  test('only the leading marker is the gain level', () => {
    // The later markers are scaling steps, not additional gain levels.
    const feature = parseClassFeature(
      '[3] Trap Sense (Ex): +1 Reflex vs traps; +1 every three levels ([6], [9], [12]).'
    );
    expect(feature.level).toBe(3);
    expect(feature.name).toBe('Trap Sense (Ex)');
    expect(feature.description).toContain('[6]');
  });

  test('an entry with no marker is not level-gated', () => {
    const feature = parseClassFeature(
      'Ex-Monks: A nonlawful monk cannot gain new levels as a monk.'
    );
    expect(feature.level).toBe(null);
    expect(feature.name).toBe('Ex-Monks');
  });

  test('an entry with no colon becomes a name with no description', () => {
    expect(parseClassFeature('[2] Evasion')).toEqual({
      level: 2, name: 'Evasion', description: '',
    });
  });

  test('two-digit levels parse correctly', () => {
    expect(parseClassFeature('[10] Special Abilities: choose one.').level).toBe(10);
    expect(parseClassFeature('[20] Perfect Self: type changes.').level).toBe(20);
  });

  test('empty and malformed input yields null', () => {
    expect(parseClassFeature('')).toBe(null);
    expect(parseClassFeature('   ')).toBe(null);
    expect(parseClassFeature(null)).toBe(null);
    expect(parseClassFeature(undefined)).toBe(null);
  });

  test('every shipped short feature parses to a usable entry', () => {
    const classes = loadFile('classes') ?? {};
    let checked = 0;
    Object.values(classes).forEach((data) => {
      (data.shortClassFeatures ?? []).forEach((text) => {
        const feature = parseClassFeature(text);
        expect(feature).not.toBe(null);
        expect(feature.name.length).toBeGreaterThan(0);
        // A level, when present, must be a real character level.
        if (feature.level !== null) {
          expect(feature.level).toBeGreaterThanOrEqual(1);
          expect(feature.level).toBeLessThanOrEqual(20);
        }
        checked += 1;
      });
    });
    expect(checked).toBeGreaterThan(100);
  });
});

describe('reaching the full description from a pill', () => {
  const longFeatures = [
    'Sneak Attack: If a rogue can catch an opponent when she is unable to defend '
      + 'herself effectively, she can strike a vital spot for extra damage.',
    'Trapfinding: Rogues can use the Search skill to locate traps.',
  ];

  test('matches the long entry by its label', () => {
    const feature = parseClassFeature('[1] Sneak Attack: extra damage when flanking.');
    expect(findFullFeatureText(feature, longFeatures))
      .toContain('catch an opponent when she is unable to defend');
  });

  test('matching ignores case', () => {
    const feature = parseClassFeature('[1] TRAPFINDING: short form.');
    expect(findFullFeatureText(feature, longFeatures))
      .toBe('Rogues can use the Search skill to locate traps.');
  });

  test('falls back to the short description when there is no long counterpart', () => {
    const feature = parseClassFeature('[2] Evasion (Ex): no damage on a successful save.');
    expect(findFullFeatureText(feature, longFeatures))
      .toBe('no damage on a successful save.');
  });

  test('handles a missing or empty long list', () => {
    const feature = parseClassFeature('[2] Evasion (Ex): no damage.');
    expect(findFullFeatureText(feature, [])).toBe('no damage.');
    expect(findFullFeatureText(feature, undefined)).toBe('no damage.');
    expect(findFullFeatureText(null, longFeatures)).toBe('');
  });
});
