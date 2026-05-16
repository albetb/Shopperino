# Magic Items

> Item creation cost formulas, item-creation feat mechanics. Item categories, activation methods, slots, and identification will be added from later chapters.

## Item creation overview

A spellcaster with an appropriate **item-creation feat** can craft a permanent or single-use magic item by:

1. Spending **XP** = `1 / 25` of the item's gp market price.
2. Spending **raw materials** = `1 / 2` of the item's gp market price.
3. Spending **time** = `1 day` of work per `1,000 gp` of base price (minimum 1 day).
4. Having access to an appropriate workspace (magical laboratory, alchemy bench, etc.).
5. Meeting the item's prerequisite spells (cast during creation) and caster level.

The character cannot lose a level by spending XP on creation; they may spend up to their current level's XP buffer. After leveling up via adventure, they may immediately spend the new XP on creation if they choose.

## Base price formulas (single-spell items)

| Item | Base price |
|---|---|
| Scroll | `caster level × spell level × 25 gp` |
| Potion | `caster level × spell level × 50 gp` |
| Wand | `caster level × spell level × 750 gp` (50 charges) |

- **0-level spells**: count spell level as `1/2` in the formula.
- **Wands** have **50 charges** at creation; price is for the full 50.
- **Caster level** must be ≥ the **minimum** to cast the embedded spell (≥ 1 for a 1st-level spell; ≥ 3 for a 2nd-level spell; etc.). Higher caster level → more expensive but more powerful.

### XP and material cost from price

- **XP cost** = `base price / 25`.
- **Raw materials** = `base price / 2`.

### Extra material components

- Spells with a **costly material component** (e.g. *raise dead*'s 5,000 gp diamond) add the component's cost as an extra fee.
- **Potions / scrolls**: pay the component's cost **once** at creation (it is consumed).
- **Wands**: pay **50 ×** the component's cost (one per charge).
- These extras are paid in addition to the formula price.

### Other item types

- Some magic items have additional flat costs on top of the formula (e.g. *ring of three wishes* adds 3 × 5,000 = 15,000 gp on top of base, because *wish* has an XP component, and a permanent item enables 3 uses).
- Detailed pricing for non-spell items (rings, rods, staves, wondrous items, weapons/armor) is in the DMG. See [src/data/items.json](../../src/data/items.json) for game data.

## Time to create

- `1 day per 1,000 gp` of base price (minimum 1 day).
- A creator may work in 8-hour shifts; cannot spend XP if not actively working.

## Workspace requirements

- Most item-creation feats require an **appropriate workshop** or **laboratory**.
- Sample workshops: alchemy lab (+2 to Craft (alchemy)); magical laboratory.
- Without an appropriate workspace, creation is impossible (no improvisation).

## Item-creation feats (categories)

- **Scribe Scroll** — scrolls. Free bonus feat for wizards at L1.
- **Brew Potion** — potions.
- **Craft Wand** — wands.
- **Craft Staff** — staves.
- **Craft Rod** — rods.
- **Craft Wondrous Item** — wondrous items.
- **Craft Magic Arms and Armor** — weapons and armor.
- **Forge Ring** — rings.
- **Craft Construct** — DMG.

Each feat has its own prerequisites (caster level + sometimes a specific class).

## Activator does not need the creation feat

- The character **using** a created item never needs the item-creation feat used to make it.
- Activator must meet the item's own use requirements (alignment match, class feature, ability score, etc.) — or use the **Use Magic Device** skill to emulate any missing prerequisite (see [skills-detail.md](skills-detail.md#utilizzare-oggetti-magici-use-magic-device)).

## Interaction with metamagic

- An item that bakes in a **metamagic'd spell** is priced at the **metamagic-modified spell level**, not the base level (so a Maximize'd 3rd-level scroll uses spell level 6 in the formula).
- The activator does **not** need the metamagic feat. The metamagic is part of the item.
- For metamagic feats interacting with spell items, see [metamagic.md](metamagic.md).

## Edge cases & exceptions

- A creator's XP pool cannot drop below 0 (i.e. cannot lose a level from creation).
- A scroll's spell **cannot exceed** the creator's max castable spell level at the time of creation.
- A scroll/potion records the creator's **caster level**; the activator uses that caster level for any in-spell scaling (damage dice, range, duration), regardless of the activator's own level.
- A wand depletes a charge per activation; once 0 charges, the wand is inert until recharged (DM may allow recharging at the same cost rate; usually wands are single-life items).

## Cross-references

- [feats.md](feats.md) — feat system, item-creation feat category.
- [metamagic.md](metamagic.md) — metamagic in scrolls/wands/potions.
- [magic.md](magic.md) — caster level, spell preparation.
- [skills-detail.md](skills-detail.md) — Use Magic Device emulation for items.
- [src/data/items.json](../../src/data/items.json), [src/data/scrolls.json](../../src/data/scrolls.json) — per-item data.

## Sources

- Manuale del Giocatore — pp. 88–89
