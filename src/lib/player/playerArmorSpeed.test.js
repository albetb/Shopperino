import Player from './player';

function make(race, cls, level = 1) {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

const wearing = (p, slug) => { p.equipItem('armor', { link: `items/Armor/${slug}` }); return p; };

describe('armor speed reduction', () => {
  test('a 30 ft character is slowed to 20 by medium or heavy armor', () => {
    ['hide', 'scale-mail', 'chainmail', 'breastplate'].forEach((slug) => {
      const info = wearing(make('Human', 'Fighter'), slug).getArmorSpeedInfo();
      expect(info.hasReduction).toBe(true);
      expect(info.originalSpeed).toBe(30);
      expect(info.reducedSpeed).toBe(20);
    });

    ['splint-mail', 'banded-mail', 'half-plate', 'full-plate'].forEach((slug) => {
      expect(wearing(make('Human', 'Fighter'), slug).getArmorSpeedInfo().reducedSpeed).toBe(20);
    });
  });

  test('light armor never slows anyone down', () => {
    ['padded', 'leather', 'studded-leather', 'chain-shirt'].forEach((slug) => {
      const info = wearing(make('Human', 'Fighter'), slug).getArmorSpeedInfo();
      expect(info.hasReduction).toBe(false);
      expect(info.reducedSpeed).toBe(info.originalSpeed);
      expect(info.reducedSpeed).toBe(30);
    });
  });

  test('wearing no armor at all leaves the speed untouched', () => {
    const info = make('Human', 'Fighter').getArmorSpeedInfo();
    expect(info.hasReduction).toBe(false);
    expect(info.originalSpeed).toBe(30);
    expect(info.reducedSpeed).toBe(30);
  });

  test('a 20 ft race is slowed to 15, reading its own column', () => {
    // Gnomes and halflings move 20 ft, so heavy armor takes them to 15 —
    // not to the 20 a medium race would drop to.
    const info = wearing(make('Gnome', 'Fighter'), 'full-plate').getArmorSpeedInfo();
    expect(info.hasReduction).toBe(true);
    expect(info.originalSpeed).toBe(20);
    expect(info.reducedSpeed).toBe(15);
  });

  test('dwarves ignore armor speed reduction entirely', () => {
    const info = wearing(make('Dwarf', 'Fighter'), 'full-plate').getArmorSpeedInfo();
    expect(info.hasReduction).toBe(false);
    expect(info.reducedSpeed).toBe(20);
  });

  test('a class whose speed bonus the armor disqualifies keeps no remainder', () => {
    // getArmorSpeedInfo derives the class bonus by subtracting the race speed
    // from the base speed. Barbarian fast movement is already gated off by
    // medium armor, so that subtraction must yield nothing left to add back.
    const barbarian = wearing(make('Human', 'Barbarian', 6), 'breastplate');
    expect(barbarian.getBaseSpeed()).toBe(30);
    const info = barbarian.getArmorSpeedInfo();
    expect(info.originalSpeed).toBe(30);
    expect(info.reducedSpeed).toBe(20);

    // Unarmored the same barbarian is faster and takes no reduction at all.
    const free = make('Human', 'Barbarian', 6);
    expect(free.getBaseSpeed()).toBe(40);
    expect(free.getArmorSpeedInfo().hasReduction).toBe(false);
  });

  test('a manual speed bonus survives the reduction', () => {
    const p = wearing(make('Human', 'Fighter'), 'full-plate');
    p.speedBonus = 10;
    const info = p.getArmorSpeedInfo();
    expect(info.originalSpeed).toBe(40);
    expect(info.reducedSpeed).toBe(30);
  });
});
