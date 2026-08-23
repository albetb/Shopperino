---
type: plan
status: not-started
date: 2026-08-23
tags:
  - swarm/plan
---

# Class Features — Remaining Classes & Polish (Monk, Bard, Ranger, Cleric)

> Finish the class cards for Monk, Bard and Ranger, surface the cleric's domain granted powers, and replace raw class-feature prose with level-aware trait pills and alignment warnings.

## Context

Plan C of three. Implements checklist items 11, 12, 13 and 16 of [[docs/player_sheet_usability_checklist]] plus the two cross-cutting entries, specified in [[plans/per_class_customization_backlog]]. Mechanics come from [[dnd-rules/class-features]]; read the relevant section before each step.

**Depends on `class-features-foundation-plan.md` steps 1–6** for the `progression` data, the `classProgression` accessor, class-feature use tracking, the `TrackerCard` component and the card registry. It also reuses the spendable pool established in `class-features-core-classes-plan.md` step 9 for the monk's wholeness of body, and the second-feat-budget pattern from that plan's steps 5 and 6. This plan is otherwise independent of Plan B and can run after Plan A alone, provided those two patterns are reimplemented rather than reused.

Checklist item 16 is scoped to the domain granted powers and the alignment warning only. The spontaneous cure/inflict conversion is **not** in scope: spontaneous casting already works through `src/components/spellbook/spontaneous_spells.jsx`, where the player casts the spontaneous spell directly and the pooled per-level remainder decrements.

Per CLAUDE.md: derived values in `src/lib/player/player.js` only, limits flagged visually but never enforced, `rem` units in CSS. The model is single-class, so the monk multiclass lock from the backlog is out of scope.

---

<step_1>
### Step 1. Monk derived values

The monk's per-day and level-scaled features, read through the `classProgression` accessor. Read the Monk section of `obsidian-vault/dnd-rules/class-features.md` first. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add the monk helpers
- Create: `src/lib/player/playerMonk.test.js`

**Criteria:**
- `getStunningFistMax()` returns the monk level and its save DC is `10 + half monk level + Wisdom modifier`
- `getKiStrikeTier()` returns the magic, lawful or adamantine bypass tier in effect, `getWholenessOfBodyMax()` returns `2 × monk level`, and `getSlowFallDistance()` returns the distance treated as shorter at the character's level
- All of them return 0 or null for non-Monks and below each feature's granting level
- Tests assert concrete values at levels 1, 4, 7, 11 and 20
- `npm test -- --watchAll=false` passes
</step_1>

---

<step_2>
### Step 2. Monk flurry of blows

Flurry adds an extra attack at the highest base attack bonus with a blanket penalty that improves with level, and applies only to unarmed strikes and monk weapons. The attacks card already renders per-weapon rows built from `calculateWeaponAttackBonus`, so flurry rows extend that path rather than recomputing anything in the component.

**Files:**
- Modify: `src/lib/player/player.js` — add the flurry helper and its weapon eligibility check
- Modify: `src/components/player_sheet/combat_page.jsx` — render flurry rows
- Modify: `src/lib/player/playerMonk.test.js` — add flurry cases

**Criteria:**
- A flurry helper returns the extra attack count and the blanket attack penalty in effect at the monk's level, sourced from the class progression data
- Flurry rows render in the attacks card only when the equipped weapon is an unarmed strike or a monk weapon, with a quarterstaff qualifying when wielded two-handed
- Tests assert one extra attack at a −2 penalty for a low-level monk and two extra attacks at level 11
- `npm run build` completes without errors
</step_2>

---

<step_3>
### Step 3. Monk cards

Composes the tracker and pool primitives; wholeness of body reuses the spendable pool pattern from the paladin's lay on hands.

**Files:**
- Create: `src/components/player_sheet/monk_cards.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register the Monk cards

**Criteria:**
- Stunning fist renders as a `TrackerCard` use counter showing its save DC, and wholeness of body renders as a spendable hit point pool
- Ki strike tier and slow fall distance render as pills, appearing only at the levels where they apply
- The cards render only for Monks
- `npm run build` completes without errors
</step_3>

---

<step_4>
### Step 4. Bardic music derived values

Uses per day equal the bard's level, and each performance unlocks on both class level and Perform ranks. Read the Bard section of `obsidian-vault/dnd-rules/class-features.md` for the full performance list and prerequisites. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — add the bardic music helpers
- Create: `src/lib/player/playerBard.test.js`

**Criteria:**
- `getBardicMusicMax()` returns the bard's class level, and `getBardicKnowledgeBonus()` returns bard level plus Intelligence modifier
- A performance list helper returns every performance with its level and Perform-rank prerequisites, its effect summary, and where applicable a save DC of `10 + half bard level + Charisma modifier`
- Performances are marked available or locked based on both the current level and the character's actual Perform ranks
- Tests assert the available performance set at levels 1, 6 and 18 with sufficient ranks, and confirm a performance stays locked when Perform ranks are too low
- `npm test -- --watchAll=false` passes
</step_4>

---

<step_5>
### Step 5. Bardic music card

**Files:**
- Create: `src/components/player_sheet/bardic_music_card.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register the Bard card

