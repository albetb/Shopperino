import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import SpellLevelCard from './spell_level';

/* The spell save DC is the number a caster reads every time they cast, and it
   is where Spell Focus and the gnome's illusion bonus finally became visible.
   The breakdown behind it is only available on the player sheet: the standalone
   Spellbook tab has no character, so it has no feats and no race to report, and
   showing an empty box there would be worse than showing none. */

function renderLevel({ player, getSaveDC, spells, inst }) {
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
        inst={inst}
        spellsPerDay={[0, 0, 0, 4]}
        charBonus={4}
        getSaveDC={getSaveDC}
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
  'Saving Throw': 'Reflex half',
};

const PHANTASMAL = {
  Name: 'Phantasmal killer',
  Link: 'phantasmal-killer',
  School: 'Illusion (Phantasm)',
  Level: 'Sor/Wiz 4',
  'Saving Throw': 'Will disbelief',
};

/* A real Spellbook rather than a stub: the card reaches into several of its
   methods, and a fake deep enough to satisfy them would be less trustworthy
   than the thing itself. */
const bookFor = (player) => new Spellbook().load(playerToSpellbookData(player));

function gnomeIllusionist() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Wizard';
  p.level = 8;
  p.race = 'Gnome';
  p.feats = ['Spell focus (Illusion)'];
  p.setAbilityBase('int', 18);
  return p;
}

const dcFor = (player) => (lvl, spell) => {
  const dc = player.getSpellSaveDCFor(spell, lvl);
  return dc && { ...dc, contributions: player.getSpellSaveDCContributions(spell, lvl) };
};

describe('the save DC breakdown on a spell row', () => {
  test('names the casting ability and the spell level', () => {
    const player = gnomeIllusionist();
    renderLevel({ player, getSaveDC: dcFor(player), spells: [FIREBALL], inst: bookFor(player) });
    fireEvent.click(screen.getByRole('button', { name: /what makes up fireball save dc/i }));
    const box = screen.getByRole('dialog', { name: 'Fireball save DC' });
    expect(within(box).getByText('Intelligence')).toBeInTheDocument();
    expect(within(box).getByText(/spell level 3/i)).toBeInTheDocument();
  });

  test('names Spell Focus and the gnome bonus on an illusion, and totals correctly', () => {
    const player = gnomeIllusionist();
    renderLevel({ player, getSaveDC: dcFor(player), spells: [PHANTASMAL], inst: bookFor(player) });
    fireEvent.click(screen.getByRole('button', { name: /what makes up phantasmal killer save dc/i }));
    const box = screen.getByRole('dialog', { name: 'Phantasmal killer save DC' });
    expect(within(box).getByText('Spell Focus')).toBeInTheDocument();
    expect(within(box).getByText('Gnome')).toBeInTheDocument();
    const expected = player.getSpellSaveDC(3, PHANTASMAL.School);
    expect(within(box).getByLabelText(`Total ${expected}`)).toBeInTheDocument();
  });

  test('neither feat nor race appears on a spell of another school', () => {
    const player = gnomeIllusionist();
    renderLevel({ player, getSaveDC: dcFor(player), spells: [FIREBALL], inst: bookFor(player) });
    fireEvent.click(screen.getByRole('button', { name: /what makes up fireball save dc/i }));
    const box = screen.getByRole('dialog', { name: 'Fireball save DC' });
    expect(within(box).queryByText('Spell Focus')).toBe(null);
    expect(within(box).queryByText('Gnome')).toBe(null);
  });
});

describe('the standalone spellbook, which has no character', () => {
  test('still shows the DC but offers no breakdown', () => {
    // The app-side path returns a DC with an empty contribution list, exactly
    // as spellbook_table builds it when `isApp` is true.
    const appSideDC = () => ({ dc: 17, focused: false, contributions: [] });
    const player = gnomeIllusionist();
    renderLevel({ player, getSaveDC: appSideDC, spells: [FIREBALL], inst: bookFor(player) });
    expect(screen.getByText('DC 17')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /what makes up/i })).toBe(null);
  });
});

describe('a spell with no saving throw', () => {
  test('shows neither a DC nor a breakdown', () => {
    const player = gnomeIllusionist();
    const noSave = { ...FIREBALL, Name: 'Magic missile', Link: 'magic-missile', 'Saving Throw': 'None' };
    renderLevel({ player, getSaveDC: dcFor(player), spells: [noSave], inst: bookFor(player) });
    expect(screen.queryByText(/^DC /)).toBe(null);
    expect(screen.queryByRole('button', { name: /what makes up/i })).toBe(null);
  });
});
