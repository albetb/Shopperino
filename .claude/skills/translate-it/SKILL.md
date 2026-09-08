---
name: translate-it
description: Translate the Shopperino app into Italian — the UI first, then the D&D text in src/data. Use whenever the user asks to translate part of the app, continue the translation, do the next batch, translate a component or a data file, or asks what is left to translate. Handles the glossary, the frozen fields that must stay English, and the verification that the game rules survived.
---

# Translating Shopperino into Italian

The app becomes Italian. Nothing is left half-English, and no rule changes on the
way. That second half is the hard part, and it is what this skill is mostly about.

**The translation must not be book-accurate.** The user has said so explicitly:
matching the Italian manuals word for word does not matter. What matters is that
the meaning and the mechanics survive, and that the same English term always
becomes the same Italian one.

---

## The one idea to understand first

**The model speaks English. The screen speaks Italian.**

An English name in `src/data` is almost never just a name. It is also the key
everything hangs on:

- `Player.conditions` stores `"Fatigued"` into the save file.
- `conditionSlug("Flat-Footed")` builds the `#flat-footed` anchor the info
  sidebar opens.
- `proficiency.js` reads a weapon's `Category` with `startsWith('martial')`.
- `shop.js` matches a saved shop row with `r.Name === savedName`.
- `attackParser.js` splits `"2 claws +7 melee (1d6+5)"` on the word `melee`.

Translate one of those and nothing throws. The app just quietly stops working:
a companion loses its attacks, a character loses its conditions, a proficiency
silently becomes false. **Nobody notices until a session at the table.**

So there are two different jobs, and confusing them is the main way to cause
damage:

| What | Where the Italian goes |
|---|---|
| A literal written in a component | Translated **in place**, in the JSX |
| Prose in `src/data` (descriptions) | Translated **in place**, in the JSON |
| A **name** or **category** in `src/data` | Stays English. Italian goes in `src/data/it/names.json`, read through `tName()` |

This is the same shape the units feature already uses: the model keeps the
canonical value, and the edge decides what the reader sees.

---

## If you were given no instructions

`/translate-it` on its own is a complete instruction. It means: **pick up where
the work left off, do a session's worth, stop and report.** Concretely:

1. Run `progress.py`.
2. **Pick the target.** If the user named a file or a phase, that is the target.
   Otherwise take the first thing with work left, in phase order: a component
   from the top of the `--ui` list, or else the next data file in the phase-2
   order below.
3. **Do a session's worth**, then stop:
   - data — **6 batches of 30 strings**, or the file finishes, whichever first;
   - UI — **5 files**, each with its test.
4. **Report**: what you translated, the `progress.py` numbers, anything you left
   alone and why, and which files are ready to commit.

### The three rules that are not yours to bend

- **A failing gate is fixed in the translation, never in the manifest.** Never
  edit `fields.json` to make `verify.py` quiet. That file is what stops a
  translation from changing the rules of the game.
- **You may ADD a term to `glossary.json`. You may never change one that is
  already there.** Adding is how the vocabulary grows; changing is how
  *Stregone* silently becomes *Incantatore* three weeks later.
- **If the same gate fails twice on the same string, stop and ask.** Two
  attempts is a translation problem; three is a misunderstanding, and grinding
  on it just produces confident nonsense.

### Which model should be doing this

Measured, not guessed — the same 20 `feats.json` strings through both, one pass,
no self-checking:

| | Haiku | Sonnet |
|---|---|---|
| Hard gate failures | 17 | 6 |
| Numbers, dice, HTML, hrefs | **0 errors** | **0 errors** |
| Tokens | 37.9k | 74.8k |

Mechanical fidelity is not the problem for either. Terminology is. Haiku wrote
*Vantaggio* for Benefit, *tiri* where a check is a *prova*, and *famigliare*
(a relative) for familiar — and slipped one Spanish word, `armadura`. The
glossary gate catches most of that, but not a language slip and not a plausible
synonym, and the retry rounds eat the token saving.

**Use Sonnet.** Haiku is only sensible on data prose you intend to have checked
hard, and even then it converges slower than it saves.

---

## Before you touch anything

1. **Read the glossary**: [references/glossary.md](references/glossary.md).
   One English term has exactly one Italian translation. *Sorcerer* is
   **Stregone** — never Incantatore, never Sciamano, not once, anywhere.
   Look a term up without reading the whole file:

   ```bash
   python .claude/skills/translate-it/scripts/glossary.py sorcerer "saving throw"
   ```

2. **See what is left**:

   ```bash
   python .claude/skills/translate-it/scripts/progress.py
   ```

3. **Know the order of work.** Do not start phase 3 while phase 1 is unfinished.

---

## The phases

**Phase 1 — the UI.** ~1,260 strings across ~150 components in `src/components`,
plus a handful of display strings that live in `src/lib` (`itemsUtils.js`,
`contributions.js`, `conditionEffects.js`, `trapCR.js`, `monsterBook.js`,
`shopShare.js`). This is what the user sees first, so it comes first.

