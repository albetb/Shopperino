# Class Features

> Per-class catalog of named features and how they resolve mechanically. Per-class numbers (uses/day by level, damage dice, save DCs that depend on level, etc.) live in [src/data/classes.json](../../src/data/classes.json); this file documents the *mechanics* each feature triggers.

Shared sub-systems (familiar, animal companion, special mount, turn undead, wild shape, school specialization) are at the bottom.

---

## Barbarian

- **Fast movement (Ex)** — +3 m to base land speed. Active **only** in light/no armor and light/no load.
- **Rage (Ex)** — free action to enter; while raging:
  - +4 Str, +4 Con, +2 morale to Will saves, **−2 AC**.
  - Bonus HP from Con increase = `(level) × 2`, treated as temporary HP for the duration.
  - **Cannot** use Cha-, Dex-, or Int-keyed skills *except* Balance, Escape Artist, Ride, Intimidate; cannot use Concentration; cannot cast spells or activate spell-completion / spell-trigger / command-word magic items.
  - Duration: `3 + raged Con mod` rounds. Voluntary end allowed.
  - After: **fatigued** (−2 Str, −2 Dex; no charge, no run) for the rest of the encounter.
  - Can only enter rage once per encounter. Cannot enter as a reaction to another's action (no readied/interrupting rage).
- **Greater rage (Ex)** (at the level noted in JSON) — bonuses become +6/+6/+3.
- **Mighty rage** — +8/+8/+4.
- **Tireless rage** — no post-rage fatigue.
- **Uncanny dodge (Ex)** — keeps Dex bonus to AC vs invisible attackers and against being flat-footed. Still lost when immobilized.
- **Improved uncanny dodge** — cannot be flanked, except by a rogue whose class level exceeds the barbarian's uncanny-dodge-granting level by ≥4.
- **Trap sense (Ex)** — `+X` to Reflex saves vs traps and `+X` dodge AC vs trap attacks. Stacks across classes that grant trap sense (barbarian + rogue).
- **DR X/—** (damage reduction) — reduces each instance of incoming weapon damage by X (minimum 0; cannot push damage below 0).
- **Indomitable will** — extra Will save bonus *during rage only*, vs enchantment.
- **Illiterate** — barbarians start illiterate in all languages. Can spend **2 SP** once to gain literacy in every language known. Multiclassing into barbarian does *not* remove literacy already gained.

## Bard

- **Bardic knowledge (Ex)** — `d20 + bard level + Int mod` for a piece of legend/lore (no roll for common lore). DC scale roughly 10/20/25/30 by obscurity (10 = local common, 30 = lost lore).
- **Bardic music (Ex/Sp/Su)** — usable `bard level / day` total. Each use activates a specific ability (below); requires the bard to sing/play. Some require sustained performance (standard action each round to maintain; cannot cast or activate spells while sustaining; deafened bard has 20% chance to fail each round). Requires the listed minimum **Perform** ranks.
  - **Countersong (Su)** (3 Perform ranks) — 1/round, Perform check replaces save vs sonic/language-dependent magic for any creature within 9 m, while sustained.
  - **Fascinate (Sp)** — 1 target per 3 bard levels within 27 m, Will save vs Perform check or fascinated for 1 round/bard level; broken by threats or hostile actions.
  - **Inspire courage (Su)** (3 ranks) — allies who hear gain `+X` morale to attack, weapon damage, and saves vs charm/fear. Lasts while heard + 5 rounds.
  - **Inspire competence (Su)** (6 ranks; L3+) — 1 ally within 9 m gains +2 competence to a specific skill, while heard, up to 2 minutes.
  - **Suggestion (Sp)** (9 ranks; L6+) — as the spell, on a creature already fascinated. Does not break fascination. Mind-affecting compulsion. Save DC = `10 + ½ bard level + Cha mod`.
  - **Inspire greatness (Su)** (12 ranks; L9+) — 1 ally + 1 per 3 levels beyond 9th gains: +2 bonus HD (d10) + Con mod each (temp HP), +2 competence to attack, +1 morale to Fort saves.
  - **Song of freedom (Sp)** (15 ranks; L12+) — 1 minute concentration → effect of *break enchantment* on one target within 9 m.
  - **Inspire heroism (Su)** (18 ranks; L15+) — 1 ally + 1 per 3 levels beyond 15th gains +4 morale saves, +4 dodge AC.
  - **Mass suggestion (Sp)** (21 ranks; L18+) — *suggestion* applied to any number of fascinated targets simultaneously.
