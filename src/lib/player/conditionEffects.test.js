import { aggregateConditionEffects, sumContributions } from './conditionEffects';

describe('aggregateConditionEffects', () => {
  test('every contribution has the { source, label, value } shape', () => {
    const out = aggregateConditionEffects([
      { name: 'Shaken' },
      { name: 'Ability Drained', ability: 'Str', amount: 2 },
      { name: 'Energy Drained', amount: 1 },
    ]);
    const lists = [
      out.attack, out.damage, out.saves, out.skillsAll, out.abilityChecks,
      out.initiative, out.ac, out.hp, ...Object.values(out.ability),
    ];
    lists.flat().forEach((c) => {
      expect(typeof c.source).toBe('string');
      expect(typeof c.label).toBe('string');
      expect(typeof c.value).toBe('number');
    });
  });

  test('fear ladder takes only the most severe, not the sum', () => {
    const out = aggregateConditionEffects([
      { name: 'Shaken' },
      { name: 'Frightened' },
      { name: 'Panicked' },
    ]);
    // Most severe (Panicked) only — saves get a single -2, sourced from Panicked.
    expect(sumContributions(out.saves)).toBe(-2);
    expect(out.saves).toHaveLength(1);
    expect(out.saves[0].source).toBe('Panicked');
    // Panicked imposes no attack penalty.
    expect(sumContributions(out.attack)).toBe(0);
  });

  test('Shaken alone (no other fear) still applies its attack penalty', () => {
    const out = aggregateConditionEffects([{ name: 'Shaken' }]);
    expect(sumContributions(out.attack)).toBe(-2);
    expect(sumContributions(out.saves)).toBe(-2);
    expect(sumContributions(out.skillsAll)).toBe(-2);
  });

  test('fatigue ladder supersedes (Exhausted over Fatigued)', () => {
    const out = aggregateConditionEffects([
      { name: 'Fatigued' },
      { name: 'Exhausted' },
    ]);
    expect(sumContributions(out.ability.str)).toBe(-6);
    expect(sumContributions(out.ability.dex)).toBe(-6);
    expect(out.halfSpeed.length).toBeGreaterThan(0);
  });

  test('untyped penalties from different conditions stack', () => {
    const out = aggregateConditionEffects([
      { name: 'Shaken' },
      { name: 'Sickened' },
    ]);
    expect(sumContributions(out.saves)).toBe(-4);
    expect(sumContributions(out.attack)).toBe(-4);
    // Sickened also hits weapon damage; Shaken does not.
    expect(sumContributions(out.damage)).toBe(-2);
  });

  test('lose-Dex-to-AC collapses to a single applied flag from many sources', () => {
    const out = aggregateConditionEffects([
      { name: 'Flat-Footed' },
      { name: 'Blinded' },
      { name: 'Stunned' },
    ]);
    expect(out.loseDexToAC.length).toBeGreaterThan(0);
    // The AC flat penalty still stacks (Blinded -2 + Stunned -2).
    expect(sumContributions(out.ac)).toBe(-4);
  });

  test('ability damage and drain to the same ability sum', () => {
    const out = aggregateConditionEffects([
      { name: 'Ability Damaged', ability: 'Str', amount: 2 },
      { name: 'Ability Drained', ability: 'Str', amount: 3 },
    ]);
    expect(sumContributions(out.ability.str)).toBe(-5);
    expect(sumContributions(out.ability.dex)).toBe(0);
  });

  test('Energy Drained applies -N to rolls and -5N to HP', () => {
    const out = aggregateConditionEffects([{ name: 'Energy Drained', amount: 2 }]);
    expect(sumContributions(out.attack)).toBe(-2);
    expect(sumContributions(out.saves)).toBe(-2);
    expect(sumContributions(out.skillsAll)).toBe(-2);
    expect(sumContributions(out.hp)).toBe(-10);
  });

  test('Paralyzed zeroes Str and Dex; Helpless zeroes Dex only', () => {
    const par = aggregateConditionEffects([{ name: 'Paralyzed' }]);
    expect(par.abilityZero.dex.length).toBeGreaterThan(0);
    expect(par.abilityZero.str.length).toBeGreaterThan(0);
    const help = aggregateConditionEffects([{ name: 'Helpless' }]);
    expect(help.abilityZero.dex.length).toBeGreaterThan(0);
    expect(help.abilityZero.str.length).toBe(0);
  });

  test('Blinded scopes its -4 skill penalty to Str/Dex skills and Search', () => {
    const out = aggregateConditionEffects([{ name: 'Blinded' }]);
    const special = out.skillSpecial.find((s) => s.source === 'Blinded');
    expect(special.value).toBe(-4);
    expect(special.abilities).toEqual(['str', 'dex']);
    expect(special.names).toEqual(['Search']);
  });

  test('empty / unknown input yields an empty result', () => {
    const out = aggregateConditionEffects([{ name: 'Confused' }, { name: 'Nope' }]);
    expect(sumContributions(out.attack)).toBe(0);
    expect(sumContributions(out.saves)).toBe(0);
    expect(out.loseDexToAC).toHaveLength(0);
  });
});
