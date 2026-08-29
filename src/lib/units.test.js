import {
  formatDistance,
  formatWeight,
  convertUnitsInText,
  convertUnitsInHtml,
  normalizeUnits,
  DEFAULT_UNITS,
} from './units';

/* Units.
 *
 * The factors are the game's table convention, not arithmetic, so the numbers
 * below are checked against the rule notes rather than against a calculator.
 * Every one of them is a value the notes actually print — if a test here
 * disagrees with obsidian-vault/dnd-rules/movement.md, the note is right.
 */

describe('the factors are the manual\'s, not the calculator\'s', () => {
  test('5 ft is 1.5 m exactly, not 1.524', () => {
    // movement.md prints "9 m (6 sq)" for a 30-ft speed throughout.
    expect(formatDistance(5, 'metric')).toBe('1.5 m');
    expect(formatDistance(30, 'metric')).toBe('9 m');
    expect(formatDistance(20, 'metric')).toBe('6 m');
  });

  test('a pound is half a kilo, not 0.4536', () => {
    // items.json already holds the halved values: bedroll 5 lb → 2.5 kg.
    expect(convertUnitsInText('5 lb.', 'metric')).toBe('2.5 kg');
    expect(formatWeight(2.5, 'imperial')).toBe('5 lb');
  });

  test('a mile is 1.5 km, which does not follow from the foot factor', () => {
    /* 5,280 ft × 0.3 would be 1,584 m. movement.md prints "≈ 4.5 km/h for 9 m
       speed" where the SRD says 3 mph, so the mile is its own lookup. */
    expect(convertUnitsInText('1 mile', 'metric')).toBe('1.5 km');
    expect(convertUnitsInText('10 miles', 'metric')).toBe('15 km');
  });

  test('an inch is 2.5 cm, and that one does fall out of the foot factor', () => {
    // 0.3 / 12 = 0.025 exactly. objects.md prints hardness "per 2.5 cm".
    expect(convertUnitsInText('1 inch', 'metric')).toBe('2.5 cm');
    expect(convertUnitsInText('6 inches', 'metric')).toBe('15 cm');
  });
});

describe('metric drops to centimetres under a metre', () => {
  test('the small creature spaces come out as the notes print them', () => {
    // movement.md: Fine 15 cm, Diminutive 30 cm, Tiny 75 cm.
    expect(formatDistance(0.5, 'metric')).toBe('15 cm');
    expect(formatDistance(1, 'metric')).toBe('30 cm');
    expect(formatDistance(2.5, 'metric')).toBe('75 cm');
  });

  test('and imperial says inches rather than a fraction of a foot', () => {
    expect(formatDistance(0.5, 'imperial')).toBe('6 inches');
    expect(formatDistance(1 / 12, 'imperial')).toBe('1 inch');
  });
});

describe('squares', () => {
  test('count in fives, because that is what a square is', () => {
    expect(formatDistance(30, 'squares')).toBe('6 sq');
    expect(formatDistance(5, 'squares')).toBe('1 sq');
  });

  test('weight stays metric — a square is not a unit of mass', () => {
    expect(formatWeight(2.5, 'squares')).toBe('2.5 kg');
    expect(convertUnitsInText('5 lb.', 'squares')).toBe('2.5 kg');
  });

  test('and a mile stays a long unit rather than becoming 1,760 squares', () => {
    expect(convertUnitsInText('1 mile', 'squares')).toBe('1.5 km');
  });
});

describe('the prose converter', () => {
  test('handles the four shapes that are most of the data', () => {
    // Measured across src/data: ft. 3593, feet 1183, lb. 390, pounds 360.
    expect(convertUnitsInText('within 60 ft.', 'metric')).toBe('within 18 m');
    expect(convertUnitsInText('within 30 feet', 'metric')).toBe('within 9 m');
    expect(convertUnitsInText('weighs 4 lb.', 'metric')).toBe('weighs 2 kg');
    expect(convertUnitsInText('weighs 100 pounds', 'metric')).toBe('weighs 50 kg');
  });

  test('keeps a hyphenated measurement hyphenated', () => {
    expect(convertUnitsInText('a 20-foot cone', 'metric')).toBe('a 6-m cone');
    expect(convertUnitsInText('a 30-ft. radius', 'squares')).toBe('a 6-sq radius');
  });

  test('survives the per-level range, structure intact', () => {
    /* 116 spells carry this shape and both numbers have to move without the
       parenthesised structure coming apart. */
    expect(convertUnitsInText('Long (400 ft. + 40 ft./level)', 'metric'))
      .toBe('Long (120 m + 12 m/level)');
  });

  test('reads a comma as a thousands separator, never as a decimal point', () => {
    /* "6,500 pounds" is a giant's carrying capacity. Reading it as 6.5 would
       have turned three and a quarter tonnes into three kilograms. */
    expect(convertUnitsInText('6,500 pounds', 'metric')).toBe('3,250 kg');
    expect(convertUnitsInText('1,000 ft.', 'metric')).toBe('300 m');
  });

  test('handles a fraction', () => {
    expect(convertUnitsInText('1/2 lb.', 'metric')).toBe('0.25 kg');
  });
});

