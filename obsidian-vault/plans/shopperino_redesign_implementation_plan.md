# Shopperino Redesign — Implementation Plan

> Total UI replacement of Shopperino: install the design tokens, build a new common-atom library, restyle the top chrome, rebuild the 7 Player Sheet sub-pages, restyle every sidebar and tab, then verify across themes / breakpoints / accent hues. Redux store shape, thunks, persistence, and `src/lib/` domain models are untouched.

## Context

Source spec: [[plans/design_handoff_shopperino_redesign/README|Handoff README]] (read in full before starting any step). Reference design files live alongside it: `tokens.css`, `app.css`, `components.jsx`, `screens-mobile.jsx`, `screens-responsive.jsx`, `ds.jsx`, `screenshots/`.

Project conventions: see `CLAUDE.md` at repo root — mobile-first (95% phone usage), `rem`-only sizing, compressed-tuple localStorage state, no backend, identity = array index.

### Decisions (resolved up front)

| Question | Decision | Rationale |
|---|---|---|
| Theme + accent persistence scope | **Per-device** (single global preference on `state.app`) | Matches "my UI preference, not this character's color." Persisted via existing `persistSyncMiddleware`. |
| First-load theme default | **Always dark** | User override of README §15 recommendation. Do NOT read `prefers-color-scheme`. Light mode is opt-in via the toggle. |
| Combat header portrait | **Striped placeholder only** | No data schema change. **No initials overlay.** |
| Initials squares anywhere in the app | **Forbidden** | Top bar brand mark drops the "S" letter-square (use wordmark + non-letter glyph). No avatar-style initials anywhere in the redesign. |

### Constraints

- **UI-only migration.** No changes to Redux store shape, slices' state fields, thunks, persistence format, or domain models in `src/lib/`. The only Redux change permitted is adding two action creators (`setTheme`, `setAccent`) to `appSlice` and storing `theme` / `accent` fields on `state.app`.
- **No new entity IDs.** Identity remains array index.
- All sizing in `rem`. No raw color literals outside `src/style/tokens.css`.
- Every step must leave the project building and runnable.
- Each step lists which QA-checklist items from Handoff §12 it contributes to. Final verification (Step 39) walks the full checklist.

---

<step_1>
### Step 1. Install design tokens

Drop the token spec into the codebase and alias the existing `--main` variable so the old UI keeps working while we migrate.

**Files:**
- Create: `src/style/tokens.css` — copy verbatim from `obsidian-vault/plans/design_handoff_shopperino_redesign/tokens.css`.
- Modify: `src/style/App.css` — `@import "./tokens.css";` at the top. Add a compatibility block: `:root { --main: var(--accent); --main-t: var(--accent-muted); --main-t2: var(--accent-soft); }` so existing components that reference `--main` automatically pick up the new accent.

**Criteria:**
- `npm start` boots; the page renders with no console errors.
- `src/style/tokens.css` exists and defines `--accent`, `--accent-soft`, `--accent-muted`, `--accent-ring`, `--accent-strong`, `--accent-fg`, the full `--space-*`, `--radius-*`, `--font-size-*`, `--ink*`, `--bg*`, `--surface-*`, `--border*`, `--warn`, `--danger`, `--success` token sets.
- Inspecting any existing element in DevTools shows `--main` resolving via `var(--accent)`.
- A grep for `oklch(` / `#[0-9a-f]{6}` outside `src/style/tokens.css` is logged so subsequent steps can sweep them out (informational; no enforcement here).
- QA §12 contributions: rem-only sizing baseline; no raw color literals outside `tokens.css` (for tokens.css itself).
</step_1>

---

<step_2>
### Step 2. Extend appSlice with theme + accent state

Add the two action creators the design system needs. Default theme = `'dark'`, default accent = `'crimson'`. Persistence flows through the existing middleware.

**Files:**
- Modify: `src/store/slices/appSlice.js` — add `theme: 'dark'` and `accent: 'crimson'` to `initialState`; add reducers `setTheme(state, action)` and `setAccent(state, action)`; export both action creators; export selectors `selectTheme` and `selectAccent`.
- Modify: `src/store/persistSyncMiddleware.js` — list the two new action types so they trigger `saveApp()`.
- Modify: `src/lib/appState.js` — extend `compactApp` and `expandApp` to round-trip the `theme` and `accent` fields. Omit them from the persisted payload when they equal defaults (matches the "omit defaults" pattern). Bump `CURRENT_VERSION` so older saves reset cleanly.

**Criteria:**
- `npm start` boots; the app loads with `state.app.theme === 'dark'` and `state.app.accent === 'crimson'`.
- Dispatching `setTheme('light')` then refreshing the page restores `state.app.theme === 'light'` (verified by reading the persisted blob in DevTools).
- Dispatching `setAccent('emerald')` then refreshing restores `state.app.accent === 'emerald'`.
- The persisted payload size does not grow when theme/accent are at their defaults (omit-defaults behavior).
- `CURRENT_VERSION` in `appState.js` has been bumped — older saves migrate to defaults instead of crashing.
- QA §12 contributions: theme change preserves accent (state side); accent persistence.
</step_2>

---

<step_3>
### Step 3. Root theme + accent body-class wiring

Apply `theme-${theme}` and `accent-${accent}` classes to the document root so every CSS rule under those scopes activates. Bootstrap on app mount; subscribe to Redux to keep the classes in sync.

**Files:**
- Modify: `src/App.jsx` — `useEffect` that reads `theme` and `accent` from Redux and sets `document.body.className` (preserving any other classes). Run on mount and whenever they change.
- Modify: `src/index.js` (or whatever boots before Redux mounts) — set `<body class="theme-dark accent-crimson">` as the SSR-safe default so the first paint isn't a white flash.
- Modify: `src/lib/colorUtils.js` — if `applyColors()` still mutates inline styles for `--main`, neuter that path (or have it just no-op) so the body-class system is the only color driver. Keep the function signature so existing imports don't break.

