import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import Familiar from '../../lib/player/familiar';
import { getFamiliarSpecies } from '../../lib/animal/familiarData';
import FamiliarCard from './familiar_card';

/* The familiar is the third bonded creature, and had fallen behind the other
   two: no change preview on its hit points, no ability block, no rest healing,
   and an accent-coloured attack pill. This holds the three of them level. */

function wizardWithFamiliar(level = 8) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Wizard';
  p.level = level;
  p.race = 'Human';
  p.maxLife = 40;
  const species = getFamiliarSpecies();
  expect(species.length).toBeGreaterThan(0);
  const familiar = new Familiar({ class: 'Wizard', level, maxHp: 40 });
  familiar.setRef(species[0].ref);
  p.familiar = familiar;
  return p;
}

function renderCard(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: {} },
      persist: { pss: null },
      app: { infoCards: [] },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><FamiliarCard /></Provider>);
}

describe('the familiar model', () => {
  test('reports its six ability scores, with the advanced Intelligence', () => {
    const familiar = wizardWithFamiliar().familiar;
    expect(familiar.getRef()).toBeTruthy();
    const scores = familiar.getAbilities();
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((key) =>
      expect(scores).toHaveProperty(key));
    // Intelligence is the familiar's own, replaced by the advancement table.
    expect(scores.int).toBe(familiar.getInt());
    expect(familiar.getAbilityMod('int')).toBe(Math.floor((scores.int - 10) / 2));
  });

  test('heals a hit point per effective Hit Die on a rest', () => {
    const familiar = wizardWithFamiliar().familiar;
    familiar.setDamage(999);
    expect(familiar.getRestHealAmount()).toBe(familiar.getEffectiveHD());
    expect(familiar.getEffectiveHD()).toBeGreaterThan(0);
  });

  test('a wounded familiar makes a rest worth taking', () => {
    const p = wizardWithFamiliar();
    expect(p.needsRest()).toBe(false);
    p.familiar.setDamage(2);
    expect(p.needsRest()).toBe(true);
  });
});

describe('the familiar card', () => {
  test('shows the ability block, like the companion and the mount', () => {
    renderCard(wizardWithFamiliar());
    ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument());
  });
});
