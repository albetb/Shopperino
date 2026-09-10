import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import appReducer, { setIncomingEffect } from '../../store/slices/appSlice';
import Player from '../../lib/player';
import BardicMusicCard from './bardic_music_card';
import ConditionsSection from './conditions_section';
import { setLanguage } from '../../lib/i18n';

/**
 * A bard's music, from the card that hands it out to the sheet that takes it.
 *
 * The QR image itself is not asserted on — jsdom has no canvas to draw one —
 * but everything around it is: which performances can be shared at all, what
 * the panel says they do, and what accepting one does to the numbers.
 */

function bard(level = 15) {
  const p = new Player();
  p.name = 'Lyra';
  p.setRace('Human');
  p.setClass('Bard');
  p.setLevel(level);
  p.setSkillRanks('Perform', level + 3);
  return p;
}

function fighter() {
  const p = new Player();
  p.name = 'Kaleb';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(5);
  return p;
}

function renderWith(component, player) {
  const store = configureStore({
    reducer: {
      app: appReducer,
      playerSheet: (state = { player, combatPageCardsCollapsed: {}, cardCollapsed: {} }) => state,
      persist: (state = { pss: null }) => state,
    },
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  render(<Provider store={store}>{component}</Provider>);
  return { store, player };
}

afterEach(() => setLanguage('en'));

describe('the bardic music card', () => {
  test('offers a code on the performances that buff an ally, and no others', () => {
    renderWith(<BardicMusicCard />, bard());
    expect(screen.getByRole('button', { name: 'Share Inspire courage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share Inspire heroism' })).toBeInTheDocument();
    /* Countersong replaces a roll the bard makes and fascinate happens to the
       enemy — there is nothing for an ally's sheet to hold. */
    expect(screen.queryByRole('button', { name: 'Share Countersong' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share Fascinate' })).not.toBeInTheDocument();
  });

  test('a performance the bard cannot use yet cannot be handed out', () => {
    /* 1st level: inspire heroism is eighteen Perform ranks away. */
    renderWith(<BardicMusicCard />, bard(1));
    expect(screen.getByRole('button', { name: 'Share Inspire courage' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Share Inspire greatness' })).not.toBeInTheDocument();
  });

  test('the panel says what the ally gets, at the strength this bard sings it', () => {
    renderWith(<BardicMusicCard />, bard(14));
    fireEvent.click(screen.getByRole('button', { name: 'Share Inspire courage' }));
    const panel = screen.getByRole('dialog', { name: /Share effect/i });
    /* +3 at 14th level (class-features.md). */
    expect(panel).toHaveTextContent('+3 morale on attack rolls and weapon damage');
  });

  test('inspire competence asks which skill before it means anything', () => {
    renderWith(<BardicMusicCard />, bard());
    fireEvent.click(screen.getByRole('button', { name: 'Share Inspire competence' }));
    const panel = screen.getByRole('dialog', { name: /Share effect/i });
    const select = within(panel).getByRole('combobox');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'Climb' } });
    expect(panel).toHaveTextContent('+2 competence on Climb');
  });
});

describe('the bard keeping the song', () => {
  /* Inspire greatness and inspire heroism name the bard as a legal target in
     so many words, and plenty of tables read inspire courage the same way. The
     panel is already open and already knows the size — handing it to yourself
     through a second phone would be theatre. */
  test('the panel puts the effect on the sharer’s own sheet', () => {
    const player = bard(14);
    const attack = player.getPunchAttackBonus();
    renderWith(<BardicMusicCard />, player);
    fireEvent.click(screen.getByRole('button', { name: 'Share Inspire courage' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take the effect' }));
    expect(player.getPunchAttackBonus()).toBe(attack + 3);
  });

  test('and stays open, so the code can still be shown around', () => {
    renderWith(<BardicMusicCard />, bard(14));
    fireEvent.click(screen.getByRole('button', { name: 'Share Inspire courage' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take the effect' }));
    expect(screen.getByRole('dialog', { name: /Share effect/i })).toBeInTheDocument();
  });

  test('a second press cannot stack the same song on the same bard', () => {
    const player = bard(14);
    renderWith(<BardicMusicCard />, player);
    fireEvent.click(screen.getByRole('button', { name: 'Share Inspire courage' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take the effect' }));
    const done = screen.getByRole('button', { name: 'Taken' });
    expect(done).toBeDisabled();
    fireEvent.click(done);
    expect(player.getSharedEffects()).toHaveLength(1);
  });

  test('what it takes is unattributed — it is the bard’s own song', () => {
    const player = bard(14);
    renderWith(<BardicMusicCard />, player);
    fireEvent.click(screen.getByRole('button', { name: 'Share Inspire courage' }));
    fireEvent.click(screen.getByRole('button', { name: 'Take the effect' }));
    expect(player.getSharedEffects()[0].from).toBeUndefined();
  });
});

describe('the offer, on the receiving sheet', () => {
  const offer = (store, effect) => act(() => { store.dispatch(setIncomingEffect(effect)); });

  test('is a question before it is a bonus', () => {
    const { store, player } = renderWith(<ConditionsSection />, fighter());
    const attack = player.getPunchAttackBonus();
    offer(store, { id: 'inspireCourage', bonus: 2, from: 'Lyra' });
    expect(screen.getByText('Inspire courage')).toBeInTheDocument();
    expect(player.getPunchAttackBonus()).toBe(attack);
  });

  test('accepting moves the number and closes the offer', () => {
    const { store, player } = renderWith(<ConditionsSection />, fighter());
    const attack = player.getPunchAttackBonus();
    offer(store, { id: 'inspireCourage', bonus: 2, from: 'Lyra' });
    fireEvent.click(screen.getByRole('button', { name: /Accept/ }));
    expect(player.getPunchAttackBonus()).toBe(attack + 2);
    expect(player.getSharedEffects()).toEqual([{ id: 'inspireCourage', bonus: 2, from: 'Lyra' }]);
    expect(store.getState().app.incomingEffect).toBeNull();
  });

  test('a running one is a pill, and the pill says whose it is', () => {
    /* Two bards in a party is not unusual, and "Inspire courage" twice over
       tells the reader nothing about which of the two to end. */
    const player = fighter();
    player.addSharedEffect({ id: 'inspireCourage', bonus: 2, from: 'Lyra' });
    renderWith(<ConditionsSection />, player);
    /* Asked for as one label rather than by walking up from the x button: the
       name, the size and the source are three text nodes in one pill. */
    const label = screen.getByText((_, el) => (
      el?.className === 'cond-pill-label'
      && el.textContent.includes('Inspire courage +2')
      && el.textContent.includes('Lyra')
    ));
    expect(label).toBeInTheDocument();
  });

  test('declining leaves the sheet exactly as it was', () => {
    const { store, player } = renderWith(<ConditionsSection />, fighter());
    const attack = player.getPunchAttackBonus();
    offer(store, { id: 'inspireHeroism', from: 'Lyra' });
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(store.getState().app.incomingEffect).toBeNull();
    expect(player.getPunchAttackBonus()).toBe(attack);
    expect(player.hasSharedEffects()).toBe(false);
  });

  test('a running effect can be ended from its pill', () => {
    const player = fighter();
    player.addSharedEffect({ id: 'inspireHeroism', from: 'Lyra' });
    const { store } = renderWith(<ConditionsSection />, player);
    const ac = player.getArmorClass();
    fireEvent.click(screen.getByRole('button', { name: /End Inspire heroism/ }));
    expect(store.getState()).toBeTruthy();
    expect(player.getArmorClass()).toBe(ac - 4);
  });
});

describe('in Italian', () => {
  test('the performance and what it does are both read in the reading language', () => {
    setLanguage('it');
    const { store } = renderWith(<ConditionsSection />, fighter());
    act(() => { store.dispatch(setIncomingEffect({ id: 'inspireCourage', bonus: 2, from: 'Lyra' })); });
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getByText('Ispirare coraggio')).toBeInTheDocument();
    expect(sheet).toHaveTextContent('+2 morale ai tiri per colpire');
  });
});
