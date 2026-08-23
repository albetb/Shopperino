import Player from './player';
import { listDeities, getDeityByName, isWithinOneStep, formatDeityAlignment } from '../deityData';

/** A player with a class, level and alignment already set. */
function make(className, { ethical = 'Neutral', moral = 'Neutral', deity = '', domain1 = '', domain2 = '' } = {}) {
  const p = new Player('Tester');
  p.setClass(className);
  p.setLevel(5);
  p.ethicalAlignment = ethical;
  p.moralAlignment = moral;
  p.domain1 = domain1;
  p.domain2 = domain2;
  p.setDeity(deity);
  return p;
}

const codes = (player) => player.getAlignmentWarnings().map((w) => w.code);

describe('deity data', () => {
  test('the table holds the 21 core deities, each with an alignment and domains', () => {
    const deities = listDeities();
    expect(deities).toHaveLength(21);
    deities.forEach((d) => {
      expect(typeof d.name).toBe('string');
      expect(['Lawful', 'Neutral', 'Chaotic']).toContain(d.ethical);
      expect(['Good', 'Neutral', 'Evil']).toContain(d.moral);
      expect(d.domains.length).toBeGreaterThan(0);
    });
  });

  test('lookup is case-insensitive and returns null for a homebrew patron', () => {
    expect(getDeityByName('pelor').name).toBe('Pelor');
    expect(getDeityByName('  HEIRONEOUS ').name).toBe('Heironeous');
    expect(getDeityByName('The Nameless One')).toBeNull();
    expect(getDeityByName('')).toBeNull();
  });

  test('a fully neutral deity reads as "Neutral", not "Neutral Neutral"', () => {
    expect(formatDeityAlignment(getDeityByName('Boccob'))).toBe('Neutral');
    expect(formatDeityAlignment(getDeityByName('Wee Jas'))).toBe('Lawful Neutral');
  });

  test('one step means at most one axis, off by at most one position', () => {
    const heironeous = getDeityByName('Heironeous'); // Lawful Good
    expect(isWithinOneStep(heironeous, 'Lawful', 'Good')).toBe(true);   // identical
    expect(isWithinOneStep(heironeous, 'Neutral', 'Good')).toBe(true);  // one axis, one position
    expect(isWithinOneStep(heironeous, 'Lawful', 'Neutral')).toBe(true);
    expect(isWithinOneStep(heironeous, 'Neutral', 'Neutral')).toBe(false); // both axes off
    expect(isWithinOneStep(heironeous, 'Chaotic', 'Good')).toBe(false);    // two positions
    expect(isWithinOneStep(heironeous, 'Chaotic', 'Evil')).toBe(false);
  });

  test('an unknown deity is treated as compatible — nothing to compare against', () => {
    expect(isWithinOneStep(null, 'Chaotic', 'Evil')).toBe(true);
  });
});

describe('Player deity field', () => {
  test('only divine classes are asked for a deity', () => {
    ['Cleric', 'Druid', 'Paladin', 'Ranger'].forEach((c) => {
      expect(make(c).usesDeity()).toBe(true);
    });
    ['Wizard', 'Sorcerer', 'Fighter', 'Rogue', 'Bard', 'Barbarian', 'Monk'].forEach((c) => {
      expect(make(c).usesDeity()).toBe(false);
    });
  });

  test('the name is trimmed and survives a serialize/load round trip', () => {
    const p = make('Cleric');
    p.setDeity('  Pelor  ');
    expect(p.getDeity()).toBe('Pelor');

    const revived = new Player().load(p.serialize());
    expect(revived.getDeity()).toBe('Pelor');
    expect(revived.getDeityData().name).toBe('Pelor');
  });

  test('a known deity exposes its alignment and granted domains', () => {
    const p = make('Cleric', { deity: 'Moradin' });
    expect(p.getDeityAlignment()).toBe('Lawful Good');
    expect(p.getDeityDomains()).toEqual(['Earth', 'Good', 'Law', 'Protection']);
  });

  test('a homebrew patron is stored but exposes no derived data', () => {
    const p = make('Cleric', { deity: 'The Nameless One' });
    expect(p.getDeity()).toBe('The Nameless One');
    expect(p.getDeityData()).toBeNull();
    expect(p.getDeityAlignment()).toBe('');
    expect(p.getDeityDomains()).toEqual([]);
  });
});

