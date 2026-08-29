import { configureStore } from '@reduxjs/toolkit';
import Player from '../../lib/player';
import { itemRefLink } from '../../lib/item';
import { loadFile } from '../../lib/loadFile';
import { onUsePotion } from './playerSheetThunks';

/* Spending a consumable, through the link the *inventory* actually stores.
 *
 * The potions card shipped with a bug this file exists to keep fixed: the
 * effect table knows a potion by its bare link (`fly`) and the inventory row
 * stores the full ref (`items/Potion/fly`), so `removeInventoryItem` never
 * matched and a potion was drunk without ever leaving the bag. The card, the
 * effect and the popover all worked — only the count did not move.
 *
 * The tests below add items exactly the way the add-item form does, through
 * `itemRefLink`, rather than with the bare link a hand-written test would
 * reach for. That difference is the entire bug.
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

/** The row the add-item form would create for one items.json item. */
function addAsTheFormWould(player, category, name, count = 2) {
  const raw = (loadFile('items')[category] || []).find((row) => row.Name === name);
  if (!raw) throw new Error(`no such item: ${name}`);
  player.addInventoryItem(raw.Name, category, count, itemRefLink({ ...raw, ItemType: category }));
  return player;
}

const countOf = (p, name) => p.getInventory().find((r) => r.Name === name)?.Number ?? 0;

describe('a potion added the way the app adds it', () => {
  test('the inventory stores the full ref, not the bare link', () => {
    const p = addAsTheFormWould(pc(), 'Potion', 'Potion of Fly');
    expect(p.getInventory()[0].Link).toBe('items/Potion/fly');
  });

  test('drinking it takes one out of the bag', () => {
    const p = addAsTheFormWould(pc(), 'Potion', 'Potion of Fly', 3);
    storeWith(p).dispatch(onUsePotion('Potion of Fly'));
    expect(countOf(p, 'Potion of Fly')).toBe(2);
  });

  test('the last one leaves the bag entirely', () => {
    const p = addAsTheFormWould(pc(), 'Potion', 'Potion of Fly', 1);
    storeWith(p).dispatch(onUsePotion('Potion of Fly'));
    expect(p.getInventory()).toEqual([]);
  });

  test('the effect still runs — the fix is to the count, not to the effect', () => {
    const p = addAsTheFormWould(pc(), 'Potion', "Potion of Bull's strength", 1);
    storeWith(p).dispatch(onUsePotion("Potion of Bull's strength"));
    expect(p.getResolvedEffects()).toHaveLength(1);
    expect(p.getPotionBonus('str')).toBe(4);
  });

  test('only one potion is spent, however many are carried', () => {
    const p = pc();
    addAsTheFormWould(p, 'Potion', 'Potion of Fly', 2);
    addAsTheFormWould(p, 'Potion', 'Potion of Jump', 2);
    storeWith(p).dispatch(onUsePotion('Potion of Fly'));
    expect(countOf(p, 'Potion of Fly')).toBe(1);
    expect(countOf(p, 'Potion of Jump')).toBe(2);
  });
});

describe('the five wondrous items that behave like potions', () => {
  test('an elixir appears on the potions card despite its category', () => {
    /* An elixir *is* a wondrous item — the category in items.json is right,
       and a short allow-list lets it through rather than a data change. */
    const p = addAsTheFormWould(pc(), 'Wondrous Item', 'Elixir of hiding', 1);
    const carried = p.getCarriedPotions();
    expect(carried).toHaveLength(1);
    expect(carried[0].label).toBe('Elixir of hiding');
    expect(carried[0].description).toMatch(/Hide checks/);
  });

  test('drinking one applies its bonus and spends it', () => {
    const p = addAsTheFormWould(pc(), 'Wondrous Item', 'Elixir of sneaking', 2);
    storeWith(p).dispatch(onUsePotion('Elixir of sneaking'));
    expect(countOf(p, 'Elixir of sneaking')).toBe(1);
    expect(p.getPotionBonus('skill:Move silently')).toBe(10);
  });

  test('the salve carries its skill bonus and its web note', () => {
    const p = addAsTheFormWould(pc(), 'Wondrous Item', 'Salve of slipperiness', 1);
    const [salve] = p.getCarriedPotions();
    expect(salve.stats['skill:Escape artist']).toEqual([20, 'competence']);
    expect(salve.situational).toMatch(/Webs/i);
  });

  test('a wondrous item that is not on the list stays off the card', () => {
    // A bag of holding is carried too, and belongs nowhere near this card.
    const p = addAsTheFormWould(pc(), 'Wondrous Item', 'Bag of holding type I', 1);
    expect(p.getCarriedPotions()).toEqual([]);
  });

  test('nothing in items.json is left unclassified', () => {
    /* The guard now scans the allow-listed wondrous items too, so a sixth
       potion-shaped item added later cannot slip past it silently.
       Imported lazily so the module is read after the data file is. */
    // eslint-disable-next-line global-require
    const { unclassifiedPotionLinks } = require('../../lib/item/potionEffects');
    expect(unclassifiedPotionLinks()).toEqual([]);
  });
});
