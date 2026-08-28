import { render, screen, fireEvent, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import SkillsPage from './skills_page';
import MenuCardAbilityScores from '../menus/player_sheet_sidebar/cards/menu_card_ability_scores';

/* The two surfaces outside the combat page's vocabulary. The rule worth
   guarding on the skills list is restraint: with 36 skills, a button on every
   row would be noise, so a row whose total is only ranks plus its key ability
   gets none. An elf's Listen, which carries a racial bonus nothing used to
   show, gets one. */

function renderWith(component, player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: { player, playerSheetSidebarCollapsed: false },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}>{component}</Provider>);
}

function elfRogue() {
  const p = new Player();
  p.name = 'Test';
  p.class = 'Rogue';
  p.level = 6;
  p.race = 'Elf';
  p.setAbilityBase('dex', 16);
  p.setAbilityBase('wis', 12);
  return p;
}

const infoButton = (name) => screen.queryByRole('button', { name: new RegExp(`what makes up ${name}$`, 'i') });

describe('the skills list', () => {
  test('a skill carrying a racial bonus offers a breakdown', () => {
    renderWith(<SkillsPage />, elfRogue());
    expect(infoButton('Listen')).toBeInTheDocument();
    expect(infoButton('Search')).toBeInTheDocument();
  });

  test('a skill that is only ranks and its ability offers none', () => {
    renderWith(<SkillsPage />, elfRogue());
    // An elf has no racial bonus to Climb and this rogue has no feat for it.
    expect(infoButton('Climb')).toBe(null);
    expect(infoButton('Bluff')).toBe(null);
  });

  test("the box names the racial bonus and totals to the row's number", () => {
    const player = elfRogue();
    renderWith(<SkillsPage />, player);
    fireEvent.click(infoButton('Listen'));
    const box = screen.getByRole('dialog', { name: 'Listen' });
    expect(within(box).getByText('Elf')).toBeInTheDocument();
    expect(within(box).getByLabelText(`Total ${player.getSkillTotal('Listen')}`)).toBeInTheDocument();
  });

  test('the armor check penalty earns a box on a skill that would not otherwise have one', () => {
    const p = elfRogue();
    p.equipItem('armor', { link: 'items/Armor/full-plate' });
    renderWith(<SkillsPage />, p);
    fireEvent.click(infoButton('Climb'));
    const box = screen.getByRole('dialog', { name: 'Climb' });
    expect(within(box).getByText(/armor check penalty/i)).toBeInTheDocument();
    expect(within(box).getByLabelText(`Total ${p.getSkillTotal('Climb')}`)).toBeInTheDocument();
  });

  test("a dwarf's conditional Appraise bonus shows as situational, not in the total", () => {
    const p = elfRogue();
    p.race = 'Dwarf';
    renderWith(<SkillsPage />, p);
    fireEvent.click(infoButton('Appraise'));
    const box = screen.getByRole('dialog', { name: 'Appraise' });
    expect(within(box).getByText(/stone or metal/i)).toBeInTheDocument();
  });
});

describe('the ability card', () => {
  test('a score with a racial modifier offers a breakdown', () => {
    renderWith(<MenuCardAbilityScores isCollapsed={false} onToggleCollapse={() => {}} />, elfRogue());
    // Elf is +2 Dexterity and -2 Constitution.
    expect(infoButton('Dex')).toBeInTheDocument();
    expect(infoButton('Con')).toBeInTheDocument();
  });

  test('a score that is only its base offers none', () => {
    const p = new Player();
    p.name = 'Plain';
    p.class = 'Fighter';
    p.level = 1;
    p.race = 'Human';
    renderWith(<MenuCardAbilityScores isCollapsed={false} onToggleCollapse={() => {}} />, p);
    expect(infoButton('Str')).toBe(null);
    expect(infoButton('Int')).toBe(null);
  });

  test('the box totals to the score shown in the cell', () => {
    const player = elfRogue();
    renderWith(<MenuCardAbilityScores isCollapsed={false} onToggleCollapse={() => {}} />, player);
    fireEvent.click(infoButton('Dex'));
    const box = screen.getByRole('dialog', { name: 'Dex' });
    expect(within(box).getByText('base score')).toBeInTheDocument();
    expect(within(box).getByLabelText(`Total ${player.getAbilityTotal('dex')}`)).toBeInTheDocument();
  });

  test('the edit controls and the level-up reminder still work', () => {
    const p = elfRogue();
    p.level = 8;
    renderWith(<MenuCardAbilityScores isCollapsed={false} onToggleCollapse={() => {}} />, p);
    // The reminder pill survives the new button in the same card.
    expect(screen.getByText('+2 ability')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /edit ability scores/i }));
    expect(screen.getByRole('button', { name: /increase str base/i })).toBeInTheDocument();
  });
});
