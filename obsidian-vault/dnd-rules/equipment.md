# Equipment

> Wealth, coinage, starting gear, weapon categories and mechanics. Per-weapon stats (damage, crit, range, weight) live in [src/data/items.json](../../src/data/items.json); this file documents only the *systems* that drive how those numbers behave in play.

## Starting wealth

- Each class has a fixed starting gold formula (Table 7-1; e.g. `5d4 × 10 gp` cleric, `6d4 × 10` fighter, etc.). Per-class roll formula and starting-package alternative are in [src/data/classes.json](../../src/data/classes.json).
- Starting wealth is not actual coin "in pocket" — it's an abstraction representing inherited gear, training equipment, and pre-adventure savings.
- Each character may select **one free everyday outfit** (artisan, peasant, explorer, entertainer, monk, scholar, traveler) at character creation.

## Coinage

| Coin | Abbrev. | Weight | Worth |
|---|---|---|---|
| Copper piece | cp | 1/3 oz | 1 cp |
| Silver piece | sp | 1/3 oz | 10 cp |
| Gold piece  | gp | 1/3 oz | 10 sp = 100 cp |
| Platinum piece | pp | 1/3 oz | 10 gp = 100 sp |

- Standard reference unit is the **gp**. 50 coins of any kind = 0.5 kg / ~1 lb.
- A common day-laborer earns ~1 sp/day; a skilled craftsman ~1 gp/day.
- Trade goods (grain, livestock, ore, precious metals, gems) are bartered without coin loss; see Table 7-3 in source.
- Nobility and large transactions use **letters of credit**, mining/port shares, or measured gold ingots rather than coin.

## Selling and buying

- **Buying**: list price (gp value in Table 7-5 / `items.json`). In a small village, items above a certain expense may be unavailable; the DM sets local availability.
- **Selling looted/used goods**: market = **½ list price**.
- **Trade goods** (grain, salt, ore, livestock, precious metals, gems): exchanged at **full** list price both ways.
- Special-order items (e.g. a `+2 longsword`) require a large city and DM-set logistics; sometimes the buyer must broker the deal.

## Weapons

### Proficiency category

- **Simple**, **Martial**, **Exotic** — each weapon belongs to one. Most classes are proficient with all simple weapons; many classes add martial weapons; exotic weapons require *Exotic Weapon Proficiency* per weapon.
- **Non-proficiency penalty**: `−4` to attack rolls with a weapon the wielder is not proficient with.
- Proficiency lists per class in [src/data/classes.json](../../src/data/classes.json).

### Encumbrance category (per weapon)

- **Light**: smaller than the wielder's size; usable in the off-hand with no off-hand penalty for size; one-handed.
- **One-handed**: typical sword/axe; can be wielded in one or two hands.
- **Two-handed**: requires both hands for normal use.

### Strength bonus to damage

- **Light or one-handed in primary hand**: add **Str mod** to damage.
- **One-handed in off-hand**: add **½ Str mod** (rounded down) to damage.
- **Two-handed**: add **1.5 × Str mod** (rounded down) to damage.
- **Negative Str modifier** always applies fully to damage regardless of grip.

### Melee vs ranged vs reach

- **Melee weapon**: strikes adjacent (or reach) squares.
- **Ranged weapon**: bow, crossbow, sling, thrown weapon. See *Range increment* below.
- **Reach weapon**: a melee weapon (glaive, longspear, ranseur, scythe, spiked chain, whip) — for a Medium wielder, threatens **3 m away (2 squares)** instead of adjacent. Wielder **cannot attack adjacent squares** with a reach weapon (exception: spiked chain, whip). A Large wielder with reach weapon threatens 4.5 or 6 m.
- **Spiked chain** and **whip** are exotic reach weapons that can also attack adjacent squares.

### Double weapons

- A double weapon (dwarven urgrosh, two-bladed sword, dire flail, etc.) lets the wielder use it as if **two-weapon fighting** with the same weapon, applying the off-hand penalties to one end.
- Alternatively, use both hands on one end as a normal two-handed weapon.
- Each end has its own damage and crit profile (e.g. `1d6/1d6` × 2 entries on weapon row).
- A larger creature can wield a double weapon one-handed (Large creature with a Medium double weapon = one-handed, only the primary end usable).

### Thrown weapons

- Light thrown (dagger, dart, sling stones, shuriken): throw as a **standard attack**; full-attack allows multiple iteratives.
- Two-handed thrown (e.g. heavy javelin variants): throw as a **full-round action** per throw.
- **Str bonus to damage** applies to thrown weapons (except splash weapons like acid flasks).
- A weapon not designed for throwing can still be thrown: `−4` to attack, range increment 3 m, no critical threat range except natural 20 (×2 multiplier on crit).

