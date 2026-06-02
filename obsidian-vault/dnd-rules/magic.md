# Magic

> Overarching spellcasting rules: casting ability, preparation vs spontaneous, schools, spellbook, spell description anatomy, combining magical effects, arcane vs divine procedures.

## Arcane vs divine

- **Arcane** spells: cast by **sorcerer, wizard, bard**. Manipulate raw magical energy directly. Tend toward flashy effects (force, fire, cold, lightning, transformation).
- **Divine** spells: cast by **cleric, druid, paladin, ranger** (and similar). Drawn from a divine source (deity, nature, principle). Tend toward healing, protection, and less destructive effects.
- Mechanics are the same — only the source, the preparation procedure, and (sometimes) the spell list differ.

## Casting ability

| Class | Ability |
|---|---|
| Wizard | Intelligence |
| Cleric, Druid, Paladin, Ranger | Wisdom |
| Sorcerer, Bard | Charisma |

### Minimum casting ability

- To cast a spell of level **L**, the casting ability score must be ≥ `10 + L`.
- Examples: Int 11 to cast 1st-level wizard spells, Int 14 for 4th-level, Int 19 for 9th-level.
- Casting ability **≤ 9**: cannot cast any spells from that class.
- If casting ability drops below `10 + L` (e.g. *ray of enfeeblement*), spells of level L and higher become uncastable until the score recovers; lower-level spells remain castable.

### Spell save DC

- `DC = 10 + spell level + casting ability mod`
- For spells from a class other than the caster's primary: use the caster's casting ability for **that** class.

### Bonus spells per day

- `bonus spells at level L = floor((mod − L) / 4) + 1` if `mod ≥ L`, otherwise **0**.
- 0-level spells (cantrips/orisons) **never** receive bonus spells.
- Bonus spells stack with the class base spells/day grid.
- Multiclass casters compute bonus spells separately for each casting class.

## Reading class spells-per-day tables

- **"—"** = the class cannot cast spells of that level at this class level (no bonus spells either).
- **"0"** = the class has access to that spell level but only via bonus spells (need sufficient casting ability).
- A caster may always prepare/cast a **lower-level spell in a higher-level slot**.
- Hybrid casters (paladin, ranger): caster level = `floor(class level / 2)`, spellcasting begins at class level 4.

## Prepared vs spontaneous casting

| Class | Style | Source list | Daily prep |
|---|---|---|---|
| Wizard | Prepared | Spellbook | 1 h study |
| Cleric | Prepared | Full cleric list (+ 1 domain spell/level) | 1 h prayer at fixed time of day |
| Druid | Prepared | Full druid list | 1 h communion at fixed time of day |
| Paladin | Prepared | Paladin list | 1 h, starts at L4 |
| Ranger | Prepared | Ranger list | 1 h, starts at L4 |
| Sorcerer | Spontaneous | Spells known | 15 min concentration |
| Bard | Spontaneous | Spells known | 15 min performance/concentration |

- **Prepared** — fix specific spells in specific slots once per day; cast spells leave slots empty until next preparation.
- **Spontaneous** — any slot of the right level can hold any known spell of that level (or lower).

### Spontaneous swap (cleric / druid)

- A cleric may sacrifice any prepared (non-domain) spell of level L to spontaneously cast a **cure** (good cleric) or **inflict** (evil) spell of level ≤ L.
- A neutral cleric chooses cure or inflict at character creation (permanent).
- Druid: spontaneously casts **summon nature's ally** of level ≤ L by sacrificing any prepared spell of level L.
- Spontaneous swap of a prepared metamagicked spell uses the higher slot and the spontaneous spell inherits the metamagic; casting time follows the spontaneous-caster rule (one step longer). See [metamagic.md](metamagic.md).

## Daily preparation procedure

### Wizard preparation

