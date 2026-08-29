import Player from './player';

/* Arcane spell failure was computed nowhere: classes.json carried both flags
 * and no source file read either, so a wizard in a chain shirt was told
 * nothing. The rules that matter are in equipment.md — armor and shield add,
 * proficiency does not help, divine casters are untouched, and a bard in light
 * armor is exempt but still pays for a shield.
 */

function make(cls, level = 5) {
  const p = new Player();
  p.name = 'Test';
  p.race = 'Human';
  p.class = cls;
  p.level = level;
  return p;
}

const CHAIN_SHIRT = 'items/Armor/chain-shirt';   // light, 20%
const PADDED = 'items/Armor/padded';             // light, 5%
const HEAVY_STEEL = 'items/Shield/shield-heavy-steel';

describe('who it applies to', () => {
  test('an unarmored arcane caster has none', () => {
    expect(make('Wizard').getArcaneSpellFailure()).toBe(0);
    expect(make('Sorcerer').getArcaneSpellFailure()).toBe(0);
  });

  test('a divine caster in the same armor has none', () => {
    const cleric = make('Cleric');
    cleric.equipItem('armor', { link: CHAIN_SHIRT });
    expect(cleric.getArcaneSpellFailure()).toBe(0);

    const druid = make('Druid');
    druid.equipItem('armor', { link: CHAIN_SHIRT });
    expect(druid.getArcaneSpellFailure()).toBe(0);
  });

  test('a non-caster has none', () => {
    const fighter = make('Fighter');
    fighter.equipItem('armor', { link: CHAIN_SHIRT });
    expect(fighter.getArcaneSpellFailure()).toBe(0);
  });
});

describe('what it costs', () => {
  test("a wizard pays the armor's own percentage", () => {
    const wizard = make('Wizard');
    wizard.equipItem('armor', { link: CHAIN_SHIRT });
    expect(wizard.getArcaneSpellFailure()).toBe(20);
  });

  test('armor and shield add together', () => {
    const wizard = make('Wizard');
    wizard.equipItem('armor', { link: CHAIN_SHIRT });
    wizard.equipItem('lh1', { link: HEAVY_STEEL });
    const shieldOnly = make('Wizard');
    shieldOnly.equipItem('lh1', { link: HEAVY_STEEL });
    expect(shieldOnly.getArcaneSpellFailure()).toBeGreaterThan(0);
    expect(wizard.getArcaneSpellFailure()).toBe(20 + shieldOnly.getArcaneSpellFailure());
  });
});

describe('the bard exemption', () => {
  test('light armor costs a bard nothing, though it costs a wizard 20%', () => {
    const bard = make('Bard');
    bard.equipItem('armor', { link: CHAIN_SHIRT });
    expect(bard.getArcaneSpellFailure()).toBe(0);

    const wizard = make('Wizard');
    wizard.equipItem('armor', { link: CHAIN_SHIRT });
    expect(wizard.getArcaneSpellFailure()).toBe(20);
  });

  test('padded armor is light too, so it is also free', () => {
    const bard = make('Bard');
    bard.equipItem('armor', { link: PADDED });
    expect(bard.getArcaneSpellFailure()).toBe(0);
  });

  test('a shield is charged to the bard at the normal rate', () => {
    const bard = make('Bard');
    bard.equipItem('armor', { link: CHAIN_SHIRT });
    bard.equipItem('lh1', { link: HEAVY_STEEL });
    const shieldOnly = make('Wizard');
    shieldOnly.equipItem('lh1', { link: HEAVY_STEEL });
    // The light armor is forgiven; the shield is not.
    expect(bard.getArcaneSpellFailure()).toBe(shieldOnly.getArcaneSpellFailure());
    expect(bard.getArcaneSpellFailure()).toBeGreaterThan(0);
  });
});
