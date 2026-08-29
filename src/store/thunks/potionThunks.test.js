import { configureStore } from '@reduxjs/toolkit';
import Player from '../../lib/player';
import { onUsePotion, onRemovePotionEffect, onPlayerRest } from './playerSheetThunks';

/* Drinking a potion, end to end.
 *
 * The pieces are tested apart from each other elsewhere — the effect table in
 * lib/item, the stat channels on the model, the card in components. This file
 * is about the one thing only the thunk does: spend the potion and make the
 * right thing happen, which differs by kind. A heal moves hit points; a cure
 * clears a condition; everything else starts something running.
 */

function storeWith(player) {
  return configureStore({
    reducer: (state = { playerSheet: { player }, persist: { pss: null } }, action) => {
      if (action.type === 'persist/setPersist') return { ...state, persist: action.payload };
      return state;
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

function pc(cls = 'Fighter', level = 5) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

const carrying = (p, name, link, n = 2) => { p.addInventoryItem(name, 'Potion', n, link); return p; };
const countOf = (p, name) => p.getInventory().find((r) => r.Name === name)?.Number ?? 0;

describe('the count always drops', () => {
  test('one is spent, and the rest stay in the bag', () => {
    const p = carrying(pc(), 'Potion of Fly', 'fly', 3);
    storeWith(p).dispatch(onUsePotion('Potion of Fly'));
    expect(countOf(p, 'Potion of Fly')).toBe(2);
  });

  test('the last one leaves the bag entirely', () => {
    const p = carrying(pc(), 'Potion of Fly', 'fly', 1);
    storeWith(p).dispatch(onUsePotion('Potion of Fly'));
    expect(p.getInventory()).toEqual([]);
    expect(p.getCarriedPotions()).toEqual([]);
  });

  test('a name that is not a potion does nothing at all', () => {
    const p = carrying(pc(), 'Potion of Fly', 'fly', 2);
    storeWith(p).dispatch(onUsePotion('Potion of Nonsense'));
    expect(countOf(p, 'Potion of Fly')).toBe(2);
    expect(p.getResolvedEffects()).toEqual([]);
  });
});

describe('a healing potion moves hit points', () => {
  test('the rolled amount is healed', () => {
    const p = carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds');
    p.setDamage(10);
    storeWith(p).dispatch(onUsePotion('Potion of Cure light wounds', { roll: 6 }));
    expect(p.getDamage()).toBe(4);
  });

  test('healing never goes past the maximum', () => {
    const p = carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds');
    p.setDamage(2);
    storeWith(p).dispatch(onUsePotion('Potion of Cure light wounds', { roll: 9 }));
    expect(p.getDamage()).toBe(0);
    expect(p.getCurrentHp()).toBe(p.getMaxLife());
  });

  test('and a healing potion leaves nothing running behind it', () => {
    const p = carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds');
    p.setDamage(10);
    storeWith(p).dispatch(onUsePotion('Potion of Cure light wounds', { roll: 6 }));
    expect(p.getResolvedEffects()).toEqual([]);
  });
});

describe('a cure clears what it is able to clear', () => {
  test('remove paralysis lifts Paralyzed', () => {
    const p = carrying(pc(), 'Potion of Remove paralysis', 'remove-paralysis');
    p.addCondition({ name: 'Paralyzed' });
    storeWith(p).dispatch(onUsePotion('Potion of Remove paralysis'));
    expect(p.getConditions()).toEqual([]);
  });

  test('remove blindness lifts both of the conditions it names', () => {
    const p = carrying(pc(), 'Potion of Remove blindness/deafness', 'remove-blindness-deafness');
    p.addCondition({ name: 'Blinded' });
    p.addCondition({ name: 'Deafened' });
    storeWith(p).dispatch(onUsePotion('Potion of Remove blindness/deafness'));
    expect(p.getConditions()).toEqual([]);
  });

  test('but leaves alone the ones it does not name', () => {
    const p = carrying(pc(), 'Potion of Remove paralysis', 'remove-paralysis');
    p.addCondition({ name: 'Paralyzed' });
    p.addCondition({ name: 'Shaken' });
    storeWith(p).dispatch(onUsePotion('Potion of Remove paralysis'));
    expect(p.getConditions().map((c) => c.name)).toEqual(['Shaken']);
  });

  test('drinking one with nothing to cure still spends it', () => {
    const p = carrying(pc(), 'Potion of Remove paralysis', 'remove-paralysis', 2);
    storeWith(p).dispatch(onUsePotion('Potion of Remove paralysis'));
    expect(countOf(p, 'Potion of Remove paralysis')).toBe(1);
    expect(p.getConditions()).toEqual([]);
  });

  test('lesser restoration repairs the rolled points of ability damage', () => {
    const p = carrying(pc(), 'Potion of Lesser restoration', 'lesser-restoration');
    p.addCondition({ name: 'Ability Damaged', ability: 'Str', amount: 5 });
    storeWith(p).dispatch(onUsePotion('Potion of Lesser restoration', { roll: 3, target: 'Str' }));
    expect(p.getConditions()[0].amount).toBe(2);
  });

  test('remove fear clears the fear ladder and leaves its rider running', () => {
    const p = carrying(pc(), 'Potion of Remove fear', 'remove-fear');
    p.addCondition({ name: 'Frightened' });
    storeWith(p).dispatch(onUsePotion('Potion of Remove fear'));
    expect(p.getConditions()).toEqual([]);
    // The +4 against fear lasts 10 minutes, so it is still worth seeing.
    expect(p.getResolvedEffects().map((e) => e.label)).toEqual(['Remove fear']);
  });
});

describe('a condition potion becomes something visible', () => {
  test('invisibility adds the condition the sheet already models', () => {
    const p = carrying(pc(), 'Potion of Invisibility', 'invisibility');
    storeWith(p).dispatch(onUsePotion('Potion of Invisibility'));
    expect(p.getConditions().map((c) => c.name)).toEqual(['Invisible']);
    // Which the condition system already turns into a real +2 to attack.
    expect(p.getAttackConditionModifier()).toBe(2);
  });

  test('one with no matching condition becomes a pill instead', () => {
    const p = carrying(pc(), 'Potion of Water breathing', 'water-breathing');
    storeWith(p).dispatch(onUsePotion('Potion of Water breathing'));
    expect(p.getConditions()).toEqual([]);
    expect(p.getResolvedEffects().map((e) => e.label)).toEqual(['Water breathing']);
  });
});

describe('a buff starts running and moves the number', () => {
  test('bull’s strength raises Strength for real', () => {
    const p = carrying(pc(), "Potion of Bull's strength", 'bulls-strength');
    const before = p.getAbilityTotal('str');
    storeWith(p).dispatch(onUsePotion("Potion of Bull's strength"));
    expect(p.getAbilityTotal('str')).toBe(before + 4);
  });

  test('an oil records what it was applied to', () => {
    const p = carrying(pc(), 'Oil of Magic weapon', 'magic-weapon');
    p.equipment = { rh1: { link: 'items/Weapon/longsword', name: 'Longsword' } };
    storeWith(p).dispatch(onUsePotion('Oil of Magic weapon', { target: 'rh1' }));
    expect(p.getOilBonus('rh1', 'attack')).toBe(1);
  });
});

describe('ending things', () => {
  test('the x removes the one it names', () => {
    const p = carrying(pc(), 'Potion of Water breathing', 'water-breathing');
    const store = storeWith(p);
    store.dispatch(onUsePotion('Potion of Water breathing'));
    store.dispatch(onRemovePotionEffect(0));
    expect(p.getResolvedEffects()).toEqual([]);
  });

  test('rest ends every running potion', () => {
    const p = carrying(pc(), 'Potion of Water breathing', 'water-breathing', 2);
    const store = storeWith(p);
    store.dispatch(onUsePotion('Potion of Water breathing'));
    store.dispatch(onUsePotion('Potion of Water breathing'));
    expect(p.getResolvedEffects()).toHaveLength(2);
    store.dispatch(onPlayerRest());
    expect(p.getResolvedEffects()).toEqual([]);
  });

  test('but rest does not put the potions back in the bag', () => {
    const p = carrying(pc(), 'Potion of Water breathing', 'water-breathing', 2);
    const store = storeWith(p);
    store.dispatch(onUsePotion('Potion of Water breathing'));
    store.dispatch(onPlayerRest());
    expect(countOf(p, 'Potion of Water breathing')).toBe(1);
  });
});
