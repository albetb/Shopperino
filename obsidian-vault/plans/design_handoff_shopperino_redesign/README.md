# Handoff — Shopperino Redesign

> **TL;DR**: Total UI redesign of the existing React 18 + Redux Toolkit Shopperino SPA. Six top-level tabs, seven Player Sheet sub-pages, mobile-first (390 × 844). One **`--accent`** custom property reskins the entire UI. Dark + light modes. All sizing in `rem`. The HTML files in this folder are **design references** — re-create them in the existing `src/components/` + `src/style/` structure. Don't change data structures or app architecture.

---

## 1. About the design files

The HTML/JSX/CSS files bundled with this README are **prototypes built to communicate the design**, not production code. They render through Babel-in-the-browser inside a `design_canvas` host so you can pan around all screens side-by-side.

Your job is to **implement the same UI inside the existing Shopperino codebase** (React 18 + Redux Toolkit, the slices and thunks already wired in `src/store/`, the domain models in `src/lib/`). Keep all current state shapes, Redux actions, persistence (compressed tuples in `localStorage`), and model methods — only the markup and styles change.

This is a **high-fidelity** redesign. Recreate the layouts, spacing, color, type, and behavior as specified.

### Files in this folder

| File | What it is |
|---|---|
| `Shopperino Redesign.html` | Main entry. Pan/zoom canvas presenting every screen. |
| `tokens.css` | **Authoritative token spec.** Copy into `src/style/tokens.css` and import once at app root. |
| `app.css` | Reference component CSS — port classes into your existing `src/style/*.css` files. |
| `components.jsx` | Reference atoms (Button, Pill, Card, Stepper, etc.) — port to React components in `src/components/common/`. |
| `ds.jsx` | The Design System page (tokens + atoms + molecules) — useful as a living style guide if you want one. |
| `screens-mobile.jsx` | Every mobile screen, 390×844. |
| `screens-responsive.jsx` | Tablet (768) and desktop (1280) adaptations. |
| `screenshots/` | Pre-rendered preview images of every screen. See section 16. |
| `design-canvas.jsx` | Canvas host — not part of the deliverable, ignore. |

To preview locally: open `Shopperino Redesign.html` directly in a browser. No build needed.

---

## 2. Aesthetic direction

**Ink & Candlelight** — premium tabletop companion. Modern, legible, slightly literary. Not skeuomorphic, no leather textures, no candle-fire backgrounds. Brass-warm shadows only where they earn their place.

- **Type**
  - Display (character names, card titles, big numbers): **Cormorant Garamond**, 500–600 weight
  - UI (everything else): **Manrope**, 400–600
  - Numerals (stats, prices, weights): **JetBrains Mono**, tabular figures via `font-variant-numeric: tabular-nums`
  - Type scale: `--font-size-2xs` (11px) → `--font-size-5xl` (52px). Use the named tokens, not pixel values.

- **Color**
  - Dark mode default: deep ink with a 60° hue (warm) base. Parchment-cream text (`oklch(0.945 0.012 85)`).
  - Light mode: warm cream (`oklch(0.965 0.018 88)`), deep ink text.
  - One accent hue knob (`--accent`) drives 5 derivatives. Default crimson; users can pick from a curated 12-swatch palette.
  - Semantic: `--danger` red is reserved for HP/damage. `--warn` amber is for soft rule-violations. `--success` green only for "trained / completed / healed."

- **Surfaces & elevation**
  - 4 surface tones (`--bg`, `--bg-elev`, `--surface-1`, `--surface-2`, `--surface-3`) so cards-on-cards stay legible.
  - Shadows: 3 levels, warm cast. Inset 1-px highlight on top edge for depth.

---

## 3. Token system (the source of truth)

Paste `tokens.css` into `src/style/tokens.css` and `@import` it once at the top of `src/style/App.css`. **No other file should define raw colors or spacing.**

### Spacing scale (rem)
```
--space-1: 0.25   (4px)    --space-2:  0.5    (8px)    --space-3: 0.75 (12px)
--space-4: 1     (16px)    --space-5:  1.25   (20px)   --space-6: 1.5  (24px)
--space-8: 2     (32px)    --space-10: 2.5    (40px)   --space-12: 3   (48px)
```

### Radii
```
--radius-xs: 0.25rem   --radius-sm: 0.375rem   --radius-md: 0.625rem
--radius-lg: 0.875rem  --radius-xl: 1.25rem    --radius-pill: 999px
```