- Requires **8 hours rest** preceding (sleep / non-strenuous trance for elves at 4 h trance + 4 h light activity).
- After rest: **1 hour** of uninterrupted study with the spellbook in a calm environment (no luxury required, but no major distractions, no combat damage during prep).
- The wizard chooses which spells to fill which slots; can leave slots empty.
- **Empty slots can be filled later** with **15 minutes** of preparation per spell level; same study/spellbook requirement.
- **Recently-cast limit**: spells cast in the **last 8 hours** count toward the day's slot limit (i.e. you can't cast all your spells, sleep 4 h, and re-prepare them — anything cast within the last 8 h still occupies that slot for refill purposes).
- **Read magic** is the one spell a wizard can prepare without their spellbook present.
- **Interrupted rest**: every interruption forces an additional hour of rest before the wizard regains the clear mind needed to prepare.
- Death wipes prepared spells (revival via *raise dead*/*resurrection*/*true resurrection* recovers the lost slots).

### Sorcerer / bard preparation

- 8 h rest + **15 min** of concentration (bard often a song or recital).
- No book; the caster fills their daily allotment of slots from their fixed Spells Known list.
- Recently-cast 8-h limit applies the same way.

### Divine preparation (cleric, druid, paladin, ranger)

- 8 h rest + 1 h prayer/communion at a **fixed time of day** set by the deity / faith / order:
  - Pelor (sun): dawn.
  - Boccob: midnight.
  - Druids: any time but consistent.
  - Evil deities: typically night.
- Missed window → wait until next day's window.
- Cleric also gains **bonus domain spells** (1 extra prepared slot per spell level, restricted to a spell from one of their two domains; see [class-features.md](class-features.md)).

## Concentration in combat

Casting requires concentration; many things can disrupt it. On disruption, **Concentration check** vs DC; failure = spell lost.