describe('what it deliberately leaves alone', () => {
  test('a foot with no number in front of it', () => {
    /* The leading-number rule is what excludes these, by construction rather
       than by a list of exceptions. */
    const text = 'travelling on foot, at the foot of the stairs, back on his feet';
    expect(convertUnitsInText(text, 'metric')).toBe(text);
  });

  test('area and volume, which convert on a different factor entirely', () => {
    // 36 of these across the data. A square foot is not 0.3 square metres.
    expect(convertUnitsInText('10 cubic feet', 'metric')).toBe('10 cubic feet');
    expect(convertUnitsInText('5 square feet', 'metric')).toBe('5 square feet');
  });

  test('a word that merely starts with a unit', () => {
    expect(convertUnitsInText('takes 5 minutes and 1 move action', 'metric'))
      .toBe('takes 5 minutes and 1 move action');
    expect(convertUnitsInText('lasts 2 rounds', 'metric')).toBe('lasts 2 rounds');
  });

  test('text already in the target system, down to its punctuation', () => {
    /* "30 ft." must not come back as "30 ft" for an imperial reader — which is
       also what makes running the converter twice a no-op. */
    expect(convertUnitsInText('within 30 ft.', 'imperial')).toBe('within 30 ft.');
    expect(convertUnitsInText('6,500 pounds', 'imperial')).toBe('6,500 pounds');
    expect(convertUnitsInText('9 m', 'metric')).toBe('9 m');
  });

  test('the inside of an HTML tag', () => {
    /* The descriptions are HTML. An attribute that happened to look like a
       measurement would otherwise be rewritten into a broken link. */
    const html = '<a href="spells#cone-of-cold" title="30 ft.">a 30 ft. cone</a>';
    expect(convertUnitsInHtml(html, 'metric'))
      .toBe('<a href="spells#cone-of-cold" title="30 ft.">a 9 m cone</a>');
  });
});

describe('it goes both ways', () => {
  test('metric source to imperial, for the armor speeds items.json stores', () => {
    expect(convertUnitsInText('6m', 'imperial')).toBe('20 ft');
    expect(convertUnitsInText('2.5 kg', 'imperial')).toBe('5 lb');
  });

  test('running it twice changes nothing the second time', () => {
    const once = convertUnitsInHtml('a 30 ft. cone, 5 lb.', 'metric');
    expect(once).toBe('a 9 m cone, 2.5 kg');
    expect(convertUnitsInHtml(once, 'metric')).toBe(once);
  });
});

describe('the mode itself', () => {
  test('metric is the default, because the data and the notes are metric', () => {
    expect(DEFAULT_UNITS).toBe('metric');
    expect(normalizeUnits(undefined)).toBe('metric');
    expect(normalizeUnits('nonsense')).toBe('metric');
  });

  test('the three real modes survive normalizing', () => {
    expect(normalizeUnits('imperial')).toBe('imperial');
    expect(normalizeUnits('squares')).toBe('squares');
    expect(normalizeUnits('metric')).toBe('metric');
  });
});

describe('the edges', () => {
  test('a non-string passes straight through', () => {
    expect(convertUnitsInText(null, 'metric')).toBe(null);
    expect(convertUnitsInText(42, 'metric')).toBe(42);
    expect(convertUnitsInHtml(undefined, 'metric')).toBe(undefined);
  });

  test('zero is zero in every mode', () => {
    expect(formatDistance(0, 'metric')).toBe('0 m');
    expect(formatDistance(0, 'imperial')).toBe('0 ft');
    expect(formatDistance(0, 'squares')).toBe('0 sq');
  });
});
