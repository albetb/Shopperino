import Player from './player';

function barbarian(level) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Barbarian');
  p.setLevel(level);
  return p;
}

describe('barbarian rage uses per day', () => {
  test('one rage at 1st level, a further one every four levels', () => {
    expect(barbarian(1).getRageUsesMax()).toBe(1);
    expect(barbarian(4).getRageUsesMax()).toBe(2);
    expect(barbarian(7).getRageUsesMax()).toBe(2);
    expect(barbarian(11).getRageUsesMax()).toBe(3);
    expect(barbarian(20).getRageUsesMax()).toBe(6);
  });

  test('matches 1 + floor(level / 4) at every level', () => {
    for (let lvl = 1; lvl <= 20; lvl += 1) {
      expect(barbarian(lvl).getRageUsesMax()).toBe(1 + Math.floor(lvl / 4));
    }
  });

  test('non-barbarians never have rages', () => {
    const f = new Player();
    f.setClass('Fighter');
    f.setLevel(20);
    expect(f.getRageUsesMax()).toBe(0);
  });
});

describe('barbarian rage tier', () => {
  test('rage becomes greater rage at 11th and mighty rage at 20th', () => {
    expect(barbarian(1).getRageTier()).toBe('rage');
    expect(barbarian(4).getRageTier()).toBe('rage');
    expect(barbarian(7).getRageTier()).toBe('rage');
    expect(barbarian(11).getRageTier()).toBe('greater rage');
    expect(barbarian(20).getRageTier()).toBe('mighty rage');
  });

  test('each tier carries its own ability, Will and AC modifiers', () => {
    expect(barbarian(1).getRageTierBonuses()).toEqual({ str: 4, con: 4, will: 2, ac: -2 });
    expect(barbarian(11).getRageTierBonuses()).toEqual({ str: 6, con: 6, will: 3, ac: -2 });
    expect(barbarian(20).getRageTierBonuses()).toEqual({ str: 8, con: 8, will: 4, ac: -2 });
  });

  test('tireless rage arrives at 17th without changing the tier bonuses', () => {
    expect(barbarian(16).hasTirelessRage()).toBe(false);
    expect(barbarian(17).hasTirelessRage()).toBe(true);
    expect(barbarian(17).getRageTier()).toBe('greater rage');
  });

  test('non-barbarians have no tier and no bonuses', () => {
    const c = new Player();
    c.setClass('Cleric');
    c.setLevel(20);
    expect(c.getRageTier()).toBe(null);
    expect(c.getRageTierBonuses()).toEqual({ str: 0, con: 0, will: 0, ac: 0 });
    expect(c.hasTirelessRage()).toBe(false);
  });
});

