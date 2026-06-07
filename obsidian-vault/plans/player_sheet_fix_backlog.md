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

---

## Still TODO

### Per-class player sheet customization
**See:** [per_class_customization_backlog.md](per_class_customization_backlog.md) — full plan lives in its own file (one section per class plus shared sub-systems). Includes conventions, per-class checklist, open decisions, and implementation order.
**Tl;dr:** every base class needs its own block on the player sheet (rage tracker, smite tracker, sneak-attack dice, wild shape, lay-on-hands pool, favored enemies, etc.). Today only race-level toggles exist. Subsumes the previous standalone "Fighter bonus combat feats" item.

### Monster Manual bestiary — data, summon-spell links, and a Monster Book page
**Symptom:** Only the Player's Handbook animals (+ dire animals) exist as stat blocks ([src/data/animals.json](../../src/data/animals.json)). The rest of the Monster Manual is absent: summon spells (Summon Monster I–IX, Summon Nature's Ally I–IX) reference many creatures that have no data, animal-companion alternative lists need dinosaurs (Deinonychus, Elasmosaurus, Megaraptor, Triceratops, Tyrannosaurus — see [animal-companion.md](../dnd-rules/animal-companion.md)), and there's no in-app way to browse monsters.
**Fix:** Three parts, in order:
- **Data** — collect every Monster Manual stat block and store as static JSON under `src/data/` (e.g. `monsters.json`), following the same schema the animal parser produced (structured numeric fields + `raw`, `description`, `combat`, a `ref` like `monsters/<slug>`). Reuse/extend the one-off parser approach in [obsidian-vault/plans/](.) (`_animals_lib.mjs`). Animals already in `animals.json` can stay or be folded in — decide whether to merge into one `monsters.json` or keep `animals.json` as a subset. Cover all creature types (not just Animal): magical beasts, dragons, outsiders, undead, dinosaurs, etc.
- **Summon-spell links** — extend the link resolver so every creature referenced by the summon spells resolves to a card. Today `getAnimalByLink` ([src/lib/animal/animalsUtils.js](../../src/lib/animal/animalsUtils.js)) handles `monstersAnimal#…` / `monstersDitoDo#…` / `animals/…` against `animals.json`; generalize it (or add `getMonsterByLink`) to cover all `monsters*#<slug>` SRD anchor prefixes against the full bestiary, keeping the token-set matcher (exact → reverse-subset → size-variant group, dire/template variants excluded from generic groups). Verify every summon-spell anchor in [src/data/spells.json](../../src/data/spells.json) resolves.
- **Monster Book page** — a new top-level tab (new `currentTab` id in [src/store/slices/appSlice.js](../../src/store/slices/appSlice.js); see the tab table in [CLAUDE.md](../../CLAUDE.md)) that browses the bestiary: searchable/filterable list (by type, CR, size, environment) + the full stat-block card, plus a **random monster suggestion** generator (filter by CR range / environment / type and roll one, reusing the weighted-random helper used by the Shop/Loot generators). Master-mode tool, similar to Shop/Loot.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — special-abilities, combat; cross-reference Monster Manual stat blocks. Blocks the dinosaur entries in [animal-companion.md](../dnd-rules/animal-companion.md) and completes the "Animal companion and familiar stat blocks" item above.

### Automatic item effects on the player sheet — wondrous items + custom effects
**Done:** Weapons, armor, and shields apply their masterwork bonus, +X enhancement, and named special effects (flaming, holy, etc.) automatically — attack bonus, damage, AC, and shield bonus are computed from the equipped entries in [src/lib/player/player.js](../../src/lib/player/player.js) + [src/lib/utils.js](../../src/lib/utils.js).
**Symptom:** Wondrous items, rings, rods, staves, and any item that isn't a weapon/armor/shield still require the user to add their bonuses by hand (cloak of resistance, ring of protection, ability-score items, skill items, etc.). There is also no way to attach a custom mechanical effect to a user-created/edited item so it would feed into derived stats.
**Fix:**
- Extend the item-effect schema in `src/data/items.json` so wondrous items (and the other non-WAS categories) carry structured mechanical bonus metadata: target stat (save / ability / skill / AC / speed / etc.), bonus type (deflection, resistance, enhancement, competence, …), value, and any conditional gating.
- Wire the equipment slots (`other1`–`other4`, `armor` ring/amulet uses if relevant) through the Player domain model so equipping a wondrous item adds its declared bonuses to the matching derived stat with correct stacking-by-type semantics.
- Support custom item effects on the editable item card: the per-entry `overrides` mechanism (already in place for stat fields) needs a parallel `customEffects` channel so a user can mark an item as "+2 resistance to all saves" or "+1 dodge to AC" and have it flow into the player sheet the same way a built-in effect does.
- Keep "automatic but non-enforcing": apply the bonus, surface a visual warning when stacking rules would normally void a redundant same-type bonus, but never silently drop a value the user entered.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — magic items, bonus stacking rules.

---

When in doubt: read the relevant rules note first, then the corresponding `src/data/*.json`. Don't rederive a mechanic from memory if a topic file exists for it.
