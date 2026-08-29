# Magic Items

> Item categories, the four activation methods, the worn-item body slots, the three held categories (rods, staffs, wands), item creation cost formulas, and item durability.

## Item categories

Armor and shields · weapons · potions · rings · rods · scrolls · staffs · wands · wondrous items. Plus **cursed** and **intelligent** items, and **artifacts** (minor: extremely rare but not unique; major: one of a kind).

Each category has its own activation method, its own place (worn, held, or carried) and its own pricing rules. The per-item data is in [src/data/items.json](../../src/data/items.json).

## Activation methods

Four methods. The item's description names one; when it does not, assume **command word**.

| Method | Used by | Who can activate | Action | Provokes AoO |
|---|---|---|---|---|
| Spell completion | Scrolls | High enough level in a class that can cast the spell | Standard | **Yes** |
| Spell trigger | Wands, staffs | Anyone with the spell **on their class spell list** | Standard | No |
| Command word | Default when unspecified | Anyone who knows the word | Standard | No |
| Use-activated | Worn/wielded items | Anyone who uses it as intended | Standard or none | No |

- **Spell completion** — the spell is already prepared and nearly cast; only the final gestures and words remain. A character not of high enough level in the right class may still try, at the risk of a **mishap**.
- **Spell trigger** — no gesture, just a word. **The gate is list membership, and level is irrelevant**: the rules explicitly extend this to a character who cannot yet cast at all (a 3rd-level paladin qualifies for spells on the paladin list). The user must still **determine which spell the item holds** before activating it.
- **Command word** — a key rather than a skill. Nothing else need be known. A command word that is an ordinary word risks accidental activation in conversation.
- **Use-activated** — drink it, wield it, wear it. **Standard action** when the use takes time (drinking a potion, putting on or removing a ring or hat); **not an action** when activation is one with the use (swinging a magic sword). It does not provoke unless the use itself does — walking through a threatened square in magic boots provokes because the *walking* does. Use-activation does not imply the user knows what the item does: they must know or guess and then use it, unless the benefit is automatic.

## Worn items: the twelve body slots

A humanoid may wear up to **twelve** magic items at once, one per group, each tied to the body part it is worn on:

head (diadem, hat, headband, helmet) · eyes (lenses, goggles) · neck (amulet, necklace, brooch, medallion, scarab, talisman) · torso (shirt, vest, robe) · body (armor or protective tunic, over the shirt) · waist (belt, over the armor) · shoulders (cape, cloak, mantle, over the armor) · arms (bracers, bracelets) · hands (glove, gloves, gauntlets) · **rings — one per hand, two maximum** · feet (shoes, boots)

- A character may **own** any number of the same kind, but benefits from only what the slots allow. A third ring does nothing; a second cloak worn over a cloak does nothing.
- Some items are **worn or carried without occupying a slot**; the item's own description says so.
- **Wands, rods and staffs are not on this list.** They are **held**, not worn — see below.

## Held items: rods, staffs, wands

The three categories that occupy a hand rather than a body slot. They differ in almost every respect and should not be treated as one family.

| | Rod | Staff | Wand |
|---|---|---|---|
| Spells | None — unique powers | Several | Exactly one |
| Spell level | — | Any | **4th or lower** |
| Charges | **Normally none** | 50, **one or more per spell** | 50, **one per use** |
| Activation | Varies per item | Spell trigger | Spell trigger |
| Who may use | **Anyone** | Spell on your class list | Spell on your class list |
| Caster level | Per item | Minimum **8th** | Minimum to cast the spell |
| Typical AC / hp / hardness / break DC | 9 / 10 / 10 / 27 | 7 / 10 / 5 / 24 | 7 / 5 / 5 / 16 |

### Rod

- Sceptre-like, with **unique magical powers rather than spells**, and normally **no charges**.
- **Anyone can use a rod** — there is no spell-list gate, unlike the other two.
- Activation varies per item and is given in the item's own description.
- **Many double as light maces or clubs** thanks to their sturdy build, so "held" and "is a weapon" are not exclusive.
- A rod **with** charges can never be intelligent.
- **Metamagic rods** are the one rod family with a rule shared across the whole set: three uses per day, they apply their feat **without raising the spell's slot level**, and the three tiers differ *only* in the highest spell level they reach — lesser 3rd, normal 6th, greater 9th. See [metamagic.md](metamagic.md).

### Staff

- Holds **several spells, of any level**; minimum caster level **8th**.
- **Must be held in at least one hand** to activate (or whatever serves as a hand).
- Casting through it is a standard action that does not provoke — unless the spell's own casting time is longer, which then governs.
- **Save DCs use the wielder's ability score and relevant feats.** Every *other* magic item uses the minimum ability score required to cast the spell, which is what makes a staff sharply better in a strong caster's hands.
- The wielder may substitute **their own caster level for the staff's, if theirs is higher** — raising range, duration and other level-dependent effects.
- Consequently staff spells are **harder to dispel** and **better at overcoming spell resistance**, especially for a wielder with Spell Penetration.

