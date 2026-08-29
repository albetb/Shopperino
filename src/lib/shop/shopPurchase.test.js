import {
  unitPrice,
  availableOf,
  clampQuantity,
  askingPrice,
  purchaseCost,
  inventoryArgsFor,
} from './shopPurchase';

/* The money side of buying out of a scanned shop.
 *
 * The interesting case is the one the app is not allowed to refuse: a purchase
 * the character cannot afford. `Player.setGold` floors at zero, so the purse
 * physically cannot carry the debt — which means the honest thing, and the one
 * the non-enforcement rule actually asks for, is to let the purchase through
 * and report the shortfall rather than to disable the button.
 */

const row = (over = {}) => ({ Name: 'Dagger', ItemType: 'Weapon', Number: 4, Cost: 2, ...over });

describe('what a row costs', () => {
  test('the price is the one the shop already worked out', () => {
    /* Reputation and the city modifier are applied before the payload is
       encoded, so nothing here re-applies them. */
    expect(unitPrice(row({ Cost: 12.5 }))).toBe(12.5);
  });

  test('a missing price is free rather than NaN', () => {
    expect(unitPrice({})).toBe(0);
    expect(unitPrice(undefined)).toBe(0);
  });

  test('the asking price is the price times the count', () => {
    expect(askingPrice(row({ Cost: 2.5 }), 3)).toBe(7.5);
  });

  test('and it stays at copper precision rather than drifting', () => {
    // 0.1 * 3 is 0.30000000000000004 in floating point.
    expect(askingPrice(row({ Cost: 0.1 }), 3)).toBe(0.3);
  });
});

describe('how many can be bought', () => {
  test('never more than the shop lists', () => {
    /* Not a rule being enforced — a shop having two of something. The
       non-enforcement convention is about D&D limits, not about inventing
       stock the master never claimed to hold. */
    expect(clampQuantity(row({ Number: 2 }), 5)).toBe(2);
  });

  test('never fewer than one', () => {
    expect(clampQuantity(row(), 0)).toBe(1);
    expect(clampQuantity(row(), -3)).toBe(1);
  });

  test('a sold-out row still clamps to one rather than to zero', () => {
    // The drawer filters these out; the model must not divide by them anyway.
    expect(availableOf(row({ Number: 0 }))).toBe(0);
    expect(clampQuantity(row({ Number: 0 }), 1)).toBe(1);
  });
});

describe('what the purchase does to the purse', () => {
  test('an affordable buy reports what is left', () => {
    expect(purchaseCost(100, 30)).toEqual({ have: 100, owed: 30, shortfall: 0, remaining: 70 });
  });

  test('an unaffordable buy reports the shortfall instead of refusing', () => {
    const { shortfall, remaining } = purchaseCost(10, 50);
    expect(shortfall).toBe(40);
    // The purse floors at zero, so "remaining" is zero rather than -40.
    expect(remaining).toBe(0);
  });

  test('spending exactly what you have is not a shortfall', () => {
    expect(purchaseCost(25, 25).shortfall).toBe(0);
  });

  test('a haggled price of nothing is allowed — a gift is a real table moment', () => {
    expect(purchaseCost(5, 0)).toEqual({ have: 5, owed: 0, shortfall: 0, remaining: 5 });
  });
});

describe('what lands in the bag', () => {
  test('the row becomes the arguments addInventoryItem wants', () => {
    expect(inventoryArgsFor(row(), 2)).toEqual({
      name: 'Dagger',
      type: 'Weapon',
      number: 2,
      link: '',
      opts: {},
    });
  });

  test('an enhancement bonus travels, so a +1 sword arrives as one', () => {
    const args = inventoryArgsFor(row({ Bonus: 1, Link: 'items/Weapon/longsword' }), 1);
    expect(args.opts.bonus).toBe(1);
    expect(args.link).toBe('items/Weapon/longsword');
  });

  test('named effects travel too, so a flaming sword is still flaming', () => {
    expect(inventoryArgsFor(row({ effectIds: [3, 7] }), 1).opts.effectIds).toEqual([3, 7]);
  });

  test('an empty effect list is left off rather than stored as an empty array', () => {
    expect(inventoryArgsFor(row({ effectIds: [] }), 1).opts).toEqual({});
  });

  test('the quantity is clamped here too, not only in the stepper', () => {
    expect(inventoryArgsFor(row({ Number: 1 }), 9).number).toBe(1);
  });
});
