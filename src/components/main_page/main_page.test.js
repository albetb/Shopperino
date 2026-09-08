import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import MainPage, { TILES } from './main_page';
import { setLanguage } from '../../lib/i18n';

/* Every tile title and description is looked up through a dynamic
   t(tile.title) / t(tile.desc) call, which progress.py cannot check by
   itself — so this test covers every value TILES can hand it. */

const TITLES_IT = {
  Search: 'Cerca',
  'Shop generator': 'Generatore di negozi',
  'Loot generator': 'Generatore di bottino',
  'Monster book': 'Bestiario',
  'Trap generator': 'Generatore di trappole',
  Spellbook: 'Libro degli incantesimi',
  'Player sheet': 'Scheda del personaggio',
};

function renderPage(isMasterMode) {
  const store = configureStore({
    reducer: (state = { app: { isMasterMode } }) => state,
  });
  return render(<Provider store={store}><MainPage /></Provider>);
}

describe('the home grid in Italian', () => {
  afterEach(() => setLanguage('en'));

  test('every master-mode tile title is translated', () => {
    setLanguage('it');
    renderPage(true);
    TILES.forEach((tile) => {
      expect(screen.getByText(TITLES_IT[tile.title])).toBeInTheDocument();
    });
  });

  test('player mode hides the master-only tiles', () => {
    setLanguage('it');
    renderPage(false);
    expect(screen.getByText('Cerca')).toBeInTheDocument();
    expect(screen.getByText('Scheda del personaggio')).toBeInTheDocument();
    expect(screen.queryByText('Generatore di negozi')).not.toBeInTheDocument();
    expect(screen.queryByText('Bestiario')).not.toBeInTheDocument();
  });

  test('the welcome line switches on master mode, and the mode toggle avoids the familiar-owner "Padrone"', () => {
    setLanguage('it');
    renderPage(true);
    expect(screen.getByText('Bentornato, Master')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Master' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giocatore' })).toBeInTheDocument();
    expect(screen.queryByText('Padrone')).not.toBeInTheDocument();
  });
});
