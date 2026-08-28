import Player from './player';
import { getItemByRef, calculateWeaponAttackBonus } from '../utils';
import { canonicalWeaponName, getWeaponCategory } from './proficiency';

/* Proficiency was not modelled at all, so the sheet showed a wizard swinging a
   greatsword at full attack bonus. These check the -4 lands where the rules put
   it and — just as important — that it does not land anywhere else, since this
   is the one change in this pass that moves numbers on characters that already
   exist. */

function make({ cls = 'Fighter', level = 6, race = 'Human', feats = [] } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = race;
  p.feats = [...feats];
  return p;
}

const weapon = (slug) => getItemByRef(`items/Weapon/${slug}`)?.raw;

describe('reconciling the two spellings of a weapon', () => {
  test('word order and punctuation stop mattering', () => {
    // items.json spells it "Sword short" with no comma at all.
    expect(canonicalWeaponName('Sword short')).toBe('short sword');
    expect(canonicalWeaponName('Crossbow, light')).toBe('crossbow light');
    expect(canonicalWeaponName('Longbow, composite')).toBe('composite longbow');
    expect(canonicalWeaponName('Short sword')).toBe('short sword');
    expect(canonicalWeaponName('Light crossbow')).toBe('crossbow light');
  });

  test('a parenthetical count is not part of the name', () => {
    expect(canonicalWeaponName('Shuriken (5)')).toBe('shuriken');
  });

  test('categories come straight off the item', () => {
    expect(getWeaponCategory(weapon('dagger'))).toBe('simple');
    expect(getWeaponCategory(weapon('longsword'))).toBe('martial');
    expect(getWeaponCategory(weapon('dwarven-waraxe'))).toBe('exotic');
  });
});

