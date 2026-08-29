import Player from './player';
import { loadFile } from '../loadFile';

/* Held items on the character: what is in hand, what it can cast, whether the
 * character can activate it, and what is left in it.
 *
 * The rule the app got wrong before this existed was the slot: wands, rods and
 * staffs fell through to the four `other` accessory slots, so a two-handed
 * greatsword and a wand could both be "ready". They are held, and a hand is a
 * hand.
 */

const wandOf = (name) => loadFile('items').Wand.find((i) => i.Name === name);

function caster(cls = 'Wizard', level = 5) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

function hold(player, slot, name) {
  player.equipment = player.equipment || {};
  player.equipment[slot] = { link: `items/Wand/x`, name };
  return player;
}

describe('what counts as held', () => {
  test('a wand in a hand is a held item', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    const held = p.getHeldItems();
    expect(held).toHaveLength(1);
    expect(held[0].itemType).toBe('Wand');
    expect(held[0].slot).toBe('rh1');
    expect(p.hasHeldItems()).toBe(true);
  });

  test('all four hand slots are searched, primary set first', () => {
    const p = caster();
    hold(p, 'lh2', 'Staff of Fire');
    hold(p, 'rh1', 'Rod of Absorption');
    expect(p.getHeldItems().map((h) => h.slot)).toEqual(['rh1', 'lh2']);
  });

  test('the second hand set is marked as the one you would swap to', () => {
    const p = caster();
    hold(p, 'rh1', 'Wand of Fireball (5th)');
    hold(p, 'rh2', 'Wand of Magic missile (5th)');
    const [primary, secondary] = p.getHeldItems();
    expect(primary.isSecondarySet).toBe(false);
    expect(secondary.isSecondarySet).toBe(true);
  });

  test('a sword in a hand is not a held item', () => {
    const p = caster();
    p.equipment = { rh1: { link: 'items/Weapon/longsword', name: 'Longsword' } };
    expect(p.getHeldItems()).toEqual([]);
    expect(p.hasHeldItems()).toBe(false);
  });

  test('and an empty character has none', () => {
    expect(caster().getHeldItems()).toEqual([]);
  });
});

describe('resolving which entry it is', () => {
  test('the name picks the right one where the link cannot', () => {
    const fifth = hold(caster(), 'rh1', 'Wand of Fireball (5th)').getHeldItems()[0];
    const tenth = hold(caster(), 'rh1', 'Wand of Fireball (10th)').getHeldItems()[0];
    expect(fifth.id).not.toBe(tenth.id);
    expect(fifth.spells[0].casterLevel).toBe(5);
    expect(tenth.spells[0].casterLevel).toBe(10);
  });

  test('a stored id wins over everything', () => {
    const p = caster();
    const wand = wandOf('Wand of Fireball (10th)');
    p.equipment = { rh1: { id: wand.id, name: 'Wand of Fireball (5th)', link: 'items/Wand/fireball' } };
    expect(p.getHeldItems()[0].spells[0].casterLevel).toBe(10);
  });
});

describe('what it casts', () => {
  test('a wand casts its one spell for one charge', () => {
    const held = hold(caster(), 'rh1', 'Wand of Fireball (5th)').getHeldItems()[0];
    expect(held.spells).toHaveLength(1);
    expect(held.spells[0].link).toBe('fireball');
    expect(held.spells[0].charges).toBe(1);
  });

  test('a staff casts several, each at its own cost', () => {
    const held = hold(caster(), 'rh1', 'Staff of Fire').getHeldItems()[0];
    expect(held.spells.map((s) => [s.link, s.charges])).toEqual([
      ['burning-hands', 1], ['fireball', 1], ['wall-of-fire', 2],
    ]);
  });

  test('a rod casts nothing, and names the feat it lends instead', () => {
    const held = hold(caster(), 'rh1', 'Rod of Metamagic, Quicken, greater').getHeldItems()[0];
    expect(held.spells).toEqual([]);
    expect(held.metamagicFeat).toBe('Quicken spell');
  });
});

describe('who may activate it — spell trigger', () => {
  test('a wizard may fire a wand of a wizard spell', () => {
    const held = hold(caster('Wizard'), 'rh1', 'Wand of Fireball (5th)').getHeldItems()[0];
    expect(held.spells[0].usable).toBe(true);
    expect(held.spells[0].reason).toBe('');
  });

  test('level is irrelevant — a 1st-level wizard fires a wand of fireball', () => {
    /* The rule the backlog had wrong: spell trigger is gated on the spell
       being on your list and on nothing else. The DMG names a 3rd-level
       paladin, who cannot cast at all, as still qualifying. */
    const p = hold(caster('Wizard', 1), 'rh1', 'Wand of Fireball (5th)');
    expect(p.getCasterLevel()).toBe(1);
    expect(p.getHeldItems()[0].spells[0].usable).toBe(true);
  });

  test('a paladin below 4th, who cannot cast at all, still qualifies', () => {
    const p = hold(caster('Paladin', 3), 'rh1', 'Wand of Cure light wounds');
    expect(p.getCasterLevel()).toBe(0);
    expect(p.getHeldItems()[0].spells[0].usable).toBe(true);
  });

  test('a fighter may not, and is told to reach for Use Magic Device', () => {
    const held = hold(caster('Fighter', 10), 'rh1', 'Wand of Fireball (5th)').getHeldItems()[0];
    expect(held.spells[0].usable).toBe(false);
    expect(held.spells[0].reason).toContain('Fighter');
    expect(held.spells[0].reason).toContain('Use Magic Device');
  });

  test('and a wizard may not fire a wand of a cleric-only spell', () => {
    const held = hold(caster('Wizard', 10), 'rh1', 'Wand of Cure light wounds').getHeldItems()[0];
    expect(held.spells[0].usable).toBe(false);
  });

  test('the spell list is read per class, at the level that class gets it', () => {
    const wizard = caster('Wizard');
    const cleric = caster('Cleric');
    // Bless is Clr 1 and on no arcane list at all.
    expect(cleric.getSpellLevelForItem('bless')).toBe(1);
    expect(wizard.getSpellLevelForItem('bless')).toBe(null);
    expect(wizard.getSpellLevelForItem('no-such-spell')).toBe(null);
  });
});

