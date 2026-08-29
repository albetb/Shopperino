import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import CombatStancesRow from './combat_stances_row';

/* The one control on the attacks card that is an input rather than a readout.
 * What these tests hold: it appears only for the feats the character actually
 * has, stepping it reaches the model, and going past the legal cap is flagged
 * rather than blocked — the non-enforcing rule in CLAUDE.md.
 */

function renderRow(player) {
  const dispatched = [];
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player },
      persist: { pss: 0, psc: [player.serialize()] },
      app: { infoCards: [] },
    }) => state,
    // Ahead of redux-thunk, so a thunk is recorded rather than swallowed.
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false })
      .prepend(() => () => (action) => {
        dispatched.push(action);
        return undefined;
      }),
  });
  render(<Provider store={store}><CombatStancesRow /></Provider>);
  return dispatched;
}

function fighter(level = 12, feats = ['Power attack', 'Combat expertise']) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(level);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

describe('what appears', () => {
  test('nothing at all for a character with neither feat', () => {
    const { container } = render(
      <Provider store={configureStore({
        reducer: (state = { playerSheet: { player: fighter(12, []) }, app: { infoCards: [] } }) => state,
        middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
      })}><CombatStancesRow /></Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('only the feat that was taken', () => {
    renderRow(fighter(12, ['Power attack']));
    expect(screen.getByText('Power attack')).toBeInTheDocument();
    expect(screen.queryByText('Combat expertise')).toBe(null);
  });

  test('both, when both were taken', () => {
    renderRow(fighter());
    expect(screen.getByText('Power attack')).toBeInTheDocument();
    expect(screen.getByText('Combat expertise')).toBeInTheDocument();
  });
});

describe('stepping it', () => {
  test('the count starts at zero and the minus is unusable there', () => {
    renderRow(fighter(12, ['Power attack']));
    expect(screen.getByLabelText('Power attack 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Less Power attack' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More Power attack' })).toBeEnabled();
  });

  test('adding one dispatches a thunk', () => {
    const dispatched = renderRow(fighter(12, ['Power attack']));
    fireEvent.click(screen.getByRole('button', { name: 'More Power attack' }));
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(1);
  });

  test('a declared trade shows what it costs and what it buys', () => {
    const p = fighter();
    p.setPowerAttack(4);
    p.setCombatExpertise(2);
    renderRow(p);
    expect(screen.getByLabelText('Power attack 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Combat expertise 2')).toBeInTheDocument();
    // Combat expertise buys AC; Power attack's damage depends on the weapon,
    // so it is the weapon rows above that report it.
    expect(screen.getByText('+2 AC')).toBeInTheDocument();
    expect(screen.getAllByText('−4 to hit')).toHaveLength(1);
  });
});

describe('over the cap', () => {
  test('a 3rd-level fighter past his attack bonus is flagged, not stopped', () => {
    const p = fighter(3, ['Power attack']);
    p.setPowerAttack(7);
    renderRow(p);
    // The value is kept exactly as declared.
    expect(screen.getByLabelText('Power attack 7')).toBeInTheDocument();
    expect(screen.getByText(/4 over your base attack bonus of 3/)).toBeInTheDocument();
  });

  test('inside the cap says nothing', () => {
    const p = fighter(3, ['Power attack']);
    p.setPowerAttack(3);
    renderRow(p);
    expect(screen.queryByText(/over your base attack bonus/)).toBe(null);
  });
});
