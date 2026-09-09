import { t, tName } from './index';

/**
 * A creature stat block, in the reading language.
 *
 * The bestiary is the one place where almost everything on screen is a *name*
 * rather than a sentence: a monster's name, the special-quality pills, the
 * skill and feat lists, the three tail pills. None of it can be translated in
 * the data — `monsters.json` is what every filter, favored-enemy check and
 * attack parser reads, and its `name` is the identity a roster entry stores —
 * so it is all keyed in `names.json` and looked up here, on the way out.
 *
 * That is also why the bestiary looked untranslated while the descriptions
 * were not: the prose pack has covered `description` and `combat` for a while,
 * and it is everything printed around them that had no key at all.
 *
 * Anything the pack cannot answer comes back exactly as the SRD prints it,
 * which is the name every English manual and half the table uses anyway.
 */

/* A quality is a word and, often, a number: "darkvision 60 ft.", "damage
   reduction 10/magic", "spell resistance 19", "fast healing 5". The number is
   the creature's, not the vocabulary's, so it is split off before the lookup
   and put back after — one pack entry then covers every creature that has the
   quality, at whatever rating. */
const TRAIL = /\s*([-+]?\d[\d,/]*\s*(?:ft\.?|feet|hp|\/[a-z -]+)?\.?)$/i;

/* A skill line is "Listen +16", or "Knowledge (arcana) +11" where the
   parenthetical is itself a name. A feat is "Weapon Focus (claw)", where it is
   not — it names the creature's own attack, which stays as the data spells it. */
const SKILL_LINE = /^(.*?)\s*([-+]\d+.*)$/;
const WITH_PAREN = /^(.+?)\s*\(([^)]*)\)$/;

/**
 * A creature's own name.
 *
 * Two thirds of the bestiary is named `<base>, <qualifier>` — "Red Dragon,
 * Wyrmling", "Monstrous Spider, Huge", "Bear, Black" — so the two halves are
 * looked up separately when the whole name is not itself an entry. Ten dragons
 * across thirteen age categories is 130 names from 23 words, which is the only
 * reason the bestiary is coverable at all.
 *
 * The whole name is tried first: `Bat Swarm` is one creature, not a bat with a
 * qualifier, and the pack is free to say so.
 */
export function creatureName(en) {
  const text = String(en ?? '');
  const whole = tName('creatures', text);
  if (whole !== text) return whole;

  const comma = text.lastIndexOf(', ');
  if (comma < 0) return text;
  const base = text.slice(0, comma);
  const qualifier = text.slice(comma + 2);
  const namedBase = tName('creatures', base);
  if (namedBase === base) return text;   // the base is unknown; say nothing new
  return `${namedBase}, ${creatureQualifier(qualifier)}`;
}

/** What follows the comma: an age category, a size, a form, a colour. */
export function creatureQualifier(en) {
  const text = String(en ?? '');
  const hit = tName('creatureQualifiers', text);
  if (hit !== text) return hit;
  const size = tName('sizes', text);
  return size === text ? text : size.toLowerCase();
}

/** One special attack or special quality, with its rating left alone. */
export function creatureTerm(en) {
  const text = String(en ?? '');
  const m = TRAIL.exec(text);
  if (!m) return tName('creatureTraits', text);
  const head = text.slice(0, m.index);
  return `${tName('creatureTraits', head)} ${m[1]}`;
}

/**
 * Split a comma-joined list without cutting inside a parenthesis.
 *
 * Five entries in the three creature files carry a comma of their own —
 * "Survival +7 (+9 following tracks, +9 Plane of Air)" — and splitting those
 * in half would ask the pack for two fragments of a sentence.
 */
export function splitList(joined) {
  const parts = [];
  let depth = 0;
  let start = 0;
  const text = String(joined ?? '');
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts.filter(Boolean);
}

/** A skill line: the skill named from the pack, its modifier untouched. */
export function skillLine(en) {
  const text = String(en ?? '');
  const m = SKILL_LINE.exec(text);
  const head = (m ? m[1] : text).trim();
  const tail = m ? ` ${m[2]}` : '';
  const paren = WITH_PAREN.exec(head);
  if (paren) {
    /* Knowledge (arcana), Craft (weaponsmithing) — both halves are names, and
       the second has its own table. "any one" is a rule, not a subskill. */
    const inner = paren[2];
    const named = tName('knowledgeSubskills', inner);
    return `${tName('skills', paren[1])} (${named === inner ? t(inner) : named})${tail}`;
  }
  return `${tName('skills', head)}${tail}`;
}

/** A feat, keeping whatever it was taken in. */
export function featName(en) {
  const text = String(en ?? '');
  const paren = WITH_PAREN.exec(text);
  if (paren) return `${tName('feats', paren[1])} (${paren[2]})`;
  return tName('feats', text);
}

/** "Huge Aberration (Aquatic)" — a size, a type and its subtypes. */
export function sizeAndType(en) {
  const text = String(en ?? '').trim();
  if (!text) return text;
  const paren = WITH_PAREN.exec(text);
  const head = (paren ? paren[1] : text).trim();
  const words = head.split(/\s+/);
  const size = tName('sizes', words[0]);
  const type = tName('creatureTypes', words.slice(1).join(' '));
  const subtypes = paren
    ? ` (${splitList(paren[2]).map((s) => tName('creatureTypes', s)).join(', ')})`
    : '';
  return `${size} ${type}${subtypes}`.trim();
}

export const alignmentText = (en) => tName('alignmentLines', en);
export const environmentText = (en) => tName('environments', en);
export const treasureText = (en) => tName('treasures', en);

/* "9-16 HD (Large); 17-24 HD (Huge)", or a phrase of its own. The numbers are
   the creature's; only the abbreviation and the size names are words. */
const ADVANCEMENT_STEP = /^(\d+(?:[-–]\d+)?\+?)\s*HD\s*\(([^)]*)\)$/i;

export function advancementText(en) {
  const text = String(en ?? '').trim();
  if (!text || text === '-') return text;
  const steps = text.split(';').map((s) => s.trim()).filter(Boolean);
  const converted = steps.map((step) => {
    const m = ADVANCEMENT_STEP.exec(step);
    if (!m) return t(step);
    return `${m[1]} ${t('HD')} (${tName('sizes', m[2])})`;
  });
  return converted.join('; ');
}
