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

Shopperino is a D&D 3.5 toolset SPA (React 18 + Redux Toolkit). It has nine tabs, selectable via `currentTab` in state:

| Tab | ID | Description |
|-----|----|-------------|
| Home | 0 | Landing/navigation page |
| Shop | 1 | Randomized shop generator (Master mode only) |
| Spellbook | 2 | Spell tracking per character |
| Loot | 3 | Randomized loot generator (Master mode only) |
| Search | 4 | Browse spells, items, feats, skills |
| Player Sheet | 5 | D&D 3.5 character sheet |
| Monsters | 6 | Bestiary browser + one tracked monster sheet (Master mode only) |
| Traps | 7 | Trap generator and the book's catalogue (Master mode only) |
| Rules | 8 | The rule notes, searchable and readable in the app |

**Master/Player mode** (`isMasterMode`) hides the Shop, Loot, Monsters and Traps tabs when in Player mode.

Tabs are declared in two places that must stay in step: `tabPages` in [src/App.jsx](src/App.jsx) and the `TABS` list in [src/components/menus/top_menu.jsx](src/components/menus/top_menu.jsx). The Home page's own tile grid (`TILES` in [src/components/main_page/main_page.jsx](src/components/main_page/main_page.jsx)) is a third, separate list.

## Architecture

### Storage: Single localStorage key, compressed tuples

All state is stored under a single localStorage key `"app"`, compressed with `lz-string` (UTF16). To minimize size, domain objects are serialized as compact tuple arrays (plain arrays, not objects). The schema lives in [src/lib/appState.js](src/lib/appState.js).

- `app.w` — array of world tuples `[name, level, selectedCityIndex, cities[]]`
- `app.sb` — array of spellbook tuples
- `app.l` — array of loot tuples
- `app.psc` — array of player character plain objects
- `app.uiFlags` — integer bitmask for all boolean UI flags (see `UI_FLAG` enum)
- `app.stc` — integer bitmask for spell table level-collapse state
- `app.dcm` / `app.dlr` — dice roller: count-button bitmask, and the last roll as `[sides, ...rolls]`
- `app.mbf` / `app.mbs` — monster book: filter tuple, and the one tracked monster sheet
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
- `monsterBook` — bestiary filters and the tracked monster sheet

`persistSyncMiddleware` ([src/store/persistSyncMiddleware.js](src/store/persistSyncMiddleware.js)) intercepts specific preference actions and immediately writes them to localStorage via `saveApp()`. Data mutations (creating/editing shops, spellbooks, etc.) are handled by thunks in [src/store/thunks/](src/store/thunks/).

### Domain Models

Classes in `src/lib/*/` (World, City, Shop, Spellbook, Loot, Player, MonsterSheet) each have `.load(data)` and `.serialize()` methods. The Player model ([src/lib/player/player.js](src/lib/player/player.js)) computes all derived D&D values (ability modifiers, BAB, saves, etc.) — the UI must not recalculate these.

**Do not compute game logic in UI components.** All calculations (damage, AC, skill totals, stat modifiers, etc.) belong in the domain models (`src/lib/player/player.js`, etc.). Components should only call model methods and display the results. This keeps logic centralized, testable, and prevents bugs from duplicate/inconsistent calculations.

`src/lib/storage.js` re-exports everything from `appState.js` plus higher-level accessors (`getPlayerByIndex`, `getWorldsList`, etc.). Always import storage utilities from `src/lib/storage.js`, not `appState.js` directly.

### Static Game Data

All D&D 3.5 reference data lives as static JSON in [src/data/](src/data/):
`items.json`, `scrolls.json`, `spells.json`, `feats.json`, `skills.json`, `races.json`, `classes.json`, `tables.json`, `deities.json`, `startingEquipment.json`, `traps.json`, plus the three creature files and their ability lists (`monsters.json`, `animals.json`, `vermin.json`, `companionAbilities.json`, `familiarAbilities.json`).

Every file is reached through `loadFile(name)` in [src/lib/loadFile.js](src/lib/loadFile.js) — never imported directly by a component.

Items and spells are accessed by a `link` string like `"items/Weapon/longsword"` or `"scrolls/Arcane/fireball"`. Use `getItemByRef(link)` from [src/lib/utils.js](src/lib/utils.js).

**The three creature files are disjoint** — a creature lives in exactly one of them. `getCreatureByLink` / `getCreatureBaseByRef` in [src/lib/animal/animalsUtils.js](src/lib/animal/animalsUtils.js) resolve a ref across all three; never merge them.

### D&D Rules: Automatic but Non-Enforcing

Components should compute and display values automatically following official D&D 3.5 rules (modifiers, BAB, saves, spell slots, skill points, etc.). However, limits are **never enforced** — a player can assign more spells, skill points, or anything else than the rules allow. When a value exceeds what the rules permit, it must be **visually indicated** (e.g. highlighted, colored differently) so the user is aware, but the input must still be accepted.

