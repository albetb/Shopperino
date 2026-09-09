import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import SearchPage from './search_page';
import { setLanguage } from '../../lib/i18n';

/**
 * The Search tab is the one page that prints all four data files side by side,
 * so it is where a domain that was never wired up shows first. Three columns
 * were still English: a spell's class list, a spell's name once the results are
 * grouped by class, and a wondrous item's name.
 */

function renderSearch() {
  const store = configureStore({
    reducer: (state = {
      app: { searchTypeRequest: '', infoCards: [] },
      playerSheet: { player: null },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><SearchPage /></Provider>);
}

/* The two dropdowns are the only comboboxes on the page, in the order the
   card lays them out: the type, then the spell class when the type is Spells. */
const typeSelect = () => screen.getAllByRole('combobox')[0];
const classSelect = () => screen.getAllByRole('combobox')[1];
const queryBox = () => screen.getByPlaceholderText('Filtra per nome');

const search = (type, query) => {
  fireEvent.change(typeSelect(), { target: { value: type } });
  fireEvent.change(queryBox(), { target: { value: query } });
};

beforeEach(() => setLanguage('it'));
afterEach(() => setLanguage('en'));

describe('the results table, in Italian', () => {
  test("a spell's class list is a column of vocabulary, not of English", () => {
    renderSearch();
    search('Spells', 'Fireball');
    expect(screen.getByText('Palla di fuoco')).toBeInTheDocument();
    /* "Sor/Wiz 3" — the abbreviations are initials of the class names, so
       they change with the language the manual is printed in. */
    expect(screen.getByText(/Mag\/Str 3/)).toBeInTheDocument();
  });

  test('a wondrous item is named from the pack like every other item', () => {
    renderSearch();
    search('Items', 'Bag of holding');
    expect(screen.getAllByText(/Borsa conservante/).length).toBeGreaterThan(0);
  });
});

describe('the per-class spell cards', () => {
  test('name the spell in the reading language', () => {
    renderSearch();
    fireEvent.change(typeSelect(), { target: { value: 'Spells' } });
    fireEvent.change(classSelect(), { target: { value: 'Wizard' } });
    fireEvent.change(queryBox(), { target: { value: 'Fireball' } });
    /* "Fireball" is still on the page — as the echo of what was typed into
       the filter box — so the assertion is on the row, not on the document. */
    expect(screen.getByRole('button', { name: 'Palla di fuoco' })).toBeInTheDocument();
    expect(screen.getByText('Mago — Livello 3')).toBeInTheDocument();
  });
});
