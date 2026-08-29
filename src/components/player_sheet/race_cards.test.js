import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import fs from 'fs';
import path from 'path';
import Player from '../../lib/player';
import RaceCards from './race_cards';
import { loadFile } from '../../lib/loadFile';
import { getRaceTraits, getRaceNames } from '../../lib/player/racialTraits';

/* The race card used to render a hand-typed RACE_INFO object — a third copy of
   facts races.json already held twice, and the copy a player actually read. The
   rule these tests hold is that there is one source now: what the card shows
   must come from the data file, and nothing may drift back into the component. */

function renderCards(player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, isPlayerSheetSidebarCollapsed: false },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}><RaceCards /></Provider>);
}

function make(race = 'Human') {
  const p = new Player();
  p.setClass('Fighter');
  p.setLevel(1);
  p.setRace(race);
  return p;
}

const openCard = (name) =>
  fireEvent.click(screen.getByRole('button', { name: `Toggle ${name}` }));

describe('the list of races', () => {
  test('is every race in races.json, in its order', () => {
    renderCards(make());
    const names = Object.keys(loadFile('races'));
    expect(names.length).toBe(7);
    names.forEach((name) => expect(screen.getByText(name)).toBeInTheDocument());
    expect(getRaceNames()).toEqual(names);
  });

  test('a collapsed card already answers what the race costs', () => {
    renderCards(make());
    // Every card is shut, and each still shows its own modifiers.
    const dwarf = screen.getByText('Dwarf').closest('.card');
    expect(within(dwarf).getByText('+2 Con')).toBeInTheDocument();
    expect(within(dwarf).getByText('-2 Cha')).toBeInTheDocument();

    // The human has none, and claims none.
    const human = screen.getByText('Human').closest('.card');
    expect(within(human).queryByText(/[+-]\d/)).toBe(null);
  });
});

describe('an opened card is the data file, not a copy of it', () => {
  test("the elf's traits are the ones races.json lists, all of them", () => {
    renderCards(make());
    openCard('Elf');
    const traits = getRaceTraits('Elf');
    expect(traits.length).toBeGreaterThan(5);
    traits.forEach((trait) => {
      expect(screen.getByText(`${trait.name}:`)).toBeInTheDocument();
    });
  });

  test('the structured facts come through beside the prose', () => {
    renderCards(make());
    openCard('Halfling');
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('20 ft speed')).toBeInTheDocument();
    expect(screen.getByText(/favored class: Rogue/)).toBeInTheDocument();
  });

  test('the card says which categories the sheet already applies', () => {
    renderCards(make());
    openCard('Gnome');
    const applied = screen.getByText(/Applied to your sheet automatically/);
    // The gnome has all of these as structured keys, so all are claimed.
    ['ability modifiers', 'size', 'speed', 'skill bonuses', 'save bonuses',
      'attack bonuses', 'armor class', 'illusion save DC'].forEach((category) => {
      expect(applied.textContent).toContain(category);
    });
  });

  test('a race claims only what it actually carries', () => {
    renderCards(make());
    openCard('Half-Orc');
    const applied = screen.getByText(/Applied to your sheet automatically/);
    // A half-orc has no racial skill, save, attack or AC bonuses at all.
    ['skill bonuses', 'save bonuses', 'attack bonuses', 'armor class']
      .forEach((category) => expect(applied.textContent).not.toContain(category));
    expect(applied.textContent).toContain('ability modifiers');
  });
});

describe('choosing a race', () => {
  test('the current race cannot be re-selected, and another can', () => {
    renderCards(make('Dwarf'));
    openCard('Dwarf');
    const dwarfCard = screen.getByText('Dwarf').closest('.card');
    expect(within(dwarfCard).getByRole('button', { name: 'Select' })).toBeDisabled();

    openCard('Elf');
    const elfCard = screen.getByText('Elf').closest('.card');
    expect(within(elfCard).getByRole('button', { name: 'Select' })).toBeEnabled();
  });
});

test('no hand-typed race prose is left in the component', () => {
  /* The regression this item exists to prevent: a second copy creeping back in.
     The source file must not contain a race trait table of its own. */
  const source = fs.readFileSync(
    path.join(__dirname, 'race_cards.jsx'),
    'utf-8'
  );
  // A mention in the comment explaining why it went is fine; a definition is
  // the thing that must never come back.
  expect(source).not.toMatch(/const\s+RACE_INFO/);
  expect(source).not.toContain('Land speed:');
  expect(source).not.toContain('Darkvision');
});
