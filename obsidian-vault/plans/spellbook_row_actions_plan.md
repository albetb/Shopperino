# Spellbook Row-Action Controls Replacement

> Replace the three leftmost action-cell controls in the D&D 3.5 spellbook (Learn / Prepare / Cast) with the high-fidelity sliding-tab / fused-stepper / star-orbit design from the handoff bundle, across both the main Spellbook tab and the Player Sheet spellbook.

## Context

Design spec: [[plans/design_handoff_spellbook_row_actions/README]] — includes `components.jsx` (reference implementation), `controls.css`, and `preview.html`. Tokens already exist in `src/style/tokens.css` (no new tokens needed).

Architecture: The project has no formal `architecture/overview.md`; the canonical architecture doc is the project root `CLAUDE.md`. Relevant constraints from there:
- Plain React function components, Redux Toolkit, CSS keyed off existing CSS custom-property tokens.
- All game logic lives in `src/lib/player/player.js` and `src/lib/spellbook/`; controls only fire existing thunks.
- Use `rem` units where practical.
- No backwards-compat shims — replace the markup outright.

User-confirmed decisions (recorded before this plan was written):
- New components live under `src/components/spellbook/row_actions/`; styles in a new `src/style/spell_row_actions.css`.
- `StarOrbitCast` is scaled down so the control fits inside the existing ~36px row height (no taller Cast-page rows).
- `FusedStepper` hard cap = 9 per the design (`+` disabled at 9, `−` disabled at 0).
- `StarOrbitCast` replaces `wand_stars` in all of: spell_level page 2, `domain_spells.jsx`, `gnome_spells_card.jsx`, `spontaneous_spells.jsx`.

The main Spellbook tab and the Player Sheet spellbook share `SpellbookTable → SpellLevelCard`, so edits to `spell_level.jsx`, `domain_spells.jsx`, and `spontaneous_spells.jsx` cover both surfaces simultaneously. `gnome_spells_card.jsx` is Player-Sheet-only.

---

<step_1>
### Step 1. Scaffold row-action components and CSS

Port the three controls from the handoff bundle into the codebase as plain React function components, with the `StarOrbitCast` size knobs scaled down to fit a ~36px row. The components are exported but not yet consumed by any row, so the build stays green and the existing UI is unchanged.

Notes on porting:
- `LearnTab`, `FusedStepper`, `StarOrbitCast` are dependency-free function components — copy from `obsidian-vault/plans/design_handoff_spellbook_row_actions/components.jsx`, keep prop shapes identical, add `PropTypes` to match the rest of the spellbook folder.
- `controls.css` is copied to `src/style/spell_row_actions.css`. Override the orbit knobs at the top: set `--size` to ~`2.25rem` (36px) and `--radius` to ~`0.75rem` (12px); shrink the inner star glyph `font-size` to `11px`; shrink `.orbit-num` to ~`15px` so it still fits centered. Leave `LearnTab` and `FusedStepper` token values as-is.
- Import the CSS once from `src/components/spellbook/row_actions/index.js` (re-exports the three components) so every consumer gets it transitively.

**Files:**
- Create: `src/components/spellbook/row_actions/LearnTab.jsx`
- Create: `src/components/spellbook/row_actions/FusedStepper.jsx`
- Create: `src/components/spellbook/row_actions/StarOrbitCast.jsx`
- Create: `src/components/spellbook/row_actions/index.js` — re-exports the three components and imports `../../../style/spell_row_actions.css`
- Create: `src/style/spell_row_actions.css` — full controls CSS with the scaled-down orbit overrides at the top

**Criteria:**
- `npm run build` completes with no errors and no new warnings
- `src/components/spellbook/row_actions/index.js` exports `LearnTab`, `FusedStepper`, `StarOrbitCast`
- `src/style/spell_row_actions.css` references only tokens that already exist in `src/style/tokens.css` (no undefined `var(--…)`)
- `StarOrbitCast` resolved `--size` is ≤ `2.25rem` (`36px`) so it does not exceed the existing row height
- Existing spellbook UI is unchanged — controls compile but are not yet rendered anywhere
</step_1>

---

<step_2>
### Step 2. Wire LearnTab into spell_level.jsx page 0

Replace the `bookmark_add` / `bookmark_remove` flat-button on the page-0 (Learn) cell of `spell_level.jsx` with `<LearnTab learned={…} onClick={…} />`. Pass `learned={learnedLinks.has(item.Link)}` and `onClick={() => actions?.onLearnUnlearnSpell?.(item.Link)}`. Tag the cell with a new `action-cell` class so Step 5 can target the overflow rule.

