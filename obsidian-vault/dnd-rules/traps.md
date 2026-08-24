# Traps

> How a trap is assembled and priced: the element checklist (trigger, reset, bypass, attack-or-save, effect), the detection and disarm DCs, and the CR / cost / Craft formulas used to build one from scratch. The 105 sample traps and every numeric table on this page live in [src/data/traps.json](../../src/data/traps.json).

## The three kinds of trap

| Kind | Base CR | Made with | Detected & disarmed by |
|---|---|---|---|
| **Mechanical** | 0 | Craft (trapmaking) | Anyone (simple), trapfinding only (complex) |
| **Magic device** | 1 | Craft Wondrous Item + the spells | Trapfinding only |
| **Spell** | 1 | Casting the spell (or hiring an NPC) | Trapfinding only |

- **Mechanical** — pits, arrow launchers, falling blocks, blades, flooding rooms. Anything driven by a mechanism.
- **Magic device** — fires off a spell effect when activated, like a wand does.
- **Spell** — a spell that *is* a trap (`fire trap`, `glyph of warding`, `sepia snake sigil`). Always **no reset**, always triggered by its own spell description.

A mechanical base CR of 0 is legal mid-calculation; if the final total lands at 0 or below, keep adding features until it reaches 1.

## Detection and disarming

| Trap | Search DC | Disable Device DC | Who may try |
|---|---|---|---|
| Simple mechanical (snare, tripwire, plain pit) | 20 | set by builder (base 20) | anyone |
| Complex mechanical (pressure plate, weight/air/vibration sensing, door-linked) | 21+ | set by builder | **trapfinding only** |
| Any magic trap | `25 + spell level` | `25 + spell level` | **trapfinding only** |

- The builder picks a mechanical trap's Search and Disable Device DCs freely; both feed the CR and the cost.
- Magic-trap DCs are fixed by the highest-level spell used and affect **neither CR nor cost**.
- Magic traps without a stated save use **DC `10 + spell level × 1.5`**. Spell traps use the normal spell DC: **`10 + spell level + caster's ability modifier`**.

## Elements

Every trap declares: **trigger · reset · Search DC · Disable Device DC · attack bonus / save DC / onset delay · damage or effect · CR**. Bypass and poison are optional.

### Trigger

| Trigger | Behaviour |
|---|---|
| **Location** | Fires when a creature stands in a specific square. A flyer never sets it off. |
| **Proximity** | Fires when a creature comes within range — flyers included. Mechanical versions read air movement, so they only work where the air is otherwise still (crypts). Magic versions normally use `alarm`, whose area may be no larger than the protected area. Special versions key off a detection spell (`detect good` on an evil altar). |
| **Sound** | Magic only. Listens with **+15 Listen**; needs `clairaudience` in the build. Beaten by Move Silently, `silence`, or anything that defeats hearing. |
| **Visual** | Magic only. Sees; needs `arcane eye`, `clairvoyance` or `true seeing`. Fooled by whatever fools that spell (invisibility, disguise, illusion). |
| **Touch** | Fires when touched. Simplest to build. The magic version is `alarm` shrunk down to the trigger spot. |
| **Timed** | Fires on an interval. |
| **Spell** | Spell traps only; the spell's own description sets the conditions. |

**Visual trigger by spell:**

| Spell | Sight range | Spot bonus |
|---|---|---|
| `arcane eye` | Line of sight, unlimited | +20 |
| `clairvoyance` | One preselected spot | +15 |
| `true seeing` | Line of sight up to 120 ft. | +30 |

A visual trigger is blind in the dark unless it uses `true seeing` or has `darkvision` added (which caps its dark sight at 60 ft.).

### Reset

| Reset | Meaning |
|---|---|
| **No reset** | One shot. Rebuilding is the only way back. All spell traps. |
| **Repair** | Must be repaired first. |
| **Manual** | Someone puts the parts back — the default for mechanical traps. Usually about a minute. |
| **Automatic** | Resets itself, immediately or after an interval. |

**Repairing** a mechanical trap: Craft (trapmaking) against the same DC as building it, raw materials costing **one-fifth of market price**, build time recalculated from that materials cost.

### Bypass (optional)

A way for the builder to walk past their own trap. Mechanical traps only in practice — spell traps normally exempt their caster.

| Bypass | Requirement |
|---|---|
| **Lock** | Open Lock DC 30 |
| **Hidden switch** | Search DC 25 |
| **Hidden lock** | Search DC 25 *and* Open Lock DC 30 |

### Attack or save

