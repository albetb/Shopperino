import { configureStore } from '@reduxjs/toolkit';
import Player from '../../lib/player';
import { onUseScroll } from './playerSheetThunks';

/* Reading a scroll, end to end.
 *
 * The thunk does exactly one thing, and this file is mostly about the one way
 * that could go wrong: 151 spells exist as both an Arcane and a Divine scroll
 * under the same name, so spending "Scroll of Detect magic" by name would
 * spend whichever of the two the inventory happened to list first.
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

function pc(cls = 'Wizard', level = 5) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  p.setAbilityBase('int', 16);
  return p;
}

const carrying = (p, ref, name, n = 2) => { p.addInventoryItem(name, 'Scroll', n, ref); return p; };
const countAt = (p, ref) => p.getCarriedScrolls().find((s) => s.ref === ref)?.number ?? 0;

describe('the count drops by one', () => {
  test('one is spent, and the rest stay in the bag', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 3);
    storeWith(p).dispatch(onUseScroll('scrolls/Arcane/fireball'));
    expect(countAt(p, 'scrolls/Arcane/fireball')).toBe(2);
  });

  test('the last one leaves the bag entirely', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 1);
    storeWith(p).dispatch(onUseScroll('scrolls/Arcane/fireball'));
    expect(p.getCarriedScrolls()).toEqual([]);
    expect(p.getInventory()).toEqual([]);
  });

  test('the right one of two same-named scrolls is spent', () => {
    const p = pc('Cleric', 5);
    carrying(p, 'scrolls/Arcane/detect-magic', 'Scroll of Detect magic', 2);
    carrying(p, 'scrolls/Divine/detect-magic', 'Scroll of Detect magic', 2);
    storeWith(p).dispatch(onUseScroll('scrolls/Divine/detect-magic'));
    expect(countAt(p, 'scrolls/Arcane/detect-magic')).toBe(2);
    expect(countAt(p, 'scrolls/Divine/detect-magic')).toBe(1);
  });

  test('a scroll whose spell link carries a slash spends normally', () => {
    /* Six links have a slash of their own — open/close, blindness/deafness,
       geas/quest — which made the ref four segments long instead of three. */
    const p = carrying(pc(), 'scrolls/Arcane/blindness/deafness', 'Scroll of Blindness/deafness', 1);
    expect(p.getCarriedScrolls()).toHaveLength(1);
    storeWith(p).dispatch(onUseScroll('scrolls/Arcane/blindness/deafness'));
    expect(p.getCarriedScrolls()).toEqual([]);
  });
});

describe('nothing else changes', () => {
  test('reading a scroll of cure light wounds heals nobody', () => {
    /* A scroll casts its spell as written, and what a spell does happens at
       the table. The alternative is a card that pretends to resolve 598
       spells and gets some of them wrong. */
    const p = carrying(pc('Cleric', 5), 'scrolls/Divine/cure-light-wounds', 'Scroll of Cure light wounds');
    p.setAbilityBase('wis', 16);
    p.setDamage(10);
    storeWith(p).dispatch(onUseScroll('scrolls/Divine/cure-light-wounds'));
    expect(p.getDamage()).toBe(10);
    expect(p.getConditions()).toEqual([]);
    expect(p.getResolvedEffects()).toEqual([]);
  });

  test('a scroll a character cannot read is still spent — the sheet does not enforce', () => {
    const p = carrying(pc('Fighter', 5), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 1);
    expect(p.getCarriedScrolls()[0].usable).toBe(false);
    storeWith(p).dispatch(onUseScroll('scrolls/Arcane/fireball'));
    expect(p.getCarriedScrolls()).toEqual([]);
  });
});

describe('refusals', () => {
  test('a ref that names no scroll spends nothing', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 2);
    storeWith(p).dispatch(onUseScroll('scrolls/Arcane/not-a-spell'));
    storeWith(p).dispatch(onUseScroll(''));
    expect(countAt(p, 'scrolls/Arcane/fireball')).toBe(2);
  });

  test('a scroll not in the bag spends nothing from it', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 2);
    storeWith(p).dispatch(onUseScroll('scrolls/Arcane/knock'));
    expect(countAt(p, 'scrolls/Arcane/fireball')).toBe(2);
    expect(p.getCarriedScrolls()).toHaveLength(1);
  });

  test('with no character loaded nothing happens at all', () => {
    const store = configureStore({
      reducer: (s = { playerSheet: { player: null }, persist: { pss: null } }) => s,
      middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
    });
    expect(() => store.dispatch(onUseScroll('scrolls/Arcane/fireball'))).not.toThrow();
  });
});
