/**
 * Searching the rule notes.
 *
 * 33 topics, 498 sections. That is small enough that the search is a scan over
 * an array on every keystroke — no index, no fuzzy library, no debouncing. The
 * Search tab already filters 605 spells and 800-odd items the same way.
 *
 * ## A hit is a section, not a line
 *
 * The point of searching is to find out what a page says before opening it, so
 * a match returns the whole `##` or `###` it lives in, exactly as written. A
 * clipped snippet around the matched word answers a narrower question than the
 * one the reader asked.
 *
 * ## It searches both languages at once
 *
 * The Italian is what an Italian reader sees, but the rules were learned in
 * English by anyone who has read the SRD, and half the terms of art are
 * remembered that way. So a section is matched against its Italian text *and*
 * its English, and shown in the reading language either way. Both are already
 * in memory once the chunk lands, so this costs one extra string per section.
 *
 * The reverse does not apply: an English reader has no Italian to match, and
 * `english` is then the same array as `topics`, which the builder detects.
 *
 * No i18n import here on purpose — this module takes the two arrays and knows
 * nothing about which language is current. See the note in lib/i18n.
 */

const TAG = /<[^>]*>/g;
const ENTITY = /&(amp|lt|gt|quot|#39|nbsp);/g;
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ',
};

/** The readable text of a fragment of the generated HTML. */
export function plainText(html) {
  if (!html) return '';
  return html
    .replace(TAG, ' ')
    .replace(ENTITY, (_whole, name) => ENTITIES[name] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * One searchable row per section, built once per (language, data) pair.
 *
 * @param {object} topics - the rules data in the reading language.
 * @param {object} [english] - the same data in English. Pass the same object
 *   when reading English; its text is then not added twice.
 */
export function buildRulesIndex(topics, english) {
  const rows = [];
  const list = topics?.topics ?? [];
  const englishList = english?.topics ?? [];
  const bilingual = english != null && english !== topics;

  list.forEach((topic, topicIndex) => {
    const englishTopic = englishList[topicIndex];
    topic.sections?.forEach((section, sectionIndex) => {
      const englishSection = englishTopic?.sections?.[sectionIndex];
      const own = `${plainText(section.heading)} ${plainText(section.html)}`;
      const other = bilingual && englishSection
        ? ` ${plainText(englishSection.heading)} ${plainText(englishSection.html)}`
        : '';
      rows.push({
        topicIndex,
        sectionIndex,
        slug: topic.slug,
        anchor: section.anchor,
        level: section.level,
        topicTitle: topic.title,
        heading: section.heading,
        html: section.html,
        /* Lowercased once here rather than on every keystroke. The English
           half is appended to the same haystack instead of being a second
           field, because a match in either is the same kind of hit. */
        haystack: `${topic.title} ${own}${other}`.toLowerCase(),
      });
    });
  });
  return rows;
}

/**
 * Sections matching every whitespace-separated word of the query.
 *
 * All words, not any: typing two words to narrow a result is the behaviour
 * people expect from a search box, and with 498 rows a single common word
 * matches far too much to be useful on its own.
 *
 * Order puts a heading match first — someone typing "grapple" wants the
 * section *called* grapple ahead of the twenty that mention it — and is
 * otherwise the order the notes are written in, which is deliberate.
 */
export function searchRules(rows, query) {
  const words = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = rows.filter((row) => words.every((word) => row.haystack.includes(word)));
  const inHeading = (row) => {
    const heading = plainText(row.heading).toLowerCase();
    return words.every((word) => heading.includes(word));
  };
  return [...hits].sort((a, b) => Number(inHeading(b)) - Number(inHeading(a)));
}

/** The topic a slug names, or null. */
export function topicBySlug(topics, slug) {
  return (topics?.topics ?? []).find((topic) => topic.slug === slug) ?? null;
}
