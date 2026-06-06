import Player from './player';
import { sumContributions } from './conditionEffects';
import { calculateWeaponAttackBonus, calculateWeaponDamage } from '../utils';

const MELEE_SWORD = { Subtype: 'Melee', Name: 'longsword', 'Dmg (M)': '1d8' };

function make(cls = 'Fighter', race = 'Human') {
  const p = new Player();
  p.setRace(race);
  p.setClass(cls);
  return p;
}

describe('Player condition aggregation (wiring)', () => {
  test('getConditionModifiers returns labeled contributions', () => {
    const p = make();
    p.addCondition({ name: 'Shaken' });
    const mods = p.getConditionModifiers();
    expect(sumContributions(mods.saves)).toBe(-2);
    mods.saves.forEach((c) => {
      expect(typeof c.source).toBe('string');
      expect(typeof c.label).toBe('string');
      expect(typeof c.value).toBe('number');
    });
  });

  test('a condition that is both manual and derived is counted once', () => {
    const p = make();
    p.addCondition({ name: 'Paralyzed' }); // zeroes Dex+Str via score channel
    const active = p.getActiveConditions();
    expect(active.filter((c) => c.name === 'Paralyzed')).toHaveLength(1);
    // Paralyzed zeroes Str too, so Helpless is also derived.
    expect(active.some((c) => c.name === 'Helpless')).toBe(true);
  });

  test('getDerivedConditions includes ability-0 cascade (Con 0 -> Dead)', () => {
    const p = make();
    p.addCondition({ name: 'Ability Drained', ability: 'Con', amount: 10 });
    const names = p.getDerivedConditions().map((c) => c.name);
    expect(names).toContain('Dead');
  });

  test('getDerivedConditions is idempotent (no recursion / stable output)', () => {
    const p = make();
    p.addCondition({ name: 'Ability Drained', ability: 'Dex', amount: 10 });
    const first = p.getDerivedConditions().map((c) => c.name).sort();
    const second = p.getDerivedConditions().map((c) => c.name).sort();
    expect(second).toEqual(first);
    expect(first).toContain('Paralyzed');
  });

  test('conditionAdjustedAbilityTotal applies score-channel deltas', () => {
    const p = make();
    const before = p.conditionAdjustedAbilityTotal('str');
    p.addCondition({ name: 'Fatigued' });
    expect(p.conditionAdjustedAbilityTotal('str')).toBe(before - 2);
    expect(p.conditionAdjustedAbilityTotal('dex')).toBe(before - 2);
  });

  test('score channel excludes ability-0-derived status (no feedback loop)', () => {
    const p = make();
    // Drain Str to 0 -> derived Helpless. Helpless must NOT then zero Dex.
    p.addCondition({ name: 'Ability Drained', ability: 'Str', amount: 10 });
    expect(p.getDerivedConditions().some((c) => c.name === 'Helpless')).toBe(true);
    expect(p.conditionAdjustedAbilityTotal('dex')).toBe(10); // Dex untouched
  });
});