### Tap-target floor
```
--tap-target: 2.75rem  (44px — minimum for any interactive element)
--tap-target-sm: 2.25rem (36px — secondary controls only)
```

### Type scale
```
--font-size-2xs: 0.6875rem      --font-size-xs:  0.75rem
--font-size-sm:  0.8125rem      --font-size-md:  0.9375rem
--font-size-lg:  1.0625rem      --font-size-xl:  1.25rem
--font-size-2xl: 1.5rem         --font-size-3xl: 1.875rem
--font-size-4xl: 2.5rem         --font-size-5xl: 3.25rem
```

### Color tokens — dark theme (light theme inverts; see `tokens.css`)
```
--bg:            oklch(0.155 0.006 60)      page background
--bg-elev:       oklch(0.185 0.007 60)      top bar / nav / drawer
--surface-1:     oklch(0.215 0.008 60)      cards
--surface-2:     oklch(0.255 0.009 65)      nested / row hover
--surface-3:     oklch(0.305 0.010 65)      active / pressed

--border:        oklch(0.32 0.011 65)
--border-soft:   oklch(0.255 0.009 60)      hairlines inside cards
--border-strong: oklch(0.42 0.014 70)

--ink:           oklch(0.945 0.012 85)      primary text
--ink-muted:     oklch(0.74 0.012 78)
--ink-faint:     oklch(0.58 0.010 70)
--ink-disabled:  oklch(0.42 0.008 70)

--warn:          oklch(0.78 0.135 78)       soft rule warning
--danger:        oklch(0.66 0.19 22)        HP / damage / destructive
--success:       oklch(0.72 0.13 150)       healed / trained / done
--info:          oklch(0.72 0.10 235)
```

### Accent — the single live knob
Five derivatives, all generated from one base hue:
```
--accent:        base hue                       (driver)
--accent-strong: same hue, +5–6 L (hover)
--accent-soft:   same hue, alpha 0.10           (background tint)
--accent-muted:  same hue, alpha 0.18           (borders/divider)
--accent-ring:   same hue, alpha 0.55           (focus ring)
--accent-glow:   same hue, alpha 0.35           (drop-shadow halo)
--accent-fg:     near-white                     (text on accent)
```

12 curated hues in the picker:
Crimson, Brass, Olive, Emerald, Teal, Royal, Indigo, Violet, Plum, Rose, Bronze, Slate. See `.accent-*` classes in `tokens.css` for exact values. Add a new one by giving the 5 alpha/strong derivatives the same hue.

---

## 4. Component inventory & mapping to current code

This redesign **replaces the markup and CSS** of each existing component but keeps the Redux wiring intact. Map as follows:

| Existing file | Re-implement using |
|---|---|
| `src/style/App.css` | Replace `--white`, `--dark-grey`, `--main`, etc. with the new tokens. `--main` ⇒ `--accent`. Keep variable name `--main` if any source files depend on it, but alias `--main: var(--accent)`. |
| `src/style/buttons.css`, `menu_cards.css`, `sidebar.css` | Replace contents with the `.sh-btn-*`, `.sh-menu-card`, `.sh-drawer` rules from `app.css`. Rename classes if you prefer (`.btn-primary` etc.). |
| `src/style/player_sheet.css` | Most of this file becomes obsolete; replace with the `.sh-stat-*`, `.sh-stat-pill`, `.sh-bar-*`, `.sh-spell-row`, `.sh-bnav` rules. |
| `src/style/shop_inventory.css` | Replace with `.sh-shop-row` rules. |
| `src/components/menus/top_menu.jsx` | New mobile + desktop variants. Mobile: hamburger drawer; desktop: visible tab bar inside top bar. See **Top chrome** below. |
| `src/components/menus/colorPicker.js` | Now opens a **bottom sheet** on mobile and a popover on desktop. Shows 12 curated hues + theme toggle (Dark/Parchment). On select: dispatch `setMainColor(<hex or hue-name>)` AND swap the `theme-*` / `accent-*` body class. |
| `src/components/menus/*_sidebar/*.jsx` | Stay structurally identical but use the new `.sh-menu-card` markup for each collapsible card. |
| `src/components/player_sheet/PlayerSheetBottomNav.jsx` | Now shows **7 items** (Combat, Inventory, Skills, Feats, Features, Spells, Notes). Active indicator: 2 px top bar + accent color tint. Long-press popouts retained. |
| `src/components/player_sheet/combat_page.jsx` | New layout — header card → HP card → AC / Init / Speed → 3 saves → Attacks card → AC breakdown card. No skeuomorphic frames. |
| `src/components/player_sheet/inventory_page.jsx` | New grid layout. Encumbrance bar at top. Filter chips below. Row: equipped tick → name+meta → qty stepper → weight → value. |
| `src/components/player_sheet/skills_page.jsx` | Skill row gets a colored dot for class-skill, a stepper for ranks, a warning pill when ranks exceed the cap. |
| `src/components/spellbook/*` | Level headers get the `.sh-level-header` treatment with diamond slot indicators. Spell rows use `.sh-spell-row`. |
| `src/components/search/search_page.jsx` | New compact row using `.sh-result-row`. Filter chips top-aligned. Desktop adds a right-side detail pane. |
| `src/components/shop/*` | Shop rows: rarity dot + name/meta on left, price/qty on right. |
| `src/components/loot/loot_inventory.jsx` | Same as shop rows but grouped into Coin / Gems / Magic sections. |

