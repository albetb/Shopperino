import { render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Player from '../../lib/player';
import ActionFeatsRow, { SpellcastingActionFeats } from './action_feats_row';
import CombatPage from './combat_page';
import { ACTION_FEAT_GROUPS } from '../../lib/player/featEffects';
import { loadFile } from '../../lib/loadFile';

/* The feats that grant an action rather than a number.
 *
 * Sixteen of them reached the sheet nowhere at all: the feat audit correctly
 * refused them a *number*, and that was read as refusing them a *presence*.
 * These pills claim nothing and compute nothing — they are a reminder that the
 * feat exists, on the card where the action happens.
 */

function renderWith(node, player) {
  const store = configureStore({
    reducer: (state = {
      playerSheet: {
        player,
        combatPageCardsCollapsed: { player: false, combat: false, items: false, potions: false },
      },
      persist: { pss: null },
      app: { infoCards: [], currentTab: 5 },
    }) => state,
    middleware: (getDefault) => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  return render(<Provider store={store}>{node}</Provider>);
}

function pc(cls = 'Fighter', level = 9) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

const withFeats = (p, ...feats) => { p.feats = [...feats]; return p; };

describe('the data behind the pills', () => {
  test('every feat in the group table is a real feat in feats.json', () => {
    const real = new Set(loadFile('feats').map((f) => String(f.Name)));
    Object.keys(ACTION_FEAT_GROUPS).forEach((name) => {
      expect(real.has(name)).toBe(true);
    });
  });

  test('each one carries a short description to show on hover', () => {
    const p = pc();
    Object.keys(ACTION_FEAT_GROUPS).forEach((name) => {
      expect(p.getFeatShortDescription(name)).not.toBe('');
    });
  });

  test('the 18 split across the four groups', () => {
    const counts = {};
    Object.values(ACTION_FEAT_GROUPS).forEach((g) => { counts[g] = (counts[g] || 0) + 1; });
    expect(counts).toEqual({ melee: 8, ranged: 6, mounted: 2, spellbook: 2 });
  });

  test('the model reports only the feats the character actually has', () => {
    const p = withFeats(pc(), 'Cleave', 'Rapid shot');
    expect(p.getActionFeats('melee').map((f) => f.name)).toEqual(['Cleave']);
    expect(p.getActionFeats('ranged').map((f) => f.name)).toEqual(['Rapid shot']);
    expect(p.getActionFeats('mounted')).toEqual([]);
  });

  test('and nothing for a character with none of them', () => {
    const p = withFeats(pc(), 'Toughness');
    expect(p.hasAttackActionFeats()).toBe(false);
    expect(p.getActionFeats('melee')).toEqual([]);
  });

  test('an unknown group is empty rather than an error', () => {
    expect(pc().getActionFeats('nonsense')).toEqual([]);
    expect(pc().getActionFeats('')).toEqual([]);
  });
});

describe('what is drawn', () => {
  test('nothing at all when the character has no action feats', () => {
    const { container } = renderWith(<ActionFeatsRow />, withFeats(pc(), 'Toughness'));
    expect(container).toBeEmptyDOMElement();
  });

  test('a melee feat gets a pill under a melee label', () => {
    renderWith(<ActionFeatsRow />, withFeats(pc(), 'Cleave'));
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('melee')).toBeInTheDocument();
    expect(screen.getByText('Cleave')).toBeInTheDocument();
  });

  test('an empty group draws no heading', () => {
    renderWith(<ActionFeatsRow />, withFeats(pc(), 'Cleave'));
    expect(screen.queryByText('ranged')).toBe(null);
    expect(screen.queryByText('mounted')).toBe(null);
  });

  test('feats in three groups get three labelled rows', () => {
    renderWith(<ActionFeatsRow />, withFeats(pc(), 'Cleave', 'Rapid shot', 'Trample'));
    ['melee', 'ranged', 'mounted'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  test('each pill sits under its own group, not another', () => {
    renderWith(<ActionFeatsRow />, withFeats(pc(), 'Cleave', 'Manyshot'));
    const melee = screen.getByText('melee').closest('.action-feats-group');
    const ranged = screen.getByText('ranged').closest('.action-feats-group');
    expect(within(melee).getByText('Cleave')).toBeInTheDocument();
    expect(within(ranged).getByText('Manyshot')).toBeInTheDocument();
    expect(within(melee).queryByText('Manyshot')).toBe(null);
  });

  test('the short description rides along as the hover text', () => {
    renderWith(<ActionFeatsRow />, withFeats(pc(), 'Cleave'));
    expect(screen.getByText('Cleave')).toHaveAttribute(
      'title', 'Extra melee attack when you drop a foe to 0 or below.'
    );
  });

  test('the casting feats stay off the attacks card', () => {
    renderWith(<ActionFeatsRow />, withFeats(pc('Wizard', 9), 'Eschew materials'));
    expect(screen.queryByText('Eschew materials')).toBe(null);
  });
});

describe('on the attacks card itself', () => {
  test('the row appears there', () => {
    renderWith(<CombatPage />, withFeats(pc(), 'Whirlwind attack'));
    expect(screen.getByText('Whirlwind attack')).toBeInTheDocument();
  });

  test('and moves none of the numbers above it', () => {
    /* The whole premise of the item: these feats have nothing to add to a
       derived value, and the pills must not quietly start adding one. */
    const plain = pc();
    const feated = withFeats(pc(), 'Cleave', 'Rapid shot', 'Trample', 'Quick draw');
    expect(feated.getArmorClass()).toBe(plain.getArmorClass());
    expect(feated.getBaseAttackBonus()).toBe(plain.getBaseAttackBonus());
    expect(feated.getTotalFortitudeSave()).toBe(plain.getTotalFortitudeSave());
    expect(feated.getSkillTotal('Jump')).toBe(plain.getSkillTotal('Jump'));
  });
});

describe('the two casting feats, on the spells page', () => {
  test('nothing when the caster has neither', () => {
    const { container } = renderWith(<SpellcastingActionFeats />, pc('Wizard', 9));
    expect(container).toBeEmptyDOMElement();
  });

  test('a pill each when they do', () => {
    renderWith(
      <SpellcastingActionFeats />,
      withFeats(pc('Wizard', 9), 'Improved counterspell', 'Eschew materials')
    );
    expect(screen.getByText('Casting')).toBeInTheDocument();
    expect(screen.getByText('Improved counterspell')).toBeInTheDocument();
    expect(screen.getByText('Eschew materials')).toBeInTheDocument();
  });

  test('and no group labels — with two entries there is nothing to group', () => {
    renderWith(<SpellcastingActionFeats />, withFeats(pc('Wizard', 9), 'Eschew materials'));
    expect(screen.queryByText('melee')).toBe(null);
  });
});

describe('Leadership rides on Diplomacy instead', () => {
  test('it is a note on the skill, not a pill on a card', () => {
    const p = withFeats(pc('Bard', 9), 'Leadership');
    const notes = p.getSituationalContributions('skill:Diplomacy');
    expect(notes.some((n) => n.source === 'feat:Leadership')).toBe(true);
  });

  test('the note is the feat’s own text', () => {
    const p = withFeats(pc('Bard', 9), 'Leadership');
    const note = p.getSituationalContributions('skill:Diplomacy')
      .find((n) => n.source === 'feat:Leadership');
    expect(note.note).toMatch(/cohort and followers/i);
  });

  test('and it moves the Diplomacy total not at all', () => {
    const plain = pc('Bard', 9);
    const led = withFeats(pc('Bard', 9), 'Leadership');
    expect(led.getSkillTotal('Diplomacy')).toBe(plain.getSkillTotal('Diplomacy'));
  });

  test('a character without it gets no note', () => {
    const p = pc('Bard', 9);
    expect(p.getSituationalContributions('skill:Diplomacy')
      .some((n) => n.source === 'feat:Leadership')).toBe(false);
  });
});
