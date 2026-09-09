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
    /* The whole reason the card records which lookup answered: `Hide` is a
       suit of armour in the item pack (Pelle) and a skill in the skill pack
       (Nascondersi), and only the branch that built the card knows which. */
    const [card] = cards('skills#hide');
    expect(card.kind).toBe('skill');
    expect(screen.getByRole('heading', { name: 'Nascondersi' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pelle' })).toBe(null);
  });

  test('a spell is named the way the Manuale del Giocatore names it', () => {
    setLanguage('it');
    const [card] = cards('spells#fireball');
    expect(card.kind).toBe('spell');
    expect(screen.getByRole('heading', { name: 'Palla di fuoco' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Fireball' })).toBe(null);
  });

  test('and so are its school, its level and its components', () => {
    setLanguage('it');
    cards('spells#fireball');
    expect(screen.getByText(/Invocazione \[Fuoco\]/)).toBeInTheDocument();
    expect(screen.getByText(/Mag\/Str 3/)).toBeInTheDocument();
    expect(screen.queryByText(/Sor\/Wiz/)).toBe(null);
  });
});

describe('a creature card', () => {
  /* A stat block is almost all names, and it is assembled into flat strings
     before it reaches the sidebar — so the card says which lookup built it and
     the renderer keeps one table of field -> how to read it. */

  test('is named, sized and typed in the reading language', () => {
    setLanguage('it');
    cards('monsters/aboleth');
    expect(screen.getByRole('heading', { name: 'Aboleth' })).toBeInTheDocument();
    expect(screen.getByText('Enorme Aberrazione (Acquatico)')).toBeInTheDocument();
  });

  test('the quality and skill lists are translated term by term', () => {
    setLanguage('it');
    const [card] = cards('monsters/aboleth');
    expect(card.kind).toBe('creature');
    expect(screen.getByText(/Ascoltare \+16/)).toBeInTheDocument();
    /* The rating stays a rating, and the unit converter still gets to rewrite
       it — the pack translates the word, not the distance. */
    expect(screen.getByText(/scurovisione/i)).toBeInTheDocument();
  });

  test('English is what the SRD prints', () => {
    cards('monsters/aboleth');
    expect(screen.getByText('Huge Aberration (Aquatic)')).toBeInTheDocument();
    expect(screen.getByText(/Listen \+16/)).toBeInTheDocument();
  });
});
