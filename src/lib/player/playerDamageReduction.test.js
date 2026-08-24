import Player from './player';

function make(cls, level, race = 'Human') {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

/** A druid high enough level to hold an elemental form, already shaped. */
function elementalDruid(level, ref) {
  const p = make('Druid', level);
  p.enterWildShape(ref);
  return p;
}

describe('damage reduction sources', () => {
  test('a barbarian below 7th has none', () => {
    expect(make('Barbarian', 6).getDamageReductions()).toEqual([]);
  });

  test('a barbarian reports their class DR as X/—', () => {
    expect(make('Barbarian', 7).getDamageReductions())
      .toEqual([{ amount: 1, bypass: '—', source: 'Barbarian' }]);
    expect(make('Barbarian', 20).getDamageReductions())
      .toEqual([{ amount: 5, bypass: '—', source: 'Barbarian' }]);
  });

  test('a class with no DR reports none', () => {
    expect(make('Fighter', 20).getDamageReductions()).toEqual([]);
    expect(make('Rogue', 20).getDamageReductions()).toEqual([]);
  });

  test('a Large elemental form carries DR 5/—', () => {
    const p = elementalDruid(16, 'monsters/air-elemental-large');
    expect(p.isElementalShaped()).toBe(true);
    expect(p.getDamageReductions()).toEqual([
      { amount: 5, bypass: '—', source: p.getWildShapeName() },
    ]);
  });

  test('a Small elemental form carries none', () => {
    const p = elementalDruid(16, 'monsters/air-elemental-small');
    expect(p.isElementalShaped()).toBe(true);
    expect(p.getDamageReductions()).toEqual([]);
  });

  test('leaving the form drops the form’s DR', () => {
    const p = elementalDruid(16, 'monsters/earth-elemental-large');
    expect(p.getDamageReductions()).toHaveLength(1);
    p.exitWildShape();
    expect(p.getDamageReductions()).toEqual([]);
  });

  test('an ordinary animal form grants no special qualities, so no DR', () => {
    // The polymorph rules withhold a form's special *qualities*; only an
    // elemental shape is the exception. See dnd-rules/magic.md.
    const p = make('Druid', 8);
    p.enterWildShape('animals/wolf');
    expect(p.isWildShaped()).toBe(true);
    expect(p.isElementalShaped()).toBe(false);
    expect(p.getDamageReductions()).toEqual([]);
  });
});
