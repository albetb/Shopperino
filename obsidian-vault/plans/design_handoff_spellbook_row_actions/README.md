# Handoff: Spellbook Row-Action Controls

## Overview
Three small controls that live in the **leftmost action cell** of a spell row in the D&D 3.5 spellbook table. The cell is ~3rem wide; the control shown changes with the page the user is on:

- **Learn** (page 0) — **Sliding Tab**: a one-shot toggle to learn/unlearn a spell.
- **Prepare** (page 1) — **Fused Stepper**: increment/decrement how many copies of a spell are prepared for the day.
- **Cast** (page 2) — **Star Orbit**: spend one prepared slot per tap; shows remaining count.

The intent: a player flipping between pages should recognize which page they're on from the **shape of the control alone**, before reading anything.

## About the Design Files
The files in this bundle are **design references created in HTML/React** — prototypes that show the intended look and behavior. They are **not** drop-in production code. The task is to **recreate these controls inside the Shopperino codebase** (Create React App, plain function components, Redux Toolkit, CSS files under `src/style/` keyed off CSS custom-property tokens) using its existing patterns.

The components here are dependency-free React function components and the CSS is plain CSS keyed to the app's existing tokens, so they should port almost verbatim — but wire them to the real Redux thunks and selectors rather than local `useState`.

## Fidelity
**High-fidelity.** Colors, typography, spacing, motion, and all states are final. Recreate pixel-for-pixel using the app's existing tokens. The only thing the prototype fakes is data/state (local `useState` instead of Redux).

---

## Where these go in the codebase

These replace the current controls rendered in **`src/components/spellbook/spell_level.jsx`** inside `<table className="spellbook-table">`, in the leftmost `<td>` of each spell row:

| Page | Current markup (to replace) | New control |
|---|---|---|
| `page === 0` | `<button className="flat-button smaller">` with `bookmark_add` / `bookmark_remove` Material icon | `LearnTab` |
| `page === 1` | `<div className="spell-slot-div">` with `−` / `level-text` / `+` `flat-button`s | `FusedStepper` |
| `page === 2` | `<div className="spell-slot-div2">` with `wand_stars` icon + `level-text` | `StarOrbitCast` |

The domain-spell prepare block (also in `spell_level.jsx`, `showDomainPrepare`) uses the same `spell-slot-div` stepper and should adopt `FusedStepper` too.

Existing thunks already provide the behavior — keep using them:
- Learn: `onLearnUnlearnSpell(link)` (in `store/thunks/spellbookThunks` / `playerSheetThunks`)
- Prepare: `onPrepareSpell(link)` / `onUnprepareSpell(link)`
- Cast: `onUseSpell(link)`; remaining count from `getRemaining(link)` (already computed in `spell_level.jsx`)

The leftmost cell currently has classes `col-btn-sm` / `col-btn-sm-max`. **Add `overflow: visible`** to the action cell so the Learn tab's tip can poke out (see Learn notes below).

---

## Component 1 — Learn: Sliding Tab

### Purpose
Toggle a spell as learned / not learned. One-shot per spell.

### Visual metaphor
A bookmark **rooted in the row**: its flat base is attached to the right side of the cell (toward the spell name) and its pointed tip faces **left**, toward the row's outer edge.
- **Not learned (default):** the tab is tucked flush inside the cell.
- **Learned:** the tab slides **out to the left**, its pointed tip emerging past the row's left edge, filled with `--accent`, with a small dog-eared corner. Click again and it retracts.

The horizontal travel **is** the affordance — it reads as placing/removing a real bookmark, not just recoloring.

### Anatomy
- `width 30px × height 34px` button; the whole element `translateX`es to slide.
- `.tab-shape` — the bookmark body: `clip-path: polygon(8px 0, 100% 0, 100% 100%, 8px 100%, 0 50%)` makes the left edge a point; `border-right: 0` (rooted into the row); `box-shadow: -2px 0 5px -2px oklch(0 0 0 / 0.45)` lifts the emerging tip.
- `.tab-glyph` — `+` when not learned, `✓` when learned, right-aligned in the rectangular base, `--font-display` 14px.
- `.dog-ear` — 9×9 SVG fold, top-right, `opacity 0 → 1` only when learned.

