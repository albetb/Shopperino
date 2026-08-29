import { render, screen, fireEvent, within } from '@testing-library/react';
import InfoPopover from './InfoPopover';

/* The prose sibling of StatInfo. What matters is that the explanation is
   genuinely hidden until asked for — the whole reason it moved off the cards
   was that a paragraph of rules text is read once and scrolled past forever
   after — and that it opens above a bottom sheet rather than behind one. */

afterEach(() => { window.innerWidth = 1024; });

const open = (label) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`how ${label} works`, 'i') }));

test('the explanation is not in the document until the button is pressed', () => {
  render(<InfoPopover label="Turn undead"><p>Two rolls, in this order.</p></InfoPopover>);
  expect(screen.queryByText(/two rolls/i)).toBe(null);
  open('turn undead');
  expect(screen.getByText(/two rolls/i)).toBeInTheDocument();
});

test('a second press closes it again', () => {
  render(<InfoPopover label="Wild Shape"><p>A standard action.</p></InfoPopover>);
  open('wild shape');
  expect(screen.getByRole('dialog', { name: 'Wild Shape' })).toBeInTheDocument();
  open('wild shape');
  expect(screen.queryByRole('dialog')).toBe(null);
});

test('it opens above a bottom sheet, not behind one', () => {
  render(<InfoPopover label="Turn undead"><p>Body.</p></InfoPopover>);
  open('turn undead');
  // .sh-sheet sits at 1101 in atoms.css; jsdom loads no CSS, so the guard has
  // to compare against that number by hand.
  const dialog = screen.getByRole('dialog', { name: 'Turn undead' });
  expect(Number(dialog.style.zIndex)).toBeGreaterThan(1101);
});

test('on a narrow screen it is a bottom sheet instead', () => {
  window.innerWidth = 500;
  render(<InfoPopover label="Elemental Shape"><p>Air, earth, fire and water.</p></InfoPopover>);
  open('elemental shape');
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveClass('sh-sheet');
  expect(within(dialog).getByText(/air, earth/i)).toBeInTheDocument();
});
