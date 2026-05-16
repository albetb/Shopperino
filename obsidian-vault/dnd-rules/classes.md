# Classes

> Class system: HD, BAB and save progressions, skill points, class features, multiclassing combination rules. Per-class numeric data lives in [src/data/classes.json](../../src/data/classes.json).

## Core mechanic

A class defines a character's training and capabilities. Each class contributes, at each level the character has in it:

- A Hit Die value (rolled or fixed) added to HP.
- A **base attack bonus** (BAB) increment per its progression type.
- A **base save** increment per its progression type, for each of Fortitude, Reflex, and Will (each save is independently "good" or "poor" for the class).
- Skill points per level (a flat per-class number) + Int mod.
- Class features at specific levels (proficiencies, special abilities, spellcasting, etc.).
- A class skill list (skills purchasable at 1 SP/rank; others are cross-class at 2 SP/rank).

The 11 base classes are: Barbarian (Bbr), Bard (Brd), Cleric (Chr), Druid (Drd), Fighter (Grr), Monk (Mnc), Paladin (Pal), Ranger (Rgr), Rogue (Ldr), Sorcerer (Str), Wizard (Mag).

## Hit Die by class

| HD | Classes |
|---|---|
| d4  | Wizard, Sorcerer |
| d6  | Bard, Rogue |
| d8  | Cleric, Druid, Monk, Ranger |
| d10 | Fighter, Paladin |
| d12 | Barbarian |

### HP per level

- At 1st level (very first HD ever): take **max value** of the HD. Add Con mod.
- Each subsequent level (any class): **roll the class HD**, add Con mod. Negative results are ignored — gain at least **1 HP** per level regardless of low Con.
- A multiclass character rolls/applies HD of whichever class is being leveled.

## BAB progression

Three patterns. Class = one of them.

| Type | Formula | L1 | L5 | L10 | L15 | L20 |
|---|---|---|---|---|---|---|
| Good (full)  | `BAB = level`            | +1 | +5  | +10 | +15 | +20 |
| Medium (3/4) | `BAB = floor(3L/4)`      | +0 | +3  | +7  | +11 | +15 |
| Poor (1/2)   | `BAB = floor(L/2)`       | +0 | +2  | +5  | +7  | +10 |

- Good: Fighter, Barbarian, Paladin, Ranger.
- Medium: Cleric, Druid, Monk, Bard, Rogue.
- Poor: Wizard, Sorcerer.

### Iterative attacks

- A character with BAB ≥ +6 gains a **second attack** per full-attack action, at BAB −5.
- BAB ≥ +11: third attack at −10. BAB ≥ +16: fourth at −15.
- Iterative attacks come **only from BAB**. Bonuses from Str, size, race, weapon enhancement, etc. that push the total attack to +6 do **not** grant extra iteratives. Only the BAB itself triggers them.
- All iteratives apply other bonuses normally (Str, size, weapon enhancement, etc.).
- Iteratives are made only as part of a **full-attack** (full-round) action. A standard-action attack is one strike.

## Save progression

Each of the three saves (Fortitude / Reflex / Will) is independently "good" or "poor" for a class.

| Type | Formula | L1 | L5 | L10 | L15 | L20 |
|---|---|---|---|---|---|---|
| Good | `base = 2 + floor(L/2)` | +2 | +4 | +7 | +9  | +12 |
| Poor | `base = floor(L/3)`     | +0 | +1 | +3 | +5  | +6 |

- The total save = `base + relevant ability mod + misc`. Fort uses Con, Ref uses Dex, Will uses Wis ([saving-throws.md](saving-throws.md)).
- Multiclass: base saves from each class **add together** (sum the bases, then apply ability mod once).

## Skill points per level

- `SP gained at level L (in class X) = X's class SP/level + Int mod` (minimum 1).
- 1st level: pool is **×4** (and Int mod and racial bonuses are also multiplied).
- Class skill list is per class. The character's **class skills** are the union of all their classes' class skill lists.

### Class skill vs cross-class skill

- **Class skill**: 1 SP buys 1 rank. Max rank at level L = `L + 3` (so 4 at 1st level).
- **Cross-class skill**: 2 SP buys 1 rank. Max rank at level L = `(L + 3) / 2` (so 2 at 1st level).
- **Half ranks** in cross-class skills (denoted `n + 1/2`) exist when the cap is fractional (e.g. L2 cap = 2.5). A half rank does **not** add to checks — it's bookkeeping for partial progress toward the next full rank.

## Feat slots by level

- A feat is gained at character levels **1, 3, 6, 9, 12, 15, 18** (every level divisible by 3, plus 1st).
- `feat slots = 1 + floor(L / 3)`.
- Human bonus feat at 1st level, fighter bonus combat feats, and metamagic/item-creation feats from class progression are **additional** to these.

## Ability increases by level

