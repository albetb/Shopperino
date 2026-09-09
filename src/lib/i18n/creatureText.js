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

/* A rank or an age the SRD prints *before* the species: "Adult Tojanida",
   "Greater Barghest", "Elder Xorn". Italian puts it after — the manual's own
   headings are *Tojanida adulto*, *Ombra maggiore*, *Xorn anziano* — so the
   two halves swap on the way out.

   Only ranks compose. A colour or a size in front of a name is usually part of
   the species rather than a qualifier of it ("Black Pudding" is not a pudding
   that happens to be black), and those are keyed whole instead. Longest first,
   so "Young Adult" is not read as "Young". */
const LEADING_RANK = [
  'Great Wyrm', 'Mature Adult', 'Young Adult', 'Very Young',
  'Wyrmling', 'Juvenile', 'Advanced', 'Ancient', 'Greater', 'Lesser',
  'Adult', 'Elder',
];

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
  if (comma >= 0) {
    const base = text.slice(0, comma);
    const namedBase = tName('creatures', base);
    // The base being unknown means there is nothing new to say about the name.
    if (namedBase !== base) {
      return `${namedBase}, ${creatureQualifier(text.slice(comma + 2))}`;
    }
  }

  const rank = LEADING_RANK.find(
    (word) => text.toLowerCase().startsWith(`${word.toLowerCase()} `));
  if (rank) {
    const rest = text.slice(rank.length + 1);
    const base = creatureName(rest);
    const qualifier = creatureQualifier(rank);
    /* Swapping the halves is only ever right in a language that puts the
       adjective after the noun. Reading English, neither half moved and
       neither should the order. */
    if (base !== rest || qualifier !== rank) return `${base} ${qualifier}`;
  }
  return text;
}

/** What follows the comma: an age category, a size, a form, a colour. */
export function creatureQualifier(en) {
  const text = String(en ?? '');
  const hit = tName('creatureQualifiers', text);
  if (hit !== text) return hit;
  const size = tName('sizes', text);
  return size === text ? text : size.toLowerCase();
}

/* "immunity to acid and cold", "resistance to electricity 10 and fire 10",
   "vulnerability to fire" — three heads and a list of what they are *to*.
   Italian fuses the preposition to the article and the article to the noun —
   all'acido, al freddo, alla pietrificazione — so the pack keys the articled
   form and this only has to find where one target ends and the next begins. */
const AFFINITY = /^(immunity|resistance|vulnerability)\s+to\s+(.+)$/i;
const RATING = /\s+(\d+)$/;

