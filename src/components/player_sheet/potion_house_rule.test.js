import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer, { setPotionHealsByCharacterLevel } from '../../store/slices/appSlice';
import Player from '../../lib/player';
import PotionsCard from './potions_card';

/**
 * The house rule: a potion's `+1 per caster level` counted in the *drinker's*
 * levels instead of the bottle's.
 *
 * The cap is the potion's either way, which is the half that keeps the rule
 * honest — an 11th-level character drinking a 2d8 cure gets that potion's full
 * +10 and never more, however high they climb. Cure moderate wounds is the
 * example worth testing precisely because its two numbers differ: brewed at
 * caster level 3, capped at 10.
 */

const CURE_MODERATE = 'Potion of Cure moderate wounds';

function pc(level) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(level);
  p.addInventoryItem(CURE_MODERATE, 'Potion', 1, 'cure-moderate-wounds');
  return p;
}

function open(level, { houseRule = false, potion = CURE_MODERATE } = {}) {
  const player = pc(level);
  if (potion !== CURE_MODERATE) {
    player.addInventoryItem(potion, 'Potion', 1, 'fly');
  }
  const store = configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (state = {
        player,
        combatPageCardsCollapsed: { potions: false },
      }) => state,
      persist: (state = { pss: null }) => state,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  if (houseRule) store.dispatch(setPotionHealsByCharacterLevel(true));
  render(<Provider store={store}><PotionsCard /></Provider>);
  fireEvent.click(screen.getByRole('button', { name: `Use ${potion}` }));
  return { store, player };
}

/* The box shows the roll, the flat part and the sum; the flat part is the one
   the rule moves, and it is named in the line under the number. */
const flatBonus = () => {
  const hint = screen.getByText(/is not rolled/);
  return Number(/\+(\d+)/.exec(hint.textContent)[1]);
};

describe('off, which is how it starts', () => {
  test('the flat part is the potion’s own caster level', () => {
    open(11);
    /* Cure moderate wounds is brewed at caster level 3. */
    expect(flatBonus()).toBe(3);
    expect(screen.getByText(/is the potion’s caster level/)).toBeInTheDocument();
  });
});

describe('on', () => {
  test('an 11th-level character gets the potion’s full +10, not +11', () => {
    open(11, { houseRule: true });
    expect(flatBonus()).toBe(10);
    expect(screen.getByText(/is your character level/)).toBeInTheDocument();
  });

  test('below the cap the character’s own level is what counts', () => {
    open(4, { houseRule: true });
    expect(flatBonus()).toBe(4);
  });

  test('a low-level character is not pushed up to the potion’s brewer', () => {
    /* The rule cuts both ways: at 1st level a cure moderate heals 2d8+1,
       where the bottle alone would have given +3. */
    open(1, { houseRule: true });
    expect(flatBonus()).toBe(1);
  });
});

describe('the switch itself', () => {
  test('is remembered, not asked again each drink', () => {
    const { store } = open(11);
    fireEvent.click(screen.getByRole('switch', { name: 'Count the bonus in character levels' }));
    expect(store.getState().app.potionHealsByCharacterLevel).toBe(true);
    expect(flatBonus()).toBe(10);
  });

  test('is offered only where there is a per-level bonus to move', () => {
    /* A potion of fly has a duration, not a die and not a bonus. */
    open(11, { potion: 'Potion of Fly' });
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});