### Brand new components to add to `src/components/common/`

Build these as small, presentational components. Each maps 1:1 to a class in `app.css`:

- `<Pill tone="accent|warn|danger|success|ghost" icon="…">` — chip-style badge
- `<Chip on icon onClick>` — toggleable filter chip
- `<Button variant="primary|ghost|danger" size="sm" block icon iconRight>` — primary action button
- `<IconButton icon size="sm" ghost badge>` — square or pill icon button
- `<Card title eyebrow action accent padding>` — wrapper card
- `<MenuCard title icon open badge>` — collapsible sidebar card
- `<Field label hint>` — form field wrapper
- `<Stepper value min max onChange>` — number stepper
- `<Switch checked onChange>` — toggle
- `<Tickbox checked onChange icon>` — square checkbox
- `<Stat label score mod tone="accent|warn">` — ability score block (mod big, score in pill)
- `<StatPill label value sub accent>` — AC/Init/Save tile
- `<Bar value variant="hp|xp|warn">` — progress bar
- `<Slots total used>` — spell-slot diamond row
- `<Filigree>...</Filigree>` — eyebrow with hairline accents

See `components.jsx` for reference implementations of each. They're plain JSX with className wiring.

---

## 5. Screens

Names in **bold** match the existing `currentTab` IDs. Each screen description below specifies layout (top-down) and component map. Refer to the canvas HTML for pixel reference.

### 5.1 Global chrome

#### Top bar — mobile (≤ 768px)
- Height **3.5 rem**. `background: --bg-elev`. Bottom border `--border-soft`.
- Left: hamburger icon button (`<IconButton ghost icon="menu" />`) opens the **sidebar drawer**. Hidden on shared-shop view.
- Center: brand mark (small accent-color square with "S" in display font, 1.75 rem) + "Shopperino" in `--font-display` 20 px.
- Right: trailing slot (page-specific) + **accent dot** button (1 rem circle, filled with `--accent`, ringed with `--bg-elev` / `--border-strong`) → opens the accent picker sheet.

#### Top bar — desktop (≥ 769px)
- Height **3.75 rem**, padding 0 1.5 rem.
- Brand on left. **Visible tab bar** (six tabs, hide Shop & Loot in player mode) in the middle. Master/Player segmented toggle, palette button, settings on the right.
- Active tab style: `--accent-soft` background, `--accent-muted` border, `box-shadow: inset 0 -2px 0 0 var(--accent)`. Inactive: `color: --ink-muted`, transparent.

#### Master / Player mode toggle
Segmented pill, 2 buttons, `aria-pressed`. Active state: `background: --accent`, `color: --accent-fg`, accent glow. Default: surface-1.

#### Sidebar drawer (mobile, opens from left)
- 86% width, max 21 rem. `background: --bg-elev`. Right border + shadow-3.
- Header: drawer heading (display 20 px) + close icon button.
- Body: scrollable stack of `<MenuCard>` collapsibles (the existing sidebar building blocks, restyled).
- Scrim: `oklch(0 0 0 / 0.55)` over the rest of the viewport. Tap to dismiss.

#### Persistent sidebar (desktop)
- 18 rem wide on `min-width: 1024px`. `background: --bg-elev`, right border `--border-soft`, internal padding 1 rem.
- Same `<MenuCard>` content as the drawer — just inline rather than overlay.

#### Bottom sheet (mobile)
- Anchored to bottom. Border-radius `--radius-xl --radius-xl 0 0`. Drag handle bar at top (2.5 rem × 4 px, `--border-strong`).
- Used for the **accent picker** and any contextual picker on mobile (replaces some modals).

