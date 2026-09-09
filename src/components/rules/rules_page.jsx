import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import parse, { domToReact } from 'html-react-parser';

import { t, tx } from '../../lib/i18n';
import { loadFile, rulesEnglish } from '../../lib/loadFile';
import { buildRulesIndex, searchRules, plainText, topicBySlug } from '../../lib/rules/rulesSearch';
import { setStateCurrentTab, setSearchTypeRequest } from '../../store/slices/appSlice';
import useDebounced from '../hooks/useDebounced';
import useRulesData from '../hooks/useRulesData';
import EmptyState from '../common/EmptyState';
import Icon from '../common/Icon';
import Skeleton from '../common/Skeleton';
import '../../style/rules.css';

/* Where a link into src/data/ should land. The notes point at the JSON a rule
   is computed from — skills.md links to skills.json, metamagic.md to
   feats.json — and those are things the app already renders on the Search tab,
   so the link opens Search rather than dead-ending on a file name. */
const DATA_TAB = 4;

/* Exactly the four the Search tab can show, spelled as its own TYPE_OPTIONS
   spells them. The notes also link to animals.json, classes.json, races.json,
   scrolls.json and a couple of source files — Search has no view for any of
   those, so they are rendered as plain text rather than as a button that
   would open an empty tab. */
const DATA_FILE_SEARCH = {
  'skills.json': 'Skills',
  'feats.json': 'Feats',
  'spells.json': 'Spells',
  'items.json': 'Items',
};

/* What a link out of the prose is *called* on screen.
 *
 * The notes are written for someone reading them in the repository, so a
 * cross-reference is spelled as the thing it is there: `src/data/animals.json`,
 * `combat.md`. In the app that is a file name for a file the reader cannot
 * open, in a sentence that otherwise reads as English — "base stat blocks in
 * src/data/animals.json". The href still decides where the press goes; only
 * the words change.
 *
 * A note's own title comes from the data and is already translated, so only
 * these fall to the pack. */
export const DATA_FILE_LABEL = {
  'skills.json': 'the skill list',
  'feats.json': 'the feat list',
  'spells.json': 'the spell list',
  'items.json': 'the item list',
  'scrolls.json': 'the scroll list',
  'races.json': 'the race list',
  'classes.json': 'the class list',
  'animals.json': 'the animal list',
  'monsters.json': 'the bestiary',
  'traps.json': 'the trap list',
  player: 'the character model',
  'trapCR.test.js': 'the trap CR tests',
};

/* Only text that is a path gets replaced. A note that writes a proper phrase
   for its link — "the animal list", already the right words — keeps it, and
   keeps its translation with it. */
const LOOKS_LIKE_A_PATH = /^[\w./-]+(\.(json|jsx?|md)|\/)$/;

/** The readable text of a parsed node, for deciding whether to replace it. */
function textOf(node) {
  if (node.type === 'text') return node.data ?? '';
  return (node.children ?? []).map(textOf).join('');
}

/** A file name nothing names, worded as well as it can be worded blind. */
const prettify = (file) => file
  .replace(/\.(json|jsx?|md)$/, '')
  .replace(/\.test$/, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .toLowerCase();

/**
 * Put a freshly opened note where the reader is looking.
 *
 * The window does not scroll in this app: every page is inside `.app-header`,
 * which is a flex column with its own `overflow: auto`, so `window.scrollTo`
 * is a no-op and a note opened from a hit near the end of combat.md used to
 * appear already scrolled to wherever the results had been left.
 *
 * @param {string} [anchor] - the section a search hit named, if any.
 */
function reveal(anchor) {
  /* Every call is optional: jsdom implements none of these, and a scroll that
     does not happen is not a reason for a component to throw. */
  const section = anchor ? document.getElementById(anchor) : null;
  if (section) {
    section.scrollIntoView?.({ block: 'start' });
    return;
  }
  const page = document.querySelector('.rules-page');
  for (let node = page?.parentElement; node; node = node.parentElement) {
    const overflow = window.getComputedStyle(node).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') {
      node.scrollTo?.({ top: 0 });
      return;
    }
  }
  document.scrollingElement?.scrollTo?.({ top: 0 });
}

