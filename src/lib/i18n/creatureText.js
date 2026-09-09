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

/* ------------------------------------------------------------------------ *
 * The attack line.
 *
 * `attack` and `fullAttack` are frozen in the data, and for a good reason:
 * `attackParser` reads them back to recompute an animal companion's, a
 * familiar's, a special mount's and a wild-shape form's attacks. A translated
 * string in `monsters.json` would break every one of them silently.
 *
 * The *display* is a separate question, and it gets the same answer an item's
 * name does — the data stays exactly as the SRD prints it, and the words are
 * looked up on the way to the screen. Nothing here writes anything back.
 *
 * The shape is the manual's own:  morso +4 in mischia (4d6+2 più veleno)
 * ------------------------------------------------------------------------ */

/* A segment is "<count> <name> <+N> <mode> (<damage>)", and every piece is
   optional except the name. The connectors are the SRD's "and" / "or" / ";". */
const CONNECTOR = /(\s*;\s*or\s*|\s*;\s*|\s+and\s+|\s+or\s+)/i;
const MODE = /\b(melee touch|ranged touch|melee|ranged)\b/i;
const LEADING_COUNT = /^(\d+)\s+/;
const BONUS = /([+-]\s*\d+)/;
const PLUS_RIDER = /\s+plus\s+(.+)$/i;
const LEADING_DICE = /^(\d+(?:d\d+)?(?:[+-]\d+)?\s+)/;

/** One natural weapon or manufactured weapon, as a stat block names it. */
export function attackName(en) {
  const text = String(en ?? '').trim();
  if (!text) return text;
  /* A qualified weapon — "masterwork longbow", "Huge greataxe" — is its own
     entry rather than an adjective composed onto a noun: Italian puts the
     adjective after, so composing gives "fattura perfetta arco lungo" where
     the manual says "arco lungo perfetto". A name the pack has not got comes
     back in English, which is at least what the SRD prints. */
  return tName('naturalAttacks', text);
}

/** What follows "plus" in the damage: an energy type, a poison, a condition. */
function rider(en) {
  const text = String(en ?? '').trim();
  const dice = LEADING_DICE.exec(text);
  const head = dice ? text.slice(dice[1].length) : text;
  const named = tName('attackRiders', head);
  return `${dice ? dice[1] : ''}${named}`;
}

/** "2d6+4 plus poison" — the dice untouched, the rider named. */
export function damageText(en) {
  const text = String(en ?? '');
  const m = PLUS_RIDER.exec(text);
  if (!m) return text;
  return `${text.slice(0, m.index)} ${t('plus')} ${rider(m[1])}`;
}

/** One whole attack segment, rebuilt in the reading language. */
function attackSegment(seg) {
  const text = String(seg ?? '').trim();
  if (!text) return text;

  let rest = text;
  let count = '';
  const c = LEADING_COUNT.exec(rest);
  if (c) { count = `${c[1]} `; rest = rest.slice(c[0].length); }

  let damage = '';
  const open = rest.lastIndexOf('(');
  if (open >= 0 && rest.endsWith(')')) {
    damage = ` (${damageText(rest.slice(open + 1, -1))})`;
    rest = rest.slice(0, open).trim();
  }

  let mode = '';
  const m = MODE.exec(rest);
  if (m) {
    mode = ` ${tName('attackModes', m[1].toLowerCase())}`;
    rest = (rest.slice(0, m.index) + rest.slice(m.index + m[1].length)).trim();
  }

  let bonus = '';
  const b = BONUS.exec(rest);
  if (b) {
    bonus = ` ${b[1].replace(/\s+/g, '')}`;
    rest = rest.slice(0, b.index).trim();
  }

  return `${count}${attackName(rest.replace(/\*+$/, ''))}${bonus}${mode}${damage}`;
}

/**
 * A whole `attack` / `fullAttack` line, in the reading language.
 *
 * A segment the shape does not fit comes back as it went in, so an oddly
 * written stat block reads as the SRD wrote it rather than as nonsense.
 */
export function attackLine(en) {
  const text = String(en ?? '').trim();
  if (!text || text === '-' || text === '—') return text;
  return text.split(CONNECTOR).map((piece, i) => {
    if (i % 2 === 1) {
      /* The connector itself: "and", "or", "; or". */
      return piece.replace(/\band\b/i, t('and')).replace(/\bor\b/i, t('or'));
    }
    return attackSegment(piece);
  }).join('');
}

/* ------------------------------------------------------------------------ *
 * The two pills beside the attacks: space/reach, and the speed line.
 *
 * Both are `raw` strings the model keeps in step with the numbers beside them,
 * so both are frozen in the data for the same reason the attack line is. They
 * are also both mostly measurements, which the unit converter rewrites at
 * render — so all that is left to translate is the words between the numbers,
 * and the translation has to leave "ft" alone for the converter to find.
 * ------------------------------------------------------------------------ */

/* fly 150 ft. (poor), swim 60 ft. — a movement mode, a distance, and for
   flight a manoeuvrability rating. */
const SPEED_WORD = /\b(fly|swim|climb|burrow|squares|square|base speed|base)\b/gi;
const MANEUVER = /\((perfect|good|average|poor|clumsy)\)/gi;
/* "15 ft./10 ft. (15 ft. with bite)" — the reach a particular attack has. */
const WITH_ATTACK = /\bwith\s+([a-z ]+)\)/gi;

/** The speed line's words, with every measurement left for the converter. */
export function speedText(en) {
  return String(en ?? '')
    .replace(MANEUVER, (_, word) => `(${tName('maneuverability', word.toLowerCase())})`)
    .replace(SPEED_WORD, (word) => tName('movementModes', word.toLowerCase()));
}

/** The space/reach line: "with bite" names an attack the pack already has. */
export function spaceReachText(en) {
  return String(en ?? '')
    .replace(WITH_ATTACK, (_, name) => `${t('with')} ${attackName(name.trim())})`);
}
