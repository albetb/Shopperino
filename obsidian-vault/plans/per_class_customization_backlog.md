# Per-Class Player Sheet Customization

> Plan for surfacing each base class's mechanics on the player sheet — uses-per-day counters, tracked pools, level-scaled abilities, special lists (favored enemies, prohibited schools, etc.). Today only race-level toggles exist (Gnome spells); class features mostly live as static text or aren't surfaced at all.
>
> Companion to [player_sheet_fix_backlog.md](player_sheet_fix_backlog.md) — that file is for regressions, this one is for new feature work. Read [class-features.md](../dnd-rules/class-features.md) first for the underlying mechanics, and keep all derived values in [src/lib/player/player.js](../../src/lib/player/player.js) per CLAUDE.md.

**Where the work lands:** [combat_page.jsx](../../src/components/player_sheet/combat_page.jsx) (class-specific cards block already stubs `Druid`, `Cleric`, `Paladin`, `Bard`, `Ranger`, `Wizard`, `Sorcerer` with "Coming soon"), [features_page.jsx](../../src/components/player_sheet/features_page.jsx), [feats_page.jsx](../../src/components/player_sheet/feats_page.jsx), [player.js](../../src/lib/player/player.js), [classes.json](../../src/data/classes.json), [class-features.md](../dnd-rules/class-features.md).

---

## Conventions to settle once (before any class is implemented)

- **Where the block lives:** Combat page (the existing `class-specific cards` mapping) for combat-relevant abilities (rage, smite, sneak attack, stunning fist…), Features page for non-combat trackers (lay-on-hands pool, bardic knowledge, wild empathy). Cross-class items (familiars, animal companions) probably want their own dedicated tab or sidebar entry later.
- **State shape:** uses-per-day go on the player model as integers (e.g. `rageUsesUsed`, `smiteEvilUsed`, `turnAttemptsUsed`, `wildShapeUsed`); pools (lay-on-hands HP, bardic-music rounds) go as `{ used }` with the max derived from level+ability in the model. Reset semantics handled by a future "rest" action — for now just expose used/max + a manual reset button.
- **Derived values stay in [player.js](../../src/lib/player/player.js)** per CLAUDE.md — `getRageUsesMax()`, `getSmiteEvilMax()`, `getLayOnHandsMax()`, `getTurnUndeadMax()`, `getSneakAttackDice()`, `getWildShapeMax()`, etc. Components only call these.
- **Feat budgets** split into `generalFeatSlots` (the per-3-levels base + Human bonus) and `classBonusFeatSlots` (Fighter, Wizard, Monk, Ranger combat-style feats) — render as two budgets in the UI so over-cap can be flagged independently per pool.

---

## Per-class checklist

Derived from [classes.md](../dnd-rules/classes.md) and [class-features.md](../dnd-rules/class-features.md).

### Barbarian
- Rage tracker: uses/day = `1 + floor(level/4)`, duration = `3 + raged-Con mod` rounds (Con is +4 inside rage). Active toggle that temporarily adds +4 Str, +4 Con, +2 morale Will, **−2 AC**, `level × 2` temp HP; afterwards mark *fatigued* for the rest of the encounter (auto-clear on rest). Rage tier swap (rage → greater rage → mighty rage → tireless rage) per class table.
- Fast movement: +3 m to base land speed, **only** while in light/no armor and light/no load — needs to gate the `getBaseSpeed` bonus on armor + load (current code may add it unconditionally).
- DR/— pill (scales every 3 levels starting at 7th — needs a `getDamageReduction()` helper).
- Passive trait list: uncanny dodge, improved uncanny dodge, trap sense (+X Reflex vs traps, +X dodge AC vs trap attacks — stacks with rogue trap sense), indomitable will (Will bonus *only during rage*), illiterate-by-default flag with a "spend 2 SP for literacy" toggle.

