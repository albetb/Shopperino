/**
 * Pure parsing + recompute helpers for monster/animal attack display strings
 * (the `attack` / `fullAttack` fields in animals.json), e.g.
 *   "2 claws +7 melee (1d6+5) and bite +2 melee (1d6+2)"
 *   "Bite +12 melee (2d6+12)"
 *   "Bite +6 melee (1d8+6) or tail slap +6 melee (1d12+6)"
 *
 * No data imports — given a string in, structured data out, and given a parsed
 * line plus stat deltas, an adjusted line out. The animal-companion model uses
 * these to re-derive a companion's attacks from its advanced BAB / Str / size.
 */

/** Split a damage string into { dice, mod, suffix, star } or { raw } if unparseable. */
function parseDamage(damage) {
  if (damage == null) return null;
  let s = String(damage).trim();
  if (s === '') return null;

  // Peel a trailing rider like " plus poison" / " plus disease".
  let suffix = '';
  const plusIdx = s.search(/\s+plus\s+/i);
  if (plusIdx >= 0) {
    suffix = s.slice(plusIdx);
    s = s.slice(0, plusIdx).trim();
  }

  // Peel a trailing asterisk marker (footnote in the source stat block).
  let star = '';
  const stm = s.match(/\*+$/);
  if (stm) {
    star = stm[0];
    s = s.slice(0, s.length - star.length).trim();
  }

  // Core: optional "NdM" dice, optional flat modifier (or a bare number).
  const m = s.match(/^(\d+d\d+)?\s*([+-]?\s*\d+)?$/i);
  if (!m || (!m[1] && m[2] == null)) {
    return { raw: damage };
  }
  const dice = m[1] || '';
  let mod = 0;
  if (m[2] != null) mod = parseInt(m[2].replace(/\s+/g, ''), 10) || 0;
  return { dice, mod, suffix, star };
}

/** Reassemble a parsed-damage object back into a display string. */
function formatDamage(parsed) {
  if (!parsed || parsed.raw !== undefined) return parsed ? parsed.raw : '';
  const { dice, mod, suffix = '', star = '' } = parsed;
  let core;
  if (dice) {
    core = dice + (mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '');
  } else {
    core = String(mod);
  }
  return `${core}${star}${suffix}`;
}

/** Parse one attack segment like "2 claws +7 melee (1d6+5)" → { name, count, bonus, damage }. */
function parseSegment(seg) {
  let s = String(seg || '').trim();
  if (!s) return null;

  let count = 1;
  const cm = s.match(/^(\d+)\s+/);
  if (cm) {
    count = parseInt(cm[1], 10) || 1;
    s = s.slice(cm[0].length);
  }

  // Damage is whatever sits in the trailing parentheses.
  let damage = null;
  const dm = s.match(/\(([^)]*)\)/);
  if (dm) damage = dm[1].trim();

  // The attack bonus is the first signed integer; the name is everything before it.
  const bm = s.match(/([+-]\d+)/);
  let bonus = null;
  let name = s;
  if (bm) {
    bonus = parseInt(bm[1], 10);
    name = s.slice(0, bm.index);
  }
  name = name.replace(/\*+$/, '').trim();
  if (!name && bonus == null && damage == null) return null;
  return { name, count, bonus, damage };
}

/**
 * Parse an attack / fullAttack display string into structured natural-attack
 * entries: [{ name, count, bonus, damage, type }] where `type` is 'primary'
 * or 'secondary'. The first segment is primary; any segment joined by "and"
 * is secondary, as is any segment whose attack bonus is below the primary's.
 * "or" / ";" alternatives are treated as additional primary forms.
 */
export function parseAttacks(str) {
  const raw = String(str || '').trim();
  if (!raw || raw === '-' || raw === '—') return [];

  // Split while keeping the connector that preceded each segment.
  const tokens = raw.split(/\s*(;\s*or|;|\band\b|\bor\b)\s*/i);
  const out = [];
  let firstBonus = null;
  for (let i = 0; i < tokens.length; i += 2) {
    const parsed = parseSegment(tokens[i]);
    if (!parsed) continue;
    const connector = i === 0 ? null : tokens[i - 1];
    if (firstBonus === null && parsed.bonus != null) firstBonus = parsed.bonus;
    const joinedByAnd = !!connector && /and/i.test(connector);
    const lowerBonus =
      parsed.bonus != null && firstBonus != null && parsed.bonus < firstBonus;
    const isSecondary = i > 0 && (joinedByAnd || lowerBonus);
    parsed.type = isSecondary ? 'secondary' : 'primary';
    out.push(parsed);
  }
  return out;
}

/**
 * Recompute one parsed attack line for an advanced creature. Applies the
 * combined attack-bonus delta (BAB + Str mod + size mod) to `bonus`, and a
 * damage-modifier delta to `damage` — the full Str-mod delta for a primary
 * line, half (rounded down) for a secondary line. Pure: returns a new object.
 *
 * @param {{name,count,bonus,damage,type}} line
 * @param {{babDelta?:number, strModDelta?:number, sizeModDelta?:number}} deltas
 */
export function recomputeAttack(line, deltas = {}) {
  const babDelta = Number(deltas.babDelta) || 0;
  const strModDelta = Number(deltas.strModDelta) || 0;
  const sizeModDelta = Number(deltas.sizeModDelta) || 0;
  /* An enhancement bonus on the natural weapons themselves — magic fang, an
     amulet of mighty fists. It reaches attack and damage alike and, unlike
     Strength, is **not halved on a secondary attack**: the halving is a
     property of the Strength modifier, not of the weapon. */
  const enhancementDelta = Number(deltas.enhancementDelta) || 0;
  const enhancementDamage = Number(deltas.enhancementDamage) || 0;

  const isSecondary = line.type === 'secondary';
  const bonusDelta = babDelta + strModDelta + sizeModDelta + enhancementDelta;
  const newBonus = (line.bonus == null ? null : line.bonus + bonusDelta);

  const dmgDelta = (isSecondary ? Math.floor(strModDelta / 2) : strModDelta) + enhancementDamage;
  let newDamage = line.damage;
  const parsed = parseDamage(line.damage);
  if (parsed && parsed.raw === undefined && dmgDelta !== 0) {
    newDamage = formatDamage({ ...parsed, mod: parsed.mod + dmgDelta });
  }

  return { ...line, bonus: newBonus, damage: newDamage };
}
