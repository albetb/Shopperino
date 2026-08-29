# D&D 3.5 Knowledge Index

This file is the entry point to all D&D 3.5 knowledge used by the Shopperino project. Two kinds of sources live in this repo:

1. **Rule notes** — condensed mechanic/formula descriptions in this folder (`obsidian-vault/dnd-rules/*.md`). Built by the `dnd-rules-extract` skill from the official manuals.
2. **Canonical data** — enumerated lists of spells, feats, items, classes, races, skills in [`src/data/*.json`](../../src/data/). Read directly by the app at runtime.

When implementing a rule-touching feature, **read the relevant topic file in this folder first** to understand the mechanic, then go to `src/data/*.json` for the actual values.

---

## Rule topics (auto-generated)

The list below is regenerated automatically by `.claude/hooks/update-dnd-index.mjs` every time Claude writes or edits a `.md` file in this folder. Do not edit by hand — your changes will be overwritten.

<!-- AUTO-INDEX:START -->
- [ability-scores.md](ability-scores.md) — **Ability Scores** — The six abilities, score generation, the modifier formula, what each ability drives, and the rules for changing scores during play.
- [alignment.md](alignment.md) — **Alignment** — The nine-alignment grid: what each is, how it matters mechanically, and how it interacts with classes and spells.
- [animal-companion.md](animal-companion.md) — **Animal Companion** — Druid / ranger animal-companion sub-system: how a companion is chosen, how it advances with class level (bonus HD, natural armor, ability boosts, tricks, special abilities), and the alternative creature lists with their level adjustments. Per-creature base stat blocks live in [src/data/animals.json](../../src/data/animals.json).
- [attacks-of-opportunity.md](attacks-of-opportunity.md) — **Attacks of Opportunity** — Threatened squares, what provokes, how AoOs are resolved, reach, 5-ft step.
- [character-creation.md](character-creation.md) — **Character Creation** — Ordered procedure for building a 1st-level player character. Procedural overview only — details live in the topic files.
- [class-features.md](class-features.md) — **Class Features** — Per-class catalog of named features and how they resolve mechanically. Per-class numbers (uses/day by level, damage dice, save DCs that depend on level, etc.) live in [src/data/classes.json](../../src/data/classes.json); this file documents the *mechanics* each feature triggers.
- [classes.md](classes.md) — **Classes** — Class system: HD, BAB and save progressions, skill points, class features, multiclassing combination rules. Per-class numeric data lives in [src/data/classes.json](../../src/data/classes.json).
- [combat-maneuvers.md](combat-maneuvers.md) — **Combat Maneuvers** — Special melee actions: charge, two-weapon fighting, mounted combat, disarm, feint, splash weapons, overrun, trip, bull rush, sunder. Grapple is intentionally omitted (rarely used in this campaign).
- [combat.md](combat.md) — **Combat** — Round structure, action economy, attack resolution, AC, HP, damage, criticals, casting in combat, situational modifiers (cover/concealment/flanking).
- [conditions.md](conditions.md) — **Conditions** — Named status effects with mechanical consequences. Multiple conditions may apply simultaneously; effects stack unless they explicitly overlap.
- [core-mechanic.md](core-mechanic.md) — **Core Mechanic** — The universal d20 resolution used for every action whose outcome is uncertain.
- [counterspelling.md](counterspelling.md) — **Counterspelling** — Disrupting an enemy spellcaster mid-cast by readying a counter.
- [dice.md](dice.md) — **Dice** — Notation and reading of dice rolls referenced throughout the rules.
- [equipment.md](equipment.md) — **Equipment** — Wealth, coinage, starting gear, weapon categories and mechanics. Per-weapon stats (damage, crit, range, weight) live in [src/data/items.json](../../src/data/items.json); this file documents only the *systems* that drive how those numbers behave in play.
- [experience-and-leveling.md](experience-and-leveling.md) — **Experience & Leveling** — XP awards, the XP-to-level table, and what changes per level.
- [familiar.md](familiar.md) — **Familiar** — Sorcerer / wizard familiar sub-system: how a familiar is obtained, how its statistics are derived from the master, how it advances with the master's level (natural armor, Intelligence, special abilities), and the familiar creature list with each one's per-species bonus to the master. Per-creature base stat blocks live in [src/data/animals.json](../../src/data/animals.json).
- [feats.md](feats.md) — **Feats** — Feat system: how feats are acquired, prerequisites, categories. The list of specific feats and their effects lives in [src/data/feats.json](../../src/data/feats.json).
- [languages.md](languages.md) — **Languages** — Which languages a character knows, how to gain more, class-tied languages, and literacy.
- [magic-items.md](magic-items.md) — **Magic Items** — Item categories, the four activation methods, the worn-item body slots, the three held categories (rods, staffs, wands), item creation cost formulas, and item durability.
- [magic.md](magic.md) — **Magic** — Overarching spellcasting rules: casting ability, preparation vs spontaneous, schools, spellbook, spell description anatomy, combining magical effects, arcane vs divine procedures.
- [metamagic.md](metamagic.md) — **Metamagic** — How metamagic feats modify spells: slot level shift, application timing per casting style, stacking, item interaction, and counterspell behavior.
- [movement.md](movement.md) — **Movement** — Tactical movement on the grid: speed, diagonals, terrain, squeezing, creature size & reach, special movement rules.
- [multiclassing.md](multiclassing.md) — **Multiclassing** — Taking levels in two or more classes. Built incrementally; details on the XP penalty arithmetic are on p. 60 (future extraction).
- [objects.md](objects.md) — **Objects** — Object durability, attacking objects, breaking down doors / chains / walls, and object saves.
- [races.md](races.md) — **Races** — Racial trait *system*: the categories of traits a race grants, and how each category resolves. Per-race specifics (which abilities, which bonuses, which weapons, which languages) live in [src/data/races.json](../../src/data/races.json).
- [saving-throws.md](saving-throws.md) — **Saving Throws** — Fortitude / Reflex / Will resolution, ability mapping, save DCs.
- [skills-detail.md](skills-detail.md) — **Skills — Per-Skill Detail** — Per-skill DCs, action types, retry rules, and skill-specific mechanics. Skip everything captured by [src/data/skills.json](../../src/data/skills.json) (key ability, trained-only, ACP flag, class/cross-class map, synergy table). The system-level rules live in [skills.md](skills.md).
- [skills.md](skills.md) — **Skills** — Skill check resolution, ranks, class vs cross-class, DC scales, taking 10/20, aiding, synergy, and the format used by per-skill descriptions.
- [special-abilities.md](special-abilities.md) — **Special Abilities** — Categorization of non-spell abilities that creatures, classes, and items can use: Spell-like, Supernatural, Extraordinary, Natural.
- [spell-components.md](spell-components.md) — **Spell Components** — What each component is, what prevents it, and the suffix conventions in spell lists.
- [spell-resistance.md](spell-resistance.md) — **Spell Resistance** — A creature's innate magical defense; the caster-level check needed to overcome it.
- [traps.md](traps.md) — **Traps** — How a trap is assembled and priced: the element checklist (trigger, reset, bypass, attack-or-save, effect), the detection and disarm DCs, and the CR / cost / Craft formulas used to build one from scratch. The 105 sample traps and every numeric table on this page live in [src/data/traps.json](../../src/data/traps.json).
- [vision-and-light.md](vision-and-light.md) — **Vision and Light** — Light levels, special vision modes, miss chances and skill effects from poor visibility.
<!-- AUTO-INDEX:END -->

