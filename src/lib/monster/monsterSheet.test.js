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

describe('attack routines the data does not spell out', () => {
  /* Dragons are the whole reason this exists: 120 of the 559 creatures carry
     no Attack / Full Attack text, because the SRD prints their routine as a
     damage-by-size table instead. These expectations are the SRD's own lines,
     copied from the Draconomicon-style entry, so a drift in the rebuild shows
     up as a mismatch against the book rather than against itself. */
  const line = (a) => `${a.count > 1 ? `${a.count} ` : ''}${a.name} ${a.bonus >= 0 ? '+' : ''}${a.bonus} (${a.damage})`;

  test('an adult dragon gets the routine the book prints', () => {
    const sheet = new MonsterSheet('monsters/red-dragon-adult');
    // SRD: Bite +31 melee (2d8+11) and 2 claws +26 melee (2d6+5) and
    //      2 wings +26 melee (1d8+5) and tail slap +26 melee (2d6+16).
    // Crush is checked separately — it is not part of the printed full attack.
    expect(sheet.getAttacks().filter((a) => !a.save).map(line)).toEqual([
      'bite +31 (2d8+11)',
      '2 claws +26 (2d6+5)',
      '2 wings +26 (1d8+5)',
      'tail slap +26 (2d6+16)',
    ]);
  });

  test('the bite is primary and everything else is secondary at -5', () => {
    const attacks = new MonsterSheet('monsters/gold-dragon-great-wyrm')
      .getAttacks().filter((a) => !a.save);
    const [bite, ...rest] = attacks;
    expect(bite.type).toBe('primary');
    expect(rest.every((a) => a.type === 'secondary')).toBe(true);
    expect(rest.every((a) => a.bonus === bite.bonus - 5)).toBe(true);
  });

  test('a wyrmling only gets the limbs its age category has', () => {
    const sheet = new MonsterSheet('monsters/black-dragon-wyrmling');
    // SRD: Bite +6 melee (1d4) and 2 claws +1 melee (1d3) — no wings or tail
    // slap yet, and Str 11 adds nothing, so no "+0" is printed.
    expect(sheet.getAttacks().map(line)).toEqual([
      'bite +6 (1d4)',
      '2 claws +1 (1d3)',
    ]);
  });

  test('Strength is applied whole to the bite, half to claws, one and a half to the tail', () => {
    const attacks = new MonsterSheet('monsters/red-dragon-adult').getAttacks();
    const strMod = 11; // Str 33
    const damageMod = (name) => Number(attacks.find((a) => a.name === name).damage.split('+')[1]);
    expect(damageMod('bite')).toBe(strMod);
    expect(damageMod('claws')).toBe(Math.floor(strMod / 2));
    expect(damageMod('tail slap')).toBe(Math.floor(strMod * 1.5));
  });

  test('crush and tail sweep are listed, with the save that avoids them', () => {
    const attacks = new MonsterSheet('monsters/gold-dragon-great-wyrm').getAttacks();
    const crush = attacks.find((a) => a.name === 'crush');
    const sweep = attacks.find((a) => a.name === 'tail sweep');

    // No attack roll — a Reflex save at the breath weapon's DC, which for this
    // dragon is the 41 printed in "Breath weapon 24d10 (DC 41)".
    [crush, sweep].forEach((a) => {
      expect(a.bonus).toBeNull();
      expect(a.type).toBe('save');
      expect(a.save).toEqual({ ability: 'Reflex', dc: 41 });
    });
    // Str 47 (+18), one and a half times over, as on the tail slap.
    expect(crush.damage).toBe('4d8+27');
    expect(sweep.damage).toBe('2d8+27');
  });

  test('the DC comes from the breath weapon, not from frightful presence', () => {
    // Ancient Silver prints "Breath weapon 20d8 (DC 34)" alongside
    // "Frightful presence (DC 35)" — the crush uses the breath's.
    const crush = new MonsterSheet('monsters/silver-dragon-ancient')
      .getAttacks().find((a) => a.name === 'crush');
    expect(crush.save.dc).toBe(34);
  });

  test('only dragons big enough for them get them', () => {
    // Crush from Huge up, tail sweep from Gargantuan — the data carries a null
    // for a limb the age category has not earned, so nothing is invented.
    const names = (ref) => new MonsterSheet(ref).getAttacks().map((a) => a.name);
    expect(names('monsters/black-dragon-wyrmling')).not.toContain('crush');
    expect(names('monsters/red-dragon-adult')).toContain('crush');          // Huge
    expect(names('monsters/red-dragon-adult')).not.toContain('tail sweep');
    expect(names('monsters/silver-dragon-ancient')).toContain('tail sweep'); // Gargantuan
  });

  test('a "-" attack line reads as no attacks rather than as text', () => {
    // The four creatures the SRD really does give no attack routine.
    ['monsters/formian-queen', 'monsters/shrieker', 'animals/bat', 'animals/toad'].forEach((ref) => {
      const sheet = new MonsterSheet(ref);
      expect(sheet.isValid()).toBe(true);
      expect(sheet.getAttackLine()).toBe('');
      expect(sheet.getAttacks()).toEqual([]);
    });
  });

  test('every other creature in the bestiary has an attack routine', () => {
    const attackless = listBestiary(ALL_SOURCES_MASK)
      .filter((c) => new MonsterSheet(c.ref).getAttacks().length === 0)
      .map((c) => c.name);
    expect(attackless.sort()).toEqual(['Bat', 'Formian Queen', 'Shrieker', 'Toad']);
  });
});
