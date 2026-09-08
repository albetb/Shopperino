import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer, { setLang } from '../../store/slices/appSlice';
import persistReducer from '../../store/slices/persistSlice';
import { persistSyncMiddleware } from '../../store/persistSyncMiddleware';
import { getLanguage, setLanguage, t, LANGUAGES } from '../../lib/i18n';
import TopMenu from './top_menu';

/* The switch, end to end.
 *
 * i18n.test.js proves the packs answer correctly once a language is set. This
 * is about the control in the settings sheet actually setting it: that the
 * button is there, that pressing it moves the store, the module-level `t()`
 * and the saved preference together, and that pressing English again puts
 * everything back. Those three move through different code — a reducer, a
 * side effect inside that reducer, and the persist middleware — so a test that
 * only checked the store would pass while the screen stayed English.
 */

function renderMenu(lang = 'en') {
  const store = configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (s = { player: null }) => s,
      persist: persistReducer,
    },
    preloadedState: {
      app: { ...appReducer(undefined, { type: '@@init' }), lang },
    },
    middleware: (d) => d({ serializableCheck: false, immutableCheck: false })
      .concat(persistSyncMiddleware),
  });
  render(<Provider store={store}><TopMenu /></Provider>);
  return store;
}

/** The settings sheet is behind the gear; the switch lives inside it. */
function openSettings() {
  fireEvent.click(screen.getByRole('button', { name: /settings/i }));
  return screen.getByRole('group', { name: /language/i });
}

afterEach(() => setLanguage('en'));

describe('the language switch in the settings menu', () => {
  test('offers every language the app knows, each written in its own name', () => {
    renderMenu();
    const group = openSettings();
    LANGUAGES.forEach((l) => {
      expect(within(group).getByRole('button', { name: l.endonym })).toBeInTheDocument();
    });
    // Not "Italian" — someone looking for Italian is looking for Italiano.
    expect(within(group).queryByRole('button', { name: 'Italian' })).toBeNull();
  });

  test('English is the one pressed until something changes it', () => {
    renderMenu();
    const group = openSettings();
    expect(within(group).getByRole('button', { name: 'English' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'Italiano' }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  test('choosing Italiano moves the store, t() and the saved preference', () => {
    const store = renderMenu();
    const group = openSettings();

    fireEvent.click(within(group).getByRole('button', { name: 'Italiano' }));

    expect(store.getState().app.lang).toBe('it');
    expect(getLanguage()).toBe('it');           // the module global the components read
    expect(t('Save')).toBe('Salva');            // and it actually translates
    expect(store.getState().persist.lg).toBe('it');  // survives a reload
  });

  test('the pressed state follows the choice', () => {
    renderMenu();
    const group = openSettings();
    fireEvent.click(within(group).getByRole('button', { name: 'Italiano' }));

    expect(within(group).getByRole('button', { name: 'Italiano' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'English' }))
      .toHaveAttribute('aria-pressed', 'false');
  });

  test('going back to English leaves nothing behind', () => {
    const store = renderMenu('it');
    const group = openSettings();

    fireEvent.click(within(group).getByRole('button', { name: 'English' }));

    expect(store.getState().app.lang).toBe('en');
    expect(getLanguage()).toBe('en');
    expect(t('Save')).toBe('Save');
    expect(store.getState().persist.lg).toBe('en');
  });

  test('a language the app does not have falls back to English', () => {
    const store = renderMenu();
    store.dispatch(setLang('xx'));
    expect(store.getState().app.lang).toBe('en');
    expect(getLanguage()).toBe('en');
  });
});
