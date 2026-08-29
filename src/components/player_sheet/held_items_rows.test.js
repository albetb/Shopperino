import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import HeldItemsRows from './held_items_rows';
import CombatPage from './combat_page';

/* Wands, rods and staffs on the attacks card. Before this they were routed to
   the four `other` accessory slots and nothing about them appeared anywhere —
   no spell, no charge count, no hint that they take a hand. */

function renderHeld(player) {
  const dispatched = [];
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: { player: false, combat: false, items: false } },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false })
      .prepend(() => () => (action) => { dispatched.push(action); return undefined; }),
  });
  render(<Provider store={store}><HeldItemsRows /></Provider>);
  return dispatched;
}

function caster(cls = 'Wizard', level = 9) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

const hold = (p, slot, name) => {
  p.equipment = p.equipment || {};
  p.equipment[slot] = { link: 'items/Wand/x', name };
  return p;
};

describe('what is drawn', () => {
  test('nothing at all with empty hands', () => {
    const { container } = render(
      <Provider store={configureStore({
        reducer: (s = { playerSheet: { player: caster() }, app: { infoCards: [] } }) => s,
        middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
      })}><HeldItemsRows /></Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('a wand names itself, its spell, and what it has left', () => {
    renderHeld(hold(caster(), 'rh1', 'Wand of Fireball (5th)'));
    expect(screen.getByText('Wand of Fireball (5th)')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('50', { exact: false })).toBeInTheDocument();
    // The wand's own caster level, not the character's.
    expect(screen.getByText('CL 5')).toBeInTheDocument();
  });

  test('two wands of the same spell are told apart by their caster level', () => {
    const p = caster();
    hold(p, 'rh1', 'Wand of Fireball (5th)');
    hold(p, 'lh1', 'Wand of Fireball (10th)');
    renderHeld(p);
    expect(screen.getByText('CL 5')).toBeInTheDocument();
    expect(screen.getByText('CL 10')).toBeInTheDocument();
  });

  test('a staff lists every spell, and says which cost more than one', () => {
    renderHeld(hold(caster(), 'rh1', 'Staff of Fire'));
    ['Burning hands', 'Fireball', 'Wall of fire'].forEach((n) =>
      expect(screen.getByText(n)).toBeInTheDocument());
    // Only the 2-charge spell says a number; one charge is the assumption.
    expect(screen.getByText('2 charges')).toBeInTheDocument();
  });

  test('a metamagic rod shows its feat and its per-day allowance', () => {
    renderHeld(hold(caster(), 'rh1', 'Rod of Metamagic, Quicken, greater'));
    expect(screen.getByText('Quicken spell')).toBeInTheDocument();
    expect(screen.getByText('3', { exact: false })).toBeInTheDocument();
  });

  test('the second hand set is dimmed and labelled', () => {
    const { container } = (() => {
      renderHeld(hold(caster(), 'rh2', 'Wand of Fireball (5th)'));
      return { container: document.body };
    })();
    expect(container.querySelector('.held-item.is-stowed')).toBeTruthy();
    expect(screen.getByText('second set')).toBeInTheDocument();
  });
});

describe('spending charges', () => {
  test('casting dispatches, and the button names the spell', () => {
    const dispatched = renderHeld(hold(caster(), 'rh1', 'Wand of Fireball (5th)'));
    fireEvent.click(screen.getByRole('button', { name: /Cast Fireball from Wand of Fireball/ }));
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(1);
  });

  test('the refill button is dead until something has been spent', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    renderHeld(p);
    expect(screen.getByRole('button', { name: /Refill/ })).toBeDisabled();
  });

  test('and live once it has', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    p.spendHeldItemCharges(p.getHeldItems()[0].id, 4);
    renderHeld(p);
    expect(screen.getByRole('button', { name: /Refill/ })).toBeEnabled();
    expect(screen.getByText('46', { exact: false })).toBeInTheDocument();
  });

  test('spending past the item is flagged, not blocked', () => {
    const p = hold(caster(), 'rh1', 'Wand of Fireball (5th)');
    p.spendHeldItemCharges(p.getHeldItems()[0].id, 55);
    renderHeld(p);
    expect(document.querySelector('.held-item-count.is-over')).toBeTruthy();
  });
});

describe('the usability warning', () => {
  test('a wizard holding a wizard wand is told nothing', () => {
    renderHeld(hold(caster('Wizard'), 'rh1', 'Wand of Fireball (5th)'));
    expect(screen.queryByText(/Use Magic Device/)).toBe(null);
  });

  test('a low-level wizard is also told nothing — level is irrelevant', () => {
    renderHeld(hold(caster('Wizard', 1), 'rh1', 'Wand of Fireball (5th)'));
    expect(screen.queryByText(/Use Magic Device/)).toBe(null);
  });

  test('a fighter is warned, and pointed at Use Magic Device', () => {
    renderHeld(hold(caster('Fighter', 9), 'rh1', 'Wand of Fireball (5th)'));
    expect(screen.getByText(/Use Magic Device check \(DC 20\)/)).toBeInTheDocument();
  });

  test('the cast button still works for them — flagged, never blocked', () => {
    const dispatched = renderHeld(hold(caster('Fighter', 9), 'rh1', 'Wand of Fireball (5th)'));
    const cast = screen.getByRole('button', { name: /Cast Fireball/ });
    expect(cast).toBeEnabled();
    fireEvent.click(cast);
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(1);
  });
});

describe('on the attacks card itself', () => {
  function renderCombat(player) {
    const store = configureStore({
      reducer: (state = {
        playerSheet: { player, combatPageCardsCollapsed: { player: false, combat: false, items: false } },
        persist: { pss: null },
        app: { infoCards: [], currentTab: 5 },
      }) => state,
      middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
    });
    return render(<Provider store={store}><CombatPage /></Provider>);
  }

  test('a held wand appears on the card', () => {
    renderCombat(hold(caster(), 'rh1', 'Wand of Fireball (5th)'));
    expect(screen.getByText('Wand of Fireball (5th)')).toBeInTheDocument();
  });

  test('and gets no attack bonus or damage line, having neither', () => {
    /* The bug this prevents: a wand resolved through the weapon calculators
       would render "+4" and "1d6" for a stick that has no damage at all. */
    renderCombat(hold(caster(), 'rh1', 'Wand of Fireball (5th)'));
    const row = screen.getByText('Wand of Fireball (5th)').closest('.held-item');
    expect(row).toBeTruthy();
    expect(within(row).queryByText('1d6')).toBe(null);
  });

  test('a real weapon in the other hand still gets its row', () => {
    const p = hold(caster('Fighter', 9), 'rh1', 'Wand of Fireball (5th)');
    p.equipment.lh1 = { link: 'items/Weapon/dagger', name: 'Dagger' };
    renderCombat(p);
    expect(screen.getByText('Dagger')).toBeInTheDocument();
    expect(screen.getByText('Wand of Fireball (5th)')).toBeInTheDocument();
  });
});
