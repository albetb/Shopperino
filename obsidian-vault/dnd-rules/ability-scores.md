# Ability Scores

> The six abilities, score generation, the modifier formula, what each ability drives, and the rules for changing scores during play.

## Core mechanic

- Six abilities: **Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma**.
- Every ability has a **score** (typically 3–18 at 1st level before racial mods) and a derived **modifier**.
- The modifier — not the raw score — is what gets added to d20 rolls, damage, save totals, etc.
- Every creature has every ability score. An ability score of 0 in any non-physical ability is impossible; a score of 0 means the creature is unconscious/dead (handled in creature rules).

## Formulas

- `modifier = floor((score - 10) / 2)`
- Examples: 10 → 0, 12 → +1, 14 → +2, 16 → +3, 18 → +4, 8 → −1, 6 → −2.

## Default score generation

- Roll `4d6`, drop the lowest die, sum the remaining three. Repeat six times for six unassigned values.
- Assign the six values to the six abilities as desired (after seeing the rolls).
- Apply racial ability modifiers (Table 2-1, [races.md](races.md)) *after* assignment. Racial mods may push a score below the rolled range.
- **Reroll allowed** if the rolled set is too weak: all six dice may be re-rolled if either *sum of modifiers (before racial mods) ≤ 0* OR *highest score ≤ 13*.

## What each ability governs

### Strength (Str)

- Adds to melee attack rolls.
- Adds to melee weapon damage rolls (including thrown weapons; *exception*: off-hand attacks get only ×0.5 Str bonus to damage, two-handed weapons get ×1.5). Bows generally do not add Str to damage (composite bows are an exception, up to the bow's rated Str bonus).
- Determines carrying capacity (see [equipment.md](equipment.md) once written).
- Keys skill checks for Strength-based skills.
- Penalties to Str also apply to attack rolls with bows that aren't composites.

### Dexterity (Dex)

- Adds to ranged attack rolls.
- Adds to AC, *provided the character is able to react to the attack*. (A flat-footed or unaware character loses Dex to AC.)
- Adds to Reflex saving throws.
- Keys skill checks for Dexterity-based skills.
- Important for any class wearing light/medium or no armor and for ranged combatants.

### Constitution (Con)

- Adds to HP per Hit Die (applied each time HP are rolled or fixed for a level).
- Adds to Fortitude saving throws.
- Keys Concentration checks (relevant for spellcasters).
- A change in Con modifier retroactively adjusts existing HP up or down by `Δmod × HD count`.
- A negative HP roll modifier (from very low Con) still grants **minimum 1 HP per level**.

### Intelligence (Int)

- Determines bonus languages known at character creation (see [languages.md](languages.md) when written).
- Adds to **skill points per level**. (Minimum 1 SP/level regardless of low Int.)
- Keys skill checks for Int-based skills.
- Wizards: casting ability — see *Casting ability* below.
- Animals have Int 1–2; humanoid-intellect creatures have Int ≥ 3.

### Wisdom (Wis)

- Adds to Will saving throws.
- Keys skill checks for Wis-based skills.
- Clerics, druids, paladins, rangers: casting ability — see *Casting ability* below.

### Charisma (Cha)

- Keys skill checks for Cha-based skills.
- Sorcerers and bards: casting ability — see *Casting ability* below.
- Drives clerics' and paladins' **turn undead** attempts and checks.

(Per-ability skill list lives in [src/data/skills.json](../../src/data/skills.json); each skill is keyed to a single ability.)

## Casting ability

Each spellcasting class has one ability that governs its magic:

- **Wizard** → Intelligence
- **Cleric, Druid, Paladin, Ranger** → Wisdom
- **Sorcerer, Bard** → Charisma

Rules tied to the casting ability:

- **Minimum to cast a spell of level L**: casting ability score ≥ `10 + L`. (Need Int 11 to cast wizard 1st-level spells, Int 19 for 9th-level, etc.)
- **Casting ability score ≤ 9**: cannot cast any spells from that class at all (regardless of class level).
- **Spell save DC** = `10 + spell level + casting ability mod`. (See [magic.md](magic.md) when written for full magic rules.)
- **Bonus spells per day** by ability score, per spell level — see [magic.md](magic.md).
- An ability drop that pushes the score below the spell-level minimum: the character cannot cast spells of that level until the score recovers. Lower-level spells are still castable.

## Changing ability scores during play

Ability scores can change after creation. All derived values (modifiers, HP, attack, AC, saves, skill points, spell access, bonus spells, DCs, etc.) update accordingly.

- **Level-up increase**: +1 to any one ability score at character levels **4, 8, 12, 16, 20**.
- **Magic spells/effects**: temporary or permanent ability changes. Examples: *ray of enfeeblement* lowers Str; *bull's strength* raises Str. An "entangling"/encumbering effect (intralciare) makes Dex behave as if 4 lower without actually changing the score.
- **Magic items (worn)**: enhancement bonus while the item is worn (e.g. *gloves of Dexterity*). Cap: a worn ability-boosting item cannot exceed **+6**.
- **Inherent bonuses** (from rare effects like *wish*): permanent ability score increases, stacking cap **+5**.
- **Ability damage** (poison, disease, some attacks): temporary loss. Recovers at **1 point/day per damaged ability** with rest.
- **Ability drain**: permanent loss. Restored only by spells such as *restoration*.
- **Aging**: ability scores change at certain age thresholds (Table 6-5). Physical abilities (Str/Dex/Con) tend to drop; mental abilities (Int/Wis/Cha) rise.
- **Retroactive recalculation**: when an ability score change alters a per-level derived value (e.g. Int → SP/level), the change applies to past levels as well. *Example*: Mialee's Int rises from 15 to 16 at 4th level via the level-up +1; her per-level skill points rise from 4 to 5. She immediately gains +1 SP retroactively for each prior level (3 SP, for levels 1–3), in addition to the 5 SP for 4th level.

## Bonus spell stacking note

- Bonus spells from Table 1-1 are added to the class's base spells-per-day grid for the casting class. A character with two casting classes computes bonus spells separately for each (each based on its own ability and spell level).

## Edge cases & exceptions

- A racial ability adjustment can push a generated score below 8; scores are not floored during character creation.
- Worn magic items don't stack with each other for the same ability — only the largest enhancement bonus applies (general magic item rule).
- The same ability score can be both raised by magic gear (enhancement, capped +6) and by inherent bonuses (capped +5) simultaneously, since they are different bonus types.
- A Con drop temporarily reduces current HP; if it returns, HP return. A *permanent* Con drain reduces HP permanently.
- A casting ability score raised mid-career into a new spell-level minimum immediately enables that spell level (subject to class level allowing it).

## Cross-references

- [character-creation.md](character-creation.md) — step where scores are rolled and assigned.
- [races.md](races.md) — racial ability adjustments.
- [skills.md](skills.md) — each skill is keyed to an ability; Int drives SP/level.
- [saving-throws.md](saving-throws.md) — Fort=Con, Ref=Dex, Will=Wis.
- [magic.md](magic.md) — bonus spells, casting minimums, save DC.
- [experience-and-leveling.md](experience-and-leveling.md) — +1 ability at every 4th level.
- [combat.md](combat.md) — Str→melee, Dex→ranged & AC, Con→HP.

## Sources

- Manuale del Giocatore — pp. 6, 8–10