- **Spellcasting** — arcane, **Cha-based**, **spontaneous** (knows fixed list; see [magic.md](magic.md) for the prepared-vs-spontaneous system). Max spell level 6.
- **Armor & arcane casting** — a bard in light armor incurs **no arcane spell failure** for bard spells. Medium/heavy armor or any shield → normal failure chance.

## Cleric

- **Aura (Ex)** — alignment aura matching deity's strongest component, intensity by cleric level (see *detect alignment* spells).
- **Domains** — choose **2** from the deity's allowed list at 1st level (permanent). Domains grant:
  - A **granted power** (passive ability or bonus).
  - One **domain spell per spell level (1–9)**. Each day, the cleric gets one extra slot per spell level designated as a **domain slot**; that slot can only hold one of the two chosen domains' spells.
- **Spontaneous casting** — by sacrificing a prepared (non-domain) spell of level L, a cleric can spontaneously cast *any* cure spell (good/neutral) or *any* inflict spell (evil) of level ≤ L. Neutral cleric chooses good or evil orientation at 1st level, permanent.
- **Turn / rebuke undead (Su)** — see *Turn undead* sub-system below.
- **Spell preparation** — prepares from the full cleric list every day after 1 hour of contemplation/prayer. Time of day depends on deity (good = dawn; evil = night).
- **Alignment restriction** — within one step of deity's alignment on both axes; cannot be true neutral unless the deity is. Some deities further constrain (e.g. St. Cuthbert clerics cannot be neutral).
- **Casting ability** — Wisdom. Spell save DC = `10 + spell level + Wis mod`.
- **Ex-cleric** — gross violation of code → loses spells and class features (keeps weapon/armor proficiencies). Requires *atonement* to regain. No further cleric levels until atoned.

## Druid

- **Animal companion (Ex)** — see *Animal companion* sub-system below.
- **Nature sense (Ex)** — `+2` to Knowledge (nature) and Survival checks.
- **Wild empathy (Ex)** — `d20 + druid level + Cha mod` to improve an animal's attitude, like a Diplomacy check. Range 9 m, 1 minute. Magical beasts with Int 1–2 also workable at `−4`.
- **Woodland stride (Ex)** — moves through natural difficult terrain (thorns, undergrowth) at normal speed, no damage. Magical effects (e.g. *entangle*) still apply.
- **Trackless step (Ex)** — leaves no trail in natural terrain unless desired.
- **Resist nature's lure (Ex)** — `+4` saves vs spells and spell-like abilities of fey.
- **Wild shape (Su)** — see *Wild shape* sub-system below.
- **Venom immunity (Ex)** — immune to all poisons (natural and magical).
- **A thousand faces (Su)** — at-will *alter self*, but only while in own form. Cosmetic, not combat.
- **Timeless body (Ex)** — no aging penalties to physical scores; still dies of old age on schedule.
- **Spontaneous casting** — sacrifice a prepared spell of level L → spontaneously cast any *summon nature's ally* of level ≤ L.
- **Spell preparation** — daily, 1 hour of communion with nature; prepares from full druid list.
- **Casting ability** — Wisdom.
- **Armor restriction** — cannot wear **metal armor** or wield metal shields. Allowed: padded, leather, hide; wooden shields (non-tower). Violating loses all spellcasting and supernatural class features for **24 hours**.
- **Druidic** — secret class language. Teaching it to non-druids loses all druid abilities permanently.
- **Alignment restriction** — at least one axis must be neutral.
- **Ex-druid** — alignment shift or teaching Druidic to a non-druid → loses spells, supernatural class features, and animal companion until *atonement*.

