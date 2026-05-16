# Movement

> Tactical movement on the grid: speed, diagonals, terrain, squeezing, creature size & reach, special movement rules.

## Speed by race and armor

| Race | No / light armor | Medium / heavy armor |
|------|------------------|----------------------|
| Human / elf / half-elf / half-orc | 9 m (6 sq) | 6 m (4 sq) |
| Dwarf / gnome / halfling | 6 m (4 sq) | 6 m (4 sq) — no reduction |

- Heavy load reduces speed equivalently to medium/heavy armor.
- Dwarf/gnome/halfling speed is **never reduced** by armor (special).
- Encumbrance (load) details in [equipment.md](equipment.md).

### Movement modes within a round

- **Single move action**: up to base speed.
- **Double move** (use both actions): up to 2× speed.
- **Run** (full-round): ×4 speed (×3 in heavy armor / heavy load); straight line; lose Dex to AC unless Run feat.
- **5-ft step** (passo di 1.5 m): non-action; doesn't provoke; only if no other movement this round; only on terrain that doesn't make it cost ≥ 2 squares.
- **Crawl**: 1.5 m as move action while prone; provokes.

### Movement bonuses

- Apply **all** speed modifiers to base, then any multiplier (e.g. barbarian's +3 m fast movement, monk's unarmored bonus). Same-named bonuses (enhancement, etc.) don't stack.

## Diagonals

- 1st diagonal step costs **1 square**, 2nd costs **2**, 3rd costs **1**, 4th costs **2**, alternating.
- Equivalent: 2 diagonals = 1.5 squares (3 m / 2 = 4.5 m or 3 sq).
- Cannot move diagonally past a wall, even with a 5-ft step.
- May move diagonally past a creature (even an enemy).
- Diagonals across an outside corner: a Small/Medium creature must hug the corner; a Large creature must use 3 sq (4.5 m) of movement to round the corner.

## Counting distance for ranges, areas

- Same diagonal rule (1-2-1-2) applies for measuring spell ranges and effect areas.
- Two creatures are "adjacent" if their squares share an edge or corner.

## Terrain & obstacles

- **Difficult terrain** (rubble, undergrowth, shallow rubble, dense forest floor): each square costs **2 squares** of movement; diagonals into it cost **3 squares**. Can't run or charge through.
- **Multiple terrain types** in one move: use the worst type per square, never the best of mixed.
- **Obstacle** (low wall, table, fence): doesn't fully block but each square containing or crossing it costs **2 squares**. If insufficient remaining movement → can't cross.
- Some obstacles require a skill check (Climb, Jump) to cross.
- Total blockers stop movement entirely.
- Flying / incorporeal creatures bypass terrain obstacles (but solid walls floor-to-ceiling block flyers and incorporeal alike).

## Squeezing

- Moving through a space narrower than the creature's natural size (down to **half** width).
- Cost: each square of squeezing counts as **2 squares** of movement.
- Squeezing creature: **−4 attack**, **−4 AC** while in the narrow space.
- Cannot squeeze below half width without **Escape Artist**: succeed → −4 AC and lose Dex to AC; cannot attack while doing this.
- Larger creatures squeezing into a single Medium square: occupy it as a Medium creature for line-of-effect/centering purposes.

## Special movement rules

### Accidental ending in illegal space

- If movement (a slip, a knockback) would end in a square the creature can't legally occupy (ally's square, illegal terrain), the figure is placed in the **last legal square** along its path, or the closest legal square.

### Doubled cost stacking

- Difficult terrain + obstacle + diagonal can stack: e.g. diagonal across difficult = 3 sq; double-difficult terrain = 4 sq; triple = 8 sq diagonal (12 m). Exception to the usual "doubling does not redouble" rule.

### Minimum movement

- Even when penalties prevent any movement, a creature may use a **full-round action to move 1 square (1.5 m)** in any direction. Provokes normally. Not a 5-ft step.

## Moving through occupied squares

