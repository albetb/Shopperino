# Skills — Per-Skill Detail

> Per-skill DCs, action types, retry rules, and skill-specific mechanics. Skip everything captured by [src/data/skills.json](../../src/data/skills.json) (key ability, trained-only, ACP flag, class/cross-class map, synergy table). The system-level rules live in [skills.md](skills.md).

Each section lists only what the JSON does not capture: the *actions* a skill enables, their DCs, the action time, the retry rule when it differs from the default, and any unusual mechanics.

---

## Acrobazia (Tumble)

| Action | DC |
|---|---|
| Treat a fall as 3 m shorter for damage | 15 |
| Tumble at half speed past enemies without provoking AoO | 15 (+2 per enemy after the first) |
| Tumble at half speed *through* an enemy's square | 25 (+2 per enemy after the first) |

- Surface modifiers (cumulative): lightly cluttered/lightly slippery +2; heavily cluttered or wet +5; very slippery +5; sloped/angled +2.
- Cannot Acrobatics through deep mud/water (impossible).
- **Accelerated**: take `−10` to tumble at full speed.
- **Action**: part of move; no extra action.
- **Retry**: usually no (per attempt).
- **Special**: 5+ ranks → Defensive Fighting AC bonus becomes +3 (from +2); Total Defense bonus becomes +6 (from +4). Acrobatic feat → +2 synergy to this skill.

## Addestrare Animali (Handle Animal)

| Action | DC |
|---|---|
| Handle a known-command animal | 10 |
| "Push" an animal (one-shot unknown task) | 25 |
| Teach a command | 15 |
| Train for a general purpose | 15 |
| Rear a wild animal | 15 + animal's HD |

- A trained animal knows up to `Int × ?` commands (Int 1: 3 commands; Int 2: 6 commands).
- Generic purposes: combat-riding (DC 20), fighting (DC 20), guarding (DC 20), heavy labor (DC 15), performing (DC 15), riding (DC 15), hunting (DC 20).
- Training time: weeks per purpose (per JSON or rule table).
- Wounded animal: DC +2.
- **Untrained**: can use Cha check to handle/push only.
- **Synergy**: 5 ranks → +2 Ride and wild-empathy class check.

## Artigianato (Craft)

- Separate skill per craft type (alchemy, armor, weapons, etc.).
- **Pay/material**: object's market price determines time/material cost; raw materials cost ⅓ of market price.
- **Weekly progress**: each week, roll Craft; `result × DC` in silver pieces of progress. If `result × DC ≥ price (in sp)`, object complete. If exceeds 2× or 3× price, completes in ½ or ⅓ time.
- **Daily progress option**: same formula, but daily (price tracked in copper pieces, `cp` = 1/10 sp).
- **Failed check**: by 5+, half raw materials wasted (must repay half).
- **Speed-rush**: voluntary +10 to DC for faster work.
- **Masterwork item**: craft a separate masterwork component (DC 20, price 300 gp weapon / 150 gp armor or shield); component's progress tracked separately, then merged.
- **Repair**: time to repair = same as original; cost = ⅕ of price.
- **Alchemy** (Craft): requires being a spellcaster.
- **Action**: per week or per day, not per round.
- **Retry**: yes, on partial failure; full failure pays half materials again.

## Artista della Fuga (Escape Artist)

| Action | DC |
|---|---|
| Rope bindings | binder's Use Rope check `+10` |
| Net, *animate rope*, *command plants*, *control plants*, *entangle* | 20 |
| Snare spell | 23 |
| Manacles | 30 |
| Tight space | 30 |
| Masterwork manacles | 35 |
| Grappler's grapple | opposed grapple check |

- **Action**: 1 minute (most); 1 round (rope or grappler); ≥1 minute through tight space.
- **Retry**: through tight space — yes (or can *take 20* if not in danger). Through rope/manacle — yes if not damaged by failure.
- **Synergy**: 5 ranks in Use Rope → +2 here (vs ropes). 5 ranks here → +2 to Use Rope to bind someone.

