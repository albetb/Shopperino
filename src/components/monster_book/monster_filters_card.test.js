import { render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import monsterBookReducer from '../../store/slices/monsterBookSlice';
import persistReducer from '../../store/slices/persistSlice';
import MonsterFiltersCard from './monster_filters_card';
import { setLanguage } from '../../lib/i18n';

/* The only control surface for the bestiary search: which files to search,
   the free-text name, the three dropdowns and the challenge-rating slider. */

function makeStore() {
  return configureStore({
    reducer: { monsterBook: monsterBookReducer, persist: persistReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

const renderCard = () => render(<Provider store={makeStore()}><MonsterFiltersCard /></Provider>);

describe('the source chips', () => {
  test('the three sources render by their English label', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Monsters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Animals' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vermin' })).toBeInTheDocument();
  });
});

describe('the same card in Italian', () => {
  afterEach(() => setLanguage('en'));

  test('the title, the source chips and the dropdown defaults translate', () => {
    setLanguage('it');
    renderCard();
    expect(screen.getByText('Trova un mostro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostri' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Animali' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insetti' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qualsiasi tipo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qualsiasi taglia' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qualsiasi terreno' })).toBeInTheDocument();
  });

  test('every terrain bucket option translates, not just the shadowed one', () => {
    // Regression: TERRAINS.map((t) => …) used to shadow the translate
    // function, which would have left every terrain label in English.
    setLanguage('it');
    renderCard();
    const terrainField = screen.getByText('Terreno').closest('label');
    const select = within(terrainField).getByRole('combobox');
    expect(within(select).getByRole('option', { name: 'Foresta' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Sotterraneo' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Altri piani' })).toBeInTheDocument();
  });

  test('the search and random buttons translate', () => {
    setLanguage('it');
    renderCard();
    expect(screen.getByRole('button', { name: /Cerca/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Casuale/ })).toBeInTheDocument();
  });
});
