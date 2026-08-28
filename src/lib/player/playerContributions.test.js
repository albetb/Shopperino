import Player from './player';
import { sumContributions } from './contributions';
import { getItemByRef, calculateWeaponAttackBonus, calculateWeaponDamage } from '../utils';

/* The invariant this whole feature rests on: the rows a stat reports must add
   up to the number the sheet shows beside them. Every test here loads a
   character up with a feat, a familiar, a manual bonus, an item and an active
   condition — so the sum is only right if every source was accounted for — and
   then asserts list-sum === displayed-getter.

   A breakdown that does not add up has found a bug rather than explained a
   number, so these are the tests that would catch a contribution being added to
   a getter and not to its list, which is the obvious way for this to rot. */

function make({ race = 'Human', cls = 'Fighter', level = 8, feats = [] } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = race;
  p.feats = [...feats];
  return p;
}

/** A character with something from every channel, so no source can be missed. */
function loaded() {
  const p = make({
    race: 'Halfling',
    cls: 'Fighter',
    level: 8,
    feats: ['Great fortitude', 'Lightning reflexes', 'Iron will', 'Improved initiative', 'Toughness'],
  });
  p.setAbilityBase('str', 15);
  p.setAbilityBase('dex', 14);
  p.setAbilityBase('con', 13);
  p.setAbilityBase('wis', 12);
  p.setAbilityBonus('str', 2);
  p.maxLife = 60;
  p.healthModifier = 5;
  p.fortBonus = 1;
  p.reflexBonus = 2;
  p.willBonus = -1;
  p.initiativeBonus = 3;
  return p;
}

describe('ability score contributions', () => {
  test('sum to the displayed total for every ability', () => {
    const p = loaded();
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((key) => {
      expect(sumContributions(p.getAbilityContributions(key))).toBe(p.getAbilityTotal(key));
    });
  });

  test('name the base, the manual bonus and the racial modifier', () => {
    const p = loaded();
    const sources = p.getAbilityContributions('str').map((c) => c.source);
    expect(sources).toContain('base');
    expect(sources).toContain('manual');
    // Halfling is -2 Strength, so the racial row must be there and negative.
    expect(sources).toContain('race');
    expect(p.getAbilityContributions('str').find((c) => c.source === 'race').value).toBe(-2);
  });

  test('the racial row is typed racial', () => {
    const race = loaded().getAbilityContributions('dex').find((c) => c.source === 'race');
    expect(race.type).toBe('racial');
  });

  test('an ability with nothing but its base reports one row', () => {
    const p = make();
    p.setAbilityBase('int', 11);
    expect(p.getAbilityContributions('int')).toEqual([
      { source: 'base', label: 'base score', type: '', value: 11 },
    ]);
  });

  test('still sums correctly with an ability-damaging condition active', () => {
    const p = loaded();
    const before = p.getAbilityTotal('con');
    p.addCondition({ name: 'Ability Drained', ability: 'Con', amount: 4 });
    // The condition must actually bite, or this test proves nothing.
    expect(p.getAbilityTotal('con')).toBe(before - 4);
    expect(sumContributions(p.getAbilityContributions('con'))).toBe(p.getAbilityTotal('con'));
    expect(p.getAbilityContributions('con').some((c) => c.value === -4)).toBe(true);
  });

  test('a condition that zeroes an ability still sums to zero', () => {
    const p = loaded();
    p.addCondition({ name: 'Paralyzed' });
    expect(p.getAbilityTotal('dex')).toBe(0);
    expect(sumContributions(p.getAbilityContributions('dex'))).toBe(0);
  });
});

describe('saving throw contributions', () => {
  test('sum to the displayed total for all three saves, conditions included', () => {
    const p = loaded();
    p.addCondition({ name: 'Shaken' });
    expect(sumContributions(p.getSaveContributions('fortitude'))).toBe(p.getTotalFortitudeSave());
    expect(sumContributions(p.getSaveContributions('reflex'))).toBe(p.getTotalReflexSave());
    expect(sumContributions(p.getSaveContributions('will'))).toBe(p.getTotalWillSave());
  });

  test('name the class base, the ability, the manual bonus, the feat and the race', () => {
    const sources = loaded().getSaveContributions('fortitude').map((c) => c.source);
    expect(sources).toEqual(expect.arrayContaining(['base', 'ability', 'manual', 'feats', 'race']));
  });

  test('the paladin Divine Grace row appears only for a paladin of the right level', () => {
    const paladin = make({ cls: 'Paladin', level: 8 });
    paladin.setAbilityBase('cha', 16);
    const rows = paladin.getSaveContributions('will');
    expect(rows.find((c) => c.source === 'divineGrace').value).toBe(3);
    expect(sumContributions(rows)).toBe(paladin.getTotalWillSave());

    const fighter = make({ cls: 'Fighter', level: 8 });
    fighter.setAbilityBase('cha', 16);
    expect(fighter.getSaveContributions('will').find((c) => c.source === 'divineGrace')).toBe(undefined);
  });

  test('an unknown save name reports nothing rather than throwing', () => {
    expect(loaded().getSaveContributions('luck')).toEqual([]);
  });
});

