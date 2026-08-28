import Player from './player';
import { getItemByRef } from '../utils';
import { parseCritical, widenThreatRange, getBaseSchool } from './featEffects';

/* The four feats in this file share a shape: each has an unambiguous number and
   nothing on the sheet was showing it. The maths lives here; where it prints is
   the components' problem. */

function make({ cls = 'Fighter', level = 8, race = 'Human', feats = [] } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = race;
  p.feats = [...feats];
  return p;
}

const weapon = (slug) => getItemByRef(`items/Weapon/${slug}`)?.raw;

describe('critical profiles, and Improved Critical widening them', () => {
  test('the two shapes items.json uses both parse', () => {
    expect(parseCritical('x2')).toEqual({ low: 20, multiplier: 'x2' });
    expect(parseCritical('19-20/x2')).toEqual({ low: 19, multiplier: 'x2' });
    expect(parseCritical('18-20/x2')).toEqual({ low: 18, multiplier: 'x2' });
    // The gnome hooked hammer is a double weapon and carries one multiplier
    // per head, so the multiplier is kept as text rather than a number.
    expect(parseCritical('x3/x4')).toEqual({ low: 20, multiplier: 'x3/x4' });
  });

  test('a weapon that cannot crit answers nothing at all', () => {
    // The net's Critical is an em dash.
    expect(parseCritical('—')).toBe(null);
    expect(parseCritical('')).toBe(null);
    expect(parseCritical(undefined)).toBe(null);
  });

  test('doubling a threat range doubles its width, not its lower bound', () => {
    expect(widenThreatRange(20)).toBe(19);
    expect(widenThreatRange(19)).toBe(17);
    expect(widenThreatRange(18)).toBe(15);
  });

  test('the profile shows unchanged without the feat', () => {
    const p = make();
    expect(p.getWeaponCritical(weapon('longsword'))).toEqual({ text: '19-20/x2', improved: false });
    expect(p.getWeaponCritical(weapon('warhammer'))).toEqual({ text: '20/x3', improved: false });
  });

  test('Improved Critical widens only the weapon it names', () => {
    const p = make({ feats: ['Improved critical (Longsword)'] });
    expect(p.getWeaponCritical(weapon('longsword'))).toEqual({ text: '17-20/x2', improved: true });
    expect(p.getWeaponCritical(weapon('dagger'))).toEqual({ text: '19-20/x2', improved: false });
  });

  test('a 20-only weapon becomes 19-20', () => {
    const p = make({ feats: ['Improved critical (Warhammer)'] });
    expect(p.getWeaponCritical(weapon('warhammer'))).toEqual({ text: '19-20/x3', improved: true });
  });

  test('the net still has no profile even with the feat', () => {
    const p = make({ feats: ['Improved critical (Net)'] });
    expect(p.getWeaponCritical(weapon('net'))).toBe(null);
  });
});

describe('range increments, and Far Shot extending them', () => {
  test('a melee weapon has no range at all', () => {
    const p = make();
    expect(p.getWeaponRange(weapon('greatsword'))).toEqual({ feet: 0, extended: false });
  });

  test('without the feat the increment is the printed one', () => {
    const p = make();
    expect(p.getWeaponRange(weapon('longbow'))).toEqual({ feet: 100, extended: false });
    expect(p.getWeaponRange(weapon('dagger'))).toEqual({ feet: 10, extended: false });
  });

  test('Far Shot is half again for what fires and double for what is thrown', () => {
    const p = make({ feats: ['Far shot'] });
    // Longbow 100 -> 150; sling and crossbows are projectiles too.
    expect(p.getWeaponRange(weapon('longbow'))).toEqual({ feet: 150, extended: true });
    expect(p.getWeaponRange(weapon('sling'))).toEqual({ feet: 75, extended: true });
    // Thrown: dagger 10 -> 20, javelin 30 -> 60.
    expect(p.getWeaponRange(weapon('dagger'))).toEqual({ feet: 20, extended: true });
    expect(p.getWeaponRange(weapon('javelin'))).toEqual({ feet: 60, extended: true });
  });

  test('Far Shot leaves a melee-only weapon alone', () => {
    const p = make({ feats: ['Far shot'] });
    expect(p.getWeaponRange(weapon('greatsword'))).toEqual({ feet: 0, extended: false });
  });
});

