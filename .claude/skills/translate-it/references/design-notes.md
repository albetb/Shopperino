# Why translate-it works the way it does

Background for changing the skill. **Not needed to run it** — SKILL.md is the
whole instruction.

## English is never overwritten

The first version of this skill translated over the English where it stood. It
read fine and it was wrong three times over: English became unrecoverable
without git, there was no way to offer both languages, and — worst — it put a
translator's hands on the files the game rules live in.

An English name in `src/data` is rarely just a name. It is the key everything
hangs on:

- `Player.conditions` stores `"Fatigued"` into the save file.
- `conditionSlug("Flat-Footed")` builds the `#flat-footed` anchor.
- `proficiency.js` reads a weapon's `Category` with `startsWith('martial')`.
- `attackParser.js` splits `"2 claws +7 melee (1d6+5)"` on the word `melee`,
  and every animal companion, familiar and wild shape is recomputed from it.
- `spell.Level` (`"Sor/Wiz 2"`) and `spell.School` are parsed, not displayed.

None of that can break now, because a translator never opens those files. The
pack is keyed by JSON path and laid over a copy of the English at render time
(`lib/i18n/prose.js`). The first gate in `verify.py` is simply *did `src/data`
move?*

That is also why there is no ledger. Progress is the pack: a path with an entry
is done. An earlier ledger tried to infer progress by diffing against `HEAD`,
which reset itself to zero the moment anything was committed.

## Which model

Measured, not guessed — the same 20 `feats.json` strings through both, one
pass, no self-checking:

| | Haiku | Sonnet |
|---|---|---|
| Hard gate failures | 17 | 6 |
| Numbers, dice, HTML, hrefs | **0 errors** | **0 errors** |
| Tokens | 37.9k | 74.8k |

Mechanical fidelity is not the problem for either; terminology is. Haiku wrote
*Vantaggio* for Benefit, *tiri* where a check is a *prova*, *famigliare* (a
relative) for familiar, and slipped one Spanish word, `armadura`. The glossary
gate catches most of that but not a language slip, and the retry rounds eat the
token saving.

## `t()` is a function, not a hook

`App.jsx` is keyed on the language, so switching remounts the tree and every
`t()` runs again. A remount is far too blunt for state that changes per frame;
for something changed twice a year it keeps ~150 future component edits down to
wrapping a string instead of threading a hook through every call site.

## What an unassisted Sonnet run got wrong

A full unsupervised run (4 components, 117 pack entries) passed every gate that
existed, and the architecture held — `src/data` was untouched, so no mechanic
could break. What the gates missed is what the newer rules are for:

1. **English drifted.** `Base`/`Bonus` column headers became `t('base')` /
   `t('bonus')`, so an English reader would have seen lower case. It was
   invisible only because that class carries `text-transform: uppercase`.
   Nothing could have caught it → `en_drift.py`.
2. **A domain that did not exist.** `tName('creatures', s.name)` against a
   names pack with no `creatures` key. Every familiar species silently rendered
   in English — the same fallback that makes a missing *name* harmless hides a
   missing *domain* completely → the name-domain gate in `verify.py`.
3. **Half-Italian sentences.** The frame was wrapped and the filling left:
   `` `${trap.save.type} ${t('save DC')}` `` → "Reflex CD del tiro salvezza".
   Also `casterClass` → "cleric", `bypass.type` → "hidden switch".
4. **Sentences chopped into fragments** — `t('asked for')`, `t('of')`,
   `t('the reset')` — because `t()` had no way to interpolate → `tx()`.
5. **Keys the tooling cannot see.** Six `t(variable)` call sites. All were
   covered, but `progress.py` reported "0 missing" without being able to check
   → dynamic keys are now listed.
6. **i18n imported into a math module.** `formatGp` in `trapMath.js` started
   reading the current language, so a pure function stopped being one.

