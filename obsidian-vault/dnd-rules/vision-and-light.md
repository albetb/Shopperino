# Vision and Light

> Light levels, special vision modes, miss chances and skill effects from poor visibility.

## Light levels

| Level | Combat effects | Notes |
|-------|---|---|
| Bright (sunlight, daylight spell) | Normal visibility | Some creatures (e.g. drow) are dazzled. |
| Normal (lantern, lit room) | Normal visibility for those who can see | Default for indoor lit areas. |
| Shadowy / dim (low torch, dusk) | All creatures gain **concealment** (20% miss chance to attackers); Hide checks possible without cover | Low-light vision sees as if normal. |
| Darkness (no light source, moonless night) | Creatures without darkvision are **blinded**: 50% miss chance, lose Dex to AC, −2 AC, half speed, −4 to Search and Str/Dex skill checks | Darkvision sees normally up to range; can't be hidden from. |

- Concealment from dim light is a 20% miss chance per attack (see [combat.md](combat.md)).
- Total darkness for a sighted creature = total concealment (50% miss), plus blinded condition.

## Vision modes

### Normal vision

- Functional in bright and normal light only. In dim light, suffers concealment-as-attacker. In darkness, blinded.

### Low-light vision (elves, gnomes, half-elves)

- Sees **2× the radius** of any non-magical or magical light source.
- A torch (normal radius 6 m bright, 12 m shadowy) extends to **12 m bright, 24 m shadowy** for a low-light viewer.
- In dim light or shadow, they perceive as if it were normal light (no concealment penalty).
- Does **not** help in **total** darkness.

### Darkvision (dwarves, half-orcs)

- Sees normally in **total darkness up to listed range** (60 ft / 18 m typical).
- Vision is **black-and-white** within darkvision range; texture and shape preserved.
- Does **not** pierce: magical darkness (e.g. *darkness* spell), concealing fog/smoke, or other concealment sources unrelated to lighting.
- Hiding from a darkvision creature in lightless areas requires cover (or a magical alternative); concealment from darkness is unavailable.

### Blindsense / blindsight (some creatures)

- **Blindsense**: aware of creatures within range without seeing them; targets still benefit from concealment (50%) but the user can pinpoint location.
- **Blindsight**: full equivalent of vision within range; ignores concealment (including invisibility, darkness, fog).

## Light source ranges and durations

The bright / shadowy radii follow each item's specification. Approximate generators (item-specific values are in [src/data/items.json](../../src/data/items.json)):

- A typical **torch**: bright 6 m (4 sq), shadowy 12 m (8 sq); duration ~1 hour.
- A typical **lantern**: bright 9 m, shadowy 18 m; duration depends on oil (~6 h per pint).
- **Sunrod**: bright 9 m, shadowy 18 m; duration 6 hours; cannot be extinguished early.
- **Light** spell: bright equivalent on a touched object (per spell description).
- **Daylight** spell: full sunlight in a 18 m radius (counts as bright; can dazzle drow).
- **Continual flame** / *continual light*: permanent torchlight equivalent (no fuel).

## Concealment from non-light sources

Non-lighting concealment sources also impose miss chances (do not stack with darkness):

- **Fog / smoke / heavy dust**: concealment (20%) within a few meters; total concealment further out.
- **Foliage / dense underbrush**: 20% concealment.
- **Magical darkness** (e.g. *darkness* spell): treats area as one step worse; even darkvision creatures lose darkvision in it.

Multiple concealment sources do **not** stack — use the highest miss chance.

## Bonuses for staying still / hiding

- **Spot** vs an invisible creature: +20 if the target moves; +40 if it stays still — even when a creature is "located," the attacker's miss chance still applies.
- A hidden creature that attacks reveals itself (Hide check needed again to re-hide).

## Cross-references

- [combat.md](combat.md) — concealment miss chances, total concealment vs invisible.
- [conditions.md](conditions.md) — blinded, dazzled, dazed (and stunned for ambient AC effects).
- [races.md](races.md) — which races have low-light vision vs darkvision and the listed range.
- [skills.md](skills.md) — Hide, Move Silently, Spot, Search bonuses/penalties from light level.
- [magic.md](magic.md) — *light*, *darkness*, *daylight*, *deeper darkness*, etc.
- [movement.md](movement.md) — low visibility doubles square cost.

## Sources

- Manuale del Giocatore — pp. 164–165 (light & vision; light source table)
