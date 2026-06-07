import AnimalCompanion from './animalCompanion';

/** A Wolf companion belonging to a level-9 druid. */
function wolfOfL9Druid() {
  const c = new AnimalCompanion({ class: 'Druid', level: 9 });
  c.setRef('animals/wolf');
  return c;
}

describe('AnimalCompanion — derived stats (Wolf, level-9 druid)', () => {
  const c = wolfOfL9Druid();

  test('effective level and advancement', () => {
    expect(c.getEffectiveLevel()).toBe(9);
    expect(c.getBonusHD()).toBe(6);
    expect(c.getBonusTricks()).toBe(4);
    expect(c.getSpecialAbilities()).toEqual(expect.arrayContaining(['Multiattack']));
  });

  test('total HD = base HD + 6 and BAB = floor(totalHD × 3/4)', () => {
    expect(c.getTotalHD()).toBe(c.getBaseHD() + 6);
    expect(c.getTotalHD()).toBe(8);
    expect(c.getBaseAttackBonus()).toBe(Math.floor((c.getTotalHD() * 3) / 4));
    expect(c.getBaseAttackBonus()).toBe(6);
  });

  test('ability adjustment (+3) raises Str and Dex mods', () => {
    expect(c.getStrMod()).toBe(3); // (13+3)=16
    expect(c.getDexMod()).toBe(4); // (15+3)=18
    expect(c.getConMod()).toBe(2);
  });

  test('AC reflects +6 natural armor and the +3 Str/Dex (Dex) adjustment', () => {
    expect(c.getArmorClass()).toBe(22); // 14 + 6 natural + 2 dex delta
    expect(c.getContactAC()).toBe(14); // 12 + 2 dex delta
    expect(c.getFlatFootedAC()).toBe(18); // 12 + 6 natural
  });

  test('Fort/Ref use the good-save progression on total HD; Will stays base', () => {
    const good = 2 + Math.floor(8 / 2); // 6
    expect(c.getFortSave()).toBe(good + 2); // + Con mod
    expect(c.getReflexSave()).toBe(good + 4); // + Dex mod
    expect(c.getWillSave()).toBe(1); // base wolf Will, unimproved
  });

  test('attacks recompute from advanced BAB/Str', () => {
    const atks = c.getAttacks();
    expect(atks).toHaveLength(1);
    expect(atks[0]).toMatchObject({ name: 'Bite', bonus: 10, damage: '1d6+3', type: 'primary' });
  });

  test('default max HP = base hp + bonusHD × (avg d8 + Con mod)', () => {
    // 13 + floor(6*4.5)=27 + 6*2=12 = 52
    expect(c.getDefaultMaxLife()).toBe(52);
    expect(c.getMaxLife()).toBe(52);
    expect(c.getCurrentHp()).toBe(52);
  });
});

describe('AnimalCompanion — alternative-list level adjustment', () => {
  test('a leopard (−3) of a level-7 druid advances as effective level 4', () => {
    const c = new AnimalCompanion({ class: 'Druid', level: 7 });
    c.setRef('animals/leopard');
    expect(c.getCharacterEffectiveLevel()).toBe(7);
    expect(c.getAdjustment()).toBe(-3);
    expect(c.getEffectiveLevel()).toBe(4); // 7 − 3
    const adv = c.getAdvancement();
    expect(adv.bonusHD).toBe(2);
    expect(adv.naturalArmorAdj).toBe(2);
    expect(adv.abilityAdj).toBe(1);
    expect(adv.bonusTricks).toBe(2);
    expect(adv.specials).toContain('Evasion');
    expect(adv.specials).not.toContain('Devotion');
  });

  test('a standard-list creature (wolf, adj 0) advances at the full effective level', () => {
    const c = new AnimalCompanion({ class: 'Druid', level: 7 });
    c.setRef('animals/wolf');
    expect(c.getAdjustment()).toBe(0);
    expect(c.getEffectiveLevel()).toBe(7);
  });
});

describe('AnimalCompanion — editable overlays', () => {
  test('a stat bonus adds on top of the computed base', () => {
    const c = wolfOfL9Druid();
    const baseAc = c.getArmorClass();
    c.setStatBonus('acBonus', 2);
    expect(c.getArmorClass()).toBe(baseAc + 2);
  });

  test('max-life override replaces the computed default; clearing restores it', () => {
    const c = wolfOfL9Druid();
    c.setMaxLife(80);
    expect(c.getMaxLife()).toBe(80);
    c.setMaxLife(null);
    expect(c.getMaxLife()).toBe(c.getDefaultMaxLife());
  });

  test('an attack override replaces only that line bonus/damage', () => {
    const c = wolfOfL9Druid();
    c.setAttackOverride(0, { bonus: 15, damage: '2d6+9' });
    const atk = c.getAttacks()[0];
    expect(atk.bonus).toBe(15);
    expect(atk.damage).toBe('2d6+9');
    // Overriding only the bonus leaves the computed damage intact.
    const c2 = wolfOfL9Druid();
    c2.setAttackOverride(0, { bonus: 99 });
    expect(c2.getAttacks()[0].bonus).toBe(99);
    expect(c2.getAttacks()[0].damage).toBe('1d6+3');
  });
});

describe('AnimalCompanion — persistence round-trip', () => {
  test('serialize() then load() restores every persisted field', () => {
    const owner = { class: 'Druid', level: 9 };
    const c = new AnimalCompanion(owner);
    c.setRef('animals/wolf');
    c.setName('Rex');
    c.setDamage(7);
    c.setMaxLife(60);
    c.setStatBonus('acBonus', 2);
    c.setStatBonus('initBonus', 1);
    c.setStatBonus('willBonus', 3);
    c.setAttackOverride(0, { bonus: 12, damage: '1d8+5' });

    const data = c.serialize();
    const loaded = new AnimalCompanion();
    loaded.load(data, owner);

    expect(loaded.serialize()).toEqual(data);
    expect(loaded.ref).toBe('animals/wolf');
    expect(loaded.getName()).toBe('Rex');
    expect(loaded.getDamage()).toBe(7);
    expect(loaded.getMaxLife()).toBe(60);
    expect(loaded.acBonus).toBe(2);
    expect(loaded.willBonus).toBe(3);
    expect(loaded.getAttacks()[0]).toMatchObject({ bonus: 12, damage: '1d8+5' });
    // Derived getters work after a load (owner was supplied).
    expect(loaded.getTotalHD()).toBe(8);
  });

  test('a freshly-loaded empty companion has stable defaults', () => {
    const c = new AnimalCompanion();
    c.load({ ref: 'animals/wolf' }, { class: 'Druid', level: 1 });
    expect(c.maxLife).toBeNull();
    expect(c.getEffectiveLevel()).toBe(1);
    expect(c.getBonusHD()).toBe(0);
  });
});
