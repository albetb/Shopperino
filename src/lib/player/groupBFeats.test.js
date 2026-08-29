import Player from './player';
import { loadFile } from '../loadFile';
import { sumContributions } from './contributions';
import { spellResistanceInfo, spellResistanceApplies } from '../spellbook/spellsUtils';

/* The last two things in the feat audit: the caster level check that Spell
 * penetration raises, and the attacks-of-opportunity allowance that Combat
 * reflexes raises. Both feats read as unmapped for the same reason — the
 * number they modify was never displayed, not that it could not be computed.
 */

function caster(feats = [], cls = 'Wizard', level = 9) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

describe('reading the Spell Resistance field', () => {
  const spells = () => loadFile('spells');
  const byName = (name) => spells().find((s) => s.Name === name);

  test('it is not a boolean, and the naive test would miss a hundred spells', () => {
    const all = spells();
    const naive = all.filter((s) => s['Spell Resistance'] === 'Yes');
    const honest = all.filter(spellResistanceApplies);
    expect(naive).toHaveLength(173);
    expect(honest).toHaveLength(277);
  });

  test('every "yes" variant counts, however it is qualified', () => {
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes' }).applies).toBe(true);
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes (harmless)' }).applies).toBe(true);
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes (object)' }).applies).toBe(true);
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes; see text' }).applies).toBe(true);
    // Both answers appear, so resistance can apply and the spell decides.
    expect(spellResistanceInfo({ 'Spell Resistance': 'No or Yes (harmless)' }).applies).toBe(true);
  });

  test('and "no" or a missing field does not', () => {
    expect(spellResistanceInfo({ 'Spell Resistance': 'No' }).applies).toBe(false);
    expect(spellResistanceInfo({ 'Spell Resistance': 'See text' }).applies).toBe(false);
    expect(spellResistanceInfo({}).applies).toBe(false);
    expect(spellResistanceInfo(null).applies).toBe(false);
  });

  test('the qualifier is reported rather than swallowed', () => {
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes' }).qualifier).toBe('');
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes (harmless)' }).qualifier).toBe('harmless');
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes (object)' }).qualifier).toBe('object');
    expect(spellResistanceInfo({ 'Spell Resistance': 'Yes; see text' }).qualifier).toBe('conditional');
    expect(spellResistanceInfo({ 'Spell Resistance': 'No or Yes (harmless)' }).qualifier).toBe('conditional');
  });

  test('real spells land where they should', () => {
    expect(spellResistanceApplies(byName('Fireball'))).toBe(true);
    expect(spellResistanceApplies(byName('Summon Monster III'))).toBe(false);
  });
});

describe('the caster level check', () => {
  test('a caster with no feat rolls against their caster level alone', () => {
    const p = caster();
    expect(p.getSpellPenetrationBonus()).toBe(0);
    expect(p.getCasterLevelCheck()).toBe(9);
  });

  test('Spell penetration is +2 and Greater stacks with it for +4', () => {
    expect(caster(['Spell penetration']).getSpellPenetrationBonus()).toBe(2);
    expect(caster(['Greater spell penetration']).getSpellPenetrationBonus()).toBe(2);
    const both = caster(['Spell penetration', 'Greater spell penetration']);
    expect(both.getSpellPenetrationBonus()).toBe(4);
    expect(both.getCasterLevelCheck()).toBe(13);
  });

  test('a non-caster has no check at all, feat or no feat', () => {
    const fighter = caster(['Spell penetration'], 'Fighter', 9);
    expect(fighter.getCasterLevel()).toBe(0);
    expect(fighter.getCasterLevelCheck()).toBe(0);
    expect(fighter.getCasterLevelCheckContributions()).toEqual([]);
  });

  test('a hybrid caster checks with half their level, as they cast with', () => {
    const ranger = caster(['Spell penetration'], 'Ranger', 10);
    expect(ranger.getCasterLevel()).toBe(5);
    expect(ranger.getCasterLevelCheck()).toBe(7);
  });

  test('the breakdown sums to the number beside it', () => {
    const p = caster(['Spell penetration', 'Greater spell penetration']);
    const rows = p.getCasterLevelCheckContributions();
    expect(sumContributions(rows)).toBe(p.getCasterLevelCheck());
    expect(rows.find((r) => r.source === 'feats').value).toBe(4);
  });

  test('no feat means no feat row, rather than a row of zero', () => {
    const rows = caster().getCasterLevelCheckContributions();
    expect(rows.map((r) => r.source)).toEqual(['casterLevel']);
  });
});

describe('attacks of opportunity', () => {
  const fighter = (feats = [], dex = 14) => {
    const p = caster(feats, 'Fighter', 6);
    p.setAbilityBase('dex', dex);
    return p;
  };

  test('everyone gets one', () => {
    expect(fighter().getAttacksOfOpportunity()).toBe(1);
  });

  test('Combat reflexes adds the Dexterity bonus on top', () => {
    const p = fighter(['Combat reflexes']);
    expect(p.getDexMod()).toBe(2);
    expect(p.getAttacksOfOpportunity()).toBe(3);
  });

  test('a Dexterity penalty takes nothing away — the feat only ever adds', () => {
    const clumsy = fighter(['Combat reflexes'], 6);
    expect(clumsy.getDexMod()).toBe(-2);
    expect(clumsy.getAttacksOfOpportunity()).toBe(1);
  });

  test('the feat with no Dexterity bonus still grants the flat-footed clause', () => {
    const p = fighter(['Combat reflexes'], 10);
    expect(p.getAttacksOfOpportunity()).toBe(1);
    const notes = p.getSituationalContributions('attacksOfOpportunity');
    expect(notes).toHaveLength(1);
    expect(notes[0].note).toContain('flat-footed');
  });

  test('and a character without the feat has nothing situational to say', () => {
    expect(fighter().getSituationalContributions('attacksOfOpportunity')).toEqual([]);
  });

  test('the breakdown sums to the allowance', () => {
    const p = fighter(['Combat reflexes']);
    const rows = p.getAttacksOfOpportunityContributions();
    expect(sumContributions(rows)).toBe(p.getAttacksOfOpportunity());
    expect(rows.find((r) => r.source === 'feats').value).toBe(2);
  });

  test('without the feat the breakdown is the one everybody has', () => {
    const rows = fighter().getAttacksOfOpportunityContributions();
    expect(rows.map((r) => r.source)).toEqual(['base']);
  });
});
