import { loadFile } from '../loadFile';

/**
 * Reaching traps.json: the 105 samples, the generator tables, and the two
 * lookups that join a trap to the rest of the app's data.
 */

/** Every sample trap, CR 1–10. */
export function getTraps() {
  return loadFile('traps')?.traps ?? [];
}

/** The generator half: enums, bands, cost modifiers, Craft DCs. */
export function getTrapTables() {
  return loadFile('traps')?.tables ?? {};
}

/** One sample by its `ref`, or null. */
export function getTrapByRef(ref) {
  if (!ref) return null;
  return getTraps().find((t) => t.ref === ref) || null;
}

export const TRAP_TYPES = ['mechanical', 'magic device', 'spell'];

/** Title-case label for a trap type, as the tables name it. */
export function trapTypeLabel(id) {
  return (getTrapTables().trapTypes || []).find((t) => t.id === id)?.label || id;
}

/** The note the tables carry for one trigger id, for the info popover. */
export function triggerNote(id) {
  return (getTrapTables().triggers || []).find((t) => t.id === id)?.note || '';
}

/** The note the tables carry for one reset id. */
export function resetNote(id) {
  return (getTrapTables().resets || []).find((r) => r.id === id)?.note || '';
}

export function triggerLabel(id) {
  return (getTrapTables().triggers || []).find((t) => t.id === id)?.label || id;
}

export function resetLabel(id) {
  return (getTrapTables().resets || []).find((r) => r.id === id)?.label || id;
}

/**
 * Filter the catalogue. Every argument is optional; an absent one does not
 * narrow. `name` matches the trap's name case-insensitively.
 */
export function filterTraps({ name = '', type = '', minCR = 1, maxCR = 10 } = {}) {
  const needle = String(name || '').trim().toLowerCase();
  return getTraps().filter((t) => {
    if (type && t.type !== type) return false;
    if (t.cr < minCR || t.cr > maxCR) return false;
    if (needle && !t.name.toLowerCase().includes(needle)) return false;
    return true;
  });
}

const CLASS_SPELL_KEY = {
  wizard: 'Sor/Wiz',
  sorcerer: 'Sor/Wiz',
  cleric: 'Clr',
  druid: 'Drd',
  bard: 'Brd',
  ranger: 'Rgr',
  paladin: 'Pal',
};

/**
 * Resolve a trap's spell effect against spells.json.
 *
 * The trap names the spell and the class that cast it — `black tentacles`,
 * `wizard` — and the level depends on both: *fire trap* is a 2nd-level druid
 * spell and a 4th-level wizard one, which is exactly the difference between
 * two of the samples.
 *
 * The bracketed variant in a name (`glyph of warding [blast]`) is the trap's
 * own annotation, not part of the spell's name, so it is stripped.
 *
 * @returns {{ level: number|null, link: string, name: string }|null}
 */
export function resolveTrapSpell(spellName, casterClass) {
  const base = String(spellName || '').replace(/\s*\[.*?\]\s*/g, '').trim().toLowerCase();
  if (!base) return null;
  const spell = (loadFile('spells') || []).find((s) => String(s.Name || '').toLowerCase() === base);
  if (!spell) return null;
  const key = CLASS_SPELL_KEY[String(casterClass || '').toLowerCase()];
  const match = key
    ? String(spell.Level || '').match(new RegExp(`${key.replace('/', '\\/')}\\s+(\\d+)`, 'i'))
    : null;
  return {
    level: match ? Number(match[1]) : null,
    link: spell.Link || '',
    name: spell.Name || spellName,
  };
}

/**
 * The CR a poison adds, by name.
 *
 * The sample traps write the creature poisons out in full — *large monstrous
 * scorpion venom* — while the CR table keys them the short way, *large
 * scorpion venom*. Dropping "monstrous" is the whole of the difference, and
 * without it four samples silently lost their poison modifier.
 *
 * @returns {{ key: string, cr: number }|null} null when nothing matches.
 */
export function poisonCR(name) {
  const table = getTrapTables().crModifiers?.mechanical?.poison || {};
  const needle = String(name || '')
    .toLowerCase()
    .replace(/\bmonstrous\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!needle) return null;
  const key = Object.keys(table).find((k) => needle.includes(k));
  return key ? { key, cr: table[key] } : null;
}
