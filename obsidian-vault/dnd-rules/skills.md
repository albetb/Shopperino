# Skills

> Skill check resolution, ranks, class vs cross-class, DC scales, taking 10/20, aiding, synergy, and the format used by per-skill descriptions.

## Core mechanic

- **Skill check** = `d20 + skill modifier` vs DC (set by rules/DM) or opposed by another check (contested).
- Success when total ≥ DC (or > opposed roll). Ties on opposed: re-roll to break.
- A skill check is rolled only when failure is meaningful and uncertain; routine use that the character could clearly perform requires no roll.

## Formulas

- `skill modifier = ranks + key-ability mod + racial bonus + synergy + feat bonus + armor check penalty (if applicable) + misc`
- `skill check = d20 + skill modifier`
- Each purchased rank = `+1` to the skill check total.

## Skill points

- Skill points received per level = `class SP/level + Int modifier` (minimum 1 per level after Int mod).
- At **1st level** the pool is multiplied by 4: `(class SP/level + Int mod) × 4`.
- Humans gain `+1` SP per level (so `+4` at 1st level). Other racial bonuses to SP follow the same ×4 at 1st-level rule.
- All SP must be spent at the level they are gained; unspent points are lost.

## Class vs cross-class

- **Class skill**: 1 rank costs 1 SP. Max ranks at character level *L* = `L + 3` (so 4 at 1st level).
- **Cross-class skill**: 1 rank costs 2 SP. Max ranks at character level *L* = `(L + 3) / 2` (so 2 at 1st level).
- Mechanically, a class-skill rank and a cross-class rank both contribute `+1` to the check — cross-class only differs in cost and cap.
- A skill is "class" if it appears in *any* of the character's classes' class skill lists. Multiclass: the union of class skill lists.
- **Half ranks** in cross-class skills (`n + 1/2`) appear when the cap is fractional (e.g. cap = 2.5 at level 2). A half rank does **not** add to checks; it represents partial progress toward the next whole rank and is purely bookkeeping until the next rank completes.
- A rank in a cross-class skill that later becomes a class skill (via multiclassing) is preserved — it does not refund or convert; the cap simply rises.

## Difficulty Class scale

| DC | Difficulty | Examples |
|---|---|---|
| 0 | Very easy | Notice something obvious (Spot). |
| 5 | Easy | Climb a knotted rope. |
| 10 | Average | Hear an approaching guard. |
| 15 | Tough | Disable a simple trap. |
| 20 | Challenging | Swim against a strong current. |
| 25 | Formidable | Open an average lock. |
| 30 | Heroic | Long-jump 9 m. |
| 40 | Nearly impossible | Track an orc band 24 h after rain on hard ground. |

The DM sets the DC, optionally adjusting by ±2 for favorable/unfavorable circumstances (or modifying the bonus instead of the DC — same effect).

## Opposed (contested) checks

- Both characters roll their relevant skill check; higher total wins.
- Ties: re-roll (some skills specify a different tie-breaker — e.g. the side with the higher modifier wins on ties).
- The defender's skill may differ from the attacker's: e.g. Move Silently vs Listen, Hide vs Spot, Bluff vs Sense Motive.

## Taking 10 and taking 20

- **Take 10** — when **not threatened or distracted**, the player may skip the roll and use 10 as the result. Add modifiers normally. Useful to guarantee an average outcome on routine work.
- **Take 20** — when there is **no time pressure** AND **no penalty for failure**, the player can spend **20× the normal time** and treat the result as if a 20 was rolled. Models trying repeatedly until success.
  - Cannot take 20 on a skill with a fail-state consequence: Climb (fall on miss by 5+), Disable Device (springs the trap on a miss by 5+), Open Lock (auto-fails for the day if missed by 5+), Pick Pocket, etc.
  - Cannot take 20 on contested checks against another creature acting in time.
- **Spellcaster level checks** (e.g. to overcome spell resistance) **cannot** take 10 or 20.

## Retries

