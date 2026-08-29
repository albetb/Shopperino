import Player from './player';
import { sumContributions } from './contributions';

/* Magic items on the character: what they move, and what stops them.
 *
 * The invariant this file protects is the one the whole breakdown box rests
 * on — every `get...Contributions()` list must sum to the number the sheet
 * displays. An item that raises a total without adding a row (or the reverse)
 * is a bug the info box would report as a mismatch, so it is asserted here for
 * every stat an item can touch.
 *
 * The second thing under test is the gating. A robe of the archmagi on a
 * cleric and a belt of dwarvenkind on a dwarf both do nothing, and "nothing"
 * has to mean nothing in the totals while still being visible on the page.
 */

function pc(cls = 'Fighter', level = 6, race = 'Human') {
  const p = new Player();
  p.name = 'Test';
  p.setRace(race);
  p.setClass(cls);
  p.setLevel(level);
  p.maxLife = 40;
  return p;
}

/** Put an item in one of the four accessory slots. */
const wear = (p, link, name, slot = 'other1', overrides = null) => {
  p.equipItem(slot, { name, link, ...(overrides ? { overrides } : {}) });
  return p;
};

describe('nothing worn changes nothing', () => {
  test('a bare character reports no worn effects', () => {
    const p = pc();
    expect(p.getWornEffects()).toEqual([]);
    expect(p.hasWornEffects()).toBe(false);
    expect(p.getWornBonus('ac')).toBe(0);
    expect(p.getWornContributions('ac')).toEqual([]);
  });

  test('an item with no effect is worn and reports nothing', () => {
    // 400 of the 538 items in these categories do nothing the sheet can show.
    const p = wear(pc(), 'bag-of-holding-1', 'Bag of holding (type I)');
    expect(p.getWornEffects()).toEqual([]);
  });

  test('an item in the second hand set is stowed, not wielded', () => {
    /* A staff of power in the swap set gives nothing until the character
       switches to it — which is what the held-items card already shows by
       dimming that set. */
    const stowed = wear(pc(), 'staff-of-power', 'Staff of Power', 'rh2');
    expect(stowed.getWornBonus('will')).toBe(0);
    const held = wear(pc(), 'staff-of-power', 'Staff of Power', 'rh1');
    expect(held.getWornBonus('will')).toBe(2);
  });
});

describe('the breakdown sums to the number, for every stat', () => {
  test('armor class, all three of them', () => {
    const p = pc();
    wear(p, 'bracers-of-armor-4', 'Bracers of armor +4', 'other1');
    wear(p, 'ring-of-protection-2', 'Ring of Protection +2', 'other2');

    expect(sumContributions(p.getArmorClassContributions())).toBe(p.getArmorClass());
    expect(sumContributions(p.getTouchAcContributions())).toBe(p.getContactAC());
    expect(sumContributions(p.getFlatFootedAcContributions())).toBe(p.getFlatFootedAC());
  });

  test('the armor bonus is denied to touch AC and the deflection bonus is not', () => {
    const bare = pc();
    const baseTouch = bare.getContactAC();
    const baseAc = bare.getArmorClass();

    const p = pc();
    wear(p, 'bracers-of-armor-4', 'Bracers of armor +4', 'other1');
    wear(p, 'ring-of-protection-2', 'Ring of Protection +2', 'other2');
    // Both reach normal AC; only the ring reaches touch.
    expect(p.getArmorClass()).toBe(baseAc + 6);
    expect(p.getContactAC()).toBe(baseTouch + 2);
  });

  test('the three saving throws', () => {
    const p = wear(pc(), 'cloak-of-resistance-3', 'Cloak of resistance +3');
    expect(sumContributions(p.getSaveContributions('fortitude'))).toBe(p.getTotalFortitudeSave());
    expect(sumContributions(p.getSaveContributions('reflex'))).toBe(p.getTotalReflexSave());
    expect(sumContributions(p.getSaveContributions('will'))).toBe(p.getTotalWillSave());
  });

  test('an ability score, and the modifier that follows it', () => {
    const p = pc();
    p.setAbilityBase('str', 14);
    const before = p.getStrMod();
    wear(p, 'belt-of-giant-strength-4', 'Belt of giant Strength +4');
    expect(sumContributions(p.getAbilityContributions('str'))).toBe(p.getAbilityTotal('str'));
    expect(p.getAbilityTotal('str')).toBe(18);
    expect(p.getStrMod()).toBe(before + 2);
  });

  test('speed', () => {
    const p = wear(pc(), 'boots-of-striding-and-springing', 'Boots of striding and springing');
    expect(sumContributions(p.getSpeedContributions())).toBe(p.getTotalSpeed());
    expect(p.getTotalSpeed()).toBe(40);
  });

  test('initiative — a stat key no potion ever needed', () => {
    const p = wear(pc(), 'rod-of-alertness', 'Rod of Alertness', 'rh1');
    expect(sumContributions(p.getInitiativeContributions())).toBe(p.getTotalInitiative());
    expect(p.getWornBonus('initiative')).toBe(1);
  });

  test('a named skill', () => {
    const p = wear(pc(), 'boots-of-elvenkind', 'Boots of elvenkind');
    expect(sumContributions(p.getSkillContributions('Move silently')))
      .toBe(p.getSkillTotal('Move silently'));
    expect(p.getWornBonus('skill:Move silently')).toBe(5);
  });

  test('two skills from one item, and no third', () => {
    const p = wear(pc(), 'vest-of-escape', 'Vest of escape');
    expect(p.getWornBonus('skill:Open lock')).toBe(4);
    expect(p.getWornBonus('skill:Escape artist')).toBe(6);
    expect(p.getWornBonus('skill:Hide')).toBe(0);
  });
});