describe('what a class grants', () => {
  test('a fighter is proficient with simple and martial weapons', () => {
    const p = make({ cls: 'Fighter' });
    expect(p.isProficientWithWeapon(weapon('dagger'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('greatsword'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('dwarven-waraxe'))).toBe(false);
  });

  test('a wizard has five weapons and no category', () => {
    const p = make({ cls: 'Wizard' });
    expect(p.isProficientWithWeapon(weapon('quarterstaff'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('dagger'))).toBe(true);
    // Named in the class list as "Light crossbow"; filed as "Crossbow, light".
    expect(p.isProficientWithWeapon(weapon('light-crossbow'))).toBe(true);
    // A simple weapon the wizard's list does not name.
    expect(p.isProficientWithWeapon(weapon('spear'))).toBe(false);
    expect(p.isProficientWithWeapon(weapon('greatsword'))).toBe(false);
  });

  test("a rogue's list reaches the short sword despite the inverted name", () => {
    const p = make({ cls: 'Rogue' });
    expect(p.isProficientWithWeapon(weapon('sword-short'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('rapier'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('longsword'))).toBe(false);
  });

  test('the monk list covers both crossbows through one entry', () => {
    const p = make({ cls: 'Monk' });
    expect(p.isProficientWithWeapon(weapon('light-crossbow'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('heavy-crossbow'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('crossbow-hand'))).toBe(false);
  });
});

describe('what a race grants', () => {
  test('an elf is proficient with its four weapons whatever the class', () => {
    const p = make({ cls: 'Wizard', race: 'Elf' });
    expect(p.isProficientWithWeapon(weapon('longsword'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('rapier'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('longbow'))).toBe(true);
    // "Longbow (including composite longbow)" is one entry for two weapons.
    expect(p.isProficientWithWeapon(weapon('composite-longbow'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('composite-shortbow'))).toBe(true);
  });

  test('familiarity is not proficiency — it only demotes to martial', () => {
    // A dwarf wizard has no martial weapons, so familiarity buys nothing.
    const wizard = make({ cls: 'Wizard', race: 'Dwarf' });
    expect(wizard.isProficientWithWeapon(weapon('dwarven-waraxe'))).toBe(false);

    // A dwarf fighter has martial weapons, so the waraxe counts as one.
    const fighter = make({ cls: 'Fighter', race: 'Dwarf' });
    expect(fighter.isProficientWithWeapon(weapon('dwarven-waraxe'))).toBe(true);
    // Another race's exotic weapon is still exotic to them.
    expect(fighter.isProficientWithWeapon(weapon('gnome-hooked-hammer'))).toBe(false);
  });
});

describe('what the feats grant', () => {
  test('Simple Weapon Proficiency grants the whole category', () => {
    const p = make({ cls: 'Wizard', feats: ['Simple weapon proficiency'] });
    expect(p.isProficientWithWeapon(weapon('spear'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('greatsword'))).toBe(false);
  });

  test('the martial and exotic feats grant one named weapon each', () => {
    const p = make({
      cls: 'Wizard',
      feats: ['Martial weapon proficiency (Greatsword)', 'Exotic weapon proficiency (Waraxe, dwarven)'],
    });
    expect(p.isProficientWithWeapon(weapon('greatsword'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('dwarven-waraxe'))).toBe(true);
    expect(p.isProficientWithWeapon(weapon('longsword'))).toBe(false);
  });
});

describe('the -4 reaching the attack roll', () => {
  const attack = (p, slug) => calculateWeaponAttackBonus(p, { weaponItem: weapon(slug) });

  test('an untrained weapon costs four', () => {
    const p = make({ cls: 'Wizard', level: 6 });
    expect(attack(p, 'greatsword')).toBe(attack(p, 'quarterstaff') - 4);
  });

  test('the feat gives it back', () => {
    const plain = make({ cls: 'Wizard', level: 6 });
    const trained = make({ cls: 'Wizard', level: 6, feats: ['Martial weapon proficiency (Greatsword)'] });
    expect(trained.getProficiencyAttackPenalty(weapon('greatsword'))).toBe(0);
    expect(attack(trained, 'greatsword')).toBe(attack(plain, 'greatsword') + 4);
  });

  test('a trained character is untouched — no silent change to existing sheets', () => {
    const p = make({ cls: 'Fighter', level: 6 });
    expect(p.getProficiencyAttackPenalty(weapon('longsword'))).toBe(0);
    expect(p.getProficiencyAttackPenalty(weapon('dagger'))).toBe(0);
  });
});

describe('armor and shields', () => {
  test('a class wears up to its category and no further', () => {
    const wizard = make({ cls: 'Wizard' });
    wizard.equipItem('armor', { link: 'items/Armor/padded' });
    expect(wizard.isProficientWithArmor()).toBe(false);

    const fighter = make({ cls: 'Fighter' });
    fighter.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(fighter.isProficientWithArmor()).toBe(true);

    const rogue = make({ cls: 'Rogue' });
    rogue.equipItem('armor', { link: 'items/Armor/breastplate' });
    expect(rogue.isProficientWithArmor()).toBe(false);
  });

  test('the armor feats grant what the class did not', () => {
    const p = make({ cls: 'Wizard', feats: ['Armor proficiency (light)'] });
    p.equipItem('armor', { link: 'items/Armor/padded' });
    expect(p.isProficientWithArmor()).toBe(true);
  });

  test('untrained armor puts its check penalty on every attack roll', () => {
    const p = make({ cls: 'Wizard', level: 6 });
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    // Full plate's check penalty is -6, and it is not the weapon's -4.
    expect(p.getArmorCheckPenalty()).toBe(6);
    expect(p.getArmorProficiencyAttackPenalty()).toBe(-6);
    expect(p.getProficiencyAttackPenalty(weapon('quarterstaff'))).toBe(-6);
    expect(p.getProficiencyAttackPenalty(weapon('greatsword'))).toBe(-10);
  });

  test('no armor, no penalty', () => {
    const p = make({ cls: 'Wizard' });
    expect(p.getArmorProficiencyAttackPenalty()).toBe(0);
  });
});

describe('the fist', () => {
  test('an unarmed strike is a simple weapon, so most classes are trained', () => {
    expect(make({ cls: 'Fighter' }).getPunchProficiencyPenalty()).toBe(0);
    expect(make({ cls: 'Cleric' }).getPunchProficiencyPenalty()).toBe(0);
    // The monk names it outright rather than taking the category.
    expect(make({ cls: 'Monk' }).getPunchProficiencyPenalty()).toBe(0);
  });

  test('a wizard is not, and the punch says so', () => {
    const p = make({ cls: 'Wizard' });
    expect(p.getPunchProficiencyPenalty()).toBe(-4);
    const trained = make({ cls: 'Wizard', feats: ['Simple weapon proficiency'] });
    expect(trained.getPunchProficiencyPenalty()).toBe(0);
    expect(p.getPunchAttackBonus()).toBe(trained.getPunchAttackBonus() - 4);
  });
});
