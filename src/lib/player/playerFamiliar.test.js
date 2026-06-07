import Player from './player';
import Familiar from './familiar';
import { getDefaultApp } from '../appState';

/** A level-6 wizard with a familiar of the given species ref (or none). */
function wizardWith(ref) {
  const p = new Player();
  p.setClass('Wizard');
  p.setLevel(6);
  p.setMaxLife(20);
  if (ref) {
    p.familiar = new Familiar();
    p.familiar.setRef(ref);
  }
  return p;
}

describe('Player ↔ Familiar integration', () => {
  test('a player with no familiar serializes familiar: null', () => {
    expect(new Player().serialize().familiar).toBeNull();
    expect(new Player().getFamiliar()).toBeNull();
  });

  test('a player with a familiar serializes a nested object and rehydrates it', () => {
    const p = wizardWith('animals/rat');
    const data = p.serialize();
    expect(data.familiar).toMatchObject({ ref: 'animals/rat' });

    const reloaded = new Player().load(data);
    const fam = reloaded.getFamiliar();
    expect(fam).toBeInstanceOf(Familiar);
    // Derived getters resolve from the master context.
    expect(fam.getBaseAttackBonus()).toBe(3); // wizard L6 BAB
    expect(fam.getMaxLife()).toBe(Math.floor(reloaded.getMaxLife() / 2));
  });
});

describe('Player base-save accessors', () => {
  test('return the class progression base WITHOUT the ability modifier', () => {
    const p = new Player();
    p.setClass('Wizard');
    p.setLevel(6);
    p.setAbilityBase('con', 14); // +2
    expect(p.getBaseFortitudeSave()).toBe(2); // wizard poor Fort, no ability mod
    expect(p.getBaseReflexSave()).toBe(2);
    expect(p.getBaseWillSave()).toBe(5); // wizard good Will
    expect(p.getFortitudeSave()).toBe(4); // base 2 + Con +2
  });
});

describe('Familiar per-species bonus auto-applies to the master', () => {
  test('Toad adds +3 max HP', () => {
    const base = wizardWith(null).getMaxLife();
    expect(wizardWith('animals/toad').getMaxLife()).toBe(base + 3);
  });

  test('Weasel adds +2 Reflex', () => {
    const base = wizardWith(null).getTotalReflexSave();
    expect(wizardWith('animals/weasel').getTotalReflexSave()).toBe(base + 2);
  });

  test('Rat adds +2 Fortitude', () => {
    const base = wizardWith(null).getTotalFortitudeSave();
    expect(wizardWith('animals/rat').getTotalFortitudeSave()).toBe(base + 2);
  });

  test('Cat adds +3 Move Silently', () => {
    const base = wizardWith(null).getSkillTotal('Move Silently');
    expect(wizardWith('animals/cat').getSkillTotal('Move Silently')).toBe(base + 3);
  });

  test('Hawk Spot bonus is conditional and NOT auto-added to the flat total', () => {
    const base = wizardWith(null).getSkillTotal('Spot');
    expect(wizardWith('animals/hawk').getSkillTotal('Spot')).toBe(base);
  });

  test('the bonus is gated on the class granting a familiar', () => {
    const p = new Player();
    p.setClass('Fighter');
    p.setLevel(6);
    p.setMaxLife(20);
    p.familiar = new Familiar();
    p.familiar.setRef('animals/toad');
    // Fighter doesn't grant a familiar → no auto-applied HP bonus.
    expect(p.getFamiliarStatBonuses().hp).toBe(0);
  });
});

describe('CURRENT_VERSION bump', () => {
  test('default app version is strictly greater than the previous (260607)', () => {
    expect(getDefaultApp().v).toBeGreaterThan(260607);
  });
});