#### Modal / popover
- Centered, max 22 rem width, shadow-3. Three regions: head (display 20 px), body (form/content), foot (button row, right-aligned, `--surface-1` strip).
- Used for **Feat choice** (see screen 5.10), confirmations.

#### Empty state
- Centered, 2 rem icon (`--ink-faint`), display 20 px title, mono 11 px hint, optional primary button. See `app.css` `.sh-empty`.

#### Loading state
- Skeleton bars: `.sh-skeleton` — 200% wide gradient, 1.6 s linear shimmer. Use 14 px / 10 px / 32 px heights to match heading / meta / row patterns.

---

### 5.2 Tab 0 — **Home**

Mobile (390 × 844):
1. Top bar with master/player toggle in the trailing slot (overrides default trailing).
2. Hero block:
   - Filigree eyebrow: "Welcome back, dungeon master"
   - Display 30 px title with `<span class="sh-accent-text">` highlight on the campaign name.
   - Muted 13 px subtitle: active character summary (`name · level · HP · XP`).
3. **2-column tile grid** of tools. Each tile (`.sh-tile`):
   - 7.5 rem min height, `--surface-1`, soft border, `--radius-lg`.
   - Top: 1.75 rem icon in `--accent` color.
   - Display 20 px name.
   - 12 px muted description (one line of useful state, not filler — e.g. "3 books · 47 prepared").
   - Radial accent-soft gradient bottom-right corner.
   - "Player Sheet" tile gets `.sh-tile--master` (slight accent gradient).
   - Master-only tiles (Shop, Loot) hidden in player mode and tagged with a "Master" accent pill.
4. **Quick resume card** (`.sh-card`) — last 2 events with mono timestamps.

Desktop:
- 2-column grid: left = hero + 3×2 tile grid; right = active-character card + session log card.
- Hero gets the 52 px display headline. Primary "Open player sheet" action prominent.

---

### 5.3 Tab 1 — **Shop** (master only)

Mobile:
1. Sidebar drawer (closed by default; tap menu to open) contains:
   - "Settle & merchant" menu card: world select / city select / merchant name input
   - "Shop type" menu card: chip group (General / Weapons / Armor / Magic / Potions) + wealth tier select + item-count stepper
   - "Rarity bias" menu card (collapsed by default)
   - Primary "Generate inventory" + ghost "Share shop" buttons at the bottom
2. Main content:
   - Filigree: "{city} · {merchant}"
   - Display 24 px shop type name
   - Pill row: wealth / rarity / item count
   - Search input
   - `<Card padding={false}>` containing `.sh-shop-row`s. Row layout: name+rarity-dot + meta on left; price + qty on right. Rarity dot color from `.rarity-*` class.
   - Bottom: ghost "Re-roll inventory" block button.

Desktop:
- Sidebar inline on the left. Main content centered, max 980 px. Action bar on top right of header with search + re-roll + share buttons. Table-style header (`.sh-row-head`).

---

### 5.4 Tab 2 — **Spellbook**

Mobile:
1. Filigree: character / class summary
2. Display 24 px title + ghost "Rest" button
3. Pill row: total spells / prepared / school
4. Search + filter icon button
5. Card with **level-grouped** rows:
   - `.sh-level-header`: big display level number + "{lvl} level" / used-vs-slots count + diamond slot indicator (`<Slots total used>`).
   - When the level is over-prepared, header gets `data-warn="true"` → amber bg + warn icon line.
   - Below header: `.sh-spell-row`s. Layout: school glyph square + name/meta + tickbox.
   - Prepared row: school square goes accent (background `--accent-soft`, color `--accent`).

---

### 5.5 Tab 3 — **Loot** (master only)

Mobile:
1. Filigree: "Encounter · CR X · {table}"
2. Display 24 px hoard title
3. Pills: seed / total value / item count
4. Three section cards: **Coin / Gems & art / Magic items**
   - Each contains `.sh-shop-row`s with the item icon, optional rarity dot, and a value pill on the right.
5. Footer: ghost "Re-roll" + primary "Save hoard"

---

### 5.6 Tab 4 — **Search**

Mobile:
1. Search input with placeholder "spells · items · feats · skills"
2. Filter chip row (horizontal scroll, hidden scrollbar): All / Spells / Items / Feats / Skills with counts
3. Active filter pill row below
4. Result list (`.sh-result-row`):
   - 2 rem icon square (`.kind`) — item kind icon
   - Name (sm, 600) + meta (xs, muted)
   - Tail: mono 12 px secondary info

