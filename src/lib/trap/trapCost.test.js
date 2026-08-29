import { getTraps, getTrapByRef } from './trapData';
import { mechanicalCost, magicDeviceCost, trapPrice, craftDC } from './trapCost';
import { trapCR } from './trapCR';

/* What a trap costs, measured the same way the CR is.
 *
 * The mechanical formula is a list of modifiers to a 1,000 gp base, all of it
 * multiplied by the CR at the end — which is why a +1,000 gp proximity trigger
 * is 8,000 gp on a CR 8 trap and the breakdown has to say so.
 */

const MECHANICAL = () => getTraps().filter((t) => t.type === 'mechanical');
const POISON_FREE = () => MECHANICAL().filter((t) => !t.poison && !t.gas
  && (t.cost || {}).marketPriceGp != null);

describe('the mechanical formula', () => {
  test('a plain trap is its base times its CR', () => {
    const portcullis = getTrapByRef('traps/cr1/portcullis-trap');
    const cost = mechanicalCost(portcullis, 1);
    expect(cost.subtotal).toBe(1000);
    expect(cost.gp).toBe(1000);
  });

  test('every modifier is named and multiplied by the CR', () => {
    const scythe = getTrapByRef('traps/cr4/wall-scythe-trap');
    const cost = mechanicalCost(scythe, 4);
    const labels = cost.lines.map((l) => l.label);
    expect(labels).toContain('Base cost');
    expect(labels).toContain('Reset: automatic');
    expect(labels).toContain('Attack bonus +20');
    expect(cost.gp).toBe(cost.subtotal * 4);
  });

  test('a low DC makes the trap cheaper, not free', () => {
    const cheap = mechanicalCost(
      { trigger: { type: 'location' }, reset: 'manual', searchDC: 14, disableDeviceDC: 20 }, 1
    );
    expect(cheap.lines.find((l) => l.key === 'search').gp).toBe(-600);
    // The floor is CR x 100 gp, so nothing is ever free.
    expect(cheap.gp).toBeGreaterThanOrEqual(100);
  });

  test('a trap that prices below the floor is floored, and says so', () => {
    const cost = mechanicalCost(
      { trigger: { type: 'location' }, reset: 'no', searchDC: 10, disableDeviceDC: 10 }, 2
    );
    expect(cost.floored).toBe(true);
    expect(cost.gp).toBe(200);
  });

  test('an automatic reset with a timed trigger costs nothing extra', () => {
    // The trigger already pays for the mechanism that resets it.
    const timed = mechanicalCost(
      { trigger: { type: 'timed' }, reset: 'automatic', searchDC: 20, disableDeviceDC: 20 }, 1
    );
    expect(timed.lines.some((l) => l.key === 'reset')).toBe(false);
  });

  test('a poisoned trap says its price is the mechanism only', () => {
    /* The rules add the poison's own cost on top, and poison prices are in the
       DMG rather than in traps.json — so the number is honest about what it
       leaves out instead of quietly being wrong. */
    const dart = getTrapByRef('traps/cr4/poisoned-dart-trap');
    expect(mechanicalCost(dart, 4).excludesPoison).toBe(true);
    expect(mechanicalCost(getTrapByRef('traps/cr1/portcullis-trap'), 1).excludesPoison).toBe(false);
  });
});

describe('measured against the book', () => {
  test('40 of the 55 poison-free mechanical samples reproduce exactly', () => {
    const samples = POISON_FREE();
    expect(samples).toHaveLength(55);
    const exact = samples.filter((t) => mechanicalCost(t, t.cr).gp === t.cost.marketPriceGp);
    expect(exact).toHaveLength(40);
  });

  test('and the misses are small — none is out by more than a factor of three', () => {
    /* The remainder is the book's own arithmetic, mostly the built-in strength
       ratings it states in prose and never in a field. Worth knowing the size
       of, so the page can show a computed price without misleading anyone. */
    POISON_FREE().forEach((t) => {
      const got = mechanicalCost(t, t.cr).gp;
      const stated = t.cost.marketPriceGp;
      expect(got).toBeGreaterThan(stated / 3);
      expect(got).toBeLessThan(stated * 3);
    });
  });
});

describe('a magic device costs gold and experience', () => {
  test('one-shot is 50 gp and 4 XP per caster level per spell level', () => {
    const trap = {
      type: 'magic device', reset: 'no', searchDC: 28,
      spellEffects: [{ spell: 'fireball', casterLevel: 8, casterClass: 'wizard' }],
    };
    const cost = magicDeviceCost(trap);
    expect(cost.gp).toBe(50 * 8 * 3);
    expect(cost.xp).toBe(4 * 8 * 3);
    expect(cost.automatic).toBe(false);
  });

  test('an automatic reset is ten times as much', () => {
    const trap = {
      type: 'magic device', reset: 'automatic', searchDC: 28,
      spellEffects: [{ spell: 'fireball', casterLevel: 8, casterClass: 'wizard' }],
    };
    const cost = magicDeviceCost(trap);
    expect(cost.gp).toBe(500 * 8 * 3);
    expect(cost.xp).toBe(40 * 8 * 3);
  });

  test('every spell in the build is paid for', () => {
    const both = getTrapByRef('traps/cr10/forcecage-and-summon-monster-vii-trap');
    expect(magicDeviceCost(both).perSpell).toHaveLength(2);
  });

  test('a spell trap is free unless a caster was hired', () => {
    const fire = getTrapByRef('traps/cr3/fire-trap');
    const price = trapPrice(fire, 3);
    expect(price.kind).toBe('spell');
    expect(price.hired).toBe(true);
    expect(price.gp).toBe(85);
  });
});

describe('Craft (trapmaking)', () => {
  test('the DC comes from the CR band', () => {
    const t = { type: 'mechanical', trigger: { type: 'location' }, reset: 'manual' };
    expect(craftDC(t, 2).dc).toBe(20);
    expect(craftDC(t, 5).dc).toBe(25);
    expect(craftDC(t, 9).dc).toBe(30);
  });

  test('a proximity trigger and an automatic reset each add 5', () => {
    const t = { type: 'mechanical', trigger: { type: 'proximity' }, reset: 'automatic' };
    const result = craftDC(t, 2);
    expect(result.dc).toBe(30);
    expect(result.lines.map((l) => l.key)).toEqual(['base', 'proximity', 'automatic']);
  });

  test('nobody crafts a magic trap with Craft (trapmaking)', () => {
    expect(craftDC(getTrapByRef('traps/cr5/fireball-trap'), 5)).toBeNull();
  });
});

describe('the price the page shows', () => {
  test('follows the computed CR, not the printed one', () => {
    /* The point of an editable trap: raise the Disable DC and the trap costs
       more, because the CR it is multiplied by went up too. */
    const base = getTrapByRef('traps/cr1/portcullis-trap');
    const harder = { ...base, disableDeviceDC: 30 };
    const cheap = trapPrice(base, trapCR(base).cr);
    const dear = trapPrice(harder, trapCR(harder).cr);
    expect(dear.gp).toBeGreaterThan(cheap.gp);
  });
});
