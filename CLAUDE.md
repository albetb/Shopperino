# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Dev server (proxies to https://localhost:5000/)
npm run build    # Production build
npm test         # Run tests (Jest / React Testing Library)
npm test -- --testPathPattern=MyComponent  # Run a single test file
```

## Project Context

This is a personal tool used by the developer and their friends. There is no backend — everything runs entirely on the frontend. No server, no accounts, no network requests for user data.

## What This Project Is

Shopperino is a D&D 3.5 toolset SPA (React 18 + Redux Toolkit). It has six tabs, selectable via `currentTab` in state:

| Tab | ID | Description |
|-----|----|-------------|
| Home | 0 | Landing/navigation page |
| Shop | 1 | Randomized shop generator (Master mode only) |
| Spellbook | 2 | Spell tracking per character |
| Loot | 3 | Randomized loot generator (Master mode only) |
| Search | 4 | Browse spells, items, feats, skills |
| Player Sheet | 5 | D&D 3.5 character sheet |

**Master/Player mode** (`isMasterMode`) hides the Shop and Loot tabs when in Player mode.

## Architecture

### Storage: Single localStorage key, compressed tuples

All state is stored under a single localStorage key `"app"`, compressed with `lz-string` (UTF16). To minimize size, domain objects are serialized as compact tuple arrays (plain arrays, not objects). The schema lives in [src/lib/appState.js](src/lib/appState.js).

- `app.w` — array of world tuples `[name, level, selectedCityIndex, cities[]]`
- `app.sb` — array of spellbook tuples
- `app.l` — array of loot tuples
- `app.psc` — array of player character plain objects
- `app.uiFlags` — integer bitmask for all boolean UI flags (see `UI_FLAG` enum)
- `app.stc` — integer bitmask for spell table level-collapse state
- Identity is array index, not an ID field — never add entity IDs.

**localStorage budget is ~5 MB.** Always optimize for compactness when storing data: use tuples over objects, bitmasks over boolean fields, omit default values (`compactApp` does this), and prefer short key names.

**No backwards compatibility required.** When the data schema changes in a breaking way, just bump `CURRENT_VERSION` in `appState.js`. The load function will detect the old version and reset to defaults — this is intentional and expected. Never write migration code or compatibility shims for old save formats.

The flow for loading: `loadApp()` → `expandApp()` (deserializes tuples, migrates legacy keys) → Redux dispatch. Saving goes through `saveApp()` → `compactApp()` (strips defaults) → compress → localStorage.

### Redux Store

Slices in [src/store/slices/](src/store/slices/):
- `app` — UI state (current tab, master mode, sidebar collapsed, theme color)
- `persist` — mirror of the raw app object currently in localStorage
- `world` / `city` / `shop` — shop tool state (hierarchy: World → City → Shop)
- `spellbook` — spellbook tool state
- `loot` — loot tool state
- `playerSheet` — character sheet state

`persistSyncMiddleware` ([src/store/persistSyncMiddleware.js](src/store/persistSyncMiddleware.js)) intercepts specific preference actions and immediately writes them to localStorage via `saveApp()`. Data mutations (creating/editing shops, spellbooks, etc.) are handled by thunks in [src/store/thunks/](src/store/thunks/).

### Domain Models

Classes in `src/lib/*/` (World, City, Shop, Spellbook, Loot, Player) each have `.load(data)` and `.serialize()` methods. The Player model ([src/lib/player/player.js](src/lib/player/player.js)) computes all derived D&D values (ability modifiers, BAB, saves, etc.) — the UI must not recalculate these.

**Do not compute game logic in UI components.** All calculations (damage, AC, skill totals, stat modifiers, etc.) belong in the domain models (`src/lib/player/player.js`, etc.). Components should only call model methods and display the results. This keeps logic centralized, testable, and prevents bugs from duplicate/inconsistent calculations.

`src/lib/storage.js` re-exports everything from `appState.js` plus higher-level accessors (`getPlayerByIndex`, `getWorldsList`, etc.). Always import storage utilities from `src/lib/storage.js`, not `appState.js` directly.

### Static Game Data

All D&D 3.5 reference data lives as static JSON in [src/data/](src/data/):
`items.json`, `scrolls.json`, `spells.json`, `feats.json`, `skills.json`, `races.json`, `classes.json`, `tables.json`.

Items and spells are accessed by a `link` string like `"items/Weapon/longsword"` or `"scrolls/Arcane/fireball"`. Use `getItemByRef(link)` from [src/lib/utils.js](src/lib/utils.js).

### D&D Rules: Automatic but Non-Enforcing

Components should compute and display values automatically following official D&D 3.5 rules (modifiers, BAB, saves, spell slots, skill points, etc.). However, limits are **never enforced** — a player can assign more spells, skill points, or anything else than the rules allow. When a value exceeds what the rules permit, it must be **visually indicated** (e.g. highlighted, colored differently) so the user is aware, but the input must still be accepted.

### Layout Pattern

Each tab renders as `<Sidebar /> + <main content />` inside `App.jsx`. Sidebars contain collapsible cards with controls; the main area shows the primary content (table, sheet, etc.). The sidebar for the active tab is always present except for the shared-shop view.

### CSS: Units and Styling

**Always use `rem` units instead of `px`** for margin, padding, height, width, and other sizing properties. This ensures consistent scaling with the root font size and makes the UI more maintainable. Example: `margin-top: 0.25rem;` instead of `margin-top: 4px;`
