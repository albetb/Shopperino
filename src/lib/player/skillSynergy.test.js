import Player from './player';
import { sumContributions } from './contributions';
import {
  getAllSynergies,
  getSynergiesInto,
  getSynergiesFrom,
  SYNERGY_RANKS,
  SYNERGY_BONUS,
} from './skillSynergy';
import { loadFile } from '../loadFile';

/* Five ranks in one skill grant +2 to a related one. The pairings used to exist
 * only inside the Description prose of skills.json, so nothing computed any of
 * them; they are a structured table in that same file now.
 *
 * Two things are worth guarding above all: that the table names skills the app
 * actually has — a typo is a silent miss, not an error — and that a synergy
 * reaching the total also reaches the breakdown, since the box checks its own
 * sum against the row.
 */

function make(cls = 'Rogue', level = 10) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

/** Every skill the sheet can show, Knowledge expanded into its sub-skills. */
const knownSkills = () => new Set(make().getSkillNames());

describe('the table itself', () => {
  test('is loaded, and every entry names a real skill', () => {
    const entries = getAllSynergies();
    expect(entries.length).toBeGreaterThan(20);
    const skills = knownSkills();
    entries.forEach((entry) => {
      expect(skills.has(entry.from)).toBe(true);
      if (entry.to) expect(skills.has(entry.to)).toBe(true);
      // Each entry is a skill target or a class-check target, never both.
      expect(Boolean(entry.to) !== Boolean(entry.toCheck)).toBe(true);
    });
  });

  test('a conditional entry says when it applies and an unconditional one does not', () => {
    getAllSynergies().forEach((entry) => {
      if (entry.when !== undefined) expect(typeof entry.when).toBe('string');
    });
    expect(getSynergiesInto('Balance').flat.some((e) => e.from === 'Tumble')).toBe(true);
    expect(getSynergiesInto('Balance').conditional).toEqual([]);
    expect(getSynergiesInto('Climb').conditional.some((e) => e.from === 'Use rope')).toBe(true);
    expect(getSynergiesInto('Climb').flat).toEqual([]);
  });

  test('no pairing is listed twice, so nothing double-counts', () => {
    const seen = getAllSynergies().map((e) => `${e.from}->${e.to ?? e.toCheck}`);
    expect(new Set(seen).size).toBe(seen.length);
  });

  test('every synergy the prose describes is in the table', () => {
    /* The prose is still the human-readable source, and this is what keeps the
       structured copy honest: each skill whose Description mentions a synergy
       must appear in the table as a source or a target. */
    const described = loadFile('skills')
      .filter((s) => /synerg/i.test(s.Description || ''))
      .map((s) => s.Name);
    expect(described.length).toBeGreaterThan(20);
    const involved = new Set();
    getAllSynergies().forEach((e) => {
      involved.add(e.from);
      if (e.to) involved.add(e.to);
    });
    // Knowledge sub-skills appear expanded in the table, bare in skills.json.
    const covered = (name) => involved.has(name)
      || [...involved].some((n) => n.startsWith(`${name} (`));
    described.forEach((name) => expect(covered(name)).toBe(true));
  });

  test('the source skill can be asked what its ranks would unlock', () => {
    const fromTumble = getSynergiesFrom('Tumble').map((e) => e.to).sort();
    expect(fromTumble).toEqual(['Balance', 'Jump']);
    expect(getSynergiesFrom('Nonsense')).toEqual([]);
  });
});

