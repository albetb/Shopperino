# Character Creation

> Ordered procedure for building a 1st-level player character. Procedural overview only — details live in the topic files.

## Core procedure

Steps are executed in order; later steps may require revisiting earlier ones.

1. **Confer with the DM** — note campaign-specific rules, allowed sources, party composition.
2. **Roll ability scores** — generation method (see *Ability score generation* below). Record six unassigned numbers.
3. **Choose race and class** — race and class influence each other (racial ability mods favor some classes). See [races.md](races.md), [classes.md](classes.md).
4. **Assign and modify ability scores** — place the six rolled numbers into the six abilities, then apply racial modifiers from Table 2-1. See [ability-scores.md](ability-scores.md).
5. **Check the starting package** (modello iniziale) — each class provides an optional pre-built skill/feat/equipment template for fast setup.
6. **Record race and class features** — most are automatic; some require a choice.
7. **Select skills** — compute skill points, buy ranks. See [skills.md](skills.md).
8. **Select a feat** — every PC gets 1 feat at 1st level; humans get an extra feat; fighters get a bonus combat feat. See [feats.md](feats.md).
9. **Read Chapter 6 (Description)** — alignment, deity, age, height/weight, personality.
10. **Select starting equipment** — either the class's starting package, or roll starting gold and buy item-by-item.
11. **Record combat values** — HP, AC, initiative, attack bonuses, save bonuses (see *Derived values at 1st level* below).
12. **Fill in details** — name, sex, alignment, age, etc.

## Ability score generation

- Default method: roll `4d6`, drop the lowest die, sum the remaining three. Repeat six times. Assign the six results to abilities as desired.
- Racial ability modifiers (from Table 2-1) apply *after* assignment.

## Derived values at 1st level

- **HP at 1st level** = `max value of class HD + Con modifier`. (1st-level PCs do not roll their first HD.) Subsequent levels: roll the class HD and add Con mod, minimum 1 HP gained per level.
- **AC** = `10 + armor bonus + shield bonus + Dex mod + size mod` (+ natural armor, deflection, dodge, misc bonuses where applicable). Full composition in [combat.md](combat.md).
- **Initiative** = `Dex modifier` (+ 4 if Improved Initiative feat).
- **Attack bonus** = `BAB + Str mod` for melee; `BAB + Dex mod` for ranged. BAB is set by class progression.
- **Saving throws** = `base save + ability mod`. Fortitude uses Con; Reflex uses Dex; Will uses Wis. See [saving-throws.md](saving-throws.md).

## Skill purchases at 1st level

- Skill points pool = `(class skill points/level + Int mod) × 4` at 1st level. Humans get +1 SP/level (×4 at 1st level).
- Max ranks per skill at 1st level: **4 ranks** in a class skill, **2 ranks** in a cross-class skill (cross-class skills cost 2 SP per rank, so the cap is reached with 4 SP either way).
- Each rank adds `+1` to checks with that skill. Details and the rest of the skill rules in [skills.md](skills.md).

## Edge cases & exceptions

- Score generation method may be replaced by the DM (point-buy, standard array, etc.).
- A racial ability modifier can drop a score below 8; it is not clamped during generation.
- A 1st-level PC always takes the class's max HD value, even if multiclassing in (the *first* HD rolled is always the max).
- Starting package is optional — taking it locks in suggested skill ranks and gear but skips per-item shopping.
- Some races (e.g. humans) grant an extra feat and/or extra skill points at 1st level — applied during steps 7–8.

## Cross-references

- [ability-scores.md](ability-scores.md) — score generation and modifier formula.
- [races.md](races.md) — racial trait mechanics.
- [classes.md](classes.md) — class features, HD, BAB, save progressions.
- [skills.md](skills.md) — ranks, max ranks, class vs cross-class.
- [feats.md](feats.md) — feat slots and prerequisites.
- [combat.md](combat.md) — AC composition, attack bonus, HP.
- [saving-throws.md](saving-throws.md) — save composition.

## Sources

- Manuale del Giocatore — pp. 6