/** Capitalised in, capitalised out: the stat block writes both. */
function matchCase(sample, text) {
  if (!sample || sample[0] !== sample[0].toUpperCase()) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "all'elettricità 10 e al fuoco 10" — each target with its rating kept. */
function affinityTargets(list) {
  return String(list).split(/\s+and\s+/i).map((piece) => {
    const one = piece.trim();
    const rated = RATING.exec(one);
    const head = rated ? one.slice(0, rated.index) : one;
    const named = tName('affinities', head);
    return rated ? `${named} ${rated[1]}` : named;
  }).join(` ${t('and')} `);
}

/** One special attack or special quality, with its rating left alone. */
export function creatureTerm(en) {
  const text = String(en ?? '');

  const affinity = AFFINITY.exec(text.trim());
  if (affinity) {
    /* The head answering is the signal that this language fuses the
       preposition into the target. English does not — it says "immunity *to*
       acid" — so when the pack has nothing to say the SRD sentence stands. */
    const key = affinity[1].toLowerCase();
    const head = t(key);
    if (head !== key) {
      return `${matchCase(affinity[1], head)} ${affinityTargets(affinity[2])}`;
    }
  }

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

/* "Survival +1 (+3 other planes and following tracks)" — the second bonus, and
   what it applies to. The phrase is the vocabulary; the bonus is the
   creature's, so it splits off the same way a quality's rating does. A comma
   inside the parenthesis starts another one: "(+9 following tracks, +9 Plane
   of Air)". */
const SKILL_RIDER = /^([-+]\d+)\s*(.*)$/;

/** What a skill's parenthetical says the extra bonus is good for. */
function skillRiders(inner) {
  return String(inner).split(',').map((piece) => {
    const one = piece.trim();
    const m = SKILL_RIDER.exec(one);
    if (!m) return tName('skillRiders', one);
    return m[2] ? `${m[1]} ${tName('skillRiders', m[2])}` : m[1];
  }).join(', ');
}

/** A skill line: the skill named from the pack, its modifier untouched. */
export function skillLine(en) {
  const text = String(en ?? '');
  const m = SKILL_LINE.exec(text);
  const head = (m ? m[1] : text).trim();
  /* Anything the modifier drags along is a rider — "+1 (+3 con legami)". */
  const tail = m
    ? ` ${m[2].replace(/\(([^)]*)\)/g, (_, inner) => `(${skillRiders(inner)})`)}`
    : '';
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

/* ------------------------------------------------------------------------ *
 * The armour class line, and who the creature is found with.
 * ------------------------------------------------------------------------ */

/* "22 (+1 size, +1 Dex, +10 natural), touch 12, flat-footed 21" — the manual
   prints it as "20 (-1 taglia, +1 Des, +10 naturale), contatto 10, colto alla
   sprovvista 19". Every word in it is already keyed somewhere: the components
   are bonus types, one of them is an ability, a few are armour the creature
   wears, and the two after the bracket are the touch and flat-footed labels
   the defence pill already uses. */
const AC_COMPONENT = /^([-+]\d+)\s+(.+)$/;
const AC_LABEL = /\b(touch|flat-footed)\b/gi;

/* A worn component carries its own enhancement bonus, at either end: "+2 full
   plate armor", "bracers of armor +5". The number is the creature's gear, not
   the vocabulary, so it comes off before the lookup and goes back where it
   was. */
const AC_WORN = /^(?:([+-]\d+)\s+)?(.*?)(?:\s+([+-]\d+))?$/;

function acComponent(piece) {
  const one = piece.trim();
  const m = AC_COMPONENT.exec(one);
  if (!m) return one;
  const word = m[2].replace(/\.$/, '');
  const bonus = tName('bonusTypes', word);
  if (bonus !== word) return `${m[1]} ${bonus}`;
  const ability = t(word);
  if (ability !== word) return `${m[1]} ${ability}`;

  const worn = AC_WORN.exec(word);
  const before = worn[1] ? `${worn[1]} ` : '';
  const after = worn[3] ? ` ${worn[3]}` : '';
  return `${m[1]} ${before}${tName('acComponents', worn[2])}${after}`;
}

export function armorClassText(en) {
  const text = String(en ?? '');
  if (!text) return text;
  return text
    .replace(/\(([^)]*)\)/g,
      (_, inner) => `(${inner.split(',').map(acComponent).join(', ')})`)
    .replace(AC_LABEL, (word) => t(word.toLowerCase()));
}

/* "Solitary or clutch (2-4)" — a list of group nouns, each with how many are
   in one. A dragon's runs to two clauses with the age categories in front:
   "Wyrmling, very young, ...: solitary or clutch (2-5); adult, ...: solitary,
   pair, or family (1-2 and 2-5 offspring)".

   The nouns and the connectors are vocabulary. What is inside the bracket is
   mostly numbers, but a hundred-odd of them carry a phrase — and a few carry a
   whole sentence naming other creatures and their class levels. Those come
   back as the SRD prints them: a half-translated sentence would read worse
   than an English one. */
const GROUP_ENTRY = /^(.*?)(?:\s*\(([^)]*)\))?$/;
/* One word at a time — the phrases that are worth a key are looked up whole
   first, and a class of words in the class regex would swallow the space
   between them. */
const NOTE_WORD = /[A-Za-z][A-Za-z'-]*/g;
/* "2-4 mephits of mixed types" — how many, then what they are. */
const NOTE_COUNT = /^((?:[\d]+(?:[-–][\d]+)?%?\s+)+)(.*)$/;
const GROUP_SEP = /^\s+(and|or)\s+/i;

/* The list is joined by commas *and* by the words "and" and "or", which is one
   more separator than `splitList` knows about — and neither may be taken from
   inside a bracket, where whole sentences of them live. Separators are kept so
   the list can be put back together the way it came apart. */
function splitGroups(text) {
  const parts = [];
  const s = String(text);
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      if (ch === ',') {
        /* An Oxford comma is one separator, not two: ", or family" joins the
           last two entries and Italian writes it without the comma. */
        const oxford = /^,\s*(and|or)\s+/i.exec(s.slice(i));
        if (oxford) {
          parts.push(s.slice(start, i), ` ${t(oxford[1].toLowerCase())} `);
          start = i + oxford[0].length;
          i = start;
          continue;
        }
        parts.push(s.slice(start, i), ', ');
        start = i + 1;
        i += 1;
        continue;
      }
      const sep = GROUP_SEP.exec(s.slice(i));
      if (sep) {
        parts.push(s.slice(start, i), ` ${t(sep[1].toLowerCase())} `);
        start = i + sep[0].length;
        i = start;
        continue;
      }
    }
    i += 1;
  }
  parts.push(s.slice(start));
  return parts;
}

function groupNote(inner) {
  const one = inner.trim();
  const whole = tName('groupNotes', one);
  if (whole !== one) return whole;
  const counted = NOTE_COUNT.exec(one);
  if (counted) {
    const named = tName('groupNotes', counted[2]);
    if (named !== counted[2]) return `${counted[1]}${named}`;
  }
  return one.replace(NOTE_WORD, (word) => tName('groupNotes', word));
}

function groupEntry(entry) {
  const one = entry.trim();
  if (!one) return one;
  const m = GROUP_ENTRY.exec(one);
  const head = tName('creatureGroups', m[1].trim());
  return m[2] === undefined ? head : `${head} (${groupNote(m[2])})`;
}

/** One clause: the group list, with the age categories that lead it if any. */
function groupClause(clause) {
  const colon = clause.indexOf(':');
  if (colon >= 0) {
    const ages = splitGroups(clause.slice(0, colon))
      .map((part, i) => (i % 2 ? part : creatureQualifier(part.trim())))
      .join('');
    return `${ages}: ${groupClause(clause.slice(colon + 1).trim())}`;
  }
  return splitGroups(clause).map((part, i) => (i % 2 ? part : groupEntry(part)))
    .join('');
}

export function organizationText(en) {
  const text = String(en ?? '').trim();
  if (!text || text === '-') return text;
  return text.split(';').map((clause) => groupClause(clause.trim())).join('; ');
}

/* `buildCard` in animalsUtils joins a creature's two prose blocks into one
   field with a heading between them, and that heading is the only English left
   in it — both blocks come from the prose pack. It is swapped here rather than
   there so i18n stays out of a module the rules read. */
export function creatureDescription(html) {
  return String(html ?? '')
    .replace('<p><b>Combat</b></p>', `<p><b>${t('Combat')}</b></p>`);
}
