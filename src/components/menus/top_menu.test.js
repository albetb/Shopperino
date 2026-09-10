import { render, screen, within, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import TopMenu, { TABS } from './top_menu';
import { setLanguage, t } from '../../lib/i18n';

/* Every tab label is looked up through a dynamic t(tab.label, 'nav') call,
   which progress.py cannot check by itself — so this test covers every value
   TABS can hand it, in both the master and player tab sets.

   Two of them read shorter here than anywhere else: navigation is where two
   labels share a row on a phone, and the full "Libro degli incantesimi" does
   not fit beside "Scheda del personaggio". */

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

  const IT = {
    Search: 'Cerca',
    Rules: 'Regole',
    Shop: 'Negozio',
    Loot: 'Bottino',
    Monsters: 'Mostri',
    Traps: 'Trappole',
    Spellbook: 'Grimorio',
    'Player sheet': 'Scheda',
  };

  test('every master-mode tab label is translated', () => {
    setLanguage('it');
    renderMenu(true);
    const nav = screen.getByRole('navigation', { name: 'Principale' });
    TABS.forEach((tab) => {
      expect(within(nav).getByText(IT[tab.label])).toBeInTheDocument();
    });
  });

  test('player-mode hides the master-only tabs, and the rest still translate', () => {
    setLanguage('it');
    renderMenu(false);
    const nav = screen.getByRole('navigation', { name: 'Principale' });
    ['Cerca', 'Regole', 'Grimorio', 'Scheda'].forEach((label) =>
      expect(within(nav).getByText(label)).toBeInTheDocument());
    ['Negozio', 'Bottino', 'Mostri', 'Trappole'].forEach((label) =>
      expect(within(nav).queryByText(label)).not.toBeInTheDocument());
  });

  test('the long names survive where there is room for them', () => {
    /* The short pair is a navigation label and nothing more — the tile on the
       home page still introduces the tool by its whole name. */
    setLanguage('it');
    expect(t('Spellbook')).toBe('Libro degli incantesimi');
    expect(t('Player sheet')).toBe('Scheda del personaggio');
  });
});

describe('what the list holds', () => {
  test('Home is not one of the destinations', () => {
    /* It is the logo in the corner, reachable from every tab; as a row it was
       a whole line spent saying "back to the start". */
    expect(TABS.some((tab) => tab.id === 0)).toBe(false);
    renderMenu(true);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).queryByText('Home')).not.toBeInTheDocument();
  });

  test('the logo still goes there', () => {
    renderMenu(true);
    expect(screen.getByRole('button', { name: /Shopperino/ })).toBeInTheDocument();
  });

  test('the order is the one the mobile grid pairs off', () => {
    /* Two to a row, so consecutive pairs are what the reader sees side by
       side: the reference tools, the generators, the master tools, the
       character's own pages. */
    expect(TABS.map((tab) => tab.label)).toEqual([
      'Search', 'Rules',
      'Shop', 'Loot',
      'Monsters', 'Traps',
      'Spellbook', 'Player sheet',
    ]);
  });

  test('the mode toggle reads Master / Giocatore, not the familiar-owner sense of Master', () => {
    setLanguage('it');
    renderMenu(true);
    /* It is a preference now, so it lives behind the gear rather than in the
       bar — on desktop as it always has on a phone. */
    fireEvent.click(screen.getByRole('button', { name: 'Impostazioni' }));
    expect(screen.getByRole('button', { name: 'Master' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giocatore' })).toBeInTheDocument();
    expect(screen.queryByText('Padrone')).not.toBeInTheDocument();
  });
});
