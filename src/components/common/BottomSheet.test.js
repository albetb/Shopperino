import { render, screen } from '@testing-library/react';
import BottomSheet from './BottomSheet';
import { setLanguage } from '../../lib/i18n';

describe('the close button in two languages', () => {
  afterEach(() => setLanguage('en'));

  test('English', () => {
    render(<BottomSheet open title="Test" onClose={() => {}}>content</BottomSheet>);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  test('Italian', () => {
    setLanguage('it');
    render(<BottomSheet open title="Test" onClose={() => {}}>content</BottomSheet>);
    expect(screen.getByRole('button', { name: 'Chiudi' })).toBeInTheDocument();
  });
});