A trap normally does one or the other; occasionally both, occasionally neither.

- **Attack traps** (ranged or melee) roll a normal attack with a builder-set bonus. A ranged trap can simulate a composite bow's strength rating for a flat damage bonus; a melee trap can carry a built-in damage bonus the same way.
- **Save traps** (pits and other save-dependent designs) set a Reflex DC and no attack roll.
- **Never miss** — no attack, no save, guaranteed damage (the wall closes on you). Always paired with an onset delay.

### Damage / effect

- **Pit** — `1d6` per 10 ft. of depth.
- **Ranged attack** — whatever the ammunition deals, plus any strength rating.
- **Melee attack** — whatever the weapon deals; a falling block deals any bludgeoning amount you like, remembering that resetting means lifting it back.
- **Spell trap / magic device** — the spell's own effect and DC.
- **Special** — drowning, ability damage from poison, and other one-offs, set by the builder.

## Pits

The most common mechanical trap and the one with the most sub-rules.

- **Uncovered** pits mostly deter and complicate a melee. **Covered** pits are the dangerous kind. **Chasms** are the large-scale version. All three can be beaten with Climb, Jump, or magic.
- A covered pit is found on a **DC 20 Search**, but only by someone deliberately examining the floor before crossing it. Failing that, a **DC 20 Reflex** still avoids the fall — *unless* the victim was running or moving recklessly, in which case there is no save at all.
- Coverings run from piled refuse to a proper concealed trapdoor. A trapdoor usually gives way at **50–80 lb**. Spring-shut trapdoors can lock the victim in; holding one open takes a **DC 13 Strength** check.
- **Pit spikes** — treated as daggers at **+10 attack**, damage bonus **+1 per 10 ft. of depth to a maximum of +5**, and **1d4 spikes attack each falling victim**. Spike damage is on top of fall damage and **does not count toward the trap's average damage** for CR purposes.
- Anything else at the bottom (acid, lava, a monster, a second trap) is treated as a **separate trap** with a location trigger that fires on impact.

## Miscellaneous features

| Feature | Effect |
|---|---|
| **Alchemical item** | Tanglefoot bags, alchemist's fire, thunderstones. If it mimics a spell, CR rises by that spell's level. |
| **Gas** | Inhaled poison. Almost always never-miss with an onset delay. |
| **Liquid** | Drowning. Almost always never-miss with an onset delay. |
| **Multiple target** | Catches more than one character. |
| **Never miss** | No attack roll, no save; mandatory onset delay. |
| **Onset delay** | Rounds between springing and taking effect. Shorter delay = higher CR. |
| **Poison** | **Injury, contact and inhaled only — ingested poisons cannot be used.** Each poison has its own CR modifier. |
| **Pit spikes** | See above. |
| **Touch attack** | Any trap that only needs a touch attack to land. |

## Challenge Rating

Add every applicable modifier to the base CR for the trap type.

### Mechanical CR modifiers

| Feature | Band | CR |
|---|---|---|
| **Search DC** | ≤15 / 16–24 / 25–29 / 30+ | −1 / — / +1 / +2 |
| **Disable Device DC** | ≤15 / 16–24 / 25–29 / 30+ | −1 / — / +1 / +2 |
| **Reflex save DC** (save-dependent traps) | ≤15 / 16–24 / 25–29 / 30+ | −1 / — / +1 / +2 |
| **Attack bonus** | ≤+0 / +1–+5 / +6–+14 / +15–+19 / +20–+24 | −2 / −1 / — / +1 / +2 |
| **Average damage** | per 7 points | +1 |
| Alchemical device | — | level of the spell mimicked |
| Liquid | — | +5 |
| Multiple target | — | +1 (0 if never miss) |
| Onset delay | 1 / 2 / 3 / 4+ rounds | +3 / +2 / +1 / −1 |
| Pit spikes | — | +1 |
| Touch attack | — | +1 |

**Poison CR modifiers:** bloodroot, blue whinnis, greenblood oil, black adder venom, small centipede poison **+1** · medium spider venom **+2** · giant wasp poison, large scorpion venom, malyss root paste, sassone leaf residue, shadow essence, ungol dust **+3** · insanity mist, nitharit, purple worm poison **+4** · deathblade, terinav root, wyvern poison **+5** · burnt othur fumes, dragon bile **+6** · black lotus extract **+8**.

### Magic CR modifiers

Base CR 1, then **whichever is larger — never both**:

- the **level of the highest-level spell** used, or
- **+1 per 7 points of average damage per round**.

### Average damage

