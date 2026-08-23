import Player from './player';
import { getAnimalBaseByRef } from '../animal/animalsUtils';

const WOLF = 'animals/wolf';
const BADGER = 'animals/badger';

/** A druid of the given level with a known ability spread. */
function druid(level = 5, { str = 10, dex = 12, con = 14, wis = 16 } = {}) {
  const p = new Player('Tester');
  p.setRace('Human');
  p.setClass('Druid');
  p.setLevel(level);
  p.setAbilityBase('str', str);
  p.setAbilityBase('dex', dex);
  p.setAbilityBase('con', con);
  p.setAbilityBase('wis', wis);
  return p;
}

describe('who has wild shape', () => {
  test('a druid gains it at 5th and gains uses on the table levels', () => {
    expect(druid(4).canWildShape()).toBe(false);
    expect(druid(4).getWildShapeMax()).toBe(0);
    expect(druid(5).getWildShapeMax()).toBe(1);
    expect(druid(6).getWildShapeMax()).toBe(2);
    expect(druid(7).getWildShapeMax()).toBe(3);
    expect(druid(10).getWildShapeMax()).toBe(4);
    expect(druid(14).getWildShapeMax()).toBe(5);
    expect(druid(18).getWildShapeMax()).toBe(6);
    expect(druid(20).getWildShapeMax()).toBe(6);
  });

  test('no other class has it', () => {
    ['Ranger', 'Cleric', 'Wizard', 'Barbarian'].forEach((c) => {
      const p = new Player();
      p.setClass(c);
      p.setLevel(20);
      expect(p.grantsWildShape()).toBe(false);
      expect(p.canWildShape()).toBe(false);
      expect(p.getWildShapeForms()).toEqual([]);
    });
  });

  test('a form lasts one hour per druid level', () => {
    expect(druid(5).getWildShapeDurationHours()).toBe(5);
    expect(druid(20).getWildShapeDurationHours()).toBe(20);
  });
});

