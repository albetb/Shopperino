# Feats

> Feat system: how feats are acquired, prerequisites, categories. The list of specific feats and their effects lives in [src/data/feats.json](../../src/data/feats.json).

## Core mechanic

- A **feat** is a discrete special ability granting a new option or improving an existing one.
- A feat is either possessed or not — feats have **no ranks**.
- A feat may be selected only if all of its **prerequisites** are met at the moment of selection (ability score, BAB, class feature, skill ranks, other feat, class level, character level, etc.).
- A character who later **loses a prerequisite** (e.g. Str drops below 13 from *ray of enfeeblement*) **cannot use** dependent feats until the prerequisite is restored, but the feat itself is not lost.

## Acquisition

- Every character gains **1 feat at 1st level** and **1 more at every level divisible by 3** (so L3, L6, L9, L12, L15, L18). Formula: `feat slots from leveling = 1 + floor(L / 3)`. (Also in [experience-and-leveling.md](experience-and-leveling.md).)
- **Humans** gain an extra feat at 1st level.
- **Fighters** gain bonus combat feats at L1 and every even level thereafter (drawn from a fighter-bonus list — see below).
- **Wizards** gain bonus feats at L5, 10, 15, 20 (drawn from metamagic, item creation, or *Spell Mastery* — see [class-features.md](class-features.md)).
- **Other class-specific bonus feats** (rangers' Track and Endurance; monks' L1/2/6 picks; rogues' optional special-ability feat slot) are listed in [class-features.md](class-features.md).
- **Racial bonus feats** (e.g. dwarves' weapon familiarity is technically not a feat; but some races grant true bonus feats) follow their own rules.
- Bonus feats are **in addition** to the leveling feats, not in place of.
- Feats are chosen by the player, not assigned by the DM.

## Categories

A feat falls into exactly one category:

- **General** — no special restriction. Available to anyone meeting prerequisites.
- **Fighter bonus feat** — a subset of general/combat feats marked in [src/data/feats.json](../../src/data/feats.json) as available for the fighter's bonus selection. **All fighter bonus feats are also general feats** — any character can take them with their normal slot if prerequisites are met. The "fighter bonus" tag only restricts what *fighters* may select with their *bonus* slots.
- **Item creation** — allow a spellcaster to craft magic items (scrolls, potions, wands, rings, staves, wondrous items, weapons/armor, etc.). See [magic-items.md](magic-items.md).
- **Metamagic** — modify spells when cast or prepared. See [metamagic.md](metamagic.md).

## Prerequisites — kinds

- **Ability score**: e.g. Str 13.
- **Base attack bonus**: e.g. BAB +1.
- **Other feat**: e.g. *Power Attack* (Str 13).
- **Class level**: e.g. fighter level 4.
- **Character level**: e.g. character level 6.
- **Class feature**: e.g. ability to cast 1st-level arcane spells.
- **Skill rank**: e.g. 3 ranks in Tumble.
- **Race / racial trait**: a few feats are race-gated.
- **Alignment / deity**: a small number of feats.

Multiple prerequisites: all must be met. Selecting a feat at a level where multiple acquisitions happen simultaneously (e.g. picking a feat at the same level you reach the BAB threshold for it) is allowed — prerequisites met as of that level count.

## Multiclass interactions

- A multiclass character may take a feat at the level granted, applying any class's current level when checking class-level prereqs.
- A fighter's bonus feat slot may be spent on any feat from the fighter-bonus list, even if the fighter has other classes.

## Edge cases & exceptions

- Selecting a prerequisite feat at the same character level as the dependent feat is allowed only when both slots become available at that level (e.g. multiclass into a class that grants a bonus feat at 3rd character level, picking the prerequisite as a normal-progression feat and the dependent as the bonus).
- A feat with a **per-day usage limit** retains its limit independent of how it was acquired.
- A feat granted by a class as a bonus feat **ignores prerequisites** only if the class explicitly says so (e.g. ranger combat-style feats explicitly ignore prereqs; fighter bonus feats do **not** — they still require prereqs).
- Some feats can be selected **more than once**, each time applied to a different choice (e.g. *Weapon Focus* per weapon, *Skill Focus* per skill). Marked per feat in JSON.

## Cross-references

- [experience-and-leveling.md](experience-and-leveling.md) — feat-slot schedule by level.
- [classes.md](classes.md) — bonus-feat-granting classes.
- [class-features.md](class-features.md) — fighter, wizard, ranger, monk, rogue bonus feat details.
- [metamagic.md](metamagic.md) — metamagic mechanics.
- [magic-items.md](magic-items.md) — item creation mechanics and cost formulas.
- [src/data/feats.json](../../src/data/feats.json) — per-feat data: name, prerequisites, type tags (general/fighter-bonus/item-creation/metamagic), effect, repeatable flag.

## Sources

- Manuale del Giocatore — pp. 87