Take the average damage of a successful hit and round to the **nearest multiple of 7** (round up on an exact tie). Damage from a strength rating and from extra attacks counts; **poison and pit spikes do not**.

### Multiple traps

Two or more connected traps covering roughly the same area are rated separately first.

- **Dependent** (avoiding the first avoids the second): keep them as separate traps.
- **Independent** (neither needs the other): combine their CRs the way monster CRs combine into an Encounter Level; that EL is the combined CR.

## Cost

### Mechanical

```
final = (modified base cost × CR) + poison / alchemical extras
base  = 1,000 gp
floor = CR × 100 gp
```

Apply every modifier below to the 1,000 gp base *before* multiplying by CR. **If the trap has automatic reset, multiply the whole thing by 20** — and multiply any poison or alchemical cost by 20 as well, to stock enough doses.

| Feature | Cost modifier |
|---|---|
| Trigger: location / touch | — |
| Trigger: touch (attached) | −100 gp |
| Trigger: proximity / timed | +1,000 gp |
| Reset: no | −500 gp |
| Reset: repair | −200 gp |
| Reset: manual | — |
| Reset: automatic | +500 gp (0 with a timed trigger) |
| Bypass: lock / hidden switch / hidden lock | +100 / +200 / +300 gp |
| Search DC below 20 / 20 / above 20 | `−100 × (20 − DC)` / — / `+200 × (DC − 20)` |
| Disable Device DC below 20 / 20 / above 20 | `−100 × (20 − DC)` / — / `+200 × (DC − 20)` |
| Reflex DC below 20 / 20 / above 20 | `−100 × (20 − DC)` / — / `+300 × (DC − 20)` |
| Attack bonus below +10 / +10 / above +10 | `−100 × (10 − bonus)` / — / `+200 × (bonus − 10)` |
| Ranged strength rating | `+100 gp × bonus` (max +4) |
| Melee Strength bonus | `+100 gp × bonus` (max +8) |
| Never miss | +1,000 gp |
| Poison / alchemical item | its own cost |

### Magic device

Costs gp **and** XP, and needs a caster. Pay for **every** spell in the build — trigger spells included. `alarm` used as a trigger is free unless an NPC must cast it.

| | Per spell | Material components | XP components |
|---|---|---|---|
| **One-shot** | `50 gp × CL × SL` + `4 XP × CL × SL` | full cost | total × 5 gp |
| **Automatic reset** | `500 gp × CL × SL` + `40 XP × CL × SL` | cost × 100 gp | total × 500 gp |

Build time: **1 day per 500 gp** of cost.

### Spell trap

Free, unless an NPC spellcaster has to be hired.

### Multiple traps

Price each component trap separately and add the results — for both dependent and independent combinations.

## Craft (trapmaking) DCs

| Trap CR | Base DC |
|---|---|
| 1–3 | 20 |
| 4–6 | 25 |
| 7–10 | 30 |

Modifiers: **proximity trigger +5**, **automatic reset +5**. Progress is one Craft check per week; see [skills-detail.md](skills-detail.md) for the Craft procedure.

## Data in the app

[src/data/traps.json](../../src/data/traps.json) carries both halves of this page:

- **`traps`** — 105 sample traps, CR 1–10, each with `ref`, `cr`, `type`, `trigger`, `reset`, `bypass`, `searchDC`, `disableDeviceDC`, `attacks`, `save`, `pit`, `poison`, `spellEffects`, `effect`, `multipleTargets`, `multipleTraps`, `neverMiss`, `onsetDelayRounds`, `gas`/`liquid`, `cost`, `note`, and a derived **`footprint`** (`single` · `squares` · `area` · `room` · `burst` · `multi`, with square counts) intended to drive the board diagram.
- **`tables`** — the generator side: trigger/reset/bypass enums, visual-trigger spells, pit and spike constants, `crModifiers` (mechanical bands, poison list, magic rule), `costModifiers`, and `craftDC`.

That covers both routes the trap generator could take — pick a sample by CR from `traps`, or compose one from `tables` — as described in [feature_backlog.md](../docs/feature_backlog.md) item 4.

## Related

- [skills-detail.md](skills-detail.md) — Search, Disable Device, Open Lock, Craft procedures.
- [class-features.md](class-features.md) — trapfinding and trap sense.
- [saving-throws.md](saving-throws.md) — Reflex resolution.
- [magic-items.md](magic-items.md) — Craft Wondrous Item and the general item-creation cost model.
- [objects.md](objects.md) — hardness and HP if the trap mechanism itself is attacked.
