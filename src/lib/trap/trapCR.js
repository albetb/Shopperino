import { getTrapTables, poisonCR, resolveTrapSpell } from './trapData';
import { averageOf, damageToCR, leadingDamage } from './trapMath';

/**
 * What a trap's Challenge Rating is made of.
 *
 * The answer is a **list**, not a number — the same shape the character sheet
 * uses for every derived stat, and for the same reason: a master who can see
 * that a trap is CR 5 because the damage is worth +3 and the Disable DC +1 can
 * change the one they meant to change. `sumCR` of the list is always the
 * number displayed.
 *
 * Calibrated against the book's own 105 samples: **92 of the 102 single-trap
 * entries come out exactly right**. The ten that do not are listed in
 * [traps.md](../../../obsidian-vault/dnd-rules/traps.md) — they are the book
 * disagreeing with its own tables, not gaps here, and the sample keeps its
 * printed CR either way.
 */

/** One line of the breakdown. `cr` may be negative — a cheap trap is easier. */
function part(key, label, cr) {
  return { key, label, cr };
}

/** The CR band a value falls into, from a `crModifiers` band list. */
export function bandCR(bands, value) {
  const v = Number(value);
  const hit = (bands || []).find((b) => (
    v >= (b.min ?? Number.NEGATIVE_INFINITY) && v <= (b.max ?? Number.POSITIVE_INFINITY)
  ));
  return hit ? hit.cr : 0;
}

/** Words in a spell effect that describe something other than hit points. */
const NOT_HIT_POINTS = [
  'negative level', 'ability damage', 'con damage', 'str damage',
  'dex damage', 'int damage', 'wis damage', 'cha damage',
];

/**
 * The average damage a successful hit deals.
 *
 * Attacks, a pit's fall, a stated effect and a spell's dice all count. Two
 * things deliberately do **not**, because the rules say so: poison, and pit
 * spikes.
 */
export function averageDamage(trap) {
  if (!trap) return 0;
  let total = 0;
  (trap.attacks || []).forEach((a) => { total += averageOf(a.damage); });
  if (trap.pit) total += averageOf(trap.pit.fallDamage);
  total += averageOf(trap.effect?.damage);
  (trap.spellEffects || []).forEach((sp) => {
    const effect = String(sp.effect || '');
    if (NOT_HIT_POINTS.some((w) => effect.toLowerCase().includes(w))) return;
    total += leadingDamage(effect);
  });
  return total;
}

/**
 * The spell level a magic trap is rated on.
 *
 * A magic trap's **Search DC is 25 + the spell level**, so a stated trap
 * declares its own level in a field it already carries. spells.json is the
 * cross-check, and the two disagree on exactly two of the 33 magic samples —
 * which are exactly the two whose printed CR the DC explains and the spell
 * does not.
 *
 * @returns {{ level: number, source: 'searchDC'|'spells'|'none' }}
 */
export function magicSpellLevel(trap) {
  const fromDC = Number(trap?.searchDC) - 25;
  if (Number.isFinite(fromDC) && fromDC > 0) return { level: fromDC, source: 'searchDC' };
  const levels = (trap?.spellEffects || [])
    .map((sp) => resolveTrapSpell(sp.spell, sp.casterClass)?.level)
    .filter((l) => Number.isFinite(l));
  if (levels.length) return { level: Math.max(...levels), source: 'spells' };
  return { level: 0, source: 'none' };
}