This single change covers both the main Spellbook tab and the Player Sheet because both surfaces render through `SpellbookTable → SpellLevelCard`.

**Files:**
- Modify: `src/components/spellbook/spell_level.jsx` — replace the `page === 0` cell's button with `<LearnTab>`; add `action-cell` to the `<td>` className; add import from `./row_actions`

**Criteria:**
- `npm run build` passes with no errors
- On Spellbook page 0, the leftmost cell renders `.tab-learn` markup (verify in DOM) instead of `<button class="flat-button smaller">…bookmark_add…</button>`
- Clicking the tab on an unlearned spell dispatches `onLearnUnlearnSpell` (same thunk path as before — confirmed via Redux DevTools or by inspecting the dispatched action)
- The tab visually toggles between `is-learned` and the default state when clicked
- The same control appears on the Player Sheet spellbook page 0 with no additional change
</step_2>

---

<step_3>
### Step 3. Wire FusedStepper into spell_level.jsx page 1 (main rows + domain-prepare block)

Replace the two existing `spell-slot-div` `−/N/+` stepper instances in `spell_level.jsx` with `<FusedStepper>`:

1. **Main page-1 rows** (`page === 1` cell): pass `value={inst.getSpellPreparedUsed(item.Link).Prepared}`, `min={0}`, `max={9}`, and `onChange={next => next > value ? actions.onPrepareSpell(item.Link) : actions.onUnprepareSpell(item.Link)}`. The thunks operate per ±1 step, so route by direction.
2. **Domain-prepare block** (`showDomainPrepare`): same pattern but with `actions.onPrepareDomainSpell(level, item.Link)` / `actions.onUnprepareDomainSpell(level, item.Link)`. `value={prepCount}`.

Tag both cells with the `action-cell` className for the Step 5 overflow rule.

**Files:**
- Modify: `src/components/spellbook/spell_level.jsx` — replace both stepper sites; remove now-unused `spell-slot-div` markup in those two spots only (leave the CSS class definitions intact for now — other surfaces still use them)

**Criteria:**
- `npm run build` passes with no errors
- On Spellbook page 1, each spell row's leftmost cell renders `.fused-stepper` markup with three children (`button − / span.num / button +`)
- `−` is disabled (and renders with `--ink-disabled`) when `Prepared === 0`; `+` is disabled when `Prepared === 9`
- Clicking `+` dispatches `onPrepareSpell` for normal spells / `onPrepareDomainSpell` for the domain block; clicking `−` dispatches `onUnprepareSpell` / `onUnprepareDomainSpell`
- For a Cleric, the domain-prepare table on page 1 shows the same fused-stepper visual as the main rows
- The same change is visible on the Player Sheet spellbook with no extra wiring
</step_3>

---

<step_4>
### Step 4. Wire StarOrbitCast into all four cast surfaces

Replace the `wand_stars`-button + `level-text` markup with `<StarOrbitCast remaining={…} total={…} onClick={…} />` in the four files that show per-spell cast affordances:

1. **`spell_level.jsx` page 2**: `remaining = getRemaining(item.Link)`, `total = spellsPerDay[level]` (or `inst.getSpellPreparedUsed(item.Link).Prepared` for non-spontaneous classes — pick the more meaningful "total" for a11y label), `onClick = () => actions.onUseSpell(item.Link)`.
2. **`domain_spells.jsx`**: `remaining = Math.max(0, Prepared - Used)`, `total = Prepared`, `onClick = () => onUseDomainSpell?.(item.Link)`.
3. **`gnome_spells_card.jsx`**: `remaining = Math.max(0, 1 - used)`, `total = 1`, `onClick = () => dispatch(onPlayerUseGnomeSpell(spell.link))`.
4. **`spontaneous_spells.jsx`**: the current static `wand_stars` icon represents a level-shared spontaneous slot. Add a per-row cast action: thread `getRemaining` and `onUseSpell` from `spell_level.jsx` into the component via new props (`getRemaining(link): number`, `onUseSpell(link): void`), then render `<StarOrbitCast remaining={getRemaining(item.Link)} total={spellsPerDay[lvl]} onClick={() => onUseSpell(item.Link)} />`. Update `spell_level.jsx` to pass those props (`getRemaining` already exists locally; `onUseSpell` comes from `actions`).

Add the `action-cell` className to every leftmost cell touched.

**Files:**
- Modify: `src/components/spellbook/spell_level.jsx` — page-2 cell replacement; also pass new props to `<SpontaneousSpells>`
- Modify: `src/components/spellbook/domain_spells.jsx`
- Modify: `src/components/spellbook/spontaneous_spells.jsx` — accept `getRemaining` + `onUseSpell` props; render `<StarOrbitCast>`; update `PropTypes`
- Modify: `src/components/player_sheet/gnome_spells_card.jsx`

