# Objects

> Object durability, attacking objects, breaking down doors / chains / walls, and object saves.

## Object stats

Every inanimate object has:

- **Hardness** — flat damage reduction subtracted from each hit before it counts against HP. If `damage − hardness ≤ 0`, the object takes no damage.
- **Hit points** — when reduced to 0, the object is **destroyed**. Damaged-but-not-destroyed objects function normally up to that point.
- **AC** — `10 + size mod + Dex mod`. Inanimate objects have Dex 0 (modifier −5), so a Medium static object = **AC 5**; Tiny carried object = AC 7; etc. Add an extra −2 AC if the attacker uses a full-round action to aim (auto-hit with a melee attack; +5 attack bonus with a ranged attack).
- **Sundering attended objects** (worn, wielded): use the bearer's Dex mod and size; provokes AoO; bearer's armor doesn't apply (touch-AC-like). See [combat-maneuvers.md](combat-maneuvers.md).

### Hardness scaling for size

Listed weapon/armor hardness assumes a **Medium** item.

- Each size category **smaller** than Medium: HP **÷2**.
- Each size category **larger** than Medium: HP **×2** (or per substance row).
- Hardness does not change with size (substance-driven).

### Substance hardness (typical, per 2.5 cm of thickness)

| Substance | Hardness | HP per 2.5 cm |
|---|---|---|
| Paper / cloth | 0 | 2 |
| Rope | 0 | 2 |
| Glass | 1 | 1 |
| Ice | 0 | 3 |
| Wood | 5 | 10 |
| Stone | 8 | 15 |
| Iron / steel | 10 | 30 |
| Mithral | 15 | 30 |
| Adamantine | 20 | 40 |

### Magic weapons / armor / shields

- Each `+1` enhancement adds **+2 hardness** and **+10 HP** to the item's base.
- E.g. `+1 longsword` = hardness 12, 15 HP; `+3 heavy steel shield` = hardness 16, 50 HP.

## Damage modifiers (vs objects)

- **Ranged weapon damage** vs objects: ÷2 before applying hardness (siege weapons exempt).
- **Energy attacks**:
  - Sound, acid: full damage; apply hardness normally.
  - Electricity, fire: damage **÷2** before hardness.
  - Cold: damage **÷4** before hardness.
- **Ineffective weapons** (DM call): some attacks just can't damage some objects (e.g. cutting a rope with a club, smashing a parchment with a hammer). The DM may rule the object takes no damage at all.

## Immunities

- Objects are immune to **nonlethal damage**.
- Objects are immune to **critical hits** (treated as constructs in this regard).
- Animated objects (golem-like creatures) are not immune — they're creatures, not inanimate.

## Vulnerabilities

- The DM may rule certain attacks deal **double damage** and/or **ignore hardness** in obvious cases (fire vs paper, axe vs wood door, slashing vs rope).

## Object saves

- **Unattended object** (sitting on the ground): always **fails** any saving throw it must roll. Any save-or-die effect on objects assumes failure (e.g. *disintegrate*).
- **Attended object** (held, worn, in a pocket): if its bearer is the target, the object uses the **bearer's save bonus** (use the bearer's better save). The bearer's save, not the object's.
- **Magic items** roll their own saves: base = `2 + ½ caster level` for Fort/Ref/Will. Use the higher of own save or bearer's.

## Striking an object as an attack action

- Attack vs object's AC; on hit, roll damage; subtract hardness; remainder reduces HP.
- A character may take a **full-round action** to aim a single deliberate blow at a static object: melee = **automatic hit**, ranged = **+5 attack bonus**.

## Breaking with brute force (Strength check)

Use when smashing or forcing rather than attacking with a weapon. Make a **Strength check** vs the object's break DC.

| Action | DC |
|---|---|
| Break a simple wooden door | 13 |
| Break a sturdy wooden door | 18 |
| Break a strong wooden door | 23 |
| Burst a chain (ordinary) | 26 |
| Bend an iron bar | 24 |
| Break manacles | 26 |
| Break a stout iron door | 28 |
| Break ropes binding a captive | 23 |
| Locked door modifier | +5 |
| Arcane lock modifier | +10 (if both, use higher only) |

- An object at **half HP or less** has its break DC reduced by **2**.
- Size modifier to the Str check (per category from Medium): Small −4, Tiny −8, Diminutive −12, Fine −16; Large +4, Huge +8, Gargantuan +12, Colossal +16.
- A **crowbar** grants a circumstance bonus to the check (item-specific, typically +2). A **portable ram** grants further bonuses and lets multiple PCs aid.

## Damaged vs destroyed

- An object remains **fully functional** until HP reaches 0. A door at 1 HP still bars passage; a longsword at 1 HP still cuts at full damage.
- At 0 HP the object is **destroyed** (no scrap to repair from in most cases).
- Damaged (not destroyed) items can be repaired with the **Craft** skill (see [skills.md](skills.md)).

## Cross-references

- [combat.md](combat.md) — attack-roll mechanics; energy damage; massive damage doesn't apply to objects.
- [combat-maneuvers.md](combat-maneuvers.md) — Sunder uses these object stats.
- [equipment.md](equipment.md) — weapon/armor weight and base values; weapon hardness/HP per row.
- [magic-items.md](magic-items.md) — magic items get own saves, increased hardness/HP per +1.
- [skills.md](skills.md) — Craft for repairs; Open Lock as alternative to brute force.

## Sources

- Manuale del Giocatore — pp. 165–167 (objects, hardness, HP, AC, damage modifiers, saves, brute force)
