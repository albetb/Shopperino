import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer, { setIncomingGift } from '../../../store/slices/appSlice';
import Player from '../../../lib/player';
import InventoryPage from '../inventory_page';
import { encodeItemGift, parseItemGift } from '../../../lib/share';
import { setLanguage } from '../../../lib/i18n';

/**
 * Handing an item over, from the bag it leaves to the bag it lands in.
 *
 * The QR image itself is not asserted on — jsdom has no canvas to draw it —
 * but the code behind it is: what the panel would put on the screen is the
 * same string the other phone parses back, so the round trip is checked
 * through `encodeItemGift` rather than through a picture.
 */

function pc() {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(3);
  p.addInventoryItem('Longsword', 'Weapon', 3, 'items/Weapon/longsword');
  return p;
}

function renderPage(player = pc()) {
  const store = configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (state = { player, combatPageCardsCollapsed: {} }) => state,
      persist: (state = { pss: null }) => state,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  render(<Provider store={store}><InventoryPage /></Provider>);
  return { store, player };
}

const openOptions = () => fireEvent.click(screen.getAllByRole('button', { name: 'Options' })[0]);
const pressGive = () => fireEvent.click(screen.getByRole('button', { name: 'Give item' }));

afterEach(() => setLanguage('en'));

describe('the options menu', () => {
  test('offers the code beside the drop button', () => {
    renderPage();
    openOptions();
    expect(screen.getByRole('button', { name: 'Give item' })).toBeInTheDocument();
  });

  test('opening the code does not take anything out of the bag yet', () => {
    const { player } = renderPage();
    openOptions();
    pressGive();
    expect(screen.getByRole('dialog', { name: /Give item/i })).toBeInTheDocument();
    expect(player.getInventory()[0].Number).toBe(3);
  });

  test('the panel names what is being handed over, and how many', () => {
    renderPage();
    openOptions();
    pressGive();
    const panel = screen.getByRole('dialog', { name: /Give item/i });
    /* The slider opens on everything the row holds. */
    expect(panel).toHaveTextContent('Longsword');
    expect(panel).toHaveTextContent('× 3');
  });
});

describe('the two answers', () => {
  test('Keep closes the panel and leaves the bag alone', () => {
    const { player } = renderPage();
    openOptions();
    pressGive();
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.queryByRole('dialog', { name: /Give item/i })).not.toBeInTheDocument();
    expect(player.getInventory()[0].Number).toBe(3);
  });

  test('Give takes the quantity that was on the slider', () => {
    const { player } = renderPage();
    openOptions();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
    pressGive();
    fireEvent.click(screen.getByRole('button', { name: 'Give' }));
    expect(player.getInventory()[0].Number).toBe(1);
  });
});

describe('an item being offered to this character', () => {
  test('is a question first', () => {
    const { store, player } = renderPage();
    act(() => { store.dispatch(setIncomingGift({
      name: 'Potion of cure light wounds', type: 'Potion', number: 2,
      link: 'items/Potion/cure-light-wounds', masterwork: false, bonus: 0,
      effectIds: [], baseLink: '', overrides: null,
    })); });
    expect(screen.getByText(/Potion of cure light wounds/i)).toBeInTheDocument();
    expect(player.getInventory()).toHaveLength(1);
  });

  test('declining leaves nothing behind', () => {
    const { store, player } = renderPage();
    act(() => { store.dispatch(setIncomingGift({
      name: 'Rope', type: 'Good', number: 1, link: '', masterwork: false,
      bonus: 0, effectIds: [], baseLink: '', overrides: null,
    })); });
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(store.getState().app.incomingGift).toBeNull();
    expect(player.getInventory()).toHaveLength(1);
  });

  test('accepting puts it in the bag', () => {
    const { store, player } = renderPage();
    act(() => { store.dispatch(setIncomingGift({
      name: 'Rope', type: 'Good', number: 2, link: 'items/Good/rope', masterwork: false,
      bonus: 0, effectIds: [], baseLink: '', overrides: null,
    })); });
    /* The button carries its icon into its accessible name, so it is asked
       for by what it says rather than by the whole of it. */
    fireEvent.click(screen.getByRole('button', { name: /Accept/ }));
    expect(player.getInventory().find((r) => r.Name === 'Rope')?.Number).toBe(2);
    expect(store.getState().app.incomingGift).toBeNull();
  });
});

describe('in Italian', () => {
  test('the offer is read in the reading language, and travels in English', () => {
    setLanguage('it');
    const { store } = renderPage();
    act(() => { store.dispatch(setIncomingGift({
      name: 'Longsword', type: 'Weapon', number: 1, link: 'items/Weapon/longsword',
      masterwork: false, bonus: 0, effectIds: [], baseLink: '', overrides: null,
    })); });
    const offer = screen.getByRole('dialog', { name: /sta dando qualcosa a Test/i });
    expect(within(offer).getByText('Spada lunga')).toBeInTheDocument();
    /* What goes on the wire is the English name — it is identity, and the
       receiving bag stores it — so a sheet written in one language reads
       correctly in the other. */
    const { payload } = encodeItemGift({ name: 'Longsword', type: 'Weapon', number: 1 });
    expect(parseItemGift(payload).gift.name).toBe('Longsword');
  });
});
