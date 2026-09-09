import { render, screen } from '@testing-library/react';
import SpellbookTableHeader from './spellbook_header';
import { setLanguage } from '../../lib/i18n';

/**
 * The three page titles were built by gluing the character's name to a fixed
 * English tail, which no gate could see: the scan looked between tags and
 * inside attributes, and a sentence assembled into a variable is neither.
 */
const book = { Name: 'Elarion', Class: 'Wizard' };

describe('the spellbook page title', () => {
  afterEach(() => setLanguage('en'));

  test('is a sentence with the name in it, in the reading language', () => {
    setLanguage('it');
    const { rerender } = render(<SpellbookTableHeader spellbook={book} page={0} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Elarion sta imparando incantesimi');

    rerender(<SpellbookTableHeader spellbook={book} page={1} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Elarion sta preparando incantesimi');

    rerender(<SpellbookTableHeader spellbook={book} page={2} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Libro degli incantesimi di Elarion');
  });

  test('reads the same English it always did', () => {
    setLanguage('en');
    const { rerender } = render(<SpellbookTableHeader spellbook={book} page={0} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Elarion is learning spells');

    rerender(<SpellbookTableHeader spellbook={book} page={1} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Elarion is preparing spells');

    rerender(<SpellbookTableHeader spellbook={book} page={2} />);
    expect(screen.getByRole('heading')).toHaveTextContent('Spellbook of Elarion');
  });
});