## Ascoltare (Listen)

| Sound | DC |
|---|---|
| Battle | −10 |
| People talking | 0 |
| Person in armor walking slowly | 5 |
| Hostile in heavy armor | 10 |
| 1st-level creature using Move Silently | 15 |
| Whispering | 15 |
| Cat stalking | 19 |
| Owl gliding | 30 |

- Distance penalty: `−1` per 3 m.
- Door: +5 (wood); +15 (stone wall).
- Vs Move Silently target: use the opposed Move Silently result instead of fixed DC.
- **Action**: reactive (free) or move-action focus. Can re-listen as a move action.
- **Retry**: yes (unless circumstance prevents).
- **Special**: half-elves +1 racial; elves/gnomes/halflings +2 racial; *Alertness* feat → +2; fascinated victim: −4; sleeping listener: −10 (success wakes them); ranger vs favored enemy: bonus.

## Camuffare (Disguise)

- Effort yields a disguise; opposed by **observer's Spot**.
- Modifiers to Disguise check: minor details only `+5`; different gender `−2`; different race `−2`; different age category `−2` per category step.
- Spot bonus by familiarity: recognition `+4`; friend `+6`; close friend `+8`; intimate `+10`.
- A separate Spot check is made by each observer; group disguise: average Spot.
- **Action**: 1d3 × 10 minutes to apply.
- **Retry**: yes, but later observers know it was attempted.
- **Special**: *alter self*, *disguise self*, *polymorph* spells grant `+10`; impersonating a specific person via *disguise self* gives `+10`; Persuasive feat: bonus.
- **Synergy**: 5 ranks Bluff → +2 here when acting/impersonating.

## Cavalcare (Ride)

| Action | DC |
|---|---|
| Guide with knees | 5 |
| Stay in saddle (when jolted) | 5 |
| Fight from a war-horse | 10 |
| Cover behind mount | 15 |
| Soft fall | 15 |
| Leap mount | 15 |
| Spur mount (extra speed) | 15 |
| Control non-combat-trained mount in battle | 20 |
| Fast mount/dismount | 20 (ACP applies) |

- ACP applies.
- Military saddle: +2 circumstance to Ride for stay-in-saddle.
- Action: instantaneous reactions (no action) for most defensive uses; standard for fast mount/dismount.
- Prerequisite for several mounted-combat feats.

## Cercare (Search)

- DC by task:
  - Find object in cluttered space: **10**.
  - Notice a typical secret door: **20**.
  - Find a non-magical difficult trap (rogue-only above DC 20): **21+**.
  - Find a magical trap (rogue-only): **25 + spell level**.
  - Notice a well-hidden secret door: **30**.
  - Find a footprint: varies.
- **Range**: must be within 1.5 m of the object/surface.
- **Action**: 1 full-round per 1.5 m × 1.5 m area or 1.5 m³ of objects.
- **Trapfinding gate**: only rogues (and others with the *trapfinding* class feature) can use Search to find traps with DC > 20. Stone traps DC > 20 may also be found by dwarves (racial trapfinding-lite).
- **Special**: elves passively get a Search check when within 1.5 m of a secret/hidden door without actively searching; same for half-elves with `+1`.
- *Investigator* feat → +2 here; 5 ranks Knowledge (architecture) → +2 here for secret-door/compartment search; 5 ranks here → +2 to Survival (track).

## Concentrazione (Concentration)

- DC depends on the distraction:
  - Damaged during action: **10 + damage taken**.
  - Damage from continuous source: **10 + ½ of damage in the round**.
  - Distracted by a spell: **DC of the spell's save** (or its caster level if no save).
  - Vigorous motion (galloping, choppy boat): **10**.
  - Violent motion (running cart, small boat in rapids): **15**.
  - Extremely violent (earthquake): **20**.
  - Entangled: **15**.
  - Grappled / pinned: **20** (only spells with no somatic/material components).
  - Weather — strong wind + pelting rain: **5**.
  - Weather — wind with hail/grit/debris: **10**.
