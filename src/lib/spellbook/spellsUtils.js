import { loadFile } from '../loadFile';

/** Resolve a spell by link (anchor). Returns array of one spell or empty. */
export function getSpellByLink(link) {
  try {
    const spells = loadFile('spells');
    const spell = spells.find(s => s.Link === link);
    return spell ? [spell] : [];
  } catch (err) {
    return [];
  }
}

/**
 * Whether a spell offers a saving throw at all, so a DC is worth showing.
 *
 * The test is that the field **names a save**, not that it fails to say "None":
 * 8 spells read "None or Will negates (harmless)" or similar and do offer one in
 * some circumstance, while "None; see text" and a bare "See text" do not. Naming
 * Fortitude, Reflex or Will catches 253 of the 605 spells and excludes exactly
 * the four values that name nothing - "No", "None", "None; see text" and "See
 * text" - plus the 172 that leave the field empty.
 */
export function spellAllowsSave(spell) {
  return /Fortitude|Reflex|Will/i.test(String(spell?.['Saving Throw'] ?? ''));
}

/**
 * Whether spell resistance can apply to a spell, and with what qualification.
 *
 * The sibling of `spellAllowsSave`, and the same trap: the field is not a
 * boolean. 424 of the 605 spells carry `Spell Resistance` and 22 distinct
 * values appear in it, so a `=== 'Yes'` test would catch 173 and miss the
 * ~100 that also mean yes — `Yes (harmless)`, `Yes (object)`, `Yes; see text`,
 * and the handful that read `No or Yes (harmless)` because the answer depends
 * on how the spell is used.
 *
 * The test is therefore that the field **mentions yes at all**, which is the
 * honest reading: if any branch of the entry says yes, a caster meeting a
 * creature with spell resistance may have to roll.
 *
 * The qualifiers matter enough to report rather than swallow:
 * - `harmless` — the target may voluntarily lower its resistance to accept it.
 * - `object` — resistance applies only to an object it is carrying.
 * - `conditional` — the entry says "see text", or offers both answers, so the
 *   spell's own description decides.
 *
 * Rules: dnd-rules/spell-resistance.md, which carries the full variant table.
 *
 * @param {object} spell - A spells.json entry.
 * @returns {{applies: boolean, qualifier: string, raw: string}}
 */
export function spellResistanceInfo(spell) {
  const raw = String(spell?.['Spell Resistance'] ?? '').trim();
  const applies = /yes/i.test(raw);
  let qualifier = '';
  if (applies) {
    if (/see text/i.test(raw) || /\bno\b/i.test(raw)) qualifier = 'conditional';
    else if (/harmless/i.test(raw)) qualifier = 'harmless';
    else if (/object/i.test(raw)) qualifier = 'object';
  }
  return { applies, qualifier, raw };
}

/** Shorthand for the common question: can spell resistance stop this spell? */
export function spellResistanceApplies(spell) {
  return spellResistanceInfo(spell).applies;
}
