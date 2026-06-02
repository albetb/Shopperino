import Player from './player';
import { generateStartingEquipment } from './startingEquipment';
import startingEquipment from '../../data/startingEquipment.json';
import { getItemByRef } from '../utils';

function make(cls, race = 'Human') {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  return p;
}

describe('starting-equipment data integrity', () => {
  test('every link in every class package resolves via getItemByRef', () => {
    const broken = [];
    for (const [cls, pkg] of Object.entries(startingEquipment)) {
      for (const item of pkg.items) {
        const ref = getItemByRef(item.link);
        if (!ref || !ref.raw) broken.push(`${cls} -> ${item.link}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('all 11 base classes are present with valid gold dice', () => {
    const expected = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
      'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'];
    expect(Object.keys(startingEquipment).sort()).toEqual(expected.sort());
    for (const pkg of Object.values(startingEquipment)) {
      expect(typeof pkg.gold.count).toBe('number');
      expect(typeof pkg.gold.sides).toBe('number');
    }
  });
});

describe('generateStartingEquipment placement', () => {
  test('Cleric: sword-and-board + ranged in Set 2', () => {
    const p = make('Cleric');
    expect(generateStartingEquipment(p)).toBe(true);
    const links = p.getInventory().map((i) => i.Link);
    expect(links).toEqual(expect.arrayContaining([
      'items/Weapon/mace-heavy', 'items/Weapon/light-crossbow', 'items/Armor/scale-mail',
      'items/Shield/shield-heavy-wooden', 'items/Ammo/crossbow-bolts',
      'items/Good/holy-symbol-wooden', 'items/Good/torch',
    ]));
    const eq = p.getEquipment();
    expect(eq.armor.link).toBe('items/Armor/scale-mail');
    expect(eq.rh1.link).toBe('items/Weapon/mace-heavy');
    expect(eq.rh1.twoHanded).toBe(false);
    expect(eq.lh1.link).toBe('items/Shield/shield-heavy-wooden');
    expect(eq.lh2.link).toBe('items/Weapon/light-crossbow');
    expect(eq.rh2.link).toBe('items/Weapon/light-crossbow');
    expect(eq.lh2.twoHanded).toBe(true);
    expect(eq.rh2.twoHanded).toBe(true);
  });

  test('Barbarian: two-handed melee in Set 1, ranged in Set 2, extra dagger unequipped', () => {
    const p = make('Barbarian');
    generateStartingEquipment(p);
    const eq = p.getEquipment();
    expect(eq.lh1.link).toBe('items/Weapon/greataxe');
    expect(eq.rh1.link).toBe('items/Weapon/greataxe');
    expect(eq.lh1.twoHanded).toBe(true);
    expect(eq.rh1.twoHanded).toBe(true);
    expect(eq.lh2.link).toBe('items/Weapon/shortbow');
    expect(eq.rh2.link).toBe('items/Weapon/shortbow');
    const equippedLinks = Object.values(eq).map((e) => e.link);
    expect(equippedLinks).not.toContain('items/Weapon/dagger');
    expect(p.getInventory().map((i) => i.Link)).toContain('items/Weapon/dagger');
  });

  test('Wizard: ranged-only caster has no armor equipped, melee in Set 1', () => {
    const p = make('Wizard', 'Elf');
    generateStartingEquipment(p);
    const eq = p.getEquipment();
    expect(eq.armor).toBeUndefined();
    expect(eq.lh1.link).toBe('items/Weapon/quarterstaff');
    expect(eq.rh1.link).toBe('items/Weapon/quarterstaff');
    expect(eq.lh2.link).toBe('items/Weapon/light-crossbow');
    // count > 1 items keep their quantity
    const candles = p.getInventory().find((i) => i.Link === 'items/Good/candle');
    expect(candles.Number).toBe(10);
  });
});

describe('gold and idempotency', () => {
  test('gold lands within the dice range for each class', () => {
    for (const [cls, pkg] of Object.entries(startingEquipment)) {
      const p = make(cls);
      generateStartingEquipment(p);
      const min = pkg.gold.count;
      const max = pkg.gold.count * pkg.gold.sides;
      expect(p.getGold()).toBeGreaterThanOrEqual(min);
      expect(p.getGold()).toBeLessThanOrEqual(max);
    }
  });

  test('second call (and class change) does not duplicate items or re-roll gold', () => {
    const p = make('Rogue');
    generateStartingEquipment(p);
    expect(p.startingEquipmentGenerated).toBe(true);
    const invLen = p.getInventory().length;
    const gold = p.getGold();
    expect(generateStartingEquipment(p)).toBe(false);
    p.setClass('Wizard');
    expect(generateStartingEquipment(p)).toBe(false);
    expect(p.getInventory().length).toBe(invLen);
    expect(p.getGold()).toBe(gold);
  });
});