**Phase 2 — the data prose.** ~6,700 strings, 1.6 M characters: spell,
item, feat, skill, class, race, trap and monster descriptions. Do them in this
order, easiest and most visible first:

`tables.json` → `skills.json` → `feats.json` → `races.json` → `classes.json` →
`traps.json` → `items.json` → `spells.json` → `animals.json` → `vermin.json` →
`monsters.json`

**Phase 3 — the names.** Item, spell, feat, skill and monster names, into
`src/data/it/names.json`, plus the display sites that must start calling
`tName()`. Leave this until last: it is the only phase that also changes
components, and it is worthless until the prose around it is Italian.

---

## Workflow A — translating a component

Do **one file and its test together**. Never leave a test asserting on English
text that no longer renders.

1. Read the component.
2. Translate every string a person reads: JSX text, `title`, `placeholder`,
   `aria-label`, `alt`, `label`, `eyebrow`, `hint`, and any string literal that
   ends up on screen.
3. **Do not translate**: `className`, `icon` names (`"add"`, `"expand_less"` —
   they are Material Symbols ligatures), CSS custom properties, `key`s, action
   types, or any string compared against data (`'Str'`, `'Simple Weapons'`).
4. If the file displays a **name that came from data or the model**, do not
   hardcode Italian — call `tName('<domain>', name)` and add the entry to
   `src/data/it/names.json`.
5. **Check the three things a translation quietly breaks:**
   - **Search boxes.** A filter written as `c.name.toLowerCase().includes(q)`
     now searches English text the user cannot see. Filter on the Italian.
   - **Sorting.** An alphabetical list sorted by the English name is not
     alphabetical in Italian. Sort by the Italian, with
     `localeCompare(b, 'it')`.
   - **Plurals and agreement.** `{n} items` is not `{n} oggetti` when n is 1.
     Italian also inflects adjectives for gender: *attiva* / *attivo*.
6. Update the co-located test. The pattern is in
   [conditions_section.test.js](../../../src/components/player_sheet/conditions_section.test.js):
   the test still *drives* the model in English
   (`p.addCondition({ name: 'Fatigued' })`) and *asserts* on Italian
   (`Affaticato`). Keep those apart — a test that has gone all-Italian is
   probably one that translated a key it should not have.
7. Run it:

   ```bash
   CI=true npx react-scripts test --watchAll=false --testPathPattern=conditions_section
   ```

   Plain `npx jest` does not work in this project — there is no JSX transform
   outside react-scripts.

### Not every display edge is a component

Some of `src/lib` builds things a person reads, and those count as UI:

- `utils.js` — `getConditionByLink`, `getSkillByLink` and friends build the
  **cards the info sidebar shows**. The pilot found this the hard way: the card
  body came from `tables.json` and was already Italian, while its title came
  from the dictionary key and was still English. A card is display, so the
  title is translated on the way out and the `Link` stays the English slug.
- `itemsUtils.js` composes `Range` as `` `${n} ft.` ``, and `scrolls.js`
  composes `Scroll of <spell>`.
- `contributions.js`, `conditionEffects.js`, `trapCR.js`, `trapFootprint.js`,
  `monsterBook.js`, `shopShare.js`, `familiarData.js`, `portraitImage.js`.

The test is not *where the code lives* but *who reads the string*. If it ends
up on screen, it is Italian; if something compares it, it is English.

---

## Workflow B — translating a data batch

Never open `spells.json` in an editor. It is 865 KB and you need thirty strings
from it.

```bash
S=.claude/skills/translate-it/scripts

# 1. take the next slice
python $S/next_batch.py src/data/spells.json --count 20 --out /tmp/batch.json

# 2. translate every "it" field in /tmp/batch.json  (leave "path" and "en" alone)

# 3. grade your own work before it touches the data — same gates, no writes
python $S/check_batch.py /tmp/batch.json

# 4. write it back — refuses blanks, stale batches and anything that would
#    change more than the value at that path. Records the paths in the ledger.
python $S/json_tr.py /tmp/batch.json

# 5. prove nothing else moved
python $S/verify.py src/data/spells.json
```

Step 3 is the cheap one: `check_batch.py` runs the same gates on the batch file
itself, so a dropped `<i>` or a lost `+2` costs you a re-edit rather than a
revert.

Repeat. Batches of 20–30 strings, or about 20 k characters, keep the work
reviewable and the context small.

`--count` hands out strings in document order, so a spell's Description, Range
and Duration arrive together. Translate them as one unit: they are one spell.

### What verify.py refuses

