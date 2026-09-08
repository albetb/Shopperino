import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import DiceRollerSheet from './DiceRollerSheet';
import { setLanguage } from '../../lib/i18n';

/* The sheet has no character behind it — only the persisted count and last
   roll, both of which start empty — so the tests only cover what it renders
   before the player has touched anything. */

function renderSheet() {
  const store = configureStore({
    reducer: (state = { app: { diceMultiplierMask: 1, diceLastRoll: null } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(
    <Provider store={store}>
      <DiceRollerSheet open onClose={() => {}} />
    </Provider>
  );
}

describe('the same sheet in two languages', () => {
  afterEach(() => setLanguage('en'));

  test('English is what it says by default', () => {
    renderSheet();
    expect(screen.getByText('Roll dice')).toBeInTheDocument();
    expect(screen.getByText('How many · 1 die')).toBeInTheDocument();
    expect(screen.getByText('Which die')).toBeInTheDocument();
    expect(screen.getByText('Pick a die to roll.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Number of dice' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Die type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Roll 1d20' })).toBeInTheDocument();
  });

  test('Italian shows the translated labels for the same sheet', () => {
    setLanguage('it');
    renderSheet();
    expect(screen.getByText('Tira i dadi')).toBeInTheDocument();
    expect(screen.getByText('Quanti · 1 dado')).toBeInTheDocument();
    expect(screen.getByText('Quale dado')).toBeInTheDocument();
    expect(screen.getByText('Scegli un dado da tirare.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Numero di dadi' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tipo di dado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tira 1d20' })).toBeInTheDocument();
  });
});
