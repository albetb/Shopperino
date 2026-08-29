import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import { spellResistanceInfo } from '../../lib/spellbook/spellsUtils';
import SpellLevelCard from './spell_level';

/* The caster level check against spell resistance. Both halves of it existed
   all along — getCasterLevel() in the model, and a Spell Resistance field on
   424 of the 605 spells — and nothing had ever put them together, which is why
   Spell penetration read as a feat with no mechanical effect. */

function renderLevel({ player, spells, getSpellResistance }) {
  const store = configureStore({
    reducer: (state = { playerSheet: { player }, persist: { pss: null }, app: { infoCards: [] } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(
    <Provider store={store}>
      <SpellLevelCard
        level={3}
        spells={spells}
        collapsed={false}
        toggle={() => {}}
        page={2}
        inst={new Spellbook().load(playerToSpellbookData(player))}
        spellsPerDay={[0, 0, 0, 4]}
        charBonus={4}
        getSpellResistance={getSpellResistance}
        showShortDescriptions={false}
        dispatch={() => {}}
      />
    </Provider>
  );
}

const FIREBALL = {
  Name: 'Fireball',
  Link: 'fireball',
  School: 'Evocation [Fire]',
  Level: 'Sor/Wiz 3',
  'Spell Resistance': 'Yes',
};

const SUMMON = {
  Name: 'Summon monster III',
  Link: 'summon-monster-iii',
  School: 'Conjuration (Summoning)',
  Level: 'Sor/Wiz 3',
  'Spell Resistance': 'No',
};

function wizard(feats = [], level = 9) {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Wizard';
  p.level = level;
  p.race = 'Human';
  p.setAbilityBase('int', 18);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

/* The same shape spellbook_table.jsx builds, so the card is exercised through
   the contract it actually receives rather than a convenient stub. */
const srFor = (player) => (spell) => {
  const info = spellResistanceInfo(spell);
  if (!info.applies) return null;
  const check = player.getCasterLevelCheck();
  if (check <= 0) return null;
  return {
    ...info,
    check,
    penetration: player.getSpellPenetrationBonus(),
    contributions: player.getCasterLevelCheckContributions(),
  };
};

describe('which rows carry it', () => {
  test('a spell resistance can stop', () => {
    const p = wizard();
    renderLevel({ player: p, spells: [FIREBALL], getSpellResistance: srFor(p) });
    expect(screen.getByText('SR +9')).toBeInTheDocument();
  });

  test('and not one it cannot', () => {
    const p = wizard();
    renderLevel({ player: p, spells: [SUMMON], getSpellResistance: srFor(p) });
    expect(screen.queryByText(/^SR/)).toBe(null);
  });

  test('the qualifier is on the row, not hidden in the breakdown', () => {
    const p = wizard();
    const harmless = { ...FIREBALL, Name: 'Bless', 'Spell Resistance': 'Yes (harmless)' };
    renderLevel({ player: p, spells: [harmless], getSpellResistance: srFor(p) });
    expect(screen.getByText('SR harmless +9')).toBeInTheDocument();
  });
});

describe('what the number is', () => {
  test('the caster level, with no feat', () => {
    const p = wizard([], 12);
    renderLevel({ player: p, spells: [FIREBALL], getSpellResistance: srFor(p) });
    expect(screen.getByText('SR +12')).toBeInTheDocument();
  });

  test('and four higher with both penetration feats', () => {
    const p = wizard(['Spell penetration', 'Greater spell penetration'], 12);
    renderLevel({ player: p, spells: [FIREBALL], getSpellResistance: srFor(p) });
    expect(screen.getByText('SR +16')).toBeInTheDocument();
  });

  test('a lifted check says so, the way a lifted save DC does', () => {
    const plain = wizard();
    const { unmount } = renderLevel({ player: plain, spells: [FIREBALL], getSpellResistance: srFor(plain) });
    expect(screen.getByText('SR +9').className).not.toContain('is-focused');
    unmount();

    const penetrating = wizard(['Spell penetration']);
    renderLevel({ player: penetrating, spells: [FIREBALL], getSpellResistance: srFor(penetrating) });
    expect(screen.getByText('SR +11').className).toContain('is-focused');
  });
});

describe('the breakdown behind it', () => {
  test('names the caster level and the feat, and adds up', () => {
    const p = wizard(['Spell penetration', 'Greater spell penetration'], 12);
    renderLevel({ player: p, spells: [FIREBALL], getSpellResistance: srFor(p) });
    fireEvent.click(screen.getByRole('button', { name: /what makes up fireball caster level check/i }));
    const box = screen.getByRole('dialog', { name: 'Fireball caster level check' });
    expect(within(box).getByText('caster level')).toBeInTheDocument();
    expect(within(box).getByText('Spell penetration')).toBeInTheDocument();
    expect(within(box).getByText('Caster level check')).toBeInTheDocument();
  });
});
