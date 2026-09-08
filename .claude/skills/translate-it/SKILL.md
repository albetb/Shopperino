---
name: translate-it
description: Translate the Shopperino app into another language — Italian today, any language the same way. Use whenever the user asks to translate part of the app, continue the translation, do the next batch, translate a component or a data file, add a language, or asks what is left to translate. Handles the glossary, the English source that must never be edited, and the verification that the game rules survived.
---

# Translating Shopperino

The app is readable in more than one language. English is what it is written
in; every other language is a **pack** that sits beside the English and is
chosen at runtime.

**The translation is not book-accurate, on purpose.** The user has said so:
matching the Italian manuals word for word does not matter. What matters is
that the meaning and the mechanics survive, and that one English term always
becomes the same word in the target language.

---

## The one idea to understand first

**English never leaves. Nothing is ever overwritten.**

An earlier version of this skill translated over the English where it stood. It
read fine and it was wrong: it made English unrecoverable, it left no way to
offer both languages, and — worst — it put a translator's hands on the files
the game rules live in. Everything below follows from not doing that again.

| Kind of string | Stays where it is | Translation goes to |
|---|---|---|
| A literal in a component | `t('Collapse')` in the JSX | `src/data/<lang>/ui.json` |
| A name that is also a key | English, in `src/data` | `src/data/<lang>/names.json` |
| Prose in `src/data` | English, untouched | `src/data/<lang>/<file>.json` |

Why the third row matters more than it looks. An English name in `src/data` is
rarely just a name — it is the key everything hangs on:

- `Player.conditions` stores `"Fatigued"` into the save file.
- `conditionSlug("Flat-Footed")` builds the `#flat-footed` anchor.
- `proficiency.js` reads a weapon's `Category` with `startsWith('martial')`.
- `attackParser.js` splits `"2 claws +7 melee (1d6+5)"` on the word `melee`,
  and every animal companion, familiar and wild shape is recomputed from it.

None of that can break any more, because **a translator never opens those
files**. The pack is keyed by JSON path and laid over a copy of the English at
render time (`lib/i18n/prose.js`). The first gate in `verify.py` is simply
*did `src/data` move?*

---

## If you were given no instructions

`/translate-it` on its own is a complete instruction: **pick up where the work
left off, do a session's worth, stop and report.**

1. Run `progress.py`.
2. **Pick the target.** If the user named a file or a phase, that is the
   target. Otherwise take the first thing with work left, in phase order.
3. **Do a session's worth**, then stop:
   - data — **6 batches of 30 strings**, or the file finishes;
   - UI — **5 components**, each with its test.
4. **Report**: what you translated, the `progress.py` numbers, anything you
   left alone and why, and which files are ready to commit.

### The three rules that are not yours to bend

- **Never edit a file in `src/data/` that is not inside a language folder.**
  The English is the source. If a gate complains, the fix goes in the pack.
- **Never edit `fields.json` to quieten a gate.** That list is what stops a
  translation from changing the rules.
- **You may ADD a term to `glossary.json`. You may never change one that is
  already there.** Adding is how the vocabulary grows; changing is how
  *Stregone* silently becomes *Incantatore* three weeks later.

If the same gate fails twice on the same string, stop and ask.

### Which model should be doing this

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
token saving. **Use Sonnet.**

---

## The phases

**Phase 1 — the UI.** ~1,260 strings across ~150 components, plus display
strings in `src/lib`. This is what a person sees first.

**Phase 2 — the data prose.** ~6,700 strings, 1.6 M characters. In order:

`tables.json` → `skills.json` → `feats.json` → `races.json` → `classes.json` →
`traps.json` → `items.json` → `spells.json` → `animals.json` → `vermin.json` →
`monsters.json`

**Phase 3 — the names.** Item, spell, feat, skill and monster names into
`src/data/<lang>/names.json`, and the display sites that call `tName()`.

---

## Workflow A — a component

Do **one file and its test together**.

1. Read the component.
2. Wrap every string a person reads in `t('…')`: JSX text, `title`,
   `placeholder`, `aria-label`, `alt`, `label`, `eyebrow`, `hint`. **Leave the
   English in place** — it is the key and the fallback both.
   ```jsx
   -  aria-label={open ? 'Collapse' : 'Expand'}
   +  aria-label={open ? t('Collapse') : t('Expand')}
   ```
   `import { t } from '<...>/lib/i18n';` — the plain function, not a hook. The
   app is keyed on the language in `App.jsx`, so a change remounts the tree and
   every `t()` runs again. That is why translating a component is one edit
   rather than two.
3. **Do not wrap**: `className`, `icon` names (`"add"`, `"expand_less"` — they
   are Material Symbols ligatures), CSS variables, `key`s, action types, or any
   string compared against data (`'Str'`, `'Simple Weapons'`, `'Neutral'`).
   A useful test: if changing the string would change what the code *does*, it
   is a key.
4. A **name out of the data or the model** is not a literal — call
   `tName('<domain>', name)` and put the entry in `names.json`.
5. Add every wrapped string to `src/data/<lang>/ui.json`.
6. **Check the three things a translation quietly breaks:**
   - **Search boxes.** A filter on `c.name` searches English the reader cannot
     see. Filter on the displayed name.
   - **Sorting.** An alphabetical list sorted by the English name is not
     alphabetical in Italian. Sort on the displayed name.
   - **Plurals and gender.** `{n} items` is not `{n} oggetti` when n is 1, and
     Italian inflects adjectives: *attiva* / *attivo*.
