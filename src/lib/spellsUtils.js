import { loadFile } from './loadFile';

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