describe('run speed', () => {
  test('unencumbered is four times speed, five with the feat', () => {
    expect(make().getRunSpeedMultiplier()).toBe(4);
    expect(make({ feats: ['Run'] }).getRunSpeedMultiplier()).toBe(5);
  });

  test('heavy armor costs one multiple, and the feat gives it back', () => {
    const plain = make();
    plain.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(plain.getEquippedArmorRaw()?.Category).toBe('Heavy');
    expect(plain.getRunSpeedMultiplier()).toBe(3);

    const runner = make({ feats: ['Run'] });
    runner.equipItem('armor', { link: 'items/Armor/full-plate' });
    expect(runner.getRunSpeedMultiplier()).toBe(4);
  });

  test('light and medium armor cost nothing', () => {
    const p = make();
    p.equipItem('armor', { link: 'items/Armor/breastplate' });
    expect(p.getRunSpeedMultiplier()).toBe(4);
  });

  test('the feat is reported for the note beside the speed', () => {
    expect(make().hasRunFeat()).toBe(false);
    expect(make({ feats: ['Run'] }).hasRunFeat()).toBe(true);
  });
});

describe('spell save DC, and Spell Focus lifting it', () => {
  test('a school string is reduced to its school', () => {
    expect(getBaseSchool('Evocation [Fire]')).toBe('Evocation');
    expect(getBaseSchool('Conjuration (Creation)')).toBe('Conjuration');
    expect(getBaseSchool('Illusion (Figment, Glamer)')).toBe('Illusion');
    expect(getBaseSchool('Transmutation')).toBe('Transmutation');
  });

  test('10 + spell level + casting ability modifier', () => {
    const p = make({ cls: 'Wizard', level: 5 });
    p.setAbilityBase('int', 18); // +4
    expect(p.getModifier('int')).toBe(4);
    expect(p.getSpellSaveDC(3, 'Evocation')).toBe(17);
    expect(p.getSpellSaveDC(0, 'Evocation')).toBe(14);
  });

  test('Spell Focus and its Greater form each add one, and they stack', () => {
    const base = make({ cls: 'Wizard', level: 5 });
    base.setAbilityBase('int', 18);
    const focused = make({ cls: 'Wizard', level: 5, feats: ['Spell focus (Evocation)'] });
    focused.setAbilityBase('int', 18);
    const both = make({
      cls: 'Wizard',
      level: 5,
      feats: ['Spell focus (Evocation)', 'Greater spell focus (Evocation)'],
    });
    both.setAbilityBase('int', 18);

    expect(focused.getSpellSaveDC(3, 'Evocation')).toBe(base.getSpellSaveDC(3, 'Evocation') + 1);
    expect(both.getSpellSaveDC(3, 'Evocation')).toBe(base.getSpellSaveDC(3, 'Evocation') + 2);
  });

  test('the bonus reaches only its own school, descriptor and all', () => {
    const p = make({ cls: 'Wizard', level: 5, feats: ['Spell focus (Evocation)'] });
    p.setAbilityBase('int', 18);
    // Fireball's School field is "Evocation [Fire]" — the descriptor is not
    // part of the choice and must not stop the match.
    expect(p.getSpellFocusBonus('Evocation [Fire]')).toBe(1);
    expect(p.getSpellFocusBonus('Conjuration (Creation)')).toBe(0);
    expect(p.getSpellFocusBonus('Necromancy')).toBe(0);
  });

  test('a class with no spellcasting has no DC to report', () => {
    expect(make({ cls: 'Fighter' }).getSpellSaveDC(1, 'Evocation')).toBe(null);
  });
});