### Bard
- Bardic music tracker: uses/day = `bard level`. Performance list filtered by current level + Perform ranks. Each entry shows: name, prerequisite (level + Perform ranks), effect summary, and (where applicable) save DC `10 + ½ bard level + Cha mod`. Performances: countersong (3 ranks), fascinate, inspire courage (3 ranks; scales `+1 → +4`), inspire competence (6 ranks, L3+), suggestion (9 ranks, L6+), inspire greatness (12 ranks, L9+), song of freedom (15 ranks, L12+), inspire heroism (18 ranks, L15+), mass suggestion (21 ranks, L18+).
- Bardic knowledge pill: `d20 + bard level + Int mod` with the standard DC table (10/20/25/30).
- Spellcasting: spontaneous, Cha-based, max spell level 6. Verify spells-known table from `classes.json`.
- Armor exemption: bard in **light** armor has **no ASF** for bard spells — verify the casting UI doesn't flag it as failing.

### Cleric
- Turn/rebuke undead tracker: attempts/day = `3 + Cha mod` (+ Extra Turning feat bonuses). Buttons: turn-check `d20 + Cha mod` → highest HD affected (table), turning-damage `2d6 + cleric level + Cha mod` total HD. Destroy-instead threshold (effective level ≥ 2× undead HD). Rebuke / command variant for evil-aligned clerics (chosen at L1 for neutral).
- Domains: two granted-power summaries + domain spell slot per spell level (verify it's added **on top of** base slots, not displacing one). Domain selection fields exist on the player; surface the granted-power text.
- Spontaneous cure/inflict: button to "sacrifice a prepared spell of level L → spontaneously cast any cure/inflict ≤ L" without touching the prepared-list state for that spell, just decrement the slot. Cure vs inflict gated by alignment.
- Alignment check: warn if cleric drifts outside one step of deity alignment (we already store both axes).

### Druid
- Animal companion summary (link to a dedicated sub-tab — see Open decisions). Stats derive from `druid level` via the companion sub-system table.
- Wild shape tracker: uses/day per class table. Form picker with size-tier unlock (animal → Large → Tiny → Huge → plant → elemental, each tier opens at the level in `classes.json`). HD cap = druid level. Duration `1 hour per druid level`. Auto-warning if metal armor equipped.
- Wild empathy pill: `d20 + druid level + Cha mod`.
- Passive list: nature sense (+2 Knowledge nature / Survival), woodland stride, trackless step, resist nature's lure (+4 saves vs fey), venom immunity, *a thousand faces* (at-will self-only alter self), timeless body.
- Spontaneous casting: sacrifice prepared spell to cast any `summon nature's ally` of equal/lower level.
- Armor restriction warning: metal armor or metal shield → lose all spellcasting and supernatural class features for 24 h.

### Fighter
- Bonus combat feats budget: `1 + floor(level/2)` extra slots (L1, L2, L4, …, L20). Surface as a second "Combat feats" pill on [feats_page.jsx](../../src/components/player_sheet/feats_page.jsx) alongside the general budget, with its own over-cap warning. Restrict the choice list to the fighter-bonus-feat allowed set (needs a `combat` tag on entries in [feats.json](../../src/data/feats.json) — verify).
- No other class features; everything else is "see your feats."

### Monk
- Stunning fist tracker: uses/day = monk level ("a number of times per day equal to her monk level"; the `1 + floor(level/4)` rate is the *feat* taken by a non-monk, not the monk class feature). DC = `10 + ½ monk level + Wis mod`.
- Flurry of blows row in the Attacks card: extra attack at highest BAB, blanket `−2` (drops at later levels per `classes.json`) on every attack in the flurry. Only with unarmed strikes or monk weapons (kama, nunchaku, sai, shuriken, siangham; quarterstaff counts as monk weapon when 2H).
- Unarmed strike + AC-from-Wis: already implemented — verify "unarmored + unencumbered (light load)" gating since AC bonus is lost with any armor, any shield, or medium/heavy load.
- Fast movement +X m (per JSON), same unarmored/unencumbered gate.
- Ki strike progression: pill showing current bypass tier (magic → lawful → adamantine).
- Wholeness of body: `2 × monk level` HP/day pool, distributable; same tracker pattern as paladin's lay-on-hands.
- Slow fall pill: current "treat fall as N m shorter" by level (eventually any distance with a wall).
- Quivering palm: 1/week toggle with the declared target name + save DC.
- Passive: evasion / improved evasion (light/no armor only), still mind (+2 vs enchantment), purity of body (immune to mundane disease), diamond body (immune to all poison), diamond soul (SR = monk level + 10), abundant step (1/day *dimension door*, CL ½ level), tongue of sun and moon, empty body (`1 round per level / day` ethereal), perfect self (type → Outsider, DR 10/magic).
- Alignment guard: Lawful only.
- **Multiclass restriction warning**: once another class is taken, monk can never advance again. Lock the "level up monk" UI behind a confirmation if any non-monk class exists.

### Paladin
- Smite evil tracker: uses/day = `1 + floor(level/5)`. Button declares "next attack adds +Cha to attack, +paladin level to damage if target is evil" — wasted on miss or non-evil hit.
- Lay on hands pool: max HP/day = `paladin level × Cha mod`. Distributable per use to any willing target; alternate use = touch attack on undead for the same damage. Pool tracker with arbitrary-amount input per use.
- Divine grace: feeds `getTotalFortitudeSave` / Reflex / Will by adding **Cha mod** — needs to be wired into the existing save totals.
- Turn undead from L4: uses `3 + Cha mod / day`, effective turner level = `paladin level − 3`. Reuse the cleric tracker primitive.
- Special mount from L5: link to a dedicated sub-tab (see Open decisions). Summon usable for `2 hours × paladin level / day`; cooldown of 30 days OR next level-up if the mount dies.
- Remove disease tracker: 1/week + 1/6 levels.
- Spellcasting from L4: Wis-based, prepared, caster level = `½ paladin level`, max spell level 4.
- Passive: aura of good, aura of courage (immune to fear + allies within 3 m get +4 morale vs fear), divine health (immune to all disease), detect evil at will.
- **Alignment + code**: LG only; code-violation warning + ex-paladin lockout flag (loses all class features until atonement).
- **Multiclass restriction**: same one-way rule as monk.

### Ranger
- Favored enemy list editor: 1 at L1, +1 every 5 levels (so L1, L5, L10, L15, L20). Each entry: type/subtype (humanoids and outsiders require subtype), with `+2` per stack to Bluff / Listen / Sense Motive / Spot / Survival / weapon damage. On each new selection slot, the ranger may instead **boost an existing favored enemy by +2** — picker UI must allow both modes.
- Combat style at L2: radio for *archery* vs *two-weapon fighting*; permanent. Awards free bonus feat (no prereqs) — *Rapid Shot* or *Two-Weapon Fighting* at L2, *Manyshot* / *Improved TWF* at the style-improvement level, *Improved Precise Shot* / *Greater TWF* at the mastery level. Only effective in light or no armor — flag warning if heavier.
- Animal companion from L4: reuse the druid sub-system at **half ranger level** (so first companion is "effective druid L2").
- Spellcasting from L4: Wis-based, prepared, caster level = `½ ranger level`, max spell level 4.
- Passive: Track (free at L1), wild empathy (`d20 + ranger level + Cha mod`), Endurance (L3 free feat), woodland stride, swift tracker (full speed at `−10` to Survival), evasion (light/no armor only), camouflage (Hide in any natural terrain), hide in plain sight (Hide while observed in natural terrain).

### Rogue
- Sneak attack dice line in Attacks card: `+ floor((level + 1) / 2) d6` (so +1d6 at L1, +2d6 at L3, …, +10d6 at L19). Conditions surfaced as a tooltip: target denied Dex OR rogue flanking; ranged within 9 m; **immune** = oozes, plants, undead, constructs, incorporeal, crit-immune. Note: sneak dice are added on a crit but **not multiplied**.
- Trap sense pill: `+X` Reflex vs traps / `+X` dodge AC vs trap attacks (stacks with barbarian trap sense).
- Trapfinding flag (lets the rogue use Search > DC 20 and disarm magical traps with Disable Device).
- Passive: evasion, uncanny dodge, improved uncanny dodge.
- Special-abilities picker once level ≥ 10 (then L13, L16, L19): crippling strike, defensive roll, improved evasion, opportunist, skill mastery (`3 + Int mod` chosen skills, always take 10), slippery mind, *or* a feat. Each pick stored on the player; the list is presented as one-of menus.

### Sorcerer
- Spells-known editor: fixed-size list per spell level per the class table (independent of Cha). UI separate from the "prepared/cast" plumbing — sorcerers cast any known spell from any open slot.
- Slot tracker: bonus slots from Cha mod (Cha-based bonus spells table).
- **Spell swap at level-up**: at L4 and every even level after, prompt to optionally forget one known spell and replace it with another of equal/lower level.
- Familiar from L1 (see Open decisions about the dedicated sub-tab).
- Armor: no proficiency; ASF applies to any worn armor or shield — surface a warning.

### Wizard
- Spellbook: tracks **which spells the wizard knows** (the persistent spellbook) vs **which are prepared today**. Add/remove spellbook entries (scribe cost), then "prepare from spellbook" UI populates the daily slots. Verify the existing prepared-spells UI distinguishes these two states.
- Specialist school: `specialized` field exists; prohibited schools `forbidden1` / `forbidden2` exist. Verify the prepare/cast UI actually blocks the prohibited schools, and that specialist gets **+1 slot per spell level** in the chosen school (verify the spell-slots math).
- *Scribe Scroll* granted free at L1 — automatic feat entry, doesn't consume a slot.
- Bonus wizard feats at L5/10/15/20: feat picker restricted to metamagic, item-creation, or *Spell Mastery* (prereqs enforced). Same "second budget" treatment as fighter combat feats.
- Familiar from L1 (shared sub-system with sorcerer).
- Armor: no proficiency; ASF applies — surface a warning. Int-based casting, spell save DC = `10 + spell level + Int mod`.

---

## Shared sub-systems (unlocked by class features, not class-specific)

- **Familiar** (sorcerer / wizard): full mini-stat block — HP = ½ master HP, BAB = master BAB, max(master HD, familiar HD), share-spells radius, deliver-touch (L3+), speak with master (L5+), SR = master level + 5 (L11+), per-species bonus to master, 200 XP/level loss on death (Fort DC 15 negates). Needs a list of species in [src/data/](../../src/data/).
- **Animal companion** (druid / ranger): full mini-stat block — bonus HD, bonus natural armor, +Str/+Dex, bonus tricks, link / share spells / evasion / devotion / multiattack / improved evasion progression by druid level (or `½ ranger level`). Alternate-list creatures available at higher levels via a level adjustment.
- **Special mount** (paladin): summon for `2 hours × paladin level / day`. Shares spells (L5+), shares saves if better, improved evasion, empathic link, later speed bonus + *command* species spell-like + SR. 30-day or next-level cooldown on death.
- **Turn undead**: shared tracker between cleric and paladin (paladin uses cleric mechanics at effective level `paladin − 3`).
- **Wild shape**: druid-only but worth its own component since the form list + uses/day + duration is non-trivial.

---

## Open decisions

- Where do trackers live: combat page (already stubbed) vs features page vs both?
- Reset semantics: manual per-tracker reset now, or wait until a global "rest" action lands?
- Companion / familiar / mount: inline on the class card, or their own sub-tab? They each need full stat blocks and combat math; probably a separate tab.
- Do we extend `classes.json` with per-class derived constants (rage formula, smite formula, turn-undead formula, sneak-attack dice progression) or hard-code them in player.js? JSON keeps mechanics together with the rest of class data but adds parsing complexity.

---

## Implementation order

1. Land the state-shape and derived-value conventions on the player model with one or two simple classes first (Fighter for feat-budget split, Barbarian for the rage tracker pattern).
2. Then knock out each class card one PR at a time, reusing the same tracker primitive (used/max stepper + reset button).
3. Wizard / Cleric / Druid / Bard / Sorcerer get tackled together with the spell-slot verification item in [player_sheet_fix_backlog.md](player_sheet_fix_backlog.md) (they share the prepared-vs-known plumbing).

---

## Rules ref

[classes.md](../dnd-rules/classes.md), [class-features.md](../dnd-rules/class-features.md), [classes.json](../../src/data/classes.json), [magic.md](../dnd-rules/magic.md).
