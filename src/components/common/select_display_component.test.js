import { render, screen, fireEvent } from '@testing-library/react';
import SelectDisplayComponent from './select_display_component';
import { setLanguage } from '../../lib/i18n';

/* nameDomain lets this generic row translate its options (race and class
   names) without knowing which domain it is showing. The <option> value must
   stay the English name underneath — it is what onSelect hands back to the
   store — only the text the reader sees changes. */

afterEach(() => setLanguage('en'));

test('options render in Italian but still select the English value', () => {
  setLanguage('it');
  const onSelect = jest.fn();
  render(
    <SelectDisplayComponent
      label="Razza"
      options={['Human', 'Dwarf']}
      nameDomain="races"
      value="Human"
      onSelect={onSelect}
    />
  );
  expect(screen.getByText('Umano')).toBeInTheDocument();
  expect(screen.getByText('Nano')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Dwarf' } });
  expect(onSelect).toHaveBeenCalledWith('Dwarf');
});

test('without a nameDomain, options render as-is', () => {
  render(
    <SelectDisplayComponent
      label="Race"
      options={['Human', 'Dwarf']}
      value="Human"
      onSelect={() => {}}
    />
  );
  expect(screen.getByText('Human')).toBeInTheDocument();
});
