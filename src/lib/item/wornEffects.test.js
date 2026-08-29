import {
  WORN_EFFECTS,
  ENERGY_TYPES,
  formatWornEffectSummary,
  resolveWornEffect,
  unknownWornLinks,
  wornChoiceKind,
  wornEffectLinks,
} from './wornEffects';
import { loadFile } from '../loadFile';

/* The worn-item effect table.
 *
 * The audit behind it (obsidian-vault/docs/wondrous_item_audit.md) counted 138
 * of 538 items as carrying something the sheet could show. This file is the
 * guard on that: a typo in a key is otherwise silent — the row simply never
 * matches an item and the bonus quietly never appears.
 *
 * The other thing it protects is the AC split. An armor bonus is denied to
 * touch AC and a deflection bonus is not, and getting that backwards is the
 * classic AC bug: bracers and a ring of protection are the two items that
 * would show it.
 */

const CATEGORIES = [
  'Wondrous Item', 'Ring', 'Rod', 'Staff',
  'Specific Weapon', 'Specific Armor', 'Specific Shield',
];

const itemsIn = (category) => loadFile('items')?.[category] || [];

describe('every key names a real item', () => {
  test('no link in the table is missing from items.json', () => {
    /* This is the whole reason the guard exists. Two golem manuals were caught
       by it: the flesh one's link is the bare `golem-manual`, and the greater
       stone one is `golem-manual-greater-stone`, not `-stone-greater`. */
    expect(unknownWornLinks()).toEqual([]);
  });

  test('the table covers the 138 items the audit found, in 133 rows', () => {
    /* Fewer rows than items because five items share a link: all four luck
       blades are `luck-blade`, and the earth, fire and water rings of
       elemental command are all `ring-of-elemental-command`. */
    const links = new Set(wornEffectLinks());
    const covered = CATEGORIES.flatMap(itemsIn).filter((row) => links.has(row.Link));
    expect(links.size).toBe(133);
    expect(covered).toHaveLength(138);
  });

  test('every row carries a label and at least one thing it does', () => {
    Object.entries(WORN_EFFECTS).forEach(([link, entry]) => {
      expect(entry.label).toBeTruthy();
      const doesSomething = entry.stats || entry.skillsByAbility || entry.situational
        || entry.situationalFromName || entry.spellResistance || entry.damageReduction
        || entry.casterLevel || entry.turnUndeadLevel || entry.wildShapeUses
        || entry.monkLevel || entry.restHealPerHour || entry.restHealMultiplier
        || entry.sleepHours || entry.energyResistance || entry.missChance
        || entry.doublesSpellLevel || entry.immunities || entry.grantsFeat
        || entry.grantsAbility || entry.companionSpeed;
      expect({ link, doesSomething: Boolean(doesSomething) }).toEqual({ link, doesSomething: true });
    });
  });
});

describe('the AC split, which is the classic bug', () => {
  test('bracers grant an armor bonus and are denied to touch AC', () => {
    const { stats } = resolveWornEffect('bracers-of-armor-4');
    expect(stats.ac).toEqual([4, 'armor']);
    expect(stats.acFlat).toEqual([4, 'armor']);
    expect(stats.acTouch).toBeUndefined();
  });

  test('a ring of protection is deflection and reaches all three', () => {
    const { stats } = resolveWornEffect('ring-of-protection-3');
    expect(stats.ac).toEqual([3, 'deflection']);
    expect(stats.acTouch).toEqual([3, 'deflection']);
    expect(stats.acFlat).toEqual([3, 'deflection']);
  });

  test('an amulet of natural armor is natural-armor typed, like barkskin', () => {
    const { stats } = resolveWornEffect('amulet-of-natural-armor-5');
    expect(stats.ac).toEqual([5, 'natural']);
    expect(stats.acTouch).toBeUndefined();
  });

  test('the ring of force shield is a shield bonus, not armor', () => {
    const { stats } = resolveWornEffect('ring-of-force-shield');
    expect(stats.ac).toEqual([2, 'shield']);
    expect(stats.acTouch).toBeUndefined();
  });

  test('the dusty rose prism is insight, which a touch attack does not avoid', () => {
    const { stats } = resolveWornEffect('ioun-stones-dusty-rose-prism');
    expect(stats.acTouch).toEqual([1, 'insight']);
  });
});

