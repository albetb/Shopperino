import {
  POTION_EFFECTS,
  CONDITION_ONLY,
  resolvePotionEffect,
  getPotionByName,
  getPotionCasterLevel,
  getPotionSpellLevel,
  unclassifiedPotionLinks,
  gradeFromName,
  dicePerLevelBonus,
  parseDiceExpr,
  shiftSize,
  isOil,
} from './potionEffects';
import { loadFile } from '../loadFile';

/* What a potion does to the sheet.
 *
 * The rule that drives this file: a potion carries no description of its own.
 * Its `Link` is the spell's link, so the effect has to be stated per spell
 * rather than parsed out of prose that does not exist.
 */

const of = (name) => resolvePotionEffect(getPotionByName(name));

describe('every potion is accounted for', () => {
  test('nothing in items.json is left unclassified', () => {
    expect(unclassifiedPotionLinks()).toEqual([]);
  });

  test('all 107 resolve, and land in one of the four kinds', () => {
    const rows = loadFile('items').Potion;
    expect(rows).toHaveLength(107);
    const kinds = {};
    rows.forEach((row) => {
      const effect = resolvePotionEffect(row);
      expect(effect).toBeTruthy();
      kinds[effect.kind] = (kinds[effect.kind] || 0) + 1;
    });
    expect(kinds).toEqual({ heal: 3, buff: 37, oil: 18, cure: 7, condition: 42 });
  });

  test('every one of them finds its spell, so every one has effect text', () => {
    loadFile('items').Potion.forEach((row) => {
      expect(resolvePotionEffect(row).description).not.toBe('');
    });
  });

  test('a row with no link is not a potion', () => {
    expect(resolvePotionEffect({ Name: 'x' })).toBe(null);
    expect(resolvePotionEffect(null)).toBe(null);
  });
});

describe('which AC numbers a bonus reaches', () => {
  /* The classic AC bug, and the reason the groups are declared once in the
     module rather than per spell. */
  test('an armor bonus is denied to touch AC', () => {
    const { stats } = of('Potion of Mage armor');
    expect(stats.ac).toEqual([4, 'armor']);
    expect(stats.acFlat).toEqual([4, 'armor']);
    expect(stats.acTouch).toBeUndefined();
  });

  test('natural armor likewise', () => {
    const { stats } = of('Potion of Barkskin +3');
    expect(stats.ac).toEqual([3, 'natural']);
    expect(stats.acFlat).toEqual([3, 'natural']);
    expect(stats.acTouch).toBeUndefined();
  });

  test('a deflection bonus reaches all three', () => {
    const { stats } = of('Potion of Shield of faith +4');
    expect(stats.ac).toEqual([4, 'deflection']);
    expect(stats.acTouch).toEqual([4, 'deflection']);
    expect(stats.acFlat).toEqual([4, 'deflection']);
  });

  test('a dodge bonus is lost while flat-footed', () => {
    const { stats } = of('Potion of Haste');
    expect(stats.ac).toEqual([1, 'dodge']);
    expect(stats.acTouch).toEqual([1, 'dodge']);
    expect(stats.acFlat).toBeUndefined();
  });
});

describe('the graded families read their bonus off the name', () => {
  test('four barkskins share one link and differ only by grade', () => {
    [2, 3, 4, 5].forEach((n) => {
      const effect = of(`Potion of Barkskin +${n}`);
      expect(effect.link).toBe('barkskin');
      expect(effect.grade).toBe(n);
      expect(effect.stats.ac[0]).toBe(n);
    });
  });

  test('and five greater magic weapon oils do the same', () => {
    [1, 2, 3, 4, 5].forEach((n) => {
      const effect = of(`Oil of Greater magic weapon +${n}`);
      expect(effect.item.attack).toEqual([n, 'enhancement']);
      expect(effect.item.damage).toEqual([n, 'enhancement']);
    });
  });

  test('gradeFromName ignores a name with no grade', () => {
    expect(gradeFromName('Potion of Fly')).toBe(0);
    expect(gradeFromName('Oil of Magic vestment +3')).toBe(3);
  });
});

describe('caster level, which the item does not store', () => {
  /* Priced at CL x SL x 50 gp, so the level divides back out of Cost. */
  test('the three cure potions come out at 1st, 3rd and 5th', () => {
    expect(of('Potion of Cure light wounds').casterLevel).toBe(1);
    expect(of('Potion of Cure moderate wounds').casterLevel).toBe(3);
    expect(of('Potion of Cure serious wounds').casterLevel).toBe(5);
  });

  test('every potion gets a caster level of at least 1', () => {
    loadFile('items').Potion.forEach((row) => {
      expect(resolvePotionEffect(row).casterLevel).toBeGreaterThanOrEqual(1);
    });
  });

  test('a price that does not divide falls back to the minimum caster level', () => {
    // 2L - 1: the lowest level any class could cast it at.
    expect(getPotionCasterLevel({ Cost: 7 }, 3)).toBe(5);
    expect(getPotionCasterLevel({ Cost: 0 }, 0)).toBe(1);
  });

  test('with no spell level there is nothing to divide by', () => {
    expect(getPotionCasterLevel({ Cost: 300 }, null)).toBe(0);
  });

  test('the spell level is the lowest any class gets it at', () => {
    expect(getPotionSpellLevel('cure-light-wounds')).toBe(1);
    expect(getPotionSpellLevel('no-such-spell')).toBe(null);
  });
});

