# UI Changes Backlog

> Effective UI/UX changes (not bug fixes) deferred until the current round of fixes settles. Each item below is a deliberate design or behavior change, not a regression fix.

## Format

Each item is one block:

```
### <short title>
**Where:** <screen / component / file>
**Change:** <what to do>
**Why:** <user-facing reason>
**Notes:** <implementation hints, edge cases — optional>
```

---

## 🟡 Medium (30–90 min)

### Spellbook table action buttons — notebook-tab styling
**Where:** Spellbook tab — spell-level cards ([spell_level.jsx](../../src/components/spellbook/spell_level.jsx), the per-row `<td>` containing the bookmark / prepare / use buttons; styles in [sidebar.css](../../src/style/sidebar.css) under `.flat-button.smaller`, `.spell-slot-div`, `.spell-slot-div2`)
**Change:** Rework the per-row action controls (Learn `bookmark_add` / `bookmark_remove`, Prepare `−` / `+` stepper, Use `wand_stars`) so they're noticeably narrower than today and visually feel like a small **tab clipped to the side of a notebook page** — e.g. an asymmetric rounded shape, slight inset shadow, accent edge, looking like it's tucked into the spell row rather than floating as a generic button.
**Why:** Current buttons are plain pill shapes that eat horizontal space on mobile and don't match the parchment / notebook visual language of the app.
**Notes:**
- Keep the existing actions and disabled/opacity-50 states untouched — purely a visual rework.
- Stepper rows (Prepare, Use) need to keep enough touch target for the `−` / `+` to stay comfortable on mobile (≥ `--tap-target-sm`).
- Consider one shared notebook-tab atom in [src/components/common/](../../src/components/common/) so Learn / Prepare / Use all share the same look.
- Reduce the fixed widths on `.spell-slot-div` (`calc(--btn-width-sm * 2.5)`) and `.spell-slot-div2` (`calc(--btn-width-sm * 1.6)`) as part of the rework — they're sized for the current button footprint.
**Open decisions:** build a shared `NotebookTabButton` common atom (used by Learn / Prepare / Use), or restyle each in place? Target width — keep `--btn-width-sm * 2.5` or shrink (and to what)?

---

## 🔴 Large / cross-cutting (half-day+)

### UI consistency pass — unified card widths app-wide
**Where:** All pages that render cards: Player Sheet ([combat_page.jsx](../../src/components/player_sheet/combat_page.jsx), [inventory_page.jsx](../../src/components/player_sheet/inventory_page.jsx), [skills_page.jsx](../../src/components/player_sheet/skills_page.jsx), [feats_page.jsx](../../src/components/player_sheet/feats_page.jsx), [features_page.jsx](../../src/components/player_sheet/features_page.jsx), [player_spells_page.jsx](../../src/components/player_sheet/player_spells_page.jsx), [race_cards.jsx](../../src/components/player_sheet/race_cards.jsx), [class_cards.jsx](../../src/components/player_sheet/class_cards.jsx), [note_editor.jsx](../../src/components/player_sheet/note_editor.jsx), [equipment_grid.css](../../src/style/equipment_grid.css)), Spellbook ([spell_level.jsx](../../src/components/spellbook/spell_level.jsx), [class_description.jsx](../../src/components/spellbook/class_description.jsx), [domain_description.jsx](../../src/components/spellbook/domain_description.jsx), [wizard_schools_card.jsx](../../src/components/spellbook/wizard_schools_card.jsx)), Search ([search_page.jsx](../../src/components/search/search_page.jsx)), all the sidebar cards (`.cards .card` inside [src/components/menus/](../../src/components/menus/)). Styles in [menu_cards.css](../../src/style/menu_cards.css) (`.card-width-spellbook`, `.cards`), [player_sheet.css](../../src/style/player_sheet.css) (race/class/features media-query overrides), [equipment_grid.css](../../src/style/equipment_grid.css).
**Change:** Consolidate card widths into a single design token (e.g. `--card-width`, `--card-width-mobile`) defined in [tokens.css](../../src/style/tokens.css). Every card-using component reads from the token instead of hardcoding `calc(var(--btn-width-sm) * 20.4)`, `95vw`, `90%`, `99vw`, or whatever scattered value it's using today. One canonical width per breakpoint, app-wide. Same for vertical spacing between cards (`margin-bottom` on `.card-width-spellbook` is currently the only stacking spacing — verify it's right for sidebars too or split into two tokens).
**Why:** Cards currently look subtly different across tabs — slightly different widths, different gutters, NoteEditor uses 90% while race/class use 95vw mobile / `calc(...)` desktop, sidebars use 96% of column. Walking from Player Sheet → Spellbook → Search → Shop the user notices the cards "shift" even though the data structure is the same. Single token fixes this and makes future width tweaks one-line changes.
**Notes:**
- Don't unify the sidebar cards with the main-content cards blindly — sidebars are intentionally narrower (they live in a 60% column). Likely needs two tokens: `--card-width-sidebar` and `--card-width-main`.
- The `.card-width-spellbook` name is misleading once it's used outside the spellbook. After this pass, consider renaming the class to something neutral like `.sh-card-block` or just inlining the width via the token directly.
- Watch out for the recent NoteEditor (`width: 90%` of `.player-sheet-page`) and the race/class media-query override (`95vw`) — those should both fold into the unified token.
- After unification, do a visual diff pass across all six tabs at both mobile and desktop sizes to confirm nothing collapses or overflows.
- Adjacent cleanup candidate: the bottom-spacing — race/class/features currently zero out the `margin-bottom` on `.card-width-spellbook` because they have their own container `gap`. With a unified token, decide once whether card spacing lives on the card or on the container, and stop double-stacking.
**Open decisions:** one token (`--card-width`) for everything, or two (`--card-width-main` + `--card-width-sidebar`) because sidebars are intentionally narrower? Rename `.card-width-spellbook` to a neutral name (e.g. `.sh-card-block`) as part of the pass, or leave the class name and just change the value? Card spacing — live on the card's `margin-bottom` or on the container's `gap`; pick one and stop double-stacking.