Desktop:
- 2-column layout: result list (left) + detail pane (right, 22 rem). Detail pane shows: title + tag pills + description + actions ("Add to spellbook", "Bookmark").

---

### 5.7 Tab 5 — **Player Sheet** (parent)

Player Sheet is its own micro-app inside the SPA. On mobile it has a **bottom nav with 7 items**. On desktop the 7 items become a horizontal sub-tab bar under the main top bar.

#### Bottom nav (mobile)
- Height 4.25 rem (+ safe-area-inset-bottom). `background: --bg-elev`. Top border `--border-soft`.
- 7 equal-flex items. Each: icon (1.5 rem) + uppercase 10 px label below.
- Active item: `color: --accent`. Active indicator: 2 px top bar spanning 56% width, centered, with accent glow.
- Icons used: `swords · backpack · person_play · auto_awesome · extension · wand_stars · edit_note`.

#### Sub-tabs (desktop)
- 10 × 24 px padding row, `--bg-elev` background, border-bottom `--border-soft`. Each tab is a `.sh-tab` styled identically to top-bar tabs.

---

### 5.8 Player Sheet — **Combat**

Mobile:
1. **Header card**: portrait slot (4.5 rem square, striped placeholder until user supplies image) + filigree + display 24 px name + pill row (class+level / XP).
2. **HP card**:
   - 30 px display "47 / 52" left, three icon buttons (−, +, heal) right.
   - HP bar (`.sh-bar--hp`) below.
   - Footer row: mono "temp 0 · non-lethal 0" / "HD 7d6".
3. **AC / Init / Speed** — 3-column `<StatPill>` grid. AC has `accent` variant.
4. **Saves** — 3-column `<StatPill>` grid (Fort / Ref / Will). Will is accent for this wizard.
5. **Attacks card**: title shows BAB. Rows: weapon name + meta + attack pill + damage pill.
6. **AC breakdown card**: mono key/value list, divider, accent total.

Desktop:
- 2-column grid below a full-width header strip. Left: HP + attacks. Right: saves + AC breakdown + resists/conditions.

Tablet:
- Single column stack of the same cards, just wider.

---

### 5.9 Player Sheet — **Inventory**

Mobile:
1. Header row: filigree / display 24 px title / primary "Add" button.
2. **Encumbrance card** — `--surface-1`. "Carry weight · light load" label + mono "17.5 / 38 lb" + bar. Pills below for load thresholds + total gp.
3. Filter chip row (horizontal scroll).
4. Table card (`.sh-card` flush):
   - Header row (`.sh-row-head`) with column labels.
   - Rows: equipped tickbox + name/meta + qty (mono) + weight (mono faint) + value (mono).

Desktop:
- Right column shows encumbrance card + coin pouch card. Main inventory table takes left column with a rarity column added.

---

### 5.10 Player Sheet — **Skills**

Mobile:
1. Header: filigree + display 24 px + ranks-used pill ("63 / 70 ranks").
2. **Soft-warning strip** when any skill exceeds its cap. Amber `.sh-warn-strip`. Never blocks.
3. Search + filter chips.
4. Skill rows:
   - 8 px dot (filled accent for class skills, transparent with border for cross-class).
   - Name + optional pills (synergy / over-cap) + ability/abbreviation+cross-class meta.
   - Ranks stepper (the existing `<Stepper>` component).
   - Mod (mono).
   - Total (mono, bold; in `--warn` when over-cap).
5. Over-limit row gets `.is-overlimit` class — 3 px amber left rail + slight bg fade.

---

### 5.11 Player Sheet — **Feats**

Mobile:
1. Header: filigree "X of Y selected" + display + primary "Choose feat" button.
2. Stack of feat cards (`.sh-card`):
   - Header line: accent star icon + display 17 px name + optional "class bonus" pill.
   - Faint 12 px meta description.
   - Right side: info icon button (long-press / tap to expand details).

**Feat picker modal** (5.13 below): triggered by "Choose feat".

---

### 5.12 Player Sheet — **Features**

Mobile:
1. Filigree "Class & race features"
2. **Class card** (e.g. "Wizard 7 · Evocation"):
   - Rows: extension icon (accent for granted, faint for locked) + feature name + meta + optional "locked" pill at the level it unlocks.
3. **Race card** (e.g. "Elf"):
   - Same row pattern, with `auto_fix_high` icon.