- **Action**: not an action itself; rolled as part of the action being interrupted.
- **Failure**: spell/action fails; spell slot is lost.
- **Use cases**: maintain spellcasting through distraction; cast defensively to avoid AoO (DC 15 + spell level — succeed = no AoO); maintain active spell concentration.
- **Special**: *Combat Casting* feat → +4 here when casting defensively or while grappled.

## Conoscenze (Knowledge)

- Each Knowledge field is a **separate skill**: arcana, architecture/engineering, dungeoneering, geography, local, nature, nobility/royalty, planes, religion, history (10 fields total).
- DC by question: simple/common 10; harder 15; really tough 20–30.
- Identifying a monster's special abilities: DC = `10 + monster HD`; per +5 over DC, one more piece of info.
- **Untrained**: any *common* knowledge is DC ≤ 10 and usable untrained as Int check.
- **Action**: usually none (instantaneous mental recall).
- **Retry**: no.
- **Synergies (outgoing)**: each Knowledge field at 5+ ranks gives +2 to a specific other check — full list in skills.json. Examples: arcana → Spellcraft; dungeoneering → Survival underground; geography → Survival not getting lost; local → Gather Information; nature → Survival outdoors; nobility → Diplomacy; planes → Survival on other planes; religion → turning undead; history → Bardic Knowledge; architecture → Search for secret doors.

## Decifrare Scritture (Decipher Script)

- Base DC: simple text **20**; standard text **25**; obscure/old text **30**.
- On success: understand the gist of a page (or equivalent) of text.
- On miss by ≤4: DM rolls Wisdom check; on a low Wis result, the character believes a wrong interpretation. The check is made *secretly*.
- **Action**: 1 minute (10 full-round actions) per page.
- **Retry**: no.
- **Synergy**: 5 ranks → +2 to Use Magic Device on scrolls.

## Diplomazia (Diplomacy)

- Influences an NPC's attitude. Categories: Hostile → Unfriendly → Indifferent → Friendly → Helpful.
- DC depends on the **target's current attitude** and the **desired attitude** — see the influence-table in source: 5 (move from Unfriendly to Indifferent) up to 50 (move from Hostile to Helpful).
- Effect lasts: NPC stays at new attitude while the character is present, then 1d6 × 10 minutes after; then settles back toward its base attitude.
- **Action**: 1 minute of conversation. Rushed: standard action with `−10`.
- **Retry**: discouraged — additional attempts on the same NPC don't help (unless circumstances change).
- **Synergies (incoming)**: 5 ranks Bluff / Knowledge (nobility & royalty) / Sense Motive → +2 each.

## Disattivare Congegni (Disable Device)

| Difficulty | Time | DC |
|---|---|---|
| Simple | 1 round | 10 |
| Tricky | 1d4 rounds | 15 |
| Difficult | 2d4 rounds | 20 |
| Wicked | 2d4 rounds | 25 |
| Magical trap | 2d4 rounds | **25 + spell level** |
| Leave no trace | — | +5 to DC |

- **Failure by 4 or less**: can retry, but knows it's failed.
- **Failure by 5+**: trap is sprung / damage done.
- **Rigging an item to fail later**: possible (e.g. saddle that breaks after some time).
- **Trapfinding gate**: only rogues (and trapfinding-bearers) can disable magical traps and DC>20 traps (with the *trapfinding* class feature).
- **Action**: per table above.
- **Special**: thieves' tools (mw): +2 circumstance; without tools (improvised): `−2`. *Nimble Fingers* feat → +2.

## Equilibrio (Balance)

| Surface | DC |
|---|---|
| Wide (16–30 cm) | 10 |
| Medium (5–15 cm) | 15 |
| Narrow (< 5 cm) | 20 |

