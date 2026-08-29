import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import Spellbook from '../../lib/spellbook';
import { playerToSpellbookData } from '../../lib/player/playerSpellbookAdapter';
import { encodeMetamagic, HEIGHTEN } from '../../lib/spellbook/metamagic';
import SpellLevelCard from './spell_level';

/* Preparing a spell twice, once modified.
 *
 * The control only exists for a character who has a metamagic feat, and what
 * it produces is a *second* preparation of the same spell — which then appears
 * under the level whose slot it takes, not under the spell's own.
 */

const MAGIC_MISSILE = {
  Name: 'Magic missile',
  Link: 'magic-missile',
  School: 'Evocation',
  Level: 'Sor/Wiz 1',
};

function renderLevel({ inst, spells, page = 1, level = 1, actions = {}, rods = [] }) {
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
        page={page}
        inst={inst}
        spellsPerDay={[4, 4, 4, 3, 3, 2, 1, 0, 0, 0]}
        charBonus={4}
        showShortDescriptions={false}
        actions={actions}
        metamagicRods={rods}
        dispatch={() => {}}
      />
    </Provider>
  );
}

/** A wizard with the feats named, as a Spellbook the card can read. */
function wizardWith(feats, level = 9) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass('Wizard');
  p.setLevel(level);
  p.setAbilityBase('int', 18);
  feats.forEach((f) => p.addFeat(f));
  return { player: p, book: () => new Spellbook().load(playerToSpellbookData(p)) };
}

const openPopover = () => fireEvent.click(screen.getByLabelText(/with metamagic/i));

describe('the button that opens the choice', () => {
  test('is absent for a caster with no metamagic feat', () => {
    const { book } = wizardWith([]);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    expect(screen.queryByLabelText(/with metamagic/i)).not.toBeInTheDocument();
  });

  test('appears once the feat is taken', () => {
    const { book } = wizardWith(['Empower spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    expect(screen.getByLabelText('Prepare Magic missile with metamagic')).toBeInTheDocument();
  });

  test('only the feats the character has are offered', () => {
    const { book } = wizardWith(['Empower spell', 'Silent spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    openPopover();
    expect(screen.getByRole('button', { name: /Empowered/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Silent/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Maximized/ })).not.toBeInTheDocument();
  });

  test('the standalone spellbook offers all nine, having no feats to check', () => {
    const inst = new Spellbook('Book');
    inst.setClass('Wizard');
    inst.setLevel(9);
    inst.setCharacteristic(18);
    renderLevel({ inst, spells: [MAGIC_MISSILE] });
    openPopover();
    ['Empowered', 'Enlarged', 'Extended', 'Maximized', 'Quickened', 'Silent', 'Stilled', 'Widened']
      .forEach((label) => {
        expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
      });
    expect(screen.getByText('Heighten to')).toBeInTheDocument();
  });
});

describe('what the popover says the choice costs', () => {
  test('the slot moves and the spell does not', () => {
    const { book } = wizardWith(['Empower spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Empowered/ }));
    expect(screen.getByText('level 3')).toBeInTheDocument();
    expect(screen.getByText(/still works as a/)).toBeInTheDocument();
  });

  test('the chip carries its own price', () => {
    const { book } = wizardWith(['Maximize spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    openPopover();
    expect(screen.getByRole('button', { name: 'Maximized +3' })).toBeInTheDocument();
  });

  test('two feats sum', () => {
    const { book } = wizardWith(['Empower spell', 'Silent spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Empowered/ }));
    fireEvent.click(screen.getByRole('button', { name: /Silent/ }));
    expect(screen.getByText('level 4')).toBeInTheDocument();
  });

  test('Heighten says it moves the spell’s own level too', () => {
    /* The one metamagic feat that raises the effective level, and therefore
       the save DC. Saying so is the whole reason it gets its own control. */
    const { book } = wizardWith(['Heighten spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    openPopover();
    fireEvent.click(screen.getByLabelText('Heighten to level 5'));
    expect(screen.getByText(/raises the spell's own level/)).toBeInTheDocument();
    // Both numbers move together, so "level 5" is the slot and the DC's level.
    expect(screen.getAllByText('level 5')).toHaveLength(2);
  });

  test('a slot no caster has is flagged rather than refused', () => {
    const { book } = wizardWith(['Maximize spell']);
    const inst = book();
    const NINTH = { ...MAGIC_MISSILE, Name: 'Wish', Link: 'wish', Level: 'Sor/Wiz 9' };
    renderLevel({ inst, spells: [NINTH], level: 9 });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Maximized/ }));
    expect(screen.getByText(/No caster has a level 12 slot/)).toBeInTheDocument();
  });
});

describe('preparing the modified copy', () => {
  test('the stepper is hidden until a feat is picked', () => {
    const { book } = wizardWith(['Empower spell']);
    renderLevel({ inst: book(), spells: [MAGIC_MISSILE] });
    openPopover();
    expect(screen.getByText(/Pick a feat above/)).toBeInTheDocument();
  });

  test('stepping up prepares that combination, not the plain spell', () => {
    const { book } = wizardWith(['Empower spell']);
    const prepared = [];
    renderLevel({
      inst: book(),
      spells: [MAGIC_MISSILE],
      actions: { onPrepareSpell: (link, mm) => prepared.push({ link, mm }) },
    });
    openPopover();
    fireEvent.click(screen.getByRole('button', { name: /Empowered/ }));
    fireEvent.click(screen.getAllByLabelText('Prepare one more')[1]);
    expect(prepared).toEqual([
      { link: 'magic-missile', mm: encodeMetamagic(['Empower spell']) },
    ]);
  });

  test('the row’s own stepper still prepares the plain one', () => {
    const { book } = wizardWith(['Empower spell']);
    const prepared = [];
    renderLevel({
      inst: book(),
      spells: [MAGIC_MISSILE],
      actions: { onPrepareSpell: (link, mm) => prepared.push({ link, mm }) },
    });
    fireEvent.click(screen.getByLabelText('Prepare one more'));
    expect(prepared).toEqual([{ link: 'magic-missile', mm: 0 }]);
  });
});

describe('the modified preparation, once it exists', () => {
  test('wears a pill saying what was done to it', () => {
    const { book } = wizardWith(['Empower spell']);
    const inst = book();
    const row = { ...MAGIC_MISSILE, mm: encodeMetamagic(['Empower spell']), baseLevel: 1, effectiveLevel: 1 };
    renderLevel({ inst, spells: [row], level: 3 });
    expect(screen.getByText('Empowered')).toBeInTheDocument();
  });

  test('and no longer offers to modify itself again', () => {
    // The popover hangs off the plain row; a modified row is the result.
    const { book } = wizardWith(['Empower spell']);
    const row = { ...MAGIC_MISSILE, mm: encodeMetamagic(['Empower spell']), baseLevel: 1, effectiveLevel: 1 };
    renderLevel({ inst: book(), spells: [row], level: 3 });
    expect(screen.queryByLabelText(/with metamagic/i)).not.toBeInTheDocument();
  });

  test('a heightened one says so with its target level', () => {
    const { book } = wizardWith(['Heighten spell']);
    const mm = encodeMetamagic([HEIGHTEN], 4);
    const row = { ...MAGIC_MISSILE, mm, baseLevel: 1, effectiveLevel: 4 };
    renderLevel({ inst: book(), spells: [row], level: 4 });
    expect(screen.getByText('Heightened to 4')).toBeInTheDocument();
  });
});