describe('the two skill shapes an item can want', () => {
  test('"every skill" reaches a skill the item never names', () => {
    const p = wear(pc(), 'stone-of-good-luck', 'Stone of good luck (luckstone)');
    expect(p.getWornBonus('skill:Hide')).toBe(1);
    expect(p.getWornBonus('skill:Appraise')).toBe(1);
    expect(p.getWornBonus('fortitude')).toBe(1);
  });

  test('"every Charisma-based skill" reaches only the Charisma ones', () => {
    /* The shape between `skill:<Name>` and `skillsAll`, wanted by exactly two
       items and by nothing in the potion table. */
    const p = wear(pc(), 'circlet-of-persuasion', 'Circlet of persuasion');
    expect(p.getWornBonus('skill:Diplomacy')).toBe(3); // Cha
    expect(p.getWornBonus('skill:Bluff')).toBe(3);     // Cha
    expect(p.getWornBonus('skill:Hide')).toBe(0);      // Dex
    expect(p.getWornBonus('skill:Search')).toBe(0);    // Int
  });

  test('a specialised Knowledge falls back to the Knowledge row for its ability', () => {
    expect(pc().getSkillAbility('Knowledge (arcana)')).toBe('int');
    expect(pc().getSkillAbility('Hide')).toBe('dex');
    expect(pc().getSkillAbility('Speak language')).toBe('');
  });
});

describe('the gates', () => {
  test('a robe of the archmagi does nothing for a cleric, and says so', () => {
    const cleric = wear(pc('Cleric', 10), 'robe-of-the-archmagi', 'Robe of the archmagi');
    const [effect] = cleric.getWornEffects();
    expect(effect.inert).toBe(true);
    expect(cleric.getWornBonus('ac')).toBe(0);
    expect(cleric.getSpellResistance()).toBe(0);
    // Still on the page, still explained.
    expect(cleric.getSituationalContributions('ac').some((r) => /Does nothing for you/.test(r.note)))
      .toBe(true);
  });

  test('the same robe works for a wizard', () => {
    const wizard = wear(pc('Wizard', 10), 'robe-of-the-archmagi', 'Robe of the archmagi');
    expect(wizard.getWornEffects()[0].inert).toBe(false);
    expect(wizard.getWornBonus('ac')).toBe(5);
    expect(wizard.getWornBonus('will')).toBe(4);
    expect(wizard.getSpellResistance()).toBe(18);
  });

  test('a belt of dwarvenkind gives a dwarf no Constitution', () => {
    const dwarf = wear(pc('Fighter', 6, 'Dwarf'), 'belt-of-dwarvenkind', 'Belt of dwarvenkind');
    expect(dwarf.getWornBonus('con')).toBe(0);
    const human = wear(pc('Fighter', 6, 'Human'), 'belt-of-dwarvenkind', 'Belt of dwarvenkind');
    expect(human.getWornBonus('con')).toBe(2);
  });
});

describe('stacking, reported and never enforced', () => {
  test('two rings of protection are both counted, and flagged', () => {
    const p = pc();
    wear(p, 'ring-of-protection-2', 'Ring of Protection +2', 'other1');
    wear(p, 'ring-of-protection-3', 'Ring of Protection +3', 'other2');
    // In 3.5 only the +3 would apply. The sheet adds both and says so.
    expect(p.getWornBonus('ac')).toBe(5);
    const warnings = p.getWornStackingWarnings();
    expect(warnings.some((w) => w.stat === 'ac' && w.type === 'deflection')).toBe(true);
  });

  test('two different bonus types are not flagged', () => {
    const p = pc();
    wear(p, 'bracers-of-armor-2', 'Bracers of armor +2', 'other1');
    wear(p, 'ring-of-protection-2', 'Ring of Protection +2', 'other2');
    expect(p.getWornStackingWarnings()).toEqual([]);
  });

  test('untyped bonuses always stack and are never flagged', () => {
    const p = pc();
    wear(p, 'lens-of-detection', 'Lens of detection', 'other1');
    expect(p.getWornStackingWarnings()).toEqual([]);
  });
});

