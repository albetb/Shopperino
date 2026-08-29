import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import { encodeMetamagic } from '../../lib/spellbook/metamagic';
import SpellLevelCard from './spell_level';

/* Choosing metamagic at the moment of casting.
 *
 * Two different reasons the same box opens. A sorcerer has no preparation to
 * attach a choice to, so the choice *is* part of casting and spends a slot of
 * the modified level. A metamagic rod is the opposite: it applies its feat
 * without raising the slot at all, which is why it belongs here and not on the
 * prepare page — a wizard decides to spend a rod charge at the table, on a
 * spell prepared perfectly ordinarily at dawn.
 */

const FIREBALL = {
  Name: 'Fireball',
  Link: 'fireball',
  School: 'Evocation [Fire]',
  Level: 'Sor/Wiz 3',
};

function renderCast({ inst, spells = [FIREBALL], level = 3, actions = {}, rods = [] }) {
  const store = configureStore({
    reducer: (state = { playerSheet: { player: null }, persist: { pss: null }, app: { infoCards: [] } }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(
    <Provider store={store}>
      <SpellLevelCard
        level={level}
        spells={spells}
        collapsed={false}
        toggle={() => {}}
        page={2}
        inst={inst}
        spellsPerDay={[6, 6, 6, 5, 4, 3, 0, 0, 0, 0]}
        charBonus={4}
        showShortDescriptions={false}
        actions={actions}
        metamagicRods={rods}
        dispatch={() => {}}
      />
    </Provider>
  );
}

function casterWith(cls, feats, level = 12) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.setAbilityBase(cls === 'Wizard' ? 'int' : 'cha', 18);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

const bookFor = (p) => new Spellbook().load(playerToSpellbookData(p));
const openPopover = () => fireEvent.click(screen.getByLabelText(/with metamagic/i));

const ROD = {
  id: 425,
  name: 'Rod of Metamagic, Quicken, greater',
  feat: 'Quicken spell',
  maxLevel: 9,
  remaining: 3,
  maxCharges: 3,
  isSecondarySet: false,
};

describe('a sorcerer, choosing at the table', () => {
  test('the button is there, because the choice cannot be made earlier', () => {
    const p = casterWith('Sorcerer', ['Empower spell']);
    p.spells = [];
    renderCast({ inst: bookFor(p) });
    expect(screen.getByLabelText('Cast Fireball with metamagic')).toBeInTheDocument();
  });

  test('a sorcerer with no metamagic feat and no rod gets no button', () => {
    const p = casterWith('Sorcerer', []);
    renderCast({ inst: bookFor(p) });
    expect(screen.queryByLabelText(/with metamagic/i)).not.toBeInTheDocument();
  });

  test('an empowered fireball says it will spend a 5th-level slot', () => {
    const p = casterWith('Sorcerer', ['Empower spell']);
    renderCast({ inst: bookFor(p) });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Empowered/ }));
    expect(screen.getByText('level 5')).toBeInTheDocument();
    expect(screen.getByText(/level 5 slots left/)).toBeInTheDocument();
  });

  test('casting sends the spell and the combination', () => {
    const p = casterWith('Sorcerer', ['Empower spell']);
    const cast = [];
    renderCast({ inst: bookFor(p), actions: { onUseSpell: (link, mm) => cast.push({ link, mm }) } });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Empowered/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cast' }));
    expect(cast).toEqual([{ link: 'fireball', mm: encodeMetamagic(['Empower spell']) }]);
  });

  test('the Cast button does nothing until a feat is picked', () => {
    const p = casterWith('Sorcerer', ['Empower spell']);
    renderCast({ inst: bookFor(p) });
    openPopover();
    expect(screen.getByRole('button', { name: 'Cast' })).toBeDisabled();
  });
});

describe('Quicken, which a sorcerer cannot actually use', () => {
  /* The feat's own text forbids it on any spontaneously cast spell. Per
     CLAUDE.md the app computes and displays rather than enforces, so it is
     offered and flagged — the table stays the authority. */
  test('it is offered rather than hidden', () => {
    const p = casterWith('Sorcerer', ['Quicken spell']);
    renderCast({ inst: bookFor(p) });
    openPopover();
    expect(screen.getByRole('button', { name: /Quickened/ })).toBeInTheDocument();
  });

  test('picking it says why it is wrong, and still allows it', () => {
    const p = casterWith('Sorcerer', ['Quicken spell']);
    const cast = [];
    renderCast({ inst: bookFor(p), actions: { onUseSpell: (link, mm) => cast.push({ link, mm }) } });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Quickened/ }));
    expect(screen.getByText(/cannot be quickened/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cast' }));
    expect(cast).toHaveLength(1);
  });

  test('a wizard is told nothing of the sort', () => {
    const p = casterWith('Wizard', ['Quicken spell']);
    renderCast({ inst: bookFor(p), rods: [ROD] });
    openPopover();
    expect(screen.queryByText(/cannot be quickened/)).not.toBeInTheDocument();
  });
});

describe('a metamagic rod', () => {
  test('gives a prepared caster a cast-time choice they otherwise have none of', () => {
    // A wizard's own metamagic is committed at dawn; the rod is not.
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [ROD] });
    expect(screen.getByLabelText('Cast Fireball with metamagic')).toBeInTheDocument();
    openPopover();
    expect(screen.getByText('Rod of Metamagic, Quicken, greater')).toBeInTheDocument();
    expect(screen.getByText('Quickened')).toBeInTheDocument();
  });

  test('says the slot does not move, which is the point of owning one', () => {
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [ROD] });
    openPopover();
    expect(screen.getByText(/without raising the slot/)).toBeInTheDocument();
  });

  test('shows what is left of the day’s charges', () => {
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [{ ...ROD, remaining: 1 }] });
    openPopover();
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  test('casting through it spends the spell and one charge', () => {
    const p = casterWith('Wizard', []);
    const cast = [];
    renderCast({
      inst: bookFor(p),
      rods: [ROD],
      actions: { onUseSpellWithRod: (link, rodId, mm) => cast.push({ link, rodId, mm }) },
    });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: 'Cast' }));
    expect(cast).toEqual([{ link: 'fireball', rodId: 425, mm: 0 }]);
  });

  test('a lesser rod says when the spell is out of its reach', () => {
    /* The one mechanical difference between the three tiers, and it was
       missing from items.json entirely — all three behaved identically. */
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [{ ...ROD, maxLevel: 3, name: 'Rod, lesser' }], level: 5, spells: [{ ...FIREBALL, Name: 'Cone of cold', Link: 'cone-of-cold', Level: 'Sor/Wiz 5' }] });
    openPopover();
    expect(screen.getByText(/reaches spells of level 3 and below/)).toBeInTheDocument();
  });

  test('and says nothing when the spell is within it', () => {
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [{ ...ROD, maxLevel: 3 }] });
    // Fireball is 3rd level, exactly the lesser rod's ceiling.
    openPopover();
    expect(screen.queryByText(/reaches spells of level/)).not.toBeInTheDocument();
  });

  test('a spent rod is flagged rather than removed', () => {
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [{ ...ROD, remaining: 0 }] });
    openPopover();
    expect(screen.getByText(/All 3 of today's charges are spent/)).toBeInTheDocument();
  });

  test('one in the other hand set says you would have to swap', () => {
    const p = casterWith('Wizard', []);
    renderCast({ inst: bookFor(p), rods: [{ ...ROD, isSecondarySet: true }] });
    openPopover();
    expect(screen.getByText(/other hand set/)).toBeInTheDocument();
  });
});
