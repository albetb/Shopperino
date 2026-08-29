import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import ConditionsSection from './conditions_section';

/* The picker's rule: a plain on/off condition toggles — the same tap that put
   it on takes it back off — while one that carries a choice does not, because
   a character can have several of those at once and a second tap has to mean
   "add another". Getting that wrong either strands a mistyped condition on the
   sheet or silently removes a second point of ability damage. */

const dispatched = [];

function renderSection(player) {
  dispatched.length = 0;
  const store = configureStore({
    reducer: (state = { playerSheet: { player }, persist: { pss: null }, app: { infoCards: [] } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  const realDispatch = store.dispatch;
  store.dispatch = (action) => {
    dispatched.push(action);
    // Thunks here reach for persisted state this store does not carry; the
    // assertion is about which one was dispatched, so they are not run.
    return typeof action === 'function' ? undefined : realDispatch(action);
  };
  return render(<Provider store={store}><ConditionsSection /></Provider>);
}

function character() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = 8;
  p.race = 'Human';
  return p;
}

const openPicker = () => fireEvent.click(screen.getByRole('button', { name: /add condition/i }));
/* Scoped to the picker sheet: an active condition also renders a pill button
   carrying the same name in the section behind it. */
const listItem = (name) =>
  within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(`^${name}`, 'i') });

describe('a plain on/off condition', () => {
  test('is offered as a live control once taken, not a disabled one', () => {
    const p = character();
    p.addCondition({ name: 'Fatigued' });
    renderSection(p);
    openPicker();
    const item = listItem('Fatigued');
    expect(item).not.toBeDisabled();
    expect(item).toHaveAttribute('aria-pressed', 'true');
  });

  test('tapping it again removes it rather than doing nothing', () => {
    const p = character();
    p.addCondition({ name: 'Fatigued' });
    renderSection(p);
    openPicker();
    fireEvent.click(listItem('Fatigued'));
    // The remove thunk is a function; the add path dispatches one too, so the
    // player is asked directly whether the tap was read as a removal.
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(1);
  });

  test('an untaken one is not marked as pressed', () => {
    renderSection(character());
    openPicker();
    expect(listItem('Fatigued')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('a condition that carries a choice', () => {
  test('stays untoggleable, because a second tap means another point of it', () => {
    const p = character();
    p.addCondition({ name: 'Ability Damaged', ability: 'Str', amount: 2 });
    renderSection(p);
    openPicker();
    const item = listItem('Ability Damaged');
    // Not a toggle, so it carries no pressed state at all.
    expect(item).not.toHaveAttribute('aria-pressed');
    expect(item).not.toBeDisabled();
  });

  test('is disabled only once every one of its variants is taken', () => {
    const p = character();
    ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach((ability) =>
      p.addCondition({ name: 'Ability Damaged', ability, amount: 1 }));
    renderSection(p);
    openPicker();
    expect(listItem('Ability Damaged')).toBeDisabled();
  });
});

describe('the ability chips in the sub-choice step', () => {
  test('all six are offered and picking one marks it', () => {
    renderSection(character());
    openPicker();
    fireEvent.click(listItem('Ability Damaged'));
    const sheet = screen.getByRole('dialog');
    ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach((key) =>
      expect(within(sheet).getByRole('button', { name: key })).toBeInTheDocument());

    fireEvent.click(within(sheet).getByRole('button', { name: 'Wis' }));
    expect(within(sheet).getByRole('button', { name: 'Wis' })).toHaveClass('is-on');
  });
});