| Disruption | DC |
|---|---|
| Damaged while casting (attacks, AoOs) | 10 + damage + spell level |
| Continuous damage (e.g. *acid arrow* persisting) | 10 + ½ continuous damage + spell level |
| Distracting spell (caught in a hostile spell that doesn't deal damage) | distracting spell's save DC |
| Grappling or pinned | 10 + spell level (also, can only cast spells without S components) |
| Vigorous motion (riding a fast mount, on a moving wagon, on a small boat in rough water) | 10 + spell level |
| Violent motion (galloping mount, storm-tossed ship, earthquake) | 15 + spell level |
| Rough weather (driving rain, sleet) | 5 + spell level |
| Severe weather (hail, storm) | 10 + spell level |
| Entangled (in net, *entangle*, *bigby's grasping hand*, etc.) | 15 + spell level |
| Casting on the defensive (avoiding AoO from threatener) | 15 + spell level |
| Maintaining a concentration-duration spell while casting another | 15 + the active spell's level |

- Disturbed mid-cast on a 1-round or longer spell: a Concentration check is required at each disruption; failure = spell wasted.
- See also [combat.md](combat.md) for action types around casting.

## Spell failure (other than ASF)

- Casting requirements not met (no V because silenced, no free hand for S, no required M/F): spell fails, slot consumed.
- Wrong target type (e.g. *charm person* on a dog — dogs aren't humanoids): spell fails, slot consumed.
- Concentration broken: spell wasted (see above).
- **Arcane spell failure (ASF)** — see [equipment.md](equipment.md). Only arcane spells with a somatic component, when caster wears armor or carries a shield without proficiency exception.

## Counterspelling

- Possible against any spell, divine or arcane.
- See dedicated file: [counterspelling.md](counterspelling.md).

## Result of a spell

- The caster identifies which creatures or area are affected; eligible targets make saving throws (if any).
- Spells with the **mind-affecting** descriptor only work on creatures with **Int ≥ 1**.
- Spells affect the wielder/caster on a `[Personal]` range or `[Target: caster]`.
- Spells with no clear LoS / no LoE to the target fail.
- A creature **denied a save** by a spell still applies any spell resistance it has.

### Attacks

- An "attack" in spell text = any hostile action: damaging spells, ones that disable (*hold person*), turning/rebuking undead, *charm* (if hostile), spells that unequip/displace (*disarm*, push). Spells like *summon monster* themselves are not attacks (the summoned creature attacking is, however).

### Bringing the dead back

- *Raise dead*, *resurrection*, *true resurrection* return a slain character.
- The soul must be **willing**; cannot be returned against its will.
- **Level loss**: the revived character loses **1 character level** (or 1 Constitution if revived at level 1). New XP total = midpoint between min XP for new (lower) level and min XP for the prior level.
- **Hindering revival**: holding the body, casting *trap the soul*, etc. prevents revival.

## Combining magical effects

The default rule is "**all effects work as written**, simultaneously." Many specific overrides exist:

### Bonus stacking

| Bonus relationship | Stack? |
|---|---|
| Two **same-named** bonus types (both "enhancement bonus to Str") | **No** — take the higher only. |
| Two **different** bonus types (enhancement + morale) | **Yes** — sum. |
| **Dodge** bonuses with each other | **Yes** — special, dodges always stack. |
| **Circumstance** bonuses from genuinely different circumstances | **Yes**. |
| **Unnamed** bonus (just "+2 to") with a named bonus | **Yes**. |
| Penalties of any kind from different sources | **Yes** — sum (an exception to the bonus rule). |

### Same effect at different strengths

- *Bull's strength* (+4 enhancement Str) and *bear's endurance* (+4 enhancement Con): different scores, both apply.
- *Ray of enfeeblement* (-4 Str) and another *ray of enfeeblement* (-6 Str): only the worse penalty applies.
- *Bull's strength* (+4) and *girdle of giant strength* (+4 enhancement to Str): same bonus type, same score → don't stack, take higher.

### Same spell, different effects

- Some spells offer multiple effects via a sequence (*polymorph any object*). Repeated casting layers them: the latest applies; earlier layered effects cancel.
- *Stoneskin* + new *stoneskin* on the same target → only one is active; the older is dismissed.

### Multiple mind controls

- Subject obeys all controllers to the maximum degree consistent. If commands conflict, controllers make **opposed Cha checks** to determine which command the subject follows.
- One mind-control over another can supersede if it explicitly removes the prior (e.g. *break enchantment*).
- A creature already under *charm* can also receive a *suggestion*; the *suggestion* takes precedence for compatible commands.

### Opposed effects

- Two spells with explicitly opposed effects (e.g. *haste* vs *slow*) **negate each other** within the overlapping target/area.
- *Slow* on a hasted creature → both effects end on that creature.

### Instantaneous effects

- Effects with duration *instantaneous* are **always cumulative** across multiple sources (e.g. multiple *cure light wounds* on the same target each restore HP independently; multiple *fireball* damage instances each apply).

### Different bonus names from different spells

- *Bless* (+1 morale to attacks; +1 resistance to fear saves) and *protection from evil* (+2 resistance to evil-source saves) → both apply; different bonus types.

## Spell description anatomy

Every spell entry in [src/data/spells.json](../../src/data/spells.json) is structured the same way. The schema:

### Name

- The spell's common name (1st line).

### School (subschool) [Descriptor]

- One of the 8 schools (or **Universal**); some spells specify a subschool (e.g. Conjuration[Summoning], Illusion[Glamer]).
- Descriptors in brackets indicate elemental or thematic categories the spell belongs to; descriptors govern how the spell interacts with other spells, special abilities, immunities/resistances, and creature alignment.
- Standard descriptors: **acid, air, chaotic, cold, darkness, death, earth, electricity, evil, fear, fire, force, good, language-dependent, lawful, light, mind-affecting, sonic, water**.
- A **language-dependent** spell only works on a target that understands the spoken language used.
- A **mind-affecting** spell only works on creatures with **Int ≥ 1**.

### Level

- Per-class level the spell occupies, abbreviated:
  - **Brd** (bard), **Chr** (cleric — Italian Chierico), **Drd** (druid), **Mag** (wizard — Italian Mago), **Pal** (paladin), **Rgr** (ranger), **Str** (sorcerer — Italian Stregone).
- Cleric domains listed separately (e.g. `Fuoco 3` = 3rd-level Fire-domain spell).
- Domain spells, when prepared in the bonus domain slot, use the highest applicable level for their save DC.

### Components

- **V** verbal — must speak audibly. Silenced or unable to speak → cannot cast. Deafened: 20% chance to fail any V-component spell on each cast.
- **S** somatic — needs at least one free hand. Cannot be cast while grappling/pinned/with both hands occupied.
- **M** material — physical substance consumed in the cast; tracked only if the cost is non-trivial. Standard spell-component pouch covers all M components without listed cost.
- **F** focus — non-consumed item required during casting. Standard pouch covers focuses without listed cost.
- **DF** divine focus — a holy symbol (good clerics) or unholy symbol (evil clerics) or specific natural object (druids: mistletoe / holly).
- **XP** — XP must be spent on the casting; cannot drop below the XP required for current level.
- **Suffix tags** in spell list entries:
  - `m` after spell name = costly material component (not in pouch — must be tracked).
  - `f` = costly focus (must be tracked).
  - `x` = XP component.

See [spell-components.md](spell-components.md) for full rules.

### Casting time

- Most spells: **1 standard action**.
- Some: 1 round, 1 minute, longer.
- A few: **1 free action** (e.g. *feather fall*) — can be cast even when not your turn (rules-as-written exception); does not provoke AoO; only one free-action spell per round.
- 1-round-cast spells: full-round action that completes at the start of the **caster's next turn** (provokes AoO at start; caster does not threaten any squares during the cast).

### Range

- **Personal** — affects only the caster.
- **Touch** — touch attack to deliver; can hold the charge across rounds (see [combat.md](combat.md) → touch spells).
- **Close** — `7.5 m + 1.5 m per 2 caster levels` (i.e. 9 m at L2, 10.5 m at L4, 12 m at L6, …).
- **Medium** — `30 m + 3 m per caster level`.
- **Long** — `120 m + 12 m per caster level`.
- **Unlimited** — anywhere on the same plane.
- **Range expressed in meters** — fixed range from the spell description.

### Target / Effect / Area

Spells specify what they affect:

- **Target(s)** — specific creature(s) or object(s). The caster must see or touch each target.
- **Effect** — the spell creates a separate thing (e.g. *summon monster I* creates a creature; *wall of fire* creates a wall).
- **Area** — the spell affects everything in the area:
  - **Burst** — radiates from a point in all directions; affects all in radius (including non-visible if line of effect exists).
  - **Emanation** — like burst but the area persists for the spell's duration, radiating from the source point.
  - **Spread** — like burst but bends around corners (no line of effect needed past the source).
  - **Cone** — from a corner of caster's square in a quarter-circle; widens as it extends.
  - **Cylinder** — circle on the ground, then extends upward.
  - **Line** — straight line from caster's square to a corner of a square at max range; affects all squares the line crosses.
  - **Sphere** — radiates from a designated point (caster doesn't have to be the center).
- **Creatures** vs **Objects**: spells targeting creatures don't affect objects unless specified, and vice versa.
- An effect with a **Formable (F)** tag (after Area or Effect): the caster shapes the area within constraints (cubes typically, no dimension < 3 m).

### Line of effect

- A clear path from the spell's origin to the target. **Like line of sight but blocked only by solid barriers**, not by darkness/fog/concealment.
- Required for any spell to take effect on a target or to designate an area's origin.
- A wall of stone with a fist-sized hole (≥ 9 dm²) does NOT block line of effect through the hole.

### Aiming a spell

- The caster picks the target/area when casting. For a spell with multiple bursts (*magic missile*), choose targets at cast time.
- For a spell with a "self-only" range, the caster is automatically the only target.

### Duration

- **Timed** — rounds/minutes/hours. When time expires, the magic ends.
- **Instantaneous** — one-shot effect; consequences may persist (e.g. *cure light wounds* heals; the HP returns are permanent).
- **Permanent** — magic remains until *dispel magic* removes it.
- **Concentration** — lasts as long as the caster concentrates (standard action per round to maintain; doesn't provoke AoO).
- **Concentration + N rounds after** — concentrating extends the effect by up to that many rounds beyond when concentration ends.
- **Subjects, Effects, Areas** — duration covers what the spell description names.
- **(D)** suffix on duration = caster may **dismiss** the spell as a standard action (no V, no AoO).
- **(I)** suffix on duration = caster may interrupt/discharge the effect at will (e.g. *spiritual weapon* may be redirected as a move action).
- **Discharge**: spells like touch attacks remain "held" until discharged; once delivered, the magic ends.

### Saving throw

- **Negates** — successful save = spell has no effect.
- **Partial** — successful save = some effect still occurs (e.g. half damage, partial paralysis).
- **None** — no save allowed.
- **Half** — successful save = half damage (typical of damaging area spells).
- **Disbelief** — saver gets to recognize the illusion (Will save).
- **(object)** — save applies to objects (uses bearer's save if attended; auto-fail if unattended).
- **(harmless)** — beneficial spell; subject may voluntarily forgo the save.
- DC = `10 + spell level + casting ability mod`.
- Voluntary failure: a creature with magic resistance (e.g. SR or special quality like elf vs *sleep*) may suppress it as a standard action to receive a beneficial spell.
- See [saving-throws.md](saving-throws.md).

### Spell resistance

- Lists **Yes / No / Yes (harmless) / Yes (object)**.
- See [spell-resistance.md](spell-resistance.md).

### Descriptive text

- Full spell description: behavior, special rules, "see text" pointers.

## Caster level interactions

- Many spell effects (damage dice, range, duration, number of targets) scale with **caster level**.
- Caster level = the casting class level. Items used by non-classed creatures: caster level = HD.
- Some spells specify a **maximum scaling** (e.g. *fireball* caps at 10d6 at caster level 10+).
- A caster may **deliberately cast at a lower caster level** (down to the minimum the spell requires); the spell uses the lower level for all level-dependent variables. Useful for: counterspelling rules, dispel checks, etc.
- A class feature that grants spells "as if of higher caster level" applies to **caster level-dependent variables** (damage, duration, range, dispel checks) but **not** to other class abilities.

## Spell list conventions

- **Hit Dice** is synonymous with character level for "creatures with up to N HD" effects (e.g. *charm person* on creatures with up to 4 HD). Creatures with only racial HD use those HD.
- **Caster level** in a spell list always means the caster's class level (or HD for non-classed creatures).
- **"Creature"** and **"character"** are synonyms in spell text.
- Conditions referenced in spells (blinded, paralyzed, stunned, etc.) follow [conditions.md](conditions.md).
- **Spell series**: some spells reference a base (e.g. *cure light wounds* is the base for all *cure* spells). Derivative entries list only the differences from the base; shared header info is not repeated.

## Schools of magic

There are **8 schools** plus a non-school category. Each spell belongs to exactly one school (sometimes a subschool).

- **Abjuration** — protection, banishment, dismissal, magical barriers. Common spells: *protection from evil*, *dispel magic*, *antimagic field*. Note: an active abjuration creates magical "interference" detectable as a low-level disturbance (*detect magic*).
- **Conjuration** — moves matter or energy. **Subschools**:
  - *Calling*: brings a creature from another plane (the creature is real; if killed, dies).
  - *Creation*: makes a brand-new object/creature from magic.
  - *Healing*: restores HP and conditions (divine variants).
  - *Summoning*: creates a temporary copy of a creature from another plane (if killed, vanishes; reforms after 24 h on home plane, not destroyed).
  - *Teleportation*: moves caster/subject through the Astral Plane.
- **Divination** — reveals information. Subschool *Scrying* creates an invisible magical sensor that lets the caster see/hear remotely.
- **Enchantment** — affects the mind. Subschools:
  - *Charm*: makes the subject view the caster as a friend.
  - *Compulsion*: directly compels actions. All enchantments are mind-affecting (Int ≥ 1, not undead/constructs/oozes/plants/elementals/vermin).
- **Evocation** — manipulates raw magical energy to produce damage, force, etc.
- **Illusion** — false sensory information. Subschools:
  - *Figment* — false image generated from caster's mind only; others perceive it as the caster intends.
  - *Glamer* — alters how an existing object/creature is perceived.
  - *Pattern* — moving image with a real (mental) effect on viewers.
  - *Phantasm* — mental image only the targets perceive (others see nothing).
  - *Shadow* — partly real, drawn from the Plane of Shadow; can have real effects.
  - Disbelief: a successful Will save lets the perceiver recognize the illusion (figment/glamer become translucent; phantasm vanishes for them; shadow effects deal reduced damage).
- **Necromancy** — manipulates life force, death, and undead.
- **Transmutation** — alters physical properties of creatures or objects.
- **Universal** — *not a school*. A small set of spells (e.g. *prestidigitation*, *permanency*, *limited wish*, *wish*, *arcane mark*) that belong to no school. Always learnable; cannot be specialty or prohibited.

## Wizard specialization (specialist wizards)

- At L1, a wizard chooses one **specialty school** (or remains *universalist*).
- Choosing a specialty also requires **prohibiting 2 other schools** — only **1** prohibition if the specialty is **Divination** (cannot prohibit Divination as a banned school).
- **Specialty effects**:
  - +1 specialty spell slot at every spell level (1st through 9th); **must hold a spell of the specialty school**.
  - `+2` Spellcraft when learning specialty-school spells.
- **Prohibition effects**:
  - Cannot **learn or cast** spells of prohibited schools — including via scrolls or wands. Cannot prepare them, copy them, or scribe them.
- Specialty/prohibition choices are **permanent**.
- Universal spells are unaffected.

Specialist names: abjurer, conjurer, diviner, enchanter, evoker, illusionist, necromancer, transmuter.

## Wizard's spellbook

### Initial contents
- All 0-level spells (except prohibited schools).
- 3 1st-level spells of choice (any allowed school).
- 1 additional 1st-level spell per +1 Int mod (creation bonus).

### Adding spells
- **Free on level-up**: 2 spells of any level the wizard can cast, added to the book at no cost.
- **Copying from another wizard's book or a scroll**:
  1. Decipher the writing — Spellcraft DC `15 + spell level` (1 day study). *Read magic* auto-deciphers without check.
  2. Once deciphered, transcribe into own book — same Spellcraft DC at the moment of transcription. Failure means cannot retry that source until next day; the source remains intact (scroll consumed if transcribed; book intact).
  3. Scribing cost: **100 gp per page** (special inks). Spell takes **pages = spell level** (cantrip = 1 page); takes **24 hours per page**.
  4. Specialist wizards get +2 Spellcraft when transcribing a spell from their specialty school; cannot transcribe prohibited schools at all.
- **Independent research** — invent a new spell from scratch. Time + gp investment per DM (rules in DM's Guide).
- **Lost spellbook** — only *read magic* prepareable until the book is recovered or replaced.
- **Replacement**: copy from a backup spellbook in the same way (1 day study + Spellcraft check + 100 gp/page); no need to re-decipher own writing if the wizard previously prepared from it.
- **Selling** spellbooks: half the cost of writing the contents (so 100 pages of spells = 5,000 gp).

## Sorcerer / bard spells known

- Fixed list per class level (Tables 3-17 / 3-18).
- New level → gain spells per the table; choose from the appropriate class spell list.
- Sorcerers/bards may **swap one previously-known spell** for another at certain class levels (per class description).
- High Cha provides bonus spells (additional slots), but no extra spells **known**.

## Divine scribing and research

- Divine spells are scribed/deciphered just like arcane (Spellcraft DC 15 + spell level).
- Only the **caster of a divine scroll** may transcribe it for use; written spells revert to divine form after deciphering by anyone, but only divine casters with that spell on their class list may then cast.
- New divine spell research: same procedure as arcane research; some clerics share with their faith, others guard them.

## Cross-references

- [spell-components.md](spell-components.md) — V/S/M/F/DF/XP details, suffix codes.
- [spell-resistance.md](spell-resistance.md) — caster level check vs SR.
- [counterspelling.md](counterspelling.md) — readying, identification, *dispel magic* counter.
- [metamagic.md](metamagic.md) — slot adjustment, prep timing, casting time differences.
- [special-abilities.md](special-abilities.md) — Sp / Su / Ex / Natural categorization.
- [class-features.md](class-features.md) — domain spells, spontaneous swap, familiar, animal companion.
- [combat.md](combat.md) — touch spells, AoO from casting, defensive casting.
- [conditions.md](conditions.md) — referenced statuses (blinded, paralyzed, etc.).
- [saving-throws.md](saving-throws.md) — save DC, save effects.
- [equipment.md](equipment.md) — ASF table.
- [magic-items.md](magic-items.md) — scrolls, wands, potions; metamagic at item creation.
- [src/data/spells.json](../../src/data/spells.json) — per-spell data.

## Sources

- Manuale del Giocatore — pp. 8–10, 23, 32, 43–44, 55–56
- Manuale del Giocatore — pp. 169–183 (casting, concentration, counterspelling, spell description anatomy, schools, wizard prep, sorcerer/bard prep, divine prep, scribing, combining effects, raise dead level loss, spell suffixes, HD/caster level conventions)
