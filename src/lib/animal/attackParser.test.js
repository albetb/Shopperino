import { parseAttacks, recomputeAttack } from './attackParser';

describe('parseAttacks', () => {
  test('single attack with damage', () => {
    expect(parseAttacks('Bite +12 melee (2d6+12)')).toEqual([
      { name: 'Bite', count: 1, bonus: 12, damage: '2d6+12', type: 'primary' },
    ]);
  });

  test('primary group + secondary (joined by "and")', () => {
    const lines = parseAttacks('2 claws +7 melee (1d6+5) and bite +2 melee (1d6+2)');
    expect(lines).toHaveLength(2);
    const claws = lines.find((l) => l.name === 'claws');
    const bite = lines.find((l) => l.name === 'bite');
    expect(claws).toMatchObject({ count: 2, bonus: 7, type: 'primary', damage: '1d6+5' });
    expect(bite).toMatchObject({ bonus: 2, type: 'secondary', damage: '1d6+2' });
  });

  test('"or" alternative forms are both primary', () => {
    const lines = parseAttacks('Bite +6 melee (1d8+6) or tail slap +6 melee (1d12+6)');
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.type === 'primary')).toBe(true);
  });

  test('attack with a rider keeps the "plus" text', () => {
    const lines = parseAttacks('Bite +4 melee (1d4 plus poison)');
    expect(lines[0].damage).toBe('1d4 plus poison');
  });

  test('empty / dash strings produce no lines', () => {
    expect(parseAttacks('-')).toEqual([]);
    expect(parseAttacks('')).toEqual([]);
    expect(parseAttacks(null)).toEqual([]);
  });

  test('attack with no parenthesised damage', () => {
    expect(parseAttacks('Bite +6 melee')).toEqual([
      { name: 'Bite', count: 1, bonus: 6, damage: null, type: 'primary' },
    ]);
  });
});

describe('recomputeAttack', () => {
  test('primary line: bonus += (bab+str+size) delta, damage += full str delta', () => {
    const line = { name: 'Bite', count: 1, bonus: 3, damage: '1d6+1', type: 'primary' };
    const out = recomputeAttack(line, { babDelta: 5, strModDelta: 2, sizeModDelta: 0 });
    expect(out.bonus).toBe(10); // 3 + 5 + 2 + 0
    expect(out.damage).toBe('1d6+3'); // +1 + 2
  });

  test('secondary line: bonus uses full deltas, damage uses half str delta', () => {
    const line = { name: 'bite', count: 1, bonus: 2, damage: '1d6+2', type: 'secondary' };
    const out = recomputeAttack(line, { babDelta: 5, strModDelta: 4, sizeModDelta: 0 });
    expect(out.bonus).toBe(11); // 2 + 5 + 4 + 0 (attack bonus gets full str)
    expect(out.damage).toBe('1d6+4'); // +2 + floor(4/2) = +2 +2
  });

  test('size-mod delta adds to attack bonus only', () => {
    const line = { name: 'Claw', count: 2, bonus: 7, damage: '1d4+5', type: 'primary' };
    const out = recomputeAttack(line, { babDelta: 0, strModDelta: 0, sizeModDelta: 1 });
    expect(out.bonus).toBe(8);
    expect(out.damage).toBe('1d4+5'); // unchanged (no str delta)
  });

  test('damage rider is preserved through recompute', () => {
    const line = { name: 'Bite', count: 1, bonus: 4, damage: '1d4-1 plus poison', type: 'primary' };
    const out = recomputeAttack(line, { strModDelta: 2 });
    expect(out.damage).toBe('1d4+1 plus poison');
  });

  test('zero damage modifier and no dice handled', () => {
    const line = { name: 'Arms', count: 1, bonus: 4, damage: '0', type: 'primary' };
    const out = recomputeAttack(line, { strModDelta: 2 });
    expect(out.damage).toBe('2');
  });
});
