import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import AugmentSummoningNote from './AugmentSummoningNote';
import InfoMenuCards from '../menus/info_sidebar/cards/info_menu_cards';

/* The creature half of Augment Summoning. Nothing in the app links a monster
 * being read to the spell that might have conjured it, and a creature met in a
 * cave was not summoned at all — so the printed scores stay exactly as they
 * are and the note states the arithmetic instead.
 *
 * The rule these tests hold: it is conditional in its wording, it never
 * changes a number, and it is shown only to a caster who actually has the
 * feat.
 */

function withPlayer(player, ui) {
  const store = configureStore({
    reducer: (state = { playerSheet: { player }, app: { infoCards: [] } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

function caster(feats = ['Augment summoning']) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Wizard');
  p.setLevel(9);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

describe('who sees the note', () => {
  test('a caster with the feat', () => {
    withPlayer(caster(), <AugmentSummoningNote />);
    expect(screen.getByText(/Augment summoning/)).toBeInTheDocument();
  });

  test('nobody else', () => {
    const { container } = withPlayer(caster([]), <AugmentSummoningNote />);
    expect(container).toBeEmptyDOMElement();
  });

  test('and nothing at all with no character selected', () => {
    const { container } = withPlayer(null, <AugmentSummoningNote />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('what it says', () => {
  test('the bonus and both scores', () => {
    withPlayer(caster(), <AugmentSummoningNote />);
    expect(screen.getByText('+4 Strength and Constitution')).toBeInTheDocument();
  });

  test('it is conditional, because the app cannot know the creature was summoned', () => {
    const { container } = withPlayer(caster(), <AugmentSummoningNote />);
    expect(container.textContent).toContain('If you summoned this creature');
    expect(container.textContent).toContain('the scores below are the unsummoned ones');
  });
});

describe('on the info sidebar', () => {
  const creature = {
    Name: 'Dire Wolf',
    Link: 'animals/dire-wolf',
    Abilities: 'Str 25, Dex 15, Con 17, Int 2, Wis 12, Cha 10',
  };
  const spell = { Name: 'Fireball', Link: 'spells/fireball', Description: 'Boom.' };

  test('a creature card carries it', () => {
    withPlayer(caster(), <InfoMenuCards cardsData={[creature]} closeCard={() => {}} />);
    expect(screen.getByText(/If you summoned this creature/)).toBeInTheDocument();
  });

  test('and the printed scores are left exactly as the data file has them', () => {
    withPlayer(caster(), <InfoMenuCards cardsData={[creature]} closeCard={() => {}} />);
    expect(screen.getByText(creature.Abilities)).toBeInTheDocument();
  });

  test('a card that is not a creature does not', () => {
    withPlayer(caster(), <InfoMenuCards cardsData={[spell]} closeCard={() => {}} />);
    expect(screen.queryByText(/If you summoned this creature/)).toBe(null);
  });

  test('all three creature files count, and nothing else does', () => {
    ['animals/ape', 'monsters/aboleth', 'vermin/giant-ant-worker'].forEach((link) => {
      const { unmount } = withPlayer(
        caster(),
        <InfoMenuCards cardsData={[{ ...creature, Link: link }]} closeCard={() => {}} />
      );
      expect(screen.getByText(/If you summoned this creature/)).toBeInTheDocument();
      unmount();
    });
    withPlayer(
      caster(),
      <InfoMenuCards cardsData={[{ ...creature, Link: 'items/Weapon/longsword' }]} closeCard={() => {}} />
    );
    expect(screen.queryByText(/If you summoned this creature/)).toBe(null);
  });
});