- Surface modifiers: lightly obstructed +2; heavily obstructed +5; lightly slippery +2; very slippery +5; sloped +2.
- Failure ≤4: cannot move that round. Failure ≥5: fall (Reflex save DC=5 to grab edge).
- Loses Dex bonus to AC while balancing; 5+ ranks → not considered off-balance (keeps Dex).
- **Accelerated**: `−5` to move at full speed (need a Balance check per move action).
- **Action**: no action (reactive).
- **Synergy**: 5 ranks Tumble → +2 here.

## Falsificare (Forgery)

- Opposed by **reader's Forgery check**, with modifiers:
  - Document type unknown to reader `−2`; partially known `0`; well known `+2`.
  - Handwriting unknown `−2`; passingly known `0`; well known `+2`; intimately known `+4`.
  - Document contradicts reader's expectations `−2`.
- **Action**: ~1 minute simple; 1d4 minutes per page complex.
- **Retry**: no per document/reader.
- **Restriction**: must be literate in the document's language.

## Guarire (Heal)

| Task | DC |
|---|---|
| First aid (stabilize dying) | 15 |
| Long-term care | 15 |
| Treat caltrops / *spike growth* damage | 15 |
| Treat poison | poison's save DC |
| Treat disease | disease's save DC |

- **First aid**: stabilizes a dying creature (no HP healed). Standard action.
- **Long-term care**: 8 h light activity → patient heals 2 HP per level / day (vs normal 1) and 2 ability damage / day. One healer cares for up to 6 patients. Cannot self-treat.
- **Treat caltrops/etc.**: removes speed-halving effect after 10 minutes work + DC15.
- **Treat poison**: roll for the poisoned creature on each save the poison forces; uses Heal in place of their Fort save if better.
- **Treat disease**: same model for disease saves.
- **Action**: 1 standard action (first aid), longer for the others.
- **Special**: *Self-Sufficient* feat → +2. Healer's kit → +2 circumstance.

## Intimidire (Intimidate)

- Force a target into being friendly (briefly) or demoralize them in combat.
- **Forced friendliness**: opposed check — Intimidate vs `target's (level or HD) + Wis mod + (target's morale save mod vs fear)`. On success: target acts friendly for 1 round + 1d6×10 min, then becomes Unfriendly (if was Indifferent) or Hostile (if Unfriendly).
- **Demoralize (combat)**: standard action; same opposed check. On success: target is **shaken** for 1 round (−2 attack, ability checks, saves).
- Modifiers: target is one size category larger → `−4`; smaller → `+4`. Fear-immune targets cannot be intimidated.
- **Action**: 1 minute for attitude; 1 standard action for demoralize.
- **Special**: *Persuasive* feat → +2; 5 ranks Bluff → +2 here.

## Intrattenere (Perform)

- Many separate Perform skills: vocal (sing, oratory, comedy), instrument by family (strings, wind, percussion, keyboard, dance, acting). Ranks in one don't translate to another.
- DC scale (income):
  - 10 = pass-the-hat (1d10 cp/day);
  - 15 = pleasant (1d10 sp/day);
  - 20 = great show (3d10 sp/day; possible invitation);
  - 25 = memorable (1d6 gp/day; regional reputation);
  - 30 = extraordinary (3d6 gp/day; national reputation; planar attention).
