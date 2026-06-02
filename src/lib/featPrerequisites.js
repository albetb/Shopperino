/**
 * Prerequisite checking for feats. Display-only; not enforced.
 */

const ABILITY_MAP = { Str: 'str', Dex: 'dex', Con: 'con', Int: 'int', Wis: 'wis', Cha: 'cha' };

/**
 * Extract feat names from prerequisite HTML. Only anchors that link to a feat
 * (`href="...feats#..."`) count — skill links (`href="...skills#..."`) reference
 * skill-rank requirements, not feats, and must not be treated as required feats.
 * @param {string} prereqHtml - HTML string
 * @returns {string[]} Array of feat names (as shown in link text)
 */
export function extractPrerequisiteFeatNames(prereqHtml) {
  if (!prereqHtml || typeof prereqHtml !== 'string') return [];
  const matches = prereqHtml.matchAll(/<a[^>]*href="[^"]*feats#[^"]*"[^>]*>([^<]+)<\/a>/gi);
  return [...matches].map((m) => (m[1] || '').trim()).filter(Boolean);
}

/**
 * Extract skill-rank requirements from prerequisite HTML, e.g. "Ride 1 rank".
 * Reads the skill name from the skill link text and the rank count that follows.
 * @param {string} prereqHtml - HTML string
 * @returns {Array<{skill: string, ranks: number}>}
 */
export function extractPrerequisiteSkillRanks(prereqHtml) {
  if (!prereqHtml || typeof prereqHtml !== 'string') return [];
  const re = /<a[^>]*href="[^"]*skills#[^"]*"[^>]*>([^<]+)<\/a>\s*(\d+)\s*ranks?\b/gi;
  const result = [];
  for (const m of prereqHtml.matchAll(re)) {
    const skill = (m[1] || '').trim();
    const ranks = parseInt(m[2], 10);
    if (skill && Number.isFinite(ranks)) result.push({ skill, ranks });
  }
  return result;
}

/**
 * Parse prerequisite requirements from raw text (strip HTML for parsing).
 * @param {string} prereqHtml
 * @returns {Object} Parsed requirements
 */