---

### 5.13 Player Sheet — **Spells**

Mobile:
1. Header: filigree + display + ghost "Long rest" button.
2. **Slot summary strip** — small card containing one column per level, each with eyebrow level label + diamond `<Slots>` indicator.
3. Card with `.sh-level-header` per level + `.sh-spell-row`s. Same component vocabulary as Spellbook tab but scoped to one character.

---

### 5.14 Player Sheet — **Notes**

Mobile:
1. Header: filigree / display 24 px / "Local only" pill / trailing add icon button.
2. Filter chip row (Recent / Quest / Lore / NPC).
3. Note cards (`.sh-card`):
   - Card head: eyebrow + title + more-actions icon button.
   - Textarea inside body, min-height 11 rem.
   - Footer row: edited timestamp + format buttons (Bold, List) + primary "Save".

Use `.sh-textarea` styles. On blur or 2 s idle, dispatch the existing save action (current Redux/thunks behavior is unchanged).

---

### 5.15 Modals & sheets

#### Accent picker sheet
- Triggered by the accent dot button in the top bar.
- 12-swatch grid (4 columns on mobile, 6 on desktop). Each swatch: aspect-ratio 1, 2 px border `--border`, inner circle (4 px inset) filled with the hue. Active swatch border becomes `--ink` plus an outer ring of `--accent`.
- Below: theme toggle (Dark / Parchment).
- On change: update `state.app.mainColor` in Redux (existing slice) AND toggle the `theme-*` + `accent-*` body classes immediately. The Redux save middleware will persist.

#### Feat-choice modal
- Centered modal, max 20 rem.
- Head: filigree "level X · choose 1" + display title.
- Body: search input + stack of feat option cards. Selected card has `--accent-soft` bg, `--accent-muted` border, tickbox checked. Cards with unmet prerequisites show a `.sh-warn-strip` inside.
- Foot: ghost Cancel + primary Confirm.

---

## 6. Theming behavior (hard requirement)

The accent color is **a single live knob**. Implementation:

```jsx
// Root component
<div
  className={`sh-root theme-${theme} accent-${accent}`}
  // e.g. theme-dark accent-emerald
>
  ...
</div>
```

Or apply the classes to `<body>`. Tokens cascade through `:root` + `.theme-*` + `.accent-*`. Every UI element references tokens — never raw colors. Verify by inspecting any component: there should be no hex/oklch literals outside `tokens.css`.

**Rule of thumb**: if you find yourself writing a color literal in a JSX style or a component CSS file, you've broken the system. Reach for a token.

### Soft-warning state (rules over-limit)
When a computed value violates a D&D 3.5 rule (over-ranked skill, too many prepared spells, encumbrance over capacity, etc.):
- **Never block input.** The user can keep typing.
- Show a `<Pill tone="warn" icon="warning">` next to the violating field.
- Apply `.is-overlimit` to the row (3 px amber left rail + faint amber bg-gradient).
- The summary above the table may include a `.sh-warn-strip` describing what's wrong.
- The value displayed (total, modifier) tints `--warn` so the eye catches it.
- Amber, not red. Red is reserved for HP/damage destructive actions.

---

## 7. Responsive breakpoints

The current codebase uses `isMobile()` at `≤ 768px`. Keep that. Add a desktop breakpoint at `≥ 1024px` for the persistent sidebar layout. Three tiers:

| Tier | Width | Layout |
|---|---|---|
| Mobile | ≤ 768 px | Drawer sidebar, hamburger top bar, bottom nav for Player Sheet |
| Tablet | 769 – 1023 px | Drawer sidebar, condensed top tab bar (icons only), bottom nav |
| Desktop | ≥ 1024 px | Persistent sidebar, full top tab bar with labels, Player Sheet sub-tabs as a row under the top bar |

Each Player Sheet sub-page lays out as a single-column stack on mobile and a 2-column grid (header strip full-width, content split below) on desktop. See `screens-responsive.jsx` for layout specifics.

---

## 8. Interactions

