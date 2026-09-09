import {
  creatureName, creatureTerm, skillLine, featName, sizeAndType,
  splitList, alignmentText, environmentText, treasureText, advancementText,
} from './creatureText';
import { setLanguage } from './index';

/* A stat block is almost entirely names, and a name carries a number the
   vocabulary does not own — "darkvision 60 ft.", "Listen +16", "9-16 HD
   (Large)". Splitting the word from the number is what lets one pack entry
   cover every creature that has the quality, so it is what these hold. */

afterEach(() => setLanguage('en'));

describe('English changes nothing', () => {
  test('every reader sees what the SRD prints', () => {
    expect(creatureName('Aboleth')).toBe('Aboleth');
    expect(creatureTerm('darkvision 60 ft.')).toBe('darkvision 60 ft.');
    expect(skillLine('Listen +16')).toBe('Listen +16');
    expect(sizeAndType('Huge Aberration (Aquatic)')).toBe('Huge Aberration (Aquatic)');
  });
});

describe('a stat block in Italian', () => {
  test('the creature is named from the pack', () => {
    setLanguage('it');
    expect(creatureName('Mummy')).toBe('Mummia');
    expect(creatureName('Iron Golem')).toBe('Golem di ferro');
  });

  test('a composite name is two lookups, not one', () => {
    setLanguage('it');
    /* Ten dragons across thirteen age categories is 130 names built from 23
       words — which is the only reason the bestiary is coverable at all. */
    expect(creatureName('Red Dragon, Wyrmling')).toBe('Drago rosso, cucciolo');
    expect(creatureName('Gold Dragon, Great Wyrm')).toBe("Drago d'oro, grande dragone");
    expect(creatureName('Monstrous Spider, Huge')).toBe('Ragno mostruoso, enorme');
    expect(creatureName('Bear, Black')).toBe('Orso, nero');
  });

  test('a whole name wins over splitting it', () => {
    setLanguage('it');
    /* A bat swarm is one creature, not a bat with a qualifier. */
    expect(creatureName('Bat Swarm')).toBe('Sciame di pipistrelli');
  });

  test('an unknown base is left whole rather than half-translated', () => {
    setLanguage('it');
    expect(creatureName('Nonesuch, Huge')).toBe('Nonesuch, Huge');
  });

  test('a name the pack has not got stays as the manuals print it', () => {
    setLanguage('it');
    expect(creatureName('Achaierai')).toBe('Achaierai');
  });

  test('a quality keeps its rating and translates its words', () => {
    setLanguage('it');
    /* One pack entry, "darkvision", answers for every creature that has it at
       any distance — which is the whole reason the number is split off. */
    expect(creatureTerm('Improved grab')).toBe('Afferrare migliorato');
    expect(creatureTerm('Spell resistance 19')).toMatch(/ 19$/);
  });

  test('a skill line keeps its modifier', () => {
    setLanguage('it');
    expect(skillLine('Listen +16')).toBe('Ascoltare +16');
    expect(skillLine('Knowledge (arcana) +11')).toBe('Conoscenze (arcane) +11');
  });

  test('a feat keeps what it was taken in', () => {
    setLanguage('it');
    /* The parenthetical names the creature's own attack, not a feat. */
    expect(featName('Weapon Focus (claw)')).toBe('Arma Focalizzata (claw)');
    expect(featName('Alertness')).toBe('Allerta');
  });

  test('size, type and subtypes are three separate tables', () => {
    setLanguage('it');
    expect(sizeAndType('Huge Aberration (Aquatic)'))
      .toBe('Enorme Aberrazione (Acquatico)');
  });

  test('the three tail pills', () => {
    setLanguage('it');
    expect(alignmentText('Always chaotic evil')).toBe('Sempre caotico malvagio');
    expect(environmentText('Temperate forests')).toBe('Foreste temperate');
    expect(treasureText('Triple standard')).toBe('Triplo standard');
  });

  test('advancement converts the abbreviation and the sizes, not the numbers', () => {
    setLanguage('it');
    expect(advancementText('9-16 HD (Large); 17-24 HD (Huge)'))
      .toBe('9-16 DV (Grande); 17-24 DV (Enorme)');
    expect(advancementText('By character class')).toBe('Per classe del personaggio');
    expect(advancementText('-')).toBe('-');
  });
});

describe('splitting a joined list', () => {
  test('a comma inside a parenthesis is not a separator', () => {
    /* Five entries in the three creature files carry one, and cutting there
       would hand the pack two halves of a sentence. */
    expect(splitList('Survival +7 (+9 following tracks, +9 Plane of Air), Listen +5'))
      .toEqual(['Survival +7 (+9 following tracks, +9 Plane of Air)', 'Listen +5']);
  });

  test('an ordinary list splits on every comma', () => {
    expect(splitList('Enslave, psionics, slime'))
      .toEqual(['Enslave', 'psionics', 'slime']);
  });
});
