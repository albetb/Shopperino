# Experience & Leveling

> XP awards, the XP-to-level table, and what changes per level.

## XP to reach a level

- Cumulative XP needed to reach **character level L**: `XP = (L − 1) × L × 500`.
- Examples: L2 = 1,000; L3 = 3,000; L4 = 6,000; L5 = 10,000; L10 = 45,000; L20 = 190,000.
- XP is tracked at the **total character level**, regardless of class composition. A multiclass 5th-level character needs the same 10,000 XP as a single-class 5th-level character.

## Feat slots per level

- A standard feat is gained at character levels **1, 3, 6, 9, 12, 15, 18**.
- `feat slots gained by level L = 1 + floor(L / 3)`.
- Bonus feats from class (e.g. fighter, wizard) and from race (e.g. human) are **in addition** to these and follow their own schedules.

## Max ranks per skill at level L

- Class skill: `L + 3` ranks.
- Cross-class skill: `(L + 3) / 2` ranks. Fractional caps allow half ranks (no check bonus until completed).
- These caps update at every character level — even if no SP are spent in the skill, the cap rises.

## Ability score increases on level-up

- At character levels **4, 8, 12, 16, 20** (every 4th level), the character gains **+1 to one ability score** of their choice.
- The increase is permanent and stacks with prior level-up increases (a 20th-level character has 5 such +1s to distribute).
- The change recomputes all dependent values immediately: modifier, HP (if Con), AC/init/Ref (if Dex), attack & damage (if Str), skill points/level (if Int — retroactive for past levels), bonus spells / max spell level (if casting ability), etc.
- See [ability-scores.md](ability-scores.md) for the full list of dependent values and the retroactive-SP rule.

## Edge cases & exceptions

- A character at the XP threshold for level L+1 stays at level L until they actually level up (typically between adventures). Some class features explicitly trigger on leveling, not on XP gain.
- The multiclass XP penalty (see [multiclassing.md](multiclassing.md)) modifies XP awards, not the cumulative table.

## Cross-references

- [ability-scores.md](ability-scores.md) — score-change consequences and aging rules.
- [character-creation.md](character-creation.md) — 1st-level setup.
- [classes.md](classes.md) — BAB, saves, HD, skill points per level.
- [multiclassing.md](multiclassing.md) — favored class and XP penalty.
- [feats.md](feats.md) — feats gained at the schedule above.

## Sources

- Manuale del Giocatore — pp. 10, 22
