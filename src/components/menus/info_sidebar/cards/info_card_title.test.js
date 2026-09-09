import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer, { addCardByLink } from '../../../../store/slices/appSlice';
import InfoMenuCards from './info_menu_cards';
import { setLanguage } from '../../../../lib/i18n';

/* The card title is the one string in the sidebar that is a *name*, and the
   sidebar shows eight different kinds of card. Only an item's name may be
   translated: the pack is keyed by the English `src/data` spells, and one
   word — `Hide` — is both a suit of armour and a skill. Which lookup answered
   is therefore recorded on the card, and this holds that line. */

function cards(...links) {
  const store = configureStore({
    reducer: { app: appReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
  links.forEach((link) => store.dispatch(addCardByLink(
    typeof link === 'string' ? { links: link } : link)));
  const list = store.getState().app.infoCards;
  render(
    <Provider store={store}>
      <InfoMenuCards cardsData={list} closeCard={() => {}} />
    </Provider>
  );
  return list;
}

afterEach(() => setLanguage('en'));

describe('the title of an info card', () => {
  test('an item is named in the reading language', () => {
    setLanguage('it');
    cards('items/Weapon/longsword');
    expect(screen.getByRole('heading', { name: 'Spada lunga' })).toBeInTheDocument();
  });

  test('English is what src/data spells', () => {
    cards('items/Weapon/longsword');
    expect(screen.getByRole('heading', { name: 'Longsword' })).toBeInTheDocument();
  });

  test('a magic item is taken apart and put back together', () => {
    setLanguage('it');
    /* getItemByLink composes "Longsword +1" into one string, so the pack has
       to find where the name ends before it can look it up. */
    cards({ links: 'items/Weapon/longsword', bonus: 1 });
    expect(screen.getByRole('heading', { name: 'Spada lunga +1' })).toBeInTheDocument();
  });

  test('an item whose name carries a comma survives the round trip', () => {
    setLanguage('it');
    cards('items/Shield/shield-heavy-steel');
    expect(screen.getByRole('heading', { name: 'Scudo pesante di metallo' }))
      .toBeInTheDocument();
  });

  test('the Hide skill is not renamed after the hide armour', () => {
    setLanguage('it');
    /* The whole reason the card records which lookup answered: the item pack
       translates `Hide` to `Pelle`, and that is the armour. */
    const [card] = cards('skills#hide');
    expect(card.kind).toBeUndefined();
    expect(screen.getByRole('heading', { name: 'Hide' })).toBeInTheDocument();
  });

  test('a spell keeps the name every manual prints', () => {
    setLanguage('it');
    cards('spells#fireball');
    expect(screen.getByRole('heading', { name: 'Fireball' })).toBeInTheDocument();
  });
});
