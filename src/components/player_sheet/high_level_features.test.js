import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import { MonkAbilitiesCard, StunningFistCard } from './monk_cards';
import { SmiteEvilCard } from './paladin_cards';
import FeaturesPage from './features_page';

/* The four abilities that had a use or a spell behind them and nowhere to be:
   the three high monk counters, stunning fist for a class that is not the monk,
   detect evil beside the smite it qualifies, and tongue of the sun and moon on
   the language list it makes moot. */

function renderWith(component, player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: {
        player,
        combatPageCardsCollapsed: {},
        playerSheetSidebarCollapsed: false,
        featuresPageCardsOpen: ['languages'],
      },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}>{component}</Provider>);
}

function make(cls, level, wis = 16) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.setAbilityBase('wis', wis);
  return p;
}

describe('the monk abilities card', () => {
  test('shows nothing before 7th, when the first counter arrives', () => {
    const { container } = renderWith(<MonkAbilitiesCard />, make('Monk', 6));
    expect(container).toBeEmptyDOMElement();
  });

  test('each ability appears at its own level, not before', () => {
    const { unmount: unmountSeven } = renderWith(<MonkAbilitiesCard />, make('Monk', 7));
    expect(screen.getByText('Wholeness of body')).toBeInTheDocument();
    expect(screen.queryByText('Abundant step')).toBe(null);
    unmountSeven();

    const { unmount } = renderWith(<MonkAbilitiesCard />, make('Monk', 12));
    expect(screen.getByText('Wholeness of body')).toBeInTheDocument();
    expect(screen.getByText('Abundant step')).toBeInTheDocument();
    expect(screen.queryByText('Quivering palm')).toBe(null);
    expect(screen.queryByText('Empty body')).toBe(null);
    unmount();

    renderWith(<MonkAbilitiesCard />, make('Monk', 20));
    ['Wholeness of body', 'Abundant step', 'Quivering palm', 'Empty body']
      .forEach((name) => expect(screen.getByText(name)).toBeInTheDocument());
  });

  test('wholeness of body heals rather than merely counting down', () => {
    const player = make('Monk', 20);
    player.setMaxLife(100);
    player.setDamage(50);
    const before = player.getCurrentHp();
    renderWith(<MonkAbilitiesCard />, player);
    /* The heal button is a long press — hold for ten, release for one — so it
       answers mouse down/up rather than click. */
    const button = screen.getByRole('button', { name: /heal one hit point/i });
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    // Spending and healing are one action, so the two can never drift apart.
    expect(player.getCurrentHp()).toBe(before + 1);
    expect(player.getClassFeatureUsed('wholenessOfBody')).toBe(1);
  });

  test('the weekly reminder moved into the quivering palm explanation', () => {
    renderWith(<MonkAbilitiesCard />, make('Monk', 20));
    // Not a note on the row any more; it belongs with the rest of the rules.
    expect(screen.queryByText(/refreshes/i)).toBe(null);
    fireEvent.click(screen.getByRole('button', { name: /how quivering palm works/i }));
    const box = screen.getByRole('dialog', { name: 'Quivering palm' });
    expect(within(box).getByText('weekly')).toBeInTheDocument();
  });

  test('each one carries its own counter, with empty body counted in rounds', () => {
    const player = make('Monk', 20);
    renderWith(<MonkAbilitiesCard />, player);
    // Abundant step and quivering palm are one use each; empty body is a pool.
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/20 rounds/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use one abundant step/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use one quivering palm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use one empty body/i })).toBeInTheDocument();
  });

  test('spending one reaches the model', () => {
    const player = make('Monk', 20);
    renderWith(<MonkAbilitiesCard />, player);
    fireEvent.click(screen.getByRole('button', { name: /use one abundant step/i }));
    expect(player.getClassFeatureUsed('abundantStep')).toBe(1);
    expect(player.getClassFeatureUsed('quiveringPalm')).toBe(0);
  });

  test("quivering palm's explanation carries the DC and the window", () => {
    const player = make('Monk', 20, 20);
    renderWith(<MonkAbilitiesCard />, player);
    fireEvent.click(screen.getByRole('button', { name: /how quivering palm works/i }));
    const box = screen.getByRole('dialog', { name: 'Quivering palm' });
    expect(within(box).getByText(`Fortitude save (DC ${player.getQuiveringPalmDc()})`))
      .toBeInTheDocument();
    expect(within(box).getByText('20 days')).toBeInTheDocument();
  });

  test('abundant step names its own caster level', () => {
    renderWith(<MonkAbilitiesCard />, make('Monk', 12));
    fireEvent.click(screen.getByRole('button', { name: /how abundant step works/i }));
    const box = screen.getByRole('dialog', { name: 'Abundant step' });
    expect(within(box).getByText('caster level 6')).toBeInTheDocument();
  });
});

