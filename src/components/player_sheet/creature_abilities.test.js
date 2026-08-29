import { render, screen } from '@testing-library/react';
import Player from '../../lib/player';
import AnimalCompanion from '../../lib/player/animalCompanion';
import { getSelectableCompanions } from '../../lib/animal/animalCompanionData';
import CreatureAbilities from './creature_abilities';

/* The companion's ability scores, laid out as the monster sheet lays out a
   monster's. The rule the model carries is that the advancement table raises
   both Strength and Dexterity together and nothing else, so the grid is the
   place that would show it if the model ever stopped. */

/* One creature, read at two levels. Taking whatever the level happens to offer
   first would compare two different animals, which is not what advancement
   means. The 1st-level list is the standard one, so its first entry exists at
   every level above. */
const BASE_REF = getSelectableCompanions(1)[0]?.ref;

function companionAt(level) {
  expect(BASE_REF).toBeTruthy();
  const c = new AnimalCompanion({ class: 'Druid', level });
  c.setRef(BASE_REF);
  return c;
}

test('all six abilities are labelled, and each shows a score and a modifier', () => {
  const c = companionAt(1);
  render(<CreatureAbilities creature={c} />);
  const scores = c.getAbilities();
  ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach((label) => {
    expect(screen.getByText(label)).toBeInTheDocument();
    const key = label.toLowerCase();
    const mod = c.getAbilityMod(key);
    // Every one is reported: a real score, or an em dash where the creature
    // genuinely has none.
    const shownScore = scores[key] == null ? '—' : String(scores[key]);
    const shownMod = mod == null ? '—' : `${mod >= 0 ? '+' : ''}${mod}`;
    expect(screen.getAllByText(shownScore).length).toBeGreaterThan(0);
    expect(screen.getAllByText(shownMod).length).toBeGreaterThan(0);
  });
});

test('the score shown is the advanced one, and the modifier matches it', () => {
  const c = companionAt(9);
  render(<CreatureAbilities creature={c} />);
  const scores = c.getAbilities();
  // Str and Dex both carry the advancement adjustment; the model owns that.
  expect(c.getAbilityMod('str')).toBe(Math.floor((scores.str - 10) / 2));
  expect(screen.getAllByText(String(scores.str)).length).toBeGreaterThan(0);
});

test('advancement raises Strength and Dexterity together, and leaves the rest', () => {
  const low = companionAt(1).getAbilities();
  const high = companionAt(20).getAbilities();
  const adj = high.str - low.str;
  expect(adj).toBeGreaterThan(0);
  expect(high.dex - low.dex).toBe(adj);
  expect(high.con).toBe(low.con);
  expect(high.wis).toBe(low.wis);
});

test('a paladin mount reports its own six too', () => {
  const p = new Player();
  p.name = 'Test'; p.class = 'Paladin'; p.level = 8; p.race = 'Human';
  const mount = p.addSpecialMount();
  render(<CreatureAbilities creature={mount} />);
  // Intelligence is the mount's own advanced score, not the base horse's.
  expect(mount.getAbilities().int).toBe(mount.getIntelligence());
  expect(screen.getByText('Int')).toBeInTheDocument();
});

test('nothing renders for a creature that cannot answer', () => {
  const { container } = render(<CreatureAbilities creature={null} />);
  expect(container).toBeEmptyDOMElement();
});
