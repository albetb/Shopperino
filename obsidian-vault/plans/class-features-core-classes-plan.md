---
type: plan
status: not-started
date: 2026-08-23
tags:
  - swarm/plan
---

# Class Features — Core Classes (Barbarian, Fighter, Cleric/Paladin)

> Implement the first four class feature sets, each one establishing a pattern the remaining classes reuse: the rage buff toggle, the second feat budget, the shared turn-undead tracker, and the spendable pool.

## Context

Plan B of three. Implements checklist items 7–10 of [[docs/player_sheet_usability_checklist]], specified in [[plans/per_class_customization_backlog]]. Mechanics come from [[dnd-rules/class-features]]; read the relevant section before each step.

**Depends on `class-features-foundation-plan.md` steps 1–6** — the `progression` data in `classes.json`, the `classProgression` accessor, the class-feature use state on the Player model, the `TrackerCard` component, and the card registry in `class_feature_cards.jsx`. Do not start this plan until those are done.

Patterns established here and reused later: step 3's temporary buff toggle is the model for any active-stance feature; step 5's second feat budget is reused verbatim for Wizard and Monk bonus feats; step 7's turn undead serves both Cleric and Paladin; step 9's spendable pool is reused for the Monk's wholeness of body in Plan C.

Per CLAUDE.md: derived values in `src/lib/player/player.js` only, limits flagged visually but never enforced, `rem` units in CSS. The model is single-class, so helpers read `this.class` and `this.level` directly.

---

<step_1>
### Step 1. Barbarian rage derived values

The uses/day count, the rage tier progression and damage reduction, all read through the `classProgression` accessor rather than hard-coded. Read the Barbarian section of `obsidian-vault/dnd-rules/class-features.md` first. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add `getRageUsesMax`, `getRageTier`, `getDamageReduction`
- Create: `src/lib/player/playerBarbarian.test.js`

**Criteria:**
- `getRageUsesMax()` returns `1 + floor(level / 4)` and `getRageTier()` returns the rage, greater rage, mighty rage or tireless rage tier in effect at the character's level
- `getDamageReduction()` returns the DR value that begins at level 7 and scales every three levels, and 0 below level 7
- All three return 0 or null for non-Barbarians
- Tests assert concrete values at levels 1, 4, 7, 11 and 20
- `npm test -- --watchAll=false` passes
</step_1>

---

<step_2>
### Step 2. Fix barbarian fast movement gating

`getBaseSpeed()` currently adds the barbarian speed bonus unconditionally, but the bonus applies only in light or no armor and at a light or lighter load. The model already exposes `getEquippedArmorRaw()` and `getLoadStatus()` to gate on. Read `obsidian-vault/dnd-rules/movement.md`.

**Files:**
- Modify: `src/lib/player/player.js` — gate the barbarian branch of `getBaseSpeed`
- Modify: `src/lib/player/playerBarbarian.test.js` — add speed cases

**Criteria:**
- `getBaseSpeed()` adds the barbarian bonus only when the equipped armor is light or absent and `getLoadStatus()` is none or light
- A barbarian in medium or heavy armor, or at medium or heavier load, returns the base race speed with no bonus
- `getArmorSpeedInfo()` remains consistent with the gated base speed, since it derives the class bonus by subtraction
- Tests assert speed unarmored, in heavy armor, and at heavy load
- `npm test -- --watchAll=false` passes
</step_2>

---

<step_3>
### Step 3. Rage active toggle

The temporary-buff pattern. While raging the barbarian gains +4 Strength, +4 Constitution, a +2 morale bonus on Will saves and `level × 2` temporary hit points, and takes a −2 penalty to AC; ending rage leaves them fatigued. The existing condition subsystem in `conditionEffects.js` is the natural carrier for the fatigue follow-up. Rage duration uses the raged Constitution modifier, not the base one.

**Files:**
- Modify: `src/lib/player/player.js` — raging flag, buff application, `getRageDuration`
- Modify: `src/lib/player/playerBarbarian.test.js` — add rage state cases

**Criteria:**
- The raging flag is settable, survives a serialize and load round trip, and while active applies +4 Str, +4 Con, +2 morale to Will, −2 AC and `level × 2` temporary hit points
- Ending rage clears the flag and applies the Fatigued condition through the existing condition subsystem
- `getRageDuration()` returns `3 + the raged Constitution modifier` in rounds, computed from the boosted Constitution
- Tests assert Strength, AC and Will totals both inside and outside rage for the same character
- `npm test -- --watchAll=false` passes
</step_3>

---

<step_4>
### Step 4. Barbarian rage card

The first registry-driven class card, composing `TrackerCard` with the active toggle from step 3.