7. Update the co-located test, and make it assert **both** languages —
   `setLanguage('it')` from `lib/i18n`. See
   [conditions_section.test.js](../../../src/components/player_sheet/conditions_section.test.js):
   the model is still driven in English (`addCondition({ name: 'Fatigued' })`)
   while the screen is asserted in Italian. If those two ever have to agree,
   something has translated a key.
8. `CI=true npx react-scripts test --watchAll=false --testPathPattern=<name>`
   (plain `npx jest` does not work here — no JSX transform outside
   react-scripts).

### Not every display edge is a component

Some of `src/lib` builds things a person reads, and those count as UI:
`utils.js` (`getConditionByLink` and friends build the info-sidebar cards),
`itemsUtils.js`, `scrolls.js`, `contributions.js`, `conditionEffects.js`,
`trapCR.js`, `trapFootprint.js`, `monsterBook.js`, `shopShare.js`. They use the
same plain `t()`. The test is not where the code lives but who reads the
string: on screen it is translated, compared against it is English.

---

## Workflow B — a data batch

Never open `spells.json` in an editor. It is 865 KB and you need thirty strings
from it.

```bash
S=.claude/skills/translate-it/scripts

# 1. take the next slice
python $S/next_batch.py src/data/spells.json --count 30 --out /tmp/batch.json

# 2. translate every "it" field in /tmp/batch.json (leave "path" and "en" alone)

# 3. grade your own work before it touches anything
python $S/check_batch.py /tmp/batch.json

# 4. file it into the pack — src/data is never opened for writing
python $S/json_tr.py /tmp/batch.json

# 5. prove the English did not move and the pack is sound
python $S/verify.py src/data/spells.json
```

The batch hands strings out in document order, so a spell's Description, Range
and Duration arrive together. Translate them as one unit: they are one spell.

**Progress lives in the pack.** A path with an entry is done. There is no
ledger to keep in step, and committing changes nothing.

### What verify.py refuses

| Gate | Why it exists |
|---|---|
| **untouched** | `src/data/<file>.json` differs from `HEAD`. The English is the source; a translation never edits it. |
| **paths** | A pack key no longer points at a string in the English data — the translation has silently stopped applying. |
| **scope** | A key is not on the translate list in `fields.json`. Default-deny. |
| **numbers** | A number, die or modifier went missing. `2d6` stays `2d6`; `+2` cannot become `+3`. |
| **markup** | An HTML tag or an `href` changed. Descriptions carry links the app parses. |
| **glossary** | A strict term came out as something other than its one agreed word. |

---

## The rules that are never bent

**Numbers, dice and modifiers are copied, never recomputed.** `1d4`, `+2`,
`DC 15`, `50%`, `01–10`. The en dash `–` in the data is not a hyphen.

**Measurements keep their number and their system.**
`10 feet` → `10 piedi` ✅ — `10 feet` → `3 metri` ❌. `units.js` already
converts at render on the manual's own factors (1 ft = 0.3 m, 1 mile = 1.5 km)
and reads Italian unit words too, so converting by hand either double-converts
or fights the switch.

**Markup is copied exactly** — `<p>`, `<i>`, `<b>`, tables, and every
`<a href="skills#jump">`. Translate the words between the tags. An `href` is a
machine address; `heldItems.js` parses one out of an item description.

**Never bump `CURRENT_VERSION`.** Nothing here changes the save format — which
is the point of keeping names in English.

**Add every new term to the glossary in the same change**, then
`python .claude/skills/translate-it/scripts/glossary.py --md`.

---

## Adding a language

1. `src/data/<code>/ui.json` and `names.json` (start them as `{}`).
2. Two imports and one `PACKS` entry in `src/lib/i18n/index.js`.
3. One entry in `LANGUAGES`, with the language's own name for itself.
4. Prose packs register in `src/lib/i18n/prose.js`.

Nothing else in the app knows how many languages there are. Every script here
takes `--lang`.

---

## Finishing

```bash
python .claude/skills/translate-it/scripts/verify.py --all    # no FAIL lines
CI=true npx react-scripts test --watchAll=false               # all suites pass
npm run build                                                 # compiles
```

Baseline: **126 suites, 2064 tests, 4 pre-existing build warnings**
(`loot_inventory`, `ShopInventory` ×2, `spellbook_table`). A new warning is
yours.

You cannot commit — this project allows read-only git. Say which files are
ready and let the user commit.

---

## The worked example

The conditions feature is the reference and touches all three layers:

- **Prose in a pack** — [src/data/it/tables.json](../../../src/data/it/tables.json),
  keyed `Conditions/Blinded`, with the English untouched in `tables.json`.
- **Names at the display edge** — [names.json](../../../src/data/it/names.json)
  and [src/lib/i18n/index.js](../../../src/lib/i18n/index.js).
- **A component and its test** —
  [conditions_section.jsx](../../../src/components/player_sheet/conditions_section.jsx),
  which also shows the search and sort fixes, and its test asserting both
  languages.
- **Tests that keep a pack honest** —
  [i18n.test.js](../../../src/lib/i18n/i18n.test.js) fails if a condition has no
  Italian name, if a name matches no condition, or if a pack key no longer
  points at anything.

---

## Files in this skill

| File | What it is |
|---|---|
| `glossary.json` | The vocabulary. The only place a term is edited. |
| `references/glossary.md` | Generated from it, for reading. |
| `fields.json` | Which paths in `src/data` may be translated. Default-deny. |
| `scripts/next_batch.py` | Hands out the next untranslated strings. |
| `scripts/check_batch.py` | Grades a finished batch before it is filed. |
| `scripts/json_tr.py` | Files a batch into the language pack. |
| `scripts/verify.py` | The gates. |
| `scripts/progress.py` | What is done, what is left. |
| `scripts/glossary.py` | Look terms up; regenerate the markdown. |
