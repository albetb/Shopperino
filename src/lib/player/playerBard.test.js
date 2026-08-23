import Player from './player';

function bard(level, { int = 10, cha = 10, perform = 99 } = {}) {
  const p = new Player();
  p.setRace('Human');
  p.setClass('Bard');
  p.setLevel(level);
  p.setAbilityBase('int', int);
  p.setAbilityBase('cha', cha);
  // Ranks default high so level is the only gate unless a test says otherwise.
  p.setSkillRanks('Perform', perform);
  return p;
}

function other(cls, level) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  return p;
}

const available = (p) => p.getBardicPerformances().filter((x) => x.available).map((x) => x.name);
const find = (p, name) => p.getBardicPerformances().find((x) => x.name === name);

describe('bardic music uses', () => {
  test('uses per day equal the bard level', () => {
    expect(bard(1).getBardicMusicMax()).toBe(1);
    expect(bard(6).getBardicMusicMax()).toBe(6);
    expect(bard(18).getBardicMusicMax()).toBe(18);
    expect(bard(20).getBardicMusicMax()).toBe(20);
  });

  test('no other class has bardic music', () => {
    expect(other('Rogue', 20).getBardicMusicMax()).toBe(0);
  });
});

describe('bardic knowledge', () => {
  test('is bard level plus the Intelligence modifier', () => {
    expect(bard(1, { int: 10 }).getBardicKnowledgeBonus()).toBe(1);
    expect(bard(6, { int: 16 }).getBardicKnowledgeBonus()).toBe(9);   // 6 + 3
    expect(bard(18, { int: 18 }).getBardicKnowledgeBonus()).toBe(22); // 18 + 4
  });

  test('a poor Intelligence lowers it', () => {
    expect(bard(10, { int: 6 }).getBardicKnowledgeBonus()).toBe(8);   // 10 - 2
  });

  test('no other class has it', () => {
    expect(other('Fighter', 20).getBardicKnowledgeBonus()).toBe(0);
  });
});

describe('the performance list', () => {
  test('a 1st level bard with the ranks has the three opening performances', () => {
    expect(available(bard(1))).toEqual(['Countersong', 'Fascinate', 'Inspire courage']);
  });

  test('a 6th level bard has gained inspire competence and suggestion', () => {
    expect(available(bard(6))).toEqual([
      'Countersong', 'Fascinate', 'Inspire courage', 'Inspire competence', 'Suggestion',
    ]);
  });

  test('an 18th level bard has every performance', () => {
    expect(available(bard(18))).toHaveLength(9);
    expect(available(bard(18))).toContain('Mass suggestion');
  });

  test('locked performances are listed, not dropped', () => {
    const p = bard(1);
    expect(p.getBardicPerformances()).toHaveLength(9);
    const suggestion = find(p, 'Suggestion');
    expect(suggestion.available).toBe(false);
    expect(suggestion.meetsLevel).toBe(false);
    expect(suggestion.level).toBe(6);
  });

  test('too few Perform ranks lock a performance the level would allow', () => {
    // Level 6 clears every level gate up to Suggestion, but Suggestion also
    // needs 9 ranks and Inspire competence needs 6.
    const p = bard(6, { perform: 6 });
    const suggestion = find(p, 'Suggestion');
    expect(suggestion.meetsLevel).toBe(true);
    expect(suggestion.meetsRanks).toBe(false);
    expect(suggestion.available).toBe(false);
    expect(suggestion.performRanks).toBe(9);

    expect(find(p, 'Inspire competence').available).toBe(true);
  });

  test('with no Perform ranks at all nothing is available', () => {
    expect(available(bard(20, { perform: 0 }))).toEqual([]);
    expect(bard(20, { perform: 0 }).getBardicPerformances()).toHaveLength(9);
  });

  test('performances that allow a save carry the DC, the rest carry none', () => {
    const p = bard(10, { cha: 18 }); // 10 + 5 + 4
    expect(find(p, 'Suggestion').saveDc).toBe(19);
    expect(find(p, 'Fascinate').saveDc).toBe(19);
    expect(find(p, 'Countersong').saveDc).toBe(null);
    expect(find(p, 'Inspire courage').saveDc).toBe(null);
  });

  test('every entry carries its summary text', () => {
    bard(20).getBardicPerformances().forEach((x) => {
      expect(typeof x.summary).toBe('string');
      expect(x.summary.length).toBeGreaterThan(0);
    });
  });

  test('inspire courage scales with level', () => {
    expect(bard(1).getInspireCourageBonus()).toBe(1);
    expect(bard(8).getInspireCourageBonus()).toBe(2);
    expect(bard(14).getInspireCourageBonus()).toBe(3);
    expect(bard(20).getInspireCourageBonus()).toBe(4);
  });

  test('no other class has performances or a performance DC', () => {
    expect(other('Sorcerer', 20).getBardicPerformances()).toEqual([]);
    expect(other('Sorcerer', 20).getPerformanceSaveDc()).toBe(0);
    expect(other('Sorcerer', 20).getInspireCourageBonus()).toBe(0);
  });
});