/** The last segment of a link target: `../../src/data/animals.json` → the file. */
const basename = (target) => target.replace(/\/+$/, '').replace(/^.*\//, '');

/**
 * What to call a link, or null to keep the words the note used.
 *
 * @param {object} node - the parsed `<a>`.
 * @param {string} target - its href with any anchor removed.
 * @param {object} data - the topics, for resolving a note to its title.
 */
function labelFor(node, target, data) {
  if (!LOOKS_LIKE_A_PATH.test(textOf(node).trim())) return null;
  const file = basename(target);
  if (target.endsWith('.md')) {
    /* A note is called by its title, which the data already carries in the
       reading language — `combat.md` reads as *Combat*, and as *Combattimento*
       to someone reading the Italian. */
    return topicBySlug(data, file.replace(/\.md$/, ''))?.title ?? null;
  }
  const label = DATA_FILE_LABEL[file];
  return label ? t(label) : prettify(file);
}

/**
 * The rules reference.
 *
 * 33 notes an agent has been reading before every rule-touching change and a
 * player could not read at all without leaving the app for the vault. The
 * content is generated from the markdown by scripts/build-rules.mjs; nothing
 * here parses markdown, and no markdown library is in the bundle.
 *
 * **The note opens in the main area, not the info sidebar.** The sidebar is
 * where a rule opened from somewhere else lands — a link on the character
 * sheet — so a rule can sit beside the sheet while it is read. But combat.md
 * is 500 lines, and reading it in a narrow column is not reading it.
 */
export default function RulesPage() {
  const dispatch = useDispatch();
  const ready = useRulesData();
  const [query, setQuery] = useState('');
  const [openSlug, setOpenSlug] = useState(null);
  const [openAnchor, setOpenAnchor] = useState(null);

  /* `ready` is in every dependency list below on purpose: the chunk lands
     after the first render, and a memo that ran before it would hold the
     empty topic list for the life of the component. */
  const data = useMemo(() => loadFile('rules'), [ready]);          // eslint-disable-line react-hooks/exhaustive-deps
  const english = useMemo(() => rulesEnglish(), [ready]);          // eslint-disable-line react-hooks/exhaustive-deps
  const index = useMemo(() => buildRulesIndex(data, english), [data, english]);

  /* The box shows what was typed at once; the scan waits for a pause. 498
     sections searched twelve times to type "counterspell" is eleven scans
     nobody reads — every intermediate result is on screen for the length of a
     keystroke. Emptying the box is exempt: clearing is a request to see the
     topic list again, and waiting on that is just lag. */
  const settled = useDebounced(query, 200);
  const active = query === '' ? '' : settled;
  const hits = useMemo(() => searchRules(index, active), [index, active]);

  const openTopic = topicBySlug(data, openSlug);

  const open = (slug, anchor = null) => {
    setOpenSlug(slug);
    setOpenAnchor(anchor);
  };

  /* After the note is on screen, not during the press: the section a hit named
     does not exist in the document until the render that opens its note. */
  useEffect(() => { reveal(openSlug ? openAnchor : null); }, [openSlug, openAnchor]);

  /* Two kinds of link live in the notes, and they are 363 of them. One points
     at another note and navigates in place; the other points at the JSON the
     rule is computed from and opens the Search tab. Anything else — there is
     nothing else today — is left as written rather than turned into a button
     that goes nowhere. */
  const linkOptions = {
    replace: (node) => {
      if (node.name !== 'a' || !node.attribs?.href) return undefined;
      const href = node.attribs.href;
      const [target, hash] = href.split('#');
      const children = <>{domToReact(node.children, linkOptions)}</>;
      const named = labelFor(node, target, data);
      const file = basename(target);

      if (target.endsWith('.md')) {
        const slug = file.replace(/\.md$/, '');
        return (
          <button type="button" className="rules-link" onClick={() => open(slug, hash ?? null)}>
            {named ?? children}
          </button>
        );
      }
      const searchType = DATA_FILE_SEARCH[file];
      if (searchType) {
        return (
          <button
            type="button"
            className="rules-link"
            onClick={() => {
              dispatch(setSearchTypeRequest(searchType));
              dispatch(setStateCurrentTab(DATA_TAB));
            }}
          >
            {named ?? children}
          </button>
        );
      }
      /* Everything else — a data file Search cannot show, a path into src/lib
         — keeps its words and loses its href. An <a> pointing at a repository
         path is not a link in a served app: following it navigates the tab to
         a 404 and loses whatever the reader had open. */
      return <span className="rules-dataref">{named ?? children}</span>;
    },
  };

  /* The same names with none of the buttons. A topic card is itself a button,
     and a button inside a button is neither valid markup nor pressable. */
  const flatOptions = {
    replace: (node) => {
      if (node.name !== 'a' || !node.attribs?.href) return undefined;
      const [target] = node.attribs.href.split('#');
      const named = labelFor(node, target, data);
      return (
        <span className="rules-dataref">
          {named ?? <>{domToReact(node.children, flatOptions)}</>}
        </span>
      );
    },
  };

  if (!ready) {
    return (
      <div className="rules-page">
        <Skeleton className="rules-skeleton" />
      </div>
    );
  }

  return (
    <div className="rules-page">
      <div className="rules-search">
        <Icon name="search" />
        <input
          className="modern-input"
          type="search"
          value={query}
          placeholder={t('Search every rule note')}
          aria-label={t('Search every rule note')}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" className="rules-clear" onClick={() => setQuery('')}>
            {t('Clear')}
          </button>
        )}
      </div>

      {/* An open note wins over a live search: clicking a hit is a request to
          read that note, and leaving the results up instead would look like
          the press did nothing. The query is kept rather than cleared, so
          going back lands on the results that were being read rather than
          making the reader type them again. */}
      {openTopic ? (
        <RulesNote
          topic={openTopic}
          anchor={openAnchor}
          linkOptions={linkOptions}
          backLabel={active ? t('Back to results') : t('All topics')}
          onBack={() => open(null)}
        />
      ) : active ? (
        <RulesResults hits={hits} query={active} onOpen={open} linkOptions={linkOptions} />
      ) : (
        <RulesIndex topics={data?.topics ?? []} onOpen={open} linkOptions={flatOptions} />
      )}
    </div>
  );
}