### States
| State | Behavior |
|---|---|
| Default (not learned) | `translateX(9px)` — tucked in; `--surface-2` fill, `--border`, glyph `+` in `--ink-muted` |
| Hover (not learned) | `translateX(0)` — tip peeks out; fill `--surface-3`, border `--border-strong`, glyph → `--accent` |
| Pressed | `translateX(-6px)` — caught mid-slide; transition shortened to `--t-fast` |
| Learned | `translateX(-15px)` — tip protrudes; fill `--accent`, border `--accent-strong`, glyph `✓` in `--accent-fg`, dog-ear visible |
| Disabled | tucked at `9px`, `--surface-1` fill, `opacity 0.6`, no pointer events |

### Motion
- Slide: `transition: transform var(--t-base) cubic-bezier(.34, 1.3, .5, 1)` (200ms, slight overshoot — the "snap" of a bookmark seating).
- Pressed uses `--t-fast` (120ms).

### CRITICAL host requirement
The tab's tip extends **outside** its own box. Its parent cell **must not clip it**:
```css
.action-cell { overflow: visible; }
```
The current `.spellbook-table` cells / `shop_inventory.css` may set `overflow: hidden` on the row or table wrapper — verify the tab isn't clipped after integration. (In the prototype the row container is `overflow: visible` and the cell's outer-left corners are rounded to match the frame.)

### Accent fallback
Only the **learned** state uses `--accent`. The resting/hover states are neutral ink/surface, so swapping accent hue never breaks the default appearance.

---

## Component 2 — Prepare: Fused Stepper

### Purpose
Increment / decrement how many copies of a spell are prepared for the day (e.g. 0, 1, 2 …).

### Feature change vs. earlier drafts
**Maximum is now 9** (`max = 9`). The `+` button is disabled at 9; `−` is disabled at 0. (Earlier explorations capped lower / used a pip-drum; this fused-stepper version with max 9 is the one to build.)

### Visual
`−  N  +` fused into **one pill** (`--radius-pill`) with hairline-divided segments — not three free-floating buttons. Grid columns `22px 28px 22px`, height `28px`.
- `−` and `+`: transparent, `--ink-muted`, 14px; hover → `--accent` on `--surface-3`.
- Center `.num`: `--font-mono`, `tabular-nums`, `--font-size-sm`, `--ink`, on `--bg`, bordered left/right with `--border-soft`.
- Each button has a `::before { inset: -8px -2px }` that **expands the tap target** vertically into the row whitespace, hitting ~44px diagonal on mobile while the visible pill stays compact.

### States
| State | Behavior |
|---|---|
| Default | pill on `--surface-1`, `--border-soft` |
| `−` at min (0) | `−` `:disabled` → `--ink-disabled`, not-allowed |
| `+` at max (9) | `+` `:disabled` → `--ink-disabled`, not-allowed |
| Hover a button | button text `--accent`, bg `--surface-3` |
| Disabled (whole control) | `opacity 0.55`, no pointer events |

### Props
`value:number, min=0, max=9, disabled:bool, onChange(next:number)`. Wire `onChange` to `onPrepareSpell` (increment) / `onUnprepareSpell` (decrement) thunks.

---

## Component 3 — Cast: Star Orbit (experimental)

### Purpose
Spend one prepared slot per tap; display the remaining count. Disabled when remaining is 0.

### Visual metaphor
The remaining **count sits in the center** with Material **star** icons arranged in a **ring** around it — **one star per remaining use**. Casting spends a slot: a star is removed and the ring **turns briefly by one step**.

### Behavior change vs. earlier drafts (important)
1. **The ring does NOT spin continuously and does NOT speed up on hover.** It is **still at rest** by default.
2. On each cast, the component adds a `.casting` class for ~340ms which plays a **single brief step-rotation** (one `360° / starCount` step), then removes it. So the only motion is a small turn right after a star is spent.
3. **Maximum stars is 9** (was 8). `remaining` may exceed 9 in theory, but the rendered ring caps at 9 stars; the center number always shows the true `remaining`.