**Files:**
- Create: `src/components/player_sheet/rage_card.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register the Barbarian card

**Criteria:**
- The card shows rage uses used/max through `TrackerCard`, an on/off rage toggle, the current duration in rounds, and the damage reduction value once it applies
- Toggling rage on updates the ability scores, AC and Will save already displayed elsewhere on the combat page
- The card renders only for Barbarians
- `npm run build` completes without errors
</step_4>

---

<step_5>
### Step 5. Fighter bonus combat feat budget

Split the feat budget into two independent pools. No data work is needed: `src/data/feats.json` already carries a `fighterBonus` boolean, true for 48 of the 110 feats. Read `obsidian-vault/dnd-rules/feats.md`. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add `getClassBonusFeatSlotsMax` and `getClassBonusFeatsUsed`
- Create: `src/lib/player/playerFeatBudget.test.js`

**Criteria:**
- `getClassBonusFeatSlotsMax()` returns `1 + floor(level / 2)` for Fighter and 0 for every other class
- `getClassBonusFeatsUsed()` counts only selected feats whose `feats.json` entry has `fighterBonus` set to true
- `getFeatPointsMax()` still returns the general budget alone and is unchanged for non-fighters
- Tests assert fighter budgets at levels 1, 2 and 20, and a non-fighter at level 20
- `npm test -- --watchAll=false` passes
</step_5>

---

<step_6>
### Step 6. Dual feat budget UI

Render the two pools separately on the feats page, which today shows a single budget from `getFeatPointsMax()` at line 48. Over-cap must be flagged per pool without blocking selection.

**Files:**
- Modify: `src/components/player_sheet/feats_page.jsx` — render general and combat budgets

**Criteria:**
- Fighters see two separate budgets, general and combat bonus, each with its own used and max
- Each budget flags exceeding its own cap visually and independently, while still accepting the selection
- Non-fighters see the single general budget exactly as before
- `npm run build` completes without errors
</step_6>

---

<step_7>
### Step 7. Turn undead derived values

Built once and shared: a paladin turns as a cleric of three levels lower, from 4th level. Read the turn/rebuke undead sub-system section of `obsidian-vault/dnd-rules/class-features.md` for the HD table and the destroy threshold. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add the turn undead helpers
- Create: `src/lib/player/playerTurnUndead.test.js`

**Criteria:**
- `getTurnUndeadAttemptsMax()` returns `3 + Charisma modifier` for Cleric at any level and Paladin from level 4, and 0 otherwise
- `getTurnUndeadEffectiveLevel()` returns the class level for Cleric and `level − 3` for Paladin
- Helpers expose the turn check as `d20 + Charisma modifier`, the highest HD affected from the table, and turning damage as `2d6 + effective level + Charisma modifier`
- Tests assert attempts and effective level for a Cleric and a Paladin at levels 3, 4 and 10
- `npm test -- --watchAll=false` passes
</step_7>

---

<step_8>
### Step 8. Turn undead card

One card serving both classes, titled for the character's variant. Clerics of evil alignment rebuke rather than turn; the model already stores both alignment axes.

**Files:**
- Create: `src/components/player_sheet/turn_undead_card.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register for Cleric and Paladin

**Criteria:**
- The card renders for Cleric at any level and for Paladin from level 4, titled turn or rebuke according to the character's alignment
- It shows attempts used/max through `TrackerCard`, plus the highest HD affected and the turning damage total
- The destroy-instead threshold, effective level at or above twice the undead's HD, is surfaced on the card
- `npm run build` completes without errors
</step_8>

---

<step_9>
### Step 9. Paladin smite, lay on hands and remove disease

Lay on hands introduces the spendable pool: the paladin distributes an arbitrary number of hit points per use rather than consuming whole uses, so it tracks a spent total against a maximum. Read the Paladin section of `obsidian-vault/dnd-rules/class-features.md`. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add the three paladin helpers and pool spending
- Create: `src/lib/player/playerPaladin.test.js`

**Criteria:**
- `getSmiteEvilMax()` returns `1 + floor(level / 5)`, `getLayOnHandsMax()` returns `paladin level × Charisma modifier` floored at 0, and `getRemoveDiseaseMax()` returns `1 + floor(level / 6)`
- Lay on hands tracks an arbitrary spent amount against the pool rather than whole uses, and reports the remaining hit points
- All three return 0 for non-paladins and below each feature's granting level
- Tests assert pool and use values at levels 1, 5, 6 and 12, including a negative Charisma modifier flooring the pool at 0
- `npm test -- --watchAll=false` passes
</step_9>

---

<step_10>
### Step 10. Paladin cards

Smite and remove disease are ordinary use counters; lay on hands uses the pool variant of `TrackerCard` from foundation step 5.

**Files:**
- Create: `src/components/player_sheet/paladin_cards.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register the Paladin cards

**Criteria:**
- Smite evil and remove disease render as `TrackerCard` use counters, with smite noting the +Charisma to attack and +level to damage it grants
- Lay on hands renders as a pool with a free-amount spend input and a remaining hit points display
- Each card renders only for Paladins and only at or above its feature's granting level
- `npm run build` completes without errors
</step_10>
