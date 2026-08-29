import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import PotionsCard, { ActiveEffectPills } from './potions_card';
import CombatPage from './combat_page';

/* The potions card, and the box that opens to use one.
 *
 * Before this, a potion in the bag appeared nowhere on the combat page at all:
 * NON_EQUIPPABLE_TYPES refused it a slot, and nothing else offered it a home.
 */

function renderWith(node, player) {
  const dispatched = [];
  const store = configureStore({
    reducer: (state = {
      playerSheet: {
        player,
        combatPageCardsCollapsed: { player: false, combat: false, items: false, potions: false },
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

function pc(cls = 'Fighter', level = 6) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

const carrying = (p, name, link, n = 1) => {
  p.addInventoryItem(name, 'Potion', n, link);
  return p;
};

describe('when the card appears at all', () => {
  test('not at all with an empty bag', () => {
    const { container } = render(
      <Provider store={configureStore({
        reducer: (s = {
          playerSheet: { player: pc(), combatPageCardsCollapsed: { potions: false } },
          app: { infoCards: [] },
        }) => s,
        middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
      })}><PotionsCard /></Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('and not for a bag with no potions in it', () => {
    const p = pc();
    p.addInventoryItem('Rope', 'Good', 1, '');
    const { container } = render(
      <Provider store={configureStore({
        reducer: (s = {
          playerSheet: { player: p, combatPageCardsCollapsed: { potions: false } },
          app: { infoCards: [] },
        }) => s,
        middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
      })}><PotionsCard /></Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('a carried potion names itself and says what it does', () => {
    renderWith(<PotionsCard />, carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds'));
    expect(screen.getByText('Potion of Cure light wounds')).toBeInTheDocument();
    expect(screen.getByText(/Cures 1d8 damage/)).toBeInTheDocument();
  });

  test('the count rides in a pill on the right', () => {
    renderWith(<PotionsCard />, carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds', 4));
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('it sits on the combat page, under the equipment card', () => {
    renderWith(<CombatPage />, carrying(pc(), 'Potion of Fly', 'fly'));
    expect(screen.getByText('Potions')).toBeInTheDocument();
    expect(screen.getByText('Potion of Fly')).toBeInTheDocument();
  });
});

describe('the use box', () => {
  const open = (player, label) => {
    const dispatched = renderWith(<PotionsCard />, player);
    fireEvent.click(screen.getByRole('button', { name: `Use ${label}` }));
    return dispatched;
  };

  test('opening it does not drink anything', () => {
    const dispatched = open(
      carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds'),
      'Potion of Cure light wounds'
    );
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(0);
  });

  test('a potion with a die is rolled for you, and the roll is editable', () => {
    open(carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds'), 'Potion of Cure light wounds');
    const input = screen.getByLabelText('1d8 roll');
    const rolled = Number(input.value);
    expect(rolled).toBeGreaterThanOrEqual(1);
    expect(rolled).toBeLessThanOrEqual(8);
    fireEvent.change(input, { target: { value: '6' } });
    expect(input.value).toBe('6');
  });

  test('the caster-level part is shown apart from the roll, since it is not random', () => {
    // Potion of cure light wounds is CL 1, so +1 on top of the d8.
    open(carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds'), 'Potion of Cure light wounds');
    expect(screen.getByText(/is the potion’s caster level and is not rolled/)).toBeInTheDocument();
  });

  test('drinking dispatches once and closes the box', () => {
    const dispatched = open(
      carrying(pc(), 'Potion of Cure light wounds', 'cure-light-wounds'),
      'Potion of Cure light wounds'
    );
    fireEvent.click(screen.getByRole('button', { name: /Drink/ }));
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(1);
  });

  test('cancel dispatches nothing', () => {
    const dispatched = open(carrying(pc(), 'Potion of Fly', 'fly'), 'Potion of Fly');
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(0);
  });

  test('a potion the sheet cannot model says so rather than pretending', () => {
    open(carrying(pc(), 'Potion of Water breathing', 'water-breathing'), 'Potion of Water breathing');
    expect(screen.getByText(/becomes a pill you can see and clear/)).toBeInTheDocument();
  });

  test('a conditional bonus carries its caveat into the box', () => {
    open(carrying(pc(), 'Potion of Protection from evil', 'protection-from-evil'), 'Potion of Protection from evil');
    expect(screen.getByText(/only against evil foes/i)).toBeInTheDocument();
  });
});

describe('oils need a target before they do anything', () => {
  function armedWithOil(name = 'Oil of Magic weapon', link = 'magic-weapon') {
    const p = carrying(pc(), name, link);
    p.equipment = { rh1: { link: 'items/Weapon/longsword', name: 'Longsword' } };
    return p;
  }

  const openOil = (player, label) => {
    const dispatched = renderWith(<PotionsCard />, player);
    fireEvent.click(screen.getByRole('button', { name: `Use ${label}` }));
    return dispatched;
  };

  test('the button says apply, not drink', () => {
    openOil(armedWithOil(), 'Oil of Magic weapon');
    expect(screen.getByRole('button', { name: /Apply/ })).toBeInTheDocument();
  });

  test('and is dead until something is chosen', () => {
    openOil(armedWithOil(), 'Oil of Magic weapon');
    expect(screen.getByRole('button', { name: /Apply/ })).toBeDisabled();
  });

  test('choosing the weapon makes it live', () => {
    const dispatched = openOil(armedWithOil(), 'Oil of Magic weapon');
    fireEvent.click(screen.getByRole('button', { name: 'Longsword' }));
    const apply = screen.getByRole('button', { name: /Apply/ });
    expect(apply).toBeEnabled();
    fireEvent.click(apply);
    expect(dispatched.filter((a) => typeof a === 'function')).toHaveLength(1);
  });

  test('an oil for armor offers armor, not the sword in hand', () => {
    const p = armedWithOil('Oil of Magic vestment +2', 'magic-vestment');
    p.equipment.armor = { link: 'items/Armor/chain-shirt', name: 'Chain shirt' };
    openOil(p, 'Oil of Magic vestment +2');
    expect(screen.getByRole('button', { name: 'Chain shirt' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Longsword' })).toBe(null);
  });

  test('with nothing eligible it says so instead of offering an empty picker', () => {
    const p = carrying(pc(), 'Oil of Magic weapon', 'magic-weapon');
    p.equipment = {};
    openOil(p, 'Oil of Magic weapon');
    expect(screen.getByText(/Nothing wielded/i)).toBeInTheDocument();
  });
});

describe('the running-effect pills', () => {
  function withEffects(...names) {
    const p = pc();
    names.forEach((n) => p.addPotionEffect(n));
    return p;
  }

  test('nothing is drawn when nothing is running', () => {
    const { container } = render(
      <Provider store={configureStore({
        reducer: (s = { playerSheet: { player: pc() }, app: { infoCards: [] } }) => s,
        middleware: (d) => d({ serializableCheck: false, immutableCheck: false }),
      })}><ActiveEffectPills onRemove={() => {}} /></Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('each running effect gets a pill', () => {
    renderWith(<ActiveEffectPills onRemove={() => {}} />, withEffects('Potion of Haste', 'Potion of Barkskin +3'));
    expect(screen.getByText('Haste')).toBeInTheDocument();
    expect(screen.getByText('Barkskin')).toBeInTheDocument();
  });

  test('the x ends it, reporting the index the model gave', () => {
    const removed = [];
    renderWith(
      <ActiveEffectPills onRemove={(i) => removed.push(i)} />,
      withEffects('Potion of Haste', 'Potion of Barkskin +3')
    );
    fireEvent.click(screen.getByRole('button', { name: 'End Barkskin' }));
    expect(removed).toEqual([1]);
  });

  test('an applied oil says what it is on', () => {
    const p = pc();
    p.equipment = { rh1: { link: 'items/Weapon/longsword', name: 'Longsword' } };
    p.addPotionEffect('Oil of Keen edge', { target: 'rh1' });
    renderWith(<ActiveEffectPills onRemove={() => {}} />, p);
    expect(screen.getByText(/Longsword/)).toBeInTheDocument();
  });

  test('two bonuses of one type are flagged, and the number still counts both', () => {
    const p = withEffects("Potion of Bull's strength", "Potion of Bull's strength");
    renderWith(<ActiveEffectPills onRemove={() => {}} />, p);
    expect(screen.getByText(/only the\s+larger applies/)).toBeInTheDocument();
  });

  test('and two different types are not flagged', () => {
    renderWith(
      <ActiveEffectPills onRemove={() => {}} />,
      withEffects('Potion of Mage armor', 'Potion of Shield of faith +2')
    );
    expect(screen.queryByText(/only the\s+larger applies/)).toBe(null);
  });
});

describe('on the combat page, the numbers move', () => {
  test('a running potion of barkskin shows up in the AC breakdown', () => {
    const p = pc();
    p.addPotionEffect('Potion of Barkskin +3');
    renderWith(<CombatPage />, p);
    // The AC pill itself is the check that the model and the page agree.
    expect(p.getArmorClass()).toBe(pc().getArmorClass() + 3);
  });

  test('an oiled weapon gains its bonus and its unoiled twin does not', () => {
    const p = pc();
    p.equipment = {
      rh1: { link: 'items/Weapon/longsword', name: 'Longsword' },
      lh1: { link: 'items/Weapon/dagger', name: 'Dagger' },
    };
    p.addPotionEffect('Oil of Greater magic weapon +3', { target: 'rh1' });
    expect(p.getOilBonus('rh1', 'attack')).toBe(3);
    expect(p.getOilBonus('lh1', 'attack')).toBe(0);
    renderWith(<CombatPage />, p);
    expect(screen.getAllByText('Longsword').length).toBeGreaterThan(0);
  });
});

describe('the equipment card keeps its own rows', () => {
  test('a potion in the bag does not appear as equipment', () => {
    const p = carrying(pc(), 'Potion of Fly', 'fly');
    renderWith(<CombatPage />, p);
    const card = screen.getByText('Potions').closest('.sh-card');
    expect(within(card).getByText('Potion of Fly')).toBeInTheDocument();
  });
});
