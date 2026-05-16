# Combat

> Round structure, action economy, attack resolution, AC, HP, damage, criticals, casting in combat, situational modifiers (cover/concealment/flanking).

## Round structure

- 1 round = ~6 seconds in-world.
- Combat begins with **initiative** (rolled once per combatant); fixed turn order for the whole battle (high → low).
- Tie-break initiative on higher Dex; still tied → reroll between tied combatants.
- Each combatant is **flat-footed** until they act for the first time (no Dex to AC, no AoOs). Uncanny Dodge negates this.
- The game assumes a battle grid; 1 square = 1.5 m (5 ft).

## Surprise round

- DM determines who is aware of whom at the start of combat (Listen/Spot or scenario).
- If only some combatants are aware → a **surprise round** happens before round 1.
  - Aware combatants act in initiative order; each gets **one standard OR one move action** (plus free actions).
  - Unaware combatants do nothing and are flat-footed.
- If all sides aware OR none aware → no surprise round; go straight to round 1.
- After the surprise round, everyone rolls initiative as normal; round 1 begins from the top of the order.

## Action economy

Per turn, choose one:

- 1 standard + 1 move (either order)
- 2 move actions
- 1 full-round action

Plus any number of **free actions** the DM allows. Special categories:

- **Non-action**: 5-ft step, delay/ready (and a few others) — never provokes, doesn't consume a slot.
- **Restricted activity**: in surprise round, when slowed, etc. — only 1 standard OR 1 move (no full-round, no charge, no run, no withdraw).
- A standard action may always be downgraded to a move action.

### Standard actions (selected)

- **Attack** (melee or ranged) — single strike at full BAB.
- **Cast a spell** with 1-action casting time.
- **Activate a spell-completion / spell-trigger / use-activated** magic item that requires it.
- **Use a spell-like ability** (provokes AoO).
- **Use a supernatural ability** (usually no AoO).
- **Total defense** — +4 dodge to AC for 1 round; no attack, no AoOs, can't combine with Combat Expertise/full attack.
- **Fight defensively** — −4 to all attacks this round, +2 dodge to AC. Stacks with Combat Expertise.
- **Start/complete a full-round action** that spans rounds (e.g. a 1-round-cast spell): begin this turn, finish at the start of next turn.

### Move actions (selected)

- Move up to speed.
- Stand up from prone (provokes).
- Draw or sheathe a weapon (free if BAB ≥ +1 combined with movement; Quick Draw makes drawing a free action). Drawing ammunition (arrows, bolts, sling stones, shuriken) is always free.
- Open/close a door, mount/dismount, retrieve a stowed item, ready/loose a shield (drop a shield = free).
- **Mount/dismount fast** (Ride DC 20) = free action; failure = move action wasted.
- Crawl 1.5 m (provokes).
- Ready or drop a shield: drop = free, ready = move (free if BAB ≥ +1 combined with movement).
- Direct/redirect an active spell (e.g. *spiritual weapon*) — does not provoke and needs no Concentration.

### Full-round actions (selected)

