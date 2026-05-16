# Spell Resistance

> A creature's innate magical defense; the caster-level check needed to overcome it.

## Core mechanic

- Some creatures (outsiders, golems, dragons, drow, etc.) have a **Spell Resistance (SR)** value: a flat number representing magical defense.
- When such a creature is the **target of a spell** (or stands inside an area effect of one), and the spell description has `Spell Resistance: Yes`, the caster must roll:

  `caster level check = d20 + caster level vs DC = creature's SR`

- **Caster level check ≥ SR** → spell penetrates and resolves normally on that creature.
- **Caster level check < SR** → spell has **no effect** on that creature (other targets in the area are unaffected by this).
- The check is made **once per creature** the spell affects (each creature with SR rolls separately).

## When does SR apply

- Only when the spell directly affects the SR-bearing creature.
- Effects that don't directly target SR-bearing creatures (e.g. an *acid arrow* hits the floor and splashes, or a *summon monster* creates a separate creature that then attacks) **do not** trigger SR for the area / aftermath.
- A spell with persistent effect (e.g. *wall of fire*) checks SR each time the creature interacts with it — typically each round it remains in the effect, or whenever it tries to cross.
- A spell already in effect when the creature enters the area: SR check at that moment.

## "Yes" variants in spell entries

| Entry | Meaning |
|---|---|
| Yes | SR applies normally. |
| No | SR does not apply; spell penetrates regardless. |
| Yes (harmless) | Beneficial spell; the SR-bearing creature may **voluntarily lower** its SR (standard action) to receive the spell. |
| Yes (object) | SR applies if the spell targets an object the SR-bearing creature is wielding/wearing/carrying. |

## Voluntary lowering of SR

- A creature with SR may **voluntarily suppress** it for one round as a **standard action**, to allow a beneficial spell from an ally.
- While suppressed, the creature's SR is 0 (any spell, friend or foe, penetrates).
- Returns to normal at the start of the creature's next turn.

## Modifiers to the caster level check

- **Spell Penetration** feat: +2 to caster-level checks vs SR.
- **Greater Spell Penetration**: +4 (replaces, doesn't stack with, Spell Penetration alone — total +4).
- **Domain power** or other feature granting "as if cast at caster level X higher" applies to the caster level check too (the higher caster level is used for the d20 + level roll).
- A wizard deliberately casting at a **lower caster level** (e.g. to mimic a lower-level spell) takes the lower caster level for the SR check as well.

## SR vs caster level differences

- A spell from a 5th-level caster vs a creature with SR 18:
  - `1d20 + 5` → needs **13** or higher to penetrate (1d20+5 ≥ 18).
  - 35% chance per cast that the spell takes effect.
- A spell from a 15th-level caster vs SR 18:
  - `1d20 + 15` → needs **3+**: 90% chance to penetrate.

## Spells that bypass SR

- Spells/effects with `Spell Resistance: No` always penetrate regardless of SR.
- Effects that aren't direct spell effects: AoEs that drop physical objects (not spells), summoned creatures' physical attacks, and similar indirect mechanisms.

## Stacking SR

- A creature has only one SR value at a time. If multiple effects grant or boost SR, **use the highest** (not sum).
- Some effects grant **temporary SR** (e.g. *spell resistance* spell, certain magic items); the spell's SR replaces the creature's natural SR if higher.

## Antimagic and SR

- Inside an *antimagic field*: spells don't function at all, so SR is irrelevant.
- A creature whose SR is **innate** (creature ability) loses SR within an antimagic field along with all other magic.
- A creature whose SR is **granted by a spell** (e.g. *spell resistance*) loses it inside antimagic.

## Cross-references

- [magic.md](magic.md) — caster level rules; "spell resistance: yes/no" entry in spell description.
- [special-abilities.md](special-abilities.md) — supernatural abilities are not subject to SR; spell-like abilities are.
- [feats.md](feats.md) — Spell Penetration, Greater Spell Penetration.
- [class-features.md](class-features.md) — domains/abilities granting effective caster level boosts.

## Sources

- Manuale del Giocatore — p. 178 (resistenza agli incantesimi)