## Fighter

- **Bonus combat feats** — at 1st level and every **even** level thereafter (2, 4, 6, …, 20). Must be drawn from the fighter-bonus-feat list (mostly combat-tagged feats). Prerequisites still required.
- No other class features. Fighters lean entirely on accumulated feats and proficiencies.

## Monk

- **Monk weapons** — kama, nunchaku, sai, shuriken, siangham. The monk can apply Flurry of Blows and other monk-class effects to these.
- **Bonus feats** — at fixed levels (1, 2, 6), pick from a small list per level. Prerequisites ignored.
  - L1: *Improved Grapple* or *Stunning Fist*.
  - L2: *Combat Reflexes* or *Deflect Arrows*.
  - L6: *Improved Disarm* or *Improved Trip*.
- **AC bonus (Wis)** — when unarmored and unencumbered (light load only), add **Wis mod** to AC, plus `+1` per certain level milestones (per JSON). Lost when wearing armor, using a shield, or carrying medium/heavy load.
- **Flurry of blows (Ex)** — full-attack action that gains an **extra attack at the highest BAB**; *all* attacks during the flurry take a `−2` penalty (penalty drops at later levels per JSON). Usable only with unarmed strikes or monk weapons (not mixing both in the same flurry except a quarterstaff/ferrato which counts as monk-weapon when wielded two-handed).
- **Unarmed strike (Ex)** — treated as **both** a manufactured weapon (so *magic weapon* / *greater magic weapon* apply) **and** a natural weapon (so *magic fang* applies). Damage progression by monk level and size — table in JSON.
- **Ki strike (Su)** — unarmed strikes count as **magic** (per JSON level), later as **lawful**, later as **adamantine** for bypassing DR.
- **Evasion (Ex)** — no damage on a successful Reflex save vs an attack that allows Reflex for half. Only when wearing light or no armor.
- **Fast movement (Ex)** — `+X m` to base speed when unarmored and unencumbered (scales per JSON).
- **Still mind (Ex)** — `+2` saves vs enchantment.
- **Slow fall (Ex)** — when falling within arm's reach of a wall, treat fall as if X m shorter. Eventually any height with a wall nearby.
- **Purity of body (Ex)** — immune to all non-magical (i.e. mundane) diseases.
- **Wholeness of body (Su)** — self-heal `2 × monk level` HP per day, distributable.
- **Improved evasion (Ex)** — even on failed Reflex, take half damage (still no damage on success).
- **Diamond body (Ex)** — immunity to all poison.
- **Abundant step (Sp)** — *dimension door* 1/day, caster level = ½ monk level.
- **Diamond soul (Ex)** — spell resistance = `monk level + 10`.
- **Quivering palm (Su)** — once per week, declare a target before making an unarmed attack. On hit, target must Fort save (DC `10 + ½ monk level + Wis mod`) or die at a time of monk's choice within `1 day per monk level`. Immune: constructs, oozes, plants, undead, incorporeal, anyone Will-save immune to the monk's HD.
- **Timeless body (Ex)** — no aging penalties.
- **Tongue of sun and moon (Ex)** — speak with any living creature.
- **Empty body (Su)** — become ethereal `1 round per monk level / day`, divisible.
- **Perfect self** — type changes to **Outsider**; DR 10/magic.
- **Alignment** — Lawful only.
- **Multiclass restriction** — once the monk takes a level in another class, **they can never again advance as a monk** (existing levels and abilities are retained).

## Paladin

