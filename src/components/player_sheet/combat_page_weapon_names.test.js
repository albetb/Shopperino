import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import CombatPage from './combat_page';
import { setLanguage, t } from '../../lib/i18n';

/* A weapon's name is stored exactly as `src/data/items.json` spells it — the
   row keeps it, `getItemByRef` looks it up by it — and is translated only on
   the way to the screen. The attacks card is where that shows: the name
   appears four times over (the attack row, its breakdown box, the two-weapon
   line and the flurry line) and every one of them has to say the same thing.
   A sheet written in one language must read correctly in the other. */

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

const equip = (p, slot, link, name, extra = {}) => {
  p.equipment = p.equipment || {};
  p.equipment[slot] = { link, name, ...extra };
};

function fighter() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = 8;
  p.race = 'Human';
  p.maxLife = 60;
  p.setAbilityBase('str', 16);
  p.setAbilityBase('dex', 14);
  return p;
}

afterEach(() => setLanguage('en'));

describe('the name on an attack row', () => {
  test('is what src/data spells, in English', () => {
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword');
    renderCombat(p);
    expect(screen.getByText('Longsword')).toBeInTheDocument();
  });

  test('is read through the pack in Italian, though nothing stored changed', () => {
    setLanguage('it');
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword');
    renderCombat(p);
    expect(screen.getByText('Spada lunga')).toBeInTheDocument();
    expect(screen.queryByText('Longsword')).toBe(null);
    /* The stored name is untouched — that is the whole point. */
    expect(p.equipment.rh1.name).toBe('Longsword');
  });

  test('composes the qualifier and the bonus in Italian order', () => {
    setLanguage('it');
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword',
      { masterwork: true, bonus: 1, effectIds: [2] });
    renderCombat(p);
    expect(screen.getByText('Spada lunga, infuocata +1')).toBeInTheDocument();
  });

  test('the two-weapon line names both hands in the same language', () => {
    setLanguage('it');
    const p = fighter();
    equip(p, 'rh1', 'items/Weapon/longsword', 'Longsword');
    equip(p, 'lh1', 'items/Weapon/sword-short', 'Sword short');
    renderCombat(p);
    const two = screen.getByText(t('Two-weapon attack')).closest('.sh-stack');
    /* The main hand is named once in the attack list and once here. */
    expect(two.textContent).toContain('Spada lunga');
    expect(two.textContent).toContain('Spada corta (mano secondaria)');
  });
});
