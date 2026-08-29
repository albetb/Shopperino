import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import DomainsCard from './domains_card';

/* The card shows the granted power of each domain, and now picks the domain
   too. Sending the reader to the spellbook tab to fill a gap this card is
   already pointing at was the wrong half of the job.

   The list it offers must be the model's, not a copy: a cleric cannot take the
   domain opposed to their alignment, and cannot take the same one twice. */

function renderCard(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: { domains: false } },
      persist: { pss: null },
      app: { infoCards: [] },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><DomainsCard /></Provider>);
}

function cleric({ moral = 'Neutral', ethical = 'Neutral', domain1 = '', domain2 = '' } = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Cleric';
  p.level = 5;
  p.race = 'Human';
  p.moralAlignment = moral;
  p.ethicalAlignment = ethical;
  p.domain1 = domain1;
  p.domain2 = domain2;
  return p;
}

const optionsOf = (label) =>
  Array.from(screen.getByLabelText(label).options).map((o) => o.value).filter(Boolean);

describe('picking a domain', () => {
  test('both slots offer a dropdown, even when nothing is chosen', () => {
    renderCard(cleric());
    expect(screen.getByLabelText('Domain 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Domain 2')).toBeInTheDocument();
    expect(screen.getAllByText('Not chosen')).toHaveLength(2);
  });

  test('the list is the model\'s, so an opposed domain is not offered', () => {
    const p = cleric({ moral: 'Good' });
    renderCard(p);
    expect(optionsOf('Domain 1')).toEqual(p.getPossibleDomains(1));
    expect(optionsOf('Domain 1')).not.toContain('Evil');
    expect(optionsOf('Domain 1')).toContain('Good');
  });

  test('a domain taken in one slot is not offered in the other', () => {
    renderCard(cleric({ domain1: 'War' }));
    expect(optionsOf('Domain 2')).not.toContain('War');
    // ...but it is still the selected value of the slot that holds it.
    expect(screen.getByLabelText('Domain 1').value).toBe('War');
  });

  test('a lawful cleric is not offered Chaos', () => {
    renderCard(cleric({ ethical: 'Lawful' }));
    expect(optionsOf('Domain 1')).not.toContain('Chaos');
    expect(optionsOf('Domain 1')).toContain('Law');
  });
});

describe('the granted power', () => {
  test('appears once a domain is chosen, and the "Not chosen" flag goes', () => {
    renderCard(cleric({ domain1: 'War' }));
    // Only the empty slot still flags itself.
    expect(screen.getAllByText('Not chosen')).toHaveLength(1);
    // The chosen name heads its own slot ("War" also appears as an <option>,
    // so this asks for the heading specifically).
    expect(screen.getByText('War', { selector: '.domains-card-name' })).toBeInTheDocument();
    expect(screen.getByLabelText('Domain 1').value).toBe('War');
  });

  test('choosing one dispatches the same setting the spellbook writes', () => {
    const player = cleric();
    const seen = [];
    const store = configureStore({
      reducer: (state = {
        playerSheet: { player, combatPageCardsCollapsed: { domains: false } },
        persist: { pss: null }, app: { infoCards: [] },
      }) => state,
      middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
    });
    store.dispatch = (action) => { seen.push(action); return undefined; };
    render(<Provider store={store}><DomainsCard /></Provider>);
    fireEvent.change(screen.getByLabelText('Domain 1'), { target: { value: 'War' } });
    // onSetPlayerSpellOption is a thunk, so what lands is a function.
    expect(seen.filter((a) => typeof a === 'function')).toHaveLength(1);
  });
});