describe('Player score channel via getAbilityTotal', () => {
  test('Fatigued lowers Str and Dex modifiers by the -2 score delta', () => {
    const p = make();
    p.abilities.str.base = 14; // +2
    p.abilities.dex.base = 14; // +2
    expect(p.getStrMod()).toBe(2);
    p.addCondition({ name: 'Fatigued' });
    expect(p.getStrMod()).toBe(1); // 12 -> +1
    expect(p.getDexMod()).toBe(1);
  });

  test('Exhausted supersedes Fatigued (-6, not -8)', () => {
    const p = make();
    p.abilities.str.base = 14; // +2
    p.addCondition({ name: 'Fatigued' });
    p.addCondition({ name: 'Exhausted' });
    expect(p.getStrMod()).toBe(-1); // 14 - 6 = 8 -> -1
  });

  test('Ability Drained reduces only the chosen ability total', () => {
    const p = make();
    p.abilities.con.base = 14;
    p.addCondition({ name: 'Ability Drained', ability: 'Con', amount: 4 });
    expect(p.getAbilityTotal('con')).toBe(10);
    expect(p.getAbilityTotal('str')).toBe(10); // untouched
  });

  test('Paralyzed zeroes Dex and cascades into Reflex save and AC', () => {
    const p = make();
    p.addCondition({ name: 'Paralyzed' });
    expect(p.getDexMod()).toBe(-5); // Dex 0
    expect(p.getReflexSave()).toBe(-5); // Fighter poor Reflex base 0 + (-5)
    expect(p.getArmorClass()).toBe(5); // 10 + (-5), no armor
  });

  test('getAbilityConditionContributions returns labeled entries', () => {
    const p = make();
    p.addCondition({ name: 'Fatigued' });
    const contribs = p.getAbilityConditionContributions('str');
    expect(contribs.length).toBeGreaterThan(0);
    expect(contribs[0]).toHaveProperty('source');
    expect(contribs[0]).toHaveProperty('value');
  });
});

describe('Player roll channels (attack, damage, saves, initiative)', () => {
  test('Shaken applies -2 to attack and all three saves', () => {
    const p = make();
    p.addCondition({ name: 'Shaken' });
    expect(p.getAttackConditionModifier()).toBe(-2);
    expect(p.getSaveConditionModifier()).toBe(-2);
    expect(p.getFortitudeSave()).toBe(0); // Fighter L1 high fort 2 + con 0 - 2
    expect(p.getReflexSave()).toBe(-2);
    expect(p.getWillSave()).toBe(-2);
  });

  test('Panicked penalizes saves but not attack', () => {
    const p = make();
    p.addCondition({ name: 'Panicked' });
    expect(p.getSaveConditionModifier()).toBe(-2);
    expect(p.getAttackConditionModifier()).toBe(0);
  });

  test('Invisible grants +2 to attack', () => {
    const p = make();
    p.addCondition({ name: 'Invisible' });
    expect(p.getAttackConditionModifier()).toBe(2);
  });

  test('Sickened reduces weapon attack and damage by 2', () => {
    const p = make();
    const wd = { weaponItem: MELEE_SWORD };
    const atkBefore = calculateWeaponAttackBonus(p, wd);
    const dmgBefore = calculateWeaponDamage(p, wd);
    p.addCondition({ name: 'Sickened' });
    expect(calculateWeaponAttackBonus(p, wd)).toBe(atkBefore - 2);
    expect(calculateWeaponDamage(p, wd)).toBe('1d8-2');
    expect(dmgBefore).toBe('1d8');
  });

  test('Deafened applies -4 to initiative', () => {
    const p = make();
    const before = p.getInitiativeModifier();
    p.addCondition({ name: 'Deafened' });
    expect(p.getInitiativeModifier()).toBe(before - 4);
  });

  test('Energy Drained applies -N to attack and saves', () => {
    const p = make();
    p.addCondition({ name: 'Energy Drained', amount: 3 });
    expect(p.getAttackConditionModifier()).toBe(-3);
    expect(p.getSaveConditionModifier()).toBe(-3);
  });

  test('getBaseAttackBonus is unaffected by conditions', () => {
    const p = make();
    const before = p.getBaseAttackBonus();
    p.addCondition({ name: 'Shaken' });
    p.addCondition({ name: 'Energy Drained', amount: 2 });
    expect(p.getBaseAttackBonus()).toBe(before);
  });
});