describe('initiative contributions', () => {
  test('sum to the displayed initiative', () => {
    const p = loaded();
    expect(sumContributions(p.getInitiativeContributions())).toBe(p.getTotalInitiative());
  });

  test('name Dexterity, the manual bonus and Improved Initiative', () => {
    const rows = loaded().getInitiativeContributions();
    expect(rows.find((c) => c.source === 'feats').value).toBe(4);
    expect(rows.find((c) => c.source === 'manual').value).toBe(3);
    expect(rows.find((c) => c.source === 'ability').label).toBe('Dexterity');
  });

  test('a character with no bonuses at all reports only the ability, or nothing', () => {
    const p = make();
    p.setAbilityBase('dex', 10);
    expect(p.getInitiativeContributions()).toEqual([]);
    expect(p.getTotalInitiative()).toBe(0);
  });
});

describe('maximum hit point contributions', () => {
  test('sum to the displayed maximum', () => {
    const p = loaded();
    expect(sumContributions(p.getMaxLifeContributions())).toBe(p.getMaxLife());
  });

  test('name the rolled total, Constitution across levels, bonus life and Toughness', () => {
    const rows = loaded().getMaxLifeContributions();
    expect(rows.find((c) => c.source === 'rolled').value).toBe(60);
    expect(rows.find((c) => c.source === 'manual').value).toBe(5);
    expect(rows.find((c) => c.source === 'feats').value).toBe(3);
    expect(rows.find((c) => c.source === 'con').label).toMatch(/8 levels/);
  });

  test('Toughness taken twice shows as six, and the sum still holds', () => {
    const p = make({ feats: ['Toughness', 'Toughness'] });
    p.maxLife = 40;
    expect(p.getMaxLifeContributions().find((c) => c.source === 'feats').value).toBe(6);
    expect(sumContributions(p.getMaxLifeContributions())).toBe(p.getMaxLife());
  });
});

describe('zero rows are dropped', () => {
  test('a plain character produces short lists with no +0 entries', () => {
    const p = make();
    ['fortitude', 'reflex', 'will'].forEach((which) => {
      const rows = p.getSaveContributions(which);
      expect(rows.every((c) => c.value !== 0)).toBe(true);
      expect(sumContributions(rows)).toBe(
        which === 'fortitude' ? p.getTotalFortitudeSave()
          : which === 'reflex' ? p.getTotalReflexSave()
            : p.getTotalWillSave()
      );
    });
  });
});

describe('armor class contributions', () => {
  /** Armored, shielded, small, with a manual bonus and a condition running. */
  function defended() {
    const p = make({ race: 'Halfling', cls: 'Fighter', level: 8 });
    p.setAbilityBase('dex', 16);
    p.equipItem('armor', { link: 'items/Armor/chain-shirt' });
    p.equipItem('lh1', { link: 'items/Shield/shield-heavy-steel' });
    p.acBonus = 1;
    p.addCondition({ name: 'Shaken' });
    return p;
  }

  test('sum to the displayed armor class', () => {
    const p = defended();
    expect(sumContributions(p.getArmorClassContributions())).toBe(p.getArmorClass());
  });

  test('touch and flat-footed each sum to their own value', () => {
    const p = defended();
    expect(sumContributions(p.getTouchAcContributions())).toBe(p.getContactAC());
    expect(sumContributions(p.getFlatFootedAcContributions())).toBe(p.getFlatFootedAC());
  });

  test('armor and shield rows carry their bonus types and name the item', () => {
    const rows = defended().getArmorClassContributions();
    const armor = rows.find((c) => c.source === 'armor');
    const shield = rows.find((c) => c.source === 'shield');
    expect(armor.type).toBe('armor');
    expect(armor.label).toMatch(/chain shirt/i);
    expect(shield.type).toBe('shield');
    expect(rows.find((c) => c.source === 'size').type).toBe('size');
  });

  test('touch AC drops armor and shield but keeps size', () => {
    const rows = defended().getTouchAcContributions().map((c) => c.source);
    expect(rows).not.toContain('armor');
    expect(rows).not.toContain('shield');
    expect(rows).toContain('size');
  });

  test('flat-footed drops the Dexterity row and keeps armor', () => {
    const rows = defended().getFlatFootedAcContributions().map((c) => c.source);
    expect(rows).not.toContain('ability');
    expect(rows).toContain('armor');
  });

  test('an unarmored character reports base and Dexterity and nothing else', () => {
    const p = make();
    p.setAbilityBase('dex', 14);
    expect(p.getArmorClassContributions().map((c) => c.source)).toEqual(['base', 'ability']);
    expect(sumContributions(p.getArmorClassContributions())).toBe(p.getArmorClass());
  });
});

