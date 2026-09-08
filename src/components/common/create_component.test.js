import { render, screen } from '@testing-library/react';
import CreateComponent from './create_component';
import { setLanguage } from '../../lib/i18n';

/* The placeholder is built from props.tabName, one of a small fixed set of
   English words. It is looked up through an explicit map rather than glued
   together with tx(), because Italian needs "nuova città" but "nuovo mondo" —
   an adjective agreeing in gender with the noun it precedes, which a single
   translated hole cannot do. */

afterEach(() => setLanguage('en'));

const props = (tabName) => ({ tabName, onNew: () => {}, setIsVisible: () => {} });

test('English placeholder by default', () => {
  render(<CreateComponent props={props('world')} />);
  expect(screen.getByPlaceholderText('Insert new world name')).toBeInTheDocument();
});

test('Italian agrees in gender for a masculine noun', () => {
  setLanguage('it');
  render(<CreateComponent props={props('world')} />);
  expect(screen.getByPlaceholderText('Inserisci il nome del nuovo mondo')).toBeInTheDocument();
});

test('Italian agrees in gender for a feminine noun', () => {
  setLanguage('it');
  render(<CreateComponent props={props('city')} />);
  expect(screen.getByPlaceholderText('Inserisci il nome della nuova città')).toBeInTheDocument();
});
