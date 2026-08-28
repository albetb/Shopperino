import { render, screen, fireEvent, within } from '@testing-library/react';
import StatInfo from './StatInfo';
import { contribution, situational, BONUS_TYPES } from '../../lib/player/contributions';

/* Two rules carry this component. It must render nothing at all when there is
   nothing to say — that is how "only show the button when something affects
   this number" is implemented once instead of at every call site. And it must
   check its own arithmetic: if the rows do not add up to the number the sheet
   shows, a source reached the getter and not its breakdown, and saying so is
   more useful than printing a total that quietly disagrees. */

const AC_ROWS = [
  contribution('base', 'base', 10),
  contribution('ability', 'Dexterity', 3),
  contribution('armor', 'Chain shirt', 4, BONUS_TYPES.ARMOR),
  contribution('shield', 'Shield, heavy steel', 2, BONUS_TYPES.SHIELD),
];

const GIANTS = situational('race:ac', 'Dwarf', '+4 dodge bonus against giants');

/* jsdom's window is 1024 wide, so isMobile() is false and the popover path is
   the default. Narrowing it is how the sheet path gets exercised. */
function setViewport(width) {
  window.innerWidth = width;
  fireEvent(window, new Event('resize'));
}

afterEach(() => { window.innerWidth = 1024; });

describe('when there is nothing to say', () => {
  test('renders nothing at all', () => {
    const { container } = render(<StatInfo label="AC" value={10} contributions={[]} situational={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when the lists are omitted entirely', () => {
    const { container } = render(<StatInfo label="AC" value={10} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('but a situational note alone is enough to earn a button', () => {
    render(<StatInfo label="AC" value={10} contributions={[]} situational={[GIANTS]} />);
    expect(screen.getByRole('button', { name: /what makes up ac/i })).toBeInTheDocument();
  });
});

describe('the popover', () => {
  test('opens on click and lists one row per contribution', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    expect(screen.queryByText('Chain shirt')).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    const box = screen.getByRole('dialog', { name: 'AC' });
    expect(within(box).getByText('base')).toBeInTheDocument();
    expect(within(box).getByText('Chain shirt')).toBeInTheDocument();
    expect(within(box).getByText('Shield, heavy steel')).toBeInTheDocument();
    expect(within(box).getByText('+4')).toBeInTheDocument();
  });

  test('shows a total, and it equals the sum of the rows', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    expect(screen.getByLabelText('Total 19')).toBeInTheDocument();
  });

  test('names the bonus type where the source has one', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    expect(screen.getByText('armor')).toBeInTheDocument();
    expect(screen.getByText('shield')).toBeInTheDocument();
  });

  test('closes again on a second click', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    const button = screen.getByRole('button', { name: /what makes up ac/i });
    fireEvent.click(button);
    expect(screen.getByRole('dialog', { name: 'AC' })).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByRole('dialog', { name: 'AC' })).toBe(null);
  });

  test('renders above a bottom sheet rather than behind one', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    // .sh-sheet sits at 1101 in atoms.css; jsdom loads no CSS, so the guard has
    // to compare against that number by hand.
    expect(Number(screen.getByRole('dialog', { name: 'AC' }).style.zIndex)).toBeGreaterThan(1101);
  });
});

describe('the situational group', () => {
  test('is labelled and separate from the rows that add up', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} situational={[GIANTS]} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    expect(screen.getByText('Situational')).toBeInTheDocument();
    expect(screen.getByText('+4 dodge bonus against giants')).toBeInTheDocument();
    // It must not have been counted: the total is still the sum of the rows.
    expect(screen.getByLabelText('Total 19')).toBeInTheDocument();
  });

  test('is absent when there is nothing situational', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    expect(screen.queryByText('Situational')).toBe(null);
  });
});

describe('when the rows do not add up', () => {
  test('the mismatch is stated rather than hidden', () => {
    // 19 worth of rows against a sheet claiming 21 — a source went missing.
    render(<StatInfo label="AC" value={21} contributions={AC_ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/add up to 19, but the sheet shows 21/i);
  });

  test('no warning when they agree', () => {
    render(<StatInfo label="AC" value={19} contributions={AC_ROWS} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up ac/i }));
    expect(screen.queryByRole('status')).toBe(null);
  });
});

describe('on a narrow screen', () => {
  test('the box is a bottom sheet instead of a popover', () => {
    setViewport(500);
    render(<StatInfo label="Fort" value={7} contributions={[contribution('base', 'class base save', 6)]} />);
    fireEvent.click(screen.getByRole('button', { name: /what makes up fort/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('sh-sheet');
    expect(within(dialog).getByText('class base save')).toBeInTheDocument();
  });
});
