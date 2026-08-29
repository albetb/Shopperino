import { loadFile } from '../loadFile';
import { getTrapTables } from './trapData';
import { trapCR, isMagicTrap } from './trapCR';

/**
 * Rolling a trap to a target Challenge Rating.
 *
 * The composer works the way the rules do, and in the order that makes the
 * target reachable: start from the cheapest version of a shape, **spend** the
 * CR budget on features while any is left, and put whatever remains into
 * damage — the one element that scales continuously, at one CR per 7 average
 * points. So the roll lands on the target by construction rather than by
 * rolling until something fits, and the breakdown box shows exactly where the
 * budget went.
 *
 * Building the other way round — roll every feature, then hope — overshoots
 * badly at the low end, where a single +5 for a flooding room is five times a
 * CR 1 trap's whole budget.
 *
 * `Math.random()` throughout, deliberately. The seeded generator in
 * [prng.js](../prng.js) exists so a shop can round-trip through a QR code; a
 * rolled trap is thrown away when the next one is rolled, and reusing the
 * seeded generator by reflex is the easy mistake here.
 */

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const between = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const chance = (p) => Math.random() < p;

/** Triggers a mechanism can actually use — sound and visual are magic only. */
const MECHANICAL_TRIGGERS = ['location', 'proximity', 'touch', 'timed'];
const MAGIC_TRIGGERS = ['location', 'proximity', 'touch', 'timed', 'sound', 'visual'];

const RANGED_WEAPONS = ['arrow', 'dart', 'bolt', 'needle', 'javelin', 'spear'];
const MELEE_PARTS = ['scythe blade', 'falling block', 'pendulum', 'wall spikes', 'hammer'];

const DICE_FACES = [4, 6, 8, 10];

/**
 * Dice whose average is as close as possible to `target`.
 *
 * @returns {string} e.g. "6d6"
 */
export function diceForAverage(target) {
  const want = Math.max(1, Number(target) || 1);
  let best = null;
  DICE_FACES.forEach((faces) => {
    const per = (faces + 1) / 2;
    const count = Math.max(1, Math.round(want / per));
    const error = Math.abs(count * per - want);
    if (!best || error < best.error) best = { faces, count, error };
  });
  return `${best.count}d${best.faces}`;
}

/** The CR of everything except the damage line and the CR 1 floor. */
function featureCR(trap) {
  return trapCR(trap).parts
    .filter((p) => p.key !== 'damage' && p.key !== 'floor')
    .reduce((sum, p) => sum + p.cr, 0);
}

