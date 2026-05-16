# Dice

> Notation and reading of dice rolls referenced throughout the rules.

## Core mechanic

- Notation: `XdY+Z` = roll `X` dice with `Y` faces, sum results, add `Z`. `Z` may be negative or omitted.
- Standard die set per player: d4, d6, d8, d10, d12, d20, plus a second d10 used for percentile.
- The d20 is the resolution die for all checks (see [core-mechanic.md](core-mechanic.md)). The other dice are used for damage, hit points, spell effects, durations, and random tables.

## Formulas

- `result = sum(X rolls of dY) + Z`
- Examples:
  - `1d8` → 1 to 8 (longsword damage).
  - `1d8+2` → 3 to 10 (longsword damage with Str +2).
  - `2d4+2` → 4 to 10 (e.g. *magic missile* at caster level 3).
  - `3d4+3` → 6 to 15.

## Percentile (d%)

- Roll two d10 of different colors. One is designated tens, the other units.
- `00` on tens + `0` on units = 100. Otherwise read as a 1–99 value.
- Some tables read only the tens die (00, 10, 20, …) or only the units die.

## Edge cases & exceptions

- Damage dice are rolled *after* the attack hits; they are not part of the d20 attack roll itself.
- A roll is only made when the outcome is uncertain — automatic successes/failures skip the dice.
- Rolls should be made openly; the DM may roll some in secret for atmosphere.

## Cross-references

- [core-mechanic.md](core-mechanic.md) — the d20 resolution itself.
- [combat.md](combat.md) — damage dice are tied to weapons and spells.

## Sources

- Manuale del Giocatore — pp. 5
