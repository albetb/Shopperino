import Player from './player';
import { sumContributions } from './contributions';

/* The half of the class-feature audit that is arithmetic rather than a note.
 *
 * Each of these was already in classes.json and read by nothing: the druid's
 * Nature Sense, wild empathy for druid and ranger, the monk's Diamond Soul and
 * Perfect Self. The rule that matters most is the one the breakdown box
 * enforces — a skill's contribution list must sum to the number on the row —
 * so Nature Sense is checked on both sides, not just the one that shows it.
 */

function make(cls, level) {
  const p = new Player();
  p.name = 'Test';
  p.race = 'Human';
  p.class = cls;
  p.level = level;
  return p;
}

describe('nature sense', () => {
  test('adds +2 to the two skills it names and to nothing else', () => {
    const druid = make('Druid', 1);
    expect(druid.getNatureSenseBonus('Knowledge (nature)')).toBe(2);
    expect(druid.getNatureSenseBonus('Survival')).toBe(2);
    expect(druid.getNatureSenseBonus('Knowledge (arcana)')).toBe(0);
    expect(druid.getNatureSenseBonus('Hide')).toBe(0);
  });

  test('reaches the skill total, not only the breakdown', () => {
    const druid = make('Druid', 1);
    const ranger = make('Ranger', 1);
    druid.setSkillRanks('Survival', 4);
    ranger.setSkillRanks('Survival', 4);
    // Same ranks, same Wisdom, same class-skill status: the gap is the feature.
    expect(druid.getSkillTotal('Survival') - ranger.getSkillTotal('Survival')).toBe(2);
  });

  test('the breakdown names it and still sums to the row', () => {
    const druid = make('Druid', 5);
    druid.setSkillRanks('Knowledge (nature)', 6);
    const rows = druid.getSkillContributions('Knowledge (nature)');
    const row = rows.find((r) => r.source === 'classFeature');
    expect(row).toBeTruthy();
    expect(row.label).toBe('Nature Sense');
    expect(row.value).toBe(2);
    expect(sumContributions(rows)).toBe(druid.getSkillTotal('Knowledge (nature)'));
  });

  test('a ranger has none of it', () => {
    expect(make('Ranger', 20).getNatureSenseBonus('Survival')).toBe(0);
    const rows = make('Ranger', 20).getSkillContributions('Survival');
    expect(rows.some((r) => r.source === 'classFeature')).toBe(false);
  });
});

describe('wild empathy', () => {
  test('is level plus Charisma for the two classes that have it', () => {
    const druid = make('Druid', 7);
    druid.setAbilityBase('cha', 16);
    expect(druid.getWildEmpathyBonus()).toBe(7 + 3);

    const ranger = make('Ranger', 4);
    ranger.setAbilityBase('cha', 8);
    expect(ranger.getWildEmpathyBonus()).toBe(4 - 1);
  });

  test('null for a class without it, which is not the same as +0', () => {
    expect(make('Fighter', 10).getWildEmpathyBonus()).toBe(null);
    expect(make('Rogue', 10).getWildEmpathyBonus()).toBe(null);
  });

  test('is reported on the Handle animal row, carrying its number', () => {
    const druid = make('Druid', 7);
    druid.setAbilityBase('cha', 16);
    const notes = druid.getSituationalContributions('skill:Handle animal');
    const empathy = notes.find((e) => e.label === 'Wild empathy');
    expect(empathy).toBeTruthy();
    expect(empathy.note).toContain('1d20+10');
    // A note, so it can never be added into the Handle animal total.
    expect('value' in empathy).toBe(false);
    expect(make('Fighter', 7).getSituationalContributions('skill:Handle animal'))
      .toEqual([]);
  });
});

describe('diamond soul', () => {
  test('is 10 plus monk level, from 13th', () => {
    expect(make('Monk', 12).getSpellResistance()).toBe(0);
    expect(make('Monk', 13).getSpellResistance()).toBe(23);
    expect(make('Monk', 20).getSpellResistance()).toBe(30);
  });

  test('no other class has any', () => {
    ['Fighter', 'Druid', 'Paladin', 'Wizard'].forEach((cls) => {
      expect(make(cls, 20).getSpellResistance()).toBe(0);
    });
  });
});

describe('perfect self', () => {
  test('gives the 20th-level monk DR 10/magic', () => {
    expect(make('Monk', 19).getDamageReductions()).toEqual([]);
    expect(make('Monk', 20).getDamageReductions()).toEqual([
      { amount: 10, bypass: 'magic', source: 'Perfect Self' },
    ]);
  });

  test("it does not disturb the barbarian's own scaling DR", () => {
    const barbarian = make('Barbarian', 20);
    const dr = barbarian.getDamageReductions();
    expect(dr).toHaveLength(1);
    expect(dr[0]).toMatchObject({ amount: 5, source: 'Barbarian' });
  });
});
