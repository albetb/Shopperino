import Player from './player';

function wounded(level, damage) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(level);
  p.damage = damage;
  return p;
}

describe("a night's rest", () => {
  test('restores one hit point per character level', () => {
    expect(wounded(5, 20).getRestHealAmount()).toBe(5);
    expect(wounded(1, 20).getRestHealAmount()).toBe(1);
    expect(wounded(20, 40).getRestHealAmount()).toBe(20);
  });

  test('never reports more than the damage actually taken', () => {
    // A 10th-level character down 3 hp regains 3, not 10 — the sheet would
    // otherwise claim healing that never happened.
    expect(wounded(10, 3).getRestHealAmount()).toBe(3);
    expect(wounded(10, 0).getRestHealAmount()).toBe(0);
  });

  test('the amount reported is the amount healed', () => {
    [[5, 20], [10, 3], [1, 0], [3, 3]].forEach(([level, damage]) => {
      const p = wounded(level, damage);
      const expected = p.getRestHealAmount();
      const before = p.damage;
      p.healAsIfRested();
      expect(before - p.damage).toBe(expected);
    });
  });

  test('resting at full health heals nothing and cannot go negative', () => {
    const p = wounded(8, 0);
    expect(p.getRestHealAmount()).toBe(0);
    p.healAsIfRested();
    expect(p.damage).toBe(0);
  });
});