describe('charges', () => {
  test('a newly held item is full', () => {
    const held = hold(caster(), 'rh1', 'Wand of Fireball (5th)').getHeldItems()[0];
    expect(held.maxCharges).toBe(50);
    expect(held.spent).toBe(0);
    expect(held.remaining).toBe(50);
  });

  test('spending counts down, and giving back counts up', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    const { id } = p.getHeldItems()[0];
    p.spendHeldItemCharges(id, 3);
    expect(p.getHeldItems()[0].remaining).toBe(47);
    p.spendHeldItemCharges(id, -1);
    expect(p.getHeldItems()[0].remaining).toBe(48);
    p.spendHeldItemCharges(id, -99);
    expect(p.getHeldItems()[0].remaining).toBe(50);
  });

  test('a staff spends what its own spell costs, not a flat one', () => {
    const p = hold(caster(), 'rh1', 'Staff of Fire');
    const held = p.getHeldItems()[0];
    const wallOfFire = held.spells.find((s) => s.link === 'wall-of-fire');
    p.spendHeldItemCharges(held.id, wallOfFire.charges);
    expect(p.getHeldItems()[0].remaining).toBe(48);
  });

  test('charges belong to the item, so they survive being unequipped', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    const { id } = p.getHeldItems()[0];
    p.spendHeldItemCharges(id, 10);
    p.unequipSlot('rh1');
    expect(p.getHeldItems()).toEqual([]);
    hold(p, 'lh2', 'Wand of Fireball (5th)');
    expect(p.getHeldItems()[0].remaining).toBe(40);
  });

  test('and they survive a save and a load', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    p.spendHeldItemCharges(p.getHeldItems()[0].id, 7);
    const copy = new Player();
    copy.load(p.serialize());
    copy.equipment = p.equipment;
    expect(copy.getHeldItems()[0].remaining).toBe(43);
  });

  test('overspending is accepted, not blocked', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    const { id } = p.getHeldItems()[0];
    p.spendHeldItemCharges(id, 60);
    expect(p.getHeldItemSpent(id)).toBe(60);
    expect(p.getHeldItems()[0].remaining).toBe(0);
  });

  test('the reset button refills one item', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    const { id } = p.getHeldItems()[0];
    p.spendHeldItemCharges(id, 12);
    p.resetHeldItemCharges(id);
    expect(p.getHeldItems()[0].remaining).toBe(50);
  });
});

describe('rest refills the rods and nothing else', () => {
  test('a per-day rod comes back', () => {
    const p = hold(caster(), 'rh1', 'Rod of Metamagic, Quicken, greater');
    const held = p.getHeldItems()[0];
    expect(held.maxCharges).toBe(3);
    expect(held.refreshesOnRest).toBe(true);
    p.spendHeldItemCharges(held.id, 2);
    expect(p.getHeldItems()[0].remaining).toBe(1);
    p.resetHeldItemsOnRest();
    expect(p.getHeldItems()[0].remaining).toBe(3);
  });

  test('a wand does not — its fifty charges are spent for good', () => {
    const p = caster();
    hold(p, 'rh1', 'Wand of Fireball (5th)');
    hold(p, 'lh1', 'Rod of Metamagic, Quicken, greater');
    const [wand, rod] = p.getHeldItems();
    p.spendHeldItemCharges(wand.id, 5);
    p.spendHeldItemCharges(rod.id, 3);
    p.resetHeldItemsOnRest();
    const after = p.getHeldItems();
    expect(after[0].remaining).toBe(45);
    expect(after[1].remaining).toBe(3);
  });

  test('and a rest does not refill a wand a different character is holding', () => {
    // resetHeldItemsOnRest walks what is in hand, rather than clearing the map.
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    const { id } = p.getHeldItems()[0];
    p.spendHeldItemCharges(id, 4);
    p.unequipSlot('rh1');
    p.resetHeldItemsOnRest();
    hold(p, 'rh1', 'Wand of Fireball (5th)');
    expect(p.getHeldItems()[0].remaining).toBe(46);
  });
});
