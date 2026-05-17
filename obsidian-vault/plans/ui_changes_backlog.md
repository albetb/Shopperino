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
