import Player from './player';
import resolveLabel from '../i18n/resolveLabel';
import { makeSharedEffect, resolveSharedEffect } from './sharedEffects';

/**
 * A bard's music, landing on somebody else's sheet.
 *
 * The point of the feature is that the receiving character's numbers actually
 * move, so every test here reads a number off the sheet rather than reading
 * the table back. What must *not* move matters as much: inspire courage's save
 * bonus exists only against charm and fear, and a sheet cannot know what it is
 * saving against.
 *
 * Rules: dnd-rules/class-features.md (bardic music).
 */

function pc() {
  const p = new Player();
  p.name = 'Kaleb';
  p.setRace('Human');
  p.setClass('Fighter');
  p.setLevel(5);
  return p;
}

const give = (p, id, opts) => p.addSharedEffect(makeSharedEffect(id, opts));

describe('inspire courage', () => {
  test('moves attack and weapon damage by the size the bard gave it', () => {
    const p = pc();
    const attack = p.getPunchAttackBonus();
    give(p, 'inspireCourage', { bonus: 2, from: 'Lyra' });
    expect(p.getPunchAttackBonus()).toBe(attack + 2);
    expect(p.getSharedEffectBonus('damage')).toBe(2);
  });

  test('leaves the saving throws alone, and says why beside them', () => {
    const p = pc();
    const will = p.getTotalWillSave();
    give(p, 'inspireCourage', { bonus: 2 });
    expect(p.getTotalWillSave()).toBe(will);
    const notes = p.getSituationalContributions('will').map((n) => resolveLabel(n.note));
    expect(notes).toContain('+2 morale against charm and fear');
  });

  test('the bonus rides in the breakdown as a morale bonus', () => {
    const p = pc();
    give(p, 'inspireCourage', { bonus: 3 });
    const row = p.getWeaponAttackContributions({ Name: 'Longsword', 'Dmg (M)': '1d8' })
      .find((c) => c.source.startsWith('shared:'));
    expect(row).toMatchObject({ value: 3, type: 'morale' });
    expect(resolveLabel(row.label)).toBe('Inspire courage');
  });
});

describe('inspire competence', () => {
  test('raises the one skill it was pointed at, and no other', () => {
    const p = pc();
    const climb = p.getSkillTotal('Climb');
    const jump = p.getSkillTotal('Jump');
    give(p, 'inspireCompetence', { skill: 'Climb' });
    expect(p.getSkillTotal('Climb')).toBe(climb + 2);
    expect(p.getSkillTotal('Jump')).toBe(jump);
  });

  test('pointed at nothing it does nothing', () => {
    const p = pc();
    give(p, 'inspireCompetence', {});
    expect(p.getSkillTotal('Climb')).toBe(pc().getSkillTotal('Climb'));
  });
});

describe('inspire greatness', () => {
  test('+2 competence to attack and +1 morale on Fortitude only', () => {
    const p = pc();
    const attack = p.getPunchAttackBonus();
    const fort = p.getTotalFortitudeSave();
    const will = p.getTotalWillSave();
    give(p, 'inspireGreatness', {});
    expect(p.getPunchAttackBonus()).toBe(attack + 2);
    expect(p.getTotalFortitudeSave()).toBe(fort + 1);
    expect(p.getTotalWillSave()).toBe(will);
  });

  test('the bonus Hit Dice are said rather than added', () => {
    const p = pc();
    const hp = p.getMaxLife();
    give(p, 'inspireGreatness', {});
    expect(p.getMaxLife()).toBe(hp);
    const notes = p.getSituationalContributions('maxHp').map((n) => resolveLabel(n.note));
    expect(notes.join(' ')).toMatch(/temporary hit points/);
  });
});

describe('inspire heroism', () => {
  test('+4 morale on every save', () => {
    const p = pc();
    const before = [p.getTotalFortitudeSave(), p.getTotalReflexSave(), p.getTotalWillSave()];
    give(p, 'inspireHeroism', {});
    expect([p.getTotalFortitudeSave(), p.getTotalReflexSave(), p.getTotalWillSave()])
      .toEqual(before.map((n) => n + 4));
  });

  test('+4 dodge reaches AC and touch AC, and stops at flat-footed', () => {
    const p = pc();
    const ac = p.getArmorClass();
    const touch = p.getContactAC();
    const flat = p.getFlatFootedAC();
    give(p, 'inspireHeroism', {});
    expect(p.getArmorClass()).toBe(ac + 4);
    expect(p.getContactAC()).toBe(touch + 4);
    /* A dodge bonus is lost with Dexterity (combat.md). */
    expect(p.getFlatFootedAC()).toBe(flat);
  });
});

describe('the entries themselves', () => {
  test('survive being saved and loaded', () => {
    const p = pc();
    give(p, 'inspireCourage', { bonus: 2, from: 'Lyra' });
    give(p, 'inspireCompetence', { skill: 'Climb', from: 'Lyra' });
    const back = new Player().load(JSON.parse(JSON.stringify(p.serialize())));
    expect(back.getSharedEffects()).toEqual([
      { id: 'inspireCourage', bonus: 2, from: 'Lyra' },
      { id: 'inspireCompetence', skill: 'Climb', from: 'Lyra' },
    ]);
    expect(back.getPunchAttackBonus()).toBe(p.getPunchAttackBonus());
  });

  test('an id this build does not know is refused rather than half-applied', () => {
    const p = pc();
    expect(p.addSharedEffect({ id: 'inspireSomethingNew' })).toBe(false);
    expect(resolveSharedEffect({ id: 'inspireSomethingNew' })).toBeNull();
    expect(p.getResolvedSharedEffects()).toEqual([]);
  });

  test('one can be taken off again', () => {
    const p = pc();
    give(p, 'inspireCourage', { bonus: 1 });
    const attack = p.getPunchAttackBonus();
    p.removeSharedEffect(0);
    expect(p.getPunchAttackBonus()).toBe(attack - 1);
    expect(p.hasSharedEffects()).toBe(false);
  });

  test('a night ends them', () => {
    const p = pc();
    give(p, 'inspireHeroism', {});
    p.clearSharedEffectsOnRest();
    expect(p.getSharedEffects()).toEqual([]);
  });
});

describe('two bards singing the same song', () => {
  test('both are counted, and the sheet says the sum is suspect', () => {
    const p = pc();
    give(p, 'inspireCourage', { bonus: 2, from: 'Lyra' });
    give(p, 'inspireCourage', { bonus: 3, from: 'Fenn' });
    /* Computed, never enforced: 3.5 says only the larger morale bonus
       applies, and the sheet adds both and flags it. */
    expect(p.getSharedEffectBonus('attack')).toBe(5);
    const warning = p.getBuffStackingWarnings().find((w) => w.stat === 'attack');
    expect(warning).toMatchObject({ type: 'morale' });
    expect(warning.labels).toHaveLength(2);
  });

  test('two different songs do not, when their bonus types differ', () => {
    const p = pc();
    give(p, 'inspireCourage', { bonus: 2 });
    give(p, 'inspireGreatness', {});
    expect(p.getBuffStackingWarnings().find((w) => w.stat === 'attack')).toBeUndefined();
  });
});