- Masterwork instrument: +2 circumstance.
- **Bardic music** gates: e.g. 3 ranks for *inspire courage*, 6 for *inspire competence*, 9 for *suggestion*, 12 for *inspire greatness*, 15 for *song of freedom*, 18 for *inspire heroism*, 21 for *mass suggestion*. (Bard's class feature; see [class-features.md](class-features.md).)
- **Action**: typically an evening's work (or a day).
- **Retry**: yes, but failed shows hurt future DCs (+2 per failure).

## Muoversi Silenziosamente (Move Silently)

- Opposed by **Listen** of any hearer.
- At ≤ ½ speed: no penalty. > ½ to full: `−5`. Run/charge: `−20`.
- Surface mods: noisy (gravel, undergrowth) `−2`; very noisy (dense underbrush, deep snow) `−5`.
- **Action**: part of movement (no extra action).
- **Special**: *Stealthy* feat → +2. Halfling racial +2. Cat familiar → +3 to its master.

## Nascondersi (Hide)

- Opposed by **Spot**.
- At ≤ ½ speed: no penalty. > ½ to full: `−5`. Run/charge: `−20`.
- **Size** modifier: Colossal `−16`, Gargantuan `−12`, Huge `−8`, Large `−4`, Medium 0, Small `+4`, Tiny `+8`, Diminutive `+12`, Fine `+16`.
- **Cover or concealment required** — at least one-quarter cover/concealment to attempt at all (with some exceptions).
- **Sniping**: hidden, fire ranged, re-hide at `−20`. Move action.
- **Create a diversion**: Bluff check; on success, attempt Hide while observers' attention is shifted.
- Invisible: +40 to Hide if motionless, +20 if moving.
- **Action**: usually no extra action (part of movement).
- **Special**: *Stealthy* feat → +2. Ranger at 13th level can Hide in natural terrain even without cover (camouflage); at 17th, even while observed (hide in plain sight).

## Nuotare (Swim)

| Water | DC |
|---|---|
| Calm | 10 |
| Rough | 15 |
| Stormy | 20 |

- Per round in water, roll Nuotare.
- Success: move at ½ speed (move action) or ¼ speed (move action) — table varies. Failure: no progress. Failure by 5+: go under, start drowning.
- Underwater: can hold breath for `2 × Con score` rounds while not exerting; with combat actions, only ½ that.
- After breath runs out: Con check DC 10, +1 per round, or begin drowning.
- **ACP applies and is doubled** (armor + load).
- **Action**: a move action moves ¼ speed; a full-round moves ½ speed.
- **Special**: *Athletic* feat → +2. *Endurance* → +4 vs nonlethal fatigue damage from swimming.

## Osservare (Spot)

- Distance penalty: `−1` per 3 m.
- Distracted observer: `−5`.
- See an invisible creature near you: opposed Spot, but DC ≥ 20 minimum.
- Used to: notice ambushers (opposed by Hide), see through Camuffare, lip-read (DC 15, requires line of sight to lips, no other action that minute, gets gist on success — only ½ normal speed of moving allowed).
- Lip-read fail by 5+: false interpretation.
- **Action**: reactive (free) for ambushers; full minute concentration for lip-reading.
- **Special**: *Alertness* feat → +2; elves +2 racial; half-elves +1 racial; falcon familiar → +3 to master in bright light; owl familiar → +3 in dim light. Ranger vs favored enemy: bonus.

## Parlare Linguaggi (Speak Language)

- Not a check skill. Each rank = one new language fluently spoken/read.
- Start with 1–2 racial languages + Int-mod bonus languages at creation.
- **Untrained**: cannot be used (you either know a language or don't).
- Barbarian illiteracy exception (see [languages.md](languages.md)).

## Percepire Intenzioni (Sense Motive)

- DC 20: hunch — sense that something is off about a person/situation.
- DC 25 (or 15 if dominated): detect enchantment-influence on someone.
- Distinguish a secret message: opposed by speaker's Bluff (used to convey the secret); listener (eavesdropper) does the same at `−2` per missing party detail.
- **Action**: 1 minute (or longer to read motives more deeply).
- **Retry**: no per attempt.
- **Special**: ranger vs favored enemy: bonus. *Negotiator* feat → +2; 5 ranks here → +2 to Diplomacy.

## Professione (Profession)

- Each profession is a separate Profession skill (cook, sailor, miner, etc.). Trained only.
- Weekly check: earn ½ check result in gp/week as wages for normal work.
- Specific tasks (DM-set DCs).
- **Untrained**: ~1 sp/day as unskilled labor.
- **Action**: per-week or per-task.

## Raccogliere Informazioni (Gather Information)

- Spend 1d4+1 hours and a few gp on drinks/bribes; roll vs DC 10 for general gossip.
- More specific or sensitive info: DC 15–25+.
- **Action**: 1d4+1 hours.
- **Retry**: yes, but repeated attempts attract attention.
- **Special**: half-elf +2 racial. 5 ranks Knowledge (local) → +2 here; *Investigator* feat → +2.

## Raggirare (Bluff)

- Opposed by **target's Sense Motive**.
- Modifiers to Sense Motive (target's side):
  - Lie is slightly hard to believe `+5`;
  - Lie is hard to believe `+10`;
  - Lie is hard to swallow `+20`;
  - Target wants to believe `−5`.
- **Feint in combat**: standard action; opposed Bluff vs Sense Motive; success → target loses Dex bonus to AC vs your next attack (must come before your next turn). Non-humanoids: `−4` penalty; animal Int 1–2: `−8`; non-intelligent: impossible.
- **Create a diversion** (to Hide): standard action; on success, attempt Hide.
- **Pass a secret message**: DC 15 simple, DC 20 complex; eavesdropping listener opposes with Sense Motive at `−2` per missed detail; fail by 5+: false info conveyed.
- **Action**: standard for combat feint or diversion; longer for secret message.
- **Retry**: same target & circumstance — no. Different circumstance: maybe.
- **Special**: ranger vs favored enemy: bonus. *Persuasive* feat → +2. 5 ranks Bluff → +2 to Diplomacy, Intimidate, Sleight of Hand, and Disguise (when acting).

## Rapidità di Mano (Sleight of Hand)

| Action | DC |
|---|---|
| Palm a coin-sized object | 10 |
| Lift a small object from a person | 20 |
| Conceal a small object on yourself | DC 20 (vs observer Spot/Search) |

- Hide a small dagger: +2 to opposed Spot/Search; smaller object: +4.
- Opposed by Spot (observation) or Search (concealment).
- **Retry**: yes against the same target, but DC +10 if the observer is the same.
- **Action**: usually a standard action; can be a free action with `−20`.
- **Untrained**: can attempt only DC ≤ 10 actions; cannot use to lift from people.
- **Special**: *Deft Hands* feat → +2. 5 ranks Bluff → +2 here.

## Saltare (Jump)

- **Speed modifier** to Saltare: if base land speed < 9 m, `−6` per 3 m below 9 m; if > 9 m, `+4` per 3 m above 9 m.
- Requires a 6-m running start; without it, **DC is doubled**.

| Long jump (with running start) | DC |
|---|---|
| 1.5 m | 5 |
| 3 m | 10 |
| 4.5 m | 15 |
| 6 m | 20 |
| 7.5 m | 25 |
| 9 m | 30 |

- Failure mid-jump (long): land at point reached; failure by ≤4 = "1.5 m short" — Reflex DC 15 to catch the edge; fail = fall.
- High jump (vertical from running start): DC = `4 × cm of clearance / 30 cm` (so a 30 cm hop is DC 4; 90 cm is DC 12).
- Without a running start: double the DC.
- High jump from a standing position: no DC modifier reduction.
- Vertical reach for size categories: Medium 2.4 m; Small 1.8 m; Tiny 1.2 m; ... up to Colossal 38.4 m.
- Hop in place onto a low surface: DC 15.
- **Jumping down**: DC 15 to take damage as if fallen 3 m less than actual.
- **Action**: part of move (no extra action).
- **Special**: *Run* feat → +4 to jumps with a running start. Halfling racial +2. *Acrobatic* → +2.
- 5 ranks Tumble → +2 here; 5 ranks here → +2 Tumble.

## Sapienza Magica (Spellcraft)

| Action | DC |
|---|---|
| Identify a glyph of warding from *read magic* | 13 |
| Identify a spell as it is cast (must see/hear it) | **15 + spell level** |
| Learn a spell from a spellbook / scroll (wizards) | 15 + spell level |
| Prepare a borrowed spell from another wizard's spellbook | 15 + spell level |
| Identify magic on a single object/creature via *detect magic* | **15 + ½ caster level** (min 15) |
| Identify a *symbol* via *read magic* | 19 |
| Identify a spell in effect (area) | 20 + spell level |
| Identify materials shaped by magic (e.g. wall of iron) | 20 + spell level |
| Decipher a scroll's spell without *read magic* | 20 + spell level (1 full round) |
| After a save vs a spell, identify it | 25 + spell level |
| Identify a potion | 25 (1 minute) |
| Draw a dimensional anchor diagram in a magic circle | 20 (10 minutes) |
| Comprehend a strange/unique magical effect | 30+ |

- **Action**: usually no action (during a save); 1 round to identify being cast; 1 min for potion; 10 min for diagram; per-table for others.
- **Retry**: no on most identifications.
- **Special**: specialist wizard +2 to identify their school's spells (and `−5` for prohibited schools — and some actions impossible for prohibited schools).
- *Magical Aptitude* feat → +2.
- 5 ranks Knowledge (arcana) → +2 Spellcraft; 5 ranks Spellcraft → +2 Use Magic Device on scrolls; 5 ranks Use Magic Device → +2 Spellcraft for scrolls.

## Scalare (Climb)

| Surface | DC |
|---|---|
| Slope ≤ 60° (walkable) | 0 |
| Rope with knots / leaning wall | 5 |
| Knotted rope or rope + wall to brace; *rope trick* | 10 |
| Surface with ledges (e.g. ship rigging) | 10 |
| Any surface with adequate handholds (rough rock) | 15 |
| Rough surface with sparse handholds (dungeon wall) | 20 |
| Rough natural rock wall | 25 |
| Brick wall | 25 |
| Overhang or ceiling with handholds for hands only | 25 |
| Perfectly smooth vertical | — (impossible) |

- DC modifiers: chimney climb (push between opposing walls) `−10`; corner (push between perpendicular walls) `−5`; very slippery `+5`.
- Failure by ≤4: no progress (no fall). Failure by 5+: **fall** from current height.
- Climbing speed: ¼ base unless accelerated (`−5` to move at ½ speed).
- Loses Dex bonus to AC while climbing; one hand free can use a single weapon. Cannot use a shield.
- **Damage while climbing**: must re-Climb at DC of the surface to keep grip; failure = fall.
- **Make own handholds**: 1 minute per 90 cm with a piton; DC 15 afterwards.
- **Catch a falling character**: melee touch attack to grab; Climb DC = wall DC `+10` to hold (cannot exceed carrying capacity).
- **Action**: part of movement.
- **Special**: lizard familiar → +3 to master. Halfling racial +2. *Athletic* feat → +2.
- 5 ranks Use Rope → +2 to Climb when using a rope.

## Scassinare Serrature (Open Lock)

| Lock quality | DC |
|---|---|
| Very simple | 20 |
| Average | 25 |
| Good | 30 |
| Amazing | 40 |

- Requires lock-picking tools. Without them: improvised at `−2`. Masterwork picks: `+2` circumstance.
- **Action**: 1 round (full-round).
- **Untrained**: impossible (trained only). May try to break the lock with strength (see "breaking objects").
- **Special**: *Nimble Fingers* feat → +2.

## Sopravvivenza (Survival)

| Action | DC |
|---|---|
| Cope in wilderness (half speed, food/water for self + 1 per 2 over DC) | 10 |
| Cope in severe weather (+2 Fort, ½ damage; share with 1 ally per 1 over DC) | 15 |
| Avoid natural hazards (e.g. quicksand) | 15 |
| Predict weather 24 h ahead | 15 (each +5 = +1 day forecast) |
| Track | by Track feat & terrain |

- **Action**: per task; tracking is full-round per move action while tracking.
- **Track feat** required to follow tracks with DC > 10 (rangers have it free).
- **Retry**: per day for survival; per hour outdoor / 10 min indoor for tracks.
- **Special**: ranger vs favored enemy: bonus. *Self-Sufficient* feat → +2 Survival and Heal.
- 5 ranks → +2 Knowledge (nature). Many Knowledge fields at 5 ranks give +2 Survival in their domain.

## Utilizzare Corde (Use Rope)

| Action | DC |
|---|---|
| Tie a firm knot | 10 |
| Anchor a grappling hook | 10 (+2 per 3 m of throw; max throw 4.5 m + 3 m per +5) |
| Tie a special knot (slip, slipknot, knot you can untie) | 15 |
| Tie a one-handed knot | 15 |
| Splice ropes | varies |
| Bind a person | opposed Escape Artist (+10 to Use Rope) |

- Silk rope: +2 circumstance. *Animate rope* spell + Use Rope: +2 to any Use Rope check using that rope (cumulative).
- **Special**: *Deft Hands* feat → +2.
- 5 ranks → +2 Climb (with rope); +2 Escape Artist (when escaping ropes).
- 5 ranks Escape Artist → +2 Use Rope (when binding someone).

## Utilizzare Oggetti Magici (Use Magic Device)

Lets a character emulate the requirements to use a magic item: class feature, alignment, ability score, race, even the act of casting from a scroll.

| Action | DC |
|---|---|
| Activate blindly (item activated with command word/etc., unknown method) | 25 |
| Decipher a written spell (substitute for *read magic*) | 25 + spell level |
| Emulate an alignment | 30 |
| Emulate a class feature | 20 |
| Emulate an ability score (to meet a casting min) | (see text) |
| Emulate a race | 25 |
| Use a wand | 20 |
| Use a scroll | 20 + caster level |

- **Failure by 9 or less**: nothing happens, retry possible after 24 h.
- **Failure by 10+ (natural 1) on a scroll**: **mishap** — the energy releases unpredictably (2d6 damage typical).
- Only one emulation at a time (one Use Magic Device check per emulation).
- Each Use Magic Device check applies for the duration of that activation only.
- **Action**: as the item's activation requires.
- **Restriction**: trained only. No taking 10. No aid another.
- **Special**: *Magical Aptitude* feat → +2.
- 5 ranks Spellcraft → +2 here (for scrolls); 5 ranks Decipher Script → +2 here (for scrolls); 5 ranks here → +2 Spellcraft (to decipher scrolls).

## Valutare (Appraise)

| Object | DC |
|---|---|
| Common, well-known | 12 |
| Rare or exotic | 15, 20, or higher |

- On success: estimate value within 10% (DM rolls `2d6 + 3`, multiplies by 10%, multiplies by real price — that's the estimate when the check fails; success → correct).
- Magnifying glass: +2 circumstance for small/finely detailed objects (gems).
- Merchant's scale: +2 for objects priced by weight (precious metals).
- **Action**: 1 minute per item.
- **Retry**: no on the same object.
- **Special**: dwarves +2 racial vs stone/metal objects. *Diligent* feat → +2.
- 5 ranks Craft → +2 here (for items of that craft).

---

## Cross-references

- [skills.md](skills.md) — skill *system* (point pool, ranks, max ranks, take 10/20, aid another, synergy mechanic, ACP, format spec).
- [class-features.md](class-features.md) — class-specific skill interactions (trapfinding, favored enemy, bardic music gates, wild empathy, camouflage, hide in plain sight, evasion, slippery mind).
- [src/data/skills.json](../../src/data/skills.json) — per-skill key ability, class/cross-class flags, ACP flag, trained-only flag, synergy mappings.
- [feats.md](feats.md) — Skill Focus, Magical Aptitude, Investigator, Persuasive, Stealthy, Acrobatic, Athletic, Self-Sufficient, etc. (when extracted).

## Sources

- Manuale del Giocatore — pp. 67–86