**Criteria:**
- The card shows uses used/max through `TrackerCard` alongside the performance list with prerequisites, effect summaries and save DCs
- Locked performances are shown as unavailable with the prerequisite that gates them, rather than being hidden
- Bardic knowledge renders as a pill showing its total modifier
- `npm run build` completes without errors
</step_5>

---

<step_6>
### Step 6. Ranger favored enemy state and model

Favored enemies need persisted state, since each slot may either add a new enemy or raise an existing one by +2. Read the Ranger section of `obsidian-vault/dnd-rules/class-features.md`. Unit-scope tests.

**Files:**
- Modify: `src/lib/player/player.js` — favored enemy state, accessors, serialize and load handling
- Create: `src/lib/player/playerRanger.test.js`

**Criteria:**
- Favored enemies persist as an ordered list of type with optional subtype and a per-entry bonus, surviving a serialize and load round trip
- `getFavoredEnemySlotsMax()` returns `1 + floor(level / 5)`, and a helper returns the accumulated bonus for a given entry in steps of 2
- The stored bonus applies to Bluff, Listen, Sense Motive, Spot, Survival and weapon damage against that enemy
- Tests assert slot counts at levels 1, 5 and 20 and verify the round trip preserves entries and bonuses
- `npm test -- --watchAll=false` passes
</step_6>

---

<step_7>
### Step 7. Ranger favored enemy editor

**Files:**
- Create: `src/components/player_sheet/favored_enemy_card.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register the Ranger card

**Criteria:**
- The editor offers both modes when a slot is available: adding a new favored enemy, or raising an existing entry by +2
- Selecting a humanoid or outsider type requires choosing a subtype before the entry can be saved
- Using more slots than the character has earned is flagged visually but still accepted
- `npm run build` completes without errors
</step_7>

---

<step_8>
### Step 8. Ranger combat style

The style is chosen once at 2nd level and is permanent, granting specific bonus feats at the style, improvement and mastery levels without their normal prerequisites. These benefits apply only in light or no armor.

**Files:**
- Modify: `src/lib/player/player.js` — combat style state and granted feat helper
- Create: `src/components/player_sheet/combat_style_card.jsx`
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register the combat style card
- Modify: `src/lib/player/playerRanger.test.js` — add combat style cases

**Criteria:**
- The combat style is stored as archery or two-weapon fighting, persists through serialize and load, and is presented as a permanent choice
- The granted style feats for the character's level are listed, and they do not consume either feat budget
- A warning appears when armor heavier than light is equipped, since the style benefits do not apply
- Tests assert the granted feat list at level 2, at the improvement level and at the mastery level for both styles
- `npm test -- --watchAll=false` passes
</step_8>

---

<step_9>
### Step 9. Cleric domain granted powers

The domain selection fields and domain spell slots already work; only the granted-power text is missing. The domain definitions live in `src/data/tables.json` under `Domains`.

**Files:**
- Modify: `src/components/player_sheet/class_feature_cards.jsx` — register a domains card
- Create: `src/components/player_sheet/domains_card.jsx`

**Criteria:**
- Each selected domain's granted power text is surfaced on the sheet, read from the `Domains` table in `src/data/tables.json`
- Both domain slots render, and an unselected domain shows a clear empty state rather than nothing
- The card renders only for Clerics
- `npm run build` completes without errors
</step_9>

---

<step_10>
### Step 10. Passive class trait pills

The features page currently renders class features as raw prose from `classes.json`. Those strings already carry `[N]` level markers, so they can be rendered as level-aware pills that distinguish gained from not-yet-gained features.

**Files:**
- Modify: `src/components/player_sheet/class_cards.jsx` — render features as pills
- Modify: `src/components/player_sheet/features_page.jsx` — use the new rendering

**Criteria:**
- Class features whose `[N]` level marker is at or below the character's level render as compact pills instead of raw prose
- Features above the character's level render as visually distinguished and not yet gained, rather than being hidden
- The full feature description remains reachable from the pill
- `npm run build` completes without errors
</step_10>

---

<step_11>
### Step 11. Alignment and code-of-conduct warnings

Several classes carry alignment requirements, and a paladin who violates the code loses class features until atonement. Read `obsidian-vault/dnd-rules/alignment.md` and the relevant class sections. All warnings are visual only, per the non-enforcing rule in CLAUDE.md. Unit-scope tests for the predicates.

**Files:**
- Modify: `src/lib/player/player.js` — add the alignment warning predicates
- Modify: `src/components/player_sheet/features_page.jsx` — render the warnings
- Modify: `src/lib/player/playerClassFeatures.test.js` — add alignment predicate cases

**Criteria:**
- Warnings surface for a non-lawful Monk, a Paladin who is not Lawful Good, a lawful Barbarian, and a Cleric more than one alignment step from their deity
- A paladin ex-class flag can be set to indicate a code violation, and while set the sheet shows that class features are lost until atonement
- Warnings never block a selection or change a derived value; they only display
- Tests assert each predicate returns true for a violating combination and false for a valid one
- `npm test -- --watchAll=false` passes
</step_11>