- **Aura of good (Ex)** — like a cleric of the paladin's level, *good* aura.
- **Detect evil (Sp)** — at will.
- **Smite evil (Su)** — `1 + per-5-level` uses per day. Declared on an attack: add **Cha mod** to attack and add **paladin level** to damage if the target is evil. Wasted on a miss or on a non-evil target.
- **Divine grace (Su)** — add **Cha mod** to **all** saving throws.
- **Lay on hands (Su)** — daily pool of HP = `paladin level × Cha mod`, distributable to any willing target as a standard action by touch. Each use is "spend N points to heal N HP." Alternatively, used as a touch attack against an undead creature to deal that many HP of damage (no save).
- **Aura of courage (Su)** — paladin is immune to fear; allies within 3 m get `+4` morale vs fear. Suppressed while paladin is unconscious or dead.
- **Divine health (Ex)** — immune to all diseases, magical and mundane.
- **Turn undead (Su)** — as a cleric of `paladin level − 3` (so begins at paladin L4 with effective turner level 1). Cha-based. See *Turn undead* sub-system.
- **Special mount (Sp)** — see *Special mount* sub-system below.
- **Remove disease (Sp)** — scales from 1/week with extra uses at higher levels.
- **Spellcasting** — divine, **Wis-based**, **prepared**. Begins at 4th class level. Minimum Wis 11 to cast 1st-level spells (rule from [magic.md](magic.md) still applies). Caster level = `paladin level − 3`. Paladin has no domain access.
- **Alignment** — Lawful Good only. **Code of conduct**: act with honor, do not lie, do not cheat, respect legitimate authority, punish those who threaten innocents, help those in need. Associates: only lawful good followers; can adventure with non-evil allies short-term.
- **Ex-paladin** — any willful evil act or gross code violation → **loses all paladin class features** (spells, smite, lay on hands, aura, mount, etc.) until *atonement*. Retains weapon/armor proficiencies.
- **Multiclass restriction** — once paladin takes a level in another class, **they can never again advance as a paladin**.

## Ranger

- **Favored enemy (Ex)** — at 1st level, pick a creature type/subtype from the favored-enemy list. Gain `+2` to Bluff, Listen, Sense Motive, Spot, Survival checks vs that creature, and `+2` to weapon damage against that creature. Additional enemies picked at every per-JSON level; at each new selection, the ranger may instead **boost an existing favored enemy by +2**. Humanoids and outsiders require choosing a subtype.
- **Track** — Track feat granted free at L1.
- **Wild empathy** — same mechanic as druid (`d20 + ranger level + Cha mod`).
- **Combat style (Ex)** — at L2, choose **two-weapon fighting** *or* **archery**. The ranger gains a free bonus feat appropriate to the style, **ignoring all prerequisites**. Benefits only while wearing light or no armor. Style is permanent.
  - Two-weapon path: free *Two-Weapon Fighting*; later *Improved Two-Weapon Fighting* (style improvement) and *Greater Two-Weapon Fighting* (mastery).
  - Archery path: free *Rapid Shot*; later *Manyshot* and *Improved Precise Shot*.
- **Endurance** — bonus feat at L3.
- **Animal companion (Ex)** — see sub-system. Ranger uses druid mechanics but at **half ranger level** (so first eligible at ranger L4 → effective druid L2 companion).
- **Spellcasting** — divine, **Wis-based**, prepared. Starts at L4. Caster level = `½ ranger level`. Minimum Wis 11.
- **Woodland stride** — same as druid's, gained later.
- **Swift tracker (Ex)** — full normal speed while following tracks (`−10` to Survival check instead of normal `−20` at full speed; double speed at `−20` rather than the normal `−40`).
- **Evasion (Ex)** — same as monk's; only while in light or no armor.
- **Combat style mastery (Ex)** — additional bonus feat in the chosen style, prerequisites ignored, only effective in light/no armor.
- **Camouflage (Ex)** — can Hide in any natural terrain even when it provides no cover/concealment.
- **Hide in plain sight (Ex)** — can Hide in natural terrain even while being observed.

