# Player Sheet — Fix Backlog

> Punch list of broken and half-done state in the player sheet feature. Separate from `ui_changes_backlog.md` because these are **functional regressions** (model methods gone, schema mismatches, blocking bugs), not UI polish. Background: an agent reverted ~20 files; the user patched some of it back but the player sheet is still in a non-shippable state across multiple sub-pages.
>
> Other tabs (Shop, Spellbook, Loot, Search) are in good shape — this file is scoped to Player Sheet only. Work top-down: blockers first, then half-done, then math verification, then polish.
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

## 🔴 Blockers (broken, won't render correctly)

### ✓ Combat page — missing player domain methods (done)
**Where:** [combat_page.jsx:92](../../src/components/player_sheet/combat_page.jsx#L92), [:151](../../src/components/player_sheet/combat_page.jsx#L151), [:154](../../src/components/player_sheet/combat_page.jsx#L154), [:248](../../src/components/player_sheet/combat_page.jsx#L248)
**Symptom:** Calls `player.getBaseLifeMax()`, `player.getBaseAttackBonus()`, `player.getPunchDamage()` — none exist on the Player class. Silent `undefined` return → the combat card renders blanks / NaN, and the life-max edit can't clamp its upper bound.
**Root cause:** Methods never restored after the revert; combat page expects three derived values the model doesn't compute.
**Fix:** Add the three methods to [src/lib/player/player.js](../../src/lib/player/player.js):
- `getBaseLifeMax()` — theoretical max HP (max roll on every HD + Con mod × level + class bonuses). See `class-features.md` for class HD.
- `getBaseAttackBonus()` — class progression lookup from [classes.json](../../src/data/classes.json) `baseAttack` for current class + level; multiclass = sum.
- `getPunchDamage()` — base `1d3` for Medium, Monk has special unarmed scaling by level (table in [class-features.md](../dnd-rules/class-features.md)).
**Rules ref:** [combat.md](../dnd-rules/combat.md) (attack resolution, HP, damage), [class-features.md](../dnd-rules/class-features.md) (Monk unarmed strike), [classes.json](../../src/data/classes.json).

---

### ✓ Feats page — `getFeats()` missing, feat array never initialized (done)
**Where:** [feats_page.jsx:45](../../src/components/player_sheet/feats_page.jsx#L45)–86, [playerSheetThunks.js:395](../../src/store/thunks/playerSheetThunks.js#L395)–409
**Symptom:** Feats page renders blank list; selecting feats does nothing visible (or partially writes but doesn't persist correctly).
**Root cause:** Player class tracks `featsUsed` (number of points spent) but has no `feats` array, no `getFeats()`, no `addFeat()` / `removeFeat()`. Thunks directly mutate `player.feats` without those methods, and the array is never initialized in `Player.load()` or serialized in `Player.serialize()`.
**Fix:**
1. Initialize `feats: []` in `Player.load()`; include in `Player.serialize()` so it round-trips through `compactApp` / `expandApp` in [appState.js](../../src/lib/appState.js).
2. Add `Player.getFeats()` → returns array of feat name strings.
3. Add `Player.addFeat(name)` / `Player.removeFeatAt(index)` — replace the raw mutations in [playerSheetThunks.js:395](../../src/store/thunks/playerSheetThunks.js#L395)–409.
4. Verify the feat point count (`featsUsed` vs `getFeatPointsMax()`) — see [feats.md](../dnd-rules/feats.md): 1 feat at 1st level + 1 per 3 levels + Human bonus +1.
**Rules ref:** [feats.md](../dnd-rules/feats.md), [feats.json](../../src/data/feats.json).

---

## 🟡 Half-done (renders but broken behaviour)

### ✓ Inventory page — case mismatch on item fields (done)
**Where:** [inventory_page.jsx:51](../../src/components/player_sheet/inventory_page.jsx#L51), [:107](../../src/components/player_sheet/inventory_page.jsx#L107)
**Symptom:** Inventory totals / per-item quantities look wrong; effect-by-id lookups silently miss; some rows render without their number.
**Root cause:** Code reads `it.number` (lowercase) but Player's inventory tuple uses `Number` (capital N). Code reads `effectId` (singular) but model stores `effectIds` (plural array).
**Fix:** In [inventory_page.jsx](../../src/components/player_sheet/inventory_page.jsx), change `it.number` → `it.Number`, and switch `effectId` lookups to iterate the `effectIds` array. Confirm the tuple shape against the Player model loader.

---

### ✓ Character sidebar card — `[!]` feat alert depends on broken feat counting (done)
**Where:** [menu_card_character.jsx:51](../../src/components/menus/player_sheet_sidebar/cards/menu_card_character.jsx#L51)–52
**Symptom:** The `[!]` warning that flags "you have unallocated feat points" never fires (or fires when it shouldn't).
**Root cause:** Depends on the feat array work (Blocker #2). The comparison `featUsed < featMax` is correct, but `featUsed` is wrong because feat selection writes are broken upstream.
**Fix:** Will be resolved as a side-effect of the feats-page blocker fix. Re-test once feats persist correctly.

---

### Features page — `onSetPlayerSpellOption` misleadingly named
**Where:** [features_page.jsx:114](../../src/components/player_sheet/features_page.jsx#L114), [playerSheetThunks.js:249](../../src/store/thunks/playerSheetThunks.js#L249)
**Symptom:** Functional — alignment changes save — but the thunk name suggests "spell options" when it actually routes moral/ethical alignment.
**Root cause:** Thunk was renamed/refactored at some point; the call site and thunk are mismatched in naming, not behaviour.
**Fix:** Rename the thunk to `onSetPlayerAlignment` (or split into `onSetMoralAlignment` / `onSetEthicalAlignment`) and update call sites. Low priority — purely a clarity issue.

---

## 🟠 Suspicious math (verify against rules notes)

### ✓ BAB — class progression not implemented (done)
**Where:** [player.js](../../src/lib/player/player.js) (no `getBaseAttackBonus` method); referenced from [combat_page.jsx:151](../../src/components/player_sheet/combat_page.jsx#L151)
**Verify:** D&D 3.5 BAB is a per-class progression (Good = +1/level, Average = +3/4 per level, Poor = +1/2 per level). Multiclass = sum of each class's BAB at its level. Confirm [classes.json](../../src/data/classes.json) `baseAttack` field contains the progression type or an explicit per-level value, then implement accordingly.
**Rules ref:** [combat.md](../dnd-rules/combat.md), [classes.md](../dnd-rules/classes.md), [multiclassing.md](../dnd-rules/multiclassing.md).

---

### ✓ Punch / unarmed strike damage (done)
**Where:** [player.js](../../src/lib/player/player.js) (no `getPunchDamage` method); referenced from [combat_page.jsx:154](../../src/components/player_sheet/combat_page.jsx#L154)
**Verify:** Base unarmed = `1d3` non-lethal for Medium size. Monk has special scaling: `1d6` at 1st, `1d8` at 4th, `1d10` at 8th, etc. (table in [class-features.md](../dnd-rules/class-features.md)). Implement Monk-specific path; fall back to size-based default for everyone else.
**Rules ref:** [combat.md](../dnd-rules/combat.md), [class-features.md](../dnd-rules/class-features.md).

---

### Encumbrance & carrying capacity
**Where:** Inventory page — verify total weight vs Str-based light/medium/heavy/max load thresholds.
**Verify:** Capacity table in [equipment.md](../dnd-rules/equipment.md) (look for "Carrying Capacity" by Strength score). Halflings / Gnomes have ×3/4 modifier; quadrupeds ×1.5. Check that the Player model's encumbrance helpers use the right table and apply size modifier.
**Rules ref:** [equipment.md](../dnd-rules/equipment.md), [races.md](../dnd-rules/races.md), [races.json](../../src/data/races.json).

---

### Spell slots per day / bonus spells from high ability score
**Where:** Player spells page — verify bonus slots from Cha/Wis/Int modifier add to base slots.
**Verify:** [magic.md](../dnd-rules/magic.md) — bonus spells table (positive ability mod adds slots at every level the caster can already cast). Specialist Wizard gets +1 slot per level in their specialization school. Domain Cleric gets +1 domain slot per spell level.
**Rules ref:** [magic.md](../dnd-rules/magic.md), [classes.md](../dnd-rules/classes.md), [classes.json](../../src/data/classes.json).

---

## ✅ Working (confirmed by audit — don't touch)

- **Note editor** — idle-save, local text state, unsaved indicator all working.
- **Skills page** — `getSkillTotal`, `getSkillRanks`, `getMaxSkillRanks` exist and are wired correctly; armor penalty logic present.
- **Race / Class cards** — static trait/feature display works; selection dispatch works.
- **AC + saving throws** — `getArmorClass`, `getContactAC`, `getFlatFootedAC`, `getTotalFortitudeSave`, `getTotalReflexSave`, `getTotalWillSave` all present and match D&D 3.5 formulas.
- **Sidebar cards** — collapse / select / state persistence all working (modulo the feat alert depending on #2).

---

## Done in this pass (summary)

- **player.js** — added `feats: []` to constructor, load() and serialize(); added `getFeats()`, `addFeat()`, `removeFeatAt()` (used by existing thunks). Added `getBaseLifeMax()` (HD_max × level), `getBaseAttackBonus()` (parses `x1` / `x3/4` / `x1/2` from classes.json), `getPunchDamage()` with PHB size-based default and Monk's level-scaled table from class-features.md.
- **inventory_page.jsx** — fixed `it.number` → `it.Number` and rewrote `getEffectById` to look up by index (the silent miss on the non-existent `inv.effectId` field is gone).
- **combat_page.jsx** — removed the hard clamp on max life edits; allows house-rule HP; added a `Pill tone="warn"` showing "Over PHB max (X)" when the value exceeds `HD_max × level`, per the "rules signaled, never enforced" policy in CLAUDE.md.
- **feats_page.jsx** — "Choose feat" button is always available; warning pill "Over cap (X extra)" shows when feat count exceeds `getFeatPointsMax()`. Non-repeatable feat protection (per [featChoices.js](../../src/lib/featChoices.js)) still applies.
- **menu_card_character.jsx** — `[!] Feats` sidebar alert now reads from `getFeats().length` instead of the stale `featsUsed` counter, so it fires correctly once the feats array is populated.

## Still TODO

### Skills edit mode — sticky used/total ranks pill
**Where:** [skills_page.jsx](../../src/components/player_sheet/skills_page.jsx), the `<Pill tone={overCap ? 'warn' : 'accent'}>{usedPoints} / {totalPoints} ranks</Pill>` in the header row. Companion CSS likely in [skills.css](../../src/style/skills.css).
**Change:** While editing (`isEditing === true`), the `usedPoints / totalPoints ranks` pill should detach from the header and stay pinned on screen as the user scrolls through the skill list — so they can always see how close they are to the cap without scrolling back up. In view mode it stays where it is today (inline in the title row).
**Why:** The list of skills is long; in edit mode the user is repeatedly adjusting ranks and needs ongoing feedback on the remaining budget. Pinned visibility removes the back-and-forth scrolling.
**Notes:**
- Likely `position: sticky; top: var(--menu-height)` on the pill's container so it sticks just below the topbar. Alternative: render a second copy of the pill in edit mode, wrapped in a sticky container.
- Or `position: fixed` with safe-area handling for mobile.
- The pill must still flip to the `warn` tone (red) once `overCap` is true so the warning stays prominent while pinned.
- Make sure it doesn't overlap the new "Skill · ability / Ranks / Bonus" header row at the top of the table — small top margin on the table, or have the sticky pill render outside the card.
- On desktop, the sidebar already has space — could optionally render the pill in the sidebar instead. Decide which feels right after sticky is tried.

---

### Combat page — rework the header card
**Where:** [combat_page.jsx](../../src/components/player_sheet/combat_page.jsx), the `<Card padding>` block right at the top containing the badge portrait, class+level filigree, character name and the race/class pills.
**Change:** Redesign or replace the header card — in its current form it's mostly a placeholder (icon + name + repeated class pill) and doesn't earn its vertical space. Options to consider: drop it entirely and surface the character name elsewhere (e.g. in the page title), or fold useful per-character context into it (portrait when we have one, xp / encounter status, conditions like dying/disabled, quick-access actions).
**Why:** Right now it's the largest card on the page and adds no information the sidebar isn't already showing. Either give it a job or remove it.

---

### Combat page — inline modifier edit per stat card
**Where:** [combat_page.jsx](../../src/components/player_sheet/combat_page.jsx), the `<Card padding>` block titled "Adjust modifiers" with the row of edit pills (Speed / Init / Fort / Ref / Will), and the StatPills in `.sh-grid-3` (AC / Init / Speed and Fort / Ref / Will).
**Change:** Remove the standalone "Adjust modifiers" card. Each small stat card / StatPill (AC, Init, Speed, Fort, Ref, Will) gets its own edit affordance (e.g. a small pencil button on the card itself, or a chevron like the new HP "Advanced" toggle). Clicking it opens an inline editor row directly below that card with the Stepper + check/cancel, scoped to that single stat.
**Why:** The current centralized edit strip pulls the user away from the stat they're tuning and forces them to context-switch ("which pill was 'Init' again?"). Inline editing under the actual stat is closer to the change, easier to scan, and frees the vertical real estate the "Adjust modifiers" card currently occupies.
**Notes:**
- AC isn't currently editable via a bonus thunk — adjustments come from armor/dex automatically. Could omit the edit affordance for AC or add a new `acBonus` field on the player model.
- Reuse the existing per-stat thunks (`onSetSpeedBonus`, `onSetInitiativeBonus`, `onSetFortBonus`, `onSetReflexBonus`, `onSetWillBonus`) and the same `BONUS_THUNK` switching pattern.
- Pattern to mirror: the new HP "Advanced" chevron + collapsible Base/Bonus life rows.

---

- **Misnamed `onSetPlayerSpellOption` thunk** — purely cosmetic; leave for a polish pass.
- **Encumbrance / carrying capacity math** — `Player.getInventoryWeight()` returns 0 (stub). Need to sum item weights from items.json, then compare to Str-based capacity table from [equipment.md](../dnd-rules/equipment.md), with race size modifier from [races.md](../dnd-rules/races.md).
- **Spell slots per day / bonus spells** — verify bonus slots from high ability mod, specialist Wizard +1, Cleric domain +1 per level (see [magic.md](../dnd-rules/magic.md)).
- **Fighter bonus combat feats** — `getFeatPointsMax()` doesn't include Fighter's bonus combat feats (every even level). Either fold into getFeatPointsMax with class awareness, or split into "general feat slots" + "class bonus feat slots".

## Recommended attack order

1. **Player model methods first** — `getBaseLifeMax`, `getBaseAttackBonus`, `getPunchDamage`, plus the `feats` array (init + getters + add/remove + serialize/load). This unblocks both the Combat page and the Feats page in one pass.
2. **Inventory schema fix** — small, isolated, low-risk; do it next to clear the easiest half-done item.
3. **Verify math** — BAB, unarmed damage, encumbrance, spell slots — against the rules notes. Catch any silent inconsistency before they bite.
4. **Polish** — rename the misnamed `onSetPlayerSpellOption` thunk, re-test the `[!]` feat alert end-to-end.

When in doubt: read the relevant rules note first, then the corresponding `src/data/*.json`. Don't rederive a mechanic from memory if a topic file exists for it.
