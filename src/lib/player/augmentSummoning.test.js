import Player from './player';
import { loadFile } from '../loadFile';
import {
  isAugmentableSummon,
  NON_CREATURE_SUMMONS,
  AUGMENT_SUMMONING_BONUS,
} from './augmentSummoning';

/* Augment Summoning raises what a spell brings, not the spell itself, so it
 * has no number on the sheet to change — it is a note on the spells it affects
 * and a change to the creature they conjure.
 *
 * Which spells is the part worth guarding. The feat says "any summon spell",
 * which means the Summoning **subschool** and not spells whose name starts
 * with "Summon" — that reading catches Mount and Insect plague, and it is also
 * the only one that has to exclude the three spells that summon an object.
 */

const spells = () => loadFile('spells');
const byName = (name) => spells().find((s) => s.Name === name);

function caster(feats = ['Augment summoning'], cls = 'Wizard', level = 12) {
  const p = new Player();
  p.setRace('Human');
  p.setClass(cls);
  p.setLevel(level);
  feats.forEach((f) => p.addFeat(f));
  return p;
}

describe('which spells the feat reaches', () => {
  test('the subschool matches 28 spells and three of them summon no creature', () => {
    const subschool = spells().filter((s) => /\(summoning\)/i.test(s.School || ''));
    expect(subschool).toHaveLength(28);
    const augmentable = subschool.filter(isAugmentableSummon);
    expect(augmentable).toHaveLength(28 - NON_CREATURE_SUMMONS.length);
    expect(augmentable).toHaveLength(25);
  });

  test('the three exclusions are real spells, and each is excluded', () => {
    NON_CREATURE_SUMMONS.forEach((name) => {
      const spell = byName(name);
      expect(spell).toBeTruthy();
      expect(/\(summoning\)/i.test(spell.School)).toBe(true);
      expect(isAugmentableSummon(spell)).toBe(false);
    });
  });

  test('the ones with no "summon" in the name are included', () => {
    // The whole reason the subschool is the test rather than the name.
    ['Mount', 'Insect Plague', 'Creeping Doom', 'Elemental Swarm', 'Storm of Vengeance']
      .forEach((name) => expect(isAugmentableSummon(byName(name))).toBe(true));
  });

  test('every Summon monster and Summon nature’s ally is included', () => {
    const summons = spells().filter((s) => /^Summon (Monster|Nature)/i.test(s.Name));
    expect(summons).toHaveLength(18);
    summons.forEach((s) => expect(isAugmentableSummon(s)).toBe(true));
  });

  test('a conjuration that is not summoning is not touched', () => {
    expect(isAugmentableSummon(byName('Teleport'))).toBe(false);
    expect(isAugmentableSummon(byName('Cure Light Wounds'))).toBe(false);
    expect(isAugmentableSummon(null)).toBe(false);
    expect(isAugmentableSummon('Conjuration (Summoning)')).toBe(true);
  });
});

describe('what the model reports', () => {
  test('nothing at all without the feat', () => {
    const p = caster([]);
    expect(p.hasAugmentSummoning()).toBe(false);
    expect(p.getAugmentSummoningEffect(byName('Summon Monster III'))).toBe(null);
  });

  test('the bonus, its type, and the two scores it raises', () => {
    const p = caster();
    const effect = p.getAugmentSummoningEffect(byName('Summon Monster III'));
    expect(effect.bonus).toBe(AUGMENT_SUMMONING_BONUS);
    expect(effect.bonus).toBe(4);
    expect(effect.abilities).toEqual(['str', 'con']);
    expect(effect.type).toBe('enhancement');
  });

  test('and nothing for a summoning spell that brings no creature', () => {
    const p = caster();
    expect(p.getAugmentSummoningEffect(byName('Secret Chest'))).toBe(null);
    expect(p.getAugmentSummoningEffect(byName('Fireball'))).toBe(null);
  });

  test('the returned abilities cannot be mutated back into the constant', () => {
    const p = caster();
    p.getAugmentSummoningEffect(byName('Mount')).abilities.push('dex');
    expect(p.getAugmentSummoningEffect(byName('Mount')).abilities).toEqual(['str', 'con']);
  });
});
