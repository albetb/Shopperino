# Multiclassing

> Taking levels in two or more classes. Built incrementally; details on the XP penalty arithmetic are on p. 60 (future extraction).

## Core concept

- A character may add a level in any class on level-up, not just continuing their existing class.
- Each class contributes its own HD, BAB, base saves, skill points, and class features at the levels purchased.
- There is no hard cap on the number of classes a character may take.

## Combining class numbers

- **BAB**: sum each class's BAB at the level taken. Iterative-attack thresholds (+6/+11/+16) trigger from the *total* BAB.
- **Base saves**: sum each class's base save at the level taken, for each of Fort/Ref/Will. Apply the ability modifier once on top.
- **HD/HP**: each new level rolls the new class's HD (1st HD ever is max). HP from prior classes are unchanged.
- **Skill points**: gained per level use the *new* class's SP/level value + Int mod (min 1).
- **Class skill list**: union of all classes' class skill lists. A skill that is class for any taken class is class overall.
- **Class features**: progress independently per class. They only stack when a class explicitly says so (e.g. some druid/ranger animal-companion features).

## Favored class

- Each race has a designated **favored class**.
  - Humans and half-elves: **"any"** — the favored class is whichever class the character has the most levels in. Ties allowed.
  - Other races: a single fixed class (e.g. dwarf → fighter, elf → wizard, gnome → bard, halfling → rogue, half-orc → barbarian; full list in [src/data/races.json](../../src/data/races.json)).
- The favored class is **exempt** from the multiclassing XP penalty.

## Multiclassing XP penalty (overview)

- If two or more of a multiclass character's class levels are sufficiently unbalanced, the character takes a percentage **XP penalty** on XP earned (full arithmetic on p. 60 — to be extracted).
- The character's **favored class is ignored** when computing the imbalance.
- For "any" favored class (humans / half-elves): the highest-level class is treated as favored and ignored, so a human can never trigger the penalty on their highest class. They *can* still trigger it among the remaining classes if those are sufficiently unbalanced.

## Class-specific multiclassing restrictions

- **Monk** — once a monk takes a level in any other class, they can **never gain another monk level**. Existing monk levels and abilities are retained.
- **Paladin** — once a paladin takes a level in any other class, they can **never gain another paladin level**. Existing paladin levels and abilities are retained as long as the code is not violated. Falling from grace (ex-paladin) is a separate matter that requires *atonement* before further advancement in any class — actually re-advancement in paladin specifically is blocked by the above rule; *atonement* restores existing paladin abilities, not advancement.
- **Druid** — alignment shift away from neutral or teaching Druidic to a non-druid → ex-druid status (loses class features) until *atonement*; advancement blocked while ex-druid.
- **Cleric** — gross alignment violation → ex-cleric (loses spells and class features) until *atonement*.
- **Barbarian** — must be **non-lawful**. Becoming lawful makes the barbarian an ex-barbarian (loses rage and fast movement); other features (DR, trap sense, uncanny dodge) are retained.
- **Bard** — must be **non-lawful**. Same model as barbarian on alignment shift.

## Edge cases & exceptions

- The favored class need not be the highest-level class for the exemption to apply — its levels simply don't count toward the imbalance.
- Some prestige classes never count toward the multiclassing penalty (specified per prestige class). See [prestige-classes.md](prestige-classes.md) when written.
- Multiclassing into monk or paladin is allowed; multiclassing **out of** them blocks further advancement in that class permanently.

## Cross-references

- [races.md](races.md) — favored class per race.
- [character-creation.md](character-creation.md) — race/class selection.
- [experience-and-leveling.md](experience-and-leveling.md) — XP awards and the penalty arithmetic (future).
- [classes.md](classes.md) — combining BAB/saves/skill-point progressions.
- [src/data/races.json](../../src/data/races.json) — favored-class data.

## Sources

- Manuale del Giocatore — pp. 11, 13, 21–22, 26, 33, 47–48, 51
