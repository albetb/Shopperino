import { tName } from './index';

/**
 * A spell's stat line, in the reading language.
 *
 * The long fields of a spell — its description, range, duration, saving throw —
 * are prose, and prose lives in `src/data/it/spells.json` keyed by JSON path,
 * so it is already translated by the time a card is built. The four short ones
 * are not prose: `Name` is the spell's identity (a spellbook row stores it, the
 * share codec puts it on the wire, `getSpellByLink` finds it), and `School`,
 * `Level` and `Components` are vocabulary that repeats across hundreds of
 * spells. All four therefore stay English in the data and are looked up here,
 * the same way an item's name and a creature's stat block are.
 */

/** "Evocation [Fire]" — the pack has all 79 of the strings that appear. */
export const spellSchool = (en) => tName('schools', en);

/** The spell, by the name the manual gives it. */
export const spellName = (en) => tName('spells', en);

/* "Sor/Wiz 3, Brd 2" — a list of the classes that get the spell and at what
   level. The abbreviations differ between the two manuals (*Mag/Str* for
   Sor/Wiz, *Chr* for Clr) and the clerical domains are words rather than
   abbreviations, so both go through one table. */
const LEVEL_ENTRY = /^(.*?)(\s+\d+)$/;

export function spellLevelText(en) {
  const text = String(en ?? '').trim();
  if (!text) return text;
  return text.split(',').map((piece) => {
    const one = piece.trim();
    const m = LEVEL_ENTRY.exec(one);
    if (!m) return tName('spellLevels', one);
    return `${tName('spellLevels', m[1])}${m[2]}`;
  }).join(', ');
}

/* "V, S, M/DF" — the letters are initials of the words behind them, so they
   change with the language: a divine focus is a *focus divino*, and the
   experience-point cost is *punti esperienza*. */
export function spellComponentsText(en) {
  const text = String(en ?? '').trim();
  if (!text) return text;
  const whole = tName('spellComponents', text);
  if (whole !== text) return whole;
  return text.split(',').map((piece) => tName('spellComponents', piece.trim()))
    .join(', ');
}