function cap(text) {
  const s = String(text || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rollMechanical(targetCR) {
  const tables = getTrapTables();
  const poisons = tables.crModifiers?.mechanical?.poison || {};
  const bypasses = tables.bypasses || [];

  /* The cheapest version of the trap: DCs in the free band, an attack bonus in
     the free band, nothing optional. Every one of those lines is worth 0 CR,
     so the whole budget is still unspent. */
  const trap = {
    name: '',
    type: 'mechanical',
    trigger: { type: pick(MECHANICAL_TRIGGERS) },
    reset: pick(['no', 'repair', 'manual', 'manual', 'automatic']),
    searchDC: between(18, 24),
    disableDeviceDC: between(18, 24),
  };

  /* A flooding room is +5 before anything else happens, so it is only on the
     menu once the target can pay for it. */
  const shapes = ['attack', 'attack', 'pit'];
  if (targetCR >= 6) shapes.push('flood');
  if (targetCR >= 2) shapes.push('crush');
  const shape = pick(shapes);

  if (shape === 'attack') {
    const ranged = chance(0.6);
    trap.attacks = [{ bonus: between(6, 14), mode: ranged ? 'ranged' : 'melee', damage: '1' }];
    if (ranged) trap.attacks[0].weapon = pick(RANGED_WEAPONS);
    trap.name = ranged ? `${cap(trap.attacks[0].weapon)} trap` : `${cap(pick(MELEE_PARTS))} trap`;
  } else if (shape === 'pit') {
    trap.save = { type: 'Reflex', dc: between(16, 24), result: 'avoids' };
    trap.pit = { depthFt: 10, fallDamage: '1d6' };
    trap.name = 'Pit trap';
  } else {
    trap.neverMiss = true;
    /* Never miss always carries an onset delay, and a long one is the cheap
       choice: 4 rounds or more is worth -1 CR. */
    trap.onsetDelayRounds = 4;
    trap.multipleTargets = 'all targets in the room';
    trap.footprint = { kind: 'room', widthFt: 10, lengthFt: 10, squares: 4 };
    if (shape === 'flood') {
      trap.liquid = true;
      trap.effect = { kind: 'drowning' };
      trap.name = 'Flooding room trap';
    } else {
      trap.effect = { kind: 'crushing', damage: '1d6' };
      trap.name = 'Crushing room trap';
    }
  }

  if (!trap.footprint) {
    trap.footprint = chance(0.3)
      ? { kind: 'squares', squares: 2, layout: 'adjacent' }
      : { kind: 'single', squares: 1 };
  }

  /* The upgrades the budget can be spent on, each with what it costs in CR.
     They are offered at random while budget remains — and then, if the shape
     cannot deliver the damage the rest of the budget implies, taken in order
     until it can. A pit is the case that forces it: the deepest pit in the
     rules is 100 feet, which is 10d6, which is +5 and no more. */
  const upgrades = [
    { cost: 1, when: () => trap.searchDC < 25, apply: () => { trap.searchDC = between(25, 29); } },
    { cost: 1, when: () => trap.disableDeviceDC < 25, apply: () => { trap.disableDeviceDC = between(25, 29); } },
    { cost: 1, when: () => Boolean(trap.attacks) && trap.attacks[0].bonus < 15, apply: () => { trap.attacks[0].bonus = between(15, 19); } },
    { cost: 1, when: () => Boolean(trap.save) && trap.save.dc < 25, apply: () => { trap.save.dc = between(25, 29); } },
    {
      cost: 1,
      when: () => !trap.multipleTargets,
      apply: () => {
        trap.multipleTargets = 'first target in each of two adjacent 5-ft. squares';
        trap.footprint = { kind: 'squares', squares: 2, layout: 'adjacent' };
      },
    },
    {
      cost: 1,
      when: () => Boolean(trap.pit) && !trap.pit.spikes,
      apply: () => {
        trap.pit.spikes = { attackBonus: 10, count: '1d4', damage: '1d4+2' };
        trap.name = 'Spiked pit trap';
      },
    },
    {
      cost: 3,
      when: () => !trap.poison && (Boolean(trap.attacks) || Boolean(trap.pit?.spikes)),
      apply: () => {
        const names = Object.keys(poisons).filter((k) => poisons[k] === 3);
        const name = names.length ? pick(names) : 'giant wasp poison';
        trap.poison = { name: cap(name), save: 'Fortitude', saveDC: between(12, 20) };
        if (trap.attacks) trap.attacks[0].plusPoison = true;
        trap.name = trap.name.startsWith('Poisoned') ? trap.name : `Poisoned ${trap.name.toLowerCase()}`;
      },
    },
  ];

  /* A pit is the one shape with a damage ceiling: 100 feet is the deepest the
     rules describe, and 10d6 is +5. */
  const damageCeiling = trap.pit ? 5 : 99;
  /* A flooding room deals no hit points at all, so it needs none held back;
     everything else must deal some. */
  const reserve = trap.effect?.kind === 'drowning' ? 0 : 1;

  let budget = targetCR - featureCR(trap) - reserve;
  const taken = new Set();
  upgrades.forEach((up, i) => {
    if (budget < up.cost || !up.when() || !chance(0.4)) return;
    up.apply();
    taken.add(i);
    budget -= up.cost;
  });

  /* Now make sure what is left is damage the shape can actually deal. */
  let need = targetCR - featureCR(trap);
  upgrades.forEach((up, i) => {
    if (need <= damageCeiling) return;
    if (taken.has(i) || !up.when() || up.cost > need - damageCeiling + up.cost) return;
    up.apply();
    taken.add(i);
    need = targetCR - featureCR(trap);
  });

  /* A bypass costs the builder gold and the party nothing in CR, so it is
     rolled freely rather than out of the budget. */
  if (chance(0.25) && bypasses.length) {
    const bypass = pick(bypasses);
    trap.bypass = {
      type: bypass.id,
      ...(bypass.searchDC ? { searchDC: bypass.searchDC } : {}),
      ...(bypass.openLockDC ? { openLockDC: bypass.openLockDC } : {}),
    };
  }

  if (need > 0) {
    if (trap.pit) {
      const tens = Math.max(1, Math.min(10, need * 2));
      trap.pit.depthFt = tens * 10;
      trap.pit.fallDamage = `${tens}d6`;
    } else if (trap.attacks) {
      trap.attacks[0].damage = diceForAverage(need * 7);
    } else if (trap.effect) {
      trap.effect.damage = diceForAverage(need * 7);
    }
  } else if (trap.effect) {
    delete trap.effect.damage;
  }
  return trap;
}

const CASTER_CLASSES = [
  { cls: 'wizard', key: 'Sor/Wiz' },
  { cls: 'cleric', key: 'Clr' },
  { cls: 'druid', key: 'Drd' },
];

/** A real spell of a given level for a given class, or null. */
export function spellAtLevel(level, key) {
  const wanted = new RegExp(`${key.replace('/', '\\/')}\\s+${level}(\\D|$)`, 'i');
  const matches = (loadFile('spells') || []).filter((s) => wanted.test(String(s.Level || '')));
  return matches.length ? pick(matches) : null;
}

function rollMagic(targetCR, asSpellTrap) {
  /* A magic trap is CR 1 + the higher of its spell level and its damage, so
     the spell level alone lands it: a 4th-level spell makes a CR 5 trap. And
     because the Search DC is 25 + that level, the trap declares it. */
  const level = Math.max(0, Math.min(9, targetCR - 1));
  const caster = pick(CASTER_CLASSES);
  const spell = spellAtLevel(level, caster.key)
    || spellAtLevel(level, 'Sor/Wiz')
    || spellAtLevel(Math.max(0, level - 1), 'Sor/Wiz');
  const searchDC = 25 + level;
  const trap = {
    name: `${spell ? spell.Name : 'Spell'} trap`,
    type: asSpellTrap ? 'spell' : 'magic device',
    trigger: { type: asSpellTrap ? 'spell' : pick(MAGIC_TRIGGERS) },
    reset: asSpellTrap ? 'no' : pick(['no', 'automatic']),
    spellEffects: [{
      spell: spell ? spell.Name.toLowerCase() : 'unknown',
      casterLevel: Math.max(1, level * 2 - 1) + between(0, 4),
      casterClass: caster.cls,
      ...(spell?.Link ? { link: spell.Link } : {}),
    }],
    searchDC,
    disableDeviceDC: searchDC,
    save: { type: 'Reflex', dc: Math.floor(10 + level * 1.5), result: 'half' },
    footprint: chance(0.3)
      ? { kind: 'burst', radiusFt: 5, squares: 4 }
      : { kind: 'single', squares: 1 },
  };
  if (trap.footprint.kind === 'burst') trap.multipleTargets = 'all targets within 5 ft.';
  return trap;
}

/**
 * Roll one trap.
 *
 * @param {{ targetCR?: number, type?: string }} options
 * @returns {object} a trap in the same shape as the samples in traps.json, so
 *   every reader — the CR box, the cost box, the diagram — treats a rolled
 *   trap and a printed one identically.
 */
export function rollTrap({ targetCR = 3, type = '' } = {}) {
  const cr = Math.max(1, Math.min(10, Math.round(Number(targetCR) || 1)));
  const kind = type || pick([
    'mechanical', 'mechanical', 'mechanical', 'mechanical',
    'magic device', 'magic device', 'spell',
  ]);
  const trap = kind === 'mechanical' ? rollMechanical(cr) : rollMagic(cr, kind === 'spell');
  trap.cr = trapCR(trap).cr;
  trap.ref = '';
  trap.rolled = true;
  trap.targetCR = cr;
  if (!isMagicTrap(trap)) trap.cost = {};
  return trap;
}
