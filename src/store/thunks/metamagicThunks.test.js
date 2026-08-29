import { configureStore } from '@reduxjs/toolkit';
import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import { encodeMetamagic } from '../../lib/spellbook/metamagic';
import {
  onPlayerPrepareSpell,
  onPlayerUnprepareSpell,
  onPlayerUseSpell,
  onPlayerUseSpellWithRod,
} from './playerSheetThunks';

/* The round trip: a choice made in the popover, through the thunk, into the
 * character, and back out of the model that draws the row.
 *
 * The seam is `withPlayerSpellbook` — the player sheet and the standalone
 * Spellbook tab both hand their work to the same `Spellbook` model, which is
 * why one change covered two spellbooks.
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

function wizard(feats = []) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Wizard');
  p.setLevel(9);
  p.setAbilityBase('int', 18);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

const book = (p) => new Spellbook().load(playerToSpellbookData(p));
const EMPOWER = encodeMetamagic(['Empower spell']);
const MAGIC_MISSILE = 'magic-missile';

describe('preparing through the thunk', () => {
  test('the plain and the empowered copy live side by side on the character', () => {
    const p = wizard(['Empower spell']);
    const store = storeWith(p);
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE));
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE, EMPOWER));
    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE).Prepared).toBe(1);
    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER).Prepared).toBe(1);
  });

  test('the character’s own spells array carries the fourth element', () => {
    const p = wizard(['Empower spell']);
    storeWith(p).dispatch(onPlayerPrepareSpell(MAGIC_MISSILE, EMPOWER));
    expect(p.spells.find((row) => row.length === 4)[3]).toBe(EMPOWER);
  });

  test('unpreparing takes only the copy it was asked about', () => {
    const p = wizard(['Empower spell']);
    const store = storeWith(p);
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE));
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE, EMPOWER));
    store.dispatch(onPlayerUnprepareSpell(MAGIC_MISSILE, EMPOWER));
    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE).Prepared).toBe(1);
    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER).Prepared).toBe(0);
  });

  test('casting one leaves the other untouched', () => {
    const p = wizard(['Empower spell']);
    const store = storeWith(p);
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE));
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE, EMPOWER));
    store.dispatch(onPlayerUseSpell(MAGIC_MISSILE, EMPOWER));
    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE).Used).toBe(0);
    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE, EMPOWER).Used).toBe(1);
  });

  test('the book the character hands the page knows which feats to offer', () => {
    const p = wizard(['Empower spell', 'Silent spell']);
    expect(book(p).getAvailableMetamagic()).toEqual(['Empower spell', 'Silent spell']);
  });

  test('and a character with none is a different answer from no character', () => {
    /* An empty list means "this character has taken no metamagic feat"; an
       absent key means "there is no character here", which is the standalone
       Spellbook tab and offers all nine. */
    expect(book(wizard([])).getAvailableMetamagic()).toEqual([]);
    expect(new Spellbook().getAvailableMetamagic()).toHaveLength(9);
  });
});

describe('casting through a rod', () => {
  function withRod(p, name = 'Rod of Metamagic, Quicken, greater') {
    p.equipment = p.equipment || {};
    p.equipment.rh1 = { link: 'items/Rod/x', name };
    return p;
  }

  test('spends the spell’s own slot and one charge, in one act', () => {
    /* The slot does not move: a rod applies its feat without raising the
       level, which is the whole reason to own one. */
    const p = withRod(wizard([]));
    const store = storeWith(p);
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE));
    const rodId = p.getMetamagicRods()[0].id;

    store.dispatch(onPlayerUseSpellWithRod(MAGIC_MISSILE, rodId, 0));

    expect(book(p).getSpellPreparedUsed(MAGIC_MISSILE)).toEqual({ Prepared: 1, Used: 1 });
    expect(p.getMetamagicRods()[0].remaining).toBe(2);
    // Nothing was recorded at the level the feat would otherwise have cost.
    expect(book(p).getSpontaneousUsedAtLevel(5)).toBe(0);
  });

  test('three casts empty it, and it stays emptied until a rest', () => {
    const p = withRod(wizard([]));
    const store = storeWith(p);
    store.dispatch(onPlayerPrepareSpell(MAGIC_MISSILE));
    const rodId = p.getMetamagicRods()[0].id;
    [0, 1, 2].forEach(() => store.dispatch(onPlayerUseSpellWithRod(MAGIC_MISSILE, rodId, 0)));
    expect(p.getMetamagicRods()[0].remaining).toBe(0);
    p.resetHeldItemsOnRest();
    expect(p.getMetamagicRods()[0].remaining).toBe(3);
  });
});