**Criteria:**
- `npm run build` passes with no errors
- On Spellbook page 2 each spell row's leftmost cell renders `.orbit-cast` (verify in DOM) with N `.star` children equal to `remaining` (capped at 9)
- Clicking an orbit with `remaining > 0` dispatches the matching use-thunk and the center count decrements on the next render
- A spell at `remaining === 0` renders `.orbit-cast.is-empty`, has no stars, and is non-clickable (`disabled` attribute present)
- The same control appears in: the domain-spells block (Cleric page 2), the Gnome spells card (Gnome player sheet), and the spontaneous-spells block (Sorcerer / Bard page 2)
</step_4>

---

<step_5>
### Step 5. Overflow and sizing audit for the action cell

The `LearnTab` tip slides outside its own box (translateX up to `-15px`). The leftmost spellbook `<td>` must not clip it. Audit the cascade and add a single targeted rule.

Approach:
- Add to `src/style/spell_row_actions.css`: `.spellbook-table td.action-cell { overflow: visible; }` (and the same on `.action-cell` standalone for non-table contexts if any).
- Verify the parent `.spellbook-table`, its wrapper, and the `.card.card-width-spellbook` do not set `overflow: hidden` on any container between the row and the page edge. If they do, scope an override (e.g. `.card-width-spellbook { overflow: visible; }`) — keep the override as tight as possible.
- Check the mobile breakpoint in `src/style/menu_cards.css` (`@media (max-width: 768px)` — `.spell-slot-div` / `.spell-slot-div2` max-widths) and `src/style/shop_inventory.css` (`.spellbook-table { width: 96%; }` on mobile): confirm the `LearnTab` tip still has room to protrude past the column edge inside the card. If the card's left padding clips it, reduce padding on the action cell only.
- Confirm `col-btn-sm` / `col-btn-sm-max` column widths still produce a coherent layout — the new controls are narrower than the old `spell-slot-div`, so columns may need no change at all, but verify visually.

**Files:**
- Modify: `src/style/spell_row_actions.css` — append the overflow + any narrowly-scoped wrapper overrides
- Modify: `src/style/menu_cards.css` *(only if a mobile media query clips the tip)*
- Modify: `src/style/shop_inventory.css` *(only if the spellbook table's overflow clips the tip)*

**Criteria:**
- `npm run build` passes with no errors
- On the Spellbook tab, page 0, a learned spell's `LearnTab` tip is fully visible past the row's left edge (no clipping by `<td>`, `<table>`, or `.card-width-spellbook`)
- At a 375px-wide viewport (mobile) the tip is still visible and no horizontal scrollbar appears on the page
- The column widths on pages 0, 1, 2 remain visually consistent — no column reflow regressions compared to before Step 1
- The Player Sheet spellbook shows the same non-clipped behavior
</step_5>

---

<step_6>
### Step 6. Manual verification pass

Run the dev server and exercise every surface to confirm the design intent. Document any divergence in the state file rather than this plan.

Checklist (all must hold):
- **Sorcerer**: page 0 Learn tab toggles a spell; page 1 stepper increments/decrements prepared spells; page 2 orbit casts a level-shared slot and the spontaneous-spells block uses an orbit too.
- **Wizard**: same three pages — specialization highlight still works, learned-set count in card titles still correct.
- **Cleric**: page 1 shows both the main FusedStepper and the domain-prepare FusedStepper; page 2 shows orbits for main spells and for the domain-spells block.
- **Bard**: same as Sorcerer.
- **Gnome (Player Sheet)**: Gnome spells card shows an orbit with `remaining ∈ {0, 1}`.
- **Theme + accent swap**: switch theme (light/dark) and an accent (e.g. `accent-emerald`) — every control re-themes; resting states use neutral surface/ink (not accent).
- **Disabled states**: `LearnTab` when no class selected; `FusedStepper +` at 9 and `−` at 0; `StarOrbitCast` at remaining 0.
- **Master vs Player mode**: both surfaces render identically (Master mode adds Shop/Loot tabs but spellbook controls are the same).

**Files:**
- No file changes — verification only

**Criteria:**
- Every checklist item above is exercised in the running dev server
- No console errors during interactions
- No localStorage corruption (round-trip a refresh between actions: prepared counts persist correctly via the existing thunks)
- A short divergence note is added to `spellbook_row_actions_plan-state.json` for anything that didn't behave per the design handoff (or "none" if clean)
</step_6>
