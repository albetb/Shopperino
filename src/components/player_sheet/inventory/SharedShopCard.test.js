import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer from '../../../store/slices/appSlice';
import Player from '../../../lib/player';
import SharedShopCard from './SharedShopCard';

/* The scanned shop on the character sheet.
 *
 * A scanned shop used to be a list you could read and nothing else, one tab
 * away from the purse and the bags that any purchase concerns. This is the
 * card and the drawer that close that loop: browse, haggle, buy, and watch the
 * gold and the shelf both move.
 */

const STOCK = [
  { Name: 'Dagger', Number: 4, Cost: 2, isCustom: true, ItemType: 'Weapon' },
  { Name: 'Rope, hempen', Number: 2, Cost: 1, isCustom: true, ItemType: 'Good' },
  { Name: 'Sold out thing', Number: 0, Cost: 5, isCustom: true, ItemType: 'Good' },
];

function pc(gold = 100) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(3);
  p.setGold(gold);
  return p;
}

function renderCard({ gold = 100, stock = STOCK, shop = true } = {}) {
  const player = pc(gold);
  const app = {
    ...appReducer(undefined, { type: '@@init' }),
    sharedShop: shop ? { name: 'Gundren', gold: 500, stock } : null,
  };
  const store = configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (state = { player }) => state,
      persist: (state = { pss: null }) => state,
    },
    preloadedState: { app },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  render(<Provider store={store}><SharedShopCard player={player} /></Provider>);
  return { store, player };
}

const openDrawer = () => fireEvent.click(screen.getByRole('button', { name: /Browse and buy/i }));
const openRow = (name) => fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') }));
const rowBox = (name) => screen.getByRole('button', { name: new RegExp(name, 'i') }).closest('li');

describe('when no shop is being held', () => {
  test('there is no card at all', () => {
    renderCard({ shop: false });
    expect(screen.queryByText('Gundren')).not.toBeInTheDocument();
  });
});

describe('the card', () => {
  test('names the shop and counts what is left in it', () => {
    renderCard();
    expect(screen.getByText('Gundren')).toBeInTheDocument();
    // The sold-out row is not one of the two.
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  test('putting the shop down clears it', () => {
    const { store } = renderCard();
    fireEvent.click(screen.getByLabelText('Put this shop down'));
    expect(store.getState().app.sharedShop).toBeNull();
  });
});

describe('the drawer', () => {
  test('lists what is in stock and leaves out what is not', () => {
    renderCard();
    openDrawer();
    expect(screen.getByText('Dagger')).toBeInTheDocument();
    expect(screen.queryByText('Sold out thing')).not.toBeInTheDocument();
  });

  test('shows the purse, because the price only means something beside it', () => {
    renderCard({ gold: 42.5 });
    openDrawer();
    expect(screen.getByText('42.50 g')).toBeInTheDocument();
  });
});

describe('buying', () => {
  test('the price box opens at the asking price', () => {
    renderCard();
    openDrawer();
    openRow('Dagger');
    expect(within(rowBox('Dagger')).getByLabelText('Price for Dagger')).toHaveValue(2);
  });

  test('more of them costs more', () => {
    renderCard();
    openDrawer();
    openRow('Dagger');
    const box = rowBox('Dagger');
    // The shared Stepper fires on pointerdown, not click, so it can repeat on hold.
    fireEvent.pointerDown(within(box).getByRole('button', { name: 'Increment' }));
    expect(within(box).getByLabelText('Price for Dagger')).toHaveValue(4);
  });

  test('the gold leaves the purse and the item lands in the bag', () => {
    const { player } = renderCard({ gold: 100 });
    openDrawer();
    openRow('Dagger');
    fireEvent.click(within(rowBox('Dagger')).getByRole('button', { name: /Buy for/i }));
    expect(player.getGold()).toBe(98);
    expect(player.getInventory().find((r) => r.Name === 'Dagger')?.Number).toBe(1);
  });

  test('an edited price is what actually gets paid', () => {
    /* The whole reason the box is editable: a master gives a discount, or
       charges over the odds for the last healing potion. */
    const { player } = renderCard({ gold: 100 });
    openDrawer();
    openRow('Dagger');
    const box = rowBox('Dagger');
    fireEvent.change(within(box).getByLabelText('Price for Dagger'), { target: { value: '1' } });
    fireEvent.click(within(box).getByRole('button', { name: /Buy for/i }));
    expect(player.getGold()).toBe(99);
  });

  test('the shelf goes down by what was taken', () => {
    const { store } = renderCard();
    openDrawer();
    openRow('Dagger');
    fireEvent.click(within(rowBox('Dagger')).getByRole('button', { name: /Buy for/i }));
    expect(store.getState().app.sharedShop.stock[0].Number).toBe(3);
  });
});

describe('a purchase you cannot afford', () => {
  test('says how far short it is, and still offers the button', () => {
    /* Computed and displayed, never enforced. The purse floors at zero, so
       the shortfall is stated before the press rather than discovered after. */
    renderCard({ gold: 1 });
    openDrawer();
    openRow('Dagger');
    const box = rowBox('Dagger');
    expect(within(box).getByText(/more than you carry/i)).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: /Buy for/i })).not.toBeDisabled();
  });

  test('an affordable one says what is left instead', () => {
    renderCard({ gold: 100 });
    openDrawer();
    openRow('Dagger');
    const box = rowBox('Dagger');
    expect(within(box).getByText(/Leaves you/i)).toBeInTheDocument();
    expect(within(box).queryByText(/more than you carry/i)).not.toBeInTheDocument();
  });
});