/**
 * The landing view: every topic, with the one-line scope each note opens with.
 *
 * Built from the data rather than from INDEX.md. That file's topic list is
 * machine-generated and its other half is about this repository rather than
 * about the rules, so rendering it would mean translating and maintaining a
 * second copy of a list that is already here — and one that the hook
 * regenerates for English and not for Italian.
 */
function RulesIndex({ topics, onOpen, linkOptions }) {
  /* Alphabetical by the title as shown, not by the file name underneath it.
     The data is in English file order, which in Italian is an order with no
     visible rule at all — *Trappole* between *Equipaggiamento* and *Talenti*
     because the files are traps.md, equipment.md, feats.md. */
  const ordered = useMemo(
    () => [...topics].sort((a, b) => a.title.localeCompare(b.title)),
    [topics],
  );
  return (
    <>
      <p className="rules-lede">
        {tx('{0} topics, condensed from the manuals. Search the lot, or open one.',
          topics.length)}
      </p>
      <ul className="rules-index">
        {ordered.map((topic) => (
          <li key={topic.slug}>
            <button type="button" className="rules-topic" onClick={() => onOpen(topic.slug)}>
              <span className="rules-topic-title">{topic.title}</span>
              <span className="rules-topic-blurb">{parse(topic.blurb, linkOptions)}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Search results — whole sections, not clipped snippets.
 *
 * A section is what answers the question, and seeing it in full is what tells
 * the reader whether the note is the one they wanted. The heading doubles as
 * the link into the note.
 */
function RulesResults({ hits, query, onOpen, linkOptions }) {
  if (!hits.length) {
    return (
      <EmptyState
        icon="search_off"
        title={tx('Nothing matches {0}', query)}
        hint={t('The notes cover mechanics rather than spell or item names — those are on the Search tab.')}
      />
    );
  }
  return (
    <>
      <p className="rules-lede">
        {hits.length === 1
          ? tx('1 section matches {0}', query)
          : tx('{0} sections match {1}', hits.length, query)}
      </p>
      <ul className="rules-hits">
        {hits.map((hit) => (
          <li key={`${hit.slug}/${hit.anchor}`} className="rules-hit">
            <button
              type="button"
              className="rules-hit-head"
              onClick={() => onOpen(hit.slug, hit.anchor)}
            >
              <span className="rules-hit-topic">{hit.topicTitle}</span>
              <span className="rules-hit-heading">{plainText(hit.heading)}</span>
            </button>
            <div className="rules-prose">{parse(hit.html, linkOptions)}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

/** One note, whole, with the section a search hit named brought into view. */
function RulesNote({ topic, anchor, linkOptions, backLabel, onBack }) {
  return (
    <article className="rules-note">
      <button type="button" className="rules-back" onClick={onBack}>
        <Icon name="arrow_back" />
        {backLabel}
      </button>
      <h1 className="sh-display rules-title">{topic.title}</h1>
      <p className="rules-blurb">{parse(topic.blurb, linkOptions)}</p>
      {topic.intro && <div className="rules-prose">{parse(topic.intro, linkOptions)}</div>}
      {topic.sections.map((section) => (
        <section
          key={section.anchor}
          id={section.anchor}
          className={`rules-section${section.anchor === anchor ? ' is-target' : ''}`}
        >
          {section.level === 2
            ? <h2 className="rules-h2">{parse(section.heading)}</h2>
            : <h3 className="rules-h3">{parse(section.heading)}</h3>}
          {section.html && <div className="rules-prose">{parse(section.html, linkOptions)}</div>}
        </section>
      ))}
    </article>
  );
}
