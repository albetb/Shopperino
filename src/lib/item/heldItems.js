/**
 * Wands, rods and staffs — the three magic-item categories that occupy a hand
 * rather than one of the twelve body slots.
 *
 * This module answers everything about a held item that can be read out of
 * `items.json`: which entry it actually is, what spells it casts, what a cast
 * costs it, and at what caster level. It computes nothing about the character
 * — that belongs to the Player model.
 *
 * **Identity is `id`, never `Link`.** `Link` is not unique in items.json and
 * the collisions land exactly here: 23 of the 81 wands share a link with
 * another wand, and all 18 metamagic rods share one with their other two
 * tiers. What differs between them is the caster level —
 *
 *     Wand of Fireball (5th)   11,250 gp
 *     Wand of Fireball (10th)  22,500 gp   ← both `Link: "fireball"`
 *
 * — so a link lookup silently returns the weakest version and the spell rolls
 * half its dice forever. Every entry has a unique numeric `id`; that is the
 * key a held item is stored and resolved by.
 *
 * Rules: dnd-rules/magic-items.md.
 */

import { loadFile } from '../loadFile';
import { getItemById, getItemByRef } from './itemsUtils';

/** The three categories that occupy a hand rather than a body slot. */
export const HELD_ITEM_TYPES = Object.freeze(['Wand', 'Rod', 'Staff']);

/** Wands and staffs are created with 50 charges; rods normally have none. */
export const CREATED_CHARGES = 50;

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** Whether an ItemType is one of the three held categories. */
export function isHeldItemType(itemType) {
  return HELD_ITEM_TYPES.includes(String(itemType || ''));
}