- **Friendly** (not charging): pass through freely; doesn't grant cover.
- **Allies in unstable terrain or specifically blocking**: may be impassable per DM.
- **Helpless / unconscious enemy**: pass freely; each such square counts as 2 squares of movement.
- **Conscious enemy**: cannot move through unless using **Tumble** (DC 25 to enter, opposed/+10 if multiple), **Overrun** (combat maneuver), or specific class features.
- **Three or more size categories smaller**: pass freely; each square counts as 2.
- **Three or more size categories larger** than self: pass freely through their occupied squares (e.g. a Small character running through the space between a cloud giant's legs).

## Creature size, space, and reach

| Size | Space (square edge) | Natural reach (tall) | Natural reach (long) |
|------|---|---|---|
| Fine | 15 cm | 0 | 0 |
| Diminutive | 30 cm | 0 | 0 |
| Tiny | 75 cm | 0 | 0 |
| Small | 1.5 m (1 sq) | 1.5 m | 1.5 m |
| Medium | 1.5 m (1 sq) | 1.5 m | 1.5 m |
| Large (tall) | 3 m (2 sq) | 3 m | 1.5 m |
| Large (long) | 3 m (2 sq) | 1.5 m | — |
| Huge (tall) | 4.5 m (3 sq) | 4.5 m | 3 m |
| Huge (long) | 4.5 m (3 sq) | 3 m | — |
| Gargantuan (tall) | 6 m (4 sq) | 6 m | 4.5 m |
| Gargantuan (long) | 6 m (4 sq) | 4.5 m | — |
| Colossal (tall) | 7.5 m+ (5+ sq) | 7.5 m+ | 6 m+ |
| Colossal (long) | 7.5 m+ (5+ sq) | 6 m+ | — |

- **Tiny and smaller**: occupy less than a square. Multiple may share a square (e.g. up to 4 Tiny per Medium square; 25 Diminutive per Medium square). They have **0 natural reach** → must enter the foe's square to attack (provokes AoO on entry). Can be attacked normally but don't threaten adjacent squares.
- **Reach > natural** (long arms, polearms): the creature threatens both its natural reach band **and** creatures entering it from outside. A creature with reach > 1.5 m gets an AoO when an enemy approaches into its reach (5-ft step into reach does **not** provoke; normal movement into reach does).
- Creatures of Large and bigger using Large+ reach weapons may strike up to **double** their natural reach but cannot strike adjacent squares (unless they also have natural reach).

## Movement scales

Three scales map the same speed to different time intervals:

| Scale | Unit | Used for |
|-------|------|---------|
| Tactical | m/round (or sq/round) | combat, second-by-second |
| Local | m/minute | exploring a town, dungeon level |
| Overland | km/hour or km/day | wilderness travel, long journeys |

Same gait, different units:

| Gait | Tactical (per round) | Local (per minute) | Overland (per hour) | Overland (per day) |
|------|---|---|---|---|
| Walk | speed × 1 | speed × 10 | base mph (≈ 4.5 km/h for 9 m speed) | × 8 h |
| Hustle (×2) | speed × 2 | speed × 20 | × 2 base | n/a |
| Run ×3 | speed × 3 | n/a | n/a | n/a |
| Run ×4 | speed × 4 | n/a | n/a | n/a |

- A character may **walk** indefinitely.
- **Hustle** (double speed) for 1 hour without penalty. Each additional hour costs **1 nonlethal damage** (cumulative: 2nd hour = 1, 3rd = 2, …) and counts as fatiguing. Cannot recover this nonlethal until done hustling.
- **Run** (×3 or ×4) only sustainable for `Con` rounds; then Con check DC 10 (+1 per check) to continue. After failure, must rest 1 minute (10 rounds) before running again. During rest, only walking allowed.

### Local-scale rules

- **Walk**: free roam at base speed × 10 m/min.
- **Hustle**: short bursts ok; sustained hustling triggers the nonlethal rule above.
- **Run**: ~1–2 minutes max before mandatory rest.

### Overland (cross-country) travel

- **Walk**: 8 hours per day = base km/h × 8.
- **Hustle on the road**: 16 hours equivalent of distance per day (×2 walking distance) but invokes the per-hour nonlethal cost beyond hour 1.
- Cannot **run** for overland-scale time blocks (only for ~1 minute).

### Terrain and road multipliers

Multiplier applied to overland distance:

| Terrain | Highway | Road / Trail | Trackless |
|---|---|---|---|
| Plains | ×1 | ×1 | ×¾ |
| Hills | ×1 | ×¾ | ×½ |
| Forest | ×1 | ×¾ | ×½ |
| Mountain | ×¾ | ×¾ | ×½ |
| Marsh | ×1 | ×¾ | ×½ |
| Sandy desert | ×1 | ×½ | ×½ |
| Jungle | ×1 | ×¾ | ×¼ |
| Glacial tundra | ×1 | ×¾ | ×¼ |
| Moor | ×1 | ×1 | ×¾ |

- **Highway**: paved, straight, drained.
- **Road / trail**: dirt road or beaten path; group walks single file or pairs.
- **Trackless**: wilderness with no defined route.

### Forced march

- Beyond 8 hours of walking in one day → **forced march**.
- Each extra hour: **Con check DC 10 + 2 per extra hour** (DC 12 for hour 9, DC 14 for hour 10, …). Failure: **1d6 nonlethal damage** + character is **fatigued**.
- A character can march to unconsciousness this way (drops at 0 HP from accumulated nonlethal).
- Nonlethal damage from forced march cannot be healed by normal HP recovery until the character has completed a full rest.

### Mounts and vehicles

Per-hour and per-day overland speeds for common mounts/vehicles are tabular (Table 9-6 in source). Multipliers for mounts also follow the per-hour formula `speed × 1` walking, `× 2` hustling, etc.

- A mount under heavy load uses the slower row (a war horse with rider weighing > listed load).
- Quadruped mounts use quadruped × multipliers for carry capacity (see [equipment.md](equipment.md)).
- **Mount forced march** uses the same Con-check rule as humanoid forced march.
- **Sea travel**: rowed boats can go ~10 hours per day; sail boats can travel 24 hours/day if multiple crews shift.

### Hampered movement (multiplicative)

- Difficult terrain ×2, obstacle ×2, low visibility ×2, all stack **multiplicatively** when combined (exception to the normal "doubling does not redouble" rule).
- E.g. difficult terrain in darkness = each square costs 4; diagonal = 6 squares.

## Cross-references

- [combat.md](combat.md) — round structure, action types, full-attack 5-ft step.
- [attacks-of-opportunity.md](attacks-of-opportunity.md) — leaving threatened squares.
- [combat-maneuvers.md](combat-maneuvers.md) — overrun, charge movement.
- [equipment.md](equipment.md) — load categories, mount carry capacity multipliers.
- [vision-and-light.md](vision-and-light.md) — low-visibility movement penalties.
- [skills.md](skills.md) — Tumble, Climb, Jump, Escape Artist, Ride.

## Sources

- Manuale del Giocatore — pp. 147–149
- Manuale del Giocatore — pp. 162–164 (movement scales, hustle/run, overland, terrain, forced march, mounts)
