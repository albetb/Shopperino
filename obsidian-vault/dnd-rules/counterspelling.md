# Counterspelling

> Disrupting an enemy spellcaster mid-cast by readying a counter.

## Core mechanic

1. **Ready an action**: choose "counterspell" with a target opponent. Standard action consumed by readying. See [combat.md](combat.md) → Ready.
2. When the target begins casting a spell on its turn, your readied action triggers **before the spell completes**.
3. **Identify the spell** with **Spellcraft check DC `15 + spell level`** (free part of the readied action; one chance only).
4. If identified, **cast the same spell** on the opponent (or use *dispel magic*, see below). The cast must consume one of your remaining slots/spells of the appropriate level.
5. Your spell is **expended** as part of the counter; the opponent's spell **fails** with no effect, slot consumed normally.

- Counterspelling works against **arcane and divine** spells alike.
- Both casters lose a slot/use; the readied action also consumes the counterspeller's standard action for the round.

## Same-spell counter

- The simplest counter: cast the **exact same spell** the opponent is casting.
  - A *fireball* counters a *fireball*.
  - A *cure light wounds* counters a *cure light wounds*.
- The caster must have the spell **prepared** (or known, for spontaneous) and an available slot of that level.

## Metamagic and counterspelling

- A spell with metamagic applied **counts as the base spell** for counterspell purposes — it can counter and be countered by the un-metamagicked version (and vice versa).
- E.g. a Quickened *fireball* still counters a normal *fireball*, and a normal *fireball* counters a Quickened *fireball*.

## Opposed-pair spells

- A small set of spells **explicitly counter** each other:
  - *Haste* ↔ *slow*
  - *Bull's strength* ↔ *ray of enfeeblement* (the latter counters the former)
  - *Enlarge person* ↔ *reduce person*
  - *Animate dead* ↔ *halt undead*
  - *Charm person* (and similar mind effects) ↔ *protection from evil* (suppresses while up)
  - *Cure*-line ↔ *inflict*-line
- Each spell's description states the explicit opposed-pair partner. Casting one of these as the counter to the other works **without needing the same spell**.

## *Dispel magic* as counterspell

- *Dispel magic* may be cast **as a counterspell** even when the spell being cast is not yet on the field.
  - Make a **dispel check**: `1d20 + caster level` vs `11 + opposing caster level` (capped per *dispel magic* rules). Success → opposing spell is countered.
  - Generally less reliable than a same-spell counter (especially against high-level casters), but **always available** if the counterspeller has *dispel magic*.

## Identification check (Spellcraft)

- DC = `15 + spell level`.
- One free attempt as part of the readied action; failure = cannot counter that cast.
- A character can also use Spellcraft to identify a spell being cast for other purposes (free action observation): same DC, same per-cast limit.
- **Cannot retry** in the same round on the same casting.

## Practical limitations

- Need to be aware of the opponent and have line of sight at the moment they start casting.
- Cannot counterspell a spell with casting time of 1 free action (e.g. quickened) — it's already cast before you can react.
- Counterspell a 1-round-cast spell when the **opponent begins casting** (their turn 1), not when it completes (their turn 2).
- A counterspeller can move at base speed before completing the readied action, but a 5-ft step counts.

## Cross-references

- [combat.md](combat.md) — Ready action mechanics; how readied initiative shifts after triggering.
- [magic.md](magic.md) — spell description structure; opposed-pair listings under each spell.
- [metamagic.md](metamagic.md) — metamagicked spells count as base.
- [skills.md](skills.md) — Spellcraft as the identification skill.
- [spell-resistance.md](spell-resistance.md) — counterspell vs SR is irrelevant (counterspell affects the spell, not the creature).

## Sources

- Manuale del Giocatore — pp. 170–171 (counterspelling, identification, dispel magic as counter)
