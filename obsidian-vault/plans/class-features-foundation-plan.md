---
type: plan
status: not-started
date: 2026-08-23
tags:
  - swarm/plan
---

# Class Features — Foundations & Correctness

> Build the shared primitives every class card depends on (progression data, use tracking, tracker component, card registry, rest action) and land the three small fixes that make existing characters' numbers correct.

## Context

Plan A of three. Implements the foundation and correctness tiers of [[docs/player_sheet_usability_checklist]] — checklist items 1, 2, 3, 5 and 6, plus the global rest action. Feature specs come from [[plans/per_class_customization_backlog]]; mechanics from [[dnd-rules/class-features]] and [[dnd-rules/classes]].

Checklist item 4, the specialist wizard bonus slot, is deliberately **not** in this plan: the extra school slot is already modelled in the UI at `src/components/spellbook/spell_level.jsx` as a separate per-level `1/1 <School>` indicator, following the same approach as domain slots. It is intentionally kept out of `getSpellsPerDay()`, and adding it there would double-count.

Settled decisions driving this plan: per-level progression data lives in `src/data/classes.json` (already declared as its home by `obsidian-vault/dnd-rules/INDEX.md` line 22); all trackers render on the Combat page; daily resets go through one global rest action; the Player model stays single-class, so helpers read `this.class` / `this.level` like `getBaseAttackBonus` and `getCasterLevel` already do.

Per CLAUDE.md: all derived values belong in `src/lib/player/player.js` and never in components; rules limits are displayed and visually flagged but never enforced; CSS uses `rem`, never `px`. Read the relevant `obsidian-vault/dnd-rules/` topic file before implementing any rule-touching step.

Plans B and C (`class-features-core-classes-plan.md`, `class-features-remaining-classes-plan.md`) both depend on steps 1–6 of this plan.

---

<step_1>
### Step 1. Add per-class progression data to classes.json

Add a `progression` object to each of the 11 classes carrying the per-level numbers the later class cards need. Read `obsidian-vault/dnd-rules/class-features.md` and `classes.md` first for the mechanics, and mine the existing `classFeatures` prose arrays (which already carry `[N]` level markers) for the per-level values. This is static reference data, not localStorage, so verbosity is fine.

**Files:**
- Modify: `src/data/classes.json` — add a `progression` object to each class

**Criteria:**
- Every one of the 11 classes in `src/data/classes.json` has a `progression` object
- Barbarian carries rage uses/day, rage tier levels and damage reduction by level; Rogue carries sneak attack dice; Monk carries stunning fist, ki tiers, flurry penalty and slow fall; Cleric and Paladin carry turn undead; Bard carries bardic music; Ranger carries favored enemy and combat style levels; Fighter carries bonus feat levels
- `node -e "require('./src/data/classes.json')"` parses without error
- `npm run build` completes without errors
</step_1>

---

<step_2>
### Step 2. Class progression accessor module

A small module that reads the new `progression` data and resolves level-keyed tables, so no component or model method parses raw JSON. Unit-scope tests (pure lookup logic, no I/O boundary).

**Files:**
- Create: `src/lib/player/classProgression.js`
- Create: `src/lib/player/classProgression.test.js`

**Criteria:**
- `classProgression.js` exports a `getClassProgression(className)` accessor plus a resolver that returns the value in effect at a given level
- Unknown class names and missing progression keys return a safe zero/empty result instead of throwing
- Tests assert concrete returned values (Barbarian rage uses 1 at L1, 2 at L4, 6 at L20; Rogue sneak dice 1 at L1, 10 at L19), not merely that no error is thrown
- `npm test -- --watchAll=false` passes
</step_2>

---

<step_3>
### Step 3. Class-feature use tracking on the Player model

Add the state shape every tracker writes to, following the existing `gnomeSpellUses` pattern in `player.js` (plain object, defensive copy on read, mirrored in `serialize()` and restored in `load()`). Uses-per-day are integers; pools store a spent amount. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add class-feature use state, accessors, serialize and load handling
- Create: `src/lib/player/playerClassFeatures.test.js`

**Criteria:**
- Player exposes `getClassFeatureUses`, `useClassFeature`, `setClassFeatureUses` and `resetClassFeatureUses`, with reads returning defensive copies
- `serialize()` includes the new state and `load()` restores it, verified by a round-trip test asserting the restored values
- `resetClassFeatureUses()` returns every counter to zero
- Values above a feature's maximum are stored rather than clamped, per the non-enforcing rule in CLAUDE.md
- `npm test -- --watchAll=false` passes
</step_3>

