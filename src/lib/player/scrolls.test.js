import Player from './player';

/* Scrolls on the character: what is carried, and who may read it.
 *
 * The rule under test is **spell completion**, which is the strictest of the
 * four activation methods and the only one gated on the reader's level. Two
 * conditions must both hold — the spell is on your class list, and you can
 * already cast spells of that level — and a scroll can fail either, or both.
 *
 * Nothing here is enforced. Every assertion is about what the sheet *reports*;
 * the read button works regardless, because Use Magic Device exists and the
 * table is the authority.
 */

function pc(cls, level, ability = 10) {
  const p = new Player();
  p.name = 'Test';
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  const key = { Wizard: 'int', Sorcerer: 'cha', Bard: 'cha' }[cls] || 'wis';
  p.setAbilityBase(key, ability);
  return p;
}

const carry = (p, ref, name, number = 1) => {
  p.addInventoryItem(name, 'Scroll', number, ref);
  return p;
};

describe('what is in the bag', () => {
  test('a character with no scrolls has an empty list and no card', () => {
    const p = pc('Wizard', 5, 16);
    expect(p.getCarriedScrolls()).toEqual([]);
    expect(p.hasCarriedScrolls()).toBe(false);
  });

  test('a carried scroll resolves its spell and its count', () => {
    const p = carry(pc('Wizard', 5, 16), 'scrolls/Arcane/fireball', 'Scroll of Fireball', 3);
    const [scroll] = p.getCarriedScrolls();
    expect(scroll.spellName).toBe('Fireball');
    expect(scroll.number).toBe(3);
    expect(scroll.spellLevel).toBe(3);
    expect(scroll.source).toBe('Arcane');
    expect(p.hasCarriedScrolls()).toBe(true);
  });

  test('the arcane and divine copies of one spell are two separate rows', () => {
    /* 151 spells sit on both lists under the same name. If the card keyed on
       the name it would show one row and read the wrong scroll. */
    const p = pc('Cleric', 5, 16);
    carry(p, 'scrolls/Arcane/detect-magic', 'Scroll of Detect magic');
    carry(p, 'scrolls/Divine/detect-magic', 'Scroll of Detect magic');
    const rows = p.getCarriedScrolls();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.source)).toEqual(['Arcane', 'Divine']);
  });

  test('a spent-out row and a row that names no scroll are both dropped', () => {
    const p = pc('Wizard', 5, 16);
    carry(p, 'scrolls/Arcane/fireball', 'Scroll of Fireball', 1);
    p.removeInventoryItem('Scroll of Fireball', 'Scroll', 1, { link: 'scrolls/Arcane/fireball' });
    carry(p, 'scrolls/Arcane/not-a-spell', 'Scroll of Nothing');
    expect(p.getCarriedScrolls()).toEqual([]);
  });

  test('potions in the same bag are not scrolls', () => {
    const p = pc('Wizard', 5, 16);
    p.addInventoryItem('Potion of Cure light wounds', 'Potion', 1, 'cure-light-wounds');
    carry(p, 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    expect(p.getCarriedScrolls()).toHaveLength(1);
    expect(p.getCarriedPotions()).toHaveLength(1);
  });
});

describe('the highest level that can be cast', () => {
  test('a fighter casts nothing, at any level', () => {
    expect(pc('Fighter', 20, 18).getMaxCastableSpellLevel()).toBe(-1);
  });

  test('a paladin below 4th casts nothing, and gains 1st-level spells at 4th', () => {
    expect(pc('Paladin', 3, 14).getMaxCastableSpellLevel()).toBe(-1);
    expect(pc('Paladin', 4, 14).getMaxCastableSpellLevel()).toBe(1);
  });

  test('a wizard climbs one level of spells every two character levels', () => {
    expect(pc('Wizard', 1, 16).getMaxCastableSpellLevel()).toBe(1);
    expect(pc('Wizard', 5, 16).getMaxCastableSpellLevel()).toBe(3);
    expect(pc('Wizard', 9, 16).getMaxCastableSpellLevel()).toBe(5);
  });

  test('the casting ability caps it — no spells above the score minus ten', () => {
    /* An Int 13 wizard has the slots for 5th-level spells at 9th but cannot
       cast above 3rd. The spellbook already owns this rule; the point of the
       test is that the scroll gate reads the same number the player sees. */
    expect(pc('Wizard', 9, 13).getMaxCastableSpellLevel()).toBe(3);
  });
});

