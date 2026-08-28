import {
  BONUS_TYPES,
  contribution,
  situational,
  sumContributions,
  compactContributions,
} from './contributions';

/* The breakdown box lives or dies on one invariant: the rows it shows must add
   up to the number beside them. These check the arithmetic and the two things
   that could quietly break it — an unrecognised bonus type, and a situational
   entry leaking into a list that gets summed. */

describe('the contribution record', () => {
  test('carries source, label, signed value and type', () => {
    expect(contribution('armor', 'chain shirt', 4, BONUS_TYPES.ARMOR)).toEqual({
      source: 'armor',
      label: 'chain shirt',
      type: 'armor',
      value: 4,
    });
  });

  test('a negative value is kept as a negative', () => {
    expect(contribution('encumbrance', 'heavy load', -6).value).toBe(-6);
  });

  test('defaults to untyped, which is the common case and always stacks', () => {
    expect(contribution('toughness', 'Toughness', 3).type).toBe('');
    expect(BONUS_TYPES.UNTYPED).toBe('');
  });

  test('an unrecognised type is stored untyped rather than passed through', () => {
    // A typo must not invent a bonus type, because the stacking rules would
    // then have to reason about a type that does not exist in the game.
    expect(contribution('x', 'x', 1, 'enhancment').type).toBe('');
    expect(contribution('x', 'x', 1, 'dodge').type).toBe('dodge');
  });

  test('a non-numeric value becomes zero rather than NaN', () => {
    expect(contribution('x', 'x', undefined).value).toBe(0);
    expect(contribution('x', 'x', 'four').value).toBe(0);
  });
});

describe('the situational record', () => {
  test('carries a note and deliberately no value at all', () => {
    const entry = situational('dwarfPoison', 'Hardy', '+2 on saves against poison');
    expect(entry).toEqual({
      source: 'dwarfPoison',
      label: 'Hardy',
      note: '+2 on saves against poison',
    });
    expect('value' in entry).toBe(false);
  });
});

describe('summing a list', () => {
  test('adds the signed values', () => {
    const list = [
      contribution('base', 'base', 10),
      contribution('dex', 'Dexterity', 3),
      contribution('armor', 'chain shirt', 4, BONUS_TYPES.ARMOR),
      contribution('encumbrance', 'armor check', -2),
    ];
    expect(sumContributions(list)).toBe(15);
  });

  test('a situational entry mixed in cannot corrupt the total', () => {
    const list = [
      contribution('base', 'base', 10),
      situational('giants', 'Defensive Training', '+4 dodge AC against giants'),
      contribution('dex', 'Dexterity', 3),
    ];
    expect(sumContributions(list)).toBe(13);
  });

  test('an empty or missing list is zero, not NaN', () => {
    expect(sumContributions([])).toBe(0);
    expect(sumContributions(undefined)).toBe(0);
    expect(sumContributions(null)).toBe(0);
  });
});

describe('compacting a list', () => {
  test('drops the rows that say nothing', () => {
    const list = [
      contribution('base', 'base', 10),
      contribution('shield', 'no shield', 0),
      contribution('dex', 'Dexterity', 3),
    ];
    const compact = compactContributions(list);
    expect(compact.map((c) => c.source)).toEqual(['base', 'dex']);
    // Dropping a zero must never change what the list adds up to.
    expect(sumContributions(compact)).toBe(sumContributions(list));
  });

  test('keeps a negative, which is not the same as nothing', () => {
    const list = [contribution('acp', 'armor check penalty', -2)];
    expect(compactContributions(list)).toHaveLength(1);
  });
});
