# Races

> Racial trait *system*: the categories of traits a race grants, and how each category resolves. Per-race specifics (which abilities, which bonuses, which weapons, which languages) live in [src/data/races.json](../../src/data/races.json).

## Core mechanic

A race contributes a fixed bundle of mechanical traits to a character at creation. Each race may include any of these categories:

- Ability score adjustments
- Size category
- Base land speed (and conditions under which it changes)
- Special senses (darkvision, low-light vision, blindsense, etc.)
- Racial skill bonuses (often conditional)
- Racial bonus feats (granted free, prerequisites waived)
- Saving-throw bonuses (vs specific effect categories)
- Effect-type immunities (e.g. immune to magical sleep)
- Weapon familiarity (treats listed exotic weapons as martial)
- Spell-like abilities (SLAs)
- Automatic and bonus languages
- Favored class

A trait's bonus type is usually "racial," which stacks with non-racial bonuses but not with another racial bonus to the same value.

## Ability adjustments

- Apply *after* the player assigns rolled scores to abilities.
- A racial Int adjustment cannot reduce Int below 3 (Int 1–2 is animal intellect); other abilities have no floor at creation.
- Adjustments are permanent and stack with later increases (level-up, magic items, inherent).

## Size category

The Player's Handbook covers Small and Medium PC races. Mechanical effect of size on a Medium baseline:

| Size | AC mod | Attack mod | Hide mod | Carry & lift × | Weapon size |
|---|---|---|---|---|---|
| Medium | 0 | 0 | 0 | ×1.00 | medium |
| Small  | +1 | +1 | +4 | ×0.75 | small |

- Attack and AC size mods are reciprocal: Small vs Medium hits +1 and is +1 harder to hit, so Small-vs-Small plays the same as Medium-vs-Medium.
- A Small character cannot wield a Medium weapon at full effectiveness; uses appropriately-sized weapons (see [equipment.md](equipment.md) when written).
- Carry/lift caps scale by ×0.75 for Small (other sizes scale by other factors — see "Bigger and Smaller Creatures").
- Speed for Small races is typically 6 m vs 9 m for most Medium races (per-race in JSON).

(Larger size categories are detailed in the Monster Manual.)

## Base land speed

- Listed per race; not modified by Dex or Str.
- Standard rule: medium/heavy armor or medium/heavy load reduces speed to 3/4 (handled in [equipment.md](equipment.md)).
- **Race-level exception**: some races (notably dwarves) ignore this reduction and keep base speed regardless of armor/load. This is a racial trait flag, not a general rule.

## Senses

- **Darkvision** — sees in total darkness up to a stated range, **black-and-white only**, otherwise like normal sight. Action and combat fully functional within range.
- **Low-light vision** — sees twice as far as a human in dim light (moonlight, starlight, torch). Color and detail preserved.
- The two stack: a creature with both can see in dim light at extended range and in total darkness up to its darkvision range.

## Saving-throw bonuses

- Granted as `+X racial bonus to saves vs <category>` (e.g. vs poison, vs spells, vs illusions, vs fear).
- Stacks with non-racial save bonuses.
- Multiple racial bonuses to the same save vs the same category do **not** stack; take the higher.

## Skill bonuses

- `+X racial bonus to <skill>` — adds to the relevant skill check.
- May be conditional (e.g. a stonework-detection bonus to Search). When conditional, only applies when the condition is met.

## Bonus feats

- A racial bonus feat is gained free at 1st level, *without* consuming the standard feat slot, and *ignoring* its normal prerequisites.
- Stacks with class-granted bonus feats and the standard 1st-level feat.

## Effect-type immunities

- E.g. "immune to *magical* sleep effects" — note this does **not** make the creature immune to natural sleep, only to spells/effects with the relevant effect type. Bonus saves vs related effects are sometimes attached on top of the immunity.

## Weapon familiarity

- Lets the race treat a specific exotic weapon as a martial weapon for proficiency purposes. The weapon stays exotic for everyone else.

## Spell-like abilities (racial)

- Function as the named spell, but with **no components** (verbal/somatic/material/etc. all waived).
- Usable a fixed number of times per day per the race.
- Caster level for racial SLAs = character total HD (or as the race specifies).
- Save DC = `10 + spell level + relevant ability mod` (typically Cha for innate SLAs).

## Languages

- Each race has automatic languages (free) and bonus languages (chosen from a list).
- High Int grants extra bonus languages at creation. Full mechanics in [languages.md](languages.md).

## Favored class

- Each race has one favored class. Humans and half-elves: "any" (whichever class the character has the most levels in).
- The favored class is exempt from the multiclassing XP penalty. See [multiclassing.md](multiclassing.md).

## Edge cases & exceptions

- A racial Int penalty cannot lower Int below 3; clamp to 3.
- Half-races count as both parent races for any effect that targets either parent race (e.g. anti-elf magic affects half-elves; orc-only items work for half-orcs). Half-races *cannot* multiply benefits — they pick the better of the two parents per effect, not both.
- Racial bonus feats waive prerequisites only for the granted feat itself, not for feats that depend on it.
- A racial skill bonus to a skill the character has 0 ranks in still applies (skill is usable untrained, or the bonus is allowed regardless if so noted).

## Cross-references

- [character-creation.md](character-creation.md) — step 3-4: choose race, apply racial mods.
- [ability-scores.md](ability-scores.md) — racial Int floor of 3, ability-mod recomputation.
- [languages.md](languages.md) — automatic and bonus languages, literacy.
- [multiclassing.md](multiclassing.md) — favored class and XP penalty.
- [combat.md](combat.md) — size mods to AC and attack.
- [equipment.md](equipment.md) — weapon size scaling, speed-with-load rule.
- [movement.md](movement.md) — base speed by size.
- [src/data/races.json](../../src/data/races.json) — per-race numeric data.

## Sources

- Manuale del Giocatore — pp. 11–20