### D&D knowledge sources

Rule mechanics live in [obsidian-vault/dnd-rules/](obsidian-vault/dnd-rules/) as condensed topic markdown files (e.g. `combat.md`, `magic.md`, `skills.md`). Enumerable data (spells, feats, items, classes, races, skills) lives in [src/data/](src/data/) as JSON.

Before writing or modifying code that touches a D&D rule, **read [obsidian-vault/dnd-rules/INDEX.md](obsidian-vault/dnd-rules/INDEX.md) first** to find the relevant topic file, then read that file. INDEX.md maps topics to files and to the related `src/data/*.json` sources. The rule notes carry the mechanics; the JSON carries the values — don't confuse the two and don't rederive a rule from memory if a topic file exists for it.

The notes are built by the `dnd-rules-extract` skill. Their auto-generated section in INDEX.md is refreshed by a PostToolUse hook on every write into the rules folder.

**The notes are also rendered in the app, on the Rules tab.**
[scripts/build-rules.mjs](scripts/build-rules.mjs) turns both note trees into [src/data/rules.json](src/data/rules.json) (English) and `src/data/it/rules.json` (the Italian pack, keyed by the same JSON paths), converting the markdown to HTML on the Node side so no markdown parser enters the bundle. The same PostToolUse hook runs it.

- **Never edit either file by hand.** They are the only generated files in `src/data/`, and the next write into the notes folder overwrites both. Fix the markdown in `obsidian-vault/dnd-rules/` — or, for the Italian, in `obsidian-vault/dnd-rules-it/` — and let the generator run.
- **The Italian is checked against the English it was written for.** Each section carries a hash of its English source; when the English moves, the generator refuses to emit and names the section. Re-translate it, then `npm run rules:accept`. It fails rather than falling back to English on purpose — a silent revert to English is invisible.
- `npm run rules` builds by hand; `npm run rules:accept` also records the English as the version the Italian now matches.

### Translation: every string a person reads is wrapped

The app is bilingual — English and Italian — and **English is the source**. A
translation is a *pack* beside it, keyed by the English text; nothing English is
ever overwritten, so a missing translation degrades to English rather than to a
blank.

**Any new string a user can read must be wrapped and translated in the same
change.** A bare literal is a bug, not a to-do: it renders English inside an
Italian app and no gate will ever mention it again.

| Kind of string | Stays where it is | Translation goes to |
|---|---|---|
| A literal in a component | `t('Collapse')` in the JSX | `src/data/it/ui.json` |
| A whole sentence with values in it | `tx('{0} of {1} used', a, b)` | `src/data/it/ui.json` |
| A name that is also a lookup key | `tName('conditions', c.name)` | `src/data/it/names.json` |
| Prose in `src/data` | English, untouched | `src/data/it/<file>.json` |

Three rules that are never bent:

- **Never edit English to fix a translation.** The English literal *is* the pack
  key, character for character, and it is what an English reader sees. If the
  Italian needs an article the English does not have, the article goes in the
  Italian.
- **Never write to `src/data/*.json`.** Those files carry every `Link`, slug and
  `Category` the rules are computed from. A translation lives in
  `src/data/it/` keyed by JSON path, which is what makes it unable to break a
  rule.
- **Don't import i18n into a pure model or math module.** Reading the current
  language there makes it depend on hidden global state — take the word as an
  argument and let the component pass `t('gp')`.
- **Never translate a name that is going to be stored.** An item's name is its
  identity — the row keeps it, `getItemByRef` looks it up by it, the share
  codec puts it on the wire — so it is stored exactly as `src/data` spells it
  and translated only on the way to the screen. `formatItemName` composes in
  English for the model; `displayItemName` composes the same name through the
  pack for a component. A character sheet written in one language therefore
  reads correctly in the other.

Use the **`translate-it` skill** ([.claude/skills/translate-it/SKILL.md](.claude/skills/translate-it/SKILL.md),
invoked as `/translate-it`) for anything beyond a string or two: it owns the
glossary, the verification that the rules survived, and the coverage report.
Before finishing a change that touched display strings:

```bash
python .claude/skills/translate-it/scripts/verify.py     # rules and glossary intact
python .claude/skills/translate-it/scripts/en_drift.py   # the English did not move
python .claude/skills/translate-it/scripts/progress.py   # what is still unwrapped
```

### Layout Pattern

Each tab renders as `<Sidebar /> + <main content />` inside `App.jsx`. Sidebars contain collapsible cards with controls; the main area shows the primary content (table, sheet, etc.). The sidebar for the active tab is always present except for the shared-shop view, the Search tab and the Monsters tab — the latter puts its filters in a card on the page instead.

### CSS: Units and Styling

**Always use `rem` units instead of `px`** for margin, padding, height, width, and other sizing properties. This ensures consistent scaling with the root font size and makes the UI more maintainable. Example: `margin-top: 0.25rem;` instead of `margin-top: 4px;`