### Anatomy
- `49px` round button (`--size: 49px`, `--radius: 18px` ring radius). *Note: ~49px is taller than a standard 44px row — best suited to a hero / character-sheet context, or give the Cast-page rows a little more height.*
- `.orbit-num` — center count, `--font-display` 600, 21px, `--ink`.
- `.orbit-path` — faint dashed hairline circle (`--border-soft`, opacity 0.5) marking the orbit.
- `.ring` — holds the stars; `transform-origin: 50% 50%`.
- `.star` — positioned with `transform: rotate(var(--a)) translateY(calc(-1 * var(--radius)))`, where `--a = (360 / n) * i` per star.
- `.star .material-symbols-outlined` — the `star` glyph, 14px, `--accent`, `FILL 1`, soft `--accent-glow` drop-shadow.

### Motion
```css
.orbit-cast.casting .ring { animation: orbit-spin var(--t-slow) cubic-bezier(.34,1,.5,1); }
@keyframes orbit-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(calc(360deg / var(--star-count, 9))); }
}
```
The component sets `--star-count` to the current star count and toggles `.casting` for 340ms (must exceed `--t-slow` = 320ms) so the one-shot animation completes before the class is removed.

### States
| State | Behavior |
|---|---|
| Default (remaining > 0) | N stars ringed around the count, still |
| Hover | center number → `--accent` |
| Pressed | center number `scale(0.9)` |
| On cast | `.casting` plays one brief ring step; caller decrements `remaining` (a star disappears) |
| Empty (remaining = 0) | no stars; number → `--ink-faint`; orbit path dimmed; not-allowed, disabled |

### Props
`remaining:number, total:number (for a11y label), onClick()`. The component itself only fires `onClick` + plays the nudge; the **caller decrements** `remaining` (wire to `onUseSpell(link)` and re-read `getRemaining(link)`).

### Accent fallback
Stars and the hover number are `--accent`; the resting number is neutral `--ink`, so the control reads under any palette.

### Material Symbols dependency
This control renders `<span class="material-symbols-outlined">star</span>`. The app already uses Material Symbols Outlined elsewhere (e.g. `bookmark_add`, `wand_stars`, `expand_more`), so the font is available — confirm it's loaded on the spellbook view. If a star renders as a "tofu" box, the font isn't loaded.

---

## Design Tokens (all from the app's existing `src/style/tokens.css`)
The controls only use tokens already defined in the project — no new values introduced:

- **Color:** `--ink`, `--ink-muted`, `--ink-faint`, `--ink-disabled`, `--accent`, `--accent-fg`, `--accent-strong`, `--accent-glow`, `--surface-1/2/3`, `--bg`, `--bg-elev`, `--border`, `--border-soft`, `--border-strong`
- **Radius:** `--radius-sm`, `--radius-pill` (and `--radius-md` for the host row frame)
- **Type:** `--font-display` (Cormorant Garamond), `--font-ui` (Manrope), `--font-mono` (JetBrains Mono), `--font-size-sm`
- **Motion:** `--t-fast` 120ms, `--t-base` 200ms, `--t-slow` 320ms, `--ease`
- Accent is theme/`accent-*`-class driven; every control inherits it. Verified across crimson / brass / emerald / royal / plum / slate in the prototype.

Constraints honored: no glass/gloss/3D, no gradient heavier than a 2-stop subtle warm wash, no shadow beyond a faint 1–2px. 44px-equivalent tap targets on mobile via invisible `::before` hit-area expansion.

## Assets
- **Material Symbols Outlined** webfont (`star` glyph) — already used app-wide. No image assets.
- No other assets.

## Files in this bundle
- `components.jsx` — the three controls as clean, exportable React function components (`LearnTab`, `FusedStepper`, `StarOrbitCast`). **Start here.**
- `controls.css` — all styles for the three controls, keyed to the app's tokens. Token dependency list is in the file header.
- `tokens.css` — a copy of the app's design tokens (so the preview + CSS resolve standalone). Do **not** re-add this to the app; it already exists at `src/style/tokens.css`.
- `preview.html` — open in a browser to see all three controls live in mock spell rows, with working interactions and all states. Switch the `<body>` class (e.g. `theme-light accent-crimson`) to check palettes.

## Source of truth
These were extracted from the full exploration at the project root: **`Spellbook Row Actions.html`** + `controls.jsx` (the design-canvas mockup with every state, row context, mobile widths, accent fall-through, and rationale for all candidates). Reference it for additional context, the alternative directions (Quill Tick, Pip Drum, Spent Gutter, Wax Seal, Candle Row), and the mobile layouts.