function mechanicalParts(trap) {
  const mods = getTrapTables().crModifiers?.mechanical || {};
  const misc = mods.misc || {};
  const parts = [part('base', 'Mechanical trap', 0)];

  parts.push(part('search', `Search DC ${trap.searchDC}`, bandCR(mods.searchDC, trap.searchDC)));
  parts.push(part('disable', `Disable Device DC ${trap.disableDeviceDC}`,
    bandCR(mods.disableDeviceDC, trap.disableDeviceDC)));

  const save = trap.save;
  if (save && String(save.type || '').toLowerCase().startsWith('ref')) {
    parts.push(part('reflex', `Reflex DC ${save.dc}`, bandCR(mods.reflexSaveDC, save.dc)));
  }

  const attacks = trap.attacks || [];
  if (attacks.length) {
    const best = Math.max(...attacks.map((a) => Number(a.bonus) || 0));
    parts.push(part('attack', `Attack bonus +${best}`, bandCR(mods.attackBonus, best)));
  }

  const avg = averageDamage(trap);
  const { rounded, cr } = damageToCR(avg);
  if (cr) {
    parts.push(part('damage', `Average damage ${formatAverage(avg)} → ${rounded}`, cr));
  }

  if (trap.liquid) parts.push(part('liquid', 'Liquid', misc.liquid ?? 0));
  if (trap.multipleTargets) {
    parts.push(part('multi', 'Multiple targets',
      trap.neverMiss ? (misc.multipleTargetNeverMiss ?? 0) : (misc.multipleTarget ?? 0)));
  }
  const delay = Number(trap.onsetDelayRounds) || 0;
  if (delay > 0) {
    const key = { 1: 'onsetDelay1Round', 2: 'onsetDelay2Rounds', 3: 'onsetDelay3Rounds' }[delay]
      || 'onsetDelay4PlusRounds';
    parts.push(part('delay', `Onset delay ${delay} round${delay === 1 ? '' : 's'}`, misc[key] ?? 0));
  }
  if (trap.pit?.spikes) parts.push(part('spikes', 'Pit spikes', misc.pitSpikes ?? 0));
  if (attacks.some((a) => String(a.mode || '').includes('touch'))) {
    parts.push(part('touch', 'Touch attack', misc.touchAttack ?? 0));
  }
  if (trap.poison) {
    const found = poisonCR(trap.poison.name);
    parts.push(part('poison', `Poison: ${trap.poison.name}`, found ? found.cr : 0));
  }
  return parts;
}

function magicParts(trap) {
  const parts = [part('base', `${trap.type === 'spell' ? 'Spell' : 'Magic device'} trap`, 1)];
  const { level } = magicSpellLevel(trap);
  const avg = averageDamage(trap);
  const { rounded, cr } = damageToCR(avg);
  /* Whichever is larger, never both — that is the rule, and it is why a
     fireball trap is rated on its damage and an energy drain trap on its
     spell level. */
  if (level >= cr) {
    parts.push(part('spellLevel', `Highest spell level ${level}`, level));
  } else {
    parts.push(part('damage', `Average damage ${formatAverage(avg)} → ${rounded}`, cr));
  }
  return parts;
}

function formatAverage(avg) {
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

/** True for the two types rated as magic. */
export function isMagicTrap(trap) {
  return trap?.type === 'magic device' || trap?.type === 'spell';
}

/**
 * The CR of a trap, and every line that makes it up.
 *
 * @returns {{ cr: number, parts: Array<{key: string, label: string, cr: number}>,
 *            printed: number|null, matchesPrinted: boolean }}
 */
export function trapCR(trap) {
  if (!trap) return { cr: 0, parts: [], printed: null, matchesPrinted: true };
  const parts = isMagicTrap(trap) ? magicParts(trap) : mechanicalParts(trap);
  let cr = parts.reduce((sum, p) => sum + p.cr, 0);
  /* "A mechanical base CR of 0 is legal mid-calculation; if the final total
     lands at 0 or below, keep adding features until it reaches 1." A trap that
     exists is at least CR 1. */
  if (!isMagicTrap(trap) && cr < 1) {
    parts.push(part('floor', 'Minimum for a trap', 1 - cr));
    cr = 1;
  }
  const printed = Number.isFinite(Number(trap.cr)) ? Number(trap.cr) : null;
  return { cr, parts, printed, matchesPrinted: printed === null || printed === cr };
}

/** Just the number. */
export function computeTrapCR(trap) {
  return trapCR(trap).cr;
}