- **Default**: a failed skill check may be retried, indefinitely. The DM may impose a real-world or in-game time cost.
- **Exceptions**:
  - Some skills are auto-fail or have a consequence on miss by 5+ (Climb fall, Open Lock auto-fail for the rest of the day, Disable Device springs trap). Re-tries blocked while the penalty applies.
  - Some skills permit only one chance per encounter/situation (Diplomacy to influence an attitude — can't re-roll on the same audience until circumstances change).
  - Per-skill description overrides the default.

## Untrained use

- Most skills can be used with **0 ranks**: `check = d20 + ability mod + misc`.
- **Trained-only** skills require ≥1 rank to attempt at all. Marked in each skill's header.
- Untrained checks still apply ability mod, racial bonuses, armor check penalty, etc. They just lack ranks.

## Armor check penalty (ACP)

- Certain skills (typically physical-Dex or Str skills involving movement) are subject to the character's **armor check penalty** from worn armor, shield, and load.
- The ACP is a flat penalty to the skill check, applying whether trained or untrained.
- **Swim** doubles the ACP. (Footnote in Table 4-2.)
- The per-skill header indicates whether ACP applies.

## Aid another (collaboration)

- One character helps another by making the **same skill check vs DC 10**. Success grants `+2` to the primary character's check (some skills specify a different bonus).
- Multiple aiders each grant `+2` (DM may cap the number of helpers based on circumstance).
- **Aid another cannot be used on**:
  - Skills with a class-feature requirement (e.g. Search for traps with Search DC > 20 requires the rogue's *trapfinding*; helpers without trapfinding can't contribute).
  - Skills where only one person can act on the target (e.g. only one can Open Lock at a time on the same lock).

## Synergy bonuses

- Having **≥ 5 ranks** in skill X grants a `+2` synergy bonus to checks with related skill Y. Sometimes the bonus is conditional (only for a specific use of Y).
- The full mapping is the **`Synergies` array** in [src/data/skills.json](../../src/data/skills.json) (Table 4-5 in the rulebook), beside the `Skills` array whose `Description` prose still describes each one in words. Every core entry is "5 ranks, +2", so neither number is stored per entry. Examples of the pattern:
  - 5 ranks in **Tumble** → +2 to Balance, +2 to Jump.
  - 5 ranks in **Bluff** → +2 to Diplomacy, Intimidate, Sleight of hand, and Disguise (when acting in character while observed).
  - 5 ranks in **Knowledge (arcana)** → +2 to Spellcraft.
  - 5 ranks in **Handle animal** → +2 to Ride; +2 to wild empathy class checks.
  - 5 ranks in **Survival** → +2 to Knowledge (nature), unconditionally. It is **Search** that helps Survival, and only *to find or follow tracks*.
- A target is not always a skill: Handle animal feeds **wild empathy**, Knowledge (history) feeds **bardic knowledge**, and Knowledge (religion) feeds a **turning check** — the check only, never the turning damage roll.
- Synergy bonuses are a **named bonus** type — multiple +2 synergies to the same skill stack only if they come from *different* source skills. Diplomacy can reach +6, from Bluff, Knowledge (nobility and royalty) and Sense motive at once.

## Ability checks (no applicable skill)

- When no skill covers the activity, roll a raw **ability check**: `d20 + ability mod`.
- Used for arm-wrestling (Str check), holding breath (Con), labyrinth orientation (Int), etc.
- Some pure ability contests (e.g. tug of war between equally-prepared parties) skip the roll: stronger character wins on Str; ties roll once.
- Take-10 and take-20 work on ability checks the same as on skill checks (same restrictions).

## Time per check

- Per-skill descriptions specify the action type. Common patterns:
  - **Free action**: some quick checks made as part of movement.
  - **Move action**: e.g. Hide while moving.
  - **Standard action**: most active uses.
  - **Full-round action**: many high-impact uses.
  - **1 round or more**: longer tasks like Heal long-term care, Search per square.
- Time scales linearly when taking 20 (×20).

## Impossible / heroic feats

- DC 40+ represents the edge of mortal capability; DC 60+ is normally impossible. The DM may rule a task simply impossible regardless of modifiers.
- Conversely, characters with very high modifiers can routinely accomplish what seems impossible to ordinary people — by-the-book is by-the-rolls.

## Skill description format

Each per-skill entry uses this format:

- **Header line**: `SKILL NAME (KEY ABILITY; [TRAINED ONLY]; [ARMOR CHECK PENALTY])` — bracketed flags only if applicable.
- **General description** — what the skill does in fiction terms.
- **Check** — how to roll, what success/failure means, sample DCs.
- **Action** — time required.
- **Try Again** — whether retry is allowed; specific conditions if not the default.
- **Special** — extra effects: feats, racial bonuses, class abilities, scaling notes.
- **Synergy** — what bonuses this skill grants to others at 5+ ranks.
- **Restrictions** — class- or race-locked features.
- **Untrained** — only present if untrained use differs from the default.

## Edge cases & exceptions

- Buying a cross-class skill at the 4-SP cost yields 2 ranks (max at 1st level); buying it as a class skill at 4 SP yields 4 ranks.
- A natural 20 on a skill check is **not** an automatic success; a natural 1 is **not** an automatic failure. (Only attack rolls and saves have nat-20/nat-1 auto-rules.)
- Some skills become available *only* through class features (e.g. Search DC > 20 for traps requires *trapfinding*; Use Magic Device for divine spells from a scroll requires UMD with restrictions).
- A character without ranks in a trained-only skill cannot benefit from aid another on it as the primary character (they cannot make the check at all).
- Conditional synergies only apply when the condition is met (e.g. Survival synergy from Knowledge (nature) only when in a wilderness specific to the lore).

## Cross-references

- [skills-detail.md](skills-detail.md) — per-skill DCs, action types, retry rules, and skill-specific mechanics.
- [character-creation.md](character-creation.md) — 1st-level skill purchasing step.
- [ability-scores.md](ability-scores.md) — every skill is keyed to an ability.
- [classes.md](classes.md) — class skill lists and SP/level by class.
- [experience-and-leveling.md](experience-and-leveling.md) — max-rank caps update per character level.
- [equipment.md](equipment.md) — armor check penalty values.
- [src/data/skills.json](../../src/data/skills.json) — per-skill key ability, class/cross-class flags, ACP flag, trained-only flag, synergy mapping.

## Sources

- Manuale del Giocatore — pp. 6, 22, 61–66
