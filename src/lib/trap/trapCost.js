import { getTrapTables } from './trapData';
import { isMagicTrap, magicSpellLevel } from './trapCR';

/**
 * What a trap costs to buy, and what it takes to build.
 *
 * Like the CR, the price comes back as a **list of modifiers** rather than a
 * number: the master who wants a cheaper trap needs to see which feature is
 * expensive, and on a mechanical trap every one of them is multiplied by the
 * CR at the end, so a +1,000 gp trigger on a CR 8 trap is 8,000 gp.
 *
 * **Poison and alchemical extras are not priced here.** The rules add their
 * own cost on top, and those prices are in the DMG rather than in
 * `traps.json` — so a poisoned trap's computed price is the mechanism alone,
 * and says so. Of the 55 poison-free mechanical samples, **40 reproduce
 * exactly**; the rest are the book's own arithmetic, mostly the built-in
 * strength ratings it states in prose and never in a field.
 */

function line(key, label, gp) {
  return { key, label, gp };
}

/** `−100 gp × (floor − dc)` below, `+step × (dc − floor)` above, 0 at the floor. */
function dcModifier(dc, floor, above, below = 100) {
  const value = Number(dc);
  if (!Number.isFinite(value)) return 0;
  if (value > floor) return (value - floor) * above;
  if (value < floor) return -(floor - value) * below;
  return 0;
}

/**
 * The market price of a mechanical trap.
 *
 * @returns {{ gp: number, subtotal: number, cr: number, lines: Array,
 *             floored: boolean, excludesPoison: boolean }}
 */
export function mechanicalCost(trap, cr) {
  const table = getTrapTables().costModifiers?.mechanical || {};
  const lines = [line('base', 'Base cost', table.baseCostGp ?? 1000)];

  const trigger = trap?.trigger?.type;
  const triggerGp = table.trigger?.[trigger] ?? 0;
  if (triggerGp) lines.push(line('trigger', `Trigger: ${trigger}`, triggerGp));

  const reset = trap?.reset;
  const resetGp = (reset === 'automatic' && trigger === 'timed')
    ? (table.reset?.automaticWithTimedTrigger ?? 0)
    : (table.reset?.[reset] ?? 0);
  if (resetGp) lines.push(line('reset', `Reset: ${reset}`, resetGp));

  const bypass = trap?.bypass?.type;
  if (bypass) lines.push(line('bypass', `Bypass: ${bypass}`, table.bypass?.[bypass] ?? 0));

  const search = dcModifier(trap?.searchDC, 20, 200);
  if (search) lines.push(line('search', `Search DC ${trap.searchDC}`, search));

  const disable = dcModifier(trap?.disableDeviceDC, 20, 200);
  if (disable) lines.push(line('disable', `Disable Device DC ${trap.disableDeviceDC}`, disable));

  const save = trap?.save;
  if (save && String(save.type || '').toLowerCase().startsWith('ref')) {
    const reflex = dcModifier(save.dc, 20, 300);
    if (reflex) lines.push(line('reflex', `Reflex DC ${save.dc}`, reflex));
  }

  const attacks = trap?.attacks || [];
  if (attacks.length) {
    const best = Math.max(...attacks.map((a) => Number(a.bonus) || 0));
    const gp = dcModifier(best, 10, 200);
    if (gp) lines.push(line('attack', `Attack bonus +${best}`, gp));
  }

  if (trap?.neverMiss) lines.push(line('neverMiss', 'Never miss', table.neverMiss ?? 1000));

  const subtotal = lines.reduce((sum, l) => sum + l.gp, 0);
  const rating = Math.max(1, Number(cr) || 1);
  const raw = subtotal * rating;
  const floor = rating * 100;
  return {
    gp: Math.max(raw, floor),
    subtotal,
    cr: rating,
    lines,
    floored: raw < floor,
    excludesPoison: Boolean(trap?.poison),
  };
}

/**
 * A magic device trap costs gold **and** experience, and every spell in the
 * build is paid for — the trigger spell included.
 *
 * @returns {{ gp: number, xp: number, perSpell: Array, automatic: boolean }}
 */
export function magicDeviceCost(trap) {
  const table = getTrapTables().costModifiers?.magicDevice || {};
  const automatic = trap?.reset === 'automatic';
  const gpFactor = automatic ? 500 : 50;
  const xpFactor = automatic ? 40 : 4;
  const level = magicSpellLevel(trap).level;
  const perSpell = (trap?.spellEffects || []).map((sp) => {
    const cl = Number(sp.casterLevel) || 0;
    const sl = level || 0;
    return {
      spell: sp.spell,
      casterLevel: cl,
      spellLevel: sl,
      gp: gpFactor * cl * sl,
      xp: xpFactor * cl * sl,
    };
  });
  return {
    gp: perSpell.reduce((s, p) => s + p.gp, 0),
    xp: perSpell.reduce((s, p) => s + p.xp, 0),
    perSpell,
    automatic,
    /* `alarm` used purely as a trigger is free unless an NPC has to cast it. */
    freeAlarmTrigger: (table.alarmTriggerSpell ?? 0) === 0,
  };
}

/**
 * The price the page shows: computed for a mechanical trap, computed for a
 * magic device, and *stated* for a spell trap — which is free unless an NPC
 * spellcaster has to be hired, a number the trap carries and the tables do
 * not generate.
 */
export function trapPrice(trap, cr) {
  if (!trap) return null;
  if (trap.type === 'spell') {
    const gp = trap.cost?.npcSpellcasterGp;
    return { kind: 'spell', gp: gp ?? 0, hired: gp != null };
  }
  if (isMagicTrap(trap)) return { kind: 'magic', ...magicDeviceCost(trap) };
  return { kind: 'mechanical', ...mechanicalCost(trap, cr) };
}

/**
 * The Craft (trapmaking) DC to build or repair a mechanical trap, with the two
 * modifiers that raise it.
 *
 * @returns {{ dc: number, lines: Array }|null} null for a trap nobody crafts.
 */
export function craftDC(trap, cr) {
  if (!trap || isMagicTrap(trap)) return null;
  const table = getTrapTables().craftDC || {};
  const rating = Math.max(1, Number(cr) || 1);
  const band = (table.byCR || []).find((b) => rating >= b.minCR && rating <= b.maxCR);
  const base = band ? band.dc : (table.byCR?.[table.byCR.length - 1]?.dc ?? 30);
  const lines = [line('base', `CR ${rating}`, base)];
  const mods = table.modifiers || {};
  if (trap.trigger?.type === 'proximity' && mods.proximityTrigger) {
    lines.push(line('proximity', 'Proximity trigger', mods.proximityTrigger));
  }
  if (trap.reset === 'automatic' && mods.automaticReset) {
    lines.push(line('automatic', 'Automatic reset', mods.automaticReset));
  }
  return { dc: lines.reduce((s, l) => s + l.gp, 0), lines };
}