### Range increment

- Each ranged weapon lists a **range increment** (e.g. shortbow 18 m, longbow 30 m, dagger 3 m).
- Within 1 increment: no penalty.
- Each additional full increment: `−2` cumulative to attack roll.
- **Maximum range**: thrown = 5 increments; projectile (bow/crossbow/sling) = 10 increments.
- Composite bows: rated for a specific Str. Wielder's Str **above** the rating: still capped at the rating's bonus. Wielder's Str **below** the rating: `−2` to attack rolls. Composite bow with no Str rating: no Str bonus to damage, but negative Str still penalizes damage.

### Critical hits

- Critical multiplier (`×2`, `×3`, `×4`) applies to **rolled damage and ability-mod damage**; it does **not** multiply:
  - Sneak attack dice.
  - Bonus damage from flaming/etc. enchantments (energy damage from weapon special abilities).
  - Other "extra damage dice" specifically marked as non-multiplied.
- Threat range (e.g. 18–20, 19–20): natural roll within this range threatens a crit; the crit must still be **confirmed** by a second attack roll (see [combat.md](combat.md)).
- A `×3` weapon multiplies base damage by 3; a `×4` by 4. Double weapons may have different multipliers per end.

### Damage types

- **Bludgeoning (B)**, **Piercing (P)**, **Slashing (S)**.
- Some weapons inflict **two types** (e.g. morning star = B+P); the wielder chooses which type to deal each strike, or both apply (used vs creatures resistant to one type).
- Some creatures are resistant or immune to a damage type; e.g. skeletons take only half damage from slashing and piercing weapons.

### Weapon size vs wielder size

- Every weapon row in the table is "**Medium**". Conversions:
  - **Small** version: half the listed weight; damage steps down one die category (use Table 7-4).
  - **Large** version: double the listed weight; damage steps up one die category.
- A weapon's encumbrance (light/one-hand/two-hand) is for a creature **of its own size**.
- Using a weapon **not built for your size** imposes `−2` to attack per **step of difference** between the weapon's intended size and the wielder's size.
- A weapon **2 or more size categories off** from the wielder cannot be used at all.
- Mid-step also shifts encumbrance: a Small weapon used by a Medium creature is **light** (instead of one-handed); a Large weapon used by a Medium creature is **two-handed** (instead of one-handed); etc.
- Example: a Small longsword is "light" for a Medium creature (one-handed → light when one category smaller); a Medium longsword is "one-handed" for a Large creature; a Large longsword is "two-handed" for a Medium creature.

### Improvised weapons

- An "improvised weapon" (broken bottle, chair leg, lantern, etc.): `−4` to attack, threat range 20 only (×2 multiplier on crit), range increment 3 m if thrown. The DM picks an analogous "real" weapon to model size, damage, and category.

## Masterwork weapons