describe('barbarian rage stance', () => {
  test('the raging flag is settable and gated on actually having rage', () => {
    const p = barbarian(5);
    expect(p.isRaging()).toBe(false);
    p.setRaging(true);
    expect(p.isRaging()).toBe(true);
    p.setRaging(false);
    expect(p.isRaging()).toBe(false);

    // A stale flag left behind by a class change grants nothing.
    p.setRaging(true);
    p.setClass('Wizard');
    expect(p.isRaging()).toBe(false);
  });

  test('the flag survives a serialize and load round trip', () => {
    const p = barbarian(5);
    p.setRaging(true);
    const restored = new Player();
    restored.load(JSON.parse(JSON.stringify(p.serialize())));
    expect(restored.isRaging()).toBe(true);

    p.setRaging(false);
    const calm = new Player();
    calm.load(JSON.parse(JSON.stringify(p.serialize())));
    expect(calm.isRaging()).toBe(false);
  });

  test('rage raises Strength and Constitution by the tier bonus', () => {
    const p = barbarian(5);
    p.setAbilityBase('str', 14);
    p.setAbilityBase('con', 14);
    expect(p.getAbilityTotal('str')).toBe(14);
    expect(p.getStrMod()).toBe(2);

    p.setRaging(true);
    expect(p.getAbilityTotal('str')).toBe(18);
    expect(p.getAbilityTotal('con')).toBe(18);
    expect(p.getStrMod()).toBe(4);
    expect(p.getConMod()).toBe(4);
  });

  test('rage grants a morale bonus on Will saves and costs 2 AC', () => {
    const p = barbarian(5);
    p.setAbilityBase('wis', 10);
    const calmWill = p.getTotalWillSave();
    const calmAc = p.getArmorClass();
    const calmTouch = p.getContactAC();
    const calmFlat = p.getFlatFootedAC();

    p.setRaging(true);
    expect(p.getTotalWillSave()).toBe(calmWill + 2);
    expect(p.getArmorClass()).toBe(calmAc - 2);
    expect(p.getContactAC()).toBe(calmTouch - 2);
    expect(p.getFlatFootedAC()).toBe(calmFlat - 2);
  });

  test('a greater rage barbarian gets the larger bonuses', () => {
    const p = barbarian(11);
    p.setAbilityBase('str', 14);
    p.setAbilityBase('wis', 10);
    const calmWill = p.getTotalWillSave();
    p.setRaging(true);
    expect(p.getAbilityTotal('str')).toBe(20);
    expect(p.getTotalWillSave()).toBe(calmWill + 3);
  });

  test('the Constitution boost is worth level x 2 hit points at the base tier', () => {
    const p = barbarian(5);
    p.setAbilityBase('con', 14);
    const calmHp = p.getMaxLife();

    p.setRaging(true);
    expect(p.getRageTempHp()).toBe(10);
    // The hit points come from the boosted Con inside getMaxLife, so the
    // reported figure and the actual gain must be the same number.
    expect(p.getMaxLife() - calmHp).toBe(10);
  });

  test('a non-barbarian is never affected', () => {
    const f = new Player();
    f.setRace('Human');
    f.setClass('Fighter');
    f.setLevel(11);
    f.setAbilityBase('str', 14);
    const ac = f.getArmorClass();
    f.setRaging(true);
    expect(f.isRaging()).toBe(false);
    expect(f.getAbilityTotal('str')).toBe(14);
    expect(f.getArmorClass()).toBe(ac);
    expect(f.getRageTempHp()).toBe(0);
    expect(f.getRageDuration()).toBe(0);
  });
});

describe('barbarian rage duration', () => {
  test('is 3 + the raged Constitution modifier, not the calm one', () => {
    const p = barbarian(5);
    p.setAbilityBase('con', 14); // +2 calm, +4 raging
    expect(p.getRageDuration()).toBe(7);
    p.setRaging(true);
    expect(p.getRageDuration()).toBe(7);
  });

  test('holds for greater rage and for a weak Constitution', () => {
    const greater = barbarian(11);
    greater.setAbilityBase('con', 14); // +6 while raging -> Con 20 -> +5
    expect(greater.getRageDuration()).toBe(8);

    const frail = barbarian(5);
    frail.setAbilityBase('con', 6); // +4 while raging -> Con 10 -> +0
    expect(frail.getRageDuration()).toBe(3);
  });
});

describe('starting and ending a rage', () => {
  test('starting a rage spends one of the day uses', () => {
    const p = barbarian(8);
    expect(p.getClassFeatureUsed('rage')).toBe(0);
    p.startRage();
    expect(p.isRaging()).toBe(true);
    expect(p.getClassFeatureUsed('rage')).toBe(1);
  });

  test('ending a rage clears the stance and leaves the barbarian fatigued', () => {
    const p = barbarian(8);
    p.setAbilityBase('str', 14);
    p.startRage();
    p.endRage();

    expect(p.isRaging()).toBe(false);
    expect(p.hasCondition('Fatigued')).toBe(true);
    // Fatigue is -2 Str / -2 Dex through the condition subsystem.
    expect(p.getAbilityTotal('str')).toBe(12);
  });

  test('tireless rage leaves no fatigue behind', () => {
    const p = barbarian(17);
    p.startRage();
    p.endRage();
    expect(p.isRaging()).toBe(false);
    expect(p.hasCondition('Fatigued')).toBe(false);
  });

  test('ending a rage that was never running adds no fatigue', () => {
    const p = barbarian(8);
    p.endRage();
    expect(p.hasCondition('Fatigued')).toBe(false);
  });

  test('a non-barbarian cannot start a rage', () => {
    const w = new Player();
    w.setClass('Wizard');
    w.setLevel(10);
    w.startRage();
    expect(w.isRaging()).toBe(false);
    expect(w.getClassFeatureUsed('rage')).toBe(0);
  });
});

