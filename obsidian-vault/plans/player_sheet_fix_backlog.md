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

### Combat page — rework the header card
**Where:** [combat_page.jsx](../../src/components/player_sheet/combat_page.jsx), the `<Card padding>` block right at the top containing the badge portrait, class+level filigree, character name and the race/class pills.
**Change:** Redesign or replace the header card — in its current form it's mostly a placeholder (icon + name + repeated class pill) and doesn't earn its vertical space. Options to consider: drop it entirely and surface the character name elsewhere (e.g. in the page title), or fold useful per-character context into it (portrait when we have one, xp / encounter status, conditions like dying/disabled, quick-access actions).
**Why:** Right now it's the largest card on the page and adds no information the sidebar isn't already showing. Either give it a job or remove it.
**Open decisions (biggest one in this file):** drop the card entirely (and where does the character name go — into the page title?), or keep it and repurpose (portrait? conditions? xp? quick actions?). Need a concrete spec before any code lands.

---

### Fighter bonus combat feats
**Where:** [player.js](../../src/lib/player/player.js) — `getFeatPointsMax()`.
**Change:** Fighter gets one bonus combat feat at 1st level and one at every even level thereafter. Currently not included in the feat-points budget.
**Open decisions:** fold Fighter bonus feats into a single `getFeatPointsMax()` total, or split into `generalFeatSlots` + `classBonusFeatSlots` (two budgets shown separately in the UI)?

---

## Recommended attack order

1. **Verify math** — encumbrance, spell slots — against the rules notes. Catch any silent inconsistency before they bite.
2. **Header card spec** — pin down the open decision (drop vs repurpose) before touching code.
3. **Fighter bonus feats** — once the split-vs-fold call is made, isolated change in the model.

When in doubt: read the relevant rules note first, then the corresponding `src/data/*.json`. Don't rederive a mechanic from memory if a topic file exists for it.
