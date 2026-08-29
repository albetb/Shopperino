import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import CombatPage from './combat_page';

/* Who gets a punch line, and when the flurry appears beside it.

   The punch used to show only when nothing at all was equipped, framed as a
   warning that a weapon was missing. It is not a fallback: a fighter holding
   one sword has a free hand and a real attack, and the sheet was hiding it. */

function renderCombat(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: { player: false, combat: false, items: false } },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><CombatPage /></Provider>);
}

function character({ cls = 'Fighter', level = 8 } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = 'Human';
  p.maxLife = 60;
  p.setAbilityBase('str', 14);
  p.setAbilityBase('dex', 14);
  p.setAbilityBase('wis', 14);
  return p;
}

/* The punch can legitimately appear twice: once in the attack list, and again
   as its own line inside the flurry, which is what a monk would actually
   swing. Counting them is the point of the query. */
const punchLines = () => screen.queryAllByText('Punch');
const punchLine = () => punchLines()[0] ?? null;
const flurryLine = () => screen.queryByText('Flurry of blows');

describe('when the punch is offered', () => {
  test('with both hands empty', () => {
    renderCombat(character());
    expect(punchLine()).toBeInTheDocument();
  });

  test('with one hand holding a sword and the other free', () => {
    const p = character();
    p.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    expect(p.hasFreeHand()).toBe(true);
    renderCombat(p);
    expect(punchLine()).toBeInTheDocument();
  });

  test('not with a two-handed weapon, which uses both', () => {
    const p = character();
    p.equipItem('rh1', { link: 'items/Weapon/greatsword', name: 'Greatsword', twoHanded: true });
    expect(p.hasFreeHand()).toBe(false);
    renderCombat(p);
    expect(punchLine()).toBe(null);
  });

  test('not with a weapon in one hand and a shield in the other', () => {
    const p = character();
    p.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    p.equipItem('lh1', { link: 'items/Shield/shield-heavy-steel', name: 'Shield' });
    expect(p.hasFreeHand()).toBe(false);
    renderCombat(p);
    expect(punchLine()).toBe(null);
  });
});

describe('the missing-weapon warning', () => {
  test('is gone — an empty-handed character just has a punch', () => {
    renderCombat(character());
    expect(screen.queryByText(/defaulting to punch/i)).toBe(null);
    expect(punchLine()).toBeInTheDocument();
  });
});

describe('a monk keeps the punch even with both hands full of monk weapons', () => {
  test('and the flurry comes with it', () => {
    const p = character({ cls: 'Monk', level: 6 });
    p.equipItem('rh1', { link: 'items/Weapon/kama', name: 'Kama' });
    p.equipItem('lh1', { link: 'items/Weapon/kama', name: 'Kama' });
    // Both hands are full, so the free-hand rule alone would hide the punch.
    expect(p.hasFreeHand()).toBe(false);
    expect(p.canUseUnarmedStrike()).toBe(true);
    renderCombat(p);
    expect(punchLine()).toBeInTheDocument();
    expect(flurryLine()).toBeInTheDocument();
    // Once in the attack list, once as the flurry's own unarmed line.
    expect(punchLines()).toHaveLength(2);
  });

  test('a monk holding one monk weapon flurries with it', () => {
    const p = character({ cls: 'Monk', level: 6 });
    p.equipItem('rh1', { link: 'items/Weapon/kama', name: 'Kama' });
    renderCombat(p);
    expect(flurryLine()).toBeInTheDocument();
    // The kama's own flurried line is listed, since a flurry may use it.
    const rows = screen.getAllByText('Kama');
    expect(rows.length).toBeGreaterThan(1);
  });

  test('a fighter with a free hand gets a punch but never a flurry', () => {
    const p = character();
    renderCombat(p);
    expect(punchLine()).toBeInTheDocument();
    expect(flurryLine()).toBe(null);
  });
});

describe('the flurry explanation', () => {
  test('is behind a real info button, not a dead glyph and a hover title', () => {
    const p = character({ cls: 'Monk', level: 6 });
    renderCombat(p);
    const button = screen.getByRole('button', { name: /how flurry of blows works/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    const box = screen.getByRole('dialog', { name: 'Flurry of blows' });
    expect(within(box).getByText(/unarmed strikes or monk weapons/i)).toBeInTheDocument();
  });
});