describe('oils are applied, not drunk', () => {
  test('an oil is told apart by its name', () => {
    expect(isOil({ Name: 'Oil of Keen edge' })).toBe(true);
    expect(isOil({ Name: 'Potion of Fly' })).toBe(false);
  });

  test('each oil says what kind of object it wants', () => {
    expect(of('Oil of Magic weapon').target).toBe('weapon');
    expect(of('Oil of Magic vestment +2').target).toBe('armor');
    expect(of('Oil of Flame arrow').target).toBe('ammo');
    expect(of('Oil of Daylight').target).toBe('any');
  });

  test('all 18 oils have a target, and no drinkable potion has one', () => {
    loadFile('items').Potion.forEach((row) => {
      const effect = resolvePotionEffect(row);
      if (effect.oil) expect(effect.target).toBeTruthy();
      else expect(effect.target).toBe(null);
    });
  });

  test('an oil with no number is still a note', () => {
    const keen = of('Oil of Keen edge');
    expect(keen.item).toEqual({});
    expect(keen.situational).toMatch(/threat range/i);
  });
});

describe('the cures take something away', () => {
  test('each names the conditions it clears', () => {
    expect(of('Potion of Remove paralysis').clears).toEqual(['Paralyzed']);
    expect(of('Potion of Remove blindness/deafness').clears).toEqual(['Blinded', 'Deafened']);
    expect(of('Potion of Remove fear').clears).toEqual(['Shaken', 'Frightened', 'Panicked']);
  });

  test('every condition a cure clears is a real one the sheet tracks', () => {
    const real = new Set(Object.keys(loadFile('tables').Conditions));
    Object.values(POTION_EFFECTS).forEach((entry) => {
      (entry.clears || []).forEach((name) => expect(real.has(name)).toBe(true));
    });
  });

  test('lesser restoration repairs ability damage rather than clearing it', () => {
    const effect = of('Potion of Lesser restoration');
    expect(effect.repairs).toBe('Ability Damaged');
    expect(effect.dice.expr).toBe('1d4');
  });

  test('the two the sheet cannot model say so instead of pretending', () => {
    expect(of('Potion of Remove disease').clears).toEqual([]);
    expect(of('Potion of Remove disease').situational).toMatch(/does not track diseases/i);
    expect(of('Potion of Remove curse').situational).toMatch(/does not track curses/i);
  });
});

describe('size, and the dice that follow it', () => {
  test('enlarge and reduce move one category each way', () => {
    expect(of('Potion of Enlarge person').size).toBe(1);
    expect(of('Potion of Reduce person').size).toBe(-1);
  });

  test('shiftSize walks the ladder', () => {
    expect(shiftSize('Medium', 1)).toBe('Large');
    expect(shiftSize('Medium', -1)).toBe('Small');
    expect(shiftSize('Small', 2)).toBe('Large');
  });

  test('and stops at the ends rather than falling off', () => {
    expect(shiftSize('Colossal', 1)).toBe('Colossal');
    expect(shiftSize('Fine', -1)).toBe('Fine');
    expect(shiftSize('Nonsense', 1)).toBe('Nonsense');
  });

  test('the size modifiers are typed as size bonuses', () => {
    expect(of('Potion of Enlarge person').stats.str).toEqual([2, 'size']);
    expect(of('Potion of Enlarge person').stats.dex).toEqual([-2, 'size']);
  });
});

describe('dice', () => {
  test('the per-level part is capped', () => {
    const dice = { expr: '1d8', perLevel: 1, maxBonus: 5 };
    expect(dicePerLevelBonus(dice, 3)).toBe(3);
    expect(dicePerLevelBonus(dice, 20)).toBe(5);
  });

  test('a potion with no dice has no bonus', () => {
    expect(dicePerLevelBonus(null, 10)).toBe(0);
    expect(dicePerLevelBonus({ expr: '1d4' }, 10)).toBe(0);
  });

  test('expressions split into count and die', () => {
    expect(parseDiceExpr('3d8')).toEqual({ count: 3, sides: 8 });
    expect(parseDiceExpr('nonsense')).toBe(null);
  });

  test('only the ten potions with a number carry dice', () => {
    const withDice = loadFile('items').Potion
      .filter((row) => resolvePotionEffect(row).dice);
    // cure light/moderate/serious, aid, lesser restoration
    expect(withDice.map((r) => r.Name).sort()).toEqual([
      'Potion of Aid',
      'Potion of Cure light wounds',
      'Potion of Cure moderate wounds',
      'Potion of Cure serious wounds',
      'Potion of Lesser restoration',
    ]);
  });
});

describe('the condition-only list', () => {
  test('names nothing that also has an effect entry', () => {
    CONDITION_ONLY.forEach((link) => expect(POTION_EFFECTS[link]).toBeUndefined());
  });

  test('energy resistance is a pill, not a number', () => {
    const effect = of('Potion of Resist fire 20');
    expect(effect.kind).toBe('condition');
    expect(effect.stats).toEqual({});
  });

  test('invisibility adds the condition the sheet already models', () => {
    expect(of('Potion of Invisibility').adds).toBe('Invisible');
  });
});