---

<step_4>
### Step 4. Global rest action

One action that refreshes everything daily. The plumbing already exists in `onPlayerRefreshSpell`, which resets gnome spell uses and spell slots — extend that path rather than duplicating it, and surface it as a Rest control on the combat page. Integration-scope behaviour (thunk plus Redux plus persistence).

**Files:**
- Modify: `src/store/thunks/playerSheetThunks.js` — add `onPlayerRest`
- Modify: `src/components/player_sheet/combat_page.jsx` — add the Rest control

**Criteria:**
- `onPlayerRest` resets class-feature uses, gnome spell uses and spell slots in a single dispatch, then persists through the existing `persistPlayer` helper
- A Rest control on the combat page dispatches `onPlayerRest`
- Resting a character with used class features leaves every counter at zero after a reload from persisted state
- `npm run build` completes without errors
</step_4>

---

<step_5>
### Step 5. Generic TrackerCard component

The reusable used/max primitive that every class tracker in Plans B and C consumes. Builds on the existing `src/components/common/Slots.jsx` pip row rather than reimplementing it, and follows the `restart_alt` reset-button pattern already used in `familiar_card.jsx`.

**Files:**
- Create: `src/components/player_sheet/tracker_card.jsx`
- Create: `src/style/tracker_card.css`

**Criteria:**
- `TrackerCard` accepts label, used, max, and use/reset handlers, and renders the used/max state through the existing `Slots` component
- A pool variant accepts a free-form spend amount rather than whole uses, for lay on hands and wholeness of body
- Values above max are accepted and visually flagged rather than blocked
- All sizing in `tracker_card.css` uses `rem` units, with no `px` values
- `npm run build` completes without errors
</step_5>

---

<step_6>
### Step 6. Class-feature card registry

Replace the inline if/else chain and its "Coming soon" placeholder at `combat_page.jsx:599-637` with a registry, so each later class card is a single registry entry instead of another branch. This is the extension point Plans B and C write into.

**Files:**
- Create: `src/components/player_sheet/class_feature_cards.jsx`
- Modify: `src/components/player_sheet/combat_page.jsx` — render the registry

**Criteria:**
- The inline class-card if/else chain in `combat_page.jsx` is replaced by a registry mapping class name and level to card entries
- `AnimalCompanionCard` still renders for Druid and for Ranger at level 4 or higher, and `FamiliarCard` still renders for Wizard and Sorcerer
- Classes with no registered cards render nothing, and the "Coming soon." placeholder string no longer exists in the file
- `npm run build` completes without errors
</step_6>

---

<step_7>
### Step 7. Rogue sneak attack

A pure derived value with no tracker: the dice scale with level and display in the attacks card. Read the Rogue section of `obsidian-vault/dnd-rules/class-features.md` for the conditions text. Sneak dice are added on a critical hit but never multiplied — surface that in the conditions summary.

**Files:**
- Modify: `src/lib/player/player.js` — add `getSneakAttackDice`
- Modify: `src/components/player_sheet/combat_page.jsx` — display the sneak attack line
- Modify: `src/lib/player/playerClassFeatures.test.js` — add sneak attack cases

**Criteria:**
- `getSneakAttackDice()` returns `floor((level + 1) / 2)` for Rogue and 0 for every other class
- The attacks card shows the sneak attack bonus dice for rogues, with the qualifying conditions reachable from the card
- Tests assert 1 at L1, 2 at L3, 10 at L19 for a Rogue and 0 for a Fighter at L19
- `npm run build` completes without errors
</step_7>

---

<step_8>
### Step 8. Paladin divine grace

Divine grace adds the Charisma modifier to all three saves from 2nd level, and is missing today, so every paladin's save totals are wrong. Add it to the three `getTotal*Save` methods, which already compose the manual bonus and familiar bonuses. Read `obsidian-vault/dnd-rules/saving-throws.md` and the Paladin section of `class-features.md`.

**Files:**
- Modify: `src/lib/player/player.js` — add divine grace to `getTotalFortitudeSave`, `getTotalReflexSave`, `getTotalWillSave`
- Modify: `src/lib/player/playerClassFeatures.test.js` — add divine grace cases

**Criteria:**
- All three total-save methods add the Charisma modifier for a Paladin of level 2 or higher
- A level 1 Paladin and all non-Paladin classes return unchanged save totals
- Tests assert the numeric totals for the same paladin at level 1 and level 2, and for a non-paladin at level 2
- `npm test -- --watchAll=false` passes
</step_8>
