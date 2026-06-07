# Familiar

> Sorcerer / wizard familiar sub-system: how a familiar is obtained, how its statistics are derived from the master, how it advances with the master's level (natural armor, Intelligence, special abilities), and the familiar creature list with each one's per-species bonus to the master. Per-creature base stat blocks live in [src/data/animals.json](../../src/data/animals.json).

A **familiar** is a normal animal that gains new powers and **becomes a magical beast** when summoned to service by a sorcerer or wizard. It retains the **appearance, Hit Dice, base attack bonus, base save bonuses, skills, and feats** of the normal animal it once was, but it is **treated as a magical beast** (not an animal) for the purpose of any effect that depends on its type.

Only a **normal, unmodified animal** may become a familiar. An animal companion **cannot** also function as a familiar.

> **Type difference vs. the animal companion.** The familiar *becomes a magical beast*; the druid/ranger **animal companion keeps its own type** (animal). Because the familiar is a magical beast, *share spells* still works on it via the explicit type exception below. (See [animal-companion.md](animal-companion.md) for the companion sub-system.)

---

## Obtaining a familiar

- **Cost:** **24 hours** of work + magical materials worth **100 gp**.
- The sorcerer/wizard **chooses the kind** of familiar from the list below.
- A character with **more than one class that grants a familiar** may have only **one familiar at a time**.
- The granted **special abilities apply only while master and familiar are within 1 mile** of each other.

---

## Effective level

All level-dependent familiar abilities key off the master's **combined level in classes that grant familiars** — levels from different familiar-granting classes **stack** for this purpose (e.g. Sorcerer 3 / Wizard 2 → master level 5 for familiar abilities).

---

## Familiar basics

Use the **base statistics for a creature of the familiar's kind** (from [src/data/animals.json](../../src/data/animals.json)), then make the following changes:

- **Hit Dice** — for effects related to number of Hit Dice, use the **master's character level** or the **familiar's normal HD total**, whichever is **higher**.
- **Hit Points** — the familiar has **one-half the master's total hit points** (not including temporary hit points), **rounded down**, regardless of its actual Hit Dice.
- **Attacks** — use the **master's base attack bonus** (from all his classes). Use the familiar's **Dexterity or Strength modifier, whichever is greater**, for its melee attack bonus with natural weapons. **Damage** equals that of a normal creature of the familiar's kind.
- **Saving Throws** — for each save, use either the **familiar's** base save bonus (Fort +2, Ref +2, Will +0) or the **master's** (from all his classes), **whichever is better**. The familiar uses its **own ability modifiers** to saves, and it does **not** share any of the master's other bonuses on saves.
- **Skills** — for each skill in which either the master or the familiar has ranks, use either the normal skill ranks for an animal of that type or the **master's skill ranks, whichever are better**. In either case, the familiar uses its **own ability modifiers**. Some skills may remain beyond the familiar's ability to use.

---

## Advancement table

Indexed by the **master's class level**. **Natural Armor Adj.** is an *improvement to* (added on top of) the familiar's existing natural-armor bonus. **Int** is the familiar's Intelligence **score** (not a bonus). Special abilities are **cumulative**.

| Master class level | Natural Armor Adj. | Int | Special |
|---|---|---|---|
| 1st–2nd   | +1  | 6  | Alertness, improved evasion, share spells, empathic link |
| 3rd–4th   | +2  | 7  | Deliver touch spells |
| 5th–6th   | +3  | 8  | Speak with master |
| 7th–8th   | +4  | 9  | Speak with animals of its kind |
| 9th–10th  | +5  | 10 | — |
| 11th–12th | +6  | 11 | Spell resistance |
| 13th–14th | +7  | 12 | Scry on familiar |
| 15th–16th | +8  | 13 | — |
| 17th–18th | +9  | 14 | — |
| 19th–20th | +10 | 15 | — |

---

## Special abilities

All familiars have these special abilities (or impart them to their masters) depending on the master's combined familiar-granting level, as shown above. The abilities are **cumulative**.