describe('the numbers the sheet showed but nothing fed', () => {
  test('spell resistance takes the highest, never the sum', () => {
    const monk = pc('Monk', 20);          // Diamond Soul: 10 + level = 30
    expect(monk.getSpellResistance()).toBe(30);
    wear(monk, 'mantle-of-spell-resistance', 'Mantle of spell resistance');
    expect(monk.getSpellResistance()).toBe(30); // not 51
    const fighter = wear(pc(), 'mantle-of-spell-resistance', 'Mantle of spell resistance');
    expect(fighter.getSpellResistance()).toBe(21);
  });

  test('damage reduction from an item joins the list rather than merging', () => {
    const p = wear(pc('Barbarian', 10), 'mantle-of-faith', 'Mantle of faith');
    const rows = p.getDamageReductions();
    expect(rows.some((r) => r.bypass === 'evil' && r.amount === 5)).toBe(true);
    // The barbarian's own DR is still its own row: they do not stack.
    expect(rows.length).toBeGreaterThan(1);
  });

  test('adamantine armor carries DR from its material', () => {
    const p = pc();
    p.equipItem('armor', { name: 'Adamantine breastplate', link: 'adamantine-breastplate' });
    expect(p.getDamageReductions().some((r) => r.amount === 2 && r.bypass === '—')).toBe(true);
  });

  test('caster level rises, and stays zero for a non-caster', () => {
    const wizard = wear(pc('Wizard', 9), 'ioun-stones-orange', 'Ioun stone, orange');
    expect(wizard.getCasterLevel()).toBe(10);
    const fighter = wear(pc('Fighter', 9), 'ioun-stones-orange', 'Ioun stone, orange');
    expect(fighter.getCasterLevel()).toBe(0);
  });

  test('the phylactery raises the turning level by four', () => {
    const bare = pc('Cleric', 8);
    const worn = wear(pc('Cleric', 8), 'phylactery-of-undead-turning', 'Phylactery of undead turning');
    expect(worn.getTurnUndeadEffectiveLevel()).toBe(bare.getTurnUndeadEffectiveLevel() + 4);
  });

  test("the druid's vestment adds a wild shape use, and only to a druid", () => {
    const druid = pc('Druid', 8);
    const before = druid.getWildShapeMax();
    expect(before).toBeGreaterThan(0);
    wear(druid, 'vestment-druids', "Druid's vestment");
    expect(druid.getWildShapeMax()).toBe(before + 1);

    // "worn by a character with the wild shape ability" — a fighter has none.
    const fighter = wear(pc('Fighter', 8), 'vestment-druids', "Druid's vestment");
    expect(fighter.getWildShapeMax()).toBe(0);
  });

  test('a monk’s belt raises a monk five levels, and gives a non-monk a 5th-level monk’s', () => {
    const monk = pc('Monk', 5);
    monk.setAbilityBase('wis', 14);
    const beforeAc = monk.getMonkAcBonus();
    const beforeDice = monk.getPunchDamageDice();
    wear(monk, 'belt-monks', "Monk's belt");
    expect(monk.getEffectiveMonkLevel()).toBe(10);
    expect(monk.getMonkAcBonus()).toBeGreaterThan(beforeAc);
    expect(monk.getPunchDamageDice()).not.toBe(beforeDice);

    const fighter = pc('Fighter', 12);
    fighter.setAbilityBase('wis', 14);
    expect(fighter.getMonkAcBonus()).toBe(0);
    wear(fighter, 'belt-monks', "Monk's belt");
    expect(fighter.getEffectiveMonkLevel()).toBe(5);
    // A 5th-level monk's AC bonus: Wisdom modifier plus the level milestone.
    expect(fighter.getMonkAcBonus()).toBe(2 + 1);
    expect(fighter.getPunchDamageDice()).toBe('1d8');
  });

  test('the belt’s AC bonus obeys the monk’s own conditions', () => {
    const fighter = pc('Fighter', 12);
    fighter.setAbilityBase('wis', 14);
    wear(fighter, 'belt-monks', "Monk's belt");
    fighter.equipItem('armor', { name: 'Chain shirt', link: 'chain-shirt' });
    // "This AC bonus functions just like the monk's" — so armor switches it off.
    expect(fighter.getMonkAcBonus()).toBe(0);
  });

  test('healing items change what a night restores', () => {
    const p = pc('Fighter', 6);
    p.setDamage(30);
    expect(p.getRestHealAmount()).toBe(6);
    wear(p, 'periapt-of-wound-closure', 'Periapt of wound closure');
    expect(p.getRestHealAmount()).toBe(12);
    expect(p.hasWornAutoStabilise()).toBe(true);
  });

  test('a ring of sustenance shortens the night', () => {
    expect(pc().getRequiredSleepHours()).toBe(8);
    expect(wear(pc(), 'ring-of-sustenance', 'Ring of Sustenance').getRequiredSleepHours()).toBe(2);
  });
});

