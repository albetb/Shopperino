/**
 * Druid / ranger animal-companion availability data and advancement math.
 *
 * Source of truth: obsidian-vault/dnd-rules/animal-companion.md.
 *  - The standard list (no adjustment) plus five alternative lists with level
 *    adjustments −3 / −6 / −9 / −12 / −15.
 *  - A creature's `requiredLevel` to be selectable = 1 + |adjustment|
 *    (standard = 1, −3 list = 4, −6 = 7, −9 = 10, −12 = 13, −15 = 16).
 *  - Dinosaurs are excluded: they are not yet present in animals.json (deferred
 *    until the Monster Manual import — see player_sheet_fix_backlog.md).
 *  - The crocodile lives only in the −3 list (errata: the source duplicates it
 *    in the standard aquatic list; this project keeps it at −3 only).
 *
 * All game logic is pure here; no React, no persistence.
 */

import { getAnimalBaseByRef } from './animalsUtils';
import { getClassProgression } from '../player/classProgression';

/**
 * Companion lists keyed by level adjustment. Each entry: { ref, aquatic }.
 * `aquatic` mirrors the ¹ marker in the rules note (available only in an
 * aquatic campaign) — informational, not enforced.
 */
const COMPANION_LISTS = [
  {
    adjustment: 0,
    creatures: [
      { ref: 'animals/badger' },
      { ref: 'animals/camel' },
      { ref: 'animals/dire-rat' },
      { ref: 'animals/dog' },
      { ref: 'animals/dog-riding' },
      { ref: 'animals/eagle' },
      { ref: 'animals/hawk' },
      { ref: 'animals/horse-heavy' },
      { ref: 'animals/horse-light' },
      { ref: 'animals/owl' },
      { ref: 'animals/pony' },
      { ref: 'animals/snake-small-viper' },
      { ref: 'animals/snake-medium-viper' },
      { ref: 'animals/wolf' },
      { ref: 'animals/porpoise', aquatic: true },
      { ref: 'animals/shark-medium', aquatic: true },
      { ref: 'animals/squid', aquatic: true },
    ],
  },
  {
    adjustment: -3,
    creatures: [
      { ref: 'animals/ape' },
      { ref: 'animals/bear-black' },
      { ref: 'animals/bison' },
      { ref: 'animals/boar' },
      { ref: 'animals/cheetah' },
      { ref: 'animals/crocodile', aquatic: true },
      { ref: 'animals/dire-badger' },
      { ref: 'animals/dire-bat' },
      { ref: 'animals/dire-weasel' },
      { ref: 'animals/leopard' },
      { ref: 'animals/lizard-monitor' },
      { ref: 'animals/shark-large', aquatic: true },
      { ref: 'animals/constrictor-snake' },
      { ref: 'animals/snake-large-viper' },
      { ref: 'animals/wolverine' },
    ],
  },
  {
    adjustment: -6,
    creatures: [
      { ref: 'animals/bear-brown' },
      { ref: 'animals/crocodile-giant' },
      { ref: 'animals/dire-ape' },
      { ref: 'animals/dire-boar' },
      { ref: 'animals/dire-wolf' },
      { ref: 'animals/dire-wolverine' },
      { ref: 'animals/lion' },
      { ref: 'animals/rhinoceros' },
      { ref: 'animals/snake-huge-viper' },
      { ref: 'animals/tiger' },
      // Dinosaurs (Deinonychus, Elasmosaurus) excluded — not in animals.json.
    ],
  },
  {
    adjustment: -9,
    creatures: [
      { ref: 'animals/bear-polar' },
      { ref: 'animals/dire-lion' },
      { ref: 'animals/shark-huge', aquatic: true },
      { ref: 'animals/constrictor-snake-giant' },
      { ref: 'animals/orca', aquatic: true },
      // Dinosaur (Megaraptor) excluded — not in animals.json.
    ],
  },
  {
    adjustment: -12,
    creatures: [
      { ref: 'animals/dire-bear' },
      { ref: 'animals/elephant' },
      { ref: 'animals/octopus-giant', aquatic: true },
    ],
  },
  {
    adjustment: -15,
    creatures: [
      { ref: 'animals/dire-shark', aquatic: true },
      { ref: 'animals/dire-tiger' },
      { ref: 'animals/squid-giant', aquatic: true },
      // Dinosaurs (Triceratops, Tyrannosaurus) excluded — not in animals.json.
    ],
  },
];

/**
 * Advancement table indexed by effective druid level (animal-companion.md).
 * `specials` is the FULL cumulative set gained up to and including that band.
 */
