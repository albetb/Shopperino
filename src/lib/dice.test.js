import {
  DICE_MULTIPLIERS,
  DICE_TYPES,
  DEFAULT_MULTIPLIER_MASK,
  diceCountFromMask,
  formatRollLabel,
  isMultiplierSelected,
  normalizeMultiplierMask,
  rollDice,
  rollDie,
  rollFromTuple,
  rollToTuple,
  selectedMultiplierIndices,
  toggleMultiplier,
} from './dice';

describe('the count-button selection', () => {
  test('only "+1" is selected by default', () => {
    expect(selectedMultiplierIndices(DEFAULT_MULTIPLIER_MASK)).toEqual([0]);
    expect(diceCountFromMask(DEFAULT_MULTIPLIER_MASK)).toBe(1);
  });

  test('the pressed buttons add up', () => {
    // Indices: 0 = +1, 1 = +2, 4 = +5. The first press clears the resting +1,
    // so +5 then +2 is seven dice.
    let mask = DEFAULT_MULTIPLIER_MASK;
    mask = toggleMultiplier(mask, 4);   // press +5
    mask = toggleMultiplier(mask, 1);   // press +2
    expect(diceCountFromMask(mask)).toBe(7);

    // +1 is now one button among others, so pressing it adds rather than resets.
    mask = toggleMultiplier(mask, 0);
    expect(isMultiplierSelected(mask, 0)).toBe(true);
    expect(diceCountFromMask(mask)).toBe(8);
  });

  test('the resting "+1" is replaced by the first other button pressed', () => {
    // The reason the rule exists: ten dice should be one tap, not "+10" and
    // then "+1" again to clear it.
    const ten = toggleMultiplier(DEFAULT_MULTIPLIER_MASK, 5);   // press +10
    expect(diceCountFromMask(ten)).toBe(10);
    expect(isMultiplierSelected(ten, 0)).toBe(false);

    // Pressing +1 afterwards is a deliberate pick, so it adds: eleven dice.
    const eleven = toggleMultiplier(ten, 0);
    expect(diceCountFromMask(eleven)).toBe(11);

    // The replacement only applies to a lone "+1" — a real selection still adds.
    const two = toggleMultiplier(DEFAULT_MULTIPLIER_MASK, 1);   // {+2}
    const twoAndOne = toggleMultiplier(two, 0);                 // {+2, +1}
    expect(diceCountFromMask(toggleMultiplier(twoAndOne, 5))).toBe(13);
  });

  test('"+1" cannot be released while it is the only one pressed', () => {
    // There is no empty state to fall into, so the press is a no-op.
    const mask = toggleMultiplier(DEFAULT_MULTIPLIER_MASK, 0);
    expect(isMultiplierSelected(mask, 0)).toBe(true);
    expect(diceCountFromMask(mask)).toBe(1);
  });

  test('every button can be pressed at once', () => {
    const all = DICE_MULTIPLIERS.reduce((m, _, i) => m | (1 << i), 0);
    expect(diceCountFromMask(all)).toBe(DICE_MULTIPLIERS.reduce((a, b) => a + b, 0));
  });

  test('pressing a button twice releases it', () => {
    const pressed = toggleMultiplier(DEFAULT_MULTIPLIER_MASK, 5);
    expect(isMultiplierSelected(pressed, 5)).toBe(true);
    const released = toggleMultiplier(pressed, 5);
    expect(isMultiplierSelected(released, 5)).toBe(false);
  });

  test('releasing the last pressed button falls back to "+1"', () => {
    // An empty selection would roll no dice, so it is not reachable.
    const empty = toggleMultiplier(DEFAULT_MULTIPLIER_MASK, 0);
    expect(empty).toBe(DEFAULT_MULTIPLIER_MASK);
    expect(diceCountFromMask(empty)).toBe(1);
  });

  test('the count is never zero, whatever is stored', () => {
    expect(diceCountFromMask(0)).toBe(1);
    expect(diceCountFromMask(null)).toBe(1);
    expect(diceCountFromMask(undefined)).toBe(1);
  });

  test('bits belonging to no button are discarded', () => {
    // Stored junk must not silently widen a roll.
    const junk = 1 | (1 << 20);
    expect(normalizeMultiplierMask(junk)).toBe(1);
    expect(normalizeMultiplierMask(0)).toBe(DEFAULT_MULTIPLIER_MASK);
    expect(normalizeMultiplierMask('nonsense')).toBe(DEFAULT_MULTIPLIER_MASK);
  });
});

describe('rolling', () => {
  test('a die stays within its faces', () => {
    DICE_TYPES.forEach((sides) => {
      for (let i = 0; i < 200; i += 1) {
        const value = rollDie(sides);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(sides);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  test('every face of a d6 comes up over many rolls', () => {
    const seen = new Set();
    for (let i = 0; i < 500; i += 1) seen.add(rollDie(6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('a roll returns one value per die and their sum', () => {
    const roll = rollDice(6, 5);
    expect(roll.sides).toBe(6);
    expect(roll.rolls).toHaveLength(5);
    expect(roll.total).toBe(roll.rolls.reduce((a, b) => a + b, 0));
  });

  test('a count below one still rolls a single die', () => {
    expect(rollDice(20, 0).rolls).toHaveLength(1);
    expect(rollDice(20, -3).rolls).toHaveLength(1);
  });

  test('rolls are not seeded — two rolls of many dice differ', () => {
    // The shop generator is deliberately reproducible; this must not be.
    const a = rollDice(100, 20).rolls.join(',');
    const b = rollDice(100, 20).rolls.join(',');
    expect(a).not.toBe(b);
  });
});

describe('the stored roll', () => {
  test('a roll round-trips through its tuple', () => {
    const roll = rollDice(8, 4);
    const restored = rollFromTuple(rollToTuple(roll));
    expect(restored).toEqual(roll);
  });

  test('the tuple is [sides, ...rolls] and stores no total', () => {
    const tuple = rollToTuple({ sides: 6, rolls: [2, 5], total: 7 });
    expect(tuple).toEqual([6, 2, 5]);
  });

  test('the total is recomputed rather than trusted', () => {
    expect(rollFromTuple([6, 2, 5]).total).toBe(7);
  });

  test('an absent or malformed tuple reads as no roll', () => {
    expect(rollFromTuple([])).toBe(null);
    expect(rollFromTuple(null)).toBe(null);
    expect(rollFromTuple([6])).toBe(null);      // sides but no dice
    expect(rollFromTuple('nonsense')).toBe(null);
  });

  test('an empty roll produces an empty tuple, which compacts away', () => {
    expect(rollToTuple(null)).toEqual([]);
    expect(rollToTuple({ sides: 6, rolls: [] })).toEqual([]);
  });
});

describe('the roll label', () => {
  test('reads the way it is said at the table', () => {
    expect(formatRollLabel({ sides: 6, rolls: [1, 2, 3] })).toBe('3d6');
    expect(formatRollLabel({ sides: 20, rolls: [11] })).toBe('1d20');
  });

  test('no roll has no label', () => {
    expect(formatRollLabel(null)).toBe('');
  });
});
