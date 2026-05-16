# Metamagic

> How metamagic feats modify spells: slot level shift, application timing per casting style, stacking, item interaction, and counterspell behavior.

## Core mechanic

- A **metamagic feat** modifies a spell's effect (Empower, Maximize, Quicken, Silent, Still, Extend, Heighten, etc.). Applying a metamagic feat occupies a **higher-level slot** than the spell's normal level, but the spell still functions at its **original spell level** for save DC, attack bonus, and effective level interactions.
- Multiple metamagic feats may be applied to a single spell; the slot shifts sum.
- A given metamagic feat cannot be applied **twice** to the same spell (e.g. cannot Empower a spell twice for 200% damage).
- Per-feat details (slot adjustment, effect, restrictions) are in [src/data/feats.json](../../src/data/feats.json).

## Effects on the spell

- The spell continues to function at its **original level** for:
  - Save DC (`10 + original spell level + casting ability mod`).
  - Attack roll.
  - Effective level for caster-level interactions, dispel checks, antimagic, etc.
  - Counterspelling: a metamagic'd spell still counterspells (or is counterspelled by) its base spell normally. The metamagic feat does not change which spell counters it. (See [magic.md](magic.md) → counterspells when extracted.)
- The spell **occupies** a slot of the higher modified level (base + sum of metamagic feat adjustments).
- Modifications only apply to spells the caster **casts directly** — applying metamagic to a spell on a scroll/wand/potion requires the metamagic to have been applied **at item creation time**, not at activation. (Item activator does not need the metamagic feat.)

## Application timing

Depends on casting style:

### Prepared casters (wizard, cleric, druid, paladin, ranger)

- The metamagic feat is **chosen when preparing** the spell.
- The prepared spell occupies the modified higher-level slot from the moment of preparation.
- Casting time is **unchanged** from the base spell's casting time (e.g. preparing a *charm person* with Still Spell at L2 still takes a standard action to cast).

### Spontaneous casters (sorcerer, bard)

- The metamagic feat is **chosen at casting time**.
- Casting time is **increased by one step** — a 1-standard-action spell becomes a full-round action when metamagicked. A spell whose normal casting time is already 1 round becomes 1 full-round action + 1 round (i.e. 1 round + 1 round).
- The spell uses any available slot of the modified level.

### Cleric / druid spontaneous swap

- A cleric using spontaneous *cure*/*inflict* (or druid using *summon nature's ally*) may convert a **prepared metamagic'd** spell into the spontaneous version — using the higher slot they prepared, the spontaneous spell becomes metamagicked at no extra cost. The casting time for this conversion follows the **spontaneous-caster rule** (one step longer), even though the underlying caster is normally prepared.

## Spells the metamagic doesn't fit

- Not every metamagic feat works on every spell. Per-feat restrictions in JSON (e.g. Empower only works on spells with variable numeric effects).
- A spell with **no verbal component** is not eligible for Silent Spell; one with no somatic component is not eligible for Still Spell.
- Quicken Spell does **not** stack with itself; only one quickened spell may be cast per round, even if multiple are available.

## AoO interaction

- Silent Spell / Still Spell **do not eliminate** the AoO from threatening reach when casting (provoking-on-casting is tied to the act of casting in a threatened square, not to whether components are visible).
- **Quicken Spell** is an exception: a quickened spell **does not provoke** an AoO (because it is cast as a free action, not a standard action).

## Item creation interaction

- When **creating a scroll, potion, or wand** with a metamagic'd spell, the item is priced/leveled per the **modified spell level**, not the base level. (See [magic-items.md](magic-items.md) for cost formulas.)
- Activator of such an item does **not** need to possess the metamagic feat — the metamagic is baked into the item at creation.

## Counterspelling

- A spell modified by a metamagic feat **counts as the base spell** for purposes of counterspelling: it counters and is countered by its base form.
- The metamagic does not alter the spell's identification or interaction with *dispel magic* / counterspell readiness.

## Cross-references

- [feats.md](feats.md) — feat system, prerequisites, acquisition.
- [magic.md](magic.md) — base spellcasting, save DC formula, prepared vs spontaneous.
- [magic-items.md](magic-items.md) — item creation cost formulas including metamagic-modified levels.
- [combat.md](combat.md) — full-round actions and AoO triggers.
- [src/data/feats.json](../../src/data/feats.json) — per-metamagic-feat slot adjustment and effect.

## Sources

- Manuale del Giocatore — pp. 88–89