describe('the two concepts the sheet had no notion of', () => {
  test('an energy resistance ring reports its amount and its chosen type', () => {
    const p = wear(pc(), 'ring-of-energy-resistance-major', 'Ring of Energy resistance, major',
      'other1', { energy: 'Fire' });
    expect(p.getEnergyResistances()).toEqual([
      { type: 'Fire', amount: 20, source: 'Ring of Energy resistance, major' },
    ]);
  });

  test('an unattuned ring reports the amount and an empty type rather than guessing', () => {
    const p = wear(pc(), 'ring-of-energy-resistance-minor', 'Ring of Energy resistance, minor');
    expect(p.getEnergyResistances()).toEqual([
      { type: '', amount: 10, source: 'Ring of Energy resistance, minor' },
    ]);
    expect(p.getWornItemsNeedingChoice()).toHaveLength(1);
  });

  test('concealment takes the best, never the sum', () => {
    const p = wear(pc(), 'cloak-of-displacement-minor', 'Cloak of displacement, minor');
    expect(p.getMissChance()).toBe(20);
    expect(pc().getMissChance()).toBe(0);
  });
});

describe('what an item grants outright', () => {
  test('immunities are listed with the item that gave them', () => {
    const p = wear(pc(), 'periapt-of-proof-against-poison', 'Periapt of proof against poison');
    expect(p.getWornImmunities()).toEqual([
      { what: 'Poison', source: 'Periapt of proof against poison' },
    ]);
    // And they appear beside the save that would have been rolled.
    expect(p.getSituationalContributions('fortitude').some((r) => /poison/i.test(r.note))).toBe(true);
  });

  test('a ring of evasion grants the ability by name', () => {
    const p = wear(pc(), 'ring-of-evasion', 'Ring of Evasion');
    expect(p.getWornGrantedAbilities()).toEqual([
      { ability: 'Evasion', source: 'Ring of Evasion' },
    ]);
  });

  test('an item-granted feat is a real feat, and brings its own bonus', () => {
    const p = wear(pc(), 'ioun-stones-dark-blue-rhomboid', 'Ioun stone, dark blue rhomboid');
    expect(p.hasFeatNamed('Alertness')).toBe(true);
    expect(p.getWornBonus('skill:Listen')).toBe(2);
    expect(p.getWornBonus('skill:Spot')).toBe(2);
  });

  test('a character who already has the feat gains nothing more from the stone', () => {
    // The same feat never applies twice.
    const p = pc();
    p.feats = ['Alertness'];
    const before = p.getSkillTotal('Listen');
    wear(p, 'ioun-stones-dark-blue-rhomboid', 'Ioun stone, dark blue rhomboid');
    expect(p.getWornBonus('skill:Listen')).toBe(0);
    expect(p.getSkillTotal('Listen')).toBe(before);
  });
});

describe('items that act on something other than the character', () => {
  test('an amulet of mighty fists reaches unarmed strikes and nothing else', () => {
    const p = pc('Monk', 6);
    p.setAbilityBase('str', 14);
    const beforeAttack = p.getPunchAttackBonus();
    const weaponBefore = p.getWornBonus('attack');
    wear(p, 'amulet-of-mighty-fists-3', 'Amulet of mighty fists +3');
    expect(p.getPunchAttackBonus()).toBe(beforeAttack + 3);
    // It is not a general attack bonus: a wielded weapon gets nothing.
    expect(p.getWornBonus('attack')).toBe(weaponBefore);
    expect(p.getNaturalWeaponBonus('naturalDamage')).toBe(3);
  });

  test('horseshoes of speed belong to the animal, not to the wearer', () => {
    const p = wear(pc('Druid', 8), 'horseshoes-of-speed', 'Horseshoes of speed');
    expect(p.getCompanionSpeedBonus()).toBe(30);
    // The character's own speed is untouched.
    expect(p.getTotalSpeed()).toBe(30);
  });

  test('a ring of wizardry names the spell level it doubles', () => {
    const p = wear(pc('Wizard', 10), 'ring-of-wizardry-2', 'Ring of Wizardry (II)');
    expect(p.getWornDoubledSpellLevels()).toEqual([2]);
    // Arcane only: a cleric wearing it gets nothing.
    const cleric = wear(pc('Cleric', 10), 'ring-of-wizardry-2', 'Ring of Wizardry (II)');
    expect(cleric.getWornDoubledSpellLevels()).toEqual([]);
  });
});