describe('deity alignment drift warning', () => {
  test('a cleric within one step of their deity is not flagged', () => {
    const p = make('Cleric', { ethical: 'Neutral', moral: 'Good', deity: 'Heironeous' });
    expect(codes(p)).not.toContain('deityAlignmentDrift');
  });

  test('a cleric two steps away is flagged, naming both alignments', () => {
    const p = make('Cleric', { ethical: 'Chaotic', moral: 'Evil', deity: 'Heironeous' });
    const warning = p.getAlignmentWarnings().find((w) => w.code === 'deityAlignmentDrift');
    expect(warning).toBeDefined();
    expect(warning.message).toContain('Chaotic Evil');
    expect(warning.message).toContain('Heironeous');
    expect(warning.message).toContain('Lawful Good');
  });

  test('drifting on both axes by one position each still breaks the rule', () => {
    // True Neutral is one position from Lawful and one from Good — but that is
    // two axes, which the SRD does not allow.
    const p = make('Cleric', { ethical: 'Neutral', moral: 'Neutral', deity: 'Heironeous' });
    expect(codes(p)).toContain('deityAlignmentDrift');
  });

  test('no deity means no drift warning', () => {
    const p = make('Cleric', { ethical: 'Chaotic', moral: 'Evil' });
    expect(codes(p)).not.toContain('deityAlignmentDrift');
  });

  test('a homebrew patron is never flagged for drift', () => {
    const p = make('Cleric', { ethical: 'Chaotic', moral: 'Evil', deity: 'The Nameless One' });
    expect(codes(p)).not.toContain('deityAlignmentDrift');
  });

  test('the rule is cleric-only — a druid keeps a deity without drifting', () => {
    const p = make('Druid', { ethical: 'Neutral', moral: 'Good', deity: 'Heironeous' });
    expect(codes(p)).not.toContain('deityAlignmentDrift');
  });
});

describe('deity domain warning', () => {
  test('domains the deity grants are accepted', () => {
    const p = make('Cleric', {
      ethical: 'Lawful', moral: 'Good', deity: 'Moradin', domain1: 'Earth', domain2: 'Law',
    });
    expect(codes(p)).not.toContain('deityDomainNotGranted');
  });

  test('a domain outside the deity list is flagged once per offending domain', () => {
    const p = make('Cleric', {
      ethical: 'Lawful', moral: 'Good', deity: 'Moradin', domain1: 'Fire', domain2: 'Travel',
    });
    const flagged = p.getAlignmentWarnings().filter((w) => w.code === 'deityDomainNotGranted');
    expect(flagged).toHaveLength(2);
    expect(flagged[0].message).toContain('Fire');
    expect(flagged[1].message).toContain('Travel');
  });

  test('an unchosen domain slot is not flagged', () => {
    const p = make('Cleric', {
      ethical: 'Lawful', moral: 'Good', deity: 'Moradin', domain1: 'Earth', domain2: '',
    });
    expect(codes(p)).not.toContain('deityDomainNotGranted');
  });

  test('a homebrew patron grants nothing, so nothing is checked', () => {
    const p = make('Cleric', {
      ethical: 'Lawful', moral: 'Good', deity: 'The Nameless One', domain1: 'Fire', domain2: 'Travel',
    });
    expect(codes(p)).not.toContain('deityDomainNotGranted');
  });

  test('only the cleric has domains tied to a deity', () => {
    const p = make('Paladin', {
      ethical: 'Lawful', moral: 'Good', deity: 'Moradin', domain1: 'Fire',
    });
    expect(codes(p)).not.toContain('deityDomainNotGranted');
  });
});
