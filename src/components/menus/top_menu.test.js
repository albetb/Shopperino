import { render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import TopMenu, { TABS } from './top_menu';
import { setLanguage } from '../../lib/i18n';

/* Every tab label is looked up through a dynamic t(tab.label) call, which
   progress.py cannot check by itself — so this test covers every value TABS
   can hand it, in both the master and player tab sets. */

function renderMenu(isMasterMode) {
  const store = configureStore({
    reducer: (state = {
      app: { currentTab: 0, sharedShop: null, isMasterMode, units: 'metric', lang: 'it' },
      playerSheet: { player: null },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><TopMenu /></Provider>);
}

describe('the tab bar in Italian', () => {
  afterEach(() => setLanguage('en'));

  test('every master-mode tab label is translated', () => {
    setLanguage('it');
    renderMenu(true);
    const nav = screen.getByRole('navigation', { name: 'Principale' });
    TABS.forEach((tab) => {
      expect(within(nav).getByText(tab.label === 'Player sheet' ? 'Scheda del personaggio' : {
        Home: 'Home',
        Search: 'Cerca',
        Shop: 'Negozio',
        Loot: 'Bottino',
        Monsters: 'Mostri',
        Traps: 'Trappole',
        Spellbook: 'Libro degli incantesimi',
      }[tab.label])).toBeInTheDocument();
    });
  });

  test('player-mode hides the master-only tabs, and the rest still translate', () => {
    setLanguage('it');
    renderMenu(false);
    const nav = screen.getByRole('navigation', { name: 'Principale' });
    ['Home', 'Cerca', 'Libro degli incantesimi', 'Scheda del personaggio'].forEach((label) =>
      expect(within(nav).getByText(label)).toBeInTheDocument());
    ['Negozio', 'Bottino', 'Mostri', 'Trappole'].forEach((label) =>
      expect(within(nav).queryByText(label)).not.toBeInTheDocument());
  });

  test('the mode toggle reads Master / Giocatore, not the familiar-owner sense of Master', () => {
    setLanguage('it');
    renderMenu(true);
    expect(screen.getByRole('button', { name: 'Master' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giocatore' })).toBeInTheDocument();
    expect(screen.queryByText('Padrone')).not.toBeInTheDocument();
  });
});
