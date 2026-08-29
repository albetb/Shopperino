import Player from './player';
import { sumContributions } from './contributions';
import { stepDamageDie, getItemByRef } from '../utils';

/* Potions on the character: what runs, what it moves, and what stops it.
 *
 * The invariant this file exists to protect is the one the whole breakdown box
 * rests on — every `get...Contributions()` list must sum to the number the
 * sheet displays. A potion that raises a total without adding a row (or the
 * reverse) is a bug the info box would report as a mismatch, so it is asserted
 * here for every stat a potion can touch.
 */

function pc(cls = 'Fighter', level = 6, race = 'Human') {
  const p = new Player();
  p.name = 'Test';
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

/** Drink one, by its items.json name. */
const drink = (p, name, opts) => { p.addPotionEffect(name, opts); return p; };

describe('starting and stopping', () => {
  test('a fresh character has nothing running', () => {
    const p = pc();
    expect(p.getResolvedEffects()).toEqual([]);
    expect(p.hasActiveEffects()).toBe(false);
  });

  test('drinking one starts it', () => {
    const p = drink(pc(), "Potion of Bull's strength");
    expect(p.getResolvedEffects()).toHaveLength(1);
    expect(p.getResolvedEffects()[0].label).toBe('Bull’s strength');
  });

  test('a name that is not a potion starts nothing', () => {
    const p = pc();
    expect(p.addPotionEffect('Potion of Nonsense')).toBe(false);
    expect(p.getResolvedEffects()).toEqual([]);
  });

  test('the x ends one, by the index it reported', () => {
    const p = pc();
    drink(p, "Potion of Bull's strength");
    drink(p, "Potion of Cat's grace");
    expect(p.removePotionEffect(0)).toBe(true);
    expect(p.getResolvedEffects().map((e) => e.label)).toEqual(['Cat’s grace']);
  });

  test('an index nobody reported ends nothing', () => {
    const p = drink(pc(), "Potion of Bull's strength");
    expect(p.removePotionEffect(9)).toBe(false);
    expect(p.removePotionEffect(-1)).toBe(false);
    expect(p.getResolvedEffects()).toHaveLength(1);
  });

  test('rest ends everything — there is no clock for a duration to tick against', () => {
    const p = pc();
    drink(p, "Potion of Bull's strength");
    drink(p, 'Potion of Barkskin +3');
    p.resetPotionEffectsOnRest();
    expect(p.getResolvedEffects()).toEqual([]);
  });

  test('and they survive a save and a load', () => {
    const p = drink(pc(), 'Oil of Magic weapon', { target: 'rh1' });
    const copy = new Player();
    copy.load(p.serialize());
    expect(copy.getResolvedEffects()[0].label).toBe('Magic weapon');
    expect(copy.getResolvedEffects()[0].target).toBe('rh1');
  });
});

describe('abilities', () => {
  test('bull’s strength raises Strength by 4', () => {
    const p = pc();
    const before = p.getAbilityTotal('str');
    drink(p, "Potion of Bull's strength");
    expect(p.getAbilityTotal('str')).toBe(before + 4);
  });

  test('and the breakdown adds up to the new total', () => {
    const p = drink(pc(), "Potion of Bull's strength");
    expect(sumContributions(p.getAbilityContributions('str'))).toBe(p.getAbilityTotal('str'));
  });

  test('the row names the potion rather than a generic "potion"', () => {
    const p = drink(pc(), "Potion of Cat's grace");
    const row = p.getAbilityContributions('dex').find((c) => c.source.startsWith('potion:'));
    expect(row.label).toBe('Cat’s grace');
    expect(row.type).toBe('enhancement');
  });

  test('a raised Constitution flows through to hit points, as an ability should', () => {
    const p = pc();
    const before = p.getMaxLife();
    drink(p, "Potion of Bear's endurance");
    expect(p.getMaxLife()).toBeGreaterThan(before);
  });

  test('paralysis still zeroes Dexterity, potion or no potion', () => {
    const p = drink(pc(), "Potion of Cat's grace");
    p.addCondition({ name: 'Paralyzed' });
    expect(p.getAbilityTotal('dex')).toBe(0);
  });
});

describe('armor class', () => {
  test('mage armor raises AC and flat-footed AC but not touch', () => {
    const p = pc();
    const [ac, touch, flat] = [p.getArmorClass(), p.getContactAC(), p.getFlatFootedAC()];
    drink(p, 'Potion of Mage armor');
    expect(p.getArmorClass()).toBe(ac + 4);
    expect(p.getContactAC()).toBe(touch);
    expect(p.getFlatFootedAC()).toBe(flat + 4);
  });

  test('shield of faith is deflection, so it reaches all three', () => {
    const p = pc();
    const [ac, touch, flat] = [p.getArmorClass(), p.getContactAC(), p.getFlatFootedAC()];
    drink(p, 'Potion of Shield of faith +3');
    expect(p.getArmorClass()).toBe(ac + 3);
    expect(p.getContactAC()).toBe(touch + 3);
    expect(p.getFlatFootedAC()).toBe(flat + 3);
  });

  test('haste is a dodge bonus, so it is lost while flat-footed', () => {
    const p = pc();
    const flat = p.getFlatFootedAC();
    drink(p, 'Potion of Haste');
    expect(p.getFlatFootedAC()).toBe(flat);
    expect(p.getContactAC()).toBeGreaterThan(0);
  });

  test('all three breakdowns add up to their totals', () => {
    const p = pc();
    drink(p, 'Potion of Mage armor');
    drink(p, 'Potion of Shield of faith +3');
    drink(p, 'Potion of Haste');
    expect(sumContributions(p.getArmorClassContributions())).toBe(p.getArmorClass());
    expect(sumContributions(p.getTouchAcContributions())).toBe(p.getContactAC());
    expect(sumContributions(p.getFlatFootedAcContributions())).toBe(p.getFlatFootedAC());
  });
});

describe('saving throws', () => {
  test('heroism adds +2 to all three', () => {
    const p = pc();
    const before = [p.getTotalFortitudeSave(), p.getTotalReflexSave(), p.getTotalWillSave()];
    drink(p, 'Potion of Heroism');
    expect(p.getTotalFortitudeSave()).toBe(before[0] + 2);
    expect(p.getTotalReflexSave()).toBe(before[1] + 2);
    expect(p.getTotalWillSave()).toBe(before[2] + 2);
  });

  test('and each breakdown adds up', () => {
    const p = drink(pc(), 'Potion of Heroism');
    expect(sumContributions(p.getSaveContributions('fortitude'))).toBe(p.getTotalFortitudeSave());
    expect(sumContributions(p.getSaveContributions('reflex'))).toBe(p.getTotalReflexSave());
    expect(sumContributions(p.getSaveContributions('will'))).toBe(p.getTotalWillSave());
  });

  test('haste touches only Reflex', () => {
    const p = pc();
    const fort = p.getTotalFortitudeSave();
    const reflex = p.getTotalReflexSave();
    drink(p, 'Potion of Haste');
    expect(p.getTotalFortitudeSave()).toBe(fort);
    expect(p.getTotalReflexSave()).toBe(reflex + 1);
  });
});

describe('speed, skills and the rest', () => {
  test('haste adds 30 feet', () => {
    const p = pc();
    const before = p.getTotalSpeed();
    drink(p, 'Potion of Haste');
    expect(p.getTotalSpeed()).toBe(before + 30);
    expect(sumContributions(p.getSpeedContributions())).toBe(p.getTotalSpeed());
  });

  test('a halving condition still halves the hasted speed, and the rows say so', () => {
    const p = drink(pc(), 'Potion of Haste');
    p.addCondition({ name: 'Exhausted' });
    expect(sumContributions(p.getSpeedContributions())).toBe(p.getTotalSpeed());
  });

  test('a potion of jump raises Jump alone', () => {
    const p = pc();
    const jump = p.getSkillTotal('Jump');
    const climb = p.getSkillTotal('Climb');
    drink(p, 'Potion of Jump');
    expect(p.getSkillTotal('Jump')).toBe(jump + 10);
    expect(p.getSkillTotal('Climb')).toBe(climb);
    expect(sumContributions(p.getSkillContributions('Jump'))).toBe(p.getSkillTotal('Jump'));
  });

  test('heroism raises every skill, through the skillsAll entry', () => {
    const p = pc();
    const climb = p.getSkillTotal('Climb');
    const spot = p.getSkillTotal('Spot');
    drink(p, 'Potion of Heroism');
    expect(p.getSkillTotal('Climb')).toBe(climb + 2);
    expect(p.getSkillTotal('Spot')).toBe(spot + 2);
    expect(sumContributions(p.getSkillContributions('Spot'))).toBe(p.getSkillTotal('Spot'));
  });
});

describe('size', () => {
  test('enlarge person moves the category, and everything follows', () => {
    const p = pc();
    expect(p.getSize()).toBe('Medium');
    const [ac, str, dex, dexMod] = [
      p.getArmorClass(), p.getAbilityTotal('str'), p.getAbilityTotal('dex'), p.getDexMod(),
    ];
    drink(p, 'Potion of Enlarge person');
    expect(p.getSize()).toBe('Large');
    expect(p.getAbilityTotal('str')).toBe(str + 2);
    expect(p.getAbilityTotal('dex')).toBe(dex - 2);
    /* AC moves twice: -1 for the size category, and again for whatever the
       Dexterity penalty did to the modifier. */
    expect(p.getArmorClass()).toBe(ac - 1 + (p.getDexMod() - dexMod));
    expect(p.getSizeAcModifier()).toBe(-1);
  });

  test('reduce person moves it the other way', () => {
    const p = drink(pc(), 'Potion of Reduce person');
    expect(p.getSize()).toBe('Small');
    expect(p.getAbilityTotal('str')).toBe(pc().getAbilityTotal('str') - 2);
  });

  test('a Small race enlarges to Medium rather than to Large', () => {
    const p = drink(pc('Fighter', 6, 'Gnome'), 'Potion of Enlarge person');
    expect(p.getSize()).toBe('Medium');
  });

  test('the AC breakdown still adds up while enlarged', () => {
    const p = drink(pc(), 'Potion of Enlarge person');
    expect(sumContributions(p.getArmorClassContributions())).toBe(p.getArmorClass());
  });

  test('a wielded weapon steps its damage die up', () => {
    const p = pc();
    const longsword = getItemByRef('items/Weapon/longsword')?.raw;
    expect(p.getWeaponDamageDice(longsword)).toBe('1d8');
    drink(p, 'Potion of Enlarge person');
    expect(p.getWeaponDamageDice(longsword)).toBe('2d6');
  });

  test('and down again under reduce person', () => {
    const p = drink(pc(), 'Potion of Reduce person');
    const longsword = getItemByRef('items/Weapon/longsword')?.raw;
    expect(p.getWeaponDamageDice(longsword)).toBe('1d6');
  });

  test('the damage ladder is bidirectional and stops at its ends', () => {
    expect(stepDamageDie('1d8', 1)).toBe('2d6');
    expect(stepDamageDie('2d6', -1)).toBe('1d8');
    expect(stepDamageDie('1d8', 0)).toBe('1d8');
    expect(stepDamageDie('9d99', 1)).toBe('9d99');
  });
});

describe('oils are scoped to the item they were applied to', () => {
  function armed() {
    const p = pc();
    p.equipment = {
      rh1: { link: 'items/Weapon/longsword', name: 'Longsword' },
      lh1: { link: 'items/Weapon/dagger', name: 'Dagger' },
    };
    return p;
  }

  test('an oil on one hand does not raise the other', () => {
    const p = armed();
    drink(p, 'Oil of Greater magic weapon +3', { target: 'rh1' });
    expect(p.getOilBonus('rh1', 'attack')).toBe(3);
    expect(p.getOilBonus('lh1', 'attack')).toBe(0);
  });

  test('an unapplied oil does nothing at all', () => {
    const p = armed();
    drink(p, 'Oil of Greater magic weapon +3');
    expect(p.getOilBonus('rh1', 'attack')).toBe(0);
    expect(p.getStatEffects()).toEqual([]);
  });

  test('magic vestment raises the armor it was applied to', () => {
    const p = pc();
    p.equipment = { armor: { link: 'items/Armor/chain-shirt', name: 'Chain shirt' } };
    const before = p.getArmorBonus();
    drink(p, 'Oil of Magic vestment +2', { target: 'armor' });
    expect(p.getArmorBonus()).toBe(before + 2);
  });

  test('the picker offers only what the oil can go on', () => {
    const p = armed();
    p.equipment.armor = { link: 'items/Armor/chain-shirt', name: 'Chain shirt' };
    expect(p.getOilTargets('weapon').map((t) => t.slot).sort()).toEqual(['lh1', 'rh1']);
    expect(p.getOilTargets('armor').map((t) => t.slot)).toEqual(['armor']);
    expect(p.getOilTargets('ammo')).toEqual([]);
    expect(p.getOilTargets('any').length).toBeGreaterThanOrEqual(3);
  });

  test('ammunition is offered from the bag, since arrows are never equipped', () => {
    const p = pc();
    p.addInventoryItem('Arrows', 'Ammo', 20, 'items/Ammo/arrows');
    expect(p.getOilTargets('ammo')).toEqual([{ slot: 'ammo:Arrows', name: 'Arrows' }]);
  });

  test('an applied oil names what it is on', () => {
    const p = armed();
    drink(p, 'Oil of Keen edge', { target: 'rh1' });
    expect(p.getResolvedEffects()[0].targetName).toBe('Longsword');
  });
});

describe('natural weapons — the druid’s form and her companion', () => {
  test('magic fang lends its bonus to natural attacks', () => {
    const p = drink(pc('Druid', 8), 'Potion of Magic fang');
    expect(p.getNaturalWeaponBonus('naturalAttack')).toBe(1);
    expect(p.getNaturalWeaponBonus('naturalDamage')).toBe(1);
  });

  test('the greater version reads its grade off the name', () => {
    const p = drink(pc('Druid', 12), 'Potion of Greater magic fang +4');
    expect(p.getNaturalWeaponBonus('naturalAttack')).toBe(4);
  });

  test('it does not leak into ordinary weapon attacks', () => {
    const p = drink(pc('Druid', 8), 'Potion of Magic fang');
    expect(p.getPotionBonus('attack')).toBe(0);
  });
});

describe('ability damage repair', () => {
  test('lesser restoration repairs the worst-damaged ability', () => {
    const p = pc();
    p.addCondition({ name: 'Ability Damaged', ability: 'Str', amount: 5 });
    expect(p.repairAbilityDamage(3)).toEqual({ ability: 'Str', repaired: 3 });
    expect(p.getConditions()[0].amount).toBe(2);
  });

  test('repairing it all clears the condition', () => {
    const p = pc();
    p.addCondition({ name: 'Ability Damaged', ability: 'Dex', amount: 2 });
    p.repairAbilityDamage(4);
    expect(p.getConditions()).toEqual([]);
  });

  test('a named ability is repaired in preference to the worst', () => {
    const p = pc();
    p.addCondition({ name: 'Ability Damaged', ability: 'Str', amount: 6 });
    p.addCondition({ name: 'Ability Damaged', ability: 'Wis', amount: 1 });
    expect(p.repairAbilityDamage(1, 'Wis')).toEqual({ ability: 'Wis', repaired: 1 });
    expect(p.getConditions().map((c) => c.ability)).toEqual(['Str']);
  });

  test('with nothing damaged there is nothing to repair', () => {
    expect(pc().repairAbilityDamage(4)).toBe(null);
  });
});

describe('stacking is reported, never enforced', () => {
  test('two enhancement bonuses to the same ability are flagged', () => {
    const p = pc();
    drink(p, "Potion of Bull's strength");
    drink(p, "Potion of Bull's strength");
    const warnings = p.getPotionStackingWarnings();
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({ stat: 'str', type: 'enhancement' });
  });

  test('but both are still counted — the sheet computes and does not block', () => {
    const p = pc();
    const before = p.getAbilityTotal('str');
    drink(p, "Potion of Bull's strength");
    drink(p, "Potion of Bull's strength");
    expect(p.getAbilityTotal('str')).toBe(before + 8);
  });

  test('two different bonus types are not flagged', () => {
    const p = pc();
    drink(p, 'Potion of Mage armor');       // armor
    drink(p, 'Potion of Shield of faith +2'); // deflection
    expect(p.getPotionStackingWarnings()).toEqual([]);
  });

  test('untyped bonuses always stack, so they are never flagged', () => {
    const p = pc();
    drink(p, 'Potion of Rage');
    drink(p, 'Potion of Rage');
    const acWarning = p.getPotionStackingWarnings().find((w) => w.stat === 'ac');
    expect(acWarning).toBeUndefined();
  });
});

describe('the situational notes travel with the number', () => {
  test('protection from evil warns that its bonus is conditional', () => {
    const p = drink(pc(), 'Potion of Protection from evil');
    const note = p.getSituationalContributions('ac').find((s) => s.source.startsWith('potion:'));
    expect(note.note).toMatch(/only against evil/i);
  });

  test('and on the saves it moves too', () => {
    const p = drink(pc(), 'Potion of Protection from evil');
    expect(p.getSituationalContributions('will').some((s) => s.source.startsWith('potion:'))).toBe(true);
  });

  test('but not on a stat it does not touch', () => {
    const p = drink(pc(), 'Potion of Protection from evil');
    expect(p.getSituationalContributions('speed').some((s) => s.source.startsWith('potion:'))).toBe(false);
  });

  test('an oil with no number still gets its note onto the weapon box', () => {
    const p = pc();
    p.equipment = { rh1: { link: 'items/Weapon/longsword', name: 'Longsword' } };
    drink(p, 'Oil of Keen edge', { target: 'rh1' });
    expect(p.getWeaponSituationalContributions().some((s) => /threat range/i.test(s.note))).toBe(true);
  });
});

describe('carried potions, read from the bag', () => {
  test('a character with none has no card', () => {
    expect(pc().getCarriedPotions()).toEqual([]);
    expect(pc().hasCarriedPotions()).toBe(false);
  });

  test('the carried count comes off the inventory row', () => {
    const p = pc();
    p.addInventoryItem('Potion of Cure light wounds', 'Potion', 3, 'cure-light-wounds');
    const [potion] = p.getCarriedPotions();
    expect(potion.number).toBe(3);
    expect(potion.kind).toBe('heal');
    expect(potion.description).toMatch(/1d8/);
  });

  test('non-potions in the bag are not offered', () => {
    const p = pc();
    p.addInventoryItem('Rope', 'Good', 1, '');
    expect(p.getCarriedPotions()).toEqual([]);
  });
});
