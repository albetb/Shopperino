import { t, tName } from './index';

/**
 * The two info cards that are built out of a data record rather than shown as
 * one: a feat's and a skill's.
 *
 * `getFeatByLink` and `getSkillByLink` do not hand the sidebar the record —
 * they compose a single HTML description out of it, putting the feat's tags and
 * its Prerequisites heading, or the skill's key ability, in front of the prose.
 * That prose is translated in the pack before the card is ever built; the
 * sentence *around* it is composed in English at the moment of the click, so it
 * is translated here, at render, exactly like an item's bonus note.
 *
 * Composing rather than adding fields is deliberate on their side — the card
 * has no room for a third labelled row — so this reads the composition back
 * instead of asking for the record.
 */

/* The head of a feat card: its tags, then its prerequisites. Both are put
   there by getFeatByLink and neither can be keyed in feats.json — Tags are
   filter values the bonus-feat pools match on. */
const FEAT_TAGS = /^<p><i>([^<]*)<\/i><\/p>/;
const PREREQ_LABEL = /<p><b>Prerequisites:<\/b>/;

/** A feat card's description, with the two lines it composes translated. */
export function featDescription(html) {
  const text = String(html ?? '');
  return text
    .replace(FEAT_TAGS, (whole, tags) => {
      const named = tags.split(',').map((tag) => tName('featTags', tag.trim()));
      return `<p><i>${named.join(', ')}</i></p>`;
    })
    .replace(PREREQ_LABEL, `<p><b>${t('Prerequisites')}:</b>`);
}

/* The head of a skill card is the ability the check is rolled against, spelled
   out — getSkillByLink expands the 'Dex' the data stores. A skill with a note
   joins the two with an em dash. */
const SKILL_HEAD = /^<p><i>([^<—]*?)(\s+—\s+[^<]*)?<\/i><\/p>/;

/** A skill card's description, with its key ability translated. */
export function skillDescription(html) {
  const text = String(html ?? '');
  return text.replace(SKILL_HEAD, (whole, ability, note) => {
    const head = ability.trim();
    /* Two skills roll against nothing at all, and their key ability reads
       "None" -- a word, not an ability, so the ui pack answers it. */
    const named = tName('abilities', head);
    return `<p><i>${named === head ? t(head) : named}${note ?? ''}</i></p>`;
  });
}