function parsePrerequisites(prereqHtml) {
  // Skill-rank requirements need the link href, so read them from the raw HTML.
  const skillRanks = extractPrerequisiteSkillRanks(prereqHtml);
  // Strip parenthetical clauses before scanning abilities: they hold conditional
  // or clarifying notes (e.g. "(plus Str 13 for bastard sword ...)", "(conjuration)",
  // "(see below)"), never an unconditional requirement, and would otherwise be
  // parsed as a hard ability minimum.
  const text = (prereqHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const result = {
    abilities: {}, // { str: 13, dex: 15, ... }
    skillRanks, // [{ skill, ranks }]
    casterLevel: null,
    baseAttackBonus: null,
    characterLevel: null,
    fighterLevel: null,
    wizardLevel: null,
    turnRebuke: false,
    familiar: false,
    wildShape: false,
  };

  const abMatch = text.matchAll(/\b(Str|Dex|Con|Int|Wis|Cha)\s+(\d+)\b/gi);
  for (const m of abMatch) {
    const key = ABILITY_MAP[m[1]] ?? ABILITY_MAP[m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()];
    if (key) result.abilities[key] = Math.max(result.abilities[key] || 0, parseInt(m[2], 10));
  }

  const casterMatch = text.match(/caster\s+level\s+(\d+)(?:st|nd|rd|th)?/i);
  if (casterMatch) result.casterLevel = parseInt(casterMatch[1], 10);

  const babMatch = text.match(/base\s+attack\s+bonus\s+\+?(\d+)/i);
  if (babMatch) result.baseAttackBonus = parseInt(babMatch[1], 10);

  const charMatch = text.match(/character\s+level\s+(\d+)(?:st|nd|rd|th)?/i);
  if (charMatch) result.characterLevel = parseInt(charMatch[1], 10);

  const fighterMatch = text.match(/fighter\s+level\s+(\d+)(?:st|nd|rd|th)?/i);
  if (fighterMatch) result.fighterLevel = parseInt(fighterMatch[1], 10);

  const wizardMatch = text.match(/wizard\s+level\s+(\d+)(?:st|nd|rd|th)?/i);
  if (wizardMatch) result.wizardLevel = parseInt(wizardMatch[1], 10);

  if (/\bability\s+to\s+turn\s+or\s+rebuke\s+creatures\b/i.test(text)) result.turnRebuke = true;
  if (/\bability\s+to\s+acquire\s+a\s+new\s+familiar\b/i.test(text)) result.familiar = true;
  if (/\bwild\s+shape\s+ability\b/i.test(text)) result.wildShape = true;

  return result;
}

function checkFeatPrereqs(feat, player) {
  const prereq = feat.Prerequisites;
  if (!prereq || typeof prereq !== 'string' || prereq.trim() === '') return true;

  const required = extractPrerequisiteFeatNames(prereq);
  if (required.length === 0) return true;

  const playerFeats = player?.getFeats?.() ?? [];
  const normalized = new Set(playerFeats.map((n) => n.toLowerCase().trim()));

  return required.every((name) => {
    const lower = name.toLowerCase().trim();
    if (normalized.has(lower)) return true;
    return [...normalized].some((p) => {
      const base = p.includes(' (') ? p.slice(0, p.indexOf(' (')) : p;
      return base.toLowerCase() === lower;
    });
  });
}

/**
 * Check if player meets all prerequisites for a feat.
 * @param {Object} feat - Feat object from feats.json (Name, Prerequisites)
 * @param {Object} player - Player instance
 * @returns {boolean}
 */
export function meetsPrerequisites(feat, player) {
  if (!feat) return false;
  const prereq = feat.Prerequisites;
  if (!prereq || typeof prereq !== 'string' || prereq.trim() === '') return true;

  if (!checkFeatPrereqs(feat, player)) return false;

  const parsed = parsePrerequisites(prereq);
  const level = player?.getLevel?.() ?? 0;
  const cls = player?.getClass?.() ?? '';

  for (const [key, minVal] of Object.entries(parsed.abilities)) {
    const total = player?.getAbilityTotal?.(key) ?? 0;
    if (total < minVal) return false;
  }

  for (const { skill, ranks } of parsed.skillRanks) {
    const have = player?.getSkillRanks?.(skill) ?? 0;
    if (have < ranks) return false;
  }

  if (parsed.casterLevel != null) {
    const casterLevel = player?.getCasterLevel?.() ?? 0;
    if (casterLevel < parsed.casterLevel) return false;
  }

  if (parsed.baseAttackBonus != null) {
    const bab = player?.getBaseAttackBonus?.() ?? 0;
    if (bab < parsed.baseAttackBonus) return false;
  }

  if (parsed.characterLevel != null && level < parsed.characterLevel) return false;

  if (parsed.fighterLevel != null) {
    if (cls !== 'Fighter' || level < parsed.fighterLevel) return false;
  }

  if (parsed.wizardLevel != null) {
    if (cls !== 'Wizard' || level < parsed.wizardLevel) return false;
  }

  // Clerics turn/rebuke; Paladins gain turn undead at 4th level.
  if (parsed.turnRebuke && !['Cleric', 'Paladin'].includes(cls)) return false;

  if (parsed.familiar && !['Wizard', 'Sorcerer'].includes(cls)) return false;

  if (parsed.wildShape) {
    if (cls !== 'Druid' || level < 5) return false;
  }

  // Note: weapon/armor "proficiency with the selected weapon" prerequisites are
  // intentionally not enforced — proficiency depends on the specific weapon chosen
  // at selection time (per-instance), which the model does not track. Following the
  // app's non-enforcing rule, such feats are left selectable rather than wrongly blocked.

  return true;
}
