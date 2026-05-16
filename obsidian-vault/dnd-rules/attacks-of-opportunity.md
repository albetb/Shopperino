# Attacks of Opportunity

> Threatened squares, what provokes, how AoOs are resolved, reach, 5-ft step.

## Core mechanic

- A combatant **threatens** every square they could attack with a melee weapon (or natural attack) on their turn — normally the 8 adjacent squares for a Medium/Small creature.
- An **attack of opportunity (AoO)** is a free melee attack made out of turn against an enemy who performs a provoking action in a threatened square.
- AoO is at the character's full normal attack bonus (no full-attack iteratives).
- An AoO **interrupts** the provoking action only conceptually — it is resolved immediately, then the provoking action continues (or completes) unless the AoO incapacitates/disrupts the actor.

## How many AoOs per round

- **1 per round** by default.
- **Combat Reflexes** feat: gain extra AoOs equal to Dex modifier per round. Each AoO must be a different opportunity; you can never make more than one AoO against a single provoking action.
- Combat Reflexes also lets you make AoOs while flat-footed.
- Without Combat Reflexes, a flat-footed character cannot make AoOs.

## What provokes

- **Movement**: leaving a threatened square (NOT entering, NOT moving within). Each square left from a threatened square provokes from each enemy threatening it.
- **Ranged attacks** in melee.
- **Casting a spell** (unless cast defensively or instantaneous-cast).
- **Using a spell-like ability**.
- Many in-square actions: drinking a potion, retrieving a stowed item, standing from prone, picking up an object, loading a crossbow, using most skills, etc. See action table in [combat.md](combat.md) (Table 8-2 in source).
- **Unarmed attack** vs an armed opponent (the opponent's AoO is resolved before the unarmed strike).

## What does NOT provoke

- **5-ft step (passo di 1.5 m)**: non-action; never provokes; cannot be taken if any other movement was made this round.
- **Withdraw** (full-round action): the **first square** left from your starting position does not provoke; subsequent squares do.
- Attacking with a melee weapon (the attack itself).
- Casting a spell on the defensive (with successful Concentration DC `15 + spell level`).
- Casting a quickened or instantaneous-cast spell (1 free action).
- Touch attack delivery (the touch itself; the cast may still provoke).
- Most free actions, non-actions, and several supernatural abilities.
- Improved Unarmed Strike feat: unarmed attacks no longer provoke from the target.

## Reach

- **Medium / Small**: natural reach 1.5 m (1 square) — threatens 8 adjacent squares.
- **Large (tall)**: natural reach 3 m (2 squares) — threatens out to 2 squares including diagonals.
- **Reach weapons** (e.g. longspear, glaive): threaten at 3 m (2 squares) but **cannot** attack adjacent squares (1.5 m). Wielder still threatens the reach band only.
- Larger creatures with reach weapons extend reach further (creature-specific).
- Diagonal reach for non-adjacent uses standard 3-m diagonal counting (every 2nd diagonal counts as 2 squares).

## Resolution sequence

1. Defender begins a provoking action.
2. Each threatening enemy with an AoO available may take one against the defender, at full attack bonus, before the action resolves.
3. AoO is rolled and damage applied immediately.
4. Defender's action continues (unless killed/disrupted).
5. For spellcasting interrupted by AoO damage: Concentration DC `10 + damage + spell level` or lose the spell.

## Edge cases & exceptions

- A character provokes only **once per opportunity** from any given enemy (a single foe can't AoO the same provoking action twice, even with Combat Reflexes).
- Multiple distinct provoking actions in the same round each provoke separately (subject to AoO limit per round).
- A character with reach who also threatens adjacent squares (via natural reach + reach weapon, or specific creatures) threatens both bands.
- Moving from one threatened square to another threatened square typically provokes from both (one for leaving the first square; the second threatener gets it on the same step if the moving creature leaves the second's threat as well).
- Helpless / unconscious / paralyzed creatures don't make AoOs (no Dex/Reflex use, but more directly: cannot act).
- AoOs are made even if the character has already used their full-attack action this round.

## Cross-references

- [combat.md](combat.md) — round structure, action types, full table of actions vs AoO.
- [combat-maneuvers.md](combat-maneuvers.md) — many maneuvers provoke AoOs unless an Improved-style feat is held.
- [conditions.md](conditions.md) — flat-footed prevents AoOs (without Combat Reflexes).

## Sources

- Manuale del Giocatore — pp. 137–139, 141