**Criteria:**
- On hard refresh, `document.body.className` contains `theme-dark` and `accent-crimson` before any user interaction.
- Dispatching `setAccent('emerald')` from the Redux DevTools updates `document.body.className` to include `accent-emerald` within one render frame.
- Dispatching `setTheme('light')` swaps `theme-dark` for `theme-light` with no flash of dark content lingering on already-rendered cards.
- `applyColors()` is no longer mutating `--main` / `--main-t` inline styles on `document.documentElement`.
- QA §12 contributions: accent change updates live across the UI (foundation for verification in Step 39).
</step_3>

---

<step_4>
### Step 4. `<Button>` + `<IconButton>` atoms

The single most-used pair of primitives. Both share the same focus-ring and disabled treatment.

**Files:**
- Create: `src/components/common/Button.jsx` — variants `primary | ghost | danger`; sizes `sm | md`; props `block`, `icon`, `iconRight`, `disabled`, `aria-pressed`; className `.sh-btn` with `.sh-btn--${variant}` and `.sh-btn--block` modifiers.
- Create: `src/components/common/IconButton.jsx` — props `icon`, `size: 'sm' | 'md'`, `ghost`, `badge`, `aria-label` required; className `.sh-icon-btn` with modifiers from `app.css`.
- Modify: `src/style/buttons.css` — replace contents with the `.sh-btn-*` and `.sh-icon-btn` rules from `obsidian-vault/plans/design_handoff_shopperino_redesign/app.css`. Keep file path stable so all existing imports continue to resolve.

**Criteria:**
- `<Button variant="primary">Save</Button>` renders a 44px-min-height accent-colored button with white text and an accent glow.
- `<IconButton icon="close" ghost aria-label="Close" />` renders a transparent 44×44 button with the Material Symbol "close" centered.
- Both render keyboard-focus rings (2px `--accent-ring`).
- All measurements verified in DevTools resolve from tokens (no raw px in computed styles for spacing/radius).
- QA §12 contributions: 44×44 tap-target floor; keyboard focus visible.
</step_4>

---

<step_5>
### Step 5. `<Pill>` + `<Chip>` atoms

`<Pill>` is read-only metadata. `<Chip>` is a toggleable filter.

**Files:**
- Create: `src/components/common/Pill.jsx` — props `tone: 'accent' | 'warn' | 'danger' | 'success' | 'ghost'`, `icon`, `children`; className `.sh-pill` + `.sh-pill--${tone}`.
- Create: `src/components/common/Chip.jsx` — props `on: boolean`, `icon`, `onClick`, `children`; className `.sh-chip` + `.is-on` when active.
- Create: `src/style/pills.css` — copy `.sh-pill*` and `.sh-chip*` rules from the reference `app.css`. Import from `App.css`.

**Criteria:**
- `<Pill tone="warn" icon="warning">over cap</Pill>` renders with amber background, warn icon, and `--font-size-2xs` mono label.
- `<Chip>` toggles its `is-on` class when clicked; active state uses `--accent-soft` background and `--accent` border.
- Both atoms read all colors from tokens (no literals).
- QA §12 contributions: soft-warning state foundation (`.sh-pill--warn`).
</step_5>

---

<step_6>
### Step 6. `<Card>` + `<MenuCard>` atoms

`<Card>` is the generic container for content blocks. `<MenuCard>` is the collapsible sidebar building block that replaces the current menu-card pattern.

**Files:**
- Create: `src/components/common/Card.jsx` — props `title`, `eyebrow`, `action` (trailing slot), `accent: boolean`, `padding: boolean`; renders `.sh-card` + optional `.sh-card-head` + body.
- Create: `src/components/common/MenuCard.jsx` — props `title`, `icon`, `open: boolean`, `defaultOpen`, `badge`, `onToggle`, `children`; uncontrolled if `onToggle` not provided. Renders `.sh-menu-card` with `data-open` attribute; head has chevron that rotates on collapse.
- Modify: `src/style/menu_cards.css` — replace with the `.sh-menu-card`, `.sh-card`, and head/body rules from the reference `app.css`. Preserve filename so existing imports continue to work.

**Criteria:**
- `<Card title="Encumbrance" eyebrow="Carry weight">…</Card>` renders with the eyebrow in `--font-display`, title in display 17px, and content padded `--space-4`.
- `<MenuCard title="Filters" icon="tune">…</MenuCard>` collapses/expands on header tap; chevron rotates −90° in the closed state via CSS only.
- Closed `<MenuCard>` hides its body via `data-open="false"` selector (no JS removal needed for accessibility / animations).
- Both atoms have no inline color literals.
- QA §12 contributions: scaffolding for every sidebar restyle (Steps 29–33).
</step_6>

---

<step_7>
### Step 7. `<Field>` form-field wrapper

Wraps a label, an optional hint, and arbitrary input children. Used by every settings card and the note editor.

**Files:**
- Create: `src/components/common/Field.jsx` — props `label`, `hint`, `htmlFor`, `error`, `children`; renders `.sh-field` with `<label>`, body slot, and footnote hint slot.
- Modify: `src/style/App.css` — add `.sh-field` rules from reference `app.css` (or inline a small `fields.css` import; either is acceptable).

**Criteria:**
- `<Field label="Merchant" hint="What the shopkeeper calls themselves"><input /></Field>` renders a label in `--font-size-xs` `--ink-muted` above the input, hint below in `--font-size-2xs` `--ink-faint`.
- Field spacing (`--space-2` between label/input/hint) is rendered via tokens, verified in DevTools.
- QA §12 contributions: 44-target tap floor for any inputs used inside a Field.
</step_7>

---

<step_8>
### Step 8. `<Stepper>` number input

The plus/minus number stepper used by HP, inventory qty, skill ranks, and prepared spell counts.

