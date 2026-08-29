import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import CombatPage from './combat_page';

/* Attacks of opportunity were not modelled anywhere at all, which is why
   Combat Reflexes read as a feat with no mechanical effect — there was no
   number for it to raise.

   The row appears only for a character who has the feat. Everybody gets one
   attack of opportunity a round and saying so on every sheet would be noise;
   the feat is the only thing that makes the count worth reading. */

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

function fighter(feats = [], dex = 14) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = 6;
  p.race = 'Human';
  p.maxLife = 50;
  p.setAbilityBase('str', 14);
  p.setAbilityBase('dex', dex);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

const row = () => screen.queryByText('Attacks of opportunity');

describe('when the row shows', () => {
  test('not for a character without the feat', () => {
    renderCombat(fighter());
    expect(row()).toBe(null);
  });

  test('for one with it', () => {
    renderCombat(fighter(['Combat reflexes']));
    expect(row()).toBeInTheDocument();
  });

  test('even when Dexterity adds nothing, for the flat-footed half', () => {
    renderCombat(fighter(['Combat reflexes'], 10));
    expect(row()).toBeInTheDocument();
    expect(screen.getByText('1 / round')).toBeInTheDocument();
  });
});

describe('what it counts', () => {
  test('one plus the Dexterity bonus', () => {
    renderCombat(fighter(['Combat reflexes'], 18));
    // +4 Dexterity, so five in a round.
    expect(screen.getByText('5 / round')).toBeInTheDocument();
  });

  test('a Dexterity penalty never takes the last one away', () => {
    renderCombat(fighter(['Combat reflexes'], 6));
    expect(screen.getByText('1 / round')).toBeInTheDocument();
  });
});

describe('the breakdown behind it', () => {
  test('separates the one everybody has from what the feat added', () => {
    renderCombat(fighter(['Combat reflexes'], 18));
    fireEvent.click(screen.getByRole('button', { name: /what makes up attacks of opportunity/i }));
    const box = screen.getByRole('dialog', { name: 'Attacks of opportunity' });
    expect(within(box).getByText('everyone gets one')).toBeInTheDocument();
    expect(within(box).getByText('Combat reflexes (Dexterity)')).toBeInTheDocument();
  });

  test('and carries the flat-footed clause as a note, not as a number', () => {
    renderCombat(fighter(['Combat reflexes'], 18));
    fireEvent.click(screen.getByRole('button', { name: /what makes up attacks of opportunity/i }));
    const box = screen.getByRole('dialog', { name: 'Attacks of opportunity' });
    expect(within(box).getByText(/flat-footed/)).toBeInTheDocument();
  });
});