describe('Player AC / speed / HP channels', () => {
  test('Flat-Footed denies the Dex bonus to general and touch AC only', () => {
    const p = make();
    p.abilities.dex.base = 14; // +2
    expect(p.getArmorClass()).toBe(12);
    expect(p.getContactAC()).toBe(12);
    expect(p.getFlatFootedAC()).toBe(10);
    p.addCondition({ name: 'Flat-Footed' });
    expect(p.getArmorClass()).toBe(10); // Dex bonus denied, no flat penalty
    expect(p.getContactAC()).toBe(10);
    expect(p.getFlatFootedAC()).toBe(10); // already had no Dex; no penalty
  });

  test('Blinded denies Dex to AC and applies its -2 to all three AC values', () => {
    const p = make();
    p.abilities.dex.base = 14; // +2
    p.addCondition({ name: 'Blinded' });
    // general/touch: lose +2 Dex AND -2 penalty => 12 -> 8
    expect(p.getArmorClass()).toBe(8);
    expect(p.getContactAC()).toBe(8);
    // flat-footed: no Dex to lose, but the -2 AC penalty still applies => 10 -> 8
    expect(p.getFlatFootedAC()).toBe(8);
  });

  test('AC flat penalties stack (Blinded + Stunned)', () => {
    const p = make();
    p.addCondition({ name: 'Blinded' });
    p.addCondition({ name: 'Stunned' });
    expect(p.getAcConditionModifier()).toBe(-4);
  });

  test('Energy Drained reduces max HP by 5 per negative level', () => {
    const p = make();
    const before = p.getMaxLife();
    p.addCondition({ name: 'Energy Drained', amount: 2 });
    expect(p.getMaxLife()).toBe(before - 10);
  });

  test('half-speed applies once and does not compound across sources', () => {
    const p = make(); // Human Fighter: 30 ft
    expect(p.getTotalSpeed()).toBe(30);
    p.addCondition({ name: 'Exhausted' });
    expect(p.getTotalSpeed()).toBe(15);
    p.addCondition({ name: 'Entangled' }); // second half-speed source
    expect(p.getTotalSpeed()).toBe(15); // halved once, not quartered
  });
});

describe('Player skill channel granularity', () => {
  test('global skill penalty (Shaken) hits every skill', () => {
    const p = make();
    expect(p.getSkillConditionModifier('Climb')).toBe(0);
    p.addCondition({ name: 'Shaken' });
    expect(p.getSkillConditionModifier('Climb')).toBe(-2);
    expect(p.getSkillConditionModifier('Spot')).toBe(-2);
    expect(p.getSkillConditionModifier('Concentration')).toBe(-2);
  });

  test('Energy Drained applies -N to every skill', () => {
    const p = make();
    p.addCondition({ name: 'Energy Drained', amount: 2 });
    expect(p.getSkillConditionModifier('Spot')).toBe(-2);
    expect(p.getSkillConditionModifier('Climb')).toBe(-2);
  });

  test('Blinded scopes -4 to Str/Dex skills and Search only', () => {
    const p = make();
    p.addCondition({ name: 'Blinded' });
    expect(p.getSkillConditionModifier('Climb')).toBe(-4); // Str-based
    expect(p.getSkillConditionModifier('Hide')).toBe(-4); // Dex-based
    expect(p.getSkillConditionModifier('Search')).toBe(-4); // by name
    expect(p.getSkillConditionModifier('Spot')).toBe(0); // Wis; vision auto-fail is display-only
    expect(p.getSkillConditionModifier('Concentration')).toBe(0); // Con
  });

  test('Dazzled scopes -1 to Search and Spot only', () => {
    const p = make();
    p.addCondition({ name: 'Dazzled' });
    expect(p.getSkillConditionModifier('Search')).toBe(-1);
    expect(p.getSkillConditionModifier('Spot')).toBe(-1);
    expect(p.getSkillConditionModifier('Climb')).toBe(0);
  });

  test('getSkillTotal folds in the condition modifier on top of the rest', () => {
    const p = make();
    const before = p.getSkillTotal('Climb');
    p.addCondition({ name: 'Shaken' });
    expect(p.getSkillTotal('Climb')).toBe(before - 2);
  });
});
