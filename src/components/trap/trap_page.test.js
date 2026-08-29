import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import trapReducer from '../../store/slices/trapSlice';
import appReducer from '../../store/slices/appSlice';
import TrapPage, { TrapRollControls } from './trap_page';
import { getTrapByRef } from '../../lib/trap';

/* The page: roll one, pick one, edit one.
 *
 * The two routes produce the same shape, so after either of them the sheet
 * cannot tell a rolled trap from a printed one — which is the point, and what
 * makes editing work identically on both.
 */

function renderPage(preloaded = {}) {
  const store = configureStore({
    reducer: { trap: trapReducer, app: appReducer },
    preloadedState: { trap: { ...trapReducer(undefined, { type: '@@init' }), ...preloaded } },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  /* The roll controls live in the sidebar on a desktop and inline on a phone;
     jsdom is a desktop, so they are rendered beside the page here exactly as
     TrapSidebar renders them. */
  render(
    <Provider store={store}>
      <TrapRollControls />
      <TrapPage />
    </Provider>
  );
  return store;
}

const roll = () => fireEvent.click(screen.getByRole('button', { name: /Roll a trap/i }));

describe('with nothing on the page yet', () => {
  test('it says what the two routes are', () => {
    renderPage();
    expect(screen.getByText(/Roll a trap to a Challenge Rating/)).toBeInTheDocument();
  });

  test('the catalogue is there, collapsed, and counts what it holds', () => {
    renderPage();
    expect(screen.getByText(/The book's traps \(105\)/)).toBeInTheDocument();
  });
});

describe('rolling', () => {
  test('a roll puts a trap on the page at the CR asked for', () => {
    const store = renderPage({ targetCR: 6 });
    roll();
    expect(store.getState().trap.trap).toBeTruthy();
    expect(screen.getByText('CR 6', { selector: '.trap-badge-cr' })).toBeInTheDocument();
  });

  test('the kind can be asked for and is honoured', () => {
    const store = renderPage({ targetCR: 4, rollType: 'spell' });
    roll();
    expect(store.getState().trap.trap.type).toBe('spell');
    expect(screen.getByText('Spell', { selector: '.trap-badge' })).toBeInTheDocument();
  });

  test('rolling again replaces the trap rather than keeping both', () => {
    const store = renderPage({ targetCR: 3 });
    roll();
    const first = store.getState().trap.trap;
    roll();
    expect(store.getState().trap.trap).not.toBe(first);
    expect(screen.getAllByLabelText('Trap name')).toHaveLength(1);
  });
});

describe('the catalogue', () => {
  const open = () => fireEvent.click(screen.getByText(/The book's traps/));

  test('filters by name', () => {
    renderPage({ isCatalogueCollapsed: false });
    fireEvent.change(screen.getByLabelText('Filter by name'), { target: { value: 'pit' } });
    const rows = screen.getAllByRole('button', { name: /CR \d+/ });
    rows.forEach((r) => expect(r.textContent.toLowerCase()).toContain('pit'));
  });

  test('filters by CR band', () => {
    renderPage({ isCatalogueCollapsed: false });
    fireEvent.change(screen.getByLabelText('Lowest CR'), { target: { value: '9' } });
    expect(screen.getByText(/The book's traps \(11\)/)).toBeInTheDocument();
  });

  test('picking one loads it into the sheet', () => {
    const store = renderPage({ isCatalogueCollapsed: false, filters: { name: 'Basic Arrow', type: '', minCR: 1, maxCR: 10 } });
    fireEvent.click(screen.getByRole('button', { name: /Basic Arrow Trap/ }));
    expect(store.getState().trap.trap.ref).toBe('traps/cr1/basic-arrow-trap');
    expect(screen.getByLabelText('Trap name')).toHaveValue('Basic Arrow Trap');
  });

  test('and it can be collapsed out of the way', () => {
    renderPage({ isCatalogueCollapsed: false });
    expect(screen.getByLabelText('Filter by name')).toBeInTheDocument();
    open();
    expect(screen.queryByLabelText('Filter by name')).not.toBeInTheDocument();
  });
});

describe('the sheet', () => {
  const withTrap = (ref) => renderPage({ trap: { ...getTrapByRef(ref) } });

  test('shows the CR its own tables add up to', () => {
    withTrap('traps/cr5/fireball-trap');
    expect(screen.getByText('CR 5', { selector: '.trap-badge-cr' })).toBeInTheDocument();
  });

  test('the breakdown adds up to the CR shown', () => {
    withTrap('traps/cr5/falling-block-trap');
    const box = document.querySelector('.trap-breakdown');
    const total = Number(within(box).getByText(/^\d+$/).textContent);
    const rows = [...box.querySelectorAll('.trap-breakdown-value')]
      .map((n) => Number(n.textContent.replace('+', '')));
    expect(rows.reduce((a, b) => a + b, 0)).toBe(total);
  });

  test('a sample the book rates differently says so', () => {
    /* Ten of the 105 do not derive from the book's own tables. Saying which
       is better than quietly showing a number that disagrees with the page
       the master is reading from. */
    withTrap('traps/cr8/well-camouflaged-pit-trap');
    expect(screen.getByText(/The book prints this as/)).toBeInTheDocument();
  });

  test('an ordinary sample says nothing of the sort', () => {
    withTrap('traps/cr1/basic-arrow-trap');
    expect(screen.queryByText(/The book prints this as/)).not.toBeInTheDocument();
  });
});

describe('editing', () => {
  test('raising the Disable DC raises the CR and the price', () => {
    /* This is the whole reason the page edits rather than only re-rolls. */
    const store = renderPage({ trap: { ...getTrapByRef('traps/cr1/portcullis-trap') } });
    const badge = () => screen.getByText(/^CR \d+$/, { selector: '.trap-badge-cr' }).textContent;
    expect(badge()).toBe('CR 2');
    fireEvent.change(screen.getByLabelText('Disable Device DC'), { target: { value: '30' } });
    expect(badge()).toBe('CR 4');
    expect(store.getState().trap.trap.disableDeviceDC).toBe(30);
  });

  test('a value the rules never intended is accepted and priced', () => {
    // Computed and displayed, never enforced.
    renderPage({ trap: { ...getTrapByRef('traps/cr1/basic-arrow-trap') } });
    fireEvent.change(screen.getByLabelText('Search DC'), { target: { value: '99' } });
    expect(screen.getByText('CR 3', { selector: '.trap-badge-cr' })).toBeInTheDocument();
  });

  test('changing the trigger changes what the diagram draws', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr1/deeper-pit-trap') } });
    // A location trigger is the trapped square itself.
    expect(screen.getByText(/Springs when a creature enters/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Trigger' }), { target: { value: 'proximity' } });
    expect(screen.getByText(/a flyer included/)).toBeInTheDocument();
  });

  test('a mechanical trap is not offered a trigger only magic can have', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr1/basic-arrow-trap') } });
    const options = [...screen.getByRole('combobox', { name: 'Trigger' }).options].map((o) => o.value);
    expect(options).not.toContain('sound');
    expect(options).not.toContain('visual');
  });

  test('a magic trap is', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr5/fireball-trap') } });
    const options = [...screen.getByRole('combobox', { name: 'Trigger' }).options].map((o) => o.value);
    expect(options).toContain('visual');
  });
});

describe('the diagram', () => {
  test('draws the squares the trap catches', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr4/poisoned-dart-trap') } });
    expect(document.querySelectorAll('.trap-cell.is-effect')).toHaveLength(4);
    expect(screen.getByText(/An area 3 m by 3 m/)).toBeInTheDocument();
  });

  test('a room gets walls and says everything inside is caught', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr4/water-filled-room-trap') } });
    expect(document.querySelectorAll('.trap-cell.is-wall').length).toBeGreaterThan(0);
    expect(screen.getByText(/everything inside is caught/)).toBeInTheDocument();
  });

  test('a trap with a note warns that the diagram is not the whole story', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr2/large-net-trap') } });
    expect(screen.getByText(/carries a note the diagram cannot draw/)).toBeInTheDocument();
  });
});

describe('the price', () => {
  test('a mechanical trap shows its modifiers and the CR they multiply by', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr4/wall-scythe-trap') } });
    expect(screen.getByText('Market price')).toBeInTheDocument();
    expect(screen.getByText(/Subtotal .* × CR/)).toBeInTheDocument();
  });

  test('a poisoned trap says the poison costs extra', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr4/poisoned-dart-trap') } });
    expect(screen.getByText(/The poison costs extra on top/)).toBeInTheDocument();
  });

  test('a magic device shows gold and experience', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr5/fireball-trap') } });
    expect(screen.getByText('Cost to create')).toBeInTheDocument();
    expect(screen.getByText(/XP$/)).toBeInTheDocument();
  });

  test('a spell trap is free, and says who was hired', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr3/fire-trap') } });
    expect(screen.getByText(/free — a spell trap is cast, not built/)).toBeInTheDocument();
  });

  test('only a mechanical trap has a Craft DC', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr1/basic-arrow-trap') } });
    expect(screen.getByText('Craft (trapmaking) DC')).toBeInTheDocument();
  });

  test('and a magic one does not — nobody crafts it with trapmaking', () => {
    renderPage({ trap: { ...getTrapByRef('traps/cr5/fireball-trap') } });
    expect(screen.queryByText('Craft (trapmaking) DC')).not.toBeInTheDocument();
  });
});
