import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import SkillsPage from './skills_page';
import { setLanguage } from '../../lib/i18n';

/**
 * Sorting a list of skills by name.
 *
 * The list is sorted on the name the reader can see, not on the English one
 * behind it: an Italian list sorted in English order files *Ascoltare* under
 * L, which is not a sort at all — it is the English list with Italian words
 * written on it.
 */

function renderPage() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Rogue';
  p.level = 3;
  p.race = 'Human';
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player: p, playerSheetSidebarCollapsed: false },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><SkillsPage /></Provider>);
}

/* The rows are buttons carrying the skill's name; the sort chips are buttons
   too, so the list is read off the ones that name a skill we asked about. */
const positionOf = (name) => screen.getAllByRole('button')
  .findIndex((b) => b.textContent.trim().startsWith(name));

afterEach(() => setLanguage('en'));

describe('sorted by name', () => {
  test('English reads in English order', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(positionOf('Appraise')).toBeLessThan(positionOf('Listen'));
    expect(positionOf('Listen')).toBeLessThan(positionOf('Swim'));
  });

  test('Italian reads in Italian order', () => {
    setLanguage('it');
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Nome' }));
    /* Ascoltare (Listen) belongs near the top, and Nuotare (Swim) before
       Valutare (Appraise) — none of which is true of the English spelling. */
    expect(positionOf('Ascoltare')).toBeLessThan(positionOf('Nuotare'));
    expect(positionOf('Nuotare')).toBeLessThan(positionOf('Valutare'));
  });
});

describe('the three sort chips', () => {
  test('each says only what it sorts by', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ability' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Total' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sort by/i })).not.toBeInTheDocument();
  });

  test('and in Italian too', () => {
    setLanguage('it');
    renderPage();
    expect(screen.getByRole('button', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Caratteristica' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Totale' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ordina per/i })).not.toBeInTheDocument();
  });
});