---

## Canonical data files (`src/data/`)

Hand-maintained map of enumerable data and which rule topics it relates to.

| File | Shape | Contains | Related rule topics |
|---|---|---|---|
| [`spells.json`](../../src/data/spells.json) | Array of spell objects | ~605 spells with Name, School, Level, Components, Casting Time, Range, Effect, Duration | `magic.md`, `spell-components.md`, `metamagic.md`, `spell-resistance.md` |
| [`scrolls.json`](../../src/data/scrolls.json) | `{ Arcane, Divine }` → scrolls | Pre-rolled scroll instances by tradition | `magic.md`, `magic-items.md` |
| [`feats.json`](../../src/data/feats.json) | `{ Feats: [...] }` | All feats with prereqs, type, description | `feats.md` |
| [`skills.json`](../../src/data/skills.json) | `{ Skills: [...] }` | All skills with key ability, trained-only flag, ACP flag | `skills.md` |
| [`races.json`](../../src/data/races.json) | `{ races: [...] }` | All races with size, speed, ability adj, racial features | `races.md` |
| [`classes.json`](../../src/data/classes.json) | `{ classes: [...] }` | All classes with HD, BAB/save progressions, skill points, class features | `classes.md`, `multiclassing.md`, `prestige-classes.md` |
| [`items.json`](../../src/data/items.json) | `{ Good, Ammo, Weapon, Specific Weapon, Armor, Specific Armor, Shield, Specific Shield }` | Mundane and specific weapons/armor/shields/gear with stats | `equipment.md`, `magic-items.md` |
| [`tables.json`](../../src/data/tables.json) | Object with many keyed tables | Lookup tables: shop types, magic item chance, scroll levels, weapon/armor bases, enums, etc. | `equipment.md`, `magic-items.md` (used mainly by Shop/Loot generators) |
| [`traps.json`](../../src/data/traps.json) | `{ traps: [...], tables: {...} }` | 105 sample traps CR 1–10 (trigger, reset, DCs, attack/save, damage, poison, cost, derived board `footprint`) + the generator tables (CR modifiers, cost modifiers, Craft DCs, enums) | `traps.md` |

### Reverse lookup: rule topic → data files

- **`magic.md`** ↔ `spells.json`, `scrolls.json`, parts of `tables.json` (scroll level, magic item chance)
- **`equipment.md`** ↔ `items.json`, `tables.json` (weapon/armor base tables)
- **`feats.md`** ↔ `feats.json`
- **`skills.md`** ↔ `skills.json`
- **`races.md`** ↔ `races.json`
- **`classes.md`** ↔ `classes.json`
- **`traps.md`** ↔ `traps.json`

### Access conventions

- Items and spells use a `link` string like `"items/Weapon/longsword"` or `"scrolls/Arcane/fireball"`. Resolve with `getItemByRef(link)` from [`src/lib/utils.js`](../../src/lib/utils.js).
- All derived player values (ability mods, BAB, saves, AC, skill totals, etc.) belong in the domain model at [`src/lib/player/player.js`](../../src/lib/player/player.js) — never recalculate them in components.