## Rogue

- **Sneak attack (Ex)** — extra `+1d6` damage at L1, `+1d6` per **2** rogue levels (max +10d6 at L19). Triggers when **either** of:
  - The target is **denied Dex bonus to AC** (flat-footed, surprised, immobilized, etc.).
  - The rogue is **flanking** the target.
  - For ranged: target must be within **9 m**.
  - Conditions:
    - **Sneak attack dice are NOT multiplied on a crit**, but they *are* applied on a crit hit (added once on top of the multiplied base damage).
    - Target must have discernible vital anatomy: **immune** = oozes, plants, undead, constructs, incorporeal, anything immune to critical hits.
    - **Concealment** of any degree negates sneak attack.
    - Can choose **nonlethal** sneak attack damage at no penalty when using a sap; with a lethal weapon, the normal `−4` to attack for nonlethal applies.
    - Cannot sneak attack a target whose vitals are out of reach.
- **Trapfinding (Ex)** — can use **Search** to find traps with DC > 20 (others cannot). Can use **Disable Device** to disarm magical traps (DC = `25 + spell level`).
- **Evasion (Ex)** — see monk's, same rule.
- **Trap sense (Ex)** — `+1` Reflex vs traps and `+1` dodge AC vs trap attacks, scaling. Stacks across classes with trap sense.
- **Uncanny dodge (Ex)** — same as barbarian's.
- **Improved uncanny dodge (Ex)** — same as barbarian's.
- **Improved evasion** — only if picked as a special ability.
- **Special abilities** — at L10 and every 3 levels thereafter (L13, 16, 19), pick **one**:
  - **Crippling Strike (Ex)** — sneak attacks deal an additional 2 Str damage.
  - **Defensive Roll (Ex)** — 1/day, when reduced to ≤0 HP by a melee hit, attempt Reflex save vs damage; success → half damage. Standard action denial doesn't prevent it (not an attack), but loss of Dex bonus does.
  - **Improved Evasion (Ex)**.
  - **Opportunist (Ex)** — 1/round, attack of opportunity vs a creature just damaged by an ally.
  - **Skill Mastery** — pick `3 + Int mod` skills; can always **take 10** on them even under stress.
  - **Slippery Mind (Ex)** — if affected by an enchantment and the saving throw fails, can attempt a second save 1 round later.
  - **A feat** instead of a special ability.

## Sorcerer

- **Spellcasting** — arcane, **Cha-based**, **spontaneous**. Max spell level 9. Spells-known progression is fixed per the class table (not Cha-dependent); bonus *slots* per day come from Cha.
- **Spell preparation** — none. Cast any known spell using any available slot of appropriate level.
- **Swap on level-up** — at L4 and every even level after (L6, L8, …), may **forget one known spell and replace it** with another of equal or lower level.
- **Familiar** — at L1, see *Familiar* sub-system.
- **Armor & arcane casting** — no proficiency with any armor; armor incurs arcane spell failure for sorcerer spells.

## Wizard

- **Spellcasting** — arcane, **Int-based**, **prepared from spellbook**. Max spell level 9.
- **Scribe Scroll** — bonus feat at L1.
- **Bonus feats** — at L5, 10, 15, 20, choose one feat from: metamagic, item creation, or *Spell Mastery*. Must meet prerequisites.
- **Familiar** — at L1, same sub-system as sorcerer.
- **School specialization** — at L1, choose either *universalist* (no specialty) or a single school of magic. See *School specialization* sub-system.
- **Spellbook** — see [magic.md](magic.md).
- **Armor & arcane casting** — no armor proficiency; arcane spell failure applies as normal.

---

## Familiar (sorcerer / wizard sub-system)