Two things it did better than the skill asked. It caught that
`triggerOptions.map((t) => …)` would shadow the imported `t` and renamed the
parameter. And it refused to glue `{label} + ' bonus'`, passing
`t('Init bonus')` whole instead — the right call, and now the rule.

Its glossary edits were additive and tightening (5 new `strict` terms), never
weakening a check to get past it. That is the behaviour to preserve if the
glossary rules are ever revisited.

## The second unassisted run

Five components, 148 pack entries, with the rules above in place. The
translation itself was clean: `tx()` was used throughout, plurals were branched
correctly (`items.length === 1 ? '{0} item' : '{0} items'`), holes were
reordered where Italian wants them (`'{0} feats'` → `'Talenti {0}'`), and all
16 run-time keys had every value they can take already in the pack. Glossary
edits were additive again. Nothing had to be corrected in what it wrote.

What it exposed were two more holes in the **tooling**, both of which had been
reporting success:

1. **`progress.py` never looked inside a template-literal attribute.**
   ``aria-label={`How ${label} works`}`` matched neither the double-quoted
   attribute pattern nor the JSX-text pattern, so `InfoPopover` reported zero
   bare strings and counted among the finished files. It is used by 16
   components, all of which pass it an already-translated label, so every one
   of them rendered "How Palmo tremante works". `StatInfo`, `StatPill` and
   `DiceRollerSheet` had the same shape. Fixing the scanner moved 28 hidden
   strings into the bare count and two files out of "done".

   This is why Phase 1 now starts with `src/components/common/`. A shared
   component that composes a sentence around a prop has to be translated before
   its callers, or each caller is only half done — and the run's own test had
   already frozen the defect into an assertion (`/How Palmo tremante works/i`),
   which is how a half-translated string becomes permanent.

2. **`T_DYNAMIC` missed a key built from a template.** ``t(`${x} save`)`` is
   more dangerous than `t(someVar)`, not less: the keys it can produce are a
   product of what the hole holds, so the pack needs an entry per combination.
   The pattern excluded backticks along with quotes.

`en_drift.py` also crashed on the Windows console — a `UnicodeEncodeError` on
U+2212 killed the report partway through the files it was reporting on. It
prints through a replacing encoder now.

The lesson worth keeping: both defects were in the gates, not in the
translation, and both presented as green. When a component reports zero bare
strings, check that the scanner can see the shapes that component actually
uses before believing it.

## Glossary gate history

Tuning that took several passes, kept here so it is not undone:

- Italian inflects the head of a phrase — "tiro salvezza" → "tiri salvezza" —
  so terms carry a `stems` list rather than being matched whole.
- English homographs (turn, reach, Will, Fire, skills) false-positived until
  `en_case` and `en_match` were added and some terms demoted to soft.
- The vocabulary check reads `href="skills#jump"` as the word "skill" unless
  tags are stripped first.
- The `never` list (banned synonyms) is only consulted when the agreed word is
  absent. Checking it unconditionally flagged correct prose that happened to
  contain the banned word in another sense.

## Unit conversion

`units.js` matches unit words in prose and converts at render on the manual's
own factors (1 ft = 0.3 m, 1 mile = 1.5 km, 1 lb = 0.5 kg, 1 inch = 2.5 cm).
It reads Italian unit words too (piedi, libbre, miglia, pollici, metri,
chilogrammi), so good Italian cannot break the metric switch — and a
hand-converted measurement fights it or double-converts.

## Still open

- Prose packs are statically imported. Fine at ~15 kB; **wrong once spells and
  monsters land** — that is over a megabyte an English reader should not
  download. `prose.js` names the threshold and the lazy-chunk pattern to copy
  from `loadFile.js`.
- `CONTEXT_SEP` exists for one English string needing two translations
  (`t('Init', 'abbrev')`) and has never been used. Watch for homographs that
  need it: *Reset* as noun and verb, *Save* as button and saving throw.
- `trap.multipleTraps`, `trap.poison.name` and trap names are still English —
  they are `traps.json` prose and belong to a Phase 2 batch, not a component.