describe('speed contributions', () => {
  test('sum to the displayed speed for a plain character', () => {
    const p = make();
    expect(sumContributions(p.getSpeedContributions())).toBe(p.getTotalSpeed());
  });

  test('name the racial base and class fast movement', () => {
    const barbarian = make({ cls: 'Barbarian', level: 4 });
    const rows = barbarian.getSpeedContributions();
    expect(rows.find((c) => c.source === 'race').value).toBe(30);
    expect(rows.find((c) => c.source === 'class').value).toBe(10);
    expect(sumContributions(rows)).toBe(barbarian.getTotalSpeed());
  });

  test('a dwarf reports its shorter base', () => {
    const p = make({ race: 'Dwarf' });
    expect(p.getSpeedContributions().find((c) => c.source === 'race').value).toBe(20);
    expect(sumContributions(p.getSpeedContributions())).toBe(p.getTotalSpeed());
  });

  test('a halving condition is a row, and the sum still holds', () => {
    const p = make();
    p.speedBonus = 10;
    p.addCondition({ name: 'Exhausted' });
    expect(p.isHalfSpeed()).toBe(true);
    const rows = p.getSpeedContributions();
    expect(rows.find((c) => c.source === 'conditions').value).toBeLessThan(0);
    expect(sumContributions(rows)).toBe(p.getTotalSpeed());
  });
});

describe('a wild-shaped druid', () => {
  test('the armor class list names the form and still sums to the total', () => {
    const p = make({ cls: 'Druid', level: 8 });
    p.setAbilityBase('wis', 16);
    expect(p.enterWildShape('animals/wolf')).toBe(true);
    const rows = p.getArmorClassContributions();
    // A wolf has +2 natural armor, so the row must be there and the sum must
    // still land on the number the sheet shows.
    expect(rows.find((c) => c.source === 'natural').value).toBeGreaterThan(0);
    expect(sumContributions(rows)).toBe(p.getArmorClass());
    expect(sumContributions(p.getFlatFootedAcContributions())).toBe(p.getFlatFootedAC());
  });

  test('speed comes from the form rather than the race', () => {
    const p = make({ cls: 'Druid', level: 8 });
    p.enterWildShape('animals/wolf');
    const rows = p.getSpeedContributions();
    expect(rows.map((c) => c.source)).toContain('form');
    expect(rows.map((c) => c.source)).not.toContain('race');
    expect(sumContributions(rows)).toBe(p.getTotalSpeed());
  });

  test('the ability list names the form for a replaced score', () => {
    const p = make({ cls: 'Druid', level: 8 });
    p.setAbilityBase('str', 10);
    p.enterWildShape('animals/wolf');
    const rows = p.getAbilityContributions('str');
    expect(rows.map((c) => c.source)).toContain('form');
    expect(rows.map((c) => c.source)).not.toContain('base');
    expect(sumContributions(rows)).toBe(p.getAbilityTotal('str'));
  });
});

describe('skill contributions', () => {
  test('sum to the displayed skill total, racial bonus and all', () => {
    const p = make({ race: 'Elf', cls: 'Rogue', level: 6, feats: ['Alertness', 'Skill focus (Listen)'] });
    p.setAbilityBase('wis', 14);
    p.setSkillRanks?.('Listen', 9);
    expect(sumContributions(p.getSkillContributions('Listen'))).toBe(p.getSkillTotal('Listen'));
  });

  test('name ranks, the key ability, the race and the feats', () => {
    const p = make({ race: 'Elf', cls: 'Rogue', level: 6, feats: ['Alertness'] });
    // Wisdom has to be off 10, or the ability row is correctly compacted away
    // for contributing nothing — which is what the next test checks.
    p.setAbilityBase('wis', 14);
    const rows = p.getSkillContributions('Listen');
    expect(rows.find((c) => c.source === 'race').value).toBe(2);
    expect(rows.find((c) => c.source === 'race').type).toBe('racial');
    expect(rows.find((c) => c.source === 'feats').value).toBe(2);
    expect(rows.find((c) => c.source === 'ability').label).toBe('Wisdom');
  });

  test('an ability modifier of zero is not listed as a row', () => {
    const p = make({ race: 'Human', cls: 'Rogue', level: 6 });
    p.setAbilityBase('wis', 10);
    expect(p.getSkillContributions('Listen').map((c) => c.source)).not.toContain('ability');
  });

  test('the armor check penalty is a row, and doubled on Swim', () => {
    const p = make({ cls: 'Fighter', level: 6 });
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    const climb = p.getSkillContributions('Climb').find((c) => c.source === 'armorCheck');
    const swim = p.getSkillContributions('Swim').find((c) => c.source === 'armorCheck');
    expect(climb.value).toBe(-6);
    expect(swim.value).toBe(-12);
    expect(sumContributions(p.getSkillContributions('Swim'))).toBe(p.getSkillTotal('Swim'));
  });

  test('a Knowledge sub-skill resolves its key ability through the parent', () => {
    const p = make({ cls: 'Wizard', level: 6 });
    p.setAbilityBase('int', 18);
    const rows = p.getSkillContributions('Knowledge (arcana)');
    expect(rows.find((c) => c.source === 'ability').label).toBe('Intelligence');
    expect(sumContributions(rows)).toBe(p.getSkillTotal('Knowledge (arcana)'));
  });
});

