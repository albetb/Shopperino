import Player from './player';
import { getItemByRef } from '../utils';

/* The model side of the mobile UI pass: the questions the combat page now asks
   it instead of answering itself. Each one exists because the sheet was showing
   something a player could misread — a pill coloured by the wrong thing, a
   default threat range dressed up as information, a rest button that rested
   less than the other rest button. */

function fighter({ level = 8, race = 'Human', cls = 'Fighter' } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = race;
  return p;
}

const weapon = (slug) => ({ weaponItem: getItemByRef(`items/Weapon/${slug}`).raw });

describe('how far an attack bonus sits from the plain one', () => {
  test('a proficient fighter with an ordinary weapon deviates by nothing', () => {
    const p = fighter();
    p.setAbilityBase('str', 16);
    p.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    expect(p.getWeaponAttackDeviation(weapon('longsword'))).toBe(0);
  });

  test('Weapon Focus pushes it up', () => {
    const p = fighter();
    p.setAbilityBase('str', 16);
    p.feats = ['Weapon focus (Longsword)'];
    expect(p.getWeaponAttackDeviation(weapon('longsword'))).toBe(1);
  });

  test('a weapon the character was never trained for pushes it down', () => {
    const p = fighter({ cls: 'Wizard' });
    p.setAbilityBase('str', 12);
    // A wizard is proficient with none of the martial weapons.
    expect(p.getWeaponAttackDeviation(weapon('greatsword'))).toBe(-4);
  });

  /* Two separate characters rather than one mutated in place: the effect-free
     baseline is memoised per instance, and every thunk hands the UI a freshly
     loaded Player, so a live instance is never mutated and then read again. */
  test('ability damage counts as a deviation, since the plain bonus is the undamaged one', () => {
    const healthy = fighter();
    healthy.setAbilityBase('str', 16);
    expect(healthy.getWeaponAttackDeviation(weapon('longsword'))).toBe(0);

    const damaged = fighter();
    damaged.setAbilityBase('str', 16);
    damaged.addCondition({ name: 'Ability Damaged', ability: 'Str', amount: 4 });
    // Str 16 → 12 costs two points of modifier, and nothing else moved.
    expect(damaged.getWeaponAttackDeviation(weapon('longsword'))).toBe(-2);
  });

  test('the unarmed strike answers the same question', () => {
    const monk = fighter({ cls: 'Monk', level: 6 });
    monk.setAbilityBase('str', 14);
    // A monk is proficient unarmed, so nothing is acting on the punch.
    expect(monk.getPunchAttackDeviation()).toBe(0);

    const wizard = fighter({ cls: 'Wizard' });
    wizard.setAbilityBase('str', 10);
    expect(wizard.getPunchAttackDeviation()).toBe(-4);
  });
});

describe('the critical profile the sheet prints', () => {
  test('a bare natural 20 is left unsaid — only the multiplier shows', () => {
    const p = fighter();
    expect(p.getWeaponCritical(getItemByRef('items/Weapon/warhammer').raw).text).toBe('x3');
    expect(p.getPunchCritical().text).toBe('x2');
  });

  test('a range wider than 20 is still spelled out', () => {
    const p = fighter();
    expect(p.getWeaponCritical(getItemByRef('items/Weapon/longsword').raw).text).toBe('19-20/x2');
  });

  test('Improved Critical turns an unremarkable profile into one worth printing', () => {
    const p = fighter();
    p.feats = ['Improved critical (Warhammer)'];
    expect(p.getWeaponCritical(getItemByRef('items/Weapon/warhammer').raw))
      .toEqual({ text: '19-20/x3', improved: true });
  });
});

describe('whether a long rest would change anything', () => {
  test('a rested character needs none', () => {
    expect(fighter().needsRest()).toBe(false);
  });

  test('a spent class-feature use is enough on its own', () => {
    const barb = fighter({ cls: 'Barbarian', level: 4 });
    barb.useClassFeature('rage', 1);
    expect(barb.needsRest()).toBe(true);
  });

  test('so is damage still to heal', () => {
    const p = fighter();
    p.maxLife = 60;
    p.setDamage(10);
    expect(p.needsRest()).toBe(true);
  });

  test('and a used gnome racial spell', () => {
    const gnome = fighter({ race: 'Gnome', cls: 'Fighter' });
    gnome.useGnomeSpell('spells/dancing-lights');
    expect(gnome.needsRest()).toBe(true);
  });

  test('a rest clears every one of them at once', () => {
    const p = fighter({ cls: 'Barbarian', level: 4, race: 'Gnome' });
    p.maxLife = 60;
    p.setDamage(2);
    p.useClassFeature('rage', 1);
    p.useGnomeSpell('spells/dancing-lights');

    p.resetClassFeatureUses();
    p.resetGnomeSpellUses();
    p.healAsIfRested();
    expect(p.needsRest()).toBe(false);
  });
});

describe('the speed a character actually moves at', () => {
  test('armor that slows you is a row that brings the total down to the reduced speed', () => {
    const p = fighter();
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    const info = p.getArmorSpeedInfo();
    const rows = p.getSpeedContributions();
    const armorRow = rows.find((r) => /armor and load/i.test(r.label));
    expect(armorRow.value).toBe(info.reducedSpeed - info.originalSpeed);
    expect(armorRow.value).toBeLessThan(0);
  });

  test('a dwarf, who ignores the reduction, gets no such row', () => {
    const p = fighter({ race: 'Dwarf' });
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(p.getSpeedContributions().some((r) => /armor and load/i.test(r.label))).toBe(false);
  });
});
