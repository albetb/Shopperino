import { render, screen, fireEvent } from '@testing-library/react';
import SelectComponent from './select_component';
import { setLanguage } from '../../lib/i18n';

/* Titles only — the dropdown options are the user's own saved names (a world,
   a character, a spellbook) and stay exactly as typed in every language. */

function props(overrides = {}) {
  return {
    saved: ['My World'],
    setIsVisible: () => {},
    onSelect: () => {},
    onDeleteItem: () => {},
    ...overrides,
  };
}

describe('the same controls in two languages', () => {
  afterEach(() => setLanguage('en'));

  test('English titles, including the delete confirm step', () => {
    render(<SelectComponent props={props()} />);
    expect(screen.getByTitle('New')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Delete'));
    expect(screen.getByTitle('Confirm')).toBeInTheDocument();
    expect(screen.getByTitle('Back')).toBeInTheDocument();
  });

  test('Italian titles for the same controls', () => {
    setLanguage('it');
    render(<SelectComponent props={props()} />);
    expect(screen.getByTitle('Nuovo')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Elimina'));
    expect(screen.getByTitle('Conferma')).toBeInTheDocument();
    expect(screen.getByTitle('Indietro')).toBeInTheDocument();
  });

  test('the saved option name is never translated', () => {
    setLanguage('it');
    render(<SelectComponent props={props({ saved: ['My World'] })} />);
    expect(screen.getByText('My World')).toBeInTheDocument();
  });
});

describe('the empty state', () => {
  afterEach(() => setLanguage('en'));

  test('Italian shows the translated New button when nothing is saved yet', () => {
    setLanguage('it');
    render(<SelectComponent props={props({ saved: [] })} />);
    expect(screen.getByTitle('Nuovo')).toBeInTheDocument();
  });
});