**Files:**
- Create: `src/components/common/Stepper.jsx` — props `value`, `min`, `max`, `onChange`, `step` (default 1), `size: 'sm' | 'md'`. Layout: `[−] [value (mono)] [+]`. Long-press auto-repeats at 80 ms intervals after a 400 ms hold. Disable buttons at min/max.
- Modify: `src/style/buttons.css` — add `.sh-stepper` rules from reference.

**Criteria:**
- `<Stepper value={5} min={0} max={10} onChange={fn} />` renders three side-by-side controls, each ≥ 36px (secondary tap target).
- Pressing `+` once calls `onChange(6)`; holding `+` for 1 s calls `onChange` repeatedly until 10 is reached.
- Value display uses `--font-mono` with tabular figures (no jitter as digits change).
- Disabled state at min/max: button is visually faded and not clickable.
- QA §12 contributions: long-press preserved on relevant rows.
</step_8>

---

<step_9>
### Step 9. `<Switch>` + `<Tickbox>` atoms

Two binary toggles. `<Switch>` is for settings (slide animation). `<Tickbox>` is for list-row selection (square with check).

**Files:**
- Create: `src/components/common/Switch.jsx` — props `checked`, `onChange`, `disabled`, `aria-label`. Renders `.sh-switch` with a sliding thumb.
- Create: `src/components/common/Tickbox.jsx` — props `checked`, `onChange`, `disabled`, `icon` (defaults to `check`); renders `.sh-tick` with a 1.5rem square that shows the icon when checked.
- Modify: `src/style/App.css` (or new `toggles.css`) — add `.sh-switch*` and `.sh-tick*` rules from reference.

**Criteria:**
- `<Switch checked onChange={fn} />` renders an accent-filled pill with the thumb fully right; unchecked renders the thumb left with `--surface-2` track.
- `<Tickbox checked onChange={fn} />` renders a 24×24 square with `--accent` border and a centered Material Symbol `check` glyph; unchecked is the same square without the glyph.
- Both have 200 ms transitions and visible keyboard focus.
- QA §12 contributions: 36–44 tap targets verified.
</step_9>

---

<step_10>
### Step 10. `<Stat>` ability-score block

The atom for STR/DEX/CON/INT/WIS/CHA. Big modifier on top, score in a pill below.

**Files:**
- Create: `src/components/common/Stat.jsx` — props `label` (e.g. `'STR'`), `score`, `mod`, `tone: 'accent' | 'warn' | 'neutral'`. Renders `.sh-stat` with label, large mod (display 30 px), and a `.sh-stat-score` pill.
- Modify: `src/style/player_sheet.css` — remove the existing ability-score CSS, add `.sh-stat*` rules from reference. Keep file path stable.

**Criteria:**
- `<Stat label="STR" score={14} mod={+2} />` renders the label in `--font-size-2xs` uppercase, "+2" in `--font-display` 30 px, "14" in a `--surface-2` pill.
- `tone="accent"` tints the mod number and the pill border with `--accent`.
- Negative mods render as e.g. "−1" with a proper minus sign (not hyphen).
- Component computes nothing — `mod` is passed in already-derived from the Player model.
- QA §12 contributions: rem-only sizing on a high-density component.
</step_10>

---

<step_11>
### Step 11. `<StatPill>` AC/Init/Save tile

The 3-up tile used for AC/Init/Speed and for Fort/Ref/Will.

**Files:**
- Create: `src/components/common/StatPill.jsx` — props `label`, `value`, `sub` (small footnote), `accent: boolean`. Renders `.sh-stat-pill` with label on top, value (display 24 px) middle, optional sub below.
- Modify: `src/style/player_sheet.css` — add `.sh-stat-pill*` rules from reference.

**Criteria:**
- `<StatPill label="AC" value={17} sub="touch 13 · flat 15" accent />` renders an accent-bordered tile.
- `<StatPill label="Will" value="+8" />` renders a neutral tile with the value in `--font-mono`.
- Three tiles arranged with `display: grid; grid-template-columns: repeat(3, 1fr); gap: --space-3` exactly fit a 390×844 mobile viewport with no overflow.
- QA §12 contributions: rem-only sizing.
</step_11>

---

<step_12>
### Step 12. `<Bar>` progress bar

HP, XP, encumbrance bars all use this atom.

**Files:**
- Create: `src/components/common/Bar.jsx` — props `value` (0–1), `variant: 'hp' | 'xp' | 'warn' | 'accent'`, `label`. Renders `.sh-bar` with `.sh-bar--${variant}` and an inline-styled `--w: ${value*100}%`.
- Modify: `src/style/player_sheet.css` — add `.sh-bar*` rules from reference.