describe('the graded families', () => {
  test('bracers run +1 to +8 and each link carries its own number', () => {
    for (let n = 1; n <= 8; n += 1) {
      expect(resolveWornEffect(`bracers-of-armor-${n}`).stats.ac[0]).toBe(n);
    }
    expect(WORN_EFFECTS['bracers-of-armor-9']).toBeUndefined();
  });

  test('a cloak of resistance raises all three saves by its own grade', () => {
    const { stats } = resolveWornEffect('cloak-of-resistance-2');
    expect(stats.fortitude).toEqual([2, 'resistance']);
    expect(stats.reflex).toEqual([2, 'resistance']);
    expect(stats.will).toEqual([2, 'resistance']);
  });

  test('the six ability items come in +2, +4 and +6', () => {
    expect(resolveWornEffect('amulet-of-health-6').stats.con).toEqual([6, 'enhancement']);
    expect(resolveWornEffect('gloves-of-dexterity-2').stats.dex).toEqual([2, 'enhancement']);
    expect(resolveWornEffect('periapt-of-wisdom-4').stats.wis).toEqual([4, 'enhancement']);
  });

  test('a belt of giant Strength exists only at +4 and +6', () => {
    expect(WORN_EFFECTS['belt-of-giant-strength-2']).toBeUndefined();
    expect(resolveWornEffect('belt-of-giant-strength-4').stats.str).toEqual([4, 'enhancement']);
  });
});

describe('one link, several items', () => {
  test('every luck blade resolves to the same +1 luck bonus', () => {
    const blades = itemsIn('Specific Weapon').filter((r) => r.Link === 'luck-blade');
    expect(blades).toHaveLength(4);
    blades.forEach((blade) => {
      const effect = resolveWornEffect(blade.Link, blade.Name);
      expect(effect.stats.will).toEqual([1, 'luck']);
    });
  });

  test('the elemental command rings name their own element from the item name', () => {
    /* Earth, fire and water share one link, so the row cannot say which it is
       — the note is derived from the name instead. */
    const fire = resolveWornEffect('ring-of-elemental-command', 'Ring of Elemental command (fire)');
    const water = resolveWornEffect('ring-of-elemental-command', 'Ring of Elemental command (water)');
    expect(fire.situational).toMatch(/extraplanar fire creatures/);
    expect(water.situational).toMatch(/extraplanar water creatures/);
    // Air has a link of its own and needs no derivation.
    expect(resolveWornEffect('ring-of-elemental-command-air').situational).toMatch(/air/);
  });

  test('an unparseable name falls back rather than saying "undefined"', () => {
    const effect = resolveWornEffect('ring-of-elemental-command', 'A ring');
    expect(effect.situational).toMatch(/extraplanar elemental creatures/);
  });
});

describe('where a situational note lives', () => {
  test('a note with no home of its own follows its row’s numbers', () => {
    const headband = resolveWornEffect('headband-of-intellect-4');
    expect(headband.situationalOn).toEqual([]);
    expect(headband.stats.int).toBeDefined();
    expect(headband.situational).toMatch(/no extra skill points/i);
  });

  test('a note about a different stat from the bonus is homed explicitly', () => {
    /* The lens adds to Search and says something about Survival. Without a
       home the note would appear beside the Search bonus, which is wrong. */
    const lens = resolveWornEffect('lens-of-detection');
    expect(lens.stats['skill:Search']).toEqual([5, '']);
    expect(lens.situationalOn).toEqual(['skill:Survival']);
  });

  test('a row that carries no number at all still has somewhere to appear', () => {
    expect(resolveWornEffect('sword-of-subtlety').situationalOn).toEqual(['attack', 'damage']);
    expect(resolveWornEffect('rhino-hide').situationalOn).toEqual(['damage']);
    expect(resolveWornEffect('golem-manual').situationalOn).toEqual(['skill:Craft']);
  });

  test('the belt of dwarvenkind homes its note on every Charisma skill', () => {
    expect(resolveWornEffect('belt-of-dwarvenkind').situationalOnAbility).toBe('cha');
  });
});

