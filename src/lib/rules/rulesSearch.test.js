import { buildRulesIndex, searchRules, plainText, topicBySlug } from './rulesSearch';

/* Two topics shaped exactly like the generator's output: a slug, a title, a
   blurb and sections carrying level, anchor, heading and html. */
const IT = {
  topics: [
    {
      slug: 'combat',
      title: 'Combattimento',
      blurb: 'Come si risolve un attacco.',
      sections: [
        {
          level: 2,
          anchor: 'core-mechanic',
          heading: 'Meccanica di base',
          html: '<p>Tira <code>d20</code> e somma il <strong>bonus di attacco</strong>.</p>',
        },
        {
          level: 3,
          anchor: 'flanking',
          heading: 'Attaccare ai fianchi',
          html: '<p>Due alleati sui lati opposti ottengono +2.</p>',
        },
      ],
    },
    {
      slug: 'magic',
      title: 'Magia',
      blurb: 'Lanciare incantesimi.',
      sections: [
        {
          level: 2,
          anchor: 'components',
          heading: 'Componenti',
          html: '<p>Verbale, somatica, materiale.</p>',
        },
      ],
    },
  ],
};

const EN = {
  topics: [
    {
      slug: 'combat',
      title: 'Combat',
      blurb: 'How an attack resolves.',
      sections: [
        {
          level: 2,
          anchor: 'core-mechanic',
          heading: 'Core mechanic',
          html: '<p>Roll <code>d20</code> and add the <strong>attack bonus</strong>.</p>',
        },
        {
          level: 3,
          anchor: 'flanking',
          heading: 'Flanking',
          html: '<p>Two allies on opposite sides get +2.</p>',
        },
      ],
    },
    {
      slug: 'magic',
      title: 'Magic',
      blurb: 'Casting spells.',
      sections: [
        {
          level: 2,
          anchor: 'components',
          heading: 'Components',
          html: '<p>Verbal, somatic, material.</p>',
        },
      ],
    },
  ],
};

describe('plainText', () => {
  test('drops tags and decodes the entities marked emits', () => {
    expect(plainText('<p>a <strong>b</strong> &amp; c &quot;d&quot;</p>'))
      .toBe('a b & c "d"');
  });

  test('answers with an empty string rather than throwing on nothing', () => {
    expect(plainText(undefined)).toBe('');
    expect(plainText('')).toBe('');
  });
});

describe('buildRulesIndex', () => {
  test('one row per section, carrying what the page renders', () => {
    const rows = buildRulesIndex(IT, EN);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      slug: 'combat',
      anchor: 'core-mechanic',
      level: 2,
      topicTitle: 'Combattimento',
      heading: 'Meccanica di base',
    });
  });

  test('empty data gives no rows rather than throwing', () => {
    expect(buildRulesIndex(undefined, undefined)).toEqual([]);
    expect(buildRulesIndex({ topics: [] }, { topics: [] })).toEqual([]);
  });
});

describe('searchRules', () => {
  const rows = buildRulesIndex(IT, EN);

  test('an empty query matches nothing — the index is the landing view', () => {
    expect(searchRules(rows, '')).toEqual([]);
    expect(searchRules(rows, '   ')).toEqual([]);
  });

  test('matches the reading language', () => {
    const hits = searchRules(rows, 'fianchi');
    expect(hits.map((h) => h.anchor)).toEqual(['flanking']);
  });

  test('matches the English too, and still answers in Italian', () => {
    const hits = searchRules(rows, 'flanking');
    expect(hits).toHaveLength(1);
    expect(hits[0].heading).toBe('Attaccare ai fianchi');
  });

  test('a term inside the prose is found, not only a heading', () => {
    expect(searchRules(rows, 'somatica').map((h) => h.anchor)).toEqual(['components']);
  });

  test('all words must match, not any', () => {
    expect(searchRules(rows, 'componenti verbale')).toHaveLength(1);
    expect(searchRules(rows, 'componenti fianchi')).toHaveLength(0);
  });

  test('a heading match outranks a body match', () => {
    /* "componenti" is the Magic heading and also appears nowhere else; add a
       query that hits both a heading and a body to prove the ordering. */
    const rowsWithBoth = buildRulesIndex({
      topics: [{
        slug: 'x',
        title: 'X',
        blurb: '',
        sections: [
          { level: 2, anchor: 'body', heading: 'Altro', html: '<p>parla di lotta</p>' },
          { level: 2, anchor: 'head', heading: 'Lotta', html: '<p>niente</p>' },
        ],
      }],
    });
    expect(searchRules(rowsWithBoth, 'lotta').map((h) => h.anchor))
      .toEqual(['head', 'body']);
  });

  test('English-only data is not searched twice', () => {
    const rows2 = buildRulesIndex(EN, EN);
    const hit = rows2.find((r) => r.anchor === 'flanking');
    expect(hit.haystack.match(/flanking/g)).toHaveLength(1);
  });

  test('the search is case-insensitive', () => {
    expect(searchRules(rows, 'FIANCHI')).toHaveLength(1);
  });

  test('markup is not searchable — a tag name matches nothing', () => {
    expect(searchRules(rows, 'strong')).toHaveLength(0);
    expect(searchRules(rows, 'code')).toHaveLength(0);
  });
});

describe('topicBySlug', () => {
  test('finds a topic and answers null for one that is not there', () => {
    expect(topicBySlug(IT, 'magic').title).toBe('Magia');
    expect(topicBySlug(IT, 'nope')).toBeNull();
    expect(topicBySlug(undefined, 'magic')).toBeNull();
  });
});
