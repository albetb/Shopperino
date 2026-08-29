import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import EquippedItemsCard from './equipped_items_card';

/* What the equipment card says an item is doing.
 *
 * Before this the card was a list of names: a cloak of resistance +3 looked
 * exactly like a cloak, and the +3 was nowhere on the page. The numbers
 * themselves belong to each stat's own breakdown box; this card answers the
 * prior question — is this item doing anything at all, and if not, why not.
 */

function renderCard(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: { items: false } },
      /* The choice thunk persists, and stops at the saved-character slot when
         there is none — which is all these assertions need. */
      persist: { pss: null },
      app: { infoCards: [] },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><EquippedItemsCard /></Provider>);
}

function pc(cls = 'Fighter', level = 6, race = 'Human') {
  const p = new Player();
  p.name = 'Test';
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

const wear = (p, link, name, slot = 'other1', overrides = null) => {
  p.equipItem(slot, { name, link, ...(overrides ? { overrides } : {}) });
  p.addInventoryItem(name, 'Wondrous Item', 1, link);
  return p;
};

describe('the effect line', () => {
  test('an item with no effect shows its name and nothing else', () => {
    const p = wear(pc(), 'bag-of-holding-1', 'Bag of holding type I');
    renderCard(p);
    expect(screen.getByText('Bag of holding type I')).toBeInTheDocument();
    expect(screen.queryByText(/to AC/)).not.toBeInTheDocument();
  });

  test('a cloak of resistance says what it does', () => {
    const p = wear(pc(), 'cloak-of-resistance-3', 'Cloak of resistance +3');
    renderCard(p);
    expect(screen.getByText(/\+3 resistance to Fortitude/)).toBeInTheDocument();
  });

  test('the three AC keys read as one bonus, not three', () => {
    const p = wear(pc(), 'ring-of-protection-2', 'Ring of Protection +2');
    renderCard(p);
    expect(screen.getByText('+2 deflection to AC')).toBeInTheDocument();
  });

  test('a situational note appears under the numbers', () => {
    const p = wear(pc(), 'cloak-of-elvenkind', 'Cloak of elvenkind');
    renderCard(p);
    expect(screen.getByText(/\+5 competence to Hide/)).toBeInTheDocument();
    expect(screen.getByText(/hood drawn up/)).toBeInTheDocument();
  });

  test('a Group B item reports the number it feeds', () => {
    const p = wear(pc(), 'mantle-of-spell-resistance', 'Mantle of spell resistance');
    renderCard(p);
    expect(screen.getByText('spell resistance 21')).toBeInTheDocument();
  });
});

describe('the two states worth interrupting for', () => {
  test('an item that does nothing for this character says so', () => {
    const p = wear(pc('Cleric', 10), 'robe-of-the-archmagi', 'Robe of the archmagi');
    renderCard(p);
    expect(screen.getByText(/Only an arcane caster gains this/)).toBeInTheDocument();
  });

  test('and a dwarf is told the belt does nothing for a dwarf', () => {
    const p = wear(pc('Fighter', 6, 'Dwarf'), 'belt-of-dwarvenkind', 'Belt of dwarvenkind');
    renderCard(p);
    expect(screen.getByText(/A Dwarf gains none of this/)).toBeInTheDocument();
  });

  test('the same item on a wizard is not flagged', () => {
    const p = wear(pc('Wizard', 10), 'robe-of-the-archmagi', 'Robe of the archmagi');
    renderCard(p);
    expect(screen.queryByText(/Only an arcane caster/)).not.toBeInTheDocument();
    expect(screen.getByText(/\+5 armor to AC/)).toBeInTheDocument();
  });

  test('a ring of energy resistance with no type chosen asks for one, here', () => {
    /* Answered when the ring is added, and answerable again here — otherwise
       the only way to fix a ring already on the character was to delete it. */
    const p = wear(pc(), 'ring-of-energy-resistance-minor', 'Ring of Energy resistance, minor');
    renderCard(p);
    expect(screen.getByText('Pick the energy it resists')).toBeInTheDocument();
    ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'].forEach((energy) => {
      expect(screen.getByRole('button', { name: energy })).toBeInTheDocument();
    });
  });

  test('once chosen it says so, and the chips stay so it can be changed', () => {
    const p = wear(pc(), 'ring-of-energy-resistance-minor', 'Ring of Energy resistance, minor',
      'other1', { energy: 'Fire' });
    renderCard(p);
    expect(screen.getByText('Resists')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fire' })).toHaveClass('is-on');
    expect(screen.getByRole('button', { name: 'Cold' })).not.toHaveClass('is-on');
  });

  test('choosing one writes it to the equipped entry and its inventory row', () => {
    const p = wear(pc(), 'ring-of-energy-resistance-major', 'Ring of Energy resistance, major');
    renderCard(p);
    fireEvent.click(screen.getByRole('button', { name: 'Electricity' }));
    expect(p.getEquipment().other1.overrides).toEqual({ energy: 'Electricity' });
    /* The row too: the equipped entry finds its own carried count by matching
       on overrides, so the two drifting apart would lose the count. */
    expect(p.getInventory()[0].overrides).toEqual({ energy: 'Electricity' });
    expect(p.getEnergyResistances()).toEqual([
      { type: 'Electricity', amount: 20, source: 'Ring of Energy resistance, major' },
    ]);
  });

  test('tapping the chosen one again clears it', () => {
    const p = wear(pc(), 'ring-of-energy-resistance-minor', 'Ring of Energy resistance, minor',
      'other1', { energy: 'Fire' });
    renderCard(p);
    fireEvent.click(screen.getByRole('button', { name: 'Fire' }));
    expect(p.getEquipment().other1.overrides).toBeUndefined();
    expect(p.getEnergyResistances()[0].type).toBe('');
  });

  test('an item that needs no choice is asked nothing', () => {
    const p = wear(pc(), 'cloak-of-resistance-3', 'Cloak of resistance +3');
    renderCard(p);
    expect(screen.queryByText(/energy/i)).not.toBeInTheDocument();
  });
});

describe('stacking, said out loud', () => {
  test('two deflection bonuses are both counted and flagged', () => {
    /* Computed, never enforced: in 3.5 only the larger applies, and the sheet
       says so beside the number rather than silently dropping one. */
    const p = pc();
    wear(p, 'ring-of-protection-2', 'Ring of Protection +2', 'other1');
    wear(p, 'ring-of-protection-3', 'Ring of Protection +3', 'other2');
    renderCard(p);
    expect(screen.getByText(/both give a deflection bonus/)).toBeInTheDocument();
  });

  test('two different types are not flagged', () => {
    const p = pc();
    wear(p, 'bracers-of-armor-2', 'Bracers of armor +2', 'other1');
    wear(p, 'ring-of-protection-2', 'Ring of Protection +2', 'other2');
    renderCard(p);
    expect(screen.queryByText(/both give a/)).not.toBeInTheDocument();
  });
});
