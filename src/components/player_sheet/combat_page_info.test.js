import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import CombatPage from './combat_page';

/* The wiring test for the breakdown box: it renders the real combat page with a
   real Player, so the info buttons only appear if the model, the component and
   the page all agree. Asserting the AC box's total against the AC on the pill
   is the point — that is the invariant the whole feature exists to make
   checkable, and a page that wires the wrong contribution list would fail it. */

function renderCombat(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, combatPageCardsCollapsed: { player: false, combat: false, items: false } },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><CombatPage /></Provider>);
}

/** Armored, shielded, feated — every stat has something behind it. */
function equipped() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Fighter';
  p.level = 8;
  p.race = 'Dwarf';
  p.feats = ['Great fortitude', 'Improved initiative', 'Toughness'];
  p.setAbilityBase('str', 16);
  p.setAbilityBase('dex', 14);
  p.setAbilityBase('con', 14);
  p.maxLife = 60;
  p.equipItem('armor', { link: 'items/Armor/chain-shirt' });
  p.equipItem('lh1', { link: 'items/Shield/shield-heavy-steel' });
  return p;
}

/** Nothing but a base score anywhere. */
function plain() {
  const p = new Player();
  p.name = 'Plain';
  p.class = 'Fighter';
  p.level = 1;
  p.race = 'Human';
  p.maxLife = 10;
  return p;
}

const infoButton = (name) => screen.queryByRole('button', { name: new RegExp(`what makes up ${name}`, 'i') });

describe('which stats offer a breakdown', () => {
  test('a loaded character gets one on every stat that has sources', () => {
    renderCombat(equipped());
    ['armor class', 'initiative', 'speed', 'fortitude save', 'reflex save', 'will save', 'maximum hit points']
      .forEach((name) => expect(infoButton(name)).toBeInTheDocument());
  });

  test('a stat with nothing beyond its base offers none', () => {
    renderCombat(plain());
    // A 1st-level human fighter with a Dexterity of 10 has no initiative
    // sources at all, so the button must not be there.
    expect(infoButton('initiative')).toBe(null);
    // Armor class always has base 10, so that one is always available.
    expect(infoButton('armor class')).toBeInTheDocument();
  });
});

describe('the armor class box', () => {
  test('lists the armor and shield, and totals to the AC on the pill', () => {
    const player = equipped();
    renderCombat(player);
    fireEvent.click(infoButton('armor class'));
    const box = screen.getByRole('dialog', { name: 'Armor Class' });
    expect(within(box).getByText(/chain shirt/i)).toBeInTheDocument();
    expect(within(box).getByText(/shield, heavy steel/i)).toBeInTheDocument();
    // The number in the box must be the number on the sheet.
    expect(within(box).getByLabelText(`Total ${player.getArmorClass()}`)).toBeInTheDocument();
  });

  test("names the dwarf's giant-fighting bonus as situational, not as a row", () => {
    const player = equipped();
    renderCombat(player);
    fireEvent.click(infoButton('armor class'));
    const box = screen.getByRole('dialog', { name: 'Armor Class' });
    expect(within(box).getByText('Situational')).toBeInTheDocument();
    expect(within(box).getByText(/against monsters of the giant type/i)).toBeInTheDocument();
    // It is a note, so it did not move the total.
    expect(within(box).getByLabelText(`Total ${player.getArmorClass()}`)).toBeInTheDocument();
  });
});

describe('the speed box', () => {
  test('carries the run explanation that used to be hover-only', () => {
    renderCombat(equipped());
    fireEvent.click(infoButton('speed'));
    const box = screen.getByRole('dialog', { name: 'Speed' });
    expect(within(box).getByText(/a full-round run covers \d+ ft/i)).toBeInTheDocument();
    expect(within(box).getByText(/dexterity bonus to ac while running/i)).toBeInTheDocument();
  });

  /* The run distance left the pill entirely: it is reference, not a number read
     mid-turn, so it lives in the box with the rest of the speed's story. */
  test('the run distance is in the box and no longer crowds the pill', () => {
    renderCombat(equipped());
    expect(screen.queryByText(/^run \d+ ft/i)).toBe(null);
    fireEvent.click(infoButton('speed'));
    const box = screen.getByRole('dialog', { name: 'Speed' });
    expect(within(box).getByText(/a full-round run covers \d+ ft \(×\d\)/i)).toBeInTheDocument();
  });
});

describe('the saves', () => {
  test("a dwarf's Fortitude box separates the feat from the poison note", () => {
    const player = equipped();
    renderCombat(player);
    fireEvent.click(infoButton('fortitude save'));
    const box = screen.getByRole('dialog', { name: 'Fortitude save' });
    // Great Fortitude is +2 and belongs in the total...
    expect(within(box).getByLabelText(`Total ${player.getTotalFortitudeSave()}`)).toBeInTheDocument();
    // ...the +2 against poison does not.
    expect(within(box).getByText(/against poison/i)).toBeInTheDocument();
  });
});