describe('which forms are available', () => {
  test('sizes unlock progressively', () => {
    expect(druid(5).getWildShapeSizes().sort()).toEqual(['Medium', 'Small']);
    expect(druid(8).getWildShapeSizes()).toContain('Large');
    expect(druid(11).getWildShapeSizes()).toContain('Tiny');
    expect(druid(15).getWildShapeSizes()).toContain('Huge');
  });

  test('a locked size is excluded', () => {
    // Large is not unlocked until 8th.
    const early = druid(7).getWildShapeForms();
    expect(early.every((f) => f.size !== 'Large')).toBe(true);
    expect(druid(8).getWildShapeForms().some((f) => f.size === 'Large')).toBe(true);
  });

  test('Hit Dice above the druid level are excluded', () => {
    const forms = druid(5).getWildShapeForms();
    expect(forms.length).toBeGreaterThan(0);
    forms.forEach((f) => {
      expect(Number(f.hitDice?.count) || 0).toBeLessThanOrEqual(5);
    });
  });

  test('the list is sorted by name', () => {
    const names = druid(12).getWildShapeForms().map((f) => f.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('animals only until 12th, when plants join the same pool', () => {
    const at11 = druid(11).getWildShapeForms();
    expect(at11.length).toBeGreaterThan(0);
    expect(at11.every((f) => String(f.type).toLowerCase() === 'animal')).toBe(true);
    expect(druid(11).getWildShapeTypes()).toEqual(['animal']);
    expect(druid(12).getWildShapeTypes()).toEqual(['animal', 'plant']);
  });

  test('plant forms actually appear in the list from 12th', () => {
    const at11 = druid(11).getWildShapeForms().map((f) => f.name);
    const at12 = druid(12).getWildShapeForms().map((f) => f.name);
    // Shrieker is a Medium, 2 HD plant — legal for a 12th-level druid.
    expect(at11).not.toContain('Shrieker');
    expect(at12).toContain('Shrieker');
  });

  test('a plant over the HD cap is still excluded', () => {
    // Tendriculos is Huge with 9 HD: Huge unlocks at 15th, so a 12th-level
    // druid is barred by size and a 15th-level one is inside both limits.
    expect(druid(12).getWildShapeForms().map((f) => f.name)).not.toContain('Tendriculos');
    expect(druid(15).getWildShapeForms().map((f) => f.name)).toContain('Tendriculos');
  });

  test('elemental forms are flagged as unlocked but not offered', () => {
    expect(druid(15).getWildShapeMissingTiers()).toEqual([]);
    const missing = druid(16).getWildShapeMissingTiers();
    expect(missing).toHaveLength(1);
    expect(missing[0].tier).toBe('Elemental');
    expect(missing[0].level).toBe(16);
  });
});

describe('assuming and leaving a form', () => {
  test('transforming records the form and spends a use', () => {
    const p = druid(7);
    expect(p.isWildShaped()).toBe(false);
    expect(p.enterWildShape(WOLF)).toBe(true);
    expect(p.isWildShaped()).toBe(true);
    expect(p.getWildShapeRef()).toBe(WOLF);
    expect(p.getWildShapeName()).toBe('Wolf');
    expect(p.getWildShapeUsed()).toBe(1);
    expect(p.getWildShapeRemaining()).toBe(2);
  });

  test('transforming heals as if rested — one HP per character level', () => {
    const p = druid(7);
    p.setDamage(20);
    p.enterWildShape(WOLF);
    expect(p.getDamage()).toBe(13);
  });

  test('the heal never pushes damage below zero', () => {
    const p = druid(7);
    p.setDamage(3);
    p.enterWildShape(WOLF);
    expect(p.getDamage()).toBe(0);
  });

  test('reverting is free: no use spent, no healing', () => {
    const p = druid(7);
    p.setDamage(20);
    p.enterWildShape(WOLF);
    const damageAfterShift = p.getDamage();
    p.exitWildShape();
    expect(p.isWildShaped()).toBe(false);
    expect(p.getWildShapeUsed()).toBe(1);
    expect(p.getDamage()).toBe(damageAfterShift);
  });

  test('an unknown ref is refused and changes nothing', () => {
    const p = druid(7);
    expect(p.enterWildShape('animals/not-a-real-creature')).toBe(false);
    expect(p.isWildShaped()).toBe(false);
    expect(p.getWildShapeUsed()).toBe(0);
  });

  test('going over the daily allowance is recorded, not blocked', () => {
    const p = druid(5); // one use per day
    p.enterWildShape(WOLF);
    p.exitWildShape();
    p.enterWildShape(BADGER);
    expect(p.getWildShapeUsed()).toBe(2);
    expect(p.getWildShapeRemaining()).toBe(0);
    expect(p.isWildShaped()).toBe(true);
  });

  test('resting restores the uses', () => {
    const p = druid(7);
    p.enterWildShape(WOLF);
    p.resetClassFeatureUses();
    expect(p.getWildShapeUsed()).toBe(0);
    expect(p.getWildShapeRemaining()).toBe(3);
  });

  test('the form survives a serialize/load round trip', () => {
    const p = druid(7);
    p.enterWildShape(WOLF);
    const revived = new Player().load(p.serialize());
    expect(revived.isWildShaped()).toBe(true);
    expect(revived.getWildShapeRef()).toBe(WOLF);
  });
});

describe('the form replaces physical ability scores', () => {
  test('Str, Dex and Con become the form\'s; Int, Wis and Cha stay the druid\'s', () => {
    const p = druid(7, { str: 10, dex: 12, con: 14 });
    const wisBefore = p.getAbilityTotal('wis');
    const intBefore = p.getAbilityTotal('int');
    p.enterWildShape(WOLF);
    const wolf = getAnimalBaseByRef(WOLF).abilities;
    expect(p.getAbilityTotal('str')).toBe(wolf.str);
    expect(p.getAbilityTotal('dex')).toBe(wolf.dex);
    expect(p.getAbilityTotal('con')).toBe(wolf.con);
    expect(p.getAbilityTotal('wis')).toBe(wisBefore);
    expect(p.getAbilityTotal('int')).toBe(intBefore);
  });

  test('scores return to the druid\'s own on reverting', () => {
    const p = druid(7);
    const before = ['str', 'dex', 'con'].map((k) => p.getAbilityTotal(k));
    p.enterWildShape(WOLF);
    p.exitWildShape();
    expect(['str', 'dex', 'con'].map((k) => p.getAbilityTotal(k))).toEqual(before);
  });

  test('hit points stay on the druid\'s own Constitution', () => {
    // The wolf has Con 15 (+2) against the druid's 14 (+2) — pick a spread
    // where they differ so the assertion means something.
    const p = druid(7, { con: 8 }); // −1 per level
    const maxBefore = p.getMaxLife();
    p.enterWildShape(WOLF);
    expect(p.getMaxLife()).toBe(maxBefore);
    expect(p.getUnshapedConMod()).toBe(-1);
    // …while the form's Con still drives Fortitude.
    expect(p.getConMod()).toBe(2);
  });

  test('Fortitude and Reflex follow the form, Will follows the druid', () => {
    const p = druid(7, { dex: 8, con: 8 });
    const fortBefore = p.getTotalFortitudeSave();
    const refBefore = p.getTotalReflexSave();
    const willBefore = p.getTotalWillSave();
    p.enterWildShape(WOLF); // Dex 15 (+2), Con 15 (+2) vs the druid's 8 (−1)
    expect(p.getTotalFortitudeSave()).toBe(fortBefore + 3);
    expect(p.getTotalReflexSave()).toBe(refBefore + 3);
    expect(p.getTotalWillSave()).toBe(willBefore);
  });
});

describe('the form replaces size, armour and speed', () => {
  test('size becomes the form\'s and reverts after', () => {
    const p = druid(11);
    expect(p.getSize()).toBe('Medium');
    p.enterWildShape('animals/hawk'); // Tiny
    expect(p.getSize()).toBe('Tiny');
    expect(p.getTrueSize()).toBe('Medium');
    p.exitWildShape();
    expect(p.getSize()).toBe('Medium');
  });

  test('a Tiny form gains its +2 size modifier to AC', () => {
    const p = druid(11);
    p.enterWildShape('animals/hawk');
    expect(p.getSizeAcModifier()).toBe(2);
  });

  test('the form\'s natural armour raises AC and flat-footed but not touch', () => {
    const p = druid(7);
    p.enterWildShape(WOLF); // +2 natural
    expect(p.getWildShapeNaturalArmor()).toBe(2);
    expect(p.getArmorClass() - p.getContactAC()).toBe(2);
  });

  test('speed becomes the form\'s', () => {
    const p = druid(7);
    p.enterWildShape(WOLF); // 50 ft
    expect(p.getBaseSpeed()).toBe(50);
    p.exitWildShape();
    expect(p.getBaseSpeed()).toBe(30);
  });

  test('a non-flying movement mode is capped at 60 feet', () => {
    const p = druid(20);
    p.enterWildShape(WOLF);
    expect(p.getWildShapeSpeed('land')).toBeLessThanOrEqual(60);
  });

  test('movement modes are listed for the card', () => {
    const p = druid(7);
    p.enterWildShape(WOLF);
    const modes = p.getWildShapeMovementModes();
    expect(modes.some((m) => m.mode === 'land' && m.speed === 50)).toBe(true);
  });

  test('an unshaped druid has no form data at all', () => {
    const p = druid(7);
    expect(p.getWildShapeForm()).toBeNull();
    expect(p.getWildShapeNaturalArmor()).toBe(0);
    expect(p.getWildShapeAttacks()).toEqual([]);
    expect(p.getWildShapeMovementModes()).toEqual([]);
    expect(p.getWildShapeSpeed('land')).toBe(0);
  });
});

describe('equipment melds into the form', () => {
  test('worn armour stops contributing AC while shaped', () => {
    const p = druid(7);
    p.equipment = { armor: { link: 'items/Armor/hide', name: 'Hide' } };
    const armorBonusBefore = p.getArmorBonus();
    p.enterWildShape(WOLF);
    expect(p.isEquipmentMelded()).toBe(true);
    expect(p.getArmorBonus()).toBe(0);
    p.exitWildShape();
    expect(p.getArmorBonus()).toBe(armorBonusBefore);
  });

  test('melded armour imposes no check penalty and no Dex cap', () => {
    const p = druid(7);
    p.equipment = { armor: { link: 'items/Armor/hide', name: 'Hide' } };
    p.enterWildShape(WOLF);
    expect(p.getArmorCheckPenalty()).toBe(0);
    expect(p.getMaxDexBonus()).toBe(Infinity);
  });

  test('melded armour slows nothing', () => {
    const p = druid(7);
    p.equipment = { armor: { link: 'items/Armor/hide', name: 'Hide' } };
    p.enterWildShape(WOLF);
    expect(p.getArmorSpeedInfo().hasReduction).toBe(false);
  });
});

describe('natural attacks', () => {
  test('the form\'s attacks are listed, adjusted to the druid\'s BAB', () => {
    const p = druid(7); // druid BAB at 7th is 5; the wolf's own is 1
    p.enterWildShape(WOLF);
    const attacks = p.getWildShapeAttacks();
    expect(attacks).toHaveLength(1);
    expect(attacks[0].name.toLowerCase()).toContain('bite');
    // Wolf bite is +3 with its own BAB of 1, so +3 + (5 − 1) = +7.
    expect(attacks[0].bonus).toBe(3 + (p.getBaseAttackBonus() - 1));
  });

  test('special attacks transfer but special qualities do not', () => {
    const p = druid(7);
    p.enterWildShape(WOLF);
    expect(p.getWildShapeSpecialAttacks()).toContain('Trip');
    // Scent and low-light vision are special *qualities* — reported so the
    // card can say they are NOT gained.
    expect(p.getWildShapeUngainedQualities()).toContain('scent');
  });
});

describe('casting while transformed', () => {
  test('a shaped druid without Natural Spell cannot cast', () => {
    const p = druid(7);
    expect(p.canCastSpells()).toBe(true);
    p.enterWildShape(WOLF);
    expect(p.canCastSpells()).toBe(false);
  });

  test('Natural Spell removes the restriction', () => {
    const p = druid(7);
    p.addFeat('Natural spell');
    expect(p.hasNaturalSpell()).toBe(true);
    p.enterWildShape(WOLF);
    expect(p.canCastSpells()).toBe(true);
  });

  test('reverting restores casting', () => {
    const p = druid(7);
    p.enterWildShape(WOLF);
    p.exitWildShape();
    expect(p.canCastSpells()).toBe(true);
  });
});

describe('temporary-effect deltas drive the glow', () => {
  test('nothing temporary means no deltas at all', () => {
    const p = druid(7);
    expect(p.hasTemporaryEffects()).toBe(false);
    expect(p.getTemporaryBaseline()).toBeNull();
    expect(p.getTemporaryStatDeltas()).toEqual({});
  });

  test('wild shape produces signed deltas against the true form', () => {
    const p = druid(7, { str: 8, dex: 8, con: 8 });
    p.enterWildShape(WOLF); // Str 13, Dex 15, Con 15 — all up from 8
    expect(p.hasTemporaryEffects()).toBe(true);
    const d = p.getTemporaryStatDeltas();
    expect(d.str).toBe(13 - 8);
    expect(d.dex).toBe(15 - 8);
    expect(d.con).toBe(15 - 8);
    expect(d.fort).toBeGreaterThan(0);
    expect(d.speed).toBeGreaterThan(0);
  });

  test('a lower form score reads as a negative delta', () => {
    const p = druid(7, { str: 18 });
    p.enterWildShape(WOLF); // Str 13, down from 18
    expect(p.getTemporaryStatDeltas().str).toBe(13 - 18);
  });

  test('max HP shows no delta, since the form does not change it', () => {
    const p = druid(7, { con: 8 });
    p.enterWildShape(WOLF);
    expect(p.getTemporaryStatDeltas().maxHp).toBe(0);
  });

  test('the baseline strips rage as well as wild shape', () => {
    const b = new Player();
    b.setRace('Human');
    b.setClass('Barbarian');
    b.setLevel(5);
    b.setAbilityBase('str', 14);
    b.setRaging(true);
    expect(b.hasTemporaryEffects()).toBe(true);
    expect(b.getTemporaryStatDeltas().str).toBeGreaterThan(0);
    b.setRaging(false);
    expect(b.hasTemporaryEffects()).toBe(false);
  });

  test('conditions still register, as they did before', () => {
    const p = druid(7);
    p.addCondition({ name: 'Fatigued' });
    const d = p.getTemporaryStatDeltas();
    expect(p.hasTemporaryEffects()).toBe(true);
    expect(d.str).toBeLessThan(0);
    expect(d.dex).toBeLessThan(0);
  });

  test('the baseline keeps equipment, isolating the effect itself', () => {
    const p = druid(7);
    p.equipment = { armor: { link: 'items/Armor/hide', name: 'Hide' } };
    p.enterWildShape(WOLF);
    const base = p.getTemporaryBaseline();
    expect(base.equipment.armor.link).toBe('items/Armor/hide');
    expect(base.isWildShaped()).toBe(false);
  });
});
