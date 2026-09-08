import { render, screen } from '@testing-library/react';
import Drawer from './Drawer';
import { setLanguage } from '../../lib/i18n';

describe('the close button in two languages', () => {
  afterEach(() => setLanguage('en'));

  test('English', () => {
    render(<Drawer open title="Menu" onClose={() => {}}>content</Drawer>);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  test('Italian', () => {
    setLanguage('it');
    render(<Drawer open title="Menu" onClose={() => {}}>content</Drawer>);
    expect(screen.getByRole('button', { name: 'Chiudi il menu' })).toBeInTheDocument();
  });
});