- Cost: **24 hours of ritual + 100 gp of materials**. Choose familiar type from a defined list.
- A familiar is a **magical beast** version of a normal animal; treat as a magical beast for all type-targeting effects, but as the normal-animal species for *speak with animals* etc.
- **Derived stats**:
  - HD = max(master HD, familiar's natural HD).
  - HP = **½ master's HP** (rounded down), excluding temp HP.
  - BAB = master's BAB.
  - Saves: use master's base save or familiar's, whichever is higher. The familiar uses its own ability mods to saves; does not get master's ability bonuses to saves.
  - Skills = master's skill ranks (using familiar's ability mods).
- **Standard abilities** (cumulative, by master level):
  - L1+ : *Alertness* feat granted to master while familiar is within 1.5 m; share spells (master can cast personal spells on familiar within 1.5 m); empathic link (1.5 km, emotions only); improved evasion.
  - L3+ : deliver touch spells.
  - L5+ : speak with master (shared language).
  - L7+ : speak with animals of its kind.
  - L11+ : SR = master level + 5.
  - L13+ : *scry on familiar* 1/day.
- **Per-species bonus** — each familiar type grants a fixed bonus to the master (e.g. raven → +3 Appraise; weasel → +2 Ref saves). Exact pairings in JSON.
- **Loss penalty** — if familiar dies or is dismissed against will: master loses `200 XP per master class level` (Fort DC 15 negates). Voluntary release: no XP loss. Cannot drop below 0 XP. Cannot exit your level (i.e. cannot lose a level from this).
- **Replacement** — 24h ritual + 100 gp, after fasting/meditation. Only 1 familiar at a time.

## Animal companion (druid / ranger sub-system)

- Chosen from a fixed list of base creatures.
- Companion is a **magical beast**. Stats start at the species' base (per Monster Manual / JSON) and improve by druid level (or `½ ranger level`).
- **Per-level adjustments** (cumulative): bonus HD (d8 each, +Con mod), bonus natural armor, +Str/+Dex, **bonus tricks known** beyond the normal Handle Animal limit, and **special abilities** (Link, Share Spells, Evasion, Devotion, Multiattack, Improved Evasion) at increasing levels.
- **Link (Ex)** — master can handle/push the companion as a free action; +4 circumstance on Handle Animal & wild empathy with it.
- **Share spells (Ex)** — master can target the companion with any spell that normally targets self only, when within 1.5 m. Companion can voluntarily refuse.
- **Evasion / Improved evasion** — granted to companion at certain levels.
- **Devotion (Ex)** — `+4` morale to Will saves vs enchantment.
- **Multiattack** — gains *Multiattack* feat free (or `−2` non-primary penalty if not eligible).
- **Alternate lists** — a higher-level druid may choose a stronger creature from an *alternate list* by applying a level adjustment (e.g. a leopard from the L4-or-higher list counts as if the druid were at level `current − 3`). If the adjustment reduces effective level below 1, the creature cannot be chosen.
- **Replacement** — 24-hour ritual after losing a companion (death or release).

## Special mount (paladin sub-system)

