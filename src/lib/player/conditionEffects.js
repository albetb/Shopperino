/**
 * Condition mechanical-effect data map + aggregator.
 *
 * Pure and Player-independent: the aggregator takes a flat list of active
 * condition instances ({ name, ability?, amount? }) and returns per-channel
 * contributions of the canonical shape { source, label, value }. This shape is
 * deliberately breakdown-ready — a future "tap a number to see why" UI can read
 * the same contributions with zero rework.
 *
 * Two channels are kept separate by design (see obsidian-vault/dnd-rules/conditions.md
 * and the plan preamble):
 *   1. ability — score deltas (and zero-overrides) that cascade through
 *      Player.getAbilityTotal into everything Str/Dex/Con/etc. touch.
 *   2. flat penalties — applied at each roll/stat site (attack, damage, saves,
 *      skills, ability checks, initiative, AC, HP, speed).
 *
 * Stacking rules are applied exactly once, here:
 *   - Fear ladder (Shaken < Frightened < Panicked): only the most severe applies.
 *   - Fatigue ladder (Fatigued < Exhausted): Exhausted supersedes.
 *   - Untyped penalties from different conditions stack (e.g. Shaken + Sickened).
 *   - "Lose Dex to AC" and "half speed" are booleans (many sources, applied once).
 *   - Ability damage/drain to the same ability sums.
 */

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/* Conditions whose effect comes from the stored instance (ability + amount). */
const ABILITY_PARAM = new Set(['Ability Damaged', 'Ability Drained']);
const ENERGY_DRAIN = 'Energy Drained';

/* Mutually-exclusive severity ladders — only the most severe member applies. */
const FEAR_SEVERITY = { Shaken: 1, Frightened: 2, Panicked: 3 };
const FATIGUE_SEVERITY = { Fatigued: 1, Exhausted: 2 };

/**
 * Static effect descriptors for non-parameterized conditions. Fields:
 *   ability       { str, dex, ... } additive score deltas
 *   abilityZero   ['dex', ...] abilities treated as effectively 0 (override)
 *   attack, damage, saves, skillsAll, abilityChecks, initiative, ac, hp  flat numbers
 *   loseDexToAC   boolean — deny Dex bonus to AC (general + touch)
 *   halfSpeed     boolean
 *   skillSpecial  [{ value, abilities?, names? }] penalties scoped to certain skills
 */
const EFFECTS = {
  Fatigued:      { ability: { str: -2, dex: -2 } },
  Exhausted:     { ability: { str: -6, dex: -6 }, halfSpeed: true },
  Entangled:     { ability: { dex: -4 }, attack: -2, halfSpeed: true },
  Shaken:        { attack: -2, saves: -2, skillsAll: -2, abilityChecks: -2 },
  Frightened:    { attack: -2, saves: -2, skillsAll: -2, abilityChecks: -2 },
  Panicked:      { saves: -2, skillsAll: -2, abilityChecks: -2 },
  Sickened:      { attack: -2, damage: -2, saves: -2, skillsAll: -2, abilityChecks: -2 },
  Dazzled:       { attack: -1, skillSpecial: [{ value: -1, names: ['Search', 'Spot'] }] },
  Deafened:      { initiative: -4 },
  Invisible:     { attack: 2 },
  Blinded:       { ac: -2, loseDexToAC: true, halfSpeed: true, skillSpecial: [{ value: -4, abilities: ['str', 'dex'], names: ['Search'] }] },
  Cowering:      { ac: -2, loseDexToAC: true },
  Stunned:       { ac: -2, loseDexToAC: true },
  'Flat-Footed': { loseDexToAC: true },
  Helpless:      { abilityZero: ['dex'] },
  Paralyzed:     { abilityZero: ['dex', 'str'] },
  Disabled:      { halfSpeed: true },
};

/** Sum the `value` of a contribution list. */
export function sumContributions(list) {
  return Array.isArray(list) ? list.reduce((acc, c) => acc + (Number(c.value) || 0), 0) : 0;
}