describe('barbarian fast movement gating', () => {
  // Human land speed is 30 ft, so a qualifying barbarian moves at 40.
  const HUMAN_SPEED = 30;
  const FAST = HUMAN_SPEED + 10;

  function loaded(p, copies) {
    // Full plate weighs 22.5 kg; a Str 10 medium biped carries 16.5 kg light,
    // 33 medium, 50 heavy. Equipped items are not counted against the load,
    // so inventory is the only lever here.
    p.addInventoryItem('Full plate', 'Armor', copies, 'items/Armor/full-plate');
    return p;
  }

  test('an unarmored, unencumbered barbarian gets the full bonus', () => {
    const p = barbarian(5);
    expect(p.getLoadStatus()).toBe('none');
    expect(p.getBaseSpeed()).toBe(FAST);
  });

  test('light armor keeps the bonus', () => {
    const p = barbarian(5);
    p.equipItem('armor', { link: 'items/Armor/leather' });
    expect(p.getBaseSpeed()).toBe(FAST);
  });

  test('medium and heavy armor remove the bonus', () => {
    const medium = barbarian(5);
    medium.equipItem('armor', { link: 'items/Armor/breastplate' });
    expect(medium.getBaseSpeed()).toBe(HUMAN_SPEED);

    const heavy = barbarian(5);
    heavy.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(heavy.getBaseSpeed()).toBe(HUMAN_SPEED);
  });

  test('a medium or heavier load removes the bonus even unarmored', () => {
    const mediumLoad = loaded(barbarian(5), 1);
    expect(mediumLoad.getLoadStatus()).toBe('medium');
    expect(mediumLoad.getBaseSpeed()).toBe(HUMAN_SPEED);

    const heavyLoad = loaded(barbarian(5), 2);
    expect(heavyLoad.getLoadStatus()).toBe('heavy');
    expect(heavyLoad.getBaseSpeed()).toBe(HUMAN_SPEED);
  });

  test('a light load still qualifies', () => {
    const p = barbarian(5);
    p.addInventoryItem('Leather', 'Armor', 1, 'items/Armor/leather'); // 7 kg
    expect(p.getLoadStatus()).toBe('light');
    expect(p.getBaseSpeed()).toBe(FAST);
  });

  test('non-barbarians are unaffected by the gate', () => {
    const f = new Player();
    f.setRace('Human');
    f.setClass('Fighter');
    f.setLevel(5);
    f.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(f.getBaseSpeed()).toBe(HUMAN_SPEED);
    expect(f.getFastMovementBonus()).toBe(0);
  });

  test('getArmorSpeedInfo stays consistent with the gated base speed', () => {
    // originalSpeed is derived from getTotalSpeed and the class bonus by
    // subtraction, so gating base speed must not desynchronise the two.
    const unarmored = barbarian(5);
    expect(unarmored.getArmorSpeedInfo().originalSpeed).toBe(unarmored.getTotalSpeed());

    const armored = barbarian(5);
    armored.equipItem('armor', { link: 'items/Armor/full-plate' });
    const info = armored.getArmorSpeedInfo();
    expect(info.originalSpeed).toBe(armored.getTotalSpeed());
    expect(info.reducedSpeed).toBeLessThanOrEqual(info.originalSpeed);
  });
});

describe('barbarian damage reduction', () => {
  test('starts at 7th level and gains a point every three levels', () => {
    expect(barbarian(1).getDamageReduction()).toBe(0);
    expect(barbarian(4).getDamageReduction()).toBe(0);
    expect(barbarian(7).getDamageReduction()).toBe(1);
    expect(barbarian(11).getDamageReduction()).toBe(2);
    expect(barbarian(20).getDamageReduction()).toBe(5);
  });

  test('holds steady between breakpoints', () => {
    expect(barbarian(9).getDamageReduction()).toBe(1);
    expect(barbarian(10).getDamageReduction()).toBe(2);
    expect(barbarian(18).getDamageReduction()).toBe(4);
    expect(barbarian(19).getDamageReduction()).toBe(5);
  });

  test('non-barbarians have no damage reduction', () => {
    const r = new Player();
    r.setClass('Rogue');
    r.setLevel(20);
    expect(r.getDamageReduction()).toBe(0);
  });
});