- Granted at L5. Standard mount: heavy warhorse for Medium paladin; war pony for Small paladin. DM may approve substitutes (e.g. riding shark for an aquatic paladin).
- Mount is a **magical beast**, not a normal animal.
- **Per-level adjustments**: bonus HD (d10), bonus natural armor, +Str, **Int progression** (mount becomes intelligent and can communicate empathically with paladin).
- **Special abilities** by paladin level: share spells (L5), share saves (mount uses paladin's saves if better), improved evasion, empathic link (1.5 km); later: speed bonus, *command* species like a spell-like ability, spell resistance.
- **Summoning** — full-round action, mount appears for **2 hours per paladin level / day**; can be dismissed/recalled; appears anywhere within sight.
- **Death** — if mount dies, paladin waits **30 days** OR **gains a paladin level** to re-summon, takes `−1` attack and damage in the interim. A re-summoned mount is the same individual returned to life.

## Wild shape (druid sub-system)

- **Su** ability; standard action to change; *not* AoO-provoking. Lasts `1 hour per druid level` or until ended.
- **Form constraints** (unlock at progressively higher druid levels, per JSON):
  - Initial: animal of Small or Medium size.
  - Later: Large, Tiny, Huge sizes added.
  - Later: plant creatures (immune to mind-affecting, paralysis, polymorph, sleep, stun in many cases).
  - Later: elementals (Small/Medium/Large/Huge with separate uses/day).
- Maximum HD of assumed form = druid level.
- The druid must have personally seen the kind of animal.
- **Mechanics of the change** — uses *polymorph* sub-rules:
  - HP and class/feats retained; ability scores become the form's; size changes accordingly.
  - Gain the form's natural attacks, movement modes, extraordinary and supernatural abilities for movement/senses (per polymorph rules in [magic.md](magic.md) once written).
  - Cannot cast spells (no verbal/somatic ability in animal form unless the form can speak). Druid spell-like abilities and supernatural class features remain usable except where shape prevents.
  - Equipment merges into the form (does not function unless the form can use it).
- **Uses/day** progresses by level.

## Turn / rebuke undead (cleric / paladin sub-system)

- **Standard action**, uses Cha mod-based attempts per day = `3 + Cha mod`. Paladin's effective turning level = `paladin level − 3` (begins functional at paladin level 4). Bonus uses from Extra Turning feat.
- Supernatural ability — does **not** provoke an AoO. Cleric must brandish their holy symbol (free); paladins use a holy symbol or just present themselves.
- Affects undead within **18 m (12 sq)**, line of sight, line of effect (line of effect to all targets).
- **Resolution**:
  1. **Turning check** — `d20 + Cha mod` → look up on a fixed table to find the *highest HD* of undead affected.
  2. **Turning damage** — `2d6 + cleric level + Cha mod` total HD of undead are affected, starting with the closest and lowest HD. Skipping more powerful nearby undead is allowed; remainder is wasted if not enough HD remain to affect the next.
- **Affected (turned) undead** flee at full speed for `10 rounds`. They **cower** if cornered. Approaching within **3 m (2 sq)** of a turned undead, OR attacking it in melee, **breaks** the effect for that creature. Ranged attacks or staying ≥ 3 m away do **not** break it.
- **Destruction** — a cleric whose effective turning level is **≥ 2× the undead's HD** destroys them instead of turning.
- **Evil cleric** — **rebukes** (cowed, +2 to attacks vs them while rebuked, lasts 10 rounds) instead of turning; can **command** instead of destroy (mental control: standard action to give a one-action mental command; total HD commanded at one time ≤ cleric level; can release some to command others).
- **Neutral cleric** chooses turning *or* rebuking at 1st level, permanent.
- Some specialty deities flip this for their clerics (e.g. Wee Jas's neutral-good clerics rebuke; St. Cuthbert's lawful-good clerics rebuke; Obad-Hai's clerics turn).
- **Dispel turning** (evil cleric vs good's turning, or vice versa) — make a turning check; if it beats the original turning result, the affected undead are released from the effect. Then the dispelling cleric may rebuke/command them with `2d6 + level + Cha` HD.
- **Bolster undead** (evil cleric, full-round) — choose a target undead; the turning check result becomes added to the target's effective HD vs future turning attempts for **10 rounds**.

## School specialization (wizard sub-system)

See [magic.md](magic.md) for the full schools-of-magic list and the specialist rules.

---

## Cross-references

- [classes.md](classes.md) — class system (HD, BAB, saves, skill points).
- [magic.md](magic.md) — schools, prepared vs spontaneous, spellbook, spell preparation, casting minimums.
- [multiclassing.md](multiclassing.md) — monk and paladin one-way restriction.
- [combat.md](combat.md) — flanking, denied Dex, flat-footed, AoO.
- [feats.md](feats.md) — bonus feats granted by class features.
- [src/data/classes.json](../../src/data/classes.json) — per-class numeric data.

## Sources

- Manuale del Giocatore — pp. 24–57