- A masterwork weapon grants a `+1` **enhancement bonus** to attack rolls (**not** damage).
- **Must be forged as masterwork from the start** — a normal weapon cannot be upgraded to masterwork after the fact. See [skills-detail.md](skills-detail.md#artigianato-craft).
- **Surcharge** over base weapon price:
  - Weapon: **+300 gp**.
  - Ammunition (per single piece, e.g. one arrow): **+6 gp**.
  - **Double weapon**: **+600 gp** (the surcharge is doubled, since both ends are made masterwork).
- Examples: masterwork bastard sword = 35 gp base + 300 = 335 gp; 10 masterwork arrows = 1 sp × 10 + 6 × 10 = ~70 gp.
- **Masterwork ammunition** is damaged/destroyed on use (a single shot consumes the masterwork quality).
- **Stacking**:
  - A masterwork ammunition's `+1` does **not stack** with the firing weapon's enhancement bonus. Use the higher.
  - A magic weapon's enhancement does **not stack** with the masterwork `+1`. All magic weapons are automatically masterwork at no extra cost; the masterwork `+1` is subsumed by the magic enhancement.
- Required as the base for any **magic weapon** (a `+1` weapon, etc. is enchanted *onto* a masterwork item).
- **Armor and shields used as weapons** (e.g. spiked shield, armor spikes) cannot be made masterwork for the purpose of granting attack bonus. Masterwork armor/shields instead reduce the **armor check penalty** by 1 (see *Masterwork armor* / armor section).

## Armor and shields

Per-armor stats (cost, AC bonus, max Dex, ACP, ASF%, speed, weight) are columns in Table 7-6 / [src/data/items.json](../../src/data/items.json). The *mechanics* of those columns:

### Armor categories

- **Light**, **Medium**, **Heavy** armor; **shields** are separate.
- Class proficiency lists which categories the character can wear without penalty.
- **No proficiency**: ACP applies to **attack rolls** and to **all Str-/Dex-based ability and skill checks**, in addition to the normal skill ACP. (Penalty for shield non-proficiency stacks with the armor's.)

### Armor bonus and shield bonus

- **Armor bonus** to AC: granted by armor.
- **Shield bonus** to AC: granted by shield.
- **Armor bonus** does **not stack** with other armor-bonus effects (e.g. *mage armor*, *bracers of armor* — only the highest applies).
- **Shield bonus** does **not stack** with other shield-bonus effects (e.g. the *shield* spell). Only the highest applies.
- Armor bonus and shield bonus **stack with each other** and with deflection / natural armor / dodge / size bonuses (these are all different bonus types).

### Max Dex bonus

- Each armor caps the wielder's Dex bonus to AC at the listed value.
- The cap also limits the **Dex contribution** to any other ability that uses Dex mod tied to AC (e.g. Reflex saves are **not** capped — only AC).
- A rogue's *uncanny dodge*: even if Max Dex is 0, the rogue still treats targets denied Dex-bonus normally for sneak attack purposes.
- Encumbrance (load) imposes its own Max Dex limit — apply both (use the *lower*).

### Armor check penalty (ACP)

- A flat penalty applied to: **Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Sleight of Hand, Tumble** — and **Swim (doubled)**.
- Wearing a shield also adds the shield's ACP (cumulative with the armor's).
- Applies regardless of armor proficiency; non-proficiency *additionally* applies it to attack rolls and Str-/Dex-based checks.

### Arcane spell failure (ASF)

- Each armor / shield has an ASF percentage. Total ASF = armor's % + shield's % (cumulative).
- Roll percentile before casting an arcane spell with a somatic component; on a result ≤ ASF, the spell fails (slot still consumed).
- **Proficiency does not eliminate ASF** — it only removes the ACP-on-attack penalty.
- Spells without a somatic component (V-only, V+M without S) ignore ASF.
- **Bards** in light armor: no ASF for bard spells (medium/heavy/any shield → normal ASF).
- **Divine spells** are unaffected (unless multiclassed wizard/cleric casting wizard spells).

### Speed

- **Medium and heavy armor** (and medium/heavy load) reduce base speed:
  - 9 m base → **6 m** while encumbered.
  - 6 m base → **4.5 m** while encumbered.
- **Running** in heavy armor is **×3** (not ×4) of base speed.
- **Shields** do not affect speed.
- **Dwarves** (and similar races) keep their base speed unaffected by armor weight or load.

### Sleeping in armor

- Sleeping in **medium or heavy** armor: automatically **fatigued** on waking (`−2` Str, `−2` Dex, cannot run or charge).
- Sleeping in **light** armor: no penalty.

### Donning and removing

| Armor type | Don | Don hastily | Remove |
|---|---|---|---|
| Shield (any) | 1 move action | n/a | 1 move action |
| Padded, leather, studded leather, chain shirt | 1 minute | 5 rounds | 1 minute (move action for shield) |
| Hide, scale mail, chainmail, breastplate, banded mail | 4 minutes | 1 minute | 1 minute |
| Half-plate, full plate | 4 minutes | 4 minutes | 1d4+1 minutes |

- **Don hastily**: ACP `−1` worse than normal and AC bonus `−1` worse than normal until properly fitted.
- **Help** halves don/remove time (one helper assists one wearer; two helpers cannot simultaneously fit the same armor).
- Half-plate and full plate **cannot be donned without help** except via the "don hastily" rule.

### Unusual-size armor pricing

For armor made to fit a non-Medium creature (Table 7-? on the same page):

| Creature size | Humanoid cost × | Humanoid weight × | Non-humanoid cost × | Non-humanoid weight × |
|---|---|---|---|---|
| Up to Diminutive | ×½ | ×1/10 | ×1 | ×1/10 |
| Small | ×1 | ×½ | ×2 | ×½ |
| Medium | ×1 | ×1 | ×2 | ×1 |
| Large | ×2 | ×2 | ×4 | ×2 |
| Huge | ×4 | ×5 | ×8 | ×5 |
| Gargantuan | ×8 | ×8 | ×16 | ×8 |
| Colossal | ×16 | ×12 | ×32 | ×12 |

- Small humanoid armor halves the AC bonus.
- "Non-humanoid" means animal-shaped or extra-limbed creatures requiring custom barding.

### Tower shield

- Provides **total cover** as a standard action instead of its normal shield bonus to AC (wielder gives up shield bonus that round).
- Imposes `−2` penalty to attack rolls in addition to ACP.
- One hand is **not free** to cast spells.

### Masterwork armor and shields

- A masterwork armor or shield reduces its **armor check penalty by 1** (e.g. masterwork chainmail has ACP `−4` instead of `−5`).
- **Surcharge**: `+150 gp` over the normal price (e.g. masterwork chainmail = 100 + 150 = 250 gp).
- Must be forged as masterwork from the start; cannot be upgraded after creation.
- Does **not** grant any attack or damage bonus, even if the armor or shield is also used as a weapon (e.g. spiked armor, spiked shield) — the masterwork-weapon `+1` to attack is a separate purchase.
- All magic armor and shields are automatically masterwork at no extra cost; the ACP reduction is included.
- Required as the base for any **magic armor / shield** enchantment.

## Encumbrance and load

Two sources of "encumbrance" apply: **armor encumbrance** (medium/heavy armor) and **load encumbrance** (carried weight). When both apply, take the **worse value of each column** (max Dex, ACP, speed) — do **not** sum the penalties.

### Carrying capacity (by Strength)

- Capacity values per Str (light / medium / heavy max) are in a Str-keyed lookup. Per-Str values: see [src/lib/player/](../../src/lib/player/) carrying-capacity helper.
- **Doubling rule**: every **+10 Str** multiplies all three capacity thresholds by **×4** (Str 30 = 4× Str 20, Str 40 = 16× Str 20, …). For Str values not on the table, find the matching ones-digit row and apply the multiplier.

### Load effects

| Load | Max Dex to AC | Check penalty | Speed (9 m → / 6 m →) | Run |
|------|---|---|---|---|
| Light | — | 0 | 9 m / 6 m | ×4 |
| Medium | +3 | −3 | 6 m / 4.5 m | ×4 |
| Heavy | +1 | −6 | 6 m / 4.5 m | ×3 |

- **Check penalty** stacks with armor check penalty (same skills affected — see ACP list above).
- **Dwarves, gnomes, halflings**: speed is **not reduced** by medium/heavy load (or armor).
- **Over heavy load** (carrying past max heavy): can lift but only stagger (5 ft per round as a full-round action), lose Dex bonus to AC.

### Lift and drag

- **Lift overhead** = up to max heavy load.
- **Lift off ground** = up to **2× max heavy load**; while doing so, cannot move faster than 5 ft/round (full-round) and lose Dex to AC.
- **Push or drag** = up to **5× max heavy load** on a typical surface. Smooth surface → ×2; rough/uphill → ×½.

### Size and shape multipliers

Multiply the Str-table value by:

- **Bipeds**: Small ×¾, Tiny ×½, Diminutive ×¼, Fine ×⅛; Large ×2, Huge ×4, Gargantuan ×8, Colossal ×16.
- **Quadrupeds** (horses, dogs): Medium ×1.5, Small ×1, Tiny ×¾, Diminutive ×½, Fine ×¼; Large ×3, Huge ×6, Gargantuan ×12, Colossal ×24.

### Strengths beyond the table

- For Str 30+: take the matching ones-digit row from Str 20–29 and multiply ×4 per +10 (e.g. Str 35 = Str 25 × 4; Str 45 = Str 25 × 16).

## Cross-references

- [combat.md](combat.md) — attack rolls, crit confirmation, AoO, full-attack iteratives, ranged attacks.
- [classes.md](classes.md) — class proficiencies (simple, martial, exotic, armor categories).
- [races.md](races.md) — dwarven speed exception, halfling thrown bonuses, weapon familiarity (treat exotic as martial).
- [skills.md](skills.md), [skills-detail.md](skills-detail.md) — armor check penalty, Swim doubling, Craft for masterwork.
- [magic.md](magic.md) — arcane spell failure, bard light-armor exception, druid metal-armor rule.
- [magic-items.md](magic-items.md) — masterwork base for enchanted weapons/armor.
- [feats.md](feats.md) — Exotic Weapon Proficiency, Weapon Focus, Power Attack, etc.
- [src/data/items.json](../../src/data/items.json) — per-weapon and per-armor numeric data.

## Sources

- Manuale del Giocatore — pp. 111–114, 122–123
- Manuale del Giocatore — pp. 161–162 (encumbrance, carry capacity, lift/drag, size & quadruped multipliers)
