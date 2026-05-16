# Core Mechanic

> The universal d20 resolution used for every action whose outcome is uncertain.

## Core mechanic

- To resolve any uncertain action: roll d20, add relevant modifiers, compare total to a target value.
- Success if total ≥ target. Failure if total < target. Ties go to the actor.
- Target is either a fixed **DC** (Difficulty Class) set by rules/DM, or an opposed roll by another character.
- The same procedure powers ability checks, skill checks, attack rolls, and saving throws — only the inputs and target differ.
- Not every action requires a roll. The DM only calls for one when failure is meaningful and uncertain.

## Formulas

- `result = d20 + modifier`
- `success = result ≥ DC` (or `result ≥ opponent's result` for opposed checks)

## Check types

- **Ability check** — `d20 + ability modifier`. Used when no skill applies. Some skills cannot be substituted by a raw ability check (require training; see [skills.md](skills.md)).
- **Skill check** — `d20 + skill modifier` vs DC or opposed.
- **Attack roll** — `d20 + attack bonus` vs target's AC. See [combat.md](combat.md).
- **Saving throw** — `d20 + base save + ability mod` vs spell/effect DC. See [saving-throws.md](saving-throws.md).

## Edge cases & exceptions

- A natural 20 on an attack roll always threatens a critical and may auto-hit; a natural 1 always misses. (See [combat.md](combat.md) for critical confirmation.)
- The DM may make rolls in secret to preserve uncertainty.
- Rolls are otherwise made openly so all players see the result.

## Cross-references

- [dice.md](dice.md) — dice notation used by every formula.
- [combat.md](combat.md) — attack rolls and crit confirmation.
- [skills.md](skills.md) — skill check details.
- [saving-throws.md](saving-throws.md) — save check details.

## Sources

- Manuale del Giocatore — pp. 4–5
