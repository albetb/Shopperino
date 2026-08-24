import MonsterSheet, { BONUS_KEYS } from './monsterSheet';
import { filtersToTuple, filtersFromTuple, getDefaultFilters } from './monsterFilters';
import { listBestiary, ALL_SOURCES_MASK } from './monsterBook';

const anyRef = () => listBestiary(ALL_SOURCES_MASK)[0].ref;

describe('loading a sheet', () => {
  test('a real ref resolves to its stat block', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    expect(sheet.isValid()).toBe(true);
    expect(sheet.getName()).toBe('Aboleth');
    expect(sheet.getSizeAndType()).toContain('Aberration');
  });

  test('an unknown ref is not valid and reports nothing', () => {
    const sheet = new MonsterSheet('monsters/not-a-creature');
    expect(sheet.isValid()).toBe(false);
    expect(sheet.getName()).toBe('');
    expect(sheet.getAttacks()).toEqual([]);
  });

  test('every creature in the bestiary produces a usable sheet', () => {
    // A sheet that throws on some creature would be found only in play.
    listBestiary(ALL_SOURCES_MASK).forEach((creature) => {
      const sheet = new MonsterSheet(creature.ref);
      expect(sheet.isValid()).toBe(true);
      expect(sheet.getMaxLife()).toBeGreaterThan(0);
      expect(Number.isFinite(sheet.getArmorClass())).toBe(true);
      expect(Number.isFinite(sheet.getInitiative())).toBe(true);
      expect(Array.isArray(sheet.getAttacks())).toBe(true);
    });
  });
});

describe('hit points', () => {
  test('start full, at the hit points printed in the block', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    expect(sheet.getCurrentHp()).toBe(sheet.getMaxLife());
    expect(sheet.getMaxLife()).toBe(sheet.getDefaultMaxLife());
  });

  test('damage lowers current hp without touching the maximum', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    const max = sheet.getMaxLife();
    sheet.adjustHp(-10);
    expect(sheet.getCurrentHp()).toBe(max - 10);
    expect(sheet.getMaxLife()).toBe(max);
  });

  test('healing never goes past full', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.adjustHp(-5);
    sheet.adjustHp(50);
    expect(sheet.getCurrentHp()).toBe(sheet.getMaxLife());
  });

  test('damage stops at −10, where a creature is dead', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.adjustHp(-9999);
    expect(sheet.getCurrentHp()).toBe(-10);
  });

  test('reset returns it to full', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.adjustHp(-20);
    sheet.resetHp();
    expect(sheet.getCurrentHp()).toBe(sheet.getMaxLife());
  });

  test('an overridden maximum is used, and can be cleared', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    const printed = sheet.getDefaultMaxLife();
    sheet.setMaxLife(200);
    expect(sheet.getMaxLife()).toBe(200);
    sheet.setMaxLife(null);
    expect(sheet.getMaxLife()).toBe(printed);
  });

  test('changing the maximum does not silently heal or hurt', () => {
    // Damage is tracked, not current HP — so 20 damage stays 20 damage.
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.adjustHp(-20);
    sheet.setMaxLife(200);
    expect(sheet.getCurrentHp()).toBe(180);
  });
});

describe('bonuses', () => {
  test('a stat with no bonus reads the stat block', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    expect(sheet.getArmorClass()).toBe(16);
    expect(sheet.getTouchAc()).toBe(9);
    expect(sheet.getFlatFootedAc()).toBe(15);
    expect(sheet.getFortitudeSave()).toBe(7);
    expect(sheet.getWillSave()).toBe(11);
  });

  test('one AC bonus moves all three armour classes together', () => {
    // "+2 AC" means harder to hit, however you attack it.
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.setBonus('ac', 2);
    expect(sheet.getArmorClass()).toBe(18);
    expect(sheet.getTouchAc()).toBe(11);
    expect(sheet.getFlatFootedAc()).toBe(17);
  });

  test('each save takes its own bonus', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.setBonus('fort', 3);
    expect(sheet.getFortitudeSave()).toBe(10);
    expect(sheet.getWillSave()).toBe(11); // untouched
  });

  test('a malus works as well as a bonus', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.setBonus('initiative', -4);
    expect(sheet.getInitiative()).toBe(1 - 4);
  });

  test('an unknown stat is ignored rather than stored', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.setBonus('luck', 5);
    expect(sheet.hasAdjustments()).toBe(false);
  });

  test('a fresh sheet is clean; any change makes it dirty', () => {
    BONUS_KEYS.forEach((key) => {
      const sheet = new MonsterSheet('monsters/aboleth');
      expect(sheet.hasAdjustments()).toBe(false);
      sheet.setBonus(key, 1);
      expect(sheet.hasAdjustments()).toBe(true);
    });
  });
});

describe('persistence', () => {
  test('a sheet round-trips through its tuple', () => {
    const sheet = new MonsterSheet('monsters/aboleth');
    sheet.adjustHp(-12);
    sheet.setMaxLife(90);
    sheet.setBonus('ac', 2);
    sheet.setBonus('will', -1);

    const restored = MonsterSheet.load(sheet.serialize());
    expect(restored.getRef()).toBe(sheet.getRef());
    expect(restored.getCurrentHp()).toBe(sheet.getCurrentHp());
    expect(restored.getMaxLife()).toBe(90);
    expect(restored.getArmorClass()).toBe(sheet.getArmorClass());
    expect(restored.getWillSave()).toBe(sheet.getWillSave());
  });

  test('an untouched sheet restores to the printed maximum, not a frozen copy', () => {
    const restored = MonsterSheet.load(new MonsterSheet('monsters/aboleth').serialize());
    expect(restored.maxLife).toBe(null);
    expect(restored.getMaxLife()).toBe(restored.getDefaultMaxLife());
  });

  test('an empty or unknown tuple restores no sheet', () => {
    expect(MonsterSheet.load([])).toBe(null);
    expect(MonsterSheet.load(null)).toBe(null);
    expect(MonsterSheet.load([''])).toBe(null);
    expect(MonsterSheet.load(['monsters/not-a-creature', 0, 0])).toBe(null);
  });

  test('a clone is independent of its original', () => {
    const sheet = new MonsterSheet(anyRef());
    const copy = sheet.clone();
    copy.adjustHp(-5);
    expect(sheet.getDamage()).toBe(0);
    expect(copy.getDamage()).toBe(5);
  });
});

describe('the stored filters', () => {
  test('round-trip through the tuple', () => {
    const filters = {
      ...getDefaultFilters(),
      sourceMask: 1,
      name: 'wolf',
      type: 'Animal',
      size: 'Large',
      terrain: 'forest',
      crMin: 2,
      crMax: 9,
    };
    expect(filtersFromTuple(filtersToTuple(filters))).toEqual(filters);
  });

  test('a missing or malformed tuple falls back to the defaults', () => {
    const defaults = getDefaultFilters();
    expect(filtersFromTuple(null)).toEqual(defaults);
    expect(filtersFromTuple([])).toEqual(defaults);
    expect(filtersFromTuple([1, 2, 3])).toEqual(defaults);
  });

  test('the defaults include everything', () => {
    const defaults = getDefaultFilters();
    expect(defaults.sourceMask).toBe(ALL_SOURCES_MASK);
    expect(defaults.name).toBe('');
    expect(defaults.crMin).toBeLessThan(1);
    expect(defaults.crMax).toBeGreaterThan(20);
  });
});
