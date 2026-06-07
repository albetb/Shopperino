import Player from './player';
import AnimalCompanion from './animalCompanion';

describe('Player ↔ AnimalCompanion integration', () => {
  test('a player with no companion serializes companion: null', () => {
    const p = new Player();
    expect(p.serialize().companion).toBeNull();
    expect(p.getCompanion()).toBeNull();
  });

  test('a player with a companion serializes a nested object and rehydrates it', () => {
    const p = new Player();
    p.setClass('Druid');
    p.setLevel(9);
    p.companion = new AnimalCompanion({ class: 'Druid', level: 9 }).setRef('animals/wolf').setName('Rex');

    const data = p.serialize();
    expect(data.companion).toMatchObject({ ref: 'animals/wolf', name: 'Rex' });

    const reloaded = new Player().load(data);
    const comp = reloaded.getCompanion();
    expect(comp).toBeInstanceOf(AnimalCompanion);
    // Derived getters resolve using the player's class/level.
    expect(comp.getEffectiveLevel()).toBe(9);
    expect(comp.getTotalHD()).toBe(8);
    expect(comp.getArmorClass()).toBe(22);
  });

  test('companion effective level tracks the player level after a level-up', () => {
    const p = new Player();
    p.setClass('Druid');
    p.setLevel(3);
    p.companion = new AnimalCompanion().setRef('animals/wolf');
    p.companion.setOwner({ class: p.class, level: p.level });
    expect(p.getCompanion().getEffectiveLevel()).toBe(3);
    p.setLevel(12);
    // getCompanion() re-syncs the owner, so derived level follows.
    expect(p.getCompanion().getEffectiveLevel()).toBe(12);
  });
});
