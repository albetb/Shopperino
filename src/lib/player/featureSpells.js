/**
 * Class features that are, mechanically, a spell — and which spell they cast.
 *
 * A handful of abilities across the core classes do nothing more than cast a
 * named spell: a paladin's remove disease, a bard's suggestion, a monk's
 * abundant step. The sheet shows the ability, but the numbers that matter
 * (range, duration, save) live in the spell, so each of these carries a link
 * into the spell's stat block in the info sidebar.
 *
 * Keyed by the feature's own name, lowercased, because that is what the sheet
 * has to hand — the bardic performance list and the short class-feature lines
 * both label themselves that way. Note that the feature's name and the spell's
 * are often different: "song of freedom" casts break enchantment.
 *
 * Only genuine "as the spell" abilities belong here. Something merely
 * spell-like — turn undead, lay on hands, a rage — has no spell to link to.
 */
const FEATURE_SPELLS = {
  // Paladin
  'remove disease': { name: 'Remove disease', link: 'spells#remove-disease' },
  'detect evil': { name: 'Detect evil', link: 'spells#detect-evil' },
  // Bard — bardic music
  suggestion: { name: 'Suggestion', link: 'spells#suggestion' },
  'mass suggestion': { name: 'Suggestion, mass', link: 'spells#mass-suggestion' },
  'song of freedom': { name: 'Break enchantment', link: 'spells#break-enchantment' },
  // Monk
  'abundant step': { name: 'Dimension door', link: 'spells#dimension-door' },
  'empty body': { name: 'Etherealness', link: 'spells#etherealness' },
};

/**
 * The spell a class feature casts, or null when it casts none.
 * @param {string} featureName e.g. "Song of freedom"
 * @returns {{name: string, link: string}|null}
 */
export function getFeatureSpell(featureName) {
  // Short class-feature lines label themselves "Detect Evil (Sp)"; the
  // ability-type marker is not part of the name.
  const key = String(featureName || '')
    .replace(/\([^)]*\)/g, ' ')
    .trim()
    .toLowerCase();
  return FEATURE_SPELLS[key] ?? null;
}

export default FEATURE_SPELLS;