describe('the weapon rows', () => {
  /** A wizard in full plate with a greatsword: untrained in all three. */
  function untrainedWizard() {
    const p = new Player();
    p.name = 'Test';
    p.class = 'Wizard';
    p.level = 8;
    p.race = 'Human';
    p.maxLife = 30;
    p.setAbilityBase('str', 12);
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    p.equipItem('rh1', { link: 'items/Weapon/greatsword', name: 'Greatsword', twoHanded: true });
    return p;
  }

  /** The two labelled groups inside one weapon's box, by their eyebrows. */
  const groupsOf = (box) => {
    const named = (text) => Array.from(box.querySelectorAll('.stat-info-group'))
      .find((g) => g.querySelector('.sh-eyebrow')?.textContent === text);
    return { attack: named('Attack bonus'), damage: named('Damage bonus') };
  };

  test('the box lists base attack, the ability and any feat, and totals to the pill', () => {
    const player = equipped();
    player.feats = [...player.feats, 'Weapon focus (Longsword)'];
    player.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    renderCombat(player);
    fireEvent.click(infoButton('longsword'));
    const box = screen.getByRole('dialog', { name: /^longsword$/i });
    const { attack } = groupsOf(box);
    expect(within(attack).getByText('base attack bonus')).toBeInTheDocument();
    expect(within(attack).getByText('Strength')).toBeInTheDocument();
    expect(within(attack).getByText('Weapon Focus')).toBeInTheDocument();
    // Each group carries its own total, so neither is read against the other.
    expect(within(attack).getByText('Total')).toBeInTheDocument();
  });

  /* Damage used to have no box at all: getWeaponDamageContributions existed in
     the model and no component called it, so the number after the dice was the
     one part of a weapon row nothing could explain. */
  test('the same box explains the damage bonus in its own group', () => {
    const player = equipped();
    player.feats = [...player.feats, 'Weapon specialization (Longsword)'];
    player.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    renderCombat(player);
    fireEvent.click(infoButton('longsword'));
    const { attack, damage } = groupsOf(screen.getByRole('dialog', { name: /^longsword$/i }));
    expect(damage).toBeDefined();
    expect(within(damage).getByText('Strength')).toBeInTheDocument();
    expect(within(damage).getByText('Weapon Specialization')).toBeInTheDocument();
    // Base attack belongs to the attack roll and must not leak into damage.
    expect(within(damage).queryByText('base attack bonus')).toBe(null);
    expect(within(attack).queryByText('Weapon Specialization')).toBe(null);
  });

  test('there is still one button on the row, not one per number', () => {
    const player = equipped();
    player.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    renderCombat(player);
    expect(screen.getAllByRole('button', { name: /what makes up longsword/i })).toHaveLength(1);
  });

  test("a ranger's favored enemy damage is situational, not a damage row", () => {
    const player = equipped();
    player.class = 'Ranger';
    player.level = 5;
    player.addFavoredEnemy('Giant');
    player.equipItem('rh1', { link: 'items/Weapon/longsword', name: 'Longsword' });
    renderCombat(player);
    fireEvent.click(infoButton('longsword'));
    const box = screen.getByRole('dialog', { name: /^longsword$/i });
    const { damage } = groupsOf(box);
    expect(within(box).getByText('Favored enemy')).toBeInTheDocument();
    expect(within(box).getByText(/weapon damage against giant/)).toBeInTheDocument();
    // It only applies against that creature, so it is not inside the sum.
    expect(within(damage).queryByText('Favored enemy')).toBe(null);
  });

  test('the -4 for an untrained weapon is a row in the box, not a hover tooltip', () => {
    renderCombat(untrainedWizard());
    fireEvent.click(infoButton('greatsword'));
    const box = screen.getByRole('dialog', { name: /^greatsword$/i });
    expect(within(box).getByText('not proficient')).toBeInTheDocument();
    expect(within(box).getByText('-4')).toBeInTheDocument();
    expect(within(box).getByText('untrained armor')).toBeInTheDocument();
  });

  test('the meta line no longer hides its meaning in a title attribute', () => {
    renderCombat(untrainedWizard());
    // The box is closed, so this is the meta-line marker on the weapon row.
    expect(screen.getByText('not proficient')).not.toHaveAttribute('title');
  });
});

/* Diamond Soul and Perfect Self both land in the health card, beside the hit
   points they protect, rather than on a class-feature card of their own. */
describe('the monk defenses reach the health card', () => {
  function monk(level) {
    const p = new Player();
    p.name = 'Monk';
    p.class = 'Monk';
    p.level = level;
    p.race = 'Human';
    p.maxLife = 90;
    return p;
  }

  test('spell resistance shows from 13th and not before', () => {
    const { unmount } = renderCombat(monk(12));
    expect(screen.queryByText(/^SR /)).toBe(null);
    unmount();

    renderCombat(monk(13));
    expect(screen.getByText('SR 23')).toBeInTheDocument();
  });

  test('perfect self shows its damage reduction at 20th', () => {
    const { unmount } = renderCombat(monk(19));
    expect(screen.queryByText(/^DR /)).toBe(null);
    unmount();

    renderCombat(monk(20));
    expect(screen.getByText('DR 10/magic')).toBeInTheDocument();
    expect(screen.getByText('SR 30')).toBeInTheDocument();
  });

  test('a fighter of the same level shows neither', () => {
    const p = monk(20);
    p.class = 'Fighter';
    renderCombat(p);
    expect(screen.queryByText(/^SR /)).toBe(null);
    expect(screen.queryByText(/^DR /)).toBe(null);
  });
});
