import {
  ALL_SOURCES_MASK,
  SIZES,
  SOURCES,
  TERRAINS,
  creatureCr,
  filterBestiary,
  formatCr,
  isSourceSelected,
  listBestiary,
  listChallengeRatings,
  listCreatureTypes,
  matchesTerrain,
  normalizeSourceMask,
  pickRandomCreature,
  toggleSource,
} from './monsterBook';

describe('the source switches', () => {
  test('all three are on by default', () => {
    SOURCES.forEach((_, i) => expect(isSourceSelected(ALL_SOURCES_MASK, i)).toBe(true));
  });

  test('each source contributes its own creatures', () => {
    const all = listBestiary(ALL_SOURCES_MASK).length;
    const counts = SOURCES.map((_, i) => listBestiary(1 << i).length);
    counts.forEach((n) => expect(n).toBeGreaterThan(0));
    // The files are disjoint, so the parts add up to the whole.
    expect(counts.reduce((a, b) => a + b, 0)).toBe(all);
  });

  test('switching one off removes exactly its creatures', () => {
    const withoutVermin = toggleSource(ALL_SOURCES_MASK, 2);
    expect(isSourceSelected(withoutVermin, 2)).toBe(false);
    expect(listBestiary(withoutVermin).length)
      .toBe(listBestiary(ALL_SOURCES_MASK).length - listBestiary(1 << 2).length);
  });

  test('the last source cannot be switched off', () => {
    // A search of nothing finds nothing, which reads as a bug, not a choice.
    const onlyMonsters = 1;
    expect(toggleSource(onlyMonsters, 0)).toBe(onlyMonsters);
    expect(listBestiary(toggleSource(onlyMonsters, 0)).length).toBeGreaterThan(0);
  });

  test('junk bits are discarded', () => {
    expect(normalizeSourceMask(0)).toBe(ALL_SOURCES_MASK);
    expect(normalizeSourceMask(1 << 20)).toBe(ALL_SOURCES_MASK);
    expect(normalizeSourceMask('nonsense')).toBe(ALL_SOURCES_MASK);
  });

  test('every creature is tagged with the source it came from', () => {
    const keys = new Set(SOURCES.map((s) => s.key));
    listBestiary(ALL_SOURCES_MASK).forEach((c) => expect(keys.has(c.source)).toBe(true));
  });
});

describe('challenge ratings', () => {
  test('every creature in every source has one', () => {
    const missing = listBestiary(ALL_SOURCES_MASK).filter((c) => creatureCr(c) === null);
    expect(missing).toEqual([]);
  });

  test('the scale is ascending and includes the fractional ratings', () => {
    const crs = listChallengeRatings();
    expect(crs.length).toBeGreaterThan(5);
    expect([...crs].sort((a, b) => a - b)).toEqual(crs);
    expect(crs[0]).toBeLessThan(1);
  });

  test('fractions read as fractions', () => {
    expect(formatCr(0.25)).toBe('1/4');
    expect(formatCr(0.3333)).toBe('1/3');
    expect(formatCr(0.5)).toBe('1/2');
    expect(formatCr(7)).toBe('7');
    expect(formatCr(undefined)).toBe('—');
  });
});

describe('filtering', () => {
  test('no filter returns the whole bestiary', () => {
    expect(filterBestiary({}).length).toBe(listBestiary(ALL_SOURCES_MASK).length);
  });

  test('a name narrows to matching names, case-insensitively', () => {
    const matches = filterBestiary({ name: 'dragon' });
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((c) => expect(c.name.toLowerCase()).toContain('dragon'));
    expect(filterBestiary({ name: 'DRAGON' }).length).toBe(matches.length);
  });

  test('a type narrows to that type', () => {
    const type = listCreatureTypes()[0];
    filterBestiary({ type }).forEach((c) => expect(c.type).toBe(type));
  });

  test('a size narrows to that size', () => {
    const matches = filterBestiary({ size: 'Large' });
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((c) => expect(c.size).toBe('Large'));
  });

  test('every size offered actually exists in the data', () => {
    const present = new Set(listBestiary(ALL_SOURCES_MASK).map((c) => c.size));
    const offered = SIZES.filter((s) => present.has(s));
    expect(offered.length).toBeGreaterThan(4);
  });

  test('a CR range excludes both ends correctly', () => {
    const matches = filterBestiary({ crMin: 5, crMax: 8 });
    expect(matches.length).toBeGreaterThan(0);
    matches.forEach((c) => {
      const cr = creatureCr(c);
      expect(cr).toBeGreaterThanOrEqual(5);
      expect(cr).toBeLessThanOrEqual(8);
    });
  });

  test('a collapsed range returns exactly one rating', () => {
    filterBestiary({ crMin: 3, crMax: 3 }).forEach((c) => expect(creatureCr(c)).toBe(3));
  });

  test('filters combine rather than replace each other', () => {
    const matches = filterBestiary({ type: 'Dragon', size: 'Huge', crMin: 10, crMax: 20 });
    matches.forEach((c) => {
      expect(c.type).toBe('Dragon');
      expect(c.size).toBe('Huge');
      expect(creatureCr(c)).toBeGreaterThanOrEqual(10);
      expect(creatureCr(c)).toBeLessThanOrEqual(20);
    });
  });

  test('an impossible combination returns nothing rather than throwing', () => {
    expect(filterBestiary({ name: 'zzzznotacreature' })).toEqual([]);
  });

  test('results are name-sorted', () => {
    const names = filterBestiary({ type: 'Ooze' }).map((c) => c.name);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });
});

describe('terrain buckets', () => {
  test('every bucket matches at least one creature', () => {
    // A bucket that catches nothing is a dead dropdown entry.
    TERRAINS.forEach((terrain) => {
      expect(filterBestiary({ terrain: terrain.key }).length).toBeGreaterThan(0);
    });
  });

  test('a bucket collects every climate of its terrain', () => {
    const forest = filterBestiary({ terrain: 'forest' });
    const climates = new Set(forest.map((c) => c.environment));
    // "Temperate forests", "Warm forests", "Cold forests" all land in one bucket.
    expect(climates.size).toBeGreaterThan(1);
    forest.forEach((c) => expect(c.environment.toLowerCase()).toContain('forest'));
  });

  test('an unknown bucket does not filter anything out', () => {
    expect(matchesTerrain({ environment: 'Underground' }, '')).toBe(true);
    expect(matchesTerrain({ environment: 'Underground' }, 'nonsense')).toBe(true);
  });

  test('a creature with no environment matches only "any bucket"', () => {
    expect(matchesTerrain({}, 'forest')).toBe(false);
    expect(matchesTerrain({}, '')).toBe(true);
  });
});

describe('the random pick', () => {
  test('respects the filters it is given', () => {
    for (let i = 0; i < 40; i += 1) {
      const creature = pickRandomCreature({ type: 'Dragon', crMin: 5, crMax: 10 });
      expect(creature.type).toBe('Dragon');
      expect(creatureCr(creature)).toBeGreaterThanOrEqual(5);
      expect(creatureCr(creature)).toBeLessThanOrEqual(10);
    }
  });

  test('returns null when nothing matches', () => {
    expect(pickRandomCreature({ name: 'zzzznotacreature' })).toBe(null);
  });

  test('does not always return the same creature', () => {
    const seen = new Set();
    for (let i = 0; i < 60; i += 1) seen.add(pickRandomCreature({}).ref);
    expect(seen.size).toBeGreaterThan(1);
  });
});
