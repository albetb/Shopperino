# Animal Companion

> Druid / ranger animal-companion sub-system: how a companion is chosen, how it advances with class level (bonus HD, natural armor, ability boosts, tricks, special abilities), and the alternative creature lists with their level adjustments. Per-creature base stat blocks live in [src/data/animals.json](../../src/data/animals.json).

A **druid's animal companion** is superior to a normal animal of its kind and has special powers. The **ranger** gets the same sub-system on a slower track (see *Ranger* below). The companion is gained as an **Extraordinary (Ex)** ability.

The companion **keeps its own creature type** (animal, dinosaur, etc.) — it does **not** become a magical beast. (The *familiar* is the one that becomes a magical beast; do not confuse the two.) Because of this, *share spells* carries an explicit exception so the druid can still target it (see below).

---

## Effective level

All companion characteristics key off the character's **effective druid level**:

- **Druid**: effective level = druid class level.
- **Ranger**: effective level = **½ ranger level** (round down). A ranger first gains a companion at **ranger level 4** (effective level 2).
- **Stacking**: levels from *different* classes that each grant an animal companion stack for determining the companion's abilities and which alternative lists are available — with ranger levels counted at half. (E.g. Druid 3 / Ranger 4 → 3 + 2 = effective level 5.)

If a chosen alternative list's adjustment (below) reduces the effective level below **1**, that creature **cannot** be selected.

---

## Advancement table

