import { loadFile } from '../loadFile';

const SIZE_RANK = {
  Fine: 0,
  Diminutive: 1,
  Tiny: 2,
  Small: 3,
  Medium: 4,
  Large: 5,
  Huge: 6,
  Gargantuan: 7,
  Colossal: 8,
};

/** All animal stat blocks from animals.json (empty array on failure). */
function loadAnimals() {
  const data = loadFile('animals');
  return Array.isArray(data?.animals) ? data.animals : [];
}

/** Set of slug tokens for an animal, derived from its ref (e.g. "animals/bear-black" -> {bear, black}). */
function animalTokens(animal) {
  const slug = String(animal.ref || '').replace(/^animals\//, '');
  return new Set(slug.split('-').filter(Boolean));
}

/** Normalize an incoming link to a token set. Accepts "monstersAnimal#black-bear", "animals/ape", "ape". */
function linkTokens(link) {
  let s = String(link || '').trim().toLowerCase();
  if (s.includes('#')) s = s.split('#').pop();
  s = s.replace(/^animals\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return new Set(s.split('-').filter(Boolean));
}

const SIZE_WORDS = new Set(['fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal']);

const sameSet = (a, b) => a.size === b.size && [...a].every((t) => b.has(t));
const subsetOf = (a, b) => [...a].every((t) => b.has(t)); // a ⊆ b

/**
 * Match a link's tokens against animals. Order matters:
 *  1. exact token-set match (unique variant, e.g. "snake-constrictor" -> Constrictor Snake)
 *  2. reverse subset, unique (animal tokens ⊆ link tokens, e.g. "whale-orca" -> Orca)
 *  3. size-variant group: link tokens ⊆ animal tokens AND the extra tokens are all
 *     sizes — so "shark" -> 3 sharks and "snake-viper" -> 5 vipers, but NOT "Dire Shark"
 *     (its extra "dire" token isn't a size). Dire animals resolve via the exact match above.
 */
function matchAnimals(animals, want) {
  if (!want.size) return [];
  let matches = animals.filter((a) => sameSet(want, animalTokens(a)));
  if (!matches.length) {
    const rev = animals.filter((a) => subsetOf(animalTokens(a), want));
    if (rev.length === 1) matches = rev;
  }
  if (!matches.length) {
    matches = animals.filter((a) => {
      const at = animalTokens(a);
      if (!subsetOf(want, at)) return false;
      return [...at].every((t) => want.has(t) || SIZE_WORDS.has(t));
    });
  }
  return matches.sort((a, b) => (SIZE_RANK[a.size] ?? 99) - (SIZE_RANK[b.size] ?? 99));
}

const sign = (n) => (n == null ? '—' : `${n >= 0 ? '+' : ''}${n}`);
const dash = (s) => (s == null || s === '' ? '—' : s);
const list = (arr) => (Array.isArray(arr) && arr.length ? arr.join(', ') : '—');

function abilitiesLine(ab) {
  if (!ab) return '—';
  return ['str', 'dex', 'con', 'int', 'wis', 'cha']
    .map((k) => `${k[0].toUpperCase()}${k.slice(1)} ${ab[k] == null ? '—' : ab[k]}`)
    .join(', ');
}

/**
 * Build the info-sidebar card for one animal as ordered key/value fields,
 * mirroring how equipment cards are shaped (the renderer shows each key as a
 * compact "Key: value" row). Key insertion order is the display order.
 */
function buildCard(a) {
  const subtypes = Array.isArray(a.subtypes) && a.subtypes.length ? ` (${a.subtypes.join(', ')})` : '';
  const card = {
    Name: a.name,
    Type: `${dash(a.size)} ${dash(a.type)}${subtypes}`,
    'Hit Dice': dash(a.hitDice?.raw),
    Initiative: sign(a.initiative),
    Speed: dash(a.speed?.raw),
    'Armor Class': dash(a.armorClass?.raw),
    'Base Attack/Grapple': dash(a.baseAttackGrapple?.raw),
    Attack: dash(a.attack),
    'Full Attack': dash(a.fullAttack),
    'Space/Reach': dash(a.spaceReach?.raw),
    'Special Attacks': list(a.specialAttacks),
    'Special Qualities': list(a.specialQualities),
    Saves: dash(a.saves?.raw),
    Abilities: abilitiesLine(a.abilities),
    Skills: list(a.skills),
    Feats: list(a.feats),
    Environment: dash(a.environment),
    Organization: dash(a.organization),
    'Challenge Rating': dash(a.challengeRating?.text),
    Advancement: dash(a.advancement),
  };
  if (a.levelAdjustment != null) card['Level Adjustment'] = sign(a.levelAdjustment);
  const prose = [];
  if (a.description) prose.push(a.description);
  if (a.combat) prose.push(`<p><b>Combat</b></p>${a.combat}`);
  if (prose.length) card.Description = prose.join('');
  card.Link = a.ref;
  return card;
}

/**
 * Returns info-sidebar card(s) for an animal link, or [] if no match.
 * Accepts "monstersAnimal#<slug>", "animals/<slug>", or a bare slug.
 * Generic slugs (e.g. "shark", "snake-viper") return one card per variant.
 */
export function getAnimalByLink(link) {
  try {
    const animals = loadAnimals();
    if (!animals.length) return [];
    return matchAnimals(animals, linkTokens(link)).map(buildCard);
  } catch (err) {
    return [];
  }
}

/** Alias matching the project's getXByRef naming, for "animals/<slug>" refs. */
export const getAnimalByRef = getAnimalByLink;

/** Every animal stat block (raw objects), in animals.json order. */
export function listAnimals() {
  return loadAnimals();
}

/**
 * The raw animals.json stat block for an exact "animals/<slug>" ref, or null.
 * Unlike getAnimalByLink (which fuzzy-matches and builds display cards), this
 * returns the underlying data object for a single, exact ref — used by the
 * animal-companion model to read base stats.
 */
export function getAnimalBaseByRef(ref) {
  const want = String(ref || '').trim();
  if (!want) return null;
  return loadAnimals().find((a) => a.ref === want) || null;
}