describe('stunning fist outside the monk class', () => {
  test('a fighter who took the feat gets the card and the smaller allowance', () => {
    const fighter = make('Fighter', 12, 14);
    fighter.addFeat('Stunning Fist');
    renderWith(<StunningFistCard />, fighter);
    expect(screen.getByText('Stunning fist')).toBeInTheDocument();
    // Three attempts at 12th — one per four levels — against a monk's twelve.
    expect(document.querySelector('.tracker-card-count').textContent).toBe('3/3');
    expect(screen.getByText('Fortitude DC 18')).toBeInTheDocument();
  });

  test('and no ki strike, which is the monk half of the old card', () => {
    const fighter = make('Fighter', 20, 14);
    fighter.addFeat('Stunning Fist');
    renderWith(<StunningFistCard />, fighter);
    expect(screen.queryByText(/Ki strike/)).toBe(null);
  });

  test('a fighter without the feat still gets nothing', () => {
    const { container } = renderWith(<StunningFistCard />, make('Fighter', 20));
    expect(container).toBeEmptyDOMElement();
  });

  test('below 4th it says why there are no attempts rather than hiding', () => {
    const fighter = make('Fighter', 2, 14);
    fighter.addFeat('Stunning Fist');
    renderWith(<StunningFistCard />, fighter);
    expect(screen.getByText(/one attempt per four levels/i)).toBeInTheDocument();
    expect(screen.getByText('Fortitude DC 13')).toBeInTheDocument();
  });
});

describe('detect evil on the smite card', () => {
  test('a paladin sees it as a linked pill with its allowance beside it', () => {
    renderWith(<SmiteEvilCard />, make('Paladin', 5));
    const pill = screen.getByText('Detect evil');
    expect(pill).toBeInTheDocument();
    // The pill itself is the way into the spell's stat block.
    expect(pill.closest('a, button, [role="link"], [role="button"]')).not.toBe(null);
    expect(screen.getByText('at will')).toBeInTheDocument();
  });

  test('no other class has a smite card to put it on', () => {
    const { container } = renderWith(<SmiteEvilCard />, make('Fighter', 20));
    expect(container).toBeEmptyDOMElement();
  });
});

describe('tongue of the sun and moon on the language card', () => {
  test('a monk of 17th is flagged on the collapsed card, and told why inside', () => {
    renderWith(<FeaturesPage />, make('Monk', 17));
    // Visible without expanding: every card on this page starts collapsed.
    expect(screen.getByText('Tongue of the sun and moon')).toBeInTheDocument();
    expect(screen.queryByText(/any living creature/i)).toBe(null);

    fireEvent.click(screen.getByText('Languages'));
    expect(screen.getByText(/any living creature/i)).toBeInTheDocument();
  });

  test('a monk of 16th is told nothing, and still counts bonus languages', () => {
    renderWith(<FeaturesPage />, make('Monk', 16));
    expect(screen.queryByText('Tongue of the sun and moon')).toBe(null);
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
  });

  test('the bonus-language count goes away once it no longer limits anything', () => {
    const { unmount } = renderWith(<FeaturesPage />, make('Monk', 16));
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
    unmount();

    renderWith(<FeaturesPage />, make('Monk', 17));
    expect(screen.queryByText('0 / 0')).toBe(null);
    expect(screen.getByText('Tongue of the sun and moon')).toBeInTheDocument();
  });
});
