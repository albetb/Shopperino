import {
  creatureName, creatureTerm, skillLine, featName, sizeAndType,
  splitList, alignmentText, environmentText, treasureText, advancementText,
  attackName, attackLine, damageText, speedText, spaceReachText,
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

describe('the attack line', () => {
  /* `attack` and `fullAttack` stay exactly as the SRD writes them, because
     attackParser reads them back for companions, familiars, special mounts and
     wild shape. Only the display changes — the same answer an item's name got.
     The shape below is the Manuale dei Mostri's own:
         morso +4 in mischia (4d6+2 più veleno) */

  afterEach(() => setLanguage('en'));

  test('English is untouched, whatever the reader is reading', () => {
    expect(attackLine('Bite +12 melee (2d6+12)')).toBe('Bite +12 melee (2d6+12)');
  });

  test('one segment: name, bonus, mode, damage', () => {
    setLanguage('it');
    expect(attackLine('Bite +12 melee (2d6+12)'))
      .toBe('morso +12 in mischia (2d6+12)');
  });

  test('a count, a plural and a rider', () => {
    setLanguage('it');
    expect(attackLine('4 tentacles +12 melee (1d6+8 plus slime)'))
      .toBe('4 tentacoli +12 in mischia (1d6+8 più melma)');
  });

  test('two segments and the word between them', () => {
    setLanguage('it');
    expect(attackLine('Claw +8 melee (1d6+6) and bite +3 melee (1d8+3)'))
      .toBe('artiglio +8 in mischia (1d6+6) e morso +3 in mischia (1d8+3)');
    expect(attackLine('Gore +5 melee (1d8+4) or rock +2 ranged (2d6+4)'))
      .toBe('corno +5 in mischia (1d8+4) o roccia +2 a distanza (2d6+4)');
  });

  test('a manufactured weapon is named from the item pack', () => {
    setLanguage('it');
    expect(attackLine('Longsword +9 melee (1d8+4)'))
      .toBe('spada lunga +9 in mischia (1d8+4)');
    expect(attackLine('Light crossbow +6 ranged (1d8)'))
      .toBe('balestra leggera +6 a distanza (1d8)');
  });

  test('a touch attack keeps the manual’s two-word mode', () => {
    setLanguage('it');
    expect(attackLine('Incorporeal touch +3 melee touch (1d4)'))
      .toBe('tocco incorporeo +3 contatto in mischia (1d4)');
  });

  test('an adjective in front of a weapon is translated with it', () => {
    setLanguage('it');
    /* Its own entry, not an adjective composed onto a noun: Italian puts the
       adjective after, so composing would give "fattura perfetta arco lungo". */
    expect(attackName('masterwork longbow')).toBe('arco lungo perfetto');
    expect(attackName('Huge greataxe')).toBe('ascia bipenne enorme');
  });

  test('a segment the shape does not fit comes back as the SRD wrote it', () => {
    setLanguage('it');
    expect(attackLine('-')).toBe('-');
    expect(attackName('flurbish')).toBe('flurbish');
  });

  test('the damage rider is named, the dice are not', () => {
    setLanguage('it');
    expect(damageText('2d6+9 plus poison')).toBe('2d6+9 più veleno');
    expect(damageText('1d6+4 plus 1d6 fire')).toBe('1d6+4 più 1d6 fuoco');
    expect(damageText('1d8+5')).toBe('1d8+5');
  });
});

describe('the two pills beside the attacks', () => {
  afterEach(() => setLanguage('en'));

  test('the speed line names its modes and leaves every measurement alone', () => {
    setLanguage('it');
    /* "ft" has to survive: the unit converter runs after this and rewrites it. */
    expect(speedText('40 ft., fly 150 ft. (poor), swim 40 ft.'))
      .toBe('40 ft., volare 150 ft. (scarsa), nuotare 40 ft.');
    expect(speedText('30 ft. (6 squares)')).toBe('30 ft. (6 quadretti)');
  });

  test('space and reach names the attack a longer reach belongs to', () => {
    setLanguage('it');
    expect(spaceReachText('15 ft./10 ft. (15 ft. with bite)'))
      .toBe('15 ft./10 ft. (15 ft. con morso)');
  });
});