Indexed by **effective druid level** (the table's "Class Level"):

| Effective level | Bonus HD | Natural Armor Adj. | Str/Dex Adj. | Bonus Tricks | Special |
|---|---|---|---|---|---|
| 1st–2nd   | +0  | +0  | +0 | 1 | Link, share spells |
| 3rd–5th   | +2  | +2  | +1 | 2 | Evasion |
| 6th–8th   | +4  | +4  | +2 | 3 | Devotion |
| 9th–11th  | +6  | +6  | +3 | 4 | Multiattack |
| 12th–14th | +8  | +8  | +4 | 5 | — |
| 15th–17th | +10 | +10 | +5 | 6 | Improved evasion |
| 18th–20th | +12 | +12 | +6 | 7 | — |

Special abilities are **cumulative**: a 9th-level druid's companion has Link, share spells, Evasion, Devotion, **and** Multiattack.

---

## Companion basics

Start from the **base statistics for a creature of the companion's kind** (from [src/data/animals.json](../../src/data/animals.json)), then apply the table adjustments:

- **Bonus HD** — extra eight-sided (**d8**) Hit Dice, each gaining the **Constitution modifier** as normal. Bonus HD raise the companion's **base attack and base save bonuses**:
  - **BAB** = that of a **druid of a level equal to the companion's total HD** (i.e. the ¾ BAB progression on total HD = base animal HD + bonus HD).
  - **Saves** — treat the companion as a character whose level equals its **total HD**, with **good Fortitude and Reflex** saves. (The Will save is not improved by this rule; it stays as the base animal's.)
  - Bonus HD also grant **additional skill points and feats**, as normal for advancing a monster's Hit Dice.
- **Natural Armor Adj.** — an **improvement to** (added on top of) the creature's existing natural-armor bonus.
- **Str/Dex Adj.** — add this value to **both** the companion's Strength and Dexterity scores.
- **Bonus Tricks** — the total number of "bonus" tricks the animal knows **in addition** to any the druid teaches it via Handle Animal. Bonus tricks need **no training time or Handle Animal checks** and **don't count** against the animal's normal trick limit. The druid selects them, and **once selected they can't be changed**.

---

## Special abilities

- **Link (Ex)** — the druid can **handle** her companion as a **free action**, or **push** it as a **move action**, even with no ranks in Handle Animal. She gains a **+4 circumstance bonus** on all **wild empathy** and **Handle Animal** checks regarding the companion.
- **Share Spells (Ex)** — the druid may have any **spell** (not a spell-like ability) she casts **on herself** also affect her companion, if it is **within 5 ft** at the time of casting. For a non-instantaneous duration, the effect **ends if the companion moves >5 ft away** and will not resume even if it returns in time. She may also cast a spell with a target of **"You"** on the companion (treated as a **touch**-range spell) instead of on herself. This works **even if the spell normally does not affect creatures of the animal type**. The companion may voluntarily refuse.
- **Evasion (Ex)** — on an attack that allows a **Reflex save for half**, a **successful** save means the companion takes **no** damage.
- **Devotion (Ex)** — **+4 morale bonus** on **Will saves vs enchantment** spells and effects.
- **Multiattack** — the companion gains **Multiattack** as a bonus feat if it has **three or more** natural attacks and lacks the feat. If it has **fewer than three** natural attacks, it instead gains a **second attack with its primary natural weapon at a −5 penalty**.
- **Improved Evasion (Ex)** — on an attack that allows a Reflex save for half: a **successful** save → **no** damage; a **failed** save → **half** damage.

---

## Standard list (effective level 1)

A druid may **begin play** with an animal companion from this list (no level adjustment). A 1st-level druid's companion is completely typical for its kind except for the adjustments above. The companion is a loyal animal that accompanies the druid as appropriate for its kind.

**¹ = available only if the campaign takes place wholly or partly in an aquatic environment.**

| Creature | Aquatic | Data-ref |
|---|---|---|
| Badger | | `animals/badger` |
| Camel | | `animals/camel` |
| Dire rat | | `animals/dire-rat` |
| Dog | | `animals/dog` |
| Dog, riding | | `animals/dog-riding` |
| Eagle | | `animals/eagle` |
| Hawk | | `animals/hawk` |
| Horse, heavy | | `animals/horse-heavy` |
| Horse, light | | `animals/horse-light` |
| Owl | | `animals/owl` |
| Pony | | `animals/pony` |
| Snake, Small viper | | `animals/snake-small-viper` |
| Snake, Medium viper | | `animals/snake-medium-viper` |
| Wolf | | `animals/wolf` |
| Porpoise | ¹ | `animals/porpoise` |
| Shark, Medium | ¹ | `animals/shark-medium` |
| Squid | ¹ | `animals/squid` |

> **Errata note.** The official rules also list the **crocodile** here (aquatic), duplicating its entry in the 4th-level (−3) list below — a genuine bug in the source. Because it's too strong for a 1st-level companion, this project keeps the crocodile **only** in the 4th-level (−3) list.

---

## Alternative animal companions

A character of sufficiently high **effective level** may instead choose a companion from one of the lists below, **applying the listed level adjustment** to the effective level for the purpose of determining the companion's characteristics and special abilities. The adjustment is shown in parentheses.

> Example: a leopard is on the **4th-level (−3)** list. A 7th-level druid who takes a leopard treats it as a companion of effective level **7 − 3 = 4** (so +2 HD, +2 natural armor, +1 Str/Dex, 2 tricks, Evasion).

**¹ = available only in an aquatic environment.**

Data-ref = the matching stat block in [src/data/animals.json](../../src/data/animals.json) (`animals/<slug>`). Dinosaurs are **not yet present** in `animals.json`.

### 4th level or higher (Level −3)

| Creature | Aquatic | Data-ref |
|---|---|---|
| Ape | | `animals/ape` |
| Bear, black | | `animals/bear-black` |
| Bison | | `animals/bison` |
| Boar | | `animals/boar` |
| Cheetah | | `animals/cheetah` |
| Crocodile | ¹ | `animals/crocodile` |
| Dire badger | | `animals/dire-badger` |
| Dire bat | | `animals/dire-bat` |
| Dire weasel | | `animals/dire-weasel` |
| Leopard | | `animals/leopard` |
| Lizard, monitor | | `animals/lizard-monitor` |
| Shark, Large | ¹ | `animals/shark-large` |
| Snake, constrictor | | `animals/constrictor-snake` |
| Snake, Large viper | | `animals/snake-large-viper` |
| Wolverine | | `animals/wolverine` |

### 7th level or higher (Level −6)

| Creature | Aquatic | Data-ref |
|---|---|---|
| Bear, brown | | `animals/bear-brown` |
| Crocodile, giant | | `animals/crocodile-giant` |
| Deinonychus (dinosaur) | | *missing — not in animals.json* |
| Dire ape | | `animals/dire-ape` |
| Dire boar | | `animals/dire-boar` |
| Dire wolf | | `animals/dire-wolf` |
| Dire wolverine | | `animals/dire-wolverine` |
| Elasmosaurus (dinosaur) | ¹ | *missing — not in animals.json* |
| Lion | | `animals/lion` |
| Rhinoceros | | `animals/rhinoceros` |
| Snake, Huge viper | | `animals/snake-huge-viper` |
| Tiger | | `animals/tiger` |

### 10th level or higher (Level −9)

| Creature | Aquatic | Data-ref |
|---|---|---|
| Bear, polar | | `animals/bear-polar` |
| Dire lion | | `animals/dire-lion` |
| Megaraptor (dinosaur) | | *missing — not in animals.json* |
| Shark, Huge | ¹ | `animals/shark-huge` |
| Snake, giant constrictor | | `animals/constrictor-snake-giant` |
| Whale, orca | ¹ | `animals/orca` |

### 13th level or higher (Level −12)

| Creature | Aquatic | Data-ref |
|---|---|---|
| Dire bear | | `animals/dire-bear` |
| Elephant | | `animals/elephant` |
| Octopus, giant | ¹ | `animals/octopus-giant` |

### 16th level or higher (Level −15)

| Creature | Aquatic | Data-ref |
|---|---|---|
| Dire shark | ¹ | `animals/dire-shark` |
| Dire tiger | | `animals/dire-tiger` |
| Squid, giant | ¹ | `animals/squid-giant` |
| Triceratops (dinosaur) | | *missing — not in animals.json* |
| Tyrannosaurus (dinosaur) | | *missing — not in animals.json* |

---

## Replacement

Losing a companion (death or release) requires a **24-hour ritual** to call a new one. A druid can dismiss a companion (release it) without penalty.

---

## Cross-references

- [class-features.md](class-features.md) — Druid and Ranger class features (this sub-system is summarized there and detailed here).
- [classes.md](classes.md) — class HD, BAB and save progressions used to derive companion BAB/saves from total HD.
- [skills-detail.md](skills-detail.md) — Handle Animal (tricks, training) and the druid's wild empathy.
- [combat.md](combat.md) — Reflex-for-half attacks (Evasion / Improved Evasion), natural attacks (Multiattack).
- [src/data/animals.json](../../src/data/animals.json) — base stat blocks for every selectable creature (`animals/<slug>`).

## Sources

- Manuale del Giocatore — Druid's Animal Companion & Alternative Animal Companions tables.