See [experience-and-leveling.md](experience-and-leveling.md): +1 to one ability at every level divisible by 4 (4, 8, 12, 16, 20).

## XP and level

- See [experience-and-leveling.md](experience-and-leveling.md) for the XP-to-level formula.
- XP is tracked at the **character level** (total), not per class. A multiclass 3rd-level character needs the same XP as any other 3rd-level character.

## Class features

Per-class features are listed at specific levels in the class table. Common categories:

- **Weapon and armor proficiency** — which simple/martial/exotic weapons and which armor categories the class is trained in. Wearing armor without proficiency imposes the armor check penalty on attack rolls and many ability/skill checks. Wearing **any** armor (proficient or not) prevents an arcane caster from casting spells with somatic components without rolling arcane spell failure ([equipment.md](equipment.md) when written).
- **Spells** — see *Spellcasting in class tables* below.
- **Special** — unique abilities (rage, smite, sneak attack, wild shape, turn undead, etc.).
- **Bonus feats** — some classes grant extra feats at specific levels, drawn from a restricted list.

### Spellcasting in class tables

Class tables display a spells-per-day grid. Reading:

- **"—"** in a slot = the class **cannot** cast spells of that level at this class level. No bonus spells either.
- **"0"** = the class has access to that spell level for *bonus spells only*. If the character's casting ability is high enough to grant bonus spells of that level, those are the only slots gained.
- A positive integer = base spells/day of that level. Add bonus spells from casting ability ([magic.md](magic.md)).

Notes:

- A caster may always prepare/cast a lower-level spell in a higher-level slot.
- Some classes (paladin, ranger) gain no spellcasting until a later class level (e.g. 4th).
- Wizard/sorcerer bonus spells: Int-based / Cha-based respectively. Cleric/druid/paladin/ranger: Wis-based. Bard: Cha-based. See [magic.md](magic.md).

### Extraordinary, supernatural, and spell-like abilities

Class features (and racial features) come in three flavors:

- **Extraordinary (Ex)** — non-magical, no components, no AoO, no SR, no dispel.
- **Supernatural (Su)** — magical but not a spell. **Does not provoke AoO** when used; not subject to spell resistance; not counterspellable.
- **Spell-like (Sp)** — functions as the named spell, **no components needed**. **Provokes AoO** when used (treated like casting a spell); subject to spell resistance; can be counterspelled.

### Ex-class members

- If a character loses class status (e.g. paladin breaks code), the class description specifies what they keep and lose. Default: weapon/armor proficiencies already obtained are retained; class features dependent on standing are lost.

## Multiclass combination

When a character has levels in multiple classes:

- HD, BAB, base saves, and skill points stack from each class (BAB and saves are summed; HD are individually rolled when leveled).
- Class skill lists union.
- Class features stack only when explicitly noted (e.g. "ranger and druid animal companion levels stack"). Otherwise they progress separately.
- XP penalty for unbalanced multiclassing: see [multiclassing.md](multiclassing.md).

## Starting package (modello iniziale)

Each class provides an optional pre-built 1st-level template (skills, feats, equipment). It assumes **4 SP** spent on skills the class excels in. Players may use it whole, partial, or ignore it entirely.

## Edge cases & exceptions

- Iterative attacks: only BAB triggers them. A weapon enhancement that pushes total attack to +6 does not grant a second attack.
- HP minimum 1/level even with deeply negative Con mod.
- Half ranks in cross-class skills add nothing to checks until they become whole ranks (next purchase).
- Arcane spell failure applies even when the caster is proficient with the armor — proficiency only avoids the armor check penalty on attacks/skills, not the arcane spell failure chance.
- A "0" in a class spells/day column is *not* a base slot; it only converts bonus spells from a high casting ability into usable slots.
- Multiclassing into a class with poor save in the same category that was good in another class does not reduce the existing good-save total — bases simply add.

## Cross-references

- [character-creation.md](character-creation.md) — class selection step; per-class starting HP/equipment.
- [ability-scores.md](ability-scores.md) — Con → HP, Int → SP/level, casting ability per class.
- [skills.md](skills.md) — full skill mechanics; class vs cross-class.
- [saving-throws.md](saving-throws.md) — ability-keyed saves.
- [combat.md](combat.md) — BAB, AC, full-attack action for iteratives.
- [magic.md](magic.md) — bonus spells, casting minimums, spell save DC.
- [multiclassing.md](multiclassing.md) — favored class and XP penalty.
- [experience-and-leveling.md](experience-and-leveling.md) — XP table, feat-slot schedule, ability increases.
- [feats.md](feats.md) — feat selection rules.
- [class-features.md](class-features.md) — per-class named features (rage, sneak attack, smite, wild shape, etc.) and the familiar/animal companion/special mount sub-systems.
- [src/data/classes.json](../../src/data/classes.json) — per-class numeric data.

## Sources

- Manuale del Giocatore — pp. 21–23