- **Drawer**: slide-in from left, 320 ms ease. Tap scrim to dismiss.
- **Bottom sheet**: slide up from bottom. Drag handle gives the user a clear pull-down target.
- **Card collapse** (menu cards in sidebars): rotate the chevron −90° when closed; hide body via `display: none` keyed off `data-open="false"`.
- **Long-press on bottom-nav Spells**: shows the popout (existing pattern, see `PlayerSheetBottomNav.jsx`) — preserve. Add the same long-press treatment to Skills (Skills/Feats/Features sub-menu).
- **Accent change**: instant. No transition on the color itself, but buttons/borders/cards can have a 200 ms color transition to soften the swap.
- **Theme change**: 200 ms cross-fade is acceptable. Don't animate every color individually.
- **HP +/-**: tap to adjust ±1. Long-press to repeat. Existing thunks handle the math.
- **Tickbox / switch**: 200 ms ease state transition, accent fade in.
- **Search**: debounce input ~120 ms before re-rendering result rows. Existing search slices handle filtering.

All durations and easings in `tokens.css`:
```
--t-fast: 120ms   --t-base: 200ms   --t-slow: 320ms
--ease: cubic-bezier(.4, 0, .2, 1)
```

---

## 9. State management

**Do not change Redux structure.** The redesign is purely presentational on top of the existing slices and thunks:

