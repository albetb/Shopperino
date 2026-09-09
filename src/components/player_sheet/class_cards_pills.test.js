import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import ClassCards from './class_cards';

/**
 * The class picker shows the same pills the privileges tab does.
 *
 * It used to print each feature as a paragraph beginning with the literal
 * `[4]` the data uses to mark the level it is gained at — eleven classes of
 * that is a wall of text, and the marker read as a typo. The pills carry the
 * level as a pill of its own and hide the description until asked, so the
 * picker is a comparison again rather than a document.
 *
 * Every card but the one opened here is collapsed and renders nothing, so the
 * queries need no scoping: only the barbarian's features are on the page.
 */

function renderPicker(level = 1) {
  const player = new Player();
  player.name = 'Test';
  player.class = '';
  player.level = level;
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, isPlayerSheetSidebarCollapsed: false },
      persist: { pss: null },
      app: { infoCards: [] },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  render(<Provider store={store}><ClassCards /></Provider>);
  fireEvent.click(screen.getByText('Barbarian'));
}

const pill = (name) => screen.getByRole('button', { name: new RegExp(name) });

describe('the class picker', () => {
  test('shows features as pills, with the level as a pill rather than "[4]"', () => {
    renderPicker();
    const fastMovement = pill('Fast Movement');
    expect(fastMovement).toHaveClass('class-feature-pill');
    /* The marker is a pill beside the name, not text inside it. */
    expect(within(fastMovement).getByText('1')).toHaveClass('class-feature-pill-level');
    expect(screen.queryByText(/\[1\]/)).not.toBeInTheDocument();
  });

  test('a pill opens the short description, not the full class feature text', () => {
    renderPicker();
    expect(screen.queryByText(/land speed \+10 feet\./)).not.toBeInTheDocument();
    fireEvent.click(pill('Fast Movement'));
    /* The one-liner from shortClassFeatures. The long prose — which spells out
       the armour and load conditions — stays on the privileges tab. */
    const body = screen.getByText(/land speed \+10 feet\./);
    expect(body).toHaveClass('class-feature-pill-body');
    expect(body.textContent).not.toMatch(/carrying a (light|medium) load/i);
  });

  test('a feature the character has not reached yet reads as pending', () => {
    renderPicker(1);
    expect(pill('Damage Reduction')).toHaveClass('is-pending');
    expect(pill('Fast Movement')).toHaveClass('is-gained');
  });
});