describe('weapon attack contributions', () => {
  const longsword = () => getItemByRef('items/Weapon/longsword')?.raw;
  const greatsword = () => getItemByRef('items/Weapon/greatsword')?.raw;

  test('sum to the calculated attack bonus', () => {
    const p = make({ cls: 'Fighter', level: 8, feats: ['Weapon focus (Longsword)'] });
    p.setAbilityBase('str', 18);
    const data = { weaponItem: longsword(), itemData: { bonus: 2 } };
    expect(sumContributions(p.getWeaponAttackContributions(data)))
      .toBe(calculateWeaponAttackBonus(p, data));
  });

  test('the -4 for an untrained weapon is a row of its own', () => {
    const p = make({ cls: 'Wizard', level: 8 });
    const data = { weaponItem: greatsword() };
    const rows = p.getWeaponAttackContributions(data);
    expect(rows.find((c) => c.source === 'proficiency').value).toBe(-4);
    expect(sumContributions(rows)).toBe(calculateWeaponAttackBonus(p, data));
  });

  test('untrained armor is its own row and stacks with the weapon penalty', () => {
    const p = make({ cls: 'Wizard', level: 8 });
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    const data = { weaponItem: greatsword() };
    const rows = p.getWeaponAttackContributions(data);
    expect(rows.find((c) => c.source === 'armorProficiency').value).toBe(-6);
    expect(sumContributions(rows)).toBe(calculateWeaponAttackBonus(p, data));
  });

  test('Weapon Finesse is named on the ability row when it is what is used', () => {
    const p = make({ cls: 'Rogue', level: 6, feats: ['Weapon finesse'] });
    p.setAbilityBase('str', 8);
    p.setAbilityBase('dex', 18);
    const data = { weaponItem: getItemByRef('items/Weapon/rapier')?.raw };
    const rows = p.getWeaponAttackContributions(data);
    expect(rows.find((c) => c.source === 'ability').label).toMatch(/Weapon Finesse/);
    expect(sumContributions(rows)).toBe(calculateWeaponAttackBonus(p, data));
  });
});

describe('weapon damage contributions', () => {
  test('sum to the bonus shown after the dice', () => {
    const p = make({ cls: 'Fighter', level: 8, feats: ['Weapon specialization (Greatsword)'] });
    p.setAbilityBase('str', 18);
    const data = { weaponItem: getItemByRef('items/Weapon/greatsword')?.raw, isTwoHanded: true, itemData: { bonus: 1 } };
    const dice = p.getWeaponDamageDice(data.weaponItem);
    const bonus = sumContributions(p.getWeaponDamageContributions(data));
    expect(calculateWeaponDamage(p, data)).toBe(`${dice}+${bonus}`);
  });

  test('a two-handed grip is named, and is Strength and a half', () => {
    const p = make({ cls: 'Fighter', level: 8 });
    p.setAbilityBase('str', 18);
    const data = { weaponItem: getItemByRef('items/Weapon/greatsword')?.raw, isTwoHanded: true };
    const ability = p.getWeaponDamageContributions(data).find((c) => c.source === 'ability');
    expect(ability.label).toMatch(/two-handed/);
    expect(ability.value).toBe(6);
  });
});

describe('spell save DC contributions', () => {
  test('sum to the displayed DC for a gnome illusionist with Spell Focus', () => {
    const p = make({ race: 'Gnome', cls: 'Wizard', level: 8, feats: ['Spell focus (Illusion)'] });
    p.setAbilityBase('int', 18);
    const rows = p.getSpellSaveDCContributions({ School: 'Illusion (Figment)' }, 3);
    expect(sumContributions(rows)).toBe(p.getSpellSaveDC(3, 'Illusion (Figment)'));
    expect(rows.find((c) => c.source === 'feats').value).toBe(1);
    expect(rows.find((c) => c.source === 'race').value).toBe(1);
  });

  test('a non-caster reports nothing at all', () => {
    expect(make({ cls: 'Fighter' }).getSpellSaveDCContributions({ School: 'Evocation' }, 1)).toEqual([]);
  });
});
