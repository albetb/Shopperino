import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import ScrollsCard from './scrolls_card';

/* The scrolls card, and the box that opens to read one.
 *
 * The card is the potions card's sibling in shape; what it adds — and what
 * these tests are mostly about — is the spell-completion gate. A scroll a
 * character cannot read still gets a live button, because the sheet reports
 * and the table rules; what changes is that the row carries a small flag and
 * the box carries the whole sentence.
 */

function renderWith(node, player) {
  const dispatched = [];
  const store = configureStore({
    reducer: (state = {
      playerSheet: {
        player,
        combatPageCardsCollapsed: { scrolls: false },
      },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false })
      .prepend(() => () => (action) => { dispatched.push(action); return undefined; }),
  });
  render(<Provider store={store}>{node}</Provider>);
  return dispatched;
}

function pc(cls = 'Wizard', level = 5, ability = 16) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  const key = { Wizard: 'int', Sorcerer: 'cha', Bard: 'cha' }[cls] || 'wis';
  p.setAbilityBase(key, ability);
  return p;
}

const carrying = (p, ref, name, n = 1) => {
  p.addInventoryItem(name, 'Scroll', n, ref);
  return p;
};

describe('when the card appears at all', () => {
  test('not at all with no scrolls in the bag', () => {
    const { container } = render(
      <Provider store={configureStore({
        reducer: (s = {
          playerSheet: { player: pc(), combatPageCardsCollapsed: { scrolls: false } },
          app: { infoCards: [] },
        }) => s,
        middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
      })}><ScrollsCard /></Provider>
    );
    // An empty card here is only wasted lines, so there is none.
    expect(container).toBeEmptyDOMElement();
  });

  test('with one scroll it shows the spell, not the item name', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    renderWith(<ScrollsCard />, p);
    expect(screen.getByText('Scrolls')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    // "Scroll of Fireball" under a card titled Scrolls says it twice.
    expect(screen.queryByText('Scroll of Fireball')).not.toBeInTheDocument();
  });

  test('a collapsed card keeps its title and drops its rows', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const store = configureStore({
      reducer: (s = {
        playerSheet: { player: p, combatPageCardsCollapsed: { scrolls: true } },
        app: { infoCards: [] },
      }) => s,
      middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
    });
    render(<Provider store={store}><ScrollsCard /></Provider>);
    expect(screen.getByText('Scrolls')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
  });
});

describe('the row', () => {
  test('carries a count, the source and the level', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 3);
    renderWith(<ScrollsCard />, p);
    expect(screen.getByText('3')).toBeInTheDocument();
    // A3: an Arcane scroll of a 3rd-level spell.
    expect(screen.getByText('A3')).toBeInTheDocument();
  });

  test('two same-named scrolls stay tellable apart by their source', () => {
    const p = pc('Cleric', 5);
    carrying(p, 'scrolls/Arcane/detect-magic', 'Scroll of Detect magic');
    carrying(p, 'scrolls/Divine/detect-magic', 'Scroll of Detect magic');
    renderWith(<ScrollsCard />, p);
    expect(screen.getAllByText('Detect Magic')).toHaveLength(2);
    expect(screen.getByText('A0')).toBeInTheDocument();
    expect(screen.getByText('D0')).toBeInTheDocument();
  });

  test('the spell name opens the spell, not the scroll item', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const dispatched = renderWith(<ScrollsCard />, p);
    fireEvent.click(screen.getByText('Fireball'));
    const opened = dispatched.find((a) => a.type?.includes('addCardByLink'));
    expect(opened.payload.links).toBe('spells#fireball');
  });

  test('no warning flag when the character can read it', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    renderWith(<ScrollsCard />, p);
    expect(screen.queryByText(/Can’t read/)).not.toBeInTheDocument();
  });

  test('a flag when they cannot, carrying the reason as its title', () => {
    // A 1st-level wizard has fireball on their list and cannot yet cast 3rd.
    const p = carrying(pc('Wizard', 1), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    renderWith(<ScrollsCard />, p);
    const flag = screen.getByText(/Can’t read/);
    expect(flag).toBeInTheDocument();
    expect(flag.closest('[title]').getAttribute('title')).toMatch(/up to level 1/);
  });
});

describe('the box that opens', () => {
  const open = (p) => {
    const dispatched = renderWith(<ScrollsCard />, p);
    fireEvent.click(screen.getByRole('button', { name: /^Read Scroll of/ }));
    return dispatched;
  };

  test('names the spell and its source, and offers the spell page', () => {
    open(carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball'));
    expect(screen.getByText('Arcane scroll')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('CL 5')).toBeInTheDocument();
    expect(screen.getByText('Open Fireball')).toBeInTheDocument();
  });

  test('the link in the box opens the spell', () => {
    const dispatched = open(carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball'));
    fireEvent.click(screen.getByText('Open Fireball'));
    const opened = dispatched.filter((a) => a.type?.includes('addCardByLink'));
    expect(opened[opened.length - 1].payload.links).toBe('spells#fireball');
  });

  test('nothing is spent by opening it', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 2);
    const dispatched = open(p);
    expect(dispatched.some((a) => typeof a === 'function')).toBe(false);
    expect(p.getCarriedScrolls()[0].number).toBe(2);
  });

  test('Read dispatches the thunk and closes the box', () => {
    const p = carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const dispatched = open(p);
    fireEvent.click(screen.getByRole('button', { name: /draw Read/ }));
    expect(dispatched.some((a) => typeof a === 'function')).toBe(true);
    expect(screen.queryByText('Open Fireball')).not.toBeInTheDocument();
  });

  test('Cancel closes it and dispatches nothing', () => {
    const dispatched = open(carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball'));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(screen.queryByText('Open Fireball')).not.toBeInTheDocument();
    expect(dispatched.some((a) => typeof a === 'function')).toBe(false);
  });

  test('no warning at all for a scroll the character can read', () => {
    open(carrying(pc(), 'scrolls/Arcane/fireball', 'Scroll of Fireball'));
    expect(screen.queryByText(/beyond you/)).not.toBeInTheDocument();
  });

  test('the broad warning names every failed condition and the UMD DC', () => {
    /* Flame strike is a 5th-level cleric spell: off a wizard's list *and*
       above a 1st-level wizard's reach. Both lines must show, or the player
       fixes one and is surprised by the other. */
    open(carrying(pc('Wizard', 1), 'scrolls/Divine/flame-strike', 'Scroll of Flame strike'));
    const warn = screen.getByText(/beyond you/).closest('.sh-warn-strip');
    expect(within(warn).getByText(/Not on the Wizard spell list/)).toBeInTheDocument();
    expect(within(warn).getByText(/level 5/)).toBeInTheDocument();
    // Flame strike: 1125 gp = CL 9 x SL 5 x 25, so DC 20 + 9.
    expect(within(warn).getByText(/DC 29/)).toBeInTheDocument();
  });

  test('the read button stays live for a scroll beyond the character', () => {
    // Computed, never enforced — the table decides, not the sheet.
    const p = carrying(pc('Fighter', 5, 12), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const dispatched = open(p);
    const button = screen.getByRole('button', { name: /draw Read/ });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(dispatched.some((a) => typeof a === 'function')).toBe(true);
  });
});
