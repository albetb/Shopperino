import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import { MonkBonusFeatsCard, StunningFistCard } from './monk_cards';
import { SmiteEvilCard, RemoveDiseaseCard } from './paladin_cards';
import RogueSpecialAbilitiesCard from './rogue_cards';

/* Every card that carried a paragraph of rules text now carries a button
   instead. The rule worth holding is the same one each time: the explanation
   must be genuinely absent until asked for — otherwise nothing was gained —
   and the card must still show the numbers a player reads mid-fight. */

function renderCard(component, player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: {} },
      persist: { pss: null },
      app: { infoCards: [] },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}>{component}</Provider>);
}

function character(cls, level, extra = {}) {
  const p = new Player();
  p.name = 'Test';
  p.class = cls;
  p.level = level;
  p.race = 'Human';
  p.setAbilityBase('wis', 16);
  p.setAbilityBase('cha', 16);
  Object.assign(p, extra);
  return p;
}

const infoButton = (label) => screen.getByRole('button', { name: new RegExp(`how ${label} works`, 'i') });

describe('stunning fist', () => {
  const monk = () => character('Monk', 6, { feats: ['Stunning fist'] });

  test('the save DC stays on the card — it is what the table asks for', () => {
    renderCard(<StunningFistCard />, monk());
    expect(screen.getByText(/Fortitude DC \d+/)).toBeInTheDocument();
  });

  test('the explanation is behind the button, not on the card', () => {
    renderCard(<StunningFistCard />, monk());
    expect(screen.queryByText(/loses its next action/i)).toBe(null);
    fireEvent.click(infoButton('stunning fist'));
    expect(screen.getByText(/loses its next action/i)).toBeInTheDocument();
  });

  test('slow fall has left this card for the speed breakdown', () => {
    const p = character('Monk', 20, { feats: ['Stunning fist'] });
    renderCard(<StunningFistCard />, p);
    expect(screen.queryByText(/slow fall/i)).toBe(null);
    // It is now a situational note on speed, where a reader looking up how far
    // they move will actually meet it.
    const notes = p.getSituationalContributions('speed');
    expect(notes.some((n) => /slow fall/i.test(n.label))).toBe(true);
  });
});

describe('monk bonus feats', () => {
  test('each pair is one slider, not two switches', () => {
    renderCard(<MonkBonusFeatsCard />, character('Monk', 6));
    // Three levels reached at 6th: 1st, 2nd and 6th.
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3);
    expect(screen.queryAllByRole('switch')).toHaveLength(0);
  });

  test('the reminder moved behind the button', () => {
    renderCard(<MonkBonusFeatsCard />, character('Monk', 6));
    expect(screen.queryByText(/ignore their normal prerequisites/i)).toBe(null);
    fireEvent.click(infoButton('monk bonus feats'));
    expect(screen.getByText(/ignore their normal prerequisites/i)).toBeInTheDocument();
  });
});

describe('smite evil', () => {
  test('the numbers stay, the prose goes behind the button', () => {
    renderCard(<SmiteEvilCard />, character('Paladin', 8));
    expect(screen.getByText(/attack$/)).toBeInTheDocument();
    expect(screen.queryByText(/wasted on a miss/i)).toBe(null);
    fireEvent.click(infoButton('smite evil'));
    expect(screen.getByText(/wasted on a miss/i)).toBeInTheDocument();
  });
});

describe('remove disease', () => {
  test('the spell link survives the move into the popover', () => {
    renderCard(<RemoveDiseaseCard />, character('Paladin', 8));
    fireEvent.click(infoButton('remove disease'));
    const box = screen.getByRole('dialog', { name: 'Remove disease' });
    // The link is what a paladin actually needs from this card: the spell's own
    // range, duration and save.
    expect(within(box).getByRole('button', { name: /remove disease/i })).toBeInTheDocument();
    expect(within(box).getByText(/refresh/i)).toBeInTheDocument();
  });
});

describe('rogue special abilities', () => {
  const rogue = () => character('Rogue', 13);

  test('the level leads the row as a compact badge', () => {
    renderCard(<RogueSpecialAbilitiesCard />, rogue());
    expect(screen.getByText('Lv 10')).toBeInTheDocument();
    expect(screen.queryByText('Level 10')).toBe(null);
  });

  test('a slot with nothing chosen has nothing to fold', () => {
    renderCard(<RogueSpecialAbilitiesCard />, rogue());
    expect(screen.queryByRole('button', { name: /what it does/i })).toBe(null);
  });

  test('a chosen ability folds its description away on its own', () => {
    const p = rogue();
    const ability = p.getRogueSpecialAbilityOptions().find((o) => o !== 'Feat');
    p.setRogueSpecialAbility(10, ability);
    // Asserted rather than guarded: a slot whose description never arrives
    // would otherwise let this test pass while checking nothing.
    expect(p.getRogueSpecialAbilityDescription(ability)).toBeTruthy();

    renderCard(<RogueSpecialAbilitiesCard />, p);
    const toggle = screen.getByRole('button', { name: /what it does/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(p.getRogueSpecialAbilityDescription(ability))).toBe(null);

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /hide/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(p.getRogueSpecialAbilityDescription(ability))).toBeInTheDocument();
  });

  test('the note moved behind the button', () => {
    renderCard(<RogueSpecialAbilitiesCard />, rogue());
    expect(screen.queryByText(/each named ability only once/i)).toBe(null);
    fireEvent.click(infoButton('rogue special abilities'));
    expect(screen.getByText(/only once/i)).toBeInTheDocument();
  });
});
