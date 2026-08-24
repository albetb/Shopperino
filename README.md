<p align="center">
  <img src="src/data/logo-shopperino.png" alt="Shopperino" width="160">
</p>

<h1 align="center">Shopperino</h1>

<p align="center">A collection of tools for D&amp;D 3.5 — shops, loot, spellbooks, a searchable rules reference and a character sheet, all in the browser.</p>

<p align="center">
  <img alt="React 18" src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white">
  <img alt="Redux Toolkit" src="https://img.shields.io/badge/Redux%20Toolkit-2.x-764abc?logo=redux&logoColor=white">
  <img alt="No backend" src="https://img.shields.io/badge/backend-none-2fa6a1">
</p>

---

## What it is

Shopperino is a single-page app for running and playing D&amp;D 3.5 games. It is entirely
frontend: there is no server, no account, no sign-up, and no network request carrying your
data anywhere. Everything you create lives in your browser's `localStorage`.

The app runs in two modes, toggled on the home page:

- **Master** — everything, including the shop and loot generators.
- **Player** — the generators are hidden; you get the reference and character tools.

## Features

| Tool | For | What it does |
|---|---|---|
| **Shop generator** | Master | Builds a randomized shop inventory scaled to the party level, with per-city and per-world organization (World → City → Shop). Shops are seeded, so the same shop always regenerates identically — and can be shared with players as a **QR code**. |
| **Loot generator** | Master | Randomized treasure by level: coins, gems, art objects, mundane gear and magic items. |
| **Spellbook** | Everyone | Per-character spell tracking: prepared/known spells, slots by level, domains, wizard schools, spontaneous casting and rest handling. |
| **Search** | Everyone | Browse and cross-link spells, items, feats and skills. Descriptions are hyperlinked, so a spell reference in a feat takes you straight to it. |
| **Player sheet** *(beta)* | Everyone | A mostly automatic D&amp;D 3.5 character sheet: abilities, BAB, saves, skills, feats, inventory and carrying capacity, class features (rage, bardic music, turn undead, wild shape, favored enemies, monk and paladin abilities…), animal companions and familiars, conditions, and a portrait editor. |
| **Dice roller** | Everyone | Reachable from every tab: d2–d100, stacking count buttons, and the last roll is remembered. |

Two design rules run through the whole app:

- **Automatic, but never enforcing.** Values are computed for you from the official rules, but
  nothing is blocked. If you assign more skill points or spells than the rules allow, the input is
  accepted — it is just highlighted so you know.
- **The rules live in the models, not the UI.** All game math is centralized in the domain
  classes under `src/lib/`, which keeps it testable and consistent.

## Getting started

```bash
git clone https://github.com/albetb/Shopperino.git
cd Shopperino
npm install
npm start        # dev server on http://localhost:3000
```

Other commands:

```bash
npm run build    # production build into build/
npm test         # Jest / React Testing Library
npm test -- --testPathPattern=playerWildShape   # a single test file
```

Requires Node.js 18 or newer.

## How data is stored

All state sits under a single `localStorage` key, `"app"`, compressed with
[`lz-string`](https://github.com/pieroxy/lz-string). Because the budget is roughly 5 MB, domain
objects are serialized as compact tuple arrays instead of objects, booleans are packed into integer
bitmasks, and default values are stripped before saving.

Two consequences worth knowing:

- **Your data never leaves your machine.** Clearing site data clears your characters and worlds.
- **There is no save-format migration yet.** While the app is still in development, a breaking
  schema change bumps the version number and resets stored data to defaults — a deliberate
  shortcut that keeps iteration fast. Once the site reaches its final release this goes away, and
  storage updates will migrate existing user data instead of discarding it.

## Project structure

```
src/
├── App.jsx                 # tab router: Home, Shop, Spellbook, Loot, Search, Player sheet
├── components/             # UI, grouped per tool (+ common/ atoms and menus/ sidebars)
├── data/                   # static D&D 3.5 reference JSON (spells, items, feats, monsters, …)
├── lib/                    # domain models: world, city, shop, loot, spellbook, player, dice
│   ├── appState.js         # storage schema, compaction, load/save
│   └── storage.js          # higher-level accessors — import storage utilities from here
├── store/                  # Redux Toolkit slices, thunks and the persist middleware
└── style/                  # CSS (design tokens in tokens.css)

obsidian-vault/dnd-rules/   # condensed rule notes used as the reference while developing
```

Each tab renders as a sidebar plus a main content area. Domain classes each expose `.load(data)`
and `.serialize()`; `persistSyncMiddleware` writes preference changes straight to `localStorage`,
while data mutations go through thunks.

## Contributing

Found a bug, or a spell/item description that does not match the book?
[Open an issue.](https://github.com/albetb/Shopperino/issues)

## Disclaimer

This is a personal tool built for the author and their gaming group. Dungeons &amp; Dragons and all
related rules content are the property of Wizards of the Coast; Shopperino is an unofficial,
non-commercial fan project and is not affiliated with or endorsed by them.
