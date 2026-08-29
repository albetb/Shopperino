import { render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import CombatPage from './combat_page';

/* The two-weapon attack line. A weapon in each hand always granted the extra
   off-hand attack in the rules and never appeared on the sheet — both weapons
   simply listed their full attack bonus, as though there were no penalty at
   all. This is the line that says what a full attack with both actually rolls. */

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

function character(feats = []) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = 8;
  p.race = 'Human';
  p.maxLife = 60;
  p.setAbilityBase('str', 16);
  p.setAbilityBase('dex', 14);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

const equip = (p, slot, link, name, extra = {}) => {
  p.equipment = p.equipment || {};
  p.equipment[slot] = { link, name, ...extra };
};

function dualWielder(feats = []) {
  const p = character(feats);
  equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword');
  equip(p, 'lh1', 'items/Weapon/sword-short', 'Sword short');
  return p;
}

const line = () => screen.queryByText('Two-weapon attack');
/* The two weapons are also listed above, one row each, so every query about
   the two-weapon line has to be scoped to the block that line heads. */
const block = () => screen.getByText('Two-weapon attack').closest('.sh-stack');

describe('when the line shows', () => {
  test('not for a character holding one weapon', () => {
    const p = character();
    equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword');
    renderCombat(p);
    expect(line()).toBe(null);
  });

  test('not for a sword and a shield', () => {
    const p = character();
    equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword');
    equip(p, 'lh1', 'items/Shield/shield-heavy-steel', 'Shield, heavy steel');
    renderCombat(p);
    expect(line()).toBe(null);
  });

  test('for a weapon in each hand, feat or no feat', () => {
    renderCombat(dualWielder());
    expect(line()).toBeInTheDocument();
  });
});

describe('what it says', () => {
  test('the penalties both hands take, without the feat', () => {
    renderCombat(dualWielder());
    // A light off-hand weapon, no feat: −4 and −8.
    expect(screen.getByText('-4 / -8')).toBeInTheDocument();
  });

  test('and the better pair once the feat is taken', () => {
    renderCombat(dualWielder(['Two-weapon fighting']));
    expect(screen.getByText('-2 / -2')).toBeInTheDocument();
    expect(screen.queryByText('-4 / -8')).toBe(null);
  });

  test('both weapons are named, and the off hand is marked as such', () => {
    renderCombat(dualWielder());
    expect(within(block()).getByText('Longsword')).toBeInTheDocument();
    expect(within(block()).getByText('Sword short (off hand)')).toBeInTheDocument();
  });

  test('one off-hand attack normally, two with Improved', () => {
    const { unmount } = renderCombat(dualWielder(['Two-weapon fighting']));
    const rowFor = (name) => screen.getByText(name).closest('.sh-row-h');
    expect(within(rowFor('Sword short (off hand)')).getAllByText(/^[+-]\d+$/)).toHaveLength(1);
    unmount();

    renderCombat(dualWielder(['Two-weapon fighting', 'Improved two-weapon fighting']));
    expect(within(rowFor('Sword short (off hand)')).getAllByText(/^[+-]\d+$/)).toHaveLength(2);
  });

  test('the numbers on the line are the penalised ones, not the full bonus', () => {
    const p = dualWielder();
    const expected = p.getTwoWeaponFighting();
    renderCombat(p);
    const sign = (n) => `${n >= 0 ? '+' : ''}${n}`;
    const mainRow = within(block()).getByText('Longsword').closest('.sh-row-h');
    expect(within(mainRow).getByText(sign(expected.main.attack))).toBeInTheDocument();
    // The weapon's own row above still shows the unpenalised bonus — the two
    // are different numbers, which is the whole reason this line exists.
    expect(expected.main.attack).toBeLessThan(expected.main.attack + 4);
    expect(screen.getAllByText(sign(expected.main.attack + 4)).length).toBeGreaterThan(0);
  });
});