/** Plain text from an item's HTML description. */
function plain(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * The items.json entry a stored held item refers to.
 *
 * Tried in order of exactness:
 *
 * 1. **`id`** — unique by construction, and what charges are keyed by.
 * 2. **`name`** — measured to be unique across all 138 held items, and it is
 *    already on every equipped entry. This is the path that matters in
 *    practice: it recovers the exact entry with no plumbing through the
 *    picker, no change to how inventory rows stack, and no migration for a
 *    character saved before any of this existed. "Wand of Fireball (5th)" and
 *    "Wand of Fireball (10th)" are different names even though they are the
 *    same link.
 * 3. **`link`** — the lossy last resort, and the reason this function exists:
 *    it returns whichever entry comes first, which is always the weakest.
 *
 * @param {{id?: number, name?: string, link?: string, Link?: string}} entry
 * @returns {{raw: object, itemType: string}|null}
 */
export function resolveHeldItem(entry) {
  if (!entry) return null;
  const items = loadFile('items') || {};

  const id = Number(entry.id);
  if (Number.isInteger(id) && id >= 0) {
    const byId = getItemById(id);
    if (byId) return { raw: byId.item, itemType: byId.itemType };
  }

  const name = String(entry.name ?? entry.Name ?? '').trim().toLowerCase();
  if (name) {
    for (const type of HELD_ITEM_TYPES) {
      const raw = (items[type] || []).find((i) => String(i?.Name || '').toLowerCase() === name);
      if (raw) return { raw, itemType: type };
    }
  }

  const link = entry.link || entry.Link || entry.baseLink;
  const byRef = getItemByRef(link);
  if (!byRef?.raw) return null;
  /* A link resolves to anything in items.json, so it has to be checked: a
     longsword must not come back as a held item just because it was asked
     about. Callers treat a non-null answer as "this is a wand, rod or
     staff". */
  const itemType = heldTypeOfRaw(byRef.raw);
  return itemType ? { raw: byRef.raw, itemType } : null;
}

/**
 * Whether something occupying a hand is a weapon you could attack with.
 *
 * A wand, rod or staff takes a hand but is not an attack: it should not get an
 * attack line, and — the bug this was written for — **it must not make the
 * character count as fighting with two weapons**. A wand in the off hand was
 * producing a two-weapon section, penalties and all.
 *
 * The test is narrow on purpose, and both halves matter:
 *
 * - It applies **only to the three held categories**. Every one of the 34
 *   `Specific Weapon` rows lacks `Dmg (M)` too — a holy avenger carries its
 *   damage on the base weapon its `Specific.Base` names — so a blanket
 *   "no damage dice means not a weapon" would silently disarm every magic
 *   weapon in the game.
 * - Within those categories it asks for **damage dice** rather than trusting
 *   the category, because some rods double as weapons in their own text (the
 *   rod of alertness is a +1 light mace). None of the 138 wands, rods and
 *   staffs in items.json carries damage dice today, so the test excludes all
 *   of them — but a rod that really is a weapon keeps its row the day one is
 *   given the fields.
 *
 * @param {object} raw - the items.json row
 * @param {string} [itemType] - the category when the caller knows it
 * @returns {boolean}
 */
export function handItemIsWeapon(raw, itemType) {
  if (!raw) return false;
  const type = itemType || heldTypeOfRaw(raw);
  if (!isHeldItemType(type)) return true;
  return Boolean(raw['Dmg (M)']);
}

/** Which of the three categories an items.json entry belongs to, if any. */
export function heldTypeOfRaw(raw) {
  if (!raw) return '';
  const items = loadFile('items') || {};
  const found = HELD_ITEM_TYPES.find((type) =>
    Array.isArray(items[type]) && items[type].some((i) => i === raw || (i?.id != null && i.id === raw.id))
  );
  return found || '';
}

/**
 * The caster level a held item's spells are cast at.
 *
 * Three sources, in order of how much they can be trusted:
 *
 * 1. **The name.** The 23 wands that share a link carry it there — "Wand of
 *    Fireball (5th)" — and it is the only thing separating them.
 * 2. **The price**, when it divides evenly. A wand costs
 *    `caster level x spell level x 750`, so the level falls out of the cost.
 *    This is what catches an item deliberately created above the minimum.
 * 3. **The minimum caster level for the spell**, `2 x spell level - 1`, which
 *    is what the rules say a created item uses unless raised on purpose.
 *
 * Step 3 exists because two wands — Restoration and Stoneskin — have a spell
 * with a **costly material component**, which adds `50 x component cost` to
 * the price and is not stored anywhere. Their cost therefore does not divide,
 * and the minimum rule gives the right answer for both (7th).
 *
 * @param {object} raw - The items.json entry.
 * @param {number} [spellLevel] - The spell's level for the relevant class.
 *   Without it only the name can answer, because a bare price divides by
 *   anything.
 * @returns {number} 0 when it cannot be determined.
 */
export function getHeldItemCasterLevel(raw, spellLevel = null) {
  if (!raw) return 0;
  const named = String(raw.Name || '').match(/\((\d+)(?:st|nd|rd|th)\)/i);
  if (named) return Number(named[1]);

  if (spellLevel === null || spellLevel === undefined) return 0;
  const level = Number(spellLevel);
  if (!Number.isFinite(level) || level < 0) return 0;

  const cost = Number(raw.Cost);
  const effective = level === 0 ? 0.5 : level;
  if (Number.isFinite(cost) && cost > 0) {
    const fromPrice = cost / (effective * 750);
    if (Number.isInteger(fromPrice) && fromPrice >= 1) return fromPrice;
  }
  return level === 0 ? 1 : (2 * level) - 1;
}

/**
 * The spells a held item casts, with what each cast costs it.
 *
 * Three shapes, because the three categories genuinely differ:
 * - **Wand** — the item's own `Link` *is* the spell's link, and it has no
 *   description at all. One spell, one charge.
 * - **Staff** — several spells as `<a href="spells#...">` inside the
 *   description, each with its own `(N charges)` cost beside it.
 * - **Rod** — no spells. Rods have unique powers, not spells.
 *
 * @returns {Array<{link: string, name: string, charges: number}>}
 */
export function getHeldItemSpells(raw, itemType) {
  if (!raw) return [];
  if (itemType === 'Wand') {
    return raw.Link ? [{ link: raw.Link, name: wandSpellName(raw), charges: 1 }] : [];
  }
  if (itemType !== 'Staff') return [];

  /* Parsed one list item at a time rather than with a single global regex,
     because four of the 98 entries put a parenthetical between the spell and
     its cost — "Lightning bolt (heightened to 5th level) (1 charge)" — and a
     regex tight enough to pair link with cost directly would drop them. The
     note is worth keeping: it changes what the spell does. */
  const html = String(raw.Description || '');
  const items = html.match(/<li>[\s\S]*?<\/li>/gi) || [];
  const out = [];
  items.forEach((entry) => {
    const link = entry.match(/<a href="spells#([^"]+)"[^>]*>([^<]*)<\/a>/i);
    if (!link) return;
    const rest = entry.slice(entry.indexOf('</a>') + 4);
    const cost = [...rest.matchAll(/\((\d+)\s*charges?\)/gi)].pop();
    const note = rest.replace(/\((\d+)\s*charges?\)/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    out.push({
      link: link[1],
      name: link[2].trim(),
      charges: cost ? Math.max(1, Number(cost[1]) || 1) : 1,
      ...(note ? { note } : {}),
    });
  });
  return out;
}

/** "Wand of Detect magic" / "Wand of Fireball (5th)" -> "Detect magic". */
function wandSpellName(raw) {
  return String(raw.Name || '')
    .replace(/^Wand of\s*/i, '')
    .replace(/\s*\(\d+(?:st|nd|rd|th)\)\s*$/i, '')
    .trim();
}

/**
 * A rod's per-day allowance, when its description states one.
 *
 * All 18 metamagic rods read "up to three spells per day"; other rods vary and
 * many have no allowance at all. Returns 0 when nothing is stated, which is
 * the honest answer for a rod with a continuous effect.
 */
export function getRodUsesPerDay(raw) {
  const text = plain(raw?.Description);
  const m = text.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:\w+\s+){0,3}?per\s+day/i);
  if (!m) return 0;
  const token = m[1].toLowerCase();
  return NUMBER_WORDS[token] ?? (Number(token) || 0);
}

/**
 * How many charges a held item holds when found.
 *
 * Wands and staffs are created with 50; a rod has none unless its description
 * says otherwise, and only two of the 36 do.
 */
export function getHeldItemMaxCharges(raw, itemType) {
  if (itemType === 'Wand' || itemType === 'Staff') return CREATED_CHARGES;
  if (itemType === 'Rod') {
    const perDay = getRodUsesPerDay(raw);
    return perDay > 0 ? perDay : 0;
  }
  return 0;
}

/**
 * Whether a rod's allowance comes back with a night's rest rather than being
 * spent for good. A per-day rod refreshes; a wand's 50 charges do not.
 */
export function refreshesOnRest(itemType) {
  return itemType === 'Rod';
}

/** The metamagic feat a rod applies, by feats.json name, or '' for the rest. */
export function getRodMetamagicFeat(raw) {
  const m = String(raw?.Description || '').match(/href="feats#([a-z-]+)"/i);
  if (!m) return '';
  return m[1].replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
