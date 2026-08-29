import Player from './player';
import { loadFile } from '../loadFile';
import { SITUATIONAL_FEAT_STATS, getSituationalFeatNames } from './featEffects';

/* Sixteen feats grant a real bonus in a stated situation. None of them may
 * move a headline number — a +4 dodge AC against attacks of opportunity is
 * wrong every round nobody provokes one — so each is a note beside the stat it
 * qualifies, on the same machinery the class features and the racial traits
 * already use.
 *
 * The two rules worth guarding: the table may only name feats that exist (a
 * typo is a silent miss, not an error), and the note must come from feats.json
 * rather than from a second copy written here.
 */

function make(feats = [], cls = 'Fighter', level = 6) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

const notesFor = (player, key) => player.getSituationalContributions(key)
  .filter((n) => n.source.startsWith('feat:'));

describe('the table itself', () => {
  test('names eighteen feats, and every one of them is in feats.json', () => {
    const names = Object.keys(SITUATIONAL_FEAT_STATS);
    expect(names).toHaveLength(18);
    const known = new Set(loadFile('feats').map((f) => f.Name));
    names.forEach((name) => expect(known.has(name)).toBe(true));
  });

  test('every feat in it has a shortDescription to say', () => {
    const p = make();
    Object.keys(SITUATIONAL_FEAT_STATS).forEach((name) => {
      expect(p.getFeatShortDescription(name).length).toBeGreaterThan(10);
    });
    expect(p.getFeatShortDescription('No such feat')).toBe('');
  });

  test('only stat keys the breakdown already speaks are used', () => {
    const allowed = new Set([
      'ac', 'fortitude', 'attack', 'damage', 'maxHp', 'skill:concentration', 'skill:ride',
    ]);
    Object.values(SITUATIONAL_FEAT_STATS).forEach((keys) => {
      keys.forEach((key) => expect(allowed.has(key)).toBe(true));
    });
  });

  test('the lookup is case-insensitive, as skill keys carry their own capitals', () => {
    expect(getSituationalFeatNames('skill:Concentration')).toEqual(['Combat casting']);
    expect(getSituationalFeatNames('')).toEqual([]);
  });
});

describe('a note appears only when the feat is held', () => {
  test('a plain fighter reports none of them', () => {
    const p = make();
    ['ac', 'fortitude', 'attack', 'damage', 'skill:Concentration']
      .forEach((key) => expect(notesFor(p, key)).toEqual([]));
  });

  test('Mobility lands on AC and nowhere else', () => {
    const p = make(['Mobility']);
    const ac = notesFor(p, 'ac');
    expect(ac).toHaveLength(1);
    expect(ac[0].label).toBe('Mobility');
    expect(ac[0].note).toContain('dodge');
    expect(notesFor(p, 'attack')).toEqual([]);
    expect(notesFor(p, 'reflex')).toEqual([]);
  });

  test('the note is the feats.json text, not a copy of it', () => {
    const p = make(['Precise shot']);
    const feat = loadFile('feats').find((f) => f.Name === 'Precise shot');
    expect(notesFor(p, 'attack')[0].note).toBe(feat.shortDescription);
  });

  test('Point blank shot is the one feat on two stats at once', () => {
    const p = make(['Point blank shot']);
    expect(notesFor(p, 'attack')).toHaveLength(1);
    expect(notesFor(p, 'damage')).toHaveLength(1);
  });

  test('the four Improved maneuvers all report against the attack roll', () => {
    const p = make(['Improved bull rush', 'Improved overrun', 'Improved sunder', 'Improved disarm']);
    const labels = notesFor(p, 'attack').map((n) => n.label).sort();
    expect(labels).toEqual([
      'Improved bull rush', 'Improved disarm', 'Improved overrun', 'Improved sunder',
    ]);
  });
});

describe('none of it reaches a number', () => {
  test('the totals are untouched by every one of the sixteen', () => {
    const plain = make();
    const loaded = make(Object.keys(SITUATIONAL_FEAT_STATS));
    expect(loaded.getArmorClass()).toBe(plain.getArmorClass());
    expect(loaded.getFortitudeSave()).toBe(plain.getFortitudeSave());
    expect(loaded.getSkillTotal('Concentration')).toBe(plain.getSkillTotal('Concentration'));
  });

  test('a situational entry carries no value key at all', () => {
    const p = make(['Endurance']);
    const note = notesFor(p, 'fortitude')[0];
    expect(note).toBeTruthy();
    expect('value' in note).toBe(false);
  });
});

describe('a granted feat counts as a feat', () => {
  test("the ranger's Endurance is found even though getFeats() omits it", () => {
    const ranger = make([], 'Ranger', 3);
    expect(ranger.getFeats()).not.toContain('Endurance');
    expect(ranger.getGrantedFeats().map((g) => g.feat)).toContain('Endurance');
    expect(ranger.hasFeatNamed('Endurance')).toBe(true);
    expect(notesFor(ranger, 'fortitude').map((n) => n.label)).toContain('Endurance');
  });

  test('and not before the level that grants it', () => {
    const ranger = make([], 'Ranger', 2);
    expect(ranger.hasFeatNamed('Endurance')).toBe(false);
    expect(notesFor(ranger, 'fortitude')).toEqual([]);
  });

  test('a parenthesised choice still answers to its base name', () => {
    const p = make(['Skill focus (Tumble)']);
    expect(p.hasFeatNamed('Skill focus')).toBe(true);
    expect(p.hasFeatNamed('')).toBe(false);
  });
});

describe('the weapon box merges the two lists without repeating itself', () => {
  test('Point blank shot is one row, not two', () => {
    const p = make(['Point blank shot']);
    const rows = p.getWeaponSituationalContributions()
      .filter((n) => n.source === 'feat:Point blank shot');
    expect(rows).toHaveLength(1);
  });

  test('a feat on one stat only still comes through', () => {
    const p = make(['Precise shot', 'Spirited charge']);
    const labels = p.getWeaponSituationalContributions().map((n) => n.label);
    expect(labels).toContain('Precise shot');
    expect(labels).toContain('Spirited charge');
  });

  test('the merged list carries no duplicate sources at all', () => {
    const ranger = make(Object.keys(SITUATIONAL_FEAT_STATS), 'Ranger', 12);
    ranger.setFavoredEnemies?.([{ type: 'Giant', bonus: 2 }]);
    const sources = ranger.getWeaponSituationalContributions().map((n) => n.source);
    expect(new Set(sources).size).toBe(sources.length);
  });
});

describe('the three the first audit pass missed', () => {
  test('Diehard reports against hit points, where a player looks at 0 hp', () => {
    const p = make(['Diehard']);
    const notes = notesFor(p, 'maxHp');
    expect(notes).toHaveLength(1);
    expect(notes[0].note).toContain('stable');
  });

  test('Mounted combat reports against Ride, which is the roll it asks for', () => {
    const p = make(['Mounted combat']);
    expect(notesFor(p, 'skill:Ride')[0].note).toContain('Ride check');
    expect(notesFor(p, 'attack')).toEqual([]);
  });

  test('Improved grapple is deliberately absent', () => {
    /* Grapple is omitted from this campaign's rule notes on purpose, so the
       feat has no roll on this sheet to qualify. Reference text, like Cleave. */
    expect(Object.keys(SITUATIONAL_FEAT_STATS)).not.toContain('Improved grapple');
  });
});
