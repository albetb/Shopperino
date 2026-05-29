# Player Sheet — Fix Backlog

> Punch list of broken and half-done state in the player sheet feature. Separate from `ui_changes_backlog.md` because these are **functional regressions** (model methods gone, schema mismatches, blocking bugs), not UI polish.
>
> Other tabs (Shop, Spellbook, Loot, Search) are in good shape — this file is scoped to Player Sheet only.
>
> When implementing rule-touching fixes, **read the relevant topic file in [obsidian-vault/dnd-rules/](../dnd-rules/) first** (entry point: [INDEX.md](../dnd-rules/INDEX.md)). All derived player values belong in the domain model at [src/lib/player/player.js](../../src/lib/player/player.js), never recalculated in components.

## Format

```
### <short title>
**Where:** <file paths + line numbers>
**Symptom:** <what's broken in the UI / what throws>
**Root cause:** <model method missing / schema mismatch / dead import / etc.>
**Fix:** <concrete change>
**Rules ref:** <which obsidian-vault/dnd-rules/*.md note + which src/data/*.json — optional>
```

---

## 🟠 Suspicious math (verify against rules notes)

### Spell slots per day / bonus spells from high ability score
**Where:** Player spells page — verify bonus slots from Cha/Wis/Int modifier add to base slots.
**Verify:** [magic.md](../dnd-rules/magic.md) — bonus spells table (positive ability mod adds slots at every level the caster can already cast). Specialist Wizard gets +1 slot per level in their specialization school. Domain Cleric gets +1 domain slot per spell level.
**Open decisions:** scope — verification only, or also implement specialist Wizard +1 and Cleric domain +1 per level if found missing?
**Rules ref:** [magic.md](../dnd-rules/magic.md), [classes.md](../dnd-rules/classes.md), [classes.json](../../src/data/classes.json).

---

## Still TODO

### Per-class player sheet customization
**See:** [per_class_customization_backlog.md](per_class_customization_backlog.md) — full plan lives in its own file (one section per class plus shared sub-systems). Includes conventions, per-class checklist, open decisions, and implementation order.
**Tl;dr:** every base class needs its own block on the player sheet (rage tracker, smite tracker, sneak-attack dice, wild shape, lay-on-hands pool, favored enemies, etc.). Today only race-level toggles exist. Subsumes the previous standalone "Fighter bonus combat feats" item.

---

When in doubt: read the relevant rules note first, then the corresponding `src/data/*.json`. Don't rederive a mechanic from memory if a topic file exists for it.