### Wand

- Holds **a single spell of 4th level or lower**. Each of its 50 charges casts that spell once.
- **Must be held in one hand and pointed** in the general direction of the target or area.
- Usable **while grappling or swallowed**.
- Standard action, does not provoke — unless the spell's casting time is longer.
- A wand out of charges is **a worthless stick**.
- Its caster level is the **minimum** needed to cast the spell, unless deliberately created higher (which raises the price).

## Item creation overview

A spellcaster with an appropriate **item-creation feat** can craft a permanent or single-use magic item by:

1. Spending **XP** = `1 / 25` of the item's gp market price.
2. Spending **raw materials** = `1 / 2` of the item's gp market price.
3. Spending **time** = `1 day` of work per `1,000 gp` of base price (minimum 1 day).
4. Having access to an appropriate workspace (magical laboratory, alchemy bench, etc.).
5. Meeting the item's prerequisite spells (cast during creation) and caster level.

The character cannot lose a level by spending XP on creation; they may spend up to their current level's XP buffer. After leveling up via adventure, they may immediately spend the new XP on creation if they choose.

- A prerequisite spell may be supplied by a **spell-trigger or spell-completion item** instead of by casting: one scroll consumed, or **one wand charge**, per day of creation.
- **Several characters may collaborate**, each supplying some prerequisites; they agree which of them counts as the creator for determining the item's caster level.

## Base price formulas (single-spell items)

| Item | Base price |
|---|---|
| Scroll | `caster level × spell level × 25 gp` |
| Potion | `caster level × spell level × 50 gp` |
| Wand | `caster level × spell level × 750 gp` (50 charges) |

- **0-level spells**: count spell level as `1/2` in the formula.
- **Wands** have **50 charges** at creation; price is for the full 50.
- **Caster level** must be ≥ the **minimum** to cast the embedded spell (≥ 1 for a 1st-level spell; ≥ 3 for a 2nd-level spell; etc.). The spell is assumed cast at that minimum unless the creator deliberately raises it — which costs more and is normally done for level-scaling spells (damage, duration).

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

## Item saving throws, damage and repair

- A magic item makes a save **only** when unattended, when it is the specific target of the effect, or when its holder rolls a **natural 1** on their own save.
- **Item save bonus = `2 + ½ caster level`** (round down), and it is **the same number for all three save types**. Exception: an intelligent item makes Will saves from its own Wisdom.
- A magic item takes damage as a mundane item of the same type unless stated otherwise. A **damaged** item keeps working; a **destroyed** one loses all its magic.
- Repairing with Craft costs the same as repairing a mundane item of the type. *Make whole* repairs a damaged item, never a destroyed one.
- See [objects.md](objects.md) for hardness, hit points and break DCs generally.

## Intelligent and cursed items

- Only **permanent** items can be intelligent. Single-use and charged items — potions, scrolls, wands, charged rods — **never** can be.
- Fewer than 1% of magic items are intelligent.
- Cursed items are built wrong or corrupted; they may harm the user or simply not be what they appear.

## Size and magic items

- Size normally does not prevent use: most magic clothing either fits anyone or adjusts magically to the wearer. Body size, shape and race should not bar a character from an item. A maker may deliberately restrict one to a race or size, but that is an exception a DM declares, not a default.

## Edge cases & exceptions

- A creator's XP pool cannot drop below 0 (i.e. cannot lose a level from creation).
- A scroll's spell **cannot exceed** the creator's max castable spell level at the time of creation.
- A scroll/potion records the creator's **caster level**; the activator uses that caster level for any in-spell scaling (damage dice, range, duration), regardless of the activator's own level. **A staff is the exception** — it uses the wielder's caster level when that is higher.
- A wand depletes a charge per activation; once 0 charges, the wand is inert until recharged (DM may allow recharging at the same cost rate; usually wands are single-life items).
- A spell-trigger item is gated on the **spell list only**, never on the user's level — a caster far below the spell's level activates it normally.

## Cross-references

- [feats.md](feats.md) — feat system, item-creation feat category.
- [metamagic.md](metamagic.md) — metamagic in scrolls/wands/potions.
- [magic.md](magic.md) — caster level, spell preparation.
- [spell-resistance.md](spell-resistance.md) — the caster level check a staff improves.
- [objects.md](objects.md) — hardness, hit points, break DCs.
- [skills-detail.md](skills-detail.md) — Use Magic Device emulation for items.
- [combat.md](combat.md) — activating an item as an action in a round.
- [src/data/items.json](../../src/data/items.json), [src/data/scrolls.json](../../src/data/scrolls.json) — per-item data.

## Sources

- Manuale del Dungeon Master — pp. 212–216, 234–247
- Manuale del Giocatore — pp. 88–89
