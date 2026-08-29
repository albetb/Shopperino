import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer, { setUnits } from '../../store/slices/appSlice';
import { persistSyncMiddleware } from '../../store/persistSyncMiddleware';
import Player from '../../lib/player';
import CarryingCapacityCard from '../player_sheet/inventory/CarryingCapacityCard';

/* The switch, end to end.
 *
 * The unit tests in lib/units.test.js prove the arithmetic. This is about the
 * preference actually reaching the page — and reaching a card that shows both
 * a distance and a weight, since those are two different code paths that a
 * single-dimension card would not catch.
 */

function pc(str = 14) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(3);
  p.setAbilityScore?.('Strength', str);
  return p;
}

function renderCard(units) {
  const player = pc();
  const store = configureStore({
    reducer: { app: appReducer, playerSheet: (s = { player }) => s, persist: (s = {}) => s },
    preloadedState: { app: { ...appReducer(undefined, { type: '@@init' }), units } },
    middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
  });
  render(
    <Provider store={store}>
      <CarryingCapacityCard player={player} collapsed={false} setCollapsed={() => {}} />
    </Provider>
  );
  return store;
}

describe('the preference reaches the page', () => {
  test('metric, the default, says metres and kilograms', () => {
    renderCard('metric');
    // A human walks 30 ft, which the manual calls 9 m.
    expect(screen.getAllByText('9 m').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\bkg\b/).length).toBeGreaterThan(0);
  });

  test('imperial says feet and pounds', () => {
    renderCard('imperial');
    expect(screen.getAllByText('30 ft').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\blb\b/).length).toBeGreaterThan(0);
    expect(screen.queryByText('9 m')).not.toBeInTheDocument();
  });

  test('squares counts the speed in fives but leaves the weight metric', () => {
    /* A square is a way of counting distance, not a unit of mass — the notes
       print "9 m (6 sq)" and never a weight in squares. */
    renderCard('squares');
    expect(screen.getAllByText('6 sq').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\bkg\b/).length).toBeGreaterThan(0);
  });

  test('an unknown mode falls back to metric rather than rendering nothing', () => {
    renderCard('cubits');
    expect(screen.getAllByText('9 m').length).toBeGreaterThan(0);
  });
});

describe('the preference is remembered', () => {
  test('choosing one writes it to the saved app object', () => {
    /* It rides the same one-key path as the theme and the accent — no tuple,
       no schema change, nothing against the 5 MB budget. */
    const store = configureStore({
      reducer: { app: appReducer, persist: (s = { v: 1 }, a) => (a.type === 'persist/setPersist' ? a.payload : s) },
      middleware: (d) => d({ serializableCheck: false, immutableCheck: false }).concat(persistSyncMiddleware),
    });
    store.dispatch(setUnits('imperial'));
    expect(store.getState().persist.un).toBe('imperial');
    expect(store.getState().app.units).toBe('imperial');
  });

  test('and a nonsense value is normalized before it is stored', () => {
    const store = configureStore({
      reducer: { app: appReducer, persist: (s = { v: 1 }, a) => (a.type === 'persist/setPersist' ? a.payload : s) },
      middleware: (d) => d({ serializableCheck: false, immutableCheck: false }).concat(persistSyncMiddleware),
    });
    store.dispatch(setUnits('furlongs'));
    expect(store.getState().persist.un).toBe('metric');
  });
});
