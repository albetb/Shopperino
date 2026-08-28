import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import FeatsPage from './feats_page';

/* The picker opens from inside the "Choose a feat" bottom sheet, so it has to
   clear the sheet's stacking context to be seen at all. These are the values
   .sh-scrim / .sh-sheet use in atoms.css — jsdom loads no CSS, so the guard
   has to compare against them by hand. */
const SHEET_Z = 1101;

function renderFeatsPage(player) {
  const store = configureStore({
    /* The page only reads playerSheet; `persist` is here because the add
       thunk looks up the saved-character slot before writing. With no slot it
       stops after mutating the player, which is all these assertions need. */
    reducer: (state = { playerSheet: { player }, persist: { pss: null } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(
    <Provider store={store}>
      <FeatsPage />
    </Provider>
  );
}

function makePlayer() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = 6;
  return p;
}

function openPicker(featName) {
  fireEvent.click(screen.getByRole('button', { name: /choose feat/i }));
  fireEvent.change(screen.getByPlaceholderText(/search feats/i), {
    target: { value: featName },
  });
  // "Weapon focus" also matches "Greater weapon focus" in the filtered list, so
  // the add button has to be picked by the feat it belongs to.
  fireEvent.click(screen.getByRole('button', { name: `Add ${featName}` }));
}

describe('the choice popover for repeatable feats', () => {
  test('a weapon-choice feat opens the picker with its options', () => {
    renderFeatsPage(makePlayer());
    openPicker('Weapon focus');

    const select = screen.getByRole('combobox', { name: /select option for weapon focus/i });
    expect(select).toBeInTheDocument();
    // The option list comes from items.json, so it should be long and real.
    expect(within(select).getAllByRole('option').length).toBeGreaterThan(20);
  });

  test('the picker renders above the feat sheet, not behind it', () => {
    renderFeatsPage(makePlayer());
    openPicker('Weapon focus');

    // Testing Library has no query for "the positioned container this control
    // sits in", and the stacking order is the whole point of this test.
    // eslint-disable-next-line testing-library/no-node-access
    const popover = document.querySelector('.feat-choice-popover');
    expect(popover).not.toBe(null);
    expect(Number(popover.style.zIndex)).toBeGreaterThan(SHEET_Z);
  });

  test('confirming a choice stores the feat with its choice attached', () => {
    const player = makePlayer();
    renderFeatsPage(player);
    openPicker('Weapon focus');

    const select = screen.getByRole('combobox', { name: /select option for weapon focus/i });
    fireEvent.change(select, { target: { value: 'Longsword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(player.getFeats()).toContain('Weapon focus (Longsword)');
  });
});

describe('a choice feat with nothing to choose', () => {
  function makeWizard() {
    const p = new Player();
    p.name = 'Test';
    p.class = 'Wizard';
    p.level = 6;
    return p;
  }

  test('Greater spell focus says why it has no options instead of doing nothing', () => {
    const player = makeWizard();
    renderFeatsPage(player);
    openPicker('Greater spell focus');

    expect(screen.getByText(/no spell focus feat selected/i)).toBeInTheDocument();
    // The point of the fix: the bare feat is not silently added.
    expect(player.getFeats()).toEqual([]);
    // Nothing to confirm, so only the close button is offered.
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBe(null);
  });

  test('taking Spell focus first unlocks that school for Greater spell focus', () => {
    const player = makeWizard();
    player.feats = ['Spell focus (Evocation)'];
    renderFeatsPage(player);
    openPicker('Greater spell focus');

    const select = screen.getByRole('combobox', { name: /select option for greater spell focus/i });
    const options = within(select).getAllByRole('option').map((o) => o.value);
    // The placeholder plus exactly the one focused school — no other school.
    expect(options).toEqual(['', 'Evocation']);
  });

  test('once every focused school is taken, the reason changes', () => {
    const player = makeWizard();
    player.feats = ['Spell focus (Evocation)', 'Greater spell focus (Evocation)'];
    renderFeatsPage(player);
    openPicker('Greater spell focus');

    expect(screen.getByText(/already has greater spell focus/i)).toBeInTheDocument();
  });
});
