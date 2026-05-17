# UI Changes Backlog

> Effective UI/UX changes (not bug fixes) deferred until the current round of fixes settles. Each item below is a deliberate design or behavior change, not a regression fix. Work through this list **after** the active fix pass is done.

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

### Add Item in Shop should be a modal
**Where:** Shop tab — main inventory view ([ShopInventory.jsx](../../src/components/shop/ShopInventory.jsx), [ShopTableBody.jsx](../../src/components/shop/ShopTableBody.jsx), [AddItemForm.jsx](../../src/components/shop/AddItemForm.jsx))
**Change:** Replace the inline "add-row" approach (currently inserts an `<AddItemForm>` row inside the shop table) with a centered `<Modal>` triggered by the Add Item button.
**Why:** The current row is too narrow on mobile and the inputs/selects are cramped and hard to read. A modal gives the form proper breathing room and lets us use full-width inputs.
**Notes:**
- Reuse the existing `<Modal>` atom from [src/components/common/Modal.jsx](../../src/components/common/Modal.jsx).
- Keep the existing thunk wiring (`updateShop(['buy', name, type, cost, number, link])`).
- The Add Item button stays at the same width as the table; clicking it opens the modal instead of toggling `showAddItemForm` for the row.
- The `tr.add-item` styles in `shop_inventory.css` can be removed once the row is gone.

---

### ✓ Accent picker moved into the settings menu (done)
**Where:** [top_menu.jsx](../../src/components/menus/top_menu.jsx)
**Change:** Removed the standalone accent dot button from the top bar. The `<ColorPicker />` trigger now lives inside the settings menu as an "Accent & theme" row (visible in both the mobile bottom sheet and the desktop popover).
**Why:** Less top-bar clutter; theming sits with the other app-level preferences (export/import, mode toggle) instead of competing with the settings gear.

---

### ✓ Navigate menu button moved next to the settings button (done)
**Where:** [top_menu.jsx](../../src/components/menus/top_menu.jsx) — mobile branch
**Change:** Hamburger no longer sits on the far left next to the brand. It now lives in the trailing actions group on the right, immediately before the settings gear (so the right side reads: hamburger · settings).
**Why:** Groups all "open me" controls together at the right edge for one-handed thumb access; the brand can claim the full left side.

---

### Inline sidebar cards in main content on mobile — Search & Loot pages
**Where:**
- Loot: [App.jsx](../../src/App.jsx) (`loot` branch wires `<LootSidebar />` + `<LootInventory />`), [LootSidebar](../../src/components/menus/loot_sidebar/loot_sidebar.jsx), [LootMenuCards](../../src/components/menus/loot_sidebar/cards/loot_menu_cards.jsx), [LootInventory](../../src/components/loot/loot_inventory.jsx)
- Search: [search_page.jsx](../../src/components/search/search_page.jsx) (sidebar is inlined inside the page itself, not via App.jsx)
**Change:** On mobile, do **not** render the left sidebar for the Search and Loot pages. Instead, render the same menu cards as collapsible cards at the **top of the main content**, above the results / loot inventory. On desktop the layout stays exactly as it is today (sidebar on the left).
**Why:** On phones the sidebar is overkill for these two pages — they're essentially "configure → view results" flows. Putting the controls inline at the top removes the open/close dance, frees horizontal space, and feels more like a normal mobile form-then-list page. The shop/spellbook/player-sheet pages keep their sidebar because they have richer multi-card configuration.
**Notes:**
- **Cards collapsible at the top.** The card(s) render expanded by default the first time, with the usual collapse chevron. State stays driven by the same `UI_FLAG.lc` / search-card-collapsed flags so collapsed state persists across the desktop/mobile split.
- **Info sidebar (right) works as normal** — only the *left* sidebar moves inline. The info sidebar's mobile FAB and drawer stay untouched.
- **Back button handler is only active when a menu is opened.** Since the cards live in normal scroll flow on mobile, there's no "open" state for the sidebar anymore — so `useBackButtonHandler` for the left sidebar should be skipped on mobile for these two pages. It still applies to any modal/scanner/etc. that opens above the cards.
- Loot is the easy half: `LootMenuCards` is already a clean component → render it at the top of `LootInventory` when `isMobile()`. In `App.jsx`, skip `<LootSidebar />` on mobile.
- Search is messier: the current sidebar markup is *inside* `search_page.jsx` and shares local state with the rest of the page. Extract that JSX into a small `SearchFiltersCards` component (or just gate the wrapping `.sidebar` div behind `!isMobile()` and render the same cards container inline at the top when mobile).
- Confirm `cards-aligned` + the recent 60% width rule still look right when the cards live in the main content area (wider than the sidebar). May need to cap card width on mobile so it doesn't stretch full width like a banner.

---

### Spellbook table action buttons — notebook-tab styling
**Where:** Spellbook tab — spell-level cards ([spell_level.jsx](../../src/components/spellbook/spell_level.jsx), the per-row `<td>` containing the bookmark / prepare / use buttons; styles in [sidebar.css](../../src/style/sidebar.css) under `.flat-button.smaller`, `.spell-slot-div`, `.spell-slot-div2`)
**Change:** Rework the per-row action controls (Learn `bookmark_add` / `bookmark_remove`, Prepare `−` / `+` stepper, Use `wand_stars`) so they're noticeably narrower than today and visually feel like a small **tab clipped to the side of a notebook page** — e.g. an asymmetric rounded shape, slight inset shadow, accent edge, looking like it's tucked into the spell row rather than floating as a generic button.
**Why:** Current buttons are plain pill shapes that eat horizontal space on mobile and don't match the parchment / notebook visual language of the app.
**Notes:**
- Keep the existing actions and disabled/opacity-50 states untouched — purely a visual rework.
- Stepper rows (Prepare, Use) need to keep enough touch target for the `−` / `+` to stay comfortable on mobile (≥ `--tap-target-sm`).
- Consider one shared notebook-tab atom in [src/components/common/](../../src/components/common/) so Learn / Prepare / Use all share the same look.
- Reduce the fixed widths on `.spell-slot-div` (`calc(--btn-width-sm * 2.5)`) and `.spell-slot-div2` (`calc(--btn-width-sm * 1.6)`) as part of the rework — they're sized for the current button footprint.

---

### Shop row layout more readable on mobile
**Where:** Shop tab — inventory rows ([ShopItemRow.jsx](../../src/components/shop/ShopItemRow.jsx), [ShopTableHeader.jsx](../../src/components/shop/ShopTableHeader.jsx), `shop_inventory.css` mobile media query)
**Change:** Redesign each shop row on mobile so it's easier to scan. Two options to pick from:
- **Option A — drop the Type column on mobile.** Keep `#`, Name, Cost, sell button. Type can move into the item info card / search.
- **Option B (Recommended) — stack each row into two lines.** Line 1: `#` + Name (large). Line 2: Type (muted) + Cost (mono) + sell button on the right.
**Why:** The current 4-column row is cramped on mobile — Name truncates and Type/Cost sit in narrow strips that are hard to read. A two-line layout uses vertical space (which is plentiful on phones) instead of fighting for horizontal pixels.
**Notes:**
- Apply via mobile media query so desktop keeps the current single-row table layout.
- The sell button should stay aligned to the right edge of line 2 with a clear tap target.
- Preserve the existing long-press-to-sell interaction.
- The header row's columns won't map 1:1 anymore on mobile — either hide it on mobile (the layout is self-explanatory) or replace with a sort-by chip strip above the list.