describe('a synergy is earned at five ranks, not before', () => {
  test('four ranks give nothing and five give +2', () => {
    const p = make();
    expect(p.getSkillSynergyBonus('Balance')).toBe(0);

    p.setSkillRanks('Tumble', SYNERGY_RANKS - 1);
    expect(p.getSkillSynergyBonus('Balance')).toBe(0);

    p.setSkillRanks('Tumble', SYNERGY_RANKS);
    expect(p.getSkillSynergyBonus('Balance')).toBe(SYNERGY_BONUS);
    expect(p.getSkillSynergyBonus('Jump')).toBe(SYNERGY_BONUS);
  });

  test('it reaches the skill total, not only the breakdown', () => {
    const plain = make();
    const tumbler = make();
    tumbler.setSkillRanks('Tumble', 5);
    // Both have no Balance ranks; the whole difference is the synergy.
    expect(tumbler.getSkillTotal('Balance') - plain.getSkillTotal('Balance')).toBe(2);
  });

  test('the breakdown names the source and still sums to the row', () => {
    const p = make();
    p.setSkillRanks('Tumble', 7);
    p.setSkillRanks('Balance', 4);
    const rows = p.getSkillContributions('Balance');
    const row = rows.find((r) => r.source === 'synergy:Tumble');
    expect(row).toBeTruthy();
    expect(row.label).toBe('Tumble (5 ranks)');
    expect(row.value).toBe(2);
    expect(row.type).toBe('synergy');
    expect(sumContributions(rows)).toBe(p.getSkillTotal('Balance'));
  });

  test('different sources into one skill stack', () => {
    const p = make('Bard', 12);
    p.setSkillRanks('Bluff', 5);
    p.setSkillRanks('Sense motive', 5);
    p.setSkillRanks('Knowledge (nobility and royalty)', 5);
    // Three distinct sources, so all three apply: Diplomacy reaches +6.
    expect(p.getSkillSynergyBonus('Diplomacy')).toBe(6);
    const rows = p.getSkillContributions('Diplomacy');
    expect(rows.filter((r) => r.source.startsWith('synergy:'))).toHaveLength(3);
    expect(sumContributions(rows)).toBe(p.getSkillTotal('Diplomacy'));
  });
});

describe('a conditional synergy stays out of the number', () => {
  test('five ranks of Use rope help climbing a rope, not climbing', () => {
    const p = make();
    p.setSkillRanks('Use rope', 5);
    expect(p.getSkillSynergyBonus('Climb')).toBe(0);
    expect(p.getSkillTotal('Climb')).toBe(make().getSkillTotal('Climb'));

    const notes = p.getSituationalContributions('skill:Climb');
    const note = notes.find((n) => n.source === 'synergy:Use rope');
    expect(note).toBeTruthy();
    expect(note.note).toContain('+2');
    expect(note.note).toContain('rope');
    expect('value' in note).toBe(false);
  });

  test('and only once the ranks are there', () => {
    const p = make();
    p.setSkillRanks('Use rope', 4);
    expect(p.getSituationalContributions('skill:Climb')
      .some((n) => n.source === 'synergy:Use rope')).toBe(false);
  });

  test('Survival collects several conditional sources at once', () => {
    const p = make('Ranger', 12);
    ['Search', 'Knowledge (nature)', 'Knowledge (geography)'].forEach((s) => p.setSkillRanks(s, 5));
    const notes = p.getSituationalContributions('skill:Survival')
      .filter((n) => n.source.startsWith('synergy:'));
    expect(notes).toHaveLength(3);
    // None of them moved the total.
    expect(p.getSkillSynergyBonus('Survival')).toBe(0);
  });
});

describe('the three targets that are a class check, not a skill row', () => {
  test('Handle animal helps wild empathy as well as Ride', () => {
    const druid = make('Druid', 8);
    druid.setAbilityBase('cha', 14);
    const before = druid.getWildEmpathyBonus();

    druid.setSkillRanks('Handle animal', 5);
    expect(druid.getWildEmpathyBonus()).toBe(before + 2);
    expect(druid.getSkillSynergyBonus('Ride')).toBe(2);
  });

  test('Knowledge (history) helps bardic knowledge', () => {
    const bard = make('Bard', 6);
    const before = bard.getBardicKnowledgeBonus();
    bard.setSkillRanks('Knowledge (history)', 5);
    expect(bard.getBardicKnowledgeBonus()).toBe(before + 2);
  });

  test('Knowledge (religion) helps the turning check but not turning damage', () => {
    const cleric = make('Cleric', 8);
    cleric.setAbilityBase('cha', 14);
    const checkBefore = cleric.getTurnUndeadCheckBonus();
    const damageBefore = cleric.getTurnUndeadDamage().bonus;

    cleric.setSkillRanks('Knowledge (religion)', 5);
    // The synergy is on the check only — the damage roll is level + Cha.
    expect(cleric.getTurnUndeadCheckBonus()).toBe(checkBefore + 2);
    expect(cleric.getTurnUndeadDamage().bonus).toBe(damageBefore);
  });

  test('a class without the check is unaffected either way', () => {
    const fighter = make('Fighter', 10);
    fighter.setSkillRanks('Handle animal', 5);
    fighter.setSkillRanks('Knowledge (religion)', 5);
    expect(fighter.getWildEmpathyBonus()).toBe(null);
    expect(fighter.getBardicKnowledgeBonus()).toBe(0);
    expect(fighter.getTurnUndeadCheckBonus()).toBe(0);
  });
});
