import Familiar from './familiar';

/**
 * A Rat familiar of a level-6 wizard.
 * Master context: level 6, maxHp 30, BAB 3 (wizard ½), base saves Fort 2 / Ref 2 / Will 5.
 * Rat base (animals.json): AC 14/14/12, Str 2(-4), Dex 15(+2), Con 10(0), Wis 12(+1),
 *   init 2, speed 15, Bite +4 melee (1d3-4), baseAttack 0.
 */
function ratOfL6Wizard() {
  const f = new Familiar({ level: 6, maxHp: 30, bab: 3, baseFort: 2, baseRef: 2, baseWill: 5 });
  f.setRef('animals/rat');
  return f;
}

describe('Familiar — derived stats (Rat, level-6 wizard)', () => {
  const f = ratOfL6Wizard();

  test('HP = ⌊master HP ÷ 2⌋ and BAB = master BAB', () => {
    expect(f.getDefaultMaxLife()).toBe(15);
    expect(f.getMaxLife()).toBe(15);
    expect(f.getCurrentHp()).toBe(15);
    expect(f.getBaseAttackBonus()).toBe(3);
  });

  test('advancement at master level 6: Int 8, natural armor +3, Speak with Master', () => {
    expect(f.getInt()).toBe(8);
    expect(f.getNaturalArmorAdj()).toBe(3);
    expect(f.getSpecialAbilities()).toEqual(expect.arrayContaining(['Alertness', 'Improved Evasion', 'Share Spells', 'Empathic Link', 'Deliver Touch Spells', 'Speak with Master']));
    expect(f.getSpecialAbilities()).not.toContain('Spell Resistance');
  });

  test('AC = base + natural armor adj (touch unchanged)', () => {
    expect(f.getArmorClass()).toBe(17); // 14 + 3
    expect(f.getContactAC()).toBe(14); // unchanged
    expect(f.getFlatFootedAC()).toBe(15); // 12 + 3
  });

  test('saves = max(master base, fixed familiar base 2/2/0) + familiar ability mod', () => {
    expect(f.getFortSave()).toBe(2); // max(2,2) + Con 0
    expect(f.getReflexSave()).toBe(4); // max(2,2) + Dex 2
    expect(f.getWillSave()).toBe(6); // max(5,0) + Wis 1 — master's good Will wins
  });

  test('attack bonus uses master BAB; damage stays the base creature value', () => {
    const atks = f.getAttacks();
    expect(atks).toHaveLength(1);
    // Rat Bite +4 (BAB0 + Dex2 + Tiny size2); swap BAB 0→3 ⇒ +7. Damage unchanged.
    expect(atks[0]).toMatchObject({ name: 'Bite', bonus: 7, damage: '1d3-4', type: 'primary' });
  });

  test('initiative and speed come straight from the base creature', () => {
    expect(f.getInitiative()).toBe(2);
    expect(f.getSpeed()).toBe(15);
  });
});

describe('Familiar — HP default scales with the master', () => {
  test('an odd master HP rounds the half down', () => {
    const f = new Familiar({ level: 1, maxHp: 7, bab: 0, baseFort: 0, baseRef: 0, baseWill: 2 });
    f.setRef('animals/toad');
    expect(f.getDefaultMaxLife()).toBe(3); // ⌊7/2⌋
  });
});

describe('Familiar — editable overlays', () => {
  test('a stat bonus adds on top of the computed base', () => {
    const f = ratOfL6Wizard();
    expect(f.getArmorClass()).toBe(17);
    f.setStatBonus('acBonus', 2);
    expect(f.getArmorClass()).toBe(19);
  });

  test('max-life override replaces the computed default; clearing restores it', () => {
    const f = ratOfL6Wizard();
    f.setMaxLife(40);
    expect(f.getMaxLife()).toBe(40);
    f.setMaxLife(null);
    expect(f.getMaxLife()).toBe(15);
  });

  test('an attack override replaces only that line', () => {
    const f = ratOfL6Wizard();
    f.setAttackOverride(0, { bonus: 12, damage: '1d6' });
    const atk = f.getAttacks()[0];
    expect(atk.bonus).toBe(12);
    expect(atk.damage).toBe('1d6');
  });
});

describe('Familiar — type and species bonus', () => {
  test('is treated as a magical beast and exposes its species bonus', () => {
    const f = ratOfL6Wizard();
    expect(f.getType()).toBe('Magical Beast');
    expect(f.getSpeciesBonus()).toMatchObject({ kind: 'save', target: 'fort', value: 2 });
  });
});

describe('Familiar — persistence round-trip', () => {
  test('serialize() then load() restores every persisted field', () => {
    const owner = { level: 6, maxHp: 30, bab: 3, baseFort: 2, baseRef: 2, baseWill: 5 };
    const f = new Familiar(owner);
    f.setRef('animals/rat').setName('Squeak').setDamage(4).setMaxLife(20);
    f.setStatBonus('acBonus', 1);
    f.setStatBonus('willBonus', 2);
    f.setAttackOverride(0, { bonus: 9, damage: '1d4+1' });

    const data = f.serialize();
    const loaded = new Familiar();
    loaded.load(data, owner);

    expect(loaded.serialize()).toEqual(data);
    expect(loaded.getName()).toBe('Squeak');
    expect(loaded.getDamage()).toBe(4);
    expect(loaded.getMaxLife()).toBe(20);
    expect(loaded.acBonus).toBe(1);
    expect(loaded.willBonus).toBe(2);
    expect(loaded.getAttacks()[0]).toMatchObject({ bonus: 9, damage: '1d4+1' });
    // Derived getters work after a load (owner supplied).
    expect(loaded.getBaseAttackBonus()).toBe(3);
  });
});
