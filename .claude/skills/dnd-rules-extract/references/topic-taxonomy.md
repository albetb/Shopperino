# Topic Taxonomy for `obsidian-vault/dnd-rules/`

Canonical file names. Use these when possible; only invent a new name when a topic genuinely doesn't fit any of these.

## Core systems

- **`core-mechanic.md`** — the d20 roll, success vs DC/contested rolls, when to roll vs auto-resolve.
- **`dice.md`** — dice notation (XdY+Z, d%), how each die is used, advantage/disadvantage equivalents if any.
- **`ability-scores.md`** — the six abilities, what each governs, ability modifier formula, score generation methods, racial adjustments, score-changing effects, ability damage vs drain vs penalty.
- **`character-creation.md`** — the ordered steps of building a 1st-level PC. Procedural overview; details belong in topic-specific files.
- **`experience-and-leveling.md`** — XP awards, level-up procedure, what changes per level, multiclassing XP penalty.
- **`alignment.md`** — the 9-cell grid, mechanical effects of alignment (detect alignment, alignment-locked classes, alignment-affecting magic).

## Character options

- **`races.md`** — racial trait mechanics (size, speed, ability adjustments, racial skills, level adjustment, favored class). Not the list of races (in `src/data/races.json`).
- **`classes.md`** — what defines a class, HD/skill points/BAB/save progressions, class features in general, restricted multiclassing, ex-class rules.
- **`prestige-classes.md`** — entry requirements, how they stack with base classes, common features like progressing existing class features.
- **`multiclassing.md`** — taking levels in multiple classes, XP penalty, favored class, BAB and saves combining rules.
- **`feats.md`** — what a feat is, prerequisite types, when feats are gained, feat types (general, item creation, metamagic, fighter bonus, etc.).

## Skills

- **`skills.md`** — skill system mechanics: ranks, max ranks by class/cross-class, class vs cross-class cost, ability mod, synergy bonuses, taking 10, taking 20, retries, untrained use, armor check penalty, opposed checks, aid another.

## Combat

- **`combat.md`** — round structure, initiative, action economy (standard/move/full/swift/immediate/free), attack roll, AC composition, damage, criticals (threat range, multiplier, confirmation), hit points, dying/dead thresholds, healing basics, combat modifiers (cover, concealment, flanking).
- **`attacks-of-opportunity.md`** — threatened squares, what provokes, reach, how many AoOs per round, Combat Reflexes effect.
- **`combat-maneuvers.md`** — grapple, trip, disarm, sunder, bull rush, overrun, feint, charge — the resolution mechanics of each.
- **`saving-throws.md`** — Fortitude/Reflex/Will, ability mapping, partial save effects, automatic 1/20 rules, save vs target DC formulas (e.g. spell save DC = 10 + spell level + casting ability mod).

## Magic

- **`magic.md`** — overarching spellcasting rules: arcane vs divine, spell levels, slots, preparation vs spontaneous casting, learning/forgetting spells, casting time, range, area, target, duration, saving throw, spell resistance, schools, descriptors.
- **`spell-components.md`** — verbal, somatic, material, focus, divine focus, XP cost; what prevents each.
- **`metamagic.md`** — how metamagic feats modify spell level/slot, stacking, applied at preparation vs casting.
- **`spell-resistance.md`** — when SR applies, caster level check, spells that ignore SR.
- **`counterspelling.md`** — readied action requirement, identification check, dispel magic as counter.

## Equipment

- **`equipment.md`** — wealth, encumbrance (light/medium/heavy load formulas keyed off Strength), carrying capacity scaling rules, armor check penalty + max Dex bonus + arcane spell failure mechanics, weapon categories (simple/martial/exotic, light/one-handed/two-handed, melee/ranged), proficiency, two-weapon fighting rules, weapon size scaling.
- **`magic-items.md`** — item categories, slots, activation methods (use-activated, command-word, spell completion, spell trigger), creation rules (DM-side but referenced by PC creators), identifying magic items.

## Exploration & survival

- **`movement.md`** — speed by size, terrain modifiers, tactical vs overland vs local movement, running, charge movement, mounted movement basics.
- **`vision-and-light.md`** — light levels, low-light vision, darkvision, blindsense, blindsight, concealment from poor visibility.
- **`environment.md`** — falling damage, drowning, suffocation, starvation/thirst, temperature extremes, poison.

## Conditions

- **`conditions.md`** — every named condition (stunned, prone, dazed, fatigued, exhausted, sickened, shaken, frightened, panicked, cowering, helpless, paralyzed, petrified, unconscious, etc.) with its mechanical effects, stacking, and removal.

## Social & narrative

- **`languages.md`** — racial languages, bonus languages from Int, literacy.
- **`time-and-distance.md`** — action durations, travel time, watches, scaling between rounds/minutes/hours/days for spell durations and effects.

---

## Naming rules

- Lowercase, hyphenated, `.md` extension.
- Singular noun for narrow concepts (`grapple.md` would be too narrow — folded into `combat-maneuvers.md`), plural for collections of similar things (`feats.md`, `conditions.md`, `races.md`).
- Avoid manual-specific names. The taxonomy is rules-system-oriented, not source-document-oriented.

## When to split a file

A topic file should split into two when:
- It exceeds ~300 lines AND
- It contains two clearly separable sub-systems that an implementer could read independently.

Example: `combat.md` is fine as one file initially; if attack-of-opportunity rules grow to dominate it, split into `attacks-of-opportunity.md` and cross-link.