describe('the gates', () => {
  test('the robe of the archmagi is arcane-only', () => {
    const robe = resolveWornEffect('robe-of-the-archmagi');
    expect(robe.arcaneOnly).toBe(true);
    expect(robe.spellResistance).toBe(18);
  });

  test('the belt of dwarvenkind excludes the race it is named for', () => {
    expect(resolveWornEffect('belt-of-dwarvenkind').raceExcept).toBe('Dwarf');
  });

  test('only the three energy-resistance rings ask a question', () => {
    expect(wornChoiceKind('ring-of-energy-resistance-minor')).toBe('energy');
    expect(wornChoiceKind('ring-of-energy-resistance-greater')).toBe('energy');
    expect(wornChoiceKind('cloak-of-resistance-1')).toBe('');
    expect(wornChoiceKind('not-an-item')).toBe('');
    const asking = wornEffectLinks().filter((link) => wornChoiceKind(link));
    expect(asking).toHaveLength(3);
  });

  test('the five energy types are the SRD’s five', () => {
    expect(ENERGY_TYPES).toEqual(['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic']);
  });
});

describe('an item with no effect', () => {
  test('resolves to null rather than to an empty object', () => {
    // A bag of holding does nothing a character sheet can show.
    expect(resolveWornEffect('bag-of-holding-1')).toBeNull();
    expect(resolveWornEffect('')).toBeNull();
    expect(resolveWornEffect(null)).toBeNull();
  });
});

describe('the one-line summary', () => {
  test('collapses the three AC keys into one bonus', () => {
    // "+3 deflection to AC", not the same sentence three times.
    const summary = formatWornEffectSummary(resolveWornEffect('ring-of-protection-3'));
    expect(summary).toBe('+3 deflection to AC');
  });

  test('names each stat a row touches', () => {
    const summary = formatWornEffectSummary(resolveWornEffect('boots-of-striding-and-springing'));
    expect(summary).toMatch(/\+10 enhancement to speed/);
    expect(summary).toMatch(/\+5 competence to Jump/);
  });

  test('reports the Group B fields, which carry no stat key', () => {
    expect(formatWornEffectSummary(resolveWornEffect('mantle-of-faith'))).toBe('DR 5/evil');
    expect(formatWornEffectSummary(resolveWornEffect('mantle-of-spell-resistance'))).toBe('spell resistance 21');
    expect(formatWornEffectSummary(resolveWornEffect('ioun-stones-orange'))).toBe('+1 caster level');
    expect(formatWornEffectSummary(resolveWornEffect('periapt-of-health'))).toBe('immune to disease');
    expect(formatWornEffectSummary(resolveWornEffect('cloak-of-displacement-minor')))
      .toBe('20% miss chance against you');
  });

  test('says "every Charisma-based skill" for the shape between one skill and all', () => {
    expect(formatWornEffectSummary(resolveWornEffect('circlet-of-persuasion')))
      .toBe('+3 competence to every Charisma-based skill');
  });

  test('a row with a note and no number summarises to nothing', () => {
    // The note is rendered separately; an empty summary is the right answer.
    expect(formatWornEffectSummary(resolveWornEffect('sword-of-subtlety'))).toBe('');
    expect(formatWornEffectSummary(null)).toBe('');
  });
});