| Gate | Why it exists |
|---|---|
| **structure** | A key, an array length or a number changed. Only text inside a string may ever change. |
| **frozen** | A string not on the translate list in `fields.json` was touched. Default-deny: unknown fields are frozen. |
| **numbers** | A number, die or modifier went missing. `2d6` must still be `2d6`; a `+2` cannot become `+3`. |
| **markup** | An HTML tag or an `href` changed. Descriptions carry links the app parses. |
| **glossary** | A strict term came out as something other than its one agreed Italian word. |

If a gate fires, **fix the translation** — do not widen `fields.json` to silence
it. Widening the list is a separate, deliberate change, made only after grepping
for the field and proving nothing reads it.

---

## The rules that are never bent

**Numbers, dice and modifiers are copied, never recomputed.** `1d4`, `+2`,
`DC 15`, `50%`, `01–10`. The en dash `–` in the data is not a hyphen; keep it.

**Measurements keep their number and their system.**
`10 feet` → `10 piedi` ✅ — `10 feet` → `3 metri` ❌.
The second is a hand-conversion, and `units.js` already converts at render on
the manual's own factors (1 ft = 0.3 m, 1 mile = 1.5 km). Converting by hand
either double-converts or fights the unit switch. `units.js` reads Italian unit
words too, so writing `piedi` is safe; writing `metri` where the source said
feet is not.

**Markup is copied exactly.** `<p>`, `<i>`, `<b>`, tables, and every
`<a href="skills#jump">`. Translate the words between the tags and nothing else.
An `href` is a machine address; `heldItems.js` parses one out of an item
description.

**Slugs, `Link`, `ref` and `id` never change.** They are identity, and saved
characters point at them.

**Never bump `CURRENT_VERSION`.** No schema changes here — that would wipe
everyone's characters, which is precisely what keeping names in English avoids.

**Add every new term to the glossary in the same change.** If you had to decide
an Italian word that was not in `glossary.json`, write it down there and
regenerate the markdown:

```bash
python .claude/skills/translate-it/scripts/glossary.py --md
```

That is the whole mechanism by which a dozen sessions and three different models
stay consistent. Skipping it is how *Stregone* becomes *Incantatore* two weeks
later.

---

## Finishing a batch

A batch is done when **all** of these are true:

```bash
python .claude/skills/translate-it/scripts/verify.py --all     # no FAIL lines
CI=true npx react-scripts test --watchAll=false                # all suites pass
npm run build                                                  # compiles
```

The baseline to beat: **126 suites, 2050 tests, 4 pre-existing build warnings**
(`loot_inventory`, `ShopInventory` ×2, `spellbook_table`). Any new warning is
yours.

You cannot commit — this project allows read-only git only. Tell the user which
files are ready and let them commit.

**Progress is recorded in `state/done.json`, not inferred from git.** `json_tr.py`
writes a path there the moment it lands. The first version of this skill inferred
it from git instead — a string still identical to `HEAD` had not been done — and
that broke the first time the pilot was committed: the working tree then matched
`HEAD` everywhere, `feats.json` reported `0/280`, and the next batch handed back
three strings that were already Italian. Commit freely; the ledger does not care.

If you ever translate a string without going through `json_tr.py`, record it
yourself, or the next batch will hand it to you again:

```python
import sys; sys.path.insert(0, '.claude/skills/translate-it/scripts')
import ledger; ledger.mark('src/data/feats.json', ['Feats/12/Description'])
```

---

## The worked example

The conditions pilot is the reference implementation, and it touches all three
layers at once. Read it when something here is unclear:

- **Data prose, translated in place** — the 38 descriptions under `Conditions`
  in [tables.json](../../../src/data/tables.json).
- **Names, kept English and translated at the edge** —
  [names.json](../../../src/data/it/names.json) and
  [src/lib/i18n/index.js](../../../src/lib/i18n/index.js).
- **A component and its test** —
  [conditions_section.jsx](../../../src/components/player_sheet/conditions_section.jsx),
  which also shows the search and sort fixes.
- **Tests that keep a dictionary honest** —
  [i18n.test.js](../../../src/lib/i18n/i18n.test.js) fails if a condition in the
  data has no Italian name, or if a name in the dictionary matches no condition.

Copy its shape. It passed every gate, and the eight failures the checker threw
at the first attempt were all caught before anything shipped.

---

## Files in this skill

| File | What it is |
|---|---|
| `glossary.json` | The vocabulary. The only place a term is edited. |
| `references/glossary.md` | Generated from it, for reading. |
| `fields.json` | Which paths in `src/data` may be translated. Default-deny. |
| `scripts/next_batch.py` | Hands out the next untranslated strings. |
| `scripts/check_batch.py` | Grades a finished batch before it is applied. |
| `scripts/json_tr.py` | Writes them back without reformatting the file. |
| `scripts/verify.py` | The gates, run against the repo. |
| `scripts/ledger.py` | The record of what is already translated. |
| `scripts/progress.py` | What is done, what is left. |
| `scripts/glossary.py` | Look terms up; regenerate the markdown. |
| `state/done.json` | The ledger itself. Committed, so it survives a fresh clone. |