- `state.app.currentTab` — same 0–5 tab IDs.
- `state.app.isMasterMode` — same; hides Shop & Loot in player mode.
- `state.app.mainColor` — extend to also store theme (`dark | light`) and accent name (`crimson`, etc.) if those aren't already in there. Add two action creators if needed: `setTheme(name)` and `setAccent(name)`. Persist through the existing `persistSyncMiddleware`.
- `state.playerSheet.mainView` — same 7 sub-page IDs (`combat`, `inventory`, `skills`, `feats`, `features`, `playerSpells`, `notes`).
- `state.persist` — same compressed-tuple shape. No migration needed; just bump `CURRENT_VERSION` in `appState.js` if you change anything user-visible there (the design doesn't require it).

The Player model (`src/lib/player/player.js`) still owns all D&D math. UI calls `player.getAC()`, `player.getMod('STR')`, `player.getSavingThrow('will')`, etc. **Never compute game logic in the new components.**

---

## 10. Iconography

Material Symbols Outlined. Variable font (`@FILL,GRAD,opsz,wght`). Already in use in the codebase via `<span class="material-symbols-outlined">name</span>` — keep the existing convention.

Key icon names used in this design:

```
brand:        S (display-font glyph, not Material)
home:         home
shop:         shopping_cart
spellbook:    menu_book / auto_stories
loot:         money_bag
search:       search
sheet:        badge
combat:       swords
inventory:    backpack
skills:       person_play
feats:        auto_awesome
features:     extension
spells:       wand_stars
notes:        edit_note

hp / heal:    favorite / healing
attack:       my_location
damage:       bolt
crit:         casino
rest:         bedtime
warn:         warning
rarity:       diamond
share:        qr_code_2 / qr_code_scanner
settings:     settings
palette:      palette
menu:         menu
close:        close
add/remove:   add / remove / check
```

---

## 11. Self-hostable assets

- **Fonts**: bundle Cormorant Garamond, Manrope, JetBrains Mono as woff2 in `public/fonts/` and define `@font-face` rules. Drop the `@import url('https://fonts.googleapis.com…')` in `tokens.css` for production — replace with local references so the app remains fully offline.
- **Material Symbols**: bundle the variable font woff2 in `public/fonts/` too. Override `.material-symbols-outlined` to use the local family.
- **Icons fallback**: if you'd rather not ship Material Symbols, switch to Lucide (already commonly used with Linear-style UIs) — the symbol names listed above map cleanly.

---

## 12. QA checklist

Before merging, verify in both modes (Dark + Light), at all three breakpoints (390, 768, 1280), with at least 3 accent hues (Crimson, Emerald, Royal):

- [ ] Every interactive element is ≥ 44 × 44 px on mobile.
- [ ] No raw color literals outside `tokens.css`.
- [ ] No `px` for spacing/sizing — only `rem`.
- [ ] Text contrast passes WCAG AA against its surface. (The dark `--ink` on `--bg` is 14:1; verify any accent-on-surface combinations.)
- [ ] Soft-warning state appears on a manually-broken skill row (set ranks past cap) without blocking the stepper.
- [ ] Accent change updates buttons, borders, focus rings, slot indicators, selected rows, and tab indicators — all live, no reload.
- [ ] Theme change preserves accent.
- [ ] Bottom nav stays sticky during inventory scrolling on mobile.
- [ ] Drawer scrim dismisses on tap.
- [ ] Long-press on Spells / Skills bottom-nav still works (existing pattern preserved).
- [ ] Empty states show on a brand-new character with no inventory / no spells / no notes.
- [ ] Keyboard focus is visible (2 px accent outline) on all controls.
- [ ] No layout shift when the right-side desktop sidebar opens/closes (matches the current behavior described in `player_sheet.css`).

---

## 13. Out of scope

- No backend / sync changes.
- No new entity IDs — array indices remain the identity. (See `CLAUDE.md` in the repo: "Identity is array index, not an ID field — never add entity IDs.")
- No new features. Don't invent character-creation wizards, encounter trackers, dice trays, etc. If something isn't in the existing codebase, it's not part of this redesign.
- No marketing pages, no onboarding flow.

---

## 14. Implementation order (recommended)

1. **Tokens first.** Drop in `tokens.css`. Replace `--main` with `var(--accent)` alias for now. Reload — the existing UI will look weird but functional.
2. **Common atoms.** Build `<Button>`, `<Pill>`, `<Card>`, `<MenuCard>`, `<Stat>`, `<StatPill>`, `<Bar>`, `<Slots>`, `<Stepper>`, `<Tickbox>`, `<Switch>` in `src/components/common/`. Snapshot test each variant.
3. **Top chrome.** Rewrite `top_menu.jsx` mobile + desktop variants. Wire the accent picker sheet to dispatch the new `setAccent` + body class.
4. **Player Sheet first** (the most complex). Combat → Inventory → Skills → Spells → Feats / Features / Notes. Use the new bottom nav.
5. **Spellbook & Search** — both share the row/level-header patterns. Do them together.
6. **Shop & Loot** — share the `.sh-shop-row`. Do them together.
7. **Home** last — it's mostly composition over the new tile/card primitives.
8. **Light mode** — add the toggle, test every screen.
9. **Responsive pass** — verify tablet and desktop layouts on each screen.

Estimated effort: ~2–3 weeks for a single developer, given the existing Redux wiring stays intact and the data layer is untouched.

---

## 15. Open questions for the team

- **Theme persistence**: should theme + accent persist per-character or per-device? Recommend: per-device (single global preference), since accent is "my UI preference," not "this character's color."
- **Light-mode default**: ship dark mode default (matches today) or follow `prefers-color-scheme`? Recommend: respect `prefers-color-scheme` on first load, then save the user's explicit choice.
- **Portraits**: the design includes a 4.5 rem portrait slot on the Combat header. The current schema doesn't store portraits. Either (a) add a `pic` field on the player tuple (base64 dataURL) or (b) leave the striped placeholder and the user's initials. Recommend (b) for the first ship — adding image upload is out of scope.

---

## 16. Screenshots

The `screenshots/` folder has a pre-rendered preview of every screen, numbered for easy reference. They're scaled-down PNGs captured from the live HTML — the canvas itself is the source of truth for pixel-level questions.

| # | File | Shows |
|---|---|---|
| 01–02 | `home-master.png`, `home-player.png` | Tab 0 · Home in both modes |
| 03 | `shop.png` | Tab 1 · Shop (master-only) |
| 04 | `spellbook.png` | Tab 2 · Spellbook |
| 05 | `loot.png` | Tab 3 · Loot (master-only) |
| 06 | `search.png` | Tab 4 · Search |
| 07–13 | `player-sheet-*.png` | Tab 5 · Player Sheet — all seven sub-pages (Combat, Inventory, Skills, Feats, Features, Spells, Notes) |
| 14 | `sidebar-drawer.png` | Mobile sidebar drawer state |
| 15 | `accent-picker-sheet.png` | Bottom sheet for accent color + theme |
| 16 | `feat-choice-modal.png` | Feat-choice modal (used at level-up) |
| 17–21 | `desktop-*.png` | Desktop layouts at 1280 — Home, Combat, Inventory, Search, Shop |
| 22 | `tablet-combat.png` | Tablet layout at 768 |
| 23–27 | `variant-combat-*.png` | Same Combat screen rendered with 5 different `--accent` hues — proof that the theming system holds |
| 28–29 | `mode-dark.png`, `mode-light.png` | Same Combat screen in both themes |

**Note on rendering:** these are scaled-down preview screenshots; some icons appear as their Material Symbols ligature names (`search`, `badge`, `menu_book`, …) rather than the rendered glyph. This is a screenshot-tool quirk — when you load the live HTML in a real browser the icons render correctly. The text labels in the screenshots happen to be useful documentation: they tell you exactly which Material Symbols token sits at each spot, which is what you need to look up while building.

---

If anything in this README is ambiguous, open the HTML canvas and read the screen — every variation shown there is intentional.
