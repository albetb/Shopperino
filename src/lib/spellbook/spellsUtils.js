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