- **Full attack** — all iterative attacks (BAB-based). Allows a 5-ft step before/during/after, but no other movement.
  - Choose targets as you go (don't need to declare all up front).
  - After the **first** attack, may substitute remaining attacks for a move action (instead of the rest of the iteratives).
  - Iteratives are taken in order (highest BAB first).
  - With two-weapon fighting: first attack can be either hand; iteratives off-hand and main-hand interleaved per the player's choice.
- **Fight defensively (as full-round) — total defense alternative**: −4 to all attacks for the round in exchange for +2 dodge to AC; stacks with Combat Expertise. (Standard-action variant exists as an option above.)
- **Charge** — move up to 2× speed in a straight line to attack; +2 to attack, −2 to AC for the round. Min 3 m, max 2× speed; clear path; ends adjacent to target. See [combat-maneuvers.md](combat-maneuvers.md).
- **Run** — ×4 speed (×3 in heavy armor or heavy load); straight line; lose Dex to AC (unless Run feat); provokes; only if no heavy load and legal terrain.
  - May run for `Con score` rounds before requiring a Con check (DC 10, +1 per previous check). Failure → must rest 1 minute (10 rounds). During that rest, can only walk (single move action per round).
  - Approx 18 km/h for an unarmored human.
- **Withdraw** — move up to 2× speed; the **first** square you leave does not provoke (subsequent squares do). Cannot withdraw while flat-footed. Cannot withdraw using a movement mode (e.g. climb) you don't have a speed for.
  - **Limited withdraw**: if restricted to 1 standard action (slow/surprise), withdraw becomes a standard action and you only move at base speed (not 2×).
- Load a heavy crossbow; deliver a coup de grace; cast a 1-round spell.
- Iterative-extra-attack feats (Cleave, Great Cleave) trigger inside a full attack and don't bypass the "iteratives only in full attack" rule.

### Free / non-action / no-AoO conventions

- **5-ft step** is non-action, never provokes; not allowed if you've already moved (>0) this round; only allowed if the destination square isn't difficult terrain or otherwise restricted; not allowed with a movement mode whose speed is unlisted (no swim/climb 5-ft step unless you have a speed for it).
- **Drop to prone** = free action. Stand up = move action that provokes.
- Talking, dropping an item, ceasing concentration on a spell, casting a quickened spell: free.
- Drawing material components for a spell: free, included in casting.

## Special initiative actions

### Ready

- Standard action that prepares a triggered response (also a move or free, by extension).
- Specify the trigger and the prepared action.
- When the trigger occurs, the readied action resolves **immediately before** the trigger completes.
- Readying does **not** provoke (the prepared action might).
- After resolving, the character's initiative shifts to **immediately before** the trigger and stays there for subsequent rounds.
- 5-ft step allowed as part of the readied action only if no movement was already taken that round.
- Used to **counterspell**: ready "if X starts casting, counterspell." On trigger, identify the spell with a Spellcraft check (DC `15 + spell level`); if you have the same spell prepared/known and can cast it, the cast auto-counters. *Dispel magic* may also serve as a generic counter (with a caster-level check, sometimes failing).

### Delay

- Voluntarily reduce your initiative result; act later in the round (or any subsequent round).
- Once delayed, your turn fires either when you choose to take it, or never (your initiative resets when the round wraps).
- Delaying is **not** an action (consumes nothing) but you forfeit any actions you would have taken at your normal slot.

## Attack resolution

- `attack total = d20 + attack bonus`.
- Hit if total ≥ target's AC. On hit, roll damage and subtract from current HP.
- **Natural 1** on the d20 always misses; **natural 20** always hits and threatens a critical.

### Attack bonus formulas

- Melee: `BAB + Str mod + size mod`
- Ranged: `BAB + Dex mod + size mod − range penalty`

### Iterative attacks (high BAB)

- BAB ≥ +6 → extra attack at BAB −5 (full attack only).
- BAB ≥ +11 → third attack at BAB −10. BAB ≥ +16 → fourth at BAB −15.
- Iteratives come **only from BAB**, not from Str/size/race/enhancement bonuses.
- Each iterative receives all other bonuses (Str, enhancement, etc.) normally.
- A standard-action attack always makes one strike, never iteratives.

### Size modifier (attack & AC)

| Size | Mod | Size | Mod |
|------|-----|------|-----|
| Colossal | −8 | Small | +1 |
| Gargantuan | −4 | Tiny | +2 |
| Huge | −2 | Diminutive | +4 |
| Large | −1 | Fine | +8 |
| Medium | +0 |  |  |

Equal sizes hit each other normally (mods cancel).

### Ranged: range increment

- −2 to attack per range increment past the first.
- Max increments: thrown weapons 5, projectile weapons (bows, crossbows) 10.
- Beyond max → can't hit.

### Firing/throwing into melee

- −4 to attack when shooting at a target engaged in melee with an ally.
- No penalty if the target is two size categories larger than the engaged ally.
- **Precise Shot** feat negates the penalty.
- If multiple allies engage and the target is significantly larger than the closest ally, that ally counts for the penalty (use closest ally to compute).

### Damage

- `damage = weapon dice + Str mod + bonuses`. Minimum 1 damage on a hit.
- Str mod application:
  - Main-hand melee: +Str.
  - Two-handed melee or single one-handed wielded in two hands: +Str × 1.5 (round down). Does NOT apply to light weapons or to bows.
  - Off-hand: +Str × 0.5 (i.e. half).
  - Negative Str penalty applies in full to all attacks including bows, except composite longbows (with Str-rated pull).
  - Throwing weapons (e.g. sling): apply Str mod normally (negative penalties always apply).

### Multiplying damage

- Roll dice once, sum all multipliable damage, then multiply.
- If multiple multipliers stack (e.g. ×2 and ×2), apply once with combined multiplier (e.g. ×3) — see source for stacking table.
- **Extra damage that is NOT multiplied**: precision damage (sneak attack), bonus dice from energy properties (flaming, frost, etc.), other "extra damage" sources.

### Massive damage

- Single attack dealing **≥ 50** damage in one hit → Fort save DC **15** or die outright (regardless of remaining HP).
- Failure = dead even if HP would still be positive.

### Nonlethal damage

- Some attacks deal **nonlethal** damage (subdual): unarmed strikes (default), exhaustion, heat, hits flat-of-blade.
- Tracked separately from HP. Does NOT subtract from current HP — accumulates as a counter.
- When nonlethal accumulated **= current HP** → **staggered** (1 standard OR 1 move per turn).
- When nonlethal **> current HP** → **unconscious** (helpless).
- Heals at 1 nonlethal per character level per hour (much faster than lethal). Magical HP healing also removes equal nonlethal.
- Inflicting nonlethal with a lethal weapon: −4 attack penalty.
- Inflicting lethal with an unarmed/nonlethal weapon: −4 attack penalty.
- Monk unarmed strikes can choose lethal or nonlethal each hit with no penalty.

### Ability damage from attacks

- Some attacks/effects damage ability scores temporarily (ability damage) — see [ability-scores.md](ability-scores.md) for damage vs drain vs penalty.
- Ability damage heals at 1 point per affected ability per night of full rest (2/day with full bed rest).

## Critical hits

- Natural 20 = **threat**. Roll a **confirmation roll** with the same modifiers; if it would also hit AC, the attack is a critical and damage is multiplied per the weapon (×2 default).
- Failed confirmation = normal hit.
- Some weapons have an expanded threat range (e.g. 19–20, 18–20). Any roll in the threat range that hits is a threat; nat 20 is always a threat regardless of AC.
- Increased multiplier from weapons (e.g. ×3 on warhammer): roll the damage dice that many times.
- **Crit immunity**: undead, constructs, oozes, plants, elementals, and creatures with fortification — no crits.
- **Spells & crits**: only spells that require an attack roll (ranged touch like *scorching ray* or *Melf's acid arrow*; melee touch) can crit. Spells with no attack roll (e.g. *fireball*) cannot.

## Armor Class (AC)

`AC = 10 + armor + shield + Dex mod (capped by armor max Dex) + size + natural armor + deflection + dodge + misc`

- **Armor / shield**: bonus from worn armor and shield.
- **Dex**: capped by armor's max Dex; lost when flat-footed, when target of unseen attacker, when balancing/climbing/etc.
- **Size**: same scale as attack mod (small creatures harder to hit).
- **Natural armor**: from race/template.
- **Deflection**: from magic effects warding off blows.
- **Dodge**: bonuses from feats/abilities; stack with each other (unique among bonus types). Lost when Dex is lost.
- **Touch AC** (target of touch attacks): `10 + Dex + size + deflection + dodge` (drops armor, shield, natural armor).
- **Flat-footed AC**: drops Dex and dodge bonuses.

## Hit points & death track

- HP = current capacity to absorb damage.
- **1+ HP**: full function.
- **0 HP — Disabled**: may take 1 standard OR 1 move per turn; performing a standard (or any strenuous activity) inflicts 1 HP of damage (drops to dying). Move actions that aren't strenuous are safe.
- **−1 to −9 HP — Dying**: unconscious; lose 1 HP per round; each round 10% chance to stabilize. Once stable: 10% chance per round to regain consciousness (then becomes disabled at negative HP — losing 1 HP if they then act).
- **−10 HP or lower**: dead. Also: massive Con drain reducing Con to 0 = death; certain effects (e.g. *disintegrate*) destroy the body.
- **Stabilize**: Heal check DC 15 (standard action) or any application of magical healing (1 HP healed turns dying → stable; bringing them to 0 → disabled; to 1+ → full function).

### Recovery and healing

- **Natural healing**: 1 HP per character level per night (8+ hours sleep). 2× per level if full bed rest for a full day. Interrupted rest (significant disturbance) prevents the full benefit.
- **Magical healing** (cure spells, lay on hands, etc.) restores HP up to maximum; removes equal nonlethal damage.
- **Ability damage**: 1 point per affected ability per night of natural rest (2 with bed rest); restoration spells heal it directly.
- Cannot heal above maximum HP through natural or normal magical healing.

### Temporary hit points

- Effects like *aid* grant temp HP separate from current HP.
- Marked alongside current HP; **lost first** when taking damage.
- Do **not** restore upon healing (they're not "lost HP" — they're a buffer).
- When the source ends, current HP drops by the unspent portion (don't go below current real HP).
- Multiple temp-HP sources do **not** stack — keep the largest.

## Casting in combat

- Most spells: casting time = 1 standard action.
- Casting **provokes AoO** unless cast defensively or has casting time of "1 free action" (e.g. quickened).
- **Defensive casting**: Concentration check DC `15 + spell level`. Success → no AoO. Failure → spell lost.
- **Disturbed concentration** mid-cast (e.g. damaged by an AoO): Concentration check DC `10 + damage + spell level` to keep the spell.
- Components:
  - **Verbal (V)**: must speak; *silence* prevents; deafened caster has 20% spell failure on V spells.
  - **Somatic (S)**: needs at least one free hand; can't cast if grappling or both hands occupied.
  - **Material (M)**: must have component in possession (assumed in spell-component pouch unless specified costly).
  - **Focus (F) / Divine focus (DF)**: same as material but reusable.
  - **XP cost**: spent on successful cast; can't cast if would drop below the XP needed to retain current level.
- See [spell-components.md](spell-components.md) for details (future file).

### 1-round and longer casting

- A 1-round-casting spell uses a full-round action **and** completes at the start of the caster's *next* turn (before any other action).
- The caster must maintain concentration the whole interval; loss = spell wasted.
- Provokes AoO only at the start (when cast begins). Caster does not threaten any squares during the cast.

### Touch spells

- Cast as standard; touch attack delivers the spell. Touch attack does not provoke.
- May hold the charge indefinitely. Casting another spell discharges the held one (lost).
- While holding a charge, normal melee attacks or unarmed attacks **automatically discharge** the spell on the touched creature (intentional or not).
- Melee touch attack: ignores armor, shield, natural armor; keeps Dex, size, deflection, dodge.
- Ranged touch attack (e.g. *ray of frost*): same touch AC; provokes AoO like a ranged attack.
- A held touch can target up to **6 willing allies** as a full-round action.

## Combat modifiers

### Cover

- A barrier between attacker and defender (wall, tree, low rampart, ally, etc.).
- **Determining cover**: from any corner of the attacker's square, draw lines to every corner of the defender's square. If any line passes through a wall, an obstacle, or another creature's square → defender has cover.
- **Cover bonuses** (light cover): **+4 AC**, **+2 Reflex** vs effects that originate or burst on the attacker's side (e.g. fireball cast through a doorway).
- **Total cover**: no line of effect → can't be attacked at all (also blocks targeted spells; blast effects may still wrap around corners).
- **Low obstacle** (waist-high): grants cover only to creatures within 9 m (6 squares) of it. Attacker adjacent to the obstacle ignores it.
- **Variable cover**: arrow slits, murder holes, etc. → cover bonuses can double (+8 AC, +4 Reflex), and Hide checks gain +10.
- **Soft cover** (allies): ranged attacks past intervening creatures get only +4 AC cover (no Reflex bonus, no Hide).
- **Cover & AoO**: a defender with any cover from the attacker is immune to that attacker's AoOs.
- **Hide**: cover (and concealment) is required to attempt Hide checks.
- **Cover & melee**: melee attacker may bypass cover by attacking from a position where the obstacle no longer interposes.
- A defender can use cover to **Hide** (Hide skill).

### Concealment

- Something interferes with the attacker's *aim* (fog, smoke, darkness, foliage, magical effects).
- Determine like cover but lines pass through concealing area instead of solid barrier.
- **Concealment**: 20% miss chance — roll d% per attack; fail → miss regardless of attack roll.
- **Total concealment** (no line of sight at all, e.g. invisible target, total darkness): 50% miss chance; cannot make AoOs against; cannot deliver targeted spells without first locating the target.
- **Locating an invisible foe** (without true seeing/blindsense): Listen check, Spot at +20 if moving / +40 if still; even located, attacks still suffer the 50%.
- Multiple concealment sources do **not** stack (use highest).
- **Variable concealment**: DM may set 10–40% based on conditions.
- **Concealment & Hide**: can attempt Hide via concealment; without cover/concealment, Hide is impossible (special class features may bypass).
- **Ignored concealment**: low-light vision pierces dim-light concealment; darkvision eliminates concealment from darkness (but not magical darkness, fog, etc.).

### Flanking

- Two attackers threaten the same enemy from opposite sides → both gain **+2 attack** (flanking bonus, melee only).
- "Opposite sides" = a straight line drawn from the center of one attacker's square to the center of the other passes through opposite borders (or opposite corners) of the defender's square.
- Only **threatening** creatures grant flank (e.g. an unconscious or stunned ally doesn't; a creature with 0-ft natural reach doesn't).
- Larger creatures: any of their squares can serve as the flank position if it would qualify.
- Flanking is a **prerequisite** for rogue Sneak Attack against most Dex-bearing targets in melee.

### Helpless defenders

- Helpless = bound, sleeping, paralyzed, unconscious, or otherwise unable to react.
- **Melee attacks** vs helpless: −4 to defender's effective AC (attacker gets +4); defender's Dex treated as 0 (mod −5); rogue can sneak-attack.
- **Ranged attacks** vs helpless: no melee penalty applies (attack at normal AC), Dex still effectively 0.

### Coup de grace

- Full-round action against an adjacent helpless target with a melee weapon (or bow/crossbow if adjacent).
- **Auto-hit, auto-critical**. Roll critical damage normally, then victim makes Fort save DC `10 + total damage dealt` or **die** (regardless of remaining HP).
- Provokes AoO from any threatener.
- Cannot coup de grace creatures immune to crits.
- Coup de grace through **total concealment** is possible but takes 2 consecutive full-round actions (1 to find the square, 1 to deliver).
- Sneak-attack damage applies (and is multiplied? No — extra damage is not multiplied; sneak-attack dice are added once at multiplied damage step).

### Aid another

- Standard action: make an attack roll vs **AC 10**.
- Success → ally gains your choice of **+2 attack** OR **+2 AC** vs that opponent on their next turn (until your next turn).
- Multiple aiders stack (each +2).
- Can also be used to assist a skill check or a save against ongoing influence (per [skills.md](skills.md)).

### Conditional modifiers (summary)

Attacker is …

| Condition | Melee | Ranged |
|---|---|---|
| Dazzled | −1 | −1 |
| Flanking | +2 | — |
| On higher ground | +1 | +0 |
| Invisible | +2¹ | +2¹ |
| Prone | −4 | — |
| Squeezing into a small space | −4 | −4 |
| Shaken / frightened | −2 | −2 |

¹ Defender loses Dex to AC vs invisible attacker (unless special sense).

Defender is …

| Condition | Melee | Ranged |
|---|---|---|
| Behind cover | −4 AC (i.e. attacker −4) | −4 AC |
| Concealed / invisible | see Concealment | see Concealment |
| Helpless (bound/asleep/paralyzed) | −4 AC + lose Dex | normal AC + lose Dex |
| Kneeling / sitting | −2 AC | +2 AC |
| Pinned | −4 AC | −4 AC |
| Prone | −4 AC | +4 AC |
| Squeezing | −4 AC | −4 AC |
| Stunned | −2 AC + lose Dex | −2 AC + lose Dex |
| Flat-footed | lose Dex | lose Dex |
| Climbing / off-balance | −2 AC + lose Dex | −2 AC + lose Dex |

(Numbers are penalties to defender's AC; "lose Dex" means Dex bonus to AC is denied.)

## Speeding up combat (table conventions)

- Roll attack die and damage die simultaneously (different colors); ignore damage if attack misses.
- Use different-colored dice for each iterative attack to roll all at once.
- Use a die as a duration counter (decrement face per round).

## Cross-references

- [core-mechanic.md](core-mechanic.md) — d20 roll fundamentals.
- [attacks-of-opportunity.md](attacks-of-opportunity.md) — provoking, threatening, AoO timing.
- [combat-maneuvers.md](combat-maneuvers.md) — charge, two-weapon, mounted, disarm, sunder, trip, bull rush, overrun, feint, splash weapons.
- [movement.md](movement.md) — speed, diagonals, terrain, squeezing, big & small.
- [saving-throws.md](saving-throws.md) — Fortitude/Reflex/Will mechanics.
- [conditions.md](conditions.md) — flat-footed, disabled, dying, dead, prone, helpless, staggered.
- [equipment.md](equipment.md) — armor max Dex, weapon properties, range increments.
- [magic.md](magic.md) — spell casting times, components, save DCs.
- [classes.md](classes.md) — BAB and base save progressions.
- [class-features.md](class-features.md) — turn/rebuke undead sub-system.

## Sources

- Manuale del Giocatore — pp. 5, 22
- Manuale del Giocatore — pp. 133–146, 150–153
