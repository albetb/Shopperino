# Conditions

> Named status effects with mechanical consequences. Multiple conditions may apply simultaneously; effects stack unless they explicitly overlap.

## Awareness / readiness

- **Flat-footed (colto alla sprovvista)** — before first action of combat, in surprise round if unaware, or whenever Dex bonus to AC is denied. Effects:
  - Lose Dex bonus to AC (and dodge bonuses).
  - Cannot make AoOs (unless Combat Reflexes feat).
  - Uncanny Dodge (rogue/barbarian class feature) negates flat-footed.

## Damage / death track

A character's HP determines this state.

- **1+ HP** — normal function.
- **0 HP — Disabled (inabile)**:
  - May take **either** 1 standard action OR 1 move action per turn (not both, no full-round, no swift).
  - Performing a standard action inflicts 1 HP of damage on the actor (dropping them to dying).
  - A move action that doesn't involve strenuous activity is "safe."
- **−1 to −9 HP — Dying**:
  - Unconscious, helpless.
  - Loses 1 HP per round.
  - Each round, 10% chance to stabilize naturally.
  - Once stable: 10% chance per round to regain consciousness; on regaining, becomes disabled (still at negative HP — losing 1 HP if they then act).
  - Stabilize via Heal check DC 15 (standard action) or any magical healing.
- **−10 HP or lower — Dead**.

## Staggered

- Triggered when **nonlethal damage equals current HP**. (Also some effects, e.g. *ray of exhaustion* secondary, may impose it directly.)
- Per turn: 1 standard action OR 1 move action (not both, no full-round).
- Returns to normal as soon as nonlethal drops below current HP, or current HP rises above nonlethal accumulated.
- If nonlethal then **exceeds** current HP → unconscious (helpless).

## Helplessness spectrum

- **Helpless** — bound, paralyzed, sleeping, unconscious, etc. Dex effectively 0 (−5 to AC), opponents get +4 to attack with melee, can be subject of coup de grace.
- **Coup de grace** (full-round action against helpless): automatic hit, automatic critical; victim takes max damage + critical multiplier, then must make Fortitude save DC `10 + damage dealt` or die outright.
- **Unconscious** — helpless, prone, no actions.
- **Paralyzed** — Dex/Str effectively 0; helpless; cannot move or speak; mental actions only.
- **Petrified** — turned to stone; helpless; if shattered, may die.

## Movement restrictions

- **Prone** — lying down. −4 to melee attacks; +4 AC vs ranged, −4 AC vs melee. Standing up = move action that provokes. Crawling = 1.5 m as move action, provokes.
- **Pinned** (in a grapple) — helpless-like but only vs grappler.

## Mental impairment

- **Dazed** — no actions for 1 round; Dex retained.
- **Stunned** — drops what's held, can't act, loses Dex to AC, −2 AC.
- **Confused** — random behavior each round (attack self/nearest, babble, etc.).
- **Fascinated** — focused on stimulus; −4 to reactive Spot/Listen; obvious threat breaks the effect.
- **Cowering** — frozen in fear; loses Dex to AC, −2 AC, no actions.
- **Panicked** — drops items, flees max speed away from source, −2 on saves/checks/attacks. Can't take any other action besides fleeing.
- **Frightened** — flees if able, −2 on attacks/saves/checks. May fight if cornered.
- **Shaken** — −2 on attacks, saves, checks. No flee compulsion.

## Fatigue

- **Fatigued** — −2 Str/Dex; cannot run or charge. Becomes exhausted if fatigued again.
- **Exhausted** — −6 Str/Dex; speed halved; cannot run or charge. Recovers to fatigued after 1 hour rest.

## Sense / perception

- **Blinded** — −2 AC, loses Dex to AC, half speed, −4 on Str/Dex skill checks, 50% miss chance on attacks.
- **Deafened** — −4 initiative, 20% spell failure on V spells, can't make Listen checks.
- **Sickened** — −2 attacks, weapon damage, saves, skill checks, ability checks.
- **Nauseated** — only move action per turn; no attacks, spells, concentration.

## Other

- **Grappled** — see grapple rules in [combat-maneuvers.md](combat-maneuvers.md). Loses Dex to AC vs non-grapplers; can only use light/natural weapons.
- **Entangled** — half speed, can't run/charge, −2 attack, −4 Dex.
- **Energy drained** — temporary negative levels (each: −1 to attacks/saves/checks, −5 max HP, −1 effective level for class abilities).

## Cross-references

- [combat.md](combat.md) — flat-footed in initiative, dying mechanics, coup de grace as full-round action.
- [attacks-of-opportunity.md](attacks-of-opportunity.md) — flat-footed denies AoOs without Combat Reflexes.
- [saving-throws.md](saving-throws.md) — Will saves vs fear/charm/compulsion that inflict mental conditions.
- [combat-maneuvers.md](combat-maneuvers.md) — grapple/pin states.

## Sources

- Manuale del Giocatore — pp. 135–137 (disabled, dying, dead, flat-footed)
