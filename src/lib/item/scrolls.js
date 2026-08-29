import { loadFile } from '../loadFile';
import { getSpellByLink } from '../spellbook/spellsUtils';

/**
 * What a carried scroll is, resolved.
 *
 * A scroll row in [scrolls.json](../../data/scrolls.json) is four numbers and a
 * name: `{ Name, Link, Level, Cost }`. As with a potion the **`Link` is the
 * spell's link**, so everything a reader wants — what it does, what it costs to
 * cast, what saves against it — comes from
 * [spells.json](../../data/spells.json) rather than from the scroll row.
 *
 * Unlike a potion, a scroll carries its own **`Level`**, and that is the whole
 * reason this module exists separately: reading a scroll is *spell completion*,
 * which is gated on level, and the gate needs a number to compare against.
 *
 * **The two lists are disjoint by source, not by name.** 151 of the 598 spells
 * appear as both an Arcane and a Divine scroll under the same name and the same
 * link, so a scroll is identified by its full ref — `scrolls/Arcane/knock` —
 * and never by name alone. That is what the inventory stores.
 *
 * Rules: [magic-items.md](../../../obsidian-vault/dnd-rules/magic-items.md).
 */

/** The two lists in scrolls.json, in file order. */
export const SCROLL_SOURCES = Object.freeze(['Arcane', 'Divine']);

/** Trim the "Scroll of " the item name carries, leaving the spell's name. */
export function stripScrollPrefix(name) {
  return String(name || '').replace(/^Scroll\s+of\s+/i, '').trim();
}

/**
 * The caster level the scroll was scribed at.
 *
 * A scroll costs `caster level x spell level x 25 gp`, with a 0-level spell
 * counting as a half, so the level divides straight back out of the price —
 * for 698 of the 752 rows. The other 54 carry a **material component cost**
 * baked into the price (*sepia snake sigil* alone is 500 gp of powdered amber),
 * which no longer divides; those fall back to the lowest caster level that
 * could have scribed the spell, `2 x spell level - 1`.
 *
 * The same shape as `getPotionCasterLevel`, on the scroll's 25 gp rate rather
 * than the potion's 50.
 */
export function getScrollCasterLevel(raw, spellLevel = null) {
  const level = Number(spellLevel ?? raw?.Level);
  if (!Number.isFinite(level) || level < 0) return 0;

  const cost = Number(raw?.Cost);
  const effective = level === 0 ? 0.5 : level;
  if (Number.isFinite(cost) && cost > 0) {
    const fromPrice = cost / (effective * 25);
    if (Number.isInteger(fromPrice) && fromPrice >= 1) return fromPrice;
  }
  return level === 0 ? 1 : (2 * level) - 1;
}

/* getSpellByLink returns an array of matches (usually one), so it is unwrapped
   here rather than at each call site — the same unwrapping potionEffects does,
   and for the same reason. */
function spellOf(link) {
  const found = getSpellByLink(link);
  return (Array.isArray(found) ? found[0] : found) || null;
}

/**
 * Find a scroll row by its ref, `scrolls/Arcane/knock`.
 *
 * Deliberately not routed through `getItemByRef`: that helper falls back to a
 * slug-only search across both lists, which would silently return the Arcane
 * row for a Divine scroll. Here the source half of the ref is the answer to
 * "which of the two", so it is honoured strictly.
 *
 * @returns {{raw: object, source: 'Arcane'|'Divine'}|null}
 */
export function getScrollByRef(ref) {
  const parts = String(ref || '').split('/').filter(Boolean);
  if (parts.length < 3 || parts[0] !== 'scrolls') return null;
  const [, source] = parts;
  if (!SCROLL_SOURCES.includes(source)) return null;
  /* Six spell links carry a slash of their own — `open/close`,
     `blindness/deafness`, `geas/quest` — so the slug is everything after the
     source rather than the third segment. */
  const slug = parts.slice(2).join('/');
  const raw = (loadFile('scrolls')?.[source] || []).find((s) => s?.Link === slug);
  return raw ? { raw, source } : null;
}

/**
 * Everything the card and the use box need about one scroll.
 *
 * @param {string} ref - "scrolls/Arcane/knock", as the inventory stores it
 * @returns {object|null} null when the ref names no scroll
 */
export function resolveScroll(ref) {
  const found = getScrollByRef(ref);
  if (!found) return null;
  const { raw, source } = found;
  const spell = spellOf(raw.Link);

  return {
    ref,
    link: raw.Link,
    name: raw.Name || '',
    /* The spell's own title-case name where spells.json has it, and the item
       name with its prefix trimmed where it does not — so the row never falls
       back to printing "Scroll of" twice. */
    spellName: spell?.Name || stripScrollPrefix(raw.Name),
    source,
    /* The level on *this* list. An Arcane and a Divine scroll of the same
       spell can sit at different levels, which is exactly why the ref carries
       the source. */
    spellLevel: Number(raw.Level) || 0,
    casterLevel: getScrollCasterLevel(raw),
    cost: Number(raw.Cost) || 0,
    description: String(spell?.['Short Description'] || '').trim(),
    school: String(spell?.School || '').trim(),
    castingTime: String(spell?.['Casting Time'] || '').trim(),
    range: String(spell?.Range || '').trim(),
    duration: String(spell?.Duration || '').trim(),
    savingThrow: String(spell?.['Saving Throw'] || '').trim(),
    spellResistance: String(spell?.['Spell Resistance'] || '').trim(),
  };
}

/**
 * The Use Magic Device DC that lets a character read a scroll they do not
 * qualify for: `20 + the scroll's caster level`. A wand asks a flat 20, which
 * is why the two cannot share one number (skills-detail.md).
 */
export function scrollUseMagicDeviceDC(casterLevel) {
  return 20 + (Number(casterLevel) || 0);
}