describe('the two conditions of spell completion', () => {
  test('a wizard who can cast the level reads their own scroll unaided', () => {
    const p = carry(pc('Wizard', 5, 16), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const [scroll] = p.getCarriedScrolls();
    expect(scroll.usable).toBe(true);
    expect(scroll.reasons).toEqual([]);
    expect(scroll.reason).toBe('');
  });

  test('a spell off your list is refused even when the level is within reach', () => {
    /* Cure light wounds is a 1st-level cleric spell and on no wizard's list.
       A 5th-level wizard has 1st-level slots to spare and still cannot read
       it — list membership is a separate question from level. */
    const p = carry(pc('Wizard', 5, 16), 'scrolls/Divine/cure-light-wounds', 'Scroll of Cure light wounds');
    const [scroll] = p.getCarriedScrolls();
    expect(scroll.usable).toBe(false);
    expect(scroll.reasons).toEqual(['Not on the Wizard spell list']);
  });

  test('a spell on your list but above your level is refused — the wand rule does not apply', () => {
    /* This is the one place a scroll parts company with a wand. A 1st-level
       wizard fires a wand of fireball normally; the scroll is beyond them. */
    const p = carry(pc('Wizard', 1, 16), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const [scroll] = p.getCarriedScrolls();
    expect(scroll.usable).toBe(false);
    expect(scroll.reasons).toHaveLength(1);
    expect(scroll.reason).toMatch(/up to level 1 .* is level 3/);
  });

  test('both can fail at once, and both are said', () => {
    const p = carry(pc('Wizard', 1, 16), 'scrolls/Divine/flame-strike', 'Scroll of Flame strike');
    const [scroll] = p.getCarriedScrolls();
    expect(scroll.reasons).toHaveLength(2);
    expect(scroll.reasons[0]).toMatch(/Not on the Wizard spell list/);
    expect(scroll.reasons[1]).toMatch(/level 5/);
  });

  test('a non-caster gets one sentence, not two', () => {
    /* Which list the spell is on is moot for a fighter, and saying both
       would only make the box longer without making it clearer. */
    const p = carry(pc('Fighter', 10, 12), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const [scroll] = p.getCarriedScrolls();
    expect(scroll.usable).toBe(false);
    expect(scroll.reasons).toEqual(['A Fighter of your level casts no spells']);
  });

  test('a paladin below 4th is told the same way, and can read at 4th', () => {
    const under = carry(pc('Paladin', 3, 14), 'scrolls/Divine/bless', 'Scroll of Bless');
    expect(under.getCarriedScrolls()[0].usable).toBe(false);
    expect(under.getCarriedScrolls()[0].reasons[0]).toMatch(/casts no spells/);

    const over = carry(pc('Paladin', 4, 14), 'scrolls/Divine/bless', 'Scroll of Bless');
    expect(over.getCarriedScrolls()[0].usable).toBe(true);
  });

  test('a cleric reads a divine scroll of a spell a wizard could not', () => {
    const p = carry(pc('Cleric', 5, 16), 'scrolls/Divine/cure-light-wounds', 'Scroll of Cure light wounds');
    expect(p.getCarriedScrolls()[0].usable).toBe(true);
  });

  test('the level compared against is the one on your own list, not the scroll’s', () => {
    /* Invisibility is Sor/Wiz 2 and Brd 2 — the same on both. Blindness is a
       better test: the arcane row is 2nd, and a cleric gets it at 3rd, so a
       cleric holding an arcane copy is judged at 3rd. */
    const cleric = carry(pc('Cleric', 4, 16), 'scrolls/Arcane/blindness/deafness', 'Scroll of Blindness/deafness');
    const [scroll] = cleric.getCarriedScrolls();
    expect(scroll.spellLevel).toBe(2);
    expect(cleric.getSpellLevelForItem('blindness/deafness')).toBe(3);
    /* A 4th-level cleric casts up to 2nd, so the 3rd-level cleric entry is
       out of reach even though the scroll itself says 2. */
    expect(scroll.usable).toBe(false);
    expect(scroll.reason).toMatch(/is level 3/);
  });
});

describe('the Use Magic Device fallback carried on each row', () => {
  test('the DC follows the scroll’s caster level', () => {
    const p = carry(pc('Fighter', 5, 12), 'scrolls/Arcane/fireball', 'Scroll of Fireball');
    const [scroll] = p.getCarriedScrolls();
    // Fireball costs 375 gp = CL 5 x SL 3 x 25, so DC 20 + 5.
    expect(scroll.casterLevel).toBe(5);
    expect(scroll.umdDC).toBe(25);
  });
});
