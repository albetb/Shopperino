import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import ArcaneFailureNote from './arcane_failure_note';

/* The strip appears only when there is a chance to report, so a caster in
   robes and every divine caster see nothing at all. */

function renderWith(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><ArcaneFailureNote /></Provider>);
}

function caster(cls, armorLink) {
  const p = new Player();
  p.name = 'Test';
  p.race = 'Human';
  p.class = cls;
  p.level = 5;
  if (armorLink) p.equipItem('armor', { link: armorLink });
  return p;
}

test('an armored wizard is warned, with the percentage', () => {
  renderWith(caster('Wizard', 'items/Armor/chain-shirt'));
  expect(screen.getByText('Arcane spell failure 20%')).toBeInTheDocument();
});

test('the same wizard in robes is told nothing', () => {
  const { container } = renderWith(caster('Wizard', null));
  expect(container).toBeEmptyDOMElement();
});

test('a cleric in the same armor is told nothing', () => {
  const { container } = renderWith(caster('Cleric', 'items/Armor/chain-shirt'));
  expect(container).toBeEmptyDOMElement();
});

test('a bard in light armor is told nothing', () => {
  const { container } = renderWith(caster('Bard', 'items/Armor/chain-shirt'));
  expect(container).toBeEmptyDOMElement();
});

test('the explanation opens and names the number the dice must beat', () => {
  renderWith(caster('Wizard', 'items/Armor/chain-shirt'));
  fireEvent.click(screen.getByRole('button', { name: /how arcane spell failure works/i }));
  const box = screen.getByRole('dialog', { name: 'Arcane spell failure' });
  expect(within(box).getByText(/20 or less/)).toBeInTheDocument();
  expect(within(box).getByText('somatic')).toBeInTheDocument();
});
