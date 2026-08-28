import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../../../lib/player';
import MenuCardAbilityScores from './menu_card_ability_scores';

/* The clearing rule is the whole feature and it is deliberately loose: the pill
   goes once the player has opened this card and moved *something*, whatever
   they moved and whether or not they kept it. These check the component asks
   for that, and only that. The arithmetic behind the count is tested in
   lib/player/playerAbilityIncrease.test.js. */

jest.mock('../../../../store/thunks/playerSheetThunks', () => ({
  onSetAbilityBase: jest.fn(),
  onSetAbilityBonus: jest.fn(),
  onAcknowledgeAbilityIncreases: jest.fn(),
}));

// eslint-disable-next-line import/first
import {
  onSetAbilityBase,
  onSetAbilityBonus,
  onAcknowledgeAbilityIncreases,
} from '../../../../store/thunks/playerSheetThunks';

function renderCard(level) {
  const player = new Player();
  player.name = 'Test';
  player.class = 'Fighter';
  player.level = level;
  const store = configureStore({
    reducer: (state = { playerSheet: { player }, persist: { pss: null } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  render(
    <Provider store={store}>
      <MenuCardAbilityScores isCollapsed={false} onToggleCollapse={() => {}} />
    </Provider>
  );
  return player;
}

beforeEach(() => {
  /* CRA's jest config sets resetMocks, which strips implementations as well as
     calls — so a plain-object return has to be reinstated each time or the
     store rejects the dispatch. */
  [onSetAbilityBase, onSetAbilityBonus, onAcknowledgeAbilityIncreases]
    .forEach((fn) => fn.mockReturnValue({ type: 'noop' }));
});

describe('the level-up reminder pill', () => {
  test('is absent below 4th level', () => {
    renderCard(3);
    expect(screen.queryByText(/^\+\d+ ability$/)).toBe(null);
  });

  test('appears at 4th and counts up as more go unclaimed', () => {
    renderCard(4);
    expect(screen.getByText('+1 ability')).toBeInTheDocument();
  });

  test('a character entered at 12th is told three are owed', () => {
    renderCard(12);
    expect(screen.getByText('+3 ability')).toBeInTheDocument();
  });
});

describe('what clears it', () => {
  test('changing a score and closing acknowledges, even unsaved values', () => {
    renderCard(4);
    fireEvent.click(screen.getByRole('button', { name: /edit ability scores/i }));
    fireEvent.click(screen.getByRole('button', { name: /increase str base/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onAcknowledgeAbilityIncreases).toHaveBeenCalledTimes(1);
  });

  test('a change that is undone before closing still counts as a visit', () => {
    // Deliberate: the player came here and made the decision, and deciding to
    // leave the score where it was is still deciding. The test is "did they
    // move anything", not "did a score end up higher".
    renderCard(4);
    fireEvent.click(screen.getByRole('button', { name: /edit ability scores/i }));
    fireEvent.click(screen.getByRole('button', { name: /increase dex base/i }));
    fireEvent.click(screen.getByRole('button', { name: /decrease dex base/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onAcknowledgeAbilityIncreases).toHaveBeenCalledTimes(1);
  });

  test('opening and closing without touching anything does not clear it', () => {
    renderCard(4);
    fireEvent.click(screen.getByRole('button', { name: /edit ability scores/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onAcknowledgeAbilityIncreases).not.toHaveBeenCalled();
  });

  test('a bonus counts as much as a base score', () => {
    renderCard(8);
    fireEvent.click(screen.getByRole('button', { name: /edit ability scores/i }));
    fireEvent.click(screen.getByRole('button', { name: /increase cha bonus/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onAcknowledgeAbilityIncreases).toHaveBeenCalledTimes(1);
  });
});
