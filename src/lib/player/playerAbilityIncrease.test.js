import Player from './player';

/* +1 to one ability score at character levels 4, 8, 12, 16 and 20
   (experience-and-leveling.md). The sheet never applies it — it only says one
   is owed, because whether a score already went up is not answerable: base
   scores move for many reasons. So the acknowledgement is stored, not derived. */

function at(level, acked) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = level;
  if (acked != null) p.abilityIncreaseAcked = acked;
  return p;
}

describe('which increases have been earned', () => {
  test('none below 4th', () => {
    [1, 2, 3].forEach((lvl) => {
      expect(at(lvl).getAbilityIncreaseLevel()).toBe(0);
      expect(at(lvl).getAbilityIncreasesOwed()).toBe(0);
    });
  });

  test('one at 4th, and it stays one until 8th', () => {
    [4, 5, 6, 7].forEach((lvl) => expect(at(lvl).getAbilityIncreasesOwed()).toBe(1));
  });

  test('they accumulate — a character entered at 12th owes three', () => {
    expect(at(8).getAbilityIncreasesOwed()).toBe(2);
    expect(at(12).getAbilityIncreasesOwed()).toBe(3);
    expect(at(20).getAbilityIncreasesOwed()).toBe(5);
  });
});

describe('acknowledging them', () => {
  test('acknowledging clears the count', () => {
    const p = at(8);
    expect(p.getAbilityIncreasesOwed()).toBe(2);
    p.acknowledgeAbilityIncreases();
    expect(p.getAbilityIncreasesOwed()).toBe(0);
  });

  test('the next multiple of four owes one again', () => {
    const p = at(8);
    p.acknowledgeAbilityIncreases();
    p.level = 11;
    expect(p.getAbilityIncreasesOwed()).toBe(0);
    p.level = 12;
    expect(p.getAbilityIncreasesOwed()).toBe(1);
  });

  test('an acknowledgement ahead of the level does not go negative', () => {
    // Levelling down after acknowledging — the count floors at zero rather
    // than reporting a debt the character cannot owe.
    expect(at(4, 20).getAbilityIncreasesOwed()).toBe(0);
  });
});

describe('it survives a save', () => {
  test('the acknowledged level round-trips', () => {
    const p = at(12);
    p.acknowledgeAbilityIncreases();
    expect(p.serialize().abilityIncreaseAcked).toBe(12);

    const loaded = new Player().load(p.serialize());
    expect(loaded.getAbilityIncreasesOwed()).toBe(0);
  });

  test('a character saved before this existed simply owes what it has earned', () => {
    // No migration is written for this: the field is additive and defaults to
    // 0, so an old 8th-level character is reminded once and then quiet.
    const old = at(8).serialize();
    delete old.abilityIncreaseAcked;
    const loaded = new Player().load(old);
    expect(loaded.getAbilityIncreasesOwed()).toBe(2);
  });
});
