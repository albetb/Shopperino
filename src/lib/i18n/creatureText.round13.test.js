import { setLanguage } from './index';
import {
  creatureName, creatureTerm, skillLine, sizeAndType,
  armorClassText, organizationText, creatureDescription,
} from './creatureText';

/* The whole of this file is one stat block: the Adult Tojanida the user was
   reading when they listed what was still English. Every expectation below is
   the Manuale dei Mostri's own wording for that block (p. 35420 of the
   extracted text) rather than a translation written here. */

describe('the Adult Tojanida, in Italian', () => {
  beforeEach(() => setLanguage('it'));
  afterEach(() => setLanguage('en'));

  it('names a creature whose rank is printed in front of it', () => {
    expect(creatureName('Adult Tojanida')).toBe('Tojanida adulto');
    expect(creatureName('Juvenile Tojanida')).toBe('Tojanida giovane');
    expect(creatureName('Elder Tojanida')).toBe('Tojanida anziano');
  });

  it('composes a rank onto a base the pack already knew', () => {
    expect(creatureName('Elder Xorn')).toBe('Xorn anziano');
    expect(creatureName('Greater Shadow')).toBe('Ombra maggiore');
    expect(creatureName('Greater Stone Golem')).toBe('Golem di pietra maggiore');
  });

  it('leaves a colour in front of a name to the pack, not to composition', () => {
    /* "Black Pudding" is a species, not a pudding that happens to be black —
       the pack names it whole, and *nero* never gets moved to the end. A
       colour the pack has not got stays exactly as the SRD prints it. */
    expect(creatureName('Black Pudding')).toBe('Protoplasma nero');
    expect(creatureName('Black Cormorant')).toBe('Black Cormorant');
  });

  it('names the subtypes in the type line', () => {
    expect(sizeAndType('Small Outsider (Extraplanar, Water)'))
      .toBe('Piccolo Esterno (Extraplanare, Acqua)');
  });

  it('reads the armour class the way the manual prints it', () => {
    expect(armorClassText('22 (+1 size, +1 Dex, +10 natural), touch 12, flat-footed 21'))
      .toBe('22 (+1 taglia, +1 Des, +10 naturale), contatto 12, colto alla sprovvista 21');
  });

  it('says what an immunity or a resistance is to, with the article fused', () => {
    expect(creatureTerm('immunity to acid and cold'))
      .toBe("immunità all'acido e al freddo");
    expect(creatureTerm('resistance to electricity 10 and fire 10'))
      .toBe("resistenza all'elettricità 10 e al fuoco 10");
    expect(creatureTerm('Immunity to fire')).toBe('Immunità al fuoco');
    expect(creatureTerm('vulnerability to cold')).toBe('vulnerabilità al freddo');
  });

  it('prints all-around vision as the degrees the manual gives', () => {
    expect(creatureTerm('All-around vision')).toBe('Visione a 360°');
  });

  it('translates what a skill bonus applies to', () => {
    expect(skillLine('Survival +1 (+3 other planes and following tracks)'))
      .toBe('Sopravvivenza +1 (+3 altri piani e seguendo tracce)');
    expect(skillLine('Use Rope +1 (+3 with bindings)'))
      .toBe('Utilizzare Corde +1 (+3 con legami)');
    expect(skillLine('Survival +7 (+9 following tracks, +9 Plane of Air)'))
      .toBe("Sopravvivenza +7 (+9 seguendo tracce, +9 Piano dell'Aria)");
  });

  it('says who the creature is found with', () => {
    expect(organizationText('Solitary or clutch (2-4)'))
      .toBe('solitario o nidiata (2-4)');
    expect(organizationText('Solitary, pair, or pride (6-10)'))
      .toBe('solitario, coppia o branco (6-10)');
  });

  it('keeps the age categories in front of a dragon organization', () => {
    const dragon = organizationText(
      'Wyrmling, very young, young, juvenile, and young adult: solitary or '
      + 'clutch (2-5); adult, mature adult, old, very old, ancient, wyrm, or '
      + 'great wyrm: solitary, pair, or family (1-2 and 2-5 offspring)');
    expect(dragon).toContain('cucciolo, molto giovane, giovane, adolescente');
    expect(dragon).toContain('solitario o nidiata (2-5)');
    expect(dragon).toContain('famiglia (1-2 e 2-5 prole)');
    expect(dragon).not.toMatch(/solitary|clutch|offspring/);
  });

  it('names the heading between a creature\'s two prose blocks', () => {
    expect(creatureDescription('<p>Body</p><p><b>Combat</b></p><p>Tactics</p>'))
      .toBe('<p>Body</p><p><b>Combattimento</b></p><p>Tactics</p>');
  });
});

describe('in English, every one of them is the SRD text', () => {
  it('changes nothing', () => {
    expect(creatureName('Adult Tojanida')).toBe('Adult Tojanida');
    expect(creatureTerm('immunity to acid and cold')).toBe('immunity to acid and cold');
    expect(armorClassText('22 (+1 size, +1 Dex, +10 natural), touch 12, flat-footed 21'))
      .toBe('22 (+1 size, +1 Dex, +10 natural), touch 12, flat-footed 21');
    expect(organizationText('Solitary or clutch (2-4)')).toBe('Solitary or clutch (2-4)');
    expect(skillLine('Use Rope +1 (+3 with bindings)')).toBe('Use Rope +1 (+3 with bindings)');
  });
});