const ADVANCEMENT_BANDS = [
  { min: 1, max: 2, bonusHD: 0, naturalArmorAdj: 0, abilityAdj: 0, bonusTricks: 1, gained: ['Link', 'Share spells'] },
  { min: 3, max: 5, bonusHD: 2, naturalArmorAdj: 2, abilityAdj: 1, bonusTricks: 2, gained: ['Evasion'] },
  { min: 6, max: 8, bonusHD: 4, naturalArmorAdj: 4, abilityAdj: 2, bonusTricks: 3, gained: ['Devotion'] },
  { min: 9, max: 11, bonusHD: 6, naturalArmorAdj: 6, abilityAdj: 3, bonusTricks: 4, gained: ['Multiattack'] },
  { min: 12, max: 14, bonusHD: 8, naturalArmorAdj: 8, abilityAdj: 4, bonusTricks: 5, gained: [] },
  { min: 15, max: 17, bonusHD: 10, naturalArmorAdj: 10, abilityAdj: 5, bonusTricks: 6, gained: ['Improved evasion'] },
  { min: 18, max: 20, bonusHD: 12, naturalArmorAdj: 12, abilityAdj: 6, bonusTricks: 7, gained: [] },
];

/** Pretty creature name from an "animals/<slug>" ref, falling back to the slug. */
function nameForRef(ref) {
  const base = getAnimalBaseByRef(ref);
  if (base?.name) return base.name;
  return String(ref || '')
    .replace(/^animals\//, '')
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** requiredLevel for a level adjustment: 1 + |adjustment|. */
function requiredLevelFor(adjustment) {
  return 1 + Math.abs(adjustment);
}

/**
 * Effective druid level driving every companion characteristic.
 *
 * Both halves come from `progression`: `animalCompanionLevel` is the class
 * level the companion arrives at, and `animalCompanionLevelDivisor` is what
 * the level is divided by afterwards. So a druid is 1 and undivided, a ranger
 * is 4 and halved — first companion at ranger 4, at effective level 2. A class
 * with no `animalCompanionLevel` has no companion (effective level 0).
 *
 * Reading the gate rather than only the divisor also settles a ranger of 3rd:
 * halving alone made her effective level 1, which is a companion three levels
 * before the class grants one.
 */
export function effectiveCompanionLevel({ class: className, level } = {}) {
  const lvl = Math.max(0, Math.floor(Number(level) || 0));
  const progression = getClassProgression(className);
  const gainedAt = Number(progression.animalCompanionLevel);
  if (!Number.isFinite(gainedAt) || lvl < gainedAt) return 0;
  const divisor = Number(progression.animalCompanionLevelDivisor) || 1;
  return Math.floor(lvl / divisor);
}

/**
 * The level adjustment for a creature ref (0 for the standard list, negative
 * for an alternative list). Returns null if the ref is on no list.
 */
export function getCompanionAdjustment(ref) {
  const want = String(ref || '').trim();
  for (const list of COMPANION_LISTS) {
    if (list.creatures.some((c) => c.ref === want)) return list.adjustment;
  }
  return null;
}

/**
 * Every creature selectable at the given effective druid level, as
 * { ref, name, adjustment, aquatic, requiredLevel, label }. A creature is
 * selectable when requiredLevel (= 1 + |adjustment|) ≤ effectiveLevel, which
 * is equivalent to (effectiveLevel + adjustment) ≥ 1. The label appends the
 * adjustment for alternative-list creatures, e.g. "Crocodile (-3lv)".
 */
export function getSelectableCompanions(effectiveLevel) {
  const eff = Math.max(0, Math.floor(Number(effectiveLevel) || 0));
  const out = [];
  for (const list of COMPANION_LISTS) {
    const requiredLevel = requiredLevelFor(list.adjustment);
    if (eff < requiredLevel) continue;
    for (const c of list.creatures) {
      const name = nameForRef(c.ref);
      const label = list.adjustment === 0 ? name : `${name} (${list.adjustment}lv)`;
      out.push({
        ref: c.ref,
        name,
        adjustment: list.adjustment,
        aquatic: !!c.aquatic,
        requiredLevel,
        label,
      });
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Advancement adjustments for an effective druid level:
 * { bonusHD, naturalArmorAdj, abilityAdj, bonusTricks, specials }.
 * `specials` is the cumulative list of special abilities gained so far.
 * Below level 1 returns the zero band with no specials.
 */
export function getCompanionAdvancement(effectiveLevel) {
  const eff = Math.floor(Number(effectiveLevel) || 0);
  if (eff < 1) {
    return { bonusHD: 0, naturalArmorAdj: 0, abilityAdj: 0, bonusTricks: 0, specials: [] };
  }
  const clamped = Math.min(eff, 20);
  const specials = [];
  let current = ADVANCEMENT_BANDS[0];
  for (const band of ADVANCEMENT_BANDS) {
    if (clamped >= band.min) {
      specials.push(...band.gained);
      current = band; // bands ascend, so the last satisfied band wins
    }
  }
  return {
    bonusHD: current.bonusHD,
    naturalArmorAdj: current.naturalArmorAdj,
    abilityAdj: current.abilityAdj,
    bonusTricks: current.bonusTricks,
    specials,
  };
}