- **Alertness (Ex)** — while the familiar is within **arm's reach**, the master gains the **Alertness** feat.
- **Improved Evasion (Ex)** — when subjected to an attack that normally allows a **Reflex save for half damage**, the familiar takes **no damage** on a **successful** save and **half damage** even if the save **fails**.
- **Share Spells** — at the master's option, he may have any **spell** (but not any spell-like ability) he casts **on himself** also affect his familiar, if it is **within 5 feet** at the time of casting. For a non-instantaneous duration, the effect **ends if the familiar moves farther than 5 feet away** and will not affect it again even if it returns before the duration expires. The master may also cast a spell with a target of **"You"** on his familiar (as a **touch** range spell) instead of on himself. This works **even if the spell normally does not affect creatures of the familiar's type (magical beast)**.
- **Empathic Link (Su)** — the master has an empathic link with his familiar out to **1 mile**. He **cannot** see through its eyes, but they can communicate empathically; only **general emotional content** can be conveyed. Because of this link, the master has the same connection to an item or place that his familiar does.
- **Deliver Touch Spells (Su)** — if the master is **3rd level or higher**, a familiar can deliver touch spells for him. If master and familiar are **in contact** when the master casts a touch spell, he can designate the familiar as the "toucher," and the familiar can then deliver the touch spell just as the master could. As usual, if the master casts another spell before the touch is delivered, the touch spell dissipates.
- **Speak with Master (Ex)** — if the master is **5th level or higher**, familiar and master can communicate **verbally as if using a common language**. Other creatures do not understand the communication without magical help.
- **Speak with Animals of Its Kind (Ex)** — if the master is **7th level or higher**, the familiar can communicate with animals of approximately the same kind (including dire varieties): bats with bats, rats with rodents, cats with felines, hawks/owls/ravens with birds, lizards and snakes with reptiles, toads with amphibians, weasels with similar creatures (weasels, minks, polecats, ermines, skunks, wolverines, and badgers). Limited by the intelligence of the conversing creatures.
- **Spell Resistance (Ex)** — if the master is **11th level or higher**, the familiar gains **SR = master's level + 5**. To affect the familiar with a spell, another caster must get a caster level check (1d20 + caster level) ≥ the familiar's SR.
- **Scry on Familiar (Sp)** — if the master is **13th level or higher**, he may **scry on his familiar** (as the *scrying* spell) **once per day**.

---

## Familiar list

Each familiar type grants a fixed **per-species bonus to the master**. Data-ref = the matching stat block in [src/data/animals.json](../../src/data/animals.json) (`animals/<slug>`).

| Familiar | Master gains | Data-ref |
|---|---|---|
| Bat | +3 on Listen checks | `animals/bat` |
| Cat | +3 on Move Silently checks | `animals/cat` |
| Hawk | +3 on Spot checks in bright light | `animals/hawk` |
| Lizard | +3 on Climb checks | `animals/lizard` |
| Owl | +3 on Spot checks in shadows | `animals/owl` |
| Rat | +2 on Fortitude saves | `animals/rat` |
| Raven ¹ | +3 on Appraise checks | `animals/raven` |
| Snake ² | +3 on Bluff checks | `animals/snake-tiny-viper` |
| Toad | +3 hit points | `animals/toad` |
| Weasel | +2 on Reflex saves | `animals/weasel` |

> ¹ A **raven** familiar can **speak one language** of its master's choice as a supernatural ability.
> ² **Tiny viper.**

---

## Losing a familiar

- If the familiar **dies or is dismissed** (dismissal included — there is no penalty-free voluntary release), the master must attempt a **DC 15 Fortitude save**. Failure → lose **200 XP per master class level**; success → lose **half** that. A master's XP total **can never go below 0** from this, and he cannot lose a level from it.
- A slain or dismissed familiar **cannot be replaced for a year and a day**; obtaining the next one then uses the standard **24 hours + 100 gp**.
- A slain familiar **can be raised from the dead** just as a character can, and it does **not** lose a level or a Constitution point when this happens.

---

## Cross-references

- [class-features.md](class-features.md) — Sorcerer and Wizard class features (this sub-system is summarized there and detailed here).
- [classes.md](classes.md) — class HD, BAB and save progressions used to derive the familiar's BAB/saves from the master.
- [skills-detail.md](skills-detail.md) — the skills boosted by the per-species bonuses.
- [magic.md](magic.md) — touch spells (Deliver Touch Spells), *scrying* (Scry on Familiar), spell resistance.
- [src/data/animals.json](../../src/data/animals.json) — base stat blocks for every familiar creature (`animals/<slug>`).

## Sources

- Manuale del Giocatore — Sorcerer (Familiar) and the Familiars sub-system tables.
