import Player from './player';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../utils';
import { SKILL_PAIR_FEATS } from './featEffects';
import { getChoicesForFeat, UNARMED_STRIKE } from '../featChoices';

/* getItemByRef answers { raw, source }; the calculators want the entry itself. */
const weapon = (slug) => getItemByRef(`items/Weapon/${slug}`)?.raw;

function make({ cls = 'Fighter', level = 1, race = 'Human', feats = [] } = {}) {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

/* Ability scores start at 10 across the board, so every derived number below
   moves only for the reason each test is about. */

describe('skill feats', () => {
  test('a pair feat lifts both of its skills by 2 and nothing else', () => {
    const before = make();
    const after = make({ feats: ['Stealthy'] });
    expect(after.getSkillTotal('Hide')).toBe(before.getSkillTotal('Hide') + 2);
    expect(after.getSkillTotal('Move silently')).toBe(before.getSkillTotal('Move silently') + 2);
    expect(after.getSkillTotal('Spot')).toBe(before.getSkillTotal('Spot'));
  });

  test('every pair feat names two real skills and lifts exactly those', () => {
    Object.entries(SKILL_PAIR_FEATS).forEach(([featName, skills]) => {
      expect(skills).toHaveLength(2);
      const plain = make();
      const withFeat = make({ feats: [featName] });
      skills.forEach((skill) => {
        // A name that is not in skills.json would score 0 both times and pass
        // silently, so check the skill is real first.
        expect(plain.getSkillNames()).toContain(skill);
        expect(withFeat.getSkillTotal(skill)).toBe(plain.getSkillTotal(skill) + 2);
      });
    });
  });

  test('Skill Focus lifts only the skill it was taken in', () => {
    const p = make({ feats: ['Skill focus (Tumble)'] });
    const plain = make();
    expect(p.getSkillTotal('Tumble')).toBe(plain.getSkillTotal('Tumble') + 3);
    expect(p.getSkillTotal('Jump')).toBe(plain.getSkillTotal('Jump'));
  });

  test('Skill Focus and a pair feat stack on the same skill', () => {
    const p = make({ feats: ['Acrobatic', 'Skill focus (Jump)'] });
    expect(p.getSkillTotal('Jump')).toBe(make().getSkillTotal('Jump') + 5);
  });

  test('an unchosen Skill Focus lifts nothing', () => {
    const p = make({ feats: ['Skill focus'] });
    expect(p.getSkillTotal('Tumble')).toBe(make().getSkillTotal('Tumble'));
  });
});

describe('save, initiative and hit point feats', () => {
  test('each save feat adds 2 to its own save only', () => {
    const plain = make();
    const fort = make({ feats: ['Great fortitude'] });
    expect(fort.getTotalFortitudeSave()).toBe(plain.getTotalFortitudeSave() + 2);
    expect(fort.getTotalReflexSave()).toBe(plain.getTotalReflexSave());
    expect(fort.getTotalWillSave()).toBe(plain.getTotalWillSave());

    expect(make({ feats: ['Lightning reflexes'] }).getTotalReflexSave())
      .toBe(plain.getTotalReflexSave() + 2);
    expect(make({ feats: ['Iron will'] }).getTotalWillSave())
      .toBe(plain.getTotalWillSave() + 2);
  });

  test('Improved Initiative adds 4', () => {
    expect(make({ feats: ['Improved initiative'] }).getTotalInitiative())
      .toBe(make().getTotalInitiative() + 4);
  });

  test('Toughness adds 3 hit points every time it is taken', () => {
    const plain = make().getMaxLife();
    expect(make({ feats: ['Toughness'] }).getMaxLife()).toBe(plain + 3);
    expect(make({ feats: ['Toughness', 'Toughness', 'Toughness'] }).getMaxLife()).toBe(plain + 9);
  });

  test('current hit points follow the Toughness bonus', () => {
    const p = make({ feats: ['Toughness'] });
    expect(p.getCurrentHp()).toBe(p.getMaxLife());
  });
});

describe('weapon feats', () => {
  const longsword = () => ({ weaponItem: weapon('longsword'), isTwoHanded: false, itemData: {} });
  const dagger = () => ({ weaponItem: weapon('dagger'), isTwoHanded: false, itemData: {} });

  test('Weapon Focus adds 1 to attack with the chosen weapon only', () => {
    const plain = make({ level: 4 });
    const p = make({ level: 4, feats: ['Weapon focus (Longsword)'] });
    expect(calculateWeaponAttackBonus(p, longsword()))
      .toBe(calculateWeaponAttackBonus(plain, longsword()) + 1);
    expect(calculateWeaponAttackBonus(p, dagger()))
      .toBe(calculateWeaponAttackBonus(plain, dagger()));
  });

  test('Greater Weapon Focus stacks with Weapon Focus', () => {
    const plain = make({ level: 8 });
    const p = make({ level: 8, feats: ['Weapon focus (Longsword)', 'Greater weapon focus (Longsword)'] });
    expect(calculateWeaponAttackBonus(p, longsword()))
      .toBe(calculateWeaponAttackBonus(plain, longsword()) + 2);
  });

  test('Weapon Specialization adds 2 damage with the chosen weapon only', () => {
    const p = make({ level: 4, feats: ['Weapon specialization (Longsword)'] });
    expect(calculateWeaponDamage(p, longsword())).toBe('1d8+2');
    expect(calculateWeaponDamage(p, dagger())).toBe('1d4');
  });

  test('Greater Weapon Specialization stacks with it', () => {
    const p = make({
      level: 12,
      feats: ['Weapon specialization (Longsword)', 'Greater weapon specialization (Longsword)'],
    });
    expect(calculateWeaponDamage(p, longsword())).toBe('1d8+4');
  });

  test('the choice is matched case-insensitively, as the picker stores it', () => {
    const plain = make({ level: 4 });
    const p = make({ level: 4, feats: ['Weapon focus (longsword)'] });
    expect(calculateWeaponAttackBonus(p, longsword()))
      .toBe(calculateWeaponAttackBonus(plain, longsword()) + 1);
  });
});

describe('weapon finesse', () => {
  function agile(feats) {
    const p = make({ level: 4, feats });
    p.setAbilityBase('str', 8);   // -1
    p.setAbilityBase('dex', 18);  // +4
    return p;
  }
  const dagger = () => ({ weaponItem: weapon('dagger'), isTwoHanded: false, itemData: {} });
  const rapier = () => ({ weaponItem: weapon('rapier'), isTwoHanded: false, itemData: {} });
  const greatsword = () => ({ weaponItem: weapon('greatsword'), isTwoHanded: true, itemData: {} });

  test('without the feat a light weapon still uses Strength', () => {
    const p = agile([]);
    expect(calculateWeaponAttackBonus(p, dagger())).toBe(p.getBaseAttackBonus() - 1);
  });

  test('with the feat a light weapon uses Dexterity', () => {
    const p = agile(['Weapon finesse']);
    expect(calculateWeaponAttackBonus(p, dagger())).toBe(p.getBaseAttackBonus() + 4);
  });

  test('the rapier qualifies even though it is not light', () => {
    const p = agile(['Weapon finesse']);
    expect(calculateWeaponAttackBonus(p, rapier())).toBe(p.getBaseAttackBonus() + 4);
  });

  test('a two-handed weapon does not qualify', () => {
    const p = agile(['Weapon finesse']);
    expect(calculateWeaponAttackBonus(p, greatsword())).toBe(p.getBaseAttackBonus() - 1);
  });

  test('a stronger character keeps Strength - the feat never lowers the attack', () => {
    const p = make({ level: 4, feats: ['Weapon finesse'] });
    p.setAbilityBase('str', 18);
    p.setAbilityBase('dex', 8);
    expect(calculateWeaponAttackBonus(p, dagger())).toBe(p.getBaseAttackBonus() + 4);
  });

  test('damage still uses Strength - finesse is an attack-roll feat', () => {
    const p = agile(['Weapon finesse']);
    expect(calculateWeaponDamage(p, dagger())).toBe('1d4-1');
  });
});

describe('unarmed strike as a weapon-feat choice', () => {
  test('it is offered by the weapon-choice feats', () => {
    // items.json has no unarmed entry, so the option is added by hand.
    expect(getChoicesForFeat('Weapon focus', [])).toContain(UNARMED_STRIKE);
    expect(getChoicesForFeat('Weapon specialization', [])).toContain(UNARMED_STRIKE);
    expect(getChoicesForFeat('Improved critical', [])).toContain(UNARMED_STRIKE);
  });

  test('taking it removes it from what is left to choose', () => {
    const taken = [`Weapon focus (${UNARMED_STRIKE})`];
    expect(getChoicesForFeat('Weapon focus', taken)).not.toContain(UNARMED_STRIKE);
  });

  test('it is not offered where the rules do not allow it', () => {
    expect(getChoicesForFeat('Martial weapon proficiency', [])).not.toContain(UNARMED_STRIKE);
    expect(getChoicesForFeat('Exotic weapon proficiency', [])).not.toContain(UNARMED_STRIKE);
  });

  test('Weapon Focus in unarmed strike lifts the punch', () => {
    const plain = make({ cls: 'Monk', level: 6 });
    const p = make({ cls: 'Monk', level: 6, feats: [`Weapon focus (${UNARMED_STRIKE})`] });
    expect(p.getPunchAttackBonus()).toBe(plain.getPunchAttackBonus() + 1);
  });

  test('a Weapon Focus in some other weapon leaves the punch alone', () => {
    const plain = make({ cls: 'Monk', level: 6 });
    const p = make({ cls: 'Monk', level: 6, feats: ['Weapon focus (Longsword)'] });
    expect(p.getPunchAttackBonus()).toBe(plain.getPunchAttackBonus());
  });

  test('Greater Weapon Focus stacks on the punch', () => {
    const plain = make({ cls: 'Monk', level: 8 });
    const p = make({
      cls: 'Monk',
      level: 8,
      feats: [`Weapon focus (${UNARMED_STRIKE})`, `Greater weapon focus (${UNARMED_STRIKE})`],
    });
    expect(p.getPunchAttackBonus()).toBe(plain.getPunchAttackBonus() + 2);
  });

  test('Weapon Specialization adds 2 to unarmed damage, on top of the monk dice', () => {
    const monk = make({ cls: 'Monk', level: 6 });
    expect(monk.getPunchDamageDice()).toBe('1d8');
    const p = make({ cls: 'Monk', level: 6, feats: [`Weapon specialization (${UNARMED_STRIKE})`] });
    expect(p.getPunchDamageDice()).toBe('1d8');
    expect(p.getPunchDamage()).toBe('1d8+2');
  });

  test('Greater Weapon Specialization stacks on it', () => {
    const p = make({
      cls: 'Monk',
      level: 12,
      feats: [
        `Weapon specialization (${UNARMED_STRIKE})`,
        `Greater weapon specialization (${UNARMED_STRIKE})`,
      ],
    });
    expect(p.getPunchDamage()).toBe(`${p.getPunchDamageDice()}+4`);
  });
});

describe('the punch line itself', () => {
  test('unarmed damage carries the Strength modifier, as a weapon does', () => {
    const p = make({ level: 4 });
    p.setAbilityBase('str', 16); // +3
    expect(p.getPunchDamage()).toBe('1d3+3');
  });

  test('a Strength penalty shows on the punch too', () => {
    const p = make({ level: 4 });
    p.setAbilityBase('str', 6); // -2
    expect(p.getPunchDamage()).toBe('1d3-2');
  });

  test('no modifier leaves the dice bare', () => {
    expect(make({ level: 4 }).getPunchDamage()).toBe('1d3');
  });

  test('an unarmed strike is a light weapon, so Weapon Finesse applies to it', () => {
    const p = make({ cls: 'Monk', level: 4, feats: ['Weapon finesse'] });
    p.setAbilityBase('str', 8);   // -1
    p.setAbilityBase('dex', 18);  // +4
    expect(p.getPunchAttackBonus()).toBe(p.getBaseAttackBonus() + 4);
  });

  test('the punch attack is the base attack plus Strength by default', () => {
    const p = make({ cls: 'Fighter', level: 6 });
    p.setAbilityBase('str', 14); // +2
    expect(p.getPunchAttackBonus()).toBe(p.getBaseAttackBonus() + 2);
  });
});

describe('turning feats', () => {
  const cleric = (feats) => make({ cls: 'Cleric', level: 5, feats });

  test('Extra Turning adds four attempts each time it is taken', () => {
    const plain = cleric([]);
    expect(cleric(['Extra turning']).getTurnUndeadAttemptsMax())
      .toBe(plain.getTurnUndeadAttemptsMax() + 4);
    expect(cleric(['Extra turning', 'Extra turning']).getTurnUndeadAttemptsMax())
      .toBe(plain.getTurnUndeadAttemptsMax() + 8);
  });

  test('Improved Turning raises the turning level by one, and only once', () => {
    const plain = cleric([]);
    expect(cleric(['Improved turning']).getTurnUndeadEffectiveLevel())
      .toBe(plain.getTurnUndeadEffectiveLevel() + 1);
    expect(cleric(['Improved turning', 'Improved turning']).getTurnUndeadEffectiveLevel())
      .toBe(plain.getTurnUndeadEffectiveLevel() + 1);
  });

  test('a class that cannot turn undead gains nothing from either', () => {
    const p = make({ cls: 'Fighter', level: 5, feats: ['Extra turning', 'Improved turning'] });
    expect(p.getTurnUndeadAttemptsMax()).toBe(0);
    expect(p.getTurnUndeadEffectiveLevel()).toBe(0);
  });
});

describe('feats with no mechanical effect on the sheet', () => {
  test('a narrative feat changes no derived value', () => {
    const plain = make({ level: 5 });
    const p = make({ level: 5, feats: ['Leadership', 'Track', 'Brew potion'] });
    expect(p.getMaxLife()).toBe(plain.getMaxLife());
    expect(p.getTotalFortitudeSave()).toBe(plain.getTotalFortitudeSave());
    expect(p.getTotalInitiative()).toBe(plain.getTotalInitiative());
    expect(p.getSkillTotal('Survival')).toBe(plain.getSkillTotal('Survival'));
  });
});