**Criteria:**
- `<Bar value={0.7} variant="hp" />` renders a 0.5 rem tall bar, 70% filled with `--danger` (HP uses red).
- `value > 1` (encumbrance over-cap) clamps the bar at 100% AND tints it `--warn` automatically.
- All transitions and dimensions in tokens (no px in computed `width: 100%` / `height` if they're sized in rem).
- QA §12 contributions: soft-warning state (encumbrance > capacity).
</step_12>

---

<step_13>
### Step 13. `<Slots>` diamond spell-slot indicator

Row of diamond glyphs, filled = used, hollow = unused.

**Files:**
- Create: `src/components/common/Slots.jsx` — props `total`, `used`. Renders `.sh-slots` with `total` `<span class="sh-slot">` elements, the first `used` of which have `.is-used`.
- Modify: `src/style/player_sheet.css` — add `.sh-slot*` rules from reference (diamond shape via 45° rotated squares or SVG masks).

**Criteria:**
- `<Slots total={4} used={2} />` renders 4 diamonds, 2 filled with `--accent` and 2 outlined with `--border-strong`.
- `total={0}` renders nothing (empty container) — no layout shift.
- Diamonds are exactly 0.6 rem wide with `--space-1` gap.
- QA §12 contributions: rem-only sizing.
</step_13>

---

<step_14>
### Step 14. `<Filigree>` eyebrow

The decorative eyebrow with hairline accents on either side, used as a section header on every screen.

**Files:**
- Create: `src/components/common/Filigree.jsx` — props `children`; renders `.sh-filigree` with `::before` and `::after` hairlines.
- Modify: `src/style/App.css` — add `.sh-filigree` rules from reference (also handles the `.sh-accent-text` span variant for inline accent highlights).

**Criteria:**
- `<Filigree>Welcome back, dungeon master</Filigree>` renders the text in `--font-display` italic 11 px uppercase between two 1 px hairlines colored `--border-strong`.
- The hairlines flex to fill available width; the text stays centered.
- QA §12 contributions: rem-only spacing in a one-line decorative element.
</step_14>

---

<step_15>
### Step 15. Empty state + Skeleton primitives

Two display-only utilities used across every list / table screen.

**Files:**
- Create: `src/components/common/EmptyState.jsx` — props `icon`, `title`, `hint`, `action` (slot). Renders `.sh-empty` centered.
- Create: `src/components/common/Skeleton.jsx` — props `width`, `height`, `count` (default 1). Renders one or more `.sh-skeleton` divs with a 1.6 s shimmer.
- Modify: `src/style/App.css` — add `.sh-empty*` and `.sh-skeleton*` rules from reference (200% gradient + `animation` shimmer keyframes).

**Criteria:**
- `<EmptyState icon="inbox" title="No notes yet" hint="Tap + to start one" />` renders a centered block with a 32 px icon in `--ink-faint`, title in display 20 px, hint in mono 11 px.
- `<Skeleton count={4} height="2rem" />` renders 4 shimmer bars stacked with `--space-2` gap.
- Shimmer animation runs without console warnings about non-composited properties.
- QA §12 contributions: empty states show for brand-new characters.
</step_15>

---

<step_16>
### Step 16. `<BottomSheet>` + `<Modal>` primitives

Container primitives that the accent picker (Step 20), feat-choice modal (Step 26), and any future picker reuse.

**Files:**
- Create: `src/components/common/BottomSheet.jsx` — props `open`, `onClose`, `title`, `children`. Renders a scrim + `.sh-sheet` anchored to bottom with a drag handle. Tap-scrim and Escape both call `onClose`. Slide-up enter, slide-down exit via CSS transitions (320 ms).
- Create: `src/components/common/Modal.jsx` — props `open`, `onClose`, `title`, `eyebrow`, `footer`, `children`. Centered, max 22 rem, three regions (head / body / foot).
- Modify: `src/style/App.css` — add `.sh-scrim`, `.sh-sheet*`, `.sh-modal*` rules from reference.

**Criteria:**
- Opening a `<BottomSheet>` displays the scrim above all other content; tapping the scrim closes it.
- Pressing `Escape` while either is open calls `onClose`.
- Focus is trapped inside the sheet/modal while open; on close, focus returns to the trigger element.
- Sheet drag handle is visible at the top of the sheet (2.5 rem × 4 px, `--border-strong`).
- QA §12 contributions: drawer-scrim dismissal pattern (foundation reused for drawer in Step 19).
</step_16>

---

<step_17>
### Step 17. Top bar — mobile variant

Hamburger + brand wordmark + accent dot. **No "S" letter-square** — use the existing app icon (favicon-style glyph) or a non-letter Material Symbol, plus the wordmark "Shopperino" in `--font-display`.

**Files:**
- Modify: `src/components/menus/top_menu.jsx` — branch on `isMobile()`; mobile variant renders `.sh-topbar` with: left `<IconButton icon="menu" onClick={openDrawer} />` (hidden when `sharedShop` is active); center brand row (icon glyph + wordmark, NO letter-in-square); right slot with optional page-specific trailing button + accent dot button that opens the accent picker sheet.
- Create: `src/style/topbar.css` — `.sh-topbar*` rules from reference. Import from `App.css`.
- Modify: `src/App.jsx` — pass an `openAccentPicker` callback down, or expose it via a small context.

**Criteria:**
- On a 390×844 viewport, the top bar is exactly 3.5 rem tall, full-width, with `--bg-elev` background and a `--border-soft` bottom border.
- The hamburger icon is ≥ 44×44 and visually centered in the left slot.
- The brand area shows the wordmark only — no letter-square anywhere.
- The accent dot is a 1 rem circle filled with `--accent`, ringed by `--bg-elev` + `--border-strong`; tapping it opens a `<BottomSheet>` (placeholder content for now — wired up fully in Step 20).
- QA §12 contributions: tap target ≥ 44 px (hamburger, accent dot); no letter-square initials in app chrome.
</step_17>

---

<step_18>
### Step 18. Top bar — desktop variant

Visible tab bar inside the top bar at `min-width: 769px`. Master/Player toggle, accent dot, and settings on the right.

**Files:**
- Modify: `src/components/menus/top_menu.jsx` — desktop branch renders six tabs (Home, Shop, Spellbook, Loot, Search, Player Sheet); Shop and Loot are removed in Player mode. Active tab style uses `--accent-soft` bg, `--accent-muted` border, `box-shadow: inset 0 -2px 0 0 var(--accent)`.
- Modify: `src/style/topbar.css` — add `.sh-tab` and `.sh-tabbar` rules + segmented toggle styles for Master/Player.

**Criteria:**
- At ≥ 1024 px viewport, six tabs render in a horizontal row centered in the top bar; Shop/Loot disappear when `state.app.isMasterMode === false`.
- Active tab has an accent underline visible across all 3 accent hues used for visual QA.
- Master/Player toggle is a segmented pill with `aria-pressed` on the active half.
- No layout shift when switching modes (the two tabs animate out, not jump).
- QA §12 contributions: active-state visibility across accent hues.
</step_18>

---

<step_19>
### Step 19. Sidebar drawer (mobile) + persistent sidebar (desktop)

Restructure the sidebar wrapper so the same children render as a slide-in drawer on mobile and as a fixed left rail on desktop ≥ 1024 px.

**Files:**
- Create: `src/components/common/Sidebar.jsx` — wrapper that detects breakpoint via the existing `isMobile()` util + a desktop CSS class. Mobile: renders inside a left-anchored `<BottomSheet>` variant (or a new `<Drawer>` analogue — extract the shared animation from BottomSheet if needed). Desktop ≥ 1024 px: renders inline in a `.sh-sidebar` rail.
- Modify: `src/style/sidebar.css` — replace contents with `.sh-drawer*` and `.sh-sidebar*` rules from reference. Keep file path stable.
- Modify: `src/App.jsx` — wire the existing `sidebarCollapsed` state to the new wrapper. The hamburger from Step 17 dispatches `toggleSidebar`.

**Criteria:**
- On 390×844, the sidebar is hidden by default; tapping the hamburger slides it in from the left over a `oklch(0 0 0 / 0.55)` scrim within 320 ms.
- Tapping the scrim dismisses the drawer.
- On 1280×800, the sidebar is permanently visible at 18 rem wide with `--bg-elev` background and a `--border-soft` right border.
- Drawer width caps at `min(86vw, 21rem)`.
- QA §12 contributions: drawer scrim dismisses on tap; sticky nav not blocked by drawer.
</step_19>

---

<step_20>
### Step 20. Accent picker bottom sheet (replaces colorPicker.js)

12 curated hues + dark/light theme toggle. Mobile = bottom sheet, desktop = popover.

**Files:**
- Modify: `src/components/menus/colorPicker.js` — rewrite as a React component (rename file to `accentPicker.jsx` if needed; keep a re-export from `colorPicker.js` for one cycle to avoid orphan imports). Mobile path renders a `<BottomSheet>`; desktop path renders a `.sh-popover` anchored to the accent dot.
- Modify: `src/style/App.css` — add `.sh-swatch*` and `.sh-popover` rules from reference.
- Modify: `src/store/slices/appSlice.js` — keep `setMainColor` for backwards compatibility but make selecting a swatch dispatch `setAccent(name)` (and `setTheme(name)` for the toggle).

**Criteria:**
- Tapping the accent dot opens the picker; on 390×844 it slides up as a bottom sheet, on 1280×800 it pops as a popover.
- The sheet shows a 4×3 swatch grid (12 hues from reference: Crimson, Brass, Olive, Emerald, Teal, Royal, Indigo, Violet, Plum, Rose, Bronze, Slate).
- Tapping a swatch immediately updates `state.app.accent` and `document.body.className`; the whole UI reskins within one frame, including the swatch itself (the live state).
- The Dark/Parchment toggle works and the change persists across refresh.
- QA §12 contributions: live accent change across the UI; theme change preserves accent.
</step_20>

---

<step_21>
### Step 21. PlayerSheetBottomNav — 7 items

Replace the existing bottom nav with the 7-item version. Preserve long-press popouts on Spells / Skills.

**Files:**
- Modify: `src/components/player_sheet/PlayerSheetBottomNav.jsx` — render 7 items: Combat (`swords`), Inventory (`backpack`), Skills (`person_play`), Feats (`auto_awesome`), Features (`extension`), Spells (`wand_stars`), Notes (`edit_note`). Active item: `--accent` color + 2 px top bar spanning 56% width with `--accent-glow`. Preserve long-press popouts on Spells (existing behavior) and add a similar long-press scaffold on Skills.
- Modify: `src/style/player_sheet.css` — add `.sh-bnav*` rules from reference, removing the old bottom-nav CSS.
- Modify: `src/components/player_sheet/player_sheet_page.jsx` — make sure the bottom nav stays sticky with `safe-area-inset-bottom` padding so the home indicator on iPhones doesn't overlap.

**Criteria:**
- On 390×844, the bottom nav is 4.25 rem + safe-area-inset-bottom, fixed to the viewport bottom.
- All 7 items are visible without horizontal scrolling.
- Tapping each item dispatches the correct `setMainView` payload and the active indicator moves accordingly.
- Long-pressing Spells still opens the existing popout (visual regression check against current behavior).
- The bottom nav remains visible while the inventory page is scrolled to the bottom (no overlap with content because the page has `padding-bottom` ≥ nav height).
- QA §12 contributions: bottom nav sticky during scroll; long-press preserved.
</step_21>

---

<step_22>
### Step 22. Combat page

Top-down layout: header card → HP card → AC/Init/Speed → Saves → Attacks → AC breakdown. Portrait slot is striped placeholder only — **no initials overlay**.

**Files:**
- Modify: `src/components/player_sheet/combat_page.jsx` — rewrite markup using `<Card>`, `<Stat>`, `<StatPill>`, `<Bar>`, `<Pill>`, `<Filigree>` atoms. Portrait slot: a 4.5 rem square with diagonal stripes from `--surface-2` / `--surface-3` and a single `auto_fix_high` Material Symbol overlay (NOT initials). Read all derived numbers from the Player model methods (`getAC`, `getInitiative`, `getSavingThrow`, `getAttackBonus`, etc.) — never recompute.
- Modify: `src/style/player_sheet.css` — add `.sh-combat-*` block styles from reference; remove obsolete combat-page rules.
- Modify: `src/components/menus/player_sheet_sidebar/cards/menu_card_combat.jsx` — minor adjustments to align with the new Card pattern (full restyle in Step 29).

**Criteria:**
- The page renders on 390×844 with no horizontal scroll. Every section is a `<Card>`.
- HP bar is `--danger` red and reflects current HP/max ratio via `<Bar variant="hp" />`.
- AC and Will saves render with the accent variant (per the wizard reference design).
- The portrait slot shows diagonal stripes and a faint icon — no character initials, no letter at all.
- Attacks card lists each weapon as a row with attack pill + damage pill in `--font-mono` tabular figures.
- AC breakdown card shows the mono key/value list and a divider above the accent total.
- QA §12 contributions: rem-only; no letter-square; no logic in UI (verify by grep — combat_page.jsx contains no arithmetic on stats).
</step_22>

---

<step_23>
### Step 23. Inventory page

Encumbrance card + filter chips + table card with equipped tick / name+meta / qty / weight / value.

**Files:**
- Modify: `src/components/player_sheet/inventory_page.jsx` — rewrite using `<Card>`, `<Bar variant="warn|accent">` (warn when load > carrying capacity), `<Chip>` for filter row, `<Tickbox>` for equipped column, `<Stepper>` for qty.
- Modify: `src/components/player_sheet/inventory/InventoryTableHeader.jsx` — restyle as `.sh-row-head` to match table card.
- Modify: `src/style/player_sheet.css` — add `.sh-inv-*`, `.sh-row-head` rules from reference; remove obsolete inventory CSS.
- Modify: `src/style/equipment_grid.css` — replace contents with the new equipment grid rules from reference, or delete if not used by the new design (verify references first).

**Criteria:**
- Encumbrance card shows current load in mono tabular figures, the `<Bar>` reflects the ratio, and bar tints `--warn` when over capacity with a `<Pill tone="warn">over` shown alongside (soft warning, never blocks input).
- Filter chip row scrolls horizontally on mobile with `scrollbar-width: none`.
- Each row has equipped tickbox + name/meta + qty stepper + weight + value; aligned via grid.
- Adding/removing items via the existing thunks works (Redux wiring untouched).
- QA §12 contributions: soft-warning state on over-cap encumbrance.
</step_23>

---

<step_24>
### Step 24. Skills page

Skill rows with class-skill dot, ranks stepper, modifier, total, and soft-warning when ranks exceed cap.

**Files:**
- Modify: `src/components/player_sheet/skills_page.jsx` — rewrite using `<Stepper>` for ranks, `<Pill tone="warn">` when over cap, `<Pill tone="accent">` for synergies. Apply `.is-overlimit` class to rows where `ranks > maxRanks` (computed by Player model, never re-derived here).
- Modify: `src/style/player_sheet.css` — add `.sh-skill-*`, `.is-overlimit` rules from reference.

**Criteria:**
- Each skill row: class-skill dot (filled accent) or cross-class dot (outlined), name, mod (mono), total (mono).
- Setting a skill's ranks above its cap via the stepper does not block the input but adds `.is-overlimit` (3 px amber left rail + faint amber bg gradient) and shows a `<Pill tone="warn" icon="warning">over cap</Pill>`.
- The header pill "X / Y ranks" updates live as ranks change.
- The ranks-summary strip at the top of the page shows a `<Pill tone="warn">` when total ranks exceed the character's pool.
- QA §12 contributions: soft-warning never blocks input; amber (warn) distinct from red (danger).
</step_24>

---

<step_25>
### Step 25. Player Spells page

Slot summary strip + level-grouped rows with `<Slots>` indicators and prepared tickboxes.

**Files:**
- Modify: `src/components/player_sheet/player_spells_page.jsx` — rewrite using `<Slots>`, `<Tickbox>`, `<Pill>`. Group spells by level via the existing per-character spell list; level headers use `.sh-level-header` markup with the diamond slot row.
- Modify: `src/style/player_sheet.css` — add `.sh-level-header*`, `.sh-spell-row*` rules from reference.

**Criteria:**
- Each level has a header showing big display level number, "{lvl} level" text, used/slots count, and `<Slots total used />`.
- Over-prepared level header gets `data-warn="true"` (amber background, warn icon line).
- Spell rows have the school glyph square (`--accent-soft` background + `--accent` color when prepared) and a tickbox on the right.
- Tapping the tickbox dispatches the existing prepare/unprepare thunk; no logic added here.
- QA §12 contributions: soft-warning on over-prepared level; rem-only sizing on dense rows.
</step_25>

---

<step_26>
### Step 26. Feats page + feat-choice modal

Feat cards list + the modal triggered by "Choose feat".

**Files:**
- Modify: `src/components/player_sheet/feats_page.jsx` — rewrite using `<Card>` for each feat, accent star icon, optional "class bonus" pill, info `<IconButton>`.
- Modify: `src/components/player_sheet/FeatChoicePopover.jsx` — re-target onto the new `<Modal>` primitive. Filter chips at the top (search input), feat option cards in the body, ghost Cancel + primary Confirm in the footer. Cards with unmet prereqs show `<Pill tone="warn">`.
- Modify: `src/style/player_sheet.css` — add `.sh-feat-*` rules from reference.

**Criteria:**
- Feats page renders a stack of feat cards; class-bonus feats get an accent pill.
- "Choose feat" button opens the modal; selected option has `--accent-soft` background and `--accent-muted` border with a checked tickbox.
- A feat option with unmet prerequisites still appears selectable (no block), but shows the warn pill and a `.sh-warn-strip` describing the missing prereq.
- Confirming dispatches the existing add-feat thunk; canceling closes the modal with no state change.
- QA §12 contributions: warn pill ≠ block; modal focus trap; Escape closes.
</step_26>

---

<step_27>
### Step 27. Features page

Class card + race card listing granted features with locked indicators for unmet level requirements.

**Files:**
- Modify: `src/components/player_sheet/features_page.jsx` — rewrite using `<Card>`. Class card rows: `extension` icon (accent for granted, faint for locked), feature name, meta, optional "locked" pill at unlock level. Race card rows: `auto_fix_high` icon, same pattern.
- Modify: `src/components/player_sheet/class_cards.jsx` — restyle wrapper into the new `<Card>` pattern.
- Modify: `src/components/player_sheet/race_cards.jsx` — same as class cards.
- Modify: `src/style/player_sheet.css` — add `.sh-feature-*` rules from reference.

**Criteria:**
- Features page renders a class card and a race card stacked.
- Each feature row shows the granted/locked state through icon color tokens (`--accent` vs `--ink-faint`) — never raw colors.
- Locked features show a `<Pill>` with the level at which they unlock; no logic added here, just rendering what the Player model reports.
- Multi-class characters render one card per class.
- QA §12 contributions: rem-only sizing; logic stays in models.
</step_27>

---

<step_28>
### Step 28. Notes page

Filter chip row + note cards with textarea, format buttons, and idle-save behavior.

**Files:**
- Modify: `src/components/player_sheet/note_editor.jsx` — rewrite using `<Card>`, `<Chip>` for filters, the existing textarea wrapped with new `.sh-textarea` styling.
- Modify: `src/style/player_sheet.css` — add `.sh-textarea`, `.sh-note-*` rules from reference.

**Criteria:**
- Notes page renders the filter chip row (Recent / Quest / Lore / NPC) + a stack of note cards.
- Each card has a textarea (min-height 11 rem), an edited-at timestamp in mono, and Bold/List/Save buttons in the footer.
- On blur or 2 s idle, the existing save action dispatches once (verified via Redux DevTools).
- QA §12 contributions: empty state shows for a character with no notes.
</step_28>

---

<step_29>
### Step 29. Player Sheet sidebar cards restyle

Wrap every existing menu card inside `src/components/menus/player_sheet_sidebar/cards/` in the new `<MenuCard>` pattern. Internal controls (selects, inputs) use the new `<Field>` and form atoms.

**Files:**
- Modify: each `*.jsx` file in `src/components/menus/player_sheet_sidebar/cards/` — wrap top-level card in `<MenuCard title=... icon=... defaultOpen=...>` and replace ad-hoc form rows with `<Field>` wrappers. Do not change the underlying form values, dispatches, or thunk calls.
- Modify: `src/components/menus/player_sheet_sidebar/player_sheet_sidebar.jsx` — top-level rendering stays the same; just ensures it composes the restyled cards.

**Criteria:**
- All existing controls remain functional (creating / loading / deleting / editing a character still works via the same thunks).
- Each menu card collapses/expands cleanly via the new chevron rotation pattern.
- Visual QA at 390×844 in the drawer: no horizontal overflow, all tap targets ≥ 36 px (secondary).
- QA §12 contributions: drawer composability; tap target floor maintained.
</step_29>

---

<step_30>
### Step 30. Spellbook sidebar cards restyle

Same pattern as Step 29 for the Spellbook sidebar.

**Files:**
- Modify: each `*.jsx` file in `src/components/menus/spellbook_sidebar/cards/`.
- Modify: `src/components/menus/spellbook_sidebar/spellbook_sidebar.jsx` if necessary (composition only).

**Criteria:**
- All Spellbook controls (create book, select character, configure class) remain functional.
- Each card uses `<MenuCard>` and the existing form atoms.
- Drawer renders cleanly at 390×844.
- QA §12 contributions: drawer composability.
</step_30>

---

<step_31>
### Step 31. Shop sidebar cards restyle

Same pattern for the Shop sidebar. Includes the Settle & Merchant, Shop Type, Rarity Bias cards + the Generate / Share action row at the bottom.

**Files:**
- Modify: each `*.jsx` file in `src/components/menus/shop_sidebar/cards/`.
- Modify: `src/components/menus/shop_sidebar/shop_sidebar.jsx` — ensure the bottom action row uses the new `<Button>` atom (primary + ghost).

**Criteria:**
- Shop generation still works end-to-end (Generate dispatches existing thunk; the main panel re-renders).
- "Share shop" QR code flow remains functional.
- Drawer renders at 390×844 with the action row sticky at the bottom.
- QA §12 contributions: drawer composability; tap target floor.
</step_31>

---

<step_32>
### Step 32. Loot sidebar cards restyle

Same pattern for the Loot sidebar.

**Files:**
- Modify: each `*.jsx` file in `src/components/menus/loot_sidebar/cards/`.
- Modify: `src/components/menus/loot_sidebar/loot_sidebar.jsx`.

**Criteria:**
- Loot generation works end-to-end through existing thunks.
- Drawer renders cleanly at 390×844.
- QA §12 contributions: drawer composability.
</step_32>

---

<step_33>
### Step 33. Info sidebar restyle

The info sidebar shows cards that appear when a user taps a link (spell, item, feat, condition, etc.). Restyle to use the new `<Card>` markup.

**Files:**
- Modify: `src/components/menus/info_sidebar/info_sidebar.jsx` — render each `infoCard` in a `<Card>` with a close `<IconButton>` in the title slot.
- Modify: any per-card-type renderers inside `src/components/menus/info_sidebar/cards/` (spell card, item card, feat card, etc.).

**Criteria:**
- Tapping a spell/item/feat link from any tab still adds an info card to the sidebar and opens it (mobile auto-opens per existing behavior).
- Each card has the new visual treatment with the title in `--font-display` and content body using `--space-3` gutters.
- Close button on each card dispatches `removeCard`.
- QA §12 contributions: rem-only sizing; tap targets.
</step_33>

---

<step_34>
### Step 34. Spellbook tab

Master Spellbook view (browsing all spells per character + per class with prepare-tracking).

**Files:**
- Modify: `src/components/spellbook/*` — apply `.sh-level-header` + `.sh-spell-row` markup using `<Slots>`, `<Tickbox>`, `<Pill>`. (The Player Spells page from Step 25 shares this vocabulary — extract any shared markup into a `SpellRow.jsx` component in `src/components/common/` if it cleans things up.)
- Modify: `src/style/player_sheet.css` (or move shared spell-row CSS to a new `src/style/spells.css`) so both Spellbook tab and Player Spells page render consistently.

**Criteria:**
- Spellbook renders a level-grouped list of spells with the new design.
- Toggling a spell as prepared dispatches the existing thunk; over-preparing a level shows the warn header (no block).
- Search/filter controls inside the sidebar still work and produce the same filtered list.
- QA §12 contributions: shared component reuse between Spellbook and Player Spells.
</step_34>

---

<step_35>
### Step 35. Search tab

Compact result rows + filter chip strip; desktop adds a right-side detail pane.

**Files:**
- Modify: `src/components/search/*` — use `<Chip>` filter row, `.sh-result-row` markup with kind-icon square + name/meta + tail meta. Detail pane (desktop ≥ 1024 px) renders the existing detail view inside a `<Card>`.
- Modify: `src/style/App.css` (or a new `src/style/search.css`) — add `.sh-result-row*` rules from reference.

**Criteria:**
- Search input filters across spells/items/feats/skills with the same logic as today (no algorithm changes).
- Chip strip scrolls horizontally on mobile without scrollbar artifact.
- On 1280×800, the right detail pane updates when a result row is tapped.
- Empty state shows when search returns zero results.
- QA §12 contributions: empty states; tap targets.
</step_35>

---

<step_36>
### Step 36. Shop tab

`.sh-shop-row`s grouped in a single inventory card; pill row for wealth/rarity/count; search input.

**Files:**
- Modify: `src/components/shop/*` — restyle the inventory list using `.sh-shop-row` markup (rarity dot + name+meta on left, price + qty on right). Wrap the list in a flush `<Card padding={false}>`.
- Modify: `src/style/shop_inventory.css` — replace contents with `.sh-shop-row*` and `.rarity-*` dot rules from reference.

**Criteria:**
- Generated shop renders rows with rarity dots colored via tokens (no literals; each rarity gets a `.rarity-${tier}` class that resolves to a token color).
- Re-roll button at the bottom is a ghost block button using the new `<Button>` atom.
- On 1280×800, the layout uses a `.sh-row-head` table header above the rows.
- QA §12 contributions: rem-only; tap targets on stepper / re-roll.
</step_36>

---

<step_37>
### Step 37. Loot tab

Coin / Gems & art / Magic items sections.

**Files:**
- Modify: `src/components/loot/*` — restyle the loot inventory into 3 section `<Card>`s, each containing rows that reuse the `.sh-shop-row` markup with a value pill on the right.
- Modify: `src/components/loot/loot_inventory.jsx` specifically — section grouping logic stays in the existing slice / utility; this component just renders what it gets.

**Criteria:**
- Generated hoard renders 3 sections, each labeled with a `<Filigree>` eyebrow.
- Re-roll and Save-hoard buttons live in a sticky footer row using the new `<Button>` atoms.
- Empty section (e.g. no gems) shows an empty state inline instead of a stray empty card.
- QA §12 contributions: empty states; rem-only.
</step_37>

---

<step_38>
### Step 38. Home tab

Hero block + 2-column tile grid + quick resume card.

**Files:**
- Modify: `src/components/main_page/*` — hero block uses `<Filigree>` + display headline + `<span class="sh-accent-text">` for accent highlights. Tile grid: each tile is a `<Card>` with icon, name, meta, and an `.sh-tile--master` modifier for the Player Sheet tile.
- Modify: `src/style/App.css` — add `.sh-tile*` and `.sh-hero*` rules from reference.

**Criteria:**
- On 390×844, the tile grid renders 2 columns; on 1280×800, a 3×2 grid with the hero in a 2-column layout.
- Master-only tiles (Shop, Loot) hide in Player mode and tag with a "Master" `<Pill tone="accent">` when shown.
- Quick resume card shows the last 2 events with mono timestamps; if there are no events, an empty state appears.
- Tapping any tile dispatches `setStateCurrentTab` to the right tab.
- QA §12 contributions: master/player visibility; empty states; rem-only.
</step_38>

---

<step_39>
### Step 39. Final QA — full §12 checklist sweep

Execute the complete QA checklist from Handoff §12 across Dark + Light themes, three breakpoints (390, 768, 1280), and at least three accent hues (Crimson, Emerald, Royal). Capture any divergences in `obsidian-vault/plans/shopperino_redesign_implementation_plan-state.json` as `divergences[]` entries; fix on the spot if minor, otherwise log and report.

**Files:**
- Read-only verification. May modify any of the previously-touched files to fix found issues (record each fix as a divergence in the state file).

**Criteria:**
- Every interactive element on every screen is ≥ 44×44 px on mobile (verified via DevTools box-model on a sampled element from each page).
- A grep across `src/components/` and `src/style/` (excluding `tokens.css`) finds zero `oklch(`, zero `#[0-9a-f]{3,6}\b`, zero `rgb(` / `rgba(` color literals.
- A grep across `src/components/` and `src/style/` finds zero `\d+px\b` matches for `margin`, `padding`, `width`, `height`, `gap`, `top`, `left`, `right`, `bottom`, `border-radius` properties (exceptions: `1px` borders are allowed; document any other exceptions).
- Manually setting a skill's ranks past its cap shows the soft-warning state (amber strip, warn pill) without blocking the stepper.
- Switching accent (Crimson → Emerald → Royal) updates buttons, borders, focus rings, slot indicators, selected rows, and tab indicators live with no page reload.
- Switching theme (Dark → Light) preserves the accent and produces a legible Light mode on every screen.
- Bottom nav remains visible while the inventory page is scrolled to the bottom on 390×844.
- Drawer scrim dismisses the drawer on tap.
- Long-press on Spells bottom-nav opens the popout; long-press on Skills shows the popout if implemented (otherwise document as deferred).
- Empty states appear on a brand-new character (no inventory / no spells / no notes).
- Keyboard focus is visible (2 px `--accent-ring`) on all interactive controls verified on the Combat page and Inventory page.
- No layout shift when the right-side desktop info sidebar opens / closes (matches the previous behavior described in `player_sheet.css`).
- All checks documented as criterion results in the state file. Any failed criterion blocks completion until fixed.
</step_39>
