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

### Animal companion and familiar stat blocks
**Symptom:** Druid/Ranger animal companions and Wizard/Sorcerer familiars have no stat block data — there's no way to pick one and see its stats on the sheet.
**Fix:** Collect every official D&D 3.5 stat block for all possible animal companions (every list tier) and every familiar. Store them as static JSON under `src/data/` (e.g. `animal_companions.json`, `familiars.json`) following the same shape as other reference data, and expose them via a `getCompanionByRef` / `getFamiliarByRef` accessor. UI integration into the player sheet is a follow-up once data exists.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — animal companion / familiar topic files; cross-reference Monster Manual stat blocks.

### Starting equipment and money per class on character creation
**Symptom:** When a new player sheet is created, the character starts with no gear and no money — the user has to fill it in manually every time.
**Fix:** When the sheet is created, seed starting equipment and starting gold for the chosen class following the D&D 3.5 starting package / starting gold rules. Logic belongs in the Player domain model ([src/lib/player/player.js](../../src/lib/player/player.js)), not in the creation component.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — class starting gold + starting packages; values per class live in `src/data/classes.json`.

### Conditions panel
**Symptom:** No way to mark the character as affected by conditions (prone, fatigued, shaken, sickened, dazed, stunned, blinded, etc.). Players track these on paper.
**Fix:** New player-sheet component (card in the sidebar or a dedicated section) where the user can toggle conditions. Each condition's mechanical effect (penalties to attack, AC, saves, skills, speed, etc.) should be applied automatically by the Player domain model so derived stats reflect the active conditions. Follow the "automatic but non-enforcing" rule — apply the effects but don't block actions.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — conditions topic file.

### Automatic item effects on the player sheet
**Symptom:** Magic items, masterwork gear, and other equipment with mechanical bonuses (cloak of resistance, ring of protection, +X weapons/armor, ability-score items, skill items, etc.) require the user to add the bonuses by hand in the various bonus fields.
**Fix:** Integrate as many item effects as possible directly in the player sheet so equipping/unequipping an item automatically applies its bonuses to the relevant derived stats (saves, AC, ability scores, skill checks, attack/damage, etc.). Item effect metadata should be encoded in the item JSON (`src/data/items.json` / `scrolls.json`) and consumed by the Player domain model, not by components.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — magic items, bonus stacking rules.

### Editable item effects + custom items
**Symptom:** There's no UI to add or change the stat bonuses an item grants, and no way to create a custom item with arbitrary bonuses and a custom description (homebrew gear, DM-awarded items, reflavored magic items).
**Fix:** Build on top of the "Automatic item effects" entry above. Add a UI on the player sheet to add/edit/remove the effects on any equipped item — each effect being a typed bonus (enhancement, deflection, resistance, morale, etc.) on a target stat (AC, save, ability, skill, attack, damage, speed, …). Also allow creating fully custom items with a user-supplied name, description, and effects list, stored on the player character (not in the static `src/data/*.json`). Custom items must flow through the same Player-model bonus pipeline so stacking rules apply consistently.
**Rules ref:** [obsidian-vault/dnd-rules/INDEX.md](../dnd-rules/INDEX.md) — bonus types and stacking.

---

When in doubt: read the relevant rules note first, then the corresponding `src/data/*.json`. Don't rederive a mechanic from memory if a topic file exists for it.