function emptyResult() {
  const ability = {};
  const abilityZero = {};
  ABILITY_KEYS.forEach((k) => { ability[k] = []; abilityZero[k] = []; });
  return {
    ability,
    abilityZero,
    attack: [],
    damage: [],
    saves: [],
    skillsAll: [],
    abilityChecks: [],
    initiative: [],
    ac: [],
    hp: [],
    loseDexToAC: [],
    halfSpeed: [],
    skillSpecial: [],
  };
}

/**
 * Resolve a single instance to an effect descriptor. Parameterized conditions
 * compute from the instance; everything else reads the static map.
 * Returns { effect, label } or null when the condition has no modeled effect.
 */
function resolveEffect(inst) {
  const name = inst && inst.name;
  if (typeof name !== 'string') return null;

  if (ABILITY_PARAM.has(name)) {
    const key = typeof inst.ability === 'string' ? inst.ability.toLowerCase() : null;
    if (!key || !ABILITY_KEYS.includes(key)) return null;
    const amount = Number.isFinite(inst.amount) ? inst.amount : 1;
    return { effect: { ability: { [key]: -Math.abs(amount) } }, label: `${name} (${inst.ability})` };
  }

  if (name === ENERGY_DRAIN) {
    const n = Number.isFinite(inst.amount) ? Math.abs(inst.amount) : 1;
    return {
      effect: { attack: -n, saves: -n, skillsAll: -n, abilityChecks: -n, hp: -5 * n },
      label: `${name} (${n})`,
    };
  }

  const effect = EFFECTS[name];
  return effect ? { effect, label: name } : null;
}

/**
 * Drop all but the most severe member of a mutually-exclusive ladder.
 * @param {Array} instances
 * @param {Object} severity name -> rank
 */
function collapseLadder(instances, severity) {
  const members = instances.filter((i) => severity[i.name] != null);
  if (members.length <= 1) return instances;
  const winner = members.reduce((a, b) => (severity[b.name] > severity[a.name] ? b : a));
  return instances.filter((i) => severity[i.name] == null || i === winner);
}

/**
 * Aggregate a list of active condition instances into per-channel contributions.
 * @param {Array<{name:string, ability?:string, amount?:number}>} instances
 * @returns {ReturnType<typeof emptyResult>}
 */
export function aggregateConditionEffects(instances) {
  const out = emptyResult();
  if (!Array.isArray(instances) || instances.length === 0) return out;

  // Resolve mutually-exclusive ladders before applying anything.
  let active = collapseLadder(instances, FEAR_SEVERITY);
  active = collapseLadder(active, FATIGUE_SEVERITY);

  active.forEach((inst) => {
    const resolved = resolveEffect(inst);
    if (!resolved) return;
    const { effect, label } = resolved;
    const source = inst.name;
    const c = (value) => ({ source, label, value });

    if (effect.ability) {
      Object.entries(effect.ability).forEach(([k, v]) => {
        if (v && out.ability[k]) out.ability[k].push(c(v));
      });
    }
    if (Array.isArray(effect.abilityZero)) {
      effect.abilityZero.forEach((k) => { if (out.abilityZero[k]) out.abilityZero[k].push({ source, label }); });
    }
    if (effect.attack) out.attack.push(c(effect.attack));
    if (effect.damage) out.damage.push(c(effect.damage));
    if (effect.saves) out.saves.push(c(effect.saves));
    if (effect.skillsAll) out.skillsAll.push(c(effect.skillsAll));
    if (effect.abilityChecks) out.abilityChecks.push(c(effect.abilityChecks));
    if (effect.initiative) out.initiative.push(c(effect.initiative));
    if (effect.ac) out.ac.push(c(effect.ac));
    if (effect.hp) out.hp.push(c(effect.hp));
    if (effect.loseDexToAC) out.loseDexToAC.push({ source, label });
    if (effect.halfSpeed) out.halfSpeed.push({ source, label });
    if (Array.isArray(effect.skillSpecial)) {
      effect.skillSpecial.forEach((s) => {
        out.skillSpecial.push({
          source,
          label,
          value: s.value,
          abilities: s.abilities ? s.abilities.map((a) => a.toLowerCase()) : null,
          names: s.names || null,
        });
      });
    }
  });

  return out;
}

export { ABILITY_KEYS as CONDITION_ABILITY_KEYS };
