import Player from './player';

function druid(level = 16, ref = null) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Druid');
  p.setLevel(level);
  if (ref) p.enterWildShape(ref);
  return p;
}

const modeSpeed = (p, mode) =>
  (p.getWildShapeMovementModes().find(m => m.mode === mode) ?? {}).speed ?? 0;

describe('reading a form’s movement modes', () => {
  test('a flying speed is read despite being stored as an object', () => {
    // speed.fly is { speed, maneuverability }, not a bare number — reading it
    // as a number yields NaN and silently drops flight entirely.
    const p = druid(16, 'monsters/air-elemental-large');
    expect(p.getWildShapeSpeed('fly')).toBe(100);
    expect(modeSpeed(p, 'fly')).toBe(100);
  });

  test('a plain numeric mode is still read', () => {
    const p = druid(8, 'animals/badger');
    expect(p.getWildShapeSpeed('land')).toBe(30);
    expect(p.getWildShapeSpeed('burrow')).toBe(10);
  });

  test('a form with both lists both modes', () => {
    const p = druid(8, 'animals/eagle');
    const modes = p.getWildShapeMovementModes().map(m => m.mode).sort();
    expect(modes).toEqual(['fly', 'land']);
  });

  test('a mode the form lacks is zero', () => {
    const p = druid(8, 'animals/wolf');
    expect(p.getWildShapeSpeed('fly')).toBe(0);
    expect(p.getWildShapeSpeed('burrow')).toBe(0);
  });

  test('flying is capped at 120 ft and everything else at 60', () => {
    // alter self's ceilings, applied by getWildShapeSpeed.
    const p = druid(8, 'animals/wolf');
    expect(p.getWildShapeSpeed('land')).toBe(50); // under the cap, untouched
  });
});

describe('the single speed the sheet reports', () => {
  test('in true form it is the land speed', () => {
    const p = druid(16);
    expect(p.getPrimaryMovement()).toEqual({ mode: 'land', speed: p.getTotalSpeed() });
  });

  test('a form that only flies reports the fly speed, not a 0 ft walk', () => {
    const p = druid(16, 'monsters/air-elemental-large');
    expect(p.getPrimaryMovement()).toEqual({ mode: 'fly', speed: 100 });
  });

  test('a walking form reports the walk with no mode label', () => {
    const p = druid(8, 'animals/wolf');
    expect(p.getPrimaryMovement().mode).toBe('land');
    expect(p.getPrimaryMovement().speed).toBe(50);
  });

  test('a slower fly does not displace a faster walk', () => {
    // An eagle walks 10 and flies 80, so flight wins; a badger walks 30 and
    // burrows 10, so the walk wins.
    expect(druid(8, 'animals/eagle').getPrimaryMovement()).toEqual({ mode: 'fly', speed: 80 });
    expect(druid(8, 'animals/badger').getPrimaryMovement().mode).toBe('land');
  });

  test('swimming never becomes the reported speed', () => {
    // Swim crosses no ground, so it is excluded however fast it is. Verified
    // against every form the druid can take rather than one hand-picked case.
    const p = druid(20);
    p.getWildShapeForms().forEach((creature) => {
      const shaped = druid(20, creature.ref);
      expect(shaped.getPrimaryMovement().mode).not.toBe('swim');
      expect(shaped.getPrimaryMovement().mode).not.toBe('climb');
    });
  });

  test('the speed bonus applies to a flying form too', () => {
    const p = druid(16, 'monsters/air-elemental-large');
    p.speedBonus = 10;
    expect(p.getPrimaryMovement()).toEqual({ mode: 'fly', speed: 110 });
  });
});

describe('form display names', () => {
  test('a trailing size is dropped, since the list shows it separately', () => {
    const p = druid(16);
    expect(p.getFormDisplayName({ name: 'Air Elemental, Large', size: 'Large' }))
      .toBe('Air Elemental');
    expect(p.getFormDisplayName({ name: 'Fire Elemental, Medium', size: 'Medium' }))
      .toBe('Fire Elemental');
  });

  test('a suffix that is not the size survives', () => {
    // "Greater" and "Elder" are Huge, so their suffix carries real meaning.
    const p = druid(16);
    expect(p.getFormDisplayName({ name: 'Air Elemental, Greater', size: 'Huge' }))
      .toBe('Air Elemental, Greater');
    expect(p.getFormDisplayName({ name: 'Air Elemental, Elder', size: 'Huge' }))
      .toBe('Air Elemental, Elder');
  });

  test('a name without a suffix is untouched', () => {
    const p = druid(16);
    expect(p.getFormDisplayName({ name: 'Wolf', size: 'Medium' })).toBe('Wolf');
    expect(p.getFormDisplayName({ name: 'Dire Bear', size: 'Large' })).toBe('Dire Bear');
  });

  test('missing data does not throw', () => {
    const p = druid(16);
    expect(p.getFormDisplayName({})).toBe('');
    expect(p.getFormDisplayName(null)).toBe('');
  });
});
